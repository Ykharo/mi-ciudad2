// Cartel de la competencia de farmear aura: un letrero alto en la esquina de la Boutique, mirando hacia la calle y
// hacia donde parte la jugadora (así se ve apenas empieza el juego). La imagen es src/assets/imagenes/cartel_aura.jpg
// (el original está en referencias/carteles/). Frente al cartel, un espectador lo mira (game/cartel.js) y la zona
// 'cartel' deja que la jugadora lo mire también.
import { THREE } from '../../engine/three.js';
import { mat } from '../../engine/materials.js';
import { cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { definePlace } from '../place.js';
import cartelUrl from '../../assets/imagenes/cartel_aura.jpg';

const ANCHO = 3.8, ALTO = 5.7, BASE = 1.9;   // la imagen es 2:3; el borde de abajo a 1,9 m
// dónde está y hacia dónde mira; `frente(d, lado)`: un punto delante del cartel (d metros) y corrido hacia un lado
const CARTEL = { x: 8.6, z: -10.2, ry: -0.34, centroY: BASE + ALTO / 2 };
CARTEL.frente = (d, lado = 0) => ({
  x: CARTEL.x + Math.sin(CARTEL.ry) * d + Math.cos(CARTEL.ry) * lado,
  z: CARTEL.z + Math.cos(CARTEL.ry) * d - Math.sin(CARTEL.ry) * lado,
});

// La imagen se carga una vez; `cartelListo` se cumple cuando ya se puede dibujar (main.js lo espera antes de
// "¡A jugar!", así las capturas de las pruebas siempre lo ven). Si no carga, el cartel queda liso y el juego sigue.
const textura = new THREE.Texture();
const cartelListo = new Promise(ok => {
  const img = new Image();
  img.onload = () => { textura.image = img; textura.anisotropy = 8; textura.needsUpdate = true; ok(true); };
  img.onerror = () => ok(false);
  img.src = cartelUrl;
});

function cartel({ world, addObs, addZone }) {
  const g = new THREE.Group(); g.position.set(CARTEL.x, 0, CARTEL.z); g.rotation.y = CARTEL.ry;
  const marco = mat('#2E2550'), morado = mat('#9B6BF0', { roughness: 0.5 });
  // patas y base
  [-1, 1].forEach(s => {
    g.add(mesh(cyl(0.15, 0.17, BASE + 0.4, 12), mat('#4A4460', { metalness: 0.3, roughness: 0.5 }), s * 1.35, (BASE + 0.4) / 2, -0.12));
    g.add(mesh(rlo(0.8, 0.24, 0.8, 0.08), mat('#D9D2E4'), s * 1.35, 0.12, -0.12));
  });
  // marco con borde morado y una corona arriba (como en la imagen)
  g.add(mesh(rlo(ANCHO + 0.4, ALTO + 0.4, 0.26, 0.1), marco, 0, BASE + ALTO / 2, -0.14));
  g.add(mesh(rlo(ANCHO + 0.18, 0.12, 0.08, 0.04), morado, 0, BASE - 0.06, 0.02));
  g.add(mesh(rlo(ANCHO + 0.18, 0.12, 0.08, 0.04), morado, 0, BASE + ALTO + 0.06, 0.02));
  const oro = mat('#FFD23F', { metalness: 0.4, roughness: 0.35 });
  g.add(mesh(rlo(0.9, 0.22, 0.16, 0.06), oro, 0, BASE + ALTO + 0.36, -0.1));
  [-0.36, 0, 0.36].forEach((x, i) => {
    g.add(mesh(cyl(0.02, 0.09, i === 1 ? 0.36 : 0.26, 8), oro, x, BASE + ALTO + 0.6 + (i === 1 ? 0.05 : 0), -0.1));
    g.add(mesh(sph(0.07, 10, 8), oro, x, BASE + ALTO + 0.8 + (i === 1 ? 0.1 : 0), -0.1));
  });
  // la imagen: sin sombreado (se ve con sus colores, como un letrero iluminado)
  const imagen = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ALTO), new THREE.MeshBasicMaterial({ map: textura, color: 0xF2F2F2 }));
  imagen.position.set(0, BASE + ALTO / 2, 0.005); g.add(imagen);
  world.add(g);
  addObs(CARTEL.x, CARTEL.z, 2.0, 0.55, BASE + ALTO);
  // la jugadora lo mira desde un lado del frente (el espectador está al otro), o le pregunta al espectador dónde es la
  // competencia (le da pistas: game/cartel.js)
  const z = CARTEL.frente(4.0, 1.0);
  const opciones = [{ id: 'mirar', label: '👀 Mirar el cartel' }, { id: 'preguntar', label: '💬 Preguntar dónde es' }];
  addZone({ id: 'cartel', x: z.x, z: z.z, r: 2.0, label: opciones[0].label, opciones });
}

// sin área propia: está en la manzana de la Boutique
definePlace({ id: 'cartel', nombre: 'Cartel de la competencia', orden: 20, build: cartel });

// la imagen del cartel también sale en la pantalla gigante del Escenario del Aura
export { CARTEL, cartelListo, textura as cartelTextura };
