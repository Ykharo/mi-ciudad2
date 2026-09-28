// Joystick en pantalla.
import { state } from '../core/state.js';
import { on } from '../core/events.js';
import { input } from '../game/actors.js';
import { $ } from './dom.js';

const joy = $('#joy'), knob = $('#joyKnob'), joyHint = $('#joyHint');
state.joyId = null; const joyC = { x: 0, y: 0 }; const JR = 60;
function moveJoy(e) {
  let dx = e.clientX - joyC.x, dy = e.clientY - joyC.y; const d = Math.hypot(dx, dy);
  if (d > JR) { dx *= JR / d; dy *= JR / d; }
  input.jx = dx / JR; input.jy = dy / JR;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
joy.addEventListener('pointerdown', e => {
  e.preventDefault(); state.joyId = e.pointerId; try { joy.setPointerCapture(state.joyId); } catch (_) { }
  const r = joy.getBoundingClientRect(); joyC.x = r.left + r.width / 2; joyC.y = r.top + r.height / 2; moveJoy(e);
  joyHint.hidden = true;
});
joy.addEventListener('pointermove', e => { if (e.pointerId === state.joyId) moveJoy(e); });
const endJoy = e => { if (e.pointerId !== state.joyId) return; state.joyId = null; input.jx = input.jy = 0; knob.style.transform = 'translate(-50%,-50%)'; };
joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);

// al abrir un panel el joystick se suelta (el juego ya soltó la entrada y el dedo)
on('menu', abierto => { if (abierto) knob.style.transform = 'translate(-50%,-50%)'; });
// al subirse a un auto, recordar dónde se maneja
on('auto', que => {
  if (que !== 'subir') return;
  joyHint.textContent = '¡Maneja aquí!'; joyHint.hidden = false;
  setTimeout(() => { joyHint.hidden = true; }, 3500);
});
