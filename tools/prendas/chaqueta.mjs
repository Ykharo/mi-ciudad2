// Abrigos: cuerpo de anillos alrededor del torso y mangas que siguen el brazo (hombro → codo → muñeca), con borde,
// puños y cuello en otro material, y forro por dentro.
//   chaqueta  abierta tipo "varsity" (referencias/ropa/hoja_de_referencia_nina.png, "Chaqueta")
//   poleron   (poleron.mjs) cerrado, más holgado y largo, con franjas en las mangas y capucha
import * as THREE from 'three';
import { Malla, cascara, clamp, grilla, lerp, mallaRayos, orientar, pesosDelCuerpo, rayo, smooth, v3 } from './cuerpo.mjs';

export const ID = 'chaqueta';
const Y_NECK = 1.135;

export function centroZ(C, y) {
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

// op: { abierto, holgura, hem (altura del borde de abajo), M: { tela, detalle, forro }, hombroCaido }
// hombroCaido: arriba del hombro los anillos se achican de a poco hacia el del cuello (sin la "repisa" con puntas que
// queda cuando la holgura es grande; las mangas tapan el brazo).
// Devuelve la malla y, para pegar cosas encima, sus anillos (filas de puntos) y ejes.
export function cuerpoAbrigo(C, { abierto, holgura, hem, M, hombroCaido = false }) {
  const m = new Malla(), NA = 44;
  const torso = C.partes(['Hips', 'Spine', 'Chest', 'Neck']);
  const hombros = C.partes(['Spine', 'Chest', 'Neck', 'UpperArmL', 'UpperArmR']);
  const ys = [hem, hem + 0.018, hem + 0.036, ...Array.from({ length: 11 }, (_, i) => lerp(hem + 0.05, Y_NECK, (i + 1) / 11))];
  const V = [], filas = [], ejes = [], radiosFila = [], crudos = [];
  ys.forEach((y, i) => {
    const t = (y - hem) / (Y_NECK - hem);
    const abre = abierto ? lerp(0.30, 0.50, smooth((t - 0.4) / 0.6)) : 0;   // abertura del frente (radianes, a cada lado)
    const angs = Array.from({ length: NA }, (_, k) => (abierto ? lerp(abre, 2 * Math.PI - abre, k / (NA - 1)) : 2 * Math.PI * k / NA));
    const dirs = angs.map(a => v3(Math.sin(a), 0, Math.cos(a)));
    const eje = v3(0, y, centroZ(C, Math.min(y, 1.10)));
    ejes.push(eje);
    const mesh = y > 1.02 ? hombros : torso;                        // sobre la axila, el hombro entra en el abrigo
    let r = radios(mesh, eje, dirs, !abierto);
    // en los hombros, otra pasada de suavizado: sin puntas donde el cuerpo se junta con el brazo
    if (y > 1.02) r = r.map((x, k) => {
      const j = d => (abierto ? r[clamp(k + d, 0, NA - 1)] : r[(k + d + NA) % NA]);
      return (j(-2) + j(-1) + x + j(1) + j(2)) / 5;
    });
    const cierre = smooth((y - (Y_NECK - 0.05)) / 0.05);            // arriba se ciñe al cuello
    const hol = holgura * (1 - 0.15 * cierre) + (i < 3 ? 0.004 : 0); // el borde de abajo, un poco más grueso
    radiosFila.push(r.map(x => x + hol)); crudos.push(r);
    filas.push(dirs.map((d, k) => d.clone().multiplyScalar(r[k] + hol).add(eje)));
  });
  if (hombroCaido) {
    const cuelloR = radiosFila[radiosFila.length - 1];
    ys.forEach((y, i) => {
      const w = smooth((y - 1.04) / (Y_NECK - 1.04)) ** 1.3;
      if (w <= 0) return;
      // (pero nunca más adentro que el cuerpo + 3 cm: si no, la polera o el peto de abajo asoman en el hombro)
      filas[i] = filas[i].map((p, k) => {
        const d = p.clone().sub(ejes[i]), r = d.length();
        return d.multiplyScalar(Math.max(lerp(r, Math.min(r, cuelloR[k] + 0.02), w), Math.min(r, crudos[i][k] + 0.03)) / r).add(ejes[i]);
      });
    });
  }
  filas.forEach(f => V.push(...f));
  const F = orientar(V, grilla(ys.length, NA, !abierto), i => ejes[Math.floor(i / NA)]);
  // el borde de abajo (3 primeros anillos) es de "detalles" (tejido de punto)
  const nb = 2 * (abierto ? NA - 1 : NA), Fb = F.slice(0, nb), Ft = F.slice(nb);
  cascara(m, V, Fb, 0.007, M.detalle, M.forro, M.detalle);
  cascara(m, V, Ft, 0.006, M.tela, M.forro, M.detalle);
  // cuello: tres anillos que suben y se abren un poco
  const top = filas[filas.length - 1], eje = v3(0, Y_NECK, centroZ(C, 1.10));
  const cuello = [0, 1, 2].map(j => top.map(p => {
    const d = p.clone().sub(eje).setY(0), r = d.length();
    return d.normalize().multiplyScalar(r + 0.006 * j).add(eje).add(v3(0, 0.014 * j, 0));
  }));
  cascara(m, cuello.flat(), orientar(cuello.flat(), grilla(3, NA, !abierto), () => eje), 0.008, M.detalle, M.detalle, M.detalle);
  m.pesos = pesosDelCuerpo(C, m.V, ['Hips', 'Spine', 'Chest', 'Neck', 'UpperArmL', 'UpperArmR'], 8);
  return { malla: m, filas, ejes, ys };
}

// op: { holgura, M: { tela, detalle, forro, franja? }, hasta, puño }; con M.franja, dos franjas por el lado de afuera.
// hasta: cuántos puntos del camino (de 20: 11 hasta el codo; 8 = manga corta). puño: holgura del puño.
// Devuelve la malla; en `.camino` quedan los puntos del eje (para pegar dibujos encima).
export function mangaAbrigo(C, S, { holgura, M, hasta = 20, puño = 0.012 }) {
  const m = new Malla(), NA = 20, side = S === 'L' ? -1 : 1;
  const h = C.huesos, a = h['UpperArm' + S], b = h['Forearm' + S], c = h['Hand' + S];
  const brazo = C.partes(['UpperArm' + S, 'Forearm' + S]);
  // camino del eje: empieza un poco adentro del hombro (se mete en el cuerpo del abrigo) y llega a la muñeca
  const ab = b.clone().sub(a), bc = c.clone().sub(b);
  const ini = a.clone().addScaledVector(ab.clone().normalize(), -0.045);
  let puntos = [];
  for (let i = 0; i <= 10; i++) puntos.push(ini.clone().lerp(b, i / 10));
  for (let i = 1; i <= 9; i++) puntos.push(b.clone().addScaledVector(bc, i / 9 * 0.93));
  puntos = puntos.slice(0, hasta);
  const V = [];
  puntos.forEach((p, i) => {
    const tg = (puntos[Math.min(i + 1, puntos.length - 1)].clone().sub(puntos[Math.max(i - 1, 0)])).normalize();
    const u = new THREE.Vector3().crossVectors(tg, v3(0, 0, 1)).normalize(), w = new THREE.Vector3().crossVectors(u, tg);
    const dirs = Array.from({ length: NA }, (_, k) => { const t = 2 * Math.PI * k / NA; return u.clone().multiplyScalar(Math.cos(t)).addScaledVector(w, Math.sin(t)); });
    const r = radios(brazo, p, dirs, true, 0.035);
    const fin = i >= puntos.length - 2;                                           // puño
    const hol = (fin ? puño : holgura) + 0.008 * Math.exp(-(((i - 11) / 4) ** 2)); // un poco más amplia en el codo
    // el comienzo (dentro del hombro) se afina: con mucha holgura asomaba como una punta, y la manga de una polera de
    // abajo asomaba por el hombro del abrigo (la polera larga, casi pegada al brazo, también se afina). Las demás (la
    // chaqueta, la polera de manga corta, que si no deja ver piel en el hombro) se quedan como estaban.
    const afina = holgura > 0.02 || holgura < 0.004 ? lerp(0.72, 1, smooth(i / 4)) : 1;
    dirs.forEach((d, k) => V.push(d.clone().multiplyScalar((r[k] + hol) * afina).add(p)));
  });
  const F = orientar(V, grilla(puntos.length, NA, true), i => puntos[Math.floor(i / NA)]), nPuño = 2 * NA;
  const f0 = m.F.length;
  cascara(m, V, F.slice(0, F.length - nPuño), 0.006, M.tela, M.forro, M.detalle);
  cascara(m, V, F.slice(F.length - nPuño), 0.007, M.detalle, M.forro, M.detalle);
  if (M.franja) {
    // columnas del lado de afuera (u apunta a -x en los dos brazos): dos franjas separadas por una columna
    const k0 = Math.round((side > 0 ? 0.5 : 0) * NA);
    for (let q = 0; q < F.length - nPuño; q++) {   // (F son cuadriláteros; cascara los parte en 2 triángulos)
      const col = q % NA, fila = Math.floor(q / NA);
      if (fila < 2) continue;                                                     // no en el hombro
      if (col === (k0 - 2 + NA) % NA || col === (k0 + 1) % NA) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = M.franja;
    }
  }
  m.pesos = pesosDelCuerpo(C, m.V, ['Chest', 'UpperArm' + S, 'Forearm' + S, 'Hand' + S], 6, side);
  m.camino = puntos;
  return m;
}
// malla para lanzar rayos contra una Malla (para pegar dibujos sobre una prenda)
export const superficieDe = m => mallaRayos(m.V.flatMap(v => [v.x, v.y, v.z]), m.F.flat());

// junta varias mallas en una (menos objetos)
export function juntar(partes) {
  const m = new Malla();
  for (const parte of partes) {
    const o = m.V.length;
    m.V.push(...parte.V); m.UV.push(...parte.UV); m.pesos.push(...parte.pesos);
    parte.F.forEach((f, k) => { m.F.push(f.map(i => i + o)); m.M.push(parte.M[k]); });
  }
  return m;
}

export function construir(C) {
  const M = { tela: 'Chaqueta_Tela', detalle: 'Chaqueta_Detalle', forro: 'Chaqueta_Forro' };
  const cuerpo = cuerpoAbrigo(C, { abierto: true, holgura: 0.022, hem: 0.855, M }).malla;
  return {
    mallas: [{ nombre: 'Ropa_Chaqueta', malla: juntar([cuerpo, mangaAbrigo(C, 'L', { holgura: 0.018, M }), mangaAbrigo(C, 'R', { holgura: 0.018, M })]) }],
    materiales: {
      Chaqueta_Tela: { color: '#FFB8D6', rugosidad: 0.75 },
      Chaqueta_Detalle: { color: '#FFFFFF', rugosidad: 0.85 },
      Chaqueta_Forro: { color: '#E79BBE', rugosidad: 0.9 },
    },
  };
}
