// Gorras: copa de 6 paños con costuras, botón arriba, visera y una calcomanía. Accesorios rígidos: todo pesa en
// HeadBone (siguen a la cabeza y a su tamaño).
//   gorra   visera hacia atrás y estrella al costado, como la lleva la niña de referencias/ropa/hoja_personaje_nuevo.png
//   jockey  (jockey.mjs) visera adelante y mariposa al frente, como el niño de referencias/ropa/hoja_personaje_nino.png
// La copa envuelve la cabeza y los peinados (el moño sin su tope, que se esconde con la gorra, y el pelo largo): así
// el pelo sale por debajo sin atravesarla. Si se agrega un peinado, hay que sumarlo en queTapa y regenerar.
import * as THREE from 'three';
import { CENTRO_MOÑO, FIGURAS, Malla, RADIO_MOÑO, calcomania, cascara, grilla, lerp, mallaRayos, orientar, piezasCerca, rayoDesdeAfuera, revolucion, v3 } from './cuerpo.mjs';
import * as peloLargo from './pelo_largo.mjs';
import * as peloCorto from './pelo_corto.mjs';

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

// lo que la copa tiene que tapar: cabeza, orejas, el moño sin su tope, el pelo largo y el corto (mallas para rayos)
export function queTapa(C) {
  if (C.peinados) return C.peinados;
  const mallas = [C.mallaCabeza, C.mallaOrejas];
  const moño = C.doc.getRoot().listMeshes().find(x => x.getName() === 'Pelo_Moño');
  for (const p of moño.listPrimitives()) {
    const P = p.getAttribute('POSITION').getArray(), I = p.getIndices().getArray(), tope = piezasCerca(P, I, CENTRO_MOÑO, RADIO_MOÑO);
    const idx = []; for (let t = 0; t < I.length; t += 3) if (!tope[t / 3]) idx.push(I[t], I[t + 1], I[t + 2]);
    mallas.push(mallaRayos(P, idx));
  }
  for (const peinado of [peloLargo, peloCorto]) {
    const p = peinado.construir(C).mallas[0].malla;
    mallas.push(mallaRayos(p.V.flatMap(v => [v.x, v.y, v.z]), p.F.flat()));
    if (peinado === peloLargo) mallas.largo = mallas[mallas.length - 1];   // (el gorro de lana lo trata aparte)
  }
  return (C.peinados = mallas);
}

// visera: 'atras' | 'adelante'; figura: nombre en FIGURAS; lugar: [phi, el] en grados; M: nombres de material
// { tela, costura, visera, figura }
export function construirGorra(C, { visera, figura, lugar, M }) {
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
  cascara(m, V, orientar(V, G, () => HC), 0.006, M.tela, M.costura, M.tela);
  // costuras de los 6 paños (las caras de afuera van primero, 2 triángulos por cuadrilátero)
  for (let q = NP; q < (NR - 1) * NP; q++) if (q % NP % (NP / 6) === 0) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = M.costura;

  // botón de arriba
  revolucion(m, [[0, -0.004], [0.014, -0.004], [0.016, 0.002], [0.012, 0.008], [0, 0.009]], V[top], v3(0, 1, 0), M.visera, 16);

  // visera: sale del borde de la copa, recta hacia afuera y un poco hacia abajo, con forma de D. Adelante es más
  // larga y más curva (como un jockey); atrás, más corta.
  const adelante = visera === 'adelante', centro = adelante ? 0 : NP / 2, lado = 7;
  const cols = []; for (let k = centro - lado; k <= centro + lado; k++) cols.push((k + NP) % NP);
  const Vv = [], filas = 7, largoMax = adelante ? 0.118 : 0.105, baja = adelante ? 13 : 9, curva = adelante ? 0.03 : 0.022;
  for (let s = 0; s < filas; s++) cols.forEach((k, j) => {
    const u = (j / (cols.length - 1)) * 2 - 1, base = V[k].clone().addScaledVector(dirs[k], -0.004);
    const out = v3(dirs[k].x, 0, dirs[k].z).normalize(), t = s / (filas - 1), largo = largoMax * Math.sqrt(Math.max(0.02, 1 - 0.85 * u * u));
    Vv.push(base.addScaledVector(out, largo * t).add(v3(0, -Math.tan(rad(baja)) * largo * t - curva * u * u * t, 0)));
  });
  cascara(m, Vv, orientar(Vv, grilla(filas, cols.length, false), i => Vv[i].clone().add(v3(0, -1, 0))), 0.007, M.visera, M.visera, M.visera);

  // calcomanía sobre la copa
  const copa = mallaRayos(V.flatMap(v => [v.x, v.y, v.z]), G.flatMap(f => (f.length === 4 ? [f[0], f[1], f[2], f[0], f[2], f[3]] : f)));
  const n = sph(rad(lugar[0]), rad(lugar[1])), t1 = new THREE.Vector3().crossVectors(v3(0, 1, 0), n).normalize(), t2 = new THREE.Vector3().crossVectors(n, t1);
  const sobreCopa = (x, y) => {
    const d = HC.clone().addScaledVector(n, 0.2).addScaledVector(t1, x).addScaledVector(t2, y).sub(HC).normalize();
    return d.multiplyScalar((rayoDesdeAfuera(copa, HC, d, 0.6) ?? rTop) + 0.004).add(HC);
  };
  calcomania(m, FIGURAS[figura](), sobreCopa, HC, 0.004, M.figura);

  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return m;
}

export function construir(C) {
  const M = { tela: 'Gorra_Tela', costura: 'Gorra_Costura', visera: 'Gorra_Visera', figura: 'Gorra_Estrella' };
  return {
    mallas: [{ nombre: 'Acc_Gorra', malla: construirGorra(C, { visera: 'atras', figura: 'estrella', lugar: [58, 38], M }) }],
    materiales: {
      Gorra_Tela: { color: '#FFF1F6', rugosidad: 0.8 },
      Gorra_Costura: { color: '#EFC6D8', rugosidad: 0.85 },
      // (con la luz del juego lo que mira hacia arriba se aclara mucho: la estrella necesita un rosado intenso)
      Gorra_Visera: { color: '#FF9CC6', rugosidad: 0.7 },
      Gorra_Estrella: { color: '#E8408A', rugosidad: 0.6 },
    },
  };
}
