// Animaciones del reposo de la jugadora (las usa src/game/reposo.js), horneadas en nina_base.glb con los bailes.
// Cuando se queda quieta un rato: se sienta en el pasto con las piernas cruzadas, bosteza, se acuesta boca abajo a
// leer un libro y cada tanto se sienta a leer, y vuelve a acostarse. El libro lo pone el juego entre las dos manos.
//   sentarse_suelo   de pie → en cuclillas → sentada con las piernas cruzadas, las manos en las rodillas (1,8 s)
//   bostezo          sentada: estira los brazos hacia arriba echándose atrás, con la boca abierta (3 s)
//   leer_sentada     sentada con las piernas cruzadas, el libro delante, la cabeza siguiendo las líneas (4 s, bucle)
//   acostarse_leer   de leer sentada a leer acostada (por en medio, de rodillas), con el libro cerrado (2,2 s)
//   sentarse_leer    la misma, al revés: de acostada a sentada (2,2 s)
//   leer_acostada    boca abajo apoyada en los codos, el libro delante, los pies moviéndose arriba (3 s, bucle)
// Las de en medio mezclan poses ya resueltas (rotaciones locales y la cadera): `mezcla`.
import * as THREE from 'three';
import { E, TAU, lerp, smooth, crearPoses } from './pose.mjs';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function reposo(S) {
  const { Pose, resolver, brazo, piesQuietos } = crearPoses(S), { SX } = S;

  // el libro: delante del pecho (en el espacio del pecho), las manos a sus lados. Lo toman por el centro del borde
  // exterior de cada tapa (el mapa de anclaje de src/characters/libro.js: abierto a ±0,13 del lomo, cerrado a ±0,065);
  // la muñeca queda un poco antes del borde (la palma lo toca) y los codos doblados.
  const LIBRO = { abajo: -0.01, frente: 0.24, ancho: 0.118, cerrado: 0.06 };
  const manosLibro = (p, sd, polo, mas = {}) => {
    const { abajo = LIBRO.abajo, frente = LIBRO.frente, ancho = LIBRO.ancho } = mas;
    p.arm[sd] = [(P, W) => P.Chest.clone().add(V3(SX[sd] * ancho, abajo, frente).applyQuaternion(W.Chest)), null, polo, 1];
  };

  // sentada en el suelo con las piernas cruzadas (los tobillos cruzados delante, las rodillas afuera)
  function cruzadas(p) {
    p.hips.set(0, 0.105, -0.02);
    p.rot.Hips = E({ x: -4 });
    for (const sd of ['L', 'R']) {
      const otro = sd === 'L' ? 'R' : 'L';
      p.leg[sd] = [V3(SX[otro] * 0.075, sd === 'L' ? 0.055 : 0.075, sd === 'L' ? 0.25 : 0.21), E({ y: -SX[sd] * 75, z: SX[sd] * 35 }), V3(SX[sd] * 1, 0.5, 0.35)];
    }
    return p;
  }
  // manos sobre las rodillas
  const manosRodillas = (p, sd) => {
    brazo(p, sd, { lower: 20, swing: 30, elbow: 40 });
    p.arm[sd] = [V3(SX[sd] * 0.2, 0.19, 0.16), null, V3(SX[sd], -0.5, -0.6), 1];
  };
  function sentada() {
    const p = cruzadas(new Pose());
    p.rot.Spine = E({ x: 6 }); p.rot.Chest = E({ x: 3 }); p.rot.Neck = E({ x: 2 }); p.rot.HeadBone = E({ x: 2 });
    for (const sd of ['L', 'R']) manosRodillas(p, sd);
    return p;
  }
  function dePie() {
    const p = new Pose();
    piesQuietos(p);
    for (const sd of ['L', 'R']) brazo(p, sd, { lower: 13, swing: 4, elbow: 14, hand: 6 });   // como en idle
    return p;
  }
  function cuclillas() {
    const p = new Pose();
    p.hips.set(0, 0.36, -0.12);
    p.rot.Hips = E({ x: 24 }); p.rot.Spine = E({ x: 14 }); p.rot.Chest = E({ x: 6 }); p.rot.HeadBone = E({ x: -14 });
    piesQuietos(p, { abre: 0.04, yaw: 14 });
    for (const sd of ['L', 'R']) brazo(p, sd, { lower: 5, swing: 55, elbow: 25 });   // los brazos adelante, para el equilibrio
    return p;
  }
  // de rodillas, sentada sobre los talones y con el cuerpo adelante, el libro cerrado entre las manos
  function rodillas() {
    const p = new Pose();
    p.hips.set(0, 0.29, -0.05);
    p.rot.Hips = E({ x: 30 }); p.rot.Spine = E({ x: 12 }); p.rot.Chest = E({ x: 6 }); p.rot.HeadBone = E({ x: -10 });
    for (const sd of ['L', 'R']) {
      p.leg[sd] = [V3(SX[sd] * 0.1, 0.06, -0.2), E({ x: 80 }), V3(SX[sd] * 0.2, 0, 1)];
      manosLibro(p, sd, V3(SX[sd], -1, -0.2), { abajo: -0.16, frente: 0.2, ancho: LIBRO.cerrado });
    }
    return p;
  }

  function leerSentada(t, T) {
    const p = cruzadas(new Pose()), u = t / T, linea = Math.sin(TAU * u * 2);
    p.rot.Spine = E({ x: 13 }); p.rot.Chest = E({ x: 9, z: 1.5 * Math.sin(TAU * u) });
    p.rot.Neck = E({ x: 6 }); p.rot.HeadBone = E({ x: 9 + 2 * Math.abs(linea), y: 7 * linea });
    for (const sd of ['L', 'R']) manosLibro(p, sd, V3(SX[sd], -1, -0.3));
    return p;
  }
  // boca abajo, apoyada en los codos; los pies arriba, moviéndose cada uno a su ritmo
  function acostada(t = 0, T = 1) {
    const p = new Pose(), u = t / T, linea = Math.sin(TAU * u * 2);
    p.hips.set(0, 0.125, -0.05);
    p.rot.Hips = E({ x: 84 });
    p.rot.Spine = E({ x: -30 }); p.rot.Chest = E({ x: -30 });
    p.rot.Neck = E({ x: -2 }); p.rot.HeadBone = E({ x: 8 + 2 * Math.abs(linea), y: 6 * linea });
    for (const [sd, f] of [['L', 0], ['R', 0.5]]) {
      p.rot['Thigh' + sd] = E({ x: -3, z: -SX[sd] * 5 });
      p.rot['Shin' + sd] = E({ x: 80 + 32 * Math.sin(TAU * (u + f)) });
      p.rot['Foot' + sd] = E({ x: 35 });
      // los codos en el suelo, las manos un poco más arriba sujetando el libro, delante de la cara
      p.arm[sd] = [P => V3(SX[sd] * LIBRO.ancho, 0.27, P.Chest.z + 0.29), null, V3(SX[sd] * 0.6, -1, -0.2), 1];
    }
    return p;
  }

  // mezclar poses resueltas: las rotaciones locales de todos los huesos y la cadera, por tramos con suavizado
  const resuelta = p => { resolver(p); p.leg = {}; p.arm = {}; return p; };
  function mezcla(claves) {
    const poses = claves.map(([, f]) => resuelta(f()));
    return (t, T) => {
      const u = t / T;
      let i = 0; while (i < claves.length - 2 && u > claves[i + 1][0]) i++;
      const [u0] = claves[i], [u1] = claves[i + 1], w = smooth((u - u0) / (u1 - u0)), A = poses[i], B = poses[i + 1], p = new Pose();
      for (const b of S.HUESOS) p.rot[b] = A.rot[b].clone().slerp(B.rot[b], w);
      p.hips.lerpVectors(A.hips, B.hips, w);
      return p;
    };
  }
  const sentarseSuelo = mezcla([[0, dePie], [0.45, cuclillas], [1, sentada]]);
  const aLeerAcostada = mezcla([[0, () => leerSentada(0, 1)], [0.45, rodillas], [1, () => acostada(0, 1)]]);

  function bostezo(t, T) {
    const p = cruzadas(new Pose()), u = t / T;
    const e = smooth(u / 0.3) * (1 - smooth((u - 0.7) / 0.3));   // sube, se queda estirada, baja
    p.rot.Spine = E({ x: lerp(6, -6, e) }); p.rot.Chest = E({ x: lerp(3, -12, e) });
    p.rot.Neck = E({ x: lerp(2, -8, e) }); p.rot.HeadBone = E({ x: lerp(2, -18, e), z: 6 * e * Math.sin(TAU * u) });
    for (const sd of ['L', 'R']) {
      manosRodillas(p, sd);
      const abajo = V3(SX[sd] * 0.2, 0.19, 0.16);
      p.arm[sd][0] = (P, W) => abajo.clone().lerp(P.Chest.clone().add(V3(SX[sd] * 0.24, 0.66, -0.06).applyQuaternion(W.Chest)), e);
      p.arm[sd][2] = V3(SX[sd], lerp(-0.5, 0.2, e), lerp(-0.6, -0.8, e));
    }
    return p;
  }

  return [
    { nombre: 'sentarse_suelo', fn: sentarseSuelo, T: 1.8, loop: false },
    { nombre: 'bostezo', fn: bostezo, T: 3, loop: false },
    { nombre: 'leer_sentada', fn: leerSentada, T: 4, loop: true },
    { nombre: 'acostarse_leer', fn: aLeerAcostada, T: 2.2, loop: false },
    { nombre: 'sentarse_leer', fn: (t, T) => aLeerAcostada(T - t, T), T: 2.2, loop: false },
    { nombre: 'leer_acostada', fn: acostada, T: 3, loop: true },
  ];
}
