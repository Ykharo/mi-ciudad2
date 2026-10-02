// Encargos de lectura: se gana Huesitos 🦴 leyendo.
//   Cartelera de la Plaza (world/places/plaza.js, zona 'cartelera'): 3 notas para leer y elegir una. La nota dice qué
//   llevar, a quién y a dónde: no hay flechas. Mientras hay un encargo, el botón 📜 vuelve a mostrarla.
//   Personas (vecinos parados en su lugar, zona 'encargo'): Tito el mecánico (Autos Arcoíris), Rosa (Refugio), Beto
//   el heladero (Heladería) y Sofía (Plaza, junto a la cartelera); Robi en la Mascotienda (su zona, con `robi`).
//   Pasos: 'elegir' (una pregunta: los sabores del helado, cuántos huesos; se responde leyendo), 'entregar',
//   'invitaciones' (a cada una de una lista, en cualquier orden) y 'caja': la caja fuerte del pago, con el criptex
//   (ui/codigoAura.js, evento 'aura' con origen 'caja'): la clave son las 3 palabras de la P.D. de la nota.
//   Pago: lo de cada encargo, +5 si no se equivocó de persona ni de respuesta, +5 si no usó 🔊 para leer la nota.
// Carta de Robi: una por día en el buzón de Mi Casa (world/places/casa.js); se lee y se responde una pregunta. Seguidos
// día tras día suman racha (más Huesitos). Se guarda `player.carta = { ultima, racha }` (game/save.js).
// La interfaz (ui/panels/encargos.js) escucha el evento 'encargo' { que: 'cartelera' | 'nota' | 'elegir' | 'carta' |
// 'boton' } y llama a las funciones exportadas.
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { pick } from '../core/math.js';
import { labelSprite } from '../engine/textures.js';
import { addObs } from '../world/physics.js';
import { addZone, onZoneAction } from '../world/zones.js';
import { BUZON } from '../world/places/casa.js';
import { NINA_SCALE, makeAvatar } from '../characters/avatar.js';
import { avatarDo, updateAvatar } from '../characters/animator.js';
import { setHolding } from '../characters/props.js';
import { player } from './actors.js';
import { nuevoCodigo, revisar } from './codigoAura.js';
import { CARTAS } from './cartas.js';
import { ganarHuesitos } from './huesitos.js';
import { enterMenu, leaveMenu } from './modes.js';
import { lookVecinos } from './npcs.js';
import { standUp } from './player.js';
import { save } from './save.js';

/* ---------- las personas ---------- */
// (look: uno de los vecinos, que ya está cargado; mira: hacia dónde, 0 = +z)
const PERSONAS = {
  tito: { nombre: 'Tito', donde: 'Autos Arcoíris', look: 1, x: 68.5, z: -21.2, mira: 0, hola: '¡Hola! Aquí arreglo los autos.' },
  rosa: { nombre: 'Rosa', donde: 'el Refugio', look: 3, x: 20.5, z: 11.0, mira: Math.PI, hola: '¡Hola! Cuido a los animalitos del Refugio.' },
  beto: { nombre: 'Beto', donde: 'la Heladería', look: 5, x: -21.0, z: 10.3, mira: Math.PI, hola: '¡Hola! ¿Quieres un helado?' },
  sofia: { nombre: 'Sofía', donde: 'la Plaza', look: 6, x: 50.4, z: 28.4, mira: -Math.PI / 2, hola: '¡Hola! Mira la cartelera: hay encargos.' },
};
const SIN_ENCARGO = '¡Hola! En la cartelera de la Plaza de Juegos hay encargos para ganar Huesitos.';
export function crearPersonas() {
  const looks = lookVecinos(7);
  for (const [id, p] of Object.entries(PERSONAS)) {
    p.ch = makeAvatar(JSON.parse(JSON.stringify(looks[p.look])));
    p.ch.root.position.set(p.x, 0, p.z); p.ch.root.rotation.y = p.mira;
    const nombre = labelSprite(p.nombre, { scale: 0.0042 }); nombre.position.y = 2.35 * p.ch.k / NINA_SCALE + 0.35; p.ch.root.add(nombre);
    addObs(p.x, p.z, 0.35, 0.35);
    addZone({ id: 'encargo', x: p.x + Math.sin(p.mira) * 1.2, z: p.z + Math.cos(p.mira) * 1.2, r: 1.7, label: `💬 Hablar con ${p.nombre}`, persona: id });
  }
}
let globos = [];
function decir(id, texto) {
  const p = PERSONAS[id];
  emit('aviso', `${id === 'robi' ? '🤖 Robi' : p.nombre}: ${texto}`); emit('sonido', 'pop');
  if (!p || !p.ch) return;
  if (p.globo) p.ch.root.remove(p.globo);
  p.globo = labelSprite(texto.length > 34 ? texto.slice(0, 32) + '…' : texto, { bubble: true, scale: 0.0058 }); p.globo.position.y = 2.35 * p.ch.k / NINA_SCALE + 0.7; p.ch.root.add(p.globo);
  p.ch.root.rotation.y = Math.atan2(player.pos.x - p.x, player.pos.z - p.z);
  avatarDo(p.ch, 'wave', { start: 0.1 });
  globos = globos.filter(g => g.id !== id); globos.push({ id, t: 4.5 });
}
export function updateEncargos(dt) {
  for (const p of Object.values(PERSONAS)) if (p.ch) updateAvatar(p.ch, dt, 0, null);
  for (const g of [...globos]) if ((g.t -= dt) <= 0) {
    const p = PERSONAS[g.id]; if (p.globo) p.ch.root.remove(p.globo); p.globo = null; p.ch.root.rotation.y = p.mira;
    globos.splice(globos.indexOf(g), 1);
  }
  // la banderita del buzón: arriba si hay carta nueva
  if (BUZON.bandera) BUZON.bandera.rotation.z += ((cartaNueva() ? 0 : -Math.PI / 2) - BUZON.bandera.rotation.z) * Math.min(1, dt * 4);
}

/* ---------- los encargos ---------- */
const NUMEROS = ['dos', 'tres', 'cuatro', 'cinco'];
const SABORES = ['frutilla', 'menta', 'chocolate', 'vainilla', 'mora', 'mango'];
const COLOR_SABOR = { frutilla: '#FF9CC7', chocolate: '#7A4A30', menta: '#8FE3C5', vainilla: '#FFF5DE', mora: '#B89CFF', mango: '#FFD23F' };
const pd = c => `P.D.: Tu pago está en mi caja fuerte. La clave es: ${c.palabras.map(p => p.palabra.toUpperCase()).join(', ')}.`;
const lista = ids => ids.map(id => `${PERSONAS[id] ? PERSONAS[id].nombre : 'Robi'}, de ${id === 'robi' ? 'la Mascotienda' : PERSONAS[id].donde}`);
const HACER = {
  helado() {
    const [a, b] = [...SABORES].sort(() => Math.random() - 0.5);
    return {
      titulo: 'El antojo del mecánico', ic: '🍦', de: 'tito', pago: 25,
      texto: `¡Hola! Soy Tito, el mecánico de Autos Arcoíris. ¡Hace mucho calor en el taller! ¿Me traes un helado de dos bolas: una de ${a} y una de ${b}? Te espero en la puerta de la tienda de autos.`,
      pasos: [
        { persona: 'beto', tipo: 'elegir', pregunta: '¡Hola! ¿Qué sabores te sirvo? Elige los dos que pide la nota.', opciones: SABORES, correctas: [a, b],
          mal: '¡Uy! Esos no son los sabores de la nota. Léela otra vez.', bien: `¡Aquí tienes! Un helado de ${a} y ${b}.`, da: () => { setHolding(player.ch, COLOR_SABOR[a]); player.iceTime = 0; } },
        { persona: 'tito', tipo: 'entregar', bien: '¡Gracias! ¡Justo los sabores que quería!' },
        { persona: 'tito', tipo: 'caja' },
      ],
    };
  },
  refugio() {
    const n = pick(NUMEROS);
    return {
      titulo: 'Comida para el refugio', ic: '🦴', de: 'rosa', pago: 25,
      texto: `Soy Rosa, del Refugio de Mascotas. Los perritos tienen hambre y se acabaron sus huesos. Ve a la Mascotienda, pídele a Robi ${n} huesos y tráelos al Refugio. ¡Muchas gracias!`,
      pasos: [
        { persona: 'robi', tipo: 'elegir', pregunta: '¡Bip bip! Rosa me avisó que vendrías. ¿Cuántos huesos necesitas?', opciones: ['uno', ...NUMEROS], correctas: [n],
          mal: '¡Bip! Ese número no es el de la nota. Léela otra vez.', bien: `¡Bip bip! Aquí tienes ${n} huesos para el Refugio.` },
        { persona: 'rosa', tipo: 'entregar', bien: '¡Qué felices van a estar los perritos! ¡Gracias!' },
        { persona: 'rosa', tipo: 'caja' },
      ],
    };
  },
  cumple() {
    const para = ['tito', 'rosa', 'beto', 'robi'].sort(() => Math.random() - 0.5).slice(0, 3);
    const l = lista(para);
    return {
      titulo: 'Invitaciones de cumpleaños', ic: '🎂', de: 'sofia', pago: 40,
      texto: `¡Voy a cumplir 9 años! Soy Sofía. ¿Me ayudas a repartir mis invitaciones? Son para ${l[0]}; para ${l[1]}, y para ${l[2]}. Cuando termines, vuelve a la Plaza de Juegos.`,
      pasos: [
        { persona: para, tipo: 'invitaciones', bien: '¡Una invitación para mí! ¡Ahí estaré!', mal: 'Mmm… mi nombre no está en la lista de invitaciones. Lee la nota otra vez.' },
        { persona: 'sofia', tipo: 'caja' },
      ],
    };
  },
};
const ORDEN = ['helado', 'refugio', 'cumple'];
let actual = null;   // { id, titulo, ic, de, pago, texto, pasos, paso, codigo, errores, ayuda, entregadas }
const disponibles = {};
function preparar(id) {
  const e = HACER[id](), codigo = nuevoCodigo({ figuras: 4 });
  return { id, ...e, codigo, nota: `${e.texto}\n\n${pd(codigo)}`, paso: 0, errores: 0, ayuda: false, entregadas: [] };
}
// la cartelera: las 3 notas (se arman al mirarla; quedan iguales hasta que se haga una)
export function verCartelera() {
  for (const id of ORDEN) if (!disponibles[id]) disponibles[id] = preparar(id);
  enterMenu('encargo');
  emit('encargo', { que: 'cartelera', notas: ORDEN.map(id => disponibles[id]), actual });
}
export function aceptar(id) {
  if (actual || !disponibles[id]) return;
  actual = disponibles[id]; disponibles[id] = null;
  emit('encargo', { que: 'boton', visible: true });
  emit('aviso', `📜 ¡Aceptaste el encargo "${actual.titulo}"! Lee bien la nota.`); emit('sonido', 'adopt');
}
export function dejar() {
  if (!actual) return;
  if (actual.id === 'helado') setHolding(player.ch, null);
  actual = null; emit('encargo', { que: 'boton', visible: false });
}
export function verNota() { if (!actual) return; enterMenu('encargo'); emit('encargo', { que: 'nota', encargo: actual }); }
export function usoAyuda() { if (actual) actual.ayuda = true; }
export function cerrarPanel() { if (state.mode === 'encargo') leaveMenu(); }
export const encargoActual = () => actual;

// hablar con una persona (también Robi, desde su zona en la Mascotienda: devuelve true si había algo para él)
export function hablar(id) {
  standUp(); player.vel.set(0, 0, 0);
  if (PERSONAS[id]) player.facing = Math.atan2(PERSONAS[id].x - player.pos.x, PERSONAS[id].z - player.pos.z);
  const P = actual && actual.pasos[actual.paso];
  const paraMi = P && (Array.isArray(P.persona) ? P.persona.includes(id) || id === actual.de : P.persona === id);
  if (!actual) { if (id === 'robi') return false; decir(id, PERSONAS[id].hola + (id === 'sofia' ? '' : ' ' + SIN_ENCARGO)); return true; }
  if (!paraMi) {
    if (id === 'robi') return false;   // (Robi abre la tienda como siempre)
    actual.errores++;
    decir(id, id === actual.de ? '¡Gracias por ayudarme! ¿Ya hiciste lo que dice la nota?' : 'Mmm… creo que esto no es para mí. Lee la nota otra vez.');
    return true;
  }
  if (P.tipo === 'elegir') { enterMenu('encargo'); emit('encargo', { que: 'elegir', pregunta: P.pregunta, opciones: P.opciones, cuantas: P.correctas.length, quien: id === 'robi' ? 'Robi' : PERSONAS[id].nombre }); return true; }
  if (P.tipo === 'entregar') { if (actual.id === 'helado') setHolding(player.ch, null); decir(id, P.bien); siguiente(); return true; }
  if (P.tipo === 'invitaciones') {
    if (id === actual.de) { decir(id, '¿Ya repartiste todas las invitaciones? Lee la nota: dice a quién.'); return true; }
    if (actual.entregadas.includes(id)) { decir(id, '¡Ya me diste la invitación! Gracias.'); return true; }
    actual.entregadas.push(id); decir(id, P.bien);
    const faltan = P.persona.length - actual.entregadas.length;
    emit('aviso', faltan ? `💌 ¡Entregaste una invitación! Te faltan ${faltan}.` : '💌 ¡Repartiste todas! Vuelve donde Sofía, a la Plaza.');
    if (!faltan) siguiente();
    return true;
  }
  if (P.tipo === 'caja') abrirCaja(id);
  return true;
}
onZoneAction('encargo', z => hablar(z.persona));
onZoneAction('cartelera', () => verCartelera());

// la respuesta de una pregunta ('elegir'): las opciones elegidas
export function responder(elegidas) {
  const P = actual && actual.pasos[actual.paso]; if (!P || P.tipo !== 'elegir') return false;
  const ok = elegidas.length === P.correctas.length && P.correctas.every(c => elegidas.includes(c));
  const quien = P.persona;
  if (!ok) { actual.errores++; emit('sonido', 'bonk'); emit('aviso', `${quien === 'robi' ? '🤖 Robi' : PERSONAS[quien].nombre}: ${P.mal}`); return false; }
  cerrarPanel();
  if (quien === 'robi') emit('aviso', `🤖 Robi: ${P.bien}`); else decir(quien, P.bien);
  emit('sonido', 'adopt');
  if (P.da) P.da();
  siguiente();
  return true;
}
function siguiente() { actual.paso++; }

/* ---------- la caja fuerte (el pago) ---------- */
let caja = null;
function abrirCaja(id) {
  caja = { id };
  decir(id, '¡Gracias! Tu pago está en mi caja fuerte. Ábrela con la clave de la nota.');
  enterMenu('caja');
  emit('aura', { que: 'codigo', origen: 'caja', palabras: actual.codigo.palabras, anillos: actual.codigo.anillos, oculto: true });
}
export function responderCaja(ids) {
  if (!caja || !actual) return;
  const res = revisar(actual.codigo, ids);
  if (!res.every(Boolean)) { actual.errores++; emit('aura', { que: 'error', res }); emit('sonido', 'bonk'); return; }
  const bonos = (actual.errores ? 0 : 5) + (actual.ayuda ? 0 : 5), total = actual.pago + bonos;
  emit('aura', { que: 'acierto', puntos: `+${total} 🦴` }); emit('sonido', 'adopt');
  const titulo = actual.titulo, sinErrores = !actual.errores;
  actual = null; caja = null; emit('encargo', { que: 'boton', visible: false });
  setTimeout(() => {
    emit('aura', { que: 'cerrar' }); if (state.mode === 'caja') leaveMenu();
    ganarHuesitos(total, sinErrores ? `¡"${titulo}" perfecto!` : `¡Terminaste "${titulo}"!`);
  }, 2600);
}
export function cerrarCaja() { if (!caja) return; caja = null; emit('aura', { que: 'cerrar' }); if (state.mode === 'caja') leaveMenu(); }

/* ---------- la carta de Robi (una por día) ---------- */
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const cartaDeHoy = () => CARTAS[Math.floor(Date.now() / 86400000) % CARTAS.length];
const cartaNueva = () => !player.carta || player.carta.ultima !== hoy();
export function cargarCartas(saved) {
  const c = saved && saved.carta;
  player.carta = c && typeof c.ultima === 'string' && Number.isFinite(+c.racha) ? { ultima: c.ultima, racha: Math.max(0, Math.min(999, Math.floor(+c.racha))) } : null;
}
let intentosCarta = 0;
export function abrirBuzon() {
  standUp(); player.vel.set(0, 0, 0);
  if (!cartaNueva()) { emit('aviso', '📬 El buzón está vacío. ¡Mañana llega otra carta de Robi!'); emit('sonido', 'pop'); return; }
  intentosCarta = 0; enterMenu('encargo');
  const c = cartaDeHoy();
  emit('encargo', { que: 'carta', texto: c.texto, pregunta: c.pregunta, opciones: c.opciones, racha: player.carta && player.carta.ultima === ayer() ? player.carta.racha : 0 });
}
onZoneAction('buzon', abrirBuzon);
export function responderCarta(opcion) {
  if (!cartaNueva()) return true;
  const c = cartaDeHoy();
  if (opcion !== c.opciones[0]) { intentosCarta++; emit('sonido', 'bonk'); return false; }
  const racha = player.carta && player.carta.ultima === ayer() ? player.carta.racha + 1 : 1;
  player.carta = { ultima: hoy(), racha }; save();
  const n = Math.max(5, 10 - intentosCarta * 3) + Math.min(racha - 1, 5) * 2;
  cerrarPanel();
  ganarHuesitos(n, racha > 1 ? `¡Carta leída! ${racha} días seguidos 🔥` : '¡Leíste la carta de Robi!');
  return true;
}
