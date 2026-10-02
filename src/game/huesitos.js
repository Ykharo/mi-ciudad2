// Los Huesitos de Aura 🦴: la moneda del juego (para la tienda de mascotas, más adelante). Se ganan sobre todo leyendo:
// cada Código Aura acertado en la competencia, competir y ganar (game/aura.js); después, los encargos de lectura.
// El total vive en `player.huesitos` (así lo guarda game/save.js) y se guarda apenas cambia. Cada cambio avisa con el
// evento 'huesitos' { total, delta, motivo } (la interfaz anima el contador: ui/huesitos.js).
import { emit } from '../core/events.js';
import { player } from './actors.js';
import { save } from './save.js';

const MAX = 999999;
export const HUESITOS = { CODIGO: 10, CODIGO_RAPIDO: 5, COMPETIR: 10, GANAR: 30 };

// lo guardado, validado (un número entero entre 0 y MAX)
export function cargarHuesitos(saved) {
  const n = saved && Number(saved.huesitos);
  player.huesitos = Number.isFinite(n) ? Math.max(0, Math.min(MAX, Math.floor(n))) : 0;
  emit('huesitos', { total: player.huesitos, delta: 0, motivo: null });
}
export function ganarHuesitos(n, motivo = '') {
  n = Math.floor(n); if (!(n > 0)) return;
  player.huesitos = Math.min(MAX, (player.huesitos || 0) + n);
  save();
  emit('huesitos', { total: player.huesitos, delta: n, motivo });
}
// gastar: true si alcanzaba (y se descontaron)
export function gastarHuesitos(n) {
  n = Math.floor(n); if (!(n > 0) || (player.huesitos || 0) < n) return false;
  player.huesitos -= n;
  save();
  emit('huesitos', { total: player.huesitos, delta: -n, motivo: null });
  return true;
}
