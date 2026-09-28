// Menú 🎬 Acción.
import { state } from '../core/state.js';
import { on } from '../core/events.js';
import { avatarDo, avatarStop } from '../characters/animator.js';
import { input, player } from '../game/actors.js';
import { standUp } from '../game/player.js';
import { greetAround } from '../game/npcs.js';
import { sfx } from '../audio/audio.js';
import { $ } from './dom.js';

// menú de acciones: todas las animaciones de movimiento de Nina
const ACTIONS = [
  { id: 'wave', name: 'Saludar', ic: '👋' }, { id: 'dance', name: 'Bailar', ic: '💃', loop: true },
  { id: 'jump', name: 'Saltar', ic: '⬆️' }, { id: 'walk_back', name: 'Caminar atrás', ic: '🔙', loop: true },
  { id: 'sit', name: 'Sentarse', ic: '🧘' }, { id: 'lie', name: 'Acostarse', ic: '😴' },
  { id: 'split', name: 'Spagat', ic: '🤸' }, { id: 'candle', name: 'Vela invertida', ic: '🕯️' },
  { id: 'stop', name: 'Quedarse quieta', ic: '🧍' }
];
const btnAct = $('#btnAct'), actMenu = $('#actMenu');
function renderActMenu() {
  const cur = player.ch && player.ch.sp ? player.ch.sp.name : '';
  actMenu.innerHTML = '<h4>¿Qué hace Nina?</h4>' + ACTIONS.map(a =>
    `<button class="act${a.id === cur ? ' on' : ''}" role="menuitem" data-act="${a.id}"><span class="em">${a.ic}</span>${a.name}</button>`).join('');
}
function setActMenu(open) {
  if (open && state.mode !== 'play') return;
  if (open) renderActMenu();
  actMenu.hidden = !open; btnAct.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function doAction(id) {
  if (state.mode !== 'play') return;
  const A = ACTIONS.find(a => a.id === id); if (!A) return;
  if (id === 'jump') { standUp(); input.jump = true; return; }
  if (player.air) return;
  standUp(); player.vel.set(0, 0, 0);
  if (id === 'stop') { avatarStop(player.ch); return; }
  avatarDo(player.ch, id, { loop: !!A.loop, start: id === 'wave' ? 0.05 : 0 });
  if (id === 'wave') greetAround();
  sfx('pop');
}
btnAct.addEventListener('click', e => { e.stopPropagation(); setActMenu(actMenu.hidden); sfx('pop'); });
actMenu.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; setActMenu(false); doAction(b.dataset.act); });
document.addEventListener('pointerdown', e => { if (!actMenu.hidden && !actMenu.contains(e.target) && !btnAct.contains(e.target)) setActMenu(false); });
window.addEventListener('keydown', e => { if (e.code === 'Escape') setActMenu(false); });
// el menú se cierra al abrir un panel o subirse a un auto
on('menu', abierto => { if (abierto) setActMenu(false); });
on('auto', que => { if (que === 'subir') setActMenu(false); });
