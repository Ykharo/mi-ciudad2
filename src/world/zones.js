// Zonas de interacción y nombre del lugar.
import { LINES, STREET } from './layout.js';

   // {x,z,hw,hd}
const zones = [];

/* ---------- places ---------- */
function areaName(x, z) {
  const inB = (x0, x1, z0, z1) => x > x0 && x < x1 && z > z0 && z < z1;
  if (inB(-34.5, -5.5, -34.5, -5.5)) return 'Parque Central';
  if (inB(5.5, 34.5, -34.5, -5.5)) return 'Boutique Arcoíris';
  if (inB(5.5, 34.5, 5.5, 34.5)) return 'Refugio de Mascotas';
  if (inB(-34.5, -5.5, 5.5, 21)) return 'Heladería';
  if (inB(-34.5, -5.5, 21, 34.5)) return 'Mi Casa';
  if (inB(45.5, 76, -34.5, -5.5)) return 'Autos Arcoíris';
  for (const L of LINES) { if (Math.abs(x - L) < 5.6) return STREET.x[L]; if (Math.abs(z - L) < 5.6) return STREET.z[L]; }
  return 'Barrio Arcoíris';
}

export { areaName, zones };
