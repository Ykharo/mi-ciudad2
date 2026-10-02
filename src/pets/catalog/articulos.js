// SÓLO DATOS. Los artículos de la Mascotienda Arcoíris (los efectos: pets/extras.js y pets/ropa.js; la pelota:
// game/pelota.js). Cada mascota tiene los suyos (se compran para ella).
//   id, nombre (se lee para comprar), ic, seccion (el pasillo de la tienda), tipo:
//     'transporte'  uno a la vez por mascota (patines, burbuja, globo, alitas)
//     'pocion'      se pone y se quita (el jarabe arcoíris)
//     'ropa'        una prenda por lugar del cuerpo (`lugar`: cuello, cabeza, lomo): se pone y se quita
//     'juguete'     no se pone: se usa (la pelota se lanza con el botón 🎾)
//   precio en Huesitos de Aura, desc, frase (el "diario de la mascota" al comprarlo: {n} es su nombre).
export const SECCIONES = [
  { id: 'pociones', nombre: 'Pociones', ic: '🧪' },
  { id: 'transporte', nombre: 'Transporte', ic: '🛼' },
  { id: 'ropa', nombre: 'Ropa', ic: '👕' },
  { id: 'juguetes', nombre: 'Juguetes', ic: '🧸' },
];
export const ARTICULOS = [
  { id: 'arcoiris', nombre: 'Jarabe arcoíris', ic: '🌈', seccion: 'pociones', tipo: 'pocion', precio: 20, desc: 'El pelaje cambia de colores', frase: '¡{n} brilla con todos los colores!' },
  { id: 'patines', nombre: 'Patines con luces', ic: '🛼', seccion: 'transporte', tipo: 'transporte', precio: 50, desc: 'Patina detrás de ti', frase: '¡{n} patina rapidísimo!' },
  { id: 'burbuja', nombre: 'Burbuja flotante', ic: '🫧', seccion: 'transporte', tipo: 'transporte', precio: 60, desc: 'Viaja dentro de una burbuja', frase: '¡{n} flota en su burbuja!' },
  { id: 'globo', nombre: 'Mini globo aerostático', ic: '🎈', seccion: 'transporte', tipo: 'transporte', precio: 100, desc: 'Vuela colgada de un globo', frase: '¡{n} vuela en su globo!' },
  { id: 'alitas', nombre: 'Alitas de hada', ic: '🧚', seccion: 'transporte', tipo: 'transporte', precio: 80, desc: 'Vuela bajito a tu lado', frase: '¡{n} vuela con sus alitas!' },
  { id: 'collar', nombre: 'Collar con placa', ic: '📿', seccion: 'ropa', tipo: 'ropa', lugar: 'cuello', precio: 25, desc: 'Con la inicial de su nombre', frase: '¡{n} luce su collar nuevo!' },
  { id: 'corona', nombre: 'Corona real', ic: '👑', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 40, desc: 'Con gemas de colores', frase: '¡{n} es la realeza de la ciudad!' },
  { id: 'gorro_cumple', nombre: 'Gorro de cumpleaños', ic: '🥳', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 30, desc: 'Para celebrar todos los días', frase: '¡Feliz no cumpleaños, {n}!' },
  { id: 'sombrero_mago', nombre: 'Sombrero de mago', ic: '🎩', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 45, desc: 'Azul con estrellas', frase: '¡{n} sabe hacer magia!' },
  { id: 'capa', nombre: 'Capa de superhéroe', ic: '🦸', seccion: 'ropa', tipo: 'ropa', lugar: 'lomo', precio: 60, desc: 'Flamea cuando corre', frase: '¡{n} tiene superpoderes!' },
  { id: 'pelota', nombre: 'Pelota saltarina', ic: '🎾', seccion: 'juguetes', tipo: 'juguete', precio: 30, desc: 'Lánzala y te la trae', frase: '¡{n} corre a buscar su pelota!' },
];
