// El juego no depende de nada de internet (Three.js va empaquetado, los modelos se sirven con el juego): sólo las
// fuentes de Google quedan afuera, y el juego tiene letras de respaldo.
import { test, expect } from './ayudantes.js';

test('arranca sin red', async ({ page, context, jugar, errores, baseURL }) => {
  const bloqueadas = [];
  await context.route('**/*', r => {
    const url = r.request().url();
    if (url.startsWith(baseURL)) return r.continue();
    bloqueadas.push(url); return r.abort('internetdisconnected');
  });
  await jugar();
  await page.keyboard.down('w');
  await expect(page.locator('#placeName')).not.toHaveText('Paseo Algodón');
  await page.keyboard.up('w');
  // lo único que intentó salir a internet fueron las fuentes
  expect(bloqueadas.filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u))).toEqual([]);
  // los avisos de "no se pudo cargar" de las fuentes bloqueadas son esperados
  const esperados = errores.filter(e => /Failed to load resource|ERR_INTERNET_DISCONNECTED/.test(e));
  errores.splice(0, errores.length, ...errores.filter(e => !esperados.includes(e)));
});
