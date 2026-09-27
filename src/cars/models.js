// Un constructor por tipo de auto.
import { THREE } from '../engine/three.js';
import { mat, shade } from '../engine/materials.js';
import { box, cyl, mesh, rbox, sph, tube } from '../engine/geometry.js';

   // autos a escala de Nina (antes eran para el personaje antiguo, más grande)
const GLASS_M = new THREE.MeshStandardMaterial({ color: 0xD6F1FF, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });

/* shared parts kit handed to each model builder; +z is the front of the car */
function carKit(spec) {
  const shell = new THREE.Group();
  const K = {
    shell, spec,
    body: mat(spec.color, { roughness: 0.3 }), body2: mat(shade(spec.color, 0.8), { roughness: 0.4 }),
    acc: mat(spec.accent, { roughness: 0.4 }), trim: mat('#3C4670', { roughness: 0.5 }), white: mat('#FFFFFF', { roughness: 0.4 }),
    chrome: mat('#E6E9F2', { roughness: 0.22, metalness: 0.55 }), inner: mat(shade(spec.color, 0.62), { roughness: 0.85 }),
    wood: mat('#C98B4F', { roughness: 0.9 }), ink: mat('#2A2438', { roughness: 0.4 }),
    glint: mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.6 }),
    A(geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const o = mesh(geo, m, x, y, z); o.rotation.set(rx, ry, rz); shell.add(o); return o; },
    glass(w, h, x, y, z, rx = 0) { const o = mesh(box(w, h, 0.04), GLASS_M, x, y, z, false, false); o.rotation.x = rx; shell.add(o); return o; },
    tube(a, b, r, m) { return tube(shell, a, b, r, m); },
    seat(x, sy, z, w = 0.98) {
      K.A(rbox(w, 0.26, 0.92, 0.1), K.acc, x, sy - 0.13, z + 0.02);
      K.A(rbox(w, 1.0, 0.24, 0.11), K.acc, x, sy + 0.42, z - 0.5, -0.12);
      K.A(rbox(w * 0.6, 0.3, 0.2, 0.09), K.acc, x, sy + 1.02, z - 0.57, -0.12);
    }
  };
  return K;
}

/* Each builder returns the layout: seat height (sy), seat/passenger spots, wheels [x,z,r,width],
   lights [x,y,z,r,sx,sy], a flat side area for designs, tops for racing stripes and anchors for toppers. */
function carClasico(K) {
  const { A, body, acc, trim, chrome } = K, sy = 0.95, sz = -0.45;
  A(rbox(2.9, 1.05, 5.0, 0.32), body, 0, 0.98, 0);
  A(rbox(2.5, 0.05, 2.5, 0.03), K.inner, 0, 1.5, -0.6);
  [-1, 1].forEach(s => { A(rbox(0.2, 1.55, 0.24, 0.08), body, s * 1.27, 2.2, 0.72, -0.2); A(rbox(0.2, 1.5, 0.26, 0.08), body, s * 1.27, 2.2, -1.95, 0.1); });
  A(rbox(2.9, 0.26, 3.2, 0.13), acc, 0, 3.06, -0.62);
  K.glass(2.36, 1.4, 0, 2.2, 0.76, -0.2);
  A(rbox(2.5, 0.34, 0.5, 0.14), trim, 0, 1.62, 0.55);
  A(rbox(2.6, 0.3, 0.34, 0.14), chrome, 0, 0.6, 2.5); A(rbox(2.6, 0.3, 0.34, 0.14), chrome, 0, 0.6, -2.5);
  K.seat(0.6, sy, sz); K.seat(-0.6, sy, sz);
  const w = [0.6, 0.5];
  return { sy, seat: { x: 0.6, z: sz }, passenger: { x: -0.6, z: sz },
    wheels: [[1.3, 1.62, ...w], [-1.3, 1.62, ...w], [1.3, -1.62, ...w], [-1.3, -1.62, ...w]],
    lightsF: [[0.85, 1.12, 2.47, 0.21], [-0.85, 1.12, 2.47, 0.21]], lightsB: [[0.95, 1.18, -2.48, 0.16], [-0.95, 1.18, -2.48, 0.16]],
    side: { x: 1.45, y: 0.98, z0: -1.0, z1: 0.95, h: 0.46 },
    tops: [{ y: 1.505, z: 1.55, len: 1.3 }, { y: 3.19, z: -0.62, len: 2.7 }],
    roof: { y: 3.19, z: -0.4 }, nose: { y: 1.5, z: 2.0 }, face: { y: 1.02, z: 2.5, r: 0.3 },
    hw: 1.55, hl: 2.6, camY: 2.1 };
}
function carDescapotable(K) {
  const { A, body, trim, chrome } = K, sy = 0.8, sz = -0.55;
  A(rbox(2.9, 0.85, 5.4, 0.3), body, 0, 0.85, 0);
  A(rbox(1.5, 0.14, 1.7, 0.07), body, 0, 1.3, 1.55);
  A(rbox(2.5, 0.05, 2.1, 0.03), K.inner, 0, 1.27, -0.55);
  K.glass(2.4, 0.72, 0, 1.6, 0.62, -0.5);
  A(rbox(2.5, 0.08, 0.08, 0.04), chrome, 0, 1.93, 0.45);
  [-1, 1].forEach(s => A(rbox(0.07, 0.75, 0.07, 0.03), chrome, s * 1.24, 1.6, 0.62, -0.5));
  A(rbox(2.5, 0.28, 0.4, 0.12), trim, 0, 1.36, 0.55);
  A(rbox(2.5, 0.34, 0.75, 0.16), trim, 0, 1.36, -1.75);   // folded soft top
  A(rbox(2.7, 0.28, 0.32, 0.13), chrome, 0, 0.55, 2.72); A(rbox(2.7, 0.28, 0.32, 0.13), chrome, 0, 0.55, -2.72);
  K.seat(0.6, sy, sz); K.seat(-0.6, sy, sz);
  const w = [0.54, 0.48];
  return { sy, seat: { x: 0.6, z: sz }, passenger: { x: -0.6, z: sz },
    wheels: [[1.3, 1.8, ...w], [-1.3, 1.8, ...w], [1.3, -1.8, ...w], [-1.3, -1.8, ...w]],
    lightsF: [[0.95, 0.95, 2.68, 0.2], [-0.95, 0.95, 2.68, 0.2]], lightsB: [[1.0, 1.0, -2.69, 0.15], [-1.0, 1.0, -2.69, 0.15]],
    side: { x: 1.45, y: 0.85, z0: -1.15, z1: 1.15, h: 0.4 },
    tops: [{ y: 1.37, z: 1.55, len: 1.6, w: 0.22 }, { y: 1.275, z: -2.4, len: 0.45 }],
    roof: { y: 1.97, z: 0.45 }, nose: { y: 1.3, z: 2.2 }, face: { y: 1.0, z: 2.7, r: 0.28 },
    hw: 1.55, hl: 2.85, camY: 1.9 };
}
function carJeep(K) {
  const { A, body, acc, trim, chrome } = K, sy = 1.25, sz = -0.55;
  A(rbox(2.8, 1.0, 4.7, 0.18), body, 0, 1.45, 0);
  A(rbox(2.4, 0.05, 2.3, 0.03), K.inner, 0, 1.95, -0.6);
  [-1, 1].forEach(s => {
    [1.6, -1.6].forEach(z => A(rbox(0.62, 0.16, 1.75, 0.07), trim, s * 1.45, 1.62, z));
    A(rbox(0.45, 0.1, 1.3, 0.05), trim, s * 1.5, 1.0, 0);
  });
  [-1, 1].forEach(s => { K.tube([s * 1.25, 1.95, -1.3], [s * 1.25, 3.35, -1.3], 0.09, acc); K.tube([s * 1.25, 3.35, -1.3], [s * 1.2, 1.95, -2.2], 0.08, acc); });
  K.tube([-1.25, 3.35, -1.3], [1.25, 3.35, -1.3], 0.09, acc);
  A(rbox(2.7, 0.12, 0.14, 0.05), trim, 0, 2.9, 0.8);
  [-1, 1].forEach(s => A(rbox(0.12, 0.95, 0.14, 0.05), trim, s * 1.3, 2.42, 0.8));
  K.glass(2.45, 0.85, 0, 2.42, 0.8);
  A(rbox(2.4, 0.32, 0.4, 0.12), trim, 0, 2.08, 0.55);
  for (let i = -3; i <= 3; i++) A(rbox(0.12, 0.5, 0.06, 0.04), trim, i * 0.2, 1.55, 2.36);
  A(rbox(3.0, 0.3, 0.36, 0.1), trim, 0, 0.8, 2.42); A(rbox(3.0, 0.3, 0.36, 0.1), trim, 0, 0.8, -2.42);
  A(cyl(0.55, 0.55, 0.34, 20), mat('#2B2F45', { roughness: 0.85 }), 0, 1.55, -2.55, Math.PI / 2);
  A(cyl(0.26, 0.26, 0.36, 14), chrome, 0, 1.55, -2.55, Math.PI / 2);
  K.seat(0.6, sy, sz); K.seat(-0.6, sy, sz);
  const w = [0.74, 0.6];
  return { sy, seat: { x: 0.6, z: sz }, passenger: { x: -0.6, z: sz },
    wheels: [[1.45, 1.6, ...w], [-1.45, 1.6, ...w], [1.45, -1.6, ...w], [-1.45, -1.6, ...w]],
    lightsF: [[1.0, 1.6, 2.36, 0.24], [-1.0, 1.6, 2.36, 0.24]], lightsB: [[1.2, 1.55, -2.37, 0.15], [-1.2, 1.55, -2.37, 0.15]],
    side: { x: 1.4, y: 1.42, z0: -0.72, z1: 0.72, h: 0.52 },
    tops: [{ y: 1.95, z: 1.55, len: 1.3 }],
    roof: { y: 3.44, z: -1.3 }, nose: { y: 1.95, z: 2.05 }, face: { y: 1.22, z: 2.36, r: 0.26 },
    hw: 1.78, hl: 2.75, camY: 2.5 };
}
function carBuggy(K) {
  const { A, body, acc, trim, chrome } = K, sy = 0.85, sz = -0.35;
  A(rbox(2.0, 0.7, 3.4, 0.3), body, 0, 0.85, 0.1);
  A(rbox(1.6, 0.45, 1.1, 0.2), body, 0, 0.95, 2.0, 0.28);
  A(rbox(1.5, 0.05, 1.5, 0.03), K.inner, 0, 1.2, -0.3);
  A(rbox(1.7, 0.26, 0.36, 0.12), trim, 0, 1.3, 0.55);
  const P = [[0.85, 1.2, -0.95], [0.8, 2.95, -0.95], [0.72, 2.75, 0.5], [0.8, 1.2, 1.1], [0.55, 1.05, -2.0]];
  [-1, 1].forEach(s => {
    const q = P.map(([x, y, z]) => [s * x, y, z]);
    K.tube(q[0], q[1], 0.08, acc); K.tube(q[1], q[2], 0.08, acc); K.tube(q[2], q[3], 0.08, acc); K.tube(q[1], q[4], 0.07, acc);
  });
  K.tube([-0.8, 2.95, -0.95], [0.8, 2.95, -0.95], 0.08, acc);
  K.tube([-0.72, 2.75, 0.5], [0.72, 2.75, 0.5], 0.08, acc);
  A(rbox(1.3, 0.6, 0.8, 0.14), trim, 0, 1.0, -1.95);
  [-1, 1].forEach(s => A(cyl(0.09, 0.09, 0.7, 10), chrome, s * 0.35, 1.25, -2.35, -1.0));
  K.tube([-0.9, 0.5, 2.5], [0.9, 0.5, 2.5], 0.07, trim);
  K.seat(0, sy, sz, 1.0);
  return { sy, seat: { x: 0, z: sz }, passenger: null,
    wheels: [[1.2, 1.55, 0.52, 0.46], [-1.2, 1.55, 0.52, 0.46], [1.38, -1.35, 0.78, 0.7], [-1.38, -1.35, 0.78, 0.7]],
    lightsF: [[0.5, 1.12, 2.45, 0.17], [-0.5, 1.12, 2.45, 0.17]], lightsB: [[0.55, 1.05, -2.37, 0.13], [-0.55, 1.05, -2.37, 0.13]],
    side: { x: 1.0, y: 0.85, z0: -0.45, z1: 1.3, h: 0.4 },
    tops: [{ y: 1.2, z: 1.15, len: 0.9, w: 0.22 }],
    roof: { y: 3.03, z: -0.95 }, nose: { y: 1.2, z: 2.1 }, face: { y: 0.92, z: 2.55, r: 0.2 },
    hw: 1.75, hl: 2.65, camY: 2.1 };
}
function carDeportivo(K) {
  const { A, body, acc, trim, chrome } = K, sy = 0.62, sz = -0.6;
  A(rbox(3.0, 0.72, 5.8, 0.3), body, 0, 0.7, 0);
  A(rbox(2.8, 0.22, 2.3, 0.1), body, 0, 1.02, 1.55, 0.12);
  A(rbox(2.4, 0.05, 2.0, 0.03), K.inner, 0, 1.065, -0.6);
  [-1, 1].forEach(s => A(rbox(0.85, 0.5, 1.0, 0.24), body, s * 0.6, 1.1, -1.6));
  A(rbox(2.4, 0.26, 0.36, 0.12), trim, 0, 1.15, 0.3);
  K.glass(2.5, 0.52, 0, 1.3, 0.62, -0.75);
  A(rbox(2.55, 0.07, 0.07, 0.03), trim, 0, 1.5, 0.45);
  A(rbox(3.0, 0.1, 0.62, 0.05), acc, 0, 1.78, -2.55);
  [-1, 1].forEach(s => { A(rbox(0.1, 0.72, 0.28, 0.04), trim, s * 0.95, 1.4, -2.55); A(rbox(0.1, 0.36, 0.7, 0.04), acc, s * 1.5, 1.78, -2.55); });
  [-1, 1].forEach(s => A(rbox(0.16, 0.14, 3.0, 0.06), acc, s * 1.47, 0.42, 0));
  A(rbox(2.6, 0.16, 0.3, 0.07), trim, 0, 0.42, 2.85);
  [-1, 1].forEach(s => A(cyl(0.12, 0.12, 0.3, 12), chrome, s * 0.45, 0.55, -2.92, Math.PI / 2));
  K.seat(0.55, sy, sz, 0.9); K.seat(-0.55, sy, sz, 0.9);
  return { sy, seat: { x: 0.55, z: sz }, passenger: { x: -0.55, z: sz },
    wheels: [[1.35, 1.9, 0.52, 0.56], [-1.35, 1.9, 0.52, 0.56], [1.35, -1.85, 0.58, 0.62], [-1.35, -1.85, 0.58, 0.62]],
    lightsF: [[1.0, 0.92, 2.86, 0.2, 1.7, 0.55], [-1.0, 0.92, 2.86, 0.2, 1.7, 0.55]], lightsB: [[1.05, 0.9, -2.88, 0.18, 1.8, 0.5], [-1.05, 0.9, -2.88, 0.18, 1.8, 0.5]],
    side: { x: 1.5, y: 0.72, z0: -1.1, z1: 1.2, h: 0.36 },
    tops: [{ y: 1.14, z: 1.6, len: 2.0, rx: 0.12 }],
    roof: { y: 1.55, z: 0.45 }, nose: { y: 1.05, z: 2.35 }, face: { y: 0.82, z: 2.9, r: 0.25 },
    hw: 1.7, hl: 3.0, camY: 1.7 };
}
function carCamioneta(K) {
  const { A, body, trim, chrome } = K, sy = 1.15, sz = 0.3;
  A(rbox(2.9, 1.0, 6.2, 0.3), body, 0, 1.2, 0);
  A(rbox(2.5, 0.05, 1.8, 0.03), K.inner, 0, 1.7, 0.2);
  [-1, 1].forEach(s => { A(rbox(0.2, 1.7, 0.24, 0.08), body, s * 1.3, 2.52, 1.3, -0.22); A(rbox(0.2, 1.65, 0.26, 0.08), body, s * 1.3, 2.52, -0.78); });
  A(rbox(2.9, 0.24, 2.5, 0.12), body, 0, 3.42, 0.3);
  K.glass(2.4, 1.55, 0, 2.5, 1.35, -0.22);
  K.glass(2.4, 1.3, 0, 2.45, -0.78);
  A(rbox(2.5, 0.34, 0.45, 0.14), trim, 0, 1.85, 1.2);
  [-1, 1].forEach(s => A(rbox(0.18, 0.6, 2.2, 0.07), body, s * 1.36, 1.98, -1.95));
  A(rbox(2.9, 0.6, 0.18, 0.07), body, 0, 1.98, -3.0);
  A(rbox(2.5, 0.05, 2.0, 0.02), K.wood, 0, 1.72, -1.95);
  A(rbox(2.7, 0.3, 0.34, 0.14), chrome, 0, 0.75, 3.12); A(rbox(2.7, 0.3, 0.34, 0.14), chrome, 0, 0.75, -3.12);
  K.seat(0.6, sy, sz); K.seat(-0.6, sy, sz);
  const w = [0.66, 0.55];
  return { sy, seat: { x: 0.6, z: sz }, passenger: { x: -0.6, z: sz },
    wheels: [[1.35, 2.05, ...w], [-1.35, 2.05, ...w], [1.35, -2.0, ...w], [-1.35, -2.0, ...w]],
    lightsF: [[1.0, 1.35, 3.1, 0.22], [-1.0, 1.35, 3.1, 0.22]], lightsB: [[1.15, 1.4, -3.1, 0.16], [-1.15, 1.4, -3.1, 0.16]],
    side: { x: 1.45, y: 1.2, z0: -1.25, z1: 1.3, h: 0.46 },
    tops: [{ y: 1.7, z: 2.3, len: 1.3 }, { y: 3.54, z: 0.3, len: 2.2 }],
    roof: { y: 3.54, z: 0.3 }, nose: { y: 1.7, z: 2.8 }, face: { y: 1.22, z: 3.1, r: 0.3 },
    hw: 1.65, hl: 3.25, camY: 2.5 };
}
function carMonster(K) {
  const { A, body, acc, trim, chrome } = K, sy = 2.4, sz = -0.45;
  [-1, 1].forEach(s => A(rbox(0.26, 0.26, 4.0, 0.08), trim, s * 0.75, 1.3, 0));
  [1.75, -1.75].forEach(z => {
    A(cyl(0.12, 0.12, 3.2, 10), chrome, 0, 1.15, z, 0, 0, Math.PI / 2);
    [-1, 1].forEach(s => A(cyl(0.16, 0.16, 0.75, 12), acc, s * 1.05, 1.62, z));
  });
  A(rbox(2.8, 1.0, 4.4, 0.35), body, 0, 2.35, 0);
  A(rbox(2.4, 0.05, 2.0, 0.03), K.inner, 0, 2.85, -0.55);
  A(rbox(2.4, 0.3, 0.4, 0.12), trim, 0, 2.97, 0.55);
  [-1, 1].forEach(s => { K.tube([s * 1.2, 2.85, -1.35], [s * 1.2, 4.5, -1.35], 0.1, acc); K.tube([s * 1.2, 4.5, -1.35], [s * 1.1, 2.85, -2.05], 0.09, acc); });
  K.tube([-1.2, 4.5, -1.35], [1.2, 4.5, -1.35], 0.1, acc);
  const lamp = mat('#FFF6C9', { emissive: '#FFE58A', emissiveIntensity: 0.5 });
  [-0.6, -0.2, 0.2, 0.6].forEach(x => A(sph(0.14, 10, 8), lamp, x, 4.64, -1.25));
  [-1, 1].forEach(s => A(cyl(0.13, 0.13, 1.4, 12), chrome, s * 0.6, 3.3, -1.95));
  A(rbox(3.0, 0.4, 0.45, 0.15), trim, 0, 1.8, 2.3); A(rbox(3.0, 0.4, 0.45, 0.15), trim, 0, 1.8, -2.3);
  K.seat(0.6, sy, sz); K.seat(-0.6, sy, sz);
  const w = [1.15, 0.95];
  return { sy, seat: { x: 0.6, z: sz }, passenger: { x: -0.6, z: sz },
    wheels: [[1.75, 1.75, ...w], [-1.75, 1.75, ...w], [1.75, -1.75, ...w], [-1.75, -1.75, ...w]],
    lightsF: [[0.95, 2.45, 2.2, 0.22], [-0.95, 2.45, 2.2, 0.22]], lightsB: [[1.05, 2.45, -2.2, 0.16], [-1.05, 2.45, -2.2, 0.16]],
    side: { x: 1.4, y: 2.35, z0: -0.85, z1: 0.85, h: 0.46 },
    tops: [{ y: 2.85, z: 1.55, len: 1.1 }],
    roof: { y: 4.62, z: -1.35 }, nose: { y: 2.85, z: 1.9 }, face: { y: 2.3, z: 2.2, r: 0.3 },
    hw: 2.25, hl: 2.95, camY: 3.3 };
}
function carKarting(K) {
  const { A, body, trim, chrome, white } = K, sy = 0.52, sz = -0.45;
  A(rbox(2.0, 0.14, 3.5, 0.06), trim, 0, 0.3, 0);
  [-1, 1].forEach(s => A(rbox(0.42, 0.36, 1.5, 0.16), body, s * 1.0, 0.46, -0.1));
  A(rbox(1.7, 0.36, 0.9, 0.17), body, 0, 0.46, 1.65);
  A(rbox(1.0, 0.62, 0.07, 0.04), white, 0, 0.82, 1.2, -0.35);
  A(rbox(0.7, 0.55, 0.6, 0.14), trim, 0.55, 0.62, -1.45);
  A(cyl(0.08, 0.08, 0.45, 10), chrome, 0.55, 0.75, -1.85, Math.PI / 2);
  A(rbox(2.3, 0.2, 0.22, 0.09), trim, 0, 0.45, -1.9);
  K.tube([-0.9, 0.22, 2.25], [0.9, 0.22, 2.25], 0.06, trim);
  K.seat(0, sy, sz, 0.9);
  return { sy, seat: { x: 0, z: sz }, passenger: null,
    wheels: [[1.12, 1.25, 0.42, 0.48], [-1.12, 1.25, 0.42, 0.48], [1.15, -1.3, 0.46, 0.6], [-1.15, -1.3, 0.46, 0.6]],
    lightsF: [[0.45, 0.58, 2.06, 0.13], [-0.45, 0.58, 2.06, 0.13]], lightsB: [],
    side: { x: 1.21, y: 0.46, z0: -0.7, z1: 0.5, h: 0.3 },
    tops: [{ y: 0.64, z: 1.65, len: 0.7, w: 0.2 }],
    roof: { y: 0.55, z: -1.9, x: -0.7 }, nose: { y: 0.64, z: 1.9 }, face: { y: 0.5, z: 2.1, r: 0.16 },
    hw: 1.5, hl: 2.15, camY: 1.5 };
}

export { carBuggy, carCamioneta, carClasico, carDeportivo, carDescapotable, carJeep, carKarting, carKit, carMonster };
