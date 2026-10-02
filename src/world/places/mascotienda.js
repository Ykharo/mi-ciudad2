// Mascotienda Arcoíris: la tienda de artículos para mascotas (se compra con Huesitos de Aura: game/mascotienda.js).
// Afuera, en la manzana frente al Refugio (cruzando la Calle Mora): la fachada con un hueso gigante en el techo y la
// puerta ("🛍️ Entrar a la Mascotienda"). Adentro es una sala aparte, lejos del mapa (MASCOTIENDA.interior): pasillos
// con estantes por sección (pociones, transporte, accesorios, juguetes) y un cartel colgado sobre cada uno, el
// probador, y al fondo el mostrador con Robi, el vendedor: un perro robot sobre un disco volador (a la altura de Nina).
// Cada pasillo, el probador y el mostrador abren la ventana de la tienda; la puerta de adentro vuelve a la calle.
import { THREE } from '../../engine/three.js';
import { RAINBOW, mat, tint } from '../../engine/materials.js';
import { box, cone, cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { makeSign, stripeTexture } from '../../engine/textures.js';
import { manzana } from '../layout.js';
import { addInterior } from '../physics.js';
import { addArea } from '../zones.js';
import { definePlace } from '../place.js';

// afuera: el centro del edificio (mira hacia la Calle Mora, −z); adentro: el centro de la sala, lejos del mapa
const AFUERA = { x: 20, z: 56, w: 18, d: 12, h: 6.5 };
const SALA = { x: 0, z: 260, w: 24, d: 18, h: 5.5 };
const MASCOTIENDA = {
  afuera: { x: AFUERA.x, z: AFUERA.z - AFUERA.d / 2 - 5.4, mira: Math.PI },      // al salir: en la vereda, frente a la puerta
  adentro: { x: SALA.x, z: SALA.z + SALA.d / 2 - 3.2, mira: Math.PI },           // al entrar: mirando hacia el mostrador
  robi: null,                                                                    // el grupo de Robi (game/mascotienda.js lo hace hablar)
  sala: SALA,
};

function fachada({ world, addObs, addZone }) {
  const { x, z, w, d, h } = AFUERA, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI;   // el frente hacia −z
  const menta = mat('#BDF2E1'), rosa = mat('#FF8FC7'), blanco = mat('#FFFFFF');
  g.add(mesh(rlo(w + 0.5, 0.4, d + 0.5, 0.12), mat('#E4DACB'), 0, 0.2, 0));
  g.add(mesh(rlo(w, h, d, 0.4), menta, 0, h / 2 + 0.3, 0));
  g.add(mesh(rlo(w + 0.6, 0.7, d + 0.6, 0.25), rosa, 0, h + 0.55, 0));
  // un hueso gigante en el techo, y huellitas en la pared
  const hueso = new THREE.Group(); hueso.position.set(0, h + 1.6, 0);
  const palo = mesh(cyl(0.55, 0.55, 6, 18), blanco, 0, 0, 0); palo.rotation.z = Math.PI / 2; hueso.add(palo);
  for (const s of [-1, 1]) for (const t of [-1, 1]) hueso.add(mesh(sph(0.9, 16, 12), blanco, s * 3.1, t * 0.55, 0));
  g.add(hueso);
  const huella = mat('#FFFFFF');
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 6.2, 3.8, d / 2 + 0.03);
    const planta = mesh(cyl(0.45, 0.45, 0.06, 18), huella, 0, -0.1, 0); planta.rotation.x = Math.PI / 2; p.add(planta);
    [[-0.5, 0.35], [-0.17, 0.6], [0.17, 0.6], [0.5, 0.35]].forEach(([a, b]) => { const m = mesh(cyl(0.18, 0.18, 0.06, 12), huella, a, b, 0); m.rotation.x = Math.PI / 2; p.add(m); });
    g.add(p);
  }
  // vitrinas con globos y una burbuja
  for (const s of [-1, 1]) {
    g.add(mesh(rlo(4.4, 3.2, 0.24, 0.1), blanco, s * 5.2, 2.2, d / 2 + 0.02));
    g.add(mesh(rlo(4.0, 2.8, 0.26, 0.08), mat('#CFEFFF', { roughness: 0.2, emissive: '#9ED8FF', emissiveIntensity: 0.15 }), s * 5.2, 2.2, d / 2 + 0.04));
    [0, 1, 2].forEach(i => g.add(mesh(sph(0.32, 14, 10), mat(RAINBOW[(i * 2 + (s > 0 ? 1 : 0)) % 6]), s * 5.2 + (i - 1) * 1.1, 2.7 + (i % 2) * 0.4, d / 2 + 0.35)));
  }
  // la puerta, el toldo y el letrero
  g.add(mesh(rlo(3.2, 3.9, 0.24, 0.1), blanco, 0, 2.25, d / 2 + 0.04));
  g.add(mesh(rlo(2.7, 3.5, 0.3, 0.12), mat('#9B6BF0'), 0, 2.1, d / 2 + 0.06));
  const toldo = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2), new THREE.MeshStandardMaterial({ map: stripeTexture('#3DD6A8', '#FFFFFF', 10), roughness: 0.7 }));
  toldo.position.set(0, 4.55, d / 2 + 0.9); toldo.rotation.x = 0.35; toldo.castShadow = true; g.add(toldo);
  const letrero = makeSign('Mascotienda Arcoíris', '#FF6FAE', '#FFFFFF', 11); letrero.position.set(0, 5.7, d / 2 + 0.07); g.add(letrero);
  g.add(mesh(cyl(2.2, 2.2, 0.04, 28), mat('#FFE1EE'), 0, 0.03, d / 2 + 2.6, false, true));
  world.add(g);
  addObs(x, z, w / 2 + 0.3, d / 2 + 0.3, 11);
  addZone({ id: 'mascotienda_entrar', x, z: z - d / 2 - 2.4, r: 2.2, label: '🛍️ Entrar a la Mascotienda' });
}

/* ---------- adentro ---------- */
function estante(g, x, z, largo, ry, colores, cosas) {
  // un mueble de 3 repisas (blanco con bordes de color) y cosas encima de cada repisa
  const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry; g.add(e);
  const madera = mat(tint(colores, 0.6), { emissive: tint(colores, 0.6), emissiveIntensity: 0.2 }), borde = mat(colores);
  e.add(mesh(rlo(largo, 2.4, 0.9, 0.08), madera, 0, 1.2, 0));
  for (let i = 0; i < 3; i++) e.add(mesh(rlo(largo + 0.1, 0.1, 1.0, 0.04), borde, 0, 0.5 + i * 0.75, 0.02));
  for (let i = 0; i < 3; i++) for (let k = 0; k < Math.floor(largo / 0.7); k++) {
    const cx = -largo / 2 + 0.45 + k * 0.7;
    cosas(e, cx, 0.55 + i * 0.75, 0.3, i * 7 + k);
  }
}
const botella = (e, x, y, z, n) => {
  const m = mat(RAINBOW[n % 6], { emissive: RAINBOW[n % 6], emissiveIntensity: 0.25, roughness: 0.2 });
  e.add(mesh(cyl(0.12, 0.14, 0.3, 10), m, x, y + 0.15, z)); e.add(mesh(sph(0.12, 10, 8), m, x, y + 0.32, z));
  e.add(mesh(cyl(0.04, 0.04, 0.12, 6), mat('#E7C08A'), x, y + 0.48, z));
};
const patin = (e, x, y, z, n) => {
  e.add(mesh(rlo(0.4, 0.06, 0.2, 0.03), mat(RAINBOW[n % 6]), x, y + 0.1, z));
  for (const s of [-1, 1]) { const r = mesh(cyl(0.05, 0.05, 0.22, 10), mat('#FFFFFF', { emissive: RAINBOW[(n + 2) % 6], emissiveIntensity: 0.7 }), x + s * 0.13, y + 0.05, z); r.rotation.x = Math.PI / 2; e.add(r); }
};
const globito = (e, x, y, z, n) => {
  e.add(mesh(sph(0.16, 12, 10), mat(RAINBOW[n % 6]), x, y + 0.45, z)); e.add(mesh(cyl(0.006, 0.006, 0.3, 4), mat('#FFFFFF'), x, y + 0.15, z));
};
const burbujita = (e, x, y, z) => e.add(mesh(sph(0.2, 14, 10), new THREE.MeshStandardMaterial({ color: 0xCFF2FF, transparent: true, opacity: 0.4, roughness: 0.05 }), x, y + 0.2, z, false, false));
const ala = (e, x, y, z, n) => { for (const s of [-1, 1]) { const a = mesh(sph(0.16, 10, 8), mat(['#FFD6F0', '#D6E8FF', '#E8D6FF'][n % 3], { emissive: '#B98BFF', emissiveIntensity: 0.25 }), x + s * 0.1, y + 0.25, z); a.scale.set(0.5, 1, 0.15); a.rotation.z = s * 0.5; e.add(a); } };
const pelota = (e, x, y, z, n) => e.add(mesh(sph(0.17, 12, 10), mat(RAINBOW[n % 6]), x, y + 0.17, z));

function robi() {
  // el perro robot sobre su disco volador
  const g = new THREE.Group();
  const disco = new THREE.Group(); g.add(disco);
  disco.add(mesh(cyl(0.75, 0.6, 0.14, 32), mat('#E8E6F2', { metalness: 0.5, roughness: 0.25 }), 0, 0, 0));
  disco.add(mesh(cyl(0.77, 0.77, 0.05, 32), mat('#7CF0FF', { emissive: '#3FD8FF', emissiveIntensity: 1 }), 0, 0.02, 0));
  const luz = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x7CF0FF, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  luz.position.y = -0.55; luz.rotation.x = Math.PI; disco.add(luz);
  const blanco = mat('#F7F7FB', { metalness: 0.3, roughness: 0.3 }), rosa = mat('#FF8FC7'), gris = mat('#8C8FA8', { metalness: 0.5, roughness: 0.3 });
  const perro = new THREE.Group(); perro.position.y = 0.08; g.add(perro);
  perro.add(mesh(rlo(0.5, 0.42, 0.72, 0.16), blanco, 0, 0.42, 0));
  perro.add(mesh(rlo(0.3, 0.2, 0.05, 0.05), rosa, 0, 0.46, 0.36));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => perro.add(mesh(cyl(0.06, 0.07, 0.24, 10), gris, a * 0.16, 0.12, b * 0.24)));
  const cabeza = new THREE.Group(); cabeza.position.set(0, 0.82, 0.3); perro.add(cabeza);
  cabeza.add(mesh(rlo(0.52, 0.44, 0.44, 0.14), blanco, 0, 0, 0));
  // la cara: una pantallita con ojos ^ ^ y una sonrisa
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#1B1A33'; x.fillRect(0, 0, 256, 160);
  x.strokeStyle = '#7CF0FF'; x.lineWidth = 14; x.lineCap = 'round';
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(128 + s * 52 - 22, 72); x.lineTo(128 + s * 52, 50); x.lineTo(128 + s * 52 + 22, 72); x.stroke(); }
  x.beginPath(); x.arc(128, 98, 26, 0.2, Math.PI - 0.2); x.stroke();
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
  cara.position.set(0, 0, 0.225); cabeza.add(cara);
  for (const s of [-1, 1]) { const o = mesh(cone(0.1, 0.22, 4), rosa, s * 0.19, 0.27, 0); o.rotation.z = -s * 0.3; cabeza.add(o); }
  cabeza.add(mesh(cyl(0.015, 0.015, 0.22, 6), gris, 0.1, 0.32, -0.05));
  const antena = mesh(sph(0.05, 10, 8), mat('#FF6FAE', { emissive: '#FF3FA4', emissiveIntensity: 1 }), 0.1, 0.45, -0.05); cabeza.add(antena);
  const cola = mesh(cyl(0.025, 0.035, 0.3, 8), gris, 0, 0.55, -0.42); cola.rotation.x = -0.6; perro.add(cola);
  g.userData = { disco, perro, cabeza, antena, cola, luz };
  g.traverse(o => { o.castShadow = false; });
  return g;
}

function sala({ world, addObs, addZone, onFrame }) {
  const { x: X, z: Z, w: W, d: D, h: H } = SALA, g = new THREE.Group(); g.position.set(X, 0, Z); world.add(g);
  // piso de cuadros, paredes de dos colores, techo con lámparas (sin sombras: si no, la sala queda a oscuras)
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#FFC9E3'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#C9B8FF'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64);
  const tp = new THREE.CanvasTexture(c); tp.wrapS = tp.wrapT = THREE.RepeatWrapping; tp.repeat.set(W / 2, D / 2);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tp, roughness: 0.6 }));
  piso.rotation.x = -Math.PI / 2; piso.position.y = 0.01; piso.receiveShadow = true; g.add(piso);
  // (con un poco de brillo propio: adentro el sol no llega a todas las caras, y sin esto se ven grises)
  const paredM = mat('#7FDCC4', { emissive: '#7FDCC4', emissiveIntensity: 0.3 }), zocalo = mat('#FF7FBF', { emissive: '#FF7FBF', emissiveIntensity: 0.2 });
  const pared = (px, pz, w, ry) => { const m = mesh(box(w, H, 0.3), paredM, px, H / 2, pz, false, true); m.rotation.y = ry; g.add(m); const s = mesh(box(w, 0.6, 0.34), zocalo, px, 0.3, pz, false, true); s.rotation.y = ry; g.add(s); };
  pared(0, -D / 2, W, 0); pared(-W / 2, 0, D, Math.PI / 2); pared(W / 2, 0, D, Math.PI / 2);
  pared(-W / 4 - 1, D / 2, W / 2 - 2, 0); pared(W / 4 + 1, D / 2, W / 2 - 2, 0);   // el frente, con la puerta al medio
  g.add(mesh(box(4, H - 3.6, 0.3), paredM, 0, 3.6 + (H - 3.6) / 2, D / 2, false, true));
  g.add(mesh(rlo(2.7, 3.5, 0.2, 0.1), mat('#9B6BF0'), 0, 1.75, D / 2 - 0.05, false, true));
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ color: 0xD9CCFF })); techo.rotation.x = Math.PI / 2; techo.position.y = H; g.add(techo);
  // franjas arcoíris a lo largo de las paredes, bajo el techo
  RAINBOW.forEach((c, i) => {
    const m = mat(c, { emissive: c, emissiveIntensity: 0.35 }), y = H - 0.25 - i * 0.14;
    g.add(mesh(box(W - 0.4, 0.12, 0.05), m, 0, y, -D / 2 + 0.18, false, false));
    for (const s of [-1, 1]) g.add(mesh(box(0.05, 0.12, D - 0.4), m, s * (W / 2 - 0.18), y, 0, false, false));
  });
  const lampara = mat('#FFF6D6', { emissive: '#FFE9A8', emissiveIntensity: 1 });
  // lámparas planas, pegadas al techo (la cámara pasa cerca del techo: colgando, tapaban la vista)
  for (const lx of [-7, 0, 7]) for (const lz of [-4, 3]) { const l = mesh(sph(0.4, 14, 10), lampara, lx, H - 0.04, lz, false, false); l.scale.y = 0.2; g.add(l); }
  addObs(X, Z - D / 2, W / 2, 0.3, 8); addObs(X, Z + D / 2, W / 2, 0.3, 8); addObs(X - W / 2, Z, 0.3, D / 2, 8); addObs(X + W / 2, Z, 0.3, D / 2, 8);
  addInterior({ area: [X - W / 2, X + W / 2, Z - D / 2, Z + D / 2], techo: H });
  addArea('Mascotienda Arcoíris', X - W / 2, X + W / 2, Z - D / 2, Z + D / 2);
  // la puerta de adentro: vuelve a la calle
  addZone({ id: 'mascotienda_salir', x: X, z: Z + D / 2 - 1.2, r: 1.5, label: '🚪 Salir a la calle' });

  // los pasillos: un mueble por sección (los de las paredes, de un lado; los del medio, de los dos), con su cartel
  const P = [
    { sec: 'pociones', x: -W / 2 + 0.7, ry: Math.PI / 2, cosas: botella, color: '#B98BFF', zx: -W / 2 + 2.6, cartel: '🧪 Pociones' },
    { sec: 'transporte', x: -4.5, ry: Math.PI / 2, cosas: (e, a, b, c2, n) => (n % 3 === 0 ? burbujita : n % 3 === 1 ? patin : globito)(e, a, b, c2, n), color: '#4FB6F5', zx: -2.4, cartel: '🛼 Transporte', doble: true },
    { sec: 'accesorios', x: 4.5, ry: -Math.PI / 2, cosas: ala, color: '#FF8FC7', zx: 2.4, cartel: '🎀 Accesorios', doble: true },
    { sec: 'juguetes', x: W / 2 - 0.7, ry: -Math.PI / 2, cosas: pelota, color: '#FFD23F', zx: W / 2 - 2.6, cartel: '🧸 Juguetes (¡pronto!)' },
  ];
  for (const a of P) {
    estante(g, a.x, 0, 7, a.ry, a.color, a.cosas);
    if (a.doble) estante(g, a.x + (a.ry > 0 ? -0.1 : 0.1), 0, 7, a.ry + Math.PI, a.color, a.cosas);
    addObs(X + a.x, Z, a.doble ? 0.7 : 0.5, 3.6);
    const cartel = makeSign(a.cartel, a.color, '#FFFFFF', 3.4); cartel.position.set(a.x + (a.doble ? 0 : a.ry > 0 ? 1.4 : -1.4), 4.0, 2.5); g.add(cartel);
    for (const s of [-1, 1]) g.add(mesh(cyl(0.02, 0.02, H - 4.3, 4), mat('#8C8FA8'), cartel.position.x + s * 1.3, 4.0 + (H - 4.0) / 2 + 0.2, 2.5, false, false));
    addZone({ id: 'mascotienda', x: X + a.zx, z: Z + 0.5, r: 1.7, label: `${a.cartel.split(' ')[0]} Mirar ${a.cartel.split(' ')[1].toLowerCase()}`, seccion: a.sec });
  }
  // el probador: una tarima redonda con un espejo y una cortina
  const PX = W / 2 - 2.6, PZ = D / 2 - 2.6;
  g.add(mesh(cyl(1.3, 1.4, 0.2, 32), mat('#FFE1EE'), PX, 0.1, PZ));
  const marco = mesh(rlo(1.6, 2.4, 0.12, 0.08), mat('#FFD23F'), PX + 1.5, 1.5, PZ - 0.3); marco.rotation.y = -Math.PI / 2 + 0.4; g.add(marco);
  const espejo = mesh(box(1.3, 2.1, 0.02), mat('#DDF3FF', { metalness: 0.9, roughness: 0.05 }), PX + 1.42, 1.5, PZ - 0.25, false, false); espejo.rotation.y = -Math.PI / 2 + 0.4; g.add(espejo);
  const cortina = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 3, 24, 1, true, Math.PI * 0.15, Math.PI * 0.7), new THREE.MeshStandardMaterial({ map: stripeTexture('#FF8FC7', '#FFFFFF', 12), side: THREE.DoubleSide }));
  cortina.position.set(PX, 1.7, PZ); g.add(cortina);
  const cartelP = makeSign('🪞 Probador', '#FF6FAE', '#FFFFFF', 2.6); cartelP.position.set(PX, 3.6, PZ - 1.5); g.add(cartelP);
  // (vista: el giro de la cámara de la ventana; desde el pasillo de enfrente, entre los muebles: si no, los tapan)
  addZone({ id: 'mascotienda', x: X + PX - 1.6, z: Z + PZ - 1.2, r: 1.5, label: '🪞 Probador', vista: Math.PI });
  // el mostrador y Robi
  g.add(mesh(rlo(6, 1.1, 1.2, 0.12), mat('#FFFFFF'), 0, 0.55, -D / 2 + 2.6));
  g.add(mesh(rlo(6.1, 0.12, 1.3, 0.05), mat('#FF6FAE'), 0, 1.12, -D / 2 + 2.6));
  g.add(mesh(rlo(0.5, 0.35, 0.4, 0.06), mat('#FFD23F'), -2.2, 1.35, -D / 2 + 2.6));   // la caja registradora
  const cartelR = makeSign('Robi, el vendedor', '#4FB6F5', '#FFFFFF', 3.2); cartelR.position.set(0, 4.3, -D / 2 + 0.2); g.add(cartelR);
  addObs(X, Z - D / 2 + 2.6, 3.1, 0.7);
  const R = robi(); R.position.set(0, 0.9, -D / 2 + 1.3); R.scale.setScalar(1.4); g.add(R); MASCOTIENDA.robi = R; R.userData.dynamic = true;
  addZone({ id: 'mascotienda', x: X, z: Z - D / 2 + 4.3, r: 1.8, label: '🤖 Hablar con Robi' });
  onFrame(t => {
    const u = R.userData;
    R.position.y = 0.9 + Math.sin(t * 1.6) * 0.08;   // (la cabeza de Robi, a la altura de la de Nina)
    u.disco.rotation.y = t * 0.8;
    u.perro.rotation.y = Math.sin(t * 0.7) * 0.15;
    u.cabeza.rotation.z = Math.sin(t * 1.3) * 0.08;
    u.antena.material.emissiveIntensity = Math.sin(t * 6) > 0 ? 1.2 : 0.2;
    u.cola.rotation.z = Math.sin(t * 9) * 0.6;
    u.luz.material.opacity = 0.14 + Math.sin(t * 4) * 0.05;
  });
}

function mascotienda(ctx) { fachada(ctx); sala(ctx); }

definePlace({ id: 'mascotienda', nombre: 'Mascotienda Arcoíris', articulo: 'la', orden: 100, area: manzana(AFUERA.x, AFUERA.z), build: mascotienda });

export { MASCOTIENDA };
