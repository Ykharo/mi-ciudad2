// Escribe una prenda generada como .glb: el mismo esqueleto del modelo original + sus mallas skinneadas, sus
// materiales (y texturas), sin animaciones; cuantizado igual que las prendas separadas (tools/separar_glb.mjs).
// Antes de escribir la valida: huesos, pesos, materiales del catálogo y tamaño.
import { cloneDocument, prune, quantize } from '@gltf-transform/functions';
import { statSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { agregarFormas, formasCabeza, io, juntarFormas, normales } from './cuerpo.mjs';

// tope por prenda: cada una se descarga sólo si alguien la usa (antes eran 450 KB, cuando además iban todas dentro
// de la versión de un solo archivo, que se quitó)
const TOPE_KB = 650;
const lineal = hex => { const c = parseInt(hex.slice(1), 16); return [c >> 16, (c >> 8) & 255, c & 255].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); };

// PNG en escala de grises (o RGB) sin dependencias: px(x, y) → 0–255 (o [r, g, b])
export function png(ancho, alto, px) {
  const rgb = Array.isArray(px(0, 0)), bpp = rgb ? 3 : 1;
  const raw = Buffer.alloc((ancho * bpp + 1) * alto);
  for (let y = 0; y < alto; y++) {
    raw[y * (ancho * bpp + 1)] = 0;
    for (let x = 0; x < ancho; x++) { const v = px(x, y), o = y * (ancho * bpp + 1) + 1 + x * bpp; if (rgb) raw.set(v, o); else raw[o] = v; }
  }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (tipo, datos) => { const t = Buffer.from(tipo), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(datos.length); c.writeUInt32BE(crc(Buffer.concat([t, datos]))); return Buffer.concat([l, t, datos, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = 8; ihdr[9] = rgb ? 2 : 0;
  return new Uint8Array(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

// mallas: [{ nombre, malla }]; materiales: { nombre: { color: '#rrggbb', textura?: Uint8Array (png), rugosidad? } }
export async function escribirPrenda(C, id, mallas, materiales, declarados) {
  const doc = cloneDocument(C.doc), root = doc.getRoot();
  for (const n of root.listNodes()) if (n.getMesh()) n.dispose();
  for (const a of root.listAnimations()) { a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(s => s.dispose()); a.dispose(); }
  const skin = root.listSkins()[0], JOINTS = skin.listJoints().map(j => j.getName()), buf = root.listBuffers()[0], scene = root.listScenes()[0];
  const mats = {};
  for (const [n, m] of Object.entries(materiales)) {
    const mat = doc.createMaterial(n).setBaseColorFactor([...lineal(m.color), 1]).setMetallicFactor(0)
      .setRoughnessFactor(m.rugosidad ?? 0.8).setDoubleSided(true);
    if (m.textura) mat.setBaseColorTexture(doc.createTexture(n).setImage(m.textura).setMimeType('image/png'));
    mats[n] = mat;
  }
  const errores = [];
  for (const { nombre, malla: m } of mallas) {
    const N = normales(m.V, m.F), nV = m.V.length;
    const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2);
    const jo = new Uint16Array(nV * 4), we = new Float32Array(nV * 4);
    m.V.forEach((v, i) => {
      pos.set([v.x, v.y, v.z], i * 3); nor.set([N[i].x, N[i].y, N[i].z], i * 3); uv.set(m.UV[i], i * 2);
      const p = m.pesos[i] || [];
      if (!p.length) errores.push(`${nombre}: vértice ${i} sin pesos`);
      let s = 0;
      p.forEach(([j, w], k) => { const ji = JOINTS.indexOf(j); if (ji < 0) errores.push(`hueso desconocido ${j}`); jo[i * 4 + k] = ji; we[i * 4 + k] = w; s += w; });
      if (Math.abs(s - 1) > 1e-3) errores.push(`${nombre}: pesos del vértice ${i} suman ${s.toFixed(3)}`);
    });
    const acc = (arr, tipo) => doc.createAccessor().setArray(arr).setType(tipo).setBuffer(buf);
    const attrs = { POSITION: acc(pos, 'VEC3'), NORMAL: acc(nor, 'VEC3'), JOINTS_0: acc(jo, 'VEC4'), WEIGHTS_0: acc(we, 'VEC4') };
    if (m.UV.some(t => t[0] || t[1])) attrs.TEXCOORD_0 = acc(uv, 'VEC2');
    const mesh = doc.createMesh(nombre);
    for (const mn of [...new Set(m.M)]) {
      if (!mats[mn]) errores.push(`material sin definir: ${mn}`);
      if (declarados && !declarados.includes(mn)) errores.push(`material ${mn} no está en el catálogo (canales/derivados/extras/fijos)`);
      const idx = []; m.F.forEach((f, k) => { if (m.M[k] === mn) idx.push(...f); });
      const prim = doc.createPrimitive().setMaterial(mats[mn]).setIndices(acc(new Uint32Array(idx), 'SCALAR'));
      for (const [k, a] of Object.entries(attrs)) prim.setAttribute(k, a);
      mesh.addPrimitive(prim);
    }
    scene.addChild(doc.createNode(nombre).setMesh(mesh).setSkin(skin));
  }
  if (JOINTS.length !== 17) errores.push(`el esqueleto tiene ${JOINTS.length} huesos (se esperaban 17)`);
  if (errores.length) throw new Error(`La prenda ${id} no pasó la validación:\n  ` + [...new Set(errores)].slice(0, 20).join('\n  '));
  agregarFormas(doc, C.formas || (C.formas = formasCabeza(C)));   // formas de cabeza, si la prenda llega a la cabeza
  await doc.transform(
    prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeWeight: 8, quantizeTexcoord: 12 }),
  );
  const salida = `assets/modelos/prendas/${id}.glb`;
  juntarFormas(doc);
  await io.write(salida, doc);
  const kb = statSync(salida).size / 1024, nV = mallas.reduce((a, x) => a + x.malla.V.length, 0);
  const formas = [...new Set(root.listMeshes().flatMap(m => (m.getExtras().targetNames || [])))];
  console.log(`${salida.padEnd(44)} ${kb.toFixed(0).padStart(5)} KB  ${nV} vértices  ${Object.keys(materiales).join(', ')}${formas.length ? '  formas: ' + formas.join(', ') : ''}`);
  if (kb > TOPE_KB) throw new Error(`${id} pesa ${kb.toFixed(0)} KB (tope ${TOPE_KB} KB)`);
}
