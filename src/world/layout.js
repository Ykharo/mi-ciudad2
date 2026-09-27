// Grupo del mundo y trazado de calles.
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';

/* ================= WORLD ================= */
const world = new THREE.Group(); scene.add(world);

const LINES = [-40, 0, 40];
const ROAD_HALF = 3.5, WALK = 4.5, EXT = 76;
const STREET = { x: { '-40': 'Avenida Frutilla', '0': 'Calle Arcoíris', '40': 'Avenida Menta' }, z: { '-40': 'Calle Limón', '0': 'Paseo Algodón', '40': 'Calle Mora' } };

export { EXT, LINES, ROAD_HALF, STREET, WALK, world };
