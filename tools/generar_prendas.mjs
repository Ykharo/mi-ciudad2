// Genera las prendas nuevas (hechas por código, sin Blender):  node tools/generar_prendas.mjs [id…]
// Cada prenda está en tools/prendas/<archivo>.mjs y exporta ID y construir(cuerpo). Sale en
// assets/modelos/prendas/<id>.glb, validada (ver escribir.mjs). Su ficha va en src/characters/catalog/prendas.js.
import { cargarCuerpo } from './prendas/cuerpo.mjs';
import { escribirPrenda } from './prendas/escribir.mjs';
import { PRENDA } from '../src/characters/catalog/prendas.js';
import * as falda from './prendas/falda.mjs';
import * as chaqueta from './prendas/chaqueta.mjs';
import * as peloLargo from './prendas/pelo_largo.mjs';
import * as gorra from './prendas/gorra.mjs';
import * as lentes from './prendas/lentes.mjs';
import * as audifonos from './prendas/audifonos.mjs';
import * as mochila from './prendas/mochila.mjs';
import * as jockey from './prendas/jockey.mjs';
import * as audifonosGrandes from './prendas/audifonos_grandes.mjs';
import * as peloCorto from './prendas/pelo_corto.mjs';
import * as poleron from './prendas/poleron.mjs';
import * as buzo from './prendas/buzo.mjs';
import * as guantes from './prendas/guantes.mjs';
import * as polera from './prendas/polera.mjs';
import * as poleronOversize from './prendas/poleron_oversize.mjs';
import * as chaquetaOversize from './prendas/chaqueta_oversize.mjs';
import * as topCorto from './prendas/top_corto.mjs';
import * as pantalonAncho from './prendas/pantalon_ancho.mjs';
import * as zapatillasPlataforma from './prendas/zapatillas_plataforma.mjs';
import * as gorroLana from './prendas/gorro_lana.mjs';
import * as lentesSol from './prendas/lentes_sol.mjs';

// (los peinados van antes que los gorros y los audífonos grandes, que se calzan por fuera de ellos: gorra.mjs, queTapa)
const GENERADORES = [falda, chaqueta, peloLargo, peloCorto, gorra, lentes, audifonos, mochila, jockey, audifonosGrandes, poleron, buzo, guantes,
  polera.corta, polera.larga, poleronOversize, chaquetaOversize, topCorto, pantalonAncho, zapatillasPlataforma, gorroLana,
  lentesSol.aviador, lentesSol.clasicos, lentesSol.corazon];

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
