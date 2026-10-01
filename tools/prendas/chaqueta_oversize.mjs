// Chaqueta oversize de la amiga (referencias/ropa/hoja_personaje_nuevo.png, "Chaqueta oversize (con diseño)"): negra,
// abierta, holgada, con hombros caídos, puños y borde de punto, y mariposas y estrellas rosadas en el frente, la
// espalda y las mangas (los "dibujos" se pueden sacar o cambiar de color en el Vestidor).
import { FIGURAS, Malla, calcomaniaSobre, pesosDelCuerpo, v3 } from './cuerpo.mjs';
import { cuerpoAbrigo, juntar, mangaAbrigo, superficieDe } from './chaqueta.mjs';

export const ID = 'chaqueta_oversize';
const M = { tela: 'ChaquetaO_Tela', detalle: 'ChaquetaO_Punto', forro: 'ChaquetaO_Forro' };
const DIBUJO = 'ChaquetaO_Dibujo';

export function construir(C) {
  const { malla: cuerpo, ejes, ys } = cuerpoAbrigo(C, { abierto: true, holgura: 0.034, hem: 0.84, M, hombroCaido: true });
  const mangas = ['L', 'R'].map(S => mangaAbrigo(C, S, { holgura: 0.032, puño: 0.014, M }));
  // dibujos del cuerpo: en cada lado del frente, en la espalda
  const supCuerpo = superficieDe(cuerpo), dib = new Malla();
  const ejeEn = y => { let i = 0; while (i < ys.length - 2 && ys[i + 1] < y) i++; return ejes[i].clone().setY(y); };
  const enCuerpo = (ang, y, fig, giro = 0) => {
    const d = v3(Math.sin(ang), 0, Math.cos(ang));
    calcomaniaSobre(dib, supCuerpo, ejeEn(y).addScaledVector(d, 0.15), d, v3(0, 1, 0), fig, 0.003, DIBUJO, giro);
  };
  for (const s of [1, -1]) {
    enCuerpo(s * 0.85, 0.93, FIGURAS.mariposa(1.25), s * 12);
    enCuerpo(s * 1.25, 1.03, FIGURAS.estrella(0.02, 0.008));
    enCuerpo(s * 0.7, 1.05, FIGURAS.estrella(0.012, 0.005));
  }
  enCuerpo(Math.PI, 1.0, FIGURAS.mariposa(2.2));
  enCuerpo(Math.PI + 0.5, 0.9, FIGURAS.estrella(0.016, 0.006));
  dib.pesos = pesosDelCuerpo(C, dib.V, ['Hips', 'Spine', 'Chest', 'Neck'], 8);
  // dibujos de las mangas: una mariposa arriba y una estrella en el antebrazo, por el lado de afuera
  const partes = [cuerpo, dib, ...mangas];
  mangas.forEach((manga, j) => {
    const S = j ? 'R' : 'L', side = j ? 1 : -1, sup = superficieDe(manga), c = manga.camino, dm = new Malla();
    const fuera = v3(side, 0, 0.25).normalize(), subir = c[0].clone().sub(c[c.length - 1]);
    const en = (i, fig, giro) => {
      const eje = c[i], t = c[Math.min(i + 1, c.length - 1)].clone().sub(c[Math.max(i - 1, 0)]).normalize();
      const n = fuera.clone().addScaledVector(t, -fuera.dot(t)).normalize();
      calcomaniaSobre(dm, sup, eje.clone().addScaledVector(n, 0.06), n, subir, fig, 0.003, DIBUJO, giro);
    };
    en(6, FIGURAS.mariposa(1.05), side * 15);
    en(14, FIGURAS.estrella(0.016, 0.006), 0);
    en(10, FIGURAS.estrella(0.01, 0.004), 20);
    dm.pesos = pesosDelCuerpo(C, dm.V, ['UpperArm' + S, 'Forearm' + S], 6, side);
    partes.push(dm);
  });
  return {
    mallas: [{ nombre: 'Ropa_ChaquetaOversize', malla: juntar(partes) }],
    materiales: {
      ChaquetaO_Tela: { color: '#2A2830', rugosidad: 0.8 },
      ChaquetaO_Punto: { color: '#222027', rugosidad: 0.9 },
      ChaquetaO_Forro: { color: '#3A3742', rugosidad: 0.9 },
      ChaquetaO_Dibujo: { color: '#F4B6D8', rugosidad: 0.7 },
    },
  };
}
