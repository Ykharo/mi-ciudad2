// Fila de mascotas que sigue a su dueña.
import { clamp, lerpAngle } from '../core/math.js';
import { emit } from '../core/events.js';
import { labelSprite } from '../engine/textures.js';
import { collide, sueloSuave } from '../world/physics.js';
import { animatePet, letreroMascota } from './models.js';
import { roerHueso } from './hueso.js';
import { saltoMascota } from './ropa.js';

const conHueso = p => !!(p.cosas && p.cosas.includes('hueso') && !p.obj.siempreSentada);   // (no en la burbuja ni el globo)

// Mientras la dueña no se mueve (`ocio`), cada mascota pasa por su ciclo de espera: parada esperando, se sienta, se
// acuesta, se aburre y salta alrededor de la dueña con su voz, y vuelve a empezar. Los segundos de cada parte
// dependen de la especie (el gato duerme más y juega menos, el conejo juega más). Con sueño (`estado.energia` baja)
// no se levanta a jugar; aburrida (`estado.diversion` baja) está menos rato sentada antes de pedir que jueguen con
// ella. Antes de sentarse espera siempre al menos 30 s parada (el reposo no empieza de inmediato).
// Con la dueña sentada o acostada (`ocio = 'descansa'`): sólo se sienta y después se acuesta.
// `p.ocio = { fase, t, vueltas }` lo lee la ficha (game/fichas.js); `vueltas` (ciclos completos) el reposo de la
// dueña (game/reposo.js), que empieza cuando la mascota terminó uno.
const CICLOS = {
  perro: { espera: 30, sentada: 8, acostada: 10, juega: 6, voz: 'guau', texto: '¡Guau!', giro: 2.4 },
  gato: { espera: 35, sentada: 10, acostada: 16, juega: 4, voz: 'miau', texto: '¡Miau!', giro: 1.8 },
  conejo: { espera: 30, sentada: 6, acostada: 8, juega: 7, voz: 'conejo', texto: '¡Ñiqui!', giro: 2.6 },
  unicornio: { espera: 32, sentada: 8, acostada: 10, juega: 5, voz: 'relincho', texto: '¡Hiii!', giro: 2.0 },
};
const ORDEN = ['espera', 'sentada', 'acostada', 'juega'];
// la voz de la mascota: la de su especie, o la de la poción de voz que tenga (pato, león, vaca)
const VOCES = { pato: { voz: 'pato', texto: '¡Cuac cuac!' }, leon: { voz: 'leon', texto: '¡Grrroar!' }, vaca: { voz: 'vaca', texto: '¡Muuu!' } };
export function vozDe(p) {
  const v = p.obj && p.obj.extras && VOCES[p.obj.extras.voz], C = CICLOS[p.kind] || CICLOS.perro;
  return v || { voz: C.voz, texto: C.texto };
}
function avanzarOcio(p, dt, ocio) {
  const C = CICLOS[p.kind] || CICLOS.perro, O = p.ocio || (p.ocio = { fase: 'espera', t: 0 });
  O.t += dt;
  const E = p.estado || {}, sueno = E.energia < 25, aburrida = E.diversion < 40;
  const dur = f => (ocio === 'descansa' ? { espera: 1.5, sentada: 6, acostada: Infinity }[f]
    : f === 'acostada' && sueno ? Infinity : f === 'sentada' && aburrida ? C[f] * 0.5 : C[f]);   // (espera siempre lo suyo: al menos 30 s parada)
  if (O.fase === 'juega' && ocio === 'descansa') { O.fase = 'sentada'; O.t = 0; }
  if (O.t >= dur(O.fase)) {
    if (O.fase === 'juega') O.vueltas = (O.vueltas || 0) + 1;   // terminó un ciclo (después empieza el reposo de la dueña)
    O.fase = ORDEN[(ORDEN.indexOf(O.fase) + 1) % ORDEN.length]; O.t = 0; O.ladra = 0.6;
  }
  return C;
}
// Pedir atención: da la vuelta alrededor de la dueña saltando de lado, siempre mirándola. Recorre medio círculo a
// saltitos, se detiene un momento a hacer su voz (con un salto y un globito) y sigue —a veces se devuelve— hasta que
// termina esta parte del ciclo. También hace su voz de vez en cuando mientras salta.
const SALTITO = 0.36;   // cada salto de lado (segundos)
function jugarAlrededor(p, i, C, leader, dt) {
  const O = p.ocio, P = p.obj;
  if (O.ang === undefined) { O.ang = Math.atan2(p.pos.x - leader.x, p.pos.z - leader.z) + i * Math.PI; O.dir = 1; O.recorre = 0; O.pausa = 0; O.h = 0; }
  const R = 1.4 + i * 0.5;
  let y = 0, quieta = false;
  const V = vozDe(p), ladrar = () => { O.ladra = 1.3; emit('sonido', V.voz); saltoMascota(P); };
  if (O.pausa > 0) {   // detenida mirándola: un salto en el lugar con su voz
    O.pausa -= dt; quieta = true;
    y = Math.sin(Math.PI * Math.min(1, (0.9 - O.pausa) / 0.4)) * 0.22 * (O.pausa > 0.5 ? 1 : 0);
  } else {
    // a saltitos: avanza sólo mientras está en el aire
    O.h += dt / SALTITO;
    const aire = Math.sin(Math.PI * (O.h % 1)), paso = C.giro / R * dt * 1.6 * aire;
    O.ang += O.dir * paso; O.recorre += paso;
    y = aire * 0.16;
    if (O.recorre >= Math.PI) { O.recorre = 0; O.pausa = 0.9; ladrar(); if (Math.random() < 0.5) O.dir = -O.dir; }
  }
  const tx = leader.x + Math.sin(O.ang) * R, tz = leader.z + Math.cos(O.ang) * R, dx = tx - p.pos.x, dz = tz - p.pos.z, d = Math.hypot(dx, dz);
  if (d > 0.01) { const step = Math.min(d, 6 * dt); p.pos.x += dx / d * step; p.pos.z += dz / d * step; }
  collide(p.pos, 0.35);
  p.facing = lerpAngle(p.facing, Math.atan2(leader.x - p.pos.x, leader.z - p.pos.z), 1 - Math.exp(-dt * 12));   // siempre mirándola
  O.ladra -= dt;
  if (O.ladra <= -1.2 && !quieta) ladrar();
  // (el globito con su voz; se rehace si cambió de voz con una poción)
  if (P.voz && P.voz.userData.texto !== V.texto) { P.root.remove(P.voz); P.voz = null; }
  if (!P.voz) { P.voz = letreroMascota(P, labelSprite(V.texto, { scale: 0.0036, bubble: true })); P.voz.userData.texto = V.texto; }
  P.voz.visible = O.ladra > 0.6; P.voz.position.y = P.labelY + 0.45;
  // (salta de lado: las patas sin el paso de caminar; el salto lo da `y`)
  return { moved: 0, y };
}

// `sentadas`: si la dueña está sentada (banca, graderías, un juego), las que llegan a su lado se sientan.
// `ocio`: null (la dueña se mueve), 'quieta' o 'descansa' (ver arriba); sólo para las mascotas de la jugadora
function followChain(list, leaderPos, dt, t, firstGap = 1.7, sentadas = false, ocio = null) {
  let leader = leaderPos;
  list.forEach((p, i) => {
    const dx = leader.x - p.pos.x, dz = leader.z - p.pos.z, d = Math.hypot(dx, dz);
    const want = i === 0 ? firstGap : 1.35;
    let moved = 0, y = 0, pose = sentadas;
    const cerca = d < want + 0.6 || (p.ocio && Math.hypot(leaderPos.x - p.pos.x, leaderPos.z - p.pos.z) < 5);
    const C = ocio && cerca ? avanzarOcio(p, dt, ocio) : null;
    if (!C) p.ocio = null;
    if (p.obj.voz && (!C || p.ocio.fase !== 'juega')) p.obj.voz.visible = false;
    if (C && p.ocio.fase === 'juega') ({ moved, y } = jugarAlrededor(p, i, C, leaderPos, dt));
    else {
      if (d > 30) { p.pos.set(leader.x - dx / d * want, 0, leader.z - dz / d * want); }
      else if (d > want) { const step = Math.min(d - want, Math.min(26, Math.max(d > 5 ? 13 : 8.5, (d - want) * 3.2)) * dt); p.pos.x += dx / d * step; p.pos.z += dz / d * step; moved = step / Math.max(dt, 1e-4); }
      collide(p.pos, 0.35);
      if (d > 0.05) p.facing = lerpAngle(p.facing, Math.atan2(dx, dz), 1 - Math.exp(-dt * 8));
      if (C) pose = p.ocio.fase === 'acostada' ? 'acostada' : p.ocio.fase === 'sentada' || (sentadas && moved < 0.5);
      else pose = sentadas && moved < 0.5;
    }
    p.obj.root.position.set(p.pos.x, y + sueloSuave(p, p.pos.x, p.pos.z, dt), p.pos.z); p.obj.root.rotation.y = p.facing;
    animatePet(p.obj, t + i, clamp(moved / 5, 0, 3), dt, pose);
    roerHueso(p.obj, conHueso(p) && !!pose && moved < 0.5, t + i, dt);   // (sentada o acostada: saca su hueso)
    leader = p.pos;
  });
}

// Esperar en un lugar (cuando la dueña sube a una tarima: world/physics.js, piso con `espera`; o sentadas a su lado en
// las graderías): caminan hasta el punto, se ponen en fila hacia el costado y se sientan mirando hacia `mira`.
// Con `y` (un escalón): al llegar suben de un salto a esa altura (sin chocar con el escalón).
// `descansa`: la dueña está sentada a su lado: después de un rato sentadas, se acuestan.
function waitAt(list, punto, dt, t, descansa = false) {
  // la fila: hacia el costado de quien mira hacia `mira`, centrada en el punto; o desde el punto hacia `dir`
  const lx = punto.dir ? punto.dir.x : Math.cos(punto.mira), lz = punto.dir ? punto.dir.z : -Math.sin(punto.mira);
  list.forEach((p, i) => {
    const off = punto.dir ? i * 0.7 :(i - (list.length - 1) / 2) * 1.0, tx = punto.x + lx * off, tz = punto.z + lz * off;
    const dx = tx - p.pos.x, dz = tz - p.pos.z, d = Math.hypot(dx, dz);
    let moved = 0;
    if (d > 30) p.pos.set(tx, 0, tz);
    else if (d > 0.05) { const step = Math.min(d, (d > 3 ? 9 : 5) * dt); p.pos.x += dx / d * step; p.pos.z += dz / d * step; moved = step / Math.max(dt, 1e-4); }
    if (!punto.y) collide(p.pos, 0.35);
    p.facing = lerpAngle(p.facing, d > 0.4 ? Math.atan2(dx, dz) : punto.mira, 1 - Math.exp(-dt * 6));
    const y = punto.y ? punto.y * clamp(1 - (d - 0.1) / 1.2, 0, 1) + Math.sin(Math.PI * clamp(1 - (d - 0.1) / 1.2, 0, 1)) * 0.25 : sueloSuave(p, p.pos.x, p.pos.z, dt);
    p.obj.root.position.set(p.pos.x, y, p.pos.z); p.obj.root.rotation.y = p.facing;
    if (p.obj.voz) p.obj.voz.visible = false;
    if (descansa && d < 0.4) avanzarOcio(p, dt, 'descansa'); else p.ocio = null;
    animatePet(p.obj, t + i, clamp(moved / 5, 0, 3), dt, p.ocio && p.ocio.fase === 'acostada' ? 'acostada' : d < 0.4);
    roerHueso(p.obj, conHueso(p) && d < 0.4, t + i, dt);
  });
}

export { followChain, waitAt };
