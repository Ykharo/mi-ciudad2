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
// el pajarito: redondo y celeste, con pico naranja y alas que aletean; vuela en círculos alrededor de la mascota y
// cada tanto se posa en su cabeza un rato (moverCompanero)
function pajarito() {
  const g = new THREE.Group(), azul = new THREE.MeshStandardMaterial({ color: '#4FB6F5', roughness: 0.5 }), panza = new THREE.MeshStandardMaterial({ color: '#FFF3C4', roughness: 0.6 });
  const naranja = new THREE.MeshStandardMaterial({ color: '#FF9A3C' }), negro = new THREE.MeshStandardMaterial({ color: '#1F1B2E' });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), azul));
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 8), panza); p.position.set(0, -0.01, 0.018); g.add(p);
  const pico = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.028, 8), naranja); pico.rotation.x = Math.PI / 2; pico.position.set(0, 0.005, 0.055); g.add(pico);
  for (const s of [-1, 1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), negro); o.position.set(s * 0.022, 0.018, 0.042); g.add(o); }
  const cola = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 4), azul); cola.rotation.x = -Math.PI / 2 - 0.4; cola.position.set(0, 0.01, -0.055); cola.scale.set(1.4, 1, 0.4); g.add(cola);
  const alas = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * 0.04, 0.01, 0); g.add(piv);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 6), azul); a.scale.set(1, 0.25, 0.7); a.position.x = s * 0.03; piv.add(a);
    return { ala: piv, s };
  });
  for (const s of [-1, 1]) { const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.025, 4), naranja); pata.position.set(s * 0.015, -0.055, 0); g.add(pata); }
  g.traverse(o => { o.castShadow = false; });
  return { g, alas, mats: [azul, panza, naranja, negro], vuelo: 'pajaro', posado: 0, siguiente: 6 };
}
// el ratoncito: va montado en el lomo de la mascota (dentro de ella: se mueve con ella), mira para los lados, mueve
// los bigotes y la colita, y cada tanto se para en dos patas
function raton(P) {
  const M = P.medidas, k = M.ancho * 1.8, g = new THREE.Group(), gris = new THREE.MeshStandardMaterial({ color: '#B9B9CC', roughness: 0.6 });
  const rosa = new THREE.MeshStandardMaterial({ color: '#FF9DB5' }), negro = new THREE.MeshStandardMaterial({ color: '#1F1B2E' });
  const cuerpo = new THREE.Group(); g.add(cuerpo);
  const c = new THREE.Mesh(new THREE.SphereGeometry(0.1 * k, 12, 10), gris); c.scale.set(0.9, 0.8, 1.2); c.position.y = 0.07 * k; cuerpo.add(c);
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.11 * k, 0.1 * k); cuerpo.add(cabeza);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.065 * k, 12, 10), gris); h.scale.set(1, 0.9, 1.15); cabeza.add(h);
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.014 * k, 8, 6), rosa); nariz.position.set(0, 0, 0.075 * k); cabeza.add(nariz);
  for (const s of [-1, 1]) {
    const oreja = new THREE.Mesh(new THREE.CircleGeometry(0.045 * k, 14), rosa); oreja.position.set(s * 0.05 * k, 0.06 * k, -0.01 * k); oreja.rotation.y = s * 0.3; cabeza.add(oreja);
    const borde = new THREE.Mesh(new THREE.CircleGeometry(0.055 * k, 14), gris); borde.position.copy(oreja.position).add(new THREE.Vector3(0, 0, -0.003)); borde.rotation.y = oreja.rotation.y; cabeza.add(borde);
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.012 * k, 8, 6), negro); ojo.position.set(s * 0.028 * k, 0.018 * k, 0.05 * k); cabeza.add(ojo);
  }
  const bigotes = new THREE.Group(); bigotes.position.set(0, -0.005 * k, 0.07 * k); cabeza.add(bigotes);
  for (const s of [-1, 1]) for (const d of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06 * k, 0.002, 0.002), negro); b.position.x = s * 0.03 * k; b.rotation.z = d * 0.15 * s; bigotes.add(b); }
  const cola = new THREE.Mesh(new THREE.TorusGeometry(0.07 * k, 0.006 * k + 0.002, 4, 16, Math.PI * 1.2), rosa); cola.position.set(0, 0.06 * k, -0.15 * k); cola.rotation.y = Math.PI / 2; cuerpo.add(cola);
  g.position.set(0, 0.01, 0);
  P.anclas.lomo.add(g);
  g.traverse(o => { o.castShadow = false; });
  return { g, cuerpo, cabeza, bigotes, cola, mats: [gris, rosa, negro], montado: true, para: 0, siguiente: 5 };
}
const HACER = { mariposa, pajarito, raton };
export const COMPANEROS = Object.keys(HACER);

export function ponerCompanero(P, id) {
  id = HACER[id] ? id : null;
  if (P.companero && P.companero.id === id) return;
  if (P.companero) { const C = P.companero; C.g.parent && C.g.parent.remove(C.g); C.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); C.mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); P.companero = null; }
  if (id) { const C = HACER[id](P); C.id = id; C.pos = null; P.companero = C; if (!C.montado) scene.add(C.g); }
}
// el ratoncito: mira para los lados, bigotes y colita; cada tanto se para en dos patas a mirar
function moverRaton(C, t, dt) {
  C.cabeza.rotation.y = Math.sin(t * 0.9) * 0.6; C.cabeza.rotation.x = Math.sin(t * 1.7) * 0.1;
  C.bigotes.rotation.z = Math.sin(t * 20) * 0.08;
  C.cola.rotation.z = Math.sin(t * 3) * 0.3;
  C.siguiente -= dt;
  if (C.siguiente <= 0) { C.para = 1.6; C.siguiente = 5 + Math.random() * 4; }
  C.para = Math.max(0, C.para - dt);
  const u = C.para > 0 ? Math.min(1, Math.min(C.para, 1.6 - C.para) * 4) : 0;   // sube, se queda, baja
  C.cuerpo.rotation.x = -0.9 * u; C.cuerpo.position.y = 0.04 * u;
}
export function moverCompanero(P, t, dt) {
  const C = P.companero; if (!C) return;
  if (C.montado) { moverRaton(C, t, dt); return; }
  C.g.visible = P.root.parent === scene;
  if (!C.g.visible) return;
  (P.head || P.body).getWorldPosition(_h);
  const s = P.root.scale.x;
  // a dónde quiere ir: la mariposa, un ocho alrededor de la cabeza; el pajarito, círculos más amplios y a veces se
  // posa en la cabeza un rato
  let posado = false;
  if (C.vuelo === 'pajaro') {
    C.siguiente -= dt;
    if (C.siguiente <= 0 && C.posado <= 0) { C.posado = 4; C.siguiente = 9 + Math.random() * 5; }
    C.posado = Math.max(0, C.posado - dt);
    posado = C.posado > 0;
  }
  const a = t * (C.vuelo === 'pajaro' ? 1.1 : 1.3), r = (C.vuelo === 'pajaro' ? 0.6 : 0.35) * s + 0.2;
  if (posado) _m.set(_h.x, _h.y + ((P.medidas.cabezaR || 0.25) * 0.95 + 0.02) * s + 0.045 * 2.4 * Math.max(0.7, s + 0.3) * 0.5, _h.z);
  else _m.set(_h.x + Math.sin(a) * r, _h.y + 0.2 * s + 0.1 + Math.sin(a * 2) * 0.1, _h.z + (C.vuelo === 'pajaro' ? Math.cos(a) * r : Math.sin(a * 2) * r * 0.5));
  if (!C.pos || C.pos.distanceTo(_m) > 6) C.pos = _m.clone();
  const antes = C.pos.clone();
  C.pos.lerp(_m, Math.min(1, dt * (posado ? 6 : 2.5)));   // la sigue con retraso (posado, se queda en la cabeza)
  C.g.position.copy(C.pos);
  const dx = C.pos.x - antes.x, dz = C.pos.z - antes.z;
  if (Math.hypot(dx, dz) > 1e-4 && !posado) C.g.rotation.y = Math.atan2(dx, dz);   // mira hacia donde vuela
  else if (posado) C.g.rotation.y = P.root.rotation.y;                               // posado, mira para donde ella
  const quieto = posado && C.pos.distanceTo(_m) < 0.05;
  const aleteo = Math.sin(t * (C.vuelo === 'pajaro' ? 30 : 22));
  C.alas.forEach(({ ala, s: lado }) => { ala.rotation.z = quieto ? lado * -0.1 : lado * (0.2 + aleteo * 0.9); });
  C.g.scale.setScalar(2.4 * Math.max(0.7, s + 0.3));
}
