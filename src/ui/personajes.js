// Elegir con quién se juega: en la pantalla de inicio y con el botón redondo de arriba (junto a la música), que abre
// un menú chico. Jugando a pie; manejando avisa que hay que bajarse.
import { state } from '../core/state.js';
import { on } from '../core/events.js';
import { ORDEN_PERSONAJES, PERSONAJES } from '../characters/catalog/personajes.js';
import { player } from '../game/actors.js';
import { cambiarPersonaje } from '../game/personajes.js';
import { sfx } from '../audio/audio.js';
import { $, esc, toast } from './dom.js';
import { optsHTML } from './widgets.js';

const startEl = $('#startChars'), btn = $('#btnChar'), menu = $('#charMenu');
const lista = () => ORDEN_PERSONAJES.map(id => ({ id, name: esc(PERSONAJES[id].nombre), ic: PERSONAJES[id].ic }));

function render() {
  const P = PERSONAJES[player.personaje];
  startEl.innerHTML = '<h4>¿Con quién juegas?</h4>' + optsHTML(lista(), player.personaje, 'personaje');
  btn.textContent = P.ic; btn.setAttribute('aria-label', `Cambiar de personaje (ahora: ${P.nombre})`);
  menu.innerHTML = '<h4>¿Con quién juegas?</h4>' + lista().map(p =>
    `<button class="act${p.id === player.personaje ? ' on' : ''}" role="menuitem" data-personaje="${p.id}"><span class="em">${p.ic}</span>${p.name}</button>`).join('');
}
// cuando el juego terminó de cargar
function mostrarPersonajes() { render(); startEl.hidden = false; btn.hidden = false; }

function setMenu(open) {
  if (open && state.mode !== 'play') { if (state.mode === 'drive') toast('Bájate del auto para cambiar de personaje'); return; }
  if (open) render();
  menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
startEl.addEventListener('click', e => { const b = e.target.closest('[data-k="personaje"]'); if (b) cambiarPersonaje(b.dataset.v); });
btn.addEventListener('click', e => { e.stopPropagation(); setMenu(menu.hidden); sfx('pop'); });
menu.addEventListener('click', e => { const b = e.target.closest('[data-personaje]'); if (!b) return; setMenu(false); cambiarPersonaje(b.dataset.personaje); });
document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) setMenu(false); });
window.addEventListener('keydown', e => { if (e.code === 'Escape') setMenu(false); });
on('menu', abierto => { if (abierto) setMenu(false); });
on('auto', que => { if (que === 'subir') setMenu(false); });
on('personaje', render);

export { mostrarPersonajes };
