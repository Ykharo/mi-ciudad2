// SÓLO DATOS. Personajes y plantillas de vecinos.
//
// Un "look" es JSON puro (se guarda, se valida con fixLook y se usa igual para Nina y los vecinos):
//   { base, piel, escala, cabeza, formas: { forma: 0..1 },
//     prendas: { slot: { id, colores: { canal: '#RRGGBB' }, extras: { nombre: bool } } } }
// Lo que no se indica queda como viene en el modelo: el look de fábrica de Nina no cambia ningún color.
//
// formas: cuánto de cada forma de cabeza (morph targets; se definen en tools/prendas/cuerpo.mjs y las llevan la
// cabeza y todo lo que va sobre ella, para que el pelo y los gorros se adapten). No se elige en el Vestidor.
export const FORMAS_CABEZA = ['redonda'];   // nuca más redonda (referencias/ropa/hoja_personaje_nino.png)
export const LOOK_NINA = {
  base: 'nina', piel: null, escala: 1, cabeza: 1,
  prendas: { pelo: { id: 'mono' }, torso: { id: 'peto' }, piernas: { id: 'pantalon_cargo' }, pies: { id: 'zapatillas' } },
};

// Personajes jugables (se eligen al empezar y con el botón de arriba; cada uno guarda su propio look). Los nombres de
// la amiga y el amigo son provisorios. `ic`: emoji del botón para elegirlo.
// Amiga: referencias/ropa/hoja_personaje_nuevo.png (1,40 m). Amigo: referencias/ropa/hoja_personaje_nino.png (1,35 m,
// cabeza más redonda). Más bajitos que Nina y con la cabeza un poco más grande. Cada uno con la ropa de su hoja.
export const PERSONAJES = {
  nina: { nombre: 'Nina', ic: '👧', look: LOOK_NINA },
  amiga: { nombre: 'Amiga', ic: '👱‍♀️', look: {
    base: 'nina', piel: null, escala: 0.86, cabeza: 1.06,
    prendas: {
      pelo: { id: 'pelo_largo', colores: { principal: '#E0A84E' } },
      torso: { id: 'top_corto' },
      abrigo: { id: 'chaqueta_oversize' },
      piernas: { id: 'pantalon_ancho' },
      pies: { id: 'zapatillas_plataforma' },
      cabeza: { id: 'gorra' },
      cuello: { id: 'audifonos' },
      espalda: { id: 'mochila' },
    },
  } },
  amigo: { nombre: 'Amigo', ic: '👦', look: {
    base: 'nina', piel: null, escala: 0.83, cabeza: 1.08, formas: { redonda: 1 },
    prendas: {
      pelo: { id: 'pelo_corto' },
      torso: { id: 'peto', colores: { principal: '#2E3350' }, extras: { Top_Emblem: false } },
      abrigo: { id: 'poleron' },
      piernas: { id: 'buzo' },
      pies: { id: 'zapatillas', colores: { principal: '#2E3350', panel: '#FFFFFF' } },
      cabeza: { id: 'jockey' },
      orejas: { id: 'audifonos_grandes' },
      espalda: { id: 'mochila' },
      manos: { id: 'guantes' },
    },
  } },
};
export const ORDEN_PERSONAJES = ['nina', 'amiga', 'amigo'];

// Plantillas de vecinos, por estilo (characters/looks.js → randomLook). Para cada vecino se sortea la plantilla (según
// su peso) y después, en este orden:
//   prendas      una prenda de cada lista (espacios que siempre llevan algo)
//   opcionales   [{ prob, ids }]: con esa probabilidad, una prenda de la lista (su espacio sale del catálogo; dos
//                del mismo espacio se reemplazan: la última gana)
//   colores      la piel (paleta piel); para cada canal de cada prenda, con probabilidad `colorProb` un color de la
//                paleta del canal (si no, el de fábrica); los del pelo siempre se sortean
//   extras       cada extra se ve con probabilidad 0,7
//   escala, cabeza [mínimo, rango]; formaRedonda: probabilidad de la cabeza redonda
// Todo sale del generador con semilla de game/npcs.js: cambiar las plantillas cambia a todos los vecinos (y las capturas).
export const VECINOS = [
  { nombre: 'clásico', peso: 3, colorProb: 1,
    prendas: { pelo: ['mono', 'pelo_largo', 'pelo_corto'], torso: ['peto', 'polera_corta', 'polera_larga'], piernas: ['pantalon_cargo', 'falda_tableada'], pies: ['zapatillas'] },
    opcionales: [{ prob: 0.3, ids: ['chaqueta'] }, { prob: 0.2, ids: ['lentes', 'lentes_corazon'] }, { prob: 0.15, ids: ['gorra'] }],
    escala: [0.86, 0.2], cabeza: [0.95, 0.12], formaRedonda: 0.15 },
  { nombre: 'urbano', peso: 3, colorProb: 0.55,
    prendas: { pelo: ['pelo_corto', 'pelo_largo', 'mono'], torso: ['polera_corta', 'polera_larga', 'top_corto'], piernas: ['buzo', 'pantalon_ancho', 'pantalon_cargo'], pies: ['zapatillas', 'zapatillas_plataforma'] },
    opcionales: [
      { prob: 0.8, ids: ['poleron', 'poleron_oversize', 'chaqueta_oversize'] },
      { prob: 0.5, ids: ['gorra', 'jockey', 'gorro_lana'] },
      { prob: 0.35, ids: ['audifonos_grandes', 'audifonos'] },
      { prob: 0.3, ids: ['lentes_aviador', 'lentes_clasicos', 'lentes_corazon'] },
      { prob: 0.3, ids: ['mochila'] },
      { prob: 0.12, ids: ['guantes'] },
    ],
    escala: [0.82, 0.2], cabeza: [0.97, 0.12], formaRedonda: 0.35 },
];
