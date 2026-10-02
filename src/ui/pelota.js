// El botón 🎾 Lanzar pelota: aparece cuando alguna mascota tiene la pelota saltarina y se puede lanzar
// (game/pelota.js avisa con el evento 'pelota').
import { on } from '../core/events.js';
import { lanzarPelota } from '../game/pelota.js';
import { $ } from './dom.js';

const btn = $('#btnPelota');
btn.addEventListener('click', () => { lanzarPelota(); });
on('pelota', ev => { btn.hidden = !ev.visible; });
