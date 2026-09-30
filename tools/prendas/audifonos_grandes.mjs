// Audífonos grandes puestos (referencias/ropa/hoja_personaje_nino.png): dos auriculares sobre las orejas y el cintillo
// por encima de la cabeza, que pasa sobre la gorra o el jockey si están puestos (por eso van en su propio espacio,
// `orejas`, y se pueden llevar con cualquier gorro). Accesorio rígido: todo pesa en HeadBone.
// Se calzan por fuera de todo lo que puede haber en la cabeza: la cabeza, las orejas, los peinados y las gorras.
import { Malla, lerp, mallaRayos, rayoDesdeAfuera, revolucion, tubo, v3 } from './cuerpo.mjs';
import { queTapa } from './gorra.mjs';
import * as gorra from './gorra.mjs';
import * as jockey from './jockey.mjs';

export const ID = 'audifonos_grandes';
const OREJA = v3(0, 1.292, -0.005);            // centro de las orejas (en y, z; x = el costado)
const R_AURICULAR = 0.06, ANCHO_CINTILLO = 0.032, GRUESO_CINTILLO = 0.018;

export function construir(C) {
  const m = new Malla(), HC = C.HC;
  const gorros = [gorra, jockey].map(g => g.construir(C).mallas[0].malla);
  const todo = [...queTapa(C), ...gorros.map(g => mallaRayos(g.V.flatMap(v => [v.x, v.y, v.z]), g.F.flat()))];
  const lejos = (eje, d) => Math.max(...todo.map(x => rayoDesdeAfuera(x, eje, d, 0.6) ?? 0));
  const extremos = [];
  for (const s of [1, -1]) {
    // lo más afuera que hay en el círculo que cubre el auricular
    let x0 = 0;
    for (let i = 0; i < 24; i++) for (const f of [0, 0.5, 1]) {
      const a = 2 * Math.PI * i / 24, eje = v3(0, OREJA.y + Math.sin(a) * R_AURICULAR * f, OREJA.z + Math.cos(a) * R_AURICULAR * f);
      x0 = Math.max(x0, lejos(eje, v3(s, 0, 0)));
    }
    const ax = v3(s, 0, 0), centro = v3(s * (x0 + 0.004 + 0.016), OREJA.y, OREJA.z);   // cara de adentro a 4 mm
    revolucion(m, [[0, -0.016], [R_AURICULAR - 0.006, -0.016], [R_AURICULAR, -0.008], [R_AURICULAR, 0.004], [R_AURICULAR - 0.008, 0.013], [0, 0.015]], centro, ax, 'AudifonosG_Carcasa', 24);
    revolucion(m, [[0, -0.03], [R_AURICULAR - 0.01, -0.03], [R_AURICULAR - 0.003, -0.025], [R_AURICULAR - 0.002, -0.016], [0, -0.014]], centro, ax, 'AudifonosG_Almohadilla', 24);
    extremos.push(centro.clone().add(v3(0, R_AURICULAR - 0.004, 0)));
  }
  // cintillo: un arco sobre la cabeza, por fuera de todo (con el ancho del cintillo), que baja hasta los auriculares
  const pts = [extremos[1]];
  for (let i = 0; i <= 20; i++) {
    const th = lerp(-72, 72, i / 20) * Math.PI / 180, d = v3(Math.sin(th), Math.cos(th), 0);
    let r = 0;
    for (const dz of [-ANCHO_CINTILLO / 2, 0, ANCHO_CINTILLO / 2]) r = Math.max(r, lejos(HC.clone().add(v3(0, 0, OREJA.z - HC.z + dz)), d));
    pts.push(d.multiplyScalar(r + 0.004 + GRUESO_CINTILLO / 2).add(v3(HC.x, HC.y, OREJA.z)));
  }
  pts.push(extremos[0]);
  // suaviza (los mechones y el botón de la gorra dan saltitos)
  for (let pasada = 0; pasada < 3; pasada++)
    for (let i = 1; i < pts.length - 1; i++) { const p = pts[i - 1].clone().add(pts[i]).add(pts[i]).add(pts[i + 1]).multiplyScalar(0.25); if (p.distanceTo(HC) > pts[i].distanceTo(HC)) pts[i] = p; }
  tubo(m, pts, GRUESO_CINTILLO / 2, 'AudifonosG_Cintillo', { lados: 10, aplanar: ANCHO_CINTILLO / GRUESO_CINTILLO, ref: v3(0, 0, 1) });

  m.pesos = m.V.map(() => [['HeadBone', 1]]);
  return {
    mallas: [{ nombre: 'Acc_AudifonosGrandes', malla: m }],
    materiales: {
      AudifonosG_Carcasa: { color: '#2A2A33', rugosidad: 0.45 },
      AudifonosG_Almohadilla: { color: '#44444F', rugosidad: 0.9 },
      AudifonosG_Cintillo: { color: '#24242C', rugosidad: 0.5 },
    },
  };
}
