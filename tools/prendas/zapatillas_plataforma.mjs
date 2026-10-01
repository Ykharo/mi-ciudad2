// Zapatillas de plataforma de la amiga (referencias/ropa/hoja_personaje_nuevo.png): blancas y gruesas, con una suela
// alta de dos capas (la de abajo lila), el borde del tobillo acolchado y el talón en lila, y cordones.
// Cada zapatilla se arma como una sucesión de cortes del talón a la punta (medidos del pie del modelo) y va rígida
// con el hueso del pie. La suela no baja del suelo: el pie queda dentro de la plataforma.
import { Malla, caja, lerp, orientarCaras, tubo, v3 } from './cuerpo.mjs';
import { juntar } from './chaqueta.mjs';

export const ID = 'zapatillas_plataforma';
// del pie derecho del modelo (x > 0): z → [x mínimo, x máximo, alto]
const PIE = [[-0.094, 0.09, 0.155, 0.15], [-0.08, 0.086, 0.158, 0.163], [-0.04, 0.06, 0.185, 0.183], [0, 0.052, 0.192, 0.183],
  [0.04, 0.05, 0.195, 0.183], [0.08, 0.052, 0.192, 0.132], [0.12, 0.071, 0.173, 0.103], [0.15, 0.086, 0.158, 0.103], [0.169, 0.1, 0.145, 0.09]];
const medida = z => {
  let i = 0; while (i < PIE.length - 2 && PIE[i + 1][0] < z) i++;
  const [z0, ...a] = PIE[i], [z1, ...b] = PIE[i + 1], t = Math.min(1, Math.max(0, (z - z0) / (z1 - z0)));
  return a.map((v, k) => lerp(v, b[k], t));
};
const PISO = 0.05, BORDE = 0.016;   // alto de la plataforma; cuánto sobresale la zapatilla del pie

// sólido que une cortes (superelipses en x-y) a lo largo de z, con tapas en los extremos
function cortes(m, zs, corte, mat, lados = 18, exp = 2.6) {
  const V = [], centros = [];
  const se = (a, e) => Math.sign(a) * Math.abs(a) ** e;
  for (const z of zs) {
    const { cx, cy, a, b } = corte(z);
    centros.push(v3(cx, cy, z));
    for (let k = 0; k < lados; k++) {
      const t = 2 * Math.PI * k / lados;
      V.push(v3(cx + a * se(Math.cos(t), 2 / exp), cy + b * se(Math.sin(t), 2 / exp), z));
    }
  }
  const F = [], ejes = [];
  for (let i = 0; i < zs.length - 1; i++) for (let k = 0; k < lados; k++) {
    F.push([i * lados + k, (i + 1) * lados + k, (i + 1) * lados + (k + 1) % lados, i * lados + (k + 1) % lados]);
    ejes.push(centros[i].clone().lerp(centros[i + 1], 0.5));
  }
  for (const [i, dz] of [[0, 1], [zs.length - 1, -1]]) {
    const c = V.length; V.push(centros[i].clone());
    for (let k = 0; k < lados; k++) { F.push([c, i * lados + k, i * lados + (k + 1) % lados]); ejes.push(centros[i].clone().add(v3(0, 0, dz * 0.02))); }
  }
  m.add(V, orientarCaras(V, F, (f, j) => ejes[j]), mat);
}

function zapatilla(s) {
  const m = new Malla(), z0 = -0.094 - BORDE, z1 = 0.169 + BORDE * 1.3;
  const zs = Array.from({ length: 16 }, (_, i) => lerp(z0, z1, (1 - Math.cos(Math.PI * i / 15)) / 2));   // más cortes en las puntas
  const ancho = z => { const [x0, x1] = medida(Math.min(0.169, Math.max(-0.094, z))); return { cx: s * (x0 + x1) / 2, a: (x1 - x0) / 2 + BORDE }; };
  const redondeo = z => Math.sqrt(Math.max(0.05, 1 - (Math.max(0, Math.max(z0 + 0.02 - z, z - (z1 - 0.03))) / 0.03) ** 2));
  // capellada: del piso al alto del pie (con el tobillo abierto: arriba no pasa de 0,165)
  const alto = z => Math.min(0.165, medida(Math.min(0.169, Math.max(-0.094, z)))[2] + 0.012);
  const corteCapellada = z => {
    const { cx, a } = ancho(z), k = redondeo(z);
    return { cx, cy: (PISO - 0.004 + alto(z)) / 2, a: a * k, b: (alto(z) - PISO + 0.004) / 2 * lerp(0.6, 1, k) };
  };
  cortes(m, zs, corteCapellada, 'ZapP_Cuero');
  // plataforma: arriba blanca, abajo lila, un poco más ancha que la capellada
  const plataforma = (y0, y1, mat, extra) => cortes(m, zs, z => {
    const { cx, a } = ancho(z), k = redondeo(z);
    return { cx, cy: (y0 + y1) / 2, a: (a + extra) * lerp(0.75, 1, k), b: (y1 - y0) / 2 };
  }, mat, 22, 4);
  plataforma(0.02, PISO, 'ZapP_Suela', 0.009);
  plataforma(0, 0.023, 'ZapP_Detalle', 0.014);
  // borde acolchado del tobillo y talón lila
  const cx = s * 0.1225;
  tubo(m, Array.from({ length: 16 }, (_, k) => { const t = 2 * Math.PI * k / 16; return v3(cx + 0.058 * Math.cos(t), 0.168, -0.012 + 0.062 * Math.sin(t)); }), 0.011, 'ZapP_Detalle', { cerrado: true, lados: 7 });
  caja(m, v3(cx, 0.105, z0 + 0.004), v3(0.04, 0.05, 0.012), 'ZapP_Detalle', 0.35);
  // cordones: cuatro tiras sobre el empeine, apoyadas en la capellada
  for (const z of [0.04, 0.065, 0.09, 0.115]) {
    const c = corteCapellada(z), y = c.cy + c.b + 0.003;
    tubo(m, [v3(c.cx - 0.03, y - 0.008, z), v3(c.cx, y + 0.002, z + 0.004), v3(c.cx + 0.03, y - 0.008, z)], 0.0045, 'ZapP_Cordon', { lados: 6 });
  }
  m.pesos = m.V.map(() => [['Foot' + (s > 0 ? 'R' : 'L'), 1]]);
  return m;
}

export function construir() {
  return {
    mallas: [{ nombre: 'Ropa_ZapatillasPlataforma', malla: juntar([zapatilla(-1), zapatilla(1)]) }],
    materiales: {
      ZapP_Cuero: { color: '#FBFAFD', rugosidad: 0.6 },
      ZapP_Suela: { color: '#F2EFF6', rugosidad: 0.7 },
      ZapP_Detalle: { color: '#CDB6EC', rugosidad: 0.6 },
      ZapP_Cordon: { color: '#FFFFFF', rugosidad: 0.8 },
    },
  };
}
