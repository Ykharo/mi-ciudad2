// La ventana de los encargos de lectura (game/encargos.js la abre con el evento 'encargo'):
//   cartelera  las 3 notas de la Plaza para leer y aceptar una (o la que está en curso)
//   nota       la nota del encargo en curso (botón 📜 Mi encargo), con 🔊 y "Dejar este encargo"
//   elegir     la pregunta de quien atiende (los sabores, cuántos huesos): se responde leyendo, con botones de texto
//   carta      la carta del día de Robi y su pregunta
// La nota se lee en letra grande; 🔊 la lee en voz alta (y el encargo ya no da el bono de "sin ayuda").
import { on } from '../../core/events.js';
import { sfx } from '../../audio/audio.js';
import { aceptar, cerrarPanel, dejar, responder, responderCarta, usoAyuda, verNota } from '../../game/encargos.js';
import { $, esc, toast } from '../dom.js';

const panel = $('#encargoPanel'), body = $('#encargoBody'), titulo = $('#encargoTitulo'), btn = $('#btnEncargo');
let vista = null;

function decir(texto) {
  try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(texto); u.lang = 'es-CL'; u.rate = 0.85; s.speak(u); } catch (_) { }
}
const mezclar = a => [...a].sort(() => Math.random() - 0.5);
// una nota: el texto y la P.D. aparte (con la clave de la caja fuerte)
function nota(e, acciones) {
  const [texto, pd] = e.nota.split('\n\n');
  return `<div class="nota"><span class="chinche"></span><h3><span class="ic">${e.ic}</span>${esc(e.titulo)}</h3>
    <p>${esc(texto)}</p><p class="pd">${esc(pd)}</p><div class="acciones"><span class="pago">🦴 ${e.pago}</span>
    <button class="voz" data-voz="${e.id}">🔊 Escuchar</button>${acciones}</div></div>`;
}
function abrir(t) { titulo.textContent = t; panel.hidden = false; }
function cerrar() { panel.hidden = true; vista = null; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (_) { } }

on('encargo', ev => {
  if (ev.que === 'boton') { btn.hidden = !ev.visible; return; }
  vista = ev;
  if (ev.que === 'cartelera') {
    abrir('📋 Encargos');
    body.innerHTML = ev.actual
      ? '<p class="note">Ya tienes un encargo. ¡Termínalo para tomar otro!</p>' + nota(ev.actual, '')
      : '<p class="note">Lee las notas y elige un encargo. ¡Lee con atención: la nota dice qué hacer!</p>' + ev.notas.map(e => nota(e, `<button class="toy mint" data-aceptar="${e.id}">¡Lo hago!</button>`)).join('');
  } else if (ev.que === 'nota') {
    abrir('📜 Mi encargo');
    body.innerHTML = nota(ev.encargo, '<button class="toy" data-dejar="1">Dejar este encargo</button>');
  } else if (ev.que === 'elegir') {
    abrir(`💬 ${ev.quien}`);
    vista.elegidas = [];
    body.innerHTML = `<p class="pregunta">${esc(ev.pregunta)}</p><div class="opciones">` + mezclar(ev.opciones).map(o => `<button data-op="${esc(o)}">${esc(o)}</button>`).join('') + '</div>' +
      '<p class="note">¿No te acuerdas? Toca 📜 Mi encargo después de cerrar, y vuelve a hablar.</p>';
  } else if (ev.que === 'carta') {
    abrir('📬 Carta de Robi');
    body.innerHTML = `<div class="nota"><span class="chinche"></span><h3><span class="ic">🤖</span>Querida amiga:</h3><p>${esc(ev.texto)}</p>
      <div class="acciones"><span class="pago">Tu amigo, Robi</span><button class="voz" data-leer="1">🔊 Escuchar</button></div></div>` +
      `<p class="pregunta">${esc(ev.pregunta)}</p><div class="opciones">` + mezclar(ev.opciones).map(o => `<button data-carta="${esc(o)}">${esc(o)}</button>`).join('') + '</div>' +
      (ev.racha ? `<p class="racha">🔥 Llevas ${ev.racha} ${ev.racha === 1 ? 'día' : 'días'} seguidos leyendo. ¡Hoy suma más!</p>` : '');
  }
});

body.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !vista) return;
  sfx('pop');
  if (b.dataset.voz) {   // leer la nota en voz alta (cuenta como ayuda en el encargo en curso)
    const e2 = vista.que === 'cartelera' ? (vista.notas || []).find(n => n && n.id === b.dataset.voz) || vista.actual : vista.encargo;
    if (e2) { decir(e2.nota.replace('P.D.:', 'Posdata:')); if (vista.que === 'nota' || (vista.que === 'cartelera' && vista.actual)) usoAyuda(); }
  } else if (b.dataset.leer) decir(vista.texto);
  else if (b.dataset.aceptar) { aceptar(b.dataset.aceptar); cerrar(); cerrarPanel(); }
  else if (b.dataset.dejar) { dejar(); cerrar(); cerrarPanel(); toast('Dejaste el encargo. ¡Hay más en la cartelera!'); }
  else if (b.dataset.op) {
    // marcar las opciones; cuando están todas las que pide, se responde
    const op = b.dataset.op, E = vista.elegidas;
    if (E.includes(op)) { E.splice(E.indexOf(op), 1); b.classList.remove('on'); return; }
    E.push(op); b.classList.add('on');
    if (E.length >= vista.cuantas) {
      if (responder([...E])) cerrar();
      else { body.querySelectorAll('.opciones button.on').forEach(x => { x.classList.remove('on'); x.classList.add('mal'); setTimeout(() => x.classList.remove('mal'), 600); }); vista.elegidas = []; }
    }
  } else if (b.dataset.carta) {
    if (responderCarta(b.dataset.carta)) cerrar();
    else { b.classList.add('mal'); toast('Mmm, no es esa. ¡Lee la carta otra vez!'); }
  }
});
$('#encargoDone').addEventListener('click', () => { sfx('pop'); cerrar(); cerrarPanel(); });
btn.addEventListener('click', () => { sfx('pop'); verNota(); });
