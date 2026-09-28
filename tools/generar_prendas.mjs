// Genera las prendas nuevas (hechas por código, sin Blender):  node tools/generar_prendas.mjs [id…]
// Cada prenda está en tools/prendas/<archivo>.mjs y exporta ID y construir(cuerpo). Sale en
// assets/modelos/prendas/<id>.glb, validada (ver escribir.mjs). Su ficha va en src/characters/catalog/prendas.js.
import { cargarCuerpo } from './prendas/cuerpo.mjs';
import { escribirPrenda } from './prendas/escribir.mjs';
import { PRENDA } from '../src/characters/catalog/prendas.js';
import * as falda from './prendas/falda.mjs';
import * as chaqueta from './prendas/chaqueta.mjs';
import * as peloLargo from './prendas/pelo_largo.mjs';

const GENERADORES = [falda, chaqueta, peloLargo];

// materiales que el catálogo conoce para una prenda (canales, derivados, extras y fijos)
const declarados = P => [...Object.values(P.canales || {}).flatMap(c => c.mats), ...Object.keys(P.derivados || {}),
  ...Object.keys(P.extras || {}), ...(P.fijos || [])];

const pedidos = process.argv.slice(2);
const C = await cargarCuerpo();
for (const g of GENERADORES) {
  if (pedidos.length && !pedidos.includes(g.ID)) continue;
  const P = PRENDA[g.ID];
  if (!P) throw new Error(`La prenda ${g.ID} no está en el catálogo (src/characters/catalog/prendas.js)`);
  const t0 = Date.now(), { mallas, materiales } = g.construir(C);
  await escribirPrenda(C, g.ID, mallas, materiales, declarados(P));
  console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
