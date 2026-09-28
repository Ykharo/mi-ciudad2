// Looks de personajes: qué color lleva cada material, vecinos al azar desde plantillas y validación de lo guardado.
import { THREE } from '../engine/three.js';
import { shade, tint } from '../engine/materials.js';
import { PALETAS } from './catalog/paletas.js';
import { PIEL, PRENDA, SLOTS } from './catalog/prendas.js';
import { LOOK_NINA, VECINOS } from './catalog/personajes.js';

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
function randomLook(r = Math.random) {
  // con una sola plantilla no se sortea cuál usar: así los vecinos de siempre no cambian
  let T = VECINOS[0];
  if (VECINOS.length > 1) { let x = r() * VECINOS.reduce((s, v) => s + v.peso, 0); T = VECINOS.find(v => (x -= v.peso) < 0) || T; }
  const look = { base: 'nina', piel: null, escala: 1, cabeza: 1, prendas: {} };
  for (const [slot, id] of Object.entries(T.prendas)) look.prendas[slot] = { id, colores: {}, extras: {} };
  for (const s of T.sorteo) {
    let v;
    if (s.paleta) { const pal = PALETAS[s.paleta]; v = pal[Math.floor(r() * pal.length)]; }
    else if (s.prob != null) v = r() < s.prob;
    else v = s.min + r() * s.rango;
    if (s.campo) look[s.campo] = v;
    else if (s.canal) look.prendas[s.prenda].colores[s.canal] = v;
    else look.prendas[s.prenda].extras[s.extra] = v;
  }
  return look;
}

// Valida un look guardado contra el catálogo (como fixCarSpec con los autos): lo que no calza vuelve a lo de fábrica.
const HEX = /^#[0-9a-f]{6}$/i;
const enRango = (v, a, b, def) => typeof v === 'number' && v >= a && v <= b ? v : def;
function fixLook(l) {
  const r = JSON.parse(JSON.stringify(LOOK_NINA));
  if (!l || typeof l !== 'object') return r;
  if (HEX.test(l.piel)) r.piel = l.piel;
  r.escala = enRango(l.escala, 0.8, 1.2, 1);
  r.cabeza = enRango(l.cabeza, 0.85, 1.15, 1);
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
