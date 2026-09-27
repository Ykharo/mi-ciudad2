// Pruebas de humo: el juego arranca y lo básico responde. Sólo usan el DOM y el teclado,
// así que sirven igual para el juego armado de hoy y para las versiones reestructuradas.
import { test, expect, cargar, jugar } from './ayudantes.js';

test('arranca y se puede jugar', async ({ page }) => {
  await cargar(page);
  await expect(page.locator('#game')).toHaveClass(/intro/);
  await page.locator('#btnPlay').click();
  await expect(page.locator('#start')).toBeHidden();
  await expect(page.locator('#joy')).toBeVisible();
  await expect(page.locator('#btnAct')).toBeVisible();
  await expect(page.locator('#placeName')).toHaveText('Paseo Algodón');
});

test('camina con el teclado', async ({ page }) => {
  await jugar(page);
  const lugar = page.locator('#placeName');
  await expect(lugar).toHaveText('Paseo Algodón');
  await page.keyboard.down('w');
  // Nina parte en la vereda del Paseo Algodón; hacia adelante queda la Boutique
  await expect(lugar).not.toHaveText('Paseo Algodón');
  await page.keyboard.up('w');
});

test('camina con el joystick', async ({ page }) => {
  await jugar(page);
  const joy = page.locator('#joy'), lugar = page.locator('#placeName');
  await expect(lugar).toHaveText('Paseo Algodón');
  const r = await joy.boundingBox();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const toque = (x, y) => ({ pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true });
  // dedo en el centro y luego hacia arriba (= adelante)
  await joy.dispatchEvent('pointerdown', toque(cx, cy));
  await joy.dispatchEvent('pointermove', toque(cx, cy - 80));
  await expect(page.locator('#joyHint')).toBeHidden();
  // la perilla sube hasta el borde (60 px) y vuelve al centro al soltar
  const altoPerilla = async () => { const k = await page.locator('#joyKnob').boundingBox(); return Math.round(k.y + k.height / 2 - cy); };
  await expect.poll(altoPerilla).toBe(-60);
  await expect(lugar).not.toHaveText('Paseo Algodón');
  await joy.dispatchEvent('pointerup', toque(cx, cy - 80));
  await expect.poll(altoPerilla).toBe(0);
});

test('menú Acción', async ({ page }) => {
  await jugar(page);
  const btn = page.locator('#btnAct'), menu = page.locator('#actMenu');
  await btn.click();
  await expect(menu).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.locator('[data-act]')).toHaveCount(9);
  await menu.locator('[data-act="dance"]').click();
  await expect(menu).toBeHidden();
  // al reabrir, "Bailar" aparece marcado
  await btn.click();
  await expect(menu.locator('[data-act="dance"]')).toHaveClass(/\bon\b/);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
});

test('adoptar una mascota y que siga ahí al recargar', async ({ page }) => {
  await jugar(page);
  await page.locator('#btnPets').click();
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

  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v1')));
  expect(guardado.pets.map(p => [p.kind, p.name])).toEqual([['perro', 'Toby'], ['gato', 'Luna']]);

  await page.reload();
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
  await page.locator('#btnPlay').click();
  await page.locator('#btnPets').click();
  await expect(panel.locator('.mypet b')).toHaveText(['Toby', 'Luna']);
});
