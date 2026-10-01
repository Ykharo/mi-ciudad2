// Lacio largo (referencias/ropa/hoja_personaje_nuevo.png, "Lacio largo"): como el pelo largo (pelo_largo.mjs) pero
// liso, más largo (hasta la mitad de la espalda y del pecho) y con las puntas parejas.
import { construirLargo } from './pelo_largo.mjs';

export const ID = 'pelo_lacio';

export function construir(C) {
  const m = construirLargo(C, { P: 'PeloLacio', onda: 0, puntas: 0.012, bulto: 0.003,
    espalda: u => 0.86 + 0.015 * Math.abs(u - 0.5), frente: u => 0.93 + 0.02 * u });
  return {
    mallas: [{ nombre: 'Pelo_Lacio', malla: m }],
    materiales: {
      PeloLacio_Base: { color: '#4D2C1F', rugosidad: 0.55 },
      PeloLacio_Claro: { color: '#5B3525', rugosidad: 0.6 },
      PeloLacio_Oscuro: { color: '#40231C', rugosidad: 0.65 },
    },
  };
}
