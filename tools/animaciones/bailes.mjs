// Bailes de "farmear aura" (memes que les gustan a los niños), horneados en nina_base.glb junto a las 11 animaciones
// de siempre (tools/separar_glb.mjs → agregarBailes). Se arman con las mismas utilidades que reanimar_avatar.py
// (pose.mjs). Cada baile: función (t, T) → pose.
//   aura        "Farmear aura" (el niño del bote, Pacu Jalur): con calma, una mano sale rodando desde el pecho y barre
//               hacia el lado, después la otra; las dos manos giran una alrededor de la otra frente al pecho y al final
//               apunta adelante. Balanceo de cadera, rodillas y cabeza al ritmo, echado un poco hacia atrás.
//   seis_siete  "Six seven": manos adelante con las palmas hacia arriba, subiendo y bajando alternadas como una
//               balanza; hombros encogidos y la cabeza siguiendo.
//   sigma       "Mirada sigma": mira hacia un lado, gira lento hasta mirar de frente con el mentón arriba, sostiene la
//               mirada, asiente una vez y vuelve a la calma.
//   take_l, siuu, griddy, spin, fresh, floss: ver cada función. (Las caras van en src/characters/catalog/acciones.js.)
// Los que giran (siuu, spin) giran la cadera y los pies con ella, y terminan mirando hacia donde empezaron.
import * as THREE from 'three';
import { E, K, TAU, lerp, crearPoses, esqueleto } from './pose.mjs';
import { juegos } from './juegos.mjs';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const FPS = 30;
const REPOSO = { lower: 13, swing: 4, elbow: 14, hand: 6 };   // brazo relajado (como en idle)

export function bailes(S) {
  const { Pose, ponerPie, brazo, piesQuietos } = crearPoses(S), { SX, H0, FOOTX } = S;
  // suma de "fases" de un brazo: cada fase empieza y termina en REPOSO, así se pueden solapar
  const sumar = (...fases) => {
    const r = { ...REPOSO };
    for (const f of fases) for (const [k, v] of Object.entries(f)) r[k] = (r[k] ?? 0) + v - (REPOSO[k] ?? 0);
    return r;
  };
  const enFase = (u, largo) => u >= 0 && u <= largo;

  // --- Farmear aura (4,4 s, 8 tiempos de 0,55 s) ---
  const BEAT = 0.55;
  function barrido(u) {   // una mano sale del pecho rodando la muñeca y barre hacia el lado (1,35 s)
    if (!enFase(u, 1.35)) return REPOSO;
    const amp = K([[0, 0], [0.25, 1], [0.9, 1], [1.2, 0]], u), roll = TAU * u / 0.3;
    return {
      swing: K([[0, 4], [0.3, 70], [0.85, 15], [1.35, 4]], u), lower: K([[0, 13], [0.3, -5], [0.85, -78], [1.35, 13]], u),
      elbow: K([[0, 14], [0.3, 65], [0.85, 18], [1.35, 14]], u), foreZ: K([[0, 0], [0.3, 25], [0.85, 0], [1.35, 0]], u),
      twist: K([[0, 0], [0.3, -20], [0.85, 10], [1.35, 0]], u),
      hand: 6 + amp * 16 * Math.cos(roll), handZ: amp * 26 * Math.sin(roll),
    };
  }
  function rodar(u, lado) {   // las dos manos giran una alrededor de la otra frente al pecho (1,2 s)
    if (!enFase(u, 1.2)) return REPOSO;
    const e = K([[0, 0], [0.25, 1], [0.95, 1], [1.2, 0]], u), a = TAU * u / 0.55 + (lado > 0 ? 0 : Math.PI);
    return {
      swing: lerp(4, 48, e), lower: lerp(13, 2, e), elbow: lerp(14, 96 + 14 * Math.sin(a), e),
      foreZ: e * (12 + 16 * Math.cos(a)), twist: lerp(0, -10, e), hand: lerp(6, 10, e),
    };
  }
  function apuntar(u) {   // apunta adelante, un poco hacia arriba (1,1 s)
    if (!enFase(u, 1.1)) return REPOSO;
    return {
      swing: K([[0, 4], [0.35, 88], [0.8, 88], [1.1, 4]], u), lower: K([[0, 13], [0.35, 6], [0.8, 6], [1.1, 13]], u),
      elbow: K([[0, 14], [0.35, 4], [0.8, 4], [1.1, 14]], u), hand: K([[0, 6], [0.35, -8], [0.8, -8], [1.1, 6]], u),
    };
  }
  function aura(t) {
    const p = new Pose(), b = t / BEAT;
    const golpe = 0.5 + 0.5 * Math.cos(TAU * b);          // 1 en cada tiempo
    const vaiven = Math.sin(Math.PI * b);                  // de lado a lado cada 2 tiempos
    p.hips.set(SX.R * 0.014 * vaiven, H0 - 0.02 - 0.012 * golpe, 0);
    p.rot.Hips = E({ z: SX.R * 3 * vaiven, y: 5 * vaiven });
    p.rot.Spine = E({ x: -3, z: -SX.R * 2 * vaiven });                                // echado un poco hacia atrás
    p.rot.Chest = E({ x: -2, y: -6 * vaiven, z: -SX.R * 1.5 * vaiven });
    // la cabeza sigue a la mano que se mueve y asiente con calma en cada tiempo
    const mira = K([[0, 0], [0.6, 12], [1.2, 0], [1.7, -12], [2.3, 0], [4.4, 0]], t);
    p.rot.Neck = E({ x: 2 * golpe, y: SX.R * mira * 0.4 });
    p.rot.HeadBone = E({ x: 5 * golpe - 3, y: SX.R * mira * 0.6, z: SX.R * 4 * vaiven });
    brazo(p, 'R', sumar(barrido(t), rodar(t - 2.2, 1), apuntar(t - 3.3)));
    brazo(p, 'L', sumar(barrido(t - 1.1), rodar(t - 2.2, -1)));
    piesQuietos(p, { abre: 0.03, yaw: 9 });
    return p;
  }

  // --- Six seven (2,4 s: 3 vueltas de balanza) ---
  function seisSiete(t, T) {
    const p = new Pose(), e = K([[0, 0], [0.25, 1], [T - 0.25, 1], [T, 0]], t);
    const a = Math.sin(TAU * t / 0.8), encoge = 0.5 + 0.5 * Math.cos(TAU * t / 0.4);
    p.hips.set(0, H0 - 0.012 - 0.008 * encoge * e, 0);
    p.rot.Spine = E({ x: 2 });
    p.rot.Chest = E({ x: -2 * e, z: SX.R * 2.5 * a * e });
    p.rot.Neck = E({ z: -SX.R * 2 * a * e });
    p.rot.HeadBone = E({ z: -SX.R * 6 * a * e, x: 3 * encoge * e - 2 * e, y: SX.R * 5 * a * e });
    for (const [sd, lado] of [['R', 1], ['L', -1]]) {
      // mano adelante a la altura del pecho, palma hacia arriba; sube y baja al revés que la otra
      brazo(p, sd, {
        lower: lerp(13, 4 - 3 * encoge, e), swing: lerp(4, 26, e), elbow: lerp(14, 92 + 24 * a * lado, e),
        giro: 80 * e, hand: lerp(6, -12, e), twist: -8 * e,
      });
    }
    piesQuietos(p);
    return p;
  }

  // --- Mirada sigma (4,5 s, una vez) ---
  function sigma(t, T) {
    const p = new Pose(), e = K([[0, 0], [0.4, 1], [T - 0.6, 1], [T, 0]], t);
    const giro = K([[0, 0], [0.5, -38], [1.3, -38], [2.3, 0], [T, 0]], t);           // mira a un lado y vuelve lento
    const menton = K([[0, 0], [1.3, 0], [2.3, -7], [3.2, -7], [3.5, 4], [3.8, -4], [T, 0]], t);   // arriba; asiente
    const inclina = K([[0, 0], [2.3, 0], [2.8, 3], [3.8, 3], [T, 0]], t);
    // el peso en una pierna y el pecho afuera
    p.hips.set(SX.R * 0.022 * e, H0 - 0.012 * e, 0);
    p.rot.Hips = E({ z: SX.R * 3 * e });
    p.rot.Spine = E({ x: -2 * e, z: -SX.R * 2.5 * e });
    p.rot.Chest = E({ x: -4 * e, z: -SX.R * 1.5 * e, y: giro * 0.15 });
    p.rot.Neck = E({ y: SX.R * giro * 0.35, x: menton * 0.3 });
    p.rot.HeadBone = E({ y: SX.R * giro * 0.65, x: menton * 0.7, z: SX.R * inclina });
    for (const sd of ['L', 'R']) brazo(p, sd, { lower: lerp(13, 9, e), swing: lerp(4, -6, e), elbow: lerp(14, 22, e), hand: lerp(6, 14, e) });
    for (const sd of ['L', 'R']) ponerPie(p, sd, SX[sd] * (FOOTX + 0.02), 0, { yaw: SX[sd] * 9 });
    return p;
  }

  // --- utilidades para los que giran: el cuerpo entero gira `g` grados (en la cadera) y los pies giran con él
  const girarXZ = (x, z, g) => { const a = g * Math.PI / 180; return [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)]; };
  function pieGirado(p, sd, x, z, g, o = {}) { const [gx, gz] = girarXZ(x, z, g); ponerPie(p, sd, gx, gz, { ...o, yaw: (o.yaw ?? SX[sd] * 7) + g }); }
  const frac = x => x - Math.floor(x);

  // --- Take the L (2,4 s, 8 tiempos de 0,3 s): la mano derecha hace una L sobre la frente; saltitos sobre el pie
  // izquierdo mientras la pierna derecha patea hacia el lado y vuelve en cada tiempo
  function takeL(t) {
    const p = new Pose(), b = t / 0.3, salto = Math.abs(Math.sin(Math.PI * b)), fuera = 0.5 + 0.5 * Math.sin(Math.PI * b);
    p.hips.set(SX.L * 0.02, H0 - 0.03 + 0.04 * salto, 0);
    p.rot.Hips = E({ z: SX.L * 4, y: 6 * Math.sin(Math.PI * b) });
    p.rot.Spine = E({ x: 3, z: -SX.L * 3 });
    p.rot.Chest = E({ y: -5 * Math.sin(Math.PI * b) });
    p.rot.Neck = E({ x: 2 * salto });
    p.rot.HeadBone = E({ x: 4 * salto - 4, z: SX.R * 6, y: SX.R * 8 });
    // la L: la muñeca al costado de la frente, arriba del ojo, con el codo hacia afuera; la mano se dobla hacia la
    // frente (con la muñeca más al centro, el antebrazo tapaba un ojo)
    brazo(p, 'R', { lower: 13, swing: 20, elbow: 90, hand: -20, handZ: -35 });
    p.arm.R = [(P, W) => P.HeadBone.clone().add(V3(SX.R * 0.13, 0.17, 0.19).applyQuaternion(W.HeadBone)), null, V3(SX.R, -0.2, 0.1), 1];
    brazo(p, 'L', { lower: 8 + 10 * fuera, swing: 12 * Math.sin(Math.PI * b), elbow: 25, hand: 8 });
    ponerPie(p, 'L', SX.L * (FOOTX + 0.01), 0, { yaw: SX.L * 7, lift: 0.035 * salto });
    ponerPie(p, 'R', SX.R * (FOOTX + 0.06 + 0.13 * fuera), 0.03, { yaw: SX.R * 20, lift: 0.07 + 0.06 * fuera, pitch: 10, roll: SX.R * 12 * fuera });
    return p;
  }

  // --- Siuuu (3,8 s, una vez): carrerita en el lugar, salto con media vuelta, cae con las piernas abiertas y los brazos
  // estirados hacia abajo y afuera (la pose del grito), la sostiene y termina la vuelta caminando
  function siuu(t, T) {
    const p = new Pose();
    const g = K([[0, 0], [0.9, 0], [1.3, 180], [2.8, 180], [3.7, 360], [T, 360]], t);
    const alto = K([[0, 0], [0.75, 0], [0.9, -0.08], [1.12, 0.2], [1.35, -0.09], [1.6, -0.05], [2.8, -0.05], [3.3, 0], [T, 0]], t);
    const corre = t < 0.75 ? Math.abs(Math.sin(TAU * t / 0.7)) : 0;
    const pose = K([[0, 0], [1.2, 0], [1.4, 1], [2.8, 1], [3.3, 0], [T, 0]], t), aire = Math.max(0, alto - 0.01);
    p.hips.set(0, H0 - 0.012 + alto + 0.03 * corre, 0);
    p.rot.Hips = E({ y: g, x: 4 * pose });
    p.rot.Spine = E({ x: -4 * pose });
    p.rot.Chest = E({ x: -8 * pose });                                                   // pecho afuera
    p.rot.Neck = E({ x: -4 * pose });
    p.rot.HeadBone = E({ x: -10 * pose + 3 * corre });                                   // la cabeza arriba
    const salto = K([[0, 0], [0.85, 0], [1.0, 1], [1.3, 1], [1.4, 0], [T, 0]], t);
    for (const [sd, lado] of [['R', 1], ['L', -1]]) {
      const trote = t < 0.75 ? Math.max(0, Math.sin(TAU * t / 0.7 + (lado > 0 ? 0 : Math.PI))) : 0;
      brazo(p, sd, {
        lower: lerp(13 - 10 * salto, -2, pose), swing: lerp(10 * lado * Math.sin(TAU * t / 0.7) * (t < 0.75 ? 1 : 0) - 20 * salto, -28, pose),
        elbow: lerp(30 + 30 * salto, 6, pose), hand: lerp(6, -12, pose), twist: lerp(0, -20, pose),
      });
      const abre = lerp(0.012, 0.13, pose);
      pieGirado(p, sd, SX[sd] * (FOOTX + abre), 0, g, { lift: 0.06 * trote + aire + 0.05 * salto, yaw: SX[sd] * lerp(7, 20, pose) });
    }
    return p;
  }

  // --- Griddy (2,4 s, un toque de talón por tiempo de 0,3 s): taloneos adelante alternados, brazos bombeando
  function griddy(t) {
    const p = new Pose(), b = t / 0.3, golpe = Math.abs(Math.sin(Math.PI * b)), lado = Math.sin(Math.PI * b);
    p.hips.set(SX.R * 0.012 * lado, H0 - 0.035 + 0.012 * (1 - golpe), 0);
    p.rot.Hips = E({ y: 8 * lado, x: 4 });
    p.rot.Spine = E({ x: 6 });                                                           // inclinado adelante
    p.rot.Chest = E({ x: 4, y: -10 * lado });
    p.rot.Neck = E({ x: -4 });
    p.rot.HeadBone = E({ x: -4 + 5 * golpe, y: 6 * lado });
    for (const [sd, s] of [['R', 1], ['L', -1]]) {
      const u = frac(b / 2 + (s > 0 ? 0 : 0.5)), tap = u < 0.5 ? Math.sin(Math.PI * u / 0.5) : 0;
      ponerPie(p, sd, SX[sd] * (FOOTX + 0.02), 0.17 * tap - 0.02, { pitch: -32 * tap, yaw: SX[sd] * 10 });
      brazo(p, sd, { lower: 6, swing: 30 - 34 * s * lado, elbow: 85 + 10 * s * lado, hand: 12, twist: -10 });
    }
    return p;
  }

  // --- Spin (1,8 s, una vez): se agacha, gira una vuelta en punta de pie con los brazos abiertos y termina ¡ta-da!
  function spin(t, T) {
    const p = new Pose();
    const g = K([[0, 0], [0.3, 0], [1.3, 360], [T, 360]], t);
    const agacha = K([[0, 0], [0.25, 1], [0.4, 0], [1.3, 0], [1.4, 0.6], [1.55, 0], [T, 0]], t);
    const gira = K([[0, 0], [0.3, 0], [0.45, 1], [1.2, 1], [1.35, 0], [T, 0]], t), tada = K([[0, 0], [1.3, 0], [1.5, 1], [1.65, 1], [T, 0]], t);
    p.hips.set(0, H0 - 0.012 - 0.05 * agacha + 0.02 * gira, 0);
    p.rot.Hips = E({ y: g });
    p.rot.Chest = E({ x: -3 * tada });
    p.rot.HeadBone = E({ x: -6 * tada + 4 * agacha });
    for (const sd of ['R', 'L']) {
      brazo(p, sd, {
        lower: 13 + 10 * agacha - 83 * gira - 125 * tada, swing: 30 * agacha + 10 * tada, elbow: 14 + 70 * agacha + 10 * tada,
        hand: 6 - 10 * gira, handZ: 15 * tada,
      });
      // gira sobre el pie izquierdo, en punta; el derecho se recoge junto a la rodilla
      const recoge = sd === 'R' ? gira : 0;
      pieGirado(p, sd, SX[sd] * (FOOTX + 0.012 - 0.07 * recoge), 0.02 * recoge, g, { lift: 0.14 * recoge, pitch: sd === 'L' ? 18 * gira : 20 * recoge });
    }
    return p;
  }

  // --- Fresh (2,4 s, de lado a lado cada 1,2 s): los antebrazos cruzan frente a la cintura, con un golpe de muñeca
  // en cada extremo, mientras la cadera se va al otro lado
  function fresh(t) {
    const p = new Pose(), a = Math.sin(TAU * t / 1.2), rebote = Math.abs(Math.sin(TAU * t / 0.6)), golpe = Math.abs(a) ** 4;
    p.hips.set(SX.R * 0.04 * a, H0 - 0.035 + 0.015 * rebote, 0);
    p.rot.Hips = E({ z: SX.R * 5 * a, y: -6 * a });
    p.rot.Spine = E({ z: -SX.R * 3 * a });
    p.rot.Chest = E({ z: -SX.R * 3 * a, y: 10 * a });
    p.rot.Neck = E({ z: -SX.R * 2 * a });
    p.rot.HeadBone = E({ z: -SX.R * 6 * a, x: 4 * rebote - 2 });
    brazo(p, 'R', { lower: 13 + 30 * a, swing: 32, elbow: 68, hand: 10 + 25 * golpe, handZ: 15 * a });
    brazo(p, 'L', { lower: 13 - 30 * a, swing: 32, elbow: 68, hand: 10 + 25 * golpe, handZ: -15 * a });
    piesQuietos(p, { abre: 0.05, yaw: 12 });
    return p;
  }

  // --- Floss (2 s, los brazos van y vuelven cada 0,5 s): los dos brazos estirados van juntos hacia un lado, uno
  // CRUZANDO POR DELANTE de la cadera y el otro POR DETRÁS del cuerpo (detrás de la otra cadera); al volver cambian:
  // cada brazo pasa por el costado de su cadera, de atrás hacia adelante o al revés. La cadera va al lado contrario.
  // (La primera versión sólo abría el brazo de atrás hacia el costado: parecían los dos adelante.)
  function recorridoFloss(s) {   // s = 1: cruzando por delante; 0: al costado; -1: detrás del cuerpo
    return s >= 0
      ? { lower: lerp(-14, 50, s), swing: 30 * s, twist: -10 * s }
      : { lower: lerp(-14, 10, -s), swing: -52 * -s, twist: 15 * -s };
  }
  function floss(t) {
    const p = new Pose(), sen = Math.sin(TAU * t / 0.5), a = Math.sign(sen) * Math.abs(sen) ** 0.6;   // remate en los extremos
    p.hips.set(SX.R * 0.045 * a, H0 - 0.03, 0);
    p.rot.Hips = E({ z: SX.R * 7 * a, y: -5 * a });
    p.rot.Spine = E({ z: -SX.R * 4 * a, x: 2 });
    p.rot.Chest = E({ z: -SX.R * 3 * a, y: 6 * a });
    p.rot.HeadBone = E({ z: -SX.R * 5 * a, x: 3 * Math.abs(a) });
    // a > 0: los brazos van hacia la izquierda (el derecho cruza por delante, el izquierdo queda detrás)
    brazo(p, 'R', { ...recorridoFloss(a), elbow: 6, hand: 4 });
    brazo(p, 'L', { ...recorridoFloss(-a), elbow: 6, hand: 4 });
    piesQuietos(p, { abre: 0.03 });
    return p;
  }

  // --- Mirar el cartel (8 s, en bucle): de pie frente a un cartel alto, levanta la vista al título y lo recorre de un
  // lado a otro, baja a la parte del medio y la recorre, baja a la franja de abajo (fecha, hora, lugar, premios) y la
  // lee por partes con pausitas; se lleva la mano al mentón, asiente y vuelve a mirar el título. Los ojos son una
  // textura: todo el "leer" lo hacen la cabeza y el cuello. (Lo usan el espectador del cartel y la jugadora.)
  function mirarCartel(t, T) {
    const p = new Pose();
    // altura de la mirada (negativo = arriba) y recorrido de lado a lado (+ = hacia su derecha)
    const alto = K([[0, -20], [0.7, -27], [2.6, -27], [3.1, -18], [4.6, -18], [5.0, -9], [6.4, -9], [7.2, -22], [T, -20]], t);
    const lado = K([[0, 0], [0.7, 14], [1.3, 14], [2.4, -16], [2.7, -16], [3.1, -10], [4.3, 12], [4.6, 12], [5.0, -18],
      [5.25, -18], [5.4, -6], [5.65, -6], [5.8, 6], [6.05, 6], [6.2, 17], [6.5, 17], [7.2, 0], [T, 0]], t);
    const asiente = K([[0, 0], [6.6, 0], [6.8, 6], [7.0, -1], [7.2, 5], [7.45, 0], [T, 0]], t);
    const menton = K([[0, 0], [5.6, 0], [6.1, 1], [7.1, 1], [7.6, 0], [T, 0]], t);          // la mano al mentón
    const peso = Math.sin(TAU * t / T);                                                    // traspaso de peso lento
    p.hips.set(SX.R * 0.012 * peso, H0 - 0.012, 0);
    p.rot.Hips = E({ z: SX.R * 1.8 * peso });
    p.rot.Spine = E({ x: -2, z: -SX.R * 1.2 * peso });
    p.rot.Chest = E({ x: -3 + alto * 0.08, y: SX.R * lado * 0.15 });                       // el pecho un poco atrás
    p.rot.Neck = E({ x: alto * 0.35, y: SX.R * lado * 0.35 });
    p.rot.HeadBone = E({ x: alto * 0.6 + asiente, y: SX.R * lado * 0.5, z: -SX.R * lado * 0.08 });
    brazo(p, 'L', { lower: 12, swing: 3, elbow: 16, hand: 6 });
    brazo(p, 'R', { lower: 12, swing: 3, elbow: 16, hand: 6 });
    // mano derecha al mentón: IK hasta un punto bajo el mentón, en el espacio de la cabeza
    if (menton > 0) p.arm.R = [(P, W) => P.HeadBone.clone().add(V3(SX.R * 0.03, -0.155, 0.11).applyQuaternion(W.HeadBone)), null, V3(SX.R, -1, -0.2), menton];
    piesQuietos(p, { abre: 0.02 });
    return p;
  }

  return [
    { nombre: 'mirar_cartel', fn: mirarCartel, T: 8, loop: true },
    { nombre: 'aura', fn: aura, T: 8 * BEAT, loop: true },
    { nombre: 'seis_siete', fn: seisSiete, T: 2.4, loop: true },
    { nombre: 'sigma', fn: sigma, T: 4.5, loop: false },
    { nombre: 'take_l', fn: takeL, T: 2.4, loop: true },
    { nombre: 'siuu', fn: siuu, T: 3.8, loop: false },
    { nombre: 'griddy', fn: griddy, T: 2.4, loop: true },
    { nombre: 'spin', fn: spin, T: 1.8, loop: false },
    { nombre: 'fresh', fn: fresh, T: 2.4, loop: true },
    { nombre: 'floss', fn: floss, T: 2.0, loop: true },
  ];
}

// Agrega los bailes y las animaciones de los juegos (juegos.mjs) al documento (el de nina_base.glb): rotación de los
// 17 huesos y posición de la cadera, a 30 cuadros por segundo, como las demás animaciones.
// la pose del último cuadro de una animación del modelo: { rot: { hueso: Quaternion }, hips: Vector3 }
function poseFinal(doc, nombre) {
  const a = doc.getRoot().listAnimations().find(x => x.getName() === nombre); if (!a) return null;
  const r = { rot: {}, hips: null };
  for (const c of a.listChannels()) {
    const o = c.getSampler().getOutput(), v = o.getElement(o.getCount() - 1, []), n = c.getTargetNode().getName();
    if (c.getTargetPath() === 'rotation') r.rot[n] = new THREE.Quaternion(...v);
    else if (c.getTargetPath() === 'translation' && n === 'Hips') r.hips = new THREE.Vector3(...v);
  }
  return r;
}

export function agregarBailes(doc) {
  const S = esqueleto(doc), { resolver } = crearPoses(S), buf = doc.getRoot().listBuffers()[0];
  const acc = (arr, tipo) => doc.createAccessor().setArray(arr).setType(tipo).setBuffer(buf);
  const hechos = [];
  for (const { nombre, fn, T, loop } of [...bailes(S), ...juegos(S, { sit: poseFinal(doc, 'sit') })]) {
    const n = Math.round(T * FPS), tiempos = Float32Array.from({ length: n + 1 }, (_, i) => (i === n ? T : i / FPS));
    const rot = Object.fromEntries(S.HUESOS.map(b => [b, new Float32Array((n + 1) * 4)])), pos = new Float32Array((n + 1) * 3);
    const antes = {};
    tiempos.forEach((tt, i) => {
      const p = fn(tt, T);
      resolver(p);
      for (const b of S.HUESOS) {
        const q = p.rot[b].clone().normalize();
        if (antes[b] && antes[b].dot(q) < 0) q.set(-q.x, -q.y, -q.z, -q.w);   // sin saltos de signo
        antes[b] = q; rot[b].set([q.x, q.y, q.z, q.w], i * 4);
      }
      pos.set([p.hips.x, p.hips.y, p.hips.z], i * 3);
    });
    const anim = doc.createAnimation(nombre).setExtras({ loop }), entrada = acc(tiempos, 'SCALAR');
    const canal = (nodo, ruta, salida) => {
      const s = doc.createAnimationSampler().setInput(entrada).setOutput(salida).setInterpolation('LINEAR');
      anim.addSampler(s).addChannel(doc.createAnimationChannel().setTargetNode(nodo).setTargetPath(ruta).setSampler(s));
    };
    for (const b of S.HUESOS) canal(S.NODO[b], 'rotation', acc(rot[b], 'VEC4'));
    canal(S.NODO.Hips, 'translation', acc(pos, 'VEC3'));
    hechos.push(`${nombre} (${T.toFixed(1)} s)`);
  }
  console.log('  bailes:', hechos.join(', '));
}
