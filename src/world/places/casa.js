// Mi Casa: al lado de la Heladería, mirando a la Calle Arcoíris, con flores en la vereda.
import { makeSign } from '../../engine/textures.js';
import { definePlace } from '../place.js';
import { house } from '../houses.js';
import { flowers } from '../nature.js';

function casa() {
  const mine = house(-13, 26, Math.PI / 2, { w: 9, d: 7.5, h: 6, wall: '#FFD6E2', roof: '#FF6FAE', door: '#9B6BF0', path: 3.3 });
  const s = makeSign('Mi Casa', '#9B6BF0', '#FFFFFF', 3.4); s.position.set(0, 5.1, 7.5 / 2 + 0.07); mine.add(s);
  flowers(-7.5, 20, 2, 4, 14, 41); flowers(-7.5, 32, 2, 4, 14, 42);
}

definePlace({ id: 'casa', nombre: 'Mi Casa', orden: 60, area: [-34.5, -5.5, 21, 34.5], build: casa });
