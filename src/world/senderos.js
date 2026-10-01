// Senderos dentro de un lugar (el parque, la plaza): por dónde caminan los vecinos que entran (game/vecinosJuegos.js).
// Un lugar los declara con addSenderos({ area, nodos: { id: [x, z] }, aristas: [[a, b], …], entradas: [id…] }):
//   area      el rectángulo [x0, x1, z0, z1] donde rigen (adentro, los vecinos van por los senderos)
//   entradas  los nodos que están en la vereda (por ahí entran y salen)
// ruta(desde, hasta) da la lista de puntos para ir de un lugar a otro: si alguno de los dos está dentro de un área con
// senderos, pasa por ellos (por la entrada más cercana); si no, derecho.
const redes = [];

export function addSenderos({ area, nodos, aristas, entradas }) {
  const vecinos = Object.fromEntries(Object.keys(nodos).map(id => [id, []]));
  for (const [a, b] of aristas) { vecinos[a].push(b); vecinos[b].push(a); }
  redes.push({ area, nodos, vecinos, entradas });
}

const dentro = (r, x, z) => x > r.area[0] && x < r.area[1] && z > r.area[2] && z < r.area[3];
const dist = (r, id, x, z) => Math.hypot(r.nodos[id][0] - x, r.nodos[id][1] - z);
export const redEn = (x, z) => redes.find(r => dentro(r, x, z)) || null;
export function cercano(r, x, z, ids = Object.keys(r.nodos)) {
  let mejor = null, d0 = Infinity;
  for (const id of ids) { const d = dist(r, id, x, z); if (d < d0) { d0 = d; mejor = id; } }
  return mejor;
}

// el camino más corto entre dos nodos (Dijkstra; las redes son chicas)
export function camino(r, a, b) {
  const D = { [a]: 0 }, prev = {}, abiertos = new Set([a]), hechos = new Set();
  while (abiertos.size) {
    let u = null; for (const id of abiertos) if (u === null || D[id] < D[u]) u = id;
    abiertos.delete(u); hechos.add(u);
    if (u === b) break;
    for (const v of r.vecinos[u]) {
      if (hechos.has(v)) continue;
      const nd = D[u] + Math.hypot(r.nodos[u][0] - r.nodos[v][0], r.nodos[u][1] - r.nodos[v][1]);
      if (D[v] === undefined || nd < D[v]) { D[v] = nd; prev[v] = u; abiertos.add(v); }
    }
  }
  const ids = [b];
  while (ids[0] !== a && prev[ids[0]] !== undefined) ids.unshift(prev[ids[0]]);
  return ids[0] === a ? ids : [a, b];
}

// los puntos para ir de (x0, z0) a (x1, z1): por los senderos si alguno de los dos está en un área con senderos
export function ruta(x0, z0, x1, z1) {
  const rd = redEn(x0, z0), rh = redEn(x1, z1), r = rd || rh;
  if (!r) return [[x1, z1]];
  const ini = rd === r ? cercano(r, x0, z0) : cercano(r, x0, z0, r.entradas);
  const fin = rh === r ? cercano(r, x1, z1) : cercano(r, x1, z1, r.entradas);
  return [...camino(r, ini, fin).map(id => r.nodos[id]), [x1, z1]];
}

export const todasLasRedes = () => redes;
