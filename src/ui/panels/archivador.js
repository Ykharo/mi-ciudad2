// "Mis mascotas": el archivador personal de las mascotas del jugador (botón 🐾 Mascotas). Una carpeta por mascota
// (pestaña de su color) con cuatro hojas:
//   📋 Ficha   nombre (se puede cambiar), especie, color, fecha de adopción y días juntos, fotos (📸 sacar una), llevar a casa
//   😊 Estado  cómo está (feliz, tiene sueño, quiere jugar…) y sus barras de felicidad, energía y diversión
//   🩺 Salud   los controles médicos con sus fechas (hechos y próximos)
//   🎒 Cosas   lo que tiene, por categoría (ropa, artículos, pociones, juguetes), para ponérselo o quitárselo
// La lógica está en game/fichas.js; ponerse las cosas, en game/mascotienda.js.
import { on } from '../../core/events.js';
import { camera, canvas, renderer, scene } from '../../engine/renderer.js';
import { sfx } from '../../audio/audio.js';
import { player } from '../../game/actors.js';
import { FOTOS, abrirArchivador, animo, borrarFoto, cerrarArchivador, elegirFicha, felicidad, fichaElegida, guardarFoto, llevarACasa, renombrar } from '../../game/fichas.js';
import { mascotienda as M } from '../../game/mascotienda.js';
import { PET_KINDS } from '../../pets/models.js';
import { ARTICULOS } from '../../pets/catalog/articulos.js';
import { $, esc, toast } from '../dom.js';

const panel = $('#archPanel'), tabs = $('#archTabs'), hoja = $('#archHoja'), secs = $('#archSecs'), body = $('#archBody');
const SECCIONES = [['ficha', '📋', 'Ficha'], ['estado', '😊', 'Estado'], ['salud', '🩺', 'Salud'], ['cosas', '🎒', 'Cosas']];
const COLORES = ['#FFE7A8', '#C9F2E2', '#FFD6E8', '#D8E6FF'];   // las carpetas
const CATEGORIAS = [
  { id: 'ropa', nombre: 'Ropa', ic: '👕', secciones: [] },
  { id: 'articulos', nombre: 'Artículos', ic: '🛼', secciones: ['transporte', 'accesorios'] },
  { id: 'pociones', nombre: 'Pociones', ic: '🧪', secciones: ['pociones'] },
  { id: 'juguetes', nombre: 'Juguetes', ic: '🧸', secciones: ['juguetes'] },
];
let seccion = 'ficha', seguro = false;
const fechaCL = iso => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
const especie = p => PET_KINDS.find(k => k.id === p.kind) || { name: p.kind, ic: '🐾' };

function barra(nombre, ic, v, color) {
  return `<div class="barra"><div class="t"><span>${ic} ${nombre}</span><span>${Math.round(v)}%</span></div><div class="b"><i style="width:${v}%;background:${color}"></i></div></div>`;
}

function render() {
  const pets = player.pets;
  if (!pets.length) {
    tabs.innerHTML = ''; secs.innerHTML = ''; hoja.style.setProperty('--c', COLORES[0]);
    body.innerHTML = '<p class="empty">Todavía no tienes mascotas. ¡Adopta una en el Refugio de Mascotas!</p>';
    return;
  }
  const el = Math.min(fichaElegida(), pets.length - 1), p = pets[el], color = COLORES[el % COLORES.length];
  tabs.innerHTML = pets.map((m, i) => `<button class="carpeta${i === el ? ' on' : ''}" style="--c:${COLORES[i % COLORES.length]}" data-pet="${i}"><span class="ic">${especie(m).ic}</span><b>${esc(m.name)}</b></button>`).join('');
  hoja.style.setProperty('--c', color);
  secs.innerHTML = SECCIONES.map(([id, ic, n]) => `<button class="${id === seccion ? 'on' : ''}" data-sec="${id}"><span class="ic">${ic}</span>${n}</button>`).join('');
  let h = '';
  if (seccion === 'ficha') {
    const dias = Math.max(0, Math.floor((Date.now() - Date.parse(p.adopcion)) / 86400000));
    h += `<h3>Nombre</h3><div class="nombre"><input id="archNombre" maxlength="12" value="${esc(p.name)}" autocomplete="off"><button class="toy mint" data-renombrar="1">Guardar</button></div>`;
    h += '<h3>Datos</h3>' +
      `<div class="dato"><span>Especie</span><b>${especie(p).ic} ${esc(especie(p).name)}</b></div>` +
      `<div class="dato"><span>Color</span><b><span class="cdot" style="display:inline-block;vertical-align:middle;width:22px;height:22px;background:${p.color}"></span></b></div>` +
      `<div class="dato"><span>Adopción</span><b>${fechaCL(p.adopcion)}</b></div>` +
      `<div class="dato"><span>Juntos hace</span><b>${dias === 0 ? '¡hoy!' : dias === 1 ? '1 día' : `${dias} días`}</b></div>`;
    h += `<h3>Fotos (${p.fotos.length}/${FOTOS})</h3>`;
    h += p.fotos.length ? '<div class="fotos">' + p.fotos.map((f, i) => `<div class="foto"><img src="${f}" alt="Foto de ${esc(p.name)}"><button data-borrar="${i}" aria-label="Borrar foto">×</button></div>`).join('') + '</div>'
      : '<p class="note">Saca una foto: sale lo que se ve en la pantalla.</p>';
    h += `<button class="toy sky wide" data-foto="1">📸 Sacar foto</button>`;
    h += `<button class="toy wide" data-casa="1">${seguro ? `¿Seguro? Toca otra vez para llevar a ${esc(p.name)} a casa` : '🏠 Llevar a casa'}</button>`;
  } else if (seccion === 'estado') {
    const a = animo(p), E = p.estado;
    h += `<div class="animo"><span>${a.ic}</span>${esc(p.name)}: ${a.texto}</div>`;
    h += barra('Felicidad', '💖', felicidad(p), '#FF6FAE') + barra('Energía', '⚡', E.energia, '#FFD23F') + barra('Diversión', '🎈', E.diversion, '#4FB6F5');
    h += '<p class="note">Pasear cansa y descansar da energía. Los juegos, la competencia de aura y sus cosas (patines, globo…) la divierten.</p>';
  } else if (seccion === 'salud') {
    h += '<h3>Controles médicos</h3>';
    for (const c of [...p.controles].sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha))) {
      const atrasado = !c.hecho && Date.parse(c.fecha) < Date.now();
      h += `<div class="control${c.hecho ? '' : atrasado ? ' pend atrasado' : ' pend'}"><span class="ic">${c.hecho ? '✅' : atrasado ? '⏰' : '📅'}</span><span>${esc(c.tipo)}<br><small>${c.hecho ? 'Hecho' : atrasado ? '¡Atrasado!' : 'Pendiente'}</small></span><span class="f">${fechaCL(c.fecha)}</span></div>`;
    }
    h += '<p class="note">🏥 La veterinaria abre pronto: ahí se harán los controles pendientes.</p>';
  } else {
    const tengo = M.comprados();
    for (const C of CATEGORIAS) {
      const lista = ARTICULOS.filter(a => C.secciones.includes(a.seccion) && tengo.includes(a.id));
      h += `<h3>${C.ic} ${C.nombre}</h3>`;
      if (!lista.length) { h += '<p class="note">Todavía no tiene. ¡Búscalas en la Mascotienda Arcoíris!</p>'; continue; }
      for (const a of lista) {
        const puesto = p.extras && (a.tipo === 'transporte' ? p.extras.transporte === a.id : p.extras.arcoiris);
        h += `<div class="cosa${puesto ? ' puesto' : ''}"><span class="ic">${a.ic}</span><b>${esc(a.nombre)}</b><button class="toy ${puesto ? '' : 'mint'}" data-poner="${a.id}" data-on="${puesto ? '' : '1'}">${puesto ? 'Quitárselo' : 'Ponérselo'}</button></div>`;
      }
    }
  }
  body.innerHTML = h;
}

// una foto: lo que se ve en la pantalla (sin el panel), achicada (para que quepa en el guardado)
function sacarFoto(p) {
  renderer.render(scene, camera);
  const w = 240, h = Math.round(w * canvas.height / canvas.width), c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(canvas, 0, 0, w, h);
  guardarFoto(p, c.toDataURL('image/jpeg', 0.72));
}

tabs.addEventListener('click', e => { const b = e.target.closest('[data-pet]'); if (!b) return; elegirFicha(+b.dataset.pet); seguro = false; sfx('pop'); render(); });
secs.addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (!b) return; seccion = b.dataset.sec; seguro = false; sfx('pop'); render(); });
body.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const i = fichaElegida(), p = player.pets[i]; if (!p) return;
  if (b.dataset.renombrar) { if (renombrar(p, $('#archNombre').value)) toast(`¡Ahora se llama ${p.name}!`); }
  else if (b.dataset.foto) { sacarFoto(p); toast('📸 ¡Foto guardada!'); }
  else if (b.dataset.borrar) borrarFoto(p, +b.dataset.borrar);
  else if (b.dataset.poner) M.equipar(p, b.dataset.poner, !!b.dataset.on);
  else if (b.dataset.casa) {
    if (!seguro) { seguro = true; render(); return; }
    const q = llevarACasa(i); seguro = false; elegirFicha(0);
    if (q) toast(`${q.name} se fue a descansar a casa`);
  }
  sfx('pop'); render();
});
body.addEventListener('keydown', e => { if (e.target.id === 'archNombre' && e.key === 'Enter') body.querySelector('[data-renombrar]').click(); });
$('#archDone').addEventListener('click', () => { panel.hidden = true; seguro = false; cerrarArchivador(); });

on('archivador', ev => { if (ev.que === 'abrir') { seccion = 'ficha'; seguro = false; render(); panel.hidden = false; } });
// mientras está abierto, las barras de Estado se van actualizando
setInterval(() => { if (!panel.hidden && seccion === 'estado') render(); }, 2000);

export { abrirArchivador };
