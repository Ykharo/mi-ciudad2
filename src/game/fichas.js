// Las fichas de las mascotas (el archivador: ui/panels/archivador.js, botón 🐾 Mascotas). Por mascota:
//   adopcion   fecha de adopción (ISO)
//   estado     { energia, diversion } de 0 a 100; la felicidad sale de los dos. Cambian solos mientras se juega:
//              pasear cansa (más corriendo) y descansar (Nina quieta o sentada) recupera; el tiempo aburre, y los juegos,
//              la competencia y los artículos puestos (patines, globo…) divierten. El jarabe arcoíris alegra.
//   controles  controles médicos: [{ tipo, fecha (ISO), hecho }]. Al adoptar: el de adopción (hecho) y los próximos
//              (vacunas a los 7 días, control general a los 30). La veterinaria todavía no existe: quedan pendientes.
//   fotos      hasta FOTOS fotos (imágenes data:jpg chicas) que se sacan desde la ficha
// Todo va en la mascota (player.pets[i]) y se guarda con ella (game/save.js); se valida al cargar.
import { state } from '../core/state.js';
import { player, cam } from './actors.js';
import { save } from './save.js';
import { disposePet, setPetName } from '../pets/models.js';
import { enterMenu, leaveMenu } from './modes.js';
import { emit } from '../core/events.js';

export const FOTOS = 4;
const DIA = 86400000;
const hoy = () => new Date().toISOString();
const enDias = (iso, d) => new Date(new Date(iso).getTime() + d * DIA).toISOString();
const fecha = v => (typeof v === 'string' && !isNaN(Date.parse(v)) ? v : null);
const num = (v, def) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, +v)) : def);

function controlesNuevos(adopcion) {
  return [
    { tipo: 'Control de adopción', fecha: adopcion, hecho: true },
    { tipo: 'Vacunas', fecha: enDias(adopcion, 7), hecho: false },
    { tipo: 'Control general', fecha: enDias(adopcion, 30), hecho: false },
  ];
}
// completa y valida la ficha de una mascota (de lo guardado, o nueva al adoptar)
export function prepararFicha(p, g = {}) {
  p.adopcion = fecha(g.adopcion) || p.adopcion || hoy();
  const e = g.estado || {};
  p.estado = { energia: num(e.energia, 85), diversion: num(e.diversion, 80) };
  const c = Array.isArray(g.controles) ? g.controles.filter(x => x && typeof x.tipo === 'string' && fecha(x.fecha)).slice(0, 20)
    .map(x => ({ tipo: x.tipo.slice(0, 30), fecha: x.fecha, hecho: !!x.hecho })) : [];
  p.controles = c.length ? c : controlesNuevos(p.adopcion);
  p.fotos = Array.isArray(g.fotos) ? g.fotos.filter(f => typeof f === 'string' && f.startsWith('data:image/') && f.length < 60000).slice(0, FOTOS) : [];
}
export function cargarFichas(saved) {
  const pets = (saved && saved.pets) || [];
  player.pets.forEach((p, i) => prepararFicha(p, pets[i] || {}));
}

export const felicidad = p => Math.round(Math.min(100, (p.estado.energia + p.estado.diversion) / 2 + (p.extras && p.extras.arcoiris ? 8 : 0)));
// cómo está, en palabras (sin género: sirve para todas las mascotas)
export function animo(p) {
  const { energia, diversion } = p.estado;
  if (energia < 25) return { ic: '😴', texto: 'Tiene sueño' };
  if (diversion < 25) return { ic: '🥱', texto: 'Quiere jugar' };
  const f = felicidad(p);
  if (f >= 75) return { ic: '😄', texto: '¡Muy feliz!' };
  if (f >= 50) return { ic: '🙂', texto: 'Está bien' };
  return { ic: '😐', texto: 'Más o menos' };
}

// cada cuadro: el estado cambia según lo que está pasando; se guarda cada medio minuto
let guardar = 30;
export function updateFichas(dt) {
  if (state.mode === 'intro') return;
  const anda = state.mode === 'drive' || player.speed01 > 0.05, rapido = player.speed01 > 0.6;
  const juega = !!player.seat || state.mode === 'aura';
  for (const p of player.pets) {
    if (!p.estado) prepararFicha(p);
    const E = p.estado, t = p.extras && p.extras.transporte;
    E.energia = Math.max(0, Math.min(100, E.energia + dt * (anda && !t ? (rapido ? -0.7 : -0.3) : anda ? -0.1 : 0.5)));
    E.diversion = Math.max(0, Math.min(100, E.diversion + dt * (juega ? 1.2 : t ? 0.15 : -0.12)));
  }
  if ((guardar -= dt) <= 0) { guardar = 30; if (player.pets.length) save(); }
}

/* ---------- acciones del archivador ---------- */
export function renombrar(p, nombre) {
  nombre = String(nombre || '').trim().slice(0, 12); if (!nombre) return false;
  p.name = nombre; setPetName(p.obj, nombre); save(); return true;
}
export function guardarFoto(p, dataUrl) { p.fotos = [dataUrl, ...p.fotos].slice(0, FOTOS); save(); }
export function borrarFoto(p, i) { p.fotos.splice(i, 1); save(); }
export function llevarACasa(i) {
  const p = player.pets[i]; if (!p) return null;
  disposePet(p.obj); player.pets.splice(i, 1); save();
  return p;
}

// abrir y cerrar (modo 'archivador': la mascota elegida se pone delante de Nina, como en la Mascotienda)
let elegida = 0;
export function abrirArchivador() {
  if (state.mode !== 'play') return;
  enterMenu('archivador');
  elegida = Math.min(elegida, Math.max(0, player.pets.length - 1));
  emit('archivador', { que: 'abrir' });
}
export function cerrarArchivador() { save(); leaveMenu(); }
export const elegirFicha = i => { elegida = i; };
export const fichaElegida = () => elegida;
export function updateArchivador() {
  if (state.mode !== 'archivador') return;
  const p = player.pets[elegida]; if (!p) return;
  const yaw = cam.menuYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  p.pos.set(player.pos.x + fx * 1.5 + rx * 1.2, 0, player.pos.z + fz * 1.5 + rz * 1.2);
  p.obj.root.position.copy(p.pos); p.obj.root.rotation.y = yaw - 0.4;
}
