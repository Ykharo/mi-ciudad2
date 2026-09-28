// Heladería.
import { THREE } from '../../engine/three.js';
import { mat } from '../../engine/materials.js';
import { cone, cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { makeSign, stripeTexture } from '../../engine/textures.js';
import { world } from '../layout.js';
import { addObs } from '../physics.js';
import { addZone } from '../zones.js';

function iceCreamShop(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI;
  const w = 9, d = 7, h = 4.4;
  g.add(mesh(rlo(w + 0.4, 0.4, d + 0.4, 0.12), mat('#E4DACB'), 0, 0.2, 0));
  g.add(mesh(rlo(w, h, d, 0.35), mat('#FFF1B8'), 0, h / 2 + 0.3, 0));
  g.add(mesh(rlo(w + 0.5, 0.6, d + 0.5, 0.22), mat('#FF9B4A'), 0, h + 0.55, 0));
  // serving window
  g.add(mesh(rlo(4.6, 2.2, 0.2, 0.1), mat('#FFFFFF'), -1.2, 2.6, d / 2 + 0.02));
  g.add(mesh(rlo(4.1, 1.8, 0.24, 0.1), mat('#FFE9A8', { emissive: '#FFD66B', emissiveIntensity: 0.15 }), -1.2, 2.6, d / 2 + 0.04));
  g.add(mesh(rlo(4.8, 0.3, 0.9, 0.1), mat('#FFFFFF'), -1.2, 1.45, d / 2 + 0.4));
  ['#FF9CC7', '#8FE3C5', '#8A5A3C', '#FFF5DE'].forEach((c, i) => g.add(mesh(sph(0.26, 12, 10), mat(c), -2.6 + i * 0.9, 1.78, d / 2 + 0.35)));
  g.add(mesh(rlo(1.3, 2.5, 0.26, 0.12), mat('#3DD6A8'), 2.8, 1.55, d / 2 + 0.04));
  const awn = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 1.7), new THREE.MeshStandardMaterial({ map: stripeTexture('#3DD6A8', '#FFFFFF', 10), roughness: 0.7 }));
  awn.position.set(-1.2, 4.1, d / 2 + 0.75); awn.rotation.x = 0.35; awn.castShadow = true; g.add(awn);
  // giant cone on the roof
  const cone1 = mesh(cone(1.25, 3.2, 20), mat('#E7A45C', { roughness: 0.8 }), 0, h + 2.55, 0); cone1.rotation.x = Math.PI; g.add(cone1);
  g.add(mesh(sph(1.35, 20, 14), mat('#FF9CC7'), 0, h + 4.3, 0));
  g.add(mesh(sph(1.1, 20, 14), mat('#8FE3C5'), 0, h + 5.5, 0));
  g.add(mesh(sph(0.3, 12, 10), mat('#FF3B5C', { roughness: 0.3 }), 0, h + 6.7, 0));
  const sign = makeSign('Heladería', '#FF9B4A', '#FFFFFF', 5.2); sign.position.set(0, 5.6, d / 2 + 0.3); g.add(sign);
  world.add(g);
  addObs(x, z, w / 2 + 0.3, d / 2 + 0.3, 11);
  // tables with parasols in front (towards -z)
  [[-5.2, -6.8, '#FF6FAE'], [5.4, -6.6, '#4FB6F5']].forEach(([ox, oz, c]) => {
    const tx = x + ox, tz = z + oz;
    world.add(mesh(cyl(0.7, 0.7, 0.1, 18), mat('#FFFFFF'), tx, 0.95, tz));
    world.add(mesh(cyl(0.08, 0.08, 2.6, 8), mat('#FFFFFF'), tx, 1.3, tz));
    world.add(mesh(cone(1.7, 0.8, 12), mat(c, { flatShading: true }), tx, 2.8, tz));
    [-1, 1].forEach(s => world.add(mesh(rlo(0.6, 0.5, 0.6, 0.12), mat('#FFD23F'), tx + s * 1.1, 0.25, tz)));
    addObs(tx, tz, 0.7, 0.7);
  });
  addZone({ id: 'icecream', x: x + 1.2, z: z - d / 2 - 2.0, r: 3.0, label: '🍦 Pedir un helado' });
}

export { iceCreamShop };
