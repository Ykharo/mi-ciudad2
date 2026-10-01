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

test('el Escenario del Aura: su nombre, la tarima (se sube) y "Competir" delante', async ({ page, jugar }) => {
  await jugar();
  await ir(page, 60.5, 49);   // la entrada, desde la Calle Mora (frente a la Plaza de Juegos)
  await expect(page.locator('#placeName')).toHaveText('Escenario del Aura');
  await ir(page, 60.5, 59);   // en la tarima: la jugadora queda arriba (0,5 m)
  await expect.poll(() => page.evaluate(() => window.__juego.player.y)).toBeCloseTo(0.5, 2);
  await ir(page, 58.7, 53.6);   // delante de la tarima: anotarse para competir
  await expect(page.locator('#btnAction')).toHaveText('😎 Competir');
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
  // la mascota se sienta a su lado, en el mismo escalón
  await expect.poll(async () => (await toby()).sit).toBeGreaterThan(0.9);
  const [px, py, pz] = await donde(page), m = await toby();
  expect(Math.hypot(m.x - px, m.z - pz)).toBeLessThan(1.5);
  expect(await page.evaluate(() => window.__juego.player.pets[0].obj.root.position.y)).toBeGreaterThan(py);
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
  // sigue sentada: después de un descanso, otra competencia con otros dos vecinos
  const antes = (await page.evaluate(() => window.__juego.competencia.concursantes())).map(q => q.id);
  await expect.poll(() => page.evaluate(() => window.__juego.competencia.hechas()), { timeout: 15_000 }).toBe(2);
  await expect(page.locator('#toast')).toHaveText('🔄 ¡Llegan nuevos concursantes!');
  await expect.poll(async () => (await page.evaluate(() => window.__juego.competencia.concursantes())).map(q => q.id), { timeout: 15_000 })
    .not.toEqual(antes);
});

// la jugadora compite: la zona "Competir" está delante de la tarima, junto al escalón
const COMPETIR = [58.7, 53.6];
const C = page => page.evaluate(() => ({ jugando: window.__juego.competencia.jugando(), en: window.__juego.competencia.enCurso(),
  toma: window.__juego.competencia.toma(), modo: window.__juego.state.mode, anim: window.__juego.player.ch.sp && window.__juego.player.ch.sp.name }));

test('competir: la ventana para elegir 3 movimientos, y cancelar', async ({ page, jugar }) => {
  await jugar();
  await ir(page, ...COMPETIR);
  await accion(page, '😎 Competir');
  await expect(page.locator('#auraPanel')).toBeVisible();
  expect((await C(page)).modo).toBe('aura');
  await expect(page.locator('#auraGo')).toBeDisabled();
  for (const id of ['griddy', 'floss']) await page.locator(`#auraPanel [data-b="${id}"]`).click();
  await expect(page.locator('#auraGo')).toBeDisabled();       // faltan movimientos
  await page.locator('#auraPanel [data-b="floss"]').click();    // tocar uno elegido lo quita
  await expect(page.locator('#auraPanel .opt.on')).toHaveCount(1);
  await page.locator('#auraCancel').click();
  await expect(page.locator('#auraPanel')).toBeHidden();
  await expect.poll(async () => (await C(page)).modo).toBe('play');
});

test('competir: en cada movimiento un Código Aura; acertar da aura y cámara lenta, y al final vuelve a jugar', async ({ page, jugar }) => {
  await jugar();
  await page.evaluate(() => window.__juego.competencia.rapido(4));
  await ir(page, ...COMPETIR);
  await accion(page, '😎 Competir');
  for (const id of ['griddy', 'floss', 'sigma']) await page.locator(`#auraPanel [data-b="${id}"]`).click();
  await page.locator('#auraGo').click();
  await expect(page.locator('#auraPanel')).toBeHidden();
  const anims = new Set(), tomas = new Set();
  let s, codigos = 0, errores = 0, lento = 1;
  for (let i = 0; i < 600; i++) {
    s = await C(page);
    if (s.anim) anims.add(s.anim);
    if (s.toma) tomas.add(s.toma);
    const cod = await page.evaluate(() => window.__juego.competencia.codigo());
    if (cod) {
      // la ventana con las 3 palabras y el criptex
      await expect(page.locator('#codigoAura')).toBeVisible();
      await expect(page.locator('#codigoAura .palabra').first()).toHaveText(/\S/);
      codigos++;
      if (codigos === 1 && !errores) {   // primero una respuesta mala: marca el error
        errores++;
        await page.evaluate(c => window.__juego.competencia.responder(['x', c[1], c[2]]), cod);
        await expect(page.locator('#codigoAura .palabra.mal')).toHaveCount(1);
      }
      await page.evaluate(c => window.__juego.competencia.responder(c), cod);
      await expect(page.locator('#codigoAura .msg')).toHaveText('✨ ¡Código correcto! ✨');
      lento = Math.min(lento, ...await Promise.all([0, 1, 2].map(async () => { await page.waitForTimeout(150); return page.evaluate(() => window.__juego.competencia.lento()); })));
    }
    if (i > 5 && !s.jugando) break;
    await page.waitForTimeout(100);
  }
  expect(s.jugando).toBe(false);
  expect(codigos).toBe(3);
  expect(lento).toBeLessThan(0.6);                                   // cámara lenta al acertar
  expect([...anims].filter(a => ['griddy', 'floss', 'sigma'].includes(a)).length).toBeGreaterThanOrEqual(2);
  for (const t of ['general', 'cerca', 'reto', 'lenta', 'jurado']) expect([...tomas]).toContain(t);
  await expect(page.locator('#codigoAura')).toBeHidden();
  await expect(page.locator('#toast')).toBeVisible();
  await expect.poll(async () => (await C(page)).modo).toBe('play');
  expect(await page.evaluate(() => window.__juego.player.seat)).toBeNull();
  // vuelve a moverse con el teclado
  const x0 = await page.evaluate(() => window.__juego.player.pos.x);
  await page.keyboard.down('a'); await page.waitForTimeout(400); await page.keyboard.up('a');
  expect(await page.evaluate(() => window.__juego.player.pos.x)).not.toBeCloseTo(x0, 1);
});

test('competir: si hay una competencia en curso, queda anotada y le toca al terminar', async ({ page, jugar }) => {
  await jugar();
  await page.evaluate(() => window.__juego.competencia.rapido(5));
  await ir(page, 55.5, 53.5);
  await accion(page, '🪑 Sentarse adelante');   // empieza una entre vecinos
  await expect.poll(async () => (await C(page)).en).toBe(true);
  await page.keyboard.down('s'); await page.waitForTimeout(200); await page.keyboard.up('s');
  await ir(page, ...COMPETIR);
  await accion(page, '😎 Competir');
  await expect(page.locator('#toast')).toContainText('¡Te anotaste!');
  await expect(page.locator('#auraPanel')).toBeHidden();
  await expect(page.locator('#auraPanel')).toBeVisible({ timeout: 60_000 });   // al terminar la de los vecinos
  expect((await C(page)).en).toBe(false);
});

test('los vecinos usan los juegos: columpio, banca y el sube y baja de a dos; y la jugadora no se les sienta encima', async ({ page, jugar }) => {
  await jugar();
  const mandar = (i, x, z, tipo, pareja = false) => page.evaluate(([i, x, z, tipo, pareja]) => {
    const n = window.__juego.npcs[i]; n.pos.set(x, 0, z); n.target.set(x, 0, z);
    return window.__juego.vecinosJuegos.mandar(i, tipo, pareja);
  }, [i, x, z, tipo, pareja]);
  const estado = () => page.evaluate(() => window.__juego.vecinosJuegos.estado());
  // dos vecinos cerca del sube y baja: uno lo elige e invita al otro
  await page.evaluate(() => { const n = window.__juego.npcs[4]; n.pos.set(66, 0, 31); n.target.set(66, 0, 31); });
  expect(await mandar(3, 68, 31, 'asiento', true)).toBe(true);
  expect(await mandar(0, -12, -27, 'columpio')).toBe(true);
  expect(await mandar(1, -10, -15, 'banca')).toBe(true);
  await expect.poll(async () => {
    const e = await estado();
    return [e[0] && e[0].fase, e[1] && e[1].fase, e[3] && e[3].fase, e[4] && e[4].tipo + ':' + e[4].fase];
  }, { timeout: 20_000 }).toEqual(['usar', 'usar', 'usar', 'asiento:usar']);
  const e = await estado();
  expect(e[0].y).toBeGreaterThan(0.4);   // en el columpio, sobre el suelo
  // la jugadora intenta columpiarse: queda el otro columpio libre
  await ir(page, -14.2, -28.4);
  await accion(page, '🙌 Columpiarse');
  await expect.poll(() => sentada(page)).toBe(true);
  await page.keyboard.press('Space');
  // al rato se levanta y vuelve a la vereda (después puede elegir otro juego: es al azar)
  await expect.poll(async () => { const b = (await estado())[1]; return !b || b.fase === 'volver'; }, { timeout: 30_000, intervals: [200] }).toBe(true);
});

test('un vecino cruza el parque por los senderos (pasa junto a la pileta) y sale a la vereda', async ({ page, jugar }) => {
  await jugar();
  await page.evaluate(() => { const n = window.__juego.npcs[0]; n.pos.set(-4.5, 0, -4.5); n.target.set(-4.5, 0, -4.5); });
  expect(await page.evaluate(() => window.__juego.vecinosJuegos.pasear(0))).toBe(true);
  let cerca = Infinity, salio = false;
  for (let i = 0; i < 360 && !salio; i++) {   // (hasta ~55 m a ~1 m/s, más una parada a mirar)
    await page.waitForTimeout(250);
    const [x, z, uso] = await page.evaluate(() => { const n = window.__juego.npcs[0]; return [n.pos.x, n.pos.z, !!n.uso]; });
    cerca = Math.min(cerca, Math.hypot(x + 20, z + 20));   // el centro de la pileta: (-20; -20)
    salio = !uso;
  }
  expect(cerca).toBeLessThan(7);   // por el círculo de la pileta (a 5,6 m), no por el borde
  expect(salio).toBe(true);
});

test('competir: el selector trae todos los movimientos del menú Acción', async ({ page, jugar }) => {
  await jugar();
  await ir(page, ...COMPETIR);
  await accion(page, '😎 Competir');
  const total = await page.evaluate(() => document.querySelectorAll('#actMenu .act, #actMenu button').length);
  const opciones = await page.locator('#auraPanel .opt').count();
  expect(opciones).toBeGreaterThanOrEqual(17);
  if (total) expect(opciones).toBe(total - 1);   // todos menos "Quedarse quieta"
  await expect(page.locator('#auraPanel [data-b="split"]')).toBeVisible();
  await expect(page.locator('#auraPanel [data-b="stop"]')).toHaveCount(0);
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
