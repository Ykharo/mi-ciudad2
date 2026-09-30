// Mochila (referencias/ropa/hoja_personaje_nuevo.png, "Mochila"): cuerpo de esquinas redondeadas, bolsillo con una
// mariposa, manilla arriba y dos correas que pasan sobre los hombros y bajan por el pecho. Accesorio rígido: todo pesa
// en Chest. Queda separada de la espalda lo justo para no tocar la chaqueta; el pelo largo cae por dentro de ella.
import { FIGURAS, Malla, caja, calcomania, cascara, grilla, lerp, orientar, rayoDesdeAfuera, tubo, v3 } from './cuerpo.mjs';

export const ID = 'mochila';
const SEP = 0.029;                            // de la espalda a la cara de adelante de la mochila
const SEMI = v3(0.108, 0.125, 0.045), Y = 0.95;
const CORREA_X = 0.095, CORREA_ANCHO = 0.034, CORREA_SOBRE = 0.036;

export function construir(C) {
  const m = new Malla(), torso = C.mallaTorso;
  // lo más atrás de la espalda en la zona que cubre la mochila
  let zEspalda = 0;
  for (let x = -0.1; x <= 0.1; x += 0.025) for (let y = Y - 0.1; y <= Y + 0.12; y += 0.02)
    zEspalda = Math.min(zEspalda, -(rayoDesdeAfuera(torso, v3(x, y, 0), v3(0, 0, -1), 0.5) ?? 0));
  const centro = v3(0, Y, zEspalda - SEP - SEMI.z);
  caja(m, centro, SEMI, 'Mochila_Tela', 0.3);
  // bolsillo de afuera y la mariposa encima
  const cb = v3(0, Y - 0.045, centro.z - SEMI.z - 0.012), sb = v3(0.078, 0.06, 0.028);
  caja(m, cb, sb, 'Mochila_Bolsillo', 0.3);
  const cm = v3(0, cb.y + 0.004, cb.z - sb.z - 0.0015);   // mirando hacia atrás (-z)
  calcomania(m, FIGURAS.mariposa(), (x, y) => v3(x, y, 0).add(cm), cm.clone().add(v3(0, 0, 1)), 0.003, 'Mochila_Mariposa');
  // manilla
  const arriba = centro.y + SEMI.y - 0.006;
  tubo(m, Array.from({ length: 9 }, (_, i) => { const a = Math.PI * i / 8; return v3(-0.035 * Math.cos(a), arriba + 0.028 * Math.sin(a), centro.z + 0.012); }), 0.006, 'Mochila_Correa', { lados: 6 });
  // correas: desde la parte de arriba de la mochila, sobre el hombro, y hacia abajo por el pecho
  // (la parte de atrás de cada correa empieza escondida dentro de la mochila)
  for (const s of [1, -1]) correa(C, m, s * CORREA_X);

  m.pesos = m.V.map(() => [['Chest', 1]]);
  return {
    mallas: [{ nombre: 'Acc_Mochila', malla: m }],
    materiales: {
      Mochila_Tela: { color: '#34343F', rugosidad: 0.8 },
      Mochila_Bolsillo: { color: '#3E3E4B', rugosidad: 0.8 },
      Mochila_Correa: { color: '#2A2A33', rugosidad: 0.85 },
      Mochila_Mariposa: { color: '#E3C8FF', rugosidad: 0.6 },
    },
  };
}

// correa: una cinta que sigue el torso a CORREA_SOBRE de la piel
function correa(C, m, x) {
  const torso = C.mallaTorso;
  const zFrente = y => rayoDesdeAfuera(torso, v3(x, y, 0), v3(0, 0, 1), 0.5) ?? 0.06;
  const zAtras = y => -(rayoDesdeAfuera(torso, v3(x, y, 0), v3(0, 0, -1), 0.5) ?? 0.08);
  const yO = 1.03, O = v3(x, yO, (zFrente(yO) + zAtras(yO)) / 2);
  const P = [], N = [];
  // sobre el hombro: de atrás (abajo) hacia adelante, girando alrededor de O
  for (let i = 0; i <= 16; i++) {
    const b = lerp(205, 30, i / 16) * Math.PI / 180, d = v3(0, Math.sin(b), Math.cos(b));
    const r = rayoDesdeAfuera(torso, O, d, 0.5) ?? 0.08;
    P.push(O.clone().addScaledVector(d, r + CORREA_SOBRE)); N.push(d);
  }
  // por el pecho hacia abajo
  const y0 = P[P.length - 1].y;
  for (let i = 1; i <= 5; i++) {
    const y = lerp(y0, 0.92, i / 5);
    P.push(v3(x, y, zFrente(y) + CORREA_SOBRE)); N.push(v3(0, 0, 1));
  }
  // suaviza el camino (los rayos dan saltitos donde el cuerpo tiene pliegues)
  for (let pasada = 0; pasada < 2; pasada++)
    for (let i = 1; i < P.length - 1; i++) P[i] = P[i - 1].clone().add(P[i]).add(P[i]).add(P[i + 1]).multiplyScalar(0.25);
  const V = [], dentro = [];
  P.forEach((p, i) => {
    for (const k of [-1, 1]) { V.push(p.clone().add(v3(k * CORREA_ANCHO / 2, 0, 0))); dentro.push(p.clone().addScaledVector(N[i], -0.05)); }
  });
  const F = orientar(V, grilla(P.length, 2, false), i => dentro[i]);
  cascara(m, V, F, 0.007, 'Mochila_Correa');
}
