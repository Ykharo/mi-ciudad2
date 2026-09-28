// Botones del HUD.
import { state } from '../core/state.js';
import { pick } from '../core/math.js';
import { runZone } from '../world/zones.js';
import { avatarDo } from '../characters/animator.js';
import { input, player } from '../game/actors.js';
import { standUp } from '../game/player.js';
import { greetAround, npcSay, npcs } from '../game/npcs.js';
import { callCar, driving, exitCar } from '../game/driving.js';
import { hornSound, initAudio, startMusic, stopMusic } from '../audio/audio.js';
import { $, btnAction } from './dom.js';
import { soltarPalanca } from './joystick.js';
import { openPets } from './panels/pets.js';

$('#btnJump').addEventListener('pointerdown', e => { e.preventDefault(); input.jump = true; });
$('#btnJump').addEventListener('click', e => { if (e.detail === 0) input.jump = true; });
$('#btnWave').addEventListener('click', () => {
  if (state.mode !== 'play' || player.air) return;
  standUp(); avatarDo(player.ch, 'wave', { start: 0.05 });
  greetAround();
});
const btnBrake = $('#btnBrake');
const brakeOn = e => { e.preventDefault(); soltarPalanca(); input.brake = true; btnBrake.classList.add('held'); };
const brakeOff = () => { input.brake = false; btnBrake.classList.remove('held'); };
btnBrake.addEventListener('pointerdown', brakeOn);
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btnBrake.addEventListener(ev, brakeOff));
$('#btnExit').addEventListener('click', exitCar);
function honk() {
  hornSound(driving ? driving.spec.horn : 'clasica');
  npcs.forEach(n => { if (n.pos.distanceTo(player.pos) < 12 && n.cool <= 4) { n.greet = 2.2; n.cool = 8; npcSay(n, pick(['¡Tuut tuut!', '¡Qué lindo auto!', '¡Hola!', '¡Qué auto tan bonito!'])); } });
}
$('#btnHorn').addEventListener('click', honk);
$('#btnPets').addEventListener('click', openPets);
$('#btnMyCar').addEventListener('click', callCar);
// cada zona trae su acción (ver world/zones.js: onZoneAction)
btnAction.addEventListener('click', () => runZone(state.currentZone));
const btnMusic = $('#btnMusic');
btnMusic.addEventListener('click', () => {
  initAudio(); state.musicOn = !state.musicOn;
  if (state.musicOn) startMusic(); else stopMusic();
  btnMusic.textContent = state.musicOn ? '🎵' : '🔇'; btnMusic.classList.toggle('off', !state.musicOn);
  btnMusic.setAttribute('aria-label', state.musicOn ? 'Apagar música' : 'Encender música');
});

export { honk };
