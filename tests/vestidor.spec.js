// El Vestidor de la Boutique Arcoíris: cambia a Nina al instante y lo guarda.
import { test, expect, ir, modo, accion } from './ayudantes.js';

// color que tiene ahora un material de Nina, en minúsculas ('#rrggbb')
const color = (page, mat) => page.evaluate(m => '#' + window.__juego.player.ch.mats[m].color.getHexString(), mat);
const visible = (page, mat) => page.evaluate(m => window.__juego.player.ch.mats[m].visible, mat);
const look = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__juego.player.look)));
const muestra = (page, datos) => page.locator(`#wardrobeBody [${datos}]`);

async function abrirVestidor(page) {
  await ir(page, 20, -8.3);   // la alfombra de la entrada de la Boutique
  await accion(page, '👗 Vestidor');
  await expect(page.locator('#wardrobePanel')).toBeVisible();
  expect(await modo(page)).toBe('wardrobe');
}

test('cambiar colores, la mariposa y la piel, y que quede guardado', async ({ page, jugar }) => {
  await jugar();
  await abrirVestidor(page);
  // "Arriba" es la pestaña de entrada
  await muestra(page, 'data-k="color"][data-v="#FF4F5E"').click();
  expect(await color(page, 'Cotton_Charcoal')).toBe('#ff4f5e');
  await muestra(page, 'data-k="extra:Top_Emblem"][data-v="no"').click();
  expect(await visible(page, 'Top_Emblem')).toBe(false);
  await page.locator('#wardrobeTabs [data-tab="zapatos"]').click();
  await muestra(page, 'data-canal="panel"][data-v="#4FB6F5"').click();
  expect(await color(page, 'Sneaker_Panel')).toBe('#4fb6f5');
  await page.locator('#wardrobeTabs [data-tab="piel"]').click();
  await muestra(page, 'data-k="piel"][data-v="#9B6643"').click();
  expect(await color(page, 'Skin_Warm')).toBe('#9b6643');
  await expect(muestra(page, 'data-k="piel"][data-v="#9B6643"')).toHaveClass(/\bon\b/);
  await page.locator('#wardrobeDone').click();
  await expect(page.locator('#wardrobePanel')).toBeHidden();
  await expect.poll(() => modo(page)).toBe('play');

  const esperado = { piel: '#9B6643', prendas: {
    torso: { id: 'peto', colores: { principal: '#FF4F5E' }, extras: { Top_Emblem: false } },
    pies: { id: 'zapatillas', colores: { panel: '#4FB6F5' } },
  } };
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')));
  expect(guardado.nina.look).toMatchObject(esperado);

  // al volver a entrar, Nina sigue igual
  await page.reload();
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
  await page.locator('#btnPlay').click();
  expect(await look(page)).toMatchObject(esperado);
  expect(await color(page, 'Cotton_Charcoal')).toBe('#ff4f5e');
  expect(await color(page, 'Skin_Warm')).toBe('#9b6643');
  expect(await visible(page, 'Top_Emblem')).toBe(false);
});

test('Sorpréndeme y Original', async ({ page, jugar }) => {
  await jugar();
  const deFabrica = await color(page, 'Cotton_Charcoal');
  await abrirVestidor(page);
  await page.locator('#btnLookRandom').click();
  await expect.poll(async () => Object.keys((await look(page)).prendas.torso.colores || {})).toEqual(['principal']);
  const l = await look(page);
  for (const slot of ['pelo', 'torso', 'piernas', 'pies']) expect(l.prendas[slot].colores.principal).toMatch(/^#[0-9A-F]{6}$/i);
  expect(await color(page, 'Cotton_Charcoal')).toBe(l.prendas.torso.colores.principal.toLowerCase());
  await page.locator('#btnLookOriginal').click();
  await expect.poll(async () => (await look(page)).prendas.torso.colores).toBeUndefined();
  expect(await color(page, 'Cotton_Charcoal')).toBe(deFabrica);
  expect(await visible(page, 'Top_Emblem')).toBe(true);
});
