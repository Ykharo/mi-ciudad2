// Fila de mascotas que sigue a su dueña.
import { clamp, lerpAngle } from '../core/math.js';
import { collide } from '../world/physics.js';
import { animatePet } from './models.js';

function followChain(list, leaderPos, dt, t, firstGap = 1.7) {
  let leader = leaderPos;
  list.forEach((p, i) => {
    const dx = leader.x - p.pos.x, dz = leader.z - p.pos.z, d = Math.hypot(dx, dz);
    const want = i === 0 ? firstGap : 1.35;
    let moved = 0;
    if (d > 30) { p.pos.set(leader.x - dx / d * want, 0, leader.z - dz / d * want); }
    else if (d > want) { const step = Math.min(d - want, Math.min(26, Math.max(d > 5 ? 13 : 8.5, (d - want) * 3.2)) * dt); p.pos.x += dx / d * step; p.pos.z += dz / d * step; moved = step / Math.max(dt, 1e-4); }
    collide(p.pos, 0.35);
    if (d > 0.05) p.facing = lerpAngle(p.facing, Math.atan2(dx, dz), 1 - Math.exp(-dt * 8));
    p.obj.root.position.set(p.pos.x, 0, p.pos.z); p.obj.root.rotation.y = p.facing;
    animatePet(p.obj, t + i, clamp(moved / 5, 0, 3), dt);
    leader = p.pos;
  });
}

export { followChain };
