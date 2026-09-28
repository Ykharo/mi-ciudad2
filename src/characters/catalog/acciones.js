// SÓLO DATOS. Acciones de los personajes (id = nombre de la animación en el .glb).

// menú 🎬 Acción: todas las animaciones de movimiento de Nina ('stop' = quedarse quieta)
export const ACTIONS = [
  { id: 'wave', name: 'Saludar', ic: '👋' }, { id: 'dance', name: 'Bailar', ic: '💃', loop: true },
  { id: 'jump', name: 'Saltar', ic: '⬆️' }, { id: 'walk_back', name: 'Caminar atrás', ic: '🔙', loop: true },
  { id: 'sit', name: 'Sentarse', ic: '🧘' }, { id: 'lie', name: 'Acostarse', ic: '😴' },
  { id: 'split', name: 'Spagat', ic: '🤸' }, { id: 'candle', name: 'Vela invertida', ic: '🕯️' },
  { id: 'stop', name: 'Quedarse quieta', ic: '🧍' }
];
// cara que pone cada animación (si el juego no pide otra)
export const AUTO_FACE = { wave: 'feliz', dance: 'feliz', jump: 'sorpresa', lie: 'feliz', split: 'guino', candle: 'feliz' };
// animaciones que se quedan en la pose final hasta que la jugadora se mueve
export const HOLD = new Set(['sit', 'lie', 'split']);
