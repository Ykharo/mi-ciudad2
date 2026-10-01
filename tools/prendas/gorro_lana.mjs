// Gorro de lana (referencias/ropa/hoja_ropa_gorro_poleron.png, "Gorro de lana"): gris, tejido en canales verticales,
// con un doblez ancho abajo (sobre las cejas y las orejas) y la parte de arriba holgada, un poco caída hacia atrás;
// una etiquetita al costado. Rígido con la cabeza. Como la gorra, la copa se calza por fuera de la cabeza, las orejas
// y los peinados (gorra.mjs, queTapa), así el pelo sale por debajo.
import { Malla, caja, cascara, grilla, lerp, orientar, rayoDesdeAfuera, smooth, v3 } from './cuerpo.mjs';
import { queTapa } from './gorra.mjs';

export const ID = 'gorro_lana';
const rad = g => g * Math.PI / 180;
const sph = (phi, el) => v3(Math.cos(el) * Math.sin(phi), Math.sin(el), Math.cos(el) * Math.cos(phi));
const NP = 64, NR = 16, DOBLEZ = 4;   // filas del doblez (abajo)
// borde de abajo según el ángulo (0 = frente): sobre las cejas, tapa la parte de arriba de las orejas, baja atrás
const BA = [0, 45, 90, 135, 180], BE = [24, 18, 4, -10, -16];
function borde(phi) {
  const a = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi))) * 180 / Math.PI;
  let k = 0; while (k < BA.length - 2 && a > BA[k + 1]) k++;
  return rad(lerp(BE[k], BE[k + 1], (a - BA[k]) / (BA[k + 1] - BA[k])));
}

export function construir(C) {
  const m = new Malla(), HC = C.HC, tapar = queTapa(C);
  // los peinados sólo hasta 5 cm sobre la cabeza: los mechones que enmarcan la cara salen por debajo del doblez
  // (si el gorro los tapara enteros, se abría como una campana a los costados)
  const alcance = d => {
    const cab = rayoDesdeAfuera(C.mallaCabeza, HC, d, 0.6) ?? 0;
    return Math.max(...tapar.map(x => { const r = rayoDesdeAfuera(x, HC, d, 0.6) ?? 0; return tapar.pelos.includes(x) ? Math.min(r, cab + 0.05) : r; }));
  };
  const dirs = [], R = [];
  for (let r = 0; r < NR; r++) for (let k = 0; k < NP; k++) {
    const phi = 2 * Math.PI * k / NP, el = lerp(borde(phi), rad(86), (r / (NR - 1)) ** 0.8), d = sph(phi, el);
    dirs.push(d); R.push(alcance(d));
  }
  // engordar y suavizar (una tela lisa que no toca el pelo)
  const at = (A, r, k) => A[Math.max(0, Math.min(NR - 1, r)) * NP + ((k % NP) + NP) % NP];
  let S = R.map((_, i) => { const r = Math.floor(i / NP), k = i % NP; let x = 0; for (let a = -1; a <= 1; a++) for (let b = -2; b <= 2; b++) x = Math.max(x, at(R, r + a, k + b)); return x; });
  for (let p = 0; p < 3; p++) S = S.map((_, i) => { const r = Math.floor(i / NP), k = i % NP; let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += at(S, r + a, k + b); return s / 9; });
  const V = dirs.map((d, i) => {
    const r = Math.floor(i / NP), k = i % NP, t = r / (NR - 1), phi = 2 * Math.PI * k / NP;
    const doblez = r < DOBLEZ ? 0.009 * Math.sin(Math.PI * (r + 0.5) / DOBLEZ) + 0.005 : 0;     // el borde doblado, más grueso
    const canal = r >= DOBLEZ ? 0.0025 * Math.cos(phi * NP / 2) : 0;                             // canales del tejido
    // holgado: más volumen en la mitad de arriba, sobre todo atrás (un poco caído), sin hacer punta arriba
    const atras = smooth((-Math.cos(phi) + 0.3) / 1.3);
    const holgado = (0.012 + 0.016 * atras) * Math.sin(Math.PI * Math.min(1, t * 0.75 + 0.1)) * smooth((t - 0.2) / 0.4);
    return d.clone().multiplyScalar(Math.max(S[i], R[i]) + 0.008 + doblez + canal + holgado).add(HC);
  });
  const top = V.length, rTop = S.slice((NR - 1) * NP).reduce((a, x) => a + x, 0) / NP;
  V.push(v3(0, rTop + 0.008 + 0.006, -0.01).add(HC));
  const G = grilla(NR, NP, true);
  for (let k = 0; k < NP; k++) G.push([(NR - 1) * NP + (k + 1) % NP, (NR - 1) * NP + k, top]);
  const f0 = m.F.length;
  cascara(m, V, orientar(V, G, () => HC), 0.007, 'Gorro_Tejido', 'Gorro_Canal', 'Gorro_Doblez');
  // el doblez y los canales en otro tono (las caras de afuera van primero, 2 triángulos por cuadrilátero)
  for (let q = 0; q < (NR - 1) * NP; q++) {
    const r = Math.floor(q / NP), k = q % NP;
    const mt = r < DOBLEZ - 1 ? 'Gorro_Doblez' : r === DOBLEZ - 1 ? 'Gorro_Canal' : k % 2 ? 'Gorro_Canal' : null;
    if (mt) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = mt;
  }
  // etiqueta al costado derecho del doblez
  const k = Math.round(NP * 0.2), i = NP + k, d = dirs[i];
  caja(m, V[i].clone().addScaledVector(d, 0.004), v3(0.012, 0.016, 0.012), 'Gorro_Etiqueta', 0.3);
  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return {
    mallas: [{ nombre: 'Acc_GorroLana', malla: m }],
    materiales: {
      Gorro_Tejido: { color: '#56565E', rugosidad: 0.95 },
      Gorro_Canal: { color: '#48484F', rugosidad: 0.95 },
      Gorro_Doblez: { color: '#4E4E56', rugosidad: 0.95 },
      Gorro_Etiqueta: { color: '#F2EEE6', rugosidad: 0.8 },
    },
  };
}
