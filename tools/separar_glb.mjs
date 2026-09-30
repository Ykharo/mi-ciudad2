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
import { cloneDocument, compactPrimitive, prune, quantize } from '@gltf-transform/functions';
import { mkdirSync, statSync } from 'node:fs';
import { PRENDAS } from '../src/characters/catalog/prendas.js';
import { CENTRO_MOÑO, RADIO_MOÑO, agregarFormas, cargarCuerpo, formasCabeza, juntarFormas, piezasCerca } from './prendas/cuerpo.mjs';
import { agregarBailes } from './animaciones/bailes.mjs';

const ENTRADA = 'herramientas_avatar/avatar_vestido.glb';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const original = await io.read(ENTRADA);
const kb = f => (statSync(f).size / 1024).toFixed(0) + ' KB';
const FORMAS = formasCabeza(await cargarCuerpo());

const DEL_MODELO = PRENDAS.filter(p => p.mallas);   // las generadas por código (tools/generar_prendas.mjs) no están aquí
const todasLasPrendas = DEL_MODELO.flatMap(p => p.mallas);
const nodos = doc => doc.getRoot().listNodes();
for (const n of todasLasPrendas) if (!nodos(original).some(x => x.getName() === n)) throw new Error(`El modelo no tiene la malla ${n}`);

// deja en el documento sólo las mallas indicadas (el esqueleto y los nodos vacíos se quedan) y limpia lo que sobra
async function separar(quedan, conAnimaciones, salida) {
  const doc = cloneDocument(original);
  for (const n of nodos(doc)) if (n.getMesh() && !quedan.includes(n.getName())) n.dispose();
  for (const a of APARTAR) apartar(doc, a);
  agregarFormas(doc, FORMAS);   // formas de cabeza (cuerpo.mjs): a la cabeza, las orejas y el moño
  // los bailes nuevos (tools/animaciones/bailes.mjs), junto a las 11 de siempre (SIN_BAILES=1: sin ellos, para comparar)
  if (conAnimaciones && !process.env.SIN_BAILES) agregarBailes(doc);
  // (los muestreadores y canales hay que soltarlos a mano: si no, sus datos se quedan en el archivo)
  if (!conAnimaciones) for (const a of doc.getRoot().listAnimations()) { a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(s => s.dispose()); a.dispose(); }
  // keepLeaves: los huesos de las puntas (manos, pies, cabeza) no tienen hijos, pero son parte del esqueleto
  await doc.transform(
    prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeWeight: 8, quantizeTexcoord: 12 }),
  );
  juntarFormas(doc);
  await io.write(salida, doc);
  const mallas = doc.getRoot().listMeshes().map(m => m.getName() + ((m.getExtras().targetNames || []).length ? '*' : '')).join(', ');   // * = con formas de cabeza
  console.log(`${salida.padEnd(40)} ${kb(salida).padStart(8)}   ${mallas}${conAnimaciones ? ` + ${doc.getRoot().listAnimations().length} animaciones` : ''}`);
}

// Partes que pasan a su propia malla (con los mismos materiales) para que una prenda las pueda esconder
// (catálogo: `oculta`). Van en orden: cada una se saca de lo que dejó la anterior.
//   huesos: los triángulos cuyos 3 vértices pesan más en alguno de estos huesos (regiones del cuerpo, PLAN.md 3.7)
//   cerca:  las piezas sueltas cuyo centro queda cerca de un punto
const PIERNA = ['ThighL', 'ThighR', 'ShinL', 'ShinR'], PIE = ['FootL', 'FootR'];
const APARTAR = [
  // pies: bajo las zapatillas (llegan a 0,183 m; la zapatilla, a 0,184)
  { de: 'Body_Base', a: 'Body_Pies', huesos: PIE },
  // cadera, muslos, canillas y tobillos: bajo el pantalón (lo de la cadera llega a 0,837 m; la cintura, a 0,856)
  { de: 'Body_Base', a: 'Body_Piernas', huesos: ['Hips', ...PIERNA, ...PIE] },
  // brazos y antebrazos: bajo las mangas de la chaqueta (las manos no)
  { de: 'Body_Base', a: 'Body_Brazos', huesos: ['UpperArmL', 'UpperArmR', 'ForearmL', 'ForearmR'] },
  // el tope del moño (el moño, sus lazadas, el coletero y el mechón que cae de él): bajo la gorra
  { de: 'Pelo_Moño', a: 'Pelo_Moño_Tope', cerca: [CENTRO_MOÑO, RADIO_MOÑO] },
];

function apartar(doc, { de, a, huesos, cerca }) {
  const nodo = nodos(doc).find(n => n.getName() === de);
  if (!nodo) return;
  const JOINTS = nodo.getSkin().listJoints().map(j => j.getName());
  const malla = doc.createMesh(a);
  for (const p of nodo.getMesh().listPrimitives()) {
    const idx = p.getIndices(), I = idx.getArray();
    let marca;
    if (cerca) marca = piezasCerca(p.getAttribute('POSITION').getArray(), I, ...cerca);
    else {
      const J = p.getAttribute('JOINTS_0').getArray(), W = p.getAttribute('WEIGHTS_0').getArray();
      const dominante = i => { let b = 0; for (let k = 1; k < 4; k++) if (W[i * 4 + k] > W[i * 4 + b]) b = k; return JOINTS[J[i * 4 + b]]; };
      marca = Uint8Array.from({ length: I.length / 3 }, (_, t) => ([0, 1, 2].every(k => huesos.includes(dominante(I[t * 3 + k]))) ? 1 : 0));
    }
    const quedan = [], van = [];
    for (let t = 0; t < I.length; t += 3) (marca[t / 3] ? van : quedan).push(I[t], I[t + 1], I[t + 2]);
    if (!van.length) continue;
    const q = p.clone();
    p.setIndices(doc.createAccessor().setType('SCALAR').setArray(new I.constructor(quedan)).setBuffer(idx.getBuffer()));
    q.setIndices(doc.createAccessor().setType('SCALAR').setArray(new I.constructor(van)).setBuffer(idx.getBuffer()));
    malla.addPrimitive(q);
    compactPrimitive(p); compactPrimitive(q);   // cada una se queda sólo con sus vértices
    console.log(`  ${a}: ${van.length / 3} de ${I.length / 3} triángulos de ${de} (${p.getMaterial().getName()})`);
  }
  const n = doc.createNode(a).setMesh(malla).setSkin(nodo.getSkin());
  (nodo.getParentNode() || doc.getRoot().listScenes()[0]).addChild(n);
}

mkdirSync('assets/modelos/prendas', { recursive: true });
const base = nodos(original).filter(n => n.getMesh() && !todasLasPrendas.includes(n.getName())).map(n => n.getName());
await separar(base, true, 'assets/modelos/nina_base.glb');
for (const p of DEL_MODELO) await separar(p.mallas, false, `assets/modelos/prendas/${p.id}.glb`);
console.log(`(original ${kb(ENTRADA)})`);
