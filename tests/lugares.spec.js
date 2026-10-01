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

test('la plaza de juegos: su nombre y sus bancas', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 71.6, 16);   // la banca está en (72,6; 16), mirando hacia los juegos (−x)
  await expect(page.locator('#placeName')).toHaveText('Plaza de Juegos');
  await accion(page, '🪑 Sentarse');
  await expect.poll(() => page.evaluate(() => !!window.__juego.player.seat)).toBe(true);
});

// los juegos de la plaza y del parque (game/juegos.js): subirse, que el juego la lleve, y bajarse al moverse
const sentada = page => page.evaluate(() => !!window.__juego.player.seat);
const donde = page => page.evaluate(() => { const r = window.__juego.player.ch.root.position; return [r.x, r.y, r.z]; });

test('subirse al carrusel: gira con ella y se baja al moverse', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 64, 18);   // el carrusel está en (64; 13,5)
  await accion(page, '🎠 Subirse al carrusel');
  await expect.poll(() => sentada(page)).toBe(true);
  const [x0, y0, z0] = await donde(page);
  expect(y0).toBeGreaterThan(0.8);   // arriba de un caballito
  await expect.poll(async () => { const [x, , z] = await donde(page); return Math.hypot(x - x0, z - z0); }).toBeGreaterThan(0.5);
  await page.keyboard.down('w');
  await expect.poll(() => sentada(page)).toBe(false);
  await page.keyboard.up('w');
  expect((await donde(page))[1]).toBe(0);
});

test('la cama elástica y el sube y baja', async ({ page, jugar }) => {
  await jugar();
  for (const [x, z, texto] of [[56, 29.6, '🤸 Saltar en la cama elástica'], [67, 28.2, '⚖️ Subirse al sube y baja']]) {
    await ir(page, x, z);
    await accion(page, texto);
    await expect.poll(() => sentada(page)).toBe(true);
    const y0 = (await donde(page))[1];
    await expect.poll(async () => Math.abs((await donde(page))[1] - y0)).toBeGreaterThan(0.05);   // se mueve
    await page.keyboard.down('w');
    await expect.poll(() => sentada(page)).toBe(false);
    await page.keyboard.up('w');
  }
});

test('columpiarse: la palanca a tiempo lo hace subir, y se baja saltando', async ({ page, jugar }) => {
  await jugar();
  await ir(page, -14.2, -28.4);   // entre los dos columpios; se sienta en el más cercano
  await accion(page, '🙌 Columpiarse');
  await expect.poll(() => sentada(page)).toBe(true);
  expect(await page.evaluate(() => window.__juego.player.ch.sp.name)).toBe('columpio');
  // empujar hacia donde va (W adelante = +z, S atrás), como un niño, durante 8 s
  const vaiven = async ms => {
    let antes = (await donde(page))[2], tecla = null, min = 99, max = -99;
    for (const fin = Date.now() + ms; Date.now() < fin;) {
      await page.waitForTimeout(50);
      const z = (await donde(page))[2], quiere = z > antes ? 'KeyW' : 'KeyS';
      if (quiere !== tecla) { if (tecla) await page.keyboard.up(tecla); await page.keyboard.down(quiere); tecla = quiere; }
      antes = z; min = Math.min(min, z); max = Math.max(max, z);
    }
    if (tecla) await page.keyboard.up(tecla);
    return max - min;
  };
  const primero = await vaiven(2500), despues = await vaiven(5500);
  expect(despues).toBeGreaterThan(primero + 0.8);   // cada vez más alto
  expect(await sentada(page)).toBe(true);           // moverse no la baja
  await page.keyboard.press('Space');
  await expect.poll(() => sentada(page)).toBe(false);
  expect(await page.evaluate(() => window.__juego.player.air)).toBe(true);   // sale volando
});

test('el tobogán y el columpio también de pie (el segundo botón)', async ({ page, jugar }) => {
  await jugar();
  const anim = () => page.evaluate(() => window.__juego.player.ch.sp && window.__juego.player.ch.sp.name);
  const segundo = async texto => { await expect(page.locator('#btnAction2')).toHaveText(texto); await page.locator('#btnAction2').click({ force: true }); };
  await ir(page, -33, -17);
  await expect(page.locator('#btnAction')).toHaveText('🎢 Tirarse por el tobogán');
  await segundo('🏄 Tirarse de pie');
  await expect.poll(anim, { timeout: 10_000 }).toBe('tobogan_de_pie');
  await expect.poll(() => sentada(page), { timeout: 10_000 }).toBe(false);
  await ir(page, -14.2, -28.4);
  await segundo('🧍 Columpiarse de pie');
  await expect.poll(() => sentada(page)).toBe(true);
  expect(await anim()).toBe('columpio_de_pie');
  await page.keyboard.press('Space');
  await expect.poll(() => sentada(page)).toBe(false);
  // donde no hay dos formas de jugar, el segundo botón no aparece
  await ir(page, 56, 29.6);
  await expect(page.locator('#btnAction')).toHaveText('🤸 Saltar en la cama elástica');
  await expect(page.locator('#btnAction2')).toBeHidden();
});

test('el tobogán: sube por la escalera, se tira y queda parada abajo', async ({ page, jugar }) => {
  await jugar();
  await ir(page, -33, -17);   // al pie de la escalera; el tobogán baja hacia +x
  await accion(page, '🎢 Tirarse por el tobogán');
  await expect.poll(() => sentada(page)).toBe(true);
  const anim = () => page.evaluate(() => window.__juego.player.ch.sp && window.__juego.player.ch.sp.name);
  expect(await anim()).toBe('subir_escalera');
  await expect.poll(async () => (await donde(page))[1]).toBeGreaterThan(1.5);   // trepando
  await expect.poll(anim).toBe('tobogan');                                      // arriba, sentada con los brazos arriba
  expect((await donde(page))[1]).toBeGreaterThan(2);
  await expect.poll(() => sentada(page), { timeout: 10_000 }).toBe(false);
  const p = await page.evaluate(() => { const p = window.__juego.player.pos; return [p.x, p.z]; });
  expect(p[0]).toBeGreaterThan(-27);
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

test('el Escenario del Aura: su nombre, la tarima (se sube) y "Competir"', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 60.5, 49);   // la entrada, desde la Calle Mora (frente a la Plaza de Juegos)
  await expect(page.locator('#placeName')).toHaveText('Escenario del Aura');
  await ir(page, 60.5, 59);   // en la tarima: la jugadora queda arriba (0,5 m)
  await expect.poll(() => page.evaluate(() => window.__juego.player.y)).toBeCloseTo(0.5, 2);
  await accion(page, '😎 Competir');
  await expect(page.locator('#toast')).toContainText('¡Muy pronto!');
});

test('en la tarima la mascota espera abajo sentada; en las graderías se puede sentar a mirar', async ({ page, jugar }) => {
  await jugar();
  const toby = () => page.evaluate(() => { const m = window.__juego.player.pets[0]; return { x: m.pos.x, z: m.pos.z, sit: m.obj.sit || 0 }; });
  await ir(page, 60.5, 49);
  await page.waitForTimeout(800);
  await ir(page, 60.5, 59);   // sube a la tarima
  await expect.poll(async () => (await toby()).sit).toBeGreaterThan(0.9);
  const t = await toby();
  expect(Math.hypot(t.x - 60.5, t.z - 61)).toBeGreaterThan(5.2);   // fuera de la tarima (centro 60,5; 61, radio 5,2)
  // baja: lo vuelve a seguir
  await ir(page, 55, 50);
  await expect.poll(async () => (await toby()).sit).toBeLessThan(0.2);
  // las graderías: dos botones, adelante y arriba
  await ir(page, 55.5, 53.5);
  await expect(page.locator('#btnAction')).toHaveText('🪑 Sentarse adelante');
  await page.locator('#btnAction2').click({ force: true });   // ⬆️ Sentarse arriba
  await expect.poll(() => sentada(page)).toBe(true);
  expect((await donde(page))[1]).toBeGreaterThan(0.9);   // en la fila de arriba (1,35 m)
});

test('al sentarse en las graderías, dos concursantes compiten con tres bailes cada uno', async ({ page, jugar }) => {
  await jugar();
  await page.evaluate(() => window.__juego.competencia.rapido(4));   // acelerada (dura ~55 s)
  await ir(page, 55.5, 53.5);
  await accion(page, '🪑 Sentarse adelante');
  await expect.poll(() => page.evaluate(() => window.__juego.competencia.enCurso())).toBe(true);
  // cada uno baila tres bailes distintos en la tarima (se anotan los que se ven)
  const BAILES = ['aura', 'seis_siete', 'sigma', 'take_l', 'siuu', 'griddy', 'spin', 'fresh', 'floss', 'dance'];
  const vistos = [new Set(), new Set()];
  let fin = false;
  for (let i = 0; i < 200 && !fin; i++) {
    const s = await page.evaluate(() => ({ en: window.__juego.competencia.enCurso(), q: window.__juego.competencia.concursantes(), aviso: document.querySelector('#toast').textContent }));
    s.q.forEach((q, k) => { if (BAILES.includes(q.anim)) vistos[k].add(q.anim); });
    if (/^🏆 ¡Gana /.test(s.aviso)) fin = true;
    await page.waitForTimeout(100);
  }
  expect(fin).toBe(true);
  expect(vistos[0].size).toBeGreaterThanOrEqual(2);   // (muestreado: alguno corto puede no verse)
  expect(vistos[1].size).toBeGreaterThanOrEqual(2);
  await expect.poll(() => page.evaluate(() => window.__juego.competencia.enCurso()), { timeout: 10_000 }).toBe(false);
});

test('quien lee el cartel da pistas de dónde es la competencia', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 8.7, -5.5);
  const preguntar = async () => {
    await expect(page.locator('#btnAction2')).toHaveText('💬 Preguntar dónde es');
    await page.locator('#btnAction2').click({ force: true });
    await expect(page.locator('#toast')).toHaveClass(/show/);
    return page.locator('#toast').textContent();
  };
  const pistas = [];
  for (let i = 0; i < 5; i++) { pistas.push(await preguntar()); await page.waitForTimeout(150); }
  expect(pistas[0]).toContain('Calle Mora');
  expect(pistas[1]).toContain('frente a la Plaza de Juegos');
  expect(pistas[2]).toMatch(/a la derecha, a unos \d+ metros/);
  expect(pistas[3]).toContain('focos de colores');
  expect(pistas[4]).toBe(pistas[0]);   // vuelve a empezar
  // se da vuelta a hablar y después vuelve a leer el cartel
  const anim = () => page.evaluate(() => window.__juego.espectador().sp && window.__juego.espectador().sp.name);
  await expect.poll(anim, { timeout: 8000 }).toBe('mirar_cartel');
});

test('el cartel de la competencia: alguien lo lee y la jugadora también lo puede mirar', async ({ page, jugar }) => {
  await jugar();
  // el espectador (la amiga, porque se juega con Nina) está leyendo el cartel
  const espectador = () => page.evaluate(() => { const e = window.__juego.espectador(); return { anim: e.sp && e.sp.name, look: e.look.prendas.cabeza.id }; });
  expect(await espectador()).toEqual({ anim: 'mirar_cartel', look: 'gorra' });
  await ir(page, 8.7, -5.5);
  await accion(page, '👀 Mirar el cartel');
  await expect(page.locator('#toast')).toContainText('Competencia de farmear aura');
  await expect.poll(() => page.evaluate(() => window.__juego.player.ch.sp && window.__juego.player.ch.sp.name)).toBe('mirar_cartel');
  // mirando hacia el cartel (está en 8,6; -10,2)
  const f = await page.evaluate(() => { const p = window.__juego.player; return Math.atan2(8.6 - p.pos.x, -10.2 - p.pos.z) - p.facing; });
  expect(Math.abs(Math.atan2(Math.sin(f), Math.cos(f)))).toBeLessThan(0.05);
  expect(await modo(page)).toBe('play');
  // si la jugadora se pone a la amiga, el que lee el cartel pasa a ser el amigo
  await page.locator('#btnChar').click();
  await page.locator('#charMenu [data-personaje="amiga"]').click();
  await expect.poll(async () => (await espectador()).look).toBe('jockey');
});
