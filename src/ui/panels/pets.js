// Panel del Refugio de Mascotas.
import { state } from '../../core/state.js';
import { pick } from '../../core/math.js';
import { scene } from '../../engine/renderer.js';
import { PET_COLORS, PET_KINDS, PET_NAMES, animatePet, buildPet, disposePet, setPetName } from '../../pets/models.js';
import { optsHTML, swHTML } from '../widgets.js';
import { save } from '../../game/save.js';
import { addPet, cam, player } from '../../game/player.js';
import { sfx } from '../../audio/audio.js';
import { $, esc, toast } from '../dom.js';
import { enterMenu, leaveMenu } from '../../game/modes.js';

/* ---------- pet shelter ---------- */
const petPanel = $('#petPanel'), petBody = $('#petBody');
const MAX_PETS = 4;
let petSel = { kind: 'perro', color: '#E9B77A', name: '' }, petSuggest = 'Toby', preview = null;
function makePreview() {
  if (preview) disposePet(preview);
  preview = buildPet(petSel.kind, petSel.color); setPetName(preview, petSel.name.trim() || petSuggest); scene.add(preview.root);
}
function renderPets() {
  const list = player.pets.length
    ? '<div class="mypets">' + player.pets.map((p, i) => `<div class="mypet"><span class="ic">${PET_KINDS.find(k => k.id === p.kind).ic}</span><b>${esc(p.name)}</b><button class="toy" data-rm="${i}">Llevar a casa</button></div>`).join('') + '</div>'
    : '<p class="empty">Todavía no tienes mascotas. ¡Elige una y adóptala!</p>';
  petBody.innerHTML = '<h3>Elige tu mascota</h3>' + optsHTML(PET_KINDS, petSel.kind, 'pk') +
    '<h3>Color</h3>' + swHTML(PET_COLORS, petSel.color, 'pc') +
    `<h3>Nombre</h3><input id="petName" maxlength="12" autocomplete="off" placeholder="${esc(petSuggest)}" value="${esc(petSel.name)}">` +
    `<h3>Mis mascotas (${player.pets.length}/${MAX_PETS})</h3>` + list;
}
petBody.addEventListener('click', e => {
  const rm = e.target.closest('[data-rm]');
  if (rm) { const i = +rm.dataset.rm, p = player.pets[i]; disposePet(p.obj); player.pets.splice(i, 1); save(); toast(`${p.name} se fue a descansar a casa`); renderPets(); return; }
  const b = e.target.closest('[data-k]'); if (!b) return;
  if (b.dataset.k === 'pk') petSel.kind = b.dataset.v; else petSel.color = b.dataset.v;
  sfx('pop'); renderPets(); makePreview();
});
petBody.addEventListener('input', e => { if (e.target.id === 'petName') { petSel.name = e.target.value; setPetName(preview, petSel.name.trim() || petSuggest); } });
$('#btnAdopt').addEventListener('click', () => {
  if (player.pets.length >= MAX_PETS) { toast('Ya tienes 4 mascotas. Lleva una a casa para adoptar otra.'); return; }
  const name = petSel.name.trim() || petSuggest;
  addPet(petSel.kind, petSel.color, name, preview.root.position.clone());
  save(); sfx('adopt'); player.happy = 0.6;
  toast(`¡${name} ahora es tu mascota!`);
  petSel.name = ''; petSuggest = pick(PET_NAMES.filter(n => !player.pets.some(p => p.name === n)).concat(['Pompón']));
  renderPets(); makePreview();
});
function openPets() {
  if (state.mode !== 'play') return; enterMenu('pets'); petPanel.hidden = false;
  petSel.name = ''; petSuggest = pick(PET_NAMES); renderPets(); makePreview();
}
$('#petDone').addEventListener('click', () => { petPanel.hidden = true; if (preview) { disposePet(preview); preview = null; } leaveMenu(); });
function updatePreview(dt, t) {
  if (!preview) return;
  const yaw = cam.menuYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  preview.root.position.set(player.pos.x + fx * 1.4 + rx * 1.1, 0, player.pos.z + fz * 1.4 + rz * 1.1);
  preview.root.rotation.y = yaw - 0.5 + Math.sin(t * 0.8) * 0.3;
  animatePet(preview, t, 0, dt);
}

export { MAX_PETS, openPets, preview, updatePreview };
