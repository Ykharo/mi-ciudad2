// Grupo del mundo y trazado de calles.
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';

/* ================= WORLD ================= */
const world = new THREE.Group(); scene.add(world);

const LINES = [-40, 0, 40];
const ROAD_HALF = 3.5, WALK = 4.5, EXT = 76;
const STREET = { x: { '-40': 'Avenida Frutilla', '0': 'Calle Arcoíris', '40': 'Avenida Menta' }, z: { '-40': 'Calle Limón', '0': 'Paseo Algodón', '40': 'Calle Mora' } };

// El rectángulo [x0, x1, z0, z1] de la manzana donde está (x, z): entre calles deja la calle y la vereda (5,5 m desde
// el eje), y hacia afuera llega hasta el borde de la ciudad. Para que un lugar calcule su `area` desde su posición.
const BORDE = 5.5;
function manzana(x, z) {
  const cortes = [-EXT, ...LINES, EXT];
  const tramo = v => {
    for (let i = 0; i < cortes.length - 1; i++) {
      const a = cortes[i], b = cortes[i + 1];
      if (v >= a && v <= b) return [i === 0 ? a : a + BORDE, i === cortes.length - 2 ? b : b - BORDE];
    }
    return [v, v];
  };
  return [...tramo(x), ...tramo(z)];
}

// ¿Está (x, z) sobre una vereda? Las veredas (world/ground.js) son franjas de 2 m a WALK del eje de cada calle, de
// ALTO_VEREDA de alto; se cortan donde cruza la otra calle (salvo las esquinas). Para que quien camina vaya encima y
// no hundido (world/physics.js, sueloEn).
const ALTO_VEREDA = 0.18;
function enVereda(x, z) {
  if (Math.abs(x) > EXT || Math.abs(z) > EXT) return false;
  const franja = v => LINES.some(L => Math.abs(Math.abs(v - L) - WALK) <= 1);
  const calle = v => LINES.some(L => Math.abs(v - L) < ROAD_HALF);
  return (franja(z) && !calle(x)) || (franja(x) && !calle(z));
}

export { ALTO_VEREDA, EXT, LINES, ROAD_HALF, STREET, WALK, enVereda, manzana, world };
