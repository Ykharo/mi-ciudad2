// Las casitas de las mascotas en el patio de Mi Casa (world/places/casa.js: un terreno por mascota, en el orden de
// la fila). Cada mascota que tenga una puesta (`p.extras.casa`, se elige en la Mascotienda) la tiene en su terreno,
// de su tamaño. Cuando Nina entra al patio, cada una va a su casita, entra y se acuesta asomada a la puerta; después
// de un rato le salen 💤. Al salir Nina del patio, vuelven a seguirla.
// Mientras está en su casa la mascota no sigue la fila (`p.enCasa`: main.js la saca de followChain).
import { scene } from '../engine/renderer.js';
import { labelSprite } from '../engine/textures.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { sueloSuave } from '../world/physics.js';
import { PATIO } from '../world/places/casa.js';
import { animatePet } from '../pets/models.js';
import { ES_CASA, hacerCasa, tirarCasa } from '../pets/casas.js';
import { ARTICULOS } from '../pets/catalog/articulos.js';
import { player } from './actors.js';

// lo alta que es cada especie (hasta la punta de la cabeza, en metros): la casa se hace a su medida
const ALTURA = { perro: 0.81, gato: 0.57, conejo: 0.46, unicornio: 1.6 };
const CAMINA = 3.5;
const casas = [];   // por terreno: { clave, c (la casa), zzz }
const dentro = (x, z, m = 0) => x > PATIO.area[0] - m && x < PATIO.area[1] + m && z > PATIO.area[2] - m && z < PATIO.area[3] + m;

function ponerCasas() {
  PATIO.lotes.forEach((L, i) => {
    const p = player.pets[i], id = p && p.extras && ES_CASA(p.extras.casa) ? p.extras.casa : null;
    const clave = id ? `${id}|${p.name}|${p.kind}` : '', C = casas[i] || (casas[i] = { clave: '' });
    if (C.clave === clave) return;
    if (C.c) { scene.remove(C.c.g); tirarCasa(C.c); C.c = null; C.zzz = null; }
    C.clave = clave;
    if (!id) return;
    C.c = hacerCasa(id, p.name, Math.min(2, Math.max(0.75, (ALTURA[p.kind] || 0.8) / 0.8)));
    C.c.g.position.set(L.x, 0, L.z); scene.add(C.c.g);
    C.zzz = labelSprite('💤', { scale: 0.006, bubble: true }); C.zzz.position.set(0.5, 1.6, 0.4); C.zzz.visible = false; C.c.g.add(C.zzz);
  });
}

// caminar hacia (x, z) sin chocar (adentro del patio no hay más que las casas); devuelve la distancia que falta
function caminar(p, x, z, dt) {
  const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
  let v = 0;
  if (d > 0.04) {
    const st = Math.min(d, (d > 4 ? CAMINA * 2.5 : CAMINA) * dt); p.pos.x += dx / d * st; p.pos.z += dz / d * st; v = st / Math.max(dt, 1e-4);
    p.facing += Math.atan2(Math.sin(Math.atan2(dx, dz) - p.facing), Math.cos(Math.atan2(dx, dz) - p.facing)) * Math.min(1, dt * 8);
  }
  return { d, v };
}

export function updateCasas(dt) {
  ponerCasas();
  const enPatio = state.mode === 'play' && dentro(player.pos.x, player.pos.z, player.pets.some(p => p.enCasa) ? 1.5 : 0);
  player.pets.forEach((p, i) => {
    const C = casas[i], L = PATIO.lotes[i];
    if (!enPatio || !C || !C.c || p.busca) {
      if (p.enCasa) { p.enCasa = false; if (C && C.zzz) C.zzz.visible = false; }
      return;
    }
    if (!p.enCasa) { p.enCasa = true; p.casa = { fase: 'va', t: 0 }; }
    const K = p.casa, P = p.obj, puerta = { x: L.x, z: L.z + C.c.puerta }, cama = { x: L.x, z: L.z + C.c.cama[1] };
    K.t += dt;
    let v = 0, y = 0, pose = false;
    if (K.fase === 'va') {   // primero delante de la puerta (de lejos, sin atravesar la casa)
      const r = caminar(p, puerta.x, puerta.z, dt); v = r.v;
      if (r.d < 0.1 || K.t > 12) { K.fase = 'entra'; K.t = 0; }
    } else if (K.fase === 'entra') {
      const r = caminar(p, cama.x, cama.z, dt); v = r.v;
      y = C.c.cama[0] * Math.min(1, Math.max(0, 1 - (r.d - 0.1) / Math.max(0.1, C.c.puerta - C.c.cama[1])));
      if (r.d < 0.05) {
        K.fase = 'adentro'; K.t = 0;
        const casa = ARTICULOS.find(a => a.id === p.extras.casa);
        emit('aviso', `🏠 ¡${p.name} está en su ${casa ? casa.nombre.toLowerCase() : 'casita'}!`);
      }
    } else {
      // adentro: se da vuelta hacia la puerta, se acuesta y se asoma
      y = C.c.cama[0]; pose = K.t > 0.6 ? 'acostada' : true;
      p.facing += Math.atan2(Math.sin(-p.facing), Math.cos(-p.facing)) * Math.min(1, dt * 5);
      if (C.zzz) C.zzz.visible = K.t > 6 && Math.sin(state.clock * 2) > -0.6;
      if (C.c.pom) C.c.pom.position.x = -0.32 + Math.sin(state.clock * 2.4) * 0.04;
    }
    P.root.position.set(p.pos.x, K.fase === 'va' ? sueloSuave(p, p.pos.x, p.pos.z, dt) : y, p.pos.z); P.root.rotation.y = p.facing;
    animatePet(P, state.clock + i, Math.min(3, v / 5), dt, pose);
  });
}
