// Top corto de la amiga (referencias/ropa/hoja_personaje_nuevo.png, "Top corto (con textura 2D)"): blanco, pegado,
// de bajo el pecho hasta las axilas, con escote adelante, dos tirantes, una banda gris abajo y una estrella al centro.
import { FIGURAS, Malla, calcomaniaSobre, cascara, grilla, lerp, orientar, pesosDelCuerpo, rayoDesdeAfuera, smooth, v3 } from './cuerpo.mjs';
import { centroZ, juntar, superficieDe } from './chaqueta.mjs';

export const ID = 'top_corto';
const NA = 48, FILAS = 10, ABAJO = 0.925, HOL = 0.007;
// borde de arriba según el ángulo (0 = frente): escote adelante, bajo la axila al costado, más alto atrás
const borde = a => { const f = Math.cos(a); return f > 0 ? lerp(1.045, 1.078, smooth(1 - f)) : lerp(1.045, 1.09, smooth(-f)); };

export function construir(C) {
  const torso = C.mallaTorso, m = new Malla();
  const V = [], ejes = [];
  for (let r = 0; r < FILAS; r++) {
    const t = r / (FILAS - 1);
    const fila = [];
    for (let k = 0; k < NA; k++) {
      const a = 2 * Math.PI * k / NA, y = lerp(ABAJO, borde(a), t), d = v3(Math.sin(a), 0, Math.cos(a));
      const eje = v3(0, y, centroZ(C, y));
      fila.push({ eje, d, r: rayoDesdeAfuera(torso, eje, d, 0.5) ?? 0.1 });
    }
    // suaviza el anillo (en la axila el brazo deja huecos)
    fila.forEach((p, k) => {
      const rr = (fila[(k + NA - 1) % NA].r + 2 * p.r + fila[(k + 1) % NA].r) / 4;
      V.push(p.d.clone().multiplyScalar(rr + HOL + (r < 2 ? 0.002 : 0)).add(p.eje)); ejes.push(p.eje);
    });
  }
  const F = orientar(V, grilla(FILAS, NA, true), i => ejes[i]);
  cascara(m, V, F.slice(0, 2 * NA), 0.005, 'TopCorto_Banda', 'TopCorto_Forro', 'TopCorto_Banda');
  cascara(m, V, F.slice(2 * NA), 0.004, 'TopCorto_Tela', 'TopCorto_Forro', 'TopCorto_Tela');
  m.pesos = pesosDelCuerpo(C, m.V, ['Spine', 'Chest'], 8);
  // tirantes: de la orilla de adelante, por sobre el hombro, a la de atrás
  const hombros = C.partes(['Spine', 'Chest', 'Neck']), tir = new Malla();
  for (const s of [1, -1]) {
    const x = s * 0.078, O = v3(x, 1.03, centroZ(C, 1.03)), P = [], N = [];
    for (let i = 0; i <= 14; i++) {
      const b = lerp(40, 150, i / 14) * Math.PI / 180, d = v3(0, Math.sin(b), Math.cos(b));
      const r = rayoDesdeAfuera(hombros, O, d, 0.5) ?? 0.07;
      P.push(O.clone().addScaledVector(d, r + HOL + 0.001)); N.push(d);
    }
    for (let pasada = 0; pasada < 2; pasada++)
      for (let i = 1; i < P.length - 1; i++) P[i] = P[i - 1].clone().add(P[i]).add(P[i]).add(P[i + 1]).multiplyScalar(0.25);
    const Vt = [], dentro = [];
    P.forEach((p, i) => { for (const k of [-1, 1]) { Vt.push(p.clone().add(v3(k * 0.011, 0, 0))); dentro.push(p.clone().addScaledVector(N[i], -0.05)); } });
    cascara(tir, Vt, orientar(Vt, grilla(P.length, 2, false), i => dentro[i]), 0.004, 'TopCorto_Tela');
  }
  tir.pesos = pesosDelCuerpo(C, tir.V, ['Chest', 'Neck'], 6);
  // estrella al centro del frente
  const est = new Malla(), y = 1.0, eje = v3(0, y, centroZ(C, y));
  calcomaniaSobre(est, superficieDe(m), eje.clone().add(v3(0, 0, 0.12)), v3(0, 0, 1), v3(0, 1, 0), [
    ...FIGURAS.estrella(0.03, 0.013),
  ], 0.002, 'TopCorto_Estrella');
  est.pesos = pesosDelCuerpo(C, est.V, ['Chest', 'Spine'], 6);
  return {
    mallas: [{ nombre: 'Ropa_TopCorto', malla: juntar([m, tir, est]) }],
    materiales: {
      TopCorto_Tela: { color: '#F7F5FA', rugosidad: 0.85 },
      TopCorto_Banda: { color: '#9C98A8', rugosidad: 0.9 },
      TopCorto_Forro: { color: '#DEDAE4', rugosidad: 0.9 },
      TopCorto_Estrella: { color: '#5E5A6A', rugosidad: 0.7 },
    },
  };
}
