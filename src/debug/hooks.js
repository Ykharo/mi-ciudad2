// Ganchos para las pruebas automáticas: window.__juego. Sólo se instalan en desarrollo o con ?test en la
// dirección (ver main.js). No cambian nada del juego: dan acceso de lectura y un teletransporte.
import { state } from '../core/state.js';
import { cam, player } from '../game/actors.js';
import { npcs } from '../game/npcs.js';
import { cars } from '../cars/fleet.js';
import { espectadorActual } from '../game/cartel.js';
import { competencia } from '../game/aura.js';
import { vecinosJuegos } from '../game/vecinosJuegos.js';
import { mascotienda } from '../game/mascotienda.js';

export function installTestHooks() {
  window.__juego = {
    state, player, npcs, cars, cam, espectador: espectadorActual,   // cam: para fotos desde un ángulo dado (cam.yaw)
    competencia,   // la del Escenario del Aura: enCurso(), concursantes(), rapido(x)
    vecinosJuegos, // los vecinos en los juegos: mandar(i, tipo, pareja), estado()
    mascotienda,   // la tienda de mascotas: comprados(), comprar(id, mascota), equipar(mascota, id, on)…
    teleport(x, z) { player.pos.set(x, 0, z); player.vel.set(0, 0, 0); },
  };
}
