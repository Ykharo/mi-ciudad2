// La jugadora: movimiento, saltar, bancas y helado.
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { clamp, lerpAngle, pick } from '../core/math.js';
import { collide } from '../world/physics.js';
import { onZoneAction } from '../world/zones.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { setHolding } from '../characters/props.js';
import { cam, input, player } from './actors.js';
import { npcs } from './npcs.js';

const PLAYER_SPEED = 4.8;
function updatePlayer(dt) {
  const ch = player.ch;
  let jx = 0, jy = 0;
  if (state.mode === 'play') {
    jx = input.jx; jy = input.jy;
    const k = input.keys;
    const kx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    const ky = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (kx || ky) { const l = Math.hypot(kx, ky); jx = kx / l; jy = ky / l; }
  }
  let mag = Math.hypot(jx, jy);
  // (la zona muerta del joystick la maneja ui/joystick.js; desde ahí la palanca da 0,1–0,27 caminando y hasta 1 corriendo)
  if (mag < 0.02) { jx = jy = 0; mag = 0; } else if (mag > 1) { jx /= mag; jy /= mag; }
  // moverse deja lo que estaba haciendo (sentada, bailando, saludando…)
  if (mag > 0 && ((ch.sp && ch.sp.stopOnMove) || (player.seat && !player.seat.fijo))) { avatarStop(ch); standUp(); }
  const palanca = [jx, jy];   // para los juegos que se manejan con la palanca (el columpio)
  if (player.seat) { jx = jy = 0; mag = 0; }
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  const dx = rx * jx - fx * jy, dz = rz * jx - fz * jy;
  // lanzada desde un juego (saltar del columpio): en el aire casi no frena
  const acc = 1 - Math.exp(-dt * (player.lanzada && player.air ? 0.6 : mag > 0 ? 10 : 12));
  player.vel.x += (dx * PLAYER_SPEED - player.vel.x) * acc;
  player.vel.z += (dz * PLAYER_SPEED - player.vel.z) * acc;
  if (!player.seat) {
    player.pos.x += player.vel.x * dt; player.pos.z += player.vel.z * dt;
    collide(player.pos, 0.5);
    for (const n of npcs) { // gently step around neighbours
      const ex = player.pos.x - n.pos.x, ez = player.pos.z - n.pos.z, d = Math.hypot(ex, ez);
      if (d < 0.9 && d > 1e-4) { player.pos.x += ex / d * (0.9 - d); player.pos.z += ez / d * (0.9 - d); }
    }
    player.pos.x = clamp(player.pos.x, -73, 73); player.pos.z = clamp(player.pos.z, -73, 73);
  }
  const sp = player.seat ? 0 : Math.hypot(player.vel.x, player.vel.z);
  if (sp > 0.4 && state.mode === 'play') player.facing = lerpAngle(player.facing, Math.atan2(player.vel.x, player.vel.z), 1 - Math.exp(-dt * 12));
  if (input.jump && !player.air && !player.seat && state.mode === 'play') {
    player.vy = 8.2; player.air = true; emit('sonido', 'jump');
    avatarDo(ch, 'jump', { start: 0.36, ts: 0.75, stopOnMove: false });
  } else if (input.jump && player.seat && player.seat.saltar && state.mode === 'play') player.seat.saltar();
  input.jump = false;
  if (ch.sp && ch.sp.name === 'walk_back' && !player.seat) {   // retrocede a la velocidad de la animación
    const v = 0.32 * ch.k; player.pos.x -= Math.sin(player.facing) * v * dt; player.pos.z -= Math.cos(player.facing) * v * dt;
    collide(player.pos, 0.5); player.pos.x = clamp(player.pos.x, -73, 73); player.pos.z = clamp(player.pos.z, -73, 73);
  }
  if (player.air) { player.vy -= 24 * dt; player.y += player.vy * dt; if (player.y <= 0) { player.y = 0; player.vy = 0; player.air = false; player.lanzada = false; } }
  player.speed01 = clamp(sp / PLAYER_SPEED, 0, 1);
  player.happy = Math.max(0, player.happy - dt);
  if (player.iceTime > 0) { player.iceTime -= dt; if (player.iceTime <= 0) setHolding(ch, null); }
  // sentada: en una banca (quieta) o en un juego que se mueve (S.mover la pone en su lugar, game/juegos.js)
  if (player.seat) { const S = player.seat; if (S.mover) S.mover(dt, ...palanca); else { ch.root.position.set(S.x, S.y, S.z); ch.root.rotation.set(0, S.facing, 0); } }
  else { ch.root.position.set(player.pos.x, player.y, player.pos.z); ch.root.rotation.set(0, player.facing, 0); }
  updateAvatar(ch, dt, sp, player.happy > 0 ? 'feliz' : null);
}
// sentarse en una banca del parque (la animación "sit" es en el suelo: la banca la levanta)
function sitOnBench(b) {
  if (state.mode !== 'play' || player.air) return;
  const k = player.ch.k, fx = Math.sin(b.ry), fz = Math.cos(b.ry);
  player.seat = { x: b.x + fx * (0.05 + 0.10 * k), y: 0.72 - 0.158 * k, z: b.z + fz * (0.05 + 0.10 * k), facing: b.ry };
  player.vel.set(0, 0, 0); player.pos.set(b.x + fx * 1.1, 0, b.z + fz * 1.1); player.facing = b.ry;
  avatarDo(player.ch, 'sit', { start: 0.95, ts: 1.2 });
  emit('zona', null); state.currentZone = null; emit('sonido', 'pop');
}
// pararse; un juego puede dejarla en otro lugar al bajarse (S.salir)
function standUp() { const S = player.seat; if (!S) return; player.seat = null; if (S.salir) S.salir(); }

const FLAVORS = [['#FF9CC7', 'frutilla'], ['#7A4A30', 'chocolate'], ['#8FE3C5', 'menta'], ['#FFF5DE', 'vainilla'], ['#B89CFF', 'mora'], ['#FFD23F', 'mango']];
function giveIceCream() {
  const [c, n] = pick(FLAVORS);
  setHolding(player.ch, c);
  player.iceTime = 45; player.happy = 0.6; emit('sonido', 'adopt');
  emit('aviso', `¡Mmm! Un helado de ${n}`);
}

onZoneAction('bench', z => sitOnBench(z.bench));
onZoneAction('icecream', giveIceCream);

export { standUp, updatePlayer };
