// Panel de Autos Arcoíris.
import { state } from '../../core/state.js';
import { collide } from '../../world/physics.js';
import { carFitsAt, removeCar, setCarModel, spawnCar, syncCar } from '../../cars/fleet.js';
import { carIcon, clone, optsHTML, stars, swHTML } from '../widgets.js';
import { CAR_COLORS, CAR_TYPE, CAR_TYPES, DECALS, DEFAULT_CAR, EXTRAS, HORNS, RIMS, TOPPERS, fixCarSpec, randomCarSpec } from '../../cars/catalog.js';
import { buildCarModel } from '../../cars/build.js';
import { SPAWNS, TT, ttGroup } from '../../world/places/carshop.js';
import { save } from '../../game/save.js';
import { onZoneAction } from '../../world/zones.js';
import { MAX_CARS, ownedCars, player } from '../../game/actors.js';
import { enterCar } from '../../game/driving.js';
import { hornSound, initAudio, sfx } from '../../audio/audio.js';
import { $, esc, toast } from '../dom.js';
import { enterMenu, leaveMenu } from '../../game/modes.js';

const shopPanel = $('#shopPanel'), shopTabsEl = $('#shopTabs'), shopBody = $('#shopBody'), btnBuy = $('#btnBuy');
const SHOP_TABS = [{ id: 'modelo', label: 'Modelo' }, { id: 'pintura', label: 'Pintura' }, { id: 'diseno', label: 'Diseño' }, { id: 'ruedas', label: 'Ruedas' }, { id: 'adornos', label: 'Adornos' }, { id: 'bocina', label: 'Bocina' }, { id: 'garaje', label: 'Mi garaje' }];
let shopTab = 'modelo', shopEditing = null;
function refreshTT() {
  if (state.ttModel) { ttGroup.remove(state.ttModel.g); state.ttModel.dispose(); }
  state.ttModel = buildCarModel(state.shopSpec); state.ttModel.g.position.y = 0.1; ttGroup.add(state.ttModel.g);
}
function updateBuyBtn() { btnBuy.innerHTML = shopEditing ? '<span class="em">💾</span>Guardar cambios' : '<span class="em">🔑</span>¡Lo quiero!'; }
function renderShopTabs() { shopTabsEl.innerHTML = SHOP_TABS.map(t => `<button class="tab${t.id === shopTab ? ' on' : ''}" data-tab="${t.id}">${t.label}</button>`).join(''); }
function renderShop() {
  const s = state.shopSpec, T = CAR_TYPE[s.type];
  let h = shopEditing && shopTab !== 'garaje' ? `<p class="note editing">Estás cambiando tu <b>${esc(T.name.toLowerCase())}</b>. Toca <b>Guardar cambios</b> cuando termines.</p>` : '';
  if (shopTab === 'modelo') {
    h += '<h3>Tipo de auto</h3>' + optsHTML(CAR_TYPES.map(t => ({ id: t.id, name: t.name, ic: carIcon(t.id, s.color, s.accent) })), s.type, 'type') +
      `<p class="note"><b>${T.name}:</b> ${T.desc}<br>Rapidez ${stars(T.vel)} &nbsp; Giro ${stars(T.giro)}</p>`;
  } else if (shopTab === 'pintura') {
    h += '<h3>Color del auto</h3>' + swHTML(CAR_COLORS, s.color, 'color') + '<h3>Color de detalles</h3>' + swHTML(CAR_COLORS, s.accent, 'accent') +
      '<p class="note">Los detalles son los asientos, los dibujos y los adornos.</p>';
  } else if (shopTab === 'diseno') {
    h += '<h3>Dibujo a los lados</h3>' + optsHTML(DECALS, s.deco, 'deco');
    if (s.deco === 'numero') h += '<h3>Número</h3><div class="opts nums">' + Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<button class="opt${n === s.num ? ' on' : ''}" data-k="num" data-v="${n}">${n}</button>`).join('') + '</div>';
  } else if (shopTab === 'ruedas') {
    h += '<h3>Llantas</h3>' + optsHTML(RIMS, s.rims, 'rims');
  } else if (shopTab === 'adornos') {
    h += '<h3>En el techo</h3>' + optsHTML(TOPPERS, s.topper, 'topper') + '<h3>Extras</h3><div class="opts">' +
      EXTRAS.map(x => `<button class="opt${s.extras.includes(x.id) ? ' on' : ''}" data-k="extra" data-v="${x.id}"><span class="ic">${x.ic}</span><span>${x.name}</span></button>`).join('') +
      '</div><p class="note">Puedes elegir varios extras a la vez.</p>';
  } else if (shopTab === 'bocina') {
    h += '<h3>Sonido de la bocina</h3>' + optsHTML(HORNS, s.horn, 'horn') + '<p class="note">Toca una para escucharla.</p>';
  } else {
    const list = ownedCars.length
      ? '<div class="mypets garage">' + ownedCars.map((c, i) => `<div class="mypet${c === shopEditing ? ' on' : ''}"><span class="cdot" style="background:${c.spec.color}"></span><b>${esc(CAR_TYPE[c.spec.type].name)}</b><button class="toy" data-g="edit" data-i="${i}">Cambiar</button><button class="toy" data-g="rm" data-i="${i}">Devolver</button></div>`).join('') + '</div>'
      : '<p class="empty">Todavía no tienes autos. Diseña uno y toca "¡Lo quiero!".</p>';
    h += (shopEditing ? '<button class="toy mint wide" data-g="new"><span class="em">➕</span>Diseñar un auto nuevo</button>' : '') +
      `<h3>Mis autos (${ownedCars.length}/${MAX_CARS})</h3>` + list +
      '<p class="note">Con el botón 🚗 Mi auto puedes llamar a tu auto desde cualquier parte de la ciudad.</p>';
  }
  shopBody.innerHTML = h;
}
shopTabsEl.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; shopTab = b.dataset.tab; renderShopTabs(); renderShop(); shopBody.scrollTop = 0; sfx('pop'); });
shopBody.addEventListener('click', e => {
  const g = e.target.closest('[data-g]');
  if (g) {
    const act = g.dataset.g, c = ownedCars[+g.dataset.i];
    if (act === 'new') { shopEditing = null; state.shopSpec = fixCarSpec(DEFAULT_CAR); shopTab = 'modelo'; }
    else if (act === 'edit' && c) { shopEditing = c; state.shopSpec = clone(c.spec); shopTab = 'modelo'; state.ttSpin = 0.5; }
    else if (act === 'rm' && c) {
      removeCar(c); ownedCars.splice(ownedCars.indexOf(c), 1);
      if (shopEditing === c) shopEditing = null;
      if (state.lastCar === c) state.lastCar = null;
      toast('Tu auto volvió a la tienda'); save();
    }
    sfx('pop'); refreshTT(); updateBuyBtn(); renderShopTabs(); renderShop(); return;
  }
  const b = e.target.closest('[data-k]'); if (!b) return;
  const k = b.dataset.k, v = b.dataset.v, s = state.shopSpec;
  if (k === 'extra') { const i = s.extras.indexOf(v); if (i >= 0) s.extras.splice(i, 1); else s.extras.push(v); }
  else if (k === 'num') s.num = +v;
  else s[k] = v;
  if (k === 'horn') { initAudio(); hornSound(v); renderShop(); return; }
  sfx('pop'); refreshTT(); renderShop();
});
$('#btnCarRandom').addEventListener('click', () => { state.shopSpec = randomCarSpec(); state.ttSpin = 0.5; sfx('pop'); refreshTT(); renderShop(); });
btnBuy.addEventListener('click', () => {
  if (shopEditing) {
    setCarModel(shopEditing, buildCarModel(clone(state.shopSpec))); syncCar(shopEditing);
    save(); sfx('adopt'); toast('¡Tu auto quedó como nuevo!'); return;
  }
  if (ownedCars.length >= MAX_CARS) {
    toast('Ya tienes 4 autos. Devuelve uno en "Mi garaje" para llevarte otro.');
    shopTab = 'garaje'; renderShopTabs(); renderShop(); return;
  }
  const spec = clone(state.shopSpec), M = buildCarModel(spec);
  const spot = SPAWNS.find(([x, z, h]) => carFitsAt(M.hw, M.hl, x, z, h, null, player.pos));
  if (!spot) { M.dispose(); toast('La calle está llena de autos. Intenta en un ratito.'); return; }
  const c = spawnCar(spec, spot[0], spot[1], spot[2], true, M);
  ownedCars.push(c); state.lastCar = c;
  closeShop();
  enterCar(c);
  save(); sfx('adopt');
  toast('¡Tu auto nuevo! Maneja con el círculo 🚗');
});
function openShop() {
  if (state.mode !== 'play') return;
  player.pos.set(TT.x - 5.3, 0, TT.z + 1.6); collide(player.pos, 0.5);
  player.facing = Math.atan2(TT.x - player.pos.x, TT.z - player.pos.z);
  enterMenu('shop'); shopPanel.hidden = false;
  shopEditing = null; shopTab = 'modelo'; state.ttSpin = 0.5; state.ttDrag = 0;
  refreshTT(); updateBuyBtn(); renderShopTabs(); renderShop(); shopBody.scrollTop = 0;
}
function closeShop() {
  if (shopEditing) { shopEditing = null; state.shopSpec = fixCarSpec(DEFAULT_CAR); refreshTT(); }
  shopPanel.hidden = true; leaveMenu(); save();
}
$('#shopDone').addEventListener('click', closeShop);

onZoneAction('shop', openShop);

export { refreshTT };
