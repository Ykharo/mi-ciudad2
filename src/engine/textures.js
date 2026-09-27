// Texturas dibujadas en canvas: carteles, etiquetas, rayas, cuadros, pasto.
import { THREE } from './three.js';
import { seeded } from '../core/math.js';

/* canvas text textures */
function roundRect(x, X, y, w, h, r) { x.beginPath(); x.moveTo(X + r, y); x.arcTo(X + w, y, X + w, y + h, r); x.arcTo(X + w, y + h, X, y + h, r); x.arcTo(X, y + h, X, y, r); x.arcTo(X, y, X + w, y, r); x.closePath(); }
function signTexture(text, bg, fg, w = 1024, h = 220) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  roundRect(x, 8, 8, w - 16, h - 16, 60); x.fillStyle = '#FFFFFF'; x.fill();
  roundRect(x, 22, 22, w - 44, h - 44, 48); x.fillStyle = bg; x.fill();
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = 120; x.font = `800 ${size}px "Baloo 2", "Trebuchet MS", sans-serif`;
  while (x.measureText(text).width > w - 110 && size > 40) { size -= 4; x.font = `800 ${size}px "Baloo 2", "Trebuchet MS", sans-serif`; }
  x.fillText(text, w / 2, h / 2 + size * 0.08);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function makeSign(text, bg, fg, width) {
  const tex = signTexture(text, bg, fg);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 220 / 1024), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, transparent: true }));
  return m;
}
const labelCache = new Map();
function labelSprite(text, opts = {}) {
  const key = text + (opts.bubble ? '|b' : '');
  let tex = labelCache.get(key);
  if (!tex) {
    const c = document.createElement('canvas'); const x = c.getContext('2d');
    const font = `800 56px "Baloo 2", "Trebuchet MS", sans-serif`; x.font = font;
    const tw = Math.ceil(x.measureText(text).width);
    c.width = tw + 70; c.height = opts.bubble ? 120 : 96;
    x.font = font;
    const h = 90;
    roundRect(x, 4, 4, c.width - 8, h - 8, 40); x.fillStyle = opts.bubble ? '#FFFFFF' : 'rgba(38,49,92,0.82)'; x.fill();
    if (opts.bubble) { x.lineWidth = 6; x.strokeStyle = '#26315C'; x.stroke(); x.beginPath(); x.moveTo(c.width / 2 - 14, h - 6); x.lineTo(c.width / 2, h + 22); x.lineTo(c.width / 2 + 14, h - 6); x.fillStyle = '#FFFFFF'; x.fill(); }
    x.fillStyle = opts.bubble ? '#26315C' : '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, c.width / 2, h / 2 + 4);
    tex = new THREE.CanvasTexture(c); tex.userData = { w: c.width, h: c.height };
    labelCache.set(key, tex);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true, fog: false }));
  const k = opts.scale || 0.0085;
  s.scale.set(tex.userData.w * k, tex.userData.h * k, 1);
  s.renderOrder = 5;
  return s;
}

function grassTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#88D46F'; x.fillRect(0, 0, 256, 256);
  const r = seeded(7);
  for (let i = 0; i < 1100; i++) {
    x.fillStyle = ['#7ACB63', '#94DC7A', '#80CF67', '#9FE386', '#86D26C'][Math.floor(r() * 5)];
    const s = 2 + r() * 4; x.fillRect(r() * 256, r() * 256, s, s * 1.7);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); t.anisotropy = 8; return t;
}
function stripeTexture(a, b, n = 8) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * 256 / n, 0, 256 / n + 1, 64); }
  const t = new THREE.CanvasTexture(c); return t;
}
function checkerTexture() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 100; const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { x.fillStyle = (i + j) % 2 ? '#26315C' : '#FFFFFF'; x.fillRect(i * 20, j * 20, 20, 20); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
}

export { checkerTexture, grassTexture, labelSprite, makeSign, stripeTexture };
