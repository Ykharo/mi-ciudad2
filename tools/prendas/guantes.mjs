// Guantes sin dedos (referencias/ropa/hoja_personaje_nino.png, "Guantes (sin dedos)"): una funda de la muñeca a
// los nudillos en cada mano, con puño. Siguen a la mano (pesos del antebrazo y la mano).
import * as THREE from 'three';
import { Malla, cascara, grilla, lerp, orientar, pesosDelCuerpo, rayoDesdeAfuera, v3 } from './cuerpo.mjs';
import { juntar } from './chaqueta.mjs';

export const ID = 'guantes';
const NA = 18, DESDE = -0.035, HASTA = 0.05;   // a lo largo de la mano, desde el hueso de la mano (m)

function guante(C, S) {
  const m = new Malla(), side = S === 'L' ? -1 : 1, h = C.huesos;
  const muñeca = h['Hand' + S], eje = muñeca.clone().sub(h['Forearm' + S]).normalize();
  const mano = C.partes(['Hand' + S, 'Forearm' + S]);
  const u = new THREE.Vector3().crossVectors(eje, v3(0, 0, 1)).normalize(), w = new THREE.Vector3().crossVectors(u, eje);
  const filas = 8, V = [], centros = [];
  const dir = k => { const a = 2 * Math.PI * k / NA; return u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a)); };
  const R = [];
  for (let i = 0; i < filas; i++) {
    const c = muñeca.clone().addScaledVector(eje, lerp(DESDE, HASTA, i / (filas - 1)));
    centros.push(c);
    R.push(Array.from({ length: NA }, (_, k) => rayoDesdeAfuera(mano, c, dir(k), 0.2) ?? 0.02));
  }
  // se engorda con el máximo de los vecinos (en el anillo y entre anillos): el pulgar y los nudillos quedan adentro
  const at = (i, k) => R[Math.max(0, Math.min(filas - 1, i))][(k + NA) % NA];
  const G = R.map((f, i) => f.map((_, k) => Math.max(at(i, k - 1), at(i, k), at(i, k + 1), at(i - 1, k), at(i + 1, k))));
  G.forEach((f, i) => f.forEach((x, k) => V.push(dir(k).multiplyScalar(x + (i < 2 ? 0.009 : 0.007)).add(centros[i]))));
  const F = orientar(V, grilla(filas, NA, true), i => centros[Math.floor(i / NA)]);
  cascara(m, V, F.slice(0, 2 * NA), 0.004, 'Guantes_Puno');
  cascara(m, V, F.slice(2 * NA), 0.003, 'Guantes_Tela');
  m.pesos = pesosDelCuerpo(C, m.V, ['Forearm' + S, 'Hand' + S], 6, side);
  return m;
}

export function construir(C) {
  return {
    mallas: [{ nombre: 'Acc_Guantes', malla: juntar([guante(C, 'L'), guante(C, 'R')]) }],
    materiales: {
      Guantes_Tela: { color: '#26262E', rugosidad: 0.85 },
      Guantes_Puno: { color: '#3A3A45', rugosidad: 0.9 },
    },
  };
}
