// Autos Arcoíris: el salón y el torno de diseño.
import { THREE } from '../../engine/three.js';
import { state } from '../../core/state.js';
import { TAU, lerp } from '../../core/math.js';
import { RAINBOW, mat } from '../../engine/materials.js';
import { G, box, cone, cyl, mesh, rlo, sph, tube } from '../../engine/geometry.js';
import { checkerTexture, makeSign, stripeTexture } from '../../engine/textures.js';
import { definePlace } from '../place.js';
import { fixCarSpec } from '../../cars/catalog.js';
import { buildCarModel } from '../../cars/build.js';

/* ---------- the dealership: Autos Arcoíris ---------- */
const TT = { x: 61, z: -14 };
const SPAWNS = [[61, -1.9, -Math.PI / 2], [61, 1.9, -Math.PI / 2], [52, -1.9, -Math.PI / 2], [70, -1.9, -Math.PI / 2], [52, 1.9, -Math.PI / 2], [70, 1.9, -Math.PI / 2], [42, -10, 0], [38, -10, Math.PI]];
let ttGroup = null; state.ttModel = null; state.ttSpin = 0.6; state.ttDrag = 0;
function carShop({ world, addObs, addZone, onFrame }) {
  const bx = TT.x, bz = -27.5, w = 20, d = 9, h = 6.8;
  const g = new THREE.Group(); g.position.set(bx, 0, bz);
  const white = mat('#FFFFFF'), blue = mat('#4FB6F5');
  g.add(mesh(rlo(w + 0.5, 0.4, d + 0.5, 0.12), mat('#E4DACB'), 0, 0.2, 0));
  g.add(mesh(rlo(w, h, d, 0.4), mat('#DDF0FF'), 0, h / 2 + 0.3, 0));
  g.add(mesh(rlo(w + 0.6, 0.7, d + 0.6, 0.25), blue, 0, h + 0.55, 0));
  [-1, 1].forEach(s => {
    g.add(mesh(rlo(6.6, 3.9, 0.2, 0.1), white, s * 5.6, 2.45, d / 2 + 0.02));
    g.add(mesh(rlo(6.1, 3.4, 0.24, 0.08), mat('#BFE6FF', { roughness: 0.25, emissive: '#7CC8FF', emissiveIntensity: 0.12 }), s * 5.6, 2.45, d / 2 + 0.04));
    g.add(mesh(box(0.1, 3.4, 0.28), white, s * 5.6, 2.45, d / 2 + 0.04));
    g.add(mesh(box(6.1, 0.1, 0.28), white, s * 5.6, 2.45, d / 2 + 0.04));
  });
  g.add(mesh(rlo(3.2, 3.9, 0.24, 0.1), white, 0, 2.25, d / 2 + 0.04));
  g.add(mesh(rlo(2.7, 3.5, 0.3, 0.12), mat('#FF8FC0'), 0, 2.1, d / 2 + 0.06));
  g.add(mesh(box(0.1, 3.3, 0.34), white, 0, 2.1, d / 2 + 0.06));
  const awn = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.16, 2.0), new THREE.MeshStandardMaterial({ map: stripeTexture('#4FB6F5', '#FFFFFF', 10), roughness: 0.7 }));
  awn.position.set(0, 4.55, d / 2 + 0.9); awn.rotation.x = 0.35; awn.castShadow = true; g.add(awn);
  const sign = makeSign('Autos Arcoíris', '#FF6FAE', '#FFFFFF', 9.5); sign.position.set(0, 6.0, d / 2 + 0.07); g.add(sign);
  world.add(g);
  addObs(bx, bz, w / 2 + 0.3, d / 2 + 0.3, 11);
  // smiling mascot car turning on the roof
  const mascot = buildCarModel(fixCarSpec({ type: 'clasico', color: '#FFD23F', accent: '#FF6FAE', deco: 'arcoiris', rims: 'flor', extras: ['pestanas', 'sonrisa'] }));
  const mg = new THREE.Group(); mg.userData.dynamic = true; mg.position.set(bx, h + 0.9, bz); world.add(mg);
  mg.add(mesh(cyl(3.2, 3.4, 0.3, 36), white, 0, 0.15, 0));
  mascot.g.position.y = 0.3; mascot.g.scale.multiplyScalar(1.15); mg.add(mascot.g);
  onFrame(t => { mascot.g.rotation.y = t * 0.4; });
  // showroom floor
  world.add(mesh(rlo(28, 0.06, 15.4, 0.03), mat('#ECE6F4', { roughness: 0.95 }), bx, 0.03, -15.2, false, true));
  // the design turntable, ringed with marquee bulbs
  world.add(mesh(cyl(3.9, 4.0, 0.3, 44), white, TT.x, 0.15, TT.z));
  const bulb = mat('#FFF3C4', { emissive: '#FFD66B', emissiveIntensity: 0.7 });
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; world.add(mesh(sph(0.13, 8, 6), bulb, TT.x + Math.cos(a) * 3.88, 0.33, TT.z + Math.sin(a) * 3.88, false, false)); }
  ttGroup = new THREE.Group(); ttGroup.userData.dynamic = true; ttGroup.position.set(TT.x, 0.3, TT.z); world.add(ttGroup);
  ttGroup.add(mesh(cyl(3.7, 3.7, 0.1, 44), mat('#FF9CC7'), 0, 0.05, 0, false, true));
  ttGroup.add(mesh(cyl(2.9, 2.9, 0.11, 44), mat('#FFF0F7'), 0, 0.055, 0, false, true));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ttGroup.add(mesh(sph(0.1, 8, 6), white, Math.cos(a) * 3.3, 0.1, Math.sin(a) * 3.3, false, false)); }
  addObs(TT.x, TT.z, 3.8, 3.8);
  addZone({ id: 'shop', x: TT.x, z: TT.z, r: 6.4, label: '🚗 Diseñar mi auto' });
  onFrame((t, dt) => {
    state.ttDrag = Math.max(0, state.ttDrag - dt);
    if (!state.ttDrag) state.ttSpin += dt * (state.mode === 'shop' ? 0.22 : 0.35);
    ttGroup.rotation.y = state.ttSpin;
    if (state.ttModel && state.ttModel.sirens) { const on = Math.sin(t * 8) > 0; state.ttModel.sirens[0].emissiveIntensity = on ? 1.2 : 0.15; state.ttModel.sirens[1].emissiveIntensity = on ? 0.15 : 1.2; }
    if (state.ttModel && state.ttModel.antenna) state.ttModel.antenna.rotation.x = Math.sin(t * 3) * 0.12;
  });
  // two show cars on podiums
  [[50.5, -13, { type: 'monster', color: '#7BD85A', accent: '#FFD23F', deco: 'llamas', rims: 'deportiva', extras: ['sonrisa', 'pestanas'] }, 3.4, '#C9F2E2'],
   [71.5, -13, { type: 'buggy', color: '#FF9B4A', accent: '#4FB6F5', deco: 'numero', num: 3, rims: 'dorada', topper: 'antena' }, 3.1, '#FFE9A8']].forEach(([x, z, sp, r, col], i) => {
    world.add(mesh(cyl(3.1, 3.2, 0.3, 36), white, x, 0.15, z));
    const pg = new THREE.Group(); pg.userData.dynamic = true; pg.position.set(x, 0.3, z); world.add(pg);
    pg.add(mesh(cyl(2.9, 2.9, 0.1, 36), mat(col), 0, 0.05, 0, false, true));
    const m = buildCarModel(fixCarSpec(sp)); m.g.position.y = 0.1; pg.add(m.g);
    onFrame(t => { pg.rotation.y = -t * 0.3 + i * 2; });
    addObs(x, z, r, r);
  });
  // flag poles with checkered flags, and bunting to the roof
  const poleM = mat('#3C4670', { roughness: 0.5 }), flagM = new THREE.MeshStandardMaterial({ map: checkerTexture(), side: THREE.DoubleSide, roughness: 0.8 });
  const poles = [[47.2, -7.8], [74.8, -7.8]];
  poles.forEach(([x, z], i) => {
    world.add(mesh(cyl(0.12, 0.15, 6.4, 10), poleM, x, 3.2, z)); world.add(mesh(sph(0.24, 10, 8), mat('#FFD23F'), x, 6.45, z));
    addObs(x, z, 0.3, 0.3);
    const pv = new THREE.Group(); pv.position.set(x, 5.5, z); pv.userData.dynamic = true; world.add(pv);
    const f = new THREE.Mesh(G('flag', () => new THREE.PlaneGeometry(2.2, 1.4)), flagM); f.position.x = (i ? -1 : 1) * 1.15; f.castShadow = true; pv.add(f);
    onFrame(t => { pv.rotation.y = Math.sin(t * 2.2 + i) * 0.3; });
  });
  const string = mat('#FFFFFF', { roughness: 0.6 });
  [[poles[0], [bx - w / 2 + 0.3, h + 0.2, bz + d / 2]], [poles[1], [bx + w / 2 - 0.3, h + 0.2, bz + d / 2]]].forEach(([[px, pz], b]) => {
    const a = [px, 6.0, pz], n = 13, pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - 1.1 * 4 * t * (1 - t), lerp(a[2], b[2], t)]); }
    for (let i = 0; i < n; i++) {
      tube(world, pts[i], pts[i + 1], 0.025, string);
      if (i === 0) continue;
      const p = pts[i], dx = pts[i + 1][0] - pts[i - 1][0], dz = pts[i + 1][2] - pts[i - 1][2];
      const fl = mesh(cone(0.3, 0.55, 3), mat(RAINBOW[i % 6], { roughness: 0.6 }), p[0], p[1] - 0.3, p[2]);
      fl.rotation.set(Math.PI, Math.atan2(-dz, dx), 0, 'YXZ'); fl.scale.set(1, 1, 0.15); world.add(fl);
    }
  });
  // a little stand-up sign by the road
  [-1, 1].forEach(s => world.add(mesh(cyl(0.08, 0.08, 2.4, 8), poleM, 55.5 + s * 1.9, 1.2, -7.9)));
  const s2 = makeSign('¡Diseña tu auto!', '#4FB6F5', '#FFFFFF', 4.6); s2.position.set(55.5, 2.2, -7.85); world.add(s2);
  addObs(55.5, -7.9, 2.1, 0.25);
}

definePlace({ id: 'autos', nombre: 'Autos Arcoíris', orden: 70, area: [45.5, 76, -34.5, -5.5], build: carShop });

export { SPAWNS, TT, ttGroup };
