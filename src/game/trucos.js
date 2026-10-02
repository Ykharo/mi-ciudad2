// Los trucos (se aprenden en la Mascotienda, pasillo Trucos: cada mascota los suyos). Si alguna sabe alguno, aparece el
// botón 🎉 Trucos (ui/trucos.js, evento 'trucos' { visible }); el menú lista lo que sabe cada una. Al pedírselo, la
// mascota viene delante de Nina, la mira y lo hace (las poses: pets/trucos.js); al terminar se divierte, hace su voz
// y Nina la felicita. Con "Bailar", Nina baila con ella.
// Mientras tanto la mascota no sigue la fila (`p.busca`, como con la pelota: main.js).
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { collide, sueloSuave } from '../world/physics.js';
import { avatarDo } from '../characters/animator.js';
import { animatePet } from '../pets/models.js';
import { vozDe } from '../pets/follow.js';
import { TRUCOS, poseTruco } from '../pets/trucos.js';
import { ARTICULOS } from '../pets/catalog/articulos.js';
import { player } from './actors.js';

const LISTA = ARTICULOS.filter(a => a.tipo === 'truco'), CORRE = 6, DELANTE = 1.4;
let T = null, visible = null;
const sabe = p => LISTA.filter(a => p.cosas && p.cosas.includes(a.id));
const puede = () => state.mode === 'play' && !player.seat && !player.air && !T;

// lo que sabe cada mascota (para el menú): [{ i, nombre, trucos: [{ id, nombre, ic }] }]
export function trucosSabidos() {
  return player.pets.map((p, i) => ({ i, nombre: p.name, trucos: sabe(p).map(a => ({ id: a.id, nombre: a.nombre, ic: a.ic })) })).filter(m => m.trucos.length);
}
export function hacerTruco(i, id) {
  const p = player.pets[i];
  if (!puede() || !p || p.busca || p.enCasa || !TRUCOS[id] || !sabe(p).some(a => a.id === id)) return false;
  T = { p, id, fase: 'va', t: 0 };
  p.busca = true;
  emit('sonido', 'pop');
  return true;
}
function terminar(bien) {
  const p = T.p; p.busca = false; p.obj.body.position.x = p.obj.body.position.z = 0;
  if (bien) {
    if (p.estado) p.estado.diversion = Math.min(100, p.estado.diversion + 6);
    emit('sonido', vozDe(p).voz); emit('aviso', `🎉 ¡Muy bien, ${p.name}!`);
    if (state.mode === 'play' && !player.air && !player.seat) avatarDo(player.ch, 'wave', { start: 0.2, ts: 1.4 });
  }
  T = null;
}

export function updateTrucos(dt) {
  const ver = state.mode === 'play' && !player.seat && player.pets.some(p => sabe(p).length);
  if (ver !== visible) { visible = ver; emit('trucos', { visible: ver }); }
  if (!T) return;
  const p = T.p, P = p.obj, D = TRUCOS[T.id];
  if (!player.pets.includes(p) || state.mode !== 'play') { terminar(false); return; }
  T.t += dt;
  // delante de Nina, mirándola
  const f = player.facing, tx = player.pos.x + Math.sin(f) * DELANTE, tz = player.pos.z + Math.cos(f) * DELANTE;
  let v = 0;
  if (T.fase === 'va') {
    const dx = tx - p.pos.x, dz = tz - p.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.08) { const st = Math.min(d, CORRE * dt); p.pos.x += dx / d * st; p.pos.z += dz / d * st; v = st / Math.max(dt, 1e-4); }
    collide(p.pos, 0.3);
    const quiere = d > 0.4 ? Math.atan2(dx, dz) : Math.atan2(player.pos.x - p.pos.x, player.pos.z - p.pos.z);
    p.facing += Math.atan2(Math.sin(quiere - p.facing), Math.cos(quiere - p.facing)) * Math.min(1, dt * 10);
    if ((d <= 0.08 && T.t > 0.3) || T.t > 6) {
      T.fase = 'hace'; T.t = 0;
      p.facing = Math.atan2(player.pos.x - p.pos.x, player.pos.z - p.pos.z);
      if (T.id === 'bailar' && !player.air) avatarDo(player.ch, 'dance', { start: 0 });
    }
  }
  P.root.position.set(p.pos.x, sueloSuave(p, p.pos.x, p.pos.z, dt), p.pos.z); P.root.rotation.y = p.facing;
  P.body.position.x = P.body.position.z = 0;   // (las poses los mueven; animatePet no los vuelve a poner)
  animatePet(P, state.clock, Math.min(3, v / 5), dt, T.fase === 'hace' && D.sentada);
  if (T.fase !== 'hace') return;
  const u = Math.min(1, T.t / D.dura);
  poseTruco(P, T.id, u, state.clock);
  if (T.id === 'bailar') { T.nota = (T.nota || 0) - dt; if (T.nota <= 0) { T.nota = 0.45; emit('sonido', 'nota'); } }
  if (u >= 1) terminar(true);
}
