// Lugares y autos. Usan los ganchos de prueba (window.__juego, con ?test) para llevar a Nina
// directo a cada lugar en vez de caminar hasta allá.
import { test, expect, ir, modo, accion } from './ayudantes.js';

const guardado = page => page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')));

test('sentarse en una banca del parque', async ({ page, jugar }) => {
  await jugar();
  await ir(page, -15.5, -15.5);   // la banca está en (-14.8, -14.8) y su zona 1 m hacia el centro
  await accion(page, '🪑 Sentarse');
  const sentada = () => page.evaluate(() => !!window.__juego.player.seat);
  await expect.poll(sentada).toBe(true);
  await expect(page.locator('#btnAction')).toBeHidden();
  await page.keyboard.down('w');
  await expect.poll(sentada).toBe(false);
  await page.keyboard.up('w');
});

test('pedir un helado', async ({ page, jugar }) => {
  await jugar();
  await ir(page, -24.8, 9.5);
  await accion(page, '🍦 Pedir un helado');
  await expect(page.locator('#toast')).toHaveText(/^¡Mmm! Un helado de /);
  expect(await page.evaluate(() => window.__juego.player.ch.holding)).toMatch(/^#[0-9A-F]{6}$/i);
});

test('entrar al refugio desde la puerta', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 15, 10.1);
  await accion(page, '🐾 Adoptar mascota');
  await expect(page.locator('#petPanel')).toBeVisible();
  expect(await modo(page)).toBe('pets');
  await page.locator('#petDone').click();
  await expect.poll(() => modo(page)).toBe('play');
});

test('comprar un auto, manejarlo y bajarse', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 61, -8.5);
  await accion(page, '🚗 Diseñar mi auto');
  await expect(page.locator('#shopPanel')).toBeVisible();
  expect(await modo(page)).toBe('shop');
  for (const t of ['pintura', 'diseno', 'ruedas', 'adornos', 'bocina', 'garaje', 'modelo']) {
    await page.locator(`#shopTabs [data-tab="${t}"]`).click();
    await expect(page.locator(`#shopTabs [data-tab="${t}"]`)).toHaveClass(/\bon\b/);
  }
  await page.locator('#shopBody [data-k="type"][data-v="jeep"]').click();
  await expect(page.locator('#shopBody [data-v="jeep"]')).toHaveClass(/\bon\b/);
  await page.locator('#btnBuy').click();
  await expect(page.locator('#shopPanel')).toBeHidden();
  await expect(page.locator('#game')).toHaveClass(/driving/);
  expect(await modo(page)).toBe('drive');

  const pos = () => page.evaluate(() => { const p = window.__juego.player.pos; return [p.x, p.z]; });
  const [x0, z0] = await pos();
  await page.keyboard.down('w');
  await expect.poll(async () => { const [x, z] = await pos(); return Math.hypot(x - x0, z - z0); }).toBeGreaterThan(2);
  await page.keyboard.up('w');
  await page.keyboard.press('e');
  await expect.poll(() => modo(page)).toBe('play');
  await expect(page.locator('#game')).not.toHaveClass(/driving/);
  const g = await guardado(page);
  expect(g.cars.map(c => c.spec.type)).toEqual(['jeep']);
});

test('garaje: cambiar y devolver un auto', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 61, -8.5);
  await accion(page, '🚗 Diseñar mi auto');
  await page.locator('#btnBuy').click();                       // compra el de fábrica y queda manejando
  await expect.poll(() => modo(page)).toBe('drive');
  await page.keyboard.press('e');
  await ir(page, 61, -8.5);
  await accion(page, '🚗 Diseñar mi auto');
  await page.locator('#shopTabs [data-tab="garaje"]').click();
  await page.locator('#shopBody [data-g="edit"]').click();
  await page.locator('#shopBody [data-k="type"][data-v="karting"]').click();
  await page.locator('#btnBuy', { hasText: 'Guardar cambios' }).click();
  await expect(page.locator('#toast')).toHaveText('¡Tu auto quedó como nuevo!');
  expect((await guardado(page)).cars.map(c => c.spec.type)).toEqual(['karting']);
  await page.locator('#shopTabs [data-tab="garaje"]').click();
  await page.locator('#shopBody [data-g="rm"]').click();
  await expect(page.locator('#toast')).toHaveText('Tu auto volvió a la tienda');
  expect((await guardado(page)).cars).toEqual([]);
});

test('"Mi auto" trae el auto guardado', async ({ page, jugar }) => {
  // partida guardada con un auto estacionado en Avenida Menta (sólo la primera vez: sobrevive a recargas)
  await page.addInitScript(() => {
    if (localStorage.getItem('ciudadArcoiris.v2')) return;
    localStorage.setItem('ciudadArcoiris.v2', JSON.stringify({
      version: 2, nina: { look: null },
      pets: [{ kind: 'gato', color: '#FFFFFF', name: 'Nube' }],
      cars: [{ spec: { type: 'buggy', color: '#4FB6F5' }, x: 61, z: -1.9, h: -Math.PI / 2 }], shop: null,
    }));
  });
  await jugar();
  const auto = () => page.evaluate(() => { const c = window.__juego.cars.find(c => c.owned); return c && [c.x, c.z]; });
  expect(await auto()).toEqual([61, -1.9]);
  await page.locator('#btnMyCar').click();
  await expect(page.locator('#toast')).toHaveText('¡Aquí está tu auto!');
  const [x, z] = await auto();
  expect(Math.hypot(x - 9, z + 1.5)).toBeLessThan(8);   // Nina parte en (9, -1.5)
});

test('"Mi auto" sin auto avisa', async ({ page, jugar }) => {
  await jugar();
  await page.locator('#btnMyCar').click();
  await expect(page.locator('#toast')).toHaveText(/^Todavía no tienes auto/);
});

test('subirse a un auto de la calle con E', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 4.4, 22);   // al lado del clásico rosado estacionado en (2.1, 22)
  await expect(page.locator('#btnAction')).toHaveText('🚗 Subirse al auto');
  await page.keyboard.press('e');
  await expect.poll(() => modo(page)).toBe('drive');
  await page.keyboard.press('e');
  await expect.poll(() => modo(page)).toBe('play');
});
