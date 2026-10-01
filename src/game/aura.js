// La competencia de farmear aura en el Escenario del Aura (world/places/escenario_aura.js): el jurado (3) y el público
// (5) sentados, dos concursantes que esperan a los lados de la tarima, la competencia entre ellos (al sentarse la
// jugadora en las graderías), la zona "Competir" (todavía sólo avisa) y las pistas de dónde queda el escenario, que
// da quien lee el cartel (game/cartel.js). Todo sale de la posición del escenario: si se cambia de lugar, sigue igual.
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { lerpAngle, pick, seeded } from '../core/math.js';
import { labelSprite } from '../engine/textures.js';
import { LINES, STREET } from '../world/layout.js';
import { sueloEn } from '../world/physics.js';
import { places } from '../world/place.js';
import { onZoneAction } from '../world/zones.js';
import { ESCENARIO } from '../world/places/escenario_aura.js';
import { NINA, NINA_SCALE, makeAvatar, removeAvatar } from '../characters/avatar.js';
import { randomLook } from '../characters/looks.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { ACTIONS } from '../characters/catalog/acciones.js';
import { PERSONAJES } from '../characters/catalog/personajes.js';
import { cam, player } from './actors.js';
import { standUp } from './player.js';
import { enterMenu, leaveMenu } from './modes.js';

/* ---------- jurado, público y concursantes ---------- */
const sentados = [], concursantes = [], RESERVA = 6, reserva = [];
// sus looks se sortean antes de cargar los personajes (main.js), como los de los vecinos: siempre los mismos
// (después del público: los dos concursantes del comienzo y RESERVA más, para las competencias que siguen)
function lookPublico() {
  const r = seeded(2468);
  return [...ESCENARIO.jurado, ...ESCENARIO.publico, ...ESCENARIO.lados, ...Array(RESERVA)].map(() => randomLook(r));
}
// sentados con la pose final de "sit": las caderas en el puesto (0,158 arriba y 0,10 atrás de la raíz)
function crearPublico(looks) {
  const P = [...ESCENARIO.jurado, ...ESCENARIO.publico];
  reserva.push(...looks.slice(P.length + ESCENARIO.lados.length));   // (sus avatares se arman cuando les toca)
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
  // si se anotó para competir, le toca apenas termina la que está en curso (si está cerca y jugando)
  else if (inscrita && state.mode === 'play' && cerca()) abrirEleccion();
  // si la jugadora sigue sentada en las graderías, después de un descanso viene otra competencia (con otros vecinos)
  else if (descanso > 0 && (descanso -= dt * velocidad) <= 0 && ESCENARIO.gradas.ocupado) empezarCompetencia();
  if (cam.cine === cine) actualizarCamara(dt);
  for (const c of sentados) if (c.model.visible) updateAvatar(c, dt, 0, null);
  for (const q of concursantes) {
    if (q.fuera) continue;   // (su lugar lo ocupa la jugadora)
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
// DESCANSO: segundos entre una competencia y la siguiente (si la jugadora sigue sentada mirando)
const DESCANSO = 8;
let show = null, velocidad = 1, descanso = 0;

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

// varios pasos a la vez (los dos concursantes caminando juntos)
function juntos(...ps) {
  let t = 0;
  return {
    dur: Math.max(...ps.map(p => p.dur)),
    inicio() { t = 0; ps.forEach(p => p.inicio && p.inicio()); },
    cada(dt) { t += dt; ps.forEach(p => { if (t <= p.dur + dt && p.cada) p.cada(dt, Math.min(1, t / p.dur)); }); },
    fin() { ps.forEach(p => p.fin && p.fin()); },
  };
}
// los vecinos que van llegando a competir: los de la reserva, por turno
let proximo = 0;
const otroLook = () => reserva[proximo++ % reserva.length];
// un concursante baja por detrás de la tarima y en su lugar aparece otro vecino (lo arma `cambiar`)
function cambiar(q, k) {
  for (const g of globos) if (g.c === q.ch) { q.ch.root.remove(g.s); g.t = 0; }
  removeAvatar(q.ch);
  const S = ESCENARIO.salidas[k];
  q.ch = makeAvatar(otroLook()); q.cara = null; q.fuera = false;
  q.x = S.x; q.z = S.z; q.facing = q.lado.mira;
}
// Relevo: los dos de la competencia anterior bajan por detrás de la tarima y suben dos vecinos nuevos.
let hechas = 0;
function relevo() {
  const S = ESCENARIO.salidas, pasos = [];
  pasos.push(esperar(1.5, () => {
    emit('aviso', '🔄 ¡Llegan nuevos concursantes!');
    concursantes.forEach(q => decir(q.ch, '¡Chao!', 1.4));
  }));
  pasos.push(juntos(...concursantes.map((q, k) => caminar(q, S[k].x, S[k].z, 2))));
  pasos.push(esperar(0.6, () => concursantes.forEach(cambiar)));
  pasos.push(juntos(...concursantes.map(q => caminar(q, q.lado.x, q.lado.z, 2))));
  pasos.push(juntos(...concursantes.map(q => girar(q, q.lado.mira, 0.5))));
  return pasos;
}

// puntos de cada movimiento: 6 a 10 (el aura de la pantalla: la suma sobre 30); sin empates entre los dos
const puntuar = movs => movs.map(() => 6 + Math.round(Math.random() * 4));
const total = t => t.puntos.reduce((a, b) => a + b, 0);
// con la jugadora: qué toma de cámara va en cada paso (`toma`: un nombre, o una función del avance del paso)
const con = (paso, toma, objetivo) => Object.assign(paso, { toma, objetivo });
// sus movimientos se ven de cerca: de frente, desde abajo, girando alrededor, de costado
const TOMAS_BAILE = [u => (u < 0.5 ? 'cerca' : 'abajo'), () => 'orbita', u => (u < 0.5 ? 'abajo' : 'lado')];

// La competencia en sí (para vecinos o con la jugadora): presentación, tres rondas por turnos (uno pasa al centro,
// hace un movimiento y vuelve a su lugar; después el otro), las notas del jurado y quién gana. Agrega los pasos a `pasos`.
function competir2(turnos, pasos, J) {
  if (total(turnos[0]) === total(turnos[1])) turnos[1].puntos[2] += turnos[1].puntos[2] < 10 ? 1 : -1;
  const C = ESCENARIO.centro;
  ESCENARIO.medidor = { niveles: [0, 0], activo: -1 };
  pasos.push(con(esperar(2.5, () => {
    emit('aviso', `🎤 ¡Comienza la competencia de aura! ${turnos[0].q.nombre} contra ${turnos[1].q.nombre}`);
    turnos.forEach(t => decir(t.q.ch, `¡Soy ${t.q.nombre}!`, 2.2));
  }), 'general'));
  for (let r = 0; r < 3; r++) {
    for (const t of turnos) {
      const { q, k } = t, mia = q === J;
      pasos.push(con(esperar(0.8, () => emit('aviso', `✨ Ronda ${r + 1}: le toca a ${mia ? `ti (${q.nombre})` : q.nombre}`)), 'general'));
      pasos.push(con(caminar(q, C.x, C.z), mia ? 'cerca' : 'general', q), con(girar(q, C.mira, 0.4), mia ? 'cerca' : 'general', q));
      pasos.push(con(bailar(q, t.movs[r], k, t.puntos[r]), mia ? TOMAS_BAILE[r] : 'general', q));
      if (r === 2) pasos.push(con(esperar(0.6, () => { avatarDo(q.ch, 'wave', { start: 0.1, stopOnMove: false }); decir(q.ch, '¡Gracias!', 1.5); }), mia ? 'cerca' : 'general', q));
      pasos.push(con(caminar(q, q.lado.x, q.lado.z), 'general'), con(girar(q, q.lado.mira, 0.4), 'general'));
    }
  }
  // el jurado: cada juez levanta su nota (cerca del puntaje de cada uno, del 5 al 10)
  const notas = turnos.map(t => sentados.slice(0, 3).map(() => Math.max(5, Math.min(10, Math.round(total(t) / 3 + (Math.random() * 2 - 1))))));
  pasos.push(con(esperar(1.5, () => { ESCENARIO.medidor.activo = -1; emit('aviso', '🧑‍⚖️ ¡El jurado está votando!'); }), 'jurado'));
  // (en el globo sólo la nota, para que no se tapen; para quién es lo dice el aviso)
  turnos.forEach((t, n) => pasos.push(con(esperar(3, () => {
    sentados.slice(0, 3).forEach((j, i) => decir(j, `⭐ ${notas[n][i]}`, 2.8, true));
    emit('aviso', `🧑‍⚖️ Notas para ${t.q.nombre}: ${notas[n].join(' · ')}`);
    emit('sonido', 'pop');
  }), 'jurado')));
  const suma = notas.map(ns => ns.reduce((a, b) => a + b, 0));
  // si el jurado empata, gana quien tiene más aura en la pantalla
  const gana = suma[0] !== suma[1] ? (suma[0] > suma[1] ? 0 : 1) : (total(turnos[0]) > total(turnos[1]) ? 0 : 1);
  const G = turnos[gana].q, P = turnos[1 - gana].q;
  pasos.push(con(esperar(4, () => {
    emit('aviso', G === J ? `🏆 ¡Ganaste! ${suma[gana]} puntos contra ${suma[1 - gana]} de ${P.nombre}`
      : `🏆 ¡Gana ${G.nombre} con ${suma[gana]} puntos! (${P.nombre}: ${suma[1 - gana]})`);
    emit('sonido', 'adopt');
    avatarDo(G.ch, 'spin', { stopOnMove: false }); decir(G.ch, '🏆 ¡Gané!', 3.5); G.cara = 'feliz';
    avatarDo(P.ch, 'wave', { start: 0.1, stopOnMove: false }); decir(P.ch, '¡Bien jugado!', 3);
    sentados.slice(3).forEach((c, i) => { if (i % 2 === 0) decir(c, pick(GRITOS), 3, true); });
  }), 'ganador', G));
  pasos.push(esperar(0.1, () => { G.cara = null; }));
  return { ganador: G.nombre, notas: suma };
}

// una competencia entre los dos vecinos que están en la tarima (si ya compitieron, primero llegan otros dos)
function empezarCompetencia() {
  if (show || concursantes.length < 2) return;
  descanso = 0;
  const pasos = hechas > 0 ? relevo() : [];
  hechas++;
  const nombres = [...NOMBRES].sort(() => Math.random() - 0.5);
  const turnos = concursantes.map((q, k) => {
    q.nombre = nombres[k];
    const movs = [...BAILES].sort(() => Math.random() - 0.5).slice(0, 3);
    return { q, k, movs, puntos: puntuar(movs) };
  });
  show = { pasos, i: -1, t: 0, ...competir2(turnos, pasos) };
}

/* ---------- la jugadora compite ---------- */
// "😎 Competir" (frente a la tarima): si hay una competencia en curso, queda anotada y le toca cuando termine (si está
// cerca); si no, elige ya. Elegir: una ventana con los bailes (ui/panels/aura.js, evento 'aura') para escoger 3; después
// compite contra un vecino nuevo, por ahora sola (sus movimientos se hacen automáticamente), con cámaras que la siguen
// de cerca. Mientras tanto el modo es 'aura': la jugadora no se mueve con la palanca y la cámara la maneja `cam.cine`.
let inscrita = false, J = null;
const cerca = () => Math.hypot(player.pos.x - ESCENARIO.tarima.x, player.pos.z - ESCENARIO.tarima.z) < 16;
onZoneAction('aura', () => {
  if (J || state.mode !== 'play') return;
  if (show) {
    inscrita = true;
    emit('aviso', '📝 ¡Te anotaste! Compites cuando termine esta competencia');
    emit('sonido', 'pop');
    return;
  }
  abrirEleccion();
});
function abrirEleccion() {
  inscrita = false;
  standUp(); player.vel.set(0, 0, 0);
  enterMenu('aura');
  cine.toma = 'general'; cine.objetivo = null; cam.cine = cine;
  emit('aura', { que: 'elegir', bailes: BAILES.map(id => ACTIONS.find(a => a.id === id)) });
}
function cancelarCompetir() { cam.cine = null; leaveMenu(); }

function competir(movs) {
  if (show || J) return;
  descanso = 0;
  const [q0, q1] = concursantes, S = ESCENARIO.salidas, L = ESCENARIO.lados, F = ESCENARIO.frente;
  J = { ch: player.ch, x: player.pos.x, z: player.pos.z, facing: player.facing, vel: 0, lado: L[0], nombre: PERSONAJES[player.personaje].nombre };
  // la jugadora la mueve la competencia: un "asiento" fijo que la pone donde está J (game/player.js)
  player.seat = {
    fijo: true,
    get vel() { return J ? J.vel : 0; },
    mover() {
      if (!J) return;
      player.ch.root.position.set(J.x, sueloEn(J.x, J.z), J.z); player.ch.root.rotation.set(0, J.facing, 0);
      player.pos.x = J.x; player.pos.z = J.z; player.facing = J.facing;
    },
  };
  const pasos = [];
  // los dos vecinos se van; vuelve uno nuevo (el rival) y la jugadora sube a su lugar
  pasos.push(con(esperar(1.2, () => { emit('aviso', '😎 ¡Te toca competir!'); concursantes.forEach(q => decir(q.ch, '¡Chao!', 1.2)); }), 'general'));
  pasos.push(con(juntos(caminar(q0, S[0].x, S[0].z, 2), caminar(q1, S[1].x, S[1].z, 2)), 'general'));
  pasos.push(con(esperar(0.4, () => {
    for (const g of globos) if (g.c === q0.ch) { q0.ch.root.remove(g.s); g.t = 0; }
    removeAvatar(q0.ch); q0.fuera = true;
    cambiar(q1, 1);
  }), 'general'));
  pasos.push(con(juntos(caminar(q1, q1.lado.x, q1.lado.z, 2), caminar(J, L[0].x, L[0].z, 2.2)), 'general'));
  pasos.push(con(juntos(girar(q1, q1.lado.mira, 0.5), girar(J, L[0].mira, 0.5)), 'general'));
  q1.nombre = pick(NOMBRES);
  const rivales = [...BAILES].sort(() => Math.random() - 0.5).slice(0, 3);
  const info = competir2([{ q: J, k: 0, movs, puntos: puntuar(movs) }, { q: q1, k: 1, movs: rivales, puntos: puntuar(rivales) }], pasos, J);
  // al final: la jugadora baja de la tarima y llega otro vecino a su lugar
  pasos.push(con(esperar(0.3, () => cambiar(q0, 0)), 'general'));
  pasos.push(con(juntos(caminar(J, F.x, F.z, 2.2), caminar(q0, q0.lado.x, q0.lado.z, 2)), 'general'));
  pasos.push(con(juntos(girar(q0, q0.lado.mira, 0.5), girar(J, F.mira, 0.4)), 'general'));
  pasos.push(esperar(0.1, () => terminarJugadora()));
  hechas++;
  show = { pasos, i: -1, t: 0, jugadora: true, ...info };
}
function terminarJugadora() {
  player.pos.set(J.x, 0, J.z); player.facing = J.facing; player.seat = null; player.vel.set(0, 0, 0);
  J = null; cam.cine = null;
  leaveMenu();
}

/* ---------- las cámaras mientras compite la jugadora ---------- */
// Cada toma da dónde va la cámara y hacia dónde mira; la cámara (game/camera.js, modo 'aura') se desliza hacia ella,
// así el cambio de toma es una transición suave. Se calculan cada cuadro: siguen a quien se mueve.
const cine = { pos: new THREE.Vector3(), look: new THREE.Vector3(), k: 2.2, toma: 'general', objetivo: null, t: 0 };
function actualizarCamara(dt) {
  cine.t += dt;
  const q = cine.objetivo || J, T = ESCENARIO.tarima;
  if (!q || cine.toma === 'general') {
    const p = ESCENARIO.local(0, 10.5);
    cine.pos.set(p.x, 4.2, p.z); cine.look.set(T.x, 1.6, T.z); cine.k = 2; return;
  }
  if (cine.toma === 'jurado') {
    // desde la tarima (más adelante quedaba detrás de las mascotas que esperan junto al escalón)
    const Jd = ESCENARIO.jurado, p = ESCENARIO.local(-2, -0.5);
    cine.pos.set(p.x, 2.6, p.z); cine.look.set((Jd[0].x + Jd[2].x) / 2, 1.2, (Jd[0].z + Jd[2].z) / 2); cine.k = 2; return;
  }
  const y = sueloEn(q.x, q.z), f = q.facing, dx = Math.sin(f), dz = Math.cos(f), sx = Math.cos(f), sz = -Math.sin(f);
  const poner = (adelante, lado, alto, mira, k = 2.4) => {
    cine.pos.set(q.x + dx * adelante + sx * lado, y + alto, q.z + dz * adelante + sz * lado);
    cine.look.set(q.x, y + mira, q.z); cine.k = k;
  };
  if (cine.toma === 'cerca') poner(3.2, 0.5, 1.7, 1.3);
  else if (cine.toma === 'abajo') poner(2.1, -0.6, 0.28, 1.5);                  // desde el suelo de la tarima, mirando hacia arriba
  else if (cine.toma === 'lado') poner(0.7, 2.7, 1.2, 1.1);
  else if (cine.toma === 'ganador') poner(3.2, 0.8, 1.7, 1.2);
  else if (cine.toma === 'orbita') {                                           // girando alrededor
    const a = f + cine.t * 0.55, r = 3.0;
    cine.pos.set(q.x + Math.sin(a) * r, y + 1.9, q.z + Math.cos(a) * r); cine.look.set(q.x, y + 1.0, q.z); cine.k = 4;
  }
}

function avanzar(dt) {
  const S = show;
  if (S.i < 0 || S.t >= S.pasos[S.i].dur) {
    if (S.i >= 0 && S.pasos[S.i].fin) S.pasos[S.i].fin();
    S.i++; S.t = 0;
    if (S.i >= S.pasos.length) { show = null; ESCENARIO.medidor = null; descanso = DESCANSO; return; }
    if (S.pasos[S.i].inicio) S.pasos[S.i].inicio();
  }
  const p = S.pasos[S.i];
  S.t += dt;
  const u = Math.min(1, S.t / p.dur);
  if (p.cada) p.cada(dt, u);
  if (S.jugadora && p.toma) {
    const toma = typeof p.toma === 'function' ? p.toma(u) : p.toma;
    if (toma !== cine.toma || p.objetivo !== cine.objetivo) { cine.toma = toma; cine.objetivo = p.objetivo || null; cine.t = 0; }
  }
}
// sentarse en las graderías empieza una competencia (si no hay una en curso)
ESCENARIO.gradas.alSentarse = empezarCompetencia;

// (para las pruebas: en qué va, y acelerarla)
const competencia = {
  enCurso: () => !!show,
  hechas: () => hechas,
  jugando: () => !!J,
  toma: () => (cam.cine ? cine.toma : null),
  concursantes: () => concursantes.map(q => ({ nombre: q.nombre, anim: q.ch.sp && q.ch.sp.name, x: q.x, z: q.z, id: q.ch.root.uuid })),
  rapido(v) { velocidad = v; },
};

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

export { cancelarCompetir, competencia, competir, crearPublico, lookPublico, pistasEscenario, updatePublico };
