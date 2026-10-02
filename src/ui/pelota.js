// Los botones de los juguetes que se usan en el mundo: lanzar (🎾 pelota, 🥏 frisbee o 🪄 palito mágico; con más de
// uno, el botoncito 🔄 cambia cuál) y 🫧 Hacer burbujas. Aparecen cuando alguna mascota tiene ese juguete y se puede
// usar (game/pelota.js y game/burbujero.js avisan con los eventos 'pelota' y 'burbujero').
import { on } from '../core/events.js';
import { cambiarJuguete, lanzarPelota } from '../game/pelota.js';
import { hacerBurbujas } from '../game/burbujero.js';
import { $ } from './dom.js';

const btn = $('#btnPelota'), btnOtro = $('#btnPelotaOtro'), btnB = $('#btnBurbujas');
btn.addEventListener('click', () => { lanzarPelota(); });
btnOtro.addEventListener('click', () => { cambiarJuguete(); });
btnB.addEventListener('click', () => { hacerBurbujas(); });
on('pelota', ev => {
  btn.hidden = !ev.visible; btnOtro.hidden = !ev.visible || !ev.varios;
  if (ev.visible) btn.innerHTML = `<span class="em">${ev.ic}</span>Lanzar ${ev.nombre}`;
});
on('burbujero', ev => { btnB.hidden = !ev.visible; });
