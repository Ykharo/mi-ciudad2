// Personajes jugables: elegir con quién se juega (al empezar y con el botón de arriba), y que cada uno guarde su look.
import { test, expect, ir, accion, subirAlAuto } from './ayudantes.js';

const jugador = page => page.evaluate(() => {
  const p = window.__juego.player;
  return { id: p.personaje, k: p.ch.k, prendas: Object.fromEntries(Object.entries(p.ch.prendas).map(([s, x]) => [s, x.id])) };
});
const guardado = page => page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')));
const elegir = async (page, id) => {
  await page.locator('#btnChar').click();
  await page.locator(`#charMenu [data-personaje="${id}"]`).click();
  await expect.poll(async () => (await jugador(page)).id).toBe(id);
};

test('elegir al amigo al empezar y cambiar a la amiga jugando; se recuerda al volver', async ({ page, cargar }) => {
  await cargar();
  const inicio = page.locator('#startChars [data-k="personaje"]');
  await expect(inicio).toHaveCount(3);
  await expect(page.locator('#startChars [data-v="nina"]')).toHaveClass(/\bon\b/);
  await page.locator('#startChars [data-v="amigo"]').click();
  await expect(page.locator('#startChars [data-v="amigo"]')).toHaveClass(/\bon\b/);
  const amigo = await jugador(page);
  expect(amigo).toMatchObject({ id: 'amigo', prendas: { cabeza: 'jockey', orejas: 'audifonos_grandes', espalda: 'mochila' } });
  expect(amigo.k).toBeLessThan(1.4 * 0.9);   // más bajito que Nina (1,4)
  // la cabeza redonda
  expect(await page.evaluate(() => { let v; window.__juego.player.ch.model.traverse(o => { if (o.name === 'Head_Base') v = o.morphTargetInfluences[o.morphTargetDictionary.redonda]; }); return v; })).toBe(1);
  await page.locator('#btnPlay').click();
  await expect(page.locator('#start')).toBeHidden();
  await expect(page.locator('#btnChar')).toHaveText('👦');

  // el menú de acciones usa su nombre
  await page.locator('#btnAct').click();
  await expect(page.locator('#actMenu h4')).toHaveText('¿Qué hace Amigo?');
  await page.locator('#btnAct').click();

  await elegir(page, 'amiga');
  expect((await jugador(page)).prendas).toMatchObject({ cabeza: 'gorra', abrigo: 'chaqueta', cuello: 'audifonos' });
  await expect(page.locator('#btnChar')).toHaveText('👱‍♀️');
  expect(await page.evaluate(() => window.__juego.npcs.length + 1)).toBe(8);   // no quedó un personaje de más
  expect((await guardado(page)).jugador).toBe('amiga');

  await page.reload();
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
  await expect(page.locator('#startChars [data-v="amiga"]')).toHaveClass(/\bon\b/);
  expect((await jugador(page)).id).toBe('amiga');
});

test('cada personaje guarda su propio look; "Original" lo deja como es él', async ({ page, jugar }) => {
  await jugar();
  await elegir(page, 'amigo');
  await ir(page, 20, -8.3);
  await accion(page, '👗 Vestidor');
  await page.locator('#wardrobeTabs [data-tab="accesorios"]').click();
  await page.locator('#wardrobeBody [data-k="accesorio"][data-v="jockey"]').click();   // se saca el jockey
  await expect.poll(async () => (await jugador(page)).prendas.cabeza).toBeUndefined();
  await page.locator('#wardrobeDone').click();

  // Nina no cambió; al volver al amigo sigue sin jockey
  await elegir(page, 'nina');
  expect((await jugador(page)).prendas).toEqual({ pelo: 'mono', torso: 'peto', piernas: 'pantalon_cargo', pies: 'zapatillas' });
  await elegir(page, 'amigo');
  expect((await jugador(page)).prendas.cabeza).toBeUndefined();
  const g = await guardado(page);
  expect(g.personajes.amigo.look.prendas.cabeza).toBeUndefined();
  expect(g.personajes.amigo.look.formas).toEqual({ redonda: 1 });
  expect(g.nina.look.prendas).not.toHaveProperty('cabeza');

  // "Original": el amigo como viene (con jockey), no Nina
  await accion(page, '👗 Vestidor');
  await page.locator('#btnLookOriginal').click();
  await expect.poll(async () => (await jugador(page)).prendas.cabeza).toBe('jockey');
  expect((await jugador(page)).prendas.pelo).not.toBe('mono');
});

test('manejando no se cambia de personaje', async ({ page, jugar }) => {
  await jugar();
  await subirAlAuto(page);
  await page.locator('#btnChar').click();
  await expect(page.locator('#charMenu')).toBeHidden();
  await expect(page.locator('#toast')).toHaveText('Bájate del auto para cambiar de personaje');
  expect((await jugador(page)).id).toBe('nina');
});
