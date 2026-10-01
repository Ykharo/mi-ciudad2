// Animaciones de los juegos del parque (las usa src/game/juegos.js), horneadas en nina_base.glb con los bailes.
//   subir_escalera  ciclo de 0,8 s subiendo la escalera del tobogán: en cada ciclo el cuerpo sube un peldaño (0,45 m en
//                   el juego = 0,321 en el modelo) y cada pie y cada mano suben un peldaño; mano derecha con pie
//                   izquierdo, y la otra pareja medio ciclo después. Mientras un pie pisa, su peldaño queda quieto en el
//                   mundo (en la animación baja, porque el juego sube a la jugadora); las manos van por los pasamanos.
//                   El juego tiene que subirla a la misma velocidad: ESCALERA en src/game/juegos.js.
//   tobogan         sentada (las caderas donde las deja "sit": 0,158 arriba y 0,10 atrás), las piernas estiradas
//                   adelante y los brazos arriba, moviéndolos de alegría (1,2 s, en bucle).
//   columpio        sentada agarrada de las cuerdas: t = 0 piernas recogidas bajo el asiento y el cuerpo adelante;
//                   t = 1 piernas estiradas y el cuerpo echado atrás. El juego no la reproduce: elige el momento según
//                   cómo se está impulsando (1 s).
import * as THREE from 'three';
import { E, K, TAU, lerp, smooth, crearPoses } from './pose.mjs';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// medidas en unidades del modelo (en el juego ×1,4; la escalera está en world/places/park.js): peldaños cada 0,45 m;
// los peldaños quedan a `frente` delante de la cadera, entre dos pasamanos a 0,38 m del centro (los brazos miden 0,34
// hasta la muñeca: más abiertos, las manos no pasarían del hombro). `pie`: la planta del pie A al empezar el ciclo (en
// el juego, sobre el primer peldaño); `mano`: el tope de la mano A, sobre la cadera.
export const ESCALERA = { ciclo: 0.8, peldano: 0.45 / 1.4, frente: 0.10, pie: 0.18, mano: 0.32, pasamanos: 0.38 / 1.4 };

export function juegos(S) {
  const { Pose, ponerPie, brazo } = crearPoses(S), { SX, FOOTX, H0, BALL } = S;
  const D = ESCALERA.peldano, Zr = ESCALERA.frente;
  const frac = x => x - Math.floor(x);

  // una extremidad trepando: altura relativa a la cadera y cuánto se despega (0..1). Agarrada la primera mitad de su
  // ciclo (baja D/2 respecto del cuerpo), y la segunda mitad sube un peldaño entero.
  function trepa(u, tope) {
    const v = frac(u);
    if (v < 0.5) return { alto: tope - D * v, aire: 0 };
    const w = (v - 0.5) / 0.5;
    return { alto: tope - D / 2 + D * smooth(w) - (D / 2) * w, aire: Math.sin(Math.PI * w) };
  }
  function subirEscalera(t, T) {
    const p = new Pose(), u = t / T;
    const f = ESCALERA.pie, h = ESCALERA.mano;
    // pareja A (mano derecha + pie izquierdo) empieza agarrada; la B medio ciclo después y medio peldaño más arriba
    // (así los dos pies pisan peldaños de verdad, y una mano va siempre más arriba que la otra)
    const A = { pie: trepa(u, f), mano: trepa(u, h) }, B = { pie: trepa(u + 0.5, f + D / 2), mano: trepa(u + 0.5, h + D / 2) };
    const balanceo = Math.sin(TAU * u);
    p.hips.set(SX.R * 0.012 * balanceo, H0 - 0.03, 0);
    p.rot.Hips = E({ x: 4, y: 4 * balanceo });
    p.rot.Spine = E({ x: 5, y: -3 * balanceo });
    p.rot.Chest = E({ x: 3, z: SX.R * 2 * balanceo });
    p.rot.Neck = E({ x: -6 });
    p.rot.HeadBone = E({ x: -10 });   // mira hacia arriba
    for (const [sd, pareja] of [['L', A], ['R', B]]) {
      // el pie: la punta en el peldaño (al frente), y al subir se despega hacia atrás
      const { alto, aire } = pareja.pie;
      ponerPie(p, sd, SX[sd] * (FOOTX + 0.01), Zr - BALL - 0.06 * aire, { lift: alto + 0.04 * aire, pitch: 8 * aire, polo: V3(SX[sd] * 0.8, 0.2, 1) });
    }
    for (const [sd, pareja] of [['R', A], ['L', B]]) {
      const { alto, aire } = pareja.mano;
      brazo(p, sd, { lower: 10, swing: 50, elbow: 60, hand: 0 });
      p.arm[sd] = [V3(SX[sd] * ESCALERA.pasamanos, H0 + alto, Zr - 0.05 * aire), null, V3(SX[sd], -0.6, -0.5), 1];
    }
    return p;
  }

  // sentada como deja "sit": la cadera sobre el asiento
  const SENTADA = V3(0, 0.158, -0.10);
  function tobogan(t, T) {
    const p = new Pose(), a = Math.sin(TAU * t / T), b = Math.sin(TAU * 2 * t / T);
    p.hips.copy(SENTADA);
    p.rot.Hips = E({ x: -6 });
    p.rot.Spine = E({ x: -8 });
    p.rot.Chest = E({ x: -4, z: SX.R * 2 * a });
    p.rot.Neck = E({ x: -4 });
    p.rot.HeadBone = E({ x: -8 + 3 * b, z: SX.R * 4 * a });
    for (const [sd, s] of [['R', 1], ['L', -1]]) {
      // los brazos arriba, abiertos en V, moviéndose de lado a lado
      brazo(p, sd, { lower: -118 + 10 * s * a, swing: 18 + 6 * b, elbow: 14 + 8 * b, hand: -10, handZ: 12 * s * a });
      p.leg[sd] = [V3(SX[sd] * 0.12, 0.2, 0.43), E({ x: -55 }), V3(0, 1, 0.3)];   // piernas estiradas sobre la rampa
    }
    return p;
  }

  function columpio(t, T) {
    const p = new Pose(), e = smooth(t / T);   // 0 recogida, 1 estirada
    p.hips.copy(SENTADA);
    p.rot.Hips = E({ x: lerp(8, -10, e) });
    p.rot.Spine = E({ x: lerp(12, -16, e) });
    p.rot.Chest = E({ x: lerp(6, -8, e) });
    p.rot.Neck = E({ x: lerp(-6, 10, e) });
    p.rot.HeadBone = E({ x: lerp(-4, 8, e) });   // mira hacia adelante aunque el cuerpo vaya atrás
    for (const sd of ['L', 'R']) {
      // piernas: recogidas bajo el asiento ↔ estiradas adelante (por la mitad, colgando)
      const tobillo = V3(SX[sd] * 0.11, K([[0, -0.13], [0.5, -0.06], [1, 0.25]], e), K([[0, -0.13], [0.5, 0.17], [1, 0.42]], e));
      p.leg[sd] = [tobillo, E({ x: K([[0, 50], [0.5, 25], [1, -12]], e) }), V3(0, lerp(-0.2, 1, e), 1)];
      // las manos agarradas de las cuerdas (van a los lados del asiento, a 0,35 m: 0,25 en el modelo), a la altura del
      // pecho; al echarse atrás los brazos se estiran, al ir adelante se doblan
      brazo(p, sd, { lower: 20, swing: 30, elbow: 70 });
      p.arm[sd] = [V3(SX[sd] * 0.25, 0.46, SENTADA.z), null, V3(SX[sd], -0.8, -0.4), 1];
    }
    return p;
  }

  return [
    { nombre: 'subir_escalera', fn: subirEscalera, T: ESCALERA.ciclo, loop: true },
    { nombre: 'tobogan', fn: tobogan, T: 1.2, loop: true },
    { nombre: 'columpio', fn: columpio, T: 1, loop: false },
  ];
}
