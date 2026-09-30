// Personajes jugables: con quién se juega (Nina, la amiga o el amigo: characters/catalog/personajes.js).
// Cada uno tiene su propio look (player.looks); player.look es el del que se está usando.
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { PERSONAJES } from '../characters/catalog/personajes.js';
import { fixLook } from '../characters/looks.js';
import { makeAvatar, removeAvatar } from '../characters/avatar.js';
import { loadPrendas } from '../characters/wardrobe.js';
import { avatarStop } from '../characters/animator.js';
import { setHolding } from '../characters/props.js';
import { player } from './actors.js';
import { standUp } from './player.js';
import { save } from './save.js';

// look guardado de un personaje, validado (lo que no calza vuelve a como es él)
const lookDe = (id, guardado) => fixLook(guardado, PERSONAJES[id].look);

// al cargar la partida: los looks de todos y con quién se estaba jugando
function cargarPersonajes(saved) {
  const g = (saved && saved.personajes) || {};
  player.looks = {};
  for (const id of Object.keys(PERSONAJES)) player.looks[id] = lookDe(id, id === 'nina' ? saved && saved.nina && saved.nina.look : g[id] && g[id].look);
  player.personaje = saved && PERSONAJES[saved.jugador] ? saved.jugador : 'nina';
  player.look = player.looks[player.personaje];
}

// Cambia de personaje en la pantalla de inicio o jugando a pie (no manejando ni con un panel abierto). Queda en el
// mismo lugar, mirando hacia el mismo lado; si tenía un helado, lo sigue teniendo.
let cambiando = false;
async function cambiarPersonaje(id) {
  if (!PERSONAJES[id] || id === player.personaje || cambiando || !['intro', 'play'].includes(state.mode)) return false;
  cambiando = true;
  try {
    player.looks[player.personaje] = player.look;
    const look = player.looks[id];
    await loadPrendas([look]);   // las prendas que falten
    const antes = player.ch, helado = antes.holding;
    standUp(); avatarStop(antes, true); setHolding(antes, null);
    removeAvatar(antes);
    player.personaje = id; player.look = look;
    player.ch = makeAvatar(look);
    player.ch.root.position.set(player.pos.x, player.y, player.pos.z); player.ch.root.rotation.y = player.facing;
    if (helado) setHolding(player.ch, helado);
    player.happy = 0.6;
    emit('personaje', id); emit('sonido', 'pop');
    save();
    return true;
  } finally { cambiando = false; }
}

export { cambiarPersonaje, cargarPersonajes };
