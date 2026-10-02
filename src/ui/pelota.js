// Los botones de los juguetes que se usan en el mundo: 🎾 Lanzar pelota y 🫧 Hacer burbujas. Aparecen cuando alguna
// mascota tiene ese juguete y se puede usar (game/pelota.js y game/burbujero.js avisan con los eventos 'pelota' y
// 'burbujero').
import { on } from '../core/events.js';
import { lanzarPelota } from '../game/pelota.js';
import { hacerBurbujas } from '../game/burbujero.js';
import { $ } from './dom.js';

const btn = $('#btnPelota'), btnB = $('#btnBurbujas');
btn.addEventListener('click', () => { lanzarPelota(); });
btnB.addEventListener('click', () => { hacerBurbujas(); });
on('pelota', ev => { btn.hidden = !ev.visible; });
on('burbujero', ev => { btnB.hidden = !ev.visible; });
