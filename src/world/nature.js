// Árboles y flores.
import { THREE } from '../engine/three.js';
import { TAU, seeded } from '../core/math.js';
import { mat } from '../engine/materials.js';
import { cone, cyl, mesh, sph } from '../engine/geometry.js';
import { world } from './layout.js';
import { addObs } from './physics.js';

/* ---------- trees & plants ---------- */
const TREE_GREENS = ['#5DBE5A', '#4DB06A', '#7BCB4F'];
function tree(x, z, s = 1, kind = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const trunk = mat('#9A6A45');
  if (kind === 2) { // pine
    g.add(mesh(cyl(0.22 * s, 0.3 * s, 1.4 * s, 8), trunk, 0, 0.7 * s, 0));
    const pm = mat('#3FA56B');
    [[1.9, 2.2, 1.9], [1.5, 1.9, 3.1], [1.05, 1.6, 4.1]].forEach(([r, h, y]) => g.add(mesh(cone(r * s, h * s, 10), pm, 0, y * s, 0)));
  } else {
    g.add(mesh(cyl(0.22 * s, 0.32 * s, 2.2 * s, 8), trunk, 0, 1.1 * s, 0));
    const fm = mat(TREE_GREENS[kind === 1 ? 2 : Math.floor(Math.random() * 2)]);
    g.add(mesh(sph(1.45 * s, 14, 10), fm, 0, 3.0 * s, 0));
    g.add(mesh(sph(1.05 * s, 12, 9), fm, 0.95 * s, 2.55 * s, 0.25 * s));
    g.add(mesh(sph(1.0 * s, 12, 9), fm, -0.85 * s, 2.7 * s, -0.35 * s));
    if (kind === 1) { // blossom dots
      const bm = mat('#FF9CC7');
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.add(mesh(sph(0.22 * s, 8, 6), bm, Math.cos(a) * 1.3 * s, 3.2 * s + Math.sin(i) * 0.4, Math.sin(a) * 1.3 * s, false)); }
    }
  }
  world.add(g);
  addObs(x, z, 0.4 * s, 0.4 * s);
}
const FLOWER_COLS = ['#FF6FAE', '#FFD23F', '#FFFFFF', '#A77BF3', '#FF7A59'];
function flowers(cx, cz, w, d, n, seed = 1) {
  const r = seeded(seed), stem = mat('#4FA85A');
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * w, z = cz + (r() - 0.5) * d;
    world.add(mesh(cyl(0.03, 0.03, 0.4, 5), stem, x, 0.2, z, false, false));
    world.add(mesh(sph(0.13, 8, 6), mat(FLOWER_COLS[Math.floor(r() * 5)]), x, 0.44, z, false, false));
  }
}

export { FLOWER_COLS, flowers, tree };
