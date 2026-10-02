// Pruebas de humo: el juego arranca y lo básico responde. Sólo usan el DOM y el teclado,
// así que sirven igual para el juego de la etapa 0 y para las versiones reestructuradas.
import { test, expect } from './ayudantes.js';

test('arranca y se puede jugar', async ({ page, cargar }) => {
  await cargar();
  await expect(page.locator('#game')).toHaveClass(/intro/);
  await page.locator('#btnPlay').click();
  await expect(page.locator('#start')).toBeHidden();
  await expect(page.locator('#joy')).toBeVisible();
  await expect(page.locator('#btnAct')).toBeVisible();
  await expect(page.locator('#placeName')).toHaveText('Paseo Algodón');
});

test('camina con el teclado', async ({ page, jugar }) => {
  await jugar();
  const lugar = page.locator('#placeName');
  await expect(lugar).toHaveText('Paseo Algodón');
  await page.keyboard.down('w');
  // Nina parte en la vereda del Paseo Algodón; hacia adelante queda la Boutique
  await expect(lugar).not.toHaveText('Paseo Algodón');
  await page.keyboard.up('w');
});

test('camina con el joystick', async ({ page, jugar }) => {
  await jugar();
  const joy = page.locator('#joy'), lugar = page.locator('#placeName');
  await expect(lugar).toHaveText('Paseo Algodón');
  const r = await joy.boundingBox();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const toque = (x, y) => ({ pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true });
  // dedo en el centro y luego hacia arriba (= adelante)
  await joy.dispatchEvent('pointerdown', toque(cx, cy));
  await joy.dispatchEvent('pointermove', toque(cx, cy - 80));
  await expect(page.locator('#joyHint')).toBeHidden();
  // la perilla sube hasta su tope (75 % del radio) y vuelve al centro al soltar
  const altoPerilla = async () => { const k = await page.locator('#joyKnob').boundingBox(); return Math.round(k.y + k.height / 2 - cy); };
  await expect.poll(altoPerilla).toBeLessThan(-0.6 * r.height / 2);
  await expect(lugar).not.toHaveText('Paseo Algodón');
  await joy.dispatchEvent('pointerup', toque(cx, cy - 80));
  await expect.poll(altoPerilla).toBe(0);
});

test('menú Acción', async ({ page, jugar }) => {
  await jugar();
  const btn = page.locator('#btnAct'), menu = page.locator('#actMenu');
  await btn.click();
  await expect(menu).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.locator('[data-act]')).toHaveCount(18);   // 9 acciones y 9 bailes
  await menu.locator('[data-act="dance"]').click();
  await expect(menu).toBeHidden();
  // al reabrir, "Bailar" aparece marcado
  await btn.click();
  await expect(menu.locator('[data-act="dance"]')).toHaveClass(/\bon\b/);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
});

test('adoptar una mascota y que siga ahí al recargar', async ({ page, jugar }) => {
  await jugar();
  // se adopta en el Refugio (el botón 🐾 Mascotas abre el archivador)
  await page.evaluate(() => window.__juego.teleport(15, 10.1));
  await expect(page.locator('#btnAction')).toHaveText('🐾 Adoptar mascota');
  await page.locator('#btnAction').click({ force: true });
  const panel = page.locator('#petPanel');
  await expect(panel).toBeVisible();
  await expect(page.locator('#game')).toHaveClass(/menu/);
  // la partida nueva trae a Toby
  await expect(panel.locator('.mypet b')).toHaveText(['Toby']);
  await panel.locator('[data-k="pk"][data-v="gato"]').click();
  await page.locator('#petName').fill('Luna');
  await page.locator('#btnAdopt').click();
  await expect(page.locator('#toast')).toHaveText('¡Luna ahora es tu mascota!');
  await expect(panel.locator('.mypet b')).toHaveText(['Toby', 'Luna']);
  await page.locator('#petDone').click();
  await expect(panel).toBeHidden();

  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')));
  expect(guardado.version).toBe(2);
  expect(guardado.pets.map(p => [p.kind, p.name])).toEqual([['perro', 'Toby'], ['gato', 'Luna']]);

  await page.reload();
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
  await page.locator('#btnPlay').click();
  await page.locator('#btnPets').click();
  await expect(page.locator('#archTabs .carpeta b')).toHaveText(['Toby', 'Luna']);
});

test('ropa de la mascota (collar, sombrero, capa) y la pelota que va a buscar', async ({ page, jugar }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('ciudadArcoiris.v2')) localStorage.setItem('ciudadArcoiris.v2', JSON.stringify({ version: 2, cars: [],
    pets: [{ kind: 'perro', color: '#E9B77A', name: 'Toby', cosas: ['collar', 'corona', 'sombrero_mago', 'capa', 'pelota'],
      extras: { ropa: { cuello: 'collar', cabeza: 'corona', lomo: 'collar' } } }] })); });   // (un collar en el lomo no vale)
  await jugar();
  expect(await page.evaluate(() => window.__juego.player.pets[0].extras.ropa)).toEqual({ cuello: 'collar', cabeza: 'corona' });
  // en el archivador: Ropa con Ponérselo/Quitárselo; el sombrero de mago reemplaza a la corona; la capa va en el lomo
  await page.locator('#btnPets').click();
  await page.locator('#archSecs [data-sec="cosas"]').click();
  await expect(page.locator('#archBody [data-poner="corona"]')).toHaveText('Quitárselo');
  await page.locator('#archBody [data-poner="sombrero_mago"]').click();
  await page.locator('#archBody [data-poner="capa"]').click();
  expect(await page.evaluate(() => window.__juego.player.pets[0].obj.extras.ropa)).toEqual({ cuello: 'collar', cabeza: 'sombrero_mago', lomo: 'capa' });
  // la pelota: "¡A jugar!" cierra el archivador y la lanza; Toby la va a buscar y la trae
  await page.locator('#archBody [data-jugar="pelota"]').click();
  await expect(page.locator('#archPanel')).toBeHidden();
  expect(await page.evaluate(() => window.__juego.player.pets[0].busca)).toBe(true);
  await expect(page.locator('#toast')).toHaveText('🎾 ¡Toby te trajo la pelota!', { timeout: 20_000 });
  await expect(page.locator('#btnPelota')).toBeVisible({ timeout: 10_000 });
  const g = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')).pets[0].extras.ropa);
  expect(g).toEqual({ cuello: 'collar', cabeza: 'sombrero_mago', lomo: 'capa' });
});

test('pociones (estrellas, burbujas, mini y gigante) y ropa nueva (bufanda, lentes, moño)', async ({ page, jugar }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('ciudadArcoiris.v2')) localStorage.setItem('ciudadArcoiris.v2', JSON.stringify({ version: 2, cars: [],
    pets: [{ kind: 'gato', color: '#FFFFFF', name: 'Nube', cosas: ['brillo', 'mini', 'gigante', 'bufanda', 'lentes', 'mono'],
      extras: { brillo: true, burbujas: true, tamano: 'mini', ropa: { cuello: 'bufanda', cara: 'lentes', cola: 'mono' } } }] })); });   // (burbujas no es suya)
  await jugar();
  const leer = () => page.evaluate(() => { const p = window.__juego.player.pets[0]; return [p.extras.brillo, p.extras.burbujas, p.extras.tamano, Math.round(p.obj.root.scale.x * 100), p.extras.ropa]; });
  expect(await leer()).toEqual([true, false, 'mini', 36, { cuello: 'bufanda', cara: 'lentes', cola: 'mono' }]);   // 0,6 × 0,6
  // la gigante reemplaza a la mini
  await page.locator('#btnPets').click();
  await page.locator('#archSecs [data-sec="cosas"]').click();
  await page.locator('#archBody [data-poner="gigante"]').click();
  expect((await leer()).slice(2, 4)).toEqual(['gigante', 96]);   // 0,6 × 1,6
  await expect(page.locator('#archBody [data-poner="mini"]')).toHaveText('Ponérselo');
  await page.locator('#archBody [data-poner="gigante"]').click();
  expect((await leer()).slice(2, 4)).toEqual([null, 60]);
});

test('caramelo de aura, voz de vaca, mochila cohete, mariposa y el frisbee que trae', async ({ page, jugar }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('ciudadArcoiris.v2')) localStorage.setItem('ciudadArcoiris.v2', JSON.stringify({ version: 2, cars: [],
    pets: [{ kind: 'perro', color: '#E9B77A', name: 'Toby', cosas: ['aura', 'voz_vaca', 'voz_pato', 'cohete', 'mariposa', 'frisbee', 'pelota'],
      extras: { aura: true, voz: 'vaca', ropa: { espalda: 'cohete' }, companero: 'mariposa' } }] })); });
  await jugar();
  const leer = () => page.evaluate(() => { const e = window.__juego.player.pets[0].obj.extras; return [e.aura, e.voz, e.ropa.espalda, e.companero]; });
  expect(await leer()).toEqual([true, 'vaca', 'cohete', 'mariposa']);
  // la voz de pato reemplaza a la de vaca
  await page.locator('#btnPets').click();
  await page.locator('#archSecs [data-sec="cosas"]').click();
  await page.locator('#archBody [data-poner="voz_pato"]').click();
  expect((await leer())[1]).toBe('pato');
  // el frisbee: desde la ficha, lo lanza y Toby lo trae
  await page.locator('#archBody [data-jugar="frisbee"]').click();
  await expect(page.locator('#toast')).toContainText('frisbee', { timeout: 20_000 });
  // con dos juguetes para lanzar aparece el botón para cambiar
  await expect(page.locator('#btnPelotaOtro')).toBeVisible({ timeout: 10_000 });
});

test('Mis mascotas: el archivador con ficha, estado, salud y cosas', async ({ page, jugar }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('ciudadArcoiris.v2')) localStorage.setItem('ciudadArcoiris.v2', JSON.stringify({ version: 2, cars: [],
    mascotienda: { comprados: ['patines'] }, pets: [{ kind: 'perro', color: '#E9B77A', name: 'Toby', adopcion: '2026-09-01T12:00:00Z', estado: { energia: 20, diversion: 90 } }] })); });
  await jugar();
  await page.locator('#btnPets').click();
  await expect(page.locator('#archPanel')).toBeVisible();
  await expect(page.locator('#archTabs .carpeta b')).toHaveText(['Toby']);
  // ficha: cambiarle el nombre y sacarle una foto
  await page.locator('#archNombre').fill('Tobías');
  await page.locator('#archBody [data-renombrar]').click();
  await expect(page.locator('#archTabs .carpeta b')).toHaveText(['Tobías']);
  await page.locator('#archBody [data-foto]').click();
  await expect(page.locator('#archBody .foto img')).toHaveCount(1);
  // estado: con poca energía, tiene sueño
  await page.locator('#archSecs [data-sec="estado"]').click();
  await expect(page.locator('#archBody .animo')).toContainText('Tiene sueño');
  // salud: el control de adopción hecho y los próximos
  await page.locator('#archSecs [data-sec="salud"]').click();
  await expect(page.locator('#archBody .control')).toHaveCount(3);
  // cosas: ponerle los patines
  await page.locator('#archSecs [data-sec="cosas"]').click();
  await page.locator('#archBody [data-poner="patines"]').click();
  expect(await page.evaluate(() => window.__juego.player.pets[0].extras.transporte)).toBe('patines');
  await page.locator('#archDone').click();
  const g = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')).pets[0]);
  expect([g.name, g.fotos.length, g.extras.transporte, g.adopcion]).toEqual(['Tobías', 1, 'patines', '2026-09-01T12:00:00Z']);
});
