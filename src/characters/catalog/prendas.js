// SÓLO DATOS. Prendas y piel: qué materiales del modelo se pueden recolorear y cómo se derivan sus tonos.
//
// canales:   color que se elige (de una paleta) → materiales que lo usan tal cual.
//            `siFalta`: regla para calcularlo desde otro canal cuando no se elige.
// derivados: material → [canal, regla, …parámetros]. Reglas (characters/looks.js):
//              ['sombra', k]              color × k  (k < 1 oscurece, k > 1 aclara)
//              ['contraste', k, blanco]   si el color es oscuro, lo acerca al blanco; si no, color × k
// extras:    partes que se pueden esconder (la mariposa del peto, la estrella de la gorra…).
// sombra:    la prenda proyecta sombra (el pelo sí; la ropa pegada al cuerpo no hace falta: ya la hace el cuerpo).
// oculta:    partes de OTRAS prendas o de la base que se esconden mientras esta está puesta, por nombre de malla:
//            las regiones del cuerpo que tapa entera (Body_Piernas, Body_Pies, Body_Brazos: siguen haciendo su
//            sombra), el tope del moño bajo la gorra, las orejas bajo el pelo largo. Las partes están en
//            tools/separar_glb.mjs (APARTAR).
// Un color que no se elige queda como viene en el modelo ("de fábrica").
//
// Los accesorios son prendas rígidas (todos sus vértices pesan en un solo hueso), uno por espacio: dos que van en el
// mismo lugar se reemplazan solos. En el Vestidor comparten la pestaña "Accesorios".
export const SLOTS = ['pelo', 'torso', 'abrigo', 'piernas', 'pies', 'cabeza', 'cara', 'cuello', 'espalda', 'orejas', 'manos'];
export const SLOTS_ACCESORIOS = ['cabeza', 'orejas', 'cara', 'cuello', 'espalda', 'manos'];
// espacios que pueden quedar vacíos (decisión 7: torso, piernas y pies siempre llevan algo)
export const SLOTS_OPCIONALES = ['abrigo', ...SLOTS_ACCESORIOS];

export const PIEL = {
  mats: ['Skin_Warm'],
  derivados: { Ear_Warm: ['principal', 'sombra', 0.9] },
};

export const PRENDAS = [
  { id: 'mono', nombre: 'Moño alto', ic: '💇', slot: 'pelo', mallas: ['Pelo_Moño'], sombra: true,
    canales: { principal: { mats: ['Hair_Chestnut'], paleta: 'pelo' } },
    derivados: { Hair_Light: ['principal', 'contraste', 1.1, 0.12], Hair_Dark: ['principal', 'sombra', 0.72] } },
  { id: 'peto', nombre: 'Peto', ic: '👚', slot: 'torso', mallas: ['Ropa_Peto'],
    canales: { principal: { mats: ['Cotton_Charcoal'], paleta: 'ropa' } },
    derivados: { Cotton_Edge: ['principal', 'contraste', 0.84, 0.1] },
    extras: { Top_Emblem: { nombre: 'Mariposa', ic: '🦋' } } },
  { id: 'pantalon_cargo', nombre: 'Pantalón cargo', ic: '👖', slot: 'piernas', mallas: ['Ropa_Pantalon'], oculta: ['Body_Piernas'],
    canales: { principal: { mats: ['Cargo_Pearl'], paleta: 'pantalon' } },
    derivados: { Cargo_Pocket: ['principal', 'sombra', 0.92], Cargo_Stitch: ['principal', 'contraste', 0.68, 0.25] } },
  // --- prendas generadas por código (tools/generar_prendas.mjs), sin `mallas`: no salen del modelo original
  { id: 'top_corto', nombre: 'Top corto', ic: '⭐', slot: 'torso',
    canales: {
      principal: { mats: ['TopCorto_Tela'], paleta: 'ropa' },
      detalles: { mats: ['TopCorto_Banda'], paleta: 'ropa' },
    },
    derivados: { TopCorto_Forro: ['principal', 'sombra', 0.88] },
    fijos: ['TopCorto_Estrella'],
    extras: { TopCorto_Estrella: { nombre: 'Estrella', ic: '⭐' } } },
  { id: 'polera_corta', nombre: 'Polera manga corta', ic: '👕', slot: 'torso',
    canales: { principal: { mats: ['PoleraC_Tela'], paleta: 'ropa' } },
    derivados: { PoleraC_Cuello: ['principal', 'contraste', 0.9, 0.1], PoleraC_Forro: ['principal', 'sombra', 0.85] } },
  { id: 'polera_larga', nombre: 'Polera manga larga', ic: '👕', slot: 'torso', oculta: ['Body_Brazos'],
    canales: { principal: { mats: ['PoleraL_Tela'], paleta: 'ropa' } },
    derivados: { PoleraL_Cuello: ['principal', 'contraste', 0.9, 0.1], PoleraL_Forro: ['principal', 'sombra', 0.85] } },
  { id: 'pantalon_ancho', nombre: 'Pantalón ancho', ic: '👖', slot: 'piernas', oculta: ['Body_Piernas'],
    canales: { principal: { mats: ['PantalonA_Tela'], paleta: 'pantalon' } },
    derivados: { PantalonA_Pretina: ['principal', 'sombra', 0.92], PantalonA_Bolsillo: ['principal', 'sombra', 0.95], PantalonA_Forro: ['principal', 'sombra', 0.85] },
    fijos: ['PantalonA_Cadena'],
    extras: { PantalonA_Cadena: { nombre: 'Cadena', ic: '⛓️' } } },
  { id: 'zapatillas_plataforma', nombre: 'Zapatillas plataforma', ic: '👟', slot: 'pies', oculta: ['Body_Pies'],
    canales: {
      principal: { mats: ['ZapP_Cuero'], paleta: 'zapatos' },
      panel: { mats: ['ZapP_Detalle'], paleta: 'ropa' },
    },
    derivados: { ZapP_Suela: ['principal', 'contraste', 0.96, 0.08] },
    fijos: ['ZapP_Cordon'] },
  { id: 'chaqueta_oversize', nombre: 'Chaqueta oversize', ic: '🦋', slot: 'abrigo', oculta: ['Body_Brazos'],
    canales: {
      principal: { mats: ['ChaquetaO_Tela'], paleta: 'ropa' },
      dibujos: { mats: ['ChaquetaO_Dibujo'], paleta: 'ropa' },
    },
    derivados: { ChaquetaO_Punto: ['principal', 'sombra', 0.85], ChaquetaO_Forro: ['principal', 'contraste', 0.8, 0.12] },
    extras: { ChaquetaO_Dibujo: { nombre: 'Dibujos', ic: '🦋' } } },
  { id: 'poleron_oversize', nombre: 'Polerón oversize', ic: '🟡', slot: 'abrigo', oculta: ['Body_Brazos'],
    canales: { principal: { mats: ['PoleronO_Tela'], paleta: 'ropa' } },
    derivados: { PoleronO_Punto: ['principal', 'sombra', 0.9], PoleronO_Forro: ['principal', 'sombra', 0.8] } },
  { id: 'pelo_largo', nombre: 'Pelo largo', ic: '👩', slot: 'pelo', sombra: true,
    oculta: ['Ear_-1', 'Ear_Inner_-1', 'Ear_1', 'Ear_Inner_1'],
    canales: {
      principal: { mats: ['PeloLargo_Base'], paleta: 'pelo' },
      // algunos mechones en otro color; si no se eligen, quedan del color del pelo
      mechas: { mats: ['PeloLargo_Mechas'], paleta: 'pelo', siFalta: ['principal', 'sombra', 1] },
    },
    derivados: { PeloLargo_Claro: ['principal', 'contraste', 1.1, 0.12], PeloLargo_Oscuro: ['principal', 'sombra', 0.72] } },
  { id: 'pelo_lacio', nombre: 'Lacio largo', ic: '💁', slot: 'pelo', sombra: true,
    oculta: ['Ear_-1', 'Ear_Inner_-1', 'Ear_1', 'Ear_Inner_1'],
    canales: { principal: { mats: ['PeloLacio_Base'], paleta: 'pelo' } },
    derivados: { PeloLacio_Claro: ['principal', 'contraste', 1.1, 0.12], PeloLacio_Oscuro: ['principal', 'sombra', 0.72] } },
  { id: 'trenzas', nombre: 'Trenzas', ic: '🎀', slot: 'pelo', sombra: true,
    canales: {
      principal: { mats: ['Trenzas_Base'], paleta: 'pelo' },
      gomitas: { mats: ['Trenzas_Gomita'], paleta: 'ropa' },
    },
    derivados: { Trenzas_Claro: ['principal', 'contraste', 1.1, 0.12], Trenzas_Oscuro: ['principal', 'sombra', 0.72] } },
  { id: 'pelo_rizado', nombre: 'Rizado', ic: '🌀', slot: 'pelo', sombra: true,
    canales: { principal: { mats: ['PeloRizado_Base'], paleta: 'pelo' } },
    derivados: { PeloRizado_Claro: ['principal', 'contraste', 1.1, 0.12], PeloRizado_Oscuro: ['principal', 'sombra', 0.8] } },
  { id: 'pelo_largo_desordenado', nombre: 'Largo desordenado', ic: '🧑', slot: 'pelo', sombra: true,
    oculta: ['Ear_-1', 'Ear_Inner_-1', 'Ear_1', 'Ear_Inner_1'],
    canales: { principal: { mats: ['PeloLargoD_Base'], paleta: 'pelo' } },
    derivados: { PeloLargoD_Claro: ['principal', 'contraste', 1.1, 0.12], PeloLargoD_Oscuro: ['principal', 'sombra', 0.72] } },
  { id: 'pelo_corto', nombre: 'Pelo corto', ic: '👦', slot: 'pelo', sombra: true,
    canales: { principal: { mats: ['PeloCorto_Base'], paleta: 'pelo' } },
    derivados: { PeloCorto_Claro: ['principal', 'contraste', 1.1, 0.12], PeloCorto_Oscuro: ['principal', 'sombra', 0.72] } },
  { id: 'buzo', nombre: 'Pantalón de buzo', ic: '👖', slot: 'piernas', oculta: ['Body_Piernas'],
    canales: {
      principal: { mats: ['Buzo_Tela'], paleta: 'pantalon' },
      franjas: { mats: ['Buzo_Franja', 'Buzo_Mariposa'], paleta: 'ropa' },
    },
    derivados: { Buzo_Pretina: ['principal', 'sombra', 0.85], Buzo_Forro: ['principal', 'contraste', 0.8, 0.15] },
    extras: { Buzo_Mariposa: { nombre: 'Mariposa', ic: '🦋' } } },
  { id: 'falda_tableada', nombre: 'Falda', ic: '🩷', slot: 'piernas',
    canales: { principal: { mats: ['Falda_Tela'], paleta: 'ropa' } },
    derivados: { Falda_Pretina: ['principal', 'sombra', 0.88] } },
  { id: 'chaqueta', nombre: 'Chaqueta', ic: '🧥', slot: 'abrigo', oculta: ['Body_Brazos'],
    canales: {
      principal: { mats: ['Chaqueta_Tela'], paleta: 'ropa' },
      detalles: { mats: ['Chaqueta_Detalle'], paleta: 'ropa' },
    },
    derivados: { Chaqueta_Forro: ['principal', 'sombra', 0.85] } },
  { id: 'poleron', nombre: 'Polerón con capucha', ic: '🧥', slot: 'abrigo', oculta: ['Body_Brazos'],
    canales: {
      principal: { mats: ['Poleron_Tela'], paleta: 'ropa' },
      franjas: { mats: ['Poleron_Franja', 'Poleron_Mariposa'], paleta: 'ropa' },
    },
    derivados: { Poleron_Detalle: ['principal', 'sombra', 0.85], Poleron_Forro: ['principal', 'contraste', 0.8, 0.15] },
    fijos: ['Poleron_Cierre'],
    extras: { Poleron_Mariposa: { nombre: 'Mariposa', ic: '🦋' } } },
  { id: 'zapatillas', nombre: 'Zapatillas', ic: '👟', slot: 'pies', mallas: ['Ropa_Zapatillas'], oculta: ['Body_Pies'],
    canales: {
      principal: { mats: ['Sneaker_Ivory'], paleta: 'zapatos' },
      panel: { mats: ['Sneaker_Panel'], paleta: 'ropa', siFalta: ['principal', 'sombra', 0.8] },
    } },
  // --- accesorios (también generados por código; referencias/ropa/hoja_personaje_nuevo.png)
  { id: 'gorra', nombre: 'Gorra', ic: '🧢', slot: 'cabeza', sombra: true, oculta: ['Pelo_Moño_Tope', 'Pelo_Rizado_Tope'],
    canales: {
      principal: { mats: ['Gorra_Tela'], paleta: 'ropa' },
      visera: { mats: ['Gorra_Visera', 'Gorra_Estrella'], paleta: 'ropa' },
    },
    derivados: { Gorra_Costura: ['principal', 'contraste', 0.84, 0.18] },
    extras: { Gorra_Estrella: { nombre: 'Estrella', ic: '⭐' } } },
  { id: 'jockey', nombre: 'Jockey', ic: '🧢', slot: 'cabeza', sombra: true, oculta: ['Pelo_Moño_Tope', 'Pelo_Rizado_Tope'],
    canales: {
      principal: { mats: ['Jockey_Tela'], paleta: 'ropa' },
      visera: { mats: ['Jockey_Visera'], paleta: 'ropa' },
      mariposa: { mats: ['Jockey_Mariposa'], paleta: 'ropa' },
    },
    derivados: { Jockey_Costura: ['principal', 'contraste', 0.84, 0.18] },
    extras: { Jockey_Mariposa: { nombre: 'Mariposa', ic: '🦋' } } },
  { id: 'gorro_lana', nombre: 'Gorro de lana', ic: '🧶', slot: 'cabeza', sombra: true, oculta: ['Pelo_Moño_Tope', 'Pelo_Rizado_Tope'],
    canales: { principal: { mats: ['Gorro_Tejido'], paleta: 'ropa' } },
    derivados: { Gorro_Canal: ['principal', 'sombra', 0.86], Gorro_Doblez: ['principal', 'sombra', 0.93] },
    fijos: ['Gorro_Etiqueta'] },
  { id: 'audifonos_grandes', nombre: 'Audífonos grandes', ic: '🎧', slot: 'orejas', sombra: true,
    canales: {
      principal: { mats: ['AudifonosG_Carcasa'], paleta: 'ropa' },
      almohadillas: { mats: ['AudifonosG_Almohadilla'], paleta: 'ropa' },
    },
    derivados: { AudifonosG_Cintillo: ['principal', 'sombra', 0.88] } },
  { id: 'lentes', nombre: 'Lentes', ic: '👓', slot: 'cara',
    canales: { principal: { mats: ['Lentes_Marco'], paleta: 'ropa' } } },
  // lentes de sol (tools/prendas/lentes_sol.mjs): marco y lentes de colores aparte
  { id: 'lentes_aviador', nombre: 'Lentes de sol aviador', ic: '🕶️', slot: 'cara',
    canales: { principal: { mats: ['SolA_Marco'], paleta: 'metal' }, lentes: { mats: ['SolA_Lente'], paleta: 'lentes' } } },
  { id: 'lentes_clasicos', nombre: 'Lentes de sol clásicos', ic: '😎', slot: 'cara',
    canales: { principal: { mats: ['SolC_Marco'], paleta: 'ropa' }, lentes: { mats: ['SolC_Lente'], paleta: 'lentes' } } },
  { id: 'lentes_corazon', nombre: 'Lentes de sol corazón', ic: '💖', slot: 'cara',
    canales: { principal: { mats: ['SolK_Marco'], paleta: 'ropa' }, lentes: { mats: ['SolK_Lente'], paleta: 'lentes' } } },
  { id: 'audifonos', nombre: 'Audífonos al cuello', ic: '🎧', slot: 'cuello',
    canales: {
      principal: { mats: ['Audifonos_Carcasa'], paleta: 'ropa' },
      almohadillas: { mats: ['Audifonos_Almohadilla'], paleta: 'ropa' },
    },
    derivados: { Audifonos_Cintillo: ['principal', 'sombra', 0.88] } },
  { id: 'guantes', nombre: 'Guantes', ic: '🧤', slot: 'manos',
    canales: {
      principal: { mats: ['Guantes_Tela'], paleta: 'ropa' },
      detalles: { mats: ['Guantes_Puno'], paleta: 'ropa' },
    } },
  { id: 'mochila', nombre: 'Mochila', ic: '🎒', slot: 'espalda', sombra: true,
    canales: {
      principal: { mats: ['Mochila_Tela'], paleta: 'ropa' },
      correas: { mats: ['Mochila_Correa'], paleta: 'ropa' },
    },
    derivados: { Mochila_Bolsillo: ['principal', 'contraste', 0.9, 0.1] },
    extras: { Mochila_Mariposa: { nombre: 'Mariposa', ic: '🦋' } } },
];

export const PRENDA = Object.fromEntries(PRENDAS.map(p => [p.id, p]));
