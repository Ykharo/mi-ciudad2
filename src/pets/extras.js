// Artículos de la Mascotienda Arcoíris puestos en una mascota: un "transporte" (patines, burbuja, alitas o mini globo)
// y el jarabe arcoíris (el pelaje cambia de color en ciclo). `ponerExtras(P, { transporte, arcoiris })` arma o quita
// lo que corresponde; la animación la hace `P.extrasUpdate` (lo llama animatePet en cada cuadro): el cuerpo flota
// (`alto`), las patas se quedan quietas al patinar, las alitas aletean, el globo se mece…
// Nada de esto proyecta sombra ni cambia materiales compartidos (el pelaje arcoíris usa copias propias).
import { THREE } from '../engine/three.js';
import { RAINBOW } from '../engine/materials.js';

const TAU = Math.PI * 2;
// medidas por especie: alto del lomo, largo, ancho (para calzar patines, burbuja, alas)
const TALLA = { perro: { lomo: 0.65, largo: 0.7, ancho: 0.44 }, gato: { lomo: 0.6, largo: 0.62, ancho: 0.38 }, conejo: { lomo: 0.6, largo: 0.5, ancho: 0.5 }, unicornio: { lomo: 0.9, largo: 0.8, ancho: 0.44 } };
const sinSombra = g => { g.traverse(o => { o.castShadow = false; o.receiveShadow = false; }); return g; };

function patines(T) {
  const g = new THREE.Group();
  const tabla = new THREE.MeshStandardMaterial({ color: 0xFF6FAE, roughness: 0.4 }), rueda = [];
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, T.largo * 0.55), tabla); t.position.set(s * T.ancho * 0.3, 0.09, 0); g.add(t);
    for (const z of [-1, 1]) {
      const m = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: RAINBOW[(s + 1 + z + 1) % 6], emissiveIntensity: 0.9 });
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), m); r.rotation.z = Math.PI / 2;
      r.position.set(s * T.ancho * 0.3, 0.045, z * T.largo * 0.2); g.add(r); rueda.push(r);
    }
  }
  return { g, alto: 0.08, rueda, patina: true };
}
function burbuja(T) {
  const r = Math.max(T.largo, T.lomo) * 0.75;
  const m = new THREE.MeshStandardMaterial({ color: 0xCFF2FF, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2, emissive: 0x88CCFF, emissiveIntensity: 0.15, depthWrite: false, side: THREE.DoubleSide });
  const b = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), m); b.position.y = r * 0.95;
  const brillo = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 12, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7, depthWrite: false }));
  brillo.position.set(-r * 0.45, r * 1.45, r * 0.55); brillo.scale.set(1, 0.6, 0.3);
  const g = new THREE.Group(); g.add(b, brillo);
  return { g, alto: 0.35, bola: b, r, flota: true };
}
function alitas(T) {
  const forma = new THREE.Shape();
  forma.moveTo(0, 0); forma.bezierCurveTo(0.15, 0.25, 0.42, 0.32, 0.5, 0.16); forma.bezierCurveTo(0.42, 0.04, 0.3, -0.02, 0.22, -0.06);
  forma.bezierCurveTo(0.26, -0.18, 0.12, -0.22, 0, 0);
  const m = new THREE.MeshStandardMaterial({ color: 0xFFD6F0, emissive: 0xB98BFF, emissiveIntensity: 0.35, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
  const geo = new THREE.ShapeGeometry(forma), alas = [];
  const g = new THREE.Group(); g.position.set(0, T.lomo, -T.largo * 0.08);
  for (const s of [-1, 1]) {
    const pivote = new THREE.Group(); pivote.position.x = s * T.ancho * 0.25; g.add(pivote);
    const a = new THREE.Mesh(geo, m); a.scale.set(s * 1.1, 1.1, 1); a.rotation.y = s * 0.2; pivote.add(a); alas.push({ pivote, s });
  }
  return { g, alto: 0.55, alas, flota: true };
}
function globo(T) {
  const g = new THREE.Group(), alto = 1.5;
  const tela = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, vertexColors: true, roughness: 0.5 });
  // un globo con franjas de colores (gajos)
  const geo = new THREE.SphereGeometry(0.32, 18, 14), col = [], c = new THREE.Color(), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); c.set(RAINBOW[Math.floor(((a + Math.PI) / TAU) * 6) % 6]); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.scale(1, 1.2, 1);
  const bola = new THREE.Group(); bola.position.y = T.lomo + alto; g.add(bola);
  bola.add(new THREE.Mesh(geo, tela));
  const canasta = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xC98B4F })); canasta.position.y = -0.48; bola.add(canasta);
  const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, alto - 0.55, 4), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  hilo.position.y = T.lomo + (alto - 0.55) / 2; g.add(hilo);
  return { g, alto: 0.45, bola, hilo, flota: true };
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
  const T = TALLA[P.kind] || TALLA.perro;
  if (P.ext && P.ext.id !== extras.transporte) {
    P.root.remove(P.ext.g);
    P.ext.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    P.ext = null;
  }
  if (extras.transporte && !P.ext && TRANSPORTES[extras.transporte]) {
    P.ext = TRANSPORTES[extras.transporte](T); P.ext.id = extras.transporte;
    P.root.add(sinSombra(P.ext.g));
  }
  arcoiris(P, !!extras.arcoiris);
  P.extras = { transporte: P.ext ? P.ext.id : null, arcoiris: !!P.arco };
  P.extrasUpdate = P.ext || P.arco ? (t, dt, speed) => animarExtras(P, t, dt, speed) : null;
  if (!P.extrasUpdate) { P.body.position.y = Math.max(0, P.body.position.y); if (P.label) P.label.position.y = P.labelY; }
}

function animarExtras(P, t, dt, speed) {
  const E = P.ext, anda = speed > 0.05;
  if (P.arco) {
    const h = (t * 0.12) % 1;
    P.arco.nuevo.c.color.setHSL(h, 0.75, 0.68); P.arco.nuevo.dk.color.setHSL(h, 0.7, 0.5); P.arco.nuevo.lt.color.setHSL((h + 0.08) % 1, 0.8, 0.82);
  }
  let alto = 0;
  if (E) {
    alto = E.alto;
    if (E.patina) {
      // patinando: las patas quietas, el cuerpo no salta, las ruedas giran
      if (anda) { P.legs.forEach(l => { l.rotation.x *= 0.1; }); P.body.position.y *= 0.15; }
      E.rueda.forEach(r => { r.rotation.x += dt * speed * 25; });
    }
    if (E.flota) alto += Math.sin(t * 2.2) * 0.06;
    if (E.bola && E.r) { const p = 1 + Math.sin(t * 3) * 0.02; E.bola.scale.set(p, 1 / p, p); E.g.position.y = alto * 0.3 + Math.sin(t * 2.2) * 0.04; }
    if (E.alas) E.alas.forEach(({ pivote, s }) => { pivote.rotation.z = s * (0.25 + Math.sin(t * (anda ? 16 : 9)) * 0.55); });
    if (E.hilo) { E.bola.rotation.z = Math.sin(t * 1.3) * 0.12; E.bola.position.x = Math.sin(t * 1.3) * 0.12; }
  }
  P.body.position.y += alto;
  if (P.label) P.label.position.y = P.labelY + alto + (E && E.hilo ? 1.7 : 0);
}
