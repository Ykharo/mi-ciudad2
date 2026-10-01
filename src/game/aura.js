// La competencia de farmear aura en el Escenario del Aura (world/places/escenario_aura.js). Etapa A: el jurado (3) y
// el público (5) sentados en su lugar, la zona "Competir" (todavía sólo avisa) y las pistas de dónde queda el
// escenario, que da quien lee el cartel (game/cartel.js). Las pistas salen de la posición del escenario: si se cambia
// de lugar, siguen siendo ciertas.
import { emit } from '../core/events.js';
import { seeded } from '../core/math.js';
import { LINES, STREET } from '../world/layout.js';
import { places } from '../world/place.js';
import { onZoneAction } from '../world/zones.js';
import { ESCENARIO } from '../world/places/escenario_aura.js';
import { makeAvatar } from '../characters/avatar.js';
import { randomLook } from '../characters/looks.js';
import { avatarDo, updateAvatar } from '../characters/animator.js';

/* ---------- jurado y público ---------- */
const sentados = [];
// sus looks se sortean antes de cargar los personajes (main.js), como los de los vecinos: siempre los mismos
function lookPublico() {
  const r = seeded(2468);
  return [...ESCENARIO.jurado, ...ESCENARIO.publico].map(() => randomLook(r));
}
// sentados con la pose final de "sit": las caderas en el puesto (0,158 arriba y 0,10 atrás de la raíz)
function crearPublico(looks) {
  [...ESCENARIO.jurado, ...ESCENARIO.publico].forEach((p, i) => {
    const c = makeAvatar(looks[i]), k = c.k;
    c.root.position.set(p.x + Math.sin(p.mira) * 0.10 * k, p.alto - 0.158 * k, p.z + Math.cos(p.mira) * 0.10 * k);
    c.root.rotation.y = p.mira;
    avatarDo(c, 'sit', { start: 9, instant: true, stopOnMove: false });
    sentados.push(c);
  });
}
// sólo se anima a quien se ve (cullAvatars los esconde lejos o fuera de la cámara)
function updatePublico(dt) { for (const c of sentados) if (c.model.visible) updateAvatar(c, dt, 0, null); }

/* ---------- la zona de la tarima ---------- */
onZoneAction('aura', () => {
  emit('aviso', '😎 ¡Muy pronto! La competencia de farmear aura se está preparando');
  emit('sonido', 'pop');
});

/* ---------- pistas para encontrar el escenario ---------- */
const lugar = p => p.articulo === 'el' ? `el ${p.nombre}` : p.articulo ? `${p.articulo} ${p.nombre}` : p.nombre;
const frenteA = p => p.articulo === 'el' ? `frente al ${p.nombre}` : `frente a ${lugar(p)}`;
const laCalle = nombre => (nombre.startsWith('Paseo') ? `el ${nombre}` : `la ${nombre}`);
const enLa = nombre => `en ${laCalle(nombre)}`;
const centro = a => ({ x: (a[0] + a[1]) / 2, z: (a[2] + a[3]) / 2 });

// la calle más cercana al escenario y, si hay, el lugar que queda al otro lado de esa calle
function vecindario() {
  const E = ESCENARIO;
  let calle = null;
  for (const L of LINES) {
    if (!calle || Math.abs(E.x - L) < calle.d) calle = { d: Math.abs(E.x - L), eje: 'x', L, nombre: STREET.x[L] };
    if (Math.abs(E.z - L) < calle.d) calle = { d: Math.abs(E.z - L), eje: 'z', L, nombre: STREET.z[L] };
  }
  const yo = places.find(p => p.id === 'escenario'), mio = yo.area;
  let enfrente = null, mejor = Infinity;
  for (const p of places) {
    if (p === yo || !p.area) continue;
    const c = centro(p.area), a = p.area;
    // al otro lado de la calle, y frente a frente (las manzanas se solapan a lo largo de la calle)
    const cruza = calle.eje === 'z' ? (c.z - calle.L) * (E.z - calle.L) < 0 && a[0] < mio[1] && a[1] > mio[0]
      : (c.x - calle.L) * (E.x - calle.L) < 0 && a[2] < mio[3] && a[3] > mio[2];
    const d = Math.hypot(c.x - E.x, c.z - E.z);
    if (cruza && d < mejor) { mejor = d; enfrente = p; }
  }
  return { calle, enfrente, yo };
}

// hacia dónde queda, para alguien parado en `desde` mirando hacia `mira` (el cartel)
function direccion(desde, mira) {
  const dx = ESCENARIO.x - desde.x, dz = ESCENARIO.z - desde.z;
  const adelante = dx * Math.sin(mira) + dz * Math.cos(mira), derecha = -dx * Math.cos(mira) + dz * Math.sin(mira);
  const a = Math.atan2(derecha, adelante) * 180 / Math.PI, lado = a > 0 ? 'a la derecha' : 'a la izquierda', b = Math.abs(a);
  const donde = b < 25 ? 'derecho, más allá del cartel' : b < 65 ? `adelante y ${lado}` : b < 115 ? lado : b < 155 ? `atrás y ${lado}` : 'detrás de ti';
  return { donde, metros: Math.max(10, Math.round(Math.hypot(dx, dz) / 10) * 10) };
}

// Las pistas, en orden (quien lee el cartel da una distinta cada vez que se le pregunta). `corta` va en su globo,
// `larga` en el aviso.
function pistasEscenario(desde, mira) {
  const { calle, enfrente, yo } = vecindario(), { donde, metros } = direccion(desde, mira);
  const pistas = [
    { corta: `¡${enLa(calle.nombre).replace(/^en/, 'En')}!`, larga: `«¡Es en ${lugar(yo)}, ${enLa(calle.nombre)}!»` },
    { corta: '¡Por allá!', larga: `«Párate mirando el cartel: queda ${donde}, a unos ${metros} metros.»` },
    { corta: '¡Tiene focos de colores!', larga: '«Busca los focos de colores y la pantalla gigante: ¡se ven desde lejos!»' },
  ];
  if (enfrente) pistas.splice(1, 0, { corta: `¡${frenteA(enfrente).replace(/^f/, 'F')}!`, larga: `«Queda ${frenteA(enfrente)}, cruzando ${laCalle(calle.nombre)}.»` });
  return pistas;
}

export { crearPublico, lookPublico, pistasEscenario, updatePublico };
