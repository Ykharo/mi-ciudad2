// Botones del HUD.
import { state } from '../core/state.js';
import { pick } from '../core/math.js';
import { setHolding } from '../characters/props.js';
import { input, player, sitOnBench } from '../game/player.js';
import { npcSay, npcs } from '../game/npcs.js';
import { callCar, driving, enterCar, exitCar } from '../cars/driving.js';
import { hornSound, initAudio, sfx, startMusic, stopMusic } from '../audio/audio.js';
import { $, btnAction, toast } from './dom.js';
import { openPets } from './panels/pets.js';
import { openShop } from './panels/shop.js';

const btnBrake = $('#btnBrake');
const brakeOn = e => { e.preventDefault(); input.brake = true; btnBrake.classList.add('held'); };
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
btnAction.addEventListener('click', () => {
  const id = btnAction.dataset.id;
  if (id === 'bench' && state.currentZone) sitOnBench(state.currentZone.bench); else if (id === 'pets') openPets(); else if (id === 'icecream') giveIceCream();
  else if (id === 'shop') openShop(); else if (id === 'car' && state.currentZone) enterCar(state.currentZone.car);
});
const btnMusic = $('#btnMusic');
btnMusic.addEventListener('click', () => {
  initAudio(); state.musicOn = !state.musicOn;
  if (state.musicOn) startMusic(); else stopMusic();
  btnMusic.textContent = state.musicOn ? '🎵' : '🔇'; btnMusic.classList.toggle('off', !state.musicOn);
  btnMusic.setAttribute('aria-label', state.musicOn ? 'Apagar música' : 'Encender música');
});

const FLAVORS = [['#FF9CC7', 'frutilla'], ['#7A4A30', 'chocolate'], ['#8FE3C5', 'menta'], ['#FFF5DE', 'vainilla'], ['#B89CFF', 'mora'], ['#FFD23F', 'mango']];
function giveIceCream() {
  const [c, n] = pick(FLAVORS);
  setHolding(player.ch, c);
  player.iceTime = 45; player.happy = 0.6; sfx('adopt');
  toast(`¡Mmm! Un helado de ${n}`);
}

export { honk };
