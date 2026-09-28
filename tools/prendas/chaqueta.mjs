// Chaqueta abierta tipo "varsity" (referencia: referencias/ropa/hoja_de_referencia_nina.png, "Chaqueta").
// Cuerpo: anillos alrededor del torso, abierto adelante en V. Mangas: tubos que siguen el brazo (hombro → codo →
// muñeca). Borde, puños, cuello y bordes de la abertura en un color aparte ("detalles"); forro por dentro.
import * as THREE from 'three';
import { Malla, cascara, clamp, grilla, lerp, orientar, pesosDelCuerpo, rayo, smooth, v3 } from './cuerpo.mjs';

export const ID = 'chaqueta';
const HEM = 0.855, Y_NECK = 1.135, HOLGURA = 0.022;

function centroZ(C, y) {
  let s = 0, n = 0; const P = C.body.P;
  for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - y) < 0.025 && Math.abs(P[i]) < 0.12) { s += P[i + 2]; n++; }
  return n ? s / n : 0;
}
// radios de un anillo por rayos desde el eje; donde no hay choque, se rellena con los vecinos; luego se suaviza
function radios(mesh, eje, dirs, cerrado, minimo = 0.03) {
  let r = dirs.map(d => rayo(mesh, eje, d));
  for (let pasada = 0; pasada < 3 && r.some(x => x == null); pasada++)
    r = r.map((x, k) => x ?? (r[(k + 1) % r.length] ?? r[(k - 1 + r.length) % r.length]));
  r = r.map(x => x ?? minimo);
  const n = r.length;
  return r.map((_, k) => {   // media móvil de 5 (quita bultos)
    let s = 0, c = 0;
    for (let d = -2; d <= 2; d++) { const j = cerrado ? (k + d + n) % n : clamp(k + d, 0, n - 1); s += r[j]; c++; }
    return Math.max(minimo, s / c);
  });
}

function cuerpoChaqueta(C) {
  const m = new Malla(), NA = 44;
  const torso = C.partes(['Hips', 'Spine', 'Chest', 'Neck']);
  const hombros = C.partes(['Spine', 'Chest', 'Neck', 'UpperArmL', 'UpperArmR']);
  const ys = [HEM, HEM + 0.018, HEM + 0.036, ...Array.from({ length: 11 }, (_, i) => lerp(HEM + 0.05, Y_NECK, (i + 1) / 11))];
  const V = [], filas = [], ejes = [];
  ys.forEach((y, i) => {
    const t = (y - HEM) / (Y_NECK - HEM);
    const abre = lerp(0.30, 0.50, smooth((t - 0.4) / 0.6));      // abertura del frente (radianes, a cada lado)
    const angs = Array.from({ length: NA }, (_, k) => lerp(abre, 2 * Math.PI - abre, k / (NA - 1)));
    const dirs = angs.map(a => v3(Math.sin(a), 0, Math.cos(a)));
    const eje = v3(0, y, centroZ(C, Math.min(y, 1.10)));
    ejes.push(eje);
    const mesh = y > 1.02 ? hombros : torso;                        // sobre la axila, el hombro entra en la chaqueta
    let r = radios(mesh, eje, dirs, false);
    // en los hombros, otra pasada de suavizado: sin puntas donde el cuerpo se junta con el brazo
    if (y > 1.02) r = r.map((x, k) => (r[Math.max(k - 2, 0)] + r[Math.max(k - 1, 0)] + x + r[Math.min(k + 1, NA - 1)] + r[Math.min(k + 2, NA - 1)]) / 5);
    const cierre = smooth((y - (Y_NECK - 0.05)) / 0.05);            // arriba se ciñe al cuello
    const hol = HOLGURA * (1 - 0.15 * cierre) + (i < 3 ? 0.004 : 0); // el borde de abajo, un poco más grueso
    filas.push(dirs.map((d, k) => d.clone().multiplyScalar(r[k] + hol).add(eje)));
  });
  filas.forEach(f => V.push(...f));
  const F = orientar(V, grilla(ys.length, NA, false), i => ejes[Math.floor(i / NA)]);
  // el borde de abajo (3 primeros anillos) es de "detalles" (tejido de punto)
  const Fb = F.slice(0, 2 * (NA - 1)), Ft = F.slice(2 * (NA - 1));
  cascara(m, V, Fb, 0.007, 'Chaqueta_Detalle', 'Chaqueta_Forro', 'Chaqueta_Detalle');
  cascara(m, V, Ft, 0.006, 'Chaqueta_Tela', 'Chaqueta_Forro', 'Chaqueta_Detalle');
  // cuello: tres anillos que suben y se abren un poco, con el mismo frente abierto
  const top = filas[filas.length - 1], eje = v3(0, Y_NECK, centroZ(C, 1.10));
  const cuello = [0, 1, 2].map(j => top.map(p => {
    const d = p.clone().sub(eje).setY(0), r = d.length();
    return d.normalize().multiplyScalar(r + 0.006 * j).add(eje).add(v3(0, 0.014 * j, 0));
  }));
  cascara(m, cuello.flat(), orientar(cuello.flat(), grilla(3, NA, false), () => eje), 0.008, 'Chaqueta_Detalle', 'Chaqueta_Detalle', 'Chaqueta_Detalle');
  m.pesos = pesosDelCuerpo(C, m.V, ['Hips', 'Spine', 'Chest', 'Neck', 'UpperArmL', 'UpperArmR'], 8);
  return m;
}

function manga(C, S) {
  const m = new Malla(), NA = 20, side = S === 'L' ? -1 : 1;
  const h = C.huesos, a = h['UpperArm' + S], b = h['Forearm' + S], c = h['Hand' + S];
  const brazo = C.partes(['UpperArm' + S, 'Forearm' + S]);
  // camino del eje: empieza un poco adentro del hombro (se mete en el cuerpo de la chaqueta) y llega a la muñeca
  const ab = b.clone().sub(a), bc = c.clone().sub(b);
  const ini = a.clone().addScaledVector(ab.clone().normalize(), -0.045);
  const puntos = [];
  for (let i = 0; i <= 10; i++) puntos.push(ini.clone().lerp(b, i / 10));
  for (let i = 1; i <= 9; i++) puntos.push(b.clone().addScaledVector(bc, i / 9 * 0.93));
  const V = [];
  puntos.forEach((p, i) => {
    const tg = (puntos[Math.min(i + 1, puntos.length - 1)].clone().sub(puntos[Math.max(i - 1, 0)])).normalize();
    const u = new THREE.Vector3().crossVectors(tg, v3(0, 0, 1)).normalize(), w = new THREE.Vector3().crossVectors(u, tg);
    const dirs = Array.from({ length: NA }, (_, k) => { const t = 2 * Math.PI * k / NA; return u.clone().multiplyScalar(Math.cos(t)).addScaledVector(w, Math.sin(t)); });
    const r = radios(brazo, p, dirs, true, 0.035);
    const fin = i >= puntos.length - 2;                                        // puño
    const hol = (fin ? 0.012 : 0.018) + 0.008 * Math.exp(-(((i - 11) / 4) ** 2)); // un poco más amplia en el codo
    dirs.forEach((d, k) => V.push(d.clone().multiplyScalar(r[k] + hol).add(p)));
  });
  const F = orientar(V, grilla(puntos.length, NA, true), i => puntos[Math.floor(i / NA)]), nPuño = 2 * NA;
  cascara(m, V, F.slice(0, F.length - nPuño), 0.006, 'Chaqueta_Tela', 'Chaqueta_Forro', 'Chaqueta_Detalle');
  cascara(m, V, F.slice(F.length - nPuño), 0.007, 'Chaqueta_Detalle', 'Chaqueta_Forro', 'Chaqueta_Detalle');
  m.pesos = pesosDelCuerpo(C, m.V, ['Chest', 'UpperArm' + S, 'Forearm' + S, 'Hand' + S], 6, side);
  return m;
}

export function construir(C) {
  // todo en una malla (menos objetos): cuerpo + las dos mangas
  const m = new Malla();
  for (const parte of [cuerpoChaqueta(C), manga(C, 'L'), manga(C, 'R')]) {
    const o = m.V.length;
    m.V.push(...parte.V); m.UV.push(...parte.UV); m.pesos.push(...parte.pesos);
    parte.F.forEach((f, k) => { m.F.push(f.map(i => i + o)); m.M.push(parte.M[k]); });
  }
  return {
    mallas: [{ nombre: 'Ropa_Chaqueta', malla: m }],
    materiales: {
      Chaqueta_Tela: { color: '#FFB8D6', rugosidad: 0.75 },
      Chaqueta_Detalle: { color: '#FFFFFF', rugosidad: 0.85 },
      Chaqueta_Forro: { color: '#E79BBE', rugosidad: 0.9 },
    },
  };
}
