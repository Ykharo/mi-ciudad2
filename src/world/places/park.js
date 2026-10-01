// Parque Central: pileta, bancas, resbalín y columpios.
import { THREE } from '../../engine/three.js';
import { TAU } from '../../core/math.js';
import { mat } from '../../engine/materials.js';
import { box, cyl, mesh, rlo, sph } from '../../engine/geometry.js';
import { ancla, definePlace } from '../place.js';
import { flowers, tree } from '../nature.js';

function fountain({ world, scene, addObs, onFrame }, x, z) {
  world.add(mesh(cyl(3.4, 3.6, 0.9, 32), mat('#D9D2E4'), x, 0.45, z));
  const water = mesh(cyl(3.0, 3.0, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0x6FCBFF, roughness: 0.15, emissive: 0x2E9CE0, emissiveIntensity: 0.25, transparent: true, opacity: 0.9 }), x, 0.82, z, false, false);
  world.add(water);
  world.add(mesh(cyl(0.45, 0.6, 2.0, 16), mat('#D9D2E4'), x, 1.5, z));
  world.add(mesh(cyl(1.3, 0.5, 0.4, 24), mat('#D9D2E4'), x, 2.55, z));
  addObs(x, z, 3.4, 3.4);
  // droplets
  const dm = new THREE.MeshStandardMaterial({ color: 0xBFEAFF, emissive: 0x7FD0FF, emissiveIntensity: 0.4, roughness: 0.1 });
  const drops = [];
  const grp = new THREE.Group(); grp.userData.dynamic = true; scene.add(grp);
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(sph(0.09, 6, 5), dm); grp.add(m); drops.push({ m, t: Math.random(), a: Math.random() * TAU }); }
  onFrame((t, dt) => {
    for (const d of drops) {
      d.t += dt * 0.7; if (d.t > 1) { d.t -= 1; d.a = Math.random() * TAU; }
      const r = 0.2 + d.t * 1.9, y = 2.9 + d.t * 3.2 - d.t * d.t * 5.2;
      d.m.position.set(x + Math.cos(d.a) * r, Math.max(0.85, y), z + Math.sin(d.a) * r);
    }
  });
}
function bench({ world, addObsRot, addZone }, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
  const wood = mat('#E08A4F'), iron = mat('#3C4670');
  g.add(mesh(rlo(2.6, 0.18, 0.8, 0.06), wood, 0, 0.62, 0));
  g.add(mesh(rlo(2.6, 0.7, 0.14, 0.06), wood, 0, 1.1, -0.38));
  [-1, 1].forEach(s => g.add(mesh(rlo(0.14, 0.62, 0.7, 0.04), iron, s * 1.1, 0.31, 0)));
  world.add(g); addObsRot(x, z, 2.6, 0.9, ry);
  addZone({ id: 'bench', x: x + Math.sin(ry) * 1.0, z: z + Math.cos(ry) * 1.0, r: 1.5, label: '🪑 Sentarse', bench: { x, z, ry } });
}
// Un columpio es un péndulo: ángulo (+ = el asiento hacia adelante, hacia +z del ancla) y velocidad. Quien va sentada
// lo impulsa con `asiento.userData.impulso` (−1…1) y avisa que está con `ocupado` (los pone game/juegos.js): empujar
// hacia donde va le da energía, al revés lo frena. Sube hasta unos 65°; vacío se va calmando solo.
const GRAV = 9.8, LARGO = 2.2, IMPULSO = 0.38, TOPE = GRAV / LARGO * (1 - Math.cos(1.15));
function columpio(asiento, pv, angulo, onFrame) {
  const S = Object.assign(asiento.userData, { angulo, vel: 0, impulso: 0, largo: LARGO });
  onFrame((t, dt) => {
    const n = 4, h = dt / n;
    for (let k = 0; k < n; k++) {
      const energia = 0.5 * S.vel * S.vel + GRAV / LARGO * (1 - Math.cos(S.angulo));
      // empujar a favor da energía sólo hasta el tope; en contra siempre frena
      const empuje = S.impulso * IMPULSO * (S.impulso * S.vel > 0 ? Math.max(0, 1 - energia / TOPE) : 1);
      const roce = S.ocupado ? 0.07 : 0.25;
      S.vel += (-GRAV / LARGO * Math.sin(S.angulo) - roce * S.vel + empuje) * h;
      S.angulo += S.vel * h;
    }
    pv.rotation.x = -S.angulo;   // rotation.x positiva lleva el asiento hacia −z
  });
}

function park(ctx) {
  const { world, addObs, addZone, onFrame } = ctx, cx = -20, cz = -20;
  world.add(mesh(cyl(7.2, 7.2, 0.04, 40), mat('#F3E4C6', { roughness: 1 }), cx, 0.025, cz, false, true));
  world.add(mesh(box(29, 0.035, 2.6), mat('#F3E4C6', { roughness: 1 }), cx, 0.022, cz, false, true));
  world.add(mesh(box(2.6, 0.035, 29), mat('#F3E4C6', { roughness: 1 }), cx, 0.023, cz, false, true));
  fountain(ctx, cx, cz);
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => bench(ctx, cx + a * 5.2, cz + b * 5.2, Math.atan2(-a, -b)));
  // flower beds
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b], i) => {
    const fx = cx + a * 9.5, fz = cz + b * 9.5;
    world.add(mesh(cyl(2.2, 2.3, 0.3, 24), mat('#8A6246'), fx, 0.15, fz));
    flowers(fx, fz, 3.2, 3.2, 26, 11 + i);
  });
  // slide
  const sl = new THREE.Group(); sl.position.set(cx - 10, 0, cz + 3); sl.rotation.y = Math.PI / 2;
  [-1, 1].forEach(s => [-1, 1].forEach(t => sl.add(mesh(cyl(0.1, 0.1, 2.6, 8), mat('#4FB6F5'), s * 0.6, 1.3, t * 0.6 - 1.4))));
  sl.add(mesh(rlo(1.5, 0.2, 1.5, 0.06), mat('#FFD23F'), 0, 2.5, -1.4));
  // la escalera: peldaños cada 0,45 m entre dos pasamanos que siguen hacia arriba (para agarrarse hasta llegar arriba;
  // las medidas las usa la animación "subir_escalera", tools/animaciones/juegos.mjs)
  for (let i = 0; i < 5; i++) sl.add(mesh(box(0.76, 0.08, 0.12), mat('#FFFFFF'), 0, 0.45 + i * 0.45, -2.1));
  [-1, 1].forEach(s => {
    sl.add(mesh(cyl(0.05, 0.05, 3.9, 8), mat('#FFD23F'), s * 0.38, 1.95, -2.1));
    sl.add(mesh(sph(0.1, 10, 8), mat('#FF6FAE'), s * 0.38, 3.92, -2.1));
  });
  const ramp = mesh(rlo(1.2, 0.14, 4.0, 0.06), mat('#FF6FAE'), 0, 1.35, 1.0); ramp.rotation.x = 0.62; sl.add(ramp);
  [-1, 1].forEach(s => { const rail = mesh(rlo(0.1, 0.3, 4.0, 0.04), mat('#FF6FAE'), s * 0.6, 1.5, 1.0); rail.rotation.x = 0.62; sl.add(rail); });
  world.add(sl); addObs(cx - 10, cz + 3, 2.0, 1.0);
  // sube por la escalera (los peldaños en z −2,1, cada 0,45 m: el ancla queda 0,14 m antes, ver game/juegos.js), se
  // sienta arriba de la rampa y baja hasta abajo (la rampa va de z −0,6 a 2,6 en el grupo, a 2,5–0,2 m). De pie: los
  // pies sobre la rampa (`pieArriba` → `pieAbajo`, sobre la superficie y sin inclinar)
  const opciones = [{ id: 'sentada', label: '🎢 Tirarse por el tobogán' }, { id: 'de_pie', label: '🏄 Tirarse de pie' }];
  addZone({ id: 'juego', x: cx - 13, z: cz + 3, r: 1.8, label: opciones[0].label, opciones, juego: {
    tipo: 'tobogan', vista: -1.0, escalera: ancla(sl, 0, 0, -2.24), arriba: ancla(sl, 0, 2.62, -0.7, 0, 0.4), abajo: ancla(sl, 0, 0.3, 2.7, 0, 0.4),
    pieArriba: ancla(sl, 0, 2.36, -0.3), pieAbajo: ancla(sl, 0, 0.3, 2.6), salida: ancla(sl, 0, 0, 4.2) } });
  // swings (gently moving)
  const sx = cx + 5.8, sz = cz - 10;
  const frameM = mat('#FF9B4A');
  [-1, 1].forEach(s => { [-1, 1].forEach(t => { const leg = mesh(cyl(0.1, 0.1, 3.4, 8), frameM, sx + s * 2.4, 1.6, sz + t * 0.7); leg.rotation.x = -t * 0.22; world.add(leg); }); });
  const beam = mesh(cyl(0.12, 0.12, 5.0, 10), frameM, sx, 3.25, sz); beam.rotation.z = Math.PI / 2; world.add(beam);
  // los obstáculos son sólo los postes: entre ellos se pasa (y se sale volando al saltar del columpio)
  [-1, 1].forEach(s => addObs(sx + s * 2.4, sz, 0.25, 0.9));
  const columpios = { tipo: 'columpio', vista: -Math.PI / 2 + 0.3, asientos: [] };   // la cámara de costado (del lado sin árboles): se ve el vaivén
  [-1, 1].forEach((s, i) => {
    const pv = new THREE.Group(); pv.position.set(sx + s * 1.1, 3.2, sz); pv.userData.dynamic = true;
    [-1, 1].forEach(k => pv.add(mesh(cyl(0.025, 0.025, 2.3, 5), mat('#6D5A4A'), k * 0.35, -1.15, 0)));
    pv.add(mesh(rlo(0.9, 0.1, 0.45, 0.04), mat(i ? '#FF6FAE' : '#4FB6F5'), 0, -2.3, 0));
    const asiento = ancla(pv, 0, -2.2, 0);   // mirando hacia el centro del parque (+z)
    columpios.asientos.push(asiento);
    world.add(pv);
    columpio(asiento, pv, i ? -0.18 : 0.25, onFrame);
  });
  const opcionesColumpio = [{ id: 'sentada', label: '🙌 Columpiarse' }, { id: 'de_pie', label: '🧍 Columpiarse de pie' }];
  addZone({ id: 'juego', x: sx, z: sz, r: 2.4, label: opcionesColumpio[0].label, opciones: opcionesColumpio, juego: columpios });
  // trees around
  [[-12, -12], [12, -12], [-12, 12], [12, 12], [-12.5, -6], [-6, -12.5], [13, 5]].forEach(([a, b], i) => tree(cx + a, cz + b, 1 + (i % 3) * 0.12, i % 3 === 0 ? 1 : 0));
}

definePlace({ id: 'parque', nombre: 'Parque Central', orden: 50, area: [-34.5, -5.5, -34.5, -5.5], build: park });

export { bench };   // la plaza de juegos también tiene bancas
