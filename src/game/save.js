// Guardado en localStorage.
import { state } from '../core/state.js';
import { ownedCars, player } from './player.js';

/* ================= GAMEPLAY ================= */
const SAVE_KEY = 'ciudadArcoiris.v1';
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return s && typeof s === 'object' ? s : null; } catch (e) { return null; } }
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      pets: player.pets.map(p => ({ kind: p.kind, color: p.color, name: p.name })),
      cars: ownedCars.map(c => ({ spec: c.spec, x: Math.round(c.x * 100) / 100, z: Math.round(c.z * 100) / 100, h: Math.round(c.heading * 1000) / 1000 })),
      shop: state.shopSpec
    }));
  } catch (e) { }
}

export { loadSave, save };
