// Arma un auto: pintura, dibujos, adornos, ruedas.
import { THREE } from '../engine/three.js';
import { TAU, seeded } from '../core/math.js';
import { RAINBOW, mat } from '../engine/materials.js';
import { G, box, cone, cyl, disc, heartGeo, mesh, rbox, sph, starGeo, unitPlane } from '../engine/geometry.js';
import { mergeChildren, mergeInto } from '../engine/merge.js';
import { CAR_TYPE, CAR_TYPES } from './catalog.js';
import { carKit } from './models.js';

const CAR_SCALE = 0.7;

/* side designs: laid flat on the body sides, merged with the body afterwards */
const numMats = new Map();
function numMat(n) {
  let m = numMats.get(n); if (m) return m;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  let size = 96; x.font = `800 ${size}px "Baloo 2", "Trebuchet MS", sans-serif`;
  while (x.measureText(String(n)).width > 104 && size > 40) { size -= 4; x.font = `800 ${size}px "Baloo 2", "Trebuchet MS", sans-serif`; }
  x.fillStyle = '#26315C'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 64, 72);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  m = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }); numMats.set(n, m); return m;
}
function addDecals(K, L, spec) {
  const d = spec.deco; if (!d || d === 'ninguno') return;
  const acc = K.acc, D = L.side, len = D.z1 - D.z0, h = D.h, zc = (D.z0 + D.z1) / 2;
  if (d === 'rayas') (L.tops || []).forEach(T => { const w = T.w || 0.28; [-1, 1].forEach(s => K.A(box(w, 0.03, T.len), acc, s * (w / 2 + 0.07), T.y + 0.012, T.z, T.rx || 0)); });
  [-1, 1].forEach(s => {
    const grp = new THREE.Group(); grp.position.set(s * (D.x + 0.012), D.y, zc); grp.rotation.y = s * Math.PI / 2; K.shell.add(grp);
    // u runs toward the front of the car, v is up
    const put = (geo, m, u, v, rz = 0, sc = 1) => { const o = mesh(geo, m, -s * u, v, 0, false); o.rotation.z = rz; o.scale.setScalar(sc); grp.add(o); return o; };
    if (d === 'rayas') { put(box(len, h * 0.26, 0.02), acc, 0, h * 0.12); put(box(len, h * 0.1, 0.02), acc, 0, -h * 0.2); }
    else if (d === 'llamas') {
      const front = len / 2 - 0.02;
      [[0.3, 0.55], [0.12, 0.85], [-0.06, 1], [-0.24, 0.72], [-0.4, 0.48]].forEach(([vf, lf]) => {
        const Lt = len * 0.62 * lf, r = h * 0.17;
        [['#FF4F5E', 1, 0], ['#FF9B4A', 0.72, 0.008], ['#FFD23F', 0.42, 0.016]].forEach(([c, k, dz]) => {
          const l = Lt * (0.55 + 0.45 * k);
          const o = put(cone(r * k, l, 10), mat(c, { roughness: 0.5 }), front - l / 2, vf * h, -s * Math.PI / 2);
          o.scale.set(1, 1, 0.12); o.position.z = dz;
        });
      });
    } else if (d === 'corazones' || d === 'estrellas') {
      const star = d === 'estrellas', n = Math.max(2, Math.round(len / (star ? 0.62 : 0.75)));
      const k = h * 0.95 / (star ? 0.26 : 0.21);
      for (let i = 0; i < n; i++) {
        const u = (i - (n - 1) / 2) * len / n, small = i % 2 === 1;
        put(star ? starGeo() : heartGeo(), acc, u, small ? h * 0.12 : -h * 0.04, star ? i * 0.5 : (small ? 0.25 : -0.2), k * (small ? 0.7 : 1));
      }
    } else if (d === 'lunares') {
      const r = seeded(11), n = Math.round(len * 3.2), sc = h / 0.46;
      for (let i = 0; i < n; i++) put(disc(r() < 0.5 ? 0.12 : 0.08), acc, (i + 0.5) / n * len - len / 2, (i % 2 ? 0.2 : -0.18) * h + (r() - 0.5) * 0.1 * h, 0, sc);
    } else if (d === 'arcoiris') {
      const bh = h * 0.92 / 6;
      RAINBOW.forEach((c, i) => put(box(len, bh, 0.02), mat(c, { roughness: 0.5 }), 0, h * 0.46 - (i + 0.5) * bh));
    } else if (d === 'vaca') {
      const r = seeded(29), blk = mat('#2E2A3A', { roughness: 0.7 }), sc = h / 0.46, n = Math.max(2, Math.round(len / 0.8));
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n * len - len / 2 + (r() - 0.5) * 0.2, v = (r() - 0.5) * h * 0.4;
        put(disc(0.15), blk, u, v, 0, sc); put(disc(0.1), blk, u + 0.12 * sc, v + 0.08 * sc, 0, sc); put(disc(0.09), blk, u - 0.1 * sc, v - 0.07 * sc, 0, sc);
      }
    } else if (d === 'numero') {
      put(disc(0.5), K.white, 0, 0, 0, h * 0.95);
      put(unitPlane(), numMat(spec.num || 7), 0, 0, 0, h * 0.8).position.z = 0.005;
    }
  });
}

/* headlight eyes, a smile, and neon under-glow */
let _glowTex = null;
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return (_glowTex = new THREE.CanvasTexture(c));
}
const glowMats = new Map();
function glowMat(c) {
  let m = glowMats.get(c);
  if (!m) { m = new THREE.MeshBasicMaterial({ color: c, map: glowTex(), transparent: true, depthWrite: false, fog: false }); glowMats.set(c, m); }
  return m;
}
function addFace(K, L, spec) {
  const ex = spec.extras || [];
  if (ex.includes('pestanas')) L.lightsF.forEach(([x, y, z, r, sx = 1, sy = 1]) => {
    K.A(sph(r * 0.52, 12, 10), K.ink, x - Math.sign(x) * r * 0.1, y - r * 0.12 * sy, z + r * 0.42).scale.set(sx, sy, 0.45);
    K.A(sph(r * 0.17, 8, 6), K.glint, x + r * 0.08 * sx, y + r * 0.14 * sy, z + r * 0.66);
    for (let k = -1; k <= 1; k++) K.A(box(0.035, 0.2, 0.035), K.ink, x + k * r * 0.55 * sx, y + r * sy + 0.07 - (k ? 0.03 : 0), z - 0.02, 0, 0, -k * 0.5);
  });
  if (ex.includes('sonrisa')) { const F = L.face; K.A(G(`smile${F.r}`, () => new THREE.TorusGeometry(F.r, F.r * 0.16, 8, 20, Math.PI)), K.ink, 0, F.y, F.z + 0.03, 0, 0, Math.PI); }
}
function addTopper(K, L, spec, M) {
  const t = spec.topper, R = L.roof; if (!t || t === 'ninguno') return;
  const y = R.y, z = R.z;
  if (t === 'antena') {
    const a = new THREE.Group(); a.position.set(R.x != null ? R.x : -0.85, y, z); a.userData.dynamic = true;
    a.add(mesh(cyl(0.03, 0.03, 1.3, 6), K.trim, 0, 0.65, 0)); a.add(mesh(sph(0.2, 12, 10), K.acc, 0, 1.38, 0));
    K.shell.add(a); M.antenna = a;
  } else if (t === 'orejas') {
    const pink = mat('#FFB3CC', { roughness: 0.7 });
    [-1, 1].forEach(s => { K.A(cone(0.3, 0.55, 12), K.body, s * 0.72, y + 0.24, z, 0, 0, -s * 0.35); K.A(cone(0.17, 0.32, 10), pink, s * 0.71, y + 0.2, z + 0.13, 0, 0, -s * 0.35); });
  } else if (t === 'mono') {
    K.A(sph(0.2, 12, 10), K.acc, 0, y + 0.22, z);
    [-1, 1].forEach(s => { K.A(cone(0.34, 0.6, 14), K.acc, s * 0.36, y + 0.22, z, 0, 0, s * Math.PI / 2); K.A(rbox(0.14, 0.5, 0.06, 0.03), K.acc, s * 0.14, y - 0.02, z + 0.05, 0, 0, s * 0.4); });
  } else if (t === 'cuerno') {
    const N = L.nose, gold = mat('#FFC93C', { roughness: 0.3, metalness: 0.4 }), ax = [0, Math.cos(0.4), Math.sin(0.4)];
    K.A(cone(0.14, 0.8, 14), gold, 0, N.y + 0.34, N.z, 0.4);
    [[0.2, 0.1], [0.45, 0.06]].forEach(([d, r]) => K.A(G(`hring${r}`, () => new THREE.TorusGeometry(r, 0.022, 6, 16)), K.white, 0, N.y - 0.03 + d * ax[1], N.z - 0.156 + d * ax[2], -(Math.PI / 2 - 0.4)));
  } else if (t === 'aleta') {
    const fin = G('sharkfin', () => {
      const sh = new THREE.Shape();
      sh.moveTo(0.6, 0); sh.quadraticCurveTo(0.35, 0.75, -0.4, 1.15); sh.quadraticCurveTo(-0.22, 0.5, -0.5, 0); sh.lineTo(0.6, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 12 });
      g.translate(0, 0, -0.05); g.rotateY(-Math.PI / 2); return g;
    });
    K.A(fin, K.body2, 0, y - 0.02, z);
  } else if (t === 'corona') {
    const gold = mat('#FFC93C', { roughness: 0.25, metalness: 0.45 });
    K.A(cyl(0.5, 0.55, 0.28, 20), gold, 0, y + 0.14, z);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; K.A(cone(0.12, 0.34, 10), gold, Math.sin(a) * 0.47, y + 0.44, z + Math.cos(a) * 0.47); }
    K.A(sph(0.1, 10, 8), mat('#FF4F9A', { roughness: 0.2 }), 0, y + 0.14, z + 0.54);
  } else if (t === 'sirena') {
    K.A(rbox(1.5, 0.16, 0.45, 0.07), K.trim, 0, y + 0.08, z);
    const red = new THREE.MeshStandardMaterial({ color: 0xFF4F5E, emissive: 0xFF2D3F, emissiveIntensity: 0.2, roughness: 0.3 });
    const blue = new THREE.MeshStandardMaterial({ color: 0x4FB6F5, emissive: 0x2E9CFF, emissiveIntensity: 0.2, roughness: 0.3 });
    K.A(sph(0.24, 14, 10), red, -0.42, y + 0.2, z).scale.set(1.2, 0.9, 1); K.A(sph(0.24, 14, 10), blue, 0.42, y + 0.2, z).scale.set(1.2, 0.9, 1);
    M.sirens = [red, blue]; M.mats.push(red, blue);
  }
}
function buildWheel(spin, r, w, style) {
  const W = w + 0.02;
  const add = (geo, m) => { const o = mesh(geo, m); o.rotation.z = Math.PI / 2; spin.add(o); return o; };
  add(cyl(r, r, w, 22), mat('#2B2F45', { roughness: 0.85 }));
  if (style === 'deportiva') {
    add(cyl(r * 0.62, r * 0.62, W, 18), mat('#9AA3B8', { roughness: 0.3, metalness: 0.5 }));
    const cm = mat('#F2F4F8', { roughness: 0.2, metalness: 0.5 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, o = mesh(box(W + 0.02, r * 0.13, r * 0.52), cm, 0, -Math.sin(a) * r * 0.3, Math.cos(a) * r * 0.3); o.rotation.x = a; spin.add(o); }
    add(cyl(r * 0.16, r * 0.16, W + 0.05, 10), mat('#3C4670'));
  } else if (style === 'dorada') {
    const gm = mat('#FFC93C', { roughness: 0.25, metalness: 0.55 });
    add(cyl(r * 0.64, r * 0.64, W, 18), gm);
    add(cyl(r * 0.36, r * 0.36, W + 0.03, 14), mat('#FFE58A', { roughness: 0.3, metalness: 0.3 }));
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; [-1, 1].forEach(s => spin.add(mesh(sph(r * 0.07, 6, 5), gm, s * (W / 2 + 0.01), Math.sin(a) * r * 0.5, Math.cos(a) * r * 0.5))); }
  } else if (style === 'arcoiris') {
    RAINBOW.forEach((c, i) => add(cyl(r * (0.7 - i * 0.1), r * (0.7 - i * 0.1), W + i * 0.012, 18), mat(c, { roughness: 0.5 })));
  } else if (style === 'flor') {
    add(cyl(r * 0.66, r * 0.66, W, 18), mat('#FFFFFF', { roughness: 0.5 }));
    const pm = mat('#FF9CC7', { roughness: 0.5 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, o = mesh(sph(r * 0.2, 10, 8), pm, 0, Math.sin(a) * r * 0.36, Math.cos(a) * r * 0.36); o.scale.set((W / 2 + 0.015) / (r * 0.2), 1, 1.35); o.rotation.x = -a; spin.add(o); }
    add(cyl(r * 0.17, r * 0.17, W + 0.05, 12), mat('#FFD23F', { roughness: 0.5 }));
  } else {
    add(cyl(r * 0.5, r * 0.5, W, 16), mat('#FFFFFF', { roughness: 0.4 }));
    spin.add(mesh(box(W + 0.02, r * 0.16, r * 0.8), mat('#C9C3D6', { roughness: 0.4 })));
  }
}
function buildCarModel(spec) {
  const T = CAR_TYPE[spec.type] || CAR_TYPES[0];
  const K = carKit(spec), L = T.build(K);
  const g = new THREE.Group(); g.userData.dynamic = true; g.add(K.shell); g.scale.setScalar(CAR_SCALE);
  // hw/hl/camY en metros del mundo; sy, seat y passenger quedan en unidades locales del auto
  const M = { g, shell: K.shell, spec, type: T, stats: T.stats, wheels: [], disposables: [], mats: [], k: CAR_SCALE,
    hw: L.hw * CAR_SCALE, hl: L.hl * CAR_SCALE, camY: L.camY * CAR_SCALE, sy: L.sy,
    seat: L.seat, passenger: L.passenger, steerWheel: null, antenna: null, sirens: null };
  const headM = mat('#FFF6C9', { emissive: '#FFE58A', emissiveIntensity: 0.45 }), tailM = mat('#FF4F5E', { emissive: '#FF2D3F', emissiveIntensity: 0.3 });
  L.lightsF.forEach(([x, y, z, r, sx = 1, sy = 1]) => K.A(sph(r, 14, 10), headM, x, y, z).scale.set(sx, sy, 0.6));
  L.lightsB.forEach(([x, y, z, r, sx = 1, sy = 1]) => K.A(sph(r, 12, 8), tailM, x, y, z).scale.set(sx, sy, 0.5));
  addFace(K, L, spec); addDecals(K, L, spec); addTopper(K, L, spec, M);
  // steering wheel in front of the driver's hands
  const sx = L.seat.x, swy = L.sy + 0.6, swz = L.seat.z + 0.64;
  K.tube([sx, swy, swz], [sx, swy - 0.4, swz + 0.6], 0.05, K.trim);
  const sw = new THREE.Group(); sw.position.set(sx, swy, swz); sw.rotation.x = 0.6; sw.userData.dynamic = true; K.shell.add(sw);
  const swSpin = new THREE.Group(); sw.add(swSpin);
  swSpin.add(mesh(G('swRing', () => new THREE.TorusGeometry(0.26, 0.045, 8, 24)), K.trim));
  swSpin.add(mesh(box(0.5, 0.07, 0.05), K.trim));
  const hub = mesh(cyl(0.09, 0.09, 0.08, 12), K.acc, 0, 0, 0.02); hub.rotation.x = Math.PI / 2; swSpin.add(hub);
  M.steerWheel = swSpin;
  // merge every static piece of the body into a few draw calls
  K.shell.updateMatrixWorld(true);
  const list = [];
  (function walk(o) { if (o !== K.shell && o.userData.dynamic) return; if (o.isMesh && !o.material.transparent && !o.material.map) list.push(o); o.children.forEach(walk); })(K.shell);
  mergeInto(K.shell, list, false).forEach(m => M.disposables.push(m.geometry));
  L.wheels.forEach(([x, z, r, w]) => {
    const pivot = new THREE.Group(); pivot.position.set(x, r, z);
    const spin = new THREE.Group(); pivot.add(spin);
    buildWheel(spin, r, w, spec.rims);
    mergeChildren(spin).forEach(m => M.disposables.push(m.geometry));
    g.add(pivot); M.wheels.push({ pivot, spin, front: z > 0, r: r * CAR_SCALE });
  });
  if ((spec.extras || []).includes('neon')) {
    const p = new THREE.Mesh(unitPlane(), glowMat(spec.accent)); p.rotation.x = -Math.PI / 2; p.position.y = 0.1;
    p.scale.set(L.hw * 2 + 1.6, L.hl * 2 + 1.6, 1); p.renderOrder = 2; g.add(p);
  }
  M.dispose = () => { M.disposables.forEach(x => x.dispose()); M.mats.forEach(x => x.dispose()); };
  return M;
}

export { buildCarModel };
