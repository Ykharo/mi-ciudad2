// Vecinos que pasean y saludan.
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { TAU, lerpAngle, pick, seeded } from '../core/math.js';
import { scene } from '../engine/renderer.js';
import { labelSprite } from '../engine/textures.js';
import { LINES, WALK } from '../world/layout.js';
import { sueloSuave } from '../world/physics.js';
import { carDist, cars } from '../cars/fleet.js';
import { NINA_SCALE, makeAvatar } from '../characters/avatar.js';
import { randomLook } from '../characters/looks.js';
import { avatarBusy, avatarDo, updateAvatar } from '../characters/animator.js';
import { PET_COLORS, buildPet } from '../pets/models.js';
import { player } from './actors.js';
import { followChain } from '../pets/follow.js';

const npcs = [];

/* ---------- neighbours ---------- */
const NPC_LINES = ['¡Hola!', '¡Qué linda tu ropa!', '¡Buen día!', '¿Vamos al parque?', '¡Me encanta tu peinado!', '¡Qué día tan lindo!', '¡Chao, que te vaya bien!'];
function npcTarget(n) {
  if (Math.random() < 0.3) { if (Math.random() < 0.5) n.sx *= -1; else n.sz *= -1; }
  else {
    const o = [];
    if (n.i > 0) o.push([n.i - 1, n.j]); if (n.i < 2) o.push([n.i + 1, n.j]); if (n.j > 0) o.push([n.i, n.j - 1]); if (n.j < 2) o.push([n.i, n.j + 1]);
    const [a, b] = pick(o); n.i = a; n.j = b;
  }
  n.target.set(LINES[n.i] + n.sx * WALK, 0, LINES[n.j] + n.sz * WALK);
}
// Los looks de los vecinos se sortean antes de cargar los personajes (main.js), así se cargan sólo las prendas que
// usan. Siempre salen los mismos (semilla fija).
function lookVecinos(count) {
  const r = seeded(4321);
  return Array.from({ length: count }, () => randomLook(r));
}
function spawnNPCs(looks) {
  const r = seeded(1234);
  for (let k = 0; k < looks.length; k++) {
    const i = Math.floor(r() * 3), j = Math.floor(r() * 3), sx = r() < 0.5 ? -1 : 1, sz = r() < 0.5 ? -1 : 1;
    const n = { ch: makeAvatar(looks[k]), i, j, sx, sz, pos: new THREE.Vector3(LINES[i] + sx * WALK, 0, LINES[j] + sz * WALK), target: new THREE.Vector3(), facing: r() * TAU, wait: r() * 2, speed: 0.9 + r() * 0.45, greet: 0, cool: r() * 4, bubble: null, pets: [] };
    // start somewhere along a sidewalk rather than all on corners
    npcTarget(n); n.pos.lerp(n.target, r() * 0.8);
    if (k % 3 === 0) {
      const obj = buildPet(pick(['perro', 'gato', 'conejo']), pick(PET_COLORS)); scene.add(obj.root);
      n.pets.push({ obj, pos: n.pos.clone(), facing: 0 });
    }
    npcs.push(n);
  }
}
function npcSay(n, text) {
  if (n.bubble) n.ch.root.remove(n.bubble);
  n.bubble = labelSprite(text, { bubble: true, scale: 0.0062 }); n.bubble.position.y = 2.35 * n.ch.k / NINA_SCALE + 0.55; n.ch.root.add(n.bubble);
  if (!avatarBusy(n.ch, ['wave'])) avatarDo(n.ch, 'wave', { start: 0.1 });
}
// Los vecinos también usan los juegos y las bancas (game/vecinosJuegos.js): al llegar a una esquina pueden decidir ir
// a uno (el gancho `alEsquina`); mientras tanto `n.uso` los maneja: `update(dt)` los mueve y dice
// { anda: velocidad, raiz: true si ya los puso en su lugar, sentado, cara }.
let alEsquina = null;
function onEsquina(fn) { alEsquina = fn; }
function updateNPCs(dt, t) {
  for (const n of npcs) {
    if (n.uso) {
      const r = n.uso.update(dt, t) || {};
      if (!r.raiz) { n.ch.root.position.set(n.pos.x, sueloSuave(n, n.pos.x, n.pos.z, dt), n.pos.z); n.ch.root.rotation.set(0, n.facing, 0); }
      updateAvatar(n.ch, dt, r.anda || 0, r.cara || null);
      if (n.pets.length) followChain(n.pets, n.pos, dt, t, 1.7, !!r.sentado);
      continue;
    }
    const px = player.pos.x - n.pos.x, pz = player.pos.z - n.pos.z, pd = Math.hypot(px, pz);
    n.cool -= dt;
    if (pd < 3.4 && n.cool <= 0 && state.mode === 'play') {
      n.greet = 2.8; n.cool = 14;
      npcSay(n, player.pets.length && Math.random() < 0.4 ? '¡Qué linda tu mascota!' : pick(NPC_LINES));
    }
    let moving = false;
    if (n.greet > 0) {
      n.greet -= dt;
      n.facing = lerpAngle(n.facing, Math.atan2(px, pz), 1 - Math.exp(-dt * 8));
      if (n.greet <= 0 && n.bubble) { n.ch.root.remove(n.bubble); n.bubble = null; }
    } else if (n.wait > 0) n.wait -= dt;
    else {
      const dx = n.target.x - n.pos.x, dz = n.target.z - n.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.15) {
        if (alEsquina && alEsquina(n)) continue;   // se fue a un juego
        if (Math.random() < 0.35) n.wait = 1 + Math.random() * 2.5; npcTarget(n);
      }
      else {
        const st = Math.min(d, n.speed * dt), nx = n.pos.x + dx / d * st, nz = n.pos.z + dz / d * st;
        if (cars.some(c => { const dn = carDist(c, nx, nz); return dn < 0.7 && dn < carDist(c, n.pos.x, n.pos.z); })) { n.blocked = (n.blocked || 0) + dt; if (n.blocked > 1.2) { n.blocked = 0; npcTarget(n); } }
        else { n.blocked = 0; n.pos.x = nx; n.pos.z = nz; moving = true; }
        n.facing = lerpAngle(n.facing, Math.atan2(dx, dz), 1 - Math.exp(-dt * 10));
      }
    }
    n.ch.root.position.set(n.pos.x, sueloSuave(n, n.pos.x, n.pos.z, dt), n.pos.z); n.ch.root.rotation.set(0, n.facing, 0);
    updateAvatar(n.ch, dt, moving ? n.speed : 0, n.greet > 0 ? 'feliz' : null);
    if (n.pets.length) followChain(n.pets, n.pos, dt, t);
  }
}
// Nina saluda: los vecinos cercanos contestan
function greetAround() { npcs.forEach(n => { if (!n.uso && n.pos.distanceTo(player.pos) < 9) { n.greet = 2.2; n.cool = 8; npcSay(n, '¡Hola!'); } }); }

export { greetAround, lookVecinos, npcSay, npcs, onEsquina, spawnNPCs, updateNPCs };
