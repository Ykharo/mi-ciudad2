// Materiales con caché y ajustes de color.
import { THREE } from './three.js';

/* materials + geometry caches */
const matCache = new Map();
function mat(color, opts) {
  const key = color + '|' + (opts ? JSON.stringify(opts) : '');
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0 }, opts || {})); matCache.set(key, m); }
  return m;
}
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }
function tint(hex, k) { const c = new THREE.Color(hex); c.lerp(new THREE.Color(0xFFFFFF), k); return '#' + c.getHexString(); }
const RAINBOW = ['#FF5E7E', '#FF9B4A', '#FFD23F', '#5BD66E', '#4FB6F5', '#9B7BF3'];

export { RAINBOW, mat, shade, tint };
