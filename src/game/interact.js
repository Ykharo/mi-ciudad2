// Qué zona de interacción tiene cerca la jugadora (un lugar o un auto). Avisa con el evento 'zona'.
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { zones } from '../world/zones.js';
import { player } from './actors.js';
import { nearestCar } from './driving.js';

function updateZones() {
  let found = null;
  if (state.mode === 'play' && !player.seat) for (const q of zones) if (Math.hypot(player.pos.x - q.x, player.pos.z - q.z) < q.r) { found = q; break; }
  if (state.mode === 'play' && !found) { const c = nearestCar(1.5); if (c) found = c.zone; }
  if (found !== state.currentZone) { state.currentZone = found; emit('zona', found); }
}

export { updateZones };
