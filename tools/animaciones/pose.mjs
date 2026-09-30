// Poses del esqueleto de Nina para armar animaciones en Node: la versión en JavaScript de las utilidades de
// herramientas_avatar/reanimar_avatar.py (con las mismas convenciones, para que los bailes nuevos se vean como los de
// siempre). Una pose = posición de la cadera + rotación local de cada hueso; los pies se apoyan con IK de dos huesos
// (y los brazos también pueden ir por IK). El esqueleto no tiene rotaciones en reposo: una rotación local es respecto
// de la pose A del modelo.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const EJE = { x: V(1, 0, 0), y: V(0, 1, 0), z: V(0, 0, 1) };
const Q = (eje, grados) => new THREE.Quaternion().setFromAxisAngle(EJE[eje], grados * Math.PI / 180);
// rotación: primero z (abrir/cerrar lateral), luego x (adelante/atrás), luego y (giro)
export const E = ({ x = 0, y = 0, z = 0 } = {}) => Q('y', y).multiply(Q('x', x)).multiply(Q('z', z));
export const TAU = 2 * Math.PI;
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = u => { u = Math.min(Math.max(u, 0), 1); return u * u * (3 - 2 * u); };
// curva de keyframes con interpolación cúbica suave (sin rebotes en picos ni mesetas), como K() en el script de Python
export function K(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
  let i = 0; while (keys[i + 1][0] <= t) i++;
  const [t0, v0] = keys[i], [t1, v1] = keys[i + 1], h = t1 - t0, u = (t - t0) / h;
  const tan = k => {
    if (k <= 0 || k >= keys.length - 1) return 0;
    const [ta, va] = keys[k - 1], [, vk] = keys[k], [tb, vb] = keys[k + 1];
    return (vk - va) * (vb - vk) <= 0 ? 0 : (vb - va) / (tb - ta);
  };
  const m0 = tan(i) * h, m1 = tan(i + 1) * h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1;
}

// El esqueleto de un documento glTF (gltf-transform): nombres, huesos padre, posición de reposo de cada hueso.
export function esqueleto(doc) {
  const joints = doc.getRoot().listSkins()[0].listJoints(), HUESOS = joints.map(j => j.getName());
  const REST = {}, PADRE = {}, NODO = {};
  for (const j of joints) {
    const n = j.getName(), p = j.getParentNode();
    REST[n] = V(...j.getTranslation()); NODO[n] = j; PADRE[n] = p && HUESOS.includes(p.getName()) ? p.getName() : null;
  }
  const SX = { L: REST.UpperArmL.x < 0 ? -1 : 1 }; SX.R = -SX.L;
  const H0 = REST.Hips.y;                                        // altura de la cadera en reposo
  const FOOTX = Math.abs(REST.ThighR.x + REST.ShinR.x + REST.FootR.x);
  const ANK_H = H0 + REST.ShinR.y + REST.FootR.y;                // altura del tobillo sobre el suelo
  return { HUESOS, REST, PADRE, NODO, SX, H0, FOOTX, ANK_H, HEEL: -0.085, BALL: 0.10 };
}

export function crearPoses(S) {
  const { HUESOS, REST, PADRE, SX, H0, FOOTX, ANK_H, HEEL, BALL } = S;
  class Pose {
    constructor() {
      this.hips = V(0, H0, 0);
      this.rot = Object.fromEntries(HUESOS.map(b => [b, new THREE.Quaternion()]));
      this.leg = {}; this.arm = {}; this.legW = {};
    }
  }
  const rotar = (q, v) => v.clone().applyQuaternion(q);
  const entre = (a, b) => new THREE.Quaternion().setFromUnitVectors(a.clone().normalize(), b.clone().normalize());
  // IK de dos huesos analítica: rotaciones locales de los dos huesos y la de mundo del segundo
  function ik2(padreW, raiz, r1, r2, objetivo, polo) {
    const L1 = r1.length(), L2 = r2.length(), dv = objetivo.clone().sub(raiz);
    const d = Math.max(Math.min(dv.length(), (L1 + L2) * 0.9995), Math.abs(L1 - L2) + 1e-4), n = dv.clone().normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
    let pp = polo.clone().sub(n.clone().multiplyScalar(polo.dot(n)));
    if (pp.length() < 1e-6) pp = V(0, 0, 1).sub(n.clone().multiplyScalar(n.z));
    pp.normalize();
    const rodilla = raiz.clone().addScaledVector(n, a).addScaledVector(pp, h), fin = raiz.clone().addScaledVector(n, d);
    const w1 = entre(rotar(padreW, r1), rodilla.clone().sub(raiz)).multiply(padreW);
    const w2 = entre(rotar(w1, r2), fin.clone().sub(rodilla)).multiply(w1);
    return [padreW.clone().invert().multiply(w1), w1.clone().invert().multiply(w2), w2];
  }
  // resuelve la pose (IK de piernas y brazos) y deja en p.rot las rotaciones locales finales
  function resolver(p) {
    const P = {}, W = {};
    const fk = b => {
      const par = PADRE[b];
      if (par == null) { P[b] = p.hips.clone(); W[b] = p.rot[b].clone(); }
      else { P[b] = P[par].clone().add(rotar(W[par], REST[b])); W[b] = W[par].clone().multiply(p.rot[b]); }
    };
    for (const b of ['Hips', 'Spine', 'Chest', 'Neck', 'HeadBone']) fk(b);
    for (const sd of ['L', 'R']) {
      const th = 'Thigh' + sd, sh = 'Shin' + sd, ft = 'Foot' + sd;
      if (p.leg[sd]) {
        const [obj, rotPie, polo] = p.leg[sd], raiz = P.Hips.clone().add(rotar(W.Hips, REST[th]));
        const [l1, l2, w2] = ik2(W.Hips, raiz, REST[sh], REST[ft], obj, polo), wl = p.legW[sd] ?? 1;
        p.rot[th] = p.rot[th].clone().slerp(l1, wl); p.rot[sh] = p.rot[sh].clone().slerp(l2, wl);
        p.rot[ft] = p.rot[ft].clone().slerp(w2.clone().invert().multiply(rotPie), wl);
      }
      for (const b of [th, sh, ft]) fk(b);
    }
    for (const sd of ['L', 'R']) {
      const ua = 'UpperArm' + sd, fa = 'Forearm' + sd, hd = 'Hand' + sd;
      if (p.arm[sd]) {
        let [obj, rotMano, polo, peso] = p.arm[sd];
        if (typeof obj === 'function') obj = obj(P, W);
        const raiz = P.Chest.clone().add(rotar(W.Chest, REST[ua]));
        const [l1, l2, w2] = ik2(W.Chest, raiz, REST[fa], REST[hd], obj, polo);
        p.rot[ua] = p.rot[ua].clone().slerp(l1, peso); p.rot[fa] = p.rot[fa].clone().slerp(l2, peso);
        if (rotMano) p.rot[hd] = p.rot[hd].clone().slerp(w2.clone().invert().multiply(rotMano), peso);
      }
      for (const b of [ua, fa, hd]) fk(b);
    }
    return { P, W };
  }
  // pie apoyado en (x, z): pitch>0 talón arriba (pivota en la punta), pitch<0 punta arriba (pivota en el talón)
  function pie(x, z, { pitch = 0, yaw = 0, lift = 0, roll = 0, ankH = ANK_H } = {}) {
    const R = Q('y', yaw).multiply(Q('z', roll)).multiply(Q('x', pitch)), base = V(x, 0, z);
    const [piv, rel] = pitch >= 0 ? [base.clone().add(rotar(Q('y', yaw), V(0, 0, BALL))), V(0, ankH, -BALL)]
      : [base.clone().add(rotar(Q('y', yaw), V(0, 0, HEEL))), V(0, ankH, -HEEL)];
    return [piv.add(rotar(R, rel)).add(V(0, lift, 0)), R];
  }
  const poloRodilla = (p, sd, out = 0.2) => rotar(p.rot.Hips, V(SX[sd] * out, 0, 1));
  function ponerPie(p, sd, x, z, o = {}) { const [tobillo, R] = pie(x, z, o); p.leg[sd] = [tobillo, R, o.polo || poloRodilla(p, sd)]; }
  // brazo por FK. lower: cuánto se baja desde la pose A (negativo = levantar lateral); swing>0 hacia adelante;
  // elbow>0 dobla el codo hacia adelante; twist gira el brazo; giro gira el antebrazo sobre su largo (palma arriba…)
  function brazo(p, sd, { lower = 13, swing = 0, elbow = 10, hand = 0, twist = 0, foreZ = 0, handZ = 0, giro = 0 } = {}) {
    const s = SX[sd];
    p.rot['UpperArm' + sd] = E({ x: -swing, y: s * twist, z: -s * lower });
    p.rot['Forearm' + sd] = E({ x: -elbow, z: s * foreZ }).multiply(Q('y', s * giro));
    p.rot['Hand' + sd] = E({ x: -hand, z: s * handZ });
  }
  function piesQuietos(p, { abre = 0.012, yaw = 7 } = {}) {
    for (const sd of ['L', 'R']) ponerPie(p, sd, SX[sd] * (FOOTX + abre), 0, { yaw: SX[sd] * yaw });
  }
  return { Pose, resolver, ponerPie, brazo, piesQuietos, poloRodilla };
}
