// Joystick en pantalla.
import { state } from '../core/state.js';
import { on } from '../core/events.js';
import { INPUT_LENTO, input } from '../game/actors.js';
import { $ } from './dom.js';

const joy = $('#joy'), knob = $('#joyKnob'), joyHint = $('#joyHint');
state.joyId = null; const joyC = { x: 0, y: 0, r: 88 };

// Dos zonas (medidas del centro de la perilla, en fracciones del radio del círculo: sirven en cualquier pantalla):
// - mientras la perilla está entera adentro del círculo punteado: lento (Nina camina, el auto va despacio);
// - cuando entra al anillo blanco: rápido (Nina corre, el auto acelera hasta su máximo).
// En el CSS la perilla mide 0,32 del radio (32 % del ancho) y el punteado está en 0,78 del radio (inset 11 %):
// LENTO + 0,32 = 0,78, o sea, la zona lenta termina justo cuando el borde de la perilla toca el punteado.
const MUERTO = 0.08, LENTO = 0.46, BORDE = 0.75;   // quieto / fin de la zona lenta / lo más lejos que llega la perilla
const MIN_LENTO = 0.1, MAX_LENTO = INPUT_LENTO;  // 0,27 × 4,8 m/s ≈ 1,3 m/s: donde Nina empieza a correr
function magnitud(d) {
  const r = joyC.r;
  if (d <= MUERTO * r) return 0;
  if (d <= LENTO * r) return MIN_LENTO + (MAX_LENTO - MIN_LENTO) * (d - MUERTO * r) / ((LENTO - MUERTO) * r);
  return Math.min(1, MAX_LENTO + (1 - MAX_LENTO) * (d - LENTO * r) / ((BORDE - LENTO) * r));
}
const perilla = { dx: 0, dy: 0 };   // dónde quedó la perilla respecto del centro (px)
// pone la perilla en (dx, dy) y calcula la entrada: dirección × magnitud según la distancia al centro
function ponerPerilla(dx, dy) {
  const d = Math.hypot(dx, dy), JR = BORDE * joyC.r;
  if (d > JR) { dx *= JR / d; dy *= JR / d; }
  const m = magnitud(Math.min(d, JR)), n = Math.hypot(dx, dy);
  input.jx = n > 0 ? dx / n * m : 0; input.jy = n > 0 ? dy / n * m : 0;
  perilla.dx = dx; perilla.dy = dy;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function moveJoy(e) { ponerPerilla(e.clientX - joyC.x, e.clientY - joyC.y); }
// Palanca fija al manejar ("control crucero", como el teclado): al soltar la perilla manejando, vuelve al centro en
// horizontal (ruedas rectas) pero se queda a la misma altura (misma velocidad, adelante o atrás), y el auto sigue
// derecho. Se suelta con doble toque en la bola, con el freno (soltarPalanca), llevándola al centro, al bajarse del
// auto o al abrir un panel. Caminando, la perilla vuelve al centro como siempre.
// Para apagarla: PALANCA_FIJA = false.
const PALANCA_FIJA = true;
// Doble toque = dos toques cortos sobre la bola fija (menos de 0,3 s y casi sin arrastrar), con menos de 0,4 s entre
// ellos. Un arrastre no cuenta como primer toque: se puede agarrar la bola apenas se soltó sin que se suelte.
const DOBLE_TOQUE_MS = 400, TOQUE_CORTO_MS = 300, TOQUE_QUIETO_PX = 10;
let fija = false, ultimoToque = 0, avisosFija = 0, avisoTimer = 0;
const apretada = { t: 0, x: 0, y: 0, sobreBola: false };   // cómo empezó el toque actual
function centrar() {
  input.jx = input.jy = 0; perilla.dx = perilla.dy = 0; knob.style.transform = 'translate(-50%,-50%)';
  fija = false; knob.classList.remove('fija');
}
function soltarPalanca() { if (fija) centrar(); }
function aviso(texto, ms) {
  joyHint.textContent = texto; joyHint.hidden = false;
  clearTimeout(avisoTimer); avisoTimer = setTimeout(() => { joyHint.hidden = true; }, ms);
}

joy.addEventListener('pointerdown', e => {
  e.preventDefault();
  const k = knob.getBoundingClientRect();
  Object.assign(apretada, { t: e.timeStamp, x: e.clientX, y: e.clientY,
    sobreBola: fija && Math.hypot(e.clientX - (k.left + k.width / 2), e.clientY - (k.top + k.height / 2)) < k.width * 0.75 });
  if (fija) {
    // segundo toque corto sobre la bola fija: se suelta y vuelve al centro
    if (apretada.sobreBola && e.timeStamp - ultimoToque < DOBLE_TOQUE_MS) { ultimoToque = 0; centrar(); return; }
    fija = false; knob.classList.remove('fija');   // el dedo vuelve a mandar
  }
  knob.classList.remove('volviendo');              // al arrastrar, la perilla sigue al dedo sin demora
  state.joyId = e.pointerId; try { joy.setPointerCapture(state.joyId); } catch (_) { }
  const r = joy.getBoundingClientRect(); joyC.x = r.left + r.width / 2; joyC.y = r.top + r.height / 2; joyC.r = joy.clientWidth / 2; moveJoy(e);   // radio sin el borde, como el inset del CSS
  joyHint.hidden = true;
});
joy.addEventListener('pointermove', e => { if (e.pointerId === state.joyId) moveJoy(e); });
const endJoy = e => {
  if (e.pointerId !== state.joyId) return; state.joyId = null;
  // ¿fue un toque corto sobre la bola fija? entonces puede ser el primero de un doble toque
  const corto = apretada.sobreBola && e.timeStamp - apretada.t < TOQUE_CORTO_MS && Math.hypot(e.clientX - apretada.x, e.clientY - apretada.y) < TOQUE_QUIETO_PX;
  ultimoToque = corto ? e.timeStamp : 0;
  if (PALANCA_FIJA && state.mode === 'drive' && (input.jx || input.jy)) {   // manejando y fuera del centro:
    knob.classList.add('volviendo');                                        // en horizontal vuelve al centro (suave)
    ponerPerilla(0, perilla.dy);
    setTimeout(() => knob.classList.remove('volviendo'), 450);
    if (!input.jy) { centrar(); return; }                                   // estaba casi a la altura del centro
    fija = true; knob.classList.add('fija');
    if (avisosFija < 2) { avisosFija++; aviso('Toca 2 veces la bola para soltar', 2500); }
    return;
  }
  centrar();
};
joy.addEventListener('pointerup', endJoy); joy.addEventListener('pointercancel', endJoy);

// Controles de giro (sólo al manejar): sobre el anillo blanco, a la izquierda y a la derecha, en el tercio central de
// cada costado. Mientras se aprietan giran el volante como las flechas del teclado, sin tocar la velocidad ni la
// perilla. Se dibujan en SVG con el radio del círculo = 1: una veladura suave y una flecha sencilla; la zona para
// tocar es más grande que el dibujo, para que sea fácil acertar con el dedo.
const pol = (r, a) => `${(r * Math.cos(a)).toFixed(4)} ${(r * Math.sin(a)).toFixed(4)}`;
const sector = (r1, r2, a0, a1) => `M${pol(r2, a0)} A${r2} ${r2} 0 0 1 ${pol(r2, a1)} L${pol(r1, a1)} A${r1} ${r1} 0 0 0 ${pol(r1, a0)}Z`;
function giroSVG(lado) {   // lado: -1 izquierda, 1 derecha
  const c = lado < 0 ? Math.PI : 0, g = Math.PI / 180, x = lado * 0.89, p = lado * 0.035;
  return `<g class="giro" data-giro="${lado}">` +
    `<path class="velo" d="${sector(0.81, 0.97, c - 30 * g, c + 30 * g)}"/>` +
    `<path class="flecha" d="M${(x - p).toFixed(3)} -0.075 L${(x + p).toFixed(3)} 0 L${(x - p).toFixed(3)} 0.075"/>` +
    `<path class="toque" d="${sector(0.68, 1.18, c - 40 * g, c + 40 * g)}"/></g>`;
}
joy.insertAdjacentHTML('beforeend', `<svg class="giros" viewBox="-1 -1 2 2" aria-hidden="true">${giroSVG(-1)}${giroSVG(1)}</svg>`);
const giros = [...joy.querySelectorAll('.giro')];
function soltarGiros() { input.giro = 0; giros.forEach(g => g.classList.remove('on')); }
for (const g of giros) {
  const lado = +g.dataset.giro, toque = g.querySelector('.toque');
  toque.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();   // no mueve la perilla
    try { toque.setPointerCapture(e.pointerId); } catch (_) { }
    input.giro = lado; g.classList.add('on');
  });
  const parar = () => { if (input.giro === lado) input.giro = 0; g.classList.remove('on'); };
  toque.addEventListener('pointerup', parar); toque.addEventListener('pointercancel', parar);
}

// Velocímetro en el círculo (sólo al manejar; se muestra con #game.driving). El evento 'motor' llega cada cuadro con
// la rapidez en m/s: se escribe sólo cuando cambia la cifra.
const velEl = $('#joySpeed b');
let velMostrada = -1;
function mostrarVelocidad(ms) {
  const kmh = Math.round(ms * 3.6);
  if (kmh !== velMostrada) { velMostrada = kmh; velEl.textContent = kmh; }
}
on('motor', mostrarVelocidad);

// al abrir un panel el joystick se suelta (el juego ya soltó la entrada y el dedo)
on('menu', abierto => { if (abierto) { centrar(); soltarGiros(); } });
on('auto', que => {
  if (que === 'bajar') { centrar(); soltarGiros(); return; }   // si quedó fija, que Nina no salga caminando
  mostrarVelocidad(0);
  aviso('¡Maneja aquí!', 3500);                 // al subirse, recordar dónde se maneja
});

export { soltarPalanca };
