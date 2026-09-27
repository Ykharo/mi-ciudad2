// Capturas de referencia: sirven para confirmar que la reestructuración no cambia lo que se ve.
// La página se deja repetible (Math.random con semilla, reloj detenido, sin audio) y el bucle
// avanza sólo con page.clock.runFor(ms). Para regenerarlas: npm run test:capturas
import { test, expect, cargar, prepararRepetible } from './ayudantes.js';

test('capturas de referencia', async ({ page }) => {
  await prepararRepetible(page);
  await cargar(page);
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
});
