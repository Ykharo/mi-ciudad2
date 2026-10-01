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

test('cambiar de prenda: pelo largo, chaqueta y falda; y sacarse la chaqueta', async ({ page, jugar }) => {
  await jugar();
  const puestas = () => page.evaluate(() => Object.fromEntries(Object.entries(window.__juego.player.ch.prendas).map(([s, p]) => [s, p.id])));
  const tab = t => page.locator(`#wardrobeTabs [data-tab="${t}"]`).click();
  // cómo se ve cada parte del cuerpo: 'si', 'no' o 'fantasma' (escondida bajo la ropa, pero con su sombra)
  const partes = () => page.evaluate(() => {
    const r = {};
    window.__juego.player.ch.model.traverse(o => {
      if (/^(Body_|Ear_-?1$)/.test(o.name)) r[o.name] = !o.visible ? 'no' : o.material.name === 'Fantasma' ? (o.castShadow ? 'fantasma' : 'fantasma sin sombra') : 'si';
    });
    return r;
  });
  expect(await partes()).toEqual({ 'Ear_-1': 'si', Ear_1: 'si', Body_Base: 'si', Body_Brazos: 'si', Body_Piernas: 'fantasma', Body_Pies: 'fantasma' });
  await abrirVestidor(page);
  await tab('pelo'); await muestra(page, 'data-k="prenda"][data-v="pelo_largo"').click();
  await tab('chaqueta');
  await expect(muestra(page, 'data-k="prenda"][data-v=""')).toHaveClass(/\bon\b/);   // de entrada, sin chaqueta
  await muestra(page, 'data-k="prenda"][data-v="chaqueta"').click();
  await muestra(page, 'data-canal="detalles"][data-v="#4FB6F5"').click();
  await tab('abajo'); await muestra(page, 'data-k="prenda"][data-v="falda_tableada"').click();
  await expect.poll(puestas).toEqual({ pelo: 'pelo_largo', torso: 'peto', abrigo: 'chaqueta', piernas: 'falda_tableada', pies: 'zapatillas' });
  expect(await color(page, 'Chaqueta_Detalle')).toBe('#4fb6f5');
  // con falda las piernas se ven; la chaqueta tapa los brazos y el pelo largo, las orejas
  expect(await partes()).toEqual({ 'Ear_-1': 'no', Ear_1: 'no', Body_Base: 'si', Body_Brazos: 'fantasma', Body_Piernas: 'si', Body_Pies: 'fantasma' });
  // el pelo largo hace sombra (como el moño); la chaqueta no
  expect(await page.evaluate(() => window.__juego.player.ch.prendas.pelo.partes.some(o => { let s = false; o.traverse(x => { if (x.isMesh && x.castShadow) s = true; }); return s; }))).toBe(true);

  await tab('chaqueta'); await muestra(page, 'data-k="prenda"][data-v=""').click();
  await expect.poll(async () => (await puestas()).abrigo).toBeUndefined();
  expect((await partes()).Body_Brazos).toBe('si');
  await page.locator('#wardrobeDone').click();
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')));
  expect(guardado.nina.look.prendas).toMatchObject({ pelo: { id: 'pelo_largo' }, piernas: { id: 'falda_tableada' } });
  expect(guardado.nina.look.prendas.abrigo).toBeUndefined();
});

test('accesorios: varios a la vez, la gorra esconde el moño, y se guardan', async ({ page, jugar }) => {
  await jugar();
  const puestas = () => page.evaluate(() => Object.fromEntries(Object.entries(window.__juego.player.ch.prendas).map(([s, p]) => [s, p.id])));
  // ¿se dibuja algo del tope del moño? (el grupo y alguna de sus mallas visibles)
  const topeVisible = () => page.evaluate(() => {
    let v = null;
    window.__juego.player.ch.model.traverse(o => { if (o.name === 'Pelo_Moño_Tope') { v = false; o.traverse(x => { if (x.isMesh && x.visible && o.visible) v = true; }); } });
    return v;
  });
  const acc = id => muestra(page, `data-k="accesorio"][data-v="${id}"`);
  await abrirVestidor(page);
  await page.locator('#wardrobeTabs [data-tab="accesorios"]').click();
  expect(await topeVisible()).toBe(true);
  for (const id of ['gorra', 'lentes', 'audifonos', 'mochila']) { await acc(id).click(); await expect(acc(id)).toHaveClass(/\bon\b/); }
  await expect.poll(puestas).toMatchObject({ pelo: 'mono', cabeza: 'gorra', cara: 'lentes', cuello: 'audifonos', espalda: 'mochila' });
  expect(await topeVisible()).toBe(false);   // el moño queda bajo la gorra
  // colores y extras de cada accesorio, en la misma pestaña
  await muestra(page, 'data-slot="cabeza"][data-canal="visera"][data-v="#4FB6F5"').click();
  expect(await color(page, 'Gorra_Visera')).toBe('#4fb6f5');
  await muestra(page, 'data-slot="cabeza"][data-k="extra:Gorra_Estrella"][data-v="no"').click();
  expect(await visible(page, 'Gorra_Estrella')).toBe(false);
  await muestra(page, 'data-slot="espalda"][data-canal="correas"][data-v="#FF4F5E"').click();
  expect(await color(page, 'Mochila_Correa')).toBe('#ff4f5e');
  // el jockey va en el mismo lugar que la gorra (la reemplaza); los audífonos grandes van encima de cualquiera
  await acc('jockey').click(); await acc('audifonos_grandes').click();
  await expect.poll(puestas).toMatchObject({ cabeza: 'jockey', orejas: 'audifonos_grandes', cuello: 'audifonos' });
  await expect(acc('gorra')).not.toHaveClass(/\bon\b/);
  expect(await topeVisible()).toBe(false);
  await acc('audifonos_grandes').click();
  // se sacan tocándolos otra vez; sin gorro vuelve el moño
  await acc('jockey').click(); await acc('lentes').click();
  await expect.poll(async () => (await puestas()).cabeza).toBeUndefined();
  expect((await puestas()).cara).toBeUndefined();
  expect(await topeVisible()).toBe(true);
  await page.locator('#wardrobeDone').click();

  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')));
  expect(guardado.nina.look.prendas).toMatchObject({ cuello: { id: 'audifonos' }, espalda: { id: 'mochila', colores: { correas: '#FF4F5E' } } });
  expect(guardado.nina.look.prendas.cabeza).toBeUndefined();
  await page.reload();
  await expect(page.locator('#btnPlay')).toHaveText('¡A jugar!', { timeout: 60_000 });
  await page.locator('#btnPlay').click();
  await expect.poll(puestas).toMatchObject({ cuello: 'audifonos', espalda: 'mochila' });
  expect(await color(page, 'Mochila_Correa')).toBe('#ff4f5e');
});

test('las prendas nuevas se ponen desde el Vestidor (y la cadena se puede sacar)', async ({ page, jugar }) => {
  await jugar();
  const puestas = () => page.evaluate(() => Object.fromEntries(Object.entries(window.__juego.player.ch.prendas).map(([s, p]) => [s, p.id])));
  const tab = t => page.locator(`#wardrobeTabs [data-tab="${t}"]`).click();
  const prenda = id => muestra(page, `data-k="prenda"][data-v="${id}"`);
  await abrirVestidor(page);
  for (const [t, slot, ids] of [['arriba', 'torso', ['top_corto', 'polera_corta', 'polera_larga']], ['chaqueta', 'abrigo', ['chaqueta_oversize', 'poleron_oversize']],
    ['abajo', 'piernas', ['pantalon_ancho']], ['zapatos', 'pies', ['zapatillas_plataforma']]]) {
    await tab(t);
    for (const id of ids) { await prenda(id).click(); await expect.poll(async () => (await puestas())[slot]).toBe(id); }
  }
  await tab('accesorios');
  await muestra(page, 'data-k="accesorio"][data-v="gorro_lana"').click();
  await expect.poll(async () => (await puestas()).cabeza).toBe('gorro_lana');
  // los tres lentes de sol van en la cara: uno reemplaza al otro; el color de los lentes se cambia aparte
  for (const id of ['lentes_aviador', 'lentes_clasicos', 'lentes_corazon']) {
    await muestra(page, `data-k="accesorio"][data-v="${id}"`).click();
    await expect.poll(async () => (await puestas()).cara).toBe(id);
  }
  await muestra(page, 'data-slot="cara"][data-canal="lentes"][data-v="#1F3B5E"').click();
  expect(await color(page, 'SolK_Lente')).toBe('#1f3b5e');
  await tab('abajo');
  await muestra(page, 'data-k="extra:PantalonA_Cadena"][data-v="no"').click();
  expect(await visible(page, 'PantalonA_Cadena')).toBe(false);
  await page.locator('#wardrobeDone').click();
  const g = await page.evaluate(() => JSON.parse(localStorage.getItem('ciudadArcoiris.v2')).nina.look.prendas);
  expect(g).toMatchObject({ torso: { id: 'polera_larga' }, abrigo: { id: 'poleron_oversize' }, piernas: { id: 'pantalon_ancho', extras: { PantalonA_Cadena: false } }, pies: { id: 'zapatillas_plataforma' }, cabeza: { id: 'gorro_lana' } });
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
