// Audífonos colgados del cuello (referencias/ropa/hoja_personaje_nuevo.png, "Audífonos"): dos auriculares apoyados
// adelante, a los lados del cuello, y el cintillo que los une por detrás. Accesorio rígido: todo pesa en Chest
// (descansan sobre los hombros; el cuello gira adentro sin tocarlos).
import { Malla, lerp, rayoDesdeAfuera, revolucion, smooth, tubo, v3 } from './cuerpo.mjs';

export const ID = 'audifonos';
const Y = 1.105, ANGULO = 52 * Math.PI / 180;   // altura y ángulo (desde el frente) de los auriculares
const CHAQUETA = 0.03;                          // espacio para el cuello de la chaqueta

export function construir(C) {
  const m = new Malla(), eje = v3(0, Y, 0);
  const extremos = [];
  for (const s of [1, -1]) {
    const radial = v3(s * Math.sin(ANGULO), 0, Math.cos(ANGULO));
    const rb = rayoDesdeAfuera(C.mallaTorso, eje, radial, 0.5) ?? 0.07;
    const centro = eje.clone().addScaledVector(radial, rb + CHAQUETA + 0.024);
    const ax = radial.clone().add(v3(0, 0.35, 0)).normalize();   // mira hacia afuera y un poco hacia arriba
    // carcasa (afuera) y almohadilla (del lado del cuerpo)
    revolucion(m, [[0, -0.010], [0.030, -0.010], [0.035, -0.004], [0.035, 0.006], [0.029, 0.013], [0, 0.014]], centro, ax, 'Audifonos_Carcasa', 20);
    revolucion(m, [[0, -0.024], [0.026, -0.024], [0.031, -0.019], [0.032, -0.012], [0.030, -0.009], [0, -0.009]], centro, ax, 'Audifonos_Almohadilla', 20);
    // donde entra el cintillo: el borde de arriba de la carcasa, un poco hacia atrás
    const arriba = v3(0, 1, 0).addScaledVector(ax, -ax.y).normalize();
    extremos.push(centro.clone().addScaledVector(arriba, 0.03).add(v3(0, 0, -0.012)));
  }
  // cintillo: rodea el cuello por detrás, más cerca atrás que adelante y un poco más alto
  const [izq, der] = [extremos[1], extremos[0]];   // izq = -x, der = +x
  const pts = [der];
  for (let i = 1; i < 22; i++) {
    const u = i / 22, phi = lerp(70, 290, u) * Math.PI / 180;   // de +x por detrás hasta -x
    const atras = 1 - Math.abs(u - 0.5) * 2;                      // 1 detrás del cuello, 0 en los auriculares
    const R = lerp(0.108, 0.09, smooth(atras * 1.6));
    pts.push(v3(Math.sin(phi) * R, lerp(Y + 0.022, Y + 0.045, smooth(atras * 1.4)), Math.cos(phi) * R));
  }
  pts.push(izq);
  tubo(m, pts, 0.0075, 'Audifonos_Cintillo', { lados: 8, aplanar: 0.55 });

  m.pesos = m.V.map(() => [['Chest', 1]]);
  return {
    mallas: [{ nombre: 'Acc_Audifonos', malla: m }],
    materiales: {
      Audifonos_Carcasa: { color: '#D9C8F7', rugosidad: 0.5 },
      Audifonos_Almohadilla: { color: '#FFFFFF', rugosidad: 0.9 },
      Audifonos_Cintillo: { color: '#C2ABEE', rugosidad: 0.5 },
    },
  };
}
