// Zonas de interacción y nombre del lugar.
// - Un lugar agrega su zona con addZone({ id, x, z, r, label }). Lo que pasa al tocar el botón de acción lo
//   registra el sistema que sabe hacerlo, con onZoneAction(id, fn) (el mundo no conoce paneles ni jugadora).
// - Un lugar registra su área con addArea(): así se arma el nombre que aparece arriba a la izquierda.
import { LINES, STREET } from './layout.js';

const zones = [];       // interaction spots
const zoneActions = new Map();
const areas = [];

function addZone(z) { zones.push(z); }
function onZoneAction(id, fn) { zoneActions.set(id, fn); }
function runZone(z) { const fn = z && zoneActions.get(z.id); if (fn) fn(z); }

function addArea(name, x0, x1, z0, z1) { areas.push({ name, x0, x1, z0, z1 }); }
function areaName(x, z) {
  for (const a of areas) if (x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1) return a.name;
  for (const L of LINES) { if (Math.abs(x - L) < 5.6) return STREET.x[L]; if (Math.abs(z - L) < 5.6) return STREET.z[L]; }
  return 'Barrio Arcoíris';
}

export { addArea, addZone, areaName, onZoneAction, runZone, zones };
