// Obstáculos y choques contra ellos.
import { clamp } from '../core/math.js';
import { ALTO_VEREDA, enVereda } from './layout.js';

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

// Pisos más altos que el suelo (una tarima): círculos { x, z, r, h } o rectángulos { x, z, hw, hd, h }. Quien camina
// encima queda a esa altura (la jugadora: game/player.js); se sube sin escalar, así que conviene que sean bajos.
// Con `espera: { x, z, mira }`, las mascotas no suben: esperan sentadas en ese punto (main.js, pets/follow.js waitAt).
const pisos = [];
function addPiso(p) { pisos.push(p); }
// el piso más alto que hay en (x, z), o null
function pisoEn(x, z) {
  let mejor = null;
  for (const p of pisos) {
    const dentro = p.r ? Math.hypot(x - p.x, z - p.z) < p.r : Math.abs(x - p.x) < p.hw && Math.abs(z - p.z) < p.hd;
    if (dentro && (!mejor || p.h > mejor.h)) mejor = p;
  }
  return mejor;
}
// la altura del suelo: un piso, la vereda (0,18 m) o el suelo
function sueloEn(x, z) { const p = pisoEn(x, z); return Math.max(p ? p.h : 0, enVereda(x, z) ? ALTO_VEREDA : 0); }
// la misma, pero subiendo y bajando escalones chicos de a poco (vecinos, mascotas): guarda la altura en `quien.ySuelo`
function sueloSuave(quien, x, z, dt) {
  const s = sueloEn(x, z), y = quien.ySuelo ?? s;
  return (quien.ySuelo = Math.abs(s - y) < 0.3 ? y + (s - y) * Math.min(1, dt * 18) : s);
}

// Interiores (salas aparte, fuera del mapa: la Mascotienda por dentro): { area: [x0, x1, z0, z1], techo }. Adentro
// no rige el límite de la ciudad (game/player.js) y la cámara no sube más que el techo (game/camera.js).
const interiores = [];
function addInterior(i) { interiores.push(i); }
const interiorEn = (x, z) => interiores.find(i => x > i.area[0] && x < i.area[1] && z > i.area[2] && z < i.area[3]) || null;

export { addInterior, addObs, addObsRot, addPiso, collide, interiorEn, obstacles, pisoEn, sueloEn, sueloSuave };
