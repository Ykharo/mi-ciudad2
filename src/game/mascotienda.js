// La Mascotienda Arcoíris: entrar y salir (la tienda por dentro es una sala aparte: world/places/mascotienda.js),
// comprar artículos con Huesitos de Aura, ponérselos a las mascotas y guardarlos.
//   comprados: los artículos que tiene la jugadora (sirven para todas sus mascotas)
//   p.extras: lo que tiene puesto cada mascota ({ transporte, arcoiris }) (se guarda con la mascota)
// La ventana (ui/panels/mascotienda.js) se abre con el evento 'mascotienda' y llama a estas funciones.
import { THREE } from '../engine/three.js';
import { labelSprite } from '../engine/textures.js';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { onZoneAction } from '../world/zones.js';
import { MASCOTIENDA } from '../world/places/mascotienda.js';
import { ARTICULOS } from '../pets/catalog/articulos.js';
import { ponerExtras } from '../pets/extras.js';
import { cam, player } from './actors.js';
import { gastarHuesitos, ganarHuesitos } from './huesitos.js';
import { enterMenu, leaveMenu } from './modes.js';
import { save } from './save.js';

// (lo comprado vive en player.articulos: así lo guarda game/save.js)
const comprados = { has: id => player.articulos.includes(id), add: id => { if (!player.articulos.includes(id)) player.articulos.push(id); }, clear: () => { player.articulos.length = 0; } };
const articulo = id => ARTICULOS.find(a => a.id === id);

// lo guardado, validado: sólo artículos que existen; lo puesto en cada mascota, sólo si lo tiene comprado
function cargarMascotienda(saved) {
  comprados.clear();
  for (const id of (saved && saved.mascotienda && saved.mascotienda.comprados) || []) if (articulo(id)) comprados.add(id);
  const pets = (saved && saved.pets) || [];
  player.pets.forEach((p, i) => ponerA(p, fixExtras(pets[i] && pets[i].extras)));
}
function fixExtras(e) {
  const t = e && typeof e.transporte === 'string' && comprados.has(e.transporte) && articulo(e.transporte).tipo === 'transporte' ? e.transporte : null;
  return { transporte: t, arcoiris: !!(e && e.arcoiris && comprados.has('arcoiris')) };
}
function ponerA(p, extras) { p.extras = { ...extras }; ponerExtras(p.obj, p.extras); }

// comprar: 'ok', 'ya' (ya lo tenía) o 'faltan' (+ cuántos)
function comprar(id, mascota) {
  const a = articulo(id);
  if (!a) return { r: 'no' };
  if (comprados.has(id)) return { r: 'ya' };
  if (!gastarHuesitos(a.precio)) return { r: 'faltan', faltan: a.precio - (player.huesitos || 0) };
  comprados.add(id); save();
  emit('sonido', 'adopt');
  // el diario de la mascota: una frase para leer (y un regalito por leerla: ui la muestra y llama a leerDiario)
  if (mascota) emit('mascotienda', { que: 'diario', frase: a.frase.replace('{n}', mascota.name) });
  return { r: 'ok' };
}
function leerDiario() { ganarHuesitos(3, '¡Leíste el diario!'); }
// ponérselo o quitárselo a una mascota (si es un transporte, reemplaza al que tenía)
function equipar(p, id, on) {
  const a = articulo(id); if (!p || !a || !comprados.has(id)) return;
  const e = { ...(p.extras || {}) };
  if (a.tipo === 'transporte') e.transporte = on ? id : (e.transporte === id ? null : e.transporte);
  else e.arcoiris = !!on;
  ponerA(p, e); save();
}
// probar (sin comprar): se ve puesto hasta que se pruebe otra cosa o se cierre la tienda
function probar(p, id) {
  const a = articulo(id); if (!p || !a) return;
  const e = { ...(p.extras || {}) };
  if (a.tipo === 'transporte') e.transporte = id; else e.arcoiris = true;
  ponerExtras(p.obj, e);
}
function dejarDeProbar() { for (const p of player.pets) ponerExtras(p.obj, p.extras || {}); }

/* ---------- entrar y salir ---------- */
function llevarA(punto, mira) {
  player.pos.set(punto.x, 0, punto.z); player.vel.set(0, 0, 0); player.facing = mira;
  cam.yaw = mira + Math.PI; cam.look.set(punto.x, 1.6, punto.z);
  cam.pos.set(punto.x - Math.sin(mira) * 6, 4, punto.z - Math.cos(mira) * 6);
  // las mascotas llegan con ella
  player.pets.forEach((p, i) => { p.pos.set(punto.x - Math.sin(mira) * (1.6 + i * 1.2), 0, punto.z - Math.cos(mira) * (1.6 + i * 1.2)); });
  emit('zona', null); state.currentZone = null; emit('sonido', 'open');
}
onZoneAction('mascotienda_entrar', () => { llevarA(MASCOTIENDA.adentro, MASCOTIENDA.adentro.mira); emit('aviso', '🐾 ¡Bienvenida a la Mascotienda Arcoíris!'); });
onZoneAction('mascotienda_salir', () => llevarA(MASCOTIENDA.afuera, MASCOTIENDA.afuera.mira));

/* ---------- la ventana ---------- */
// en un pasillo se abre en su sección; en el mostrador y el probador, en la primera
onZoneAction('mascotienda', z => {
  if (state.mode !== 'play') return;
  enterMenu('mascotienda');
  emit('mascotienda', { que: 'abrir', seccion: z.seccion || null });
});
function cerrarMascotienda() { dejarDeProbar(); leaveMenu(); }

// Robi saluda cuando la jugadora se acerca al mostrador (un globo sobre su cabeza, por unos segundos)
const SALUDOS = ['¡Guau! ¡Bienvenida!', '¡Bip bip! ¿Qué buscas?', '¡Tenemos patines nuevos!', '¡Junta Huesitos leyendo!'];
let saludo = null, cool = 0;
function robiHabla(dt) {
  const R = MASCOTIENDA.robi; if (!R) return;
  cool -= dt;
  if (saludo && (saludo.t -= dt) <= 0) { R.remove(saludo.s); saludo = null; }
  const w = R.getWorldPosition(_v), d = Math.hypot(player.pos.x - w.x, player.pos.z - w.z);
  if (d < 5 && cool <= 0 && state.mode === 'play') {
    cool = 12;
    if (saludo) R.remove(saludo.s);
    const s = labelSprite(SALUDOS[Math.floor(Math.random() * SALUDOS.length)], { bubble: true, scale: 0.0062 }); s.position.y = 1.7;
    R.add(s); saludo = { s, t: 3.5 };
    emit('sonido', 'pop');
  }
}
const _v = new THREE.Vector3();

// mientras la ventana está abierta: la mascota elegida se pone delante de la jugadora, mirando a la cámara
let elegida = 0;
function updateMascotienda(dt) {
  robiHabla(dt);
  if (state.mode !== 'mascotienda') return;
  const p = player.pets[elegida]; if (!p) return;
  const yaw = cam.menuYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  p.pos.set(player.pos.x + fx * 1.5 + rx * 1.2, 0, player.pos.z + fz * 1.5 + rz * 1.2);
  p.obj.root.position.copy(p.pos); p.obj.root.rotation.y = yaw - 0.4;
}

const mascotienda = {
  comprados: () => [...player.articulos], comprar, equipar, probar, dejarDeProbar, cerrar: cerrarMascotienda, leerDiario,
  elegir(i) { elegida = i; dejarDeProbar(); }, elegida: () => elegida,
};

export { cargarMascotienda, mascotienda, updateMascotienda };
