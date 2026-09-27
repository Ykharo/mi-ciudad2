// Boutique Arcoíris.
import { THREE } from '../../engine/three.js';
import { mat } from '../../engine/materials.js';
import { G, box, cyl, mesh, rbox, rlo, sph } from '../../engine/geometry.js';
import { makeSign, stripeTexture } from '../../engine/textures.js';
import { world } from '../layout.js';
import { addObs } from '../physics.js';

/* ---------- special places ---------- */
function mannequin(g, x, y, z, color, skirt) {
  g.add(mesh(cyl(0.05, 0.05, 1.0, 8), mat('#C9BFD6'), x, y + 0.5, z));
  g.add(mesh(cyl(0.35, 0.35, 0.06, 16), mat('#C9BFD6'), x, y + 0.03, z));
  g.add(mesh(rbox(0.62, 0.62, 0.36, 0.12), mat(color), x, y + 1.55, z));
  g.add(mesh(cyl(0.34, skirt ? 0.62 : 0.4, 0.55, 20), mat(skirt ? color : '#4FB6F5'), x, y + 1.0, z));
  g.add(mesh(sph(0.26, 14, 10), mat('#F4EEF6'), x, y + 2.1, z));
}
function boutique(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const w = 16, d = 11, h = 7.6;
  const wall = mat('#FFC9E0'), pink = mat('#FF6FAE'), white = mat('#FFFFFF');
  g.add(mesh(rlo(w + 0.5, 0.4, d + 0.5, 0.12), mat('#E4DACB'), 0, 0.2, 0));
  g.add(mesh(rlo(w, h, d, 0.4), wall, 0, h / 2 + 0.3, 0));
  g.add(mesh(rlo(w + 0.6, 0.7, d + 0.6, 0.25), pink, 0, h + 0.55, 0));
  // rainbow on the roof — the landmark
  const bands = ['#FF5E7E', '#FF9B4A', '#FFD23F', '#5BD66E', '#4FB6F5', '#9B7BF3'];
  bands.forEach((c, i) => {
    const r = 4.6 - i * 0.42;
    const arc = mesh(G(`arc${r}`, () => new THREE.TorusGeometry(r, 0.24, 10, 40, Math.PI)), mat(c, { roughness: 0.5 }), 0, h + 0.9, -1);
    world.add(arc); arc.position.add(g.position);
  });
  [-1, 1].forEach(s => g.add(mesh(sph(1.0, 16, 12), white, s * 4.4, h + 1.2, -1.2)));
  [-1, 1].forEach(s => { g.add(mesh(sph(0.85, 14, 10), white, s * 3.6, h + 1.0, -0.6)); g.add(mesh(sph(0.75, 14, 10), white, s * 5.1, h + 1.0, -0.6)); });
  // display bays with mannequins
  [-1, 1].forEach(s => {
    const bx = s * 4.9, f = d / 2;
    g.add(mesh(rlo(4.8, 0.55, 1.5, 0.12), white, bx, 0.58, f + 0.72));
    g.add(mesh(rlo(4.8, 0.45, 1.5, 0.12), pink, bx, 4.3, f + 0.72));
    g.add(mesh(rlo(0.3, 3.8, 1.5, 0.1), white, bx - 2.25, 2.4, f + 0.72));
    g.add(mesh(rlo(0.3, 3.8, 1.5, 0.1), white, bx + 2.25, 2.4, f + 0.72));
    mannequin(g, bx - 0.9, 0.85, f + 0.6, s < 0 ? '#FF6FAE' : '#FFD23F', true);
    mannequin(g, bx + 0.9, 0.85, f + 0.6, s < 0 ? '#A77BF3' : '#3DD6A8', s > 0);
    const glass = mesh(box(4.2, 3.2, 0.06), new THREE.MeshStandardMaterial({ color: 0xDDF3FF, roughness: 0.1, transparent: true, opacity: 0.28 }), bx, 2.45, f + 1.44, false, false);
    g.add(glass);
  });
  // door + awning
  g.add(mesh(rlo(3.2, 3.8, 0.24, 0.1), white, 0, 2.2, d / 2 + 0.04));
  g.add(mesh(rlo(2.7, 3.4, 0.3, 0.12), mat('#FF8FC0'), 0, 2.05, d / 2 + 0.06));
  g.add(mesh(box(0.1, 3.2, 0.34), white, 0, 2.05, d / 2 + 0.06));
  [-1, 1].forEach(s => g.add(mesh(sph(0.12, 10, 8), mat('#FFD23F', { metalness: 0.4, roughness: 0.3 }), s * 0.35, 2.0, d / 2 + 0.25)));
  const awn = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.16, 2.0), new THREE.MeshStandardMaterial({ map: stripeTexture('#FF6FAE', '#FFFFFF', 10), roughness: 0.7 }));
  awn.position.set(0, 4.55, d / 2 + 0.9); awn.rotation.x = 0.35; awn.castShadow = true; g.add(awn);
  const sign = makeSign('Boutique Arcoíris', '#FF6FAE', '#FFFFFF', 9.5); sign.position.set(0, 6.3, d / 2 + 0.06); g.add(sign);
  // entrance rug + planters
  g.add(mesh(cyl(2.4, 2.4, 0.04, 28), mat('#FFE1EE'), 0, 0.03, d / 2 + 3.2, false, true));
  [-1, 1].forEach(s => { g.add(mesh(cyl(0.55, 0.45, 0.8, 14), white, s * 2.2, 0.4, d / 2 + 1.9)); g.add(mesh(sph(0.62, 12, 10), mat('#5DBE5A'), s * 2.2, 1.15, d / 2 + 1.9)); });
  world.add(g);
  addObs(x, z, w / 2 + 0.3, d / 2 + 0.3, 11);
  addObs(x - 4.9, z + d / 2 + 0.75, 2.5, 0.8); addObs(x + 4.9, z + d / 2 + 0.75, 2.5, 0.8);
}

export { boutique };
