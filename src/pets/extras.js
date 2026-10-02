// Artículos de la Mascotienda Arcoíris puestos en una mascota: un "transporte" (patines, burbuja, alitas o mini globo)
// y el jarabe arcoíris (el pelaje cambia de color en ciclo). `ponerExtras(P, { transporte, arcoiris })` arma o quita
// lo que corresponde; la animación la hace `P.extrasUpdate` (lo llama animatePet en cada cuadro).
// Todo se calza con el mapa de anclajes de cada especie (ANCLAJES en pets/models.js: espalda, lomo, cuello, cabeza,
// cola y medidas): lo que va sobre el cuerpo cuelga de su ancla y se mueve con él al caminar, saltar o sentarse.
//   patines   una bota con ruedas en cada pata; al andar patina (empuja en diagonal) sin saltos; las ruedas brillan
//   burbuja   una burbuja grande alrededor; la mascota va sentada adentro, flotando
//   alitas    alas de mariposa en la espalda (ancla `espalda`), que aletean
//   globo     un globo aerostático grande y alto; la mascota va sentada en la canasta y Nina lleva la cuerda
//             (`P.mano`: dónde está su mano, lo pone game/mascotienda.js en cada cuadro)
// Nada de esto proyecta sombra ni cambia materiales compartidos (el pelaje arcoíris usa copias propias).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { RAINBOW } from '../engine/materials.js';
import { rbox } from '../engine/geometry.js';
import { animarRopa, ponerRopa, ropaPuesta } from './ropa.js';
import { estallido, nubeMagica, soltarChispas, soltarEfectos, soltarEstrellita } from './efectos.js';
import { FORMAS, buildPet } from './models.js';
import { DISENOS, animarPelaje, ponerPelaje } from './pelaje.js';
import { emit } from '../core/events.js';
import { efectoAura } from '../engine/efectoAura.js';
import { moverCompanero, ponerCompanero } from './companeros.js';

export const VOCES_POCION = ['pato', 'leon', 'vaca'];

const TAU = Math.PI * 2;
const sinSombra = g => { g.traverse(o => { o.castShadow = false; o.receiveShadow = false; }); return g; };

// Un patín (de 4 ruedas) en cada pata. La bota es la parte de abajo de la pata "pintada" y un poco más ancha (una
// funda redondeada que la envuelve, como si se hubiera extruido), con la suela y las ruedas debajo. Se calza con la
// caja de la malla de cada pata en el espacio de la pata (dónde termina y qué tan gruesa es): sirve para todas las
// especies. `alto`: lo que sube la mascota (la suela y las ruedas bajo la pata).
const BOTA = 0.42, ENSANCHE = 1.16, RUEDA = 0.026;
const ALTO_PATIN = 0.012 + 0.012 + RUEDA * 2 - 0.004;
function patines(P) {
  const g = new THREE.Group(), rueda = [], patas = [];
  const bota = new THREE.MeshStandardMaterial({ color: 0xFF6FAE, roughness: 0.35 }), suela = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
  const box = new THREE.Box3(), caja = new THREE.Box3();
  P.legs.forEach((leg, i) => {
    box.makeEmpty();
    leg.children.forEach(m => { if (m.geometry && !m.userData.ropa) { m.updateMatrix(); m.geometry.computeBoundingBox(); box.union(caja.copy(m.geometry.boundingBox).applyMatrix4(m.matrix)); } });
    const w = box.max.x - box.min.x, l = box.max.z - box.min.z, fondo = box.min.y, cx = (box.max.x + box.min.x) / 2, cz = (box.max.z + box.min.z) / 2;
    const hb = Math.min(0.15, (box.max.y - box.min.y) * BOTA);   // la caña de la bota: la parte de abajo de la pata
    const p = new THREE.Group(); p.position.set(cx, fondo, cz); leg.add(p); patas.push(p);
    const b = new THREE.Mesh(rbox(w * ENSANCHE, hb, l * ENSANCHE, Math.min(w, l) * 0.35), bota); b.position.y = hb / 2 - 0.006; p.add(b);
    const pl = new THREE.Mesh(rbox(w * 1.25, 0.024, l * 1.45, 0.01), suela); pl.position.set(0, -0.012, l * 0.1); p.add(pl);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const m = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: RAINBOW[(i + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0)) % 6], emissiveIntensity: 0.9 });
      const r = new THREE.Mesh(new THREE.CylinderGeometry(RUEDA, RUEDA, 0.022, 12), m); r.rotation.z = Math.PI / 2;
      r.position.set(sx * w * 0.42, -0.024 - RUEDA + 0.004, l * 0.1 + sz * l * 0.5); p.add(r); rueda.push(r);
    }
    // de qué lado y si es de adelante: para empujar en diagonal al patinar
    patas.at(-1).userData = { lado: Math.sign(leg.position.x) || 1, frente: Math.sign(leg.position.z - 0.001) || 1 };
  });
  return { g, alto: ALTO_PATIN, rueda, patas, patina: true, fase: 0, quitar() { patas.forEach(p => { p.parent.remove(p); p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }); } };
}
function burbuja(P) {
  const M = P.medidas, r = Math.max(M.largo, M.alto) * 0.95 + 0.12;
  const m = new THREE.MeshStandardMaterial({ color: 0xCFF2FF, transparent: true, opacity: 0.26, roughness: 0.05, metalness: 0.2, emissive: 0x88CCFF, emissiveIntensity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 22), m); g.add(b);
  // dos brillos, como en las pompas de jabón
  const brillo = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.75, depthWrite: false });
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.15, 12, 8), brillo); b1.position.set(-r * 0.45, r * 0.5, r * 0.62); b1.scale.set(1, 0.6, 0.3); g.add(b1);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.07, 10, 6), brillo); b2.position.set(-r * 0.2, r * 0.68, r * 0.66); g.add(b2);
  P.root.add(g);
  P.siempreSentada = true;
  return { g, alto: 0.3, bola: b, r, flota: true, inercia: { k: 14, c: 3.4, max: 0.5 } };
}
// el ala de murciélago: el borde de arriba recto hacia afuera y el de abajo con festones (las "varillas")
function alaMurcielago() {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.12, 0.2); s.quadraticCurveTo(0.3, 0.32, 0.52, 0.26);
  const puntas = [[0.52, 0.26], [0.42, 0.06], [0.3, 0.02], [0.18, -0.06], [0.06, -0.08]];
  for (let i = 1; i < puntas.length; i++) { const [x0, y0] = puntas[i - 1], [x1, y1] = puntas[i]; s.quadraticCurveTo((x0 + x1) / 2 - 0.02, (y0 + y1) / 2 + 0.07, x1, y1); }
  s.lineTo(0, 0);
  return s;
}
function alitas(P, tipo = 'hada') {
  // alas de mariposa (dos pares: las de arriba más grandes), en el plano de la espalda, abriéndose hacia los lados;
  // las de murciélago: un solo par, violeta oscuro con festones
  const M = P.medidas, k = M.largo * 1.5;   // (del largo de la mascota: ~0,5 m de ala en el perro)
  const bat = tipo === 'murcielago';
  const arriba = new THREE.Shape(); arriba.moveTo(0, 0); arriba.bezierCurveTo(0.12, 0.3, 0.45, 0.42, 0.5, 0.22); arriba.bezierCurveTo(0.52, 0.08, 0.3, 0.02, 0, 0);
  const abajo = new THREE.Shape(); abajo.moveTo(0, 0); abajo.bezierCurveTo(0.22, -0.02, 0.38, -0.12, 0.32, -0.26); abajo.bezierCurveTo(0.24, -0.34, 0.08, -0.2, 0, 0);
  const m1 = new THREE.MeshStandardMaterial(bat ? { color: 0x4B2A6B, emissive: 0x2A0F45, emissiveIntensity: 0.5, side: THREE.DoubleSide, roughness: 0.6 }
    : { color: 0xFF7FD0, emissive: 0xB04BFF, emissiveIntensity: 0.4, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const m2 = bat ? m1 : new THREE.MeshStandardMaterial({ color: 0x6FC8FF, emissive: 0x3F8BFF, emissiveIntensity: 0.4, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const g1 = new THREE.ShapeGeometry(bat ? alaMurcielago() : arriba), g2 = bat ? null : new THREE.ShapeGeometry(abajo), alas = [];
  // alas de hada: cada ala, de pie a lo largo del lomo (el dibujo va hacia atrás y arriba: su plano es el del costado
  // de la mascota, así se ve entera de lado), abierta hacia su lado en V (se ve de atrás); aletean abriéndose y
  // cerrándose sobre el eje del lomo
  const g = new THREE.Group(); g.position.set(0, 0.02, 0.06);
  for (const s of [-1, 1]) {
    const pivote = new THREE.Group(); g.add(pivote);
    const ala = new THREE.Group(); ala.rotation.y = Math.PI / 2; ala.rotation.order = 'YXZ'; ala.rotation.x = -0.15; pivote.add(ala);
    const piezas = [new THREE.Mesh(g1, m1)]; if (g2) piezas.push(new THREE.Mesh(g2, m2));
    for (const w of piezas) { w.scale.set(k, k, 1); w.position.y = 0.08 * k; ala.add(w); }
    alas.push({ pivote, s });
  }
  P.anclas.espalda.add(g);
  return { g, alto: 0.45, alas, flota: true, vuela: true, inercia: { k: 5, c: 2.6, max: 0.45 }, lean: 0 };
}
// el mimbre de la canasta: tejido café, con una franja arcoíris y estrellitas (textura hecha aquí; se puede cambiar por
// una imagen propia)
let texMimbre = null;
function mimbreTex() {
  if (texMimbre) return texMimbre;
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#B9783F'; x.fillRect(0, 0, 256, 64);
  for (let f = 0; f < 4; f++) for (let k = 0; k < 16; k++) {   // el tejido: ladrillitos alternados con sombra
    const ox = k * 16 + (f % 2 ? 8 : 0), oy = f * 16;
    x.fillStyle = (k + f) % 2 ? '#D49A5A' : '#C4874A'; x.fillRect(ox + 1, oy + 1, 14, 14);
    x.fillStyle = 'rgba(80,40,10,.25)'; x.fillRect(ox + 1, oy + 12, 14, 3);
  }
  RAINBOW.forEach((col, i) => { x.fillStyle = col; x.fillRect(0, 26 + i * 2, 256, 2); });
  x.fillStyle = '#FFF3B0';
  for (let k = 0; k < 8; k++) {
    const cx = 16 + k * 32, cy = 31; x.beginPath();
    for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 2.6 : 6; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    x.fill();
  }
  texMimbre = new THREE.CanvasTexture(c); texMimbre.wrapS = THREE.RepeatWrapping; texMimbre.repeat.set(2, 1);
  return texMimbre;
}
const PALETAS_GLOBO = [
  RAINBOW,                                                         // arcoíris
  ['#FF6FAE', '#FFFFFF', '#FF6FAE', '#FFFFFF', '#FF6FAE', '#FFFFFF'],   // dulce (rosado y blanco)
  ['#1E90FF', '#4FB6F5', '#9BE3FF', '#3DD6A8', '#1E90FF', '#9BE3FF'],   // mar
  ['#FF5E5E', '#FFB547', '#FFE45C', '#FF8C42', '#FF5E5E', '#FFE45C'],   // atardecer
  ['#A77BF3', '#FFD23F', '#A77BF3', '#FFD23F', '#A77BF3', '#FFD23F'],   // mágico (lila y dorado)
];
function globo(P) {
  // la canasta bajo la mascota (sentada adentro), decorada; arriba (`alto`, que se inclina con la inercia) el globo
  // redondo con sus cuerdas; y la cuerda hasta la mano de Nina
  const M = P.medidas, ALTO = 1.6, rc = Math.max(M.ancho, M.largo) * 0.55 + 0.08, RB = 0.72;
  const g = new THREE.Group();
  const canasta = new THREE.Mesh(new THREE.CylinderGeometry(rc, rc * 0.85, 0.36, 24, 1, true), new THREE.MeshStandardMaterial({ map: mimbreTex(), roughness: 0.8, side: THREE.DoubleSide }));
  canasta.position.y = ALTO + 0.12; g.add(canasta);
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(rc * 0.85, 18), new THREE.MeshStandardMaterial({ color: 0xA86A35, roughness: 0.8 })); fondo.rotation.x = -Math.PI / 2; fondo.position.y = ALTO - 0.06; g.add(fondo);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(rc, 0.035, 6, 24), new THREE.MeshStandardMaterial({ color: 0x8A5A2E })); borde.rotation.x = Math.PI / 2; borde.position.y = ALTO + 0.3; g.add(borde);
  // banderines de colores colgando del borde
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU, f = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 3), new THREE.MeshStandardMaterial({ color: RAINBOW[i % 6] }));
    f.position.set(Math.cos(a) * (rc + 0.02), ALTO + 0.24, Math.sin(a) * (rc + 0.02)); f.rotation.x = Math.PI; g.add(f);
  }
  // arriba: el globo, con gajos de colores, y sus 4 cuerdas (se inclina desde el borde de la canasta)
  const arriba = new THREE.Group(); arriba.position.y = ALTO + 0.3; g.add(arriba);
  // los gajos, de una de varias combinaciones de colores (cada mascota la suya, según su nombre)
  const paleta = PALETAS_GLOBO[[...(P.nombre || '')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % PALETAS_GLOBO.length];
  const geo = new THREE.SphereGeometry(RB, 28, 20), col = [], c = new THREE.Color(), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); c.set(paleta[Math.floor(((a + Math.PI) / TAU) * 12) % paleta.length]); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const bola = new THREE.Group(); bola.position.y = M.alto + 1.05; arriba.add(bola);
  bola.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })));
  const cuerdas = new THREE.MeshBasicMaterial({ color: 0xF4E8D8 });
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, p0 = new THREE.Vector3(Math.cos(a) * rc, 0, Math.sin(a) * rc), p1 = new THREE.Vector3(Math.cos(a) * RB * 0.5, bola.position.y - RB * 0.86, Math.sin(a) * RB * 0.5);
    const L = p0.distanceTo(p1), h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, L, 4), cuerdas);
    h.position.copy(p0).add(p1).multiplyScalar(0.5); h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()); arriba.add(h);
  }
  P.root.add(g);
  // la cuerda de Nina: un tubo delgado del fondo de la canasta a su mano, con una pequeña curva (en el mundo)
  const cuerda = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 2, 0)]), 12, 0.012, 5), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  cuerda.frustumCulled = false; cuerda.visible = false; scene.add(cuerda);
  P.siempreSentada = true;
  return { g, alto: ALTO, bola, arriba, canastaY: ALTO - 0.06, cuerda, flota: true, globo: true, inercia: { k: 9, c: 3.2, max: 0.7 }, quitar() { scene.remove(cuerda); cuerda.geometry.dispose(); cuerda.material.dispose(); } };
}
// El platillo volador: un disco plateado con luces de colores que dan vueltas por el borde, una cúpula de vidrio con
// antena y la mascota sentada adentro, flotando a la altura del hombro de la dueña (como la burbuja). Quieta, prende el
// rayo abductor: un tubo de luz verde hasta el suelo, con anillos que suben y estrellitas.
function platillo(P) {
  const M = P.medidas, R = Math.max(M.largo, M.ancho) * 0.75 + 0.18, g = new THREE.Group();
  const cupula = (P.head ? P.head.position.y + (M.cabezaR || 0.25) : M.alto + 0.3) * 1.05 + 0.08;   // la mascota sentada cabe
  const disco = new THREE.Group(); g.add(disco);
  const perfil = [[0.001, -0.26], [0.3, -0.24], [0.62, -0.17], [0.92, -0.06], [1, 0], [0.95, 0.04], [0.75, 0.05], [0.001, 0.05]].map(([x, y]) => new THREE.Vector2(x * R, y * R));
  disco.add(new THREE.Mesh(new THREE.LatheGeometry(perfil, 40), new THREE.MeshStandardMaterial({ color: 0xD9DEEA, metalness: 0.6, roughness: 0.25 })));
  const luces = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, l = new THREE.Mesh(new THREE.SphereGeometry(R * 0.055, 10, 8), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: RAINBOW[i % 6], emissiveIntensity: 1 }));
    l.position.set(Math.cos(a) * R * 0.95, -R * 0.02, Math.sin(a) * R * 0.95); disco.add(l); luces.push(l);
  }
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(R * 0.32, R * 0.04, 8, 28), new THREE.MeshStandardMaterial({ color: 0x7CF0FF, emissive: 0x3FD8FF, emissiveIntensity: 1 }));
  anillo.rotation.x = Math.PI / 2; anillo.position.y = -R * 0.23; g.add(anillo);
  // la cúpula (más alta que ancha si la mascota es alta) y su antena
  const rc = R * 0.62, vidrio = new THREE.Mesh(new THREE.SphereGeometry(rc, 28, 14, 0, TAU, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xBFF4FF, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2, emissive: 0x66CCFF, emissiveIntensity: 0.15, depthWrite: false, side: THREE.DoubleSide }));
  vidrio.scale.y = Math.max(1, cupula / rc); vidrio.position.y = R * 0.04; g.add(vidrio);
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 5), new THREE.MeshStandardMaterial({ color: 0x8C8FA8 }));
  const punta = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: 0xFF6FAE, emissive: 0xFF3FA4, emissiveIntensity: 1 }));
  antena.position.y = R * 0.04 + rc * vidrio.scale.y + 0.07; punta.position.y = antena.position.y + 0.09; g.add(antena, punta);
  // el rayo: un tubo abierto que se angosta hacia arriba (mide 1 y se estira hasta el suelo), anillos y la mancha de luz
  const verde = (op) => new THREE.MeshBasicMaterial({ color: 0x7CFF9A, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  const rayo = new THREE.Group(); rayo.position.y = -R * 0.24; g.add(rayo);
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.3, R * 0.85, 1, 28, 1, true), verde(0.22)); tubo.geometry.translate(0, -0.5, 0); rayo.add(tubo);
  const aros = [0, 1, 2].map(() => { const a = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), verde(0.5)); a.rotation.x = Math.PI / 2; rayo.add(a); return a; });
  const mancha = new THREE.Mesh(new THREE.CircleGeometry(R * 0.9, 28), verde(0.35)); mancha.rotation.x = -Math.PI / 2; rayo.add(mancha);
  P.root.add(g);
  P.siempreSentada = true;
  return { g, alto: 1.2, R, cupula, disco, luces, punta, rayo, tubo, aros, mancha, platillo: true, flota: true, encendido: 0, inercia: { k: 7, c: 2.8, max: 0.5 } };
}
const TRANSPORTES = { patines, burbuja, alitas, alitas_murcielago: P => alitas(P, 'murcielago'), globo, platillo };
export const ES_TRANSPORTE = id => !!TRANSPORTES[id];

// El Convertidor sorpresa: al tomarlo, y después cada 20 a 30 segundos, la mascota se convierte en otro animal (FORMAS
// en pets/models.js) con una nube mágica de colores. Sigue siendo ella (su nombre, su especie en la ficha y lo que
// tiene puesto, que se le vuelve a calzar con los anclajes de la nueva forma). Al quitárselo vuelve a su especie.
// No cambia mientras está ocupada (`P.ocupada`: buscando la pelota, haciendo un truco…; game/mascotienda.js).
const CAMBIO = () => 20 + Math.random() * 10;
function cambiarCuerpo(P, forma, magia) {
  const F = FORMAS.find(f => f.id === forma), N = buildPet(forma, (forma !== P.especie && F && F.color) || P.color);
  if (P.hueso) { P.hueso.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); P.hueso = null; }
  P.root.remove(P.body); P.disposables.forEach(g => g.dispose());
  P.root.add(N.body);
  for (const k of ['body', 'legs', 'tail', 'head', 'mats', 'anclas', 'medidas', 'mallas', 'disposables', 'labelY']) P[k] = N[k];
  P.kind = forma; P.cadera = undefined;
  if (P.label) P.label.position.y = P.labelY;
  if (magia && P.root.parent === scene) {
    P.root.updateMatrixWorld(true); P.body.getWorldPosition(_a); _a.y += P.medidas.alto * 0.5 * P.root.scale.x;
    nubeMagica(_a, Math.max(0.4, P.medidas.largo * P.root.scale.x)); emit('sonido', 'magia');
    if (forma !== P.especie) emit('aviso', `✨ ¡${P.nombre} se convirtió en ${F.nombre}!`);
  }
}
function otraForma(P) { const l = FORMAS.filter(f => f.id !== P.kind); return l[Math.floor(Math.random() * l.length)].id; }

const TAMANOS = { mini: 0.6, gigante: 1.6 };
export function ponerExtras(P, extras = {}) {
  P.pedidos = extras;
  // el convertidor: se quita todo, se cambia el cuerpo y se vuelve a poner
  let forma = P.kind;
  if (extras.convertidor && !P.convActivo) { P.convActivo = true; P.convT = CAMBIO(); forma = otraForma(P); }
  else if (!extras.convertidor && P.convActivo) { P.convActivo = false; forma = P.especie; }
  if (forma !== P.kind) { aplicar(P, {}); cambiarCuerpo(P, forma, true); }
  aplicar(P, extras);
}
function aplicar(P, extras) {
  if (P.ext && P.ext.id !== extras.transporte) {
    if (P.ext.g.parent) P.ext.g.parent.remove(P.ext.g);
    P.ext.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    if (P.ext.quitar) P.ext.quitar();
    P.ext = null; P.siempreSentada = false;
    P.body.position.x = P.body.position.z = 0; P.body.rotation.z = 0; P.legs.forEach(l => { l.rotation.z = 0; });
  }
  if (extras.transporte && !P.ext && TRANSPORTES[extras.transporte]) {
    P.ext = TRANSPORTES[extras.transporte](P); P.ext.id = extras.transporte;
    sinSombra(P.ext.g);
  }
  ponerPelaje(P, extras);            // arcoíris, pastillas de diseño, invisible (pets/pelaje.js)
  // caramelo de aura: el aura ascendente de la competencia, en bucle y del tamaño de la mascota
  if (extras.aura && !P.auraFx) {
    const k = P.medidas.largo * 0.75, base = new THREE.Group(); base.scale.setScalar(k); P.root.add(base);
    P.auraFx = efectoAura(base, { color: 'celeste', alto: (P.medidas.alto * 2.2) / k, bucle: true }); P.auraFx.base = base;
  } else if (!extras.aura && P.auraFx) { P.auraFx.quitar(); P.root.remove(P.auraFx.base); P.auraFx = null; }
  ponerCompanero(P, extras.companero);   // la mariposa que la acompaña (pets/companeros.js)
  ponerRopa(P, extras.ropa || {});   // collar, sombrero, capa… (pets/ropa.js)
  // poción mini o gigante: la mascota entera (con lo que lleva) cambia de tamaño; los letreros no
  const tamano = TAMANOS[extras.tamano] ? extras.tamano : null;
  P.escala = (P.medidas.escala || 1) * (TAMANOS[tamano] || 1);
  if (P.root.scale.x !== P.escala && P.root.parent === scene) {
    P.root.scale.setScalar(P.escala);
    P.root.children.forEach(c => { if (c.userData.s0) c.scale.copy(c.userData.s0).multiplyScalar(1 / P.escala); });
  }
  P.extras = { transporte: P.ext ? P.ext.id : null, arcoiris: !!extras.arcoiris, ropa: ropaPuesta(P), brillo: !!extras.brillo, burbujas: !!extras.burbujas, tamano,
    diseno: DISENOS.includes(extras.diseno) ? extras.diseno : null, invisible: !!extras.invisible, aura: !!P.auraFx,
    voz: VOCES_POCION.includes(extras.voz) ? extras.voz : null, companero: P.companero ? P.companero.id : null,
    pixeles: !!extras.pixeles, convertidor: !!P.convActivo,
    // (con pociones de voz: pets/follow.js y la pelota usan su voz en vez de la de la especie)
  };
  // (con la mascota se anima siempre: el sombrero de mago, la corona, los lentes y el hueso también se mueven)
  P.extrasUpdate = (t, dt, speed) => animarExtras(P, t, dt, speed);
  if (!P.ext) { P.body.position.y = Math.max(0, P.body.position.y); if (P.label) P.label.position.y = P.labelY; }
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Vector3();
// la burbuja hace "plop" cada tanto: se agranda un poco, revienta en gotitas, desaparece un momento y se vuelve a
// armar creciendo. Devuelve su tamaño (0 = reventada).
function plop(P, E, dt) {
  E.plopT = (E.plopT ?? 12 + Math.random() * 8) - dt;
  if (E.plopT > 0) return 1;
  const u = -E.plopT;   // segundos desde que empezó
  if (u < 0.2) return 1 + u * 1.2;
  if (!E.reventada) {
    E.reventada = true; P.root.updateMatrixWorld(true);
    E.bola.getWorldPosition(_a); estallido(_a, E.r * P.root.scale.x); emit('sonido', 'pop');
  }
  if (u < 0.8) return 0.001;
  if (u < 1.4) return Math.max(0.001, (u - 0.8) / 0.6);
  E.reventada = false; E.plopT = 14 + Math.random() * 10;
  return 1;
}
// A qué altura va: con burbuja o alitas, el perro, el gato y el conejo flotan a la altura del hombro de la dueña
// (`P.hombro`, en metros sobre su suelo: lo pone game/mascotienda.js; 1,75 si no se sabe): el centro de la burbuja, o
// el medio del cuerpo con alitas. Está en el espacio de la mascota (se divide por su escala) y cambia suave (si ella
// se sienta, bajan). El unicornio y lo demás, a su altura de siempre.
const HOMBRO = 1.75;
function alturaVuelo(P, E, dt) {
  if (P.kind === 'unicornio' || !(E.alas || (E.bola && E.r) || E.platillo) || P.root.parent !== scene) return E.alto;   // (en el auto, no)
  // (el platillo: la cabeza de la mascota sentada, más o menos a la altura del hombro)
  const h = (P.hombro || HOMBRO) / P.root.scale.x, meta = E.alas ? h - P.medidas.alto * 0.7 : E.platillo ? h - E.cupula * 0.6 : h - E.r * 0.62;
  E.altoS = E.altoS === undefined ? meta : E.altoS + (meta - E.altoS) * Math.min(1, dt * 2.5);
  return E.altoS;
}
// Inercia: un resorte poco amortiguado entre la mascota y lo que flota con ella. Cuando la mascota acelera, lo que
// flota se queda atrás; cuando frena, se adelanta un poco y vuelve suave. `E.inercia`: { k: rigidez, c: freno, max }.
// Devuelve el desplazamiento en el espacio de la mascota (x: costado, z: adelante).
function inercia(P, E, dt) {
  const I = E.inercia, R = P.root.position, S = E.res || (E.res = { px: R.x, pz: R.z, vx: 0, vz: 0, ox: 0, oz: 0, wx: 0, wz: 0 });
  dt = Math.min(dt, 0.05);
  if (dt <= 0) return [0, 0];
  let vx = (R.x - S.px) / dt, vz = (R.z - S.pz) / dt;
  if (Math.hypot(R.x - S.px, R.z - S.pz) > 2) { vx = S.vx; vz = S.vz; S.ox = S.oz = S.wx = S.wz = 0; }   // un salto (teletransporte)
  S.px = R.x; S.pz = R.z;
  vx = S.vx + (vx - S.vx) * Math.min(1, dt * 12); vz = S.vz + (vz - S.vz) * Math.min(1, dt * 12);   // sin tirones
  S.wx -= (vx - S.vx) * 0.5; S.wz -= (vz - S.vz) * 0.5;   // lo que acelera la mascota empuja al revés lo que flota
  S.vx = vx; S.vz = vz;
  S.wx += (-I.k * S.ox - I.c * S.wx) * dt; S.wz += (-I.k * S.oz - I.c * S.wz) * dt;
  S.ox += S.wx * dt; S.oz += S.wz * dt;
  const d = Math.hypot(S.ox, S.oz);
  if (d > I.max) { S.ox *= I.max / d; S.oz *= I.max / d; }
  const a = P.root.rotation.y, c = Math.cos(a), s = Math.sin(a);
  return [S.ox * c - S.oz * s, S.ox * s + S.oz * c];
}
// Patinar: empuja con las patas en diagonal (una de adelante con la de atrás del otro lado), hacia atrás y un poco
// hacia afuera, mientras el cuerpo se mece de lado y no salta. Quieta, la mascota hace lo de siempre.
function patinar(P, E, dt, speed, anda) {
  E.rueda.forEach(r => { r.rotation.x += dt * speed * 30; });
  E.mece = (E.mece || 0) + ((anda ? 1 : 0) - (E.mece || 0)) * Math.min(1, dt * 5);
  const m = E.mece;
  if (m < 0.01) { P.body.rotation.z = 0; P.legs.forEach(l => { l.rotation.z = 0; }); return; }
  E.fase += dt * (3.5 + Math.min(speed, 3) * 1.5);
  const xm = P.legs.reduce((a, l) => a + l.position.x, 0) / P.legs.length, zm = P.legs.reduce((a, l) => a + l.position.z, 0) / P.legs.length;
  P.body.position.y *= 1 - m;
  P.body.rotation.z = Math.sin(E.fase) * 0.09 * m;
  P.legs.forEach(l => {
    const lado = l.position.x > xm ? 1 : -1, fr = l.position.z > zm ? 1 : -1;
    const emp = Math.max(0, Math.sin(E.fase + (lado * fr > 0 ? 0 : Math.PI)));   // 0 = deslizando, 1 = empujando
    l.rotation.x = l.rotation.x * (1 - m) + (fr > 0 ? 0.25 * emp - 0.1 : 0.5 * emp) * m;
    l.rotation.z = lado * 0.22 * emp * m;
  });
}
// el platillo: se mece, se inclina con la inercia, las luces dan vueltas cambiando de color y, quieta, baja el rayo
function moverPlatillo(P, E, t, dt, anda, alto, lx, lz) {
  E.g.position.set(lx, alto, lz);
  E.g.rotation.z = -lx * 0.5 + Math.sin(t * 1.3) * 0.04; E.g.rotation.x = lz * 0.5 + Math.sin(t * 1.7) * 0.03;
  P.body.position.x = lx; P.body.position.z = lz; P.body.rotation.z += E.g.rotation.z; P.body.rotation.x += E.g.rotation.x;
  E.disco.rotation.y += dt * (anda ? 4 : 1.5);
  E.luces.forEach((l, i) => l.material.emissive.setHSL((i / E.luces.length + t * 0.4) % 1, 1, 0.55));
  E.punta.material.emissiveIntensity = Math.sin(t * 6) > 0 ? 1.2 : 0.2;
  const antes = E.encendido;
  E.encendido += ((anda ? 0 : 1) - E.encendido) * Math.min(1, dt * (anda ? 6 : 2));
  if (antes < 0.3 && E.encendido >= 0.3) emit('sonido', 'ovni');
  const k = E.encendido, largo = Math.max(0.01, alto - E.R * 0.24);
  E.rayo.visible = k > 0.02;
  if (!E.rayo.visible) return;
  E.tubo.scale.set(1, largo * k, 1); E.tubo.material.opacity = (0.16 + Math.sin(t * 9) * 0.04) * k;
  E.mancha.position.y = -largo * k; E.mancha.material.opacity = 0.35 * k;
  E.aros.forEach((a, i) => {   // suben del suelo al platillo, achicándose
    const u = (t * 0.45 + i / 3) % 1, r = E.R * (0.85 - 0.55 * u);
    a.position.y = -largo * k * (1 - u); a.scale.set(r, r, r); a.material.opacity = 0.5 * k * Math.sin(Math.PI * u);
  });
  E.chispa = (E.chispa || 0) - dt;
  if (k > 0.6 && E.chispa <= 0 && P.root.parent === scene) {
    E.chispa = 0.18; P.root.updateMatrixWorld(true);
    _a.set((Math.random() - 0.5) * E.R, -largo * Math.random(), (Math.random() - 0.5) * E.R).add(E.rayo.position).applyMatrix4(E.g.matrixWorld);
    soltarEstrellita(_a);
  }
}
function animarExtras(P, t, dt, speed) {
  const E = P.ext, anda = speed > 0.05;
  // el convertidor: cada tanto, otra forma (y se vuelve a poner lo que tenía)
  if (P.convActivo && !P.ocupada && P.root.parent === scene && (P.convT -= dt) <= 0) {
    P.convT = CAMBIO();
    const pedidos = P.pedidos; aplicar(P, {}); cambiarCuerpo(P, otraForma(P), true); aplicar(P, pedidos);
    return;
  }
  animarPelaje(P, t);
  if (P.auraFx) P.auraFx.update(dt);
  moverCompanero(P, t, dt);
  // cuánto está girando (para inclinarse en las curvas con los patines)
  const giro = P.yawAntes === undefined || dt <= 0 ? 0 : Math.atan2(Math.sin(P.root.rotation.y - P.yawAntes), Math.cos(P.root.rotation.y - P.yawAntes)) / dt;
  P.yawAntes = P.root.rotation.y;
  let alto = 0, etiqueta = 0;
  if (E) {
    // con alitas, cuando la dueña salta (`P.salta`, lo pone game/mascotienda.js) sube un poco y aletea rápido
    E.saltito = (E.saltito || 0) + ((E.alas && P.salta ? 1 : 0) - (E.saltito || 0)) * Math.min(1, dt * 4);
    alto = alturaVuelo(P, E, dt) + (E.vuela ? Math.sin(t * 1.3) * 0.09 + E.saltito * 0.35 : E.flota ? Math.sin(t * 2.2) * 0.06 : 0);
    const [lx, lz] = E.inercia ? inercia(P, E, dt) : [0, 0];
    if (E.patina) {
      patinar(P, E, dt, speed, anda);
      // en las curvas se inclina hacia adentro, y al andar suelta chispitas de las ruedas
      E.curva = (E.curva || 0) + (Math.max(-0.35, Math.min(0.35, giro * 0.12)) * (anda ? 1 : 0) - (E.curva || 0)) * Math.min(1, dt * 6);
      P.body.rotation.z += E.curva;
      if (anda) soltarChispas(P, dt);
    }
    if (E.bola && E.r) {   // burbuja: rodea a la mascota sentada, flota y tiembla un poco; se adelanta y vuelve
      const p = 1 + Math.sin(t * 3) * 0.02;
      E.bola.scale.set(p, 1 / p, p).multiplyScalar(plop(P, E, dt));
      E.g.position.set(lx, alto + E.r * 0.62, lz);
      P.body.position.x = lx; P.body.position.z = lz;
      etiqueta = E.r * 0.9;
    }
    if (E.alas) {
      // caminata lunar: pasos lentos y grandes, en diagonal (una de adelante con la de atrás del otro lado), que llegan
      // a las patas bien estiradas (se quedan un momento ahí: la curva `estira`); en cada paso el cuerpo sube y baja
      // suave, como con poca gravedad. Quieta, flota con las patas colgando y remando apenas. Se pasa de una a otra
      // poco a poco (E.mueve) y el cuerpo se deja llevar por la inercia.
      E.mueve = (E.mueve || 0) + ((anda ? 1 : 0) - (E.mueve || 0)) * Math.min(1, dt * 2);
      E.paso = (E.paso || 0) + dt * (1.5 + Math.min(speed, 3) * 0.5) * E.mueve;
      const m = E.mueve, estira = v => Math.sign(v) * Math.pow(Math.abs(v), 0.55);
      const xm = P.legs.reduce((a, l) => a + l.position.x, 0) / P.legs.length, zm = P.legs.reduce((a, l) => a + l.position.z, 0) / P.legs.length;
      P.legs.forEach((l, i) => {
        const lado = l.position.x > xm ? 1 : -1, fr = l.position.z > zm ? 1 : -1;
        const camina = -0.85 * estira(Math.sin(E.paso + (lado * fr > 0 ? 0 : Math.PI)));
        const flota = (fr > 0 ? -0.35 : 0.4) + Math.sin(t * 1.4 + i * 1.3) * 0.1;
        l.rotation.x = camina * m + flota * (1 - m); l.rotation.z = 0;
      });
      P.body.position.y = Math.abs(Math.sin(E.paso)) * 0.11 * m;   // un saltito suave en cada paso
      E.lean += ((anda ? 0.08 : 0) - E.lean) * Math.min(1, dt * 1.5);
      P.body.rotation.x = E.lean + Math.sin(E.paso * 2) * 0.04 * m + Math.sin(t * 0.8) * 0.03 * (1 - m);
      P.body.rotation.z = Math.sin(E.paso) * 0.04 * m + Math.sin(t * 0.6) * 0.04 * (1 - m) - lx * 0.5;
      P.body.position.x = lx; P.body.position.z = lz;
      // aletear suave: cada ala gira sobre el eje del lomo (z): casi juntas arriba ↔ abiertas hacia su lado
      E.fAla = (E.fAla || 0) + dt * (anda ? 6 : 4) * (1 + E.saltito * 2.5);   // (al saltar, aletea más rápido)
      E.alas.forEach(({ pivote, s }) => { pivote.rotation.z = -s * (0.3 + (Math.sin(E.fAla) * 0.5 + 0.5) * (0.55 + E.saltito * 0.25)); });
    }
    if (E.platillo) { moverPlatillo(P, E, t, dt, anda, alto, lx, lz); etiqueta = Math.max(0, E.cupula + 0.35 - P.labelY); }
    if (E.globo) {
      // el globo se mece y se queda atrás con la inercia (se inclina como un péndulo); la mascota va sentada en la
      // canasta; la cuerda baja hasta la mano de Nina
      E.g.position.set(lx * 0.6, Math.sin(t * 2.2) * 0.06, lz * 0.6);
      E.g.rotation.z = Math.sin(t * 1.1) * 0.05 - lx * 0.15; E.g.rotation.x = Math.sin(t * 0.9) * 0.04 + lz * 0.15;
      E.arriba.rotation.z = -lx * 0.45; E.arriba.rotation.x = lz * 0.45;
      P.body.position.x = E.g.position.x; P.body.position.z = E.g.position.z;
      E.bola.rotation.y = t * 0.2;
      etiqueta = E.arriba.position.y + E.bola.position.y + 0.9 - E.alto - P.labelY;
      if (P.mano && P.root.parent) {
        P.root.updateMatrixWorld(true);
        _a.set(E.g.position.x, E.canastaY + E.g.position.y, E.g.position.z).applyMatrix4(P.root.matrixWorld); _b.copy(P.mano);
        const d = _a.distanceTo(_b);
        E.cuerda.visible = d < 8;
        if (E.cuerda.visible) {
          _m.copy(_a).add(_b).multiplyScalar(0.5); _m.y -= Math.min(0.5, d * 0.12);   // la cuerda cuelga un poco
          E.cuerda.geometry.dispose();
          E.cuerda.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([_a.clone(), _m.clone(), _b.clone()]), 12, 0.012, 5);
        }
      } else E.cuerda.visible = false;
    }
  }
  P.body.position.y += alto;
  if (P.label) P.label.position.y = P.labelY + alto + etiqueta;
  animarRopa(P, t, dt, speed);
  if (P.extras.brillo || P.extras.burbujas) soltarEfectos(P, dt, anda);
}
