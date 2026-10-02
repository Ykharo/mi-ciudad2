// El contador de Huesitos de Aura 🦴 (arriba a la derecha). Al ganar: un huesito vuela desde el centro de la pantalla
// hasta el contador, el número cuenta hacia arriba, la píldora salta y aparece "+10" con el motivo. (game/huesitos.js
// avisa con el evento 'huesitos' { total, delta, motivo }.)
import { on } from '../core/events.js';
import { sfx } from '../audio/audio.js';
import { $, gameEl } from './dom.js';

const caja = $('#huesitos'), num = caja.querySelector('b');
let visto = 0, meta = 0, anim = 0;

function contar() {
  cancelAnimationFrame(anim);
  const paso = () => {
    const falta = meta - visto;
    if (!falta) return;
    visto += Math.sign(falta) * Math.max(1, Math.ceil(Math.abs(falta) / 12));
    if ((falta > 0 && visto > meta) || (falta < 0 && visto < meta)) visto = meta;
    num.textContent = visto;
    anim = requestAnimationFrame(paso);
  };
  paso();
}

on('huesitos', ({ total, delta, motivo }) => {
  meta = total;
  if (!delta) { visto = total; num.textContent = total; return; }   // al cargar la partida
  if (delta < 0) { contar(); return; }
  // el huesito vuela hasta el contador; al llegar cuenta y salta
  const g = gameEl.getBoundingClientRect(), c = caja.getBoundingClientRect();
  const h = document.createElement('div'); h.className = 'huesito-vuela'; h.textContent = '🦴';
  h.style.left = (g.width / 2 - 20) + 'px'; h.style.top = (g.height * 0.45) + 'px';
  gameEl.appendChild(h);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    h.style.transform = `translate(${c.left - g.left - g.width / 2 + 24}px, ${c.top - g.top - g.height * 0.45 + 2}px) scale(.6) rotate(360deg)`;
    h.style.opacity = '0.4';
  }));
  setTimeout(() => {
    h.remove(); contar();
    caja.classList.remove('salta'); void caja.offsetWidth; caja.classList.add('salta');
    sfx('pop');
    const m = document.createElement('div'); m.className = 'huesito-mas';
    m.innerHTML = `+${delta} 🦴${motivo ? `<small>${motivo}</small>` : ''}`;
    m.style.right = (g.right - c.right + 4) + 'px'; m.style.top = (c.bottom - g.top + 6) + 'px';
    gameEl.appendChild(m); setTimeout(() => m.remove(), 2300);
  }, 900);
});
