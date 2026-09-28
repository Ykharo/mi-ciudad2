// SÓLO DATOS. Personajes y plantillas de vecinos.
//
// Un "look" es JSON puro (se guarda, se valida con fixLook y se usa igual para Nina y los vecinos):
//   { base, piel, escala, cabeza, prendas: { slot: { id, colores: { canal: '#RRGGBB' }, extras: { nombre: bool } } } }
// Lo que no se indica queda como viene en el modelo: el look de fábrica de Nina no cambia ningún color.
export const LOOK_NINA = {
  base: 'nina', piel: null, escala: 1, cabeza: 1,
  prendas: { pelo: { id: 'mono' }, torso: { id: 'peto' }, piernas: { id: 'pantalon_cargo' }, pies: { id: 'zapatillas' } },
};

export const PERSONAJES = {
  nina: { nombre: 'Nina', look: LOOK_NINA },
};

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
