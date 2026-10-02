// El hueso eterno (juguete de la Mascotienda): si la mascota lo tiene, cuando se sienta o se acuesta a esperar
// (pets/follow.js) lo saca y lo roe: el hueso en la boca y la cabeza que muerde. Se guarda al levantarse.
import { THREE } from '../engine/three.js';

// como la imagen de referencia: un palo grueso y redondeado, con dos bolas grandes en cada punta, color crema; más
// ancho que la cabeza (se ve bien desde lejos)
function hacerHueso(R) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#F4EFC6', roughness: 0.45 }), L = R * 1.7;
  const palo = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.15, L, 6, 14), m); palo.rotation.z = Math.PI / 2; g.add(palo);
  for (const s of [-1, 1]) for (const d of [-1, 1]) {
    const bola = new THREE.Mesh(new THREE.SphereGeometry(R * 0.26, 16, 12), m); bola.position.set(s * (L / 2 + R * 0.05), d * R * 0.22, 0); g.add(bola);
  }
  return g;
}
// cada cuadro, después de animatePet: `roe` = está sentada o acostada (y tiene el hueso)
export function roerHueso(P, roe, t, dt) {
  if (!roe && !P.hueso) return;
  const R = (P.medidas && P.medidas.cabezaR) || 0.25;
  if (!P.hueso) { P.hueso = hacerHueso(R); P.hueso.position.set(0, -R * 0.45, R * 1.0); P.head.add(P.hueso); P.huesoK = 0; }
  P.huesoK = Math.max(0, Math.min(1, P.huesoK + (roe ? dt : -dt) * 3));
  P.hueso.visible = P.huesoK > 0.02; P.hueso.scale.setScalar(Math.max(0.001, P.huesoK));
  if (roe) { P.head.rotation.x += 0.18 + Math.abs(Math.sin(t * 9)) * 0.12; P.hueso.rotation.z = Math.sin(t * 4.5) * 0.25; }   // muerde
}
