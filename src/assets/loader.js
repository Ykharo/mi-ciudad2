// Lee los bytes de un modelo, una sola vez por id.
// - Versión de un solo archivo: viene en un bloque <script id="asset:ID"> con el .glb en base64.
// - Desarrollo y versión web: se descarga con fetch desde assets/.
// Nunca se usa fetch(blob:) ni fetch(data:): el visor donde se publica los bloquea en algunos navegadores.
import { MANIFEST } from './manifest.js';

const cache = new Map();

export function readAsset(id) {
  if (!cache.has(id)) cache.set(id, read(id));
  return cache.get(id);
}

async function read(id) {
  const el = document.getElementById('asset:' + id);
  if (el) return base64ToBytes(el.textContent.trim());
  if (!MANIFEST[id]) throw new Error('Modelo desconocido: ' + id);
  const url = import.meta.env.BASE_URL + MANIFEST[id];
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

function base64ToBytes(b64) {
  const raw = atob(b64), bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
