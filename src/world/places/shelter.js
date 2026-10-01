// Refugio de Mascotas.
import { THREE } from '../../engine/three.js';
import { mat } from '../../engine/materials.js';
import { G, box, cyl, mesh, rlo } from '../../engine/geometry.js';
import { makeSign } from '../../engine/textures.js';
import { definePlace } from '../place.js';
import { house } from '../houses.js';
import { animatePet, buildPet } from '../../pets/models.js';

function shelter({ world, scene, addObs, addZone, onFrame }) {
  const x = 15, z = 17;
  const ry = Math.PI; // faces -z (toward Paseo Algodón)
  const g = house(x, z, ry, { w: 13, d: 9, h: 5.2, wall: '#D2F4E6', roof: '#2FA58A', door: '#FFD23F', rh: 3.2, path: 3 });
  const sign = makeSign('Refugio de Mascotas', '#2FA58A', '#FFFFFF', 8.5); sign.position.set(0, 4.75, 9 / 2 + 0.07); g.add(sign);
  // paw print on the gable
  const pawM = mat('#FFFFFF');
  const paw = new THREE.Group(); paw.position.set(0, 6.6, 9 / 2 - 0.9); paw.rotation.x = 0.55;
  paw.add(mesh(cyl(0.62, 0.62, 0.12, 20), pawM, 0, 0, 0.1));
  [[-0.72, -0.62], [-0.26, -0.98], [0.26, -0.98], [0.72, -0.62]].forEach(([a, b]) => paw.add(mesh(cyl(0.26, 0.26, 0.12, 14), pawM, a, 0, b)));
  g.add(paw);
  // fenced yard on the side, with a dog house
  const yx = x + 11, yz = z + 1;
  const post = mat('#FFFFFF');
  const yw = 7, yd = 9;
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    [[yx - yw / 2 + t * yw, yz - yd / 2], [yx - yw / 2 + t * yw, yz + yd / 2]].forEach(([px, pz]) => world.add(mesh(rlo(0.18, 1.1, 0.18, 0.06), post, px, 0.55, pz)));
    [[yx + yw / 2, yz - yd / 2 + t * yd]].forEach(([px, pz]) => world.add(mesh(rlo(0.18, 1.1, 0.18, 0.06), post, px, 0.55, pz)));
  }
  world.add(mesh(box(yw, 0.12, 0.1), post, yx, 0.75, yz - yd / 2));
  world.add(mesh(box(yw, 0.12, 0.1), post, yx, 0.75, yz + yd / 2));
  world.add(mesh(box(0.1, 0.12, yd), post, yx + yw / 2, 0.75, yz));
  addObs(yx, yz - yd / 2, yw / 2, 0.2); addObs(yx, yz + yd / 2, yw / 2, 0.2); addObs(yx + yw / 2, yz, 0.2, yd / 2);
  const dh = new THREE.Group(); dh.position.set(yx + 1.8, 0, yz + 2.4); dh.rotation.y = Math.PI;
  dh.add(mesh(rlo(1.8, 1.4, 1.8, 0.12), mat('#FF9B4A'), 0, 0.7, 0));
  const dr = mesh(G('roof4', () => null), mat('#C9533B', { flatShading: true }), 0, 1.4, 0); dr.scale.set(1.6, 0.9, 1.6); dh.add(dr);
  const hole = mesh(cyl(0.45, 0.45, 0.1, 16), mat('#3A2A20'), 0, 0.55, 0.92); hole.rotation.x = Math.PI / 2; dh.add(hole);
  world.add(dh);
  // resident pets that live in the yard
  const residents = [['perro', '#C98B4F', yx - 1.5, yz - 1.8], ['gato', '#F2A65A', yx + 1.2, yz - 2.6], ['conejo', '#FFFFFF', yx - 1.8, yz + 2.2]];
  residents.forEach(([k, c, px, pz], i) => {
    const p = buildPet(k, c); p.root.position.set(px, 0, pz); p.root.rotation.y = -Math.PI / 2 + i; scene.add(p.root);
    onFrame((t) => { animatePet(p, t + i * 2, 0, 0.016); p.root.rotation.y += Math.sin(t * 0.6 + i) * 0.004; });
  });
  addZone({ id: 'pets', x, z: z - 9 / 2 - 2.4, r: 3.4, label: '🐾 Adoptar mascota' });
}

definePlace({ id: 'refugio', nombre: 'Refugio de Mascotas', orden: 30, area: [5.5, 34.5, 5.5, 34.5], build: shelter });
