// Efectos de las pociones de la Mascotienda que dejan algo en el aire (pets/extras.js los llama cada cuadro):
//   brillo    al andar deja una estela de estrellitas de colores que suben, giran y se apagan
//   burbujas  de vez en cuando le salen burbujas de jabón que suben bamboleándose y se revientan
// Las partículas viven en la escena (no en la mascota): se quedan donde salieron. Se reciclan (hay un máximo).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { RAINBOW } from '../engine/materials.js';

const MAX = 90, vivas = [];
let geoEstrella = null, geoBurbuja = null;
function estrella() {
  if (geoEstrella) return geoEstrella;
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.055 : 0.13; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return (geoEstrella = new THREE.ShapeGeometry(s));
}
function nueva(tipo, x, y, z) {
  if (vivas.length >= MAX) quitar(vivas[0]);
  let m;
  if (tipo === 'brillo') {
    m = new THREE.Mesh(estrella(), new THREE.MeshBasicMaterial({ color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)], transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  } else {
    geoBurbuja = geoBurbuja || new THREE.SphereGeometry(1, 14, 10);
    m = new THREE.Mesh(geoBurbuja, new THREE.MeshStandardMaterial({ color: 0xDFF6FF, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x9FE3FF, emissiveIntensity: 0.25, metalness: 0.2, depthWrite: false }));
  }
  // (vida larga y subida rápida: la estela llega alto; con su tamaño desde que nace: la esfera mide 1 m de radio y, si
  // esperaba al cuadro siguiente para achicarse, se veía un instante una burbuja gigante que parpadeaba)
  const p = { tipo, m, t: 0, vida: tipo === 'brillo' ? 2.2 + Math.random() * 0.6 : 4.5 + Math.random() * 1.5, r: tipo === 'burbuja' ? 0.09 + Math.random() * 0.08 : 1, fase: Math.random() * 6 };
  m.scale.setScalar(p.r);
  m.position.set(x, y, z); m.castShadow = false; scene.add(m);
  vivas.push(p);
  return p;
}
function quitar(p) { scene.remove(p.m); p.m.material.dispose(); vivas.splice(vivas.indexOf(p), 1); }

// cada mascota con brillo o burbujas va soltando (P.efectoT lleva la cuenta); `alto`: dónde está su lomo, en metros
export function soltarEfectos(P, dt, anda) {
  const E = P.extras || {}, R = P.root.position, s = P.root.scale.x, lomo = ((P.medidas && P.medidas.alto) || 0.6) * s + P.body.position.y * s;
  P.efectoT = (P.efectoT || 0) - dt;
  if (P.efectoT > 0) return;
  if (E.brillo && anda) { nueva('brillo', R.x + (Math.random() - 0.5) * 0.3, R.y + lomo * (0.4 + Math.random() * 0.6), R.z + (Math.random() - 0.5) * 0.3); P.efectoT = 0.06; }
  else if (E.burbujas) { nueva('burbuja', R.x + (Math.random() - 0.5) * 0.4, R.y + lomo * 0.9, R.z + (Math.random() - 0.5) * 0.4); P.efectoT = anda ? 0.25 : 0.45; }
  else P.efectoT = 0.1;
}
// mover todas las partículas, una vez por cuadro aunque se llame por cada mascota (lo llama animatePet: así las que ya
// salieron terminan aunque se quite la poción)
let ultimo = 0;
export function moverEfectos() {
  if (!vivas.length) return;
  const ahora = performance.now(), dt = Math.min(0.05, (ahora - ultimo) / 1000);
  if (dt < 0.004) return;
  ultimo = ahora;
  for (let i = vivas.length - 1; i >= 0; i--) {
    const p = vivas[i]; p.t += dt;
    const u = p.t / p.vida;
    if (u >= 1) { quitar(p); continue; }
    if (p.tipo === 'brillo') {
      p.m.position.y += dt * 1.1; p.m.position.x += Math.sin(p.t * 2 + p.fase) * dt * 0.12; p.m.rotation.y += dt * 4; p.m.rotation.z += dt * 2;
      p.m.material.opacity = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4; p.m.scale.setScalar(1 - u * 0.5);
    } else {
      p.m.position.y += dt * 0.75; p.m.position.x += Math.sin(p.t * 2.2 + p.fase) * dt * 0.2;
      const pop = u > 0.92 ? 1 + (u - 0.92) * 6 : 1;   // al final se agranda y revienta
      p.m.scale.setScalar(p.r * pop); p.m.material.opacity = u > 0.92 ? 0.55 * (1 - (u - 0.92) / 0.08) : 0.55;
    }
  }
}
