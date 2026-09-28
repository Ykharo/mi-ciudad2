// Datos de la partida que lee casi todo el juego: la jugadora, la cámara, la entrada y los autos propios.
// Sólo datos (y addPet): así player.js, npcs.js y driving.js no necesitan importarse entre sí.
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { scene } from '../engine/renderer.js';
import { buildPet, setPetName } from '../pets/models.js';
import { DEFAULT_CAR, fixCarSpec } from '../cars/catalog.js';

state.mode = 'intro'; // intro | play | pets | shop | drive
const ownedCars = [], MAX_CARS = 4;
state.lastCar = null; state.shopSpec = fixCarSpec(DEFAULT_CAR);
const player = { ch: null, pos: new THREE.Vector3(9, 0, -1.5), vel: new THREE.Vector3(), facing: Math.PI * 0.8, vy: 0, y: 0, air: false, speed01: 0, happy: 0, bonk: 0, iceTime: 0, seat: null, pets: [] };
// dragging: hay un dedo o el mouse arrastrando la cámara (la cámara del auto no se endereza sola mientras tanto)
const cam = { yaw: 0.35, pitch: 0.36, dist: 11.5, look: new THREE.Vector3(), pos: new THREE.Vector3(), menuYaw: 0, dragging: false };
const input = { jx: 0, jy: 0, jump: false, keys: {} };
state.clock = 0;
state.currentZone = null;

function addPet(kind, color, name, pos) {
  const obj = buildPet(kind, color);
  setPetName(obj, name);
  scene.add(obj.root);
  const p = { kind, color, name, obj, pos: (pos || player.pos).clone(), facing: player.facing };
  if (!pos) { p.pos.x -= Math.sin(player.facing) * (1.6 + player.pets.length * 1.3); p.pos.z -= Math.cos(player.facing) * (1.6 + player.pets.length * 1.3); }
  player.pets.push(p);
  return p;
}

export { MAX_CARS, addPet, cam, input, ownedCars, player };
