// Emisor mínimo de eventos: game/ avisa lo que pasó y ui/ y audio/ reaccionan, sin que game/ los conozca.
// Eventos del juego (todos síncronos):
//   'zona'   (zona | null)          cambió la zona de interacción cercana (o no hay ninguna)
//   'aviso'  (texto)                mensaje corto para la jugadora
//   'sonido' (nombre)               efecto de sonido: jump, pop, open, adopt, bonk
//   'menu'   (abierto)              se abrió o cerró un panel (mascotas, tienda)
//   'auto'   ('subir' | 'bajar', auto)
//   'motor'  (velocidad, tono)      cada cuadro mientras se maneja
//   'personaje' (id)                se cambió el personaje con que se juega
//   'aura'   ({ que, … })            competencia de aura: 'elegir' (abrir la ventana de los 3 movimientos, con `bailes`)
const listeners = new Map();

export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, []);
  listeners.get(name).push(fn);
}

export function emit(name, ...args) {
  for (const fn of listeners.get(name) || []) fn(...args);
}
