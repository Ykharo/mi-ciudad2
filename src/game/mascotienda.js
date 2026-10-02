// La Mascotienda Arcoíris: entrar y salir (la tienda por dentro es una sala aparte: world/places/mascotienda.js),
// comprar artículos con Huesitos de Aura, ponérselos a las mascotas y guardarlos.
//   p.cosas: lo comprado PARA cada mascota (cada una tiene las suyas: se compra para la mascota elegida)
//   p.extras: lo que tiene puesto cada mascota ({ transporte, arcoiris, ropa: { cuello, cabeza, lomo } })
// Las dos se guardan con la mascota. Una partida de antes (lo comprado era de todas: `mascotienda.comprados`) le da
// esa lista a cada mascota que no tenga la suya.
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

const articulo = id => ARTICULOS.find(a => a.id === id);
const tiene = (p, id) => !!(p && p.cosas && p.cosas.includes(id));
// sólo artículos que existen, sin repetir
const validas = l => (Array.isArray(l) ? [...new Set(l.filter(id => typeof id === 'string' && articulo(id)))] : []);

// lo guardado, validado: lo de cada mascota (o, de una partida de antes, la lista de todas); lo puesto, sólo si es suyo
function cargarMascotienda(saved) {
  const antes = validas(saved && saved.mascotienda && saved.mascotienda.comprados), pets = (saved && saved.pets) || [];
  player.pets.forEach((p, i) => {
    const g = pets[i] || {};
    p.cosas = Array.isArray(g.cosas) ? validas(g.cosas) : [...antes];
    ponerA(p, fixExtras(g.extras, p));
  });
}
function fixExtras(e, p) {
  const t = e && typeof e.transporte === 'string' && tiene(p, e.transporte) && articulo(e.transporte).tipo === 'transporte' ? e.transporte : null;
  const ropa = {};
  for (const [lugar, id] of Object.entries((e && typeof e.ropa === 'object' && e.ropa) || {})) {
    const a = articulo(id); if (a && a.tipo === 'ropa' && a.lugar === lugar && tiene(p, id)) ropa[lugar] = id;
  }
  const pocion = ef => !!(e && e[ef] && tiene(p, ef));   // (arcoiris, brillo, burbujas, invisible: el id es el efecto)
  const tamano = e && (e.tamano === 'mini' || e.tamano === 'gigante') && tiene(p, e.tamano) ? e.tamano : null;
  const da = e && ARTICULOS.find(a => a.efecto === 'diseno' && a.diseno === e.diseno), diseno = da && tiene(p, da.id) ? da.diseno : null;
  return { transporte: t, arcoiris: pocion('arcoiris'), brillo: pocion('brillo'), burbujas: pocion('burbujas'), invisible: pocion('invisible'), tamano, diseno, ropa };
}
// las pociones que van de a una: un tamaño (mini o gigante) y un diseño de pelaje; las demás se juntan
const TAMANO = new Set(['mini', 'gigante']);
// ¿lo tiene puesto? (los juguetes no se ponen)
function puesto(p, id) {
  const a = articulo(id), e = p && p.extras; if (!a || !e) return false;
  if (a.tipo === 'pocion') return TAMANO.has(a.efecto) ? e.tamano === a.efecto : a.efecto === 'diseno' ? e.diseno === a.diseno : !!e[a.efecto];
  return a.tipo === 'transporte' ? e.transporte === id : a.tipo === 'ropa' ? !!(e.ropa && e.ropa[a.lugar] === id) : false;
}
// cómo quedan los extras al ponerse (on) o quitarse un artículo: un transporte reemplaza al que tenía; una prenda, a la
// del mismo lugar del cuerpo; la poción mini a la gigante (y al revés), y una pastilla de diseño a la otra
function conArticulo(e0, a, on) {
  const e = { ...(e0 || {}), ropa: { ...((e0 && e0.ropa) || {}) } };
  if (a.tipo === 'transporte') e.transporte = on ? a.id : (e.transporte === a.id ? null : e.transporte);
  else if (a.tipo === 'pocion' && TAMANO.has(a.efecto)) e.tamano = on ? a.efecto : (e.tamano === a.efecto ? null : e.tamano);
  else if (a.tipo === 'pocion' && a.efecto === 'diseno') e.diseno = on ? a.diseno : (e.diseno === a.diseno ? null : e.diseno);
  else if (a.tipo === 'pocion') e[a.efecto] = !!on;
  else if (a.tipo === 'ropa') { if (on) e.ropa[a.lugar] = a.id; else if (e.ropa[a.lugar] === a.id) delete e.ropa[a.lugar]; }
  return e;
}
function ponerA(p, extras) { p.extras = { ...extras }; ponerExtras(p.obj, p.extras); }

// comprar para una mascota: 'ok', 'ya' (ya lo tenía), 'sin' (no hay mascota) o 'faltan' (+ cuántos)
function comprar(id, mascota) {
  const a = articulo(id);
  if (!a) return { r: 'no' };
  if (!mascota) return { r: 'sin' };
  if (!mascota.cosas) mascota.cosas = [];
  if (tiene(mascota, id)) return { r: 'ya' };
  if (!gastarHuesitos(a.precio)) return { r: 'faltan', faltan: a.precio - (player.huesitos || 0) };
  mascota.cosas.push(id); save();
  emit('sonido', 'adopt');
  // el diario de la mascota: una frase para leer (y un regalito por leerla: ui la muestra y llama a leerDiario)
  if (mascota) emit('mascotienda', { que: 'diario', frase: a.frase.replace('{n}', mascota.name) });
  return { r: 'ok' };
}
function leerDiario() { ganarHuesitos(3, '¡Leíste el diario!'); }
// ponérselo o quitárselo a una mascota (los juguetes no se ponen: se usan)
function equipar(p, id, on) {
  const a = articulo(id); if (!p || !a || !tiene(p, id) || a.tipo === 'juguete') return;
  ponerA(p, conArticulo(p.extras, a, on)); save();
}
// probar (sin comprar): se ve puesto hasta que se pruebe otra cosa o se cierre la tienda
function probar(p, id) {
  const a = articulo(id); if (!p || !a || a.tipo === 'juguete') return;
  ponerExtras(p.obj, conArticulo(p.extras, a, true));
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
  // la cámara de la ventana mira desde el centro de la sala (así no la tapan la pared del fondo ni el biombo del
  // probador), y Nina mira hacia ella
  const S = MASCOTIENDA.sala, yaw = z.vista !== undefined ? z.vista : Math.atan2(S.x - player.pos.x, S.z - player.pos.z);
  cam.menuYaw = yaw; player.facing = yaw;
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
const cual = () => Math.min(elegida, Math.max(0, player.pets.length - 1));   // (por si alguna se fue a casa)
function updateMascotienda(dt) {
  robiHabla(dt);
  // la cuerda del globo va a la mano izquierda de Nina (pets/extras.js la dibuja); con burbuja o alitas flotan a la
  // altura de su hombro (sobre el suelo donde está ella)
  const mano = player.ch && player.ch.bones && player.ch.bones.HandL, hombro = player.ch && player.ch.bones && player.ch.bones.UpperArmL;
  const hy = hombro && !player.seat ? Math.min(2.2, Math.max(0.8, hombro.getWorldPosition(_v).y - player.ch.root.position.y)) : null;
  for (const p of player.pets) {
    p.obj.hombro = hy; p.obj.salta = player.air;   // (con alitas, aletea y sube cuando ella salta)
    if (!p.obj.ext || !p.obj.ext.globo) continue;
    if (!mano) { p.obj.mano = null; continue; }
    p.obj.mano = mano.getWorldPosition(p.obj.mano || new THREE.Vector3());
  }
  if (state.mode !== 'mascotienda') return;
  const p = player.pets[cual()]; if (!p) return;
  const yaw = cam.menuYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  p.pos.set(player.pos.x + fx * 1.5 + rx * 1.2, 0, player.pos.z + fz * 1.5 + rz * 1.2);
  p.obj.root.position.copy(p.pos); p.obj.root.rotation.y = yaw - 0.4;
}

const mascotienda = {
  comprados: p => [...((p && p.cosas) || [])],   // (lo de esa mascota)
  comprar, equipar, probar, dejarDeProbar, cerrar: cerrarMascotienda, leerDiario, puesto,
  elegir(i) { elegida = i; dejarDeProbar(); }, elegida: () => cual(),
};

export { cargarMascotienda, mascotienda, updateMascotienda };
