// Casas.
import { THREE } from '../engine/three.js';
import { mat } from '../engine/materials.js';
import { G, box, cyl, mesh, rlo, sph } from '../engine/geometry.js';
import { world } from './layout.js';
import { addObsRot } from './physics.js';
import { FLOWER_COLS } from './nature.js';

/* ---------- houses ---------- */
function addWindow(g, x, y, z, ry, big) {
  const w = big ? 1.8 : 1.4, h = big ? 1.6 : 1.3;
  const wg = new THREE.Group(); wg.position.set(x, y, z); wg.rotation.y = ry;
  wg.add(mesh(rlo(w + 0.3, h + 0.3, 0.16, 0.07), mat('#FFFFFF'), 0, 0, 0));
  wg.add(mesh(rlo(w, h, 0.18, 0.05), mat('#BFE6FF', { roughness: 0.25, emissive: '#7CC8FF', emissiveIntensity: 0.12 }), 0, 0, 0.02));
  wg.add(mesh(box(0.08, h, 0.22), mat('#FFFFFF'), 0, 0, 0.02));
  wg.add(mesh(box(w, 0.08, 0.22), mat('#FFFFFF'), 0, 0, 0.02));
  g.add(wg);
  return wg;
}
function house(x, z, ry, o) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  const w = o.w || 8, d = o.d || 7, h = o.h || 4.4, wall = mat(o.wall);
  g.add(mesh(rlo(w + 0.4, 0.4, d + 0.4, 0.12), mat('#E4DACB'), 0, 0.2, 0));
  g.add(mesh(rlo(w, h, d, 0.35), wall, 0, h / 2 + 0.3, 0));
  const roof = mesh(G('roof4', () => { const c = new THREE.ConeGeometry(1, 1, 4, 1); c.rotateY(Math.PI / 4); c.translate(0, 0.5, 0); return c; }), mat(o.roof, { flatShading: true, roughness: 0.6 }), 0, h + 0.3, 0);
  roof.scale.set((w / 2 + 0.7) / 0.7071, o.rh || 2.8, (d / 2 + 0.7) / 0.7071); g.add(roof);
  g.add(mesh(rlo(0.8, 1.8, 0.8, 0.1), mat('#C9674F'), w * 0.26, h + 1.6, -d * 0.16));
  // door
  const dx = o.doorX || 0;
  g.add(mesh(rlo(1.7, 2.7, 0.2, 0.08), mat('#FFFFFF'), dx, 1.62, d / 2 + 0.02));
  g.add(mesh(rlo(1.36, 2.4, 0.26, 0.12), mat(o.door || '#FF7A59'), dx, 1.55, d / 2 + 0.04));
  g.add(mesh(sph(0.1, 10, 8), mat('#FFD23F', { metalness: 0.4, roughness: 0.3 }), dx + 0.44, 1.5, d / 2 + 0.2));
  g.add(mesh(rlo(2.2, 0.25, 1.0, 0.08), mat('#E4DACB'), dx, 0.13, d / 2 + 0.6));
  // windows
  const wy = 2.1;
  [-1, 1].forEach(s => {
    if (Math.abs(s * w * 0.3 - dx) > 1.5) {
      addWindow(g, s * w * 0.3, wy, d / 2 + 0.02, 0, false);
      g.add(mesh(rlo(1.6, 0.3, 0.4, 0.08), mat('#B87A4B'), s * w * 0.3, wy - 0.95, d / 2 + 0.2));
      for (let k = -1; k <= 1; k++) g.add(mesh(sph(0.16, 8, 6), mat(FLOWER_COLS[(((k + 3 + Math.floor(x)) % 5) + 5) % 5]), s * w * 0.3 + k * 0.45, wy - 0.72, d / 2 + 0.22, false));
    }
    addWindow(g, s * (w / 2 + 0.02), wy, 0, s * Math.PI / 2, false);
  });
  if (h > 5.4) [-1, 1].forEach(s => addWindow(g, s * w * 0.28, h - 0.6, d / 2 + 0.02, 0, false));
  // path to street
  const pl = o.path || 5;
  g.add(mesh(box(1.6, 0.04, pl), mat('#EADCC6'), dx, 0.03, d / 2 + 1.1 + pl / 2, false, true));
  // mailbox
  g.add(mesh(cyl(0.07, 0.07, 1.1, 6), mat('#6D5A4A'), dx + 1.5, 0.55, d / 2 + pl));
  g.add(mesh(rlo(0.45, 0.4, 0.7, 0.15), mat(o.door || '#FF7A59'), dx + 1.5, 1.2, d / 2 + pl));
  world.add(g);
  addObsRot(x, z, w + 0.4, d + 0.4, ry, h + 3);
  return g;
}   // drivable cars in the street (see CARS section)

/* ---------- city layout ---------- */
const HOUSE_STYLES = [
  { wall: '#FFD6E2', roof: '#E05A7A', door: '#FFD23F' }, { wall: '#FFF0B3', roof: '#F08A3C', door: '#4FB6F5' },
  { wall: '#CFF3E4', roof: '#2FA58A', door: '#FF6FAE' }, { wall: '#D8E6FF', roof: '#4F79D9', door: '#FF9B4A' },
  { wall: '#ECDFFF', roof: '#8A63D2', door: '#3DD6A8' }, { wall: '#FFE2C8', roof: '#C9533B', door: '#5B6CF0' },
  { wall: '#FFFFFF', roof: '#3E8FD6', door: '#FF4F5E' }, { wall: '#E4F6C8', roof: '#6BAA3A', door: '#A77BF3' }
];

export { HOUSE_STYLES, house };
