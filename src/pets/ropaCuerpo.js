// La ropa que envuelve el cuerpo de la mascota (la Mascotienda, pasillo de Ropa; pets/ropa.js la pone y la quita):
//   cuerpo   chalecos (de mezclilla, acolchado, reflectante, salvavidas), suéter de rayas y disfraces enteros (dinosaurio,
//            abeja, tiburón, astronauta: el traje y lo de la cabeza —capucha, antenas, casco—)
//   piernas  pantalones (de mezclilla, de pijama): un trozo sobre las caderas y un tubo en cada pata
//   pies     botas de lluvia
// Todo se calza con el tronco de su especie (TORSO en pets/models.js: caja redondeada o bola estirada) y con la caja de
// cada pata (como los patines de pets/extras.js), así sirve para todas, también para las formas del convertidor.
// Cada prenda devuelve { g } (y `quitar` si puso algo en las patas); pets/ropa.js tira sus geometrías y materiales.
import { THREE } from '../engine/three.js';
import { rbox } from '../engine/geometry.js';

const TAU = Math.PI * 2;
const est = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const _b = new THREE.Box3(), _c = new THREE.Box3();

// texturas hechas aquí (una vez): mezclilla y pijama de estrellitas
const TEX = {};
function textura(id) {
  if (TEX[id]) return TEX[id];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  if (id === 'mezclilla') {
    x.fillStyle = '#3D6DB0'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(160,200,255,.35)'; x.lineWidth = 2;
    for (let i = -128; i < 256; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); }
  } else {   // pijama: celeste con estrellitas y lunas
    x.fillStyle = '#9FD3FF'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#FFF6B0';
    [[20, 24], [84, 18], [52, 70], [110, 92], [18, 104]].forEach(([cx, cy], i) => {
      x.beginPath();
      if (i % 2) { x.arc(cx, cy, 9, 0, TAU); x.fill(); x.fillStyle = '#9FD3FF'; x.beginPath(); x.arc(cx + 5, cy - 3, 8, 0, TAU); x.fill(); x.fillStyle = '#FFF6B0'; return; }
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 4 : 9; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      x.fill();
    });
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return (TEX[id] = t);
}
const tela = (id, o = {}) => est('#FFFFFF', { map: textura(id), ...o });
const propia = m => { m.userData.tex = true; return m; };   // (su textura es compartida: pets/ropa.js no la tira)

// un trozo del tronco, de z0 a z1 (en fracciones del medio largo: −1 = la cola, 1 = el pecho), un poco más grande que
// el cuerpo (`inf`: cuánto más). Caja redondeada o bola estirada según la especie. Con `rep`, la textura va a lo largo
// del cuerpo (u de 0 a rep, de atrás hacia adelante): así las rayas dan la vuelta al cuerpo, en una sola pieza.
function tramo(P, z0, z1, material, inf = 1, rep = 0) {
  const m = tramoSin(P, z0, z1, material, inf);
  if (rep) {
    const p = m.geometry.attributes.position, uv = m.geometry.attributes.uv; m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox, a = bb.min.z, L = bb.max.z - bb.min.z || 1;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getZ(i) - a) / L * rep, 0.5 + p.getY(i) * 0.3);
    uv.needsUpdate = true;
  }
  return m;
}
function tramoSin(P, z0, z1, material, inf) {
  const [cy, w, h, l, redondo] = P.torso, e = 0.025 * inf;
  let m;
  if (redondo) {
    const pts = []; for (let i = 0; i <= 16; i++) { const y = z0 + (z1 - z0) * i / 16; pts.push(new THREE.Vector2(Math.sqrt(Math.max(0.0004, 1 - y * y)), y)); }
    const geo = new THREE.LatheGeometry(pts, 28); geo.rotateX(Math.PI / 2);
    m = new THREE.Mesh(geo, material); m.scale.set(w / 2 + e, h / 2 + e, l / 2 + e); m.position.y = cy;
    material.side = THREE.DoubleSide;
  } else {
    // (la misma caja redondeada de los cuerpos, con el radio de sus esquinas más lo que se agranda: así la curva del
    // cuerpo no se asoma por las esquinas; una copia, porque las de rbox son compartidas)
    const len = (z1 - z0) / 2 * l + (z1 >= 1 ? e : 0) + (z0 <= -1 ? e : 0), W = w + 2 * e, H = h + 2 * e;
    const geo = rbox(W, H, len, Math.min(0.16 + e, len / 2, H / 2)).clone();
    m = new THREE.Mesh(geo, material); m.position.set(0, cy, ((z0 + z1) / 2) * l / 2 + ((z1 >= 1 ? e : 0) - (z0 <= -1 ? e : 0)) / 2);
  }
  return m;
}
// franjas a lo largo del cuerpo (suéter, abeja, acolchado): una sola pieza con una textura de rayas de esos colores
// (`acolchado`: cada raya más oscura en los bordes, como si estuviera inflada)
function franjas(g, P, z0, z1, n, colores, inf = 1, acolchado = false) {
  const c = document.createElement('canvas'); c.width = 64 * colores.length; c.height = 8; const x = c.getContext('2d');
  colores.forEach((col, i) => {
    x.fillStyle = col; x.fillRect(i * 64, 0, 64, 8);
    if (acolchado) { const gr = x.createLinearGradient(i * 64, 0, i * 64 + 64, 0); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = gr; x.fillRect(i * 64, 0, 64, 8); }
  });
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping;
  g.add(tramo(P, z0, z1, est('#FFFFFF', { map: t, roughness: acolchado ? 0.4 : 0.8 }), inf, n / colores.length));
}
// dónde está: lo de arriba del lomo, el pecho y la cola, en el espacio del cuerpo
const arriba = P => P.torso[0] + P.torso[2] / 2;
const pecho = P => P.torso[3] / 2;
// la caja de cada pata (en su espacio), sin la ropa
function cajaPata(leg) {
  _b.makeEmpty();
  leg.children.forEach(m => { if (m.geometry && !m.userData.ropa) { m.updateMatrix(); m.geometry.computeBoundingBox(); _b.union(_c.copy(m.geometry.boundingBox).applyMatrix4(m.matrix)); } });
  return { w: _b.max.x - _b.min.x, l: _b.max.z - _b.min.z, top: _b.max.y, fondo: _b.min.y, cx: (_b.max.x + _b.min.x) / 2, cz: (_b.max.z + _b.min.z) / 2 };
}
// algo en cada pata: desde `desde` (0 = arriba, 1 = abajo) hasta `hasta`, un poco más ancho
function enPatas(P, desde, hasta, material, ancho = 1.3, extra) {
  const puestas = [];
  P.legs.forEach(leg => {
    const B = cajaPata(leg), alto = B.top - B.fondo, y0 = B.top - alto * desde, y1 = B.top - alto * hasta;
    const m = new THREE.Mesh(new THREE.BoxGeometry(B.w * ancho + 0.01, y0 - y1, B.l * ancho + 0.01), material);
    m.position.set(B.cx, (y0 + y1) / 2, B.cz); m.userData.ropa = true; leg.add(m); puestas.push(m);
    if (extra) extra(leg, B, puestas);
  });
  return () => puestas.forEach(m => { m.parent && m.parent.remove(m); m.geometry.dispose(); });
}
// el centro de la cabeza (en el espacio de la cabeza): bajo el ancla de la cabeza
const centroCabeza = P => new THREE.Vector3(P.medidas.cabeza[0], P.medidas.cabeza[1] - P.medidas.cabezaR, P.medidas.cabeza[2]);
// una capucha: media bola más grande que la cabeza, abierta adelante (la cara se asoma)
function capucha(P, material) {
  const R = P.medidas.cabezaR * 1.22, geo = new THREE.SphereGeometry(R, 22, 14, Math.PI / 2 + 0.95, TAU - 1.9, 0, Math.PI * 0.72);
  material.side = THREE.DoubleSide;
  const m = new THREE.Mesh(geo, material); m.position.copy(centroCabeza(P)); P.head.add(m);
  return m;
}

/* ---------- cuerpo ---------- */
function chalecoMezclilla(P) {
  const g = new THREE.Group(), denim = propia(tela('mezclilla')), oro = est('#FFC93C', { metalness: 0.6, roughness: 0.3 });
  g.add(tramo(P, -0.3, 1, denim));
  const [cy, w, h] = P.torso;
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), oro); b.position.set(0, cy + h * 0.25 - i * h * 0.22, pecho(P) + 0.04); g.add(b); }
  for (const s of [-1, 1]) {   // los bolsillos, a los costados
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, h * 0.28, P.torso[3] * 0.18), est('#2E5590')); b.position.set(s * (w / 2 + 0.035), cy, P.torso[3] * 0.22); g.add(b);
  }
  return { g };
}
function chalecoAcolchado(P) {
  const g = new THREE.Group();
  franjas(g, P, -0.35, 1, 5, ['#FF6FAE'], 1.3, true);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, P.torso[3] * 0.66), est('#FFFFFF', { metalness: 0.5 }));
  zip.position.set(0, arriba(P) + 0.06, P.torso[3] * 0.17); g.add(zip);
  return { g };
}
function chalecoReflectante(P) {
  const g = new THREE.Group(), plata = est('#E8EEF5', { metalness: 0.8, roughness: 0.2, emissive: '#B8C4D0', emissiveIntensity: 0.35 });
  g.add(tramo(P, -0.3, 1, est('#D7F542', { emissive: '#B8E000', emissiveIntensity: 0.25 })));
  g.add(tramo(P, 0.05, 0.22, plata, 1.6)); g.add(tramo(P, 0.5, 0.67, plata, 1.6));
  return { g };
}
function chalecoSalvavidas(P) {
  const g = new THREE.Group(), blanco = est('#FFFFFF');
  g.add(tramo(P, -0.2, 1, est('#FF7A2E', { roughness: 0.5 }), 2.6));
  g.add(tramo(P, 0.15, 0.27, blanco, 3.2)); g.add(tramo(P, 0.55, 0.67, blanco, 3.2));
  return { g };
}
function sueter(P) {
  const g = new THREE.Group();
  franjas(g, P, -0.5, 1, 8, ['#E8394A', '#FFFFFF', '#3DAE5A', '#FFFFFF'], 1.2);
  // el cuello de lana: un aro grueso donde empieza el cuello
  const M = P.medidas, aro = new THREE.Mesh(new THREE.TorusGeometry((M.cuelloR || 0.16) * 1.05, 0.04, 8, 24), est('#E8394A'));
  aro.rotation.x = M.cuelloInc ?? (P.kind === 'unicornio' ? -1.15 : -0.65); P.anclas.cuello.add(aro);
  return { g, quitar() { aro.parent && aro.parent.remove(aro); aro.geometry.dispose(); aro.material.dispose(); } };
}
/* ---------- disfraces (el traje entero y lo de la cabeza) ---------- */
function disfrazDino(P) {
  const g = new THREE.Group(), verde = est('#5BC85B'), placas = [est('#FF9F2E'), est('#FFD23F')];
  g.add(tramo(P, -1, 1, verde, 1.1));
  const L = P.torso[3];
  for (let i = 0; i < 6; i++) {
    const z = L * (0.38 - i * 0.15), p = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.13, 4), placas[i % 2]);
    p.position.set(0, arriba(P) + 0.07, z); p.scale.z = 0.45; g.add(p);
  }
  const cap = capucha(P, est('#5BC85B'));
  const extras = [cap];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 4), placas[i % 2]), R = P.medidas.cabezaR * 1.22, a = 0.3 + i * 0.45;
    p.position.copy(centroCabeza(P)).add(new THREE.Vector3(0, Math.cos(a) * R, -Math.sin(a) * R)); p.rotation.x = -a; p.scale.z = 0.45; P.head.add(p); extras.push(p);
  }
  return { g, quitar: () => extras.forEach(m => { m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); }) };
}
function disfrazAbeja(P) {
  const g = new THREE.Group();
  franjas(g, P, -1, 1, 6, ['#FFD23F', '#2B2A33'], 1.1);
  // las alitas, en la espalda
  const ala = est('#FFFFFF', { transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }), k = P.medidas.largo;
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(new THREE.CircleGeometry(k * 0.22, 16), ala); a.scale.set(0.6, 1, 1);
    a.position.set(s * k * 0.12, k * 0.2, 0); a.rotation.set(0, s * 1.2, s * 0.6); P.anclas.espalda.add(a); a.userData.ala = true;
  }
  // las antenas, en la cabeza
  const negro = est('#2B2A33'), c = centroCabeza(P), R = P.medidas.cabezaR, puestas = P.anclas.espalda.children.filter(o => o.userData.ala);
  for (const s of [-1, 1]) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, R * 0.9, 5), negro); v.position.set(c.x + s * R * 0.35, c.y + R * 1.25, c.z); v.rotation.z = -s * 0.35; P.head.add(v); puestas.push(v);
    const b = new THREE.Mesh(new THREE.SphereGeometry(R * 0.13, 8, 6), negro); b.position.set(c.x + s * R * 0.52, c.y + R * 1.68, c.z); P.head.add(b); puestas.push(b);
  }
  return { g, quitar: () => puestas.forEach(m => { m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); }) };
}
function disfrazTiburon(P) {
  const g = new THREE.Group(), gris = est('#7F93AB'), blanco = est('#FFFFFF');
  g.add(tramo(P, -1, 1, gris, 1.1));
  const aleta = new THREE.Shape(); aleta.moveTo(-0.12, 0); aleta.quadraticCurveTo(0.02, 0.06, 0.05, 0.24); aleta.quadraticCurveTo(0.06, 0.08, 0.14, 0); aleta.closePath();
  const f = new THREE.Mesh(new THREE.ExtrudeGeometry(aleta, { depth: 0.03, bevelEnabled: false }), gris); f.rotation.y = -Math.PI / 2; f.position.set(0.015, arriba(P) + 0.02, 0); g.add(f);
  const cap = capucha(P, est('#7F93AB')), puestas = [cap];
  // los dientes, en el borde de la capucha (alrededor de la cara)
  const R = P.medidas.cabezaR * 1.22, c = centroCabeza(P);
  for (let i = 0; i < 9; i++) {
    const t = (i / 8) * Math.PI * 0.72, a1 = Math.PI / 2 + 0.95, d = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 4), blanco);
    for (const lado of [a1, a1 + TAU - 1.9]) {
      const x = -R * Math.cos(lado) * Math.sin(t), y = R * Math.cos(t), z = R * Math.sin(lado) * Math.sin(t);
      const m = d.clone(); m.position.set(c.x + x, c.y + y, c.z + z); m.rotation.z = Math.PI; P.head.add(m); puestas.push(m);
    }
  }
  return { g, quitar: () => puestas.forEach(m => { m.parent.remove(m); m.geometry.dispose(); }) };
}
function disfrazAstronauta(P) {
  const g = new THREE.Group(), blanco = est('#F4F6FB'), gris = est('#8C93A8', { metalness: 0.4 });
  g.add(tramo(P, -1, 1, blanco, 1.1)); g.add(tramo(P, -0.15, 0.05, gris, 1.6));
  const [cy, w] = P.torso;
  const parche = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.12), est('#3A6FD8')); parche.position.set(w / 2 + 0.05, cy + 0.04, P.torso[3] * 0.2); g.add(parche);
  const rojo = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 0.12), est('#E8394A')); rojo.position.set(w / 2 + 0.05, cy + 0.04, P.torso[3] * 0.2); g.add(rojo);
  // el casco de vidrio y la mochila
  const R = P.medidas.cabezaR * 1.5, casco = new THREE.Mesh(new THREE.SphereGeometry(R, 24, 16), est('#CFEFFF', { transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.3, depthWrite: false }));
  casco.position.copy(centroCabeza(P)); P.head.add(casco);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.03, 8, 24), gris); aro.position.copy(centroCabeza(P)).y -= R * 0.68; aro.rotation.x = Math.PI / 2; P.head.add(aro);
  const k = P.medidas.largo, mochila = new THREE.Mesh(new THREE.BoxGeometry(k * 0.4, k * 0.32, k * 0.16), blanco.clone()); mochila.position.set(0, k * 0.16, -k * 0.02); P.anclas.espalda.add(mochila);
  const puestas = [casco, aro, mochila];
  return { g, quitar: () => puestas.forEach(m => { m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); }) };
}
/* ---------- piernas y pies ---------- */
function pantalon(P, tipo) {
  const g = new THREE.Group(), mat = tipo === 'pijama' ? propia(tela('pijama')) : propia(tela('mezclilla'));
  g.add(tramo(P, -1, -0.1, mat, 1.15));
  if (tipo !== 'pijama') {   // los bolsillos de atrás
    const [cy] = P.torso;
    for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(P.torso[1] * 0.22, P.torso[2] * 0.22, 0.02), est('#2E5590')); b.position.set(s * P.torso[1] * 0.2, cy, -P.torso[3] / 2 - 0.045); g.add(b); }
  }
  const quitar = enPatas(P, 0, tipo === 'pijama' ? 0.85 : 0.7, mat, 1.3);
  return { g, quitar };
}
function botasLluvia(P) {
  const g = new THREE.Group(), amarillo = est('#FFD23F', { roughness: 0.35 }), suela = est('#C98B00');
  const quitar = enPatas(P, 0.6, 1.02, amarillo, 1.3, (leg, B, puestas) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(B.w * 1.45, 0.03, B.l * 1.6), suela); s.position.set(B.cx, B.fondo + 0.005, B.cz + B.l * 0.1); s.userData.ropa = true; leg.add(s); puestas.push(s);
  });
  return { g, quitar };
}

export const LUGAR_CUERPO = { chaleco_mezclilla: 'cuerpo', chaleco_acolchado: 'cuerpo', chaleco_reflectante: 'cuerpo', chaleco_salvavidas: 'cuerpo', sueter: 'cuerpo',
  disfraz_dino: 'cuerpo', disfraz_abeja: 'cuerpo', disfraz_tiburon: 'cuerpo', disfraz_astronauta: 'cuerpo', pantalon_mezclilla: 'piernas', pantalon_pijama: 'piernas', botas_lluvia: 'pies' };
export const HACER_CUERPO = {
  chaleco_mezclilla: chalecoMezclilla, chaleco_acolchado: chalecoAcolchado, chaleco_reflectante: chalecoReflectante, chaleco_salvavidas: chalecoSalvavidas, sueter,
  disfraz_dino: disfrazDino, disfraz_abeja: disfrazAbeja, disfraz_tiburon: disfrazTiburon, disfraz_astronauta: disfrazAstronauta,
  pantalon_mezclilla: P => pantalon(P, 'mezclilla'), pantalon_pijama: P => pantalon(P, 'pijama'), botas_lluvia: botasLluvia,
};
// lo de cuerpo, piernas y pies va colgado del cuerpo (se mueve con él al caminar, sentarse o acostarse)
export function ponerEnCuerpo(P, o) { P.body.add(o.g); return o; }
