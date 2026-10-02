// Ropa de las mascotas (la Mascotienda, pasillo de Ropa): una prenda por lugar del cuerpo, calzada con el mapa de
// anclajes de la especie (ANCLAJES en pets/models.js), así sirve para todas:
//   cuello  collar con placa (la inicial de su nombre)                 ancla `cuello`
//   cabeza  corona, gorro de cumpleaños o sombrero de mago             ancla `cabeza` (sigue los giros de la cabeza)
//   lomo    capa de superhéroe, que flamea al andar                    sobre el lomo, desde el cuello hacia la cola
//   cuello  (o) bufanda arcoíris larguísima que se arrastra            ancla `cuello` (la cola, en la escena)
//   cara    lentes de sol                                              `ojos` (en el espacio de la cabeza)
//   cola    moño en la punta de la cola                                `colaLargo` (en el espacio de la cola)
// `ponerRopa(P, { cuello, cabeza, lomo })` arma o quita lo que corresponde; `animarRopa(P, t, dt, speed)` mueve la capa.
// Los materiales son propios de cada prenda (se tiran al quitarla); nada de esto proyecta sombra.
import { THREE } from '../engine/three.js';
import { stripeTexture } from '../engine/textures.js';
import { scene } from '../engine/renderer.js';

export const LUGAR_ROPA = { collar: 'cuello', bufanda: 'cuello', corona: 'cabeza', gorro_cumple: 'cabeza', sombrero_mago: 'cabeza', capa: 'lomo', lentes: 'cara', mono: 'cola' };
const LUGARES = ['cuello', 'cabeza', 'lomo', 'cara', 'cola'];
const est = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
function estrella(r1, r2, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ShapeGeometry(s);
}

// el collar: un aro alrededor del cuello, inclinado como el cuello, con una placa dorada colgando adelante
function collar(P) {
  const M = P.medidas, r = M.cuelloR || M.ancho * 0.4, g = new THREE.Group();
  const aro = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 8, 28), est('#FF4F8B')); g.add(aro);
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#FFD23F'; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#9A6B00'; x.font = '800 38px "Baloo 2", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText((P.nombre || '?').slice(0, 1).toUpperCase(), 32, 35);
  const placa = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 20), [est('#E8B400', { metalness: 0.5 }), est('#FFFFFF', { map: new THREE.CanvasTexture(c), metalness: 0.3 }), est('#E8B400')]);
  placa.rotation.x = Math.PI / 2; placa.position.set(0, -r - 0.05, 0.02); g.add(placa);
  g.rotation.x = P.kind === 'unicornio' ? -1.15 : -0.65;   // (el aro mira hacia donde va el cuello)
  P.anclas.cuello.add(g);
  return { g };
}
// sombreros: sobre el ancla `cabeza`, del tamaño de la cabeza (cabezaR)
// Una banda alrededor del eje y que se abre hacia arriba (radio r0 abajo, r1 arriba), con el borde de arriba en puntas:
// su alto en el ángulo a es alto(a). Con `desde(a)` la banda empieza más arriba (un ribete que sigue el borde).
function banda(r0, r1, H, alto, desde = () => 0, N = 120) {
  const pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2, y0 = desde(a), y1 = alto(a), c = Math.cos(a), s = Math.sin(a);
    for (const y of [y0, y1]) { const r = r0 + (r1 - r0) * (y / H); pos.push(c * r, y, s * r); }
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
// la corona (como la referencia): cuerpo azul-violeta que se abre hacia arriba con el borde en 5 puntas, dorada por
// dentro; un ribete dorado que sigue las puntas (más alto que el azul), bolitas doradas en cada punta y gemas rosadas
// en los valles; abajo, un aro azul redondeado
function corona(P) {
  const R = P.medidas.cabezaR, g = new THREE.Group(), n = 5;
  const r0 = R * 0.5, r1 = R * 0.72, H = R * 0.95, base = R * 0.38, pico = R * 0.5;
  const punta = a => Math.pow(0.5 + 0.5 * Math.cos(n * a), 2.2);                 // 1 en cada punta, 0 en los valles
  const oroArriba = a => base + pico * punta(a) + R * 0.06;                       // el borde dorado (sobresale)
  const azulArriba = a => base + pico * punta(a) * 0.82 - R * 0.06;              // el azul, un poco más abajo
  const azul = est('#5266E8', { roughness: 0.35, side: THREE.FrontSide }), oro = est('#FFC93C', { roughness: 0.35, emissive: '#FFB000', emissiveIntensity: 0.18 });
  const adentro = est('#FFB02E', { roughness: 0.4, side: THREE.BackSide });
  // cuerpo: azul por fuera y dorado por dentro (la misma banda, cada material de un lado)
  const cuerpo = banda(r0, r1, H, azulArriba);
  g.add(new THREE.Mesh(cuerpo, azul), new THREE.Mesh(cuerpo, adentro));
  // el ribete dorado: una banda un poquito más afuera, desde un poco bajo el borde azul hasta el borde dorado
  const ribete = banda(r0 + R * 0.015, r1 + R * 0.015, H, oroArriba, a => azulArriba(a) - R * 0.04);
  g.add(new THREE.Mesh(ribete, est('#FFC93C', { roughness: 0.35, emissive: '#FFB000', emissiveIntensity: 0.18, side: THREE.DoubleSide })));
  const radio = y => r0 + (r1 - r0) * (y / H);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, y = oroArriba(a) + R * 0.06;                  // la bolita sobre cada punta
    const bola = new THREE.Mesh(new THREE.SphereGeometry(R * 0.085, 12, 10), oro); bola.position.set(Math.cos(a) * radio(y), y, Math.sin(a) * radio(y)); g.add(bola);
    const av = a + Math.PI / n, yv = base * 0.75, rv = radio(yv) + R * 0.03;      // la gema en el valle
    const gema = new THREE.Mesh(new THREE.SphereGeometry(R * 0.07, 10, 8), est('#FF8FB8', { roughness: 0.3, emissive: '#FF8FB8', emissiveIntensity: 0.15 }));
    gema.scale.set(1, 1, 0.6); gema.position.set(Math.cos(av) * rv, yv, Math.sin(av) * rv); gema.lookAt(0, yv, 0); g.add(gema);
  }
  const aro = new THREE.Mesh(new THREE.TorusGeometry(r0 + R * 0.02, R * 0.07, 10, 36), est('#4357D6', { roughness: 0.35 })); aro.rotation.x = Math.PI / 2; aro.position.y = R * 0.03; g.add(aro);
  g.position.y = -R * 0.1; g.rotation.x = -0.12;   // (un poco hundida: la base se calza en la cabeza redonda)
  P.anclas.cabeza.add(g);
  return { g };
}
function gorroCumple(P) {
  const R = P.medidas.cabezaR, g = new THREE.Group();
  const cono = new THREE.Mesh(new THREE.ConeGeometry(R * 0.45, R * 1.2, 20, 1, true), est('#FFFFFF', { map: stripeTexture('#FF6FAE', '#FFE45C', 8), side: THREE.DoubleSide }));
  cono.position.y = R * 0.55; g.add(cono);
  const pompon = new THREE.Mesh(new THREE.SphereGeometry(R * 0.14, 10, 8), est('#4FB6F5')); pompon.position.y = R * 1.17; g.add(pompon);
  g.rotation.z = -0.25; g.position.x = R * 0.12;   // (un poco ladeado)
  P.anclas.cabeza.add(g);
  return { g };
}
function sombreroMago(P) {
  const R = P.medidas.cabezaR, g = new THREE.Group(), azul = est('#3B3B98', { side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(R * 0.85, R * 0.85, 0.02, 28), azul));
  const cono = new THREE.Mesh(new THREE.ConeGeometry(R * 0.5, R * 1.5, 24), azul); cono.position.y = R * 0.76; cono.rotation.z = 0.12; g.add(cono);
  const oro = new THREE.MeshBasicMaterial({ color: 0xFFE45C, side: THREE.DoubleSide });
  [[0.3, 0.38], [-0.25, 0.75], [0.1, 1.05]].forEach(([dx, y], i) => {
    const s = new THREE.Mesh(estrella(R * (0.12 - i * 0.02), R * (0.05 - i * 0.008)), oro);
    s.position.set(dx * R, y * R, R * (0.5 - y * 0.3) + 0.004); g.add(s);
  });
  g.position.y = R * 0.02; g.rotation.x = -0.1;
  P.anclas.cabeza.add(g);
  return { g };
}
// la capa: una tela sobre el lomo desde el cuello hacia la cola, que cae por los costados; al andar el final se levanta
// y ondea (los vértices se mueven en animarRopa). Roja con una estrella dorada.
function capa(P) {
  const M = P.medidas, w = M.ancho * 1.15, L = M.largo * 0.85;
  const geo = new THREE.PlaneGeometry(w, L, 6, 12); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -L / 2);   // de z = 0 a -L
  const base = Float32Array.from(geo.attributes.position.array);
  const tela = new THREE.Mesh(geo, est('#FF3B5C', { side: THREE.DoubleSide, roughness: 0.7 }));
  const g = new THREE.Group(); g.position.set(0, M.alto + 0.02, M.cuello[2] - 0.04); g.add(tela);
  const s = new THREE.Mesh(estrella(w * 0.16, w * 0.07), new THREE.MeshBasicMaterial({ color: 0xFFD23F, side: THREE.DoubleSide }));
  s.rotation.x = -Math.PI / 2; s.position.set(0, 0.008, -L * 0.42); tela.add(s);
  P.body.add(g);
  return { g, tela, base, w, L, cuerpo: M.ancho * 0.42, estrella: s, ondea: 0 };
}
// la bufanda arcoíris larguísima: un rollo de lana a rayas de colores alrededor del cuello y una cola larga que cae y
// se arrastra por el suelo detrás de la mascota. La cola es una cuerda de TRAMOS segmentos (uno de cada color) que se
// simula en el mundo (verlet: gravedad, largo fijo y el suelo), así queda atrás al caminar y se ondula al girar.
const TRAMOS = 16;
function bufanda(P) {
  const M = P.medidas, r = (M.cuelloR || M.ancho * 0.4) + 0.02, g = new THREE.Group();
  const colores = ['#FF5E5E', '#FFB547', '#FFE45C', '#3DD6A8', '#4FB6F5', '#A77BF3'];
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 10, 28), est('#FFFFFF', { map: stripeTexture(colores[0], colores[3], 12), roughness: 0.9 })));
  g.rotation.x = P.kind === 'unicornio' ? -1.15 : -0.65;
  P.anclas.cuello.add(g);
  // la cola, en la escena: cada tramo es una tira de lana de un color
  const nudo = new THREE.Object3D(); nudo.position.set(r * 0.5, -r * 0.7, 0); g.add(nudo);   // de donde sale (al costado)
  const largo = 0.11, mats = colores.map(c => est(c, { roughness: 0.9 })), geo = new THREE.BoxGeometry(0.11, 0.03, 1);
  const tiras = Array.from({ length: TRAMOS }, (_, i) => { const m = new THREE.Mesh(geo, mats[i % mats.length]); m.castShadow = true; scene.add(m); return m; });
  return { g, nudo, tiras, largo, pts: null, viejos: null, mats, geo, quitar() { tiras.forEach(m => scene.remove(m)); geo.dispose(); mats.forEach(m => m.dispose()); } };
}
const _p = new THREE.Vector3(), _d = new THREE.Vector3();
function moverBufanda(P, B, dt) {
  const s = P.root.scale.x, L = B.largo * s, suelo = P.root.position.y + 0.02;
  B.nudo.getWorldPosition(_p);
  if (!B.pts || B.pts[0].distanceTo(_p) > 3) {   // al empezar (o tras un salto grande): cae recta hacia atrás
    const atras = new THREE.Vector3(-Math.sin(P.root.rotation.y), 0, -Math.cos(P.root.rotation.y));
    B.pts = Array.from({ length: TRAMOS + 1 }, (_, i) => _p.clone().addScaledVector(atras, i * L * 0.7).setY(Math.max(suelo, _p.y - i * L)));
    B.viejos = B.pts.map(v => v.clone());
  }
  const g = 9.8 * dt * dt, k = Math.min(1, dt * 60);
  B.pts[0].copy(_p);
  for (let i = 1; i <= TRAMOS; i++) {   // verlet: sigue moviéndose como venía (con roce), más la gravedad
    const p = B.pts[i], v = _d.subVectors(p, B.viejos[i]).multiplyScalar(p.y <= suelo + 0.005 ? 0.6 : 0.95);
    B.viejos[i].copy(p); p.add(v); p.y -= g;
  }
  for (let it = 0; it < 6; it++) {      // el largo de cada tramo y el suelo (se arrastra)
    for (let i = 1; i <= TRAMOS; i++) {
      const a = B.pts[i - 1], b = B.pts[i], d = _d.subVectors(b, a), n = d.length() || 1e-6, f = (n - L) / n;
      if (i === 1) b.addScaledVector(d, -f); else { a.addScaledVector(d, f * 0.5 * k); b.addScaledVector(d, -f * 0.5 * k); }
      if (b.y < suelo) b.y = suelo;
    }
    B.pts[0].copy(_p);
  }
  B.tiras.forEach((m, i) => {           // cada tira entre dos puntos, acostada (la cara ancha hacia arriba)
    const a = B.pts[i], b = B.pts[i + 1];
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.scale.set(s, s, Math.max(0.001, a.distanceTo(b)));
    m.lookAt(b);   // (su largo es el eje z: lookAt lo apunta al punto siguiente)
  });
}
// lentes de sol: dos cristales oscuros con marco de color delante de los ojos, unidos por un puente, con patitas
function lentes(P) {
  const [ox, oy, oz] = P.medidas.ojos || [0.1, 0.05, 0.2], R = (P.medidas.cabezaR || 0.25) * 0.24, g = new THREE.Group();
  const marco = est('#FF4F8B'), vidrio = est('#1F1B2E', { metalness: 0.6, roughness: 0.15 });
  for (const s of [-1, 1]) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.012, 20), vidrio); v.rotation.x = Math.PI / 2; v.position.set(s * ox, oy, oz + 0.03); g.add(v);
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 6, 20), marco); m.position.set(s * ox, oy, oz + 0.035); g.add(m);
    const pata = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, oz * 0.8), marco); pata.position.set(s * (ox + R), oy, oz * 0.6); g.add(pata);
  }
  const puente = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.01, ox * 2 - R * 2), 0.014, 0.014), marco); puente.position.set(0, oy + R * 0.3, oz + 0.035); g.add(puente);
  P.head.add(g);   // (en el espacio de la cabeza: sigue sus giros)
  return { g };
}
// moño en la punta de la cola: dos lazos y un nudo (se mueve con la cola)
function mono(P) {
  const L = P.medidas.colaLargo || 0.3, g = new THREE.Group(), cinta = est('#FF6FAE');
  for (const s of [-1, 1]) {
    const lazo = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.11, 4), cinta); lazo.rotation.z = s * Math.PI / 2; lazo.position.x = s * 0.055; lazo.scale.set(1, 1, 0.45); g.add(lazo);
  }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), est('#FFD23F')));
  g.position.set(0, L, 0);
  (P.tail || P.body).add(g);
  return { g };
}
const HACER = { collar, bufanda, corona, gorro_cumple: gorroCumple, sombrero_mago: sombreroMago, capa, lentes, mono };

function tirar(o) {
  if (o.quitar) o.quitar();
  o.g.parent && o.g.parent.remove(o.g);
  o.g.traverse(m => {
    if (m.geometry) m.geometry.dispose();
    [].concat(m.material || []).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); });
  });
}
export function ponerRopa(P, ropa = {}) {
  P.ropa = P.ropa || {};
  for (const lugar of LUGARES) {
    const id = ropa[lugar] && HACER[ropa[lugar]] && LUGAR_ROPA[ropa[lugar]] === lugar ? ropa[lugar] : null, ya = P.ropa[lugar];
    if (ya && ya.id === id) continue;
    if (ya) { tirar(ya); P.ropa[lugar] = null; }
    if (id) { const o = HACER[id](P); o.id = id; o.g.traverse(m => { m.castShadow = false; }); P.ropa[lugar] = o; }
  }
}
export const ropaPuesta = P => Object.fromEntries(Object.entries(P.ropa || {}).filter(([, o]) => o).map(([l, o]) => [l, o.id]));
export const ropaQueSeMueve = P => !!(P.ropa && (P.ropa.lomo || (P.ropa.cuello && P.ropa.cuello.tiras)));

// la capa: cae por los costados y, al andar, el final se levanta y ondea (más rápido cuanto más rápido va)
export function animarRopa(P, t, dt, speed) {
  const B = P.ropa && P.ropa.cuello;
  if (B && B.tiras) { if (P.root.parent === scene) moverBufanda(P, B, Math.min(dt, 0.033)); B.tiras.forEach(m => { m.visible = P.root.parent === scene && P.root.visible !== false; }); }
  const C = P.ropa && P.ropa.lomo; if (!C) return;
  C.ondea += ((Math.min(speed, 2) / 2) - C.ondea) * Math.min(1, dt * 3);
  const pos = C.tela.geometry.attributes.position, b = C.base, m = C.ondea;
  for (let i = 0; i < pos.count; i++) {
    // u: 0 en el cuello, 1 al final; `lado`: cuánto sale del ancho del lomo (0 encima del cuerpo, 1 en el borde)
    const x = b[i * 3], z = b[i * 3 + 2], u = -z / C.L, lado = Math.max(0, (Math.abs(x) - C.cuerpo) / (C.w / 2 - C.cuerpo));
    const cae = -lado * lado * 0.12 * (1 - m * 0.6);                                     // cae por los costados
    const vuela = m * u * u * (0.22 + Math.sin(t * (6 + m * 6) - u * 5 + x * 3) * 0.06); // se levanta y ondea
    const quieta = Math.sin(t * 1.5 - u * 3) * 0.008 * (1 - m);
    pos.setY(i, cae + vuela + quieta);
  }
  pos.needsUpdate = true; C.tela.geometry.computeVertexNormals();
  C.estrella.position.y = 0.008 + m * 0.42 * 0.42 * 0.22;   // (sigue a la tela donde está)
}
