// SÓLO DATOS. Acciones de los personajes (id = nombre de la animación en el .glb).

// menú 🎬 Acción: todas las animaciones de movimiento ('stop' = quedarse quieta). Los bailes de "farmear aura"
// (aura, seis_siete, sigma) se arman en tools/animaciones/bailes.mjs.
export const ACTIONS = [
  { id: 'wave', name: 'Saludar', ic: '👋' }, { id: 'dance', name: 'Bailar', ic: '💃', loop: true },
  { id: 'aura', name: 'Farmear aura', ic: '😎', loop: true }, { id: 'seis_siete', name: 'Six Seven', ic: '🤲', loop: true },
  { id: 'sigma', name: 'Mirada sigma', ic: '🗿' },
  { id: 'take_l', name: 'Take the L', ic: '🫵', loop: true }, { id: 'siuu', name: 'Siuuu', ic: '⚽' },
  { id: 'griddy', name: 'Griddy', ic: '🕺', loop: true }, { id: 'spin', name: 'Spin', ic: '🌀' },
  { id: 'fresh', name: 'Fresh', ic: '✨', loop: true }, { id: 'floss', name: 'Floss', ic: '🧵', loop: true },
  { id: 'jump', name: 'Saltar', ic: '⬆️' }, { id: 'walk_back', name: 'Caminar atrás', ic: '🔙', loop: true },
  { id: 'sit', name: 'Sentarse', ic: '🧘' }, { id: 'lie', name: 'Acostarse', ic: '😴' },
  { id: 'split', name: 'Spagat', ic: '🤸' }, { id: 'candle', name: 'Vela invertida', ic: '🕯️' },
  { id: 'stop', name: 'Quedarse quieta', ic: '🧍' }
];
const T_SPIN = 1.7;
// cara que pone cada animación (si el juego no pide otra). Puede cambiar durante la animación: [[segundo, cara], …]
// (caras: normal, feliz, triste, sorpresa, enojada, guino)
export const AUTO_FACE = {
  wave: 'feliz', dance: 'feliz', jump: 'sorpresa', lie: 'feliz', split: 'guino', candle: 'feliz',
  aura: 'normal', seis_siete: 'feliz',
  // mira de lado tranquila, se pone seria al mirar de frente (el ceño de "enojada") y termina con un guiño
  sigma: [[0, 'normal'], [1.6, 'enojada'], [3.55, 'guino'], [4.2, 'normal']],
  // mirar el cartel de la competencia: se sorprende con el título y le gusta lo que lee (no está en el menú: se usa
  // frente al cartel, game/cartel.js)
  mirar_cartel: [[0, 'normal'], [0.6, 'sorpresa'], [1.8, 'normal'], [6.6, 'feliz'], [7.8, 'normal']],
  take_l: 'guino', griddy: 'feliz', fresh: 'feliz', floss: 'feliz',
  // los juegos del parque (no están en el menú: los usa game/juegos.js)
  subir_escalera: 'normal', tobogan: 'feliz', columpio: 'feliz',
  siuu: [[0, 'feliz'], [1.05, 'sorpresa'], [2.9, 'feliz']],   // el grito, con la boca abierta
  spin: [[0, 'feliz'], [1.35, 'guino'], [T_SPIN, 'feliz']],
};
// animaciones que se quedan en la pose final hasta que la jugadora se mueve
export const HOLD = new Set(['sit', 'lie', 'split']);
