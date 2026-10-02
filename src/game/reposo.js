// El reposo de la jugadora: si se queda quieta, cuando su mascota termina un ciclo de espera (pets/follow.js; sin
// mascotas, después de ESPERA_SOLA segundos) busca pasto cerca (world/pasto.js: no se sienta donde pasa la gente),
// camina hasta ahí y se sienta en el suelo; bosteza, se acuesta boca abajo a leer un libro y ahí se queda leyendo.
// Cada tanto cierra el libro, se sienta a leer sentada, y después se vuelve a acostar a leer. Cada vez un libro
// distinto (characters/libro.js). Moverse (o cualquier otra cosa) lo deja. Las animaciones: tools/animaciones/reposo.mjs.
import { THREE } from '../engine/three.js';
import { scene } from '../engine/renderer.js';
import { state } from '../core/state.js';
import { pick } from '../core/math.js';
import { avatarDo, avatarStop } from '../characters/animator.js';
import { LIBROS, abrir, agarre, hacerLibro, pasarHoja, tirarLibro } from '../characters/libro.js';
import { pastoCerca } from '../world/pasto.js';
import { player } from './actors.js';

export const ANIMS_REPOSO = new Set(['sentarse_suelo', 'bostezo', 'leer_sentada', 'leer_acostada', 'acostarse_leer', 'sentarse_leer']);
const ESPERA_SOLA = 40, REINTENTO = 20, LEJOS = 12;
// cada fase: animación, cuánto dura, si el libro está y abierto, y cuál sigue
const FASES = {
  camina: { sigue: 'sentarse', dur: 15 },
  sentarse: { anim: 'sentarse_suelo', dur: 2.2, sigue: 'bostezo' },
  bostezo: { anim: 'bostezo', dur: 3.4, sigue: 'acostarse' },
  acostarse: { anim: 'acostarse_leer', dur: 2.3, libro: true, sigue: 'leeAcostada' },
  leeAcostada: { anim: 'leer_acostada', loop: true, dur: 20, libro: true, abierto: true, sigue: 'cierraAcostada' },
  cierraAcostada: { dur: 0.7, libro: true, sigue: 'sentarseLeer' },
  sentarseLeer: { anim: 'sentarse_leer', dur: 2.3, libro: true, sigue: 'leeSentada' },
  leeSentada: { anim: 'leer_sentada', loop: true, dur: 15, libro: true, abierto: true, sigue: 'cierraSentada' },
  cierraSentada: { dur: 0.7, libro: true, sigue: 'acostarse' },
};

let R = null, quieta = 0, espera = 0;
const _l = new THREE.Vector3(), _r = new THREE.Vector3(), _h = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();

function cancelar() {
  if (!R) return;
  if (R.fase === 'camina') player.ir = null;
  const ch = player.ch;
  if (ch.sp && ANIMS_REPOSO.has(ch.sp.name)) avatarStop(ch);
  quitarLibro();
  R = null;
}
function quitarLibro() { if (R && R.libro) { scene.remove(R.libro); tirarLibro(R.libro); R.libro = null; } }
function entrar(fase) {
  const F = FASES[fase];
  R.fase = fase; R.t = 0;
  if (F.anim) avatarDo(player.ch, F.anim, { loop: !!F.loop, hold: !F.loop });
  if (F.libro && !R.libro) { R.libro = hacerLibro(R.cual); R.libro.scale.setScalar(0.01); scene.add(R.libro); R.abre = 0; R.hoja = 4; R.aparece = 0; }
  if (!F.libro) quitarLibro();
}
// ¿ya puede descansar? cuando alguna de sus mascotas terminó un ciclo de espera (o sola, después de un rato)
const lista = () => (player.pets.length ? player.pets.some(p => p.ocio && p.ocio.vueltas >= 1) || quieta > ESPERA_SOLA * 3 : quieta > ESPERA_SOLA);

export function updateReposo(dt) {
  const ch = player.ch;
  const libre = state.mode === 'play' && !player.seat && !player.air && !player.mando && ch;
  // otra cosa (moverse, una acción del menú, sentarse en una banca…) lo deja
  const otra = ch && ch.sp && !ANIMS_REPOSO.has(ch.sp.name);
  if (!libre || otra || (R && R.fase !== 'camina' && player.speed01 > 0.05)) { cancelar(); quieta = 0; return; }
  if (!R) {
    if (player.speed01 > 0.05) { quieta = 0; return; }
    quieta += dt;
    if ((espera -= dt) > 0 || !lista()) return;
    const p = pastoCerca(player.pos.x, player.pos.z, LEJOS);
    if (!p) { espera = REINTENTO; return; }   // no hay pasto cerca: no se sienta en la calle
    R = { cual: pick(LIBROS), t: 0 };
    if (Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < 0.3) entrar('sentarse');
    else { player.ir = { x: p.x, z: p.z }; R.fase = 'camina'; }
    return;
  }
  R.t += dt;
  const F = FASES[R.fase];
  if (R.fase === 'camina') {
    if (player.ir && player.ir.llegue) { player.ir = null; entrar('sentarse'); }
    else if (!player.ir || R.t > F.dur) { cancelar(); espera = REINTENTO; }   // no pudo llegar
    return;
  }
  if (R.t >= F.dur) entrar(F.sigue);
  if (R.libro) moverLibro(dt);
}

// El libro tomado con las dos manos por su mapa de anclaje (characters/libro.js, `agarre`: el centro del borde
// exterior de cada tapa): cada borde va a la palma de su mano (la muñeca + PALMA en la dirección del antebrazo), y el
// libro se ajusta un poco al ancho entre las palmas; mira hacia la cara. Se abre para leer y cada tanto pasa una hoja.
const PALMA = 0.055, _f = new THREE.Vector3();
function palma(mano, codo, out) {
  mano.getWorldPosition(out); codo.getWorldPosition(_f);
  return out.addScaledVector(_f.subVectors(out, _f).normalize(), PALMA * player.ch.k);
}
function moverLibro(dt) {
  const F = FASES[R.fase], L = R.libro, b = player.ch.bones, k = player.ch.k;   // (el libro está en unidades del modelo)
  R.aparece = Math.min(1, (R.aparece || 0) + dt * 4);
  R.abre += ((F.abierto ? 1 : 0) - R.abre) * Math.min(1, dt * 5);
  abrir(L, R.abre);
  if (F.abierto) { R.hoja -= dt; if (R.hoja < -0.6) R.hoja = 4 + Math.random() * 3; pasarHoja(L, Math.max(0, -R.hoja / 0.6)); } else pasarHoja(L, 0);
  palma(b.HandL, b.ForearmL, _l); palma(b.HandR, b.ForearmR, _r); b.HeadBone.getWorldPosition(_h);
  const ajuste = Math.min(1.15, Math.max(0.85, _l.distanceTo(_r) / (agarre(R.abre).ancho * k)));
  L.scale.setScalar(k * ajuste * R.aparece);
  L.position.addVectors(_l, _r).multiplyScalar(0.5);
  _x.subVectors(_r, _l).normalize();                                        // hacia la mano derecha
  // hacia la cara, y además hacia Nina (hacia atrás de donde mira): así queda inclinado como un libro que se lee, no
  // plano sobre la falda
  const f = player.facing;
  _z.subVectors(_h, L.position).normalize(); _z.x -= Math.sin(f) * 0.7; _z.z -= Math.cos(f) * 0.7;
  _z.addScaledVector(_x, -_z.dot(_x)).normalize();
  _y.crossVectors(_z, _x);
  L.quaternion.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}
