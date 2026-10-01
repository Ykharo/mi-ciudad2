// Escenario del Aura: donde será la competencia de farmear aura (la del cartel). Tarima redonda con luces, pantalla
// gigante con el cartel y dos medidores de aura, focos de colores que barren la tarima, mesa del jurado, graderías y un
// arco de entrada hacia la calle. El jurado y el público los sienta game/aura.js; la zona "Competir" todavía sólo
// avisa que falta poco (etapa A del plan de la competencia).
//
// PARA CAMBIARLO DE LUGAR basta cambiar ESCENARIO: el centro (x, z) dentro de una manzana y `giro`, hacia dónde mira su
// frente (la entrada): 0 = hacia +z, Math.PI = hacia −z; en múltiplos de 90° (los obstáculos son cajas alineadas). La
// manzana y el nombre del lugar se calculan solos (y la casa de esa manzana desaparece: city.js), y también las pistas
// que da quien lee el cartel (game/cartel.js). Las medidas de abajo están en metros respecto del centro, con el frente
// hacia +z: caben en una manzana de afuera (30 × 30 m).
import { THREE } from '../../engine/three.js';
import { TAU } from '../../core/math.js';
import { RAINBOW, mat } from '../../engine/materials.js';
import { G, cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { makeSign } from '../../engine/textures.js';
import { manzana } from '../layout.js';
import { addPiso } from '../physics.js';
import { ancla, definePlace } from '../place.js';
import { cartelTextura } from './cartel.js';

// en la Calle Mora, frente a la Plaza de Juegos, mirando hacia la calle
const ESCENARIO = { x: 60.5, z: 58, giro: Math.PI };

// de las medidas del escenario (lx, lz: x a la derecha mirando la entrada… z hacia la entrada) al mundo
const cos = Math.cos(ESCENARIO.giro), sin = Math.sin(ESCENARIO.giro);
const local = (lx, lz) => ({ x: ESCENARIO.x + lx * cos + lz * sin, z: ESCENARIO.z - lx * sin + lz * cos });
const TARIMA = { lx: 0, lz: -3, r: 5.2, h: 0.5 };
ESCENARIO.tarima = { ...local(TARIMA.lx, TARIMA.lz), r: TARIMA.r, h: TARIMA.h };
const hacia = (p, q) => Math.atan2(q.x - p.x, q.z - p.z);

// Dónde se sientan el jurado (3, en la mesa) y el público (5, en las graderías): la cadera y hacia dónde mira (a la
// tarima). game/aura.js los sienta ahí con la pose de "sit".
const JURADO_Z = 6.0, GRADAS = { lx: 5, lz: 6, alto: [0.45, 0.9, 1.35], fondo: 1.2 };
const puesto = (lx, lz, alto) => { const p = local(lx, lz); return { ...p, alto, mira: hacia(p, ESCENARIO.tarima) }; };
ESCENARIO.jurado = [-7.2, -5.5, -3.8].map(lx => puesto(lx, JURADO_Z, 0.72));
ESCENARIO.publico = [[2.5, 0], [6.5, 0], [4, 1], [8, 1], [5.5, 2]].map(([lx, fila]) => puesto(lx, GRADAS.lz + fila * GRADAS.fondo, GRADAS.alto[fila] + 0.01));
// los puestos libres de las graderías, para que la jugadora se siente a mirar (adelante o arriba)
const LIBRES = { adelante: [[4.5, 0], [8.5, 0]], arriba: [[3, 2], [8, 2]] };
// donde esperan sentadas las mascotas mientras la jugadora está en la tarima: al lado del escalón, mirando la tarima
const ESPERA = local(-2.4, 3.6);
ESCENARIO.espera = { ...ESPERA, mira: hacia(ESPERA, ESCENARIO.tarima) };

function escenario({ world, addObsRot, addZone, onFrame }) {
  const g = new THREE.Group(); g.position.set(ESCENARIO.x, 0, ESCENARIO.z); g.rotation.y = ESCENARIO.giro;
  const caja = (lx, lz, w, d, h) => { const p = local(lx, lz); addObsRot(p.x, p.z, w, d, ESCENARIO.giro, h); };
  // piso de la plaza del escenario
  g.add(mesh(rlo(28, 0.06, 26, 0.03), mat('#B07CC6', { roughness: 0.95 }), 0, 0.03, -2, false, true));
  // la tarima: redonda, con focos chicos en el borde y un escalón adelante (se sube caminando: addPiso)
  const { lx: tx, lz: tz, r, h } = TARIMA;
  g.add(mesh(cyl(r, r + 0.2, h, 44), mat('#3A2E66'), tx, h / 2, tz));
  g.add(mesh(cyl(r - 0.3, r - 0.3, 0.04, 44), mat('#5B4A9A', { roughness: 0.4 }), tx, h + 0.02, tz, false, true));
  const bombilla = mat('#FFF3C4', { emissive: '#FFD66B', emissiveIntensity: 0.8 });
  for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; g.add(mesh(sph(0.12, 8, 6), bombilla, tx + Math.cos(a) * (r - 0.12), h + 0.06, tz + Math.sin(a) * (r - 0.12), false, false)); }
  g.add(mesh(rlo(3.2, h / 2, 0.8, 0.06), mat('#3A2E66'), tx, h / 4, tz + r + 0.3));
  // (las mascotas no suben: esperan abajo, en ESCENARIO.espera)
  addPiso({ ...ESCENARIO.tarima, espera: ESCENARIO.espera });
  const escalon = local(tx, tz + r + 0.3), deLado = Math.round(ESCENARIO.giro / (Math.PI / 2)) & 1;
  addPiso({ x: escalon.x, z: escalon.z, hw: deLado ? 0.45 : 1.6, hd: deLado ? 1.6 : 0.45, h: h / 2, espera: ESCENARIO.espera });
  // la pantalla gigante: el cartel al medio y un medidor de aura a cada lado que sube y baja
  const PZ = -9.2, marco = mat('#231C3D');
  g.add(mesh(rlo(11, 6.4, 0.5, 0.2), marco, 0, 4.7, PZ));
  [-1, 1].forEach(s => g.add(mesh(cyl(0.22, 0.26, 1.6, 10), marco, s * 4.6, 0.8, PZ)));
  const imagen = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 5.5), new THREE.MeshBasicMaterial({ map: cartelTextura, color: 0xF2F2F2 }));
  imagen.position.set(0, 4.7, PZ + 0.27); g.add(imagen);
  const medidores = new THREE.Group(); medidores.userData.dynamic = true; g.add(medidores);
  const segmentos = [];
  [-1, 1].forEach((s, k) => {
    for (let i = 0; i < 8; i++) {
      const m = new THREE.MeshStandardMaterial({ color: RAINBOW[Math.floor(i * 6 / 8)], emissive: RAINBOW[Math.floor(i * 6 / 8)], emissiveIntensity: 0.1, roughness: 0.5 });
      const seg = new THREE.Mesh(G('segAura', () => new THREE.BoxGeometry(1.5, 0.52, 0.1)), m);
      seg.position.set(s * 3.6, 2.2 + i * 0.66, PZ + 0.3); medidores.add(seg); segmentos.push({ m, i, k });
    }
  });
  const titulo = makeSign('Escenario del Aura', '#9B6BF0', '#FFFFFF', 9); titulo.position.set(0, 8.4, PZ + 0.1); g.add(titulo);
  caja(0, PZ, 11.4, 1.0, 9);
  onFrame(t => {
    const nivel = [0.55 + 0.45 * Math.sin(t * 1.3), 0.55 + 0.45 * Math.sin(t * 1.1 + 2)];
    for (const s of segmentos) s.m.emissiveIntensity = s.i < nivel[s.k] * 8 ? 0.9 : 0.08;
  });
  // focos de colores en postes, con su haz barriendo la tarima
  const haz = G('hazFoco', () => { const c = new THREE.ConeGeometry(0.9, 7, 20, 1, true); c.translate(0, -3.5, 0); c.rotateX(-Math.PI / 2); return c; });
  const poste = mat('#3C4670', { roughness: 0.5 });
  [[-6, -7.5, 0], [6, -7.5, 2], [-7.5, 1.5, 4], [7.5, 1.5, 1]].forEach(([lx, lz, c], i) => {
    g.add(mesh(cyl(0.12, 0.16, 6, 10), poste, lx, 3, lz));
    const p = local(lx, lz), foco = new THREE.Group(); foco.position.set(p.x, 6.1, p.z); foco.userData.dynamic = true;
    foco.add(mesh(cyl(0.32, 0.24, 0.55, 12), mat('#2B2540'), 0, 0, 0));
    const luz = new THREE.Mesh(haz, new THREE.MeshBasicMaterial({ color: RAINBOW[c], transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide }));
    foco.add(luz); world.add(foco);
    const T = ESCENARIO.tarima, mira = new THREE.Vector3();
    onFrame(t => { foco.lookAt(mira.set(T.x + Math.cos(t * 0.7 + i * 1.7) * 3, 0.5, T.z + Math.sin(t * 0.9 + i * 2.3) * 2.5)); });
  });
  // mesa del jurado (mirando la tarima) con tres sillas
  g.add(mesh(rlo(5, 0.14, 1.1, 0.05), mat('#FFFFFF'), -5.5, 1.0, 5));
  g.add(mesh(rlo(5, 0.85, 0.1, 0.04), mat('#FF6FAE'), -5.5, 0.55, 4.48));
  const cartelito = makeSign('Jurado', '#FF6FAE', '#FFFFFF', 2.4); cartelito.position.set(-5.5, 0.62, 4.41); cartelito.rotation.y = Math.PI; g.add(cartelito);
  const silla = mat('#FFD23F');
  ESCENARIO.jurado.forEach((_, i) => {
    const lx = -7.2 + i * 1.7;
    g.add(mesh(rlo(0.8, 0.12, 0.8, 0.04), silla, lx, 0.62, JURADO_Z));
    g.add(mesh(rlo(0.8, 0.9, 0.12, 0.04), silla, lx, 1.1, JURADO_Z + 0.45));
    [-1, 1].forEach(a => [-1, 1].forEach(b => g.add(mesh(cyl(0.04, 0.04, 0.56, 6), poste, lx + a * 0.32, 0.28, JURADO_Z + b * 0.32))));
  });
  caja(-5.5, 5.6, 5.4, 2.4);
  // graderías de tres filas
  GRADAS.alto.forEach((alto, i) => g.add(mesh(rlo(8, alto, GRADAS.fondo, 0.06), mat(['#FF9B4A', '#FFD23F', '#3DD6A8'][i]), GRADAS.lx, alto / 2, GRADAS.lz + i * GRADAS.fondo)));
  caja(GRADAS.lx, GRADAS.lz + GRADAS.fondo, 8.2, GRADAS.fondo * 3 + 0.2, 1.5);
  // sentarse a mirar el espectáculo: en la fila de adelante o en la de arriba (game/juegos.js, tipo 'asiento')
  const asientos = {};
  for (const [fila, lista] of Object.entries(LIBRES)) {
    asientos[fila] = lista.map(([lx, f]) => { const p = puesto(lx, GRADAS.lz + f * GRADAS.fondo, GRADAS.alto[f] + 0.01); return ancla(world, p.x, p.alto, p.z, p.mira); });
  }
  const frente = local(GRADAS.lx, GRADAS.lz - 1.5);
  const opciones = [{ id: 'adelante', label: '🪑 Sentarse adelante' }, { id: 'arriba', label: '⬆️ Sentarse arriba' }];
  addZone({ id: 'juego', x: frente.x, z: frente.z, r: 2.4, label: opciones[0].label, opciones, juego: { tipo: 'asiento', asientos } });
  // arco de entrada con el letrero, mirando a la calle
  const arco = mat('#9B6BF0');
  [-1, 1].forEach(s => {
    g.add(mesh(cyl(0.16, 0.18, 4, 10), arco, s * 3, 2, 11.8));
    g.add(mesh(sph(0.26, 12, 10), mat('#FFD23F'), s * 3, 4.15, 11.8));
    caja(s * 3, 11.8, 0.6, 0.6);
  });
  const letrero = makeSign('Escenario del Aura', '#9B6BF0', '#FFFFFF', 5.6); letrero.position.set(0, 3.6, 11.8); g.add(letrero);
  world.add(g);
  // subirse a competir (por ahora sólo avisa: lo hace game/aura.js)
  const z = local(TARIMA.lx, TARIMA.lz + 1);
  addZone({ id: 'aura', x: z.x, z: z.z, r: 3.5, label: '😎 Competir' });
}

definePlace({ id: 'escenario', nombre: 'Escenario del Aura', articulo: 'el', orden: 90, area: manzana(ESCENARIO.x, ESCENARIO.z), build: escenario });

export { ESCENARIO };
