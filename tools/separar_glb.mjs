// Parte el modelo vestido de Nina en una base y un .glb por prenda:  node tools/separar_glb.mjs
//
//   entrada: herramientas_avatar/avatar_vestido.glb (lo que generan los scripts de Python)
//   salida:  assets/modelos/nina_base.glb       esqueleto + cuerpo, cabeza, orejas, capas de la cara + animaciones
//            assets/modelos/prendas/<id>.glb    una prenda (sus mallas skinneadas + el esqueleto, sin animaciones)
//
// Qué mallas son de cada prenda lo dice el catálogo (src/characters/catalog/prendas.js, campo `mallas`).
// Se conservan: el esqueleto (nombres y pose de reposo), los nombres de material y las extensiones
// (KHR_texture_transform de las texturas de la cara).
//
// Al final los vértices se cuantizan (KHR_mesh_quantization, que Three.js r149 lee sin nada extra): posición en
// 14 bits, normales en 10, pesos en 8, UV en 12. Pesa ~31 % menos y en la etapa 4 se revisó con el probador en todas
// las animaciones, de frente, de lado y de atrás: a la vista no cambia nada y no aparecen grietas.
// Las matrices de enlace de cada archivo quedan ajustadas a su propia cuantización: por eso cada prenda se enlaza
// con sus propias matrices (wardrobe.js), no con las de la base.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { cloneDocument, prune, quantize } from '@gltf-transform/functions';
import { mkdirSync, statSync } from 'node:fs';
import { PRENDAS } from '../src/characters/catalog/prendas.js';

const ENTRADA = 'herramientas_avatar/avatar_vestido.glb';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const original = await io.read(ENTRADA);
const kb = f => (statSync(f).size / 1024).toFixed(0) + ' KB';

const DEL_MODELO = PRENDAS.filter(p => p.mallas);   // las generadas por código (tools/generar_prendas.mjs) no están aquí
const todasLasPrendas = DEL_MODELO.flatMap(p => p.mallas);
const nodos = doc => doc.getRoot().listNodes();
for (const n of todasLasPrendas) if (!nodos(original).some(x => x.getName() === n)) throw new Error(`El modelo no tiene la malla ${n}`);

// deja en el documento sólo las mallas indicadas (el esqueleto y los nodos vacíos se quedan) y limpia lo que sobra
async function separar(quedan, conAnimaciones, salida) {
  const doc = cloneDocument(original);
  for (const n of nodos(doc)) if (n.getMesh() && !quedan.includes(n.getName())) n.dispose();
  // (los muestreadores y canales hay que soltarlos a mano: si no, sus datos se quedan en el archivo)
  if (!conAnimaciones) for (const a of doc.getRoot().listAnimations()) { a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(s => s.dispose()); a.dispose(); }
  // keepLeaves: los huesos de las puntas (manos, pies, cabeza) no tienen hijos, pero son parte del esqueleto
  await doc.transform(
    prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeWeight: 8, quantizeTexcoord: 12 }),
  );
  await io.write(salida, doc);
  const mallas = doc.getRoot().listMeshes().map(m => m.getName()).join(', ');
  console.log(`${salida.padEnd(40)} ${kb(salida).padStart(8)}   ${mallas}${conAnimaciones ? ` + ${doc.getRoot().listAnimations().length} animaciones` : ''}`);
}

mkdirSync('assets/modelos/prendas', { recursive: true });
const base = nodos(original).filter(n => n.getMesh() && !todasLasPrendas.includes(n.getName())).map(n => n.getName());
await separar(base, true, 'assets/modelos/nina_base.glb');
for (const p of DEL_MODELO) await separar(p.mallas, false, `assets/modelos/prendas/${p.id}.glb`);
console.log(`(original ${kb(ENTRADA)})`);
