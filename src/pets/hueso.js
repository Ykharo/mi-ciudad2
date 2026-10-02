// El hueso eterno (juguete de la Mascotienda): si la mascota lo tiene, cuando se sienta o se acuesta a esperar
// (pets/follow.js) lo saca y lo roe: el hueso en la boca y la cabeza que muerde. Se guarda al levantarse.
import { THREE } from '../engine/three.js';

function hacerHueso(R) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#FFF3DC', roughness: 0.6 }), L = R * 0.9;
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.07, R * 0.07, L, 8), m); palo.rotation.z = Math.PI / 2; g.add(palo);
  for (const s of [-1, 1]) for (const d of [-1, 1]) g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.11, 10, 8), m)).position.set(s * L / 2, d * R * 0.08, 0);
  return g;
}
// cada cuadro, después de animatePet: `roe` = está sentada o acostada (y tiene el hueso)
export function roerHueso(P, roe, t, dt) {
  if (!roe && !P.hueso) return;
  const R = (P.medidas && P.medidas.cabezaR) || 0.25;
  if (!P.hueso) { P.hueso = hacerHueso(R); P.hueso.position.set(0, -R * 0.42, R * 0.9); P.head.add(P.hueso); P.huesoK = 0; }
  P.huesoK = Math.max(0, Math.min(1, P.huesoK + (roe ? dt : -dt) * 3));
  P.hueso.visible = P.huesoK > 0.02; P.hueso.scale.setScalar(Math.max(0.001, P.huesoK));
  if (roe) { P.head.rotation.x += 0.18 + Math.abs(Math.sin(t * 9)) * 0.12; P.hueso.rotation.z = Math.sin(t * 4.5) * 0.25; }   // muerde
}
