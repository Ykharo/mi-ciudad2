// Manejar: subirse, bajarse, conducir y llamar al auto.
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { clamp, lerp } from '../core/math.js';
import { scene } from '../engine/renderer.js';
import { collide } from '../world/physics.js';
import { _cp, carDist, carFitsAt, cars, syncCar } from './fleet.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { setHolding } from '../characters/props.js';
import { animatePet } from '../pets/models.js';
import { save } from '../game/save.js';
import { cam, input, ownedCars, player, standUp } from '../game/player.js';
import { npcs } from '../game/npcs.js';
import { sfx } from '../audio/audio.js';
import { setEngine, startEngine, stopEngine } from '../audio/engine.js';
import { gameEl, setActionButton, toast } from '../ui/dom.js';
import { joyHint } from '../ui/joystick.js';
import { setActMenu } from '../ui/action-menu.js';

/* ================= DRIVING ================= */
let driving = null;
const DRIVE = { rev: 5.5, brake: 22, drag: 3.2 };

function nearestCar(r) {
  let best = null, bd = r;
  for (const c of cars) { const d = carDist(c, player.pos.x, player.pos.z); if (d < bd) { bd = d; best = c; } }
  return best;
}
// put the character on the driver's seat, sitting down (pose final de "sit": caderas a 0,158 m, 0,10 m atrás)
function seatPlayer(c) {
  // el auto está achicado (M.k): Nina va dentro de su grupo, así que se compensa la escala
  const M = c.model, k = player.ch.k, ik = 1 / M.k;
  player.ch.root.scale.setScalar(ik);
  player.ch.root.position.set(M.seat.x, M.sy + (0.16 - 0.158 * k) * ik, M.seat.z + 0.1 * k * ik);
  player.ch.root.rotation.set(0, 0, 0);
}
// brazos al volante (encima de la pose sentada)
const _qa = new THREE.Quaternion(), _ea = new THREE.Euler();
function steerArms(ch, steer) {
  const b = ch.bones || (ch.bones = {});
  ['UpperArmL', 'UpperArmR', 'ForearmL', 'ForearmR'].forEach(n => { if (!b[n]) b[n] = ch.model.getObjectByName(n); });
  [['L', 1], ['R', -1]].forEach(([sd, s]) => {
    b['UpperArm' + sd].quaternion.slerp(_qa.setFromEuler(_ea.set(-1.05 + s * steer * 0.18, 0, 0)), 1);
    b['Forearm' + sd].quaternion.setFromEuler(_ea.set(-0.55, 0, 0));
  });
}
function enterCar(c) {
  if (state.mode !== 'play' || !c) return;
  setActMenu(false); driving = c; state.mode = 'drive';
  player.vel.set(0, 0, 0); player.air = false; player.y = 0;
  c.speed = 0; c.steer = 0;
  standUp(); setHolding(player.ch, player.ch.holding);
  c.shell.add(player.ch.root); seatPlayer(c);
  avatarDo(player.ch, 'sit', { start: 9, instant: true, stopOnMove: false });
  // the first pet hops into the passenger seat
  const M = c.model;
  if (M.passenger && player.pets.length) {
    const p = player.pets[0]; p.riding = c; c.shell.add(p.obj.root);
    p.obj.root.position.set(M.passenger.x, M.sy, M.passenger.z); p.obj.root.rotation.set(0, 0, 0); p.obj.root.scale.setScalar(1 / M.k);
  }
  if (c.owned) state.lastCar = c;
  gameEl.classList.add('driving'); setActionButton(null); state.currentZone = null;
  input.brake = false;
  cam.dist = Math.max(cam.dist, 10 + c.hl * 1.3);
  sfx('open'); startEngine();
  joyHint.textContent = '¡Maneja aquí!'; joyHint.hidden = false;
  setTimeout(() => { joyHint.hidden = true; }, 3500);
}
function spotIsFree(x, z) {
  _cp.set(x, 0, z); collide(_cp, 0.55);
  return Math.hypot(_cp.x - x, _cp.z - z) < 0.05 && Math.abs(x) < 73 && Math.abs(z) < 73;
}
function exitCar() {
  const c = driving; if (!c) return;
  const fx = Math.sin(c.heading), fz = Math.cos(c.heading), lx = Math.cos(c.heading), lz = -Math.sin(c.heading);
  const a = c.hw + 0.9, b = c.hl + 1.0;
  const tries = [[lx * a, lz * a], [-lx * a, -lz * a], [-fx * b, -fz * b], [fx * b, fz * b], [lx * (a + 1.2), lz * (a + 1.2)], [-lx * (a + 1.2), -lz * (a + 1.2)]];
  const spot = tries.find(([dx, dz]) => spotIsFree(c.x + dx, c.z + dz)) || tries[0];
  scene.add(player.ch.root); player.ch.root.scale.setScalar(1);
  player.pos.set(c.x + spot[0], 0, c.z + spot[1]); collide(player.pos, 0.5);
  player.ch.root.position.copy(player.pos); player.ch.root.rotation.set(0, c.heading, 0);
  player.facing = c.heading; player.happy = 0.8;
  avatarStop(player.ch, true);
  player.pets.forEach(p => {
    if (!p.riding) return;
    p.riding = null; scene.add(p.obj.root); p.obj.root.scale.setScalar(1);
    p.pos.set(player.pos.x - fx * 1.3, 0, player.pos.z - fz * 1.3); p.facing = c.heading;
  });
  c.speed = 0; c.steer = 0; c.wheels.forEach(w => { if (w.front) w.pivot.rotation.y = 0; });
  c.shell.rotation.set(0, 0, 0); c.shell.position.y = 0;
  const M = c.model;
  if (M.steerWheel) M.steerWheel.rotation.z = 0;
  if (M.sirens) M.sirens.forEach(m => { m.emissiveIntensity = 0.2; });
  driving = null; state.mode = 'play'; gameEl.classList.remove('driving');
  input.brake = false; stopEngine(); sfx('open');
  cam.yaw = player.facing + Math.PI;
  if (c.owned) { state.lastCar = c; save(); }
}

function updateCar(dt) {
  const c = driving, S = c.stats, M = c.model;
  let jx = input.jx, jy = input.jy;
  const k = input.keys;
  const kx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  const ky = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
  if (kx || ky) { jx = kx; jy = ky; }
  let mag = Math.min(1, Math.hypot(jx, jy));
  if (mag < 0.14) { jx = jy = 0; mag = 0; }
  const brake = input.brake || k.Space;
  // pushing up or sideways drives forward; pulling down brakes, then backs up
  const back = jy > 0.45 && Math.abs(jx) < 0.7;
  if (brake || back) {
    if (c.speed > 0.4) c.speed -= DRIVE.brake * dt;
    else c.speed = Math.max(-DRIVE.rev, c.speed - 6 * dt);
  } else if (mag > 0) {
    c.speed += (c.speed < 0 ? DRIVE.brake : S.acc * (c.speed > S.max * 0.66 ? 0.6 : 1)) * mag * dt;
  } else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), DRIVE.drag * dt);
  c.speed = clamp(c.speed, -DRIVE.rev, S.max * (mag > 0 || brake ? Math.max(0.35, mag) : 1));

  c.steer = lerp(c.steer, jx, 1 - Math.exp(-dt * 7));
  const grip = clamp(Math.abs(c.speed) / 4, 0, 1) * (c.speed >= 0 ? 1 : -1);
  c.heading -= c.steer * S.turn * grip * dt;

  c.x += Math.sin(c.heading) * c.speed * dt;
  c.z += Math.cos(c.heading) * c.speed * dt;
  // bump into houses, trees, other cars and neighbours (circles along the car)
  let px = 0, pz = 0;
  const fx = Math.sin(c.heading), fz = Math.cos(c.heading);
  for (const s of c.offs) {
    const ox = c.x + fx * s, oz = c.z + fz * s;
    _cp.set(ox, 0, oz); collide(_cp, c.cr, c.obs);
    px += _cp.x - ox; pz += _cp.z - oz;
  }
  for (const n of npcs) for (const s of c.offs) {
    const ox = c.x + fx * s, oz = c.z + fz * s, dx = ox - n.pos.x, dz = oz - n.pos.z, d = Math.hypot(dx, dz), R = c.cr + 0.45;
    if (d < R && d > 1e-4) { px += dx / d * (R - d); pz += dz / d * (R - d); }
  }
  const push = Math.hypot(px, pz);
  if (push > 0.001) {
    c.x += px; c.z += pz;
    if (Math.abs(c.speed) > 3 && c.bump <= 0) { sfx('bonk'); c.bump = 0.4; player.bonk = 0.9; c.shell.position.y = 0.12 + 0.05 * S.bounce; }
    c.speed *= Math.abs(c.speed) > 3 ? 0.35 : 0.8;
  }
  c.bump -= dt;
  c.x = clamp(c.x, -73, 73); c.z = clamp(c.z, -73, 73);
  syncCar(c);

  // body roll and bounce, spinning wheels, steering wheel
  const sp01 = c.speed / S.max, e6 = 1 - Math.exp(-dt * 6);
  c.shell.rotation.z = lerp(c.shell.rotation.z, c.steer * 0.08 * clamp(sp01 * 2, -1, 1), e6);
  c.shell.rotation.x = lerp(c.shell.rotation.x, -(brake ? 0.04 : 0) * Math.sign(c.speed) + Math.sin(state.clock * 7) * 0.012 * (S.bounce - 1) * Math.abs(sp01), e6);
  c.shell.position.y = lerp(c.shell.position.y, Math.abs(Math.sin(state.clock * 18)) * 0.02 * S.bounce * Math.abs(sp01), 1 - Math.exp(-dt * 10));
  c.wheels.forEach(w => { w.spin.rotation.x += c.speed * dt / w.r; if (w.front) w.pivot.rotation.y = -c.steer * 0.45; });
  if (M.steerWheel) M.steerWheel.rotation.z = c.steer * 1.4;
  if (M.antenna) M.antenna.rotation.x = lerp(M.antenna.rotation.x, -clamp(sp01, -1, 1) * 0.5 + Math.sin(state.clock * 11) * 0.1 * Math.abs(sp01), 1 - Math.exp(-dt * 8));
  if (M.sirens) { const on = Math.sin(state.clock * 12) > 0; M.sirens[0].emissiveIntensity = on ? 1.3 : 0.15; M.sirens[1].emissiveIntensity = on ? 0.15 : 1.3; }

  player.pos.set(c.x, 0, c.z); player.facing = c.heading;
  seatPlayer(c);
  player.bonk = Math.max(0, player.bonk - dt); player.happy = Math.max(0, player.happy - dt);
  updateAvatar(player.ch, dt, 0, player.bonk > 0 ? 'sorpresa' : (Math.abs(sp01) > 0.7 ? 'feliz' : null));
  steerArms(player.ch, c.steer);
  for (const p of player.pets) if (p.riding) animatePet(p.obj, state.clock, 0, dt);
  setEngine(Math.abs(c.speed));
}

// bring your own car next to you
function callCar() {
  if (state.mode !== 'play') return;
  const c = state.lastCar && ownedCars.includes(state.lastCar) ? state.lastCar : ownedCars[ownedCars.length - 1];
  if (!c) { toast('Todavía no tienes auto. ¡Ve a Autos Arcoíris a diseñar uno! 🚗'); return; }
  const f = Math.round(player.facing / (Math.PI / 2)) * (Math.PI / 2);
  const fx = Math.sin(f), fz = Math.cos(f), lx = Math.cos(f), lz = -Math.sin(f);
  const tries = [];
  [c.hw + 1.2, c.hw + 2.6, c.hw + 4.2].forEach(a => tries.push([lx * a, lz * a], [-lx * a, -lz * a]));
  [c.hl + 1.4, c.hl + 3.2].forEach(b => tries.push([fx * b, fz * b], [-fx * b, -fz * b]));
  for (const [dx, dz] of tries) {
    const x = player.pos.x + dx, z = player.pos.z + dz;
    if (carFitsAt(c.hw, c.hl, x, z, f, c.obs)) {
      c.x = x; c.z = z; c.heading = f; syncCar(c); state.lastCar = c;
      sfx('adopt'); toast('¡Aquí está tu auto!'); save(); return;
    }
  }
  toast('No cabe tu auto aquí. Prueba en la calle.');
}

export { callCar, driving, enterCar, exitCar, nearestCar, updateCar };
