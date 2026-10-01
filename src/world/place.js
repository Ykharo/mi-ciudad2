// Lugares especiales de la ciudad. Cada archivo de world/places/ se registra con
//   definePlace({ id, nombre, orden, area, build(ctx) })
// y city.js los arma todos (los encuentra solo: agregar un lugar = agregar un archivo en world/places/).
// - `nombre` + `area` ([x0, x1, z0, z1], el rectángulo de su manzana): el nombre que aparece arriba a la izquierda.
//   Sin `area`, el lugar no tiene nombre propio (por ejemplo el cartel, que está en la manzana de la Boutique).
// - `orden`: en qué orden se arman (de menor a mayor; sin orden, al final). Conviene no cambiar el de los lugares que
//   ya existen: el orden mueve los obstáculos, el dibujo y los números al azar de las capturas.
// - `build(ctx)`: arma el lugar. `ctx` trae lo que un lugar necesita del mundo:
//   world (el grupo de lo que no se mueve; lo que se mueve lleva userData.dynamic), scene, addObs, addObsRot,
//   addZone (la acción la registra otro con onZoneAction(id, fn)) y onFrame(f(t, dt)) para animar algo en cada cuadro.
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { animated } from '../engine/loop.js';
import { world } from './layout.js';
import { addObs, addObsRot } from './physics.js';
import { addArea, addZone } from './zones.js';

const places = [];
function definePlace(def) { places.push(def); return def; }

const ctx = { world, scene, addObs, addObsRot, addZone, onFrame: f => animated.push(f) };
function buildPlaces() {
  const orden = p => (p.orden === undefined ? Infinity : p.orden);
  [...places].sort((a, b) => orden(a) - orden(b)).forEach(p => {
    p.build(ctx);
    if (p.area) addArea(p.nombre, ...p.area);
  });
}

// Juegos que se usan (carrusel, columpio…): el lugar pone una zona { id: 'juego', juego } (ver game/juegos.js) con
// "anclas": puntos vacíos donde van las caderas de la jugadora, mirando hacia su +z. Se cuelgan de lo que se mueve.
function ancla(padre, x, y, z, ry = 0, rx = 0) {
  const a = new THREE.Object3D(); a.position.set(x, y, z); a.rotation.set(rx, ry, 0, 'YXZ'); padre.add(a); return a;
}

export { ancla, buildPlaces, definePlace, places };
