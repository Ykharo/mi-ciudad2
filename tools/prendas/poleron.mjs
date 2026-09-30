// Polerón con capucha (referencias/ropa/hoja_personaje_nino.png, "Chaqueta con capucha" / "Polerón"): el mismo
// armado que la chaqueta (chaqueta.mjs) pero cerrado, más holgado y largo, con dos franjas por el lado de afuera de
// las mangas, la capucha caída en la espalda, el cierre al centro y una mariposa en el pecho.
import { FIGURAS, Malla, caja, calcomania, mallaRayos, rayo, tubo, v3 } from './cuerpo.mjs';
import { cuerpoAbrigo, juntar, mangaAbrigo } from './chaqueta.mjs';

export const ID = 'poleron';
const M = { tela: 'Poleron_Tela', detalle: 'Poleron_Detalle', forro: 'Poleron_Forro', franja: 'Poleron_Franja' };

export function construir(C) {
  const { malla: cuerpo, filas, ys } = cuerpoAbrigo(C, { abierto: false, holgura: 0.03, hem: 0.8, M, hombroCaido: true });
  const NA = filas[0].length, extra = new Malla();
  // la superficie de afuera del cuerpo, para apoyar cosas encima
  const V = filas.flat(), I = [];
  for (let r = 0; r < filas.length - 1; r++) for (let k = 0; k < NA; k++) {
    const a = r * NA + k, b = r * NA + (k + 1) % NA;
    I.push(a, a + NA, b + NA, a, b + NA, b);
  }
  const sup = mallaRayos(V.flatMap(p => [p.x, p.y, p.z]), I);
  const zFrente = (x, y) => 0.5 - (rayo(sup, v3(x, y, 0.5), v3(0, 0, -1)) ?? 0.4);
  const zAtras = (x, y) => (rayo(sup, v3(x, y, -0.5), v3(0, 0, 1)) ?? 0.4) - 0.5;
  // cierre: de abajo hasta el cuello, por el centro de adelante
  const cierre = ys.map(y => v3(0, y, zFrente(0, y) + 0.003));
  tubo(extra, cierre, 0.0035, 'Poleron_Cierre', { lados: 6, aplanar: 0.6, ref: v3(0, 0, 1) });
  // mariposa en el pecho (a la derecha de quien mira de frente)
  const X = 0.075, Y = 1.0;
  calcomania(extra, FIGURAS.mariposa(0.8), (x, y) => v3(X + x, Y + y, zFrente(X + x, Y + y) + 0.003), v3(X, Y, 0), 0.003, 'Poleron_Mariposa');
  // capucha caída: una almohada redondeada apoyada en la espalda, bajo el cuello
  const yC = 1.1, zC = zAtras(0, yC);
  caja(extra, v3(0, yC, zC - 0.03), v3(0.105, 0.07, 0.042), M.tela, 0.6);
  caja(extra, v3(0, yC + 0.035, zC - 0.028), v3(0.085, 0.03, 0.03), M.forro, 0.6);   // la abertura, más oscura
  extra.pesos = extra.V.map(p => (p.y > 1.05 || p.z < -0.05 ? [['Chest', 1]] : [['Spine', 0.5], ['Chest', 0.5]]));
  return {
    mallas: [{ nombre: 'Ropa_Poleron', malla: juntar([cuerpo, mangaAbrigo(C, 'L', { holgura: 0.024, M }), mangaAbrigo(C, 'R', { holgura: 0.024, M }), extra]) }],
    materiales: {
      Poleron_Tela: { color: '#26262E', rugosidad: 0.85 },
      Poleron_Detalle: { color: '#1E1E25', rugosidad: 0.9 },
      Poleron_Forro: { color: '#3A3A45', rugosidad: 0.9 },
      Poleron_Franja: { color: '#FFFFFF', rugosidad: 0.8 },
      Poleron_Cierre: { color: '#A8A8B3', rugosidad: 0.5 },
      Poleron_Mariposa: { color: '#FFFFFF', rugosidad: 0.7 },
    },
  };
}
