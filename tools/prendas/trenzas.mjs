// Trenzas (referencias/ropa/hoja_personaje_nuevo.png, "Trenzas"): el casquete del pelo largo (raya al medio) y dos
// trenzas que nacen detrás de las orejas, bajan por el costado del cuello y caen por delante de los hombros hasta el
// pecho, con una gomita y la punta suelta. Cada trenza es una fila de "eslabones" redondeados que se inclinan a un
// lado y al otro, como el tejido de una trenza.
import * as THREE from 'three';
import { Malla, lerp, normalizar, rayo, rayoDesdeAfuera, revolucion, smooth, tubo, v3 } from './cuerpo.mjs';
import { casquete } from './pelo_largo.mjs';
import { centroZ } from './chaqueta.mjs';

export const ID = 'trenzas';
const rad = g => g * Math.PI / 180;
const sph = (phi, el) => v3(Math.cos(el) * Math.sin(phi), Math.sin(el), Math.cos(el) * Math.cos(phi));

// curva suave por puntos de control (Catmull-Rom)
function curva(ctrl, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * (ctrl.length - 1), k = Math.min(Math.floor(u), ctrl.length - 2), f = u - k;
    const p0 = ctrl[Math.max(k - 1, 0)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(k + 2, ctrl.length - 1)];
    const f2 = f * f, f3 = f2 * f;
    pts.push(new THREE.Vector3(
      ...[0, 1, 2].map(j => {
        const a = p0.getComponent(j), b = p1.getComponent(j), c = p2.getComponent(j), d = p3.getComponent(j);
        return 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3);
      })));
  }
  return pts;
}

function trenza(C, m, s) {
  const HC = C.HC, hombros = C.partes(['Spine', 'Chest', 'Neck', 'UpperArmL', 'UpperArmR']);
  const headR = d => rayo(C.mallaCabeza, HC, d) ?? 0.16;
  const raiz = HC.clone().addScaledVector(sph(s * rad(108), rad(-16)), headR(sph(s * rad(108), rad(-16))) + 0.012);
  const ctrl = [raiz, v3(s * 0.135, 1.17, -0.03), v3(s * 0.13, 1.09, 0.05), v3(s * 0.115, 0.99, 0.1), v3(s * 0.11, 0.9, 0.11)];
  let P = curva(ctrl, 15);
  // por fuera del cuerpo (cuello, hombros, pecho): al menos 3 cm sobre la piel
  P = P.map(p => {
    if (p.y > 1.2) return p;
    const eje = v3(0, p.y, centroZ(C, Math.min(p.y, 1.12))), d = p.clone().sub(eje).setY(0), r = d.length();
    const piel = rayoDesdeAfuera(hombros, eje, d.normalize(), 0.5) ?? 0;
    return r < piel + 0.04 ? eje.addScaledVector(d, piel + 0.04).setY(p.y) : p;
  });
  // eslabones a lo largo de la curva, inclinados a un lado y al otro
  // (eslabones gruesos y bien encimados: delgados y separados parecían un collar de cuentas)
  const largo = P.reduce((a, p, i) => (i ? a + p.distanceTo(P[i - 1]) : 0), 0), paso = 0.021, n = Math.floor((largo - 0.07) / paso);
  const en = dist => {   // punto y tangente a cierta distancia de la raíz
    let acc = 0;
    for (let i = 1; i < P.length; i++) {
      const l = P[i].distanceTo(P[i - 1]);
      if (acc + l >= dist) { const f = (dist - acc) / l; return [P[i - 1].clone().lerp(P[i], f), P[i].clone().sub(P[i - 1]).normalize()]; }
      acc += l;
    }
    return [P[P.length - 1].clone(), P[P.length - 1].clone().sub(P[P.length - 2]).normalize()];
  };
  for (let i = 0; i < n; i++) {
    const [c, t] = en(0.012 + i * paso), afuera = c.clone().sub(v3(0, c.y, centroZ(C, Math.min(c.y, 1.12)))).setY(0).normalize();
    const lado = new THREE.Vector3().crossVectors(t, afuera).normalize(), sgn = i % 2 ? 1 : -1;
    const r = lerp(0.031, 0.022, i / n), h = 0.034;
    const eje = t.clone().applyAxisAngle(afuera, sgn * rad(32));
    revolucion(m, [[0, -h], [0.6 * r, -0.8 * h], [0.95 * r, -0.3 * h], [r, 0], [0.95 * r, 0.3 * h], [0.6 * r, 0.8 * h], [0, h]],
      c.clone().addScaledVector(lado, sgn * 0.008), eje, i % 3 === 1 ? 'Trenzas_Claro' : 'Trenzas_Base', 12);
  }
  // gomita y punta suelta
  const [cg, tg] = en(0.012 + n * paso), ref = Math.abs(tg.y) > 0.9 ? v3(1, 0, 0) : v3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(tg, ref).normalize(), w = new THREE.Vector3().crossVectors(tg, u);
  tubo(m, Array.from({ length: 12 }, (_, k) => { const a = 2 * Math.PI * k / 12; return cg.clone().addScaledVector(u, 0.015 * Math.cos(a)).addScaledVector(w, 0.015 * Math.sin(a)); }),
    0.005, 'Trenzas_Gomita', { cerrado: true, lados: 6, ref: tg });
  revolucion(m, [[0, 0.004], [0.016, -0.004], [0.019, -0.02], [0.013, -0.038], [0, -0.05]], cg, tg.clone().negate(), 'Trenzas_Base', 12);
}

export function construir(C) {
  const m = new Malla(), HC = C.HC;
  casquete(C, m, d => rayo(C.mallaCabeza, HC, d) ?? 0.16, 'Trenzas');
  trenza(C, m, 1); trenza(C, m, -1);
  // pesos (como el pelo largo): a la altura de la cabeza sigue a la cabeza; hacia las puntas, al pecho
  m.pesos = m.V.map(p => {
    const w = smooth((1.24 - p.y) / 0.16);
    return normalizar([['HeadBone', 1 - w], ['Neck', 0.7 * w * (1 - w)], ['Chest', w]]);
  });
  return {
    mallas: [{ nombre: 'Pelo_Trenzas', malla: m }],
    materiales: {
      Trenzas_Base: { color: '#4D2C1F', rugosidad: 0.66 },
      Trenzas_Claro: { color: '#5B3525', rugosidad: 0.7 },
      Trenzas_Oscuro: { color: '#40231C', rugosidad: 0.72 },
      Trenzas_Gomita: { color: '#FF6FAE', rugosidad: 0.5 },
    },
  };
}
