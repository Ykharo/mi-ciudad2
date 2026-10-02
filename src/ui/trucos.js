// El botón 🎉 Trucos y su menú: lo que sabe hacer cada mascota (se aprende en la Mascotienda). Aparece cuando alguna
// sabe algún truco (game/trucos.js avisa con el evento 'trucos').
import { state } from '../core/state.js';
import { on } from '../core/events.js';
import { hacerTruco, trucosSabidos } from '../game/trucos.js';
import { sfx } from '../audio/audio.js';
import { $, esc } from './dom.js';

const wrap = $('#trucosWrap'), btn = $('#btnTrucos'), menu = $('#trucosMenu');
function render() {
  const lista = trucosSabidos();
  menu.innerHTML = lista.map(m => `<h4>${lista.length > 1 ? `Trucos de ${esc(m.nombre)}` : `¿Qué hace ${esc(m.nombre)}?`}</h4>` +
    m.trucos.map(t => `<button class="act" role="menuitem" data-pet="${m.i}" data-truco="${t.id}"><span class="em">${t.ic}</span>${esc(t.nombre)}</button>`).join('')).join('');
}
function abrir(si) {
  if (si && state.mode !== 'play') return;
  if (si) render();
  menu.hidden = !si; btn.setAttribute('aria-expanded', si ? 'true' : 'false');
}
btn.addEventListener('click', e => { e.stopPropagation(); abrir(menu.hidden); sfx('pop'); });
menu.addEventListener('click', e => {
  const b = e.target.closest('[data-truco]'); if (!b) return;
  abrir(false);
  if (!hacerTruco(+b.dataset.pet, b.dataset.truco)) sfx('bonk');
});
document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) abrir(false); });
on('trucos', ev => { wrap.hidden = !ev.visible; if (!ev.visible) abrir(false); });
on('menu', abierto => { if (abierto) abrir(false); });
