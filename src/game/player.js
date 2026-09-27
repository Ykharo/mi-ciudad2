// La jugadora: movimiento, bancas y zonas.
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { clamp, lerpAngle } from '../core/math.js';
import { scene } from '../engine/renderer.js';
import { collide } from '../world/physics.js';
import { zones } from '../world/zones.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { setHolding } from '../characters/props.js';
import { buildPet, setPetName } from '../pets/models.js';
import { DEFAULT_CAR, fixCarSpec } from '../cars/catalog.js';
import { npcs } from './npcs.js';
import { nearestCar, updateCar } from '../cars/driving.js';
import { sfx } from '../audio/audio.js';
import { setActionButton } from '../ui/dom.js';

state.mode = 'intro'; // intro | play | pets | shop | drive
const ownedCars = [], MAX_CARS = 4;
state.lastCar = null; state.shopSpec = fixCarSpec(DEFAULT_CAR);
const player = { ch: null, pos: new THREE.Vector3(9, 0, -1.5), vel: new THREE.Vector3(), facing: Math.PI * 0.8, vy: 0, y: 0, air: false, phase: 0, speed01: 0, happy: 0, bonk: 0, iceTime: 0, seat: null, pets: [] };
const cam = { yaw: 0.35, pitch: 0.36, dist: 11.5, look: new THREE.Vector3(), pos: new THREE.Vector3(), menuYaw: 0 };
const input = { jx: 0, jy: 0, jump: false, keys: {} };
state.clock = 0;

function addPet(kind, color, name, pos) {
  const obj = buildPet(kind, color);
  setPetName(obj, name);
  scene.add(obj.root);
  const p = { kind, color, name, obj, pos: (pos || player.pos).clone(), facing: player.facing };
  if (!pos) { p.pos.x -= Math.sin(player.facing) * (1.6 + player.pets.length * 1.3); p.pos.z -= Math.cos(player.facing) * (1.6 + player.pets.length * 1.3); }
  player.pets.push(p);
  return p;
}

const PLAYER_SPEED = 4.8;
function updatePlayer(dt) {
  if (state.mode === 'drive') { updateCar(dt); return; }
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
  if (mag < 0.14) { jx = jy = 0; mag = 0; } else if (mag > 1) { jx /= mag; jy /= mag; }
  // moverse deja lo que estaba haciendo (sentada, bailando, saludando…)
  if (mag > 0 && ch.sp && ch.sp.stopOnMove) { avatarStop(ch); standUp(); }
  if (player.seat) { jx = jy = 0; mag = 0; }
  const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  const dx = rx * jx - fx * jy, dz = rz * jx - fz * jy;
  const acc = 1 - Math.exp(-dt * (mag > 0 ? 10 : 12));
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
    player.vy = 8.2; player.air = true; sfx('jump');
    avatarDo(ch, 'jump', { start: 0.36, ts: 0.75, stopOnMove: false });
  }
  input.jump = false;
  if (ch.sp && ch.sp.name === 'walk_back' && !player.seat) {   // retrocede a la velocidad de la animación
    const v = 0.32 * ch.k; player.pos.x -= Math.sin(player.facing) * v * dt; player.pos.z -= Math.cos(player.facing) * v * dt;
    collide(player.pos, 0.5); player.pos.x = clamp(player.pos.x, -73, 73); player.pos.z = clamp(player.pos.z, -73, 73);
  }
  if (player.air) { player.vy -= 24 * dt; player.y += player.vy * dt; if (player.y <= 0) { player.y = 0; player.vy = 0; player.air = false; } }
  player.speed01 = clamp(sp / PLAYER_SPEED, 0, 1);
  player.happy = Math.max(0, player.happy - dt);
  if (player.iceTime > 0) { player.iceTime -= dt; if (player.iceTime <= 0) setHolding(ch, null); }
  if (player.seat) { const S = player.seat; ch.root.position.set(S.x, S.y, S.z); ch.root.rotation.y = S.facing; }
  else { ch.root.position.set(player.pos.x, player.y, player.pos.z); ch.root.rotation.y = player.facing; }
  updateAvatar(ch, dt, sp, player.happy > 0 ? 'feliz' : null);
}
// sentarse en una banca del parque (la animación "sit" es en el suelo: la banca la levanta)
function sitOnBench(b) {
  if (state.mode !== 'play' || player.air) return;
  const k = player.ch.k, fx = Math.sin(b.ry), fz = Math.cos(b.ry);
  player.seat = { x: b.x + fx * (0.05 + 0.10 * k), y: 0.72 - 0.158 * k, z: b.z + fz * (0.05 + 0.10 * k), facing: b.ry };
  player.vel.set(0, 0, 0); player.pos.set(b.x + fx * 1.1, 0, b.z + fz * 1.1); player.facing = b.ry;
  avatarDo(player.ch, 'sit', { start: 0.95, ts: 1.2 });
  setActionButton(null); state.currentZone = null; sfx('pop');
}
function standUp() { if (!player.seat) return; player.seat = null; }
state.currentZone = null;
function updateZones() {
  let found = null;
  if (state.mode === 'play' && !player.seat) for (const q of zones) if (Math.hypot(player.pos.x - q.x, player.pos.z - q.z) < q.r) { found = q; break; }
  if (state.mode === 'play' && !found) { const c = nearestCar(1.5); if (c) found = c.zone; }
  if (found !== state.currentZone) { state.currentZone = found; setActionButton(found); }
}

export { MAX_CARS, addPet, cam, input, ownedCars, player, sitOnBench, standUp, updatePlayer, updateZones };
