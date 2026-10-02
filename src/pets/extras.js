// Artículos de la Mascotienda Arcoíris puestos en una mascota: un "transporte" (patines, burbuja, alitas o mini globo)
// y el jarabe arcoíris (el pelaje cambia de color en ciclo). `ponerExtras(P, { transporte, arcoiris })` arma o quita
// lo que corresponde; la animación la hace `P.extrasUpdate` (lo llama animatePet en cada cuadro).
// Todo se calza con el mapa de anclajes de cada especie (ANCLAJES en pets/models.js: espalda, lomo, cuello, cabeza,
// cola y medidas): lo que va sobre el cuerpo cuelga de su ancla y se mueve con él al caminar, saltar o sentarse.
//   patines   bajo las patas; al andar, las patas quietas y el cuerpo sin saltos; las ruedas giran y brillan
//   burbuja   una burbuja grande alrededor; la mascota va sentada adentro, flotando
//   alitas    alas de mariposa en la espalda (ancla `espalda`), que aletean
//   globo     un globo aerostático grande y alto; la mascota va sentada en la canasta y Nina lleva la cuerda
//             (`P.mano`: dónde está su mano, lo pone game/mascotienda.js en cada cuadro)
// Nada de esto proyecta sombra ni cambia materiales compartidos (el pelaje arcoíris usa copias propias).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { RAINBOW } from '../engine/materials.js';

const TAU = Math.PI * 2;
const sinSombra = g => { g.traverse(o => { o.castShadow = false; o.receiveShadow = false; }); return g; };

function patines(P) {
  const M = P.medidas, g = new THREE.Group();
  const tabla = new THREE.MeshStandardMaterial({ color: 0xFF6FAE, roughness: 0.4 }), rueda = [];
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, M.largo * 0.75), tabla); t.position.set(s * M.ancho * 0.3, 0.09, 0); g.add(t);
    for (const z of [-1, 1]) {
      const m = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: RAINBOW[(s + 1 + z + 1) % 6], emissiveIntensity: 0.9 });
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), m); r.rotation.z = Math.PI / 2;
      r.position.set(s * M.ancho * 0.3, 0.045, z * M.largo * 0.28); g.add(r); rueda.push(r);
    }
  }
  P.root.add(g);
  return { g, alto: 0.08, rueda, patina: true };
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
  return { g, alto: 0.3, bola: b, r, flota: true };
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
  return { g, alto: 0.45, alas, flota: true };
}
function globo(P) {
  // la canasta bajo la mascota (sentada adentro), el globo grande arriba con sus cuerdas, y la cuerda hasta la mano de Nina
  const M = P.medidas, ALTO = 1.6, rc = Math.max(M.ancho, M.largo) * 0.55 + 0.08, RB = 0.95;
  const g = new THREE.Group();
  const mimbre = new THREE.MeshStandardMaterial({ color: 0xC98B4F, roughness: 0.8 });
  const canasta = new THREE.Mesh(new THREE.CylinderGeometry(rc, rc * 0.85, 0.36, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0xC98B4F, roughness: 0.8, side: THREE.DoubleSide }));
  canasta.position.y = ALTO + 0.12; g.add(canasta);
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(rc * 0.85, 18), mimbre); fondo.rotation.x = -Math.PI / 2; fondo.position.y = ALTO - 0.06; g.add(fondo);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(rc, 0.035, 6, 24), new THREE.MeshStandardMaterial({ color: 0x8A5A2E })); borde.rotation.x = Math.PI / 2; borde.position.y = ALTO + 0.3; g.add(borde);
  // el globo, con gajos de colores
  const geo = new THREE.SphereGeometry(RB, 24, 18), col = [], c = new THREE.Color(), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); c.set(RAINBOW[Math.floor(((a + Math.PI) / TAU) * 12) % 6]); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.scale(1, 1.18, 1);
  const bola = new THREE.Group(); bola.position.y = ALTO + M.alto + 1.5; g.add(bola);
  bola.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })));
  const cuerdas = new THREE.MeshBasicMaterial({ color: 0xF4E8D8 });
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, p0 = new THREE.Vector3(Math.cos(a) * rc, ALTO + 0.3, Math.sin(a) * rc), p1 = new THREE.Vector3(Math.cos(a) * RB * 0.55, bola.position.y - RB * 1.05, Math.sin(a) * RB * 0.55);
    const L = p0.distanceTo(p1), h = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, L, 4), cuerdas);
    h.position.copy(p0).add(p1).multiplyScalar(0.5); h.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(h);
  }
  P.root.add(g);
  // la cuerda de Nina: un tubo delgado del fondo de la canasta a su mano, con una pequeña curva (en el mundo)
  const cuerda = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 2, 0)]), 12, 0.012, 5), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  cuerda.frustumCulled = false; cuerda.visible = false; scene.add(cuerda);
  P.siempreSentada = true;
  return { g, alto: ALTO, bola, canastaY: ALTO - 0.06, cuerda, flota: true, globo: true, quitar() { scene.remove(cuerda); cuerda.geometry.dispose(); cuerda.material.dispose(); } };
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
function animarExtras(P, t, dt, speed) {
  const E = P.ext, anda = speed > 0.05;
  if (P.arco) {
    const h = (t * 0.12) % 1;
    P.arco.nuevo.c.color.setHSL(h, 0.75, 0.68); P.arco.nuevo.dk.color.setHSL(h, 0.7, 0.5); P.arco.nuevo.lt.color.setHSL((h + 0.08) % 1, 0.8, 0.82);
  }
  let alto = 0, etiqueta = 0;
  if (E) {
    alto = E.alto + (E.flota ? Math.sin(t * 2.2) * 0.06 : 0);
    if (E.patina) {
      // patinando: las patas quietas, el cuerpo no salta, las ruedas giran
      if (anda) { P.legs.forEach(l => { l.rotation.x *= 0.1; }); P.body.position.y *= 0.15; }
      E.rueda.forEach(r => { r.rotation.x += dt * speed * 25; });
    }
    if (E.bola && E.r) {   // burbuja: rodea a la mascota sentada, flota y tiembla un poco
      const p = 1 + Math.sin(t * 3) * 0.02; E.bola.scale.set(p, 1 / p, p);
      E.g.position.y = alto + E.r * 0.62;
      etiqueta = E.r * 0.9;
    }
    // aletear: cada ala gira sobre el eje del lomo (z): casi juntas arriba ↔ abiertas hacia su lado
    if (E.alas) E.alas.forEach(({ pivote, s }) => { pivote.rotation.z = -s * (0.25 + (Math.sin(t * (anda ? 14 : 7)) * 0.5 + 0.5) * 0.7); });
    if (E.globo) {
      // el globo se mece; la mascota va sentada en la canasta; la cuerda baja hasta la mano de Nina
      E.g.position.y = Math.sin(t * 2.2) * 0.06;
      E.g.rotation.z = Math.sin(t * 1.1) * 0.05; E.g.rotation.x = Math.sin(t * 0.9) * 0.04;
      E.bola.rotation.y = t * 0.2;
      etiqueta = E.bola.position.y + 1.2 - P.labelY;
      if (P.mano && P.root.parent) {
        P.root.updateMatrixWorld(true);
        _a.set(0, E.canastaY + E.g.position.y, 0).applyMatrix4(P.root.matrixWorld); _b.copy(P.mano);
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
