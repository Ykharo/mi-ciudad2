// Guardado v2 y migración desde v1.
import { test, expect } from './ayudantes.js';

const leer = (page, clave) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), clave);
// siembra una partida antes de que cargue el juego (sólo si no hay nada: así sobrevive a las recargas)
const sembrar = (page, clave, datos) => page.addInitScript(([k, d]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(d)); }, [clave, datos]);

const V1 = {
  pets: [{ kind: 'gato', color: '#FFFFFF', name: 'Nube' }, { kind: 'unicornio', color: '#FFB8D6', name: 'Chispa' }],
  cars: [{ spec: { type: 'buggy', color: '#4FB6F5', accent: '#FFD23F' }, x: 61, z: -1.9, h: -Math.PI / 2 }],
  shop: { type: 'jeep', color: '#FF6FAE', accent: '#FFFFFF' },
};

test('una partida v1 se migra a v2 sin perder nada', async ({ page, jugar }) => {
  await sembrar(page, 'ciudadArcoiris.v1', V1);
  await jugar();
  // mascotas y auto vuelven a aparecer
  await page.locator('#btnPets').click();
  await expect(page.locator('#petPanel .mypet b')).toHaveText(['Nube', 'Chispa']);
  await page.locator('#petDone').click();
  expect(await page.evaluate(() => window.__juego.cars.filter(c => c.owned).map(c => [c.spec.type, c.x, c.z]))).toEqual([['buggy', 61, -1.9]]);
  // quedó guardada como v2, con Nina de fábrica y el diseño de la tienda
  const v2 = await leer(page, 'ciudadArcoiris.v2');
  expect(v2.version).toBe(2);
  expect(v2.pets.map(p => p.name)).toEqual(['Nube', 'Chispa']);
  expect(v2.cars.map(c => c.spec.type)).toEqual(['buggy']);
  expect(v2.shop).toMatchObject({ type: 'jeep', color: '#FF6FAE' });
  expect(v2.nina.look).toMatchObject({ base: 'nina', escala: 1, prendas: { pelo: { id: 'mono' }, torso: { id: 'peto' } } });
  // la partida v1 no se borra
  expect(await leer(page, 'ciudadArcoiris.v1')).toEqual(V1);
  // y al recargar se usa la v2
  await page.reload();
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
  await page.locator('#btnPlay').click();
  await page.locator('#btnPets').click();
  await expect(page.locator('#petPanel .mypet b')).toHaveText(['Nube', 'Chispa']);
});

test('la forma de cabeza del look se aplica a la cabeza y a lo que va sobre ella', async ({ page, jugar }) => {
  await sembrar(page, 'ciudadArcoiris.v2', {
    version: 2,
    nina: { look: { formas: { redonda: 1, cuadrada: 1 }, prendas: { pelo: { id: 'pelo_largo' }, torso: { id: 'peto' }, piernas: { id: 'pantalon_cargo' }, pies: { id: 'zapatillas' }, cabeza: { id: 'jockey' }, orejas: { id: 'audifonos_grandes' } } } },
  });
  await jugar();
  // formas que no existen se descartan
  expect(await page.evaluate(() => window.__juego.player.look.formas)).toEqual({ redonda: 1 });
  // cuánto de la forma "redonda" tiene cada malla que la lleva (por su nombre o el de su grupo)
  const redonda = await page.evaluate(() => {
    const r = {};
    window.__juego.player.ch.model.traverse(o => {
      if (!o.morphTargetDictionary || !('redonda' in o.morphTargetDictionary)) return;
      r[o.name] = r[o.parent.name] = o.morphTargetInfluences[o.morphTargetDictionary.redonda];
    });
    return r;
  });
  expect(redonda).toMatchObject({ Head_Base: 1, Pelo_Largo: 1, Acc_Jockey: 1, Acc_AudifonosGrandes: 1 });
});

test('un guardado dañado no rompe el juego', async ({ page, jugar }) => {
  await sembrar(page, 'ciudadArcoiris.v2', {
    version: 2,
    nina: { look: { piel: 'rojo', escala: 99, prendas: { pelo: { id: 'no-existe' }, torso: { id: 'peto', colores: { principal: '#FF4F5E', otro: '#000000' }, extras: { Top_Emblem: false } } } } },
    pets: [{ kind: 'dragon', name: 'X' }, { kind: 'perro', color: '#C98B4F', name: 'Coco' }],
    cars: [{ spec: { type: 'nave' }, x: 'aquí', z: null }],
    shop: 'nada',
  });
  await jugar();
  // lo que no existe se descarta o vuelve a lo de fábrica; lo válido se conserva
  const look = await page.evaluate(() => window.__juego.player.look);
  expect(look.piel).toBeNull();
  expect(look.escala).toBe(1);
  expect(look.prendas.pelo).toEqual({ id: 'mono' });
  expect(look.prendas.torso).toEqual({ id: 'peto', colores: { principal: '#FF4F5E' }, extras: { Top_Emblem: false } });
  await page.locator('#btnPets').click();
  await expect(page.locator('#petPanel .mypet b')).toHaveText(['Coco']);
});
