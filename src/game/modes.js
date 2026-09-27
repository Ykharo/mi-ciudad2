// Entrar y salir de los paneles.
import { state } from '../core/state.js';
import { cam, input, player } from './player.js';
import { sfx } from '../audio/audio.js';
import { gameEl, setActionButton } from '../ui/dom.js';
import { knob } from '../ui/joystick.js';
import { setActMenu } from '../ui/action-menu.js';

/* ---------- menus ---------- */
function enterMenu(m) {
  setActMenu(false); state.mode = m; cam.menuYaw = player.facing; player.vel.set(0, 0, 0);
  input.jx = input.jy = 0; state.joyId = null; knob.style.transform = 'translate(-50%,-50%)';
  gameEl.classList.add('menu'); setActionButton(null); state.currentZone = null; sfx('open');
}
function leaveMenu() { state.mode = 'play'; gameEl.classList.remove('menu'); cam.yaw = player.facing + Math.PI; cam.pitch = 0.36; }

export { enterMenu, leaveMenu };
