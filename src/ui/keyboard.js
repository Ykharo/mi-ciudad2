// Teclado (computador).
import { state } from '../core/state.js';
import { avatarDo } from '../characters/animator.js';
import { input, player, standUp } from '../game/player.js';
import { enterCar, exitCar } from '../cars/driving.js';
import { $ } from './dom.js';
import { honk } from './buttons.js';
import { greetAround } from './action-menu.js';

/* keyboard (for computers) */
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  input.keys[e.code] = true;
  if (e.code === 'Space' && state.mode === 'play') { input.jump = true; e.preventDefault(); }
  if (e.code === 'Space' && state.mode === 'drive') e.preventDefault();
  if (e.code === 'KeyE') { if (state.mode === 'drive') exitCar(); else if (state.mode === 'play' && state.currentZone && state.currentZone.id === 'car') enterCar(state.currentZone.car); }
  if (e.code === 'KeyH' && state.mode === 'drive') honk();
});
window.addEventListener('keyup', e => { input.keys[e.code] = false; });
window.addEventListener('blur', () => { input.keys = {}; });

/* buttons */
$('#btnJump').addEventListener('pointerdown', e => { e.preventDefault(); input.jump = true; });
$('#btnJump').addEventListener('click', e => { if (e.detail === 0) input.jump = true; });
$('#btnWave').addEventListener('click', () => {
  if (state.mode !== 'play' || player.air) return;
  standUp(); avatarDo(player.ch, 'wave', { start: 0.05 });
  greetAround();
});
