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
    leg.children.forEach(m => { if (m.geometry) { m.updateMatrix(); m.geometry.computeBoundingBox(); box.union(caja.copy(m.geometry.boundingBox).applyMatrix4(m.matrix)); } });
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
function alitas(P) {
  // alas de mariposa (dos pares: las de arriba más grandes), en el plano de la espalda, abriéndose hacia los lados
  const M = P.medidas, k = M.largo * 1.5;   // (del largo de la mascota: ~0,5 m de ala en el perro)
  const arriba = new THREE.Shape(); arriba.moveTo(0, 0); arriba.bezierCurveTo(0.12, 0.3, 0.45, 0.42, 0.5, 0.22); arriba.bezierCurveTo(0.52, 0.08, 0.3, 0.02, 0, 0);
  const abajo = new THREE.Shape(); abajo.moveTo(0, 0); abajo.bezierCurveTo(0.22, -0.02, 0.38, -0.12, 0.32, -0.26); abajo.bezierCurveTo(0.24, -0.34, 0.08, -0.2, 0, 0);
  const m1 = new THREE.MeshStandardMaterial({ color: 0xFF7FD0, emissive: 0xB04BFF, emissiveIntensity: 0.4, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const m2 = new THREE.MeshStandardMaterial({ color: 0x6FC8FF, emissive: 0x3F8BFF, emissiveIntensity: 0.4, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false });
  const g1 = new THREE.ShapeGeometry(arriba), g2 = new THREE.ShapeGeometry(abajo), alas = [];
  // alas de hada: cada ala, de pie a lo largo del lomo (el dibujo va hacia atrás y arriba: su plano es el del costado
  // de la mascota, así se ve entera de lado), abierta hacia su lado en V (se ve de atrás); aletean abriéndose y
  // cerrándose sobre el eje del lomo
  const g = new THREE.Group(); g.position.set(0, 0.02, 0.06);
  for (const s of [-1, 1]) {
    const pivote = new THREE.Group(); g.add(pivote);
    const ala = new THREE.Group(); ala.rotation.y = Math.PI / 2; ala.rotation.order = 'YXZ'; ala.rotation.x = -0.15; pivote.add(ala);
    const a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2);
    for (const w of [a, b]) { w.scale.set(k, k, 1); w.position.y = 0.08 * k; ala.add(w); }
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
  const geo = new THREE.SphereGeometry(RB, 28, 20), col = [], c = new THREE.Color(), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); c.set(RAINBOW[Math.floor(((a + Math.PI) / TAU) * 12) % 6]); col.push(c.r, c.g, c.b); }
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
const TRANSPORTES = { patines, burbuja, alitas, globo };
export const ES_TRANSPORTE = id => !!TRANSPORTES[id];

// el pelaje arcoíris: copias propias de los materiales del pelaje, que cambian de color (y al quitarlo, vuelven)
function arcoiris(P, on) {
  if (on && !P.arco) {
    const nuevo = {}, swap = new Map();
    for (const [k, m] of Object.entries(P.mats)) { nuevo[k] = m.clone(); swap.set(m, nuevo[k]); }
    P.root.traverse(o => { if (o.isMesh && swap.has(o.material)) o.material = swap.get(o.material); });
    P.arco = { nuevo, swap };
  } else if (!on && P.arco) {
    const vuelta = new Map([...P.arco.swap].map(([a, b]) => [b, a]));
    P.root.traverse(o => { if (o.isMesh && vuelta.has(o.material)) o.material = vuelta.get(o.material); });
    Object.values(P.arco.nuevo).forEach(m => m.dispose());
    P.arco = null;
  }
}

export function ponerExtras(P, extras = {}) {
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
  arcoiris(P, !!extras.arcoiris);
  P.extras = { transporte: P.ext ? P.ext.id : null, arcoiris: !!P.arco };
  P.extrasUpdate = P.ext || P.arco ? (t, dt, speed) => animarExtras(P, t, dt, speed) : null;
  if (!P.extrasUpdate) { P.body.position.y = Math.max(0, P.body.position.y); if (P.label) P.label.position.y = P.labelY; }
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _m = new THREE.Vector3();
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
function animarExtras(P, t, dt, speed) {
  const E = P.ext, anda = speed > 0.05;
  if (P.arco) {
    const h = (t * 0.12) % 1;
    P.arco.nuevo.c.color.setHSL(h, 0.75, 0.68); P.arco.nuevo.dk.color.setHSL(h, 0.7, 0.5); P.arco.nuevo.lt.color.setHSL((h + 0.08) % 1, 0.8, 0.82);
  }
  let alto = 0, etiqueta = 0;
  if (E) {
    alto = E.alto + (E.vuela ? Math.sin(t * 1.3) * 0.09 : E.flota ? Math.sin(t * 2.2) * 0.06 : 0);
    const [lx, lz] = E.inercia ? inercia(P, E, dt) : [0, 0];
    if (E.patina) patinar(P, E, dt, speed, anda);
    if (E.bola && E.r) {   // burbuja: rodea a la mascota sentada, flota y tiembla un poco; se adelanta y vuelve
      const p = 1 + Math.sin(t * 3) * 0.02; E.bola.scale.set(p, 1 / p, p);
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
      const f = anda ? 6 : 4;
      E.alas.forEach(({ pivote, s }) => { pivote.rotation.z = -s * (0.3 + (Math.sin(t * f) * 0.5 + 0.5) * 0.55); });
    }
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
}
