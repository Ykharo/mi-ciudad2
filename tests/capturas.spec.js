// Capturas de referencia: sirven para confirmar que la reestructuración no cambia lo que se ve.
// La página se deja repetible (Math.random con semilla, reloj detenido, sin audio) y el bucle
// avanza sólo con page.clock.runFor(ms). Se tomaron del juego de la etapa 0 (juego_actual/) y todas las
// versiones nuevas se comparan contra ellas. Regenerarlas sólo si el cambio visible es a propósito:
// npm run test:capturas
import { test, expect, prepararRepetible } from './ayudantes.js';

test('capturas de referencia', async ({ page, cargar }) => {
  await prepararRepetible(page);
  await cargar();
  const foto = nombre => expect(page).toHaveScreenshot(nombre + '.png');

  await page.clock.runFor(1000);
  await foto('1-portada');

  await page.locator('#btnPlay').click();
  await page.clock.runFor(2000);
  await foto('2-nina');

  await page.locator('#btnAct').click();
  await page.locator('#actMenu [data-act="dance"]').click();
  await page.clock.runFor(1500);
  await foto('3-bailando');

  // caminar hacia la izquierda hasta el Parque Central
  await page.keyboard.down('a');
  await page.clock.runFor(4500);
  await page.keyboard.up('a');
  await page.clock.runFor(1000);
  await expect(page.locator('#placeName')).toHaveText('Parque Central');
  await foto('4-parque');

  await page.locator('#btnPets').click();
  await page.clock.runFor(1500);
  await foto('5-mascotas');

  // 6 y 7 se agregaron en la etapa 2 (tomadas con el código de la etapa 1b, antes de desenredar)
  // mirando hacia el salón (-z): al cerrar el panel la cámara se pone detrás de Nina
  await page.evaluate(() => { window.__juego.player.facing = Math.PI; });
  await page.locator('#petDone').click();
  await page.evaluate(() => window.__juego.teleport(61, -8.5));
  await page.clock.runFor(2500);
  await foto('6-salon');

  await page.locator('#btnAction').click({ force: true });
  await page.clock.runFor(1500);
  await foto('7-tienda');

  // 8 se agregó en la etapa 5: el Vestidor abierto, con un color elegido
  await page.locator('#shopDone').click();
  await page.evaluate(() => window.__juego.teleport(20, -8.3));
  await page.clock.runFor(1000);
  await page.locator('#btnAction').click({ force: true });
  await page.locator('#wardrobeBody [data-k="color"][data-v="#A77BF3"]').click();
  await page.clock.runFor(1500);
  await foto('8-vestidor');
});
