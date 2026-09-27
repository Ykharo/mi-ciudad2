// Autos en la ciudad.
import { THREE } from '../engine/three.js';
import { world } from '../world/layout.js';
import { collide, obstacles } from '../world/physics.js';
import { fixCarSpec } from './catalog.js';
import { buildCarModel } from './build.js';
import { player } from '../game/player.js';

const cars = [];

/* ---------- cars in the world ---------- */
function setCarModel(c, M) {
  if (c.model) { world.remove(c.g); c.model.dispose(); }
  c.model = M; c.g = M.g; c.shell = M.shell; c.wheels = M.wheels; c.hw = M.hw; c.hl = M.hl; c.stats = M.stats; c.spec = M.spec;
  c.cr = M.hw; c.offs = M.hl > M.hw ? [-(M.hl - M.hw), M.hl - M.hw] : [0];
  world.add(c.g);
}
function spawnCar(spec, x, z, heading, owned, model) {
  spec = fixCarSpec(spec);
  const c = { x, z, heading, speed: 0, steer: 0, bump: 0, owned: !!owned, obs: { x, z, hw: 1, hd: 1, h: 0 }, model: null };
  setCarModel(c, model || buildCarModel(spec));
  obstacles.push(c.obs); cars.push(c);
  c.zone = { id: 'car', car: c, label: owned ? '🚗 Subirse a mi auto' : '🚗 Subirse al auto' };
  syncCar(c);
  return c;
}
function removeCar(c) {
  world.remove(c.g); c.model.dispose();
  const oi = obstacles.indexOf(c.obs); if (oi >= 0) obstacles.splice(oi, 1);
  const ci = cars.indexOf(c); if (ci >= 0) cars.splice(ci, 1);
}
function syncCar(c) {
  const sh = Math.abs(Math.sin(c.heading)), ch = Math.abs(Math.cos(c.heading));
  c.obs.x = c.x; c.obs.z = c.z; c.obs.hw = sh * c.hl + ch * c.hw; c.obs.hd = ch * c.hl + sh * c.hw;
  c.g.position.set(c.x, 0, c.z); c.g.rotation.y = c.heading;
}
// distance from a point to the car's footprint (0 when touching)
function carDist(c, x, z) {
  const dx = x - c.x, dz = z - c.z, s = Math.sin(c.heading), co = Math.cos(c.heading);
  return Math.hypot(Math.max(0, Math.abs(dx * co - dz * s) - c.hw), Math.max(0, Math.abs(dx * s + dz * co) - c.hl));
}
function carFitsAt(hw, hl, x, z, heading, skip) {
  if (Math.abs(x) > 72 || Math.abs(z) > 72) return false;
  const fx = Math.sin(heading), fz = Math.cos(heading), offs = hl > hw ? [-(hl - hw), 0, hl - hw] : [0];
  for (const s of offs) {
    const ox = x + fx * s, oz = z + fz * s;
    _cp.set(ox, 0, oz); collide(_cp, hw + 0.1, skip);
    if (Math.hypot(_cp.x - ox, _cp.z - oz) > 0.01) return false;
    if (Math.hypot(player.pos.x - ox, player.pos.z - oz) < hw + 0.7) return false;
  }
  return true;
}
const _cp = new THREE.Vector3();

export { _cp, carDist, carFitsAt, cars, removeCar, setCarModel, spawnCar, syncCar };
