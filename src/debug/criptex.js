// Prototipo del criptex del "Código Aura" (sólo desarrollo: npm run dev → http://localhost:5173/src/debug/criptex.html,
// y desde el iPad con la IP del PC). Nina baila en una tarima, la cámara la mira desde abajo y delante flota el criptex
// (ui/criptex3d.js); arriba, la ventana con las 3 palabras y el tiempo. Acertar abre el criptex y trae otro código;
// equivocarse marca qué anillo está mal; si se acaba el tiempo, muestra la respuesta.
// Se maneja también por la dirección: ?toma=abajo|cerca|orbita&figuras=3..6&silabas=1&tiempo=30&semilla=N
import { THREE } from '../engine/three.js';
import { seeded } from '../core/math.js';
import { SUN_OFF, camera, renderer, scene, sun } from '../engine/renderer.js';
import { loadCharacters, makeAvatar } from '../characters/avatar.js';
import { avatarDo, updateAvatar } from '../characters/animator.js';
import { LOOK_NINA } from '../characters/catalog/personajes.js';
import { nuevoCodigo } from '../game/codigoAura.js';
import { crearCriptex } from '../ui/criptex3d.js';
import { efectoAura } from '../engine/efectoAura.js';

const q = new URLSearchParams(location.search), $ = s => document.querySelector(s);
const azar = q.has('semilla') ? seeded(+q.get('semilla')) : Math.random;
const TIEMPO = +(q.get('tiempo') || 30);
if (q.get('toma')) $('#toma').value = q.get('toma');
if (q.get('figuras')) $('#figuras').value = q.get('figuras');
$('#silabas').checked = q.get('silabas') === '1';

// ---- el escenario: cielo, una tarima con focos chicos y Nina bailando ----
scene.background = new THREE.Color(0x9FD4FF); scene.fog = new THREE.Fog(0x9FD4FF, 20, 60);
scene.add(camera);   // (el criptex va colgado de la cámara)
const suelo = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0xF6D6F2 }));
suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
const tarima = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.5, 48), new THREE.MeshStandardMaterial({ color: 0x5B4A9A }));
tarima.position.y = 0.25; tarima.receiveShadow = true; scene.add(tarima);
const bombilla = new THREE.MeshStandardMaterial({ color: 0xFFF3C4, emissive: 0xFFD66B, emissiveIntensity: 0.8 });
for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), bombilla); b.position.set(Math.cos(a) * 5.08, 0.56, Math.sin(a) * 5.08); scene.add(b); }
const pantalla = new THREE.Mesh(new THREE.BoxGeometry(11, 6.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x231C3D }));
pantalla.position.set(0, 4.7, -6.2); scene.add(pantalla);
sun.position.copy(SUN_OFF); sun.target.position.set(0, 0, 0);
await loadCharacters([LOOK_NINA]);
const nina = makeAvatar(JSON.parse(JSON.stringify(LOOK_NINA)));
nina.root.position.set(0, 0.5, 0);
const BAILES = ['aura', 'griddy', 'floss', 'fresh', 'seis_siete', 'dance'];
let baile = 0, cambio = 0;
avatarDo(nina, BAILES[0], { loop: true, instant: true });

// ---- cámara: tres tomas, con transición suave ----
const camPos = new THREE.Vector3(0.6, 2.2, 3.4), camLook = new THREE.Vector3(0, 1.7, 0), _p = new THREE.Vector3(), _l = new THREE.Vector3();
function toma(t) {
  const v = $('#toma').value;
  if (v === 'abajo') { _p.set(0.55, 0.78, 2.35); _l.set(0, 2.0, 0); }
  else if (v === 'cerca') { _p.set(0.6, 2.3, 3.6); _l.set(0, 1.7, 0); }
  else { const a = t * 0.35; _p.set(Math.sin(a) * 3.6, 1.9, Math.cos(a) * 3.6); _l.set(0, 1.5, 0); }
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 64 : 52; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---- el código (game/codigoAura.js) ----
const codigoNuevo = () => nuevoCodigo({ figuras: +$('#figuras').value, azar });

// ---- la ventana del código ----
const ventana = $('#codigo'), spans = [...document.querySelectorAll('#codigo .palabra')], msg = $('#codigo .msg');
function mostrarPalabras(cod) {
  spans.forEach((s, i) => {
    const p = cod.palabras[i];
    s.className = 'palabra';
    s.innerHTML = $('#silabas').checked ? p.silabas.map((x, j) => (j ? '<span class="sil">·</span>' : '') + x).join('') : p.palabra;
  });
  msg.textContent = '';
}
// las columnas de las palabras, alineadas con los anillos del criptex
function alinear() {
  if (!criptex || !criptex.vivo()) return;
  // (columnas al menos de 190 px: así una palabra larga como "helicóptero" se lee grande; cada una con su tamaño)
  const xs = criptex.enPantalla().map(x => x * innerWidth), col = Math.min(innerWidth / 3 - 8, Math.max(190, xs[2] - xs[1]));
  ventana.style.width = (col * 3) + 'px'; ventana.style.left = xs[1] + 'px';
  spans.forEach(s => { s.style.fontSize = Math.max(26, Math.min(40, (col - 14) / (s.textContent.length * 0.56))) + 'px'; });
}
const reloj$ = $('#tiempo'), cifra = $('#tiempo b');
function mostrarTiempo(s) {
  reloj$.style.setProperty('--p', Math.max(0, s) / TIEMPO);
  cifra.textContent = Math.max(0, Math.ceil(s));
  reloj$.classList.toggle('apurado', estado === 'jugando' && s <= 5);
}

// ---- jugar ----
let criptex = null, codigo = null, quedan = TIEMPO, estado = 'jugando';
const auras = [];
function empezar() {
  if (criptex) criptex.quitar();
  codigo = codigoNuevo(); quedan = TIEMPO; estado = 'jugando';
  mostrarPalabras(codigo);
  criptex = crearCriptex({ camera, dom: renderer.domElement, anillos: codigo.anillos, alConfirmar: confirmar });
}
function confirmar() {
  if (estado !== 'jugando') return;
  const res = criptex.elegidos().map((id, i) => id === codigo.palabras[i].id);
  spans.forEach((s, i) => { s.classList.toggle('bien', res[i]); s.classList.toggle('mal', !res[i]); });
  if (res.every(Boolean)) {
    estado = 'abriendo'; msg.textContent = '✨ ¡Código correcto! ✨';
    // (en el juego los puntos dependerán de la rapidez; aquí, de ejemplo) y el aura sube por Nina: dorada si acertó
    // rápido (con más de la mitad del tiempo), celeste si no
    const rapido = quedan > TIEMPO / 2;
    criptex.abrir(() => setTimeout(empezar, 700), `+${Math.max(100, Math.round(quedan / TIEMPO * 10) * 100)} pts`);
    auras.push(efectoAura(nina.root, { color: rapido ? 'dorado' : 'celeste', alto: 3.2 }));
  } else {
    criptex.marcar(res);
    msg.textContent = res.filter(Boolean).length ? '¡Casi! Revisa la palabra en rojo' : 'Mira bien cada palabra';
    setTimeout(() => { if (estado === 'jugando') spans.forEach(s => s.classList.remove('mal')); }, 1200);
  }
}
// se acabó el tiempo: los anillos giran hasta la respuesta y viene otro código
function seAcabo() {
  estado = 'respuesta'; msg.textContent = 'Era: ' + codigo.palabras.map(p => p.palabra).join(' · ');
  const caras = criptex.caras();
  codigo.anillos.forEach((figs, i) => {
    const k = figs.findIndex(f => f.id === codigo.palabras[i].id);
    let d = k - caras[i]; if (d > 3) d -= 6; if (d < -3) d += 6;
    criptex.girar(i, d);
  });
  criptex.marcar([true, true, true]);
  setTimeout(empezar, 3000);
}
$('#nuevo').addEventListener('click', empezar);
$('#figuras').addEventListener('change', empezar);
$('#silabas').addEventListener('change', () => mostrarPalabras(codigo));
$('#cerrar').addEventListener('click', () => { $('#panel').hidden = true; $('#abrir').hidden = false; });
$('#abrir').addEventListener('click', () => { $('#panel').hidden = false; $('#abrir').hidden = true; });
empezar();

// ---- cada cuadro ----
let ultimo = performance.now(), reloj = 0;
function cuadro(now) {
  requestAnimationFrame(cuadro);
  const dt = Math.min(0.05, (now - ultimo) / 1000); ultimo = now; reloj += dt;
  if ((cambio += dt) > 6) { cambio = 0; baile = (baile + 1) % BAILES.length; avatarDo(nina, BAILES[baile], { loop: true }); }
  updateAvatar(nina, dt, 0, null);
  toma(reloj);
  const k = 1 - Math.exp(-dt * 2.5); camPos.lerp(_p, k); camLook.lerp(_l, k);
  camera.position.copy(camPos); camera.lookAt(camLook);
  if (estado === 'jugando') { quedan -= dt; if (quedan <= 0) seAcabo(); }
  mostrarTiempo(quedan);
  if (criptex && criptex.vivo()) criptex.update(dt, reloj);
  for (let i = auras.length - 1; i >= 0; i--) if (!auras[i].update(dt)) auras.splice(i, 1);
  renderer.render(scene, camera);
  alinear();
}
requestAnimationFrame(cuadro);

// (para fotos y pruebas)
window.__criptex = { listo: true, codigo: () => codigo, criptex: () => criptex, confirmar, empezar };
