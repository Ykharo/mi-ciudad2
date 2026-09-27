// Fusión de mallas estáticas por material (pocas llamadas de dibujo).
import { THREE } from './three.js';

/* merge static meshes by material -> few draw calls */
function mergeInto(root, meshes, useLocal) {
  const buckets = new Map();
  for (const o of meshes) {
    let b = buckets.get(o.material);
    if (!b) { b = { geos: [], cast: false }; buckets.set(o.material, b); }
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(useLocal ? o.matrix : o.matrixWorld);
    b.geos.push(g); b.cast = b.cast || o.castShadow;
    o.parent.remove(o);
  }
  const made = [];
  buckets.forEach((b, m) => {
    let n = 0; b.geos.forEach(g => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let off = 0;
    b.geos.forEach(g => { pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3); off += g.attributes.position.count; g.dispose(); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.computeBoundingSphere();
    const mm = new THREE.Mesh(geo, m); mm.castShadow = b.cast; mm.receiveShadow = true;
    root.add(mm); made.push(mm);
  });
  return made;
}
function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const list = [];
  (function walk(o) {
    if (o.userData.dynamic) return;
    if (o.isMesh && !o.isInstancedMesh && !o.material.map && !o.material.transparent) list.push(o);
    o.children.forEach(walk);
  })(root);
  mergeInto(root, list, false);
}
function mergeChildren(group) {
  const list = group.children.filter(o => o.isMesh && !o.material.transparent && !o.material.map);
  list.forEach(o => o.updateMatrix());
  return mergeInto(group, list, true);
}

export { mergeChildren, mergeInto, mergeStatic };
