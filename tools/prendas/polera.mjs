// Poleras (referencias/ropa/hoja_ropa_gorro_poleron.png, "Polera"): cuello redondo, hasta la cadera, un poco suelta.
// Mismo armado que los abrigos (chaqueta.mjs), cerrada y más pegada al cuerpo, para que quepa debajo de una chaqueta
// o un polerón.
//   polera_corta  manga corta (hasta la mitad del brazo)
//   polera_larga  manga larga (hasta la muñeca; esconde los brazos)
import { cuerpoAbrigo, juntar, mangaAbrigo } from './chaqueta.mjs';

function construirPolera(C, P, largo) {
  const M = { tela: P + '_Tela', detalle: P + '_Cuello', forro: P + '_Forro' };
  // bien pegada, para que no asome por las mangas de la chaqueta (que van a 1,2 cm del brazo por dentro)
  const cuerpo = cuerpoAbrigo(C, { abierto: false, holgura: 0.009, hem: 0.83, M }).malla;
  const manga = S => (largo ? mangaAbrigo(C, S, { holgura: 0.003, puño: 0.004, M }) : mangaAbrigo(C, S, { holgura: 0.005, puño: 0.008, hasta: 7, M }));
  return {
    mallas: [{ nombre: 'Ropa_' + P, malla: juntar([cuerpo, manga('L'), manga('R')]) }],
    materiales: {
      [P + '_Tela']: { color: '#F7F5FA', rugosidad: 0.85 },
      [P + '_Cuello']: { color: '#E6E2EC', rugosidad: 0.9 },
      [P + '_Forro']: { color: '#D8D4DE', rugosidad: 0.9 },
    },
  };
}

export const corta = { ID: 'polera_corta', construir: C => construirPolera(C, 'PoleraC', false) };
export const larga = { ID: 'polera_larga', construir: C => construirPolera(C, 'PoleraL', true) };
