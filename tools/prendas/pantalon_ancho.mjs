// Pantalón cargo ancho de la amiga (referencias/ropa/hoja_personaje_nuevo.png, "Pantalón cargo (con cadena)"): lila,
// muy ancho y largo (cae sobre la zapatilla), con bolsillos cargo con tapa al costado de cada muslo y una cadena que
// cuelga de la cadera derecha (se puede sacar en el Vestidor). Mismo armado que el buzo (buzo.mjs).
import * as THREE from 'three';
import { Malla, caja, lerp, pesosDelCuerpo, rayoDesdeAfuera, tubo, v3 } from './cuerpo.mjs';
import { centroZ, juntar } from './chaqueta.mjs';
import { cadera, pierna } from './buzo.mjs';

export const ID = 'pantalon_ancho';
const M = { tela: 'PantalonA_Tela', pretina: 'PantalonA_Pretina', forro: 'PantalonA_Forro' };

function bolsillo(C, leg, S) {
  const side = S === 'L' ? -1 : 1, m = new Malla(), y = 0.53;
  const eje = leg.ejeEn(y), fuera = v3(side, 0, 0.12).normalize();
  const r = rayoDesdeAfuera(leg.sup, eje, fuera, 0.4) ?? 0.1;
  const p = eje.clone().addScaledVector(fuera, r);
  caja(m, p.clone().addScaledVector(fuera, 0.008), v3(0.012, 0.062, 0.052), 'PantalonA_Bolsillo', 0.25);           // bolsillo
  caja(m, p.clone().addScaledVector(fuera, 0.017).add(v3(0, 0.05, 0)), v3(0.008, 0.02, 0.056), 'PantalonA_Pretina', 0.3); // tapa
  m.pesos = pesosDelCuerpo(C, m.V, ['Thigh' + S], 4, side);
  return m;
}

// cadena: eslabones alternados (uno de frente, otro de canto) que cuelgan en U de la cadera derecha
function cadena(C, sups) {
  const m = new Malla(), zc = centroZ(C, 0.8), A = 0.3, B = 1.65, N = 24;
  // (apoyada en lo que esté más afuera: la cadera o el muslo derecho, que es más ancho abajo)
  const punto = u => {
    const a = lerp(A, B, u), y = 0.845 - 0.17 * Math.sin(Math.PI * u), d = v3(Math.sin(a), 0, Math.cos(a));
    const e = v3(0, y, zc), r = Math.max(...sups.map(s => rayoDesdeAfuera(s, e, d, 0.5) ?? 0));
    return { p: e.addScaledVector(d, r + 0.011), n: d };
  };
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, { p, n } = punto(u), q = punto(Math.min(1, u + 0.01)).p;
    const t = q.clone().sub(p).normalize(), b = new THREE.Vector3().crossVectors(t, n).normalize();
    const ancho = i % 2 ? b : n.clone().addScaledVector(t, -n.dot(t)).normalize();   // de frente o de canto
    const aro = Array.from({ length: 10 }, (_, k) => {
      const a = 2 * Math.PI * k / 10;
      return p.clone().addScaledVector(t, 0.012 * Math.cos(a)).addScaledVector(ancho, 0.0065 * Math.sin(a));
    });
    tubo(m, aro, 0.0028, 'PantalonA_Cadena', { cerrado: true, lados: 5, ref: ancho.clone().cross(t) });
  }
  m.pesos = m.V.map(() => [['Hips', 1]]);
  return m;
}

export function construir(C) {
  const cad = cadera(C, M, { holgura: 0.006 });
  const opts = { minimo: [0.095, 0.118], pegado: 0.75, recoge: 0.98, yBajo: 0.055 };
  const L = pierna(C, 'L', M, opts), R = pierna(C, 'R', M, opts);
  return {
    mallas: [{ nombre: 'Ropa_PantalonAncho', malla: juntar([cad, L, R, bolsillo(C, L, 'L'), bolsillo(C, R, 'R'), cadena(C, [cad.sup, R.sup])]) }],
    materiales: {   // (con la luz del juego un lila pálido se ve blanco: va más saturado que en la hoja)
      PantalonA_Tela: { color: '#BFA6E2', rugosidad: 0.85 },
      PantalonA_Pretina: { color: '#B098D6', rugosidad: 0.85 },
      PantalonA_Bolsillo: { color: '#B79DDC', rugosidad: 0.85 },
      PantalonA_Forro: { color: '#A58BC9', rugosidad: 0.9 },
      PantalonA_Cadena: { color: '#8E929E', rugosidad: 0.35 },
    },
  };
}
