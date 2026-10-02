// Las casitas de las mascotas (Mascotienda, pasillo Hogar): van en el patio de Mi Casa (game/casas.js). Cada una mira
// hacia +z (la puerta adelante) y está hecha para una mascota de 0,8 m de alto; `k` la agranda o achica para la suya.
// `hacerCasa(id, nombre, k)` devuelve { g, cama: [y, z] (dónde se acuesta, asomada a la puerta), puerta: z (afuera,
// delante de la puerta) } en metros ya escalados. `tirarCasa(c)` suelta sus geometrías y texturas.
//   casita_perro  de madera con techo de dos aguas y su nombre sobre la puerta
//   torre_gato    cuevita con repisas, palos de cuerda y un pompón colgando
//   madriguera    un cerrito de pasto con su entrada redonda y un letrero con zanahoria
//   iglu          de bloques de hielo, con túnel de entrada
//   hongo         un tronco blanco con puerta y ventanas, y el sombrero rojo con puntos
//   castillo      rosado, con cuatro torres, almenas, banderitas y puente
//   nave          un cohete parado sobre sus aletas, con ventanita redonda y rampa
import { THREE } from '../engine/three.js';
import { RAINBOW, mat } from '../engine/materials.js';

const TAU = Math.PI * 2;
// (geometrías propias de cada casa: se sueltan al quitarla; los materiales de mat() son compartidos)
function m(geo, color, x = 0, y = 0, z = 0, o) { const me = new THREE.Mesh(geo, typeof color === 'string' ? mat(color, o) : color); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me; }
const caja = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// una caja hueca con puerta adelante (paredes de grosor e): la mascota se acuesta adentro
function cajaConPuerta(g, w, h, d, color, pw, ph, y0 = 0, e = 0.07) {
  g.add(m(caja(w, h, e), color, 0, y0 + h / 2, -d / 2 + e / 2));
  for (const s of [-1, 1]) g.add(m(caja(e, h, d), color, s * (w / 2 - e / 2), y0 + h / 2, 0));
  const lado = (w - pw) / 2;
  for (const s of [-1, 1]) g.add(m(caja(lado, h, e), color, s * (pw / 2 + lado / 2), y0 + h / 2, d / 2 - e / 2));
  g.add(m(caja(pw, h - ph, e), color, 0, y0 + ph + (h - ph) / 2, d / 2 - e / 2));
}
function letrero(texto, w, h, fondo = '#FFF3D6', tinta = '#7A4A1E') {
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w); const x = c.getContext('2d');
  x.fillStyle = fondo; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = tinta; x.font = `800 ${Math.round(c.height * 0.62)}px "Baloo 2", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(texto, 128, c.height * 0.55, 240);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.7 }));
}
// un techo de dos aguas con la cumbrera de adelante hacia atrás (la puerta queda en la punta del triángulo)
function dosAguas(g, w, d, y, alto, color) {
  const L = Math.hypot(w / 2 + 0.1, alto), a = Math.atan2(alto, w / 2 + 0.1);
  for (const s of [-1, 1]) { const p = m(caja(L, 0.06, d + 0.2), color, s * (w / 2 + 0.1) / 2, y + alto / 2, 0); p.rotation.z = -s * a; g.add(p); }
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, alto * 0.95); tri.closePath();
  for (const z of [-d / 2, d / 2]) { const t = m(new THREE.ShapeGeometry(tri), mat('#E9B77A', { side: THREE.DoubleSide }), 0, y, z); g.add(t); }
}

function casitaPerro(g, nombre) {
  g.add(m(caja(1.3, 0.08, 1.3), '#8A5A2E', 0, 0.04, 0));
  cajaConPuerta(g, 1.1, 0.75, 1.1, '#D9894A', 0.55, 0.62, 0.08);
  dosAguas(g, 1.1, 1.1, 0.83, 0.45, '#E8574F');
  for (const s of [-1, 1]) g.add(m(caja(0.06, 0.64, 0.06), '#FFFFFF', s * 0.3, 0.4, 0.56));   // el marco de la puerta
  g.add(m(caja(0.66, 0.06, 0.06), '#FFFFFF', 0, 0.72, 0.56));
  const n = letrero(nombre, 0.5, 0.15); n.position.set(0, 1.0, 0.565); g.add(n);
  // su plato
  g.add(m(new THREE.CylinderGeometry(0.13, 0.1, 0.07, 18), '#4FB6F5', 0.48, 0.035, 0.85));
  g.add(m(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 14), '#B97A3E', 0.48, 0.07, 0.85));
  return { cama: [0.08, 0.15], puerta: 0.95 };
}
function torreGato(g) {
  g.add(m(caja(1.3, 0.08, 1.3), '#E8DCC8', 0, 0.04, 0));
  cajaConPuerta(g, 1.0, 0.7, 1.0, '#B79CEB', 0.5, 0.55, 0.08);
  g.add(m(caja(1.0, 0.08, 1.0), '#FF8FC7', 0, 0.82, 0));                 // el techo de la cueva, alfombrado
  const cuerda = '#E2C79A', cojin = '#FF8FC7';
  for (const [x, z, h] of [[-0.32, -0.32, 1.25], [0.32, -0.32, 0.8]]) g.add(m(new THREE.CylinderGeometry(0.07, 0.07, h, 12), cuerda, x, 0.86 + h / 2, z));
  g.add(m(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 20), cojin, 0.3, 1.68, -0.32));
  g.add(m(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 20), cojin, -0.32, 2.13, -0.25));
  // el pompón colgando de la repisa de arriba
  g.add(m(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), '#FFFFFF', -0.32, 1.9, 0.0));
  const pom = m(new THREE.SphereGeometry(0.07, 12, 10), '#FFD23F', -0.32, 1.67, 0.0); pom.userData.pompon = true; g.add(pom);
  return { cama: [0.08, 0.12], puerta: 0.9, pom };
}
function madriguera(g) {
  const cerro = m(new THREE.SphereGeometry(0.9, 26, 12, 0, TAU, 0, Math.PI / 2), mat('#7CCB5E', { side: THREE.DoubleSide })); cerro.scale.y = 0.75; g.add(cerro);
  // la entrada: un aro de tierra y el hoyo oscuro
  const aro = m(new THREE.TorusGeometry(0.3, 0.06, 8, 20), '#8A5A2E', 0, 0.3, 0.8); aro.rotation.x = -0.35; g.add(aro);
  const hoyo = m(new THREE.CircleGeometry(0.3, 20), '#2B1E14', 0, 0.3, 0.79); hoyo.rotation.x = -0.35; g.add(hoyo);
  // el letrero con la zanahoria
  g.add(m(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), '#8A5A2E', 0.7, 0.35, 0.6));
  const zan = m(new THREE.ConeGeometry(0.07, 0.3, 10), '#FF8C42', 0.7, 0.72, 0.6); zan.rotation.z = Math.PI; g.add(zan);
  for (const s of [-1, 0, 1]) { const h = m(new THREE.ConeGeometry(0.025, 0.14, 5), '#4FAF3A', 0.7 + s * 0.03, 0.92, 0.6); h.rotation.z = s * 0.4; g.add(h); }
  for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36, f = m(new THREE.SphereGeometry(0.045, 8, 6), RAINBOW[i % 6], Math.sin(a) * 0.98, 0.04, Math.cos(a) * 0.98); g.add(f); }
  return { cama: [0, 0.74], puerta: 1.2 };
}
let texHielo = null;
function hielo() {
  if (texHielo) return texHielo;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#F4FBFF'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#B9DDF2'; x.lineWidth = 3;
  for (let f = 0; f < 4; f++) { x.beginPath(); x.moveTo(0, f * 32); x.lineTo(128, f * 32); x.stroke(); for (let k = 0; k < 3; k++) { const px = k * 48 + (f % 2) * 24; x.beginPath(); x.moveTo(px, f * 32); x.lineTo(px, f * 32 + 32); x.stroke(); } }
  texHielo = new THREE.CanvasTexture(c); texHielo.wrapS = texHielo.wrapT = THREE.RepeatWrapping; texHielo.repeat.set(4, 2);
  return texHielo;
}
function iglu(g) {
  const blanco = new THREE.MeshStandardMaterial({ map: hielo(), color: 0xCFE9FF, roughness: 0.35, side: THREE.DoubleSide });
  const cupula = m(new THREE.SphereGeometry(0.85, 26, 12, 0, TAU, 0, Math.PI / 2), blanco); cupula.scale.y = 0.85; g.add(cupula);
  // el túnel: medio tubo hacia adelante
  const tunel = m(new THREE.CylinderGeometry(0.38, 0.38, 0.6, 18, 1, true, -Math.PI / 2, Math.PI), blanco, 0, 0, 0.82); tunel.rotation.x = Math.PI / 2; g.add(tunel);
  const boca = m(new THREE.TorusGeometry(0.38, 0.05, 6, 18, Math.PI), '#DDF1FF', 0, 0, 1.12); g.add(boca);
  return { cama: [0, 0.6], puerta: 1.4, materiales: [blanco] };
}
function hongo(g) {
  g.add(m(new THREE.CylinderGeometry(0.52, 0.6, 1.0, 22), '#FFF6E6', 0, 0.5, 0));
  // la puerta (un arco), las ventanas redondas y el sombrero con puntos
  g.add(m(caja(0.42, 0.45, 0.04), '#9B6BF0', 0, 0.27, 0.57));
  const arco = m(new THREE.CircleGeometry(0.21, 16, 0, Math.PI), '#9B6BF0', 0, 0.5, 0.585); g.add(arco);
  for (const s of [-1, 1]) { const v = m(new THREE.CircleGeometry(0.09, 14), '#7FD6FF', s * 0.36, 0.62, 0.45); v.rotation.y = s * 0.65; g.add(v); }
  const sombrero = m(new THREE.SphereGeometry(1.0, 26, 12, 0, TAU, 0, Math.PI / 2), mat('#F2404A', { side: THREE.DoubleSide }), 0, 0.95, 0); sombrero.scale.y = 0.6; g.add(sombrero);
  for (let i = 0; i < 9; i++) {
    // (aplastados contra el sombrero: su eje y en la normal de la superficie)
    const a = (i + 0.5) / 9 * TAU, el = i % 3 === 0 ? 0.35 : 0.85, r = Math.cos(el), y = 0.95 + 0.6 * Math.sin(el);
    const p = m(new THREE.SphereGeometry(0.11, 10, 6), '#FFFFFF', Math.cos(a) * r, y, Math.sin(a) * r); p.scale.y = 0.4;
    p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a) * r, Math.sin(el) / 0.6, Math.sin(a) * r).normalize()); g.add(p);
  }
  return { cama: [0, 0.45], puerta: 1.05 };
}
function castillo(g) {
  const rosa = '#FFB8D6', lila = '#9B6BF0';
  g.add(m(caja(1.5, 0.08, 1.3), '#D8CFE8', 0, 0.04, 0));
  cajaConPuerta(g, 1.2, 0.85, 1.0, rosa, 0.5, 0.62, 0.08);
  g.add(m(caja(1.2, 0.06, 1.0), rosa, 0, 0.96, 0));
  for (let i = 0; i < 5; i++) for (const z of [-0.47, 0.47]) g.add(m(caja(0.14, 0.14, 0.08), rosa, -0.48 + i * 0.24, 1.06, z));   // almenas
  for (const x of [-0.62, 0.62]) for (const z of [-0.52, 0.52]) {
    g.add(m(new THREE.CylinderGeometry(0.18, 0.2, 1.35, 16), '#FFD0E4', x, 0.68, z));
    g.add(m(new THREE.ConeGeometry(0.24, 0.4, 16), lila, x, 1.55, z));
    g.add(m(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 4), '#FFFFFF', x, 1.86, z));
    const b = m(new THREE.PlaneGeometry(0.16, 0.1), mat(RAINBOW[(x > 0 ? 1 : 0) + (z > 0 ? 2 : 0)], { side: THREE.DoubleSide }), x + 0.08, 1.94, z); g.add(b);
  }
  const puente = m(caja(0.5, 0.04, 0.45), '#8A5A2E', 0, 0.06, 0.7); puente.rotation.x = 0.12; g.add(puente);
  g.add(m(new THREE.CircleGeometry(0.3, 16, 0, Math.PI), lila, 0, 0.7, 0.505));   // el arco sobre la puerta
  return { cama: [0.08, 0.12], puerta: 1.1 };
}
function nave(g) {
  const blanco = '#F4F6FB', rojo = '#FF4F5E';
  g.add(m(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 24), blanco, 0, 0.95, 0));
  g.add(m(new THREE.ConeGeometry(0.55, 0.75, 24), rojo, 0, 2.02, 0));
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, f = m(caja(0.06, 0.6, 0.4), rojo, Math.sin(a) * 0.6, 0.35, Math.cos(a) * 0.6); f.rotation.y = a; g.add(f);
  }
  const ventana = m(new THREE.CircleGeometry(0.18, 20), mat('#7FD6FF', { emissive: '#4FB6F5', emissiveIntensity: 0.4 }), 0, 1.45, 0.56); g.add(ventana);
  g.add(m(new THREE.TorusGeometry(0.19, 0.035, 8, 22), '#B9C0D0', 0, 1.45, 0.56));
  g.add(m(caja(0.5, 0.62, 0.04), '#3A3F5C', 0, 0.62, 0.54));          // la puerta abierta (oscuro adentro)
  const rampa = m(caja(0.5, 0.04, 0.6), '#B9C0D0', 0, 0.16, 0.85); rampa.rotation.x = 0.55; g.add(rampa);
  const franja = m(new THREE.TorusGeometry(0.56, 0.04, 6, 24), '#FFD23F', 0, 1.0, 0); franja.rotation.x = Math.PI / 2; g.add(franja);
  return { cama: [0.3, 0.35], puerta: 1.35 };
}
const HACER = { casita_perro: casitaPerro, torre_gato: torreGato, madriguera, iglu, hongo, castillo, nave };
export const ES_CASA = id => !!HACER[id];

export function hacerCasa(id, nombre, k = 1) {
  const g = new THREE.Group(), adentro = new THREE.Group(); adentro.scale.setScalar(k); g.add(adentro);
  const r = HACER[id](adentro, nombre);
  return { g, cama: [r.cama[0] * k, r.cama[1] * k], puerta: r.puerta * k, pom: r.pom || null, materiales: r.materiales || [] };
}
export function tirarCasa(c) {
  c.g.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && o.material.map && o.material.map !== texHielo) { o.material.map.dispose(); o.material.dispose(); }
  });
  c.materiales.forEach(x => x.dispose());
}
