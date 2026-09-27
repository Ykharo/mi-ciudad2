// Único punto que importa Three.js y sus addons.
// Cambiar de versión de Three.js = tocar este archivo (y revisar luces y color, ver PLAN.md 4.3).
import * as THREE from 'three';
export { THREE };
// el aviso de error de index.html distingue "no cargó el 3D" de "falló al construir la ciudad"
window.__cityScript = true;
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
