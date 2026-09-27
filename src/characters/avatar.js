// Nina: carga del .glb, colores, clones y recorte de personajes.
import { GLTFLoader, SkeletonUtils, THREE } from '../engine/three.js';
import { readAsset } from '../assets/loader.js';
import { camera, scene } from '../engine/renderer.js';
import { shade, tint } from '../engine/materials.js';
import { setFace } from './face.js';

/* ================= CHARACTERS ================= */
const SKIN = ['#FFE3CC', '#F6C9A4', '#E3A97F', '#C78A5C', '#9B6643', '#6A432E'];
const HAIR_COLORS = ['#2B1B14', '#5A3521', '#9C5B2E', '#E0A84E', '#F6DE95', '#E8664F', '#FF8FC2', '#9B7BF3', '#55C3F0', '#F2F2F6'];
const CLOTH_COLORS = ['#FF6FAE', '#FF4F5E', '#FF9B4A', '#FFD23F', '#7BD85A', '#34CFA0', '#4FB6F5', '#5B6CF0', '#A77BF3', '#FFFFFF', '#2E3350', '#F7B7D2'];
const SHOE_COLORS = ['#FFFFFF', '#FF6FAE', '#FF4F5E', '#FFD23F', '#4FB6F5', '#34CFA0', '#A77BF3', '#2E3350', '#9A6A45'];

/* ================= NINA: avatar .glb con esqueleto de 17 huesos y 11 animaciones =================
   Espacio glTF: +Y arriba, mira hacia +Z (igual que el juego). La protagonista es el modelo tal cual;
   los vecinos son clones del mismo modelo con otros colores, estatura y tamaño de cabeza. */
const NINA_SCALE = 1.4;                  // el modelo mide ~1,65 m; en la ciudad queda como los autos esperan
const PANTS_COLORS = ['#D9D6E3', '#4F7DBF', '#2E3350', '#F7B7D2', '#FFD23F', '#34CFA0', '#A77BF3', '#FF9B4A', '#FFFFFF', '#9A6A45'];
const SHADOW_PARTS = new Set(['Body_Base', 'Head_Base', 'Pelo_Moño']);
const avatars = [];
const NINA = { scene: null, clips: {}, walkStride: 0, runStride: 0, runSpeed: 0 };

// Las texturas embebidas se decodifican como imágenes data: (el visor de artifacts bloquea el fetch()
// de blob: que usa GLTFLoader en algunos navegadores, como Safari en iPad).
function glbSplitTextures(buf) {
  const dv = new DataView(buf);
  const jlen = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jlen)));
  const binStart = 20 + jlen + 8, binLen = dv.getUint32(20 + jlen, true);
  const jobs = [];
  for (const m of json.materials || []) {
    const ref = m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorTexture;
    if (!ref) continue;
    const tex = json.textures[ref.index], img = json.images[tex.source], bv = json.bufferViews[img.bufferView];
    jobs.push({ material: m.name, bytes: new Uint8Array(buf, binStart + (bv.byteOffset || 0), bv.byteLength),
      mime: img.mimeType || 'image/png', tt: (ref.extensions || {}).KHR_texture_transform || null });
    delete m.pbrMetallicRoughness.baseColorTexture;
  }
  delete json.textures; delete json.images; delete json.samplers;
  if (json.extensionsRequired) json.extensionsRequired = json.extensionsRequired.filter(e => e !== 'KHR_texture_transform');
  const js = new TextEncoder().encode(JSON.stringify(json)), pad = (4 - js.length % 4) % 4;
  const out = new ArrayBuffer(20 + js.length + pad + 8 + binLen), o = new DataView(out), u = new Uint8Array(out);
  o.setUint32(0, 0x46546C67, true); o.setUint32(4, 2, true); o.setUint32(8, out.byteLength, true);
  o.setUint32(12, js.length + pad, true); o.setUint32(16, 0x4E4F534A, true); u.set(js, 20); u.fill(0x20, 20 + js.length, 20 + js.length + pad);
  const p = 20 + js.length + pad;
  o.setUint32(p, binLen, true); o.setUint32(p + 4, 0x004E4942, true); u.set(new Uint8Array(buf, binStart, binLen), p + 8);
  return { buf: out, jobs };
}
function glbTexture(job) {
  return new Promise((resolve, reject) => {
    let s = '';
    for (let i = 0; i < job.bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, job.bytes.subarray(i, i + 0x8000));
    const img = new Image();
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
      if (job.tt) { if (job.tt.offset) t.offset.fromArray(job.tt.offset); if (job.tt.scale) t.repeat.fromArray(job.tt.scale); }
      t.needsUpdate = true; resolve(t);
    };
    img.onerror = () => reject(new Error('textura ' + job.material));
    img.src = `data:${job.mime};base64,` + btoa(s);
  });
}
async function loadNina() {
  const bytes = await readAsset('nina');
  const prep = glbSplitTextures(bytes.buffer);
  const [gltf, texs] = await Promise.all([
    new Promise((res, rej) => new GLTFLoader().parse(prep.buf, '', res, rej)),
    Promise.all(prep.jobs.map(j => glbTexture(j).then(t => [j.material, t])))
  ]);
  const texBy = Object.fromEntries(texs);
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (m.userData.fixed) continue; m.userData.fixed = true;
      // el juego trabaja sin gestión de color (colores hex tal cual): los factores del glTF vienen en lineal
      m.color.convertLinearToSRGB();
      if (texBy[m.name]) { m.map = texBy[m.name]; m.needsUpdate = true; }
      if (m.transparent) m.depthWrite = false;
    }
  });
  NINA.scene = gltf.scene;
  gltf.animations.forEach(c => { NINA.clips[c.name] = c; });
  const ex = (gltf.parser.json.asset || {}).extras || {};
  NINA.walkStride = (ex.walk_speed_mps || 0.469) * NINA.clips.walk.duration * NINA_SCALE;
  NINA.runStride = (ex.run_speed_mps || 1.75) * NINA.clips.run.duration * NINA_SCALE;
  NINA.runSpeed = (ex.run_speed_mps || 1.75) * NINA_SCALE;
}

function recolor(mats, look) {
  const set = (n, c) => { if (mats[n] && c) mats[n].color.set(c); };
  const dark = hex => new THREE.Color(hex).getHSL({}).l < 0.3;
  set('Skin_Warm', look.skin); set('Ear_Warm', look.skin && shade(look.skin, 0.9));
  if (look.hair) { set('Hair_Chestnut', look.hair); set('Hair_Light', dark(look.hair) ? tint(look.hair, 0.12) : shade(look.hair, 1.1)); set('Hair_Dark', shade(look.hair, 0.72)); }
  if (look.top) { set('Cotton_Charcoal', look.top); set('Cotton_Edge', dark(look.top) ? tint(look.top, 0.1) : shade(look.top, 0.84)); }
  if (look.pants) { set('Cargo_Pearl', look.pants); set('Cargo_Pocket', shade(look.pants, 0.92)); set('Cargo_Stitch', dark(look.pants) ? tint(look.pants, 0.25) : shade(look.pants, 0.68)); }
  if (look.shoes) { set('Sneaker_Ivory', look.shoes); set('Sneaker_Panel', look.accent || shade(look.shoes, 0.8)); }
  if (mats.Top_Emblem && look.emblem === false) mats.Top_Emblem.visible = false;
}
function randomLook(r = Math.random) {
  const p = a => a[Math.floor(r() * a.length)];
  return {
    skin: p(SKIN), hair: p(HAIR_COLORS), top: p(CLOTH_COLORS), pants: p(PANTS_COLORS), shoes: p(SHOE_COLORS), accent: p(CLOTH_COLORS),
    emblem: r() < 0.5, scale: 0.86 + r() * 0.2, head: 0.95 + r() * 0.12
  };
}

// un personaje = clon del modelo con sus propios materiales (y su propia cara) + su mezclador de animaciones
function makeAvatar(look) {
  const model = SkeletonUtils.clone(NINA.scene);
  const c = { root: new THREE.Group(), model, look, mats: {}, act: {}, sp: null, fade: [], phase: 0, face: 'normal', blinkT: 2, blinkOn: 0, holding: null, ice: null };
  const k = NINA_SCALE * (look && look.scale || 1);
  model.scale.setScalar(k); c.k = k;
  const copies = new Map();
  model.traverse(o => {
    if (o.isBone) { if (o.name === 'HeadBone' && look && look.head) o.scale.setScalar(look.head); if (o.name === 'HandR') c.hand = o; }
    if (!o.isMesh) return;
    o.frustumCulled = false;
    o.material = Array.isArray(o.material) ? o.material.map(m => copy(m)) : copy(o.material);
    const tr = [].concat(o.material).every(m => m.transparent);
    // la sombra la hacen solo cuerpo, cabeza y pelo (la ropa va pegada al cuerpo): la mitad de trabajo
    o.castShadow = SHADOW_PARTS.has(o.name); o.receiveShadow = !tr;
  });
  function copy(m) {
    if (!copies.has(m)) {
      const n = m.clone();
      if (n.map && /^Face_(Eyes|Eyebrows|Mouth)$/.test(m.name)) { n.map = m.map.clone(); n.map.needsUpdate = true; }
      copies.set(m, n); c.mats[m.name] = n;
    }
    return copies.get(m);
  }
  if (look) recolor(c.mats, look);
  c.mixer = new THREE.AnimationMixer(model);
  for (const [name, clip] of Object.entries(NINA.clips)) {
    const a = c.mixer.clipAction(clip); a.play(); a.setEffectiveWeight(0); c.act[name] = a;
  }
  c.act.walk.timeScale = 0; c.act.run.timeScale = 0;          // su tiempo lo lleva la fase de la zancada
  c.act.idle.time = Math.random() * NINA.clips.idle.duration;
  c.root.add(model);
  scene.add(c.root);
  setFace(c, 'normal');
  avatars.push(c);
  return c;
}
// no dibujar a quien queda fuera de la cámara (las mallas con huesos no se recortan solas)
const _frus = new THREE.Frustum(), _pm = new THREE.Matrix4(), _bs = new THREE.Sphere(), _wp = new THREE.Vector3();
function cullAvatars() {
  camera.updateMatrixWorld(); _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _frus.setFromProjectionMatrix(_pm);
  for (const c of avatars) {
    c.root.getWorldPosition(_wp); _bs.center.set(_wp.x, _wp.y + 1.2, _wp.z); _bs.radius = 1.8;
    c.model.visible = _wp.distanceToSquared(camera.position) < 95 * 95 && _frus.intersectsSphere(_bs);
  }
}

export { NINA, NINA_SCALE, cullAvatars, loadNina, makeAvatar, randomLook };
