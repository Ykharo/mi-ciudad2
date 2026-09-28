// Pelo largo ondulado (referencia: referencias/ropa/hoja_de_referencia_nina.png, peinado "Largo").
// Casquete sobre la cabeza (la misma línea de nacimiento que el moño, con raya al medio), una cortina que cae por
// la espalda y dos mechones que enmarcan la cara y caen por delante de los hombros. Ondas y puntas en mechones.
import * as THREE from 'three';
import { Malla, cascara, grilla, lerp, normalizar, orientar, rayo, rayoDesdeAfuera, smooth, v3 } from './cuerpo.mjs';

export const ID = 'pelo_largo';
const rad = g => g * Math.PI / 180;
// elevación de la línea donde nace el pelo según el ángulo (0 = frente), como hairline() en vestir_avatar.py
const HL_A = [0, 15, 35, 50, 65, 82, 100, 120, 145, 180], HL_E = [41, 38, 30, 20, 8, -3, -9, -16, -28, -36];
function hairline(phi) {
  const a = Math.abs((((phi + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * 180 / Math.PI;
  let k = 0; while (k < HL_A.length - 2 && a > HL_A[k + 1]) k++;
  return rad(lerp(HL_E[k], HL_E[k + 1], (a - HL_A[k]) / (HL_A[k + 1] - HL_A[k])));
}
const sph = (phi, el) => v3(Math.cos(el) * Math.sin(phi), Math.sin(el), Math.cos(el) * Math.cos(phi));
const LOCK = 4;   // columnas por mechón

function centroZ(C, y) {
  let s = 0, n = 0; const P = C.body.P;
  for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 1] - y) < 0.025 && Math.abs(P[i]) < 0.12) { s += P[i + 2]; n++; }
  return n ? s / n : 0;
}
// envolvente cóncava de R(y): el pelo cuelga como una tela, sin meterse en el cuello ni bajo el mentón
function envolvente(ys, R) {
  const P = ys.map((y, i) => [-y, R[i]]), H = [];   // -y: creciente hacia abajo
  for (const p of P) {
    while (H.length >= 2) {
      const [a, b] = [H[H.length - 2], H[H.length - 1]];
      if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0) H.pop(); else break;
    }
    H.push(p);
  }
  return P.map(([x]) => {
    let k = 0; while (k < H.length - 2 && x > H[k + 1][0]) k++;
    const [a, b] = [H[k], H[k + 1] || H[k]];
    return b[0] === a[0] ? a[1] : lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
  });
}

// casquete: como el del moño (grosor mayor arriba y atrás, rayita al medio); devuelve la malla para chocar con él
function casquete(C, m, headR) {
  const NP = 48, NR = 12, V = [], HC = C.HC;
  for (let r = 0; r < NR; r++) {
    const t = r / (NR - 1);
    for (let k = 0; k < NP; k++) {
      const phi = 2 * Math.PI * k / NP, hl = hairline(phi), el = hl + (rad(89) - hl) * t ** 0.9, d = sph(phi, el);
      const pa = Math.atan2(Math.sin(phi), Math.cos(phi));
      const raya = 0.007 * Math.exp(-((pa / 0.07) ** 2)) * (1 - smooth((t - 0.35) / 0.3));
      const grosor = 0.011 + 0.016 * smooth(t / 0.5) + 0.004 * Math.abs(Math.sin(phi * 12)) * smooth(t / 0.25)
        + 0.010 * smooth((-Math.cos(phi) - 0.2) / 0.6) * (1 - t) - raya;
      V.push(d.multiplyScalar(headR(d) + grosor).add(HC));
    }
  }
  const top = V.length; V.push(v3(0, 1, 0).multiplyScalar(headR(v3(0, 1, 0)) + 0.03).add(HC));
  const G = grilla(NR, NP, true);
  for (let k = 0; k < NP; k++) G.push([(NR - 1) * NP + (k + 1) % NP, (NR - 1) * NP + k, top]);
  const F = orientar(V, G, () => HC);
  const f0 = m.F.length;
  cascara(m, V, F, 0.008, 'PeloLargo_Base', 'PeloLargo_Oscuro', 'PeloLargo_Oscuro');
  // franjas de brillo y sombra (como el moño): las caras de afuera van primero, 2 triángulos por cuadrilátero
  for (let q = 0; q < (NR - 1) * NP; q++) {
    const c = q % NP, mt = c % 7 === 3 ? 'PeloLargo_Claro' : c % 9 === 6 ? 'PeloLargo_Oscuro' : null;
    if (mt) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = mt;
  }
  const g = new THREE.BufferGeometry().setFromPoints(V);
  g.setIndex(F.flatMap(f => (f.length === 4 ? [f[0], f[1], f[2], f[0], f[2], f[3]] : f)));
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
}

export function construir(C) {
  const m = new Malla(), HC = C.HC;
  const headR = d => rayo(C.mallaCabeza, HC, d) ?? 0.16;
  const cap = casquete(C, m, headR);
  const hombros = C.partes(['Spine', 'Chest', 'Neck', 'UpperArmL', 'UpperArmR']);
  const torso = C.partes(['Hips', 'Spine', 'Chest', 'Neck']);

  // Una cortina: columnas que nacen sobre el casquete (en `phi`) y bajan; `psi(u, t)` es hacia dónde queda cada
  // punto (ángulo alrededor del eje vertical). El radio sale de chocar con el casquete, la cabeza y el cuerpo.
  function cortina({ phi0, phi1, psi, yPunta, cols, filas, grosor, fase }) {
    const V = [], ejesV = [], hueco = 0.006, sobreCuerpo = 0.03;
    for (let k = 0; k < cols; k++) {
      const u = k / (cols - 1), phi = lerp(phi0, phi1, u);
      const el0 = hairline(phi) + 0.45, y0 = HC.y + Math.sin(el0) * 0.16;
      const lock = (k + fase) % LOCK, pico = 1 - Math.abs(lock - (LOCK - 1) / 2) / ((LOCK - 1) / 2);   // 1 al centro del mechón
      const yP = yPunta(u) - 0.045 * pico + 0.015 * Math.sin(k * 2.3);
      const ys = Array.from({ length: filas }, (_, i) => lerp(y0, yP, (i / (filas - 1)) ** 1.1));
      const dirs = [], ejes = [];
      const R = ys.map((y, i) => {
        const t = i / (filas - 1), a = psi(u, t, phi), d = v3(Math.sin(a), 0, Math.cos(a));
        const eje = v3(0, y, lerp(HC.z, centroZ(C, Math.min(y, 1.12)), smooth((1.26 - y) / 0.14)));
        dirs.push(d); ejes.push(eje);
        const enCap = rayoDesdeAfuera(cap, eje, d), enCab = y > 1.17 ? rayo(C.mallaCabeza, eje, d) : null;
        const enCuerpo = y > 1.06 ? rayoDesdeAfuera(hombros, eje, d) : rayo(torso, eje, d);
        const enOreja = rayoDesdeAfuera(C.mallaOrejas, eje, d);
        return Math.max((enCap ?? 0) + hueco, (enCab ?? 0) + 0.02, (enOreja ?? 0) + 0.012, (enCuerpo ?? 0) + sobreCuerpo, 0.05);
      });
      envolvente(ys, R).forEach((r, i) => {
        const t = i / (filas - 1);
        r -= 0.014 * (1 - smooth(i / 4));   // arriba nace desde dentro del casquete: sin escalón en el borde
        const onda = 0.011 * Math.sin((HC.y - ys[i]) / 0.11 * 2 * Math.PI + k * 0.35) * smooth((t - 0.1) / 0.3);
        const bulto = 0.006 * pico * smooth(t / 0.2);                                   // cada mechón un poco abombado
        const cierra = i === filas - 1 ? -0.006 : 0;                                    // las puntas se juntan
        V.push(dirs[i].clone().multiplyScalar(r + onda + bulto + cierra).add(ejes[i])); ejesV.push(ejes[i]);
      });
    }
    // grilla con filas = columnas del pelo (cada columna es una tira de arriba abajo)
    const F = orientar(V, grilla(cols, filas, false), i => ejesV[i]), f0 = m.F.length;
    cascara(m, V, F, grosor, 'PeloLargo_Base', 'PeloLargo_Oscuro', 'PeloLargo_Oscuro');
    for (let q = 0; q < F.length; q++) {
      const k = Math.floor(q / (filas - 1)), lock = (k + fase) % LOCK, n = Math.floor((k + fase) / LOCK);
      const mt = lock === 1 && n % 2 === 0 ? 'PeloLargo_Claro' : lock === LOCK - 1 ? 'PeloLargo_Oscuro' : null;
      if (mt) m.M[f0 + 2 * q] = m.M[f0 + 2 * q + 1] = mt;
    }
  }
  // espalda: de oreja a oreja por detrás; abajo se junta un poco hacia el centro de la espalda
  cortina({ phi0: rad(98), phi1: rad(262), cols: 37, filas: 24, grosor: 0.012, fase: 0,
    psi: (u, t, phi) => lerp(phi, lerp(rad(128), rad(232), u), smooth((t - 0.2) / 0.5)),
    yPunta: u => 0.93 + 0.03 * Math.abs(u - 0.5) });
  // adelante: de la raya, por el costado de la cara (sin taparla) y sobre el pecho, delante del hombro
  for (const s of [1, -1]) {
    cortina({ phi0: s * rad(26), phi1: s * rad(104), cols: 13, filas: 22, grosor: 0.011, fase: 1,
      psi: (u, t, phi) => {
        const cara = s * lerp(rad(74), rad(112), u), pecho = s * lerp(rad(34), rad(70), u);
        return t < 0.35 ? lerp(phi, cara, smooth(t / 0.3)) : lerp(cara, pecho, smooth((t - 0.35) / 0.35));
      },
      yPunta: u => 0.99 + 0.03 * u });
  }

  // pesos: a la altura de la cabeza sigue a la cabeza; hacia las puntas, al pecho (un poco al cuello entremedio)
  m.pesos = m.V.map(p => {
    const w = smooth((1.24 - p.y) / 0.16);
    return normalizar([['HeadBone', 1 - w], ['Neck', 0.7 * w * (1 - w)], ['Chest', w]]);
  });
  return {
    mallas: [{ nombre: 'Pelo_Largo', malla: m }],
    materiales: {   // mismos tonos que el moño
      PeloLargo_Base: { color: '#4D2C1F', rugosidad: 0.66 },
      PeloLargo_Claro: { color: '#5B3525', rugosidad: 0.7 },
      PeloLargo_Oscuro: { color: '#40231C', rugosidad: 0.72 },
    },
  };
}
