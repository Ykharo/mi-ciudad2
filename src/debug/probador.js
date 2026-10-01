// Probador de prendas (sólo desarrollo: npm run dev → http://localhost:5173/src/debug/probador.html).
// Un personaje con selector de animación y de prenda por espacio del cuerpo, para revisar cada prenda en cada pose.
// También se maneja por la dirección, para fotografiar poses desde las pruebas:
//   ?anim=split&t=1.2&vista=frente|lado|atras|arriba&look=fabrica|azar|amiga|amigo&seed=7&sin=pelo&con=piernas:falda_tableada
//   &dist=1.6&mira=1.8   (cámara más cerca, mirando a esa altura en metros: para revisar la cabeza y los accesorios)
//   &forma=redonda:1     (formas de cabeza del look)
//   &fov=8&dist=12       (casi sin perspectiva, como las vistas ortográficas de las hojas de referencia)
// Para comparar con las hojas de referencias/ropa/: modo "Dos vistas lado a lado" (frente y lado), pose de reposo,
// "Casi sin perspectiva", encuadre de cuerpo o cabeza, y en "Referencias" la hoja encima de cada vista (referencias.js).
import { THREE } from '../engine/three.js';
import { seeded } from '../core/math.js';
import { SUN_OFF, camera, fill, renderer, scene, sun } from '../engine/renderer.js';
import { loadCharacters, makeAvatar, NINA } from '../characters/avatar.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { PRENDAS, SLOTS } from '../characters/catalog/prendas.js';
import { LOOK_NINA, PERSONAJES } from '../characters/catalog/personajes.js';
import { randomLook } from '../characters/looks.js';
import { ponerPrenda, quitarPrenda, recolorear } from '../characters/wardrobe.js';
import { crearReferencias } from './referencias.js';

const q = new URLSearchParams(location.search), $ = s => document.querySelector(s);
const copia = o => JSON.parse(JSON.stringify(o));
scene.background = new THREE.Color(0xDDF3FF);
const suelo = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshStandardMaterial({ color: 0xF1E9DD }));
suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
sun.position.copy(SUN_OFF); sun.target.position.set(0, 0, 0);   // como en el juego (game/camera.js), con Nina al centro

let look = q.get('look') === 'azar' ? randomLook(seeded(Math.imul(+(q.get('seed') || 1), 2654435761) >>> 0))   /* (semilla mezclada: con semillas seguidas el generador da primeros números casi iguales) */ : copia((PERSONAJES[q.get('look')] || {}).look || LOOK_NINA);
for (const s of (q.get('sin') || '').split(',').filter(Boolean)) delete look.prendas[s];
for (const par of (q.get('con') || '').split(',').filter(Boolean)) { const [s, id] = par.split(':'); look.prendas[s] = { id }; }
for (const par of (q.get('forma') || '').split(',').filter(Boolean)) { const [f, v] = par.split(':'); (look.formas = look.formas || {})[f] = +(v ?? 1); }
await loadCharacters([look, ...PRENDAS.map(p => ({ prendas: { [p.slot]: { id: p.id } } }))]);
let ch = makeAvatar(look);

// pose de reposo: los huesos como vienen en el modelo (se guardan antes de la primera animación)
const reposo = [];
ch.model.traverse(o => { if (o.isBone) reposo.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone()]); });

// Vistas. "libre": una cámara que gira arrastrando (rueda para acercar). "doble": dos vistas fijas lado a lado (frente
// y lado, como las hojas de referencia), mirando derecho; la rueda acerca y arrastrar sube o baja.
const VISTAS = { frente: 0, lado: Math.PI / 2, atras: Math.PI, arriba: 0.6 };
const VISTAS_DOBLE = {
  frente: { nombre: 'Frente', yaw: 0 }, lado: { nombre: 'Lado (mira a la derecha)', yaw: -Math.PI / 2 },
  ladoIzq: { nombre: 'Lado (mira a la izquierda)', yaw: Math.PI / 2 }, atras: { nombre: 'Atrás', yaw: Math.PI },
  tres: { nombre: 'Tres cuartos', yaw: -Math.PI / 4 },
};
const orb = { yaw: VISTAS[q.get('vista')] ?? 0.4, pitch: q.get('vista') === 'arriba' ? 0.9 : 0.15, dist: +(q.get('dist') || 4.2) };
let mira = q.get('mira') == null ? null : +q.get('mira');
const doble = { H: 2.6, mira: 1.15 };   // alto visible (m) y altura del centro de las dos vistas
let modo = 'libre';
const FOV_ORTO = 6, FOV_DOBLE = 30;
const orto = () => $('#orto').checked;
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => { drag = null; });
addEventListener('pointermove', e => {
  if (!drag) return;
  if (modo === 'doble') doble.mira += (e.clientY - drag[1]) * doble.H / innerHeight;
  else { orb.yaw -= (e.clientX - drag[0]) * 0.01; orb.pitch = Math.max(-0.3, Math.min(1.4, orb.pitch + (e.clientY - drag[1]) * 0.01)); }
  drag = [e.clientX, e.clientY];
});
renderer.domElement.addEventListener('wheel', e => {
  if (modo === 'doble') doble.H = Math.max(0.2, Math.min(4, doble.H * (1 + e.deltaY * 0.001)));
  else orb.dist = Math.max(0.5, Math.min(10, orb.dist * (1 + e.deltaY * 0.001)));
}, { passive: true });
for (const id of ['vistaIzq', 'vistaDer']) $('#' + id).innerHTML = Object.entries(VISTAS_DOBLE).map(([k, v]) => `<option value="${k}">${v.nombre}</option>`).join('');
$('#vistaIzq').value = 'frente'; $('#vistaDer').value = 'lado';

// referencias encima de las vistas (ver referencias.js)
const refs = crearReferencias($('#refs'), [
  { id: 'libre', nombre: 'Vista', recorte: 'frontal' },
  { id: 'izq', nombre: 'Vista izquierda', recorte: 'frontal' },
  { id: 'der', nombre: 'Vista derecha', recorte: 'lateral' },
]);
$('#modo').addEventListener('change', e => {
  modo = e.target.value; $('#dobleOps').hidden = modo !== 'doble';
  if (modo === 'doble') { $('#orto').checked = true; encuadrar('cuerpo'); }
  ayudaVista();
});
$('#orto').addEventListener('change', ayudaVista);
function ayudaVista() {
  $('#vistaAyuda').textContent = modo === 'doble' ? 'Rueda: acercar. Arrastrar: subir o bajar. Las dos vistas miran derecho al personaje.' : '';
}
// Encuadre: el cuerpo (o la cabeza) ocupa el 90 % del alto de la vista, igual que los recortes de las hojas: así la
// referencia queda casi calzada y "Alinear con 4 toques" afina.
function encuadrar(que) {
  const k = ch.k, cab = ch.look.cabeza || 1, yCab = y => (1.237 + (y - 1.237) * cab) * k;   // la cabeza crece desde su hueso
  const [abajo, arriba] = que === 'cabeza' ? [yCab(1.146), yCab(1.508)] : [0, yCab(1.508)];
  const H = (arriba - abajo) / 0.9, centro = (abajo + arriba) / 2;
  doble.H = H; doble.mira = centro;
  mira = centro; orb.pitch = 0; orb.dist = H / (2 * Math.tan((orto() ? FOV_ORTO : +(q.get('fov') || 40)) * Math.PI / 360));
  const lateral = ['lado', 'ladoIzq'].includes($('#vistaDer').value);
  refs.recortar('libre', que === 'cabeza' ? 'cabeza' : 'frontal');
  refs.recortar('izq', que === 'cabeza' ? 'cabeza' : 'frontal');
  if (lateral) refs.recortar('der', que === 'cabeza' ? 'cabeza de lado' : 'lateral');
}
$('#encCuerpo').addEventListener('click', () => encuadrar('cuerpo'));
$('#encCabeza').addEventListener('click', () => encuadrar('cabeza'));
// ocultar el panel (tecla P): las vistas usan toda la pantalla
const panelEl = $('#panel');
function verPanel(v) { panelEl.hidden = !v; $('#abrirPanel').hidden = v; }
$('#cerrarPanel').addEventListener('click', () => verPanel(false));
$('#abrirPanel').addEventListener('click', () => verPanel(true));
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'p' && !e.target.closest('input, select')) verPanel(panelEl.hidden); });

// animaciones: las de locomoción se ven con la velocidad; las demás, en bucle
const LOCO = ['idle', 'walk', 'run'];
const animSel = $('#anim'), velEl = $('#vel'), pausaEl = $('#pausa');
animSel.innerHTML = Object.keys(NINA.clips).map(n => `<option>${n}</option>`).join('');
function ponerAnim() {
  const n = animSel.value, clip = NINA.clips[n];
  pausaEl.max = clip.duration.toFixed(2);
  if (LOCO.includes(n)) { avatarStop(ch, true); velEl.value = { idle: 0, walk: 1.2, run: 4.5 }[n]; }
  else { velEl.value = 0; avatarDo(ch, n, { loop: true, instant: true }); }
}
animSel.addEventListener('change', ponerAnim);

// prendas por espacio del cuerpo
$('#prendas').innerHTML = SLOTS.map(s => `<label for="p-${s}">${s}</label><select id="p-${s}" data-slot="${s}"><option value="">(nada)</option>` +
  PRENDAS.filter(p => p.slot === s).map(p => `<option value="${p.id}">${p.nombre}</option>`).join('') + '</select>').join('');
const syncSelects = () => SLOTS.forEach(s => { $('#p-' + s).value = (ch.look.prendas[s] || {}).id || ''; });
$('#prendas').addEventListener('change', async e => {
  const slot = e.target.dataset.slot, id = e.target.value;
  if (id) await ponerPrenda(ch, slot, { id, ...(look.prendas[slot] && look.prendas[slot].id === id ? look.prendas[slot] : {}) });
  else quitarPrenda(ch, slot);
  info();
});
// un vecino al azar (prendas y colores, como en la ciudad; la estatura y la cabeza se quedan)
$('#azar').addEventListener('click', async () => {
  const l = randomLook(); l.escala = ch.look.escala; l.cabeza = ch.look.cabeza;
  for (const s of SLOTS) { if (l.prendas[s]) await ponerPrenda(ch, s, l.prendas[s]); else quitarPrenda(ch, s); }
  recolorear(ch, l); info();
});
$('#fabrica').addEventListener('click', () => { recolorear(ch, copia(LOOK_NINA)); info(); });
function info() {
  let v = 0, m = new Set();
  ch.model.traverse(o => { if (o.isMesh) { v += o.geometry.attributes.position.count; [].concat(o.material).forEach(x => m.add(x)); } });
  $('#info').textContent = `${v} vértices · ${m.size} materiales · prendas: ${Object.values(ch.prendas).map(p => p.id).join(', ') || 'ninguna'}`;
  syncSelects();
}

if (q.get('anim')) animSel.value = q.get('anim');
ponerAnim(); info();
const pausa = q.get('t');
if (pausa != null) pausaEl.value = pausa;

// dibujar: cada vista en su parte de la pantalla (a la derecha del panel, si se ve)
function resize() { renderer.setSize(innerWidth, innerHeight, false); }
addEventListener('resize', resize); resize();
renderer.setClearColor(0xDDF3FF, 1);
const rotulos = { izq: document.createElement('div'), der: document.createElement('div') };
for (const r of Object.values(rotulos)) { r.className = 'rotulo'; document.body.appendChild(r); }
function areas() {
  // (el panel es position: fixed, así que offsetParent no sirve para saber si se ve)
  const seVe = !panelEl.hidden && getComputedStyle(panelEl).display !== 'none';
  const x0 = seVe ? Math.round(panelEl.getBoundingClientRect().right) + 10 : 0, W = innerWidth - x0, H = innerHeight;
  if (modo !== 'doble') return { libre: { x: x0, y: 0, w: W, h: H } };
  const w = Math.floor(W / 2);
  return { izq: { x: x0, y: 0, w, h: H }, der: { x: x0 + w, y: 0, w: W - w, h: H } };
}
let areasAntes = '';
function vista(r, yaw, pitch, dist, cy, fov) {
  camera.fov = fov; camera.aspect = r.w / r.h; camera.updateProjectionMatrix();
  camera.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, cy + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(0, cy, 0);
  fill.position.set(camera.position.x, camera.position.y + 3, camera.position.z); fill.target.position.set(0, cy, 0); fill.intensity = 0.3;
  const y = innerHeight - r.y - r.h;
  renderer.setViewport(r.x, y, r.w, r.h); renderer.setScissor(r.x, y, r.w, r.h);
  renderer.render(scene, camera);
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = +pausaEl.value, quieto = t > 0 || pausa != null;
  if (quieto && ch.sp) { ch.sp.a.time = t; ch.sp.w = 1; }
  updateAvatar(ch, quieto ? 0 : dt, +velEl.value, null);
  if ($('#reposo').checked) for (const [b, p, qt, s] of reposo) { b.position.copy(p); b.quaternion.copy(qt); b.scale.copy(s); }
  const A = areas(), clave = JSON.stringify(A);
  if (clave !== areasAntes) { areasAntes = clave; refs.ubicar(A); }
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.clear();
  renderer.setScissorTest(true);
  if (modo === 'doble') {
    const fov = orto() ? FOV_ORTO : FOV_DOBLE, dist = doble.H / (2 * Math.tan(fov * Math.PI / 360));
    for (const [id, sel] of [['izq', '#vistaIzq'], ['der', '#vistaDer']]) {
      const V = VISTAS_DOBLE[$(sel).value];
      vista(A[id], V.yaw, 0, dist, doble.mira, fov);
      Object.assign(rotulos[id].style, { left: A[id].x + 8 + 'px', top: '8px', display: '' }); rotulos[id].textContent = V.nombre;
    }
  } else {
    const fov = orto() ? FOV_ORTO : +(q.get('fov') || 40);
    // con "casi sin perspectiva" la cámara se aleja lo justo para ver lo mismo
    const dist = orto() ? orb.dist * Math.tan(20 * Math.PI / 180) / Math.tan(FOV_ORTO * Math.PI / 360) : orb.dist;
    vista(A.libre, orb.yaw, orb.pitch, dist, mira ?? 0.9 * ch.k / 1.4, fov);
    for (const r of Object.values(rotulos)) r.style.display = 'none';
  }
}
requestAnimationFrame(frame);
window.__probador = { listo: true, ch, orb };   // orb: la cámara (yaw, pitch, dist), para fotos exactas
