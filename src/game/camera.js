// Cámara en tercera persona y en los paneles.
import { THREE } from '../engine/three.js';
import { state } from '../core/state.js';
import { lerp, lerpAngle } from '../core/math.js';
import { SUN_OFF, camera, fill, sun } from '../engine/renderer.js';
import { interiorEn, obstacles } from '../world/physics.js';
import { TT } from '../world/places/carshop.js';
import { cam, player } from './actors.js';
import { driving } from './driving.js';

/* ---------- camera ---------- */
const _look = new THREE.Vector3(), _pos = new THREE.Vector3();
function cameraBlock(look, yaw, pitch, dist) {
  // shorten the boom if a building stands between the player and the camera
  let best = dist;
  const cp = Math.cos(pitch);
  for (let i = 1; i <= 14; i++) {
    const f = i / 14 * dist;
    const x = look.x + Math.sin(yaw) * cp * f, z = look.z + Math.cos(yaw) * cp * f, y = look.y + Math.sin(pitch) * f;
    for (const o of obstacles) {
      if (!o.h || y > o.h) continue;
      if (Math.abs(look.x - o.x) < o.hw && Math.abs(look.z - o.z) < o.hd) continue;   // el que la tiene adentro (el carrusel)
      if (Math.abs(x - o.x) < o.hw + 0.4 && Math.abs(z - o.z) < o.hd + 0.4) { best = Math.max(3, f * 0.85); return best; }
    }
  }
  return best;
}
function panelIsSheet() { return window.innerWidth <= 760 || (window.innerHeight > window.innerWidth && window.innerWidth <= 1000); }
function updateCamera(dt) {
  const p = player.pos;
  let k;
  if (state.mode === 'drive') {
    const c = driving;
    if (!cam.dragging) cam.yaw = lerpAngle(cam.yaw, c.heading + Math.PI, 1 - Math.exp(-dt * (Math.abs(c.speed) > 1 ? 2.6 : 0.8)));
    _look.set(c.x, c.model.camY, c.z);
    const dist = cameraBlock(_look, cam.yaw, cam.pitch, cam.dist + Math.abs(c.speed) * 0.12);
    const cp = Math.cos(cam.pitch) * dist;
    _pos.set(_look.x + Math.sin(cam.yaw) * cp, _look.y + Math.sin(cam.pitch) * dist, _look.z + Math.cos(cam.yaw) * cp);
    k = 1 - Math.exp(-dt * 8);
  } else if (state.mode === 'aura' && cam.cine) {
    // la competencia del Escenario del Aura maneja la cámara (game/aura.js): se desliza hacia cada toma
    _pos.copy(cam.cine.pos); _look.copy(cam.cine.look);
    k = 1 - Math.exp(-dt * cam.cine.k);
  } else if (state.mode === 'play' || state.mode === 'intro') {
    if (state.mode === 'intro') cam.yaw += dt * 0.12;
    _look.set(p.x, 1.6 + player.y * 0.5, p.z);
    let dist = cameraBlock(_look, cam.yaw, cam.pitch, cam.dist);
    // en un interior (la Mascotienda por dentro), la cámara no sube más que el techo
    const I = interiorEn(p.x, p.z);
    if (I) dist = Math.max(2.5, Math.min(dist, (I.techo - 0.8 - _look.y) / Math.max(0.05, Math.sin(cam.pitch))));
    const cp = Math.cos(cam.pitch) * dist;
    _pos.set(_look.x + Math.sin(cam.yaw) * cp, _look.y + Math.sin(cam.pitch) * dist, _look.z + Math.cos(cam.yaw) * cp);
    k = 1 - Math.exp(-dt * 9);
  } else if (state.mode === 'shop') {
    const sheet = panelIsSheet(), yaw = 0.35;
    const size = state.ttModel ? Math.max(state.ttModel.hl, state.ttModel.hw * 1.25) : 3;
    let d = 6.5 + size * 1.7; if (camera.aspect < 1) d *= 1.35;
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    _look.set(TT.x, 1.0 + (state.ttModel ? state.ttModel.camY * 0.3 : 0.6), TT.z);
    _pos.set(_look.x + Math.sin(yaw) * d, _look.y + d * 0.3, _look.z + Math.cos(yaw) * d);
    const vt = Math.tan(camera.fov * Math.PI / 360), ht = vt * camera.aspect;
    if (sheet) _look.y -= 0.55 * d * vt;
    else { _look.x += rx * 0.44 * d * ht; _look.z += rz * 0.44 * d * ht; }
    k = 1 - Math.exp(-dt * 4);
  } else {
    const sheet = panelIsSheet(), yaw = cam.menuYaw;
    let d = state.mode === 'wardrobe' ? 4.6 : 5.6;   // en el Vestidor, Nina más de cerca (en el refugio cabe la mascota)
    if (camera.aspect < 1) d *= 1.25;
    const fwx = Math.sin(yaw), fwz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    _look.set(p.x, 0.95, p.z);
    const pv = state.preview;   // la mascota de muestra del refugio
    if (state.mode === 'pets' && pv) { _look.x = (p.x + pv.root.position.x) / 2; _look.z = (p.z + pv.root.position.z) / 2; }
    _pos.set(_look.x + fwx * d, _look.y + 0.5, _look.z + fwz * d);
    const vt = Math.tan(camera.fov * Math.PI / 360), ht = vt * camera.aspect;
    if (sheet) _look.y -= 0.5 * d * vt;
    else { _look.x += rx * 0.44 * d * ht; _look.z += rz * 0.44 * d * ht; }
    k = 1 - Math.exp(-dt * 5);
  }
  cam.pos.lerp(_pos, k); cam.look.lerp(_look, k);
  camera.position.copy(cam.pos); camera.lookAt(cam.look);
  fill.position.set(cam.pos.x, cam.pos.y + 3, cam.pos.z); fill.target.position.copy(cam.look);
  fill.intensity = lerp(fill.intensity, ['pets', 'shop', 'wardrobe', 'mascotienda', 'archivador'].includes(state.mode) ? 0.7 : 0.3, k);
  sun.position.set(p.x + SUN_OFF.x, SUN_OFF.y, p.z + SUN_OFF.z);
  sun.target.position.set(p.x, 0, p.z);
}

export { updateCamera };
