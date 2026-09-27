// Cielo, sol y nubes.
import { THREE } from '../engine/three.js';
import { seeded } from '../core/math.js';
import { SUN_OFF, scene } from '../engine/renderer.js';
import { sph } from '../engine/geometry.js';
import { animated } from '../engine/loop.js';

function buildSky() {
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x3E9CF0) }, mid: { value: new THREE.Color(0xA9DDFF) }, bot: { value: new THREE.Color(0xDDF3FF) } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top,mid,bot;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.?mix(mid,top,smoothstep(0.,.55,h)):mix(mid,bot,smoothstep(0.,-.25,h));gl_FragColor=vec4(c,1.);}'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat);
  sky.renderOrder = -10;
  // sun glow
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.22, 'rgba(255,248,210,1)'); gr.addColorStop(0.35, 'rgba(255,236,170,.55)'); gr.addColorStop(1, 'rgba(255,230,160,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), fog: false, depthWrite: false, transparent: true }));
  sunSpr.scale.set(90, 90, 1); sunSpr.position.copy(SUN_OFF).normalize().multiplyScalar(360);
  sky.add(sunSpr);
  scene.add(sky);
  return sky;
}

function buildClouds() {
  const cm = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, emissive: 0xE8F4FF, emissiveIntensity: 0.35, fog: false });
  const clouds = [];
  const r = seeded(21);
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    const n = 4 + Math.floor(r() * 3);
    for (let j = 0; j < n; j++) {
      const s = 3 + r() * 3.5;
      const m = new THREE.Mesh(sph(1, 16, 12), cm); m.scale.set(s * 1.25, s * 0.85, s);
      m.position.set((j - n / 2) * 3.4 + r() * 1.5, r() * 1.5, r() * 3 - 1.5); g.add(m);
    }
    g.position.set(r() * 320 - 160, 48 + r() * 22, r() * 320 - 160);
    g.userData.speed = 1.2 + r() * 1.5;
    scene.add(g); clouds.push(g);
  }
  animated.push((t, dt) => { for (const g of clouds) { g.position.x += g.userData.speed * dt; if (g.position.x > 180) g.position.x = -180; } });
}

export { buildClouds, buildSky };
