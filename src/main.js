// Arranque y bucle principal: el único módulo que conoce a todos.
// Importa todos los módulos en el orden de las secciones del juego original: ese orden es el de arranque
// (renderer → mundo → autos → personajes → juego → audio → interfaz) y conviene no cambiarlo.
import { THREE } from './engine/three.js';
import { state } from './core/state.js';
import './core/events.js';
import './core/math.js';
import './core/svg.js';
import { camera, renderer, scene } from './engine/renderer.js';
import './engine/materials.js';
import './engine/geometry.js';
import './engine/merge.js';
import './engine/textures.js';
import './world/layout.js';
import './world/physics.js';
import { areaName } from './world/zones.js';
import { animated } from './engine/loop.js';
import { buildClouds, buildSky } from './world/sky.js';
import './world/ground.js';
import './world/nature.js';
import './world/houses.js';
import './world/places/boutique.js';
import './world/places/shelter.js';
import './world/places/icecream.js';
import './world/places/park.js';
import { carFitsAt, spawnCar } from './cars/fleet.js';
import { buildCity } from './world/city.js';
import { cullAvatars, loadCharacters, makeAvatar } from './characters/avatar.js';
import { fixLook } from './characters/looks.js';
import './characters/face.js';
import './characters/animator.js';
import './characters/props.js';
import { PET_KINDS } from './pets/models.js';
import './ui/widgets.js';
import { fixCarSpec } from './cars/catalog.js';
import { buildCarModel } from './cars/build.js';
import './cars/models.js';
import { SPAWNS } from './world/places/carshop.js';
import { MAX_CARS, addPet, cam, ownedCars, player } from './game/actors.js';
import { loadSave, save } from './game/save.js';
import { updatePlayer } from './game/player.js';
import { spawnNPCs, updateNPCs } from './game/npcs.js';
import { followChain } from './pets/follow.js';
import { updateCamera } from './game/camera.js';
import { driving, updateCar } from './game/driving.js';
import { updateZones } from './game/interact.js';
import { AC, initAudio, sfx, startMusic } from './audio/audio.js';
import './audio/engine.js';
import { $, gameEl } from './ui/dom.js';
import './ui/joystick.js';
import './ui/pointer-camera.js';
import './ui/keyboard.js';
import './ui/buttons.js';
import './ui/action-menu.js';
import './game/modes.js';
import { MAX_PETS, updatePreview } from './ui/panels/pets.js';
import { refreshTT } from './ui/panels/shop.js';
import { installTestHooks } from './debug/hooks.js';

let last = performance.now(), placeT = 0;
const placeName = $('#placeName');
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; state.clock += dt;
  if (state.mode === 'drive') updateCar(dt); else updatePlayer(dt);
  if (state.mode === 'drive') followChain(player.pets.filter(p => !p.riding), player.pos, dt, state.clock, driving.hl + 1.3);
  else followChain(player.pets, player.pos, dt, state.clock, 1.7);
  updateNPCs(dt, state.clock);
  updatePreview(dt, state.clock);
  updateZones();
  for (const f of animated) f(state.clock, dt);
  updateCamera(dt);
  sky.position.copy(camera.position);
  cullAvatars();
  placeT -= dt; if (placeT <= 0) { placeT = 0.3; placeName.textContent = areaName(player.pos.x, player.pos.z); }
  renderer.render(scene, camera);
}
function resize() {
  const w = gameEl.clientWidth || window.innerWidth, h = gameEl.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 64 : 52; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume(); });

let sky;
async function boot() {
  try { await Promise.race([document.fonts ? document.fonts.load('800 40px "Baloo 2"') : null, new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
  sky = buildSky(); buildClouds(); buildCity();
  const saved = loadSave();
  player.look = fixLook(saved && saved.nina && saved.nina.look);
  await loadCharacters([player.look]);   // la base y las prendas de Nina y de los vecinos
  player.ch = makeAvatar(player.look);
  const pets = saved ? (saved.pets || []) : [{ kind: 'perro', color: '#E9B77A', name: 'Toby' }];
  pets.slice(0, MAX_PETS).forEach(p => { if (PET_KINDS.some(k => k.id === p.kind)) addPet(p.kind, p.color || '#E9B77A', String(p.name || 'Toby').slice(0, 12)); });
  // your own cars, parked where you left them
  (saved && Array.isArray(saved.cars) ? saved.cars : []).slice(0, MAX_CARS).forEach(o => {
    if (!o) return;
    const spec = fixCarSpec(o.spec), M = buildCarModel(spec);
    let x = +o.x, z = +o.z, h = +o.h || 0;
    if (!isFinite(x) || !isFinite(z) || !carFitsAt(M.hw, M.hl, x, z, h, null, player.pos)) {
      const sp = SPAWNS.find(([a, b, c]) => carFitsAt(M.hw, M.hl, a, b, c, null, player.pos));
      if (!sp) { M.dispose(); return; }
      [x, z, h] = sp;
    }
    ownedCars.push(spawnCar(spec, x, z, h, true, M));
  });
  state.lastCar = ownedCars[ownedCars.length - 1] || null;
  if (saved && saved.shop) state.shopSpec = fixCarSpec(saved.shop);
  if (saved && saved.migrada) save();   // partida v1: queda guardada en el formato nuevo
  refreshTT();
  spawnNPCs(7);
  resize();
  cam.look.set(player.pos.x, 1.6, player.pos.z); cam.pos.set(player.pos.x + 8, 7, player.pos.z + 8);
  requestAnimationFrame(t => { last = t; frame(t); });
  const play = $('#btnPlay'); play.disabled = false; play.textContent = '¡A jugar!';
  play.addEventListener('click', () => {
    initAudio(); if (state.musicOn) startMusic();
    $('#start').hidden = true; gameEl.classList.remove('intro'); state.mode = 'play';
    cam.yaw = player.facing + Math.PI + 0.35; sfx('open');
  });
}
if (import.meta.env.DEV || new URLSearchParams(location.search).has('test')) installTestHooks();
if (typeof THREE === 'undefined') { const b = $('#btnPlay'); b.textContent = 'No se pudo cargar el 3D. Revisa tu conexión.'; }
else boot().catch(err => { console.error(err); const b = $('#btnPlay'); b.textContent = 'Algo falló al construir la ciudad'; });
