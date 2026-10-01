// Personajes: carga de la base de Nina, armado (base + prendas) y recorte de los que no se ven.
import { SkeletonUtils, THREE } from '../engine/three.js';
import { loadGLB } from '../assets/loader.js';
import { camera, scene } from '../engine/renderer.js';
import { setFace } from './face.js';
import { dress, loadPrendas, setupMesh } from './wardrobe.js';

/* ================= NINA: base .glb con esqueleto de 17 huesos y 11 animaciones =================
   Espacio glTF: +Y arriba, mira hacia +Z (igual que el juego). La base trae cuerpo, cabeza, orejas y cara;
   la ropa son prendas aparte (wardrobe.js). Los vecinos usan la misma base con otros colores, estatura y
   tamaño de cabeza (ver looks.js). */
const NINA_SCALE = 1.4;                  // el modelo mide ~1,65 m; en la ciudad queda como los autos esperan
const avatars = [];
const NINA = { scene: null, clips: {}, walkStride: 0, runStride: 0, runSpeed: 0 };

// Carga la base y las prendas que usan estos looks (los de los vecinos también: game/npcs.js, lookVecinos). Después
// makeAvatar es inmediato.
async function loadCharacters(looks) {
  const [gltf] = await Promise.all([loadGLB('nina_base'), loadPrendas(looks)]);
  NINA.scene = gltf.scene;
  gltf.animations.forEach(c => { NINA.clips[c.name] = c; });
  const ex = (gltf.parser.json.asset || {}).extras || {};
  NINA.walkStride = (ex.walk_speed_mps || 0.469) * NINA.clips.walk.duration * NINA_SCALE;
  NINA.runStride = (ex.run_speed_mps || 1.75) * NINA.clips.run.duration * NINA_SCALE;
  NINA.runSpeed = (ex.run_speed_mps || 1.75) * NINA_SCALE;
}

// un personaje = clon de la base + sus prendas + materiales según su look + su mezclador de animaciones
function makeAvatar(look) {
  const model = SkeletonUtils.clone(NINA.scene);
  const c = { root: new THREE.Group(), model, look, mats: {}, bones: {}, prendas: {}, act: {}, sp: null, fade: [], phase: 0, face: 'normal', blinkT: 2, blinkOn: 0, holding: null, ice: null };
  const k = NINA_SCALE * (look && look.escala || 1);
  model.scale.setScalar(k); c.k = k;
  model.traverse(o => {
    if (o.isBone) { c.bones[o.name] = o; if (o.name === 'HeadBone' && look && look.cabeza) o.scale.setScalar(look.cabeza); if (o.name === 'HandR') c.hand = o; }
    if (o.isMesh) setupMesh(o);
  });
  dress(c, look);
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
// saca a un personaje de la escena (al cambiar de personaje jugable). La geometría y los materiales son compartidos:
// no se liberan.
function removeAvatar(c) {
  c.mixer.stopAllAction();
  scene.remove(c.root);
  const i = avatars.indexOf(c); if (i >= 0) avatars.splice(i, 1);
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

export { NINA, NINA_SCALE, cullAvatars, loadCharacters, makeAvatar, removeAvatar };
