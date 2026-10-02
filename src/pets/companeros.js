// Compañeros de la mascota (la Mascotienda, pasillo de Compañeros): uno a la vez (`extras.companero`).
//   mariposa  revolotea alrededor de la cabeza de la mascota dibujando un ocho, se queda un poco atrás cuando ella
//             corre (vive en la escena, no dentro de la mascota, y la sigue con retraso) y aletea rápido
// `ponerCompanero(P, id)` lo arma o lo quita; `moverCompanero(P, t, dt)` lo mueve (desde pets/extras.js).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';

const _h = new THREE.Vector3(), _m = new THREE.Vector3();
function mariposa() {
  const g = new THREE.Group(), alas = [];
  // las alas: dos pares (las de arriba más grandes, rosadas; las de abajo, lilas) con lunares blancos. Sin sombreado
  // (MeshBasic): con luz, de lado al sol se veían pálidas
  const ala = (fondo, borde) => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = borde; x.fillRect(0, 0, 64, 64); x.fillStyle = fondo; x.fillRect(5, 5, 54, 54);
    x.fillStyle = '#FFFFFF'; [[40, 24, 7], [22, 42, 5], [48, 46, 4]].forEach(([cx, cy, r]) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); });
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.DoubleSide });
  };
  const mats = [ala('#FF4FA0', '#B0306E'), ala('#9B5CF0', '#5B32A8')];
  const arriba = new THREE.Shape(); arriba.moveTo(0, 0); arriba.bezierCurveTo(0.03, 0.09, 0.12, 0.11, 0.13, 0.05); arriba.bezierCurveTo(0.13, 0.01, 0.06, 0, 0, 0);
  const abajo = new THREE.Shape(); abajo.moveTo(0, 0); abajo.bezierCurveTo(0.06, -0.01, 0.1, -0.04, 0.08, -0.08); abajo.bezierCurveTo(0.05, -0.1, 0.02, -0.05, 0, 0);
  const geos = [new THREE.ShapeGeometry(arriba), new THREE.ShapeGeometry(abajo)];
  geos.forEach(gg => { gg.computeBoundingBox(); const b = gg.boundingBox, uv = gg.attributes.uv, p = gg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y)); });
  for (const s of [-1, 1]) {
    const lado = new THREE.Group(); lado.scale.x = s; g.add(lado);
    geos.forEach((gg, i) => { const m = new THREE.Mesh(gg, mats[i]); m.rotation.x = -Math.PI / 2; lado.add(m); });   // (acostadas: el cuerpo va a lo largo de z)
    alas.push({ ala: lado, s });
  }
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.07, 4, 8), new THREE.MeshStandardMaterial({ color: '#3B2A55' })); cuerpo.rotation.x = Math.PI / 2; g.add(cuerpo);
  for (const s of [-1, 1]) { const an = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.05, 4), cuerpo.material); an.position.set(s * 0.012, 0.015, 0.055); an.rotation.set(0.9, 0, -s * 0.4); g.add(an); }
  g.traverse(o => { o.castShadow = false; });
  return { g, alas, mats: [...mats, cuerpo.material], geos: [...geos, cuerpo.geometry] };
}
const HACER = { mariposa };
export const COMPANEROS = Object.keys(HACER);

export function ponerCompanero(P, id) {
  id = HACER[id] ? id : null;
  if (P.companero && P.companero.id === id) return;
  if (P.companero) { const C = P.companero; scene.remove(C.g); C.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); C.mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); P.companero = null; }
  if (id) { const C = HACER[id](); C.id = id; C.pos = null; P.companero = C; scene.add(C.g); }
}
export function moverCompanero(P, t, dt) {
  const C = P.companero; if (!C) return;
  C.g.visible = P.root.parent === scene;
  if (!C.g.visible) return;
  // a dónde quiere ir: un ocho alrededor de la cabeza (en el mundo), un poco más arriba
  (P.head || P.body).getWorldPosition(_h);
  const s = P.root.scale.x, r = 0.35 * s + 0.2, a = t * 1.3;
  _m.set(_h.x + Math.sin(a) * r, _h.y + 0.2 * s + 0.1 + Math.sin(a * 2) * 0.1, _h.z + Math.sin(a * 2) * r * 0.5);
  if (!C.pos || C.pos.distanceTo(_m) > 6) C.pos = _m.clone();
  const antes = C.pos.clone();
  C.pos.lerp(_m, Math.min(1, dt * 2.5));   // la sigue con retraso
  C.g.position.copy(C.pos);
  const dx = C.pos.x - antes.x, dz = C.pos.z - antes.z;
  if (Math.hypot(dx, dz) > 1e-4) C.g.rotation.y = Math.atan2(dx, dz);   // mira hacia donde vuela
  const aleteo = Math.sin(t * 22);
  C.alas.forEach(({ ala, s: lado }) => { ala.rotation.z = lado * (0.2 + aleteo * 0.9); });
  C.g.scale.setScalar(2.4 * Math.max(0.7, s + 0.3));
}
