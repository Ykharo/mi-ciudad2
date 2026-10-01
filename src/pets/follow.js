// Fila de mascotas que sigue a su dueña.
import { clamp, lerpAngle } from '../core/math.js';
import { collide } from '../world/physics.js';
import { animatePet } from './models.js';

// `sentadas`: si la dueña está sentada (banca, graderías, un juego), las que llegan a su lado se sientan
function followChain(list, leaderPos, dt, t, firstGap = 1.7, sentadas = false) {
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
    animatePet(p.obj, t + i, clamp(moved / 5, 0, 3), dt, sentadas && moved < 0.5);
    leader = p.pos;
  });
}

// Esperar en un lugar (cuando la dueña sube a una tarima: world/physics.js, piso con `espera`): caminan hasta el
// punto, se ponen en fila hacia el costado y se sientan mirando hacia `mira`.
function waitAt(list, punto, dt, t) {
  const lx = Math.cos(punto.mira), lz = -Math.sin(punto.mira);   // hacia el costado de quien mira hacia `mira`
  list.forEach((p, i) => {
    const off = (i - (list.length - 1) / 2) * 1.0, tx = punto.x + lx * off, tz = punto.z + lz * off;
    const dx = tx - p.pos.x, dz = tz - p.pos.z, d = Math.hypot(dx, dz);
    let moved = 0;
    if (d > 30) p.pos.set(tx, 0, tz);
    else if (d > 0.05) { const step = Math.min(d, (d > 3 ? 9 : 5) * dt); p.pos.x += dx / d * step; p.pos.z += dz / d * step; moved = step / Math.max(dt, 1e-4); }
    collide(p.pos, 0.35);
    p.facing = lerpAngle(p.facing, d > 0.4 ? Math.atan2(dx, dz) : punto.mira, 1 - Math.exp(-dt * 6));
    p.obj.root.position.set(p.pos.x, 0, p.pos.z); p.obj.root.rotation.y = p.facing;
    animatePet(p.obj, t + i, clamp(moved / 5, 0, 3), dt, d < 0.4);
  });
}

export { followChain, waitAt };
