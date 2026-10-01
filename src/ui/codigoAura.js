// El Código Aura en pantalla, mientras compite la jugadora (game/aura.js lo maneja con el evento 'aura'): el criptex 3D
// colgado de la cámara (ui/criptex3d.js) y la ventana con las 3 palabras y el tiempo. La respuesta vuelve al juego con
// responderCodigo(ids); el juego avisa si fue acierto (el criptex se abre con el hechizo y los puntos), error (se
// marcan los anillos y palabras que están mal), tiempo (los anillos giran a la respuesta) o cerrar.
import { on } from '../core/events.js';
import { camera, canvas, scene } from '../engine/renderer.js';
import { animated } from '../engine/loop.js';
import { sfx } from '../audio/audio.js';
import { responderCodigo } from '../game/aura.js';
import { crearCriptex } from './criptex3d.js';
import { $, gameEl } from './dom.js';

const ventana = $('#codigoAura'), spans = [...ventana.querySelectorAll('.palabra')], msg = ventana.querySelector('.msg');
const reloj = ventana.querySelector('.tiempo'), cifra = reloj.querySelector('b');
let criptex = null, palabras = [], anillos = null, ocupado = false;

function cerrar() {
  if (criptex && criptex.vivo()) criptex.quitar();
  criptex = null; ventana.hidden = true; gameEl.classList.remove('codigo');
}
on('aura', ev => {
  if (ev.que === 'codigo') {
    cerrar();
    if (!camera.parent) scene.add(camera);   // (el criptex va colgado de la cámara)
    palabras = ev.palabras; anillos = ev.anillos; ocupado = false;
    spans.forEach((s, i) => { s.className = 'palabra'; s.textContent = palabras[i].palabra; });
    msg.textContent = ''; reloj.classList.remove('apurado');
    criptex = crearCriptex({
      camera, dom: canvas, anillos: ev.anillos,
      alConfirmar: () => { if (!ocupado) responderCodigo(criptex.elegidos()); },
      alGirar: () => sfx('pop'),
    });
    ventana.hidden = false; gameEl.classList.add('codigo');
  } else if (ev.que === 'reloj') {
    reloj.style.setProperty('--p', ev.quedan / ev.total);
    cifra.textContent = Math.ceil(ev.quedan);
    reloj.classList.toggle('apurado', ev.quedan <= 5 && !ocupado);
  } else if (ev.que === 'error' && criptex) {
    criptex.marcar(ev.res);
    spans.forEach((s, i) => { s.classList.toggle('bien', ev.res[i]); s.classList.toggle('mal', !ev.res[i]); });
    msg.textContent = ev.res.some(Boolean) ? '¡Casi! Revisa la palabra en rojo' : 'Mira bien cada palabra';
    setTimeout(() => spans.forEach(s => s.classList.remove('mal')), 1200);
  } else if (ev.que === 'acierto' && criptex) {
    ocupado = true; reloj.classList.remove('apurado');
    spans.forEach(s => { s.classList.remove('mal'); s.classList.add('bien'); });
    msg.textContent = '✨ ¡Código correcto! ✨';
    criptex.abrir(null, ev.puntos);
  } else if (ev.que === 'tiempo' && criptex) {
    ocupado = true; reloj.classList.remove('apurado');
    msg.textContent = 'Era: ' + palabras.map(p => p.palabra).join(' · ');
    // los anillos giran hasta la respuesta (por el camino más corto)
    const caras = criptex.caras();
    ev.correctas.forEach((id, i) => {
      let d = anillos[i].findIndex(f => f.id === id) - caras[i]; if (d > 3) d -= 6; if (d < -3) d += 6;
      criptex.girar(i, d);
    });
    criptex.marcar([true, true, true]);
  } else if (ev.que === 'cerrar') cerrar();
});

// cada cuadro: el criptex flota y gira; las palabras quedan sobre sus anillos
animated.push((t, dt) => {
  if (!criptex || !criptex.vivo()) return;
  criptex.update(dt, t);
  const w = canvas.clientWidth, xs = criptex.enPantalla().map(x => x * w);
  const col = Math.min(w / 3 - 8, Math.max(w < 760 ? 120 : 190, xs[2] - xs[1]));
  ventana.style.width = (col * 3) + 'px'; ventana.style.left = xs[1] + 'px';
  const max = w < 760 ? 28 : 40;
  spans.forEach(s => { s.style.fontSize = Math.max(w < 760 ? 18 : 26, Math.min(max, (col - 14) / (s.textContent.length * 0.56))) + 'px'; });
});
