// Teclado (computador).
import { state } from '../core/state.js';
import { input } from '../game/actors.js';
import { enterCar, exitCar } from '../game/driving.js';
import { honk } from './buttons.js';

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
