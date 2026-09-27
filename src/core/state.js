// Estado reasignable que comparten varios módulos (un import de ES es de sólo lectura).
// Cada valor se inicializa en su módulo de origen, en el mismo momento que antes (ver el comentario).
export const state = {
  ttModel: undefined,   // world/places/carshop.js
  ttSpin: undefined,   // world/places/carshop.js
  ttDrag: undefined,   // world/places/carshop.js
  mode: undefined,   // game/player.js
  lastCar: undefined,   // game/player.js
  shopSpec: undefined,   // game/player.js
  clock: undefined,   // game/player.js
  currentZone: undefined,   // game/player.js
  musicOn: undefined,   // audio/audio.js
  joyId: undefined,   // ui/joystick.js
};
