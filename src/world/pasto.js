// ¿Dónde hay pasto? Para que la jugadora, cuando descansa (game/reposo.js), se siente en el pasto y no donde pasa la
// gente: fuera de calles y veredas, de los senderos de los lugares, de los pisos (tarimas, interiores), de lo que un
// lugar marca como piso duro (`sinPasto([x0, x1, z0, z1])`, como el piso de goma de la plaza) y lejos de obstáculos.
import { EXT, LINES } from './layout.js';
import { interiorEn, obstacles, pisoEn } from './physics.js';
import { todasLasRedes } from './senderos.js';

const duros = [];
export const sinPasto = r => { duros.push(r); };

const CALLE = 6.3, SENDERO = 1.4, OBSTACULO = 1.0, BORDE = 72;
function aSegmento(x, z, [ax, az], [bx, bz]) {
  const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz;
  const u = l2 ? Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2)) : 0;
  return Math.hypot(x - ax - vx * u, z - az - vz * u);
}
export function esPasto(x, z) {
  if (Math.abs(x) > BORDE || Math.abs(z) > BORDE) return false;
  if (Math.abs(x) < EXT && LINES.some(L => Math.abs(z - L) < CALLE)) return false;
  if (Math.abs(z) < EXT && LINES.some(L => Math.abs(x - L) < CALLE)) return false;
  if (pisoEn(x, z) || interiorEn(x, z)) return false;
  if (duros.some(r => x > r[0] && x < r[1] && z > r[2] && z < r[3])) return false;
  for (const o of obstacles) if (Math.abs(x - o.x) < o.hw + OBSTACULO && Math.abs(z - o.z) < o.hd + OBSTACULO) return false;
  for (const r of todasLasRedes()) {
    for (const [a, vs] of Object.entries(r.vecinos)) for (const b of vs) if (a < b && aSegmento(x, z, r.nodos[a], r.nodos[b]) < SENDERO) return false;
  }
  return true;
}
// el punto con pasto más cercano a (x, z), a menos de `max` metros (o null)
export function pastoCerca(x, z, max = 12) {
  if (esPasto(x, z)) return { x, z };
  for (let r = 1; r <= max; r += 1) {
    const n = Math.max(8, Math.round(r * 6)), a0 = (x * 7 + z * 3) % 1;   // (empieza en un ángulo cualquiera, pero fijo)
    for (let i = 0; i < n; i++) {
      const a = (i / n + a0) * Math.PI * 2, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
      if (esPasto(px, pz)) return { x: px, z: pz };
    }
  }
  return null;
}
