// Falda tableada corta (referencia: referencias/ropa/hoja_de_referencia_nina.png, "Falda").
// Anillos de la cintura a la mitad del muslo alrededor de la silueta del cuerpo, que se abren hacia abajo y
// forman 24 tablas en zigzag. Tela a cuadros (textura gris que tiñe el color elegido) + pretina.
import { Malla, cascara, grilla, normalizar, orientar, rayoDesdeAfuera, smooth, v3 } from './cuerpo.mjs';
import { png } from './escribir.mjs';

export const ID = 'falda_tableada';
const Y_TOP = 0.862, Y_PRETINA = 0.838, HEM = 0.575;
const NA = 96, TABLAS = 24;   // 4 vértices por tabla: picos y valles caen justo en vértices

// cuadrillé en grises: se multiplica por el color del material, así se puede recolorear
function cuadros() {
  const banda = u => (u >= 8 && u < 24 ? 1 : 0), linea = (u, a) => (u === a || u === a + 1 ? 1 : 0);
  return png(64, 64, (x, y) => {
    const b = banda(x) + banda(y);
    let v = [238, 196, 158][b];
    if (linea(x, 44) || linea(y, 44)) v = 255;
    if (x === 54 || y === 54) v = Math.min(v, 150);
    return v;
  });
}

function centroZ(C, y) {
  let s = 0, n = 0; const P = C.body.P;
  for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - y) < 0.03) { s += P[i + 2]; n++; }
  return n ? s / n : 0;
}

export function construir(C) {
  const m = new Malla();
  const ys = [Y_TOP, Y_PRETINA, ...Array.from({ length: 11 }, (_, i) => Y_PRETINA - (Y_PRETINA - HEM) * (i + 1) / 11)];
  const zc = centroZ(C, 0.80);
  // silueta del cuerpo a cada altura: función de soporte del contorno (redondea y cubre las dos piernas).
  // Sólo torso y piernas: los brazos cuelgan a la altura de la cadera y no deben ensanchar la falda.
  const tronco = C.partes(['Hips', 'Spine', 'ThighL', 'ThighR']);
  const dir = k => { const a = 2 * Math.PI * k / NA; return v3(Math.sin(a), 0, Math.cos(a)); };
  const soporte = y => {
    const eje = v3(0, y, zc), pts = [];
    for (let k = 0; k < 48; k++) { const d = dir(k * 2), r = rayoDesdeAfuera(tronco, eje, d); if (r != null) pts.push(d.clone().multiplyScalar(r)); }
    return Array.from({ length: NA }, (_, k) => { const d = dir(k); return Math.max(...pts.map(p => p.dot(d))); });
  };
  let prev = null;
  const R = ys.map((y, i) => {
    const t = (Y_TOP - y) / (Y_TOP - HEM);
    const holgura = 0.007 + 0.04 * smooth(t) ** 1.3;
    let r = soporte(y).map(h => h + holgura);
    if (prev) r = r.map((x, k) => Math.max(x, prev[k] + 0.004 * (i > 1 ? 1 : 0)));   // nunca se cierra hacia abajo
    prev = r;
    return r;
  });
  // tablas: zigzag que crece hacia el borde
  const zig = k => Math.abs(2 * ((k * TABLAS / NA) % 1) - 1);   // 1 en los pliegues de afuera, 0 en los de adentro
  const V = [], UV = [];
  let largo = 0;
  ys.forEach((y, i) => {
    if (i) largo += Math.hypot(ys[i - 1] - y, (R[i][0] - R[i - 1][0]));
    const t = (Y_TOP - y) / (Y_TOP - HEM), amp = i < 2 ? 0 : 0.075 * smooth((t - 0.05) / 0.6);
    for (let k = 0; k < NA; k++) {
      const r = R[i][k] * (1 + amp * (zig(k) - 0.5));
      V.push(dir(k).multiplyScalar(r).add(v3(0, y, zc)));
      UV.push([k / NA * 8, largo * 6.5]);
    }
  });
  // la pretina (2 primeros anillos) va aparte, con su material
  const Vp = V.slice(0, NA * 2), Vt = V.slice(NA);
  cascara(m, Vp, orientar(Vp, grilla(2, NA, true), i => v3(0, Vp[i].y, zc)), 0.006, 'Falda_Pretina', 'Falda_Pretina', 'Falda_Pretina', UV.slice(0, NA * 2));
  cascara(m, Vt, orientar(Vt, grilla(ys.length - 1, NA, true), i => v3(0, Vt[i].y, zc)), 0.004, 'Falda_Tela', 'Falda_Tela', 'Falda_Tela', UV.slice(NA));
  // pesos: arriba sólo la cadera; hacia el borde sigue en parte al muslo de su lado (así camina sin estirarse).
  // Adelante y atrás sigue más al muslo (al sentarse, la falda se apoya sobre las piernas); a los costados, menos.
  m.pesos = m.V.map(p => {
    const frente = Math.abs(p.z - zc) / (Math.hypot(p.x, p.z - zc) || 1);   // 1 adelante/atrás, 0 al costado
    const t = smooth((Y_TOP - p.y) / (Y_TOP - HEM)), w = (0.55 + 0.3 * frente) * smooth((t - 0.1) / 0.9);
    const fL = smooth((0.06 - p.x) / 0.12);   // ThighL está en -x
    return normalizar([['Hips', 1 - w], ['ThighL', w * fL], ['ThighR', w * (1 - fL)]]);
  });
  return {
    mallas: [{ nombre: 'Ropa_Falda', malla: m }],
    materiales: {
      Falda_Tela: { color: '#F7A8C8', textura: cuadros(), rugosidad: 0.85 },
      Falda_Pretina: { color: '#E48DB2', rugosidad: 0.8 },
    },
  };
}
