// Suelo, calles, veredas, faroles y cerros.
import { THREE } from '../engine/three.js';
import { TAU, seeded } from '../core/math.js';
import { scene } from '../engine/renderer.js';
import { mat } from '../engine/materials.js';
import { box, cyl, mesh, rlo, sph } from '../engine/geometry.js';
import { grassTexture } from '../engine/textures.js';
import { EXT, LINES, ROAD_HALF, WALK, world } from './layout.js';
import { addObs } from './physics.js';

function buildGround() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(460, 460), new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const roadM = mat('#606B85', { roughness: 0.95 }), walkM = mat('#F1E9DD', { roughness: 0.9 }), dashM = mat('#FFD466', { roughness: 0.8 }), whiteM = mat('#FFFFFF', { roughness: 0.8 });
  LINES.forEach((L, i) => {
    world.add(mesh(box(EXT * 2, 0.05, ROAD_HALF * 2), roadM, 0, 0.025 + i * 0.001, L, false, true));
    world.add(mesh(box(ROAD_HALF * 2, 0.05, EXT * 2), roadM, L, 0.03 + i * 0.001, 0, false, true));
  });
  const segs = [[-EXT, -45.5], [-34.5, -5.5], [5.5, 34.5], [45.5, EXT]];
  LINES.forEach(L => segs.forEach(([a, b]) => [-1, 1].forEach(s => {
    world.add(mesh(rlo(b - a, 0.18, 2, 0.06), walkM, (a + b) / 2, 0.09, L + s * WALK, false, true));
    world.add(mesh(rlo(2, 0.18, b - a, 0.06), walkM, L + s * WALK, 0.09, (a + b) / 2, false, true));
  })));
  LINES.forEach(Lx => LINES.forEach(Lz => [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
    world.add(mesh(rlo(2, 0.18, 2, 0.06), walkM, Lx + sx * WALK, 0.09, Lz + sz * WALK, false, true));
  }))));
  // centre dashes
  LINES.forEach(L => {
    for (let p = -EXT + 2; p < EXT - 1; p += 4) {
      if (LINES.some(c => Math.abs(p - c) < 6.5)) continue;
      world.add(mesh(box(1.8, 0.02, 0.22), dashM, p, 0.07, L, false, true));
      world.add(mesh(box(0.22, 0.02, 1.8), dashM, L, 0.075, p, false, true));
    }
  });
  // crosswalks where people cross
  LINES.forEach(Lx => LINES.forEach(Lz => [-1, 1].forEach(s => {
    for (let k = -2; k <= 2; k++) {
      world.add(mesh(box(1.5, 0.02, 0.62), whiteM, Lx + s * WALK, 0.08, Lz + k * 1.3, false, true));
      world.add(mesh(box(0.62, 0.02, 1.5), whiteM, Lx + k * 1.3, 0.08, Lz + s * WALK, false, true));
    }
  })));
  // street lamps
  const poleM = mat('#3C4670', { roughness: 0.5 }), lampM = mat('#FFF3C4', { emissive: '#FFE7A0', emissiveIntensity: 0.6 });
  LINES.forEach(L => [-EXT + 8, -24, -16, 16, 24, EXT - 8].forEach(p => {
    [[p, L + 5.9], [L - 5.9, p]].forEach(([x, z]) => {
      world.add(mesh(cyl(0.11, 0.14, 4.4, 10), poleM, x, 2.2, z));
      world.add(mesh(sph(0.36, 14, 10), lampM, x, 4.55, z, false, false));
      world.add(mesh(cyl(0.4, 0.3, 0.14, 12), poleM, x, 4.9, z));
      addObs(x, z, 0.25, 0.25);
    });
  }));
  // distant hills
  const hr = seeded(3);
  const hillM = [mat('#79C964', { roughness: 1 }), mat('#6BBE5A', { roughness: 1 }), mat('#8ED474', { roughness: 1 })];
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * TAU + hr() * 0.2, d = 130 + hr() * 40, r = 24 + hr() * 22;
    const h = new THREE.Mesh(sph(1, 24, 14), hillM[i % 3]); h.scale.set(r * 1.4, r * 0.55, r);
    h.position.set(Math.cos(a) * d, -r * 0.12, Math.sin(a) * d); h.rotation.y = a; h.receiveShadow = false;
    scene.add(h);
  }
}

export { buildGround };
