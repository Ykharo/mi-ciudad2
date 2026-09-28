// Utilidades compartidas por las pruebas.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Página del juego dentro del servidor del proyecto (ver playwright.config.js).
  juego: ['/', { option: true }],

  // Cualquier error de la página o `console.error` hace fallar la prueba.
  // Una prueba puede quitar de la lista los errores que espera (por ejemplo, sin red).
  errores: [async ({ page }, use) => {
    const errores = [];
    page.on('pageerror', e => errores.push(`pageerror: ${e.message}`));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      if (/favicon\.ico/.test(m.location().url)) return;   // el servidor de prueba no tiene favicon
      errores.push(`console.error: ${m.text()}`);
    });
    await use(errores);
    expect(errores, 'errores en la consola').toEqual([]);
  }, { auto: true }],

  // WebKit no libera los contextos WebGL de las páginas cerradas: en la carga de página número 16 dentro del mismo
  // navegador pierde el contexto ("WebGL: context lost"). Por eso en WebKit cada prueba usa un navegador nuevo,
  // con las mismas opciones del proyecto (dispositivo, baseURL…).
  context: async ({ context, browserName, playwright }, use, testInfo) => {
    if (browserName !== 'webkit') return use(context);
    const { baseURL, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, launchOptions } = testInfo.project.use;
    const navegador = await playwright.webkit.launch(launchOptions);
    const propio = await navegador.newContext({ baseURL, viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });
    await use(propio);
    await navegador.close();
  },

  // Abre el juego y espera a que la ciudad esté construida.
  cargar: async ({ page, juego }, use) => {
    await use(async () => {
      await page.goto(juego);
      await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
    });
  },

  // Abre el juego y toca "¡A jugar!".
  jugar: async ({ page, cargar }, use) => {
    await use(async () => {
      await cargar();
      await page.locator('#btnPlay').click();
      await expect(page.locator('#start')).toBeHidden();
      await expect(page.locator('#game')).not.toHaveClass(/intro/);
    });
  },
});
export { expect };

// Con los ganchos de prueba (?test): llevar a Nina a un punto y leer el modo de juego.
export const ir = (page, x, z) => page.evaluate(([x, z]) => window.__juego.teleport(x, z), [x, z]);
export const modo = page => page.evaluate(() => window.__juego.state.mode);
// El joystick con el mouse de verdad (pasa por todo lo que hay encima, como un dedo; dispatchEvent no).
// Posiciones en fracciones del radio del círculo, y ángulo en grados desde "arriba" (positivo = a la derecha).
export async function joystick(page) {
  const joy = page.locator('#joy'), knob = page.locator('#joyKnob'), r = await joy.boundingBox();
  const radio = await joy.evaluate(e => e.clientWidth / 2), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const punto = (frac, grados = 0) => [cx + Math.sin(grados * Math.PI / 180) * frac * radio, cy - Math.cos(grados * Math.PI / 180) * frac * radio];
  const bola = async () => { const k = await knob.boundingBox(); return [k.x + k.width / 2, k.y + k.height / 2]; };
  const j = {
    cx, cy, radio, punto, bola, knob,
    async apretar(x, y) { await page.mouse.move(x, y); await page.mouse.down(); },
    async mover(x, y) { await page.mouse.move(x, y, { steps: 4 }); },
    soltar: () => page.mouse.up(),
    async empujar(frac, grados = 0) { await j.apretar(cx, cy); await j.mover(...punto(frac, grados)); },   // sin soltar
    async fijar(frac, grados = 0) { await j.empujar(frac, grados); await j.soltar(); },
    async dobleClic() { await page.mouse.dblclick(...await bola()); },
    // mantener apretado un control de giro (-1 izquierda, 1 derecha) durante ms
    async girar(lado, ms) { await j.apretar(cx + lado * 0.89 * radio, cy); await page.waitForTimeout(ms); await j.soltar(); },
  };
  return j;
}
// Se sube al clásico rosado estacionado en (2.1, 22), mirando hacia +z (adelante hay 50 m de calle).
// Devuelve una función que lee su velocidad (v) y rumbo (h).
export async function subirAlAuto(page) {
  await ir(page, 4.4, 22);
  await expect(page.locator('#btnAction')).toHaveText('🚗 Subirse al auto');
  await page.keyboard.press('e');
  await expect.poll(() => modo(page)).toBe('drive');
  return () => page.evaluate(() => {
    const c = window.__juego.cars.find(c => c.shell.children.includes(window.__juego.player.ch.root));
    return { v: c.speed, h: c.heading };
  });
}

// Espera a que aparezca el botón de acción con ese texto y lo toca. El botón salta suavemente (animación),
// así que nunca queda "quieto": se toca sin esperar eso.
export async function accion(page, texto) {
  await expect(page.locator('#btnAction')).toHaveText(texto);
  await page.locator('#btnAction').click({ force: true });
}

// Deja la página repetible para las capturas: Math.random con semilla, sin audio
// (el ruido del audio consume Math.random según la frecuencia de muestreo del equipo)
// y el reloj detenido: el bucle sólo avanza con page.clock.runFor(ms), en pasos de 16 ms.
//
// Con UUID_APARTE=1 (sólo sirve en el proyecto dev, que no minifica): los identificadores internos de Three.js
// (generateUUID, que usa Math.random) salen de otra secuencia. Así un cambio que crea más o menos materiales o
// geometrías no mueve a los vecinos, y se puede comparar si el dibujo cambió. Las capturas de referencia se
// toman SIN esta opción.
export async function prepararRepetible(page, semilla = 20260927) {
  await page.addInitScript(([s, uuidAparte]) => {
    const mulberry32 = a => () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const juego = mulberry32(s >>> 0), uuids = mulberry32(12345);
    Math.random = uuidAparte ? () => (new Error().stack.includes('generateUUID') ? uuids : juego)() : juego;
    delete window.AudioContext; delete window.webkitAudioContext;
  }, [semilla, !!process.env.UUID_APARTE]);
  const t0 = new Date('2026-01-01T10:00:00Z').getTime();
  await page.clock.install({ time: t0 });
  await page.clock.pauseAt(t0 + 1000);
}
