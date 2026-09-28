// Mezcla de animaciones: caminar/correr y acciones encima.
import { THREE } from '../engine/three.js';
import { clamp, lerp } from '../core/math.js';
import { NINA, NINA_SCALE } from './avatar.js';
import { BLINKS, setFace } from './face.js';
import { AUTO_FACE, HOLD } from './catalog/acciones.js';

// animaciones especiales (saltar, saludar, bailar, sentarse…) por encima de caminar/correr
function avatarDo(c, name, o = {}) {
  const a = c.act[name]; if (!a) return;
  if (c.sp && c.sp.a !== a) c.fade.push({ a: c.sp.a, w: c.sp.w });
  c.fade = c.fade.filter(f => f.a !== a);
  const d = a.getClip().duration;
  a.reset(); a.play();
  a.setLoop(o.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = true;
  a.timeScale = o.ts || 1; a.time = Math.min(o.start || 0, d);
  c.sp = { name, a, w: o.instant ? 1 : (c.sp && c.sp.a === a ? c.sp.w : 0), hold: HOLD.has(name) || !!o.hold, loop: !!o.loop, stopOnMove: o.stopOnMove !== false };
}
function avatarStop(c, instant) {
  if (!c.sp) return;
  if (instant) { c.sp.a.setEffectiveWeight(0); c.sp.a.stop(); } else c.fade.push({ a: c.sp.a, w: c.sp.w });
  c.sp = null;
}
function avatarBusy(c, names) { return !!c.sp && (!names || names.includes(c.sp.name)); }
function updateAvatar(c, dt, speed, faceWanted) {
  const sp = c.sp;
  if (sp) {
    const d = sp.a.getClip().duration;
    sp.w = Math.min(1, sp.w + dt / 0.2);
    if (!sp.loop && !sp.hold && sp.a.time >= d - 0.25 * sp.a.timeScale) avatarStop(c);
  }
  let fw = 0;
  c.fade = c.fade.filter(f => { f.w -= dt / 0.25; if (f.w <= 0) { f.a.setEffectiveWeight(0); f.a.stop(); return false; } fw += f.w; return true; });
  const sw = c.sp ? c.sp.w : 0;
  const norm = Math.max(1, sw + fw), loco = Math.max(0, 1 - (sw + fw)) ;
  // caminar ↔ correr con una sola fase de zancada (los pies no patinan al mezclar)
  const walkK = clamp((speed - 0.1) / 0.5, 0, 1), runK = clamp((speed - 1.3) / 1.6, 0, 1);
  const wk = walkK * walkK * (3 - 2 * walkK), rk = runK * runK * (3 - 2 * runK);
  const stride = lerp(NINA.walkStride, NINA.runStride, rk) * c.k / NINA_SCALE;
  if (speed > 0.05) c.phase = (c.phase + dt * Math.min(speed / stride, 1.55 / NINA.clips.run.duration)) % 1;
  c.act.walk.time = c.phase * NINA.clips.walk.duration;
  c.act.run.time = c.phase * NINA.clips.run.duration;
  c.act.idle.setEffectiveWeight(loco * (1 - wk));
  c.act.walk.setEffectiveWeight(loco * wk * (1 - rk));
  c.act.run.setEffectiveWeight(loco * wk * rk);
  if (c.sp) c.sp.a.setEffectiveWeight(sw / norm);
  c.fade.forEach(f => f.a.setEffectiveWeight(f.w / norm));
  c.mixer.update(dt);
  // cara: la que pide el juego, o la de la animación, y parpadeo
  const want = faceWanted || (c.sp && AUTO_FACE[c.sp.name]) || (rk > 0.6 ? 'feliz' : 'normal');
  if (c.blinkOn > 0) { c.blinkOn -= dt; if (c.blinkOn <= 0) setFace(c, c.face); }
  else if ((c.blinkT -= dt) <= 0) { c.blinkT = 1.8 + Math.random() * 3.2; if (BLINKS.has(want)) { c.blinkOn = 0.11; setFace(c, want); } }
  if (want !== c.face) setFace(c, want);
}

export { avatarBusy, avatarDo, avatarStop, updateAvatar };
