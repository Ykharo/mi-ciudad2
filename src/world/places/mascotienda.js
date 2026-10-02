// Mascotienda Arcoíris: la tienda de artículos para mascotas (se compra con Huesitos de Aura: game/mascotienda.js).
// Afuera, en la manzana frente al Refugio (cruzando la Calle Mora): la fachada con un hueso gigante en el techo y la
// puerta ("🛍️ Entrar a la Mascotienda"). Adentro es una sala aparte, lejos del mapa (MASCOTIENDA.interior): pasillos
// con estantes por sección (pociones, transporte, ropa, juguetes) y un cartel colgado sobre cada uno, el
// probador, y al fondo el mostrador con Robi, el vendedor: un perro robot sobre un disco volador (a la altura de Nina).
// Cada pasillo, el probador y el mostrador abren la ventana de la tienda; la puerta de adentro vuelve a la calle.
import { THREE } from '../../engine/three.js';
import { RAINBOW, mat, tint } from '../../engine/materials.js';
import { box, cone, cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { makeSign, stripeTexture } from '../../engine/textures.js';
import { manzana } from '../layout.js';
import { addInterior } from '../physics.js';
import { addArea } from '../zones.js';
import { definePlace } from '../place.js';
import { ARTICULOS } from '../../pets/catalog/articulos.js';
import { buildPet } from '../../pets/models.js';
import { animarRopa, ponerRopa } from '../../pets/ropa.js';

// afuera: el centro del edificio (mira hacia la Calle Mora, −z); adentro: el centro de la sala, lejos del mapa
const AFUERA = { x: 20, z: 56, w: 18, d: 12, h: 6.5 };
const SALA = { x: 0, z: 260, w: 24, d: 18, h: 5.5 };
const MASCOTIENDA = {
  afuera: { x: AFUERA.x, z: AFUERA.z - AFUERA.d / 2 - 5.4, mira: Math.PI },      // al salir: en la vereda, frente a la puerta
  adentro: { x: SALA.x, z: SALA.z + SALA.d / 2 - 3.2, mira: Math.PI },           // al entrar: mirando hacia el mostrador
  robi: null,                                                                    // el grupo de Robi (game/mascotienda.js lo hace hablar)
  sala: SALA,
};

function fachada({ world, addObs, addZone }) {
  const { x, z, w, d, h } = AFUERA, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI;   // el frente hacia −z
  const menta = mat('#BDF2E1'), rosa = mat('#FF8FC7'), blanco = mat('#FFFFFF');
  g.add(mesh(rlo(w + 0.5, 0.4, d + 0.5, 0.12), mat('#E4DACB'), 0, 0.2, 0));
  g.add(mesh(rlo(w, h, d, 0.4), menta, 0, h / 2 + 0.3, 0));
  g.add(mesh(rlo(w + 0.6, 0.7, d + 0.6, 0.25), rosa, 0, h + 0.55, 0));
  // un hueso gigante en el techo, y huellitas en la pared
  const hueso = new THREE.Group(); hueso.position.set(0, h + 1.6, 0);
  const palo = mesh(cyl(0.55, 0.55, 6, 18), blanco, 0, 0, 0); palo.rotation.z = Math.PI / 2; hueso.add(palo);
  for (const s of [-1, 1]) for (const t of [-1, 1]) hueso.add(mesh(sph(0.9, 16, 12), blanco, s * 3.1, t * 0.55, 0));
  g.add(hueso);
  const huella = mat('#FFFFFF');
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 6.2, 3.8, d / 2 + 0.03);
    const planta = mesh(cyl(0.45, 0.45, 0.06, 18), huella, 0, -0.1, 0); planta.rotation.x = Math.PI / 2; p.add(planta);
    [[-0.5, 0.35], [-0.17, 0.6], [0.17, 0.6], [0.5, 0.35]].forEach(([a, b]) => { const m = mesh(cyl(0.18, 0.18, 0.06, 12), huella, a, b, 0); m.rotation.x = Math.PI / 2; p.add(m); });
    g.add(p);
  }
  // vitrinas con globos y una burbuja
  for (const s of [-1, 1]) {
    g.add(mesh(rlo(4.4, 3.2, 0.24, 0.1), blanco, s * 5.2, 2.2, d / 2 + 0.02));
    g.add(mesh(rlo(4.0, 2.8, 0.26, 0.08), mat('#CFEFFF', { roughness: 0.2, emissive: '#9ED8FF', emissiveIntensity: 0.15 }), s * 5.2, 2.2, d / 2 + 0.04));
    [0, 1, 2].forEach(i => g.add(mesh(sph(0.32, 14, 10), mat(RAINBOW[(i * 2 + (s > 0 ? 1 : 0)) % 6]), s * 5.2 + (i - 1) * 1.1, 2.7 + (i % 2) * 0.4, d / 2 + 0.35)));
  }
  // la puerta, el toldo y el letrero
  g.add(mesh(rlo(3.2, 3.9, 0.24, 0.1), blanco, 0, 2.25, d / 2 + 0.04));
  g.add(mesh(rlo(2.7, 3.5, 0.3, 0.12), mat('#9B6BF0'), 0, 2.1, d / 2 + 0.06));
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2), new THREE.MeshStandardMaterial({ map: stripeTexture('#3DD6A8', '#FFFFFF', 10), roughness: 0.7 }));
  toldo.position.set(0, 4.55, d / 2 + 0.9); toldo.rotation.x = 0.35; toldo.castShadow = true; g.add(toldo);
  const letrero = makeSign('Mascotienda Arcoíris', '#FF6FAE', '#FFFFFF', 11); letrero.position.set(0, 5.7, d / 2 + 0.07); g.add(letrero);
  g.add(mesh(cyl(2.2, 2.2, 0.04, 28), mat('#FFE1EE'), 0, 0.03, d / 2 + 2.6, false, true));
  world.add(g);
  addObs(x, z, w / 2 + 0.3, d / 2 + 0.3, 11);
  addZone({ id: 'mascotienda_entrar', x, z: z - d / 2 - 2.4, r: 2.2, label: '🛍️ Entrar a la Mascotienda' });
}

/* ---------- adentro ---------- */
// Los productos: cajas de cartón de colores, como en una tienda de verdad. Cada artículo del catálogo (pets/catalog/
// articulos.js) tiene su caja: el tamaño depende del pasillo (pociones altas y angostas, casitas grandes, trucos como
// libros) y en el frente lleva su imagen (el ícono), su nombre y una franja arcoíris; en la repisa, la etiqueta con el
// precio en Huesitos. Todas las etiquetas van en una sola textura (el atlas) y todas las cajas de un mueble en una sola
// malla: así son pocas llamadas de dibujo aunque haya cientos de cajas.
const CAJA = { pociones: [0.24, 0.34, 0.2], transporte: [0.52, 0.46, 0.4], ropa: [0.4, 0.3, 0.28], juguetes: [0.32, 0.32, 0.3],
  companeros: [0.36, 0.4, 0.32], trucos: [0.3, 0.42, 0.07], hogar: [0.62, 0.5, 0.45] };
const COLORES_CAJA = ['#FF6FAE', '#4FB6F5', '#FFB547', '#9B6BF0', '#3DD6A8', '#FF5E7E', '#5BD66E', '#FF8C42', '#B98BFF', '#22B5C9'];
const CELDA = 170, ETIQ = 136, COLS = 12;
let ATLAS = null;
function atlas() {
  if (ATLAS) return ATLAS;
  const filas = Math.ceil(ARTICULOS.length / COLS), c = document.createElement('canvas');
  c.width = COLS * CELDA; c.height = Math.max(256, filas * CELDA); const x = c.getContext('2d');
  const emoji = s => `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  const redondo = (px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  const celdas = {};
  ARTICULOS.forEach((a, i) => {
    const cx = (i % COLS) * CELDA, cy = Math.floor(i / COLS) * CELDA, [bw, bh] = CAJA[a.seccion] || CAJA.juguetes;
    const color = COLORES_CAJA[(i * 3) % COLORES_CAJA.length];
    // el frente de la caja: un rectángulo con la forma de su frente, centrado en la parte de arriba de la celda
    const k = Math.min(CELDA / bw, ETIQ / bh), w = bw * k, h = bh * k, lx = cx + (CELDA - w) / 2, ly = cy + (ETIQ - h) / 2;
    x.fillStyle = color; x.fillRect(cx, cy, CELDA, CELDA);
    const m = Math.min(w, h) * 0.1;
    x.fillStyle = '#FFFFFF'; redondo(lx + m, ly + m, w - 2 * m, h * 0.78 - m, m); x.fill();
    const ic = Math.min(w - 2 * m, h * 0.5) * 0.8;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = emoji(ic); x.fillText(a.ic, lx + w / 2, ly + m + (h * 0.78 - m) * 0.42);
    x.fillStyle = '#2B2A44'; x.font = `800 ${Math.max(9, Math.min(w / 8, h / 9))}px "Baloo 2", sans-serif`;
    x.fillText(a.nombre, lx + w / 2, ly + h * 0.7, w - 2 * m - 4);
    RAINBOW.forEach((col, j) => { x.fillStyle = col; x.fillRect(lx, ly + h * 0.86 + j * h * 0.02, w, h * 0.02 + 0.5); });
    // la etiqueta del precio (abajo de la celda)
    x.fillStyle = '#FFE45C'; redondo(cx + 30, cy + ETIQ + 3, CELDA - 60, CELDA - ETIQ - 6, 8); x.fill();
    x.fillStyle = '#5A3A00'; x.font = '800 22px "Baloo 2", sans-serif'; x.fillText(`🦴 ${a.precio}`, cx + CELDA / 2, cy + ETIQ + (CELDA - ETIQ) / 2 + 1);
    const U = px => px / c.width, V = py => 1 - py / c.height;
    celdas[a.id] = { frente: [U(lx), V(ly + h), U(lx + w), V(ly)], liso: [U(cx + 2), V(cy + 2)], precio: [U(cx + 30), V(cy + CELDA - 3), U(cx + CELDA - 30), V(cy + ETIQ + 3)] };
  });
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
  const material = new THREE.MeshStandardMaterial({ map: tex, emissive: '#FFFFFF', emissiveMap: tex, emissiveIntensity: 0.3, roughness: 0.6 });
  return (ATLAS = { celdas, material });
}
// las 6 caras de una caja (u × v = n: las esquinas quedan en orden antihorario vistas desde afuera)
const CARAS_CAJA = [[[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
function cuadro(G, c, n, u, v, hu, hv, uv) {
  const esq = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const i of [0, 1, 2, 0, 2, 3]) {
    const [a, b] = esq[i];
    G.pos.push(c[0] + u[0] * a * hu + v[0] * b * hv, c[1] + u[1] * a * hu + v[1] * b * hv, c[2] + u[2] * a * hu + v[2] * b * hv);
    G.nor.push(...n); G.uv.push(...uv[i]);
  }
}
function caja(G, cel, x, y, z, w, h, d) {
  const med = [w / 2, h / 2, d / 2], c = [x, y + h / 2, z];
  for (const [n, u, v] of CARAS_CAJA) {
    const hn = med[n.findIndex(q => q)], hu = med[u.findIndex(q => q)], hv = med[v.findIndex(q => q)];
    const cc = [c[0] + n[0] * hn, c[1] + n[1] * hn, c[2] + n[2] * hn];
    const f = cel.frente, uv = n[2] === 1 ? [[f[0], f[1]], [f[2], f[1]], [f[2], f[3]], [f[0], f[3]]] : Array(4).fill(cel.liso);
    cuadro(G, cc, n, u, v, hu, hv, uv);
  }
}
// llenar las 3 repisas de un mueble con las cajas de esas secciones: 2 o 3 cajas iguales una al lado de la otra (y,
// si son bajitas, otra encima), la etiqueta del precio en el borde de la repisa, y el artículo siguiente
function productos(e, largo, D, secciones, repisas) {
  const lista = ARTICULOS.filter(a => secciones.includes(a.seccion)); if (!lista.length) return;
  const { celdas, material } = atlas(), G = { pos: [], nor: [], uv: [] };
  let n = 0;
  for (const y of repisas) {
    let x = -largo / 2 + 0.08;
    for (;;) {
      const a = lista[n % lista.length], i = ARTICULOS.indexOf(a), s = 0.92 + ((i * 37) % 7) / 40;
      const [w0, h0, d0] = CAJA[a.seccion] || CAJA.juguetes, w = w0 * s, h = h0 * s, d = d0 * s;
      const caras = a.seccion === 'hogar' ? 1 : a.seccion === 'pociones' || a.seccion === 'trucos' ? 3 : 2;
      if (x + w * caras + 0.04 * (caras - 1) > largo / 2 - 0.08) break;
      const zf = D / 2 - 0.1 - d / 2;   // (el frente de las cajas, cerca del borde de la repisa)
      for (let k = 0; k < caras; k++) {
        const cx = x + w / 2 + k * (w + 0.04);
        caja(G, celdas[a.id], cx, y, zf, w, h, d);
        if (h * 2 + 0.06 < 0.66 && (k + n) % 2 === 0) caja(G, celdas[a.id], cx, y + h + 0.005, zf, w, h, d);   // una encima
      }
      // la etiqueta del precio, en el borde de la repisa, bajo la primera caja
      const p = celdas[a.id].precio;
      cuadro(G, [x + 0.09, y - 0.03, D / 2 - 0.016], [0, 0, 1], [1, 0, 0], [0, 1, 0], 0.08, 0.035, [[p[0], p[1]], [p[2], p[1]], [p[2], p[3]], [p[0], p[3]]]);
      x += w * caras + 0.04 * (caras - 1) + 0.1; n++;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(G.uv, 2)); geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true; e.add(m);
}

// La vitrina de la ropa: un mueble con puertas de vidrio y dos pisos; adentro, maniquíes con forma de mascota, de un
// solo metal mate (gris, rojo, grafito, bronce, azul acero, lila), sobre un pedestal con un palo, que giran despacio,
// cada uno con un conjunto de ropa y accesorios (pets/ropa.js, calzado con los anclajes de su especie); adelante, una
// tarjetita por prenda con la imagen y el nombre, y las etiquetas con los precios.
const ALTO_MANIQUI = 0.72;
// (metal mate: poco metálico y algo de brillo propio; sin un entorno que reflejar, el metal de verdad se ve negro)
const METALES = ['#A3A8B0', '#A35A5A', '#7C8594', '#9C8670', '#6F8C9A', '#8D86A0'].map(c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.3, roughness: 0.42, emissive: c, emissiveIntensity: 0.18 }));
const CONJUNTOS = [
  ['perro', ['chaleco_mezclilla', 'pantalon_mezclilla', 'lentes']], ['gato', ['disfraz_dino']],
  ['perro', ['chaleco_acolchado', 'bufanda', 'botas_lluvia']], ['conejo', ['disfraz_abeja']],
  ['gato', ['sueter', 'pantalon_pijama', 'gorro_cumple']], ['perro', ['disfraz_tiburon']],
  ['unicornio', ['chaleco_reflectante', 'botas_lluvia', 'paraguas']],
  ['perro', ['disfraz_astronauta']], ['gato', ['chaleco_salvavidas', 'lentes']], ['unicornio', ['capa', 'corona']],
  ['conejo', ['pantalon_pijama', 'sombrero_mago', 'collar_musical']], ['perro', ['sueter', 'aureola']],
  ['gato', ['chaleco_mezclilla', 'cohete']], ['gato', ['collar', 'mono', 'antenas']],
];
function vitrina(g, x, z, largo, ry, color, onFrame) {
  const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry; g.add(e);
  const H = 2.7, D = 0.9, pisos = [0.14, 1.36];
  const marco = mat(color, { emissive: color, emissiveIntensity: 0.15 }), oro = mat('#FFC93C', { metalness: 0.5, roughness: 0.3 });
  const fondo = mat(tint(color, 0.55), { emissive: tint(color, 0.55), emissiveIntensity: 0.3 });
  e.add(mesh(rlo(largo, H, 0.08, 0.03), fondo, 0, H / 2, -D / 2 + 0.04));
  for (const s of [-1, 1]) e.add(mesh(rlo(0.12, H, D, 0.04), marco, s * (largo / 2 + 0.06), H / 2, 0));
  e.add(mesh(rlo(largo + 0.24, 0.12, D, 0.04), marco, 0, H, 0));
  const luz = mat('#FFF6D6', { emissive: '#FFF0B8', emissiveIntensity: 1 });
  for (const y of pisos) {
    e.add(mesh(rlo(largo, 0.08, D, 0.03), mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.2 }), 0, y - 0.04, 0));
    e.add(mesh(rlo(largo + 0.02, 0.1, 0.06, 0.03), marco, 0, y - 0.04, D / 2 - 0.05));
  }
  for (const y of [pisos[1] - 0.1, H - 0.1]) e.add(mesh(box(largo - 0.1, 0.03, 0.08), luz, 0, y, 0.25, false, false));   // tubos de luz
  // las puertas de vidrio: 4 por piso, con marco, manillas doradas y un reflejo en diagonal
  const vidrio = new THREE.MeshStandardMaterial({ color: 0xDFF6FF, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide });
  const brillo = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const pw = largo / 4;
  pisos.forEach((y0, p) => {
    const y1 = p ? H - 0.06 : pisos[1] - 0.08, h = y1 - y0, ym = (y0 + y1) / 2;
    for (let k = 0; k < 4; k++) {
      const cx = -largo / 2 + pw * (k + 0.5);
      e.add(mesh(new THREE.PlaneGeometry(pw - 0.04, h), vidrio, cx, ym, D / 2 - 0.01, false, false));
      for (const d of [-0.25, 0.1]) { const r = mesh(new THREE.PlaneGeometry(0.07, h * 0.8), brillo, cx + d * pw, ym, D / 2 - 0.005, false, false); r.rotation.z = 0.5; e.add(r); }
      e.add(mesh(rlo(0.05, h, 0.05, 0.02), marco, cx - pw / 2, ym, D / 2 - 0.01));
      const lado = k % 2 ? -1 : 1;   // las manillas, en el borde donde se juntan dos puertas
      e.add(mesh(cyl(0.015, 0.015, 0.22, 8), oro, cx + lado * (pw / 2 - 0.08), ym, D / 2 + 0.03));
    }
    e.add(mesh(rlo(0.05, h, 0.05, 0.02), marco, largo / 2, ym, D / 2 - 0.01));
  });
  const letrero = makeSign('✨ Moda para mascotas', color, '#FFFFFF', 2.8); letrero.position.set(0, H + 0.35, D / 2 - 0.1); e.add(letrero);
  // los maniquíes: cada uno con un conjunto (la mitad en cada piso), sobre su pedestal con un palo de metal
  const porPiso = Math.ceil(CONJUNTOS.length / 2), ancho = largo / porPiso;
  const { celdas, material } = atlas(), T = { pos: [], nor: [], uv: [] }, girar = [];
  const pedestal = mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.15 }), anillo = mat(color), palo = mat('#B8BCC6', { metalness: 0.7, roughness: 0.3 });
  CONJUNTOS.forEach(([especie, ids], i) => {
    const piso = Math.floor(i / porPiso), y = pisos[piso], px = -largo / 2 + ancho * (i % porPiso + 0.5);
    e.add(mesh(cyl(0.26, 0.28, 0.06, 24), pedestal, px, y + 0.03, -0.05)); e.add(mesh(cyl(0.285, 0.285, 0.02, 24), anillo, px, y + 0.05, -0.05));
    const P = buildPet(especie, '#FFFFFF'); P.nombre = 'Arcoíris';
    // todo de un solo metal mate (también los ojos y la crin): un maniquí, no una mascota
    const metal = METALES[i % METALES.length];
    P.root.traverse(o => { if (o.isMesh) o.material = metal; });
    const k = ALTO_MANIQUI / (P.head.position.y + P.medidas.cabezaR);
    P.root.scale.setScalar(k);
    P.root.position.set(px, y + 0.06, -0.05); P.root.userData.dynamic = true; e.add(P.root);
    const alto = (P.torso[0] - P.torso[2] / 2) * k;
    e.add(mesh(cyl(0.012, 0.012, alto, 8), palo, px, y + 0.06 + alto / 2, -0.05));
    ponerRopa(P, Object.fromEntries(ids.map(id => { const a = ARTICULOS.find(x => x.id === id); return [a.lugar, id]; })));
    P.root.traverse(o => { o.castShadow = false; });
    girar.push({ P, fase: i * 0.9 });
    // delante del pedestal, una tarjetita por prenda (imagen y nombre) y su precio en el borde del piso
    ids.forEach((id, j) => {
      const c = celdas[id], f = c.frente, pr = c.precio, tx = px + (j - (ids.length - 1) / 2) * 0.17;
      cuadro(T, [tx, y + 0.1, 0.3], [0, 0, 1], [1, 0, 0], [0, 1, 0], 0.075, 0.056, [[f[0], f[1]], [f[2], f[1]], [f[2], f[3]], [f[0], f[3]]]);
      cuadro(T, [tx, y - 0.04, D / 2 - 0.016], [0, 0, 1], [1, 0, 0], [0, 1, 0], 0.07, 0.032, [[pr[0], pr[1]], [pr[2], pr[1]], [pr[2], pr[3]], [pr[0], pr[3]]]);
    });
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(T.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(T.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(T.uv, 2)); geo.computeBoundingSphere();
  e.add(new THREE.Mesh(geo, material));
  // giran despacio en su pedestal (y lo que se mueve de la ropa se mueve: la corona, los lentes, la capa…)
  let antes = 0;
  onFrame(t => {
    const dt = Math.min(0.05, Math.max(0, t - antes)); antes = t;
    for (const { P, fase } of girar) { P.root.rotation.y = Math.sin(t * 0.35 + fase) * 1.1; animarRopa(P, t + fase, dt, 0); }
  });
}

function estante(g, x, z, largo, ry, colores, secciones) {
  // un mueble abierto hacia adelante (+z): fondo de color, costados y techo del color del pasillo, y 3 repisas blancas
  // con el borde de color; encima, las cajas de los productos de sus secciones
  const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry; g.add(e);
  const H = 2.7, D = 0.9, fondo = mat(tint(colores, 0.35), { emissive: tint(colores, 0.35), emissiveIntensity: 0.25 });
  const marco = mat(colores, { emissive: colores, emissiveIntensity: 0.15 }), tabla = mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.15 });
  e.add(mesh(rlo(largo, H, 0.08, 0.03), fondo, 0, H / 2, -D / 2 + 0.04));
  for (const s of [-1, 1]) e.add(mesh(rlo(0.1, H, D, 0.04), marco, s * (largo / 2 + 0.05), H / 2, 0));
  e.add(mesh(rlo(largo + 0.2, 0.1, D, 0.04), marco, 0, H, 0));
  e.add(mesh(rlo(largo, 0.12, D, 0.04), marco, 0, 0.06, 0));   // el zócalo
  const repisas = [0.45, 1.2, 1.95];
  for (const y of repisas) {
    e.add(mesh(rlo(largo, 0.06, D - 0.1, 0.02), tabla, 0, y - 0.03, 0));
    e.add(mesh(rlo(largo + 0.02, 0.1, 0.06, 0.03), marco, 0, y - 0.03, D / 2 - 0.05));   // el borde de color al frente
  }
  productos(e, largo, D, secciones, repisas);
}

function robi() {
  // el perro robot sobre su disco volador
  const g = new THREE.Group();
  const disco = new THREE.Group(); g.add(disco);
  disco.add(mesh(cyl(0.75, 0.6, 0.14, 32), mat('#E8E6F2', { metalness: 0.5, roughness: 0.25 }), 0, 0, 0));
  disco.add(mesh(cyl(0.77, 0.77, 0.05, 32), mat('#7CF0FF', { emissive: '#3FD8FF', emissiveIntensity: 1 }), 0, 0.02, 0));
  const luz = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x7CF0FF, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  luz.position.y = -0.55; luz.rotation.x = Math.PI; disco.add(luz);
  const blanco = mat('#F7F7FB', { metalness: 0.3, roughness: 0.3 }), rosa = mat('#FF8FC7'), gris = mat('#8C8FA8', { metalness: 0.5, roughness: 0.3 });
  const perro = new THREE.Group(); perro.position.y = 0.08; g.add(perro);
  perro.add(mesh(rlo(0.5, 0.42, 0.72, 0.16), blanco, 0, 0.42, 0));
  perro.add(mesh(rlo(0.3, 0.2, 0.05, 0.05), rosa, 0, 0.46, 0.36));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => perro.add(mesh(cyl(0.06, 0.07, 0.24, 10), gris, a * 0.16, 0.12, b * 0.24)));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.82, 0.3); perro.add(cabeza);
  cabeza.add(mesh(rlo(0.52, 0.44, 0.44, 0.14), blanco, 0, 0, 0));
  // la cara: una pantallita con ojos ^ ^ y una sonrisa
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#1B1A33'; x.fillRect(0, 0, 256, 160);
  x.strokeStyle = '#7CF0FF'; x.lineWidth = 14; x.lineCap = 'round';
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(128 + s * 52 - 22, 72); x.lineTo(128 + s * 52, 50); x.lineTo(128 + s * 52 + 22, 72); x.stroke(); }
  x.beginPath(); x.arc(128, 98, 26, 0.2, Math.PI - 0.2); x.stroke();
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
  cara.position.set(0, 0, 0.225); cabeza.add(cara);
  for (const s of [-1, 1]) { const o = mesh(cone(0.1, 0.22, 4), rosa, s * 0.19, 0.27, 0); o.rotation.z = -s * 0.3; cabeza.add(o); }
  cabeza.add(mesh(cyl(0.015, 0.015, 0.22, 6), gris, 0.1, 0.32, -0.05));
  const antena = mesh(sph(0.05, 10, 8), mat('#FF6FAE', { emissive: '#FF3FA4', emissiveIntensity: 1 }), 0.1, 0.45, -0.05); cabeza.add(antena);
  const cola = mesh(cyl(0.025, 0.035, 0.3, 8), gris, 0, 0.55, -0.42); cola.rotation.x = -0.6; perro.add(cola);
  g.userData = { disco, perro, cabeza, antena, cola, luz };
  g.traverse(o => { o.castShadow = false; });
  return g;
}

function sala({ world, addObs, addZone, onFrame }) {
  const { x: X, z: Z, w: W, d: D, h: H } = SALA, g = new THREE.Group(); g.position.set(X, 0, Z); world.add(g);
  // piso de cuadros, paredes de dos colores, techo con lámparas (sin sombras: si no, la sala queda a oscuras)
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#FFC9E3'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#C9B8FF'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64);
  const tp = new THREE.CanvasTexture(c); tp.wrapS = tp.wrapT = THREE.RepeatWrapping; tp.repeat.set(W / 2, D / 2);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tp, roughness: 0.6 }));
  piso.rotation.x = -Math.PI / 2; piso.position.y = 0.01; piso.receiveShadow = true; g.add(piso);
  // (con un poco de brillo propio: adentro el sol no llega a todas las caras, y sin esto se ven grises)
  const paredM = mat('#7FDCC4', { emissive: '#7FDCC4', emissiveIntensity: 0.3 }), zocalo = mat('#FF7FBF', { emissive: '#FF7FBF', emissiveIntensity: 0.2 });
  const pared = (px, pz, w, ry) => { const m = mesh(box(w, H, 0.3), paredM, px, H / 2, pz, false, true); m.rotation.y = ry; g.add(m); const s = mesh(box(w, 0.6, 0.34), zocalo, px, 0.3, pz, false, true); s.rotation.y = ry; g.add(s); };
  pared(0, -D / 2, W, 0); pared(-W / 2, 0, D, Math.PI / 2); pared(W / 2, 0, D, Math.PI / 2);
  pared(-W / 4 - 1, D / 2, W / 2 - 2, 0); pared(W / 4 + 1, D / 2, W / 2 - 2, 0);   // el frente, con la puerta al medio
  g.add(mesh(box(4, H - 3.6, 0.3), paredM, 0, 3.6 + (H - 3.6) / 2, D / 2, false, true));
  g.add(mesh(rlo(2.7, 3.5, 0.2, 0.1), mat('#9B6BF0'), 0, 1.75, D / 2 - 0.05, false, true));
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ color: 0xD9CCFF })); techo.rotation.x = Math.PI / 2; techo.position.y = H; g.add(techo);
  // franjas arcoíris a lo largo de las paredes, bajo el techo
  RAINBOW.forEach((c, i) => {
    const m = mat(c, { emissive: c, emissiveIntensity: 0.35 }), y = H - 0.25 - i * 0.14;
    g.add(mesh(box(W - 0.4, 0.12, 0.05), m, 0, y, -D / 2 + 0.18, false, false));
    for (const s of [-1, 1]) g.add(mesh(box(0.05, 0.12, D - 0.4), m, s * (W / 2 - 0.18), y, 0, false, false));
  });
  const lampara = mat('#FFF6D6', { emissive: '#FFE9A8', emissiveIntensity: 1 });
  // lámparas planas, pegadas al techo (la cámara pasa cerca del techo: colgando, tapaban la vista)
  for (const lx of [-7, 0, 7]) for (const lz of [-4, 3]) { const l = mesh(sph(0.4, 14, 10), lampara, lx, H - 0.04, lz, false, false); l.scale.y = 0.2; g.add(l); }
  addObs(X, Z - D / 2, W / 2, 0.3, 8); addObs(X, Z + D / 2, W / 2, 0.3, 8); addObs(X - W / 2, Z, 0.3, D / 2, 8); addObs(X + W / 2, Z, 0.3, D / 2, 8);
  addInterior({ area: [X - W / 2, X + W / 2, Z - D / 2, Z + D / 2], techo: H });
  addArea('Mascotienda Arcoíris', X - W / 2, X + W / 2, Z - D / 2, Z + D / 2);
  // la puerta de adentro: vuelve a la calle. Bien señalizada: letrero verde grande de SALIDA, un marco que brilla y
  // flechas en el piso que llevan hacia ella (laten, una tras otra)
  addZone({ id: 'mascotienda_salir', x: X, z: Z + D / 2 - 1.2, r: 1.5, label: '🚪 Salir a la calle' });
  const salida = makeSign('🚪 SALIDA', '#22B573', '#FFFFFF', 4.6); salida.position.set(0, 4.55, D / 2 - 0.2); salida.rotation.y = Math.PI; g.add(salida);
  const marcoM = new THREE.MeshBasicMaterial({ color: 0x3DF59B });
  for (const s of [-1, 1]) g.add(mesh(box(0.18, 3.7, 0.12), marcoM, s * 1.45, 1.85, D / 2 - 0.18, false, false));
  g.add(mesh(box(3.08, 0.18, 0.12), marcoM, 0, 3.65, D / 2 - 0.18, false, false));
  const felpudo = mesh(rlo(2.6, 0.03, 1.4, 0.1), mat('#22B573', { emissive: '#22B573', emissiveIntensity: 0.3 }), 0, 0.025, D / 2 - 1, false, true); g.add(felpudo);
  const flecha = new THREE.Shape(); flecha.moveTo(0, 0.45); flecha.lineTo(0.45, 0); flecha.lineTo(0.2, 0); flecha.lineTo(0.2, -0.4); flecha.lineTo(-0.2, -0.4); flecha.lineTo(-0.2, 0); flecha.lineTo(-0.45, 0); flecha.closePath();
  const flechas = [0, 1, 2].map(i => {
    const f = new THREE.Mesh(new THREE.ShapeGeometry(flecha), new THREE.MeshBasicMaterial({ color: 0x3DF59B, transparent: true }));
    f.rotation.set(-Math.PI / 2, 0, Math.PI); f.position.set(0, 0.03, D / 2 - 2.6 - i * 1.3); g.add(f);   // (la punta hacia la puerta: +z)
    return f;
  });
  onFrame(t => {
    flechas.forEach((f, i) => { f.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(t * 4 + i * 0.9)); });
    marcoM.color.setHSL(0.42, 0.9, 0.55 + 0.12 * Math.sin(t * 3));
  });

  // los pasillos: un mueble por sección (los de las paredes, de un lado; los del medio, de los dos: por detrás del de
  // transporte están los trucos y por detrás del de ropa, el hogar), cada uno con su cartel colgado y su zona
  const P = [
    { sec: 'pociones', x: -W / 2 + 0.7, ry: Math.PI / 2, color: '#B98BFF', zx: -W / 2 + 2.6, cartel: '🧪 Pociones' },
    { sec: 'transporte', x: -4.5, ry: Math.PI / 2, color: '#4FB6F5', zx: -2.4, cartel: '🛼 Transporte', atras: { sec: 'trucos', color: '#FFB547', cartel: '🎉 Trucos' } },
    { sec: 'ropa', x: 4.5, ry: -Math.PI / 2, color: '#FF8FC7', zx: 2.4, cartel: '👕 Ropa', vitrina: true, atras: { sec: 'hogar', color: '#3DD6A8', cartel: '🏡 Hogar' } },
    { sec: 'juguetes', x: W / 2 - 0.7, ry: -Math.PI / 2, color: '#FFD23F', zx: W / 2 - 2.6, cartel: '🧸 Juguetes', mas: ['companeros'] },
  ];
  const cartelYZona = (texto, color, cx, cz, zx, zz, sec) => {
    const cartel = makeSign(texto, color, '#FFFFFF', 3.4); cartel.position.set(cx, 4.0, cz); g.add(cartel);
    for (const s of [-1, 1]) g.add(mesh(cyl(0.02, 0.02, H - 4.3, 4), mat('#8C8FA8'), cx + s * 1.3, 4.0 + (H - 4.0) / 2 + 0.2, cz, false, false));
    addZone({ id: 'mascotienda', x: X + zx, z: Z + zz, r: 1.7, label: `${texto.split(' ')[0]} Mirar ${texto.split(' ')[1].toLowerCase()}`, seccion: sec });
  };
  for (const a of P) {
    const f = Math.sin(a.ry) * 0.45;
    if (a.atras) {   // dos muebles espalda con espalda, cada uno mirando a su pasillo
      if (a.vitrina) vitrina(g, a.x + f, 0, 7, a.ry, a.color, onFrame);
      else estante(g, a.x + f, 0, 7, a.ry, a.color, [a.sec]);
      estante(g, a.x - f, 0, 7, a.ry + Math.PI, a.atras.color, [a.atras.sec]);
      cartelYZona(a.atras.cartel, a.atras.color, a.x - Math.sign(f) * 1.6, -1.5, a.x - Math.sign(f) * 2.2, -2.5, a.atras.sec);
    } else estante(g, a.x, 0, 7, a.ry, a.color, [a.sec, ...(a.mas || [])]);
    addObs(X + a.x, Z, a.atras ? 0.95 : 0.5, 3.6);
    cartelYZona(a.cartel, a.color, a.x + (a.atras ? 0 : a.ry > 0 ? 1.4 : -1.4), 2.5, a.zx, 0.5, a.sec);
  }
  // el probador: una tarima redonda con un espejo y una cortina
  const PX = W / 2 - 2.6, PZ = D / 2 - 2.6;
  g.add(mesh(cyl(1.3, 1.4, 0.2, 32), mat('#FFE1EE'), PX, 0.1, PZ));
  const marco = mesh(rlo(1.6, 2.4, 0.12, 0.08), mat('#FFD23F'), PX + 1.5, 1.5, PZ - 0.3); marco.rotation.y = -Math.PI / 2 + 0.4; g.add(marco);
  const espejo = mesh(box(1.3, 2.1, 0.02), mat('#DDF3FF', { metalness: 0.9, roughness: 0.05 }), PX + 1.42, 1.5, PZ - 0.25, false, false); espejo.rotation.y = -Math.PI / 2 + 0.4; g.add(espejo);
  const cortina = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 3, 24, 1, true, Math.PI * 0.15, Math.PI * 0.7), new THREE.MeshStandardMaterial({ map: stripeTexture('#FF8FC7', '#FFFFFF', 12), side: THREE.DoubleSide }));
  cortina.position.set(PX, 1.7, PZ); g.add(cortina);
  const cartelP = makeSign('🪞 Probador', '#FF6FAE', '#FFFFFF', 2.6); cartelP.position.set(PX, 3.6, PZ - 1.5); g.add(cartelP);
  // (vista: el giro de la cámara de la ventana; desde el pasillo de enfrente, entre los muebles: si no, los tapan)
  addZone({ id: 'mascotienda', x: X + PX - 1.6, z: Z + PZ - 1.2, r: 1.5, label: '🪞 Probador', vista: Math.PI });
  // el mostrador y Robi
  g.add(mesh(rlo(6, 1.1, 1.2, 0.12), mat('#FFFFFF'), 0, 0.55, -D / 2 + 2.6));
  g.add(mesh(rlo(6.1, 0.12, 1.3, 0.05), mat('#FF6FAE'), 0, 1.12, -D / 2 + 2.6));
  g.add(mesh(rlo(0.5, 0.35, 0.4, 0.06), mat('#FFD23F'), -2.2, 1.35, -D / 2 + 2.6));   // la caja registradora
  const cartelR = makeSign('Robi, el vendedor', '#4FB6F5', '#FFFFFF', 3.2); cartelR.position.set(0, 4.3, -D / 2 + 0.2); g.add(cartelR);
  addObs(X, Z - D / 2 + 2.6, 3.1, 0.7);
  const R = robi(); R.position.set(0, 0.9, -D / 2 + 1.3); R.scale.setScalar(1.4); g.add(R); MASCOTIENDA.robi = R; R.userData.dynamic = true;
  addZone({ id: 'mascotienda', x: X, z: Z - D / 2 + 4.3, r: 1.8, label: '🤖 Hablar con Robi' });
  onFrame(t => {
    const u = R.userData;
    R.position.y = 0.9 + Math.sin(t * 1.6) * 0.08;   // (la cabeza de Robi, a la altura de la de Nina)
    u.disco.rotation.y = t * 0.8;
    u.perro.rotation.y = Math.sin(t * 0.7) * 0.15;
    u.cabeza.rotation.z = Math.sin(t * 1.3) * 0.08;
    u.antena.material.emissiveIntensity = Math.sin(t * 6) > 0 ? 1.2 : 0.2;
    u.cola.rotation.z = Math.sin(t * 9) * 0.6;
    u.luz.material.opacity = 0.14 + Math.sin(t * 4) * 0.05;
  });
}

function mascotienda(ctx) { fachada(ctx); sala(ctx); }

definePlace({ id: 'mascotienda', nombre: 'Mascotienda Arcoíris', articulo: 'la', orden: 100, area: manzana(AFUERA.x, AFUERA.z), build: mascotienda });

export { MASCOTIENDA };
