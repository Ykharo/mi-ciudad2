// Estado reasignable que comparten varios módulos (un import de ES es de sólo lectura).
// Cada valor se inicializa en su módulo de origen, en el mismo momento que antes (ver el comentario).
export const state = {
  ttModel: undefined,   // world/places/carshop.js — auto que se está diseñando en el torno
  ttSpin: undefined,    // world/places/carshop.js — giro del torno
  ttDrag: undefined,    // world/places/carshop.js — segundos que el torno queda quieto después de arrastrarlo
  mode: undefined,      // game/actors.js — intro | play | pets | shop | wardrobe | drive
  lastCar: undefined,   // game/actors.js — último auto propio usado ("Mi auto" llama a ése)
  shopSpec: undefined,  // game/actors.js — diseño actual de la tienda
  clock: undefined,     // game/actors.js — segundos de juego
  currentZone: undefined,   // game/actors.js — zona de interacción cercana (o null)
  musicOn: undefined,   // audio/audio.js
  joyId: undefined,     // ui/joystick.js — dedo que mueve el joystick
  preview: null,        // ui/panels/pets.js — mascota de muestra del refugio (la cámara la encuadra)
};
