// Catálogo de autos y validación de diseños guardados.
import { pick } from '../core/math.js';
import { RAINBOW } from '../engine/materials.js';
import { svgI } from '../ui/widgets.js';
import { carBuggy, carCamioneta, carClasico, carDeportivo, carDescapotable, carJeep, carKarting, carMonster } from './models.js';

/* ================= CARS: models, paint, wheels, decorations ================= */
const CAR_COLORS = ['#FF6FAE', '#FF4F5E', '#FF9B4A', '#FFD23F', '#7BD85A', '#34CFA0', '#8FE3C5', '#4FB6F5', '#5B6CF0', '#A77BF3', '#C9A0E8', '#F7B7D2', '#FFFFFF', '#2E3350'];

const CAR_TYPES = [
  { id: 'clasico', name: 'Clásico', desc: 'Redondito y con techo. ¡El favorito de la ciudad!', vel: 3, giro: 3, stats: { max: 15, acc: 8, turn: 2.2, bounce: 1, pitch: 1 }, build: carClasico },
  { id: 'descapotable', name: 'Descapotable', desc: 'Sin techo, para sentir el viento en el pelo.', vel: 4, giro: 3, stats: { max: 17, acc: 9, turn: 2.3, bounce: 0.8, pitch: 1.1 }, build: carDescapotable },
  { id: 'jeep', name: 'Jeep', desc: 'Ruedas grandes y barra de seguridad. ¡A la aventura!', vel: 3, giro: 2, stats: { max: 14, acc: 8, turn: 2.0, bounce: 1.6, pitch: 0.85 }, build: carJeep },
  { id: 'buggy', name: 'Buggy', desc: 'Liviano y saltarín, como para correr en la playa.', vel: 4, giro: 4, stats: { max: 16.5, acc: 11, turn: 2.6, bounce: 2.2, pitch: 1.2 }, build: carBuggy },
  { id: 'deportivo', name: 'Deportivo', desc: 'El más rápido de todos. ¡Tiene alerón!', vel: 5, giro: 4, stats: { max: 22, acc: 12, turn: 2.4, bounce: 0.5, pitch: 1.3 }, build: carDeportivo },
  { id: 'camioneta', name: 'Camioneta', desc: 'Con una caja atrás para llevar cosas.', vel: 2, giro: 2, stats: { max: 13.5, acc: 7, turn: 1.9, bounce: 1.2, pitch: 0.8 }, build: carCamioneta },
  { id: 'monster', name: 'Monster truck', desc: '¡Ruedas gigantes! Se ve toda la ciudad desde arriba.', vel: 2, giro: 2, stats: { max: 13, acc: 7, turn: 1.9, bounce: 3, pitch: 0.7 }, build: carMonster },
  { id: 'karting', name: 'Karting', desc: 'Bajito y ágil. ¡Gira como un trompo!', vel: 4, giro: 5, stats: { max: 18, acc: 14, turn: 3.0, bounce: 0.6, pitch: 1.5 }, build: carKarting }
];
const CAR_TYPE = Object.fromEntries(CAR_TYPES.map(t => [t.id, t]));
const DECALS = [
  { id: 'ninguno', name: 'Liso' }, { id: 'rayas', name: 'Rayas de carrera', ic: '🏁' }, { id: 'llamas', name: 'Llamas', ic: '🔥' },
  { id: 'corazones', name: 'Corazones', ic: '💖' }, { id: 'estrellas', name: 'Estrellas', ic: '⭐' }, { id: 'lunares', name: 'Lunares', ic: '⚪' },
  { id: 'arcoiris', name: 'Arcoíris', ic: '🌈' }, { id: 'vaca', name: 'Vaquita', ic: '🐄' }, { id: 'numero', name: 'Número', ic: '🔢' }
];
const rimIc = b => svgI(56, 28, `<circle cx="28" cy="14" r="12.5" fill="#2B2F45"/>${b}`);
const five = f => [0, 1, 2, 3, 4].map(f).join('');
const RIMS = [
  { id: 'clasica', name: 'Clásicas', ic: rimIc('<circle cx="28" cy="14" r="6.5" fill="#fff"/><rect x="26.5" y="8" width="3" height="12" rx="1.5" fill="#C9C3D6"/>') },
  { id: 'deportiva', name: 'Deportivas', ic: rimIc('<circle cx="28" cy="14" r="8" fill="#9AA3B8"/>' + five(i => `<rect x="27" y="6.5" width="2" height="7.5" rx="1" fill="#F2F4F8" transform="rotate(${i * 72} 28 14)"/>`) + '<circle cx="28" cy="14" r="2.2" fill="#3C4670"/>') },
  { id: 'dorada', name: 'Doradas', ic: rimIc('<circle cx="28" cy="14" r="8" fill="#FFC93C"/><circle cx="28" cy="14" r="4.6" fill="#FFE58A"/>') },
  { id: 'arcoiris', name: 'Arcoíris', ic: rimIc(RAINBOW.map((c, i) => `<circle cx="28" cy="14" r="${9 - i * 1.5}" fill="${c}"/>`).join('')) },
  { id: 'flor', name: 'Flor', ic: rimIc('<circle cx="28" cy="14" r="8.5" fill="#fff"/>' + five(i => `<ellipse cx="28" cy="9.2" rx="2.6" ry="3.4" fill="#FF9CC7" transform="rotate(${i * 72} 28 14)"/>`) + '<circle cx="28" cy="14" r="2.6" fill="#FFD23F"/>') }
];
const TOPPERS = [
  { id: 'ninguno', name: 'Nada' }, { id: 'antena', name: 'Antena pompón', ic: '📡' }, { id: 'orejas', name: 'Orejitas', ic: '🐱' },
  { id: 'mono', name: 'Moño gigante', ic: '🎀' }, { id: 'cuerno', name: 'Cuerno de unicornio', ic: '🦄' }, { id: 'aleta', name: 'Aleta de tiburón', ic: '🦈' },
  { id: 'corona', name: 'Corona', ic: '👑' }, { id: 'sirena', name: 'Sirena', ic: '🚨' }
];
const EXTRAS = [{ id: 'pestanas', name: 'Ojitos', ic: '👀' }, { id: 'sonrisa', name: 'Sonrisa', ic: '😊' }, { id: 'neon', name: 'Luces neón', ic: '💡' }];
const HORNS = [{ id: 'clasica', name: 'Clásica', ic: '📯' }, { id: 'pato', name: 'Pato', ic: '🦆' }, { id: 'musical', name: 'Musical', ic: '🎶' }, { id: 'tren', name: 'Tren', ic: '🚂' }, { id: 'payaso', name: 'Payaso', ic: '🤡' }];
const DEFAULT_CAR = { type: 'descapotable', color: '#A77BF3', accent: '#FFFFFF', deco: 'estrellas', rims: 'arcoiris', topper: 'ninguno', extras: ['pestanas'], horn: 'musical', num: 7 };
const HEX = /^#[0-9a-f]{6}$/i;
function fixCarSpec(s) {
  const r = { type: 'clasico', color: '#FF6FAE', accent: '#FFFFFF', deco: 'ninguno', rims: 'clasica', topper: 'ninguno', extras: [], horn: 'clasica', num: 7 };
  if (!s || typeof s !== 'object') return r;
  if (CAR_TYPE[s.type]) r.type = s.type;
  if (HEX.test(s.color)) r.color = s.color;
  if (HEX.test(s.accent)) r.accent = s.accent;
  if (DECALS.some(d => d.id === s.deco)) r.deco = s.deco;
  if (RIMS.some(d => d.id === s.rims)) r.rims = s.rims;
  if (TOPPERS.some(d => d.id === s.topper)) r.topper = s.topper;
  if (HORNS.some(d => d.id === s.horn)) r.horn = s.horn;
  if (Array.isArray(s.extras)) r.extras = EXTRAS.map(e => e.id).filter(id => s.extras.includes(id));
  if (Number.isInteger(s.num) && s.num >= 1 && s.num <= 99) r.num = s.num;
  return r;
}
function randomCarSpec() {
  const color = pick(CAR_COLORS);
  return fixCarSpec({
    type: pick(CAR_TYPES).id, color, accent: pick(CAR_COLORS.filter(c => c !== color)),
    deco: pick(DECALS).id, rims: pick(RIMS).id, topper: Math.random() < 0.4 ? 'ninguno' : pick(TOPPERS).id,
    extras: EXTRAS.map(e => e.id).filter(() => Math.random() < 0.4), horn: pick(HORNS).id, num: 1 + Math.floor(Math.random() * 12)
  });
}

export { CAR_COLORS, CAR_TYPE, CAR_TYPES, DECALS, DEFAULT_CAR, EXTRAS, HORNS, RIMS, TOPPERS, fixCarSpec, randomCarSpec };
