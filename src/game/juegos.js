// Juegos de la plaza y del parque: carrusel, columpios, sube y baja, cama elástica y tobogán.
// El lugar (world/places/) pone una zona { id: 'juego', juego } y en `juego` los puntos donde va la jugadora:
// objetos vacíos ("anclas") que se mueven con el juego. Un ancla marca dónde van las caderas, y su +z hacia dónde mira.
//   { tipo: 'asiento', asientos: [ancla…] }                sentarse en el asiento más cercano (carrusel, sube y
//                                                           baja, graderías: `asientos` por opción { adelante: […] })
//   { tipo: 'cama', centro: ancla }                         saltar en la cama elástica
//   { tipo: 'tobogan', escalera, arriba, abajo, salida: ancla }   subir por la escalera y tirarse por el tobogán
//   { tipo: 'columpio', asientos: [ancla…] }                columpiarse impulsándose con la palanca (ver columpio())
// Opcional: `vista`, el giro de la cámara al subirse (cam.yaw: 0 = la cámara al lado +z de la jugadora).
// `juego.ocupado` lo pone este módulo (el ancla del asiento que se usa, o true; false al bajarse): el lugar lo lee
// para moverse distinto mientras alguien juega. Las anclas se crean con `ancla()` de world/place.js.
// Para bajarse basta moverse (el tobogán no: termina solo; del columpio se salta).
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide } from '../world/physics.js';
import { onZoneAction } from '../world/zones.js';
import { avatarDo, avatarStop } from '../characters/animator.js';
import { cam, player } from './actors.js';
import { standUp } from './player.js';

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _o = new THREE.Vector3(), _f = new THREE.Vector3();
// la pose final de "sit" deja las caderas 0,158 m arriba y 0,10 m atrás de la raíz (por la escala del personaje)
function sentarEn(ch, ancla, alto = 0) {
  ancla.getWorldPosition(_p); ancla.getWorldQuaternion(_q);
  _o.set(0, -0.158 * ch.k + alto, 0.10 * ch.k).applyQuaternion(_q);
  ch.root.position.copy(_p).add(_o); ch.root.quaternion.copy(_q);
  player.pos.x = _p.x; player.pos.z = _p.z;   // la cámara y las mascotas la siguen
}
function mirada(ancla) { ancla.getWorldQuaternion(_q); _f.set(0, 0, 1).applyQuaternion(_q); return Math.atan2(_f.x, _f.z); }
// al bajarse: parada junto al juego (collide la saca de su caja)
function bajarEn(x, z, facing) {
  player.pos.set(x, 0, z); player.vel.set(0, 0, 0); player.y = 0; player.air = false;
  collide(player.pos, 0.5); player.facing = facing;
  player.ch.root.rotation.set(0, facing, 0);
}
function empezar(juego, seat, ancla) {
  juego.ocupado = ancla || true;
  player.vel.set(0, 0, 0);
  if (juego.vista !== undefined) cam.yaw = juego.vista;   // desde dónde se ve mejor (la cámara se acomoda sola)
  player.seat = Object.assign(seat, {
    salir() { juego.ocupado = false; if (seat.alSalir) seat.alSalir(); },
  });
  emit('zona', null); state.currentZone = null; emit('sonido', 'pop');
}

// `asientos` puede ser una lista o, si la zona tiene opciones, una lista por opción (ej. graderías: 'adelante' y
// 'arriba'); se sienta en el más cercano
function asiento(juego, opcion) {
  const ch = player.ch, A = juego.asientos;
  const lista = Array.isArray(A) ? A : A[opcion] || Object.values(A)[0];
  let ancla = null, mejor = Infinity;
  for (const a of lista) { a.getWorldPosition(_p); const d = Math.hypot(_p.x - player.pos.x, _p.z - player.pos.z); if (d < mejor) { mejor = d; ancla = a; } }
  avatarDo(ch, 'sit', { start: 0.95, ts: 1.2 });
  empezar(juego, {
    mover() { sentarEn(ch, ancla); },
    alSalir() { ancla.getWorldPosition(_p); bajarEn(_p.x, _p.z, mirada(ancla)); },
  }, ancla);
  sentarEn(ch, ancla);
  player.happy = 0.8;
}

const BOTE = 0.9, ALTURA = 1.2;   // segundos por bote y metros de alto
function cama(juego) {
  const ch = player.ch;
  let t = 0, bote = -1;
  empezar(juego, {
    mover(dt) {
      t += dt;
      const n = Math.floor(t / BOTE), f = t / BOTE - n;
      if (n !== bote) { bote = n; avatarDo(ch, 'jump', { start: 0.36, ts: 0.75, stopOnMove: false }); emit('sonido', 'jump'); }
      juego.centro.getWorldPosition(_p);
      ch.root.position.set(_p.x, _p.y + 4 * ALTURA * f * (1 - f), _p.z); ch.root.rotation.set(0, player.facing, 0);
      player.pos.x = _p.x; player.pos.z = _p.z; player.happy = 0.5;
    },
    alSalir() { juego.centro.getWorldPosition(_p); bajarEn(_p.x + Math.sin(player.facing) * 2.6, _p.z + Math.cos(player.facing) * 2.6, player.facing); },
  });
}

// El tobogán: sube por la escalera (animación "subir_escalera", cuyo ciclo sube un peldaño: las medidas son las de
// tools/animaciones/juegos.mjs), pasa a sentarse arriba de la rampa con los brazos arriba ("tobogan"), se tira
// acelerando y queda parada abajo. `juego.escalera`: el ancla al pie de la escalera, mirándola.
const ESCALERA = { ciclo: 0.8, peldano: 0.45, inicio: 0.49 - 0.18 * 1.4, ciclos: 4 };   // inicio: el pie en el 1.er peldaño
const PASO = 0.2, ARRIBA = 0.7, ESPERA = 0.35, BAJADA = 1.25;   // segundos: pisar el 1.er peldaño, pasar a la rampa…
// De pie (opción 'de_pie'): arriba se para sobre la rampa (`juego.pieArriba`) y baja derecha hasta `pieAbajo`, con
// "tobogan_de_pie".
function tobogan(juego, opcion) {
  const ch = player.ch, k = ch.k / 1.4;   // la animación está hecha para la escala de Nina
  const subida = ESCALERA.ciclo * ESCALERA.ciclos, fin = subida + ARRIBA, dePie = opcion === 'de_pie';
  let t = 0, sentada = false;
  avatarDo(ch, 'subir_escalera', { loop: true, stopOnMove: false, instant: false });
  const arriba = new THREE.Vector3(), abajo = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
  (dePie ? juego.pieArriba : juego.arriba).getWorldPosition(arriba); (dePie ? juego.pieAbajo : juego.abajo).getWorldPosition(abajo);
  juego.escalera.getWorldPosition(p0); juego.escalera.getWorldQuaternion(q0);
  const alto = s => (ESCALERA.inicio * Math.min(1, s / PASO) + ESCALERA.peldano * s / ESCALERA.ciclo) * k;
  empezar(juego, {
    fijo: true,
    mover(dt) {
      t += dt;
      if (t < subida) {   // trepando
        ch.root.position.copy(p0).y += alto(t); ch.root.quaternion.copy(q0);
      } else if (t < fin) {   // de la escalera a sentarse arriba de la rampa, con un saltito
        if (!sentada) {
          sentada = true;
          avatarDo(ch, dePie ? 'tobogan_de_pie' : 'tobogan', { loop: true, stopOnMove: false });
          if (dePie) { p1.copy(arriba); juego.pieArriba.getWorldQuaternion(q1); } else { sentarEn(ch, juego.arriba); p1.copy(ch.root.position); q1.copy(ch.root.quaternion); }
        }
        const u = (t - subida) / ARRIBA, e = u * u * (3 - 2 * u);
        ch.root.position.copy(p0).setY(p0.y + alto(subida)).lerp(p1, e).y += 0.3 * Math.sin(Math.PI * u);
        ch.root.quaternion.copy(q0).slerp(q1, e);
      } else {   // espera un poquito y se tira
        const s = Math.min(1, Math.max(0, t - fin - ESPERA) / BAJADA), e = s * s;   // acelera al bajar
        if (dePie) { ch.root.position.copy(arriba).lerp(abajo, e); ch.root.quaternion.copy(q1); }
        else { sentarEn(ch, juego.arriba); ch.root.position.add(_p.copy(abajo).sub(arriba).multiplyScalar(e)); }   // con la inclinación de la rampa
        if (t >= fin + ESPERA && t - dt < fin + ESPERA) emit('sonido', 'jump');
        if (s >= 1) { avatarStop(ch); player.seat.salir(); player.seat = null; player.happy = 1.5; emit('sonido', 'adopt'); return; }
      }
      player.pos.x = ch.root.position.x; player.pos.z = ch.root.position.z;
    },
    alSalir() { juego.salida.getWorldPosition(_p); bajarEn(_p.x, _p.z, mirada(juego.salida)); },
  });
  player.seat.mover(0);
}

// El columpio, con física de péndulo (la simula el lugar: world/places/park.js). La palanca vertical impulsa:
// adelante estira las piernas y echa el cuerpo atrás, atrás las recoge; a tiempo con el columpio lo hace subir más, a
// destiempo lo frena. La animación "columpio" no se reproduce: su momento (0 recogida … 1 estirada) sigue al impulso.
// Para bajarse: saltar (sale volando con el impulso que lleva) o la palanca hacia el lado.
// De pie (opción 'de_pie'): parada sobre el asiento con "columpio_de_pie" (0 agachada … 1 parada empujando la cadera).
// En el ancla, el lugar pone `userData.angulo` y `userData.vel` (rad y rad/s, + hacia adelante) y `userData.largo`;
// este módulo pone `userData.impulso` (−1…1) y `userData.ocupado`.
const SOBRE_ASIENTO = 0.05;   // el ancla del columpio (las caderas, sentada) está 5 cm sobre el asiento
function pararEn(ch, ancla) {
  ancla.getWorldPosition(_p); ancla.getWorldQuaternion(_q);
  ch.root.position.copy(_p).add(_o.set(0, -SOBRE_ASIENTO, 0).applyQuaternion(_q)); ch.root.quaternion.copy(_q);
  player.pos.x = _p.x; player.pos.z = _p.z;
}
function columpio(juego, opcion) {
  const ch = player.ch, dePie = opcion === 'de_pie', anim = dePie ? 'columpio_de_pie' : 'columpio', poner = dePie ? pararEn : sentarEn;
  let ancla = null, mejor = Infinity;
  for (const a of juego.asientos) { a.getWorldPosition(_p); const d = Math.hypot(_p.x - player.pos.x, _p.z - player.pos.z); if (d < mejor) { mejor = d; ancla = a; } }
  avatarDo(ch, anim, { hold: true, stopOnMove: false });
  let pose = 0.5;
  const S = ancla.userData;
  S.ocupado = true;
  empezar(juego, {
    fijo: true,
    mover(dt, jx = 0, jy = 0) {
      const empuje = Math.abs(jy) > 0.12 ? Math.max(-1, Math.min(1, -jy * 1.3)) : 0;   // palanca arriba = adelante
      S.impulso = empuje;
      pose += (0.5 + 0.5 * empuje - pose) * Math.min(1, dt * 5);
      if (ch.sp && ch.sp.name === anim) { ch.sp.a.timeScale = 0; ch.sp.a.time = pose * ch.sp.a.getClip().duration; }
      poner(ch, ancla);
      player.happy = Math.abs(S.vel || 0) > 1 ? 0.3 : 0;
      if (Math.abs(jx) > 0.6 && Math.abs(jx) > Math.abs(jy)) { avatarStop(ch); standUp(); }   // palanca al lado: se baja
    },
    saltar() {
      // sale con la velocidad del asiento: tangente al arco del columpio
      const v = (S.vel || 0) * (S.largo || 2.2), a = S.angulo || 0, f = mirada(ancla);
      ancla.getWorldPosition(_p);
      const y = Math.max(0, ch.root.position.y);
      player.seat = null; juego.ocupado = false; S.impulso = 0; S.ocupado = false;
      player.pos.set(_p.x, 0, _p.z); player.facing = f; player.y = y;
      const adelante = Math.max(-7, Math.min(7, v * Math.cos(a)));
      player.vel.set(Math.sin(f) * adelante, 0, Math.cos(f) * adelante);
      player.vy = 5 + Math.max(0, v * Math.sin(a)); player.air = true; player.lanzada = true;
      avatarDo(ch, 'jump', { start: 0.36, ts: 0.75, stopOnMove: false });
      ch.root.rotation.set(0, f, 0);
      player.happy = 1.2; emit('sonido', 'jump');
    },
    alSalir() { S.impulso = 0; S.ocupado = false; ancla.getWorldPosition(_p); bajarEn(_p.x, _p.z, mirada(ancla)); },
  }, ancla);
  poner(ch, ancla);
  emit('aviso', '¡Mueve la palanca adelante y atrás a tiempo para columpiarte! Para bajarte, salta');
}

const TIPOS = { asiento, cama, tobogan, columpio };
// `opcion`: cuál de las `opciones` de la zona eligió (cada una tiene su botón; ej. 'sentada' o 'de_pie')
onZoneAction('juego', (z, opcion) => {
  if (state.mode !== 'play' || player.air || player.seat) return;
  const f = TIPOS[z.juego.tipo]; if (f) f(z.juego, opcion);
});
