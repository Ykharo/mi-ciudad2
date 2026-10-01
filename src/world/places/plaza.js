// Plaza de Juegos: en la manzana de afuera frente al Refugio, cruzando la Avenida Menta. Carrusel girando,
// cama elástica con una pelota que rebota, sube y baja, arenero y bancas para sentarse. Los juegos se usan: cada uno
// pone una zona 'juego' con sus anclas (dónde va la jugadora; lo hace game/juegos.js).
// (El primer lugar hecho sólo con un archivo: city.js lo encuentra solo y no pone una casa en su manzana.)
import { THREE } from '../../engine/three.js';
import { TAU } from '../../core/math.js';
import { RAINBOW, mat } from '../../engine/materials.js';
import { G, box, cone, cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { makeSign, stripeTexture } from '../../engine/textures.js';
import { ancla, definePlace } from '../place.js';
import { flowers, tree } from '../nature.js';
import { bench } from './park.js';

const CX = 61, CZ = 20;   // centro del piso de goma; la entrada mira a la Avenida Menta (x = 40)

function carrusel({ world, addObs, addZone, onFrame }, x, z) {
  world.add(mesh(cyl(3.4, 3.5, 0.3, 36), mat('#FFFFFF'), x, 0.15, z));
  addObs(x, z, 3.4, 3.4, 5.5);
  const g = new THREE.Group(); g.userData.dynamic = true; g.position.set(x, 0.3, z); world.add(g);
  g.add(mesh(cyl(3.2, 3.2, 0.12, 36), mat('#FFE1EE'), 0, 0.06, 0, false, true));
  g.add(mesh(cyl(0.35, 0.35, 3.5, 16), mat('#FFD23F', { metalness: 0.3, roughness: 0.4 }), 0, 1.8, 0));
  g.add(mesh(cyl(3.6, 3.6, 0.3, 24), mat('#FF6FAE'), 0, 3.65, 0));
  const techo = mesh(cone(3.8, 1.6, 24), new THREE.MeshStandardMaterial({ map: stripeTexture('#FF6FAE', '#FFFFFF', 12), roughness: 0.7 }), 0, 4.6, 0);
  g.add(techo);
  g.add(mesh(sph(0.3, 12, 10), mat('#FFD23F', { metalness: 0.4, roughness: 0.3 }), 0, 5.55, 0));
  // seis caballitos de colores que suben y bajan por su barra
  const barra = mat('#FFE9A8', { metalness: 0.4, roughness: 0.3 });
  const caballos = [], asientos = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU, r = 2.3;
    g.add(mesh(cyl(0.05, 0.05, 3.4, 8), barra, Math.cos(a) * r, 1.8, Math.sin(a) * r, false));
    const c = new THREE.Group(); c.position.set(Math.cos(a) * r, 0.95, Math.sin(a) * r); c.rotation.y = -a - Math.PI / 2; c.scale.setScalar(1.35);
    const color = mat(RAINBOW[i]);
    c.add(mesh(rlo(1.0, 0.45, 0.36, 0.16), color, 0, 0, 0));
    c.add(mesh(rlo(0.32, 0.55, 0.3, 0.12), color, 0.45, 0.32, 0));
    c.add(mesh(rlo(0.3, 0.12, 0.42, 0.05), mat('#FFFFFF'), -0.25, 0.27, 0));   // la montura
    // de lado, mirando hacia afuera del carrusel (así las piernas no chocan con la cabeza del caballito)
    asientos.push(ancla(c, -0.25, 0.36, 0, Math.PI));
    [-1, 1].forEach(s => [-1, 1].forEach(t => c.add(mesh(cyl(0.05, 0.05, 0.4, 6), color, s * 0.35, -0.35, t * 0.12))));
    g.add(c); caballos.push(c);
  }
  onFrame(t => {
    g.rotation.y = t * 0.45;
    caballos.forEach((c, i) => { c.position.y = 0.95 + Math.sin(t * 2.2 + i * 1.7) * 0.22; });
  });
  addZone({ id: 'juego', x, z, r: 4.8, label: '🎠 Subirse al carrusel', juego: { tipo: 'asiento', asientos } });
}

function camaElastica({ world, addObs, addZone, onFrame }, x, z) {
  const pata = mat('#3C4670', { roughness: 0.5 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; world.add(mesh(cyl(0.07, 0.07, 0.8, 8), pata, x + Math.cos(a) * 2.0, 0.4, z + Math.sin(a) * 2.0)); }
  const borde = mesh(G('camaBorde', () => new THREE.TorusGeometry(2.1, 0.18, 10, 40)), mat('#4FB6F5'), x, 0.82, z);
  borde.rotation.x = Math.PI / 2; world.add(borde);
  world.add(mesh(cyl(1.95, 1.95, 0.04, 40), mat('#5B4A8A', { roughness: 0.9 }), x, 0.8, z, false, true));
  addObs(x, z, 2.3, 2.3);
  const juego = { tipo: 'cama', centro: ancla(world, x, 0.84, z) };
  addZone({ id: 'juego', x, z, r: 3.2, label: '🤸 Saltar en la cama elástica', juego });
  // una pelota que rebota sola (se esconde mientras salta la jugadora)
  const pelota = mesh(sph(0.35, 16, 12), mat('#FFD23F'), x, 1.2, z); pelota.userData.dynamic = true; world.add(pelota);
  onFrame(t => {
    pelota.visible = !juego.ocupado; const s = Math.abs(Math.sin(t * 2.4)); pelota.position.y = 1.17 + s * 1.6; pelota.scale.set(1, 0.8 + Math.min(1, s * 4) * 0.2, 1); });
}

function subeBaja({ world, addObs, addZone, onFrame }, x, z) {
  world.add(mesh(rlo(0.5, 0.65, 0.5, 0.1), mat('#FF9B4A'), x, 0.33, z));
  addObs(x, z, 2.5, 0.5);
  const g = new THREE.Group(); g.userData.dynamic = true; g.position.set(x, 0.7, z); world.add(g);
  g.add(mesh(rlo(4.8, 0.14, 0.45, 0.06), mat('#FFD23F'), 0, 0, 0));
  const asientos = [];
  [[-1, '#FF6FAE'], [1, '#3DD6A8']].forEach(([s, c]) => {
    g.add(mesh(rlo(0.55, 0.1, 0.55, 0.04), mat(c), s * 2.05, 0.1, 0));
    asientos.push(ancla(g, s * 2.1, 0.2, 0, -s * Math.PI / 2));   // mirando hacia el medio
    g.add(mesh(cyl(0.04, 0.04, 0.5, 6), mat('#3C4670'), s * 1.65, 0.3, 0));
    const asa = mesh(cyl(0.04, 0.04, 0.5, 6), mat('#3C4670'), s * 1.65, 0.55, 0); asa.rotation.x = Math.PI / 2; g.add(asa);
  });
  const juego = { tipo: 'asiento', asientos, pareja: true };   // (pareja: los vecinos lo usan de a dos)
  addZone({ id: 'juego', x, z, r: 2.0, label: '⚖️ Subirse al sube y baja', juego });
  // con alguien arriba sube y baja más
  let amp = 0.2;
  onFrame((t, dt) => { amp += ((juego.ocupado ? 0.3 : 0.2) - amp) * Math.min(1, dt * 2); g.rotation.z = Math.sin(t * 1.5) * amp; });
}

function arenero({ world, addObs }, x, z) {
  const madera = mat('#E08A4F');
  [-1, 1].forEach(s => {
    world.add(mesh(rlo(4.2, 0.4, 0.3, 0.08), madera, x, 0.2, z + s * 1.95));
    world.add(mesh(rlo(0.3, 0.4, 3.6, 0.08), madera, x + s * 1.95, 0.2, z));
  });
  const arena = mat('#E8AE4E', { roughness: 1 });
  world.add(mesh(box(3.6, 0.3, 3.6), arena, x, 0.15, z, false, true));
  const monte = mesh(sph(0.8, 14, 8), arena, x - 0.6, 0.3, z + 0.5); monte.scale.y = 0.4; world.add(monte);
  // un castillo, un balde y una pala
  world.add(mesh(cyl(0.3, 0.36, 0.4, 10), arena, x + 0.7, 0.5, z + 0.6));
  world.add(mesh(cone(0.32, 0.35, 10), mat('#D69A3E', { roughness: 1 }), x + 0.7, 0.88, z + 0.6));
  world.add(mesh(cyl(0.22, 0.16, 0.35, 12), mat('#FF5E7E'), x + 0.6, 0.48, z - 0.8));
  const pala = mesh(rlo(0.18, 0.05, 0.6, 0.02), mat('#4FB6F5'), x - 0.5, 0.33, z - 0.7); pala.rotation.y = 0.6; world.add(pala);
  addObs(x, z, 2.1, 2.1);
}

function plaza(ctx) {
  const { world, addObs } = ctx;
  // piso de goma, y el camino desde la vereda
  world.add(mesh(rlo(26, 0.06, 22, 0.03), mat('#9C86D9', { roughness: 0.95 }), CX, 0.03, CZ, false, true));
  world.add(mesh(box(3, 0.04, 3), mat('#EADCC6'), 46.6, 0.025, CZ, false, true));
  // arco de entrada con el letrero, mirando a la avenida
  const poste = mat('#3DD6A8');
  [-1, 1].forEach(s => {
    world.add(mesh(cyl(0.16, 0.18, 3.6, 10), poste, 48.2, 1.8, CZ + s * 2.3));
    world.add(mesh(sph(0.26, 12, 10), mat('#FFD23F'), 48.2, 3.75, CZ + s * 2.3));
    addObs(48.2, CZ + s * 2.3, 0.3, 0.3);
  });
  const letrero = makeSign('Plaza de Juegos', '#3DD6A8', '#FFFFFF', 5.0); letrero.position.set(48.1, 3.2, CZ); letrero.rotation.y = -Math.PI / 2;
  world.add(letrero);
  carrusel(ctx, 64, 13.5);
  camaElastica(ctx, 56, 26.5);
  subeBaja(ctx, 67, 27);
  arenero(ctx, 54.5, 12.5);
  // bancas mirando los juegos (con su zona para sentarse)
  [16, 24].forEach(z => bench(ctx, 72.6, z, -Math.PI / 2));
  // árboles y flores en las esquinas
  [[47.5, 7.5], [74.5, 7.5], [47.5, 32.5], [74.5, 32.5]].forEach(([x, z], i) => tree(x, z, 1, i % 2));
  flowers(47.2, 15.6, 1.4, 3, 10, 51); flowers(47.2, 24.4, 1.4, 3, 10, 52); flowers(72.6, 20, 1.2, 3, 8, 53);
}

definePlace({ id: 'plaza', nombre: 'Plaza de Juegos', articulo: 'la', orden: 80, area: [45.5, 76, 5.5, 34.5], build: plaza });
