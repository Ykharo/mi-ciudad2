// Ropa: pegar prendas (un .glb cada una) al esqueleto de un personaje, quitarlas y aplicar colores (PLAN.md 3.5).
// Una prenda son mallas skinneadas al mismo esqueleto que la base (mismos nombres de hueso y pose de reposo):
// se clonan (la geometría se comparte) y se enlazan a los huesos del personaje buscándolos por nombre.
import { THREE } from '../engine/three.js';
import { loadGLB, loadedGLB } from '../assets/loader.js';
import { PRENDA, PRENDAS, SLOTS } from './catalog/prendas.js';
import { lookMaterials } from './looks.js';

// La sombra la hacen el cuerpo, la cabeza y las prendas marcadas con `sombra` en el catálogo (el pelo); la ropa
// pegada al cuerpo no hace falta: la mitad de trabajo. (Hasta la etapa 4 esto iba por nombre de malla y el pelo
// nunca calzó: Three.js llama a sus mallas Pelo_Moño_1..3, una por material.)
const SHADOW_PARTS = new Set(['Body_Base', 'Body_Brazos', 'Body_Piernas', 'Body_Pies', 'Head_Base']);
function setupMesh(o, sombra = SHADOW_PARTS.has(o.name)) {
  o.frustumCulled = false;
  o.castShadow = sombra;
  o.receiveShadow = ![].concat(o.material).every(m => m.transparent);
}

// Materiales compartidos entre personajes: uno por (material del modelo, color, visible). Dos vecinos con la
// misma polera usan el mismo material. Las capas de la cara (ojos, cejas, boca) sí son de cada personaje,
// porque cada uno pone su propia expresión (se clona sólo la textura: la imagen se comparte).
// Nunca se modifica un material ya repartido: para cambiar un color se cambia de material (applyLook).
const FACE_LAYERS = /^Face_(Eyes|Eyebrows|Mouth)$/;
const sharedMats = new Map();
function sharedMat(m, color, hidden) {
  const key = m.uuid + '|' + (color || '') + (hidden ? '|oculto' : '');
  let n = sharedMats.get(key);
  if (!n) { n = m.clone(); if (color) n.color.set(color); if (hidden) n.visible = false; sharedMats.set(key, n); }
  return n;
}
const srcMat = new WeakMap();   // malla del personaje → material original del modelo
// Una parte del cuerpo escondida bajo la ropa sigue haciendo su sombra (la ropa pegada no hace sombra): se dibuja
// con este material, que no pinta nada (la sombra usa su propio material de profundidad).
const FANTASMA = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
FANTASMA.name = 'Fantasma';

// Partes que esconden las prendas puestas (`oculta` en el catálogo): las regiones del cuerpo bajo la ropa que las tapa
// entera (PLAN.md 3.7), el tope del moño bajo la gorra, las orejas bajo el pelo largo.
function ocultasPor(c) {
  return new Set(Object.values(c.prendas).flatMap(p => (PRENDA[p.id] && PRENDA[p.id].oculta) || []));
}

// Pone a cada malla del personaje el material que le toca según el look (colores y extras escondidos), la forma de
// cabeza, y esconde lo que tapan sus prendas. Se esconde el objeto (es de cada personaje), no el material (compartido); las partes del
// cuerpo, con FANTASMA.
function applyLook(c, look) {
  const ocultas = ocultasPor(c), antes = c.ocultas || new Set();
  c.ocultas = ocultas;
  const { colors, hidden } = lookMaterials(look);
  const faces = c.faceMats || (c.faceMats = new Map());
  const pick = m => {
    let n;
    if (m.map && FACE_LAYERS.test(m.name)) {
      n = faces.get(m);
      if (!n) { n = m.clone(); n.map = m.map.clone(); n.map.needsUpdate = true; faces.set(m, n); }
    } else n = sharedMat(m, colors[m.name], hidden.has(m.name));
    c.mats[m.name] = n;
    return n;
  };
  // la parte escondida (o que ya no lo está) a la que pertenece una malla: la malla misma o su grupo (una parte de
  // varios materiales es un grupo con una malla por material)
  const parte = o => [o.name, o.parent && o.parent.name].find(n => ocultas.has(n) || antes.has(n));
  c.model.traverse(o => {
    if (!o.isMesh) return;
    if (!srcMat.has(o)) srcMat.set(o, o.material);
    // formas de cabeza del look (la cabeza y lo que va sobre ella las tienen como morph targets)
    if (o.morphTargetDictionary) for (const [f, i] of Object.entries(o.morphTargetDictionary)) o.morphTargetInfluences[i] = (look && look.formas && look.formas[f]) || 0;
    const src = srcMat.get(o), n = parte(o);
    if (n && ocultas.has(n) && SHADOW_PARTS.has(n)) { o.material = FANTASMA; o.visible = true; return; }
    o.material = Array.isArray(src) ? src.map(pick) : pick(src);
    if (n) o.visible = !ocultas.has(n);
  });
}

// Las mallas de una prenda: lo que cuelga de la raíz del .glb y no es el esqueleto.
function prendaRoots(g) {
  return g.scene.children.filter(o => { let skinned = false; o.traverse(x => { if (x.isSkinnedMesh) skinned = true; }); return skinned; });
}

// Pega una prenda ya cargada (sin esperar). Reemplaza lo que hubiera en ese espacio del cuerpo.
function attachPrenda(c, slot, id) {
  const g = loadedGLB('prenda:' + id);
  if (!g) throw new Error(`La prenda ${id} no está cargada`);
  detachPrenda(c, slot);
  const partes = prendaRoots(g).map(src => {
    const obj = src.clone();
    obj.traverse(o => {
      if (!o.isSkinnedMesh) return;
      const s = o.skeleton;
      o.bind(new THREE.Skeleton(s.bones.map(b => c.bones[b.name]), s.boneInverses), o.bindMatrix);
      setupMesh(o, !!(PRENDA[id] && PRENDA[id].sombra));
    });
    c.model.add(obj);
    return obj;
  });
  c.prendas[slot] = { id, partes };
}
function detachPrenda(c, slot) {
  const p = c.prendas[slot]; if (!p) return;
  p.partes.forEach(o => c.model.remove(o));
  delete c.prendas[slot];
}

// Viste a un personaje recién creado con las prendas de su look (tienen que estar cargadas: loadPrendas).
// Se visten en el orden de SLOTS (el orden no cambia el dibujo: se comprobó con las capturas en la etapa 4).
function dress(c, look) {
  for (const slot of SLOTS) { const sel = look && look.prendas && look.prendas[slot]; if (sel) attachPrenda(c, slot, sel.id); }
  applyLook(c, look);
}

// Carga (una vez) las prendas que usan estos looks.
function loadPrendas(looks) {
  const ids = new Set();
  for (const l of looks) for (const sel of Object.values((l && l.prendas) || {})) ids.add(sel.id);
  return Promise.all([...ids].map(id => loadGLB('prenda:' + id)));
}

// Color con que viene un material en el modelo ('#rrggbb', o null si no está cargado): la muestra "como viene"
// del Vestidor.
function factoryColor(matName) {
  for (const id of ['nina_base', ...PRENDAS.map(p => 'prenda:' + p.id)]) {
    const g = loadedGLB(id); if (!g) continue;
    let hex = null;
    g.scene.traverse(o => { if (!hex && o.isMesh) for (const m of [].concat(o.material)) if (m.name === matName) hex = '#' + m.color.getHexString(); });
    if (hex) return hex;
  }
  return null;
}

// Para el Vestidor (etapa 5): cambiar la ropa de un personaje que ya está en la escena.
async function ponerPrenda(c, slot, sel) {
  await loadGLB('prenda:' + sel.id);
  c.look.prendas[slot] = sel;
  attachPrenda(c, slot, sel.id);
  applyLook(c, c.look);
}
function quitarPrenda(c, slot) {
  delete c.look.prendas[slot];
  detachPrenda(c, slot);
  applyLook(c, c.look);
}
function recolorear(c, look) { c.look = look; applyLook(c, look); }

export { dress, factoryColor, loadPrendas, ponerPrenda, quitarPrenda, recolorear, setupMesh };
