// Utilidades del DOM: $, avisos, botón de acción y las clases de #game que dependen del modo.
import { on } from '../core/events.js';

const $ = s => document.querySelector(s);
const gameEl = $('#game'), toastEl = $('#toast'), btnAction = $('#btnAction');
let toastTimer = 0;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }
function setActionButton(z) { if (z) { btnAction.textContent = z.label; btnAction.hidden = false; btnAction.dataset.id = z.id; } else btnAction.hidden = true; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

on('zona', setActionButton);
on('aviso', toast);
on('menu', abierto => gameEl.classList.toggle('menu', abierto));
on('auto', que => gameEl.classList.toggle('driving', que === 'subir'));

export { $, btnAction, esc, gameEl, toast };
