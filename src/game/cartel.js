// El cartel de la competencia de farmear aura (world/places/cartel.js): un espectador parado frente a él, leyéndolo
// (animación mirar_cartel, en bucle), y la acción de la zona: la jugadora se da vuelta hacia el cartel y lo mira.
// El espectador es la amiga o el amigo, el que no esté usando la jugadora (si cambia de personaje, cambia).
import { emit, on } from '../core/events.js';
import { CARTEL } from '../world/places/cartel.js';
import { addObs } from '../world/physics.js';
import { onZoneAction } from '../world/zones.js';
import { PERSONAJES } from '../characters/catalog/personajes.js';
import { makeAvatar, removeAvatar } from '../characters/avatar.js';
import { avatarDo, updateAvatar } from '../characters/animator.js';
import { player } from './actors.js';
import { standUp } from './player.js';

const LUGAR = CARTEL.frente(4.0, -1.0);                       // al otro lado de la zona de la jugadora
const MIRA = Math.atan2(CARTEL.x - LUGAR.x, CARTEL.z - LUGAR.z);
let espectador = null, quien = null;

const elegido = () => (player.personaje === 'amiga' ? 'amigo' : 'amiga');
function ponerEspectador() {
  const id = elegido();
  if (id === quien) return;
  if (espectador) removeAvatar(espectador);
  quien = id;
  espectador = makeAvatar(JSON.parse(JSON.stringify(PERSONAJES[id].look)));
  espectador.root.position.set(LUGAR.x, 0, LUGAR.z); espectador.root.rotation.y = MIRA;
  avatarDo(espectador, 'mirar_cartel', { loop: true, instant: true, start: id === 'amiga' ? 0 : 3 });
}
// después de cargar los personajes (main.js); sus prendas tienen que estar cargadas (loadCharacters con su look)
function crearEspectador() {
  ponerEspectador();
  addObs(LUGAR.x, LUGAR.z, 0.35, 0.35);
}
function updateEspectador(dt) { if (espectador) updateAvatar(espectador, dt, 0, null); }
on('personaje', () => { if (espectador) ponerEspectador(); });

// la jugadora mira el cartel: se da vuelta hacia él y lo lee (hasta que se mueva)
onZoneAction('cartel', () => {
  standUp(); player.vel.set(0, 0, 0);
  player.facing = Math.atan2(CARTEL.x - player.pos.x, CARTEL.z - player.pos.z);
  avatarDo(player.ch, 'mirar_cartel', { loop: true, start: 0.2 });
  emit('aviso', '👑 ¡Competencia de farmear aura! Sábado 24 de mayo, 16:00 hrs');
  emit('sonido', 'pop');
});

const espectadorActual = () => espectador;   // (para las pruebas)

export { crearEspectador, espectadorActual, updateEspectador };
