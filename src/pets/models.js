// Mascotas: modelos y animación.
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { RAINBOW, mat, shade, tint } from '../engine/materials.js';
import { cone, cyl, mesh, rbox, sph } from '../engine/geometry.js';
import { mergeChildren } from '../engine/merge.js';
import { labelSprite } from '../engine/textures.js';

/* ================= PETS ================= */
const PET_KINDS = [{ id: 'perro', name: 'Perrito', ic: '🐶' }, { id: 'gato', name: 'Gatito', ic: '🐱' }, { id: 'conejo', name: 'Conejito', ic: '🐰' }, { id: 'unicornio', name: 'Unicornio', ic: '🦄' }];
const PET_COLORS = ['#F5E6D3', '#E9B77A', '#C98B4F', '#6B4A35', '#34313F', '#FFFFFF', '#B9B9CC', '#FFB8D6', '#BFD8FF'];
const PET_NAMES = ['Toby', 'Luna', 'Nube', 'Coco', 'Maní', 'Bombón', 'Estrella', 'Galleta', 'Pelusa', 'Canela', 'Copito', 'Chispa', 'Frutilla', 'Algodón'];

// Mapa de anclajes de cada especie: dónde va cada cosa que se le pone a una mascota (pets/extras.js: alitas, mochilas,
// capas, monturas, cohetes, collares, sombreros…). Coordenadas en metros, en el espacio del cuerpo (x a la izquierda o
// derecha, y arriba desde el suelo, z hacia adelante), salvo `cabeza`, que va en el espacio de la cabeza (sigue sus
// giros). Se hicieron con las medidas de buildPet: si cambia una forma, revisar sus anclajes.
//   espalda  sobre los hombros (alas, mochila, cohete)      lomo   el centro del lomo (montura, capa)
//   cuello   collar, bufanda                                cabeza lo alto de la cabeza (sombrero, corona)
//   cola     el nacimiento de la cola
//   medidas: ancho y largo del cuerpo, y `alto` (el lomo sobre el suelo) para calzar cosas alrededor
export const ANCLAJES = {
  perro: { espalda: [0, 0.65, 0.1], lomo: [0, 0.65, -0.05], cuello: [0, 0.62, 0.24], cabeza: [0, 0.27, 0], cola: [0, 0.58, -0.32], ancho: 0.44, largo: 0.66, alto: 0.65 },
  gato: { espalda: [0, 0.59, 0.08], lomo: [0, 0.59, -0.04], cuello: [0, 0.6, 0.2], cabeza: [0, 0.25, 0], cola: [0, 0.5, -0.3], ancho: 0.36, largo: 0.6, alto: 0.59 },
  conejo: { espalda: [0, 0.6, 0.02], lomo: [0, 0.6, -0.06], cuello: [0, 0.56, 0.14], cabeza: [0, 0.22, 0], cola: [0, 0.38, -0.33], ancho: 0.54, largo: 0.66, alto: 0.6 },
  unicornio: { espalda: [0, 0.89, 0.12], lomo: [0, 0.89, -0.08], cuello: [0, 1.0, 0.32], cabeza: [0, 0.14, 0.04], cola: [0, 0.82, -0.38], ancho: 0.42, largo: 0.74, alto: 0.89 },
};

function buildPet(kind, color) {
  const P = { kind, color, root: new THREE.Group(), body: new THREE.Group(), legs: [], tail: null, head: null, phase: 0, disposables: [] };
  P.root.add(P.body);
  const c = mat(color, { roughness: 0.8 }), dk = mat(shade(color, 0.72), { roughness: 0.8 }), lt = mat(tint(color, 0.5), { roughness: 0.8 });
  const eye = mat('#1F1B2E', { roughness: 0.25 }), pink = mat('#FF9DB5', { roughness: 0.7 }), B = P.body;
  P.mats = { c, dk, lt };   // los del pelaje (compartidos: pets/extras.js los cambia por copias propias)
  const head = new THREE.Group(); P.head = head;
  const leg = (x, y, z, w, h) => { const l = new THREE.Group(); l.position.set(x, y, z); l.add(mesh(rbox(w, h, w + 0.01, w * 0.4), c, 0, -h / 2, 0)); B.add(l); P.legs.push(l); };
  const eyes = (x, y, z, r = 0.045) => [-1, 1].forEach(s => { head.add(mesh(sph(r, 10, 8), eye, s * x, y, z)); head.add(mesh(sph(r * 0.35, 6, 5), mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.6 }), s * x + r * 0.35, y + r * 0.4, z + r * 0.8, false)); });
  if (kind === 'perro') {
    B.add(mesh(rbox(0.44, 0.38, 0.66, 0.16), c, 0, 0.46, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => leg(a * 0.14, 0.34, b * 0.21, 0.13, 0.32));
    head.position.set(0, 0.74, 0.34);
    head.add(mesh(sph(0.27, 18, 14), c));
    head.add(mesh(rbox(0.22, 0.15, 0.2, 0.07), lt, 0, -0.06, 0.24));
    head.add(mesh(sph(0.055, 10, 8), eye, 0, -0.0, 0.34));
    head.add(mesh(rbox(0.08, 0.03, 0.1, 0.015), pink, 0, -0.14, 0.3));
    eyes(0.1, 0.06, 0.23);
    [-1, 1].forEach(s => { const e = mesh(rbox(0.11, 0.26, 0.16, 0.05), dk, s * 0.24, -0.02, 0); e.rotation.z = s * 0.25; head.add(e); });
    const t = new THREE.Group(); t.position.set(0, 0.58, -0.32); t.rotation.x = -0.6; t.add(mesh(cyl(0.05, 0.035, 0.32, 8), c, 0, 0.16, 0)); B.add(t); P.tail = t;
  } else if (kind === 'gato') {
    B.add(mesh(rbox(0.36, 0.34, 0.6, 0.15), c, 0, 0.42, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => leg(a * 0.11, 0.3, b * 0.19, 0.11, 0.3));
    head.position.set(0, 0.7, 0.3);
    head.add(mesh(sph(0.25, 18, 14), c));
    [-1, 1].forEach(s => { const e = mesh(cone(0.1, 0.2, 12), c, s * 0.14, 0.22, 0); e.rotation.z = -s * 0.25; head.add(e); const i = mesh(cone(0.055, 0.12, 10), pink, s * 0.14, 0.2, 0.05); i.rotation.z = -s * 0.25; head.add(i); });
    head.add(mesh(sph(0.035, 8, 6), pink, 0, -0.03, 0.245));
    head.add(mesh(rbox(0.16, 0.09, 0.06, 0.03), lt, 0, -0.08, 0.22));
    eyes(0.1, 0.05, 0.21, 0.05);
    const t = new THREE.Group(); t.position.set(0, 0.5, -0.3); t.rotation.x = -0.35;
    t.add(mesh(cyl(0.045, 0.04, 0.55, 8), c, 0, 0.27, 0)); t.add(mesh(sph(0.055, 8, 6), dk, 0, 0.56, 0)); B.add(t); P.tail = t;
  } else if (kind === 'conejo') {
    const b = mesh(sph(0.3, 18, 14), c, 0, 0.34, 0); b.scale.set(1, 0.9, 1.1); B.add(b);
    [[-1, 1], [1, 1]].forEach(([a]) => leg(a * 0.1, 0.16, 0.18, 0.1, 0.14));
    [-1, 1].forEach(s => { const f = new THREE.Group(); f.position.set(s * 0.15, 0.12, -0.1); f.add(mesh(rbox(0.13, 0.1, 0.26, 0.05), c, 0, -0.07, 0.02)); B.add(f); P.legs.push(f); });
    head.position.set(0, 0.64, 0.2);
    head.add(mesh(sph(0.22, 18, 14), c));
    [-1, 1].forEach(s => { const e = mesh(rbox(0.1, 0.42, 0.07, 0.045), c, s * 0.08, 0.32, -0.02); e.rotation.z = s * 0.15; head.add(e); const i = mesh(rbox(0.05, 0.3, 0.02, 0.02), pink, s * 0.085, 0.31, 0.02); i.rotation.z = s * 0.15; head.add(i); });
    head.add(mesh(sph(0.04, 8, 6), pink, 0, -0.02, 0.215));
    eyes(0.09, 0.05, 0.18);
    const t = new THREE.Group(); t.position.set(0, 0.38, -0.33); t.add(mesh(sph(0.1, 10, 8), mat('#FFFFFF'), 0, 0, 0)); B.add(t); P.tail = t;
  } else { // unicornio
    B.add(mesh(rbox(0.42, 0.42, 0.74, 0.17), c, 0, 0.68, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { leg(a * 0.14, 0.52, b * 0.25, 0.13, 0.5); P.legs[P.legs.length - 1].add(mesh(rbox(0.14, 0.08, 0.15, 0.03), mat('#C9A0E8'), 0, -0.47, 0)); });
    const neck = mesh(rbox(0.22, 0.42, 0.22, 0.09), c, 0, 0.97, 0.3); neck.rotation.x = 0.45; B.add(neck);
    head.position.set(0, 1.18, 0.44);
    head.add(mesh(rbox(0.26, 0.26, 0.42, 0.11), c, 0, 0, 0.08));
    head.add(mesh(rbox(0.22, 0.16, 0.16, 0.07), mat('#FFC6DA'), 0, -0.05, 0.26));
    eyes(0.13, 0.05, 0.12);
    const horn = mesh(cone(0.05, 0.3, 12), mat('#FFD23F', { roughness: 0.3, metalness: 0.3 }), 0, 0.26, 0.08); horn.rotation.x = 0.35; head.add(horn);
    [-1, 1].forEach(s => head.add(mesh(cone(0.05, 0.12, 8), c, s * 0.09, 0.17, -0.07)));
    RAINBOW.forEach((col, i) => B.add(mesh(sph(0.085, 10, 8), mat(col), 0, 1.26 - i * 0.09, 0.3 - i * 0.07)));
    const t = new THREE.Group(); t.position.set(0, 0.82, -0.38); t.rotation.x = -0.9;
    RAINBOW.forEach((col, i) => t.add(mesh(sph(0.09 - i * 0.004, 10, 8), mat(col), 0, i * 0.1, -i * 0.02)));
    B.add(t); P.tail = t;
  }
  B.add(head);
  [B, head, P.tail, ...P.legs].forEach(g => mergeChildren(g).forEach(m => P.disposables.push(m.geometry)));
  // los anclajes: objetos vacíos colgados del cuerpo (y de la cabeza): se mueven con él al caminar, saltar y sentarse
  const A = ANCLAJES[kind] || ANCLAJES.perro;
  P.anclas = {};
  for (const id of ['espalda', 'lomo', 'cuello', 'cabeza', 'cola']) {
    const o = new THREE.Object3D(); o.position.set(...A[id]); (id === 'cabeza' ? head : B).add(o); P.anclas[id] = o;
  }
  P.medidas = A;
  P.labelY = kind === 'unicornio' ? 1.75 : 1.2;
  return P;
}
function setPetName(P, name) {
  if (P.label) P.root.remove(P.label);
  P.label = labelSprite(name, { scale: 0.0042 }); P.label.position.y = P.labelY; P.root.add(P.label);
}
function disposePet(P) { scene.remove(P.root); P.disposables.forEach(g => g.dispose()); }
// `sentada`: se sienta (quieta, esperando): el cuerpo se inclina con la cola abajo, las patas de adelante quedan
// derechas y las de atrás se doblan hacia adelante. Pasa de una pose a la otra suavemente (P.sit, 0…1).
// (`P.siempreSentada`: va sentada aunque se mueva —en la burbuja, en la canasta del globo—: pets/extras.js)
function animatePet(P, t, speed01, dt, sentada = false) {
  const vel = speed01;
  if (P.siempreSentada) { sentada = true; speed01 = 0; }
  const hop = speed01 > 0.05;
  P.phase += dt * (hop ? 9 + Math.min(speed01, 3) * 5 : 0);
  const k = P.kind === 'conejo' ? 1.7 : 1;
  P.sit = (P.sit || 0) + ((sentada && !hop ? 1 : 0) - (P.sit || 0)) * Math.min(1, dt * 6);
  const s = P.sit, incl = P.kind === 'conejo' ? 0.25 : 0.45;
  P.body.position.y = (hop ? Math.abs(Math.sin(P.phase)) * 0.13 * k : Math.abs(Math.sin(t * 2.5)) * 0.01) * (1 - s) - 0.05 * s;
  P.body.rotation.x = -incl * s;
  P.legs.forEach((l, i) => {
    const anda = hop ? Math.sin(P.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.6 : 0;
    l.rotation.x = anda * (1 - s) + (i > 1 ? incl : P.kind === 'conejo' ? 0 : -1.0) * s;   // (0 y 1: las de atrás; el conejo ya va sentado)
  });
  if (P.head) P.head.rotation.x = incl * 0.7 * s;   // la cabeza mira adelante aunque el cuerpo se incline
  if (P.extrasUpdate) P.extrasUpdate(t, dt, vel);   // artículos de la Mascotienda (pets/extras.js)
  if (P.tail) P.tail.rotation.z = Math.sin(t * (hop ? 16 : 7)) * (P.kind === 'conejo' ? 0.2 : 0.45);
  if (P.head) P.head.rotation.y = hop ? 0 : Math.sin(t * 0.9 + P.phase) * 0.28;
}

export { PET_COLORS, PET_KINDS, PET_NAMES, animatePet, buildPet, disposePet, setPetName };   // (y ANCLAJES, arriba)
