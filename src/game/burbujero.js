// El burbujero (juguete de la Mascotienda): si alguna mascota lo tiene, aparece el botón 🫧 Hacer burbujas
// (ui/pelota.js, evento 'burbujero'). Nina sopla burbujas delante de ella, que bajan flotando despacio; su mascota corre
// de una en una, salta y las revienta. Al terminar (o a los 20 s) vuelve a la fila. Divierte (sube su diversión).
// Mientras persigue, la mascota no sigue la fila (`p.busca`, como con la pelota: main.js).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide, sueloSuave } from '../world/physics.js';
import { avatarDo } from '../characters/animator.js';
import { animatePet } from '../pets/models.js';
import { estallido } from '../pets/efectos.js';
import { player } from './actors.js';

const CUANTAS = 7, CORRE = 6;
let J = null, visible = null, geo = null;
const tiene = p => !!(p.cosas && p.cosas.includes('burbujero'));
const quien = () => player.pets.find(p => tiene(p) && !p.busca) || null;
const puede = () => state.mode === 'play' && !player.seat && !player.air && !J && !!quien();

export function hacerBurbujas(cual) {
  if (!puede()) return false;
  const p = cual && tiene(cual) && !cual.busca ? cual : quien();
  geo = geo || new THREE.SphereGeometry(1, 16, 12);
  J = { p, t: 0, salen: 0, burbujas: [], meta: null, salto: 0, revento: 0 };
  p.busca = true;
  avatarDo(player.ch, 'wave', { start: 0.2, ts: 1.2 });
  return true;
}
function soplar() {   // una burbuja nueva delante de Nina, a la altura de su cara, que se aleja y baja flotando
  const f = player.facing + (Math.random() - 0.5) * 1.4, d = 0.6;
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xDFF6FF, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x9FE3FF, emissiveIntensity: 0.3, depthWrite: false }));
  const r = 0.14 + Math.random() * 0.08; m.scale.setScalar(r);
  m.position.set(player.pos.x + Math.sin(f) * d, player.y + 1.7, player.pos.z + Math.cos(f) * d); scene.add(m);
  J.burbujas.push({ m, r, v: new THREE.Vector3(Math.sin(f) * (0.9 + Math.random() * 0.8), -0.18, Math.cos(f) * (0.9 + Math.random() * 0.8)), fase: Math.random() * 6 });
  emit('sonido', 'pop');
}
function reventar(b) {
  estallido(b.m.position, b.r); emit('sonido', 'pop');
  scene.remove(b.m); b.m.material.dispose(); J.burbujas.splice(J.burbujas.indexOf(b), 1); J.revento++;
}
function terminar() {
  if (!J) return;
  J.burbujas.forEach(b => { scene.remove(b.m); b.m.material.dispose(); });
  J.p.busca = false;
  if (J.revento && J.p.estado) { J.p.estado.diversion = Math.min(100, J.p.estado.diversion + 3 * J.revento); emit('aviso', `🫧 ¡${J.p.name} reventó ${J.revento} burbujas!`); }
  J = null;
}

export function updateBurbujero(dt) {
  const ver = puede();
  if (ver !== visible) { visible = ver; emit('burbujero', { visible: ver }); }
  if (!J) return;
  const p = J.p;
  if (!player.pets.includes(p) || state.mode !== 'play' || (J.t += dt) > 20) { terminar(); return; }
  // sopla una cada 0,35 s
  if (J.salen < CUANTAS && J.t > 0.3 + J.salen * 0.35) { soplar(); J.salen++; }
  // las burbujas: se alejan frenando, bajan despacio bamboleándose; si llegan al suelo, revientan solas
  for (const b of [...J.burbujas]) {
    b.v.x *= 1 - dt * 0.6; b.v.z *= 1 - dt * 0.6;
    b.m.position.addScaledVector(b.v, dt); b.m.position.x += Math.sin(J.t * 2 + b.fase) * dt * 0.15;
    if (b.m.position.y < 0.15) reventar(b);
  }
  // la mascota corre a la más cercana, salta cuando la tiene encima y la revienta
  let meta = null, dm = Infinity;
  for (const b of J.burbujas) { const d = Math.hypot(b.m.position.x - p.pos.x, b.m.position.z - p.pos.z); if (d < dm) { dm = d; meta = b; } }
  let v = 0;
  if (meta) {
    const dx = meta.m.position.x - p.pos.x, dz = meta.m.position.z - p.pos.z;
    if (dm > 0.15) { const st = Math.min(dm, CORRE * dt); p.pos.x += dx / dm * st; p.pos.z += dz / dm * st; v = st / Math.max(dt, 1e-4); }
    p.facing += Math.atan2(Math.sin(Math.atan2(dx, dz) - p.facing), Math.cos(Math.atan2(dx, dz) - p.facing)) * Math.min(1, dt * 10);
    if (dm < 0.7 && J.salto <= 0) J.salto = 0.45;   // ¡salta!
    const alcance = p.obj.root.scale.x * 1.1 + 0.55;  // hasta dónde llega con el salto
    if (dm < 0.45 && J.salto > 0 && meta.m.position.y < alcance) reventar(meta);
  } else if (J.salen >= CUANTAS) { terminar(); return; }
  collide(p.pos, 0.3);
  let y = 0;
  if (J.salto > 0) { J.salto -= dt; y = Math.sin(Math.PI * (1 - J.salto / 0.45)) * 0.5; }
  p.obj.root.position.set(p.pos.x, y + sueloSuave(p, p.pos.x, p.pos.z, dt), p.pos.z); p.obj.root.rotation.y = p.facing;
  animatePet(p.obj, state.clock, Math.min(3, v / 5), dt, false);
}
