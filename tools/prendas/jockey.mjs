// Jockey (referencias/ropa/hoja_personaje_nino.png): la misma copa que la gorra (gorra.mjs), con la visera hacia
// adelante y una mariposa al frente. Negro con la mariposa blanca, como en la hoja.
import { construirGorra } from './gorra.mjs';

export const ID = 'jockey';

export function construir(C) {
  const M = { tela: 'Jockey_Tela', costura: 'Jockey_Costura', visera: 'Jockey_Visera', figura: 'Jockey_Mariposa' };
  return {
    mallas: [{ nombre: 'Acc_Jockey', malla: construirGorra(C, { visera: 'adelante', figura: 'mariposa', lugar: [0, 50], M }) }],
    materiales: {
      Jockey_Tela: { color: '#2A2A33', rugosidad: 0.8 },
      Jockey_Costura: { color: '#3A3A45', rugosidad: 0.85 },
      Jockey_Visera: { color: '#2A2A33', rugosidad: 0.7 },
      Jockey_Mariposa: { color: '#FFFFFF', rugosidad: 0.6 },
    },
  };
}
