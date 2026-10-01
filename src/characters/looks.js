// Looks de personajes: qué color lleva cada material, vecinos al azar desde plantillas y validación de lo guardado.
import { THREE } from '../engine/three.js';
import { shade, tint } from '../engine/materials.js';
import { PALETAS } from './catalog/paletas.js';
import { PIEL, PRENDA, SLOTS, SLOTS_OPCIONALES } from './catalog/prendas.js';
import { FORMAS_CABEZA, LOOK_NINA, VECINOS } from './catalog/personajes.js';

const dark = hex => new THREE.Color(hex).getHSL({}).l < 0.3;
// reglas de los derivados (ver catalog/prendas.js)
const REGLAS = {
  sombra: (c, k) => shade(c, k),
  contraste: (c, k, blanco) => dark(c) ? tint(c, blanco) : shade(c, k),
};
const derivar = (col, [canal, regla, ...k]) => col[canal] ? REGLAS[regla](col[canal], ...k) : null;

// look → { colors: { material: '#hex' }, hidden: Set(material) }. Los materiales que no aparecen no se tocan.
function lookMaterials(look) {
  const colors = {}, hidden = new Set();
  if (!look) return { colors, hidden };
  const aplicar = (col, canales, derivados) => {
    for (const [canal, C] of Object.entries(canales)) {
      if (!col[canal] && C.siFalta) col[canal] = derivar(col, C.siFalta);
      if (col[canal]) for (const m of C.mats) colors[m] = col[canal];
    }
    for (const [m, d] of Object.entries(derivados || {})) { const c = derivar(col, d); if (c) colors[m] = c; }
  };
  if (look.piel) aplicar({ principal: look.piel }, { principal: { mats: PIEL.mats } }, PIEL.derivados);
  for (const sel of Object.values(look.prendas || {})) {
    const P = PRENDA[sel.id]; if (!P) continue;
    aplicar({ ...(sel.colores || {}) }, P.canales, P.derivados);
    for (const [e, visible] of Object.entries(sel.extras || {})) if (visible === false && P.extras && P.extras[e]) hidden.add(e);
  }
  return { colors, hidden };
}

// un vecino al azar según las plantillas (r = generador de azar, para que salgan siempre los mismos)
// (ver las plantillas en catalog/personajes.js: el orden del sorteo está documentado ahí)
function randomLook(r = Math.random) {
  const elegir = lista => lista[Math.floor(r() * lista.length)];
  let x = r() * VECINOS.reduce((s, v) => s + v.peso, 0);
  const T = VECINOS.find(v => (x -= v.peso) < 0) || VECINOS[0];
  const look = { base: 'nina', piel: null, escala: 1, cabeza: 1, prendas: {} };
  for (const [slot, ids] of Object.entries(T.prendas)) look.prendas[slot] = { id: elegir(ids) };
  for (const o of T.opcionales || []) {
    if (r() >= o.prob) continue;
    const id = elegir(o.ids);
    look.prendas[PRENDA[id].slot] = { id };
  }
  look.piel = elegir(PALETAS.piel);
  for (const [slot, sel] of Object.entries(look.prendas)) {
    const P = PRENDA[sel.id];
    sel.colores = {}; sel.extras = {};
    for (const [canal, C] of Object.entries(P.canales)) if (slot === 'pelo' || r() < T.colorProb) sel.colores[canal] = elegir(PALETAS[C.paleta]);
    for (const e of Object.keys(P.extras || {})) sel.extras[e] = r() < 0.7;
  }
  look.escala = T.escala[0] + r() * T.escala[1];
  look.cabeza = T.cabeza[0] + r() * T.cabeza[1];
  if (r() < T.formaRedonda) look.formas = { redonda: 1 };
  return look;
}

// Valida un look guardado contra el catálogo (como fixCarSpec con los autos): lo que no calza vuelve a lo de fábrica
// (`defecto`: el look del personaje, Nina si no se dice). Un espacio opcional que el look guardado no tiene queda
// vacío (se sacó la chaqueta), aunque el personaje venga con algo ahí.
const HEX = /^#[0-9a-f]{6}$/i;
const enRango = (v, a, b, def) => typeof v === 'number' && v >= a && v <= b ? v : def;
function fixLook(l, defecto = LOOK_NINA) {
  const r = JSON.parse(JSON.stringify(defecto));
  if (!l || typeof l !== 'object') return r;
  r.piel = HEX.test(l.piel) ? l.piel : null;
  r.escala = enRango(l.escala, 0.8, 1.2, r.escala);
  r.cabeza = enRango(l.cabeza, 0.85, 1.15, r.cabeza);
  if (l.formas && typeof l.formas === 'object') {
    delete r.formas;
    for (const f of FORMAS_CABEZA) {
      const v = enRango(l.formas[f], 0, 1, 0);
      if (v) (r.formas = r.formas || {})[f] = v;
    }
  }
  if (l.prendas && typeof l.prendas === 'object') for (const slot of SLOTS_OPCIONALES) if (!l.prendas[slot]) delete r.prendas[slot];
  for (const slot of SLOTS) {
    const sel = l.prendas && l.prendas[slot], P = sel && PRENDA[sel.id];
    if (!P || P.slot !== slot) continue;   // se queda la de fábrica
    const out = { id: P.id }, colores = {}, extras = {};
    for (const canal of Object.keys(P.canales)) if (sel.colores && HEX.test(sel.colores[canal])) colores[canal] = sel.colores[canal];
    for (const e of Object.keys(P.extras || {})) if (sel.extras && typeof sel.extras[e] === 'boolean') extras[e] = sel.extras[e];
    if (Object.keys(colores).length) out.colores = colores;
    if (Object.keys(extras).length) out.extras = extras;
    r.prendas[slot] = out;
  }
  return r;
}

export { fixLook, lookMaterials, randomLook };
