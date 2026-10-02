// Los juguetes que se lanzan (Mascotienda): pelota saltarina, frisbee y palito mágico. Si alguna mascota tiene alguno,
// aparece el botón para lanzarlo (ui/pelota.js, evento 'pelota': { visible, ic, nombre, varios }); con más de uno, un
// botoncito 🔄 cambia cuál (cambiarJuguete). Nina lo lanza hacia adelante y su mascota corre a buscarlo, lo toma con
// la boca, vuelve y se lo deja a los pies. Eso la divierte (sube su diversión en la ficha).
//   pelota   vuela, rebota cada vez menos y rueda
//   frisbee  planea despacio girando; la mascota salta y lo atrapa en el aire (si cae, lo recoge del suelo)
//   palito   crece mientras vuela (hasta el doble), cae y casi no rebota; lo trae así de grande
// Mientras busca, la mascota no sigue la fila (`p.busca`: main.js la saca de followChain).
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide, sueloEn, sueloSuave } from '../world/physics.js';
import { avatarDo } from '../characters/animator.js';
import { animatePet } from '../pets/models.js';
import { vozDe } from '../pets/follow.js';
import { saltoMascota } from '../pets/ropa.js';
import { player } from './actors.js';

const G = 16, RAPIDO = 7;
export const LANZABLES = {
  pelota: { ic: '🎾', nombre: 'pelota', la: 'la', vel: [6.5, 5.2], g: 1, rebote: 0.55 },
  frisbee: { ic: '🥏', nombre: 'frisbee', la: 'el', vel: [7.5, 3.2], g: 0.22, rebote: 0.2 },
  palito: { ic: '🪄', nombre: 'palito mágico', la: 'el', vel: [6, 5.5], g: 1, rebote: 0.15 },
};
let B = null, visible = null, elegido = 'pelota';
const tiene = (p, id) => !!(p.cosas && p.cosas.includes(id));
const tengo = () => Object.keys(LANZABLES).filter(id => player.pets.some(p => tiene(p, id)));
const quienBusca = id => player.pets.find(p => tiene(p, id) && !p.busca) || null;   // (no una que persigue burbujas)
const actual = () => { const l = tengo(); return l.includes(elegido) ? elegido : l[0] || null; };
const puedeLanzar = () => state.mode === 'play' && !player.seat && !player.air && !B && !!actual() && !!quienBusca(actual());
const _v = new THREE.Vector3(), _h = new THREE.Vector3();

// los modelos, de un tamaño que le quepa en la boca a esa mascota (r: su "radio")
function hacer(id, r) {
  if (id === 'frisbee') {
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: '#FF6FAE', roughness: 0.4 });
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.4, r * 0.35, 24), m); g.add(disco);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * 0.12, 6, 24), new THREE.MeshStandardMaterial({ color: '#FFE45C' })); aro.rotation.x = Math.PI / 2; aro.position.y = r * 0.18; g.add(aro);
    return g;
  }
  if (id === 'palito') {   // una varita de madera con una estrellita en la punta
    const g = new THREE.Group(), L = r * 5;
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.35, L, 8), new THREE.MeshStandardMaterial({ color: '#B98048', roughness: 0.8 })); palo.rotation.z = Math.PI / 2; g.add(palo);
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.55), new THREE.MeshStandardMaterial({ color: '#FFE45C', emissive: '#FFC93C', emissiveIntensity: 0.5 })); s.position.x = L / 2 + r * 0.3; g.add(s);
    return g;
  }
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const x = c.getContext('2d');
  x.fillStyle = '#D7F542'; x.fillRect(0, 0, 64, 32); x.fillStyle = '#FFFFFF'; x.fillRect(0, 13, 64, 5);
  return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.6 }));
}

// con más de un juguete, el botoncito 🔄 cambia cuál se lanza
export function cambiarJuguete() {
  const l = tengo(); if (l.length < 2) return;
  elegido = l[(l.indexOf(actual()) + 1) % l.length]; visible = null;
}
// `cual`: la mascota que lo va a buscar (desde su ficha); `id`: qué juguete (si no, el elegido)
export function lanzarPelota(cual, id) {
  if (id) elegido = id;
  if (!puedeLanzar()) return false;
  id = actual();
  const T = LANZABLES[id], p = cual && tiene(cual, id) && !cual.busca ? cual : quienBusca(id), s = p.obj.root.scale.x, r = 0.13 * s + 0.02, f = player.facing;
  const mesh = hacer(id, r); mesh.traverse(o => { o.castShadow = true; }); scene.add(mesh);
  const mano = player.ch.bones && player.ch.bones.HandR;
  const pos = mano ? mano.getWorldPosition(new THREE.Vector3()) : player.pos.clone().setY(player.y + 1.3);
  B = { id, T, fase: 'vuela', p, r, mesh, pos, vel: new THREE.Vector3(Math.sin(f) * T.vel[0], T.vel[1], Math.cos(f) * T.vel[0]), t: 0, quieta: 0, crece: 1, salto: 0 };
  if (id === 'palito') mesh.rotation.y = f;
  p.busca = true;
  avatarDo(player.ch, 'wave', { start: 0.2, ts: 1.6 });
  emit('sonido', 'jump');
  return true;
}
function terminar() {
  if (!B) return;
  if (B.mesh.parent) B.mesh.parent.remove(B.mesh);
  B.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
  B.p.busca = false; B = null;
}

// el juguete libre: cae (el frisbee planea), rebota según su tipo, rueda o se arrastra hasta detenerse, y no atraviesa
// paredes ni árboles
function mover(dt) {
  const { pos, vel, r, T } = B;
  const planea = B.id === 'frisbee' && pos.y > sueloEn(pos.x, pos.z) + 0.3;
  vel.y -= G * (planea ? T.g : 1) * dt;
  if (planea) { vel.y = Math.max(vel.y, -1.2); B.mesh.rotation.y += dt * 14; }
  pos.addScaledVector(vel, dt);
  if (B.id === 'palito' && B.fase === 'vuela') { B.crece = Math.min(2, B.crece + dt * 1.4); B.mesh.scale.setScalar(B.crece); B.mesh.rotation.z += dt * 8; }
  const suelo = sueloEn(pos.x, pos.z) + r * (B.id === 'pelota' ? 1 : 0.4);
  if (pos.y <= suelo) {
    pos.y = suelo;
    if (B.id === 'palito') B.mesh.rotation.z = 0;
    if (vel.y < -1.6) { vel.y = -vel.y * T.rebote; vel.x *= 0.75; vel.z *= 0.75; emit('sonido', 'pop'); }
    else { vel.y = 0; const k = Math.max(0, 1 - dt * (B.id === 'pelota' ? 2.5 : 6)); vel.x *= k; vel.z *= k; }
  }
  _v.set(pos.x, 0, pos.z); collide(_v, r + 0.1);
  if (Math.abs(_v.x - pos.x) > 1e-4) { pos.x = _v.x; vel.x *= -0.5; }
  if (Math.abs(_v.z - pos.z) > 1e-4) { pos.z = _v.z; vel.z *= -0.5; }
  B.mesh.position.copy(pos);
  if (B.id === 'pelota') B.mesh.rotation.x += Math.hypot(vel.x, vel.z) * dt / r;
}
// la mascota corre hacia (x, z); devuelve la distancia que le falta (`y`: un salto, sobre su suelo)
function correr(p, x, z, dt, para = 0, y = 0) {
  const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
  let v = 0;
  if (d > para) { const st = Math.min(d - para, RAPIDO * dt); p.pos.x += dx / d * st; p.pos.z += dz / d * st; v = st / Math.max(dt, 1e-4); }
  collide(p.pos, 0.3);
  if (d > 0.05) p.facing += (Math.atan2(Math.sin(Math.atan2(dx, dz) - p.facing), Math.cos(Math.atan2(dx, dz) - p.facing))) * Math.min(1, dt * 10);
  p.obj.root.position.set(p.pos.x, y + sueloSuave(p, p.pos.x, p.pos.z, dt), p.pos.z); p.obj.root.rotation.y = p.facing;
  animatePet(p.obj, state.clock, Math.min(3, v / 5), dt, v < 0.2 && para > 0);
  return d;
}
// tomarlo con la boca: delante de la cabeza, abajo (en el espacio de la cabeza, que está achicado con la mascota)
function aLaBoca(p) {
  B.fase = 'boca'; emit('sonido', vozDe(p).voz);
  const R = p.obj.medidas.cabezaR || 0.25, s = p.obj.root.scale.x;
  p.obj.head.add(B.mesh); B.mesh.position.set(0, -R * 0.35, R * 0.95); B.mesh.scale.setScalar(B.crece / s);
  B.mesh.rotation.set(B.id === 'frisbee' ? Math.PI / 2 : 0, 0, 0);
}

export function updatePelota(dt) {
  const ver = puedeLanzar(), id = actual(), clave = ver ? `${id}|${tengo().length}` : '';
  if (clave !== visible) { visible = clave; const T = LANZABLES[id] || {}; emit('pelota', { visible: ver, ic: T.ic, nombre: T.nombre, varios: tengo().length > 1 }); }
  if (!B) return;
  const p = B.p;
  if (!player.pets.includes(p) || state.mode !== 'play' || (B.t += dt) > 30) { terminar(); return; }
  if (B.fase === 'vuela') {
    mover(dt);
    // sale corriendo apenas lo ve salir (hacia donde va a caer); lo toma cuando lo alcanza y está bajito
    const meta = B.id === 'frisbee' ? B.pos.clone().addScaledVector(B.vel, 0.25) : B.pos;
    let y = 0;
    if (B.salto > 0) { B.salto -= dt; y = Math.sin(Math.PI * (1 - B.salto / 0.5)) * 0.7 * p.obj.root.scale.x + Math.sin(Math.PI * (1 - B.salto / 0.5)) * 0.25; }
    const d = B.t > 0.2 ? correr(p, meta.x, meta.z, dt, 0, y) : correr(p, p.pos.x, p.pos.z, dt);
    const alto = B.pos.y - sueloEn(B.pos.x, B.pos.z), alcance = p.obj.root.scale.x * 1.2 + 0.6;
    // el frisbee: salta para atraparlo en el aire
    if (B.id === 'frisbee' && d < 0.9 && alto > 0.4 && alto < alcance + 0.3 && B.salto <= 0) { B.salto = 0.5; saltoMascota(p.obj); }
    const enElAire = B.salto > 0 && Math.hypot(B.pos.x - p.pos.x, B.pos.z - p.pos.z) < 0.6 && alto < alcance + y;
    if (enElAire || (d < 0.4 && alto < B.r + 0.35)) {
      if (enElAire) emit('aviso', `🥏 ¡${p.name} lo atrapó en el aire!`);
      aLaBoca(p);
    }
  } else if (B.fase === 'boca') {
    // (si lo atrapó saltando, termina de caer) vuelve donde está Nina y se lo deja a los pies
    let y = 0;
    if (B.salto > 0) { B.salto -= dt; y = Math.max(0, Math.sin(Math.PI * (1 - B.salto / 0.5))) * 0.5; }
    const d = correr(p, player.pos.x, player.pos.z, dt, 1.0, y);
    if (d < 1.15 && B.salto <= 0) {
      B.fase = 'deja'; B.quieta = 0;
      p.obj.head.getWorldPosition(_h);
      scene.add(B.mesh); B.mesh.scale.setScalar(B.crece); B.mesh.rotation.set(0, p.facing + Math.PI / 2, 0);
      B.pos.set(_h.x + Math.sin(p.facing) * 0.25, _h.y, _h.z + Math.cos(p.facing) * 0.25); B.vel.set(0, 0, 0);
      if (p.estado) { p.estado.diversion = Math.min(100, p.estado.diversion + 12); p.estado.energia = Math.max(0, p.estado.energia - 2); }
      emit('aviso', `${B.T.ic} ¡${p.name} te trajo ${B.T.la} ${B.T.nombre}!`);
    }
  } else if (B.fase === 'deja') {
    // cae a los pies de Nina, la mascota espera sentada mirándola, y el juguete se guarda
    mover(dt);
    correr(p, player.pos.x, player.pos.z, dt, 1.2);
    if ((B.quieta += dt) > 1.0) terminar();
  }
}
