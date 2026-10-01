// Polerón oversize (referencias/ropa/hoja_ropa_gorro_poleron.png, "Polerón oversize"): sin capucha, cuello redondo,
// muy holgado, con los hombros caídos y puños y borde de punto. Va en el espacio `abrigo` (encima de la polera).
import { cuerpoAbrigo, juntar, mangaAbrigo } from './chaqueta.mjs';

export const ID = 'poleron_oversize';
const M = { tela: 'PoleronO_Tela', detalle: 'PoleronO_Punto', forro: 'PoleronO_Forro' };

export function construir(C) {
  const cuerpo = cuerpoAbrigo(C, { abierto: false, holgura: 0.034, hem: 0.79, M, hombroCaido: true }).malla;
  const manga = S => mangaAbrigo(C, S, { holgura: 0.03, puño: 0.014, M });
  return {
    mallas: [{ nombre: 'Ropa_PoleronOversize', malla: juntar([cuerpo, manga('L'), manga('R')]) }],
    materiales: {
      PoleronO_Tela: { color: '#F2BE2E', rugosidad: 0.9 },
      PoleronO_Punto: { color: '#DDA81E', rugosidad: 0.95 },
      PoleronO_Forro: { color: '#C99A1C', rugosidad: 0.95 },
    },
  };
}
