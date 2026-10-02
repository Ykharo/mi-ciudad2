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
import { emit } from '../core/events.js';
import { soltarHumo } from './efectos.js';

const _humo = new THREE.Vector3();

export const LUGAR_ROPA = { collar: 'cuello', bufanda: 'cuello', corona: 'cabeza', gorro_cumple: 'cabeza', sombrero_mago: 'cabeza', capa: 'lomo', lentes: 'cara', mono: 'cola',
  aureola: 'cabeza', cuerno: 'cabeza', antenas: 'cabeza', cohete: 'espalda', collar_musical: 'cuello', paraguas: 'arriba' };
const LUGARES = ['cuello', 'cabeza', 'lomo', 'cara', 'cola', 'espalda', 'arriba'];
const est = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
// cuánto se inclina lo que va alrededor del cuello (el aro mira hacia donde va el cuello; el pingüino va parado)
const inclCuello = P => P.medidas.cuelloInc ?? (P.kind === 'unicornio' ? -1.15 : -0.65);
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
  g.rotation.x = inclCuello(P);   // (el aro mira hacia donde va el cuello)
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
  // el conejito que sale de vez en cuando: asoma por la punta, mueve las orejas y se vuelve a meter
  const conejo = new THREE.Group(), blanco = est('#FFFFFF'), rosa = est('#FFB8D6');
  conejo.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.2, 12, 10), blanco));
  const orejas = [-1, 1].map(s => {
    const o = new THREE.Group(); o.position.set(s * R * 0.08, R * 0.14, 0); o.rotation.z = -s * 0.15;
    const e = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.045, R * 0.22, 4, 8), blanco); e.position.y = R * 0.12; o.add(e);
    const i = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.022, R * 0.16, 4, 6), rosa); i.position.set(0, R * 0.12, R * 0.03); o.add(i);
    conejo.add(o); return o;
  });
  for (const s of [-1, 1]) { const ojo = new THREE.Mesh(new THREE.SphereGeometry(R * 0.03, 8, 6), est('#1F1B2E')); ojo.position.set(s * R * 0.07, R * 0.03, R * 0.17); conejo.add(ojo); }
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(R * 0.03, 8, 6), rosa); nariz.position.set(0, -R * 0.03, R * 0.19); conejo.add(nariz);
  conejo.position.set(Math.sin(0.12) * -R * 1.4, R * 1.45, 0); conejo.scale.setScalar(0.001); g.add(conejo);
  g.position.y = R * 0.02; g.rotation.x = -0.1;
  P.anclas.cabeza.add(g);
  return { g, conejo, orejas, conejoT: 6 + Math.random() * 4 };
}
// la aureola: un aro dorado que brilla y flota sobre la cabeza, subiendo y bajando
function aureola(P) {
  const R = P.medidas.cabezaR, g = new THREE.Group();
  const aro = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, R * 0.07, 10, 32), new THREE.MeshStandardMaterial({ color: '#FFE45C', emissive: '#FFD23F', emissiveIntensity: 0.9 }));
  aro.rotation.x = Math.PI / 2; g.add(aro);
  // el brillo (glow): aros más gruesos, transparentes y que suman luz (se ven claros sobre cualquier fondo); laten despacio
  // (animarCabeza). Sin una luz de verdad: agregar luces obliga a rearmar los materiales de toda la escena
  const glow = [[0.17, 0.45], [0.3, 0.2], [0.46, 0.08]].map(([tubo, op]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, R * tubo, 12, 40), new THREE.MeshBasicMaterial({ color: '#FFE89A', transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.userData.op = op; g.add(m); return m;
  });
  // y un halo suave que siempre mira a la cámara (como el resplandor de una luz), amarillo dorado: se ve también sobre
  // el pasto claro
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 6, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(0.3, 'rgba(255,200,40,0.85)'); gr.addColorStop(0.65, 'rgba(255,170,20,0.35)'); gr.addColorStop(1, 'rgba(255,160,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  halo.scale.set(R * 3.2, R * 2, 1); halo.renderOrder = 5; halo.userData.op = 0.85; halo.material.opacity = 0.85; g.add(halo);
  glow.push(halo);
  g.position.y = R * 0.55;
  P.anclas.cabeza.add(g);
  return { g, flota: g.position.y, glow };
}
// el cuernito de unicornio: un cono con espiral de colores en la frente
function cuerno(P) {
  const R = P.medidas.cabezaR, g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  const col = ['#FFE45C', '#FF8FB8', '#9BE3FF', '#C9B8FF'];
  for (let i = -8; i < 24; i++) { x.fillStyle = col[((i % 4) + 4) % 4]; x.beginPath(); x.moveTo(0, i * 16); x.lineTo(64, i * 16 - 32); x.lineTo(64, i * 16 - 16); x.lineTo(0, i * 16 + 16); x.fill(); }
  const t = new THREE.CanvasTexture(c);
  const cono = new THREE.Mesh(new THREE.ConeGeometry(R * 0.16, R * 0.75, 16), est('#FFFFFF', { map: t, emissive: '#FFFFFF', emissiveIntensity: 0.15 }));
  cono.position.y = R * 0.32; g.add(cono);
  g.position.set(0, -R * 0.15, R * 0.45); g.rotation.x = 0.45;   // en la frente, mirando un poco hacia adelante
  P.anclas.cabeza.add(g);
  return { g };
}
// antenas de abeja: dos varitas con una bolita negra en la punta, que se balancean
function antenas(P) {
  const R = P.medidas.cabezaR, g = new THREE.Group(), negro = est('#26232E'), varas = [];
  for (const s of [-1, 1]) {
    const v = new THREE.Group(); v.position.set(s * R * 0.4, 0, R * 0.1); v.rotation.z = -s * 0.5;
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.035, R * 0.045, R * 1.0, 6), negro); palo.position.y = R * 0.5; v.add(palo);
    const bola = new THREE.Mesh(new THREE.SphereGeometry(R * 0.15, 10, 8), est('#FFD23F')); bola.position.y = R * 1.05; v.add(bola);
    g.add(v); varas.push({ v, s });
  }
  g.position.y = -R * 0.08;
  P.anclas.cabeza.add(g);
  return { g, varas };
}
// Set de superhéroe (id 'capa', lugar lomo; como la imagen de referencia del perro superhéroe), todo calzado con el
// mapa de anclajes, así sirve para todas las especies:
//   capa        desde el cuello, más larga que el cuerpo y más ancha al final; cae por los costados y al andar se
//               levanta hacia atrás y ondea (los vértices se mueven en animarRopa)
//   antifaz     rojo, alrededor de los ojos (un aro por ojo, el puente y la cinta por detrás de la cabeza); si tiene
//               lentes puestos, no se ve
//   collar      rojo con una medalla dorada (si tiene otra cosa en el cuello, no se ve)
//   emblema     dorado en el pecho, con un rayo rojo
//   cinturón    rojo alrededor de la panza
//   muñequeras  rojas en las patas de adelante
const ROJO = '#F2402E';
function capa(P) {
  const M = P.medidas, R = M.cabezaR || 0.25, rojo = est(ROJO, { roughness: 0.6 }), oro = est('#FFC93C', { roughness: 0.35, emissive: '#FFB000', emissiveIntensity: 0.15 });
  const g = new THREE.Group(), partes = new THREE.Group(); g.add(partes);
  // la capa (de z = 0 en el cuello a -L), ensanchándose hacia el final
  const w = M.ancho * 1.1, L = M.largo * 1.2;
  const geo = new THREE.PlaneGeometry(w, L, 8, 14); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -L / 2);
  const p0 = geo.attributes.position;
  for (let i = 0; i < p0.count; i++) p0.setX(i, p0.getX(i) * (0.7 + 0.6 * (-p0.getZ(i) / L)));
  const base = Float32Array.from(p0.array);
  const tela = new THREE.Mesh(geo, est(ROJO, { side: THREE.DoubleSide, roughness: 0.7 }));
  const capaG = new THREE.Group(); capaG.position.set(0, M.alto + 0.02, M.cuello[2] - 0.06); capaG.add(tela); P.body.add(capaG);
  // el antifaz (en el espacio de la cabeza, como los lentes)
  const [ox, oy, oz] = M.ojos || [0.1, 0.05, 0.2], ra = R * 0.3, mascara = new THREE.Group();
  for (const s of [-1, 1]) { const aro = new THREE.Mesh(new THREE.TorusGeometry(ra, ra * 0.42, 8, 20), rojo); aro.position.set(s * ox, oy, oz + 0.012); aro.rotation.y = s * 0.25; mascara.add(aro); }
  const puente = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.02, ox * 2 - ra * 1.2), ra * 0.8, 0.03), rojo); puente.position.set(0, oy + ra * 0.15, oz + 0.02); mascara.add(puente);
  if (P.kind !== 'unicornio') {   // la cinta por detrás (la cabeza del unicornio no es redonda)
    const cinta = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, ra * 0.9, 28, 1, true, 0.9, Math.PI * 2 - 1.8), est(ROJO, { roughness: 0.6, side: THREE.DoubleSide }));
    cinta.position.y = oy; mascara.add(cinta);
  }
  P.head.add(mascara);
  // el collar con medalla
  const r = (M.cuelloR || M.ancho * 0.4) + 0.005, collarG = new THREE.Group();
  collarG.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 28), rojo));
  const medalla = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 18), oro); medalla.rotation.x = Math.PI / 2; medalla.position.set(0, -r - 0.025, 0.015); collarG.add(medalla);
  collarG.rotation.x = inclCuello(P); P.anclas.cuello.add(collarG);
  // el emblema en el pecho: un escudo dorado con un rayo rojo
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#FFC93C'; x.fillRect(0, 0, 64, 64); x.fillStyle = ROJO; x.beginPath();
  [[36, 6], [16, 36], [30, 36], [24, 58], [48, 26], [34, 26], [40, 6]].forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.fill();
  const escudo = new THREE.Shape(); escudo.moveTo(-1, 0.8); escudo.lineTo(1, 0.8); escudo.lineTo(1, -0.1); escudo.quadraticCurveTo(0.9, -0.7, 0, -1); escudo.quadraticCurveTo(-0.9, -0.7, -1, -0.1); escudo.closePath();
  const eg = new THREE.ExtrudeGeometry(escudo, { depth: 0.2, bevelEnabled: false });
  const uv = eg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (eg.attributes.position.getX(i) + 1) / 2, (eg.attributes.position.getY(i) + 1) / 2);
  const emblema = new THREE.Mesh(eg, [est('#FFFFFF', { map: new THREE.CanvasTexture(c), roughness: 0.35 }), oro]);
  const k = Math.min(M.ancho, M.alto) * 0.17; emblema.scale.set(k, k, 0.08);
  emblema.position.set(0, M.alto * 0.68, M.largo / 2 + 0.005); partes.add(emblema);
  // el cinturón: un aro aplastado alrededor de la panza (del ancho del cuerpo)
  const rx = M.ancho / 2 + 0.015, ry = M.ancho * 0.43 + 0.015;
  const cint = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 32), rojo); cint.scale.set(rx, ry, 0.4);
  cint.position.set(0, M.alto - ry + 0.01, -M.largo * 0.12); partes.add(cint);
  // las muñequeras: en las patas de adelante, en la parte de abajo
  const zm = P.legs.reduce((a, l) => a + l.position.z, 0) / P.legs.length, caja = new THREE.Box3(), cb = new THREE.Box3(), munecas = [];
  P.legs.filter(l => l.position.z > zm).forEach(leg => {
    caja.makeEmpty(); leg.children.forEach(m => { if (m.geometry && !m.userData.ropa) { m.updateMatrix(); m.geometry.computeBoundingBox(); caja.union(cb.copy(m.geometry.boundingBox).applyMatrix4(m.matrix)); } });
    const lw = Math.max(caja.max.x - caja.min.x, caja.max.z - caja.min.z), h = caja.max.y - caja.min.y;
    const mu = new THREE.Mesh(new THREE.CylinderGeometry(lw * 0.62, lw * 0.62, h * 0.3, 16), rojo);
    mu.userData.ropa = true; mu.position.set((caja.max.x + caja.min.x) / 2, caja.min.y + h * 0.3, (caja.max.z + caja.min.z) / 2); leg.add(mu); munecas.push(mu);
  });
  P.body.add(g);
  return { g, tela, base, w, L, cuerpo: M.ancho * 0.42, ondea: 0, mascara, collarG, munecas,
    quitar() { [capaG, mascara, collarG, ...munecas].forEach(o => { o.parent && o.parent.remove(o); o.traverse(m => { if (m.geometry) m.geometry.dispose(); }); }); } };
}
// la bufanda arcoíris larguísima: un rollo de lana a rayas de colores alrededor del cuello y una cola larga que cae y
// se arrastra por el suelo detrás de la mascota. La cola es una cuerda de TRAMOS segmentos (uno de cada color) que se
// simula en el mundo (verlet: gravedad, largo fijo y el suelo), así queda atrás al caminar y se ondula al girar.
const TRAMOS = 16;
function bufanda(P) {
  const M = P.medidas, r = (M.cuelloR || M.ancho * 0.4) + 0.02, g = new THREE.Group();
  const colores = ['#FF5E5E', '#FFB547', '#FFE45C', '#3DD6A8', '#4FB6F5', '#A77BF3'];
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 10, 28), est('#FFFFFF', { map: stripeTexture(colores[0], colores[3], 12), roughness: 0.9 })));
  g.rotation.x = inclCuello(P);
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
// los cristales de cada forma (una figura plana delante de cada ojo, de radio r)
function cristal(forma, r) {
  if (forma === 'pixel') {   // pixelados, "deal with it": cuadraditos negros en escalera
    const g = new THREE.Group(), m = est('#111111', { roughness: 0.4 }), p = r * 0.45;
    [[-1, 1], [0, 1], [1, 1], [-1, 0], [0, 0], [1, 0], [-1, -1], [0, -1]].forEach(([i, j]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(p, p, 0.012), m); b.position.set(i * p, j * p, 0); g.add(b); });
    return g;
  }
  const s = new THREE.Shape();
  if (forma === 'corazon') { s.moveTo(0, -r); s.bezierCurveTo(-r * 1.6, r * 0.1, -r * 0.6, r * 1.3, 0, r * 0.45); s.bezierCurveTo(r * 0.6, r * 1.3, r * 1.6, r * 0.1, 0, -r); }
  else if (forma === 'estrella') for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.5 : r * 1.15; i ? s.lineTo(Math.cos(a) * d, Math.sin(a) * d) : s.moveTo(Math.cos(a) * d, Math.sin(a) * d); }
  else s.absarc(0, 0, r, 0, Math.PI * 2);
  const color = { corazon: '#FF3B7F', estrella: '#FFC93C', redondo: '#1F1B2E' }[forma];
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }), est(color, { roughness: 0.2, metalness: forma === 'redondo' ? 0.5 : 0 })));
  if (forma === 'redondo') { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 20), est('#FF4F8B')); m.position.z = 0.012; g.add(m); }
  return g;
}
// lentes de sol que cambian de forma cada tanto: redondos, corazón, estrella y pixelados (con un saltito al cambiar)
const FORMAS_LENTES = ['redondo', 'corazon', 'estrella', 'pixel'];
function lentes(P) {
  const [ox, oy, oz] = P.medidas.ojos || [0.1, 0.05, 0.2], R = (P.medidas.cabezaR || 0.25) * 0.24, g = new THREE.Group();
  const marco = est('#FF4F8B');
  const formas = FORMAS_LENTES.map((f, i) => {
    const par = new THREE.Group(); par.visible = i === 0;
    for (const s of [-1, 1]) { const c = cristal(f, R); c.position.set(s * ox, oy, oz + 0.065); par.add(c); }
    g.add(par); return par;
  });
  for (const s of [-1, 1]) { const pata = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, oz * 0.8), marco); pata.position.set(s * (ox + R), oy, oz * 0.6); g.add(pata); }
  const puente = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.01, ox * 2 - R * 2), 0.014, 0.014), marco); puente.position.set(0, oy + R * 0.3, oz + 0.07); g.add(puente);
  P.head.add(g);   // (en el espacio de la cabeza: sigue sus giros; delante de los ojos, que sobresalen)
  return { g, formas, forma: 0, cambio: 5 };
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
// la mochila cohete: dos tanques plateados con punta roja y aletas en la espalda; por las toberas sale humito de
// colores (más al andar: animarRopa → efectos.js)
function cohete(P) {
  const M = P.medidas, k = M.largo * 0.85, g = new THREE.Group(), plata = est('#D9DEE8', { metalness: 0.4, roughness: 0.3 }), rojo = est('#FF4F5E');
  const toberas = [];
  for (const s of [-1, 1]) {
    const t = new THREE.Group(); t.position.set(s * k * 0.17, 0, 0); g.add(t);
    const tanque = new THREE.Mesh(new THREE.CylinderGeometry(k * 0.13, k * 0.13, k * 0.55, 16), plata); t.add(tanque);
    const punta = new THREE.Mesh(new THREE.ConeGeometry(k * 0.13, k * 0.22, 16), rojo); punta.position.y = k * 0.385; t.add(punta);
    const tob = new THREE.Mesh(new THREE.CylinderGeometry(k * 0.07, k * 0.1, k * 0.09, 12), est('#5B6275')); tob.position.y = -k * 0.32; t.add(tob);
    const aleta = new THREE.Mesh(new THREE.BoxGeometry(k * 0.13, k * 0.17, 0.008), rojo); aleta.position.set(s * k * 0.15, -k * 0.2, 0); t.add(aleta);
    const salida = new THREE.Object3D(); salida.position.y = -k * 0.4; t.add(salida); toberas.push(salida);
  }
  const correa = new THREE.Mesh(new THREE.BoxGeometry(k * 0.5, k * 0.09, k * 0.24), est('#4FB6F5')); g.add(correa);
  // sobre los hombros, parada y un poco inclinada hacia atrás
  g.position.set(0, k * 0.36, -k * 0.08); g.rotation.x = -0.3;
  P.anclas.espalda.add(g);
  return { g, toberas, humoT: 0 };
}
// el collar musical: un collar celeste con una notita musical dorada colgando; cada vez que la mascota salta suena una
// nota (saltoMascota, lo llaman pets/follow.js, game/burbujero.js y la pelota)
function collarMusical(P) {
  const M = P.medidas, r = M.cuelloR || M.ancho * 0.4, g = new THREE.Group(), oro = est('#FFC93C', { emissive: '#FFB000', emissiveIntensity: 0.25 });
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.026, 8, 28), est('#4FB6F5')));
  const nota = new THREE.Group(); nota.position.set(0, -r - 0.07, 0.02); g.add(nota);
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), oro); cabeza.scale.set(1.3, 1, 0.7); nota.add(cabeza);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6), oro); palo.position.set(0.033, 0.045, 0); nota.add(palo);
  const bandera = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.01), oro); bandera.position.set(0.05, 0.085, 0); bandera.rotation.z = -0.5; nota.add(bandera);
  g.rotation.x = inclCuello(P);
  P.anclas.cuello.add(g);
  return { g, nota, musical: true };
}
// el paraguas que flota sobre la mascota: 8 gajos de colores, un mango con curva y una bolita en la punta. Flota
// arriba de la cabeza (lugar `arriba`: no choca con los sombreros), se mece y al andar se inclina hacia atrás; el
// nombre de la mascota sube para que no lo tape (animarRopa)
function paraguas(P) {
  const M = P.medidas, R = M.largo * 0.75, g = new THREE.Group(), cupula = new THREE.Group(); g.add(cupula);
  const N = 8, colores = ['#FF5E5E', '#FFE45C', '#4FB6F5', '#FF8FC7'];
  for (let i = 0; i < N; i++) {
    const gajo = new THREE.Mesh(new THREE.SphereGeometry(R, 6, 6, i / N * Math.PI * 2, Math.PI * 2 / N, 0, Math.PI * 0.42), est(colores[i % colores.length], { side: THREE.DoubleSide, roughness: 0.55 }));
    gajo.scale.y = 0.55; cupula.add(gajo);
  }
  cupula.position.y = -R * 0.55 * Math.cos(Math.PI * 0.42) * 0.6;
  const madera = est('#8A5A2E', { roughness: 0.7 });
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, R * 1.0, 6), madera); palo.position.y = -R * 0.3; g.add(palo);
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(R * 0.08, 0.012, 6, 12, Math.PI), madera); gancho.position.set(R * 0.08, -R * 0.8, 0); gancho.rotation.z = Math.PI; g.add(gancho);
  const punta = new THREE.Mesh(new THREE.SphereGeometry(R * 0.05, 8, 6), est('#FFFFFF')); punta.position.y = R * 0.58; g.add(punta);
  const alto = (P.head ? P.head.position.y : M.alto) + (M.cabezaR || 0.25) + R * 0.75, z = P.head ? P.head.position.z * 0.7 : 0;
  g.position.set(0, alto, z);
  P.root.add(g);
  return { g, alto, z, R, flota: true };
}
// cuando la mascota salta: con el collar musical suena una nota y la notita se mueve
export function saltoMascota(P) {
  const C = P.ropa && P.ropa.cuello;
  if (C && C.musical) { emit('sonido', 'nota'); C.baila = 1; }
}
const HACER = { paraguas, cohete, collar_musical: collarMusical, collar, bufanda, corona, gorro_cumple: gorroCumple, sombrero_mago: sombreroMago, capa, lentes, mono, aureola, cuerno, antenas };

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
  // el set de superhéroe no tapa lo que se puso aparte: con lentes no va el antifaz; con collar o bufanda, su collar
  const S = P.ropa.lomo;
  if (S && S.mascara) { S.mascara.visible = !P.ropa.cara; S.collarG.visible = !P.ropa.cuello; }
}
export const ropaPuesta = P => Object.fromEntries(Object.entries(P.ropa || {}).filter(([, o]) => o).map(([l, o]) => [l, o.id]));

// la capa: cae por los costados y, al andar, el final se levanta y ondea (más rápido cuanto más rápido va)
// lo de la cabeza que se mueve: la corona gira despacio, el conejito sale del sombrero, la aureola flota, las antenas
// se balancean (más al andar) y los lentes cambian de forma
function animarCabeza(P, t, dt, speed) {
  const H = P.ropa && P.ropa.cabeza, L = P.ropa && P.ropa.cara;
  if (H && H.id === 'corona') H.g.rotation.y += dt * 0.7;
  if (H && H.conejo) {
    H.conejoT -= dt;
    // (cada 8-12 s: 0,4 s sale, 1,6 s mira moviendo las orejas, 0,4 s se mete)
    const u = -H.conejoT, sale = u < 0 ? 0 : u < 0.4 ? u / 0.4 : u < 2 ? 1 : u < 2.4 ? 1 - (u - 2) / 0.4 : 0;
    H.conejo.scale.setScalar(Math.max(0.001, sale * 1.8)); H.conejo.position.y = P.medidas.cabezaR * (1.3 + 0.45 * sale);
    H.orejas.forEach((o, i) => { o.rotation.x = Math.sin(t * 12 + i) * 0.25 * sale; });
    if (u > 2.4) H.conejoT = 8 + Math.random() * 4;
  }
  if (H && H.id === 'aureola') {
    H.g.position.y = H.flota + Math.sin(t * 2) * P.medidas.cabezaR * 0.06; H.g.rotation.y += dt * 0.8;
    const late = 0.75 + 0.25 * Math.sin(t * 3);
    H.glow.forEach(m => { m.material.opacity = m.userData.op * late; });
  }
  if (H && H.varas) H.varas.forEach(({ v, s }, i) => { v.rotation.z = -s * 0.5 + Math.sin(t * (speed > 0.05 ? 10 : 3) + i * 1.7) * (speed > 0.05 ? 0.25 : 0.08); });
  if (L && L.formas) {
    L.cambio -= dt;
    if (L.cambio <= 0) { L.formas[L.forma].visible = false; L.forma = (L.forma + 1) % L.formas.length; L.formas[L.forma].visible = true; L.cambio = 5; L.pop = 0; }
    L.pop = Math.min(1, (L.pop ?? 1) + dt * 5);
    const k = 1 + Math.sin(L.pop * Math.PI) * 0.35;   // un saltito al cambiar (cada cristal en su lugar)
    L.formas[L.forma].children.forEach(c => c.scale.setScalar(k));
  }
}
export function animarRopa(P, t, dt, speed) {
  const B = P.ropa && P.ropa.cuello;
  if (B && B.tiras) { if (P.root.parent === scene) moverBufanda(P, B, Math.min(dt, 0.033)); B.tiras.forEach(m => { m.visible = P.root.parent === scene && P.root.visible !== false; }); }
  animarCabeza(P, t, dt, speed);
  // la notita del collar musical se balancea al sonar
  if (B && B.musical) { B.baila = Math.max(0, (B.baila || 0) - dt * 2); B.nota.rotation.z = Math.sin(t * 18) * 0.5 * B.baila; }
  // el paraguas: flota meciéndose sobre la cabeza (sigue la altura del cuerpo: burbuja, alitas…), se inclina hacia
  // atrás al andar, y el nombre sube por encima
  const U = P.ropa && P.ropa.arriba;
  if (U) {
    U.inclina = (U.inclina || 0) + ((speed > 0.05 ? -0.35 : 0) - (U.inclina || 0)) * Math.min(1, dt * 3);
    U.g.position.y = U.alto + P.body.position.y + Math.sin(t * 1.8) * 0.04;
    U.g.position.x = P.body.position.x; U.g.position.z = U.z + P.body.position.z;   // (sobre la cabeza)
    U.g.rotation.set(U.inclina + Math.sin(t * 1.3) * 0.05, t * 0.3, Math.sin(t * 1.1) * 0.06);
    if (P.label) P.label.position.y = Math.max(P.label.position.y, U.g.position.y + U.R * 0.75);
  }
  // el humito de la mochila cohete
  const K = P.ropa && P.ropa.espalda;
  if (K && K.toberas && P.root.parent === scene) {
    K.humoT -= dt;
    if (K.humoT <= 0) { K.humoT = speed > 0.05 ? 0.06 : 0.22; K.toberas.forEach(o => { o.getWorldPosition(_humo); soltarHumo(_humo, P.root.scale.x); }); }
  }
  const C = P.ropa && P.ropa.lomo; if (!C) return;
  C.ondea += ((Math.min(speed, 2) / 2) - C.ondea) * Math.min(1, dt * 3);
  const pos = C.tela.geometry.attributes.position, b = C.base, m = C.ondea;
  for (let i = 0; i < pos.count; i++) {
    // u: 0 en el cuello, 1 al final; `lado`: cuánto sale del ancho del lomo (0 encima del cuerpo, 1 en el borde)
    const x = b[i * 3], z = b[i * 3 + 2], u = -z / C.L, mitad = C.w / 2 * (0.7 + 0.6 * u);
    const lado = Math.max(0, (Math.abs(x) - C.cuerpo) / Math.max(0.01, mitad - C.cuerpo));
    const cae = -lado * lado * 0.12 * (1 - m * 0.6);                                     // cae por los costados
    const vuela = m * u * u * (0.22 + Math.sin(t * (6 + m * 6) - u * 5 + x * 3) * 0.06); // se levanta y ondea
    const quieta = Math.sin(t * 1.5 - u * 3) * 0.008 * (1 - m);
    pos.setY(i, cae + vuela + quieta);
  }
  pos.needsUpdate = true; C.tela.geometry.computeVertexNormals();
}
