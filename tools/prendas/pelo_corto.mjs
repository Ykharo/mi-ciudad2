// Pelo corto desordenado (referencias/ropa/hoja_personaje_nino.png, "Cabello corto"): un casquete oscuro de base y,
// encima, ~60 mechones sueltos. Cada mechón es una mecha con volumen (ancha al medio, con punta) que nace en el cuero
// cabelludo, sigue la curva de la cabeza y se levanta hacia la punta, con un poco de giro hacia el costado.
// Capas: la coronilla (se abre hacia afuera, da volumen), la del medio, la de abajo (puntas que cuelgan bajo el borde,
// sobre las orejas y la nuca) y el flequillo (dos capas; cae sobre las cejas sin tapar los ojos). Largo, dirección,
// grosor y tono varían con un azar de semilla fija: sale siempre igual. Unos 7.000 vértices.
// (La versión anterior era un casquete con puntas en el borde: se veía como un corte "de tazón".)
import * as THREE from 'three';
import { Malla, cascara, grilla, lerp, orientar, orientarCaras, rayo, rayoDesdeAfuera, smooth, v3 } from './cuerpo.mjs';

export const ID = 'pelo_corto';
const rad = g => g * Math.PI / 180;
const sph = (phi, el) => v3(Math.cos(el) * Math.sin(phi), Math.sin(el), Math.cos(el) * Math.cos(phi));
// borde de abajo según el ángulo (0 = frente), elevaciones en grados en BA = 0, 30, 60, 90, 130, 180
const BA = [0, 30, 60, 90, 130, 180];
const bordeDe = BE => phi => {
  const a = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi))) * 180 / Math.PI;
  let k = 0; while (k < BA.length - 2 && a > BA[k + 1]) k++;
  return rad(lerp(BE[k], BE[k + 1], (a - BA[k]) / (BA[k + 1] - BA[k])));
};
// azar con semilla (mulberry32)
function azar(s) {
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Opciones (las usan pelo_corto y pelo_largo_desordenado, pelo_largo_desordenado.mjs):
//   P: prefijo de los materiales; BE: el borde (ver BA); largo: una capa más de mechones largos que bajan hasta el
//   borde (tapan las orejas y llegan a la mandíbula y la nuca)
export function construirMechones(C, { P, BE, largo = false }) {
  const m = new Malla(), HC = C.HC, r = azar(20260930), borde = bordeDe(BE);
  const entre = (a, b) => lerp(a, b, r());
  const bajo = d => Math.max(rayo(C.mallaCabeza, HC, d) ?? 0.16, rayoDesdeAfuera(C.mallaOrejas, HC, d, 0.5) ?? 0);
  // volumen del peinado según la altura: poco en el borde, más arriba
  const volumen = (phi, el) => 0.008 + 0.018 * smooth((el - borde(phi)) / rad(55));
  const superficie = (phi, el) => { const d = sph(phi, el); return d.multiplyScalar(bajo(d) + volumen(phi, el)).add(HC); };

  // --- casquete de base, oscuro (lo que se ve entre mechones), con el borde más arriba que las puntas; adelante,
  // mucho más arriba: si no, su borde se veía como una franja recta sobre la frente, bajo el flequillo
  const NP = 72, NR = 12, V = [];
  for (let f = 0; f < NR; f++) for (let k = 0; k < NP; k++) {
    const phi = 2 * Math.PI * k / NP, adelante = smooth((Math.cos(phi) - 0.2) / 0.8);
    const el = lerp(borde(phi) + rad(8 + 22 * adelante), rad(88), (f / (NR - 1)) ** 0.9);
    V.push(superficie(phi, el));
  }
  const top = V.length; V.push(v3(0, 1, 0).multiplyScalar(bajo(v3(0, 1, 0)) + volumen(0, rad(90))).add(HC));
  const G = grilla(NR, NP, true);
  for (let k = 0; k < NP; k++) G.push([(NR - 1) * NP + (k + 1) % NP, (NR - 1) * NP + k, top]);
  cascara(m, V, orientar(V, G, () => HC), 0.008, P + '_Oscuro', P + '_Oscuro', P + '_Oscuro');

  // --- un mechón: de (phi0, el0) a (phi0 + dphi, el1) por la superficie, con giro `curva` y la punta levantada `alza`
  const N = 12, M = 7;   // segmentos a lo largo y puntos de la sección
  // encima: cuánto más afuera va todo el mechón (las capas de arriba sobre las de abajo, como tejas, y un poco distinto
  // cada uno): si dos mechones quedaban a la misma altura, se veían manchas donde se cruzaban
  function mechon({ phi0, el0, dphi, el1, ancho, grueso, alza, curva, mat, encima = 0 }) {
    encima += entre(0, 0.0025);
    const P = [], nor = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, phi = phi0 + dphi * s + curva * s * s, el = lerp(el0, el1, s ** 0.95), d = sph(phi, el);
      P.push(d.clone().multiplyScalar(bajo(d) + volumen(phi, el) + 0.004 + encima + grueso * 0.6 + alza * s * s).add(HC));
      nor.push(d);
    }
    const Vm = [], ejes = [];
    P.forEach((p, i) => {
      const s = i / N, t = P[Math.min(i + 1, N)].clone().sub(P[Math.max(i - 1, 0)]).normalize();
      const lado = new THREE.Vector3().crossVectors(t, nor[i]).normalize();
      // ancho casi todo el largo y en punta al final (con la punta muy temprana se veían como palitos)
      const w = ancho * (s < 0.12 ? lerp(0.7, 1, s / 0.12) : Math.max(0.02, 1 - ((s - 0.12) / 0.88) ** 2.4));
      const g = grueso * Math.max(0.15, 1 - s ** 1.8);
      for (let a = 0; a < M; a++) {
        const ang = 2 * Math.PI * a / M;
        Vm.push(p.clone().addScaledVector(lado, w * Math.cos(ang)).addScaledVector(nor[i], g * Math.sin(ang)));
        ejes.push(p);
      }
    });
    // la punta se cierra en un punto; la base, con una tapa (queda escondida en el casquete)
    const punta = Vm.length; Vm.push(P[N].clone().addScaledVector(P[N].clone().sub(P[N - 1]).normalize(), 0.006)); ejes.push(P[N - 1]);
    const base = Vm.length; Vm.push(P[0].clone()); ejes.push(P[1]);
    const F = grilla(N + 1, M, true);
    for (let a = 0; a < M; a++) { F.push([N * M + a, punta, N * M + (a + 1) % M]); F.push([base, a, (a + 1) % M]); }
    m.add(Vm, orientarCaras(Vm, F, f => ejes[f[0]]), mat);
  }
  const tono = () => { const x = r(); return x < 0.2 ? P + '_Claro' : x < 0.32 ? P + '_Oscuro' : P + '_Base'; };
  const frente = phi => Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi))) < rad(55);

  // coronilla: se abre hacia afuera desde arriba, más levantada (volumen desordenado)
  for (let k = 0; k < 12; k++) {
    const phi0 = rad(k * 30 + entre(-10, 10));
    mechon({ phi0, el0: rad(entre(80, 86)), dphi: rad(entre(-18, 18)), el1: rad(entre(46, 56)), ancho: entre(0.026, 0.034),
      grueso: entre(0.008, 0.011), alza: entre(0.002, 0.008), curva: rad(entre(-10, 10)), mat: tono(), encima: 0.006 });
  }
  // capa del medio (menos adelante, donde va el flequillo)
  for (let k = 0; k < 16; k++) {
    const phi0 = rad(k * 22.5 + 11 + entre(-6, 6));
    if (frente(phi0)) continue;
    mechon({ phi0, el0: rad(entre(58, 66)), dphi: rad(entre(-14, 14)), el1: borde(phi0) + rad(entre(-2, 6)), ancho: entre(0.026, 0.034),
      grueso: entre(0.008, 0.01), alza: entre(0.005, 0.012) * (largo ? 0.3 : 1), curva: rad(entre(-12, 12)), mat: tono(), encima: 0.003 });
  }
  // capa de abajo: puntas que cuelgan bajo el borde (sobre las orejas, en la nuca)
  for (let k = 0; k < 20; k++) {
    const phi0 = rad(k * 18 + entre(-5, 5));
    if (frente(phi0)) continue;
    // (en el pelo largo las puntas caen: se levantan mucho menos, si no se abrían hacia afuera como tablas)
    mechon({ phi0, el0: rad(entre(30, 40)), dphi: rad(entre(-10, 10)), el1: borde(phi0) - rad(entre(4, 12)), ancho: entre(0.024, 0.032),
      grueso: entre(0.007, 0.009), alza: entre(0.004, 0.014) * (largo ? 0.2 : 1), curva: rad(entre(-14, 14)), mat: tono() });
  }
  // flequillo: de arriba hacia la frente, hasta las cejas, con un poco de barrido hacia los costados; dos capas
  // (una más corta encima) para que no se vea el casquete entre los mechones
  for (let capa = 0; capa < 2; capa++) for (let k = 0; k < 10; k++) {
    const u = (k + 0.5 * capa) / 9.5 - 0.5, phi0 = rad(u * 104 + entre(-4, 4));
    const largo = (1 - Math.abs(u) * 0.8) * (capa ? 0.85 : 1);   // los del centro, más largos
    // (como en la hoja, los del centro tapan las cejas y llegan justo sobre los ojos: los ojos empiezan a ~6°)
    mechon({ phi0, el0: rad(entre(66, 74)), dphi: rad(u * 18 + entre(-7, 7)), el1: rad(lerp(32, entre(11, 15), largo)), ancho: entre(0.019, 0.025),
      grueso: entre(0.007, 0.009), alza: entre(0.002, 0.006) + capa * 0.004, curva: rad(entre(-9, 9)), mat: tono(), encima: 0.003 + capa * 0.003 });
  }

  // capa larga: de la mitad de la cabeza hasta el borde (bajo), por los costados y atrás, sobre las demás
  if (largo) for (let k = 0; k < 26; k++) {
    const phi0 = rad(k * 360 / 26 + entre(-5, 5));
    if (Math.abs(Math.atan2(Math.sin(phi0), Math.cos(phi0))) < rad(62)) continue;
    mechon({ phi0, el0: rad(entre(18, 30)), dphi: rad(entre(-8, 8)), el1: borde(phi0) - rad(entre(2, 10)), ancho: entre(0.026, 0.034),
      grueso: entre(0.008, 0.01), alza: entre(0.004, 0.016) * 0.15, curva: rad(entre(-12, 12)), mat: tono(), encima: 0.005 });
  }

  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return m;
}

export function construir(C) {
  const m = construirMechones(C, { P: 'PeloCorto', BE: [16, 12, 2, -8, -22, -34] });
  return {
    mallas: [{ nombre: 'Pelo_Corto', malla: m }],
    materiales: {   // castaño, como en la hoja (mismos tonos y reglas que los otros peinados)
      PeloCorto_Base: { color: '#5A3521', rugosidad: 0.66 },
      PeloCorto_Claro: { color: '#7A4A2E', rugosidad: 0.7 },
      PeloCorto_Oscuro: { color: '#40231A', rugosidad: 0.72 },
    },
  };
}
