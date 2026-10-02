// Libros para leer (el reposo de la jugadora: game/reposo.js). Cada uno con su color y un dibujito en la tapa.
// En unidades del modelo de Nina (el juego lo escala con ella). El lomo va en el eje y; abierto, las páginas miran
// hacia +z (hacia quien lee) y las tapas quedan atrás: `abrir(libro, 0..1)`; `pasarHoja(libro, 0..1)` da vuelta una
// hoja de derecha a izquierda.
import { THREE } from '../engine/three.js';

const W = 0.156, H = 0.216, TAPA = 0.008, HOJAS = 0.016;
export const LIBROS = [
  { color: '#FF6FAE', dibujo: 'estrella' }, { color: '#4FB6F5', dibujo: 'cohete' }, { color: '#3DD6A8', dibujo: 'flor' },
  { color: '#FFB547', dibujo: 'gato' }, { color: '#A77BF3', dibujo: 'luna' }, { color: '#FF5E5E', dibujo: 'corazon' },
  { color: '#5BC0EB', dibujo: 'pez' }, { color: '#9ADE7B', dibujo: 'arcoiris' },
];

// los dibujitos de las tapas (en un lienzo de 128 × 176)
const DIBUJOS = {
  estrella(x) { x.fillStyle = '#FFE45C'; punta(x, 64, 92, 5, 34, 14); },
  corazon(x) {
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(64, 120);
    x.bezierCurveTo(14, 86, 34, 50, 64, 74); x.bezierCurveTo(94, 50, 114, 86, 64, 120); x.fill();
  },
  luna(x) {
    x.fillStyle = '#FFF3B0'; x.beginPath(); x.arc(64, 92, 30, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#A77BF3'; x.beginPath(); x.arc(78, 82, 26, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#FFF3B0'; punta(x, 96, 118, 5, 7, 3); punta(x, 40, 60, 5, 5, 2);
  },
  flor(x) {
    x.fillStyle = '#FFFFFF';
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; x.beginPath(); x.arc(64 + Math.cos(a) * 18, 90 + Math.sin(a) * 18, 13, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#FFD23F'; x.beginPath(); x.arc(64, 90, 12, 0, Math.PI * 2); x.fill();
  },
  gato(x) {
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(64, 96, 28, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(40, 82); x.lineTo(44, 56); x.lineTo(60, 72); x.fill();
    x.beginPath(); x.moveTo(88, 82); x.lineTo(84, 56); x.lineTo(68, 72); x.fill();
    x.fillStyle = '#34313F'; x.beginPath(); x.arc(54, 94, 4, 0, Math.PI * 2); x.arc(74, 94, 4, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#FF8FB8'; x.beginPath(); x.arc(64, 104, 3.5, 0, Math.PI * 2); x.fill();
  },
  cohete(x) {
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(64, 50); x.quadraticCurveTo(86, 76, 80, 118); x.lineTo(48, 118); x.quadraticCurveTo(42, 76, 64, 50); x.fill();
    x.fillStyle = '#FF5E5E'; x.beginPath(); x.moveTo(48, 104); x.lineTo(36, 124); x.lineTo(50, 118); x.fill(); x.beginPath(); x.moveTo(80, 104); x.lineTo(92, 124); x.lineTo(78, 118); x.fill();
    x.fillStyle = '#4FB6F5'; x.beginPath(); x.arc(64, 84, 8, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#FFD23F'; x.beginPath(); x.moveTo(52, 120); x.lineTo(64, 140); x.lineTo(76, 120); x.fill();
  },
  pez(x) {
    x.fillStyle = '#FFB547'; x.beginPath(); x.ellipse(60, 92, 28, 18, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(84, 92); x.lineTo(104, 76); x.lineTo(104, 108); x.fill();
    x.fillStyle = '#34313F'; x.beginPath(); x.arc(46, 88, 4, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#FFFFFF'; x.lineWidth = 3; x.beginPath(); x.arc(40, 60, 5, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(30, 46, 3.5, 0, Math.PI * 2); x.stroke();
  },
  arcoiris(x) {
    ['#FF5E5E', '#FFB547', '#FFE45C', '#3DD6A8', '#4FB6F5', '#A77BF3'].forEach((c, i) => {
      x.strokeStyle = c; x.lineWidth = 6; x.beginPath(); x.arc(64, 112, 42 - i * 6, Math.PI, 0); x.stroke();
    });
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(26, 114, 10, 0, Math.PI * 2); x.arc(38, 116, 8, 0, Math.PI * 2); x.arc(102, 114, 10, 0, Math.PI * 2); x.arc(90, 116, 8, 0, Math.PI * 2); x.fill();
  },
};
function punta(x, cx, cy, n, R, r) {
  x.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R; x.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
  x.fill();
}
const lienzo = () => { const c = document.createElement('canvas'); c.width = 128; c.height = 176; return c; };
const texturas = new Map();
function tapa(L) {
  if (texturas.has(L.dibujo)) return texturas.get(L.dibujo);
  const c = lienzo(), x = c.getContext('2d');
  x.fillStyle = L.color; x.fillRect(0, 0, 128, 176);
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 5; x.strokeRect(10, 10, 108, 156);
  x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(30, 26, 68, 7); x.fillRect(40, 38, 48, 5);   // el título (rayitas)
  DIBUJOS[L.dibujo](x);
  const t = new THREE.CanvasTexture(c); texturas.set(L.dibujo, t);
  return t;
}
let texHoja = null;
function hoja() {
  if (texHoja) return texHoja;
  const c = lienzo(), x = c.getContext('2d');
  x.fillStyle = '#FFF8EC'; x.fillRect(0, 0, 128, 176);
  x.fillStyle = '#B9B2C9';
  for (let y = 22; y < 160; y += 11) x.fillRect(14, y, 100 - ((y * 7) % 30), 3);   // renglones de texto
  x.fillStyle = '#FFB8D6'; x.fillRect(20, 120, 40, 30);   // un dibujito en la página
  texHoja = new THREE.CanvasTexture(c);
  return texHoja;
}

// medio libro: la tapa atrás y el bloque de hojas delante, hacia +x (s = 1) o -x (s = -1) desde el lomo
function mitad(s, matTapa, matHojas) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.BoxGeometry(W, H, TAPA), matTapa); t.position.set(s * W / 2, 0, 0); g.add(t);
  const h = new THREE.Mesh(new THREE.BoxGeometry(W - 0.006, H - 0.008, HOJAS), matHojas); h.position.set(s * (W - 0.006) / 2, 0, TAPA / 2 + HOJAS / 2); g.add(h);
  return g;
}
export function hacerLibro(L) {
  const lado = new THREE.MeshStandardMaterial({ color: L.color, roughness: 0.6 });
  const conDibujo = new THREE.MeshStandardMaterial({ map: tapa(L), roughness: 0.6 });
  const hojas = new THREE.MeshStandardMaterial({ map: hoja(), roughness: 0.9 });
  const papel = new THREE.MeshStandardMaterial({ color: '#FFF8EC', roughness: 0.9 });
  // caras de la caja: +x, -x, +y, -y, +z, -z. La tapa de adelante (con el dibujo) es la de atrás de la mitad izquierda
  const tapaIzq = [lado, lado, lado, lado, lado, conDibujo], bloque = [papel, papel, papel, papel, hojas, papel];
  const libro = new THREE.Group(), centro = new THREE.Group(); libro.add(centro);
  const der = mitad(1, lado, bloque), izq = new THREE.Group(); izq.add(mitad(-1, tapaIzq, bloque));
  centro.add(der, izq);
  // la hoja que se da vuelta
  const pag = new THREE.Group(); pag.add(new THREE.Mesh(new THREE.PlaneGeometry(W - 0.008, H - 0.01), new THREE.MeshStandardMaterial({ map: hoja(), roughness: 0.9, side: THREE.DoubleSide })));
  pag.children[0].position.x = (W - 0.008) / 2; pag.position.z = TAPA / 2 + HOJAS + 0.001; pag.visible = false; centro.add(pag);
  libro.userData = { izq, centro, pag, mats: [lado, conDibujo, hojas, papel, pag.children[0].material] };
  abrir(libro, 0);
  libro.traverse(o => { o.castShadow = true; });
  return libro;
}
// Mapa de anclaje del libro: dónde lo toman las manos. El punto de contacto es el centro del borde exterior de cada
// tapa; abierto quedan a ±W del lomo, cerrado a ±W/2 (el libro se centra). En el espacio del libro, sin escalar.
export function agarre(o) { const x = W * (1 + o) / 2; return { izq: new THREE.Vector3(-x, 0, 0), der: new THREE.Vector3(x, 0, 0), ancho: 2 * x }; }
export function abrir(libro, o) {
  const { izq, centro } = libro.userData;
  izq.rotation.y = (1 - o) * Math.PI * 0.985 - o * 0.25;   // abierto, un poco en V
  izq.position.z = (1 - o) * (TAPA + HOJAS * 2);
  centro.position.x = -(1 - o) * W / 2;                       // cerrado queda centrado
  libro.userData.o = o;
}
export function pasarHoja(libro, u) {
  const { pag } = libro.userData;
  pag.visible = u > 0 && u < 1 && libro.userData.o > 0.9;
  pag.rotation.y = -Math.PI * u;
}
export function tirarLibro(libro) {
  libro.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  libro.userData.mats.forEach(m => m.dispose());
}
