// El joystick y el manejo del auto. El joystick se usa con el mouse de verdad (ayudantes.js: joystick), para que
// los clics pasen por todo lo que hay encima de la perilla, igual que un dedo.
import { test, expect, joystick, subirAlAuto } from './ayudantes.js';

const rapidezNina = page => page.evaluate(() => { const v = window.__juego.player.vel; return Math.hypot(v.x, v.z); });

test('joystick: adentro del punteado camina (y el auto va lento), en el anillo corre', async ({ page, jugar }) => {
  await jugar();
  await expect(page.locator('#joySpeed')).toBeHidden();   // el velocímetro es sólo para manejar
  let j = await joystick(page);
  // la perilla todavía adentro del punteado (su centro al 35 % del radio): camina, sin pasar de ~1,3 m/s
  await j.empujar(0.35);
  await expect.poll(() => rapidezNina(page)).toBeGreaterThan(0.6);
  await page.waitForTimeout(500);
  expect(await rapidezNina(page)).toBeLessThan(1.35);
  await j.soltar();
  // en el anillo de afuera: corre
  await j.empujar(0.72);
  await expect.poll(() => rapidezNina(page)).toBeGreaterThan(3);
  await j.soltar();

  // el auto: lento adentro del punteado (18–35 %), y en el anillo sube de a poco hasta el máximo en el tope
  const auto = await subirAlAuto(page);
  j = await joystick(page);
  await j.empujar(0.35);
  await expect.poll(async () => (await auto()).v).toBeGreaterThan(1);
  await page.waitForTimeout(1500);
  const lenta = (await auto()).v;
  expect(lenta).toBeLessThan(6);   // el clásico llega a 15 m/s
  await j.mover(...j.punto(0.72));
  await expect.poll(async () => (await auto()).v).toBeGreaterThan(lenta + 3);
  await j.soltar();
});

test('manejo: la palanca casi derecha no desvía y a toda velocidad gira suave', async ({ page, jugar }) => {
  await jugar();
  const auto = await subirAlAuto(page), j = await joystick(page);
  // palanca hacia arriba, ladeada 10° a la derecha, en el anillo rápido: acelera sin desviarse
  const h0 = (await auto()).h;
  await j.empujar(0.74, 10);
  await expect.poll(async () => (await auto()).v, { timeout: 10_000 }).toBeGreaterThan(10);
  expect(Math.abs((await auto()).h - h0)).toBeLessThan(0.05);   // antes: ~0,4 rad por segundo
  // el velocímetro del joystick muestra la velocidad en km/h
  await expect(page.locator('#joySpeed')).toBeVisible();
  const kmh = +(await page.locator('#joySpeed b').textContent()), v = (await auto()).v;
  expect(Math.abs(kmh - v * 3.6)).toBeLessThan(6);
  await j.soltar();
  // a más de 9 m/s, volante a fondo con el teclado: gira bastante menos que despacio (2,2 rad/s el clásico)
  await page.keyboard.down('w'); await page.keyboard.down('d');
  await page.waitForTimeout(400);   // el volante llega a fondo
  const t1 = Date.now(), p1 = await auto();
  await page.waitForTimeout(400);
  const p2 = await auto(), giro = Math.abs(p2.h - p1.h) / ((Date.now() - t1) / 1000);
  await page.keyboard.up('d'); await page.keyboard.up('w');
  expect(p1.v).toBeGreaterThan(9);
  expect(giro).toBeLessThan(1.6);
  expect(giro).toBeGreaterThan(0.3);   // pero sí gira
});

test('palanca fija al manejar: se queda, se puede volver a mover, y se suelta con doble clic o el freno', async ({ page, jugar }) => {
  await jugar();
  const auto = await subirAlAuto(page), j = await joystick(page), knob = j.knob;
  const altura = async () => Math.round((await j.bola())[1] - j.cy);

  // 1. soltar en la zona lenta: queda fija (candado) y el auto sigue andando derecho
  await j.fijar(0.35);
  await expect(knob).toHaveClass(/\bfija\b/);
  const h0 = (await auto()).h;
  await expect.poll(async () => (await auto()).v).toBeGreaterThan(1.5);
  await page.waitForTimeout(800);
  const a1 = await auto();
  expect(a1.v).toBeGreaterThan(1.5);
  expect(Math.abs(a1.h - h0)).toBeLessThan(0.05);
  // 2. agarrar la bola fija y bajarla: se mueve y vuelve a quedar fija más abajo (más lento)
  await j.apretar(...await j.bola());
  await j.mover(...j.punto(0.2));
  await j.soltar();
  await expect(knob).toHaveClass(/\bfija\b/);
  expect(await altura()).toBe(Math.round(-0.2 * j.radio));
  // 3. soltar en diagonal (girando): vuelve al centro en horizontal pero queda a la misma altura;
  // las ruedas quedan rectas y el auto sigue derecho, como al soltar A/D en el teclado
  await j.apretar(...await j.bola());
  await j.mover(...j.punto(0.42, 45));
  await page.waitForTimeout(700);   // gira un rato
  await j.soltar();
  await expect(knob).toHaveClass(/\bfija\b/);
  await expect.poll(async () => Math.round((await j.bola())[0] - j.cx)).toBe(0);
  expect(await altura()).toBe(Math.round(-0.42 * Math.cos(Math.PI / 4) * j.radio));
  await page.waitForTimeout(1600);   // el volante vuelve al centro (despacio, ~1 s)
  const g1 = await auto(); await page.waitForTimeout(500); const g2 = await auto();
  expect(g2.v).toBeGreaterThan(1);
  expect(Math.abs(g2.h - g1.h)).toBeLessThan(0.03);
  // 4. doble clic en la bola: se suelta, vuelve al centro y el auto se va deteniendo solo
  await j.dobleClic();
  await expect(knob).not.toHaveClass(/\bfija\b/);
  await expect.poll(altura).toBe(0);   // vuelve al centro con una animación corta
  await expect.poll(async () => (await auto()).v, { timeout: 10_000 }).toBeLessThan(0.3);
  // 5. el freno también la suelta
  await j.fijar(0.35);
  await expect(knob).toHaveClass(/\bfija\b/);
  await expect.poll(async () => (await auto()).v).toBeGreaterThan(1);
  await page.locator('#btnBrake').dispatchEvent('pointerdown');
  await expect(knob).not.toHaveClass(/\bfija\b/);
  await page.locator('#btnBrake').dispatchEvent('pointerup');
  // 6. llevarla al centro y soltar: no queda fija
  await j.fijar(0.02);
  await expect(knob).not.toHaveClass(/\bfija\b/);
  // 7. fija y bajarse: se suelta y Nina no sale caminando
  await j.fijar(0.35);
  await expect(knob).toHaveClass(/\bfija\b/);
  await page.keyboard.press('e');
  await expect(knob).not.toHaveClass(/\bfija\b/);
  await page.waitForTimeout(500);
  expect(await rapidezNina(page)).toBeLessThan(0.1);
});

test('controles de giro: giran sin cambiar la velocidad ni mover la perilla', async ({ page, jugar }) => {
  await jugar();
  await expect(page.locator('#joy .giros')).toBeHidden();   // a pie no están
  const auto = await subirAlAuto(page), j = await joystick(page);
  await expect(page.locator('#joy .giros')).toBeVisible();
  await j.fijar(0.35);
  await expect(j.knob).toHaveClass(/\bfija\b/);
  await expect.poll(async () => (await auto()).v).toBeGreaterThan(2);
  await page.waitForTimeout(800);
  const perilla = await j.bola();
  const girar = async (lado, esperado) => {
    const a = await auto();
    await j.apretar(j.cx + lado * 0.89 * j.radio, j.cy);
    await expect(page.locator(`#joy .giro[data-giro="${lado}"]`)).toHaveClass(/\bon\b/);
    await page.waitForTimeout(700);
    const b = await auto();
    await j.soltar();
    await expect(page.locator(`#joy .giro[data-giro="${lado}"]`)).not.toHaveClass(/\bon\b/);
    expect(esperado * (b.h - a.h), `lado ${lado}`).toBeGreaterThan(0.1);   // giró hacia ese lado
    expect(esperado * (b.h - a.h), `lado ${lado}`).toBeLessThan(0.8);      // pero suave (la mitad del volante)
    expect(Math.abs(b.v - a.v)).toBeLessThan(0.3 * a.v);                  // sin cambiar la velocidad
    expect(await j.bola()).toEqual(perilla);                              // la perilla no se movió
    await expect(j.knob).toHaveClass(/\bfija\b/);
  };
  await girar(1, -1);    // derecha (como D)
  await page.waitForTimeout(1500);
  await girar(-1, 1);    // izquierda (como A)
  // al soltar, las ruedas vuelven al centro y el auto sigue derecho
  await page.waitForTimeout(1600);
  const s1 = await auto(); await page.waitForTimeout(500); const s2 = await auto();
  expect(Math.abs(s2.h - s1.h)).toBeLessThan(0.03);
});

test('retroceder en diagonal hacia los dos lados (teclado y joystick)', async ({ page, jugar }) => {
  await jugar();
  const auto = await subirAlAuto(page);
  const retroceder = async (teclas, giro) => {
    const h0 = (await auto()).h;
    for (const t of teclas) await page.keyboard.down(t);
    await expect.poll(async () => (await auto()).v, { message: `${teclas} tiene que ir hacia atrás` }).toBeLessThan(-1);
    // retrocediendo, abajo-izquierda hace girar el auto hacia un lado y abajo-derecha hacia el otro
    await expect.poll(async () => giro * ((await auto()).h - h0)).toBeGreaterThan(0.05);
    for (const t of teclas) await page.keyboard.up(t);
    await expect.poll(async () => Math.abs((await auto()).v)).toBeLessThan(0.3);   // se detiene solo
  };
  await retroceder(['s', 'a'], -1);
  await retroceder(['s', 'd'], 1);
  // joystick en diagonal exacta (45°) abajo-derecha: antes avanzaba en vez de retroceder
  const j = await joystick(page);
  await j.empujar(0.75, 135);
  await expect.poll(async () => (await auto()).v).toBeLessThan(-1);
  await j.soltar();
});
