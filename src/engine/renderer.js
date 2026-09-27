// Renderer, escena, cámara y luces.
import { THREE } from './three.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xC4E8FF, 80, 210);
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 600);

const hemi = new THREE.HemisphereLight(0xE8F5FF, 0xD6D9B8, 0.85);
scene.add(hemi);
const fill = new THREE.DirectionalLight(0xFFF3EA, 0.3); // soft light from the camera so faces never go murky
scene.add(fill, fill.target);
const sun = new THREE.DirectionalLight(0xFFF0D8, 0.95);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
{ const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 140; }
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.035;
scene.add(sun, sun.target);
const SUN_OFF = new THREE.Vector3(32, 58, 26);

export { SUN_OFF, camera, canvas, fill, renderer, scene, sun };
