// Panel del Vestidor (en la Boutique Arcoíris): prenda y colores de cada espacio del cuerpo, la mariposa del peto,
// el color de piel, "Sorpréndeme" y "Original". Todo se ve al instante en Nina y se guarda en su look.
// Lo que se puede cambiar sale del catálogo (characters/catalog/prendas.js): una prenda nueva aparece sola.
import { state } from '../../core/state.js';
import { pick } from '../../core/math.js';
import { collide } from '../../world/physics.js';
import { onZoneAction } from '../../world/zones.js';
import { avatarDo, avatarStop } from '../../characters/animator.js';
import { PALETAS } from '../../characters/catalog/paletas.js';
import { PIEL, PRENDA, PRENDAS, SLOTS, SLOTS_OPCIONALES } from '../../characters/catalog/prendas.js';
import { LOOK_NINA } from '../../characters/catalog/personajes.js';
import { fixLook } from '../../characters/looks.js';
import { factoryColor, ponerPrenda, quitarPrenda, recolorear } from '../../characters/wardrobe.js';
import { player } from '../../game/actors.js';
import { enterMenu, leaveMenu } from '../../game/modes.js';
import { save } from '../../game/save.js';
import { sfx } from '../../audio/audio.js';
import { $, esc } from '../dom.js';
import { optsHTML } from '../widgets.js';

const panel = $('#wardrobePanel'), tabsEl = $('#wardrobeTabs'), body = $('#wardrobeBody');
const TABS = [
  { id: 'pelo', label: 'Pelo', slot: 'pelo' }, { id: 'arriba', label: 'Arriba', slot: 'torso' },
  { id: 'chaqueta', label: 'Chaqueta', slot: 'abrigo', sin: 'Sin chaqueta' }, { id: 'abajo', label: 'Abajo', slot: 'piernas' }, { id: 'zapatos', label: 'Zapatos', slot: 'pies' },
  { id: 'piel', label: 'Piel' },
];
const NOMBRE_CANAL = { principal: 'Color', panel: 'Color de los detalles', detalles: 'Color de los bordes' };
let tab = 'arriba';
const copia = o => JSON.parse(JSON.stringify(o));

// muestras de color; la primera ("↩") deja el color con que viene la prenda
function swatches(lista, actual, fabrica, data) {
  const igual = c => !!actual && c.toLowerCase() === actual.toLowerCase();
  return '<div class="sws">' +
    (fabrica ? `<button class="sw fabrica${actual ? '' : ' on'}" style="background:${fabrica}" ${data} data-v="" aria-label="Como viene"></button>` : '') +
    lista.map((c, i) => `<button class="sw${igual(c) ? ' on' : ''}" style="background:${c}" ${data} data-v="${c}" aria-label="Color ${i + 1}"></button>`).join('') +
    '</div>';
}
function render() {
  tabsEl.innerHTML = TABS.map(t => `<button class="tab${t.id === tab ? ' on' : ''}" data-tab="${t.id}">${t.label}</button>`).join('');
  const T = TABS.find(t => t.id === tab), look = player.look;
  let h = '';
  if (!T.slot) {
    h = '<h3>Color de piel</h3>' + swatches(PALETAS.piel, look.piel, factoryColor(PIEL.mats[0]), 'data-k="piel"');
  } else {
    const sel = look.prendas[T.slot], P = sel && PRENDA[sel.id];
    const opciones = PRENDAS.filter(p => p.slot === T.slot).map(p => ({ id: p.id, name: p.nombre, ic: p.ic }));
    if (SLOTS_OPCIONALES.includes(T.slot)) opciones.unshift({ id: '', name: T.sin || 'Nada', ic: '🚫' });   // puede quedar vacío
    h = '<h3>Prenda</h3>' + optsHTML(opciones, sel ? sel.id : '', 'prenda');
    if (P) {
      for (const [canal, C] of Object.entries(P.canales))
        h += `<h3>${NOMBRE_CANAL[canal] || canal}</h3>` + swatches(PALETAS[C.paleta], sel.colores && sel.colores[canal], factoryColor(C.mats[0]), `data-k="color" data-canal="${canal}"`);
      for (const [e, E] of Object.entries(P.extras || {})) {
        const visible = !(sel.extras && sel.extras[e] === false), n = esc(E.nombre.toLowerCase());
        h += `<h3>${esc(E.nombre)}</h3>` + optsHTML([{ id: 'si', name: 'Con ' + n, ic: E.ic }, { id: 'no', name: 'Sin ' + n, ic: '🚫' }], visible ? 'si' : 'no', 'extra:' + e);
      }
    }
  }
  body.innerHTML = h;
}

// Aplica un look nuevo a Nina: cambia las prendas que cambiaron, los colores, y lo guarda.
async function cambiarLook(nuevo) {
  const look = fixLook(nuevo), ch = player.ch;
  for (const slot of SLOTS) {
    const antes = player.look.prendas[slot], ahora = look.prendas[slot];
    if ((antes && antes.id) === (ahora && ahora.id)) continue;
    if (ahora) await ponerPrenda(ch, slot, ahora); else quitarPrenda(ch, slot);
  }
  player.look = look; recolorear(ch, look);
  player.happy = 0.6;   // cara feliz un ratito
  sfx('pop'); save(); render();
}

tabsEl.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; render(); body.scrollTop = 0; sfx('pop'); });
body.addEventListener('click', e => {
  const b = e.target.closest('[data-k]'); if (!b) return;
  const look = copia(player.look), slot = (TABS.find(t => t.id === tab) || {}).slot, k = b.dataset.k, v = b.dataset.v;
  const sel = slot && look.prendas[slot];
  if (k === 'piel') look.piel = v || null;
  else if (k === 'prenda') { if ((sel ? sel.id : '') === v) return; if (v) look.prendas[slot] = { id: v }; else delete look.prendas[slot]; }
  else if (k === 'color' && sel) { sel.colores = sel.colores || {}; if (v) sel.colores[b.dataset.canal] = v; else delete sel.colores[b.dataset.canal]; }
  else if (k.startsWith('extra:') && sel) { sel.extras = sel.extras || {}; sel.extras[k.slice(6)] = v === 'si'; }
  cambiarLook(look);
});
// Sorpréndeme: colores al azar para toda la ropa y el pelo (la piel no se toca)
$('#btnLookRandom').addEventListener('click', () => {
  const look = copia(player.look);
  for (const sel of Object.values(look.prendas)) {
    const P = PRENDA[sel.id]; if (!P) continue;
    sel.colores = {};
    for (const [canal, C] of Object.entries(P.canales)) sel.colores[canal] = pick(PALETAS[C.paleta]);
    if (P.extras) { sel.extras = {}; for (const e of Object.keys(P.extras)) sel.extras[e] = Math.random() < 0.6; }
  }
  cambiarLook(look);
  avatarDo(player.ch, 'wave', { start: 0.05 });
});
$('#btnLookOriginal').addEventListener('click', () => cambiarLook(copia(LOOK_NINA)));

function openWardrobe(z) {
  if (state.mode !== 'play') return;
  // Nina en la alfombra, mirando a la calle: la cámara queda al frente y la Boutique detrás
  player.pos.set(z.x, 0, z.z); collide(player.pos, 0.5); player.facing = 0;
  avatarStop(player.ch);
  enterMenu('wardrobe'); panel.hidden = false;
  tab = 'arriba'; render(); body.scrollTop = 0;
}
$('#wardrobeDone').addEventListener('click', () => { panel.hidden = true; leaveMenu(); save(); });
onZoneAction('boutique', openWardrobe);
