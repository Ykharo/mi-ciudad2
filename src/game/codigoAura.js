// El "Código Aura": 3 palabras para leer y, para el criptex, 3 anillos de 6 caras (la figura correcta, sus
// "parecidas" y otras hasta completar `figuras`; las caras que sobran llevan una runa). Sin DOM: lo usan la
// competencia (game/aura.js) y el prototipo (src/debug/criptex.html).
import { PALABRAS } from './palabras.js';

const porId = Object.fromEntries(PALABRAS.map(p => [p.id, p]));
const RUNAS = ['✦', '✧', '❖', '✶', '✺'];

// azar: una función que da números en [0, 1) (Math.random o una semilla)
export function nuevoCodigo({ figuras = 4, azar = Math.random } = {}) {
  const mezclar = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // tres palabras con distinta primera letra (así sus anillos no comparten distractores)
  const palabras = [];
  for (const p of mezclar([...PALABRAS])) if (palabras.length < 3 && !palabras.some(e => e.palabra[0] === p.palabra[0])) palabras.push(p);
  const anillos = palabras.map(p => {
    const otras = mezclar(p.parecidas.filter(id => porId[id]).map(id => porId[id]));
    const resto = mezclar(PALABRAS.filter(x => x !== p && !otras.includes(x)));
    const ops = [p, ...otras, ...resto].slice(0, figuras);
    return mezclar([...ops, ...RUNAS.slice(0, 6 - figuras).map((s, i) => ({ id: 'runa' + i, simbolo: s }))]);
  });
  return { palabras, anillos };
}

// qué anillos están bien: [true, false, true]
export const revisar = (codigo, elegidos) => codigo.palabras.map((p, i) => elegidos[i] === p.id);
