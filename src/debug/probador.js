// Probador de prendas (sólo desarrollo: npm run dev → http://localhost:5173/src/debug/probador.html).
// Un personaje con selector de animación y de prenda por espacio del cuerpo, para revisar cada prenda en cada pose.
// También se maneja por la dirección, para fotografiar poses desde las pruebas:
//   ?anim=split&t=1.2&vista=frente|lado|atras|arriba&look=fabrica|azar&seed=7&sin=pelo&con=piernas:falda_tableada
import { THREE } from '../engine/three.js';
import { seeded } from '../core/math.js';
import { SUN_OFF, camera, fill, renderer, scene, sun } from '../engine/renderer.js';
import { loadCharacters, makeAvatar, NINA } from '../characters/avatar.js';
import { avatarDo, avatarStop, updateAvatar } from '../characters/animator.js';
import { PRENDAS, SLOTS } from '../characters/catalog/prendas.js';
import { LOOK_NINA } from '../characters/catalog/personajes.js';
import { fixLook, randomLook } from '../characters/looks.js';
import { ponerPrenda, quitarPrenda, recolorear } from '../characters/wardrobe.js';

const q = new URLSearchParams(location.search), $ = s => document.querySelector(s);
const copia = o => JSON.parse(JSON.stringify(o));
scene.background = new THREE.Color(0xDDF3FF);
const suelo = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshStandardMaterial({ color: 0xF1E9DD }));
suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; scene.add(suelo);
sun.position.copy(SUN_OFF); sun.target.position.set(0, 0, 0);   // como en el juego (game/camera.js), con Nina al centro

let look = q.get('look') === 'azar' ? randomLook(seeded(+(q.get('seed') || 1))) : copia(LOOK_NINA);
for (const s of (q.get('sin') || '').split(',').filter(Boolean)) delete look.prendas[s];
for (const par of (q.get('con') || '').split(',').filter(Boolean)) { const [s, id] = par.split(':'); look.prendas[s] = { id }; }
await loadCharacters([look, ...PRENDAS.map(p => ({ prendas: { [p.slot]: { id: p.id } } }))]);
let ch = makeAvatar(look);

// cámara: órbita arrastrando, rueda para acercar
const VISTAS = { frente: 0, lado: Math.PI / 2, atras: Math.PI, arriba: 0.6 };
const orb = { yaw: VISTAS[q.get('vista')] ?? 0.4, pitch: q.get('vista') === 'arriba' ? 0.9 : 0.15, dist: 4.2 };
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; });
addEventListener('pointerup', () => { drag = null; });
addEventListener('pointermove', e => { if (!drag) return; orb.yaw -= (e.clientX - drag[0]) * 0.01; orb.pitch = Math.max(-0.3, Math.min(1.4, orb.pitch + (e.clientY - drag[1]) * 0.01)); drag = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('wheel', e => { orb.dist = Math.max(1.5, Math.min(10, orb.dist * (1 + e.deltaY * 0.001))); }, { passive: true });

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
$('#azar').addEventListener('click', () => { const l = randomLook(); l.escala = ch.look.escala; l.cabeza = ch.look.cabeza; recolorear(ch, fixLook(l)); info(); });
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

// dibujar
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.fov = 40; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = +pausaEl.value, quieto = t > 0 || pausa != null;
  if (quieto && ch.sp) { ch.sp.a.time = t; ch.sp.w = 1; }
  updateAvatar(ch, quieto ? 0 : dt, +velEl.value, null);
  const cy = 0.9 * ch.k / 1.4;
  camera.position.set(Math.sin(orb.yaw) * Math.cos(orb.pitch) * orb.dist, cy + Math.sin(orb.pitch) * orb.dist, Math.cos(orb.yaw) * Math.cos(orb.pitch) * orb.dist);
  camera.lookAt(0, cy, 0);
  fill.position.set(camera.position.x, camera.position.y + 3, camera.position.z); fill.target.position.set(0, cy, 0); fill.intensity = 0.3;
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.__probador = { listo: true, ch };
