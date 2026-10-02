// Mascotas: modelos y animación.
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { RAINBOW, mat, shade, tint } from '../engine/materials.js';
import { cone, cyl, mesh, rbox, sph } from '../engine/geometry.js';
import { mergeChildren } from '../engine/merge.js';
import { labelSprite } from '../engine/textures.js';
import { moverEfectos } from './efectos.js';

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
//   medidas: ancho y largo del cuerpo, y `alto` (el lomo sobre el suelo) para calzar cosas alrededor; `cabezaR`: el
//            radio de la cabeza (sombreros, la pelota en la boca); cuelloR: el del cuello (el collar);
//            ojos: dónde está el ojo derecho, en el espacio de la cabeza (lentes); colaLargo: hasta la punta de la
//            cola, en el espacio de la cola (el moño, que se mueve con ella)
//   escala: el tamaño de la especie en el juego (se aplica a P.root). Las coordenadas de arriba y las medidas están
//            en el espacio propio de la mascota, ANTES de la escala: lo que se le pone se arma con ellas y se achica
//            junto con ella (perro 80 %, gato 60 %, conejo 40 %: la burbuja, el globo y las alitas guardan su
//            proporción)
export const ANCLAJES = {
  perro: { espalda: [0, 0.65, 0.1], lomo: [0, 0.65, -0.05], cuello: [0, 0.62, 0.24], cabeza: [0, 0.27, 0], cola: [0, 0.58, -0.32], ancho: 0.44, largo: 0.66, alto: 0.65, cabezaR: 0.27, cuelloR: 0.18, ojos: [0.1, 0.06, 0.23], colaLargo: 0.3, escala: 0.8 },
  gato: { espalda: [0, 0.59, 0.08], lomo: [0, 0.59, -0.04], cuello: [0, 0.6, 0.2], cabeza: [0, 0.25, 0], cola: [0, 0.5, -0.3], ancho: 0.36, largo: 0.6, alto: 0.59, cabezaR: 0.25, cuelloR: 0.145, ojos: [0.1, 0.05, 0.21], colaLargo: 0.52, escala: 0.6 },
  conejo: { espalda: [0, 0.6, 0.02], lomo: [0, 0.6, -0.06], cuello: [0, 0.56, 0.14], cabeza: [0, 0.22, 0], cola: [0, 0.38, -0.33], ancho: 0.54, largo: 0.66, alto: 0.6, cabezaR: 0.22, cuelloR: 0.17, ojos: [0.09, 0.05, 0.18], colaLargo: 0.07, escala: 0.4 },
  unicornio: { espalda: [0, 0.89, 0.12], lomo: [0, 0.89, -0.08], cuello: [0, 1.0, 0.32], cabeza: [0, 0.14, 0.04], cola: [0, 0.82, -0.38], ancho: 0.42, largo: 0.74, alto: 0.89, cabezaR: 0.15, cuelloR: 0.125, ojos: [0.13, 0.05, 0.12], colaLargo: 0.42 },
  // las formas del Convertidor sorpresa (no se adoptan: la mascota se convierte en ellas un rato, pets/extras.js)
  dinosaurio: { espalda: [0, 0.74, 0.14], lomo: [0, 0.74, -0.06], cuello: [0, 0.66, 0.36], cabeza: [0, 0.22, 0], cola: [0, 0.5, -0.4], ancho: 0.5, largo: 0.8, alto: 0.74, cabezaR: 0.22, cuelloR: 0.16, ojos: [0.11, 0.08, 0.17], colaLargo: 0.6, escala: 0.8 },
  vaca: { espalda: [0, 0.77, 0.12], lomo: [0, 0.77, -0.05], cuello: [0, 0.68, 0.34], cabeza: [0, 0.19, 0], cola: [0, 0.68, -0.39], ancho: 0.48, largo: 0.78, alto: 0.77, cabezaR: 0.18, cuelloR: 0.17, ojos: [0.11, 0.07, 0.15], colaLargo: 0.38, escala: 0.8 },
  // (el pingüino va parado: el collar va derecho, `cuelloInc`, y lo de la espalda, detrás)
  pinguino: { espalda: [0, 0.58, -0.2], lomo: [0, 0.72, -0.12], cuello: [0, 0.68, 0.02], cabeza: [0, 0.21, 0], cola: [0, 0.16, -0.24], ancho: 0.54, largo: 0.5, alto: 0.74, cabezaR: 0.21, cuelloR: 0.17, cuelloInc: -1.45, ojos: [0.07, 0.05, 0.18], colaLargo: 0.08, escala: 0.7 },
  leon: { espalda: [0, 0.7, 0.1], lomo: [0, 0.7, -0.05], cuello: [0, 0.68, 0.27], cabeza: [0, 0.31, 0], cola: [0, 0.62, -0.36], ancho: 0.46, largo: 0.72, alto: 0.7, cabezaR: 0.28, cuelloR: 0.2, ojos: [0.09, 0.05, 0.19], colaLargo: 0.5, escala: 0.85 },
  chanchito: { espalda: [0, 0.69, 0.08], lomo: [0, 0.69, -0.06], cuello: [0, 0.6, 0.27], cabeza: [0, 0.22, 0], cola: [0, 0.44, -0.42], ancho: 0.68, largo: 0.84, alto: 0.69, cabezaR: 0.24, cuelloR: 0.2, ojos: [0.1, 0.07, 0.19], colaLargo: 0.1, escala: 0.6 },
};
// El tronco de cada especie (para la ropa que lo envuelve: chalecos, suéter, pantalones, disfraces; pets/ropaCuerpo.js):
// [y del centro, ancho, alto, largo, redondo]. Redondo = una bola estirada (conejo, pingüino, chanchito); si no, una
// caja redondeada. En el espacio de la mascota, como los anclajes; se sacaron de las medidas de buildPet.
export const TORSO = {
  perro: [0.46, 0.44, 0.38, 0.66], gato: [0.42, 0.36, 0.34, 0.6], conejo: [0.34, 0.6, 0.54, 0.66, true], unicornio: [0.68, 0.42, 0.42, 0.74],
  dinosaurio: [0.52, 0.5, 0.42, 0.8], vaca: [0.56, 0.48, 0.42, 0.78], pinguino: [0.4, 0.54, 0.7, 0.49, true], leon: [0.5, 0.46, 0.4, 0.72],
  chanchito: [0.4, 0.68, 0.58, 0.83, true],
};
// el Convertidor sorpresa: cada forma con sus colores de siempre (las especies que se adoptan conservan el color de la
// mascota) y su voz (audio/audio.js)
export const FORMAS = [
  { id: 'perro', nombre: 'perrito', voz: 'guau', texto: '¡Guau!' }, { id: 'gato', nombre: 'gatito', voz: 'miau', texto: '¡Miau!' },
  { id: 'conejo', nombre: 'conejito', voz: 'conejo', texto: '¡Ñiqui!' }, { id: 'unicornio', nombre: 'unicornio', voz: 'relincho', texto: '¡Hiii!' },
  { id: 'dinosaurio', nombre: 'dinosaurio', color: '#7BD86B', voz: 'dino', texto: '¡Roaaar!' },
  { id: 'vaca', nombre: 'vaca', color: '#FFFFFF', voz: 'vaca', texto: '¡Muuu!' },
  { id: 'pinguino', nombre: 'pingüino', color: '#2E3047', voz: 'pinguino', texto: '¡Cuaac!' },
  { id: 'leon', nombre: 'león', color: '#F2B84B', voz: 'leon', texto: '¡Grrroar!' },
  { id: 'chanchito', nombre: 'chanchito', color: '#FFB3C7', voz: 'oink', texto: '¡Oink oink!' },
];

function buildPet(kind, color) {
  const P = { kind, especie: kind, color, root: new THREE.Group(), body: new THREE.Group(), legs: [], tail: null, head: null, phase: 0, disposables: [] };
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
  } else if (kind === 'dinosaurio') {   // de cuello corto, con placas de colores en la espalda y en la cola
    B.add(mesh(rbox(0.5, 0.42, 0.8, 0.18), c, 0, 0.52, 0));
    B.add(mesh(rbox(0.38, 0.12, 0.62, 0.06), lt, 0, 0.33, 0.02));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => leg(a * 0.16, 0.38, b * 0.26, 0.15, 0.36));
    const neck = mesh(rbox(0.24, 0.34, 0.24, 0.1), c, 0, 0.66, 0.38); neck.rotation.x = 0.5; B.add(neck);
    head.position.set(0, 0.84, 0.5);
    head.add(mesh(sph(0.22, 18, 14), c));
    head.add(mesh(rbox(0.3, 0.2, 0.26, 0.09), c, 0, -0.05, 0.17));
    [-1, 1].forEach(s => head.add(mesh(sph(0.022, 6, 5), mat('#2F5A2A'), s * 0.06, -0.01, 0.3)));
    eyes(0.11, 0.08, 0.17, 0.05);
    const placas = [mat('#FFC93C'), mat('#FF8FC7')];
    [0.28, 0.12, -0.04, -0.2, -0.34].forEach((z, i) => { const p = mesh(cone(0.09 - Math.abs(z) * 0.08, 0.2 - Math.abs(z) * 0.12, 4), placas[i % 2], 0, 0.79 - Math.abs(z) * 0.05, z); p.scale.z = 0.45; B.add(p); });
    const t = new THREE.Group(); t.position.set(0, 0.5, -0.4); t.rotation.x = -1.85;
    t.add(mesh(cone(0.12, 0.62, 10), c, 0, 0.31, 0));
    [0.14, 0.3].forEach((y, i) => { const p = mesh(cone(0.045, 0.1, 4), placas[(i + 1) % 2], 0, y, 0.09 - y * 0.12); p.rotation.x = Math.PI / 2; t.add(p); });
    B.add(t); P.tail = t;
  } else if (kind === 'vaca') {   // blanca con manchas negras, cuernitos y hocico rosado
    const negro = mat('#2A2733', { roughness: 0.8 });
    B.add(mesh(rbox(0.48, 0.42, 0.78, 0.15), c, 0, 0.56, 0));
    [[0.24, 0.6, 0.1, 0.12, 'x'], [-0.24, 0.55, -0.15, 0.13, 'x'], [0.24, 0.5, -0.24, 0.08, 'x'], [-0.24, 0.66, 0.22, 0.08, 'x'], [0.06, 0.77, -0.1, 0.12, 'y']].forEach(([x, y, z, r, eje]) => {
      const m = mesh(sph(r, 12, 8), negro, x, y, z); m.scale.set(eje === 'x' ? 0.25 : 1.2, eje === 'y' ? 0.2 : 1, 1.2); B.add(m);
    });
    B.add(mesh(sph(0.08, 10, 8), mat('#FFB8C8'), 0, 0.34, -0.14));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { leg(a * 0.15, 0.4, b * 0.26, 0.13, 0.38); P.legs[P.legs.length - 1].add(mesh(rbox(0.14, 0.07, 0.15, 0.03), negro, 0, -0.35, 0)); });
    head.position.set(0, 0.8, 0.44);
    head.add(mesh(rbox(0.3, 0.32, 0.3, 0.11), c));
    head.add(mesh(rbox(0.32, 0.17, 0.16, 0.07), mat('#FFB8C8'), 0, -0.09, 0.15));
    [-1, 1].forEach(s => head.add(mesh(sph(0.022, 6, 5), mat('#B0566E'), s * 0.06, -0.08, 0.235)));
    eyes(0.08, 0.06, 0.15, 0.04);
    [-1, 1].forEach(s => {
      const h = mesh(cone(0.035, 0.13, 8), mat('#F5E3B5'), s * 0.1, 0.2, -0.02); h.rotation.z = -s * 0.5; head.add(h);
      const o = mesh(rbox(0.14, 0.06, 0.08, 0.03), c, s * 0.2, 0.08, -0.03); o.rotation.z = s * 0.3; head.add(o);
    });
    const t = new THREE.Group(); t.position.set(0, 0.68, -0.39); t.rotation.x = -2.8;
    t.add(mesh(cyl(0.02, 0.02, 0.36, 6), c, 0, 0.18, 0)); t.add(mesh(sph(0.05, 8, 6), negro, 0, 0.38, 0)); B.add(t); P.tail = t;
  } else if (kind === 'pinguino') {   // parado, de panza blanca, con aletas y patitas naranjas
    const blanco = mat('#FFFFFF', { roughness: 0.8 }), naranjo = mat('#FF9F2E', { roughness: 0.6 });
    const b = mesh(sph(0.27, 18, 14), c, 0, 0.4, 0); b.scale.set(1, 1.3, 0.9); B.add(b);
    const panza = mesh(sph(0.22, 16, 12), blanco, 0, 0.38, 0.08); panza.scale.set(0.95, 1.25, 0.85); B.add(panza);
    [-1, 1].forEach(s => { const f = mesh(sph(0.1, 10, 8), c, s * 0.27, 0.46, 0); f.scale.set(0.25, 1, 0.6); f.rotation.z = s * 0.25; B.add(f); });
    [-1, 1].forEach(s => {
      const l = new THREE.Group(); l.position.set(s * 0.1, 0.14, 0.02);
      l.add(mesh(rbox(0.06, 0.12, 0.06, 0.02), naranjo, 0, -0.06, 0)); l.add(mesh(rbox(0.12, 0.04, 0.17, 0.02), naranjo, 0, -0.12, 0.05));
      B.add(l); P.legs.push(l);
    });
    head.position.set(0, 0.86, 0.02);
    head.add(mesh(sph(0.21, 18, 14), c));
    const cara = mesh(sph(0.16, 14, 10), blanco, 0, -0.02, 0.08); cara.scale.set(1, 0.9, 0.85); head.add(cara);
    const pico = mesh(cone(0.05, 0.13, 10), naranjo, 0, -0.05, 0.24); pico.rotation.x = Math.PI / 2; head.add(pico);
    eyes(0.07, 0.05, 0.18, 0.04);
    const t = new THREE.Group(); t.position.set(0, 0.16, -0.24); t.rotation.x = -1.9; t.add(mesh(cone(0.06, 0.1, 6), c, 0, 0.05, 0)); B.add(t); P.tail = t;
  } else if (kind === 'leon') {   // dorado, con melena
    const melena = mat('#C8641E', { roughness: 0.9 });
    B.add(mesh(rbox(0.46, 0.4, 0.72, 0.16), c, 0, 0.5, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => leg(a * 0.15, 0.36, b * 0.23, 0.14, 0.34));
    head.position.set(0, 0.8, 0.38);
    const m = mesh(sph(0.33, 16, 12), melena, 0, 0, -0.07); m.scale.set(1, 1, 0.55); head.add(m);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; head.add(mesh(sph(0.1, 8, 6), melena, Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.04)); }
    head.add(mesh(sph(0.22, 18, 14), c));
    head.add(mesh(rbox(0.2, 0.13, 0.12, 0.06), lt, 0, -0.07, 0.17));
    const nariz = mesh(sph(0.04, 8, 6), mat('#5A3A2A'), 0, -0.02, 0.23); nariz.scale.set(1.3, 0.8, 1); head.add(nariz);
    eyes(0.09, 0.05, 0.19, 0.045);
    [-1, 1].forEach(s => head.add(mesh(sph(0.06, 8, 6), c, s * 0.16, 0.2, 0.05)));
    const t = new THREE.Group(); t.position.set(0, 0.62, -0.36); t.rotation.x = -0.9;
    t.add(mesh(cyl(0.03, 0.025, 0.48, 6), c, 0, 0.24, 0)); t.add(mesh(sph(0.07, 8, 6), melena, 0, 0.5, 0)); B.add(t); P.tail = t;
  } else if (kind === 'chanchito') {   // redondito, con hocico y cola en rulo
    const b = mesh(sph(0.34, 18, 14), c, 0, 0.4, 0); b.scale.set(1, 0.85, 1.22); B.add(b);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => leg(a * 0.15, 0.2, b * 0.2, 0.11, 0.2));
    head.position.set(0, 0.56, 0.4);
    head.add(mesh(sph(0.23, 18, 14), c));
    const hocico = mesh(cyl(0.1, 0.1, 0.08, 16), dk, 0, -0.04, 0.24); hocico.rotation.x = Math.PI / 2; head.add(hocico);
    [-1, 1].forEach(s => head.add(mesh(sph(0.022, 6, 5), mat('#B0566E'), s * 0.035, -0.04, 0.282)));
    eyes(0.1, 0.07, 0.19, 0.04);
    [-1, 1].forEach(s => { const e = mesh(cone(0.07, 0.14, 4), c, s * 0.13, 0.2, 0.02); e.rotation.set(0.5, 0, -s * 0.4); head.add(e); });
    const t = new THREE.Group(); t.position.set(0, 0.44, -0.42);
    t.add(mesh(new THREE.TorusGeometry(0.05, 0.016, 6, 14, Math.PI * 1.6), c, 0, 0.05, 0)); B.add(t); P.tail = t;
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
  // (P.mallas: las del cuerpo, ya fusionadas; la poción de píxeles las cambia por cubitos: pets/pelaje.js)
  P.mallas = [];
  [B, head, P.tail, ...P.legs].forEach(g => mergeChildren(g).forEach(m => { P.disposables.push(m.geometry); P.mallas.push(m); }));
  // los anclajes: objetos vacíos colgados del cuerpo (y de la cabeza): se mueven con él al caminar, saltar y sentarse
  const A = ANCLAJES[kind] || ANCLAJES.perro;
  P.anclas = {};
  for (const id of ['espalda', 'lomo', 'cuello', 'cabeza', 'cola']) {
    const o = new THREE.Object3D(); o.position.set(...A[id]); (id === 'cabeza' ? head : B).add(o); P.anclas[id] = o;
  }
  P.medidas = A; P.torso = TORSO[kind] || TORSO.perro;
  P.labelY = kind === 'unicornio' ? 1.75 : 1.2;
  // el tamaño de la especie: se achica todo junto (cuerpo, anclajes y lo que tenga puesto), salvo las etiquetas
  P.root.scale.setScalar(A.escala || 1);
  return P;
}
// un letrero sobre la mascota, del mismo tamaño aunque la especie sea más chica (pets/follow.js: el globito de su voz)
// (`userData.s0`: su tamaño de verdad, para volver a compensarlo si la mascota cambia de tamaño: la poción mini/gigante)
function letreroMascota(P, sprite) { sprite.userData.s0 = sprite.scale.clone(); sprite.scale.multiplyScalar(1 / P.root.scale.x); P.root.add(sprite); return sprite; }
function setPetName(P, name) {
  if (P.label) P.root.remove(P.label);
  P.nombre = name;   // (la placa del collar lleva su inicial: pets/ropa.js)
  P.label = letreroMascota(P, labelSprite(name, { scale: 0.0042 })); P.label.position.y = P.labelY;
}
function disposePet(P) { scene.remove(P.root); P.disposables.forEach(g => g.dispose()); }
// `sentada`: se sienta (quieta, esperando): el cuerpo se inclina con la cola abajo, las patas de adelante quedan
// derechas y las de atrás se doblan hacia adelante. Pasa de una pose a la otra suavemente (P.sit, 0…1).
// (`P.siempreSentada`: va sentada aunque se mueva —en la burbuja, en la canasta del globo—: pets/extras.js)
// `sentada = 'acostada'`: se echa: el cuerpo baja hasta el suelo con las patas dobladas hacia adelante (P.lie, 0…1).
function animatePet(P, t, speed01, dt, sentada = false) {
  const vel = speed01;
  if (P.siempreSentada) { sentada = true; speed01 = 0; }
  const hop = speed01 > 0.05, acostada = sentada === 'acostada' && !hop;
  P.phase += dt * (hop ? 9 + Math.min(speed01, 3) * 5 : 0);
  const k = P.kind === 'conejo' ? 1.7 : 1;
  P.sit = (P.sit || 0) + ((sentada && !hop && !acostada ? 1 : 0) - (P.sit || 0)) * Math.min(1, dt * 6);
  P.lie = (P.lie || 0) + ((acostada ? 1 : 0) - (P.lie || 0)) * Math.min(1, dt * 3);
  const s = P.sit, L = P.lie, incl = P.kind === 'conejo' ? 0.25 : 0.45;
  if (P.cadera === undefined) P.cadera = Math.max(...P.legs.map(l => l.position.y));
  const zm = P.legs.reduce((a, l) => a + l.position.z, 0) / P.legs.length;
  P.body.position.y = ((hop ? Math.abs(Math.sin(P.phase)) * 0.13 * k : Math.abs(Math.sin(t * 2.5)) * 0.01) * (1 - s) - 0.05 * s) * (1 - L)
    - P.cadera * (P.kind === 'conejo' ? 0.5 : 0.8) * L + Math.sin(t * 1.6) * 0.006 * L;   // (acostada: respira)
  P.body.rotation.x = -incl * s * (1 - L);
  P.body.rotation.z = P.kind === 'pinguino' && hop ? Math.sin(P.phase) * 0.16 : 0;   // el pingüino se bambolea al andar
  P.legs.forEach((l, i) => {
    const anda = hop ? Math.sin(P.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.6 : 0;
    const sent = anda * (1 - s) + (i > 1 ? incl : P.kind === 'conejo' ? 0 : -1.0) * s;   // (0 y 1: las de atrás; el conejo ya va sentado)
    l.rotation.x = sent * (1 - L) + (l.position.z > zm ? -1.45 : P.kind === 'conejo' ? -0.3 : -1.3) * L;
  });
  if (P.head) P.head.rotation.x = incl * 0.7 * s * (1 - L) + 0.12 * L;   // la cabeza mira adelante aunque el cuerpo se incline
  if (P.extrasUpdate) P.extrasUpdate(t, dt, vel);   // artículos de la Mascotienda (pets/extras.js)
  if (P.tail) P.tail.rotation.z = Math.sin(t * (hop ? 16 : 7)) * (P.kind === 'conejo' ? 0.2 : 0.45);
  if (P.head) P.head.rotation.y = hop ? 0 : Math.sin(t * 0.9 + P.phase) * 0.28;
  moverEfectos();   // las estrellitas y burbujas de las pociones (pets/efectos.js)
}

export { PET_COLORS, PET_KINDS, PET_NAMES, animatePet, buildPet, disposePet, letreroMascota, setPetName };   // (y ANCLAJES, arriba)
