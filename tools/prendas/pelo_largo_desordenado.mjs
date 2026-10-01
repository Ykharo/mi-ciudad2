// Cabello largo desordenado del amigo (referencias/ropa/hoja_personaje_nino.png, "Cabello largo (opcional)"): los
// mismos mechones del pelo corto (pelo_corto.mjs), con el borde mucho más bajo y una capa más de mechones largos: tapa
// las orejas, llega a la mandíbula a los costados y a la nuca atrás. El flequillo es el mismo.
import { construirMechones } from './pelo_corto.mjs';

export const ID = 'pelo_largo_desordenado';

export function construir(C) {
  const m = construirMechones(C, { P: 'PeloLargoD', BE: [14, 8, -14, -36, -50, -58], largo: true });
  return {
    mallas: [{ nombre: 'Pelo_LargoDesordenado', malla: m }],
    materiales: {   // castaño, como el pelo corto
      PeloLargoD_Base: { color: '#5A3521', rugosidad: 0.66 },
      PeloLargoD_Claro: { color: '#7A4A2E', rugosidad: 0.7 },
      PeloLargoD_Oscuro: { color: '#40231A', rugosidad: 0.72 },
    },
  };
}
