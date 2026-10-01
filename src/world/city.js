// Arma la ciudad.
import { TAU, seeded } from '../core/math.js';
import { mergeStatic } from '../engine/merge.js';
import { LINES, world } from './layout.js';
import { obstacles } from './physics.js';
import { buildGround } from './ground.js';
import { tree } from './nature.js';
import { HOUSE_STYLES, house } from './houses.js';
import { buildPlaces, places } from './place.js';
import { spawnCar } from '../cars/fleet.js';

// Los lugares especiales: cada archivo de places/ se registra solo con definePlace (ver place.js).
import.meta.glob('./places/*.js', { eager: true });

function buildCity() {
  buildGround();
  buildPlaces();

  // las manzanas de afuera que ocupa un lugar especial (por ejemplo Autos Arcoíris): sin casa ni árboles sueltos
  const ocupada = (x, z, m = 0) => places.some(p => p.area && Math.max(Math.abs(p.area[0]), Math.abs(p.area[1])) > 36
    && x > p.area[0] - m && x < p.area[1] + m && z > p.area[2] - m && z < p.area[3] + m);
  // houses in the outer blocks, each facing the nearest street
  const outer = [-57.75, -20, 20, 57.75];
  let k = 0;
  outer.forEach(bx => outer.forEach(bz => {
    if (Math.abs(bx) < 30 && Math.abs(bz) < 30) return;
    if (ocupada(bx, bz)) { k++; return; }
    let best = null;
    LINES.forEach(L => {
      const dx = Math.abs(bx - L), dz = Math.abs(bz - L);
      if (!best || dx < best.d) best = { d: dx, axis: 'x', dir: Math.sign(L - bx) };
      if (dz < best.d) best = { d: dz, axis: 'z', dir: Math.sign(L - bz) };
    });
    const ry = best.axis === 'x' ? (best.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (best.dir > 0 ? 0 : Math.PI);
    const st = HOUSE_STYLES[k % HOUSE_STYLES.length];
    const big = k % 3 === 1;
    const d = 7.5, towardStreet = best.d - 5.5; // distance from block center to sidewalk
    const back = towardStreet - d / 2 - 6;       // front yard of 6
    const hx = best.axis === 'x' ? bx + best.dir * back : bx;
    const hz = best.axis === 'z' ? bz + best.dir * back : bz;
    house(hx, hz, ry, Object.assign({ w: big ? 10 : 8.5, d, h: big ? 6.2 : 4.4, path: 5.2 }, st));
    // side trees & yard hedges
    const sideX = best.axis === 'x' ? 0 : 1, sideZ = 1 - sideX;
    [-1, 1].forEach(s => tree(hx + sideX * s * 8.5 + (best.axis === 'x' ? -best.dir * 3 : 0), hz + sideZ * s * 8.5 + (best.axis === 'z' ? -best.dir * 3 : 0), 0.95 + (k % 3) * 0.1, (k + (s > 0 ? 1 : 0)) % 4 === 0 ? 2 : 0));
    k++;
  }));

  // trees scattered in the outer blocks and a green belt around the city
  const r = seeded(99);
  const clearOf = (x, z, m) => !obstacles.some(o => Math.abs(x - o.x) < o.hw + m && Math.abs(z - o.z) < o.hd + m) && !LINES.some(L => Math.abs(x - L) < 7 || Math.abs(z - L) < 7) && !ocupada(x, z, 2.5);
  let placed = 0, tries = 0;
  while (placed < 26 && tries < 800) {
    tries++;
    const x = r() * 140 - 70, z = r() * 140 - 70;
    if (Math.abs(x) < 36 && Math.abs(z) < 36) continue;
    if (clearOf(x, z, 3)) { tree(x, z, 0.85 + r() * 0.4, r() < 0.3 ? 2 : (r() < 0.25 ? 1 : 0)); placed++; }
  }
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, d = 82 + r() * 26;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (LINES.some(L => Math.abs(x - L) < 5 || Math.abs(z - L) < 5)) continue;
    // (el tamaño y el tipo se sortean igual aunque no se plante: así los demás árboles no se mueven)
    const s = 1 + r() * 0.6, kind = r() < 0.45 ? 2 : 0;
    if (!ocupada(x, z, 2.5)) tree(x, z, s, kind);
  }
  // trees along inner blocks
  [[8, -32], [32, -32], [8, 32], [32, 32], [-32, 32], [-8, 8.5], [32, 8.5]].forEach(([x, z], i) => tree(x, z, 0.9, i % 2));
  // parked cars anyone can drive
  const P = Math.PI;
  spawnCar({ type: 'clasico', color: '#FF6FAE', accent: '#FFFFFF', deco: 'corazones', extras: ['pestanas', 'sonrisa'] }, 2.1, 22, 0);
  spawnCar({ type: 'jeep', color: '#4FB6F5', accent: '#FFD23F', rims: 'deportiva' }, -2.1, -24, P);
  spawnCar({ type: 'descapotable', color: '#FFD23F', accent: '#FF6FAE', deco: 'rayas' }, 28, -2.1, P / 2);
  spawnCar({ type: 'camioneta', color: '#34CFA0', accent: '#FFFFFF', horn: 'tren' }, -52, 2.1, -P / 2);
  spawnCar({ type: 'clasico', color: '#A77BF3', accent: '#FFD23F', deco: 'estrellas', topper: 'antena', rims: 'dorada' }, 20, 42.1, P / 2);
  spawnCar({ type: 'deportivo', color: '#FF4F5E', accent: '#FFFFFF', deco: 'numero', num: 7, rims: 'deportiva' }, 42.1, -22, 0);
  spawnCar({ type: 'karting', color: '#FF9B4A', accent: '#2E3350', deco: 'llamas', horn: 'payaso' }, -24, -2.1, P / 2);

  mergeStatic(world);
}

export { buildCity };
