// Girar la cámara arrastrando y acercar con pellizco o rueda.
import { state } from '../core/state.js';
import { clamp } from '../core/math.js';
import { canvas } from '../engine/renderer.js';
import { cam, player } from '../game/actors.js';

const pointers = new Map(); let pinchD = 0;
canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); cam.dragging = true;
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
});
canvas.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (pointers.size === 1) {
    if (state.mode === 'pets' || state.mode === 'wardrobe') player.facing += dx * 0.012;
    else if (state.mode === 'shop') { state.ttSpin += dx * 0.012; state.ttDrag = 1.5; }
    else if (state.mode === 'play' || state.mode === 'drive') { cam.yaw -= dx * 0.0065; cam.pitch = clamp(cam.pitch + dy * 0.004, 0.08, 1.15); }
  } else if (pointers.size === 2 && (state.mode === 'play' || state.mode === 'drive')) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchD > 0 && d > 0) cam.dist = clamp(cam.dist * pinchD / d, 5, 22);
    pinchD = d;
  }
});
const endPtr = e => { pointers.delete(e.pointerId); pinchD = 0; cam.dragging = pointers.size > 0; };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); if (state.mode === 'play' || state.mode === 'drive') cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.001), 5, 22); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });
