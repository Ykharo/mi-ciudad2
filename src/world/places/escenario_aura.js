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
import { anchoDigitos, dibujarDigitos } from '../../engine/digitos.js';
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
// entre el jurado y las graderías (hacia donde mira la cámara lenta al pasar por detrás de quien baila)
ESCENARIO.publicoCentro = local(0, 6.5);
// los puestos libres de las graderías, para que la jugadora se siente a mirar (adelante o arriba): [lx, fila, y el lx
// donde se sienta su mascota, al lado y en el mismo escalón]
const LIBRES = { adelante: [[4.5, 0, 5.4], [8.5, 0, 7.6]], arriba: [[3, 2, 3.9], [8, 2, 7.1]] };
// donde esperan sentadas las mascotas mientras la jugadora está en la tarima: al lado del escalón, mirando la tarima
const ESPERA = local(-2.4, 3.6);
ESCENARIO.espera = { ...ESPERA, mira: hacia(ESPERA, ESCENARIO.tarima) };
// La competencia (game/aura.js): los dos concursantes esperan arriba de la tarima, uno a cada lado (el 1, a la
// izquierda mirando desde el público: su medidor es el de la izquierda), mirando al público, y bailan por turnos en
// `centro`. `medidor`: mientras hay competencia, el aura de cada uno (0…1) en los medidores de la pantalla; si no, se
// mueven solos.
ESCENARIO.lados = [local(-3.4, -4), local(3.4, -4)].map(p => ({ ...p, mira: ESCENARIO.giro }));
ESCENARIO.centro = { ...local(0, -2.2), mira: ESCENARIO.giro };
// por dónde salen y entran los concursantes cuando hay una competencia nueva: detrás de la tarima, a cada lado
ESCENARIO.salidas = [local(-7.5, -5.5), local(7.5, -5.5)];
// "😎 Competir": delante de la tarima, al lado del escalón; ahí vuelve la jugadora después de competir
const FRENTE = local(1.8, 4.4);
ESCENARIO.frente = { ...FRENTE, mira: hacia(FRENTE, ESCENARIO.tarima) };
ESCENARIO.local = local;   // (para que game/aura.js ubique sus cámaras)
ESCENARIO.medidor = null;
// el juego de las graderías (sentarse a mirar): se crea aquí para que game/aura.js le ponga `alSentarse` antes de que
// se arme la ciudad; build() le agrega los asientos y la vista
ESCENARIO.gradas = { tipo: 'asiento', asientos: {}, privado: true };   // (privado: los vecinos no lo usan)

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
  // A cada lado, una barra de 8 segmentos con escala de colores (del rosado de abajo al violeta de arriba), que sube
  // según los puntos del concursante (ESCENARIO.medidor.puntos / max); arriba, su puntaje acumulado en dígitos de
  // calculadora (contando hacia arriba), y abajo su nombre. Sin competencia, las barras suben y bajan solas.
  const medidores = new THREE.Group(); medidores.userData.dynamic = true; g.add(medidores);
  const N = 8, Y0 = 2.3, PASO = 0.56, ALTO_SEG = 0.46;
  const ESCALA = ['#FF5E7E', '#FF7A59', '#FF9B4A', '#FFD23F', '#5BD66E', '#3DD6C8', '#4FB6F5', '#9B7BF3'];
  const COLOR_NUM = ['#7CFFE0', '#FFB0E0'];
  const segmentos = [], numeros = [], nombres = [];
  const pantallita = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  [-1, 1].forEach((s, k) => {
    for (let i = 0; i < N; i++) {
      // apagado se ve oscuro; encendido brilla con su color (el brillo lo pone el onFrame de abajo)
      const m = new THREE.MeshStandardMaterial({ color: '#2E2645', emissive: ESCALA[i], emissiveIntensity: 0.1, roughness: 0.5 });
      const seg = new THREE.Mesh(G('segAura2', () => new THREE.BoxGeometry(1.5, ALTO_SEG, 0.1)), m);
      seg.position.set(s * 3.6, Y0 + i * PASO, PZ + 0.3); medidores.add(seg); segmentos.push({ m, i, k });
    }
    // el puntaje: una pantallita oscura arriba de la barra
    const cn = pantallita(512, 150), tn = new THREE.CanvasTexture(cn);
    const pn = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.5), new THREE.MeshBasicMaterial({ map: tn }));
    pn.position.set(s * 3.6, Y0 + N * PASO + 0.1, PZ + 0.29); medidores.add(pn);
    numeros.push({ c: cn, t: tn, k, visto: null, valor: 0 });
    // el nombre, abajo
    const cm = pantallita(512, 110), tm = new THREE.CanvasTexture(cm);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.36), new THREE.MeshBasicMaterial({ map: tm, transparent: true }));
    pm.position.set(s * 3.6, Y0 - 0.5, PZ + 0.29); medidores.add(pm);
    nombres.push({ c: cm, t: tm, visto: null });
  });
  function pintarNumero(n, texto, color) {
    const x = n.c.getContext('2d');
    x.fillStyle = '#120E22'; x.fillRect(0, 0, 512, 150);
    x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 6; x.strokeRect(3, 3, 506, 144);
    dibujarDigitos(x, texto, { x: 256 - anchoDigitos(4, 108) / 2, y: 21, alto: 108, color, cifras: 4 });
    n.t.needsUpdate = true;
  }
  function pintarNombre(n, texto) {
    const x = n.c.getContext('2d'); x.clearRect(0, 0, 512, 110);
    x.font = '800 74px "Baloo 2", "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#1C1630'; x.strokeText(texto, 256, 60);
    x.fillStyle = '#FFFFFF'; x.fillText(texto, 256, 60);
    n.t.needsUpdate = true;
  }
  const titulo = makeSign('Escenario del Aura', '#9B6BF0', '#FFFFFF', 9); titulo.position.set(0, 8.4, PZ + 0.1); g.add(titulo);
  caja(0, PZ, 11.4, 1.0, 9);
  onFrame((t, dt) => {
    const M = ESCENARIO.medidor;
    // el número cuenta hacia arriba hasta los puntos (rápido, ~1 s para 1000)
    for (const n of numeros) {
      const meta = M ? M.puntos[n.k] : 0;
      n.valor = n.valor < meta ? Math.min(meta, n.valor + Math.max(dt * 1200, (meta - n.valor) * dt * 3)) : meta;
      const texto = M ? String(Math.round(n.valor / 10) * 10) : '';
      if (texto !== n.visto) { n.visto = texto; pintarNumero(n, texto, COLOR_NUM[n.k]); }
    }
    nombres.forEach((n, k) => { const texto = M && M.nombres ? M.nombres[k] : ''; if (texto !== n.visto) { n.visto = texto; pintarNombre(n, texto); } });
    const nivel = M ? numeros.map(n => n.valor / M.max) : [0.55 + 0.45 * Math.sin(t * 1.3), 0.55 + 0.45 * Math.sin(t * 1.1 + 2)];
    // el segmento de la punta se enciende de a poco; el de quien está bailando titila
    for (const s of segmentos) {
      const tope = nivel[s.k] * N, lleno = Math.min(1, Math.max(0, tope - s.i));
      const punta = M && M.activo === s.k && s.i === Math.ceil(tope) - 1;
      s.m.emissiveIntensity = lleno > 0 ? (punta ? 0.6 + 0.4 * Math.sin(t * 10) : 0.25 + 0.75 * lleno) : 0.06;
    }
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
    asientos[fila] = lista.map(([lx, f, mx]) => {
      const lz = GRADAS.lz + f * GRADAS.fondo, p = puesto(lx, lz, GRADAS.alto[f] + 0.01), a = ancla(world, p.x, p.alto, p.z, p.mira);
      // la mascota se sienta a su lado mirando la tarima (main.js → waitAt; `y`: arriba del escalón)
      // (`dir`: hacia dónde sigue la fila si son varias, alejándose de la jugadora)
      const m = local(mx, lz), d = Math.hypot(m.x - p.x, m.z - p.z);
      a.userData.mascotas = { ...m, y: GRADAS.alto[f], mira: hacia(m, ESCENARIO.tarima), dir: { x: (m.x - p.x) / d, z: (m.z - p.z) / d } };
      return a;
    });
  }
  // (`vista`: la cámara detrás de las graderías, mirando la tarima; al sentarse empieza la competencia: game/aura.js
  // pone `alSentarse` en ESCENARIO.gradas)
  const frente = local(GRADAS.lx, GRADAS.lz - 1.5), centroGradas = local(GRADAS.lx, GRADAS.lz + GRADAS.fondo);
  const opciones = [{ id: 'adelante', label: '🪑 Sentarse adelante' }, { id: 'arriba', label: '⬆️ Sentarse arriba' }];
  const vista = Math.atan2(centroGradas.x - ESCENARIO.tarima.x, centroGradas.z - ESCENARIO.tarima.z);
  Object.assign(ESCENARIO.gradas, { asientos, vista });
  addZone({ id: 'juego', x: frente.x, z: frente.z, r: 2.4, label: opciones[0].label, opciones, juego: ESCENARIO.gradas });
  // arco de entrada con el letrero, mirando a la calle
  const arco = mat('#9B6BF0');
  [-1, 1].forEach(s => {
    g.add(mesh(cyl(0.16, 0.18, 4, 10), arco, s * 3, 2, 11.8));
    g.add(mesh(sph(0.26, 12, 10), mat('#FFD23F'), s * 3, 4.15, 11.8));
    caja(s * 3, 11.8, 0.6, 0.6);
  });
  const letrero = makeSign('Escenario del Aura', '#9B6BF0', '#FFFFFF', 5.6); letrero.position.set(0, 3.6, 11.8); g.add(letrero);
  world.add(g);
  // anotarse para competir, delante de la tarima (lo hace game/aura.js)
  addZone({ id: 'aura', x: ESCENARIO.frente.x, z: ESCENARIO.frente.z, r: 2.0, label: '😎 Competir' });
}

definePlace({ id: 'escenario', nombre: 'Escenario del Aura', articulo: 'el', orden: 90, area: manzana(ESCENARIO.x, ESCENARIO.z), build: escenario });

export { ESCENARIO };
