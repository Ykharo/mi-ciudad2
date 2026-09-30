// Lentes redondos: dos aros delante de los ojos, el puente y las patillas que van por el costado de la cabeza
// hasta detrás de las orejas (debajo del pelo). Sin vidrio. Accesorio rígido: todo pesa en HeadBone.
import { Malla, lerp, rayo, rayoDesdeAfuera, tubo, v3 } from './cuerpo.mjs';

export const ID = 'lentes';
// centro de cada ojo: medido en la textura de Face_Eyes (casilla "normal"), llevado a la malla de la cara
const OJO_X = 0.066, OJO_Y = 1.309;
const ARO = 0.043, GRUESO = 0.0048, DELANTE = 0.02;

export function construir(C) {
  const m = new Malla();
  // la cara vista de frente: z de la superficie en (x, y)
  const cara = (x, y) => { const t = rayo(C.mallaCabeza, v3(x, y, 0.5), v3(0, 0, -1)); return t == null ? 0.1 : 0.5 - t; };
  const alFrente = (x, y) => v3(x, y, cara(x, y) + DELANTE);
  for (const s of [1, -1]) {
    // aro
    const aro = Array.from({ length: 28 }, (_, k) => { const a = 2 * Math.PI * k / 28; return alFrente(s * OJO_X + ARO * Math.cos(a), OJO_Y + ARO * 0.94 * Math.sin(a)); });
    tubo(m, aro, GRUESO, 'Lentes_Marco', { cerrado: true, lados: 6, aplanar: 0.8, ref: v3(0, 0, 1) });
    // patilla: del borde de afuera del aro hacia atrás, pegada al costado de la cabeza (y sobre la oreja)
    const y = OJO_Y + 0.012, x0 = s * (OJO_X + ARO - 0.002), p0 = alFrente(x0, y), pts = [p0];
    for (let i = 1; i <= 7; i++) {
      const z = lerp(p0.z - 0.02, -0.05, i / 7), eje = v3(0, y - 0.004 * i / 7, z), d = v3(s, 0, 0);
      const r = Math.max(rayoDesdeAfuera(C.mallaCabeza, eje, d, 0.5) ?? 0, rayoDesdeAfuera(C.mallaOrejas, eje, d, 0.5) ?? 0);
      pts.push(eje.addScaledVector(d, Math.max(r + 0.007, Math.abs(x0) + 0.01)));
    }
    tubo(m, pts, GRUESO * 0.75, 'Lentes_Marco', { lados: 6 });
  }
  // puente entre los aros, un poco arqueado
  const xi = OJO_X - ARO + 0.002;
  const puente = Array.from({ length: 7 }, (_, i) => { const u = i / 6 * 2 - 1; return alFrente(u * xi, OJO_Y + 0.012 + 0.006 * (1 - u * u)); });
  tubo(m, puente, GRUESO * 0.8, 'Lentes_Marco', { lados: 6 });

  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return {
    mallas: [{ nombre: 'Acc_Lentes', malla: m }],
    materiales: { Lentes_Marco: { color: '#A77BF3', rugosidad: 0.45 } },
  };
}
