// SÓLO DATOS. Los artículos de la Mascotienda Arcoíris (los efectos: pets/extras.js y pets/ropa.js; la pelota:
// game/pelota.js). Cada mascota tiene los suyos (se compran para ella).
//   id, nombre (se lee para comprar), ic, seccion (el pasillo de la tienda), tipo:
//     'transporte'  uno a la vez por mascota (patines, burbuja, globo, alitas)
//     'pocion'      se pone y se quita; `efecto`: arcoiris, brillo, burbujas (se pueden juntar) o mini / gigante (una)
//     'ropa'        una prenda por lugar del cuerpo (`lugar`: cuello, cabeza, lomo, cara, cola): se pone y se quita
//     'juguete'     no se pone: se usa (la pelota se lanza con el botón 🎾)
//   precio en Huesitos de Aura, desc, frase (el "diario de la mascota" al comprarlo: {n} es su nombre).
export const SECCIONES = [
  { id: 'pociones', nombre: 'Pociones', ic: '🧪' },
  { id: 'transporte', nombre: 'Transporte', ic: '🛼' },
  { id: 'ropa', nombre: 'Ropa', ic: '👕' },
  { id: 'juguetes', nombre: 'Juguetes', ic: '🧸' },
];
export const ARTICULOS = [
  { id: 'arcoiris', nombre: 'Jarabe arcoíris', ic: '🌈', seccion: 'pociones', tipo: 'pocion', efecto: 'arcoiris', precio: 20, desc: 'El pelaje cambia de colores', frase: '¡{n} brilla con todos los colores!' },
  { id: 'brillo', nombre: 'Polvo de estrellas', ic: '✨', seccion: 'pociones', tipo: 'pocion', efecto: 'brillo', precio: 35, desc: 'Deja estrellitas al caminar', frase: '¡{n} deja un camino de estrellas!' },
  { id: 'burbujas', nombre: 'Jarabe de burbujas', ic: '🫧', seccion: 'pociones', tipo: 'pocion', efecto: 'burbujas', precio: 35, desc: 'Le salen burbujas de jabón', frase: '¡{n} hace burbujas por todos lados!' },
  { id: 'mini', nombre: 'Poción mini', ic: '🐭', seccion: 'pociones', tipo: 'pocion', efecto: 'mini', precio: 40, desc: 'Se achica muchísimo', frase: '¡{n} cabe en la palma de tu mano!' },
  { id: 'gigante', nombre: 'Poción gigante', ic: '🦕', seccion: 'pociones', tipo: 'pocion', efecto: 'gigante', precio: 40, desc: 'Crece enorme', frase: '¡{n} es grande como un dinosaurio!' },
  { id: 'patines', nombre: 'Patines con luces', ic: '🛼', seccion: 'transporte', tipo: 'transporte', precio: 50, desc: 'Patina detrás de ti', frase: '¡{n} patina rapidísimo!' },
  { id: 'burbuja', nombre: 'Burbuja flotante', ic: '🫧', seccion: 'transporte', tipo: 'transporte', precio: 60, desc: 'Viaja dentro de una burbuja', frase: '¡{n} flota en su burbuja!' },
  { id: 'globo', nombre: 'Mini globo aerostático', ic: '🎈', seccion: 'transporte', tipo: 'transporte', precio: 100, desc: 'Vuela colgada de un globo', frase: '¡{n} vuela en su globo!' },
  { id: 'alitas', nombre: 'Alitas de hada', ic: '🧚', seccion: 'transporte', tipo: 'transporte', precio: 80, desc: 'Vuela bajito a tu lado', frase: '¡{n} vuela con sus alitas!' },
  { id: 'collar', nombre: 'Collar con placa', ic: '📿', seccion: 'ropa', tipo: 'ropa', lugar: 'cuello', precio: 25, desc: 'Con la inicial de su nombre', frase: '¡{n} luce su collar nuevo!' },
  { id: 'corona', nombre: 'Corona real', ic: '👑', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 40, desc: 'Con gemas de colores', frase: '¡{n} es la realeza de la ciudad!' },
  { id: 'gorro_cumple', nombre: 'Gorro de cumpleaños', ic: '🥳', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 30, desc: 'Para celebrar todos los días', frase: '¡Feliz no cumpleaños, {n}!' },
  { id: 'sombrero_mago', nombre: 'Sombrero de mago', ic: '🎩', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 45, desc: 'Azul con estrellas', frase: '¡{n} sabe hacer magia!' },
  { id: 'bufanda', nombre: 'Bufanda a rayas', ic: '🧣', seccion: 'ropa', tipo: 'ropa', lugar: 'cuello', precio: 25, desc: 'Abriga y tiene puntas', frase: '¡Qué calentito le queda el cuello a {n}!' },
  { id: 'lentes', nombre: 'Lentes de sol', ic: '🕶️', seccion: 'ropa', tipo: 'ropa', lugar: 'cara', precio: 30, desc: 'Para los días de sol', frase: '¡{n} se ve muy cool!' },
  { id: 'mono', nombre: 'Moño para la cola', ic: '🎀', seccion: 'ropa', tipo: 'ropa', lugar: 'cola', precio: 15, desc: 'Un moño rosado en la cola', frase: '¡{n} mueve su moño al caminar!' },
  { id: 'capa', nombre: 'Capa de superhéroe', ic: '🦸', seccion: 'ropa', tipo: 'ropa', lugar: 'lomo', precio: 60, desc: 'Flamea cuando corre', frase: '¡{n} tiene superpoderes!' },
  { id: 'pelota', nombre: 'Pelota saltarina', ic: '🎾', seccion: 'juguetes', tipo: 'juguete', precio: 30, desc: 'Lánzala y te la trae', frase: '¡{n} corre a buscar su pelota!' },
];
