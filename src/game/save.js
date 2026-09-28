// Guardado en localStorage. Versión 2: { version: 2, nina: { look }, pets, cars, shop }.
// Si sólo hay una partida v1 ({ pets, cars, shop }) se migra: mascotas, autos y diseño pasan tal cual y Nina
// queda con su look de fábrica. La clave v1 no se borra (así se puede volver a una versión anterior del juego).
import { state } from '../core/state.js';
import { fixLook } from '../characters/looks.js';
import { ownedCars, player } from './actors.js';

const SAVE_KEY = 'ciudadArcoiris.v2', SAVE_KEY_V1 = 'ciudadArcoiris.v1';
function read(key) { try { const s = JSON.parse(localStorage.getItem(key) || 'null'); return s && typeof s === 'object' ? s : null; } catch (e) { return null; } }
// devuelve la partida en formato v2 (con `migrada: true` si venía de v1) o null si no hay
function loadSave() {
  const s = read(SAVE_KEY);
  if (s && s.version === 2) return s;
  const v1 = read(SAVE_KEY_V1);
  if (v1) return { version: 2, migrada: true, nina: { look: fixLook(null) }, pets: v1.pets, cars: v1.cars, shop: v1.shop };
  return null;
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 2,
      nina: { look: player.look },
      pets: player.pets.map(p => ({ kind: p.kind, color: p.color, name: p.name })),
      cars: ownedCars.map(c => ({ spec: c.spec, x: Math.round(c.x * 100) / 100, z: Math.round(c.z * 100) / 100, h: Math.round(c.heading * 1000) / 1000 })),
      shop: state.shopSpec
    }));
  } catch (e) { }
}

export { loadSave, save };
