// Objetos en la mano (helado).
import { THREE } from '../engine/three.js';
import { mat } from '../engine/materials.js';
import { cone, mesh, sph } from '../engine/geometry.js';

// helado en la mano derecha (el hueso está dentro del modelo escalado)
function setHolding(c, color) {
  if (c.ice) { c.hand.remove(c.ice); c.ice = null; }
  c.holding = color;
  if (!color || !c.hand) return;
  const ice = new THREE.Group(); ice.scale.setScalar(1 / c.k); ice.position.set(0, -0.085, 0.03); ice.rotation.x = -0.5;
  const cn = mesh(cone(0.08, 0.26, 14), mat('#E7A45C', { roughness: 0.8 }), 0, 0.06, 0); cn.rotation.x = Math.PI; ice.add(cn);
  ice.add(mesh(sph(0.11, 14, 10), mat(color, { roughness: 0.5 }), 0, 0.23, 0));
  ice.add(mesh(sph(0.035, 8, 6), mat('#FF3B5C', { roughness: 0.3 }), 0, 0.35, 0));
  c.hand.add(ice); c.ice = ice;
}

export { setHolding };
