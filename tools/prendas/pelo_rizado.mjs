// Pelo rizado corto (referencias/ropa/hoja_ropa_gorro_poleron.png, "Rizado"): un casquete de base y, encima, más de
// cien rulos (bolitas un poco aplastadas, de tamaños y tonos variados, con azar de semilla fija).
// Los rulos de arriba van en su propia malla, Pelo_Rizado_Tope, que los gorros esconden (catálogo: `oculta`): así el
// volumen no agranda los gorros y bajo un gorro sólo asoman los rulos del borde.
import { Malla, cascara, grilla, lerp, orientar, rayo, rayoDesdeAfuera, revolucion, smooth, v3 } from './cuerpo.mjs';

export const ID = 'pelo_rizado';
const rad = g => g * Math.PI / 180;
const sph = (phi, el) => v3(Math.cos(el) * Math.sin(phi), Math.sin(el), Math.cos(el) * Math.cos(phi));
const interp = (A, E) => phi => {
  const a = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi))) * 180 / Math.PI;
  let k = 0; while (k < A.length - 2 && a > A[k + 1]) k++;
  return rad(lerp(E[k], E[k + 1], (a - A[k]) / (A[k + 1] - A[k])));
};
// borde del pelo (0 = frente) y borde del gorro más bajo (el de lana, gorro_lana.mjs): sobre él, los rulos van al tope
const borde = interp([0, 30, 60, 90, 130, 180], [22, 16, 6, -2, -18, -30]);
const bordeGorro = interp([0, 45, 90, 135, 180], [24, 18, 4, -10, -16]);
function azar(s) {
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function construir(C) {
  const HC = C.HC, r = azar(77), base = new Malla(), tope = new Malla();
  const bajo = d => Math.max(rayo(C.mallaCabeza, HC, d) ?? 0.16, rayoDesdeAfuera(C.mallaOrejas, HC, d, 0.5) ?? 0);
  // casquete
  const NP = 48, NR = 10, V = [];
  for (let f = 0; f < NR; f++) for (let k = 0; k < NP; k++) {
    const phi = 2 * Math.PI * k / NP, el = lerp(borde(phi) + rad(4), rad(88), (f / (NR - 1)) ** 0.9), d = sph(phi, el);
    V.push(d.clone().multiplyScalar(bajo(d) + 0.012 + 0.008 * smooth(f / 4)).add(HC));
  }
  const top = V.length; V.push(v3(0, 1, 0).multiplyScalar(bajo(v3(0, 1, 0)) + 0.02).add(HC));
  const G = grilla(NR, NP, true);
  for (let k = 0; k < NP; k++) G.push([(NR - 1) * NP + (k + 1) % NP, (NR - 1) * NP + k, top]);
  cascara(base, V, orientar(V, G, () => HC), 0.008, 'PeloRizado_Oscuro', 'PeloRizado_Oscuro', 'PeloRizado_Oscuro');
  // unos 170 rulos redondos (11 lados, 7 anillos: con 8 lados y aplastados parecían discos de panal), repartidos de
  // forma pareja (espiral de Fibonacci) sobre la parte con pelo
  const N = 260, aurea = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, el = Math.asin(y), phi = i * aurea;
    if (el < borde(phi) - rad(6)) continue;
    const d = sph(phi, el), radio = 0.024 + 0.01 * r(), sobre = bajo(d) + 0.014 + 0.004 * r();
    // bolitas casi redondas, metidas un poco unas en otras (aplastadas se veían como discos de panal)
    const c = d.clone().multiplyScalar(sobre + radio * 0.15).add(HC);
    const tono = r() < 0.25 ? 'PeloRizado_Claro' : r() < 0.15 ? 'PeloRizado_Oscuro' : 'PeloRizado_Base';
    const m = el > bordeGorro(phi) + rad(7) ? tope : base;
    const R = radio, Z = 0.9 * radio;
    revolucion(m, [[0, -Z], [0.5 * R, -0.87 * Z], [0.87 * R, -0.5 * Z], [R, 0], [0.87 * R, 0.5 * Z], [0.5 * R, 0.87 * Z], [0, Z]], c, d, tono, 11);
  }
  for (const m of [base, tope]) m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return {
    mallas: [{ nombre: 'Pelo_Rizado', malla: base }, { nombre: 'Pelo_Rizado_Tope', malla: tope }],
    materiales: {   // rubio oscuro, como en la hoja
      PeloRizado_Base: { color: '#C99A5B', rugosidad: 0.7 },
      PeloRizado_Claro: { color: '#DDB476', rugosidad: 0.7 },
      PeloRizado_Oscuro: { color: '#A87D45', rugosidad: 0.75 },
    },
  };
}
