// Juegos de la plaza y del parque: carrusel, columpios, sube y baja, cama elástica y tobogán.
// El lugar (world/places/) pone una zona { id: 'juego', juego } y en `juego` los puntos donde va la jugadora:
// objetos vacíos ("anclas") que se mueven con el juego. Un ancla marca dónde van las caderas, y su +z hacia dónde mira.
//   { tipo: 'asiento', asientos: [ancla…] }                sentarse en el asiento más cercano (carrusel, columpio,
//                                                           sube y baja); el juego se mueve más con alguien arriba
//   { tipo: 'cama', centro: ancla }                         saltar en la cama elástica
//   { tipo: 'tobogan', arriba: ancla, abajo: ancla, salida: ancla }   tirarse por el tobogán
// Opcional: `vista`, el giro de la cámara al subirse (cam.yaw: 0 = la cámara al lado +z de la jugadora).
// `juego.ocupado` lo pone este módulo (el ancla del asiento que se usa, o true; false al bajarse): el lugar lo lee
// para moverse distinto mientras alguien juega. Las anclas se crean con `ancla()` de world/place.js.
// Para bajarse basta moverse (el tobogán no: termina solo).
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide } from '../world/physics.js';
import { onZoneAction } from '../world/zones.js';
import { avatarDo, avatarStop } from '../characters/animator.js';
import { cam, player } from './actors.js';

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

function asiento(juego) {
  const ch = player.ch;
  let ancla = null, mejor = Infinity;
  for (const a of juego.asientos) { a.getWorldPosition(_p); const d = Math.hypot(_p.x - player.pos.x, _p.z - player.pos.z); if (d < mejor) { mejor = d; ancla = a; } }
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

const ESPERA = 0.45, BAJADA = 1.25;   // segundos arriba antes de tirarse y bajando
function tobogan(juego) {
  const ch = player.ch;
  let t = 0;
  avatarDo(ch, 'sit', { start: 0.95, ts: 1.2, stopOnMove: false });
  const arriba = new THREE.Vector3(), abajo = new THREE.Vector3();
  juego.arriba.getWorldPosition(arriba); juego.abajo.getWorldPosition(abajo);
  empezar(juego, {
    fijo: true,
    mover(dt) {
      t += dt;
      const s = Math.min(1, Math.max(0, t - ESPERA) / BAJADA), e = s * s;   // acelera al bajar
      sentarEn(ch, juego.arriba);   // la orientación de la rampa
      ch.root.position.add(_p.copy(abajo).sub(arriba).multiplyScalar(e));
      player.pos.x = ch.root.position.x; player.pos.z = ch.root.position.z;
      if (t >= ESPERA && t - dt < ESPERA) emit('sonido', 'jump');
      if (s >= 1) { avatarStop(ch); player.seat.salir(); player.seat = null; player.happy = 1.5; emit('sonido', 'adopt'); }
    },
    alSalir() { juego.salida.getWorldPosition(_p); bajarEn(_p.x, _p.z, mirada(juego.salida)); },
  });
  player.seat.mover(0);
}

const TIPOS = { asiento, cama, tobogan };
onZoneAction('juego', z => {
  if (state.mode !== 'play' || player.air || player.seat) return;
  const f = TIPOS[z.juego.tipo]; if (f) f(z.juego);
});
