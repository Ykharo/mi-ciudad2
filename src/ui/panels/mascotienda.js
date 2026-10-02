// La ventana de la Mascotienda Arcoíris (la abre game/mascotienda.js con el evento 'mascotienda'): pestañas por
// sección, la mascota a la que se le prueba (si hay varias), y cada artículo con su nombre bien grande (se lee para
// comprar; 🔊 lo dice en voz alta), su precio en Huesitos y los botones Probar / Comprar, o Ponérselo / Quitárselo si
// ya es tuyo. Al comprar aparece el diario de la mascota: una frase para leer, que da Huesitos.
import { on } from '../../core/events.js';
import { sfx } from '../../audio/audio.js';
import { player } from '../../game/actors.js';
import { mascotienda as M } from '../../game/mascotienda.js';
import { ARTICULOS, SECCIONES } from '../../pets/catalog/articulos.js';
import { $, esc, toast } from '../dom.js';

const panel = $('#tiendaPanel'), tabs = $('#tiendaTabs'), body = $('#tiendaBody'), saldo = $('#tiendaSaldo');
let seccion = 'pociones', probando = null, diario = null;

// decir en voz alta (español de Chile si el aparato lo tiene)
function decir(texto) {
  try {
    const s = window.speechSynthesis; if (!s) return;
    s.cancel(); const u = new SpeechSynthesisUtterance(texto); u.lang = 'es-CL'; u.rate = 0.85; s.speak(u);
  } catch (_) { }
}

function render() {
  tabs.innerHTML = SECCIONES.map(s => `<button class="tab${s.id === seccion ? ' on' : ''}" data-sec="${s.id}">${s.ic} ${esc(s.nombre)}</button>`).join('');
  const pets = player.pets, el = M.elegida(), p = pets[el];
  let h = '';
  // se compra PARA una mascota (cada una tiene sus cosas): se elige a cuál
  if (pets.length) h += `<p class="note">Comprando para <b>${esc(p.name)}</b>${pets.length > 1 ? ' (elige a quién):' : ''}</p>`;
  if (pets.length > 1) h += '<div class="mascotas">' + pets.map((m, i) => `<button class="${i === el ? 'on' : ''}" data-pet="${i}">${esc(m.name)}</button>`).join('') + '</div>';
  if (!pets.length) h += '<p class="note">Adopta una mascota en el Refugio: aquí le compras sus cosas.</p>';
  if (diario) h += `<div class="diario">📔 El diario de ${esc(diario.nombre)}<p>${esc(diario.frase)}</p><button class="toy sun" data-leido="1">¡Lo leí!</button></div>`;
  const S = SECCIONES.find(s => s.id === seccion);
  const lista = ARTICULOS.filter(a => a.seccion === seccion);
  if (S.pronto || !lista.length) h += '<p class="empty" style="margin-top:14px">¡Muy pronto llegan cosas nuevas a este pasillo!</p>';
  const tengo = M.comprados(p);
  for (const a of lista) {
    const mio = tengo.includes(a.id), puesto = p && p.extras && (a.tipo === 'transporte' ? p.extras.transporte === a.id : p.extras.arcoiris);
    h += `<div class="art${probando === a.id ? ' probando' : ''}"><span class="ic">${a.ic}</span>
      <div class="nombre">${esc(a.nombre)}<button data-voz="${a.id}" aria-label="Escuchar">🔊</button></div>
      <div class="desc">${esc(a.desc)}</div><div class="botones">` +
      (mio ? `<span class="tengo">✔ ¡Es de ${esc(p.name)}!</span><button class="toy ${puesto ? '' : 'mint'}" data-poner="${a.id}">${puesto ? 'Quitárselo' : 'Ponérselo'}</button>`
        : `<span class="precio">🦴 ${a.precio}</span>` + (p ? `<button class="toy" data-probar="${a.id}">${probando === a.id ? 'Probando…' : 'Probar'}</button>` +
          `<button class="toy pink" data-comprar="${a.id}">Comprar</button>` : '')) + '</div></div>';
  }
  body.innerHTML = h;
  saldo.textContent = `Tienes 🦴 ${player.huesitos || 0} Huesitos`;
}

tabs.addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (!b) return; seccion = b.dataset.sec; sfx('pop'); render(); });
body.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const p = player.pets[M.elegida()];
  if (b.dataset.pet) { M.elegir(+b.dataset.pet); probando = null; }
  else if (b.dataset.voz) decir(ARTICULOS.find(a => a.id === b.dataset.voz).nombre);
  else if (b.dataset.probar) { probando = b.dataset.probar; M.dejarDeProbar(); M.probar(p, probando); }
  else if (b.dataset.poner) { const on = b.textContent === 'Ponérselo'; M.equipar(p, b.dataset.poner, on); probando = null; }
  else if (b.dataset.comprar) {
    const id = b.dataset.comprar, r = M.comprar(id, p);
    if (r.r === 'faltan') { toast(`Te faltan 🦴 ${r.faltan}. ¡Gánalos leyendo en la competencia de aura!`); sfx('bonk'); return; }
    if (r.r === 'ok') { toast(`¡Compraste ${ARTICULOS.find(a => a.id === id).nombre}!`); if (p) { M.equipar(p, id, true); } probando = null; }
  } else if (b.dataset.leido) { M.leerDiario(); diario = null; }
  sfx('pop'); render();
});
$('#tiendaDone').addEventListener('click', () => { panel.hidden = true; probando = null; diario = null; M.cerrar(); });

on('mascotienda', ev => {
  if (ev.que === 'abrir') { if (ev.seccion) seccion = ev.seccion; probando = null; diario = null; render(); panel.hidden = false; }
  else if (ev.que === 'diario') { const p = player.pets[M.elegida()]; diario = { nombre: p ? p.name : '', frase: ev.frase }; }
});
on('huesitos', () => { if (!panel.hidden) saldo.textContent = `Tienes 🦴 ${player.huesitos || 0} Huesitos`; });
