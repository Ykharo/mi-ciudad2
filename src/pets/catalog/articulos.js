// SÓLO DATOS. Los artículos de la Mascotienda Arcoíris (los efectos: pets/extras.js y pets/ropa.js; la pelota:
// game/pelota.js). Cada mascota tiene los suyos (se compran para ella).
//   id, nombre (se lee para comprar), ic, seccion (el pasillo de la tienda), tipo:
//     'transporte'  uno a la vez por mascota (patines, burbuja, globo, alitas)
//     'pocion'      se pone y se quita; `efecto`: arcoiris, brillo, burbujas, invisible (se pueden juntar), mini / gigante
//                   (una) o diseno (una pastilla a la vez: `diseno` es el dibujo, ver pets/pelaje.js)
//     'ropa'        una prenda por lugar del cuerpo (`lugar`: cuello, cabeza, lomo, cara, cola): se pone y se quita
//     'juguete'     no se pone: se usa (pelota, frisbee, palito y burbujero con su botón; el hueso, solo, al sentarse)
//     'companero'   uno a la vez: lo acompaña (mariposa, pajarito, ratoncito: pets/companeros.js)
//     'truco'       se aprende: lo hace cuando se le pide con el botón 🎉 Trucos (game/trucos.js)
//     'casa'        una a la vez: su casita en el patio de Mi Casa (game/casas.js)
//   precio en Huesitos de Aura, desc, frase (el "diario de la mascota" al comprarlo: {n} es su nombre).
export const SECCIONES = [
  { id: 'pociones', nombre: 'Pociones', ic: '🧪' },
  { id: 'transporte', nombre: 'Transporte', ic: '🛼' },
  { id: 'ropa', nombre: 'Ropa', ic: '👕' },
  { id: 'juguetes', nombre: 'Juguetes', ic: '🧸' },
  { id: 'companeros', nombre: 'Compañeros', ic: '🦋' },
  { id: 'trucos', nombre: 'Trucos', ic: '🎉' },
  { id: 'hogar', nombre: 'Hogar', ic: '🏡' },
];
export const ARTICULOS = [
  { id: 'arcoiris', nombre: 'Jarabe arcoíris', ic: '🌈', seccion: 'pociones', tipo: 'pocion', efecto: 'arcoiris', precio: 20, desc: 'El pelaje cambia de colores', frase: '¡{n} brilla con todos los colores!' },
  { id: 'brillo', nombre: 'Polvo de estrellas', ic: '✨', seccion: 'pociones', tipo: 'pocion', efecto: 'brillo', precio: 35, desc: 'Deja estrellitas al caminar', frase: '¡{n} deja un camino de estrellas!' },
  { id: 'burbujas', nombre: 'Jarabe de burbujas', ic: '🫧', seccion: 'pociones', tipo: 'pocion', efecto: 'burbujas', precio: 35, desc: 'Le salen burbujas de jabón', frase: '¡{n} hace burbujas por todos lados!' },
  { id: 'mini', nombre: 'Poción mini', ic: '🐭', seccion: 'pociones', tipo: 'pocion', efecto: 'mini', precio: 40, desc: 'Se achica muchísimo', frase: '¡{n} cabe en la palma de tu mano!' },
  { id: 'gigante', nombre: 'Poción gigante', ic: '🦕', seccion: 'pociones', tipo: 'pocion', efecto: 'gigante', precio: 40, desc: 'Crece enorme', frase: '¡{n} es grande como un dinosaurio!' },
  { id: 'invisible', nombre: 'Poción invisible', ic: '👻', seccion: 'pociones', tipo: 'pocion', efecto: 'invisible', precio: 45, desc: 'Sólo se ven sus ojitos', frase: '¿Dónde está {n}? ¡Sólo veo sus ojitos!' },
  { id: 'diseno_vaca', nombre: 'Pastilla vaca', ic: '🐄', seccion: 'pociones', tipo: 'pocion', efecto: 'diseno', diseno: 'vaca', precio: 30, desc: 'Manchas de vaca', frase: '¡Muuu! {n} tiene manchas de vaca.' },
  { id: 'diseno_cebra', nombre: 'Pastilla cebra', ic: '🦓', seccion: 'pociones', tipo: 'pocion', efecto: 'diseno', diseno: 'cebra', precio: 30, desc: 'Rayas de cebra', frase: '¡{n} tiene rayas de cebra!' },
  { id: 'diseno_estrellas', nombre: 'Pastilla estrellas', ic: '⭐', seccion: 'pociones', tipo: 'pocion', efecto: 'diseno', diseno: 'estrellas', precio: 30, desc: 'Pelaje con estrellas', frase: '¡El pelaje de {n} brilla con estrellas!' },
  { id: 'diseno_corazones', nombre: 'Pastilla corazones', ic: '💖', seccion: 'pociones', tipo: 'pocion', efecto: 'diseno', diseno: 'corazones', precio: 30, desc: 'Pelaje con corazones', frase: '¡{n} tiene corazones por todos lados!' },
  { id: 'diseno_lunares', nombre: 'Pastilla lunares', ic: '🔴', seccion: 'pociones', tipo: 'pocion', efecto: 'diseno', diseno: 'lunares', precio: 30, desc: 'Lunares de colores', frase: '¡{n} tiene lunares de colores!' },
  { id: 'diseno_galaxia', nombre: 'Pastilla galaxia', ic: '🌌', seccion: 'pociones', tipo: 'pocion', efecto: 'diseno', diseno: 'galaxia', precio: 50, desc: 'Pelaje de espacio y estrellas', frase: '¡{n} trae el universo en el pelaje!' },
  { id: 'aura', nombre: 'Caramelo de aura', ic: '🍬', seccion: 'pociones', tipo: 'pocion', efecto: 'aura', precio: 60, desc: 'Brilla con un aura, como Nina', frase: '¡{n} tiene muchísima aura!' },
  { id: 'voz_pato', nombre: 'Poción voz de pato', ic: '🦆', seccion: 'pociones', tipo: 'pocion', efecto: 'voz', voz: 'pato', precio: 25, desc: 'Hace "¡cuac cuac!"', frase: '¡Cuac! ¿{n} es un pato?' },
  { id: 'voz_leon', nombre: 'Poción voz de león', ic: '🦁', seccion: 'pociones', tipo: 'pocion', efecto: 'voz', voz: 'leon', precio: 25, desc: 'Ruge como un león', frase: '¡Grrroar! {n} ruge fuerte.' },
  { id: 'voz_vaca', nombre: 'Poción voz de vaca', ic: '🐮', seccion: 'pociones', tipo: 'pocion', efecto: 'voz', voz: 'vaca', precio: 25, desc: 'Hace "¡muuu!"', frase: '¡Muuu! {n} habla como vaca.' },
  { id: 'patines', nombre: 'Patines con luces', ic: '🛼', seccion: 'transporte', tipo: 'transporte', precio: 50, desc: 'Patina detrás de ti', frase: '¡{n} patina rapidísimo!' },
  { id: 'burbuja', nombre: 'Burbuja flotante', ic: '🫧', seccion: 'transporte', tipo: 'transporte', precio: 60, desc: 'Viaja dentro de una burbuja', frase: '¡{n} flota en su burbuja!' },
  { id: 'globo', nombre: 'Mini globo aerostático', ic: '🎈', seccion: 'transporte', tipo: 'transporte', precio: 100, desc: 'Vuela colgada de un globo', frase: '¡{n} vuela en su globo!' },
  { id: 'alitas', nombre: 'Alitas de hada', ic: '🧚', seccion: 'transporte', tipo: 'transporte', precio: 80, desc: 'Vuela bajito a tu lado', frase: '¡{n} vuela con sus alitas!' },
  { id: 'collar', nombre: 'Collar con placa', ic: '📿', seccion: 'ropa', tipo: 'ropa', lugar: 'cuello', precio: 25, desc: 'Con la inicial de su nombre', frase: '¡{n} luce su collar nuevo!' },
  { id: 'corona', nombre: 'Corona real', ic: '👑', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 40, desc: 'Con gemas de colores', frase: '¡{n} es la realeza de la ciudad!' },
  { id: 'gorro_cumple', nombre: 'Gorro de cumpleaños', ic: '🥳', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 30, desc: 'Para celebrar todos los días', frase: '¡Feliz no cumpleaños, {n}!' },
  { id: 'sombrero_mago', nombre: 'Sombrero de mago', ic: '🎩', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 45, desc: 'Azul con estrellas', frase: '¡{n} sabe hacer magia!' },
  { id: 'bufanda', nombre: 'Bufanda arcoíris', ic: '🧣', seccion: 'ropa', tipo: 'ropa', lugar: 'cuello', precio: 25, desc: 'Larguísima: se arrastra por el suelo', frase: '¡Qué calentito le queda el cuello a {n}!' },
  { id: 'lentes', nombre: 'Lentes de sol', ic: '🕶️', seccion: 'ropa', tipo: 'ropa', lugar: 'cara', precio: 30, desc: 'Para los días de sol', frase: '¡{n} se ve muy cool!' },
  { id: 'mono', nombre: 'Moño para la cola', ic: '🎀', seccion: 'ropa', tipo: 'ropa', lugar: 'cola', precio: 15, desc: 'Un moño rosado en la cola', frase: '¡{n} mueve su moño al caminar!' },
  { id: 'capa', nombre: 'Set superhéroe', ic: '🦸', seccion: 'ropa', tipo: 'ropa', lugar: 'lomo', precio: 60, desc: 'Capa, antifaz, emblema y muñequeras', frase: '¡{n} tiene superpoderes!' },
  { id: 'aureola', nombre: 'Aureola de angelito', ic: '😇', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 40, desc: 'Brilla sobre su cabeza', frase: '¡{n} tiene su aureola de angelito!' },
  { id: 'cuerno', nombre: 'Cuernito de unicornio', ic: '🦄', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 40, desc: 'Un cuerno mágico de colores', frase: '¡{n} parece un unicornio!' },
  { id: 'antenas', nombre: 'Antenas de abeja', ic: '🐝', seccion: 'ropa', tipo: 'ropa', lugar: 'cabeza', precio: 30, desc: 'Se mueven al caminar', frase: '¡Bzzz! {n} tiene antenas de abeja.' },
  { id: 'cohete', nombre: 'Mochila cohete', ic: '🚀', seccion: 'ropa', tipo: 'ropa', lugar: 'espalda', precio: 55, desc: 'Echa humito de colores', frase: '¡3, 2, 1… {n} despega!' },
  { id: 'collar_musical', nombre: 'Collar musical', ic: '🎵', seccion: 'ropa', tipo: 'ropa', lugar: 'cuello', precio: 35, desc: 'Suena una nota cuando salta', frase: '¡{n} hace música al saltar!' },
  { id: 'frisbee', nombre: 'Frisbee', ic: '🥏', seccion: 'juguetes', tipo: 'juguete', precio: 35, desc: 'Lo atrapa en el aire', frase: '¡{n} atrapa el frisbee de un salto!' },
  { id: 'palito', nombre: 'Palito mágico', ic: '🪄', seccion: 'juguetes', tipo: 'juguete', precio: 30, desc: 'Crece cuando lo lanzas', frase: '¡El palito de {n} creció muchísimo!' },
  { id: 'pajarito', nombre: 'Pajarito amigo', ic: '🐦', seccion: 'companeros', tipo: 'companero', precio: 50, desc: 'Vuela a su lado y se posa en su cabeza', frase: '¡Pío pío! Un pajarito acompaña a {n}.' },
  { id: 'raton', nombre: 'Ratoncito jinete', ic: '🐭', seccion: 'companeros', tipo: 'companero', precio: 45, desc: 'Va montado en su lomo', frase: '¡Un ratoncito pasea arriba de {n}!' },
  { id: 'paraguas', nombre: 'Paraguas flotante', ic: '☂️', seccion: 'ropa', tipo: 'ropa', lugar: 'arriba', precio: 35, desc: 'Flota sobre su cabeza', frase: '¡A {n} no le cae ni una gota!' },
  { id: 'alitas_murcielago', nombre: 'Alitas de murciélago', ic: '🦇', seccion: 'transporte', tipo: 'transporte', precio: 80, desc: 'Vuela bajito, como un murciélago', frase: '¡{n} vuela como un murciélago!' },
  { id: 'mariposa', nombre: 'Mariposa amiga', ic: '🦋', seccion: 'companeros', tipo: 'companero', precio: 50, desc: 'Revolotea a su alrededor', frase: '¡{n} tiene una amiga mariposa!' },
  { id: 'hueso', nombre: 'Hueso eterno', ic: '🦴', seccion: 'juguetes', tipo: 'juguete', precio: 25, desc: 'Lo muerde cuando se sienta', frase: '¡{n} no suelta su hueso!' },
  { id: 'burbujero', nombre: 'Burbujero', ic: '🫧', seccion: 'juguetes', tipo: 'juguete', precio: 35, desc: 'Persigue las burbujas', frase: '¡{n} quiere atrapar todas las burbujas!' },
  { id: 'pelota', nombre: 'Pelota saltarina', ic: '🎾', seccion: 'juguetes', tipo: 'juguete', precio: 30, desc: 'Lánzala y te la trae', frase: '¡{n} corre a buscar su pelota!' },
  { id: 'pixeles', nombre: 'Poción de píxeles', ic: '👾', seccion: 'pociones', tipo: 'pocion', efecto: 'pixeles', precio: 45, desc: 'Se ve de cuadritos, como un videojuego', frase: '¡{n} parece de un videojuego antiguo!' },
  { id: 'convertidor', nombre: 'Convertidor sorpresa', ic: '🔮', seccion: 'pociones', tipo: 'pocion', efecto: 'convertidor', precio: 90, desc: 'Cada rato se convierte en otro animal', frase: '¡Puf! ¿En qué animal se convertirá {n}?' },
  { id: 'platillo', nombre: 'Platillo volador', ic: '🛸', seccion: 'transporte', tipo: 'transporte', precio: 110, desc: 'Con rayo abductor de luz verde', frase: '¡{n} llegó del espacio en su platillo!' },
  { id: 'aro', nombre: 'Aro de circo', ic: '🎪', seccion: 'juguetes', tipo: 'juguete', precio: 40, desc: 'Salta a través del aro de luces', frase: '¡{n} salta por el aro como en el circo!' },
  { id: 'patita', nombre: 'Dar la patita', ic: '🐾', seccion: 'trucos', tipo: 'truco', precio: 20, desc: 'Se sienta y te da la patita', frase: '¡{n} aprendió a dar la patita!' },
  { id: 'saludar', nombre: 'Saludar', ic: '👋', seccion: 'trucos', tipo: 'truco', precio: 20, desc: 'Te saluda moviendo la pata', frase: '¡{n} aprendió a saludar!' },
  { id: 'vuelta', nombre: 'Dar una vuelta', ic: '🌀', seccion: 'trucos', tipo: 'truco', precio: 25, desc: 'Da una vuelta con un salto', frase: '¡{n} aprendió a dar una vuelta en el aire!' },
  { id: 'dos_patas', nombre: 'Pararse en dos patas', ic: '🙌', seccion: 'trucos', tipo: 'truco', precio: 30, desc: 'Se para y mueve las patitas', frase: '¡{n} aprendió a pararse en dos patas!' },
  { id: 'muerta', nombre: 'Hacerse la muerta', ic: '😵', seccion: 'trucos', tipo: 'truco', precio: 30, desc: 'Cae de lado… ¡y revive!', frase: '¡{n} aprendió a hacerse la muerta!' },
  { id: 'bailar', nombre: 'Bailar', ic: '💃', seccion: 'trucos', tipo: 'truco', precio: 35, desc: 'Baila contigo', frase: '¡{n} aprendió a bailar!' },
  { id: 'casita_perro', nombre: 'Casita de perro', ic: '🐶', seccion: 'hogar', tipo: 'casa', precio: 60, desc: 'De madera, con su nombre en la puerta', frase: '¡{n} tiene casita nueva en el patio de Mi Casa!' },
  { id: 'torre_gato', nombre: 'Torre de gato', ic: '🐱', seccion: 'hogar', tipo: 'casa', precio: 60, desc: 'Con cuevita, repisas y un pompón', frase: '¡{n} tiene torre nueva en el patio de Mi Casa!' },
  { id: 'madriguera', nombre: 'Madriguera', ic: '🐰', seccion: 'hogar', tipo: 'casa', precio: 60, desc: 'Un cerrito de pasto con zanahoria', frase: '¡{n} tiene madriguera nueva en el patio de Mi Casa!' },
  { id: 'iglu', nombre: 'Iglú', ic: '🧊', seccion: 'hogar', tipo: 'casa', precio: 90, desc: 'De bloques de hielo, fresquito', frase: '¡{n} tiene un iglú en el patio de Mi Casa!' },
  { id: 'hongo', nombre: 'Casa hongo', ic: '🍄', seccion: 'hogar', tipo: 'casa', precio: 90, desc: 'Roja con puntos blancos', frase: '¡{n} vive en un hongo en el patio de Mi Casa!' },
  { id: 'castillo', nombre: 'Castillo', ic: '🏰', seccion: 'hogar', tipo: 'casa', precio: 120, desc: 'Con torres y banderitas', frase: '¡{n} tiene un castillo en el patio de Mi Casa!' },
  { id: 'nave', nombre: 'Nave espacial', ic: '🚀', seccion: 'hogar', tipo: 'casa', precio: 120, desc: 'Un cohete con ventanita redonda', frase: '¡{n} tiene una nave espacial en el patio de Mi Casa!' },
];
