// El pelaje de la mascota con las pociones de la Mascotienda (pets/extras.js lo llama):
//   arcoiris   el color cambia de a poco, en ciclo
//   diseno     pastillas de diseño: vaca, cebra, estrellas, corazones, lunares o galaxia (un dibujo sobre el pelaje)
//   invisible  el pelaje casi no se ve: quedan sus ojitos, la nariz y lo que tenga puesto (el collar, etc.)
// Se hacen copias propias de los materiales del pelaje (P.mats: c, dk, lt): los originales son compartidos y no se
// tocan. Al cambiar algo se vuelve a los originales y se arma de nuevo.
// Los modelos de las mascotas no tienen coordenadas de textura (se fusionan sin ellas): para el dibujo se las calcula
// una vez proyectando desde la forma (en cada cara, sobre el plano que más mira: así el dibujo no se estira).
import { THREE } from '../engine/three.js';

export const DISENOS = ['vaca', 'cebra', 'estrellas', 'corazones', 'lunares', 'galaxia'];
const texturas = {};
function lienzo(fondo) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = fondo; x.fillRect(0, 0, 256, 256); return [c, x]; }
function figura(x, tipo, cx, cy, r) {
  x.beginPath();
  if (tipo === 'estrella') for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
  else if (tipo === 'corazon') { x.moveTo(cx, cy + r * 0.9); x.bezierCurveTo(cx - r * 1.6, cy - r * 0.2, cx - r * 0.6, cy - r * 1.3, cx, cy - r * 0.35); x.bezierCurveTo(cx + r * 0.6, cy - r * 1.3, cx + r * 1.6, cy - r * 0.2, cx, cy + r * 0.9); }
  else x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
}
// cada dibujo se repite sin costuras (lo que sale por un borde entra por el otro)
function repetido(x, fn) { for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { x.save(); x.translate(dx, dy); fn(); x.restore(); } }
function textura(d) {
  if (texturas[d]) return texturas[d];
  let c, x;
  if (d === 'vaca') {
    [c, x] = lienzo('#FFFFFF'); x.fillStyle = '#26232E';
    const manchas = [[50, 60, 38], [170, 40, 30], [120, 150, 46], [220, 190, 34], [40, 200, 28]];
    repetido(x, () => manchas.forEach(([cx, cy, r]) => { x.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = r * (0.75 + ((i * 37 + cx) % 10) / 25); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); }));
  } else if (d === 'cebra') {
    [c, x] = lienzo('#FFFFFF'); x.fillStyle = '#1F1B2E';
    for (let i = 0; i < 6; i++) { const y = i * 256 / 6; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(85, y + 26, 170, y - 18, 256, y); x.lineTo(256, y + 18); x.bezierCurveTo(170, y + 2, 85, y + 40, 0, y + 20); x.fill(); }
  } else if (d === 'estrellas') {
    [c, x] = lienzo('#FFFFFF'); x.fillStyle = '#FFC93C';
    repetido(x, () => [[50, 50], [180, 70], [110, 160], [230, 210], [30, 210]].forEach(([cx, cy], i) => figura(x, 'estrella', cx, cy, 22 + (i % 2) * 6)));
  } else if (d === 'corazones') {
    [c, x] = lienzo('#FFFFFF'); x.fillStyle = '#FF5E95';
    repetido(x, () => [[60, 60], [190, 90], [120, 190], [230, 230], [20, 150]].forEach(([cx, cy], i) => figura(x, 'corazon', cx, cy, 20 + (i % 2) * 5)));
  } else if (d === 'lunares') {
    [c, x] = lienzo('#FFFFFF');
    const col = ['#FF5E5E', '#4FB6F5', '#3DD6A8', '#FFC93C', '#A77BF3'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = col[(i + j * 2) % col.length]; figura(x, 'punto', 32 + i * 64 + (j % 2) * 32, 32 + j * 64, 15); }
  } else {   // galaxia: azul profundo con nubes violetas y estrellitas
    [c, x] = lienzo('#1B1550');
    repetido(x, () => [[70, 80, 90, 'rgba(167,123,243,.55)'], [190, 180, 100, 'rgba(79,182,245,.45)'], [200, 50, 60, 'rgba(255,111,174,.4)']].forEach(([cx, cy, r, color]) => {
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }));
    x.fillStyle = '#FFFFFF';
    for (let i = 0; i < 70; i++) { const px = (i * 97) % 256, py = (i * 61 + (i % 7) * 13) % 256; x.globalAlpha = 0.5 + (i % 3) * 0.25; x.fillRect(px, py, 1 + (i % 4 === 0), 1 + (i % 4 === 0)); }
    x.globalAlpha = 1; figura(x, 'estrella', 140, 120, 9); figura(x, 'estrella', 40, 30, 6);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (texturas[d] = t);
}
// coordenadas de textura proyectadas (una vez por geometría): cada triángulo sobre el plano que más mira su normal
const REPITE = 3.2;   // veces que se repite el dibujo por metro
function conUV(geo) {
  if (geo.attributes.uv) return;
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i += 3) {
    let nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < 3 && i + k < p.count; k++) { nx += Math.abs(n.getX(i + k)); ny += Math.abs(n.getY(i + k)); nz += Math.abs(n.getZ(i + k)); }
    for (let k = 0; k < 3 && i + k < p.count; k++) {
      const x = p.getX(i + k), y = p.getY(i + k), z = p.getZ(i + k);
      const [u, v] = nx >= ny && nx >= nz ? [z, y] : ny >= nz ? [x, z] : [x, y];
      uv[(i + k) * 2] = u * REPITE; uv[(i + k) * 2 + 1] = v * REPITE;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// Píxeles: el cuerpo se arma con cubitos, como en un videojuego antiguo. Cada malla del cuerpo (P.mallas) se esconde y
// en su lugar va una de cubitos con el mismo material: se marcan las celdas de una grilla que tocan su superficie (una
// cáscara: por fuera se ve igual que maciza) y se dibujan sólo las caras que no tocan otro cubito. Los ojos y lo que
// no es pelaje, con cubitos más finos. (Los puntos de cada triángulo salen de una secuencia fija: siempre igual.)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _ab = new THREE.Vector3(), _ac = new THREE.Vector3();
const CARAS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function cubitos(geo, lado) {
  const p = geo.attributes.position, celdas = new Map(), marcar = (x, y, z) => { const k = [Math.floor(x / lado), Math.floor(y / lado), Math.floor(z / lado)]; celdas.set(k.join(','), k); };
  for (let i = 0; i + 2 < p.count; i += 3) {
    _a.fromBufferAttribute(p, i); _b.fromBufferAttribute(p, i + 1); _c.fromBufferAttribute(p, i + 2);
    _ab.subVectors(_b, _a); _ac.subVectors(_c, _a);
    const area = _ab.clone().cross(_ac).length() / 2, n = Math.min(80, Math.ceil(area / (lado * lado) * 8));
    [_a, _b, _c].forEach(v => marcar(v.x, v.y, v.z));
    for (let k = 1; k <= n; k++) {
      let u = (k * 0.618034) % 1, v = (k * 0.754878) % 1;
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      marcar(_a.x + _ab.x * u + _ac.x * v, _a.y + _ab.y * u + _ac.y * v, _a.z + _ab.z * u + _ac.z * v);
    }
  }
  const pos = [], nor = [];
  for (const [x, y, z] of celdas.values()) for (const [nx, ny, nz] of CARAS) {
    if (celdas.has(`${x + nx},${y + ny},${z + nz}`)) continue;   // (tapada por el vecino)
    // las 4 esquinas de la cara, en el sentido que mira hacia afuera
    const c = [(x + 0.5 + nx * 0.5) * lado, (y + 0.5 + ny * 0.5) * lado, (z + 0.5 + nz * 0.5) * lado];
    const t1 = nx ? [0, 1, 0] : [1, 0, 0], t2 = [ny * t1[2] - nz * t1[1], nz * t1[0] - nx * t1[2], nx * t1[1] - ny * t1[0]];
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([s, r]) => [0, 1, 2].map(j => c[j] + (t1[j] * s + t2[j] * r) * lado / 2));
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(...q[i]); nor.push(nx, ny, nz); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
}
function ponerPixeles(P) {
  const pelo = new Set(Object.values(P.mats)), lado = P.medidas.largo * 0.07;
  P.pixeles = P.mallas.map(m => {
    const v = new THREE.Mesh(cubitos(m.geometry, pelo.has(m.material) ? lado : lado / 2), m.material);
    v.position.copy(m.position); v.quaternion.copy(m.quaternion); v.scale.copy(m.scale);
    v.castShadow = m.castShadow; v.receiveShadow = true; m.parent.add(v); m.visible = false;
    return { m, v };
  });
}
function quitarPixeles(P) {
  (P.pixeles || []).forEach(({ m, v }) => { v.parent.remove(v); v.geometry.dispose(); m.visible = true; });
  P.pixeles = null;
}

// poner el pelaje que corresponde (`cfg`: { arcoiris, diseno, invisible, pixeles })
export function ponerPelaje(P, cfg = {}) {
  const diseno = DISENOS.includes(cfg.diseno) ? cfg.diseno : null, clave = `${!!cfg.arcoiris}|${diseno}|${!!cfg.invisible}|${!!cfg.pixeles}`;
  if (P.pelaje && P.pelaje.clave === clave) return;
  if (P.pelaje) {   // volver a los originales
    const vuelta = new Map([...P.pelaje.swap].map(([a, b]) => [b, a]));
    P.root.traverse(o => { if (o.isMesh && vuelta.has(o.material)) { o.material = vuelta.get(o.material); if (o.userData.sombra !== undefined) { o.castShadow = o.userData.sombra; delete o.userData.sombra; } } });
    Object.values(P.pelaje.nuevo).forEach(m => m.dispose());
    quitarPixeles(P);
    P.pelaje = null;
  }
  if (clave === 'false|null|false|false') return;
  if (cfg.pixeles) ponerPixeles(P);
  const nuevo = {}, swap = new Map();
  for (const [k, m] of Object.entries(P.mats)) {
    const c = nuevo[k] = m.clone(); swap.set(m, c);
    if (diseno) { c.map = textura(diseno); if (diseno === 'galaxia') c.color.set('#FFFFFF'); c.needsUpdate = true; }
    if (cfg.invisible) { c.transparent = true; c.opacity = 0.1; c.depthWrite = false; c.needsUpdate = true; }
  }
  P.root.traverse(o => { if (o.isMesh && swap.has(o.material)) { if (diseno) conUV(o.geometry); o.material = swap.get(o.material); if (cfg.invisible) { o.userData.sombra = o.castShadow; o.castShadow = false; } } });
  P.pelaje = { clave, nuevo, swap, arcoiris: !!cfg.arcoiris, galaxia: diseno === 'galaxia' };
}
// el arcoíris: el color va dando la vuelta (en la galaxia, sólo se tiñe un poco)
export function animarPelaje(P, t) {
  const L = P.pelaje; if (!L || !L.arcoiris) return;
  const h = (t * 0.12) % 1;
  if (L.galaxia) { L.nuevo.c.color.setHSL(h, 0.5, 0.85); return; }
  L.nuevo.c.color.setHSL(h, 0.75, 0.68); L.nuevo.dk.color.setHSL(h, 0.7, 0.5); L.nuevo.lt.color.setHSL((h + 0.08) % 1, 0.8, 0.82);
}
