// Lentes de sol, tres modelos. Como los lentes redondos (lentes.mjs): delante de los ojos siguiendo la curva de la
// cara, con el puente y las patillas por el costado de la cabeza hasta detrás de las orejas. Además, la lente: una
// lámina teñida con la forma del marco, un poco detrás de él. Rígidos con la cabeza.
//   lentes_aviador   gota, marco dorado fino, doble puente
//   lentes_clasicos  marco negro grueso, más ancho arriba (tipo "wayfarer")
//   lentes_corazon   corazones rosados
import { Malla, calcomania, lerp, rayo, rayoDesdeAfuera, tubo, v3 } from './cuerpo.mjs';

// centro de cada ojo (como en lentes.mjs)
const OJO_X = 0.066, OJO_Y = 1.309, DELANTE = 0.02, N = 40;

// contornos de la lente derecha, en metros desde el centro del ojo: [afuera (+ = lejos de la nariz), arriba]
const CONTORNOS = {
  // gota: arriba casi recta, abajo honda y corrida hacia la nariz (la punta de la gota abajo, adentro)
  aviador: t => {
    const s = Math.sin(t), c = Math.cos(t), abajo = Math.max(0, -s);
    return [0.05 * c - 0.014 * abajo, (s > 0 ? 0.024 * Math.sign(s) * Math.abs(s) ** 0.6 : 0.046 * s) + 0.008];
  },
  // rectángulo redondeado, más ancho arriba (el lado de afuera sube un poco)
  clasicos: t => {
    const s = Math.sin(t), c = Math.cos(t), e = 0.45;
    const x = 0.05 * Math.sign(c) * Math.abs(c) ** e, y = 0.031 * Math.sign(s) * Math.abs(s) ** e;
    return [x * (1 - 0.1 * Math.max(0, -s)) + 0.002, y + 0.004 * Math.max(0, c) * Math.max(0, s)];
  },
  // corazón (la curva clásica, escalada)
  corazon: t => [0.0028 * 16 * Math.sin(t) ** 3, 0.0028 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 0.006],
};

function construirLentes(C, { forma, marco, lente, grueso, aplanar = 0.8, ceja = 0, dobleAncho = false, M }) {
  const m = new Malla();
  const cara = (x, y) => { const t = rayo(C.mallaCabeza, v3(x, y, 0.5), v3(0, 0, -1)); return t == null ? 0.1 : 0.5 - t; };
  const alFrente = (x, y, d = DELANTE) => v3(x, y, cara(x, y) + d);
  const contorno = CONTORNOS[forma];
  // el corazón se recorre desde arriba (t = 0 es la hendidura): no importa el sentido para el marco
  const ts = Array.from({ length: N }, (_, k) => 2 * Math.PI * k / N);
  for (const s of [1, -1]) {
    const pts2 = ts.map(t => { const [ox, y] = contorno(t); return [s * (OJO_X + ox), OJO_Y + y]; });
    // marco
    tubo(m, pts2.map(([x, y]) => alFrente(x, y)), grueso, M.marco, { cerrado: true, lados: 6, aplanar, ref: v3(0, 0, 1) });
    // ceja: un borde más grueso arriba (clásicos)
    if (ceja) {
      const arriba = ts.filter(t => Math.sin(t) > 0.25).sort((a, b) => Math.cos(b) - Math.cos(a));
      tubo(m, arriba.map(t => { const [ox, y] = contorno(t); return alFrente(s * (OJO_X + ox), OJO_Y + y + ceja * 0.3, DELANTE + 0.001); }), ceja, M.marco, { lados: 6, aplanar: 0.6, ref: v3(0, 0, 1) });
    }
    // lente: lámina teñida con la forma del contorno, un poco detrás del marco
    // (en coordenadas desde el centro del ojo; el centro del abanico, un poco abajo en el corazón)
    calcomania(m, [{ c: [0, forma === 'corazon' ? -0.004 : 0], borde: pts2.map(([x, y]) => [x - s * OJO_X, y - OJO_Y]) }],
      (x, y) => alFrente(s * OJO_X + x, OJO_Y + y, DELANTE - 0.001), C.HC, 0.0018, M.lente);
    // patilla: del borde de afuera hacia atrás, pegada al costado de la cabeza (y sobre la oreja)
    const afuera = ts.reduce((a, t) => (contorno(t)[0] > contorno(a)[0] ? t : a), 0);
    const [ox] = contorno(afuera), y = OJO_Y + 0.012, x0 = s * (OJO_X + ox - 0.002), p0 = alFrente(x0, y), pts = [p0];
    for (let i = 1; i <= 7; i++) {
      const z = lerp(p0.z - 0.02, -0.05, i / 7), eje = v3(0, y - 0.004 * i / 7, z), d = v3(s, 0, 0);
      const r = Math.max(rayoDesdeAfuera(C.mallaCabeza, eje, d, 0.5) ?? 0, rayoDesdeAfuera(C.mallaOrejas, eje, d, 0.5) ?? 0);
      pts.push(eje.addScaledVector(d, Math.max(r + 0.007, Math.abs(x0) + 0.01)));
    }
    tubo(m, pts, grueso * 0.8, M.marco, { lados: 6, aplanar: 0.7 });
  }
  // puente entre las lentes, un poco arqueado; el aviador lleva además una barra recta arriba
  const interior = Math.min(...ts.map(t => contorno(t)[0])), xi = OJO_X + interior + 0.002;
  const puente = Array.from({ length: 7 }, (_, i) => { const u = i / 6 * 2 - 1; return alFrente(u * xi, OJO_Y + 0.01 + 0.006 * (1 - u * u)); });
  tubo(m, puente, grueso * 0.9, M.marco, { lados: 6 });
  if (dobleAncho) {
    const yb = OJO_Y + 0.031, x1 = OJO_X - 0.03;
    tubo(m, Array.from({ length: 7 }, (_, i) => alFrente(lerp(-x1, x1, i / 6), yb)), grueso * 0.85, M.marco, { lados: 6 });
  }
  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return { mallas: [{ nombre: 'Acc_' + M.nombre, malla: m }], materiales: { [M.marco]: marco, [M.lente]: lente } };
}

export const aviador = { ID: 'lentes_aviador', construir: C => construirLentes(C, {
  forma: 'aviador', grueso: 0.0024, dobleAncho: true,
  M: { nombre: 'LentesAviador', marco: 'SolA_Marco', lente: 'SolA_Lente' },
  marco: { color: '#D9B45A', rugosidad: 0.3 }, lente: { color: '#3A3F52', rugosidad: 0.15 },
}) };
export const clasicos = { ID: 'lentes_clasicos', construir: C => construirLentes(C, {
  forma: 'clasicos', grueso: 0.0045, aplanar: 0.7, ceja: 0.005,
  M: { nombre: 'LentesClasicos', marco: 'SolC_Marco', lente: 'SolC_Lente' },
  marco: { color: '#1E1E24', rugosidad: 0.35 }, lente: { color: '#2B3140', rugosidad: 0.15 },
}) };
export const corazon = { ID: 'lentes_corazon', construir: C => construirLentes(C, {
  forma: 'corazon', grueso: 0.0038,
  M: { nombre: 'LentesCorazon', marco: 'SolK_Marco', lente: 'SolK_Lente' },
  marco: { color: '#FF6FAE', rugosidad: 0.35 }, lente: { color: '#C9387F', rugosidad: 0.15 },
}) };
