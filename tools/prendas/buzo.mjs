// Pantalones holgados de dos piezas: la cadera (anillos alrededor del tronco, hasta la entrepierna) y un tubo por
// pierna que parte dentro de ella (las uniones quedan escondidas por dentro).
//   buzo            pantalón de buzo (referencias/ropa/hoja_personaje_nino.png, "Pantalón"): hasta sobre la
//                   zapatilla, pretina elástica, dos franjas por el costado y una mariposa en el muslo.
//   pantalon_ancho  (pantalon_ancho.mjs) cargo ancho con bolsillos y cadena, de la amiga.
import { FIGURAS, Malla, calcomania, cascara, clamp, grilla, lerp, mallaRayos, orientar, pesosDelCuerpo, rayo, rayoDesdeAfuera, v3 } from './cuerpo.mjs';
import { centroZ, juntar } from './chaqueta.mjs';

export const ID = 'buzo';
const Y_TOP = 0.866, Y_PRETINA = 0.838, Y_CADERA = 0.72, Y_BAJO = 0.1;
export const NA = 48;

function suavizar(r, veces = 2) {
  for (let v = 0; v < veces; v++) r = r.map((_, k) => (r[(k - 1 + r.length) % r.length] + 2 * r[k] + r[(k + 1) % r.length]) / 4);
  return r;
}
export const dir = k => { const a = 2 * Math.PI * k / NA; return v3(Math.sin(a), 0, Math.cos(a)); };

// M: { tela, pretina, forro }; holgura: la de la cadera (se suma a lo que va desde la pretina hacia abajo)
export function cadera(C, M, { holgura = 0 } = {}) {
  const m = new Malla(), tronco = C.partes(['Hips', 'Spine', 'ThighL', 'ThighR']);
  const zc = centroZ(C, 0.8);
  const ys = [Y_TOP, Y_PRETINA, ...Array.from({ length: 6 }, (_, i) => lerp(Y_PRETINA - 0.012, Y_CADERA, (i + 1) / 6))];
  const V = [];
  ys.forEach((y, i) => {
    const eje = v3(0, y, zc);
    let r = Array.from({ length: NA }, (_, k) => rayoDesdeAfuera(tronco, eje, dir(k), 0.5) ?? 0.1);
    r = suavizar(r).map(x => x + (i < 2 ? 0.01 : 0.016 + (0.012 + holgura) * (i - 2) / 5));
    r.forEach((x, k) => V.push(dir(k).multiplyScalar(x).add(eje)));
  });
  const Vp = V.slice(0, NA * 2), Vt = V.slice(NA);
  cascara(m, Vp, orientar(Vp, grilla(2, NA, true), i => v3(0, Vp[i].y, zc)), 0.007, M.pretina, M.forro, M.pretina);
  cascara(m, Vt, orientar(Vt, grilla(ys.length - 1, NA, true), i => v3(0, Vt[i].y, zc)), 0.006, M.tela, M.forro, M.tela);
  m.pesos = pesosDelCuerpo(C, m.V, ['Hips', 'ThighL', 'ThighR'], 8);
  m.sup = mallaRayos(V.flatMap(p => [p.x, p.y, p.z]), grilla(ys.length, NA, true).flatMap(f => [f[0], f[1], f[2], f[0], f[2], f[3]]));
  return m;
}

// M: { tela, pretina (el borde de abajo), forro, franja? }; minimo: [arriba, abajo] del radio mínimo; pegado: cuánto
// se acerca cada anillo a un tubo parejo (0 = sigue la pierna, 1 = tubo); recoge: el borde de abajo se cierra
export function pierna(C, S, M, { minimo = [0.075, 0.085], pegado = 0.6, recoge = 0.93, yBajo = Y_BAJO } = {}) {
  const m = new Malla(), side = S === 'L' ? -1 : 1, h = C.huesos;
  const muslo = h['Thigh' + S], rodilla = h['Shin' + S], tobillo = h['Foot' + S];
  const partes = C.partes(['Thigh' + S, 'Shin' + S, 'Foot' + S]);
  // el eje pasa por el muslo, la rodilla y el tobillo; los anillos son horizontales
  const ejeEn = y => (y > rodilla.y ? rodilla.clone().lerp(muslo, (y - rodilla.y) / (muslo.y - rodilla.y)) : tobillo.clone().lerp(rodilla, clamp((y - tobillo.y) / (rodilla.y - tobillo.y), 0, 1))).setY(y);
  const ys = Array.from({ length: 16 }, (_, i) => lerp(0.8, yBajo, i / 15));
  const V = [], ejes = [];
  let ancho = 0;
  ys.forEach((y, i) => {
    const eje = ejeEn(y), t = i / (ys.length - 1);
    let r = Array.from({ length: NA }, (_, k) => rayoDesdeAfuera(partes, eje, dir(k), 0.4) ?? 0);
    // holgado: al menos un tubo parejo, más ancho hacia abajo; nunca se angosta bajando (cae como tela)
    const min = lerp(minimo[0], minimo[1], t);
    r = suavizar(r.map(x => Math.max(x + 0.02, min)), 3);
    const base = Math.max(...r);
    ancho = Math.max(ancho * 0.97, base);
    r = r.map(x => lerp(x, ancho, pegado));
    if (i >= ys.length - 2) r = r.map(x => x * recoge);   // el borde de abajo se recoge un poco
    ejes.push(eje);
    r.forEach((x, k) => V.push(dir(k).multiplyScalar(x).add(eje)));
  });
  const F = orientar(V, grilla(ys.length, NA, true), i => ejes[Math.floor(i / NA)]);
  const nBajo = 2 * NA, f0 = m.F.length;
  cascara(m, V, F.slice(0, F.length - nBajo), 0.006, M.tela, M.forro, M.tela);
  cascara(m, V, F.slice(F.length - nBajo), 0.007, M.pretina, M.forro, M.pretina);
  if (M.franja) {
    // dos franjas por el costado de afuera (dir(k).x = side en k = NA/4 o 3NA/4)
    const k0 = side > 0 ? NA / 4 : 3 * NA / 4;
    for (let q = 0; q < F.length - nBajo; q++) {
      const col = q % NA;
      if (col === k0 - 2 || col === k0 + 1) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = M.franja;
    }
  }
  m.pesos = pesosDelCuerpo(C, m.V, ['Hips', 'Thigh' + S, 'Shin' + S, 'Foot' + S], 6, side);
  m.sup = mallaRayos(V.flatMap(p => [p.x, p.y, p.z]), F.flatMap(f => [f[0], f[1], f[2], f[0], f[2], f[3]]));
  m.ejeEn = ejeEn;
  return m;
}

export function construir(C) {
  const M = { tela: 'Buzo_Tela', pretina: 'Buzo_Pretina', forro: 'Buzo_Forro', franja: 'Buzo_Franja' };
  const L = pierna(C, 'L', M), R = pierna(C, 'R', M);
  // mariposa en el muslo (el de la derecha de quien mira de frente)
  const X = C.huesos.ThighR.x + 0.02, Y = 0.6;
  const zF = (x, y) => 0.5 - (rayo(R.sup, v3(x, y, 0.5), v3(0, 0, -1)) ?? 0.4);
  const e = new Malla();
  calcomania(e, FIGURAS.mariposa(0.8), (x, y) => v3(X + x, Y + y, zF(X + x, Y + y) + 0.003), v3(X, Y, 0), 0.003, 'Buzo_Mariposa');
  e.pesos = pesosDelCuerpo(C, e.V, ['ThighR'], 4, 1);
  return {
    mallas: [{ nombre: 'Ropa_Buzo', malla: juntar([cadera(C, M), L, juntar([R, e])]) }],
    materiales: {
      Buzo_Tela: { color: '#26262E', rugosidad: 0.85 },
      Buzo_Pretina: { color: '#1E1E25', rugosidad: 0.9 },
      Buzo_Forro: { color: '#3A3A45', rugosidad: 0.9 },
      Buzo_Franja: { color: '#FFFFFF', rugosidad: 0.8 },
      Buzo_Mariposa: { color: '#FFFFFF', rugosidad: 0.7 },
    },
  };
}
