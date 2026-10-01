// Utilidades del DOM: $, avisos, botón de acción y las clases de #game que dependen del modo.
import { on } from '../core/events.js';

const $ = s => document.querySelector(s);
const gameEl = $('#game'), toastEl = $('#toast'), btnAction = $('#btnAction'), btnAction2 = $('#btnAction2');
let toastTimer = 0;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }
// el botón de la zona cercana; una zona con `opciones` (dos formas de usar un juego: sentada o de pie) muestra un
// botón por opción
function setActionButton(z) {
  const op = z && z.opciones;
  if (z) { btnAction.textContent = op ? op[0].label : z.label; btnAction.hidden = false; btnAction.dataset.id = z.id; } else btnAction.hidden = true;
  if (op && op[1]) { btnAction2.textContent = op[1].label; btnAction2.hidden = false; } else btnAction2.hidden = true;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

on('zona', setActionButton);
on('aviso', toast);
on('menu', abierto => gameEl.classList.toggle('menu', abierto));
on('auto', que => gameEl.classList.toggle('driving', que === 'subir'));

export { $, btnAction, btnAction2, esc, gameEl, toast };
