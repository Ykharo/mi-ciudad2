// Obstáculos y choques contra ellos.
import { clamp } from '../core/math.js';

const obstacles = [];   // {x,z,hw,hd}
function addObs(x, z, hw, hd, h = 0) { obstacles.push({ x, z, hw, hd, h }); }
function addObsRot(x, z, w, d, ry, h = 0) { const q = Math.round(ry / (Math.PI / 2)) & 1; q ? addObs(x, z, d / 2, w / 2, h) : addObs(x, z, w / 2, d / 2, h); }

function collide(p, r, skip) {
  for (const o of obstacles) {
    if (o === skip) continue;
    if (Math.abs(p.x - o.x) > o.hw + r || Math.abs(p.z - o.z) > o.hd + r) continue;
    const cx = clamp(p.x, o.x - o.hw, o.x + o.hw), cz = clamp(p.z, o.z - o.hd, o.z + o.hd);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x += dx / d * (r - d); p.z += dz / d * (r - d); }
    else {
      const px = o.hw - Math.abs(p.x - o.x), pz = o.hd - Math.abs(p.z - o.z);
      if (px < pz) p.x += Math.sign(p.x - o.x || 1) * (px + r); else p.z += Math.sign(p.z - o.z || 1) * (pz + r);
    }
  }
}

export { addObs, addObsRot, collide, obstacles };
