// Utilidades del DOM: $, avisos y botón de acción.

/* ================= UI ================= */
const $ = s => document.querySelector(s);
const gameEl = $('#game'), toastEl = $('#toast'), btnAction = $('#btnAction');
let toastTimer = 0;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600); }
function setActionButton(z) { if (z) { btnAction.textContent = z.label; btnAction.hidden = false; btnAction.dataset.id = z.id; } else btnAction.hidden = true; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export { $, btnAction, esc, gameEl, setActionButton, toast };
