// SÓLO DATOS. Los artículos de la Mascotienda Arcoíris (los efectos: pets/extras.js).
//   id, nombre (se lee para comprar), ic, seccion (el pasillo de la tienda), tipo: 'transporte' (uno a la vez por
//   mascota) o 'pocion' (se pone y se quita), precio en Huesitos de Aura, frase (el "diario de la mascota" al comprarlo:
//   {n} es su nombre).
export const SECCIONES = [
  { id: 'pociones', nombre: 'Pociones', ic: '🧪' },
  { id: 'transporte', nombre: 'Transporte', ic: '🛼' },
  { id: 'accesorios', nombre: 'Accesorios', ic: '🎀' },
  { id: 'juguetes', nombre: 'Juguetes', ic: '🧸', pronto: true },
];
export const ARTICULOS = [
  { id: 'arcoiris', nombre: 'Jarabe arcoíris', ic: '🌈', seccion: 'pociones', tipo: 'pocion', precio: 20, desc: 'El pelaje cambia de colores', frase: '¡{n} brilla con todos los colores!' },
  { id: 'patines', nombre: 'Patines con luces', ic: '🛼', seccion: 'transporte', tipo: 'transporte', precio: 50, desc: 'Patina detrás de ti', frase: '¡{n} patina rapidísimo!' },
  { id: 'burbuja', nombre: 'Burbuja flotante', ic: '🫧', seccion: 'transporte', tipo: 'transporte', precio: 60, desc: 'Viaja dentro de una burbuja', frase: '¡{n} flota en su burbuja!' },
  { id: 'globo', nombre: 'Mini globo aerostático', ic: '🎈', seccion: 'transporte', tipo: 'transporte', precio: 100, desc: 'Vuela colgada de un globo', frase: '¡{n} vuela en su globo!' },
  { id: 'alitas', nombre: 'Alitas de hada', ic: '🧚', seccion: 'accesorios', tipo: 'transporte', precio: 80, desc: 'Vuela bajito a tu lado', frase: '¡{n} vuela con sus alitas!' },
];
