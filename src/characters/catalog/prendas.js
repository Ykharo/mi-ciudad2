// SÓLO DATOS. Prendas y piel: qué materiales del modelo se pueden recolorear y cómo se derivan sus tonos.
//
// canales:   color que se elige (de una paleta) → materiales que lo usan tal cual.
//            `siFalta`: regla para calcularlo desde otro canal cuando no se elige.
// derivados: material → [canal, regla, …parámetros]. Reglas (characters/looks.js):
//              ['sombra', k]              color × k  (k < 1 oscurece, k > 1 aclara)
//              ['contraste', k, blanco]   si el color es oscuro, lo acerca al blanco; si no, color × k
// extras:    partes que se pueden esconder (por ahora, la mariposa del peto).
// sombra:    la prenda proyecta sombra (el pelo sí; la ropa pegada al cuerpo no hace falta: ya la hace el cuerpo).
// Un color que no se elige queda como viene en el modelo ("de fábrica").
//
// Hoy las cuatro prendas vienen dentro de avatar_vestido.glb; en la etapa 4 cada una tendrá su propio .glb.
export const SLOTS = ['pelo', 'torso', 'piernas', 'pies'];

export const PIEL = {
  mats: ['Skin_Warm'],
  derivados: { Ear_Warm: ['principal', 'sombra', 0.9] },
};

export const PRENDAS = [
  { id: 'mono', nombre: 'Moño alto', slot: 'pelo', mallas: ['Pelo_Moño'], sombra: true,
    canales: { principal: { mats: ['Hair_Chestnut'], paleta: 'pelo' } },
    derivados: { Hair_Light: ['principal', 'contraste', 1.1, 0.12], Hair_Dark: ['principal', 'sombra', 0.72] } },
  { id: 'peto', nombre: 'Peto', slot: 'torso', mallas: ['Ropa_Peto'],
    canales: { principal: { mats: ['Cotton_Charcoal'], paleta: 'ropa' } },
    derivados: { Cotton_Edge: ['principal', 'contraste', 0.84, 0.1] },
    extras: { Top_Emblem: { nombre: 'Mariposa' } } },
  { id: 'pantalon_cargo', nombre: 'Pantalón cargo', slot: 'piernas', mallas: ['Ropa_Pantalon'],
    canales: { principal: { mats: ['Cargo_Pearl'], paleta: 'pantalon' } },
    derivados: { Cargo_Pocket: ['principal', 'sombra', 0.92], Cargo_Stitch: ['principal', 'contraste', 0.68, 0.25] } },
  { id: 'zapatillas', nombre: 'Zapatillas', slot: 'pies', mallas: ['Ropa_Zapatillas'],
    canales: {
      principal: { mats: ['Sneaker_Ivory'], paleta: 'zapatos' },
      panel: { mats: ['Sneaker_Panel'], paleta: 'ropa', siFalta: ['principal', 'sombra', 0.8] },
    } },
];

export const PRENDA = Object.fromEntries(PRENDAS.map(p => [p.id, p]));
