// Utilidades compartidas por las pruebas.
import { test as base, expect } from '@playwright/test';

// Página del juego que se prueba. Se puede cambiar con la variable de entorno JUEGO.
export const JUEGO = process.env.JUEGO || '/ciudad-arcoiris-nina.html';

// Cualquier error de la página o `console.error` hace fallar la prueba.
export const test = base.extend({
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
});
export { expect };

// Abre el juego y espera a que la ciudad esté construida.
export async function cargar(page) {
  await page.goto(JUEGO);
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
}

// Abre el juego y toca "¡A jugar!".
export async function jugar(page) {
  await cargar(page);
  await page.locator('#btnPlay').click();
  await expect(page.locator('#start')).toBeHidden();
  await expect(page.locator('#game')).not.toHaveClass(/intro/);
}

// Deja la página repetible para las capturas: Math.random con semilla, sin audio
// (el ruido del audio consume Math.random según la frecuencia de muestreo del equipo)
// y el reloj detenido: el bucle sólo avanza con page.clock.runFor(ms), en pasos de 16 ms.
export async function prepararRepetible(page, semilla = 20260927) {
  await page.addInitScript(s => {
    let a = s >>> 0;
    Math.random = () => {   // mulberry32
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    delete window.AudioContext; delete window.webkitAudioContext;
  }, semilla);
  const t0 = new Date('2026-01-01T10:00:00Z').getTime();
  await page.clock.install({ time: t0 });
  await page.clock.pauseAt(t0 + 1000);
}
