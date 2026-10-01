// Ventana para elegir los 3 movimientos de la competencia de aura (game/aura.js la pide con el evento 'aura').
// Se tocan en orden: el primero es el de la ronda 1, etc.; tocar uno elegido lo quita. "¡A competir!" se habilita con 3.
import { on } from '../../core/events.js';
import { sfx } from '../../audio/audio.js';
import { cancelarCompetir, competir } from '../../game/aura.js';
import { $, esc } from '../dom.js';

const panel = $('#auraPanel'), body = $('#auraBody'), go = $('#auraGo');
let bailes = [], elegidos = [];

function render() {
  const casilla = i => { const a = bailes.find(b => b.id === elegidos[i]); return a ? `<span class="lleno">${a.ic} ${esc(a.name)}</span>` : `<span>${i + 1}</span>`; };
  body.innerHTML = '<h3>Tus 3 movimientos, en orden</h3>' +
    `<div class="elegidos">${[0, 1, 2].map(casilla).join('')}</div>` +
    '<h3>Elige</h3><div class="opts">' + bailes.map(a => {
      const n = elegidos.indexOf(a.id);
      return `<button class="opt${n >= 0 ? ' on' : ''}" data-b="${a.id}"><span class="ic">${a.ic}</span>${esc(a.name)}${n >= 0 ? `<span class="n">${n + 1}</span>` : ''}</button>`;
    }).join('') + '</div>' +
    '<p class="note">Cada movimiento suma aura. ¡El jurado elige quién gana!</p>';
  go.disabled = elegidos.length < 3;
}
body.addEventListener('click', e => {
  const b = e.target.closest('[data-b]'); if (!b) return;
  const id = b.dataset.b, n = elegidos.indexOf(id);
  if (n >= 0) elegidos.splice(n, 1); else if (elegidos.length < 3) elegidos.push(id);
  sfx('pop'); render();
});
go.addEventListener('click', () => {
  if (elegidos.length < 3) return;
  panel.hidden = true; sfx('open');
  competir([...elegidos]);
});
$('#auraCancel').addEventListener('click', () => { panel.hidden = true; cancelarCompetir(); });

on('aura', ev => {
  if (ev.que !== 'elegir') return;
  bailes = ev.bailes; elegidos = [];
  render(); panel.hidden = false;
});
