// Base para generar prendas nuevas en Node (sin Python ni Blender): el cuerpo de Nina, rayos para medirlo,
// pesos copiados del cuerpo y una malla sencilla con varios materiales. Es la versión en JavaScript de las
// utilidades de herramientas_avatar/vestir_avatar.py.
//
// Espacio glTF: +Y arriba, Nina mira hacia +Z. El esqueleto no tiene rotaciones en reposo.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import * as THREE from 'three';

export const ORIGEN = 'herramientas_avatar/avatar_vestido.glb';
export const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Lee el modelo original (sin cuantizar) y prepara el cuerpo para medirlo.
export async function cargarCuerpo() {
  const doc = await io.read(ORIGEN);
  const root = doc.getRoot(), skin = root.listSkins()[0];
  const JOINTS = skin.listJoints().map(j => j.getName());
  const malla = n => {
    const p = root.listMeshes().find(m => m.getName() === n).listPrimitives()[0];
    return {
      P: p.getAttribute('POSITION').getArray(), N: p.getAttribute('NORMAL').getArray(),
      J: p.getAttribute('JOINTS_0').getArray(), W: p.getAttribute('WEIGHTS_0').getArray(), I: p.getIndices().getArray(),
    };
  };
  const juntar = (a, b) => ({ P: [...a.P, ...b.P], I: [...a.I, ...Array.from(b.I, i => i + a.P.length / 3)] });
  const body = malla('Body_Base'), head = malla('Head_Base');
  const nV = body.P.length / 3;
  // hueso dominante de cada vértice del cuerpo
  const DOM = Array.from({ length: nV }, (_, i) => {
    let b = 0; for (let k = 1; k < 4; k++) if (body.W[i * 4 + k] > body.W[i * 4 + b]) b = k;
    return JOINTS[body.J[i * 4 + b]];
  });
  // posición de reposo de cada hueso (sumando traslaciones: no hay rotaciones en reposo)
  const huesos = {};
  for (const j of skin.listJoints()) {
    const p = new THREE.Vector3(); let n = j;
    while (n && JOINTS.includes(n.getName())) { p.add(new THREE.Vector3(...n.getTranslation())); n = n.getParentNode(); }
    huesos[j.getName()] = p;
  }
  // mallas de three.js para lanzar rayos: todo el cuerpo, la cabeza, y partes (por hueso dominante)
  const rayMesh = (src, filtro) => {
    const idx = [];
    for (let t = 0; t < src.I.length; t += 3) if (!filtro || [0, 1, 2].every(k => filtro(src.I[t + k]))) idx.push(src.I[t], src.I[t + 1], src.I[t + 2]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(src.P), 3)); g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  };
  const partes = nombres => rayMesh(body, i => nombres.includes(DOM[i]));
  const C = {
    doc, skin, JOINTS, body, head, DOM, huesos,
    HC: v3(0, 1.327, -0.011),   // centro de la cabeza (como en vestir_avatar.py)
    mallaCuerpo: rayMesh(body), mallaCabeza: rayMesh(head),
    mallaOrejas: rayMesh(juntar(malla('Ear_-1'), malla('Ear_1'))),
    mallaTorso: partes(['Hips', 'Spine', 'Chest', 'Neck']),
    mallaBrazo: { L: partes(['UpperArmL', 'ForearmL']), R: partes(['UpperArmR', 'ForearmR']) },
    partes,
  };
  return C;
}

// Distancia desde `o` hasta la superficie de `mesh` en la dirección `d` (primer choque), o null.
const _ray = new THREE.Raycaster();
export function rayo(mesh, o, d) {
  _ray.set(o, d.clone().normalize()); _ray.far = 5;
  const h = _ray.intersectObject(mesh, false);
  return h.length ? h[0].distance : null;
}
// Contorno exterior: desde afuera hacia el eje (sirve cuando hay dos piernas: da la silueta de ambas).
export function rayoDesdeAfuera(mesh, eje, d, lejos = 1) {
  const dir = d.clone().normalize(), o = eje.clone().addScaledVector(dir, lejos);
  const t = rayo(mesh, o, dir.clone().negate());
  return t == null ? null : lejos - t;
}

// Pesos copiados de los vértices del cuerpo más cercanos, sólo de los huesos permitidos.
// side = ±1 limita a vértices del cuerpo de ese lado de x (una manga no toma pesos del otro brazo).
export function pesosDelCuerpo(C, V, permitidos, k = 6, side = 0) {
  const { body, DOM, JOINTS } = C, nB = body.P.length / 3;
  const cand = [];
  for (let i = 0; i < nB; i++) if (permitidos.includes(DOM[i]) && (!side || body.P[i * 3] * side > -0.015)) cand.push(i);
  return V.map(p => {
    const d = cand.map(i => [i, (body.P[i * 3] - p.x) ** 2 + (body.P[i * 3 + 1] - p.y) ** 2 + (body.P[i * 3 + 2] - p.z) ** 2]);
    d.sort((a, b) => a[1] - b[1]);
    const acc = new Map();
    for (const [i, d2] of d.slice(0, k)) {
      const wn = 1 / (Math.sqrt(d2) + 1e-4) ** 2;
      for (let q = 0; q < 4; q++) { const w = body.W[i * 4 + q]; if (w > 0) { const j = JOINTS[body.J[i * 4 + q]]; acc.set(j, (acc.get(j) || 0) + wn * w); } }
    }
    return normalizar([...acc]);
  });
}
// pesos fijos: [['HeadBone', 1]] o una mezcla [['Hips', 0.6], ['ThighL', 0.4]]
export function normalizar(pares) {
  const top = pares.filter(([, w]) => w > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const s = top.reduce((a, [, w]) => a + w, 0) || 1;
  return top.map(([j, w]) => [j, w / s]);
}

// Malla con varios materiales. Caras = triángulos (los cuadriláteros se parten).
export class Malla {
  constructor() { this.V = []; this.F = []; this.M = []; this.UV = []; this.pesos = []; }
  // agrega vértices y caras; uv: [u, v] por vértice (opcional); pesos: por vértice ([[hueso, w], …])
  add(verts, faces, mat, uv, pesos) {
    const o = this.V.length;
    verts.forEach((v, i) => { this.V.push(v.clone()); this.UV.push(uv ? uv[i] : [0, 0]); this.pesos.push(pesos ? pesos[i] : null); });
    for (const f of faces) {
      const g = f.map(i => o + i);
      for (let k = 1; k < g.length - 1; k++) { this.F.push([g[0], g[k], g[k + 1]]); this.M.push(mat); }
    }
    return o;
  }
}
// Caras de una grilla filas×columnas (columnas cerradas en anillo si `cerrada`).
export function grilla(filas, cols, cerrada = false) {
  const F = [], cc = cerrada ? cols : cols - 1;
  for (let r = 0; r < filas - 1; r++) for (let c = 0; c < cc; c++) {
    const a = r * cols + c, b = r * cols + (c + 1) % cols;
    F.push([a, a + cols, b + cols, b]);
  }
  return F;
}
export function normales(V, F) {
  const N = V.map(() => new THREE.Vector3()), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3();
  for (const f of F) {
    const tri = f.length === 3 ? [f] : f.slice(1, -1).map((_, k) => [f[0], f[k + 1], f[k + 2]]);
    for (const [a, b, c] of tri) { e1.subVectors(V[b], V[a]); e2.subVectors(V[c], V[a]); n.crossVectors(e1, e2); N[a].add(n); N[b].add(n); N[c].add(n); }
  }
  return N.map(x => (x.lengthSq() ? x.normalize() : x.set(0, 1, 0)));
}
// Da vuelta las caras si la mayoría mira hacia adentro. `dentro(i)`: un punto interior para el vértice i
// (el eje del anillo, el centro de la cabeza…). Hay que hacerlo antes de cascara(): el grosor va hacia adentro.
export function orientar(V, F, dentro) {
  let s = 0; const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (const f of F) {
    const [a, b, c] = [V[f[0]], V[f[1]], V[f[2]]];
    const n = e1.subVectors(b, a).cross(e2.subVectors(c, a));
    s += n.dot(a.clone().sub(dentro(f[0])));
  }
  return s < 0 ? F.map(f => [...f].reverse()) : F;
}
// Superficie con grosor (como el modificador Solidify): exterior, interior y bordes.
export function cascara(m, V, F, grosor, matFuera, matDentro = matFuera, matBorde = matFuera, uv, pesos, afuera) {
  const N = afuera || normales(V, F);
  const Vi = V.map((v, i) => v.clone().addScaledVector(N[i], -grosor));
  const o = m.add(V, F, matFuera, uv, pesos);
  const i0 = m.add(Vi, F.map(f => [...f].reverse()), matDentro, uv, pesos);
  const cnt = new Map();
  for (const f of F) for (let k = 0; k < f.length; k++) {
    const a = f[k], b = f[(k + 1) % f.length], key = a < b ? `${a},${b}` : `${b},${a}`;
    (cnt.get(key) || cnt.set(key, []).get(key)).push([a, b]);
  }
  for (const es of cnt.values()) if (es.length === 1) {
    const [a, b] = es[0];
    m.F.push([o + b, o + a, i0 + a], [o + b, i0 + a, i0 + b]); m.M.push(matBorde, matBorde);
  }
  return o;
}
