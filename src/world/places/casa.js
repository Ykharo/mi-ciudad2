// Mi Casa: al lado de la Heladería, mirando a la Calle Arcoíris, con flores en la vereda.
// Al costado, el patio de las mascotas: una reja blanca abierta hacia la calle de abajo (+z) y un terreno de pasto
// por mascota, donde va su casita de la Mascotienda (game/casas.js las pone según lo que tenga cada una).
import { THREE } from '../../engine/three.js';
import { mat } from '../../engine/materials.js';
import { box, cyl, mesh, rlo } from '../../engine/geometry.js';
import { makeSign } from '../../engine/textures.js';
import { definePlace } from '../place.js';
import { house } from '../houses.js';
import { flowers } from '../nature.js';
import { addArea } from '../zones.js';

// los terrenos (de izquierda a derecha, uno por mascota; las casitas miran hacia +z) y el rectángulo del patio
export const PATIO = { lotes: [-29.5, -26, -22.5, -19].map(x => ({ x, z: 25.6 })), area: [-31.8, -17.2, 22.6, 33] };

function patio({ world, addObs }) {
  const [x0, x1, z0, z1] = PATIO.area, g = new THREE.Group(); world.add(g);
  const blanco = mat('#FFFFFF'), pasto = mat('#86CF62'), piedra = mat('#E9E1D3');
  // la reja: atrás y a los costados (hasta la mitad), con palitos y dos travesaños
  const reja = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.round(L / 0.45), ry = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i <= n; i++) g.add(mesh(box(0.1, 0.9, 0.06), blanco, ax + (bx - ax) * i / n, 0.45, az + (bz - az) * i / n));
    for (const y of [0.3, 0.7]) { const t = mesh(box(0.05, 0.08, L), blanco, (ax + bx) / 2, y, (az + bz) / 2); t.rotation.y = ry; g.add(t); }
    addObs((ax + bx) / 2, (az + bz) / 2, Math.abs(bx - ax) / 2 + 0.1, Math.abs(bz - az) / 2 + 0.1);
  };
  reja(x0, z0, x1, z0); reja(x0, z0, x0, 29.5); reja(x1, z0, x1, 29.5);
  // un terreno redondo de pasto por mascota, con un caminito de piedras hacia adelante
  for (const L of PATIO.lotes) {
    const t = mesh(cyl(1.35, 1.35, 0.04, 28), pasto, L.x, 0.02, L.z, false, true); g.add(t);
    for (let i = 0; i < 4; i++) g.add(mesh(cyl(0.22, 0.22, 0.04, 12), piedra, L.x + (i % 2 ? 0.12 : -0.12), 0.03, L.z + 1.7 + i * 0.6, false, true));
    addObs(L.x, L.z - 0.2, 0.75, 0.75);
  }
  const s = makeSign('🐾 Patio de mascotas', '#3DD6A8', '#FFFFFF', 4.2); s.position.set((x0 + x1) / 2, 1.75, z0 + 0.06); g.add(s);
  for (const k of [-1, 1]) g.add(mesh(cyl(0.06, 0.06, 1.7, 8), blanco, (x0 + x1) / 2 + k * 1.9, 0.85, z0));
  addArea('Patio de mascotas', x0, x1, z0, z1);
}

// El buzón (junto al camino de Mi Casa, cerca de la vereda): ahí llega cada día la carta de Robi (game/encargos.js).
// `BUZON.bandera` es la banderita roja: el juego la levanta cuando hay carta nueva.
export const BUZON = { x: -7.6, z: 23.6, bandera: null };
function buzon({ world, addObs, addZone }) {
  const { x, z } = BUZON, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; g.userData.dynamic = true; world.add(g);
  g.add(mesh(cyl(0.05, 0.05, 1.1, 8), mat('#8A5A2E'), 0, 0.55, 0));
  const caja = mesh(rlo(0.36, 0.34, 0.6, 0.14), mat('#4FB6F5'), 0, 1.25, 0); g.add(caja);
  g.add(mesh(box(0.28, 0.04, 0.02), mat('#2B2A44'), 0, 1.3, 0.305));   // la ranura
  const pivote = new THREE.Group(); pivote.position.set(0.2, 1.2, -0.12); g.add(pivote);
  pivote.add(mesh(box(0.02, 0.38, 0.04), mat('#FF4F5E'), 0, 0.19, 0)); pivote.add(mesh(box(0.02, 0.12, 0.16), mat('#FF4F5E'), 0, 0.32, -0.08));
  BUZON.bandera = pivote;
  const s = makeSign('📬 Correo', '#4FB6F5', '#FFFFFF', 0.9); s.position.set(0, 1.62, 0.02); g.add(s);
  addObs(x, z, 0.3, 0.3);
  addZone({ id: 'buzon', x: x + 1.0, z, r: 1.4, label: '📬 Abrir el buzón' });
}

function casa(ctx) {
  const mine = house(-13, 26, Math.PI / 2, { w: 9, d: 7.5, h: 6, wall: '#FFD6E2', roof: '#FF6FAE', door: '#9B6BF0', path: 3.3 });
  const s = makeSign('Mi Casa', '#9B6BF0', '#FFFFFF', 3.4); s.position.set(0, 5.1, 7.5 / 2 + 0.07); mine.add(s);
  flowers(-7.5, 20, 2, 4, 14, 41); flowers(-7.5, 32, 2, 4, 14, 42);
  patio(ctx);
  buzon(ctx);
}

definePlace({ id: 'casa', nombre: 'Mi Casa', orden: 60, area: [-34.5, -5.5, 21, 34.5], build: casa });
