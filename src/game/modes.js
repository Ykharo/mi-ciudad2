// Entrar y salir de los paneles. La interfaz reacciona al evento 'menu'.
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { cam, input, player } from './actors.js';

function enterMenu(m) {
  state.mode = m; cam.menuYaw = player.facing; player.vel.set(0, 0, 0);
  input.jx = input.jy = 0; state.joyId = null;
  emit('menu', true); emit('zona', null); state.currentZone = null; emit('sonido', 'open');
}
function leaveMenu() { state.mode = 'play'; emit('menu', false); cam.yaw = player.facing + Math.PI; cam.pitch = 0.36; }

export { enterMenu, leaveMenu };
