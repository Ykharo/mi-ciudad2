// La pelota saltarina (juguete de la Mascotienda): si alguna mascota tiene una, aparece el botón 🎾 Lanzar
// (ui/pelota.js, evento 'pelota'). Nina la lanza hacia adelante; la pelota vuela, rebota y rueda; su mascota corre a
// buscarla, la toma con la boca, vuelve y se la deja a los pies. Eso la divierte (sube su diversión en la ficha).
// Mientras busca, la mascota no sigue la fila (`p.busca`: main.js la saca de followChain).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide, sueloEn, sueloSuave } from '../world/physics.js';
import { avatarDo } from '../characters/animator.js';
import { animatePet } from '../pets/models.js';
import { player } from './actors.js';

const G = 16, RAPIDO = 7, VOZ = { perro: 'guau', gato: 'miau', conejo: 'conejo', unicornio: 'relincho' };
let B = null, visible = null;
const tienePelota = p => !!(p.cosas && p.cosas.includes('pelota'));
const quienBusca = () => player.pets.find(tienePelota) || null;
const puedeLanzar = () => state.mode === 'play' && !player.seat && !player.air && !B && !!quienBusca();
const _v = new THREE.Vector3(), _h = new THREE.Vector3();

// la pelota: verde limón con una franja blanca, de un tamaño que le quepa en la boca a esa mascota
function hacerPelota(r) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const x = c.getContext('2d');
  x.fillStyle = '#D7F542'; x.fillRect(0, 0, 64, 32); x.fillStyle = '#FFFFFF'; x.fillRect(0, 13, 64, 5);
  return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.6 }));
}

// `cual`: la mascota que la va a buscar (desde su ficha); si no, la primera que tenga pelota
export function lanzarPelota(cual) {
  if (!puedeLanzar()) return false;
  const p = cual && tienePelota(cual) ? cual : quienBusca(), s = p.obj.root.scale.x, r = 0.13 * s + 0.02, f = player.facing;
  const mesh = hacerPelota(r); mesh.castShadow = true; scene.add(mesh);
  const mano = player.ch.bones && player.ch.bones.HandR;
  const pos = mano ? mano.getWorldPosition(new THREE.Vector3()) : player.pos.clone().setY(player.y + 1.3);
  B = { fase: 'vuela', p, r, mesh, pos, vel: new THREE.Vector3(Math.sin(f) * 6.5, 5.2, Math.cos(f) * 6.5), t: 0, quieta: 0 };
  p.busca = true;
  avatarDo(player.ch, 'wave', { start: 0.2, ts: 1.6 });
  emit('sonido', 'jump');
  return true;
}
function terminar() {
  if (!B) return;
  if (B.mesh.parent) B.mesh.parent.remove(B.mesh);
  B.mesh.geometry.dispose(); B.mesh.material.map.dispose(); B.mesh.material.dispose();
  B.p.busca = false; B = null;
}

// la pelota libre: cae, rebota (cada vez menos), rueda hasta detenerse, y no atraviesa paredes ni árboles
function moverPelota(dt) {
  const { pos, vel, r } = B;
  vel.y -= G * dt;
  pos.addScaledVector(vel, dt);
  const suelo = sueloEn(pos.x, pos.z) + r;
  if (pos.y <= suelo) {
    pos.y = suelo;
    if (vel.y < -1.6) { vel.y = -vel.y * 0.55; vel.x *= 0.75; vel.z *= 0.75; emit('sonido', 'pop'); }
    else { vel.y = 0; const k = Math.max(0, 1 - dt * 2.5); vel.x *= k; vel.z *= k; }
  }
  _v.set(pos.x, 0, pos.z); collide(_v, r + 0.1);
  if (Math.abs(_v.x - pos.x) > 1e-4) { pos.x = _v.x; vel.x *= -0.5; }
  if (Math.abs(_v.z - pos.z) > 1e-4) { pos.z = _v.z; vel.z *= -0.5; }
  B.mesh.position.copy(pos);
  B.mesh.rotation.x += Math.hypot(vel.x, vel.z) * dt / r;
}
// la mascota corre hacia (x, z); devuelve la distancia que le falta
function correr(p, x, z, dt, para = 0) {
  const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
  let v = 0;
  if (d > para) { const st = Math.min(d - para, RAPIDO * dt); p.pos.x += dx / d * st; p.pos.z += dz / d * st; v = st / Math.max(dt, 1e-4); }
  collide(p.pos, 0.3);
  if (d > 0.05) p.facing += (Math.atan2(Math.sin(Math.atan2(dx, dz) - p.facing), Math.cos(Math.atan2(dx, dz) - p.facing))) * Math.min(1, dt * 10);
  p.obj.root.position.set(p.pos.x, sueloSuave(p, p.pos.x, p.pos.z, dt), p.pos.z); p.obj.root.rotation.y = p.facing;
  animatePet(p.obj, state.clock, Math.min(3, v / 5), dt, v < 0.2 && para > 0);
  return d;
}

export function updatePelota(dt) {
  const ver = puedeLanzar();
  if (ver !== visible) { visible = ver; emit('pelota', { visible: ver }); }
  if (!B) return;
  const p = B.p;
  if (!player.pets.includes(p) || state.mode !== 'play' || (B.t += dt) > 30) { terminar(); return; }
  if (B.fase === 'vuela') {
    moverPelota(dt);
    // sale corriendo apenas la ve salir; la toma cuando la alcanza y está bajita
    const d = B.t > 0.2 ? correr(p, B.pos.x, B.pos.z, dt) : correr(p, p.pos.x, p.pos.z, dt);
    if (d < 0.4 && B.pos.y < sueloEn(B.pos.x, B.pos.z) + B.r + 0.35) {
      B.fase = 'boca'; emit('sonido', VOZ[p.kind] || 'pop');
      // en la boca: delante de la cabeza, abajo (en el espacio de la cabeza, que está achicado con la mascota)
      const R = p.obj.medidas.cabezaR || 0.25, s = p.obj.root.scale.x;
      p.obj.head.add(B.mesh); B.mesh.position.set(0, -R * 0.35, R * 0.95); B.mesh.scale.setScalar(1 / s);
    }
  } else if (B.fase === 'boca') {
    // vuelve donde está Nina y se la deja a los pies
    const d = correr(p, player.pos.x, player.pos.z, dt, 1.0);
    if (d < 1.15) {
      B.fase = 'deja'; B.quieta = 0;
      p.obj.head.getWorldPosition(_h);
      scene.add(B.mesh); B.mesh.scale.setScalar(1);
      B.pos.set(_h.x + Math.sin(p.facing) * 0.25, _h.y, _h.z + Math.cos(p.facing) * 0.25); B.vel.set(0, 0, 0);
      if (p.estado) { p.estado.diversion = Math.min(100, p.estado.diversion + 12); p.estado.energia = Math.max(0, p.estado.energia - 2); }
      emit('aviso', `🎾 ¡${p.name} te trajo la pelota!`);
    }
  } else if (B.fase === 'deja') {
    // la pelota cae a los pies de Nina, la mascota espera sentada mirándola, y la pelota se guarda
    moverPelota(dt);
    correr(p, player.pos.x, player.pos.z, dt, 1.2);
    if ((B.quieta += dt) > 1.0) terminar();
  }
}
