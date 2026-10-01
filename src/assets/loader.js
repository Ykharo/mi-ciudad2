// Carga de modelos .glb, una sola vez por id (se guarda la promesa). Se descargan con fetch desde assets/.
// Decodificación: las texturas se separan del .glb y se cargan como imágenes data: (no fetch(blob:): el visor donde
// se publicaba antes lo bloqueaba en Safari del iPad; se mantiene porque funciona en todos lados).
import { GLTFLoader, THREE } from '../engine/three.js';
import { assetFile } from './manifest.js';
import HUELLAS from 'virtual:huellas-modelos';

const bytesCache = new Map(), glbCache = new Map(), listos = new Map();

export function readAsset(id) {
  if (!bytesCache.has(id)) bytesCache.set(id, read(id));
  return bytesCache.get(id);
}

async function read(id) {
  const file = assetFile(id);
  if (!file) throw new Error('Modelo desconocido: ' + id);
  // con la huella del archivo (vite.config.js): si el modelo cambió, la dirección es otra y el navegador no usa su copia
  // vieja (pasó con un nina_base.glb sin las animaciones nuevas: Nina quedaba de pie en el columpio y el tobogán).
  // (fetch con cache: 'no-cache' también servía, pero el orden en que llegaban los modelos variaba y las capturas de
  // las pruebas dejaban de salir iguales.)
  const url = import.meta.env.BASE_URL + file + (HUELLAS[file] ? '?v=' + HUELLAS[file] : '');
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

// Carga y decodifica un .glb: { scene, animations, parser }. Los colores de los materiales quedan en sRGB
// (el juego trabaja sin gestión de color) y las texturas puestas.
export function loadGLB(id) {
  if (!glbCache.has(id)) glbCache.set(id, readAsset(id).then(parseGLB).then(g => { listos.set(id, g); return g; }));
  return glbCache.get(id);
}
// el mismo resultado, sin esperar: para quien ya sabe que está cargado (null si no)
export function loadedGLB(id) { return listos.get(id) || null; }

async function parseGLB(bytes) {
  const prep = glbSplitTextures(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const [gltf, texs] = await Promise.all([
    new Promise((res, rej) => new GLTFLoader().parse(prep.buf, '', res, rej)),
    Promise.all(prep.jobs.map(j => glbTexture(j).then(t => [j.material, t])))
  ]);
  const texBy = Object.fromEntries(texs);
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (m.userData.fixed) continue; m.userData.fixed = true;
      // el juego trabaja sin gestión de color (colores hex tal cual): los factores del glTF vienen en lineal
      m.color.convertLinearToSRGB();
      if (texBy[m.name]) { m.map = texBy[m.name]; m.needsUpdate = true; }
      if (m.transparent) m.depthWrite = false;
    }
  });
  return gltf;
}

// Saca las texturas del .glb (para cargarlas como imágenes data:) y devuelve un .glb sin ellas.
function glbSplitTextures(buf) {
  const dv = new DataView(buf);
  const jlen = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jlen)));
  const binStart = 20 + jlen + 8, binLen = dv.getUint32(20 + jlen, true);
  const jobs = [];
  for (const m of json.materials || []) {
    const ref = m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorTexture;
    if (!ref) continue;
    const tex = json.textures[ref.index], img = json.images[tex.source], bv = json.bufferViews[img.bufferView];
    jobs.push({ material: m.name, bytes: new Uint8Array(buf, binStart + (bv.byteOffset || 0), bv.byteLength),
      mime: img.mimeType || 'image/png', tt: (ref.extensions || {}).KHR_texture_transform || null });
    delete m.pbrMetallicRoughness.baseColorTexture;
  }
  delete json.textures; delete json.images; delete json.samplers;
  if (json.extensionsRequired) json.extensionsRequired = json.extensionsRequired.filter(e => e !== 'KHR_texture_transform');
  const js = new TextEncoder().encode(JSON.stringify(json)), pad = (4 - js.length % 4) % 4;
  const out = new ArrayBuffer(20 + js.length + pad + 8 + binLen), o = new DataView(out), u = new Uint8Array(out);
  o.setUint32(0, 0x46546C67, true); o.setUint32(4, 2, true); o.setUint32(8, out.byteLength, true);
  o.setUint32(12, js.length + pad, true); o.setUint32(16, 0x4E4F534A, true); u.set(js, 20); u.fill(0x20, 20 + js.length, 20 + js.length + pad);
  const p = 20 + js.length + pad;
  o.setUint32(p, binLen, true); o.setUint32(p + 4, 0x004E4942, true); u.set(new Uint8Array(buf, binStart, binLen), p + 8);
  return { buf: out, jobs };
}
function glbTexture(job) {
  return new Promise((resolve, reject) => {
    let s = '';
    for (let i = 0; i < job.bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, job.bytes.subarray(i, i + 0x8000));
    const img = new Image();
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
      if (job.tt) { if (job.tt.offset) t.offset.fromArray(job.tt.offset); if (job.tt.scale) t.repeat.fromArray(job.tt.scale); }
      t.needsUpdate = true; resolve(t);
    };
    img.onerror = () => reject(new Error('textura ' + job.material));
    img.src = `data:${job.mime};base64,` + btoa(s);
  });
}
