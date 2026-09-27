// Geometrías con caché y constructores de mallas.
import { THREE } from './three.js';
import { clamp } from '../core/math.js';

const geoCache = new Map();
function G(key, fn) { let g = geoCache.get(key); if (!g) { g = fn(); geoCache.set(key, g); } return g; }
const box = (w, h, d) => G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const sph = (r, ws = 20, hs = 14) => G(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
const cyl = (rt, rb, h, s = 20) => G(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const cone = (r, h, s = 16) => G(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));

/* rounded box with analytic normals — the soft "toy" look */
function rbox(w, h, d, r, seg = 6) {
  r = Math.min(r, w / 2, h / 2, d / 2) * 0.999;
  return G(`rb${w},${h},${d},${r},${seg}`, () => {
    const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg);
    const p = g.attributes.position, n = g.attributes.normal;
    const half = [w / 2, h / 2, d / 2];
    const v = new THREE.Vector3();
    const c = [0, 0, 0], out = [0, 0, 0], inner = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      c[0] = p.getX(i); c[1] = p.getY(i); c[2] = p.getZ(i);
      for (let a = 0; a < 3; a++) {
        const idx = Math.round((c[a] + 0.5) * seg), H = half[a];
        const map = seg === 6 ? [-H, -H + r / 2, -H + r, 0, H - r, H - r / 2, H] : [-H, -H + r, 0, H - r, H];
        out[a] = map[idx];
        inner[a] = clamp(out[a], -(H - r), H - r);
      }
      v.set(out[0] - inner[0], out[1] - inner[1], out[2] - inner[2]);
      if (v.lengthSq() > 1e-10) v.normalize(); else v.set(0, 1, 0);
      p.setXYZ(i, inner[0] + v.x * r, inner[1] + v.y * r, inner[2] + v.z * r);
      n.setXYZ(i, v.x, v.y, v.z);
    }
    return g;
  });
}
const rlo = (w, h, d, r) => rbox(w, h, d, r, 4);

function mesh(geo, m, x = 0, y = 0, z = 0, cast = true, recv = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = recv; return o;
}
const heartGeo = () => G('heart', () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.1); s.bezierCurveTo(-0.02, -0.08, -0.13, -0.02, -0.12, 0.04); s.bezierCurveTo(-0.11, 0.1, -0.03, 0.11, 0, 0.05);
  s.bezierCurveTo(0.03, 0.11, 0.11, 0.1, 0.12, 0.04); s.bezierCurveTo(0.13, -0.02, 0.02, -0.08, 0, -0.1);
  return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 10 });
});
const starGeo = () => G('star', () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.055 : 0.13; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
});
const disc = r => G(`disc${r}`, () => new THREE.CircleGeometry(r, 16));
const _UP = new THREE.Vector3(0, 1, 0), _tv = new THREE.Vector3();
function tube(parent, a, b, r, m) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.round(Math.hypot(dx, dy, dz) * 1000) / 1000;
  const o = mesh(cyl(r, r, len, 10), m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  o.quaternion.setFromUnitVectors(_UP, _tv.set(dx, dy, dz).normalize());
  parent.add(o); return o;
}
const unitPlane = () => G('unitPlane', () => new THREE.PlaneGeometry(1, 1));

export { G, box, cone, cyl, disc, heartGeo, mesh, rbox, rlo, sph, starGeo, tube, unitPlane };
