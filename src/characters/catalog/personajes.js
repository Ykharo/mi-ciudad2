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
// cabeza más redonda). Más bajitos que Nina y con la cabeza un poco más grande. El amigo ya tiene su ropa; la amiga,
// mientras no esté la suya (etapa 7), usa la que hay con los colores de su hoja.
export const PERSONAJES = {
  nina: { nombre: 'Nina', ic: '👧', look: LOOK_NINA },
  amiga: { nombre: 'Amiga', ic: '👱‍♀️', look: {
    base: 'nina', piel: null, escala: 0.86, cabeza: 1.06,
    prendas: {
      pelo: { id: 'pelo_largo', colores: { principal: '#E0A84E' } },
      torso: { id: 'peto', colores: { principal: '#FFFFFF' }, extras: { Top_Emblem: false } },
      abrigo: { id: 'chaqueta', colores: { principal: '#2E3350', detalles: '#F7B7D2' } },
      piernas: { id: 'pantalon_cargo', colores: { principal: '#D9D6E3' } },
      pies: { id: 'zapatillas', colores: { principal: '#FFFFFF', panel: '#A77BF3' } },
      cabeza: { id: 'gorra' },
      cuello: { id: 'audifonos' },
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

// Plantillas de vecinos: qué prendas llevan y qué se sortea para cada uno.
// El sorteo va en ORDEN y con la semilla de spawnNPCs: cambiar el orden (o agregar una plantilla, que obliga a
// sortear cuál usar) cambia a todos los vecinos.
//   { campo, paleta }            look[campo] = un color de la paleta
//   { campo, min, rango }        look[campo] = min + azar × rango
//   { prenda, canal, paleta }    color de un canal de la prenda de ese slot
//   { prenda, extra, prob }      el extra se ve con esa probabilidad
export const VECINOS = [
  { peso: 1,
    prendas: { pelo: 'mono', torso: 'peto', piernas: 'pantalon_cargo', pies: 'zapatillas' },
    sorteo: [
      { campo: 'piel', paleta: 'piel' },
      { prenda: 'pelo', canal: 'principal', paleta: 'pelo' },
      { prenda: 'torso', canal: 'principal', paleta: 'ropa' },
      { prenda: 'piernas', canal: 'principal', paleta: 'pantalon' },
      { prenda: 'pies', canal: 'principal', paleta: 'zapatos' },
      { prenda: 'pies', canal: 'panel', paleta: 'ropa' },
      { prenda: 'torso', extra: 'Top_Emblem', prob: 0.5 },
      { campo: 'escala', min: 0.86, rango: 0.2 },
      { campo: 'cabeza', min: 0.95, rango: 0.12 },
    ] },
];
