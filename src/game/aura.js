// La competencia de farmear aura en el Escenario del Aura (world/places/escenario_aura.js): el jurado (3) y el público
// (5) sentados, dos concursantes que esperan a los lados de la tarima, la competencia entre ellos (al sentarse la
// jugadora en las graderías), la zona "Competir" (todavía sólo avisa) y las pistas de dónde queda el escenario, que
// da quien lee el cartel (game/cartel.js). Todo sale de la posición del escenario: si se cambia de lugar, sigue igual.
import { emit } from '../core/events.js';
import { lerpAngle, pick, seeded } from '../core/math.js';
import { labelSprite } from '../engine/textures.js';
import { LINES, STREET } from '../world/layout.js';
import { sueloEn } from '../world/physics.js';
import { places } from '../world/place.js';
import { onZoneAction } from '../world/zones.js';
import { ESCENARIO } from '../world/places/escenario_aura.js';
import { NINA, NINA_SCALE, makeAvatar } from '../characters/avatar.js';
import { randomLook } from '../characters/looks.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { ACTIONS } from '../characters/catalog/acciones.js';

/* ---------- jurado, público y concursantes ---------- */
const sentados = [], concursantes = [];
// sus looks se sortean antes de cargar los personajes (main.js), como los de los vecinos: siempre los mismos
// (los dos últimos son los concursantes)
function lookPublico() {
  const r = seeded(2468);
  return [...ESCENARIO.jurado, ...ESCENARIO.publico, ...ESCENARIO.lados].map(() => randomLook(r));
}
// sentados con la pose final de "sit": las caderas en el puesto (0,158 arriba y 0,10 atrás de la raíz)
function crearPublico(looks) {
  const P = [...ESCENARIO.jurado, ...ESCENARIO.publico];
  P.forEach((p, i) => {
    const c = makeAvatar(looks[i]), k = c.k;
    c.root.position.set(p.x + Math.sin(p.mira) * 0.10 * k, p.alto - 0.158 * k, p.z + Math.cos(p.mira) * 0.10 * k);
    c.root.rotation.y = p.mira;
    avatarDo(c, 'sit', { start: 9, instant: true, stopOnMove: false });
    sentados.push(c);
  });
  // los concursantes, de pie arriba de la tarima, uno a cada lado, esperando su turno
  ESCENARIO.lados.forEach((p, i) => {
    const c = makeAvatar(looks[P.length + i]);
    const q = { ch: c, x: p.x, z: p.z, facing: p.mira, vel: 0, lado: p, nombre: '' };
    c.root.position.set(p.x, 0, p.z); c.root.rotation.y = p.mira;
    concursantes.push(q);
  });
}
// sólo se anima a quien se ve (cullAvatars los esconde lejos o fuera de la cámara)
function updatePublico(dt) {
  if (show) avanzar(dt * velocidad);
  for (const c of sentados) if (c.model.visible) updateAvatar(c, dt, 0, null);
  for (const q of concursantes) {
    q.ch.root.position.set(q.x, sueloEn(q.x, q.z), q.z); q.ch.root.rotation.y = q.facing;
    if (q.ch.model.visible || show) updateAvatar(q.ch, dt * velocidad, q.vel, q.cara || null);
  }
  globos.forEach(g => { g.t -= dt * velocidad; if (g.t <= 0) g.c.root.remove(g.s); });
  for (let i = globos.length - 1; i >= 0; i--) if (globos[i].t <= 0) globos.splice(i, 1);
}

// un globo de diálogo sobre la cabeza (más abajo si está sentado), por unos segundos
const globos = [];
function decir(c, texto, seg = 2.5, sentado = false) {
  for (const g of globos) if (g.c === c) { g.c.root.remove(g.s); g.t = 0; }
  const s = labelSprite(texto, { bubble: true, scale: 0.0062 });
  s.position.y = (sentado ? 1.75 : 2.35) * c.k / NINA_SCALE + 0.55; c.root.add(s);
  globos.push({ c, s, t: seg });
}

/* ---------- la competencia: dos concursantes, tres movimientos cada uno ---------- */
// Al sentarse la jugadora en las graderías (y si no hay una en curso): los dos esperan arriba de la tarima, uno a
// cada lado; por turnos, uno pasa al centro, hace un baile del menú Acción (su nombre en un globo; el público grita) y
// vuelve a su lugar, y después el otro; tres rondas (tres bailes distintos cada uno). Su aura sube en su medidor de
// la pantalla. Después el jurado da las notas (del 5 al 10, una por juez), se anuncia quién gana
// y lo celebra. El resultado tiene azar (Math.random): sólo corre cuando alguien la mira, no en las capturas.
const BAILES = ['aura', 'seis_siete', 'sigma', 'take_l', 'siuu', 'griddy', 'spin', 'fresh', 'floss', 'dance'];
const NOMBRES = ['Rubí', 'Max', 'Sofi', 'Benja', 'Emi', 'Tomi', 'Isa', 'Mati', 'Flo', 'Lucas'];
const GRITOS = ['¡Bravo!', '¡Qué aura!', '¡Wooow!', '¡Eso!', '¡Increíble!', '¡Otra!'];
let show = null, velocidad = 1;

// los pasos de la competencia: cada uno { dur, inicio(), cada(dt, u) } (u: 0…1 del paso)
function caminar(q, x, z, vel = 1.6) {
  let d0 = 0;
  return {
    dur: Math.max(0.3, Math.hypot(x - q.x, z - q.z) / vel),
    inicio() { avatarStop(q.ch); d0 = Math.hypot(x - q.x, z - q.z); },
    cada(dt) {
      const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz);
      if (d > 0.02) { const st = Math.min(d, vel * dt); q.x += dx / d * st; q.z += dz / d * st; q.facing = lerpAngle(q.facing, Math.atan2(dx, dz), 1 - Math.exp(-dt * 10)); }
      q.vel = d > 0.02 && d0 > 0 ? vel : 0;
    },
    fin() { q.x = x; q.z = z; q.vel = 0; },
  };
}
function girar(q, mira, dur = 0.5) { return { dur, cada(dt) { q.facing = lerpAngle(q.facing, mira, 1 - Math.exp(-dt * 8)); } }; }
function esperar(dur, inicio) { return { dur, inicio }; }
// un movimiento: el baile (en bucle, al menos 3,5 s; si no, entero), su nombre en un globo y el aura que suma
function bailar(q, id, k, puntos) {
  const a = ACTIONS.find(x => x.id === id), clip = NINA.clips[id], largo = clip ? clip.duration : 3;
  const dur = a.loop ? Math.max(3.5, Math.min(largo * 2, 5)) : Math.min(largo, 5);
  let antes = 0;
  return {
    dur,
    inicio() {
      avatarDo(q.ch, id, { loop: !!a.loop, stopOnMove: false });
      decir(q.ch, `${a.ic} ${a.name}`, dur * 0.8);
      antes = ESCENARIO.medidor.niveles[k]; ESCENARIO.medidor.activo = k;
      emit('sonido', 'pop');
    },
    cada(dt, u) { ESCENARIO.medidor.niveles[k] = antes + puntos / 30 * Math.min(1, u * 1.5); },
    fin() {
      avatarStop(q.ch);
      if (Math.random() < 0.8) decir(pick(sentados.slice(3)), pick(GRITOS), 2, true);
    },
  };
}

function empezarCompetencia() {
  if (show || concursantes.length < 2) return;
  const nombres = [...NOMBRES].sort(() => Math.random() - 0.5);
  const turnos = concursantes.map((q, k) => {
    q.nombre = nombres[k];
    const movs = [...BAILES].sort(() => Math.random() - 0.5).slice(0, 3);
    // puntos de cada movimiento: 6 a 10 (el aura de la pantalla: la suma sobre 30)
    return { q, k, movs, puntos: movs.map(() => 6 + Math.round(Math.random() * 4)) };
  });
  const total = t => t.puntos.reduce((a, b) => a + b, 0);
  if (total(turnos[0]) === total(turnos[1])) turnos[1].puntos[2] += turnos[1].puntos[2] < 10 ? 1 : -1;   // sin empates
  const C = ESCENARIO.centro, pasos = [];
  ESCENARIO.medidor = { niveles: [0, 0], activo: -1 };
  pasos.push(esperar(2.5, () => {
    emit('aviso', `🎤 ¡Comienza la competencia de aura! ${turnos[0].q.nombre} contra ${turnos[1].q.nombre}`);
    turnos.forEach(t => decir(t.q.ch, `¡Soy ${t.q.nombre}!`, 2.2));
  }));
  // por turnos: uno pasa al centro, hace un movimiento y vuelve a su lugar; después el otro; tres rondas
  for (let r = 0; r < 3; r++) {
    for (const t of turnos) {
      const { q, k } = t;
      pasos.push(esperar(0.8, () => emit('aviso', `✨ Ronda ${r + 1}: le toca a ${q.nombre}`)));
      pasos.push(caminar(q, C.x, C.z), girar(q, C.mira, 0.4));
      pasos.push(bailar(q, t.movs[r], k, t.puntos[r]));
      if (r === 2) pasos.push(esperar(0.6, () => { avatarDo(q.ch, 'wave', { start: 0.1, stopOnMove: false }); decir(q.ch, '¡Gracias!', 1.5); }));
      pasos.push(caminar(q, q.lado.x, q.lado.z), girar(q, q.lado.mira, 0.4));
    }
  }
  // el jurado: cada juez levanta su nota (cerca del puntaje de cada uno, del 5 al 10)
  const notas = turnos.map(t => sentados.slice(0, 3).map(() => Math.max(5, Math.min(10, Math.round(total(t) / 3 + (Math.random() * 2 - 1))))));
  pasos.push(esperar(1.5, () => { ESCENARIO.medidor.activo = -1; emit('aviso', '🧑‍⚖️ ¡El jurado está votando!'); }));
  // (en el globo sólo la nota, para que no se tapen; para quién es lo dice el aviso)
  turnos.forEach((t, n) => pasos.push(esperar(3, () => {
    sentados.slice(0, 3).forEach((j, i) => decir(j, `⭐ ${notas[n][i]}`, 2.8, true));
    emit('aviso', `🧑‍⚖️ Notas para ${t.q.nombre}: ${notas[n].join(' · ')}`);
    emit('sonido', 'pop');
  })));
  const suma = notas.map(ns => ns.reduce((a, b) => a + b, 0));
  // si el jurado empata, gana quien tiene más aura en la pantalla
  const gana = suma[0] !== suma[1] ? (suma[0] > suma[1] ? 0 : 1) : (total(turnos[0]) > total(turnos[1]) ? 0 : 1);
  const G = turnos[gana].q, P = turnos[1 - gana].q;
  pasos.push(esperar(4, () => {
    emit('aviso', `🏆 ¡Gana ${G.nombre} con ${suma[gana]} puntos! (${P.nombre}: ${suma[1 - gana]})`);
    emit('sonido', 'adopt');
    avatarDo(G.ch, 'spin', { stopOnMove: false }); decir(G.ch, '🏆 ¡Gané!', 3.5); G.cara = 'feliz';
    avatarDo(P.ch, 'wave', { start: 0.1, stopOnMove: false }); decir(P.ch, '¡Bien jugado!', 3);
    sentados.slice(3).forEach((c, i) => { if (i % 2 === 0) decir(c, pick(GRITOS), 3, true); });
  }));
  pasos.push(esperar(0.1, () => { G.cara = null; }));
  show = { pasos, i: -1, t: 0, ganador: G.nombre, notas: suma };
}
function avanzar(dt) {
  const S = show;
  if (S.i < 0 || S.t >= S.pasos[S.i].dur) {
    if (S.i >= 0 && S.pasos[S.i].fin) S.pasos[S.i].fin();
    S.i++; S.t = 0;
    if (S.i >= S.pasos.length) { show = null; ESCENARIO.medidor = null; return; }
    if (S.pasos[S.i].inicio) S.pasos[S.i].inicio();
  }
  const p = S.pasos[S.i];
  S.t += dt;
  if (p.cada) p.cada(dt, Math.min(1, S.t / p.dur));
}
// sentarse en las graderías empieza una competencia (si no hay una en curso)
ESCENARIO.gradas.alSentarse = empezarCompetencia;

// (para las pruebas: en qué va, y acelerarla)
const competencia = {
  enCurso: () => !!show,
  concursantes: () => concursantes.map(q => ({ nombre: q.nombre, anim: q.ch.sp && q.ch.sp.name, x: q.x, z: q.z })),
  rapido(v) { velocidad = v; },
};

/* ---------- la zona de la tarima ---------- */
onZoneAction('aura', () => {
  emit('aviso', '😎 ¡Muy pronto! La competencia de farmear aura se está preparando');
  emit('sonido', 'pop');
});

/* ---------- pistas para encontrar el escenario ---------- */
const lugar = p => p.articulo === 'el' ? `el ${p.nombre}` : p.articulo ? `${p.articulo} ${p.nombre}` : p.nombre;
const frenteA = p => p.articulo === 'el' ? `frente al ${p.nombre}` : `frente a ${lugar(p)}`;
const laCalle = nombre => (nombre.startsWith('Paseo') ? `el ${nombre}` : `la ${nombre}`);
const enLa = nombre => `en ${laCalle(nombre)}`;
const centro = a => ({ x: (a[0] + a[1]) / 2, z: (a[2] + a[3]) / 2 });

// la calle más cercana al escenario y, si hay, el lugar que queda al otro lado de esa calle
function vecindario() {
  const E = ESCENARIO;
  let calle = null;
  for (const L of LINES) {
    if (!calle || Math.abs(E.x - L) < calle.d) calle = { d: Math.abs(E.x - L), eje: 'x', L, nombre: STREET.x[L] };
    if (Math.abs(E.z - L) < calle.d) calle = { d: Math.abs(E.z - L), eje: 'z', L, nombre: STREET.z[L] };
  }
  const yo = places.find(p => p.id === 'escenario'), mio = yo.area;
  let enfrente = null, mejor = Infinity;
  for (const p of places) {
    if (p === yo || !p.area) continue;
    const c = centro(p.area), a = p.area;
    // al otro lado de la calle, y frente a frente (las manzanas se solapan a lo largo de la calle)
    const cruza = calle.eje === 'z' ? (c.z - calle.L) * (E.z - calle.L) < 0 && a[0] < mio[1] && a[1] > mio[0]
      : (c.x - calle.L) * (E.x - calle.L) < 0 && a[2] < mio[3] && a[3] > mio[2];
    const d = Math.hypot(c.x - E.x, c.z - E.z);
    if (cruza && d < mejor) { mejor = d; enfrente = p; }
  }
  return { calle, enfrente, yo };
}

// hacia dónde queda, para alguien parado en `desde` mirando hacia `mira` (el cartel)
function direccion(desde, mira) {
  const dx = ESCENARIO.x - desde.x, dz = ESCENARIO.z - desde.z;
  const adelante = dx * Math.sin(mira) + dz * Math.cos(mira), derecha = -dx * Math.cos(mira) + dz * Math.sin(mira);
  const a = Math.atan2(derecha, adelante) * 180 / Math.PI, lado = a > 0 ? 'a la derecha' : 'a la izquierda', b = Math.abs(a);
  const donde = b < 25 ? 'derecho, más allá del cartel' : b < 65 ? `adelante y ${lado}` : b < 115 ? lado : b < 155 ? `atrás y ${lado}` : 'detrás de ti';
  return { donde, metros: Math.max(10, Math.round(Math.hypot(dx, dz) / 10) * 10) };
}

// Las pistas, en orden (quien lee el cartel da una distinta cada vez que se le pregunta). `corta` va en su globo,
// `larga` en el aviso.
function pistasEscenario(desde, mira) {
  const { calle, enfrente, yo } = vecindario(), { donde, metros } = direccion(desde, mira);
  const pistas = [
    { corta: `¡${enLa(calle.nombre).replace(/^en/, 'En')}!`, larga: `«¡Es en ${lugar(yo)}, ${enLa(calle.nombre)}!»` },
    { corta: '¡Por allá!', larga: `«Párate mirando el cartel: queda ${donde}, a unos ${metros} metros.»` },
    { corta: '¡Tiene focos de colores!', larga: '«Busca los focos de colores y la pantalla gigante: ¡se ven desde lejos!»' },
  ];
  if (enfrente) pistas.splice(1, 0, { corta: `¡${frenteA(enfrente).replace(/^f/, 'F')}!`, larga: `«Queda ${frenteA(enfrente)}, cruzando ${laCalle(calle.nombre)}.»` });
  return pistas;
}

export { competencia, crearPublico, lookPublico, pistasEscenario, updatePublico };
