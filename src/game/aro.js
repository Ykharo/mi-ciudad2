// El aro de circo (juguete de la Mascotienda): si alguna mascota lo tiene, aparece el botón 🎪 Saltar el aro
// (ui/pelota.js, evento 'aro'). Nina pone un aro de luces parado delante de ella y su mascota lo salta tres veces, de
// ida y de vuelta; al final el aro desaparece en una nube mágica. Divierte (sube su diversión).
// Mientras salta, la mascota no sigue la fila (`p.busca`, como con la pelota: main.js).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { RAINBOW } from '../engine/materials.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide, sueloEn } from '../world/physics.js';
import { avatarDo } from '../characters/animator.js';
import { animatePet } from '../pets/models.js';
import { nubeMagica, soltarEstrellita } from '../pets/efectos.js';
import { saltoMascota } from '../pets/ropa.js';
import { player } from './actors.js';

const VECES = 3, CORRE = 5.5, LEJOS = 2.6, CARRERA = 1.9;
let J = null, visible = null;
const tiene = p => !!(p.cosas && p.cosas.includes('aro'));
const quien = () => player.pets.find(p => tiene(p) && !p.busca && !p.enCasa) || null;
const puede = () => state.mode === 'play' && !player.seat && !player.air && !J && !!quien();

// el aro: gajos de colores con ampolletas que cambian de color, sobre dos palos con patas (mide `R` de radio y su
// centro queda a `cy` del suelo)
function hacerAro(R, cy) {
  const g = new THREE.Group(), aro = new THREE.Group(); aro.position.y = cy; g.add(aro);
  RAINBOW.forEach((c, i) => {
    const t = new THREE.Mesh(new THREE.TorusGeometry(R, R * 0.07, 8, 12, Math.PI / 3), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
    t.rotation.z = i * Math.PI / 3; aro.add(t);
  });
  const luces = [];
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, l = new THREE.Mesh(new THREE.SphereGeometry(R * 0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFE45C, emissiveIntensity: 1 }));
    l.position.set(Math.cos(a) * R, Math.sin(a) * R, R * 0.07); aro.add(l); luces.push(l);
  }
  const palo = new THREE.MeshStandardMaterial({ color: 0xF4F4FA, metalness: 0.4, roughness: 0.3 });
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, cy, 8), palo); p.position.set(s * (R + 0.05), cy / 2, 0); g.add(p);
    const pie = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.6), palo); pie.position.set(s * (R + 0.05), 0.025, 0); g.add(pie);
  }
  g.traverse(o => { o.castShadow = true; });
  return { g, aro, luces };
}

export function saltarAro(cual) {
  if (!puede()) return false;
  const p = cual && tiene(cual) && !cual.busca ? cual : quien(), s = p.obj.root.scale.x, M = p.obj.medidas;
  // del tamaño de la mascota: que pase entera (alta = hasta lo alto de la cabeza)
  const alta = ((p.obj.head ? p.obj.head.position.y : M.alto) + (M.cabezaR || 0.25)) * s;
  const R = Math.max(0.35, Math.max(alta, M.largo * s) * 0.6 + 0.12), cy = R + 0.3;
  const f = player.facing, dx = Math.sin(f), dz = Math.cos(f);
  const c = new THREE.Vector3(player.pos.x + dx * LEJOS, 0, player.pos.z + dz * LEJOS); collide(c, R + 0.3);
  const A = hacerAro(R, cy); A.g.position.set(c.x, sueloEn(c.x, c.z), c.z); A.g.rotation.y = f; scene.add(A.g);
  // los dos lados del aro, donde toma impulso
  const lado = k => { const v = new THREE.Vector3(c.x + dx * CARRERA * k, 0, c.z + dz * CARRERA * k); collide(v, 0.3); return v; };
  J = { p, A, c, R, cy, puntos: [lado(-1), lado(1)], fase: 'va', meta: 0, saltos: 0, t: 0, y: 0, alto: cy - M.alto * s * 0.55 };
  p.busca = true;
  avatarDo(player.ch, 'wave', { start: 0.2, ts: 1.4 });
  emit('sonido', 'pop');
  return true;
}
function terminar() {
  if (!J) return;
  nubeMagica(J.A.aro.getWorldPosition(new THREE.Vector3()), J.R * 1.4); emit('sonido', 'magia');
  scene.remove(J.A.g); J.A.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  J.p.busca = false;
  if (J.saltos >= VECES) {
    if (J.p.estado) J.p.estado.diversion = Math.min(100, J.p.estado.diversion + 15);
    emit('aviso', `🎪 ¡Bravo! ¡${J.p.name} saltó ${VECES} veces por el aro!`); emit('sonido', 'adopt');
    avatarDo(player.ch, 'wave', { start: 0.2, ts: 1.4 });
  }
  J = null;
}

export function updateAro(dt) {
  const ver = puede();
  if (ver !== visible) { visible = ver; emit('aro', { visible: ver }); }
  if (!J) return;
  const p = J.p, P = p.obj;
  if (!player.pets.includes(p) || state.mode !== 'play' || (J.t += dt) > 25) { terminar(); return; }
  J.A.luces.forEach((l, i) => l.material.emissive.setHSL((i / J.A.luces.length + J.t * 0.8) % 1, 1, 0.55));
  const meta = J.puntos[J.meta], dx = meta.x - p.pos.x, dz = meta.z - p.pos.z, d = Math.hypot(dx, dz);
  let v = 0;
  if (d > 0.05) { const st = Math.min(d, CORRE * dt); p.pos.x += dx / d * st; p.pos.z += dz / d * st; v = st / Math.max(dt, 1e-4); }
  if (J.fase === 'va') collide(p.pos, 0.3);
  const quiere = J.fase === 'espera' ? Math.atan2(J.c.x - p.pos.x, J.c.z - p.pos.z) : Math.atan2(dx, dz);
  p.facing += Math.atan2(Math.sin(quiere - p.facing), Math.cos(quiere - p.facing)) * Math.min(1, dt * 10);
  // el salto: una parábola mientras pasa cerca del aro (sube y baja en 0,9 m antes y después)
  let y = 0;
  if (J.fase === 'salta') {
    const e = Math.hypot(p.pos.x - J.c.x, p.pos.z - J.c.z), u = 1 - e / 0.95;
    if (u > 0) {
      y = J.alto * (1 - (1 - u) * (1 - u));
      if (!J.paso && e < 0.12) { J.paso = true; for (let i = 0; i < 6; i++) soltarEstrellita(new THREE.Vector3(J.c.x + (Math.random() - 0.5) * J.R, J.cy + (Math.random() - 0.5) * J.R, J.c.z)); }
    }
  }
  if (d < 0.08) {   // llegó a un lado: espera un momento y vuelve a saltar hacia el otro
    if (J.fase === 'salta') J.saltos++;
    if (J.saltos >= VECES) { terminar(); return; }
    if (J.fase !== 'espera') { J.espera = J.fase === 'va' ? 0.3 : 0.6; J.fase = 'espera'; }
    if ((J.espera -= dt) <= 0) { J.fase = 'salta'; J.paso = false; J.meta = 1 - J.meta; emit('sonido', 'jump'); saltoMascota(P); }
  }
  P.root.position.set(p.pos.x, y + sueloEn(p.pos.x, p.pos.z), p.pos.z); P.root.rotation.y = p.facing;
  animatePet(P, state.clock, Math.min(3, v / 5), dt, J.fase === 'espera');
  if (y > 0) {   // nariz arriba antes del aro, abajo después
    const antes = (p.pos.x - J.c.x) * (meta.x - J.c.x) + (p.pos.z - J.c.z) * (meta.z - J.c.z) < 0;
    P.body.rotation.x -= 0.35 * (antes ? 1 : -1) * Math.min(1, y / J.alto);
  }
}
