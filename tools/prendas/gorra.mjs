// Gorra con visera hacia atrás, como la lleva el personaje de referencias/ropa/hoja_personaje_nuevo.png: copa de
// 6 paños con costuras, botón arriba, visera y una estrella al costado. Accesorio rígido: todo pesa en HeadBone
// (sigue a la cabeza y a su tamaño).
// La copa envuelve la cabeza y los peinados (el moño sin su tope, que se esconde con la gorra, y el pelo largo): así
// el pelo sale por debajo sin atravesarla.
import * as THREE from 'three';
import { CENTRO_MOÑO, Malla, RADIO_MOÑO, cascara, grilla, lerp, mallaRayos, orientar, piezasCerca, rayoDesdeAfuera, revolucion, v3 } from './cuerpo.mjs';
import * as peloLargo from './pelo_largo.mjs';

export const ID = 'gorra';
const rad = g => g * Math.PI / 180;
const sph = (phi, el) => v3(Math.cos(el) * Math.sin(phi), Math.sin(el), Math.cos(el) * Math.cos(phi));
const NP = 48, NR = 14, HOLGURA = 0.007;
// borde de la copa (elevación según el ángulo, 0 = frente): sobre las cejas adelante, sobre las orejas, baja atrás
const BA = [0, 45, 90, 135, 180], BE = [30, 25, 13, 3, -3];
function borde(phi) {
  const a = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi))) * 180 / Math.PI;
  let k = 0; while (k < BA.length - 2 && a > BA[k + 1]) k++;
  return rad(lerp(BE[k], BE[k + 1], (a - BA[k]) / (BA[k + 1] - BA[k])));
}

// lo que la copa tiene que tapar: cabeza, orejas, el moño sin su tope y el pelo largo
function queTapa(C) {
  const mallas = [C.mallaCabeza, C.mallaOrejas];
  const moño = C.doc.getRoot().listMeshes().find(x => x.getName() === 'Pelo_Moño');
  for (const p of moño.listPrimitives()) {
    const P = p.getAttribute('POSITION').getArray(), I = p.getIndices().getArray(), tope = piezasCerca(P, I, CENTRO_MOÑO, RADIO_MOÑO);
    const idx = []; for (let t = 0; t < I.length; t += 3) if (!tope[t / 3]) idx.push(I[t], I[t + 1], I[t + 2]);
    mallas.push(mallaRayos(P, idx));
  }
  const largo = peloLargo.construir(C).mallas[0].malla;
  mallas.push(mallaRayos(largo.V.flatMap(v => [v.x, v.y, v.z]), largo.F.flat()));
  return mallas;
}

export function construir(C) {
  const m = new Malla(), HC = C.HC, tapar = queTapa(C);
  const alcance = d => Math.max(...tapar.map(x => rayoDesdeAfuera(x, HC, d, 0.6) ?? 0));
  // radio de lo que hay debajo en una grilla (fila 0 = el borde, la última cerca de la coronilla)
  const dirs = [], R = [];
  for (let r = 0; r < NR; r++) for (let k = 0; k < NP; k++) {
    const phi = 2 * Math.PI * k / NP, el = lerp(borde(phi), rad(84), (r / (NR - 1)) ** 0.85), d = sph(phi, el);
    dirs.push(d); R.push(alcance(d));
  }
  // se engorda (máximo de los vecinos) y se suaviza: una copa lisa que no toca el pelo
  const at = (A, r, k) => A[Math.max(0, Math.min(NR - 1, r)) * NP + ((k % NP) + NP) % NP];
  let S = R.map((_, i) => { const r = Math.floor(i / NP), k = i % NP; let x = 0; for (let a = -1; a <= 1; a++) for (let b = -2; b <= 2; b++) x = Math.max(x, at(R, r + a, k + b)); return x; });
  for (let pasada = 0; pasada < 3; pasada++)
    S = S.map((_, i) => { const r = Math.floor(i / NP), k = i % NP; let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += at(S, r + a, k + b); return s / 9; });
  const V = dirs.map((d, i) => d.clone().multiplyScalar(Math.max(S[i], R[i]) + HOLGURA).add(HC));
  const rTop = S.slice((NR - 1) * NP).reduce((a, x) => a + x, 0) / NP + HOLGURA;
  const top = V.length; V.push(v3(0, rTop, 0).add(HC));
  const G = grilla(NR, NP, true);
  for (let k = 0; k < NP; k++) G.push([(NR - 1) * NP + (k + 1) % NP, (NR - 1) * NP + k, top]);
  const f0 = m.F.length;
  cascara(m, V, orientar(V, G, () => HC), 0.006, 'Gorra_Tela', 'Gorra_Costura', 'Gorra_Tela');
  // costuras de los 6 paños (las caras de afuera van primero, 2 triángulos por cuadrilátero)
  for (let q = NP; q < (NR - 1) * NP; q++) if (q % NP % (NP / 6) === 0) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = 'Gorra_Costura';

  // botón de arriba
  revolucion(m, [[0, -0.004], [0.014, -0.004], [0.016, 0.002], [0.012, 0.008], [0, 0.009]], V[top], v3(0, 1, 0), 'Gorra_Visera', 16);

  // visera hacia atrás: sale del borde de la copa, recta hacia afuera y un poco hacia abajo, con forma de D
  const cols = [], lado = 7;
  for (let k = NP / 2 - lado; k <= NP / 2 + lado; k++) cols.push(k);
  const Vv = [], filas = 7;
  for (let s = 0; s < filas; s++) cols.forEach((k, j) => {
    const u = (j / (cols.length - 1)) * 2 - 1, base = V[k].clone().addScaledVector(dirs[k], -0.004);
    const out = v3(dirs[k].x, 0, dirs[k].z).normalize(), t = s / (filas - 1), largo = 0.105 * Math.sqrt(Math.max(0.02, 1 - 0.85 * u * u));
    Vv.push(base.addScaledVector(out, largo * t).add(v3(0, -Math.tan(rad(9)) * largo * t - 0.022 * u * u * t, 0)));
  });
  cascara(m, Vv, orientar(Vv, grilla(filas, cols.length, false), i => Vv[i].clone().add(v3(0, -1, 0))), 0.007, 'Gorra_Visera', 'Gorra_Visera', 'Gorra_Visera');

  // estrella al costado de la copa (a la derecha de quien mira de frente)
  const copa = mallaRayos(V.flatMap(v => [v.x, v.y, v.z]), G.flatMap(f => (f.length === 4 ? [f[0], f[1], f[2], f[0], f[2], f[3]] : f)));
  const sobreCopa = (d, alto) => d.clone().multiplyScalar((rayoDesdeAfuera(copa, HC, d, 0.6) ?? rTop) + alto).add(HC);
  const n = sph(rad(58), rad(38)), t1 = new THREE.Vector3().crossVectors(v3(0, 1, 0), n).normalize(), t2 = new THREE.Vector3().crossVectors(n, t1);
  const Ve = [sobreCopa(n, 0.004)];
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.013 : 0.031;
    const p = HC.clone().addScaledVector(n, 0.2).addScaledVector(t1, Math.cos(a) * r).addScaledVector(t2, Math.sin(a) * r);
    Ve.push(sobreCopa(p.sub(HC).normalize(), 0.004));
  }
  const Fe = Array.from({ length: 10 }, (_, k) => [0, 1 + k, 1 + (k + 1) % 10]);
  cascara(m, Ve, orientar(Ve, Fe, () => HC), 0.004, 'Gorra_Estrella', 'Gorra_Estrella', 'Gorra_Estrella');

  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return {
    mallas: [{ nombre: 'Acc_Gorra', malla: m }],
    materiales: {
      Gorra_Tela: { color: '#FFF1F6', rugosidad: 0.8 },
      Gorra_Costura: { color: '#EFC6D8', rugosidad: 0.85 },
      // (con la luz del juego lo que mira hacia arriba se aclara mucho: la estrella necesita un rosado intenso)
      Gorra_Visera: { color: '#FF9CC6', rugosidad: 0.7 },
      Gorra_Estrella: { color: '#E8408A', rugosidad: 0.6 },
    },
  };
}
