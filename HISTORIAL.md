# Historial — Ciudad Arcoíris

Registro detallado de cada etapa y cambio (lo más nuevo arriba): qué se hizo, decisiones, tropiezos y números de las
pruebas. Se movió aquí desde la sección "Dónde quedamos" de `PLAN.md` el 30-09-2026, para que esa sección quede
corta (sólo el estado actual y lo que sigue). Al terminar algo, el detalle se agrega aquí arriba y en `PLAN.md` sólo
el resumen.

## La corona según la imagen de referencia (02-10-2026)

- El usuario mandó una imagen de referencia (corona azul con borde dorado). `corona()` en `pets/ropa.js`: cuerpo
  azul-violeta que se abre hacia arriba con el borde en 5 puntas (`banda()`: una banda alrededor del eje y con el
  borde de arriba a la altura que se quiera por ángulo), dorado por dentro (la misma banda con un material del lado
  de atrás), un ribete dorado que sigue las puntas y sobresale, bolitas doradas en las puntas, gemas rosadas en los
  valles y un aro azul redondeado abajo. El dorado sin brillo metálico (se veía oscuro: no hay nada que reflejar).

## Corona alta, estelas más largas y la burbuja gigante que parpadeaba (02-10-2026)

- Corona: alta y de cono invertido (base 0,45 R, arriba 0,78 R, alto 0,7 R de la cabeza), borde de arriba con 6
  puntas con bolitas y gemas de colores alrededor; un poco hundida para calzar en la cabeza redonda.
- Estelas (`pets/efectos.js`): estrellas viven 2,2–2,8 s y suben 1,1 m/s (se apagan en el último 40 %); burbujas
  4,5–6 s subiendo 0,75 m/s; hasta 90 partículas.
- Error: cada burbuja nacía con la esfera de 1 m de radio y recién en el cuadro siguiente se achicaba (`moverEfectos`
  se salta cuadros muy seguidos): se veía una burbuja gigante que parpadeaba. Ahora nace con su tamaño.

## Bufanda arcoíris larguísima y botón de prueba de +100 Huesitos (02-10-2026)

- La bufanda era "arcoíris y larguísima que arrastra": aro con rayas de colores en el cuello y una cola de 16 tramos
  (uno de cada color, 0,11 m cada uno × la escala) que sale del costado del aro y se simula en el mundo (verlet:
  gravedad, largo fijo, roce y el suelo): cae, se arrastra detrás de la mascota y se ondula al girar. Los tramos viven
  en la escena (`quitar` los saca); `tirar` en `pets/ropa.js` llama a `quitar` de cada prenda.
- TEMPORAL: botón "🧪 +100 🦴 de prueba" arriba en la ventana de la Mascotienda (`data-prueba`, llama a
  `ganarHuesitos`), para revisar los artículos. Anotado en `PLAN.md` para quitarlo junto con el regalo de 1000.
- Confirmado: con `npm run dev` prendido, la captura 1-portada sale entera distinta (la tarjeta de video compartida);
  con el servidor apagado, igual. Apagarlo antes de correr las capturas.

## Bufanda, lentes, moño y pociones de estrellas, burbujas, mini y gigante (02-10-2026)

- Ropa nueva (`pets/ropa.js`): bufanda a rayas (cuello; las puntas cuelgan derechas aunque el aro vaya inclinado y se
  mecen al andar), lentes de sol (lugar `cara`, en el espacio de la cabeza: `ojos` en el mapa de anclajes) y moño en
  la punta de la cola (lugar `cola`, `colaLargo` en el mapa; se mueve con la cola).
- Pociones nuevas (tipo `pocion` con `efecto`): polvo de estrellas (estela de estrellitas al andar) y jarabe de
  burbujas (burbujas de jabón que suben y revientan): partículas en `pets/efectos.js` (en la escena, máximo 60, las
  mueve `animatePet`); mini (×0,6) y gigante (×1,6), que se reemplazan entre ellas: `extras.tamano`, `P.escala`
  (los letreros guardan su tamaño en `userData.s0`; el auto la respeta).
- La lista completa de artículos que pidió el usuario quedó en `PLAN.md` (Tienda de mascotas), marcando lo hecho.
- Una captura de referencia falló una vez con la imagen entera distinta y al repetirla salió igual (probablemente el
  servidor de desarrollo usando la tarjeta de video al mismo tiempo): cerrar `npm run dev` antes de las capturas.

## Ropa de mascotas (collar, sombreros, capa) y la pelota saltarina (02-10-2026)

- Pasillo nuevo "👕 Ropa" en la Mascotienda (el que era de Accesorios; las alitas pasaron a Transporte) y Juguetes
  abierto. Artículos nuevos (`pets/catalog/articulos.js`): tipo `'ropa'` con `lugar` (cuello: collar con placa 25;
  cabeza: corona 40, gorro de cumpleaños 30, sombrero de mago 45; lomo: capa de superhéroe 60) y tipo `'juguete'`
  (pelota saltarina 30).
- `pets/ropa.js`: cada prenda se calza con el mapa de anclajes (nuevo: `cabezaR` y `cuelloR` por especie). Collar
  inclinado como el cuello con una placa dorada con la inicial (`P.nombre`, lo pone `setPetName`); sombreros sobre el
  ancla `cabeza`; la capa es una tela sobre el lomo (desde el cuello) que cae por los costados pasado el ancho del
  cuerpo y, al andar, se levanta y ondea (vértices movidos en `animarRopa`). `p.extras.ropa = { cuello, cabeza, lomo }`;
  `ponerExtras` la arma; la tienda la valida (`fixExtras`), la prueba y la pone (`conArticulo`, `puesto`).
- La pelota (`game/pelota.js`, botón `#btnPelota` "🎾 Lanzar pelota" en `ui/pelota.js`, evento `'pelota'`): aparece si
  alguna mascota la tiene. Nina la lanza (animación "wave"), vuela, rebota y rueda sin atravesar obstáculos; la mascota
  corre (`p.busca`: sale de la fila), la toma con la boca (en la cabeza), vuelve, se la deja a los pies (+12 de
  diversión) y avisa "🎾 ¡Toby te trajo la pelota!". Desde el archivador, "🎾 ¡A jugar!" la lanza para esa mascota.
- Prueba nueva en `humo.spec.js` (ropa válida, reemplazos por lugar, la pelota de ida y vuelta, guardado).

## Salida de la Mascotienda señalizada; burbuja y alitas a la altura del hombro (02-10-2026)

- La puerta de adentro de la Mascotienda: letrero verde grande "🚪 SALIDA" sobre la puerta, marco verde que brilla
  (late), felpudo verde y tres flechas en el piso que apuntan a la puerta y se encienden una tras otra hacia ella.
- Con burbuja o alitas, el perro, el gato y el conejo flotan a la altura del hombro de Nina: `game/mascotienda.js`
  pone `P.hombro` (altura de UpperArmL sobre su suelo, 0,8–2,2 m; ~1,5 m de pie) y `alturaVuelo` en `pets/extras.js`
  pone ahí el centro de la burbuja o el medio del cuerpo (en el espacio de la mascota: dividido por su escala), con
  un cambio suave (si se sienta, bajan). El unicornio y las mascotas en el auto quedan como antes.

## Gato y conejo más chicos, cosas de cada mascota y carpetas del archivador (02-10-2026)

- `escala` en el mapa de anclajes: gato 0,6 y conejo 0,4 (el perro 0,8); se achica todo junto con lo que tengan puesto.
- Las cosas de la Mascotienda ahora son de cada mascota: `p.cosas` (se guarda con la mascota). Se compra para la
  mascota elegida en la tienda ("Comprando para …"); sin mascota no se compra. Lo puesto sólo vale si es suyo. El
  archivador muestra las cosas de esa mascota. Partidas de antes (`mascotienda.comprados`, de todas): cada mascota sin
  `cosas` recibe esa lista. `player.articulos` ya no existe. Prueba nueva en `guardado.spec.js`.
- "No aparecen las otras fichas": no se pudo reproducir (adoptando 3 más, las 4 carpetas aparecen y se eligen en
  pantalla ancha, iPad y teléfono), pero en el teléfono la cuarta carpeta quedaba cortada (se deslizaba de lado sin
  que se notara). Ahora las carpetas se reparten el ancho y se ven todas; el nombre largo se corta.

## Veredas sin hundirse, libro al derecho y el perro que salta de lado (02-10-2026)

- Nina, los vecinos y las mascotas se hundían en las veredas (0,18 m de alto; todos caminaban a altura 0).
  `enVereda(x, z)` en `world/layout.js` (franjas a WALK ± 1 m del eje, cortadas donde cruza la otra calle salvo las
  esquinas) y `sueloEn` ahora devuelve también la vereda (`ALTO_VEREDA`). La jugadora sube y baja el escalón suave
  (`game/player.js`); vecinos y mascotas con `sueloSuave(quien, x, z, dt)` (`world/physics.js`). La mascota del
  archivador también.
- Libro: 1,2 veces más grande (W 0,156 × H 0,216); las manos de las animaciones se abren a su ancho (±0,142).
  Estaba entero girado en 180° en las manos (el título abajo y las hojas pasando al revés): el eje x del libro va de
  la mano derecha del modelo a la izquierda (`moverLibro` en `game/reposo.js`).
- El perro pide atención dando la vuelta alrededor de Nina a saltitos de lado, siempre mirándola: recorre medio
  círculo, se detiene a ladrar con un salto (a veces se devuelve) y sigue; ladra también mientras salta.

## Ajustes: perro al 80 %, patines como botas, caminata lunar, libro tomado por los bordes (02-10-2026)

- Perro más chico: `escala: 0.8` en `ANCLAJES.perro`; `buildPet` la aplica a `P.root`, así se achica todo junto
  (cuerpo, anclajes y lo que tenga puesto: burbuja, globo, alitas guardan su proporción). Las coordenadas del mapa de
  anclajes siguen en el espacio propio de la mascota, antes de la escala. Las etiquetas no se achican
  (`letreroMascota`); en el auto se respeta la escala (`driving.js`).
- Patines: estaban arriba de las patas (se medía la caja de la geometría sin la posición de la malla). Ahora la caja
  va en el espacio de la pata, y la bota es la parte de abajo de la pata (42 %) "pintada" de rosado y un 16 % más ancha
  (funda redondeada), con suela y 4 ruedas debajo; `alto` = suela + ruedas.
- Alitas: caminata lunar: pasos lentos y grandes en diagonal que llegan a las patas bien estiradas (curva que se
  queda en los extremos), un saltito suave en cada paso, se pasa de flotar a caminar poco a poco; más inercia.
- Mascotas: esperan al menos 30 s paradas antes de sentarse (perro 30, gato 35, conejo 30, unicornio 32); sin
  mascotas, Nina descansa a los 40 s.
- Libro: mapa de anclaje (`agarre(o)` en `characters/libro.js`): el centro del borde exterior de cada tapa. En el
  juego cada borde va a la palma (muñeca + 0,055 en la dirección del antebrazo) y el libro se ajusta un poco al ancho
  entre las palmas; mira hacia la cara y hacia atrás (inclinado, no plano en la falda). Las animaciones abren las
  manos al ancho del libro abierto (±0,118 la muñeca) con los codos doblados; cerrado, ±0,06.
- `cam.fijo = { pos, look }` (con los ganchos de prueba): cámara fija para fotos de revisión.

## Artículos con movimiento, ciclo de espera de las mascotas y reposo de Nina (01-10-2026)

- Pedidos: la burbuja con inercia (se adelanta un poco al frenar y vuelve suave); el globo esférico, más chico, con
  inercia y la canasta decorada; las alitas con las patas estiradas y un movimiento suave "de gravedad cero"; patines de
  verdad en cada pata y animación de patinar. Las mascotas con un ciclo de espera cuando Nina no se mueve (esperando →
  sentada → acostada → salta y ladra alrededor de Nina → otra vez; según la especie, y que se vea en la ficha; si Nina
  está sentada o acostada, sólo se sienta y se acuesta). Nina con su ciclo de reposo, que empieza cuando la mascota
  terminó un ciclo: se sienta en el pasto (no donde pasa la gente), bosteza, se acuesta a leer un libro; cada tanto lo
  cierra, se sienta a leer sentada y se vuelve a acostar. Libros distintos con un dibujito en la tapa.
- `pets/extras.js`: `inercia()` es un resorte poco amortiguado entre la mascota y lo que flota con ella (lo que la
  mascota acelera empuja al revés; `{ k, c, max }` por artículo); devuelve el desplazamiento en el espacio de la
  mascota. Burbuja: la burbuja y la mascota se corren juntas. Globo: sin el `scale(1, 1.18, 1)` (era ovalado), radio
  0,72; la canasta se corre y el globo con sus cuerdas (`arriba`) se inclina como péndulo; canasta con textura de mimbre
  hecha en un canvas (tejido, franja arcoíris, estrellitas) y banderines (no hizo falta un png). Alitas: sin saltos,
  patas de adelante hacia adelante y las de atrás hacia atrás remando lento, inclinación suave al avanzar, aleteo más
  lento. Patines: una bota con 4 ruedas en cada pata (se calza mirando el borde de abajo de la malla de la pata, sirve
  para todas las especies); al andar, `patinar()` empuja con las patas en diagonal hacia atrás y afuera, el cuerpo se
  mece de lado y no salta.
- `pets/follow.js`: `followChain(…, ocio)` con `ocio` = null / 'quieta' / 'descansa' (lo calcula `main.js`:
  `ocioMascotas()`). `CICLOS` por especie (segundos de cada parte, voz, texto del globito); con sueño no se levanta a
  jugar; aburrida espera la mitad. En "juega" da vueltas alrededor de Nina (radio 1,4 m + 0,5 por mascota) y cada 1,3 s
  salta con su voz (`emit('sonido', 'guau' | 'miau' | 'conejo' | 'relincho')`, sintetizadas en `audio/audio.js`) y un
  globito "¡Guau!" (`labelSprite` con `bubble`). `waitAt(…, descansa)` en las graderías: sentada y después acostada.
  `pets/models.js`: `animatePet(…, 'acostada')`: el cuerpo baja (80 % de la altura de la cadera), patas dobladas hacia
  adelante, respira. Ficha (😊 Estado): "Ahora: 🐾 Esperando… / 🪑 Se sentó a esperar / 💤 Se echó a descansar / 🎾 ¡Se
  aburrió y te pide jugar!"; esperando se aburre más rápido (−0,2/s, −0,4/s cuando pide jugar).
- Reposo de Nina: `game/reposo.js` (fases con su animación y duración; empieza cuando una mascota completa un ciclo
  —`p.ocio.vueltas`— o, sin mascotas, a los 25 s). Busca pasto con `world/pasto.js` (`esPasto`: fuera de calles y
  veredas, senderos, pisos, interiores, de lo marcado con `sinPasto` —el piso de goma de la plaza— y a 1 m de los
  obstáculos; `pastoCerca` busca en anillos hasta 12 m; si no hay, no se sienta y reintenta a los 20 s). Camina sola
  hasta ahí (`player.ir`, en `game/player.js`; tocar los controles lo deja). El libro (`characters/libro.js`: 8 libros
  de colores con estrella, cohete, flor, gato, luna, corazón, pez o arcoíris dibujados en canvas; se abre, se cierra y
  pasa hojas) va entre las dos manos mirando hacia la cara, calculado cada cuadro con los huesos.
- Animaciones nuevas (`tools/animaciones/reposo.mjs`, horneadas por `separar_glb.mjs`): `sentarse_suelo`, `bostezo`
  (cara con la boca abierta y los ojos cerrados: `AUTO_FACE`), `leer_sentada`, `acostarse_leer`, `sentarse_leer`,
  `leer_acostada` (boca abajo en los codos, los pies arriba). Las de en medio mezclan poses resueltas (`mezcla`). Total
  34 animaciones.
- Revisado con fotos en el juego y en el probador. Capturas regeneradas (sólo se movieron vecinos: hay más materiales).

## "Mis mascotas": el archivador personal de las mascotas (01-10-2026)

- Pedido: el botón 🐾 Mascotas debe ser el apartado personal de las mascotas del jugador: sus fichas (nombre, fotos,
  estado —feliz, aburrida, cansada…—, controles médicos con fechas, sus cosas por categoría), fácil de revisar y
  administrar, como un archivador, para usar lo comprado. Adoptar sigue siendo en el Refugio (la zona).
- `game/fichas.js`: por mascota `adopcion`, `estado` { energia, diversion } (felicidad = promedio, +8 con el jarabe
  arcoíris), `controles` [{ tipo, fecha, hecho }] (al adoptar: el de adopción hecho; vacunas a los 7 días y control
  general a los 30, pendientes: la veterinaria todavía no existe) y `fotos` (hasta 4, jpg de 240 px). El estado cambia
  solo: pasear cansa (correr más; con un transporte casi nada), descansar recupera; el tiempo aburre, los juegos, la
  competencia y tener un transporte puesto divierten. `animo()`: "Tiene sueño", "Quiere jugar", "¡Muy feliz!", "Está
  bien"… (sin género). Se guarda con la mascota (y cada 30 s); se valida al cargar. Modo `'archivador'`: la mascota
  elegida se pone delante de Nina.
- `ui/panels/archivador.js` (`#archPanel`): una carpeta por mascota (pestaña de su color), una hoja con renglones y
  pestañas de índice: 📋 Ficha (nombre editable, especie, color, adopción y días juntos, fotos tipo polaroid con 📸 Sacar
  foto —lo que se ve en pantalla— y borrar, 🏠 Llevar a casa con confirmación), 😊 Estado (carita, ánimo y barras de
  felicidad, energía y diversión, que se actualizan), 🩺 Salud (controles hechos, pendientes y ⏰ atrasados, con fecha),
  🎒 Cosas (Ropa, Artículos, Pociones, Juguetes: lo comprado, con Ponérselo/Quitárselo).
- Pruebas: adoptar ahora va por la zona del Refugio; las de guardado leen las carpetas; prueba nueva del archivador
  (renombrar, foto, estado, salud, ponerle patines, guardado). Captura 5 regenerada (ahora es el archivador).

## Mascotienda: cámaras, burbuja, globo, alitas y mapa de anclajes de las mascotas (01-10-2026)

- Pedidos: la cámara del probador y la de Robi a veces quedaban tapadas (el biombo, una pared); la burbuja con la
  mascota sentada y más grande; el globo con la mascota sentada en la canasta, más grande y alto, y una cuerda que lleva
  Nina; las alas de mariposa bien puestas en la espalda de cualquier mascota caminando, con un mapa de coordenadas
  (servirá para capas, monturas, alas, cohetes…).
- **Mapa de anclajes** (`ANCLAJES` en `pets/models.js`): por especie, `espalda`, `lomo`, `cuello`, `cola` (en el espacio
  del cuerpo) y `cabeza` (en el de la cabeza), más `ancho`, `largo` y `alto`. `buildPet` cuelga un `Object3D` en cada
  uno (`P.anclas.espalda`…, `P.medidas`): se mueven con el cuerpo al caminar, saltar y sentarse.
- `pets/extras.js` rehecho sobre los anclajes: **alitas** de hada en `espalda` (dos pares, rosado y celeste; a lo largo
  del lomo, abiertas en V hacia los lados, del tamaño del largo de la mascota; aletean abriéndose y cerrándose: las
  primeras, horizontales y en el plano equivocado, no se veían); **burbuja** grande (radio ~ largo/alto + 12 cm) con
  dos brillos, la mascota **sentada** adentro (`P.siempreSentada`: `animatePet` la sienta aunque se mueva); **globo**:
  canasta abierta con borde y fondo a 1,6 m, la mascota sentada adentro, globo de 95 cm con 12 gajos ~1,5 m más arriba,
  4 cuerdas, y **la cuerda hasta la mano izquierda de Nina** (`P.mano`, que pone `game/mascotienda.js`; un tubo curvo que
  cuelga un poco); patines igual.
- Cámara de la ventana: mira desde el centro de la sala (la de Robi quedaba detrás de la pared del fondo); el probador
  tiene su propio ángulo (`vista` en la zona: desde el pasillo de enfrente; con el centro la tapaba un estante).
- Pruebas: la de la Mascotienda; capturas regeneradas (los anclajes nuevos mueven a dos vecinos).

## TEMPORAL: 1000 Huesitos de regalo para probar la Mascotienda (01-10-2026)

- Pedido: agregar temporalmente 1000 Huesitos para comprar y ver los artículos ("es sólo algo temporal, en el juego hay
  que ganárselos"). `REGALO_PRUEBA` en `game/huesitos.js`: al cargar, si la partida no lo recibió (`regaloPrueba` en el
  guardado), a los 1,5 s da 1000 con el motivo "¡Regalo para probar la Mascotienda!"; no se repite al recargar. No se
  da con `?test` (las pruebas no cambian). **Quitar** poniendo `REGALO_PRUEBA = 0` (anotado en `PLAN.md`).

## Mascotienda Arcoíris (tienda de mascotas, etapa 2) (01-10-2026)

- Pedido: la tienda 3D por dentro, con pasillos/estantes por sección, probadores, carteles y el vendedor (un perro
  robot sobre un disco volador, a la altura de Nina); los primeros artículos, los de fácil construcción.
- `world/places/mascotienda.js`: **afuera**, en la manzana frente al Refugio (cruzando la Calle Mora): fachada menta con
  techo rosado, hueso gigante en el techo, huellitas, vitrinas con globos, toldo y letrero; "🛍️ Entrar a la
  Mascotienda". **Adentro**, una sala aparte lejos del mapa (24 × 18 m en (0; 260), techo a 5,5 m): piso de cuadros
  rosado y lila, paredes menta con zócalo rosado y franjas arcoíris, techo lila con lámparas planas; 4 pasillos con
  muebles de 3 repisas del color de su sección y cosas encima (botellitas, patines, globos, burbujas, alitas, pelotas),
  con su cartel colgado ("🧪 Pociones", "🛼 Transporte", "🎀 Accesorios", "🧸 Juguetes (¡pronto!)"); el probador (tarima,
  espejo, cortina a rayas); el mostrador con la caja y **Robi**, el perro robot (cara de pantalla ^‿^, orejas rosadas,
  antena que titila, cola que se mueve) sobre un disco volador que gira y flota; saluda al acercarse. "🚪 Salir a la
  calle". La sala no recibe bien la luz del sol: paredes y muebles con algo de brillo propio y techo sin sombreado.
  - `world/physics.js`: interiores (`addInterior`): adentro no rige el límite de la ciudad (`player.js`) y la cámara
    no sube más que el techo menos 0,8 m (`camera.js`).
- `pets/catalog/articulos.js` (datos) y `pets/extras.js` (efectos): jarabe arcoíris 20 (el pelaje cambia de color:
  copias propias de sus materiales), patines con luces 50 (patas quietas al patinar, ruedas que brillan), burbuja
  flotante 60, mini globo aerostático 100 (con franjas, se mece) y alitas de hada 80 (aletean); los que vuelan, flotan.
  Uno de "transporte" a la vez por mascota, más el jarabe.
- `game/mascotienda.js`: entrar/salir (con las mascotas), comprar (gasta Huesitos; si faltan, avisa cuántos),
  ponerse/quitarse, probar sin comprar (se ve hasta cerrar), el diario de la mascota (+3 Huesitos al leerlo), Robi
  saluda. Guardado: `mascotienda.comprados` y `extras` en cada mascota (validado contra lo comprado).
- `ui/panels/mascotienda.js`: pestañas por sección, la mascota a la que se le prueba, cada artículo con su nombre
  grande y 🔊 (lo dice en voz alta, es-CL), precio, Probar/Comprar o Ponérselo/Quitárselo; el saldo abajo. Mientras está
  abierta, la mascota elegida se pone delante de Nina.
- Prueba nueva (entrar, probar, no alcanza, comprar, diario, salir, y lo puesto sigue al recargar). Capturas regeneradas.
  Chromium (dev y web): **101/101**.

## Huesitos de Aura (tienda de mascotas, etapa 1) (01-10-2026)

- Plan de la tienda de mascotas "con créditos que se ganan leyendo" (ver `PLAN.md`). Etapa 1: la moneda.
- `game/huesitos.js`: `player.huesitos` (en `game/actors.js`), `ganarHuesitos(n, motivo)`, `gastarHuesitos(n)` (para
  la tienda), `cargarHuesitos(saved)` (valida: entero 0…999 999; un valor raro queda en 0); se guarda apenas cambia
  (`huesitos` en el guardado v2). Evento `'huesitos'` { total, delta, motivo }.
- Cuánto (`HUESITOS`): Código Aura leído 10 (+5 si fue rápido), competir 10, ganar +30 (en `game/aura.js`).
- `ui/huesitos.js`: píldora "🦴 número" arriba a la derecha (no en la portada). Al ganar, un huesito vuela del centro
  de la pantalla al contador, el número cuenta hacia arriba, la píldora salta y aparece "+15 🦴 ¡Leíste rapidísimo!".
- Pruebas: los Huesitos se guardan, se muestran y se validan; la competencia da al menos 40 y quedan guardados y en el
  contador. Capturas regeneradas (el contador es nuevo en el HUD).

## Senderos: los vecinos entran y cruzan el parque y la plaza (01-10-2026)

- Pregunta: ¿cómo entran los vecinos al parque? (sólo se los veía por el borde). Antes entraban sólo para usar un juego,
  en línea recta desde la esquina. Pedido: que paseen cruzando por los senderos y que entren a los juegos por ellos.
- `world/senderos.js`: un lugar declara sus caminos con `addSenderos({ area, nodos, aristas, entradas })` (nuevo en el
  `ctx` de `definePlace`); `ruta(x0, z0, x1, z1)` da los puntos (si el origen o el destino está en el área: por la
  entrada más cercana y el camino más corto, Dijkstra). El parque: las dos calles de tierra en cruz (entradas en las 4
  veredas) y un círculo de 8 puntos a 5,6 m de la pileta; la plaza: del arco al centro y entre los juegos, con entradas
  en la Avenida Menta y en las veredas de arriba y de abajo.
- `game/vecinosJuegos.js`: los vecinos caminan por rutas (`recorrido`: de punto en punto con `collide`; si se atascan
  saltan al siguiente). Para ir a un juego y volver a su esquina usan `ruta`. **Paseos** (`pasear`, probabilidad 0,3 en
  cada esquina, si hay una entrada a menos de 20 m): van por la vereda a la entrada, cruzan por los senderos hasta otra
  entrada (60 %: se detienen 2–5 s a mitad de camino) y siguen por la vereda hacia la esquina más cercana.
- Prueba nueva: un vecino cruza el parque pasando a menos de 7 m del centro de la pileta y sale. Ganchos:
  `vecinosJuegos.pasear(i)`; `estado()` incluye la posición. Capturas regeneradas (gotas de la pileta y un vecino
  lejano). Chromium (dev y web): **97/97** (la batería completa ya tarda ~10,5 min).

## Los vecinos usan los juegos; todos los movimientos para competir (01-10-2026)

- Pedido: que los vecinos usen los juegos y la plaza (columpiarse, sentarse en las bancas, el balancín de a dos…), y
  todos los movimientos en el selector de la competencia.
- `game/vecinosJuegos.js`: al llegar a una esquina, con probabilidad 0,3 un vecino elige un juego o banca libre a
  menos de 26 m (de las zonas `bench` y `juego`, salvo `privado`: las graderías), camina hasta él (con `collide`; si se
  atasca 2,5 s, se rinde o, si está cerca, cuenta como llegar), lo usa (banca 10–20 s, carrusel/sube y baja 10–18 s,
  columpio 14–22 s —se impulsa solo hacia donde va el columpio y deja de hacerlo los últimos 4 s; a veces de pie—, cama
  elástica 6–10 s, tobogán hasta abajo —a veces de pie—) y vuelve a su esquina. El sube y baja (`pareja: true` en la
  plaza) invita al vecino libre más cercano (60 m) al otro asiento.
  - `npcs.js` sólo tiene un gancho (`onEsquina`) y `n.uso` (`update` → `{ anda, raiz, sentado, cara }`): así no hay
    ciclo de imports (npcs → juegos → player → npcs). Sus mascotas los esperan sentadas.
  - **Ocupación** (`game/juegos.js`): cada ancla anota `userData.quien`, la banca `bench.quien`, la cama y el tobogán
    son de a uno (`juego.ocupado` pasó a ser un contador; `juego.reservado` mientras un vecino va). La jugadora elige el
    ancla libre más cercana; si no hay: "¡Está ocupado! Espera tu turno". El vecino reserva desde que decide ir.
  - `game/juegos.js` exporta lo que comparten: `sentarEnAncla`, `pararEnAncla`, `anclaLibre`, `ocupar`, `liberar`,
    `mirada`, `secuenciaTobogan` (la secuencia del tobogán sin la jugadora: `mover(dt)` → 'subiendo', 'tirandose', 'fin').
- Selector de la competencia: todos los movimientos del menú Acción menos "Quedarse quieta" (17).
- Ganchos: `window.__juego.vecinosJuegos` (`mandar(i, tipo, pareja)`, `estado()`). Pruebas nuevas: vecinos en el
  columpio, la banca y el sube y baja de a dos (y la jugadora usa el otro columpio); el selector completo. Capturas
  regeneradas (los vecinos toman otras decisiones en las esquinas). Chromium (dev y web): **93/93** (de nuevo el error
  de Chromium "Unable to capture screenshot" en una corrida larga; repetida, bien).

## Puntos en la pantalla, carteles del jurado y Auras de los vecinos (01-10-2026)

- Pedido: en la pantalla, el puntaje acumulado de cada uno con números de calculadora, sólo en el extremo de arriba de
  cada barra, y los nombres; las barras suben para mostrar quién va ganando (escala de colores); al final los jueces
  muestran en carteles el mismo total; puntos coherentes (si un Aura vale 1000…); el rival y los vecinos también sacan
  Aura al azar.
- **Puntos** (`game/aura.js`): cada movimiento vale `BAILE` 500; un Aura, `AURA` +1000; si fue rápido, `RAPIDO` hasta
  +500 (la jugadora: Código Aura al primer intento con más de la mitad del tiempo +500, con menos +250). Máximo 2000 por
  movimiento y 6000 por competencia (`MAX_PUNTOS`, el tope de las barras). Los vecinos sacan Aura con probabilidad 0,45
  (`PROB_AURA`), a veces rápida. Gana quien suma más; si empatan, la jugadora. Se acabaron las notas del 5 al 10.
- **Pantalla gigante** (`places/escenario_aura.js`): `ESCENARIO.medidor = { puntos, nombres, activo, max }`. Cada
  barra (8 segmentos, de rosado a violeta) sube según los puntos (el segmento de la punta se enciende de a poco; el de
  quien baila titila); arriba, una pantallita oscura con el puntaje en **dígitos de siete segmentos** que cuenta hacia
  arriba (cian a la izquierda, rosado a la derecha), y abajo el nombre. `engine/digitos.js`: `dibujarDigitos` dibuja
  los segmentos en un canvas (con los apagados tenues detrás, como una calculadora).
- **Aura de un vecino** (en `bailar`, a la mitad del baile): el aura sube por él (dorada si fue rápida), dice
  "✨ ¡AURA! +1000 pts", un juez alza la estrella y el público aplaude (3,2 s, sin cámara lenta).
- **Jurado al final**: "¡El jurado está sumando!" y, para cada concursante, los tres jueces se paran en sus sillas y
  alzan un cartel (`cartelPuntos` en `engine/efectoAura.js`: paleta blanca con borde dorado y el total en dígitos
  amarillos) con el mismo total de la pantalla.
- Jueces que alzan cosas: `alzar(juez, objeto, dur)` (varios a la vez) reemplaza a la celebración de uno solo;
  `aplaudir(dur)` alarga el aplauso si ya estaba.
- Capturas regeneradas (los objetos nuevos de la pantalla corren los números al azar: un vecino y unas gotas).
  Chromium (dev y web): **91/91** (una corrida tuvo un error de Chromium al sacar una captura; repetida, bien).

## ¡Aura!: vuelta de 360° en cámara lenta, el jurado con la estrella y el público aplaudiendo (01-10-2026)

- Pedido: al emitir un Aura, el giro "tipo Nintendo" subiendo y girando 360° en cámara lenta, viendo al jurado y al
  público; un juez de pie sobre la silla alzando un letrero de estrella dorada con una "A"; el público aplaudiendo.
- Animaciones nuevas (`tools/animaciones/juegos.mjs`; 28 en total): `alzar_estrella` (de pie, los brazos estirados
  hacia arriba, las muñecas a los lados de lo alto de la cabeza —más juntas quedaban encima de ella—, rebote en las
  puntas de los pies y vaivén) y `aplaudir` (parte de la pose final de "sit": `poseFinal()` en `bailes.mjs` la lee del
  modelo; las manos se juntan delante del pecho ~3 veces por segundo).
- `estrellaAura()` (`engine/efectoAura.js`): estrella dorada de 5 puntas extruida con biselado, "A" violeta con borde
  blanco por los dos lados y un halo que late. En el juego, 1,6 veces (se ve desde la tarima).
- `celebrarAura()` (`game/aura.js`), al acertar un código y al ganar: un juez al azar salta a su silla (0,68 m) y alza
  la estrella, que sigue entre sus manos (bailando un poco); el público aplaude; ~6 s (`CELEBRA`) y vuelven a sentarse.
  La cámara lenta dura lo mismo.
- Toma 'lenta' nueva: una vuelta entera (360°) alrededor de ella, empezando lenta de frente (mientras el criptex lanza
  el hechizo) y subiendo de 0,35 a ~3 m; en la mitad se abre (hasta ~7,8 m) y al pasar por detrás mira un poco hacia
  el jurado y el público (`ESCENARIO.publicoCentro`); termina de frente, alta.
- El criptex festeja más rápido (AURA 0,3–1,6 s, puntos 1,3–2,7 s, se va a los 3 s): así ya no está cuando la cámara
  pasa por detrás.
- Capturas regeneradas (los dos clips nuevos usan Math.random al cargarse: cambian unas gotas de la pileta).
  Chromium (dev y web): **91/91**.

## El Código Aura en la competencia, con cámara lenta (01-10-2026)

- Pedido: llevar el criptex y el aura al juego, con movimientos de cámara en cámara lenta "tipo Nintendo" al ganar.
- Cada uno de los 3 movimientos de la jugadora es ahora un **reto** (`retoAura` en `game/aura.js`): baila en bucle
  mientras aparecen el código (3 palabras, 4 figuras por anillo, 30 s) y el criptex; el paso dura hasta que acierta o
  se acaba el tiempo (+ el festejo). Los vecinos siguen como antes.
  - `game/codigoAura.js` (sin DOM): `nuevoCodigo({ figuras, azar })` y `revisar`; también lo usa el prototipo.
  - `ui/codigoAura.js`: la ventana `#codigoAura` (index.html + juego.css: palabras alineadas con los anillos, tiempo
    debajo; mientras está, no se muestra el aviso de arriba) y el criptex colgado de la cámara del juego (se agrega la
    cámara a la escena). Evento `'aura'`: `codigo`, `reloj`, `error`, `acierto`, `tiempo`, `cerrar`; la respuesta vuelve
    con `responderCodigo(ids)`.
  - Puntos del movimiento: 5 base; +3 si acierta; +2 si es al primer intento con más de la mitad del tiempo (+1 con
    menos). Se muestran ×100 ("+1000 pts"). Las notas del jurado y quién gana se calculan al votar (antes, al armar la
    competencia). Si empatan en todo, gana la jugadora.
  - **Acierto**: aura sobre ella (dorada si fue rápido), el criptex se abre con "AURA" y los puntos, un grito del
    público y **cámara lenta** (`camaraLenta`: el escenario al 30 % durante 3,2 s y vuelve suave; a la jugadora vía
    `mixer.timeScale`, y las auras también) con la toma **'lenta'**: baja y cerca por un costado, barre por delante
    hasta el otro costado mientras sube y se aleja (antes terminaba detrás de ella). **Ganar la competencia**: lo mismo
    con su aura dorada mientras hace el spin (4,2 s).
  - Toma **'reto'** mientras lee: desde abajo, el criptex delante (como en el prototipo).
- "AURA" pasó a fundido normal con borde morado (sobre la luz del aura, el aditivo quedaba blanco e ilegible).
- Ganchos: `competencia.codigo()`, `responder(ids)`, `lento()`. La prueba de competir ahora contesta los 3 códigos
  (uno con un error primero) y revisa la ventana, la cámara lenta y las tomas. Chromium (dev y web): **91/91**.

## Prototipo del criptex del "Código Aura" (01-10-2026)

- Propuesta aceptada en lo general: mientras la jugadora compite, un código de 3 palabras (lectura de palabras de 3
  sílabas o más) y un criptex donde elegir sus figuras en orden; acertar da un aura y puntos extra. Pedido: criptex
  **3D hexagonal de cristal mágico**, flotando delante de la cámara; las palabras en una ventana 2D sobria y
  semitransparente. Por ahora sólo el prototipo (no está en el juego).
- `ui/criptex3d.js` (`crearCriptex`): 3 prismas hexagonales en un eje (6 caras = hasta 6 figuras; las que sobran
  llevan una runa), entre separadores y tapas doradas con puntas; va **colgado de la cámara** (siempre abajo al centro,
  escalado al ancho y alto de la pantalla). Cristal simulado (violeta semitransparente con brillo que late, halo
  aditivo, aristas claras, reflejo que cruza el marco, chispitas que suben); las figuras opacas sobre medallones claros.
  Flota (sube, baja y se mece) y se calma mientras se gira. Se gira arrastrando con el dedo (con inercia y encaje con
  rebote) o tocando arriba/abajo del anillo; teclado ←→ ↑↓ y Enter. La gema "¡Aura!" confirma. `marcar` (aristas
  verdes fijas / rojas que tiemblan), `abrir` (los anillos dan una vuelta uno tras otro, brilla y desaparece).
  Imágenes: `img` (la propia, cuando exista) o el emoji dibujado en un canvas.
- `game/palabras.js`: 69 palabras con sílabas, emoji provisorio y "parecidas" (los distractores de su anillo, que
  empiezan igual: canguro → cangrejo, caracol, camello).
- `src/debug/criptex.html` + `criptex.js` (sólo `npm run dev`): Nina baila en una tarima, cámara desde abajo / de frente
  / girando, la ventana del código (palabras alineadas con los anillos, sílabas opcionales) y el tiempo (anillo
  semitransparente, naranja los últimos 5 s). Acertar abre el criptex y trae otro código; un error marca el anillo y la
  palabra en rojo; sin tiempo, los anillos giran a la respuesta. `?toma=&figuras=3..6&silabas=1&tiempo=&semilla=`.
- Revisado en tablet (horizontal y vertical) y teléfono: en el teléfono queda chico. Chromium: 91/91 (el juego no cambia).
- Ajustes pedidos: al acertar, antes de que se vaya el criptex, aparece **"AURA" como hechizo** (letras luminosas con
  degradado y resplandor, brillo aditivo; crece, sube y se desvanece) y después **los puntos** ("+800 pts", estilo
  juegos 3D de Nintendo: amarillo-dorado con borde blanco y otro oscuro; entra con rebote y se va). Van colgados del
  criptex (en la cámara), por encima de todo. Secuencia: anillos 0–0,9 s, AURA 0,5–2 s, puntos 1,7–3,3 s, el criptex
  se va 3,2–3,6 s. `abrir(fin, '+800 pts')`; en la página de prueba los puntos son de ejemplo (según el tiempo que sobra).
- Temporizador: más grande (86 px), **debajo** de la ventana del código, un **sector de círculo** que se achica con el
  número al centro; naranja y parpadeando los últimos 5 s. Las palabras largas ya no achican la letra de las tres
  (columnas de al menos 190 px, cada palabra con su tamaño, mínimo 26 px).
- Se quitó el rótulo "¡Aura!" de la gema (la gema sigue confirmando). **Aura sobre el personaje** al acertar:
  `engine/efectoAura.js` (`efectoAura(padre, { color, alto })`, se cuelga del grupo del personaje y `update(dt)`
  devuelve false al terminar): columna de luz de dos capas que crece desde los pies, gira y con vetas que suben, un
  anillo en el suelo que se expande con destello y 90 chispas en espiral; ~2,8 s. Dorada si acierta con más de la
  mitad del tiempo, celeste si no. Primero quemaba al personaje en blanco (brillo aditivo con colores claros): ahora
  colores saturados y oscuros, opacidades bajas y la capa de adentro más ancha y tenue.

## La jugadora compite en el Escenario del Aura (01-10-2026)

- Pedido: al acercarse al escenario poder elegir participar; si hay una competencia en curso, que le toque al
  terminar; elegir 3 movimientos en una ventana; la competencia por ahora automática, con cámaras de cerca y desde
  abajo y transiciones (para más adelante poder interactuar durante los movimientos).
- "😎 Competir" pasó de la tarima a delante de ella, junto al escalón (`ESCENARIO.frente`). Si hay una competencia en
  curso: "📝 ¡Te anotaste!…" y, apenas termina (si está a menos de 16 m y jugando), se abre la ventana; si no, se abre
  ya (y se para si estaba sentada en las graderías).
- Ventana (`ui/panels/aura.js`, `#auraPanel`; la abre el evento `'aura'` `{ que: 'elegir', bailes }`): los 10 bailes,
  se tocan en orden (número en la esquina, tres casillas arriba), tocar uno elegido lo quita; "¡A competir!" con 3;
  "Cancelar" vuelve a jugar. Modo `'aura'` (`enterMenu`: sin HUD ni palanca).
- La competencia (`competir(movs)` en `game/aura.js`): los dos vecinos se despiden y bajan; llega un rival nuevo
  (reserva) y la jugadora camina a su lugar (izquierda); presentación, 3 rondas por turnos (ella primero), jurado,
  ganador ("🏆 ¡Ganaste!…" o gana el rival); al final ella baja delante de la tarima, llega otro vecino a su lugar y
  vuelve el modo 'play'. Los puntos todavía son al azar como los de los vecinos. La lleva un "asiento" fijo
  (`player.seat` con `mover` y `vel`: `player.js` ahora usa `seat.vel` para caminar).
  - El núcleo de la competencia (`competir2`) es el mismo para vecinos y para ella.
- **Cámaras** (`cam.cine`, rama nueva del modo 'aura' en `game/camera.js`, que se desliza hacia cada toma con su `k`:
  ésa es la transición). Cada paso trae `toma` (y `objetivo`): general (desde el público), cerca (de frente), abajo
  (desde el piso de la tarima mirando hacia arriba), orbita (girando alrededor), lado, jurado (desde la tarima),
  ganador. En sus bailes: 1.º cerca → abajo, 2.º orbita, 3.º abajo → lado; los del rival, general.
- Ganchos: `competencia.jugando()`, `competencia.toma()`. Pruebas nuevas: ventana y cancelar; competir completo
  (acelerado: baila lo elegido, pasan las tomas, vuelve a jugar y a moverse); anotarse con una en curso. Capturas sin
  cambios. Chromium (dev y web): **91/91**.

## Graderías: la mascota se sienta al lado; competencias seguidas (01-10-2026)

- Pedido: al sentarse en las graderías, la mascota se sienta junto a la jugadora mirando el escenario. Cada puesto
  libre trae `userData.mascotas = { x, z, y, mira, dir }` (en el mismo escalón, al lado; `dir`: hacia dónde sigue la
  fila si son varias, alejándose de la jugadora, cada 0,7 m). `asiento` lo pasa a `player.seat.mascotas` y `main.js`
  usa `waitAt` con ese punto. `waitAt` con `y`: al llegar suben de un saltito al escalón (sin chocar con él).
- Pedido: si sigue sentada, después de un descanso, otros vecinos compiten. Al terminar una competencia, si la
  jugadora sigue en las graderías (`ESCENARIO.gradas.ocupado`), a los 8 s (`DESCANSO`) empieza otra: "🔄 ¡Llegan
  nuevos concursantes!", los dos de antes dicen "¡Chao!" y bajan por detrás de la tarima (`ESCENARIO.salidas`), se
  cambian por dos de la reserva (6 looks más sorteados con el público y cargados al comienzo; los avatares se arman
  cuando les toca) y suben a sus lugares; después, la competencia de siempre con nombres y bailes nuevos. Sentarse de
  nuevo más tarde también trae concursantes nuevos. Ganchos: `competencia.hechas()`, `concursantes()[i].id`.
- Pruebas: la mascota al lado en las graderías; la competencia sigue con otros dos vecinos. Capturas sin cambios.
  Chromium (dev y web): **85/85**.

## Competencia entre dos vecinos (01-10-2026)

- Pedido: primero una competencia de dos vecinos, de 3 movimientos cada uno (antes de que compita la jugadora).
- `game/aura.js`: dos concursantes (looks sorteados con los del público) esperan de pie a los lados de la tarima
  (`ESCENARIO.lados`). Al sentarse la jugadora en las graderías (`ESCENARIO.gradas.alSentarse`, nuevo
  `juego.alSentarse` en `game/juegos.js`) y si no hay una en curso, empieza la competencia (~55 s):
  presentación con nombres al azar → cada uno camina al centro de la tarima (`ESCENARIO.centro`, mirando al público),
  hace 3 bailes distintos del menú Acción (nombre e ícono en un globo; el público grita "¡Bravo!", "¡Qué aura!"…),
  saluda y vuelve a su lado → el jurado da su nota (⭐ 5–10 en cada globo, y en el aviso para quién es) → se anuncia
  quién gana con la suma, el ganador hace "spin" y "🏆 ¡Gané!", el otro saluda "¡Bien jugado!".
  - Cada baile vale 6–10 puntos (sin empates); el aura sube en el medidor de su lado de la pantalla
    (`ESCENARIO.medidor = { niveles, activo }`, que el lugar dibuja; si es null, los medidores se mueven solos). Los
    segmentos apagados ahora son oscuros (antes no se distinguían de los encendidos).
  - Los pasos son una lista `{ dur, inicio, cada, fin }` que avanza `updatePublico`; el resultado tiene azar
    (`Math.random`), pero sólo corre si alguien se sienta (no en las capturas).
  - Graderías con `vista`: la cámara queda detrás, mirando la tarima.
  - Ganchos: `window.__juego.competencia` (`enCurso()`, `concursantes()`, `rapido(x)` para acelerarla).
- Prueba nueva (acelerada ×4: los dos bailan y se anuncia quién gana). Capturas regeneradas (los concursantes mueven a
  un vecino). Chromium (dev y web): **85/85**.
- Ajuste pedido: los concursantes esperan **arriba de la tarima**, uno a cada lado (local ±3,4; −4), mirando al
  público, y se turnan **un movimiento a la vez**: uno pasa al centro, baila y vuelve a su lugar; después el otro;
  tres rondas ("✨ Ronda 2: le toca a…"). Al final de su último baile cada uno saluda. Dura ~65 s. 85/85.

## Escenario: mascotas que esperan y graderías para sentarse (01-10-2026)

- Pedido: si la jugadora sube a la tarima, la mascota se queda afuera sentada esperando; y poder sentarse en las
  graderías a mirar.
- **Mascotas sentadas**: `animatePet(P, t, speed, dt, sentada)` (`pets/models.js`) pasa suave a una pose de sentado
  (`P.sit` 0…1): el cuerpo se inclina con la cola abajo, las patas de adelante derechas y las de atrás dobladas (el
  conejo casi no cambia), la cabeza sigue mirando adelante.
  - Un piso puede traer `espera: { x, z, mira }` (`world/physics.js`, nuevo `pisoEn`): si la jugadora está en él, las
    mascotas no la siguen; `waitAt` (`pets/follow.js`) las lleva a ese punto, en fila hacia el costado, y las sienta
    mirando hacia `mira` (`main.js` elige entre seguir y esperar). La tarima y su escalón esperan al lado del escalón,
    mirando la tarima (`ESCENARIO.espera`, se mueve con el escenario).
  - `followChain(…, sentadas)`: con la jugadora sentada (banca, graderías, un juego), las que llegan a su lado se sientan.
- **Graderías**: zona con dos botones, "🪑 Sentarse adelante" / "⬆️ Sentarse arriba" (dos puestos libres en la fila de
  adelante y dos en la de arriba, mirando la tarima). Usa el tipo `asiento` de `game/juegos.js`, que ahora acepta
  `asientos` por opción (`{ adelante: […], arriba: […] }`); se levanta al moverse.
- Prueba nueva (la mascota espera sentada fuera de la tarima y vuelve a seguirla al bajar; sentarse arriba en las
  graderías). Capturas regeneradas (las anclas nuevas mueven a dos vecinos). Chromium (dev y web): **83/83**.

## Competencia de aura, etapa A: el Escenario del Aura (01-10-2026)

- Pedido: sólo la etapa A del plan de la competencia (ver `PLAN.md`, "Competencia de aura"), en la **Calle Mora frente
  a la Plaza de Juegos**, fácil de cambiar de lugar más adelante, y que quien lee el cartel dé pistas de dónde es.
- `world/places/escenario_aura.js`: todo se arma desde `ESCENARIO = { x, z, giro }` (hoy 60,5; 58; mirando a −z, la
  calle). La manzana sale sola (`manzana(x, z)`, nuevo en `world/layout.js`), y con ella el nombre del lugar y la casa
  que se quita. Tarima redonda (r 5,2, 0,5 m de alto, con focos chicos en el borde y un escalón), pantalla gigante con el
  cartel al medio y dos medidores de aura (segmentos arcoíris que suben y bajan), cuatro focos en postes con su haz
  barriendo la tarima (conos transparentes con `lookAt`), mesa del jurado con tres sillas, graderías de tres filas, arco
  de entrada con letrero, piso propio. Zona "😎 Competir" en la tarima: por ahora avisa "¡Muy pronto!".
  - Jurado (3) y público (5) sentados (`game/aura.js`, looks sorteados con semilla y cargados con los de los vecinos);
    sólo se animan si se ven.
  - **Pisos**: `addPiso` / `sueloEn` en `world/physics.js` (círculos o rectángulos más altos que el suelo); la jugadora
    camina y cae sobre ellos (`player.js`). Las mascotas todavía no (quedan a nivel del suelo).
- **Pistas**: el cartel tiene ahora dos botones, "👀 Mirar el cartel" y "💬 Preguntar dónde es". Quien lo lee se da
  vuelta, saluda y dice una pista en su globo (y completa en el aviso), una distinta cada vez: la calle, el lugar de
  enfrente, hacia dónde queda mirando el cartel y a cuántos metros, y "busca los focos". Las arma `pistasEscenario()`
  (`game/aura.js`) desde la posición del escenario: la calle más cercana, el lugar que queda al otro lado de esa calle
  (con `articulo`, nuevo en `definePlace`) y el ángulo desde el espectador. Después vuelve a leer el cartel.
- `city.js`: el anillo de árboles de las afueras ya no planta dentro de una manzana ocupada (había uno pegado a la
  pantalla); sortea igual el tamaño y el tipo para que los demás árboles no se muevan.
- Ganchos de prueba: `window.__juego.cam` (para fotos desde un ángulo dado).
- Pruebas nuevas: el escenario (nombre, subirse a la tarima, "Competir") y las pistas (las cuatro y vuelta a empezar).
  Capturas regeneradas. Chromium (dev y web): **81/81**.

## Tobogán y columpio de pie o sentada; modelos con huella (01-10-2026)

- El usuario veía a Nina **de pie** en el columpio y tirándose del tobogán: su navegador seguía con un
  `nina_base.glb` viejo (sin las animaciones nuevas; `avatarDo` no hace nada si la animación no existe, y queda en
  reposo). Los modelos se piden siempre con el mismo nombre. Arreglo: **huella de cada modelo** (md5, 10 letras)
  calculada por `vite.config.js` (módulo `virtual:huellas-modelos`; en desarrollo se recalcula al cambiar un .glb) y
  el cargador pide `modelo.glb?v=<huella>`. Primero se probó `fetch(url, { cache: 'no-cache' })`, pero el orden en que
  llegaban los modelos variaba y las capturas dejaban de salir iguales entre corridas (90 píxeles en un parpadeo).
- Pedido: poder elegir **sentada o de pie** en los dos. Una zona puede traer `opciones: [{ id, label }, …]`: el HUD
  muestra un botón por opción (`#btnAction2`, celeste, a la izquierda del de siempre) y `runZone(z, opcion)` se la pasa
  a la acción. Tobogán: "🎢 Tirarse por el tobogán" / "🏄 Tirarse de pie"; columpio: "🙌 Columpiarse" /
  "🧍 Columpiarse de pie" (sin "sentada/sentado": hay personajes de los dos).
  - `tobogan_de_pie` (1,6 s, bucle): como surfeando, rodillas dobladas, pies paralelos a la rampa, brazos abiertos
    balanceándose. Anclas nuevas `pieArriba`/`pieAbajo` sobre la superficie de la rampa, sin inclinar.
  - `columpio_de_pie` (1 s, la elige el impulso como la sentada): 0 agachada con la cadera atrás, 1 parada empujando
    la cadera adelante; las manos fijas en las cuerdas. Parada sobre el asiento (`pararEn`: 5 cm bajo el ancla).
- Prueba nueva (las dos de pie, y que el segundo botón no aparece donde no hay opciones). Capturas regeneradas (las
  anclas nuevas mueven a un vecino). Chromium (dev y web): **77/77**.

## Tobogán con escalera y columpio con física (30-09-2026)

- Pedido: que suba por la escalera del tobogán, se siente y se tire con los brazos arriba; y que el columpio responda
  con física a la palanca vertical (impulsarse, ir más alto o frenar), agarrada de las cuerdas y moviendo las piernas.
- **Animaciones nuevas** (`tools/animaciones/juegos.mjs`, horneadas con los bailes por `separar_glb.mjs`; 24 en total):
  - `subir_escalera` (0,8 s, bucle): en cada ciclo el cuerpo sube un peldaño; mano derecha con pie izquierdo y la otra
    pareja medio ciclo y medio peldaño después, así los dos pies pisan peldaños de verdad (agarrado, el pie queda
    quieto en el mundo; en la animación baja porque el juego sube a la jugadora). Primero las manos iban a los postes
    a 0,6 m del centro y quedaban como "manos arriba" sin alcanzar (el brazo mide 0,34 hasta la muñeca): la escalera
    ahora tiene pasamanos propios a 0,38 m, que siguen hasta 3,9 m (las manos van por encima de la cabeza hasta arriba),
    y peldaños de 0,76 m de ancho.
  - `tobogan` (1,2 s, bucle): sentada como "sit", piernas estiradas, brazos arriba en V moviéndose.
  - `columpio` (1 s, no se reproduce): 0 = piernas recogidas bajo el asiento y el cuerpo adelante, 1 = piernas
    estiradas y el cuerpo atrás; las manos fijas en las cuerdas (a los lados, a la altura del pecho: más arriba
    quedaban junto a la cara, por lo grande de la cabeza), así al echarse atrás los brazos se estiran.
- **Tobogán** (`game/juegos.js`): ancla nueva `escalera` (al pie, 0,14 m antes de los peldaños). Trepa 4 ciclos
  (3,2 s) subiendo 0,45 m por ciclo (el primer pie justo sobre el primer peldaño: las medidas de la animación están
  repetidas en `ESCALERA`), pasa en 0,7 s a sentarse arriba de la rampa con un saltito, espera 0,35 s y baja.
- **Columpio**: el péndulo lo simula el parque (`columpio()` en `places/park.js`: largo 2,2 m, 4 pasos por cuadro,
  roce 0,07 con alguien y 0,25 vacío). `userData.impulso` (−1…1, la palanca vertical: arriba = adelante) suma una
  aceleración de 0,38 rad/s²: a favor del movimiento da energía (hasta ~65°, después no suma más), en contra frena.
  La pose sigue al impulso (adelante estira las piernas, atrás las recoge). Moverse ya no la baja (`seat.fijo`): se
  baja saltando (`seat.saltar`, nuevo en `player.js`: sale con la velocidad del asiento, y en el aire casi no frena,
  `player.lanzada`) o con la palanca hacia el lado. Aviso al sentarse. El obstáculo del columpio ahora son sólo los
  postes (el de antes tapaba el paso y frenaba el salto).
  - `player.js` le pasa la palanca a `seat.mover(dt, jx, jy)`.
- Cámaras: el tobogán desde atrás de la escalera, el columpio de costado (del lado sin árboles).
- Pruebas: columpio (empujando a tiempo el vaivén crece; moverse no la baja; al saltar sale volando) y tobogán (trepa,
  arriba pasa a "tobogan", termina parada abajo). Capturas regeneradas (escalera nueva, columpios con física).
  Chromium (dev y web): **75/75**.

## Juegos que se usan (después de la etapa 8)

- Pedido: poder usar los juegos de la Plaza de Juegos, y también el columpio y el tobogán (los del Parque Central).
  **`game/juegos.js`**: el lugar pone una zona `{ id: 'juego', juego }` y el juego trae "anclas" (`ancla()` de
  `world/place.js`: un `Object3D` vacío colgado de la parte que se mueve; marca dónde van las caderas y su +z hacia
  dónde mira). Tres tipos:
  - `asiento` (carrusel, sube y baja, columpios): se sienta en el ancla más cercana con la pose final de "sit"
    (caderas 0,158·k arriba y 0,10·k atrás de la raíz) y la sigue en posición y giro completo (se inclina con el
    columpio y el sube y baja).
  - `cama` (cama elástica): bota en el centro (0,9 s por bote, 1,2 m), con la animación "jump" en cada bote.
  - `tobogan`: espera 0,45 s arriba de la rampa y baja en 1,25 s acelerando; al llegar abajo queda parada en
    `salida`, contenta. No se interrumpe al moverse (`seat.fijo`).
  - Bajarse: moverse (`player.js` ahora para cualquier asiento que no sea `fijo`). Al bajarse queda junto al
    juego (`collide` la saca de su obstáculo). `standUp()` llama `seat.salir()`; `seat.mover(dt)` la pone en su lugar
    cada cuadro, y `player.pos` sigue al juego (cámara y mascotas).
  - `juego.ocupado` (el ancla en uso, o `true`): el columpio ocupado se mueve más alto, el sube y baja un poco más, y
    la pelota de la cama elástica se esconde. `juego.vista`: giro de la cámara al subirse (el tobogán, para que no lo
    tape un árbol).
- Carrusel: caballitos 1,35 veces más grandes y más abajo; se va de lado, mirando hacia afuera (de frente las piernas
  atravesaban la cabeza del caballito). La cámara ya no se acerca cuando la jugadora está dentro de un obstáculo alto
  (`cameraBlock` ignora el obstáculo que contiene el punto que mira; los autos tienen h = 0, no cambia al manejar).
- Pruebas nuevas: carrusel (gira con ella, se baja al moverse), cama elástica + sube y baja + columpio, tobogán (baja
  sola y queda parada abajo). Las anclas nuevas usan `Math.random` (UUID) y mueven a un vecino: capturas regeneradas.
  Chromium (dev y web): **73/73**.

## Etapa 8 — Lugares y actividades como módulos (30-09-2026, terminada)

- **Lugar nuevo: Plaza de Juegos** (`world/places/plaza.js`, pedido: plaza de juegos en una manzana de afuera). Es
  la prueba de la etapa: un solo archivo, sin tocar `city.js` ni `game/`. En la manzana frente al Refugio, cruzando
  la Avenida Menta (`area` 45,5…76 × 5,5…34,5; antes había una casa). Arco de entrada con el letrero mirando a la
  avenida, piso de goma lila, carrusel girando con seis caballitos de colores que suben y bajan, cama elástica con una
  pelota que rebota, sube y baja, arenero con castillo, balde y pala, dos bancas (la del parque, ahora exportada de
  `park.js`, con su zona "🪑 Sentarse") y árboles y flores en las esquinas.
  - `city.js`: la manzana de afuera que ocupa un lugar (su `area` está fuera del centro) no lleva casa ni árboles
    sueltos (`ocupada`). Reemplaza lo que estaba escrito a mano para Autos Arcoíris; sin la plaza, las capturas con
    `UUID_APARTE` salieron iguales.
  - Colores: con la luz del juego, los colores muy claros (`#E6DAFF`) se ven blancos al sol; el piso quedó `#9C86D9`.
  - Prueba nueva: nombre "Plaza de Juegos" y sentarse en una de sus bancas. Capturas regeneradas (la plaza no sale en
    ellas, pero cambian los números al azar). Chromium (dev y web): **67/67**.

- **Lugares con `definePlace`** (`world/place.js`): cada archivo de `world/places/` se registra con
  `definePlace({ id, nombre, orden, area, build(ctx) })`; `city.js` los encuentra solo
  (`import.meta.glob('./places/*.js', { eager: true })`) y `buildPlaces()` los arma por `orden` y registra su área
  (`addArea(nombre, ...area)`). `ctx` = `{ world, scene, addObs, addObsRot, addZone, onFrame }` (`onFrame` =
  `animated.push`). Agregar un lugar = agregar un archivo, sin tocar `city.js`.
  - Pasados: Boutique (10), cartel (20, sin área: está en la manzana de la Boutique), Refugio (30), Heladería (40),
    Parque (50), **Mi Casa** (60, nuevo archivo `places/casa.js`: antes vivía suelto en `city.js`) y Autos Arcoíris
    (70). La posición de cada lugar pasó de argumento a constante dentro de su archivo. El parque pasa `ctx` a la
    pileta y las bancas. `city.js` quedó con el suelo, las casas de afuera, los árboles y los autos estacionados.
  - `orden` conserva el orden de antes: cambiarlo mueve los obstáculos, el orden de dibujo y los números al azar
    (las gotas de la pileta usan `Math.random`). Un lugar sin `orden` se arma al final.
  - Lo que otros módulos usan de un lugar se sigue exportando de su archivo (`CARTEL`, `cartelListo`, `TT`,
    `SPAWNS`, `ttGroup`). `main.js` sigue importando los lugares en el orden original (orden de arranque).
  - Con `UUID_APARTE`: las 8 capturas iguales antes y después. Chromium (dev y web): **65/65**.

## 30-09-2026 y antes

- El proyecto se movió de OneDrive a `C:\proyectos\mi-ciudad`. La copia de OneDrive queda sólo como respaldo;
  no se trabaja ahí.
- Decidido: publicación en **GitHub Pages** (punto 4 de la sección 8).
- Se usa **GitHub Desktop**, que trae Git incluido. Siguiente paso: conectar esta carpeta
  (Add local repository → create a repository, Git ignore: Node, sin README) y hacer el primer commit
  "Estado inicial antes de reestructurar". Los commits de cada etapa se hacen desde GitHub Desktop.
- Repositorio conectado: `github.com/Ykharo/mi-ciudad2` (público), commit inicial subido.
  Git no está en el PATH; Claude usa el Git que trae GitHub Desktop sólo para consultar.
- **Decisiones pendientes aceptadas según las recomendaciones del plan** (ver sección 8): r149, Vite,
  Three.js dentro del juego, migrar el guardado v1 → v2, un .glb por prenda, Vestidor en la Boutique,
  nombres de código como hoy, Playwright con Chromium y WebKit, publicar en Pages desde este repositorio
  con GitHub Actions, y borrar los archivos viejos cuando la etapa 1 esté verificada.
  La 11 (Python) se deja para la etapa 6. La prueba en el iPad real queda para más adelante (decisión 10).
- Hay una carpeta `mi-ciudad/` dentro del proyecto con un repositorio vacío (sólo `.gitattributes`,
  remoto `Ykharo/mi-ciudad`): parece un intento anterior de GitHub Desktop. No se versiona; se puede borrar.
- **Etapa 6: prendas nuevas listas**, probadas en el navegador y guardadas en el commit `9cdc8f6`
  ("segunda ropa hecha 6 done"). Después se agregaron los accesorios rígidos (con commit) y las regiones de
  `Body_Base` (sin commit todavía): ver los últimos puntos de esta etapa. Prendas de la hoja de referencia
  (`referencias/ropa/hoja_de_referencia_nina.png`): **falda tableada**, **chaqueta** y **pelo largo**.
  - Decisión 11: en vez de Python/Blender, un generador en Node: `node tools/generar_prendas.mjs [id…]`. Cada prenda
    es un archivo en `tools/prendas/` (`falda.mjs`, `chaqueta.mjs`, `pelo_largo.mjs`) que mide el cuerpo de Nina con
    rayos (three.js en Node) y arma la malla; `cuerpo.mjs` tiene las utilidades (rayos, pesos copiados del cuerpo,
    grillas, grosor) y `escribir.mjs` escribe el .glb con el esqueleto del original, lo valida (pesos que suman 1,
    los 17 huesos, materiales declarados en el catálogo, tope 450 KB) y lo cuantiza. Reemplaza al
    `validar_prenda.mjs` que proponía el plan.
  - Falda: 24 tablas, cuadrillé (textura gris 64×64 que se tiñe con el color elegido), pretina; pesos cadera→muslos
    para que camine y se siente sin estirarse. 121 KB. Chaqueta: abierta adelante, mangas que siguen el brazo, borde,
    puños y cuello en otro color ("Color de los bordes"). Nuevo espacio opcional `abrigo`. 182 KB. Pelo largo:
    casquete con raya al medio, cortina ondulada por la espalda y mechones que enmarcan la cara y caen sobre el pecho;
    tapa las orejas, hace sombra, mismos tonos y reglas de color que el moño. 163 KB.
  - Error encontrado al hacer la chaqueta: el grosor (`cascara`) va hacia adentro según hacia dónde miran las caras,
    y en la chaqueta miraban hacia adentro (el forro quedaba por fuera). Ahora `orientar()` las da vuelta si hace falta.
  - Vestidor: pestaña **Chaqueta** con "Sin chaqueta" (los espacios opcionales tienen la opción de quedar vacíos).
    Con 6 pestañas, van en dos filas si no caben. Prueba nueva (pelo largo + chaqueta + falda, sacarse la chaqueta,
    se guarda). Captura del Vestidor regenerada (cambian las pestañas). 120/120.
  - Revisadas en el probador (`?con=pelo:pelo_largo,abrigo:chaqueta,piernas:falda_tableada`) en 12 poses. Con los
    brazos arriba (wave) el brazo puede cruzar el mechón de adelante; es aceptable por ahora.
  - **Accesorios rígidos hechos (30-09-2026)**, probados en el navegador y en un commit, de la hoja del personaje
    nuevo (`referencias/ropa/hoja_personaje_nuevo.png`): **gorra** (visera hacia atrás, 6 paños, estrella), **lentes**
    (redondos, no están en la hoja), **audífonos** (al cuello) y **mochila** (bolsillo con mariposa, correas). 22–65 KB c/u.
    - Decidido: el personaje nuevo usará el cuerpo de Nina, más bajita (escala ~0,85, cabeza algo más grande); en el
      Vestidor los accesorios van en **una pestaña con varios a la vez**; se empezó por los accesorios.
    - En vez de `attachToBone` (3.5), cada accesorio es una prenda skinneada con todos los pesos en un hueso (HeadBone
      para gorra y lentes, Chest para audífonos y mochila): es rígido igual, y usa todo lo que ya existía (catálogo,
      colores, extras, guardado, generador y validador). La gorra sigue el tamaño de la cabeza (`cabeza` del look).
    - Espacios nuevos, todos opcionales: `cabeza`, `cara`, `cuello`, `espalda` (`SLOTS_ACCESORIOS`). Dos accesorios del
      mismo espacio se reemplazan solos. Pestaña **Accesorios**: se prenden y apagan tocándolos; debajo, colores y
      extras de cada uno puesto ("Gorra: Color de la visera", "Mochila: Mariposa"…).
    - Nuevo en el catálogo: `oculta: [nombre de malla]` esconde partes de otras prendas mientras está puesta
      (`applyOcultas`; se esconde el objeto del personaje, no el material compartido). La gorra esconde
      `Pelo_Moño_Tope`: `separar_glb.mjs` ahora aparta el moño, sus lazadas, el coletero y su mechón en esa malla
      (piezas conectadas cuyo centro queda a < 0,11 m del moño; ojo: con 0,12 entraba el casquete). Sólo cambió
      `mono.glb` (155 → 162 KB); el resto salió idéntico byte a byte.
    - La copa de la gorra se ajusta con rayos a la cabeza, las orejas, el moño (sin tope) y el pelo largo: el pelo sale
      por debajo. Si se agrega un peinado, hay que regenerar la gorra.
    - Encontrado: la luz del juego aclara tanto lo que mira hacia arriba que un rosado pálido se ve blanco (hasta un gris
      `#999` se veía blanco en la copa). La estrella usa un rosado intenso.
    - `cuerpo.mjs`: `tubo`, `revolucion`, `caja` (sólidos cerrados), `orientarCaras`, `mallaRayos`, `piezasCerca`.
      Probador: `&dist=1.5&mira=1.8` para ver de cerca.
    - Revisados en el probador con moño y con pelo largo + chaqueta, de frente, de lado y de atrás, y en 8 poses. En
      `lie` y `candle` la mochila toca el suelo (acostada de espalda), aceptable. Los mechones de adelante del pelo
      largo tapan en parte los audífonos.
    - Prueba nueva (los 4 a la vez, la gorra esconde el moño y al sacarla vuelve, colores y extras, guardado y
      recarga). `UUID_APARTE`: capturas 1–7 idénticas antes y después; la 8 sólo cambia en la fila de pestañas.
      Capturas regeneradas (los objetos nuevos del moño mueven a los vecinos, y está la pestaña nueva). Chromium (dev,
      web, archivo único): **77/77**. Archivo único: 3.615 KB.
    - **WebKit no arranca en este PC** (30-09-2026): el `Playwright.exe` de WebKit termina al lanzarse con código
      `0xC0E90002` (Windows lo bloquea), incluso en la prueba de humo y fuera del entorno aislado. El 28-09 corría.
      Probablemente sea el Control inteligente de aplicaciones o el antivirus; revisar la seguridad de Windows o
      reinstalar con `npx playwright install webkit`. Hasta entonces las pruebas de iPad (proyectos `-ipad`) no corren.
  - **Regiones de `Body_Base` hechas (30-09-2026, probadas y con commit): con esto la etapa 6 queda
    completa.** `separar_glb.mjs` tiene ahora una tabla `APARTAR` (partes que pasan a su propia malla, en orden) y
    parte el cuerpo por el hueso que más pesa en cada vértice (un triángulo va a la región si sus 3 vértices son de
    ella): `Body_Pies` (1.028 triángulos; llegan a 0,183 m, la zapatilla a 0,184), `Body_Piernas` (1.816: cadera,
    muslos, canillas y tobillos; la cadera llega a 0,837 m, la cintura del pantalón a 0,856) y `Body_Brazos` (873:
    brazo y antebrazo, sin las manos). `Body_Base` queda con el torso, el cuello y las manos. El torso no se separó:
    ninguna prenda lo tapa entero (el peto es corto, la chaqueta es abierta). `nina_base.glb` 942 → 953 KB.
    - Qué esconde cada prenda (`oculta`): pantalón → piernas, zapatillas → pies, chaqueta → brazos, pelo largo → orejas,
      gorra → tope del moño. La falda no esconde nada (deja ver las piernas).
    - Problema resuelto: en r149 lo escondido con `visible = false` tampoco hace sombra (y las capas de la cámara no
      sirven: la pasada de sombras usa las de la cámara principal). Una parte del cuerpo escondida recibe el material
      `FANTASMA` (`colorWrite` y `depthWrite` apagados): no pinta nada pero sigue haciendo su sombra, así la ropa pegada
      sigue sin hacer sombra (el pantalón tiene 19 mil vértices). Las partes de prendas (tope del moño, orejas) sí se
      esconden del todo. Todo pasa en `applyLook` (se llama también al quitar una prenda).
    - Con `UUID_APARTE`, capturas con y sin esconder: idénticas (el dibujo y las sombras no cambian). Capturas de
      referencia regeneradas (hay más objetos: los vecinos se mueven). Revisado en el probador en 8 poses, de fábrica
      y con pelo largo + chaqueta + falda: sin hoyos en tobillos ni mangas.
    - La prueba de cambiar prendas revisa además qué se ve de cada parte del cuerpo (se ve / escondida / fantasma).
      Chromium (dev, web, archivo único): **77/77**. WebKit sigue sin arrancar (las 48 de iPad fallan al lanzar el
      navegador, código `0xC0E90002`).
  - Los moños (lazos) del pelo de la referencia quedan para más adelante.
- **Etapa 7 en curso (30-09-2026; todo lo de abajo, hasta el cartel de la competencia, probado por el usuario y con
  commit): dos personajes nuevos.** Con el cuerpo de
  Nina y compartiendo la ropa: la niña de `referencias/ropa/hoja_personaje_nuevo.png` (1,40 m) y el niño de
  `referencias/ropa/hoja_personaje_nino.png` (1,35 m; la cabeza "no tan plana, más redondeada" de perfil y los
  audífonos grandes puestos sobre el jockey). Decidido: se empezó por la cabeza y los audífonos; la forma de cabeza es
  del personaje, no se elige en el Vestidor.
  - **Forma de cabeza `redonda`** (morph target). En el look: `formas: { redonda: 0..1 }` (lista en
    `FORMAS_CABEZA`, `catalog/personajes.js`; `fixLook` descarta las que no existen). La cabeza de Nina es ancha pero
    corta de adelante hacia atrás (0,35 × 0,27 m) y plana atrás. La forma infla la cabeza, en cada dirección desde su
    centro, lo que le falta para llegar a un elipsoide que envuelve la parte de atrás (+3 cm a la altura de las
    orejas, nada desde los 45° hacia arriba, ni en la cara ni en la coronilla). Primer intento (empujar un tanto fijo
    por dirección): dejaba un escalón sobre la nuca.
  - El desplazamiento depende sólo de la dirección desde el centro de la cabeza: la cabeza y todo lo que va encima en
    esa dirección se corren lo mismo. Por eso **toda malla que alcanza a moverse lleva la forma** (cabeza, orejas,
    moño, pelo largo, gorra, jockey, lentes, audífonos grandes): `agregarFormas` en `separar_glb.mjs` y `escribir.mjs`,
    con la normal nueva calculada con la derivada. Así cualquier peinado o gorro sirve para las dos cabezas, sin
    versiones aparte. `applyLook` pone la influencia en cada malla.
  - Tropiezos: (1) las mallas de nodos descartados seguían en el documento, recibían la forma y el prune ya no las
    sacaba (los .glb crecieron al triple): sólo se procesan las mallas que cuelgan de un nodo. (2) quantize copia los
    datos de la forma para cada material y `dedup` no mira las formas: `juntarFormas` los vuelve a juntar.
    Tamaños: base 953 → 975 KB, moño 162 → 236, pelo largo 163 → 236, gorra 65 → 92, lentes 22 → 29.
  - **Jockey** (espacio `cabeza`, 101 KB): la misma copa que la gorra (`construirGorra` en `gorra.mjs`, que ahora
    recibe visera adelante/atrás, figura y materiales) con visera adelante y mariposa al frente; negro. Colores: tela,
    visera, mariposa; la mariposa se puede quitar. Esconde el tope del moño.
  - **Audífonos grandes** (espacio nuevo `orejas`, 43 KB): auriculares sobre las orejas y cintillo ancho sobre la
    cabeza, calzados por fuera de todo lo que puede ir en ella (cabeza, orejas, peinados, gorra y jockey): se pueden
    llevar con cualquier gorro. Sin gorro, el cintillo queda un poco sobre el pelo. Los de antes pasan a llamarse
    "Audífonos al cuello".
  - Figuras para calcomanías en `cuerpo.mjs` (`FIGURAS.estrella/mariposa`, `calcomania`): las usan la gorra, el jockey
    y la mochila. Probador: `&forma=redonda:1`.
  - Revisado en el probador: perfil plano y redondo sin pelo, con moño, con pelo largo + gorra, con jockey +
    audífonos grandes (+ mochila); de frente, de lado y de atrás. El cintillo pasa por delante del moño.
  - Con `UUID_APARTE`: capturas con los modelos del último commit y con los nuevos (regiones + formas en 0),
    idénticas. Capturas de referencia regeneradas. Pruebas nuevas: forma de cabeza guardada (se aplica a cabeza,
    orejas, pelo, jockey y audífonos; una forma desconocida se descarta) y jockey + audífonos grandes en la de
    accesorios. Chromium (dev, web, archivo único): **80/80** (WebKit sigue bloqueado). Archivo único: 4.010 KB
    (3.615 antes de las regiones y las formas).
  - **Personajes jugables** (decidido: jugables; nombres provisorios "Amiga" y "Amigo", se cambian en el catálogo).
    `PERSONAJES` y `ORDEN_PERSONAJES` en `catalog/personajes.js`: Nina, Amiga (escala 0,86, cabeza 1,06) y Amigo
    (0,83, 1,08, `formas.redonda`), cada uno con su look de fábrica.
    - Se elige en la pantalla de inicio ("¿Con quién juegas?", cambia al personaje de fondo al instante) y jugando con
      el botón redondo de arriba (junto a la música; muestra al personaje actual y abre un menú como el de Acción).
      Manejando no: avisa "Bájate del auto para cambiar de personaje".
    - `game/personajes.js`: `cargarPersonajes(saved)` y `cambiarPersonaje(id)` (arma al nuevo en el mismo lugar, le
      pasa el helado, saca al anterior con `removeAvatar`, guarda). `player.personaje` y `player.looks` (el de cada
      uno); `player.look` sigue siendo el del que se usa. Evento nuevo `personaje`.
    - Guardado v2 ampliado sin romper lo anterior: `jugador` y `personajes: { amiga: { look }, amigo: { look } }`; Nina
      sigue en `nina.look`. `fixLook(look, defecto)`: lo que no calza vuelve al look del personaje (no al de Nina) y un
      espacio opcional que el look guardado no tiene queda vacío aunque el personaje venga con algo ahí.
    - El Vestidor viste al que se usa y "Original" lo deja como es él. El menú de Acción dice "¿Qué hace Amigo?".
    - Tropiezo: el servidor de Vite quedó con una versión a medio editar de `save.js` (comentario nuevo, cuerpo
      viejo) y las pruebas fallaban sin sentido: se reinició el servidor.
    - Pruebas nuevas (`tests/personajes.spec.js`, en todos los proyectos): elegir al empezar y jugando, se recuerda
      al recargar, no quedan personajes de más; cada uno guarda su look y "Original" lo respeta; manejando no se cambia.
    - Capturas regeneradas: el botón nuevo arriba (y la fila en la portada); se revisó que sólo cambie esa zona.
  - **Ropa del niño**, todo en `tools/prendas/`:
    - `pelo_corto` (primera versión, 119 KB; después se rehízo con mechones, ver más abajo): casquete con volumen y
      puntas cada 4 columnas; flequillo sobre las cejas, tapa la parte de arriba de las orejas, hasta la nuca. Sumado a `queTapa`: gorra, jockey y audífonos grandes
      regenerados para calzar por fuera de él.
    - `poleron` (230 KB, espacio `abrigo`): `chaqueta.mjs` ahora exporta `cuerpoAbrigo`/`mangaAbrigo` con opciones
      (abierto o cerrado, holgura, largo, franjas, `hombroCaido`); la chaqueta salió idéntica byte a byte. Cerrado,
      holgado, hasta la cadera, dos franjas en las mangas, capucha caída (dos `caja`), cierre y mariposa en el pecho.
      Las mangas holgadas asomaban una punta sobre el hombro: se afina el comienzo de la manga.
    - `buzo` (247 KB, `piernas`): una pieza de cadera hasta la entrepierna y un tubo holgado por pierna que parte
      dentro de ella; pretina, basta recogida sobre la zapatilla, dos franjas al costado, mariposa en el muslo.
      Esconde las piernas. Revisado sentado, en split, acostado, en la vela y saltando.
    - `guantes` (40 KB, espacio nuevo `manos`): funda de la muñeca a los nudillos con puño; el radio se engorda con
      el máximo de los vecinos (con un promedio asomaban el pulgar y los nudillos). Corregido después (reporte del
      usuario: "sólo están hasta la mitad"): llegaban a 5 cm de la muñeca y la mano mide 12; ahora llegan a 8,5 cm (los
      nudillos), cada anillo se centra en el centro real de la mano en ese tramo (los dedos se curvan y una línea recta
      se salía) y las dos últimas filas se ciñen a los dedos. 52 KB.
    - La forma "redonda" ya no alcanza nada bajo la nuca (la capucha del polerón la recibía y pesaba 343 KB).
    - Zapatillas: las de siempre, azul oscuro con detalles blancos.
    - Chromium (dev, web, archivo único): **89/89** (WebKit sigue bloqueado). Archivo único: **4.979 KB** (4.010
      antes de la ropa del niño): cada prenda nueva pesa 40–250 KB y el archivo único las lleva todas en base64.
      Si molesta, se podrían comprimir los modelos (por ejemplo con meshopt, que Three.js r149 sabe leer con su
      decodificador); el archivo único tiene que seguir llevándolo todo, porque abre sin red.
  - **Cabeza redonda corregida** (pedido: comparar con la vista lateral de la hoja; "no tiene forma natural"). En la
    hoja, de perfil la cabeza es casi una esfera y la nuca baja en curva hasta el cuello. La versión anterior dejaba un
    bulto arriba atrás con una muesca abajo, como una bolsa colgando de la nuca. Se ajustó dibujando el contorno de
    perfil y de arriba (antes y después) y fotografiando de costado exacto (cámara alineada al hueso de la cabeza, casi
    sin perspectiva: probador `&fov=6&dist=14`, `window.__probador.orb`):
    - elipsoide objetivo un poco detrás y sobre el centro de la cabeza (centro (0; 0,025; −0,025), semiejes
      0,16 × 0,16 × 0,155), transición más ancha (2,5 cm): la parte de atrás es un solo arco de la coronilla a la nuca
      (profundidad 0,27 → 0,32 m); de arriba, redonda sin ensanchar los costados (con 0,172 de ancho se ensanchaban
      detrás de las orejas; con 0,15 la nuca quedaba en punta). Resguardos: nada adelante ni bajo −62° (la ropa del
      cuello). Las orejas ya no se mueven.
    - La forma sólo se guarda en mallas que se mueven más de 1,5 mm, y "sparse" (sólo los vértices que se mueven)
      cuando mueve menos de un tercio: polerón 343 → 236 KB, lentes 29 → 23, moño 236 → 225.
    - Chromium: 86/89; las 3 que fallaron eran las capturas (las orejas ya no llevan forma: cambia la cantidad de
      objetos y se mueven vecinos; el diff mostró sólo vecinos). Capturas regeneradas; pasan en dev, web y archivo
      único: **89/89**. Archivo único: 4.951 KB.
  - **Comparador de referencias en el probador** (pedido: ver las vistas frontal y lateral de las hojas, superponerlas
    con transparencia y ajustar posición y tamaño). `src/debug/referencias.js` + cambios en `probador.js/html`:
    - Modo "Dos vistas lado a lado": izquierda y derecha elegibles (frente, lado mirando a la derecha o a la izquierda,
      atrás, tres cuartos), mirando derecho, "casi sin perspectiva" (fov 6°). Rueda: acercar; arrastrar: subir o bajar.
      "Pose de reposo" (los huesos como vienen en el modelo, sin animación). "Encuadrar cuerpo/cabeza": el cuerpo o la
      cabeza ocupan el 90 % del alto, igual que los recortes de las hojas, así la referencia queda casi calzada.
    - Referencias: hoja de `referencias/ropa/` (o cualquier imagen), una capa por vista: recorte listo por hoja,
      transparencia, "Diferencia" (lo que coincide queda oscuro), reflejar, mostrar/ocultar, líneas guía; mover
      arrastrando y agrandar con la rueda alrededor del mouse (botón 🖐 o Mayús), flechas de a 1 px (Mayús: 10);
      "Alinear con 4 toques" (dos puntos en la referencia y los mismos en el modelo: escala y posición exactas). El
      ajuste se guarda por hoja y vista en el navegador. Las vistas quedan a la derecha del panel; P lo oculta.
    - Tropiezos: el panel es `position: fixed` y su `offsetParent` siempre es null (las vistas quedaban debajo); la
      mezcla "diferencia" tiene que ir en la caja de la capa, no en la imagen (se mezclaba consigo misma).
    - Primera observación con la hoja del niño: el amigo tiene la cabeza bastante más grande respecto al cuerpo que
      el de la referencia.
  - **Pelo corto rehecho con mechones** (pedido: más desordenado, como la hoja; con más vértices). Antes era un
    casquete con puntas en el borde ("de tazón"). Ahora: casquete oscuro de base + ~60 mechones sueltos, cada uno una
    mecha con volumen (sección de lente, ancha casi todo el largo y en punta al final) que sigue la curva de la cabeza
    y se levanta en la punta, con giro. Capas: coronilla (12), medio (16), abajo (20, puntas bajo el borde sobre las
    orejas y la nuca) y flequillo en dos capas (20, los del centro tapan las cejas y llegan justo sobre los ojos).
    Azar con semilla fija. 7.000 vértices, 357 KB. Tropiezos: el borde del casquete se veía como una franja recta
    sobre la frente (se subió adelante); los mechones se afinaban muy pronto y parecían palitos; donde dos quedaban a
    la misma altura aparecían manchas (z-fighting): cada capa va un poco más afuera que la de abajo, como tejas.
    Gorra, jockey y audífonos grandes regenerados. Comparado con la hoja en el comparador (con y sin jockey).
  - **Bailes de "farmear aura"** (pedido: Pacu Jalur, Six Seven, mirada sigma). En el menú 🎬 Acción: "Farmear aura"
    😎, "Six Seven" 🤲 y "Mirada sigma" 🗿. Sin Python con numpy/mathutils en este PC, así que se llevó a Node lo de
    `reanimar_avatar.py` que hace falta (`tools/animaciones/pose.mjs`: poses, IK de dos huesos para pies y brazos,
    curvas `K`); validado rehaciendo "wave" y comparándola con la guardada: diferencia máxima 0,03°. Los bailes
    (`tools/animaciones/bailes.mjs`) se hornean en `nina_base.glb` desde `separar_glb.mjs` (14 animaciones; 969 →
    1.070 KB): aura (4,4 s, en bucle: una mano sale rodando del pecho y barre hacia el lado, después la otra; las dos
    giran frente al pecho; apunta adelante; cadera, rodillas y cabeza al ritmo), seis_siete (2,4 s, en bucle: manos
    con las palmas arriba subiendo y bajando alternadas, hombros encogidos) y sigma (4,5 s, una vez: mira a un lado,
    gira lento de frente con el mentón arriba, asiente). `AUTO_FACE` acepta caras que cambian con el tiempo
    (`[[segundo, cara], …]`): la sigma se pone seria (ceño de "enojada") y termina con un guiño. Revisados por el
    usuario: ok.
  - **Seis bailes más** (pedido: Take the L, Siuuu, Griddy, Spin, Fresh, Floss), en el mismo archivo y en el menú:
    take_l (2,4 s, bucle: mano en L en la sien por IK del brazo hasta la cabeza, saltitos sobre un pie y la otra
    pierna pateando al lado; con la muñeca más al centro el antebrazo tapaba un ojo), siuu (3,8 s: carrerita, salto
    con media vuelta, cae abierto con los brazos abajo y afuera y la cara de grito, sostiene y completa la vuelta; en
    el juego queda mirando a la cámara), griddy (2,4 s, bucle: taloneos adelante alternados con brazos bombeando),
    spin (1,8 s: vuelta completa en punta de pie con los brazos abiertos, "¡ta-da!" y guiño), fresh (2,4 s, bucle:
    antebrazos cruzando frente a la cintura con golpe de muñeca, cadera al otro lado) y floss (2 s, bucle). Los que
    giran rotan la cadera y los pies con ella. Revisados en el probador cuadro a cuadro (de frente y de lado).
    `nina_base.glb`: 20 animaciones, 1.203 KB. Con `UUID_APARTE`, capturas con y sin bailes idénticas
    (`SIN_BAILES=1 node tools/separar_glb.mjs` arma la base sin ellos); capturas regeneradas. Prueba nueva: cada
    acción del menú tiene su animación, la sigma cambia de cara, un baile en bucle sigue hasta moverse.
    Floss corregido (pedido: una mano por delante y la otra por detrás del cuerpo): los brazos van juntos hacia un
    lado, uno cruzando por delante de la cadera y el otro detrás del cuerpo, y al volver pasan por el costado de la
    cadera cambiando de adelante a atrás (antes el de atrás sólo se abría al costado y parecían los dos adelante).
    El menú Acción tiene ahora 18 opciones (dos columnas de 9 filas, cabe en 720 px de alto): si molesta, se podría
    separar en "Acciones" y "Bailes". Chromium: 89 + 3 que fallaron porque la prueba de humo contaba 9 opciones en
    el menú (actualizada a 18: pasa en dev, web y archivo único) → **92/92**.
  - **Cartel de la competencia de farmear aura** (pedido: cartel publicitario con la imagen y un personaje mirándolo).
    `world/places/cartel.js`: letrero de 3,8 × 5,7 m sobre dos patas, con marco, bordes morados y corona dorada, en la
    esquina de la Boutique (8,6; −10,2) mirando hacia la calle: se ve apenas empieza el juego. La imagen
    (`src/assets/imagenes/cartel_aura.jpg`, 768 × 1152, 196 KB; el original en `referencias/carteles/`) se importa
    desde el código: en la versión web es un archivo aparte y en la de un solo archivo queda incrustada. Material sin
    sombreado (se ve con sus colores). `main.js` espera que cargue antes de "¡A jugar!" (así las capturas la ven).
    - Animación nueva `mirar_cartel` (8 s, bucle; en `bailes.mjs`, no está en el menú): levanta la vista al título y
      lo recorre de lado a lado, baja al medio y lo recorre, lee la franja de abajo por partes con pausitas, mano al
      mentón, asiente y vuelve arriba. Cara: sorpresa con el título, feliz al final.
    - `game/cartel.js`: un espectador frente al cartel leyéndolo en bucle: la amiga, o el amigo si la jugadora es la
      amiga (cambia al cambiar de personaje). Zona "👀 Mirar el cartel": la jugadora se da vuelta hacia el cartel, lo
      lee (hasta moverse) y sale el aviso "¡Competencia de farmear aura! Sábado 24 de mayo, 16:00 hrs".
    - Prueba nueva en `lugares.spec.js`. Capturas regeneradas (el cartel se ve en varias). `window.__juego.espectador()`.
  - **Ropa de la amiga + poleras, gorro y polerón** (pedido: la ropa de la hoja de la amiga, polera de manga corta y
    larga, y el gorro de lana y el polerón de `referencias/ropa/hoja_ropa_gorro_poleron.png`). Nueve prendas nuevas:
    `top_corto` (torso: blanco con tirantes, banda gris y estrella que se puede sacar), `chaqueta_oversize` (abrigo:
    negra, abierta, hombros caídos, mariposas y estrellas rosadas en el frente, la espalda y las mangas: canal
    "dibujos" y extra "Dibujos"), `pantalon_ancho` (piernas: cargo lila muy ancho hasta el zapato, bolsillos con tapa y
    cadena de 24 eslabones en la cadera: extra "Cadena"), `zapatillas_plataforma` (pies: blancas, suela alta de dos
    capas con la de abajo lila, borde del tobillo y talón lila, cordones), `polera_corta` y `polera_larga` (torso,
    pegadas para caber bajo los abrigos; la larga esconde los brazos), `poleron_oversize` (abrigo: amarillo, cuello
    redondo, muy holgado) y `gorro_lana` (cabeza: canales tejidos, doblez, un poco holgado atrás, etiqueta). El
    polerón con capucha pasa a llamarse "Polerón con capucha". La amiga ya usa su ropa propia.
    - Reutilización: `mangaAbrigo` acepta `hasta` (manga corta) y `puño`, y devuelve su `camino`; `buzo.mjs` exporta
      `cadera`/`pierna` con opciones (el buzo salió idéntico byte a byte; también la chaqueta y el polerón tras el
      primer cambio). `calcomaniaSobre` (cuerpo.mjs) pega una figura sobre cualquier superficie apuntando desde afuera;
      `superficieDe` (chaqueta.mjs) hace la malla de rayos de una prenda.
    - Corregido mirando fotos: el lila del pantalón se veía blanco (más saturado); la cadena casi no se veía (más larga,
      apoyada en la cadera y el muslo); los cordones quedaban hundidos; en los hombros de los abrigos con `hombroCaido`
      asomaban la polera y el peto (ahora nunca más adentro que el cuerpo + 3 cm; el polerón con capucha y la chaqueta
      oversize también cambian un poco); la manga corta asomaba por el hombro de los abrigos y, al afinarla, dejaba ver
      piel (las poleras van más pegadas: 0,9 cm el cuerpo, 0,3–0,5 cm las mangas); el gorro de lana terminaba en punta y
      se abría como campana (domo redondo; el pelo largo cuenta sólo hasta 5 cm sobre la cabeza y sus mechones salen
      bajo el doblez). Los audífonos grandes se calzan también por fuera del gorro de lana.
    - Prueba nueva: cada prenda nueva se pone desde el Vestidor, la cadena se saca, y queda guardado. Capturas
      regeneradas (la amiga del cartel cambió de ropa). Chromium: **98/98**. Archivo único: **7.821 KB** (crece con
      cada prenda: ya conviene pensar en comprimir los modelos, por ejemplo con meshopt).
  - **Lentes de sol, tres modelos** (`tools/prendas/lentes_sol.mjs`, espacio `cara`, 34–41 KB): aviador (gota, marco
    dorado fino, doble puente; la primera gota salió redonda y se rehízo más honda abajo y hacia la nariz), clásicos
    (marco negro grueso, más ancho arriba, con ceja) y corazón (rosados). Cada uno: el contorno de la lente como
    función, el marco siguiéndolo, la lente teñida (una calcomanía con esa forma, pegada a la curva de la cara), puente
    y patillas como los lentes redondos. Canales: marco y "Color de los lentes" (paletas nuevas `lentes` y `metal`).
    La prueba de prendas nuevas los pone uno tras otro y cambia el color de los lentes.
  - **Vecinos con la ropa nueva** (etapa 7). Antes había una sola plantilla (la ropa original de Nina, sólo cambiaban
    los colores). Ahora `VECINOS` son estilos (`catalog/personajes.js`): "clásico" (moño, pelo largo o corto; peto o
    poleras; pantalón cargo o falda; a veces chaqueta, lentes, gorra) y "urbano" (poleras o top; buzo, pantalón ancho o
    cargo; zapatillas o plataformas; casi siempre polerón o chaqueta oversize; a veces gorro, audífonos, lentes de sol,
    mochila, guantes; más seguido la cabeza redonda). Formato: `prendas` (una de cada lista), `opcionales`
    ([{ prob, ids }], el espacio sale del catálogo), `colorProb` (cada canal con color al azar de su paleta o el de
    fábrica; el pelo siempre), extras al 70 %, `escala`, `cabeza`, `formaRedonda`. `randomLook` lo aplica.
    - Los looks de los 7 vecinos se sortean antes de cargar (`lookVecinos` en `game/npcs.js`, semilla 4321) y
      `loadCharacters` carga sólo las prendas que usan (antes cargaba las de las plantillas); `spawnNPCs(looks)`.
    - Probador: "Vecino al azar" (prendas y colores; antes sólo colores) y `?look=azar&seed=N` con la semilla
      mezclada: el generador del juego (LCG) da primeros números casi iguales con semillas seguidas, y los 8 primeros
      salían iguales de estilo.
    - Revisados 16 vecinos al azar y las combinaciones nuevas (mochila sobre los abrigos holgados, audífonos al cuello
      con polerones): sin choques. Con los abrigos holgados, las correas de la mochila quedan en parte por dentro.
    - Capturas regeneradas (los vecinos cambiaron).
  - **Se quitó la versión de un solo archivo** (decisión del usuario, 30-09-2026: no la usa y quiere seguir
    agregando contenido; llevaba todo en base64 y ya pesaba 8 MB). Queda sólo la web (GitHub Pages): cada prenda se
    descarga cuando alguien la usa. Fuera: `vite-plugin-singlefile`, `tools/vite-embed-assets.js`, el modo `unico`
    de Vite, el proyecto `unico` de las pruebas y la lectura de bloques `<script id="asset:…">` en el cargador.
    `npm run build` = `build:web`. La prueba "arranca sin red" pasó a la versión web (el juego no depende de nada de
    internet salvo las fuentes); la de "abrir con doble clic" se borró. Las secciones 4.2 y las decisiones de abajo
    que hablan del archivo único quedan como historia. Chromium (dev y web): **65/65**, en 3,8 min (antes 98 en 6 min,
    con el archivo único).
  - **Peinados nuevos** (pedido: los de las hojas). Cinco:
    - `pelo_lacio` (lacio largo): `pelo_largo.mjs` ahora exporta `construirLargo` con opciones (onda, puntas, largo
      atrás y adelante, bulto, mechas) y `casquete` con prefijo de materiales; el lacio es liso, más largo y con las
      puntas parejas.
    - Mechas: el pelo largo tiene un canal nuevo "Color de las mechas" (`PeloLargo_Mechas`, un mechón entero de cada
      tres y una columna del casquete), que si no se elige toma el color del pelo (`siFalta` con `sombra` 1): el pelo
      largo de siempre no cambia. La amiga lleva sus ondas castaño claro con mechas rosadas, como en su hoja.
    - `trenzas`: el casquete del pelo largo y dos trenzas de "eslabones" redondeados inclinados a un lado y al otro,
      que nacen detrás de las orejas y caen por delante de los hombros (por fuera del cuerpo a 4 cm), con gomita
      (canal "Color de las gomitas") y punta suelta. La primera versión, delgada, parecía un collar de cuentas.
    - `pelo_largo_desordenado` (el "cabello largo" del amigo): `pelo_corto.mjs` exporta `construirMechones` con el
      borde y una capa más de mechones largos (el pelo corto salió idéntico byte a byte); tapa las orejas y llega a la
      mandíbula y la nuca; las puntas casi no se levantan (si no, se abrían como tablas).
    - `pelo_rizado`: casquete + unos 170 rulos redondos (espiral de Fibonacci, 11 lados; aplastados y de 8 lados
      parecían discos de panal). Los rulos de arriba van en `Pelo_Rizado_Tope`, que los tres gorros esconden: así el
      volumen no agranda los gorros y bajo un gorro asoman los del borde. 644 KB: el tope por prenda subió de 450 a
      650 KB (ya no hay archivo único; cada prenda se descarga sólo si alguien la usa).
    - Gorra, jockey, gorro de lana y audífonos grandes regenerados para calzar por fuera de los peinados nuevos (el
      de lana limita todos los peinados a 5 cm sobre la cabeza). En los vecinos: clásico con lacio, trenzas y rizado;
      urbano con largo desordenado, lacio y rizado; las mechas salen al 25 % (los canales con `siFalta`).
    - La prueba de prendas nuevas pasa por los cuatro peinados. Capturas regeneradas. Chromium (dev y web): **65/65**.
  - Siguiente: lo que falta de las hojas (jeans baggy, reloj, zapatillas deportivas, clip de estrella, celular,
    botella), y los nombres de la amiga y el amigo.
    Los peinados nuevos: sumarlos a `queTapa` (gorra.mjs) y regenerar gorra, jockey y audífonos grandes.
- **Mejora (después de la etapa 5): joystick con zona lenta y zona rápida.** Pedido: más recorrido para caminar y
  manejar despacio. El joystick pasó de 156 a 200 px (164 en pantallas chicas); mientras la perilla está entera
  adentro del círculo punteado es lento (Nina camina 0,5–1,3 m/s; el auto va a 12–27 % de su máximo y retrocede
  despacio) y en el anillo blanco de afuera es rápido (Nina corre, el auto llega a su máximo). La zona lenta ocupa
  ~60 % del recorrido. Medidas en fracciones del radio (`ui/joystick.js`, el CSS usa las mismas). Además: el volante
  sigue la dirección de la palanca (no cuánto se empuja), soltar un poco la palanca baja la velocidad suave (antes
  cortaba de golpe), y la zona lenta tiene un tono azulado para verse sobre la vereda. El teclado no cambia.
  Prueba nueva: caminar/correr y auto lento/rápido según la zona. 100/100, capturas regeneradas (cambia el joystick).
  - Ajuste pedido para el auto (`acelerador()` en `game/driving.js`): el primer tercio del anillo blanco sigue siendo
    lento; desde ahí la velocidad tope y la aceleración suben parejo hasta el máximo, que se alcanza sólo con la
    perilla en el tope. Nina a pie no cambió (corre desde que entra al anillo). El límite de la zona lenta es un solo
    valor, `INPUT_LENTO` en `game/actors.js`, que usan el joystick y el auto.
  - Ayudas de manejo (pedidas: el auto costaba controlarlo con el joystick a alta velocidad):
    **dirección según la velocidad** (hasta 4 m/s gira igual; después el giro máximo baja hasta 30 % a 16 m/s, y el
    volante se mueve más suave) y **enderezado** (palanca a menos de 15° de la vertical = volante al centro; más
    allá, el giro sube parejo). Antes, a cualquier velocidad sobre 4 m/s el auto giraba hasta 126°/s, y la palanca
    ladeada 10° lo desviaba ~35° en 2 s; ahora sigue derecho. Prueba nueva (se comprobó que falla con lo anterior).
    Descartada por ahora la opción C (mantener la velocidad al acercar la perilla al centro). 105/105.
  - **Palanca fija al manejar** (a prueba; `PALANCA_FIJA` en `ui/joystick.js` la apaga): al soltar la perilla
    manejando, queda fija (anillo amarillo + 🔒) y el auto mantiene dirección y velocidad. Se suelta con doble toque en
    la bola (vuelve al centro y el auto se detiene solo), con el freno (✋ o espacio), llevándola al centro, al bajarse
    o al abrir un panel. A pie no cambia. Aviso "Toca 2 veces la bola para soltar" las 2 primeras veces. Prueba nueva.
  - Mientras se ajusta la conducción, sólo se corren las pruebas de manejo/joystick; la batería completa al terminar.
  - Ajuste de sensibilidad (pedido): curva de respuesta "expo" en el volante (exponente 1,8 despacio → 1,2 rápido),
    giro máximo 70 % despacio → 42 % a 16 m/s (antes 100 % → 30 %), y en el anillo blanco la velocidad sube gradual
    con curva p² (⅓ ≈ 35 %, ⅔ ≈ 59 %, tope 100 %) en vez de quedarse plana el primer tercio y subir de golpe.
  - Palanca fija "como el teclado" (pedido): al soltarla manejando, vuelve al centro en horizontal (suave, 0,18 s: las
    ruedas quedan rectas y el auto sigue derecho) pero mantiene la altura (la velocidad, adelante o atrás). Si se
    soltó casi a la altura del centro, no queda fija. La prueba de la palanca fija cubre el caso en diagonal.
  - Pedido: las ruedas vuelven más lento al centro al soltar el giro (~1 s; perilla 0,4 s). Girar hacia un lado sigue
    rápido. Aplica también al soltar A/D.
  - Pedido: **controles de giro** sobre el anillo blanco (sólo al manejar), a la izquierda y derecha, en el tercio
    central de cada costado: veladura azulada suave + flecha ‹ › blanca; amarilla al apretar. Funcionan como las
    flechas del teclado (`input.giro`): giran sin cambiar la velocidad ni mover la perilla. SVG generado en
    `ui/joystick.js` con radio 1; la zona para tocar es más grande que el dibujo. Prueba nueva.
  - **Error arreglado:** con los controles de giro, la bola fija no se podía volver a mover ni soltar con doble clic.
    La zona invisible para tocar las flechas tenía `pointer-events: all`, y su contorno (ancho por defecto 1 unidad =
    el radio entero) tapaba la bola. Ahora sólo el relleno recibe toques. Las pruebas no lo vieron porque mandaban los
    eventos directo al joystick: las de manejo pasaron a `tests/manejo.spec.js` y usan el mouse real (pasa por todas
    las capas, como un dedo), con la herramienta `joystick()` de `tests/ayudantes.js`.
  - Doble toque más estricto: dos toques cortos (< 0,3 s, casi sin arrastrar) con < 0,4 s entre ellos; agarrar la
    bola apenas se soltó ya no la suelta.
  - Pedidos: el auto un poco más rápido en la zona lenta (18–35 % de su máximo; antes 12–27 %) y los controles de
    giro giran la mitad (volante al 50 %).
  - Velocímetro en km/h dentro del círculo del joystick (sólo al manejar), un poco bajo el centro para que la perilla
    —que sube al acelerar— no lo tape. Se alimenta del evento `motor`.
  - **Conducción cerrada** con la batería completa: 115/115.
  - Encontrado: `index.html` no tiene `<meta name="viewport">`, así que Safari de teléfono y de iPad dibuja la
    página a 980 px de ancho y la achica (todo el HUD se ve más chico en el teléfono, y las reglas CSS para pantallas
    de menos de 560 px nunca se aplican). Es así desde el original; agregarla es un cambio visible — pendiente de decidir.
- **Arreglo (después de la etapa 5): retroceder en diagonal.** Reportado al manejar: con la palanca abajo-izquierda
  o abajo-derecha el auto a veces avanzaba, y parecía girar distinto hacia cada lado. Causa: retroceder exigía
  `|jx| < 0,7`, y a 45° es 0,707 (con teclado, S+A/S+D siempre avanzaba). Ahora cualquier palanca con componente
  hacia abajo > 0,35 frena y retrocede (`game/driving.js`). Prueba nueva en `tests/lugares.spec.js` (teclado a los
  dos lados + joystick a 45°); se comprobó que falla con el código anterior. 95/95.
- **Etapa 5 lista** (falta: probar en el navegador y commit). Siguiente: etapa 6.
  - Zona `boutique` en la alfombra de la entrada (👗 Vestidor), modo `wardrobe`, panel `ui/panels/wardrobe.js`.
    Nina se pone en la alfombra mirando a la calle: la cámara queda al frente con la Boutique de fondo (4,6 m, más
    cerca que en el refugio); arrastrar la gira, como en el refugio.
  - Pestañas Pelo / Arriba / Abajo / Zapatos / Piel. Por prenda: opciones de prenda (hoy una por espacio), un bloque
    de colores por canal con la muestra "↩" (el color con que viene, `factoryColor`) y los extras (mariposa sí/no).
    Todo sale del catálogo: una prenda nueva aparece sola. "Sorpréndeme" (ropa y pelo al azar; la piel no se toca)
    y "Original" (Nina de fábrica). Cada cambio se ve al instante, pone cara feliz y se guarda.
  - Se agregó la pestaña **Piel** (no estaba en el plan; el look ya la tenía).
  - Pruebas nuevas (`tests/vestidor.spec.js`): colores + mariposa + detalles de zapatillas + piel, guardado y
    recarga; Sorpréndeme y Original. Captura nueva 8-vestidor. 90/90.
  - Vertical revisado con WebKit (tamaños de iPad y de teléfono): el panel es hoja inferior y Nina se ve completa
    arriba. Falta el iPad real (pendiente general).
- **Etapa 4 terminada.**
  - Decidido y hecho: el pelo **sí** proyecta sombra. Ahora lo dice el catálogo (`sombra: true` en la prenda) en vez de
    un nombre de malla. Cambio visible a propósito: capturas regeneradas (difieren sólo alrededor de las sombras de
    los personajes).
  - `tools/separar_glb.mjs` (glTF-Transform) genera, desde `herramientas_avatar/avatar_vestido.glb`,
    `assets/modelos/nina_base.glb` y `assets/modelos/prendas/{mono,peto,pantalon_cargo,zapatillas}.glb`. Qué mallas
    van en cada prenda lo dice el catálogo (`mallas`). Tropiezos resueltos: registrar las extensiones (si no, se
    perdía `KHR_texture_transform` del atlas de la cara) y soltar a mano los muestreadores de las animaciones (si no,
    cada prenda llevaba 360 KB de animaciones que no usa).
  - `assets/loader.js`: `loadGLB(id)` con caché (misma decodificación de siempre, con imágenes `data:`); ids
    `nina_base` y `prenda:<id>` (convención: `modelos/prendas/<id>.glb`, no hace falta anotarlas en el manifiesto).
    El plugin del archivo único incrusta la base y todas las prendas.
  - `characters/wardrobe.js`: `attachPrenda` clona las mallas de la prenda (comparte la geometría) y las enlaza a los
    huesos del personaje por nombre; `ponerPrenda` / `quitarPrenda` / `recolorear` para el Vestidor. Los materiales
    compartidos se cambian (nunca se modifican) al recolorear. `makeAvatar(look)` = base + prendas del look, en el
    mismo orden de antes.
  - Verificación con `UUID_APARTE`: base + prendas contra el modelo completo de la etapa 3, idénticas salvo 1 píxel en
    dos capturas (bordes de personajes lejanos: cambia el orden de dibujo de superficies a la misma profundidad).
  - Cuantización (`KHR_mesh_quantization`: posición 14 bits, normales 10, pesos 8, UV 12): modelos 2.095 → 1.437 KB
    (−31 %). Revisada con el probador en 12 poses × 3 vistas (`tools/fotos_poses.mjs`): a la vista no cambia nada ni
    aparecen grietas (sí hay diferencias de pocos niveles de color en miles de píxeles de primer plano). Adoptada.
  - Archivo único: 3.610 → **2.725 KB**. Versión web: base 942 KB + prendas 47–207 KB cada una.
  - `src/debug/probador.html` (sólo desarrollo): animación, pausa en un segundo, prenda por espacio, colores al azar,
    Nina de fábrica; también por la dirección (`?anim=split&t=1.2&vista=lado&look=azar&seed=3&sin=pelo`).
  - Capturas de referencia regeneradas (la cuantización cambia algunos niveles de color en los personajes, y hay más
    objetos de Three.js, así que los vecinos andan por otro lado). 80/80 pruebas.
  - Encontrado: el pelo **nunca proyectó sombra** (`SHADOW_PARTS` busca `Pelo_Moño`, pero las mallas se llaman
    `Pelo_Moño_1..3`). Se decidió arreglarlo (ver arriba).
- **Etapa 3 terminada.**
  - Catálogos de SÓLO DATOS en `src/characters/catalog/`: `paletas.js`, `prendas.js` (piel + 4 prendas del modelo
    actual con canales, derivados y extras, como en 3.2), `personajes.js` (`LOOK_NINA`, `PERSONAJES`, plantillas
    `VECINOS` con el orden del sorteo) y `acciones.js` (`ACTIONS`, `AUTO_FACE`, `HOLD`).
  - `src/characters/looks.js`: `lookMaterials` (reemplaza a `recolor`), `randomLook` desde plantillas y `fixLook`.
    Las reglas de color escritas a mano en `recolor()` quedaron como datos (`['sombra', k]`, `['contraste', k, blanco]`).
    El look de fábrica de Nina no cambia colores (los tonos del modelo no salen de las reglas).
  - Paso 1 (catálogo, clonando como antes): las 7 capturas **idénticas**: los vecinos salen iguales.
  - Paso 2, materiales compartidos por (material, color, visible), salvo las capas de la cara: 152 → 102 materiales
    con 8 personajes. Three.js r149 usa `Math.random` en cada UUID, así que clonar menos cambia la secuencia de
    azar de las pruebas y mueve a los vecinos. Se agregó `UUID_APARTE=1` a las capturas (dev): con esa opción,
    antes y después del cambio las capturas salieron idénticas (la 7, con el ruido de siempre de la GPU).
    Después se regeneraron las capturas de referencia (sólo cambia dónde andan los vecinos).
  - Guardado v2 (`ciudadArcoiris.v2`): `{ version: 2, nina: { look }, pets, cars, shop }`. Una partida v1 se migra
    al cargar y se guarda enseguida en v2; la clave v1 no se borra. Pruebas nuevas (`tests/guardado.spec.js`):
    migración v1 → v2 y guardado dañado.
  - Pruebas: 80/80. En WebKit cada prueba usa ahora un navegador nuevo: WebKit no libera los contextos WebGL de
    páginas cerradas y perdía el contexto en la carga número 16 (pasó a notarse con las pruebas nuevas).
- **Etapa 2 terminada.**
  - Primero, sobre el código de la 1b: ganchos de prueba `window.__juego` (`src/debug/hooks.js`, sólo en desarrollo
    o con `?test`: state, player, npcs, cars, `teleport(x, z)`), 8 pruebas nuevas en `tests/lugares.spec.js`
    (banca, helado, refugio, comprar y manejar, garaje, "Mi auto" con partida guardada, "Mi auto" sin auto,
    auto de la calle) y 2 capturas nuevas (6-salon, 7-tienda). Con eso armado se desenredó.
  - `core/events.js`: `game/` avisa (`zona`, `aviso`, `sonido`, `menu`, `auto`, `motor`) y `ui/`/`audio/` escuchan.
    `game/` ya no toca el DOM ni el audio; `setEngine(velocidad, tono)` recibe todo por parámetro.
  - `game/actors.js` guarda los datos compartidos (player, cam, input, ownedCars); `cars/driving.js` pasó a
    `game/driving.js`; `main.js` elige cada cuadro entre `updateCar` y `updatePlayer`; `updateZones` está en
    `game/interact.js`.
  - Zonas con acción: `addZone(...)` en el lugar y `onZoneAction(id, fn)` en quien sabe hacerlo; el botón de acción
    sólo hace `runZone(state.currentZone)`. Nombres de lugar: `addArea(...)` en `world/city.js`.
  - `carFitsAt(…, skip, avoid)` recibe la posición a evitar. `svgI` pasó a `core/svg.js`. La cámara lee
    `cam.dragging` y `state.preview` en vez de módulos de la interfaz.
  - Código muerto quitado: `rand`, `hedge`, `player.phase`, rama `skin` de `swHTML`.
  - ESLint (`npm run lint`, corre antes de `npm test`): `import/no-cycle` y `import/no-restricted-paths` con las
    capas de la sección 2.1. Se comprobó que detecta ciclos e importaciones prohibidas. Resultado: **0 ciclos, 0 violaciones**.
  - Pruebas: 70/70. Capturas 1–6 idénticas byte a byte a antes del refactor; la 7 (tienda) varía hasta 1 nivel de
    color en unos pocos píxeles del parabrisas transparente aun sin cambiar el código (ruido de la GPU), por eso
    el margen de las capturas pasó de 1 % de la imagen a 50 píxeles con el umbral por píxel normal.
  - Recorrido extra sin errores: música, saludar, menú Acción que se cierra al abrir un panel, "Llevar a casa",
    subirse con el botón, aviso "¡Maneja aquí!", bocina, freno, bajarse con el botón.
- **Etapa 1 terminada** (salvo la prueba en el iPad real, pendiente).
- **Etapa 1b terminada** (sus ciclos de importación se eliminaron en la etapa 2): probada en el navegador del PC y guardada en el commit "Etapa 1b: separar en módulos".
  Después se borró `fuente/` (decisión 12): `juego_fuente.html`, `armar_juego.py` y la copia de
  `avatar_vestido.glb` (idéntica a `assets/modelos/`). Quedan en la historia de Git.
  - `src/main.js` se separó en 50 módulos (+ `core/state.js` y `engine/three.js`) con una herramienta de un solo uso
    que usa análisis de alcance (espree + eslint-scope): mismas funciones, mismos cuerpos, importaciones calculadas.
  - A `core/state.js` pasaron sólo los `let` que se reasignan desde otro módulo: `mode`, `clock`, `currentZone`,
    `lastCar`, `shopSpec`, `ttModel`, `ttSpin`, `ttDrag`, `musicOn`, `joyId`. Cada uno se inicializa en su módulo
    de origen en el mismo momento que antes. Los demás `let` (`driving`, `preview`, `ttGroup`, `AC`…) se exportan
    tal cual (un import de ES es una referencia viva de lectura).
  - `main.js` importa todos los módulos en el orden original de las secciones, así el orden de arranque
    (renderer → mundo → autos…) y el de creación de objetos de Three.js no cambian.
  - `window.__cityScript` pasó a `engine/three.js` para que siga marcándose antes de crear el renderer.
  - Diferencias con la sección 2 (a propósito, para no rediseñar en la 1b): `collide` quedó en `world/physics.js`,
    `RAINBOW` en `engine/materials.js`, los autos en `cars/models.js` (un archivo, no una carpeta), las paletas y
    acciones siguen en sus módulos (el catálogo es de la etapa 3), y se agregó `ui/buttons.js` para los botones del HUD.
  - Resultado: 30/30 pruebas; capturas **idénticas byte a byte** a la etapa 0 (dev y archivo único). Recorrido
    extra en desarrollo sin errores: helado, banca, tienda (todas las pestañas), comprar, manejar, bocina, freno,
    bajarse, "Mi auto", garaje (cambiar y devolver), subirse a un auto de la calle, música.
  - **Ciclos de importación que quedan** (se eliminan en la etapa 2): un grupo de 8 módulos
    (`cars/fleet`, `cars/driving`, `game/player`, `game/npcs`, `game/save`, `audio/engine`, `ui/joystick`,
    `ui/action-menu`). Nace de dos dependencias "hacia arriba": `cars/fleet → game/player` (`carFitsAt` lee
    `player.pos`) y `cars/driving` → game/ui/audio (manejar es un sistema de juego: probablemente pase a `game/`).
- **Etapa 1a terminada.** Publicada en https://ykharo.github.io/mi-ciudad2/ (GitHub Actions ✓; arranca sin
  errores en Chromium y WebKit). Probada en el navegador del PC con `npm run dev`.
  - `index.html` + `src/styles/juego.css` + `src/main.js` generados por corte exacto de `juego_fuente.html`.
    Único cambio de código: `loadNina()` lee los bytes con `readAsset('nina')` (`src/assets/loader.js`).
  - Se agregó `<html><head><body>` (sin doctype, sigue en modo quirks): sin `<head>`, Vite ponía el script y
    el CSS antes de `<meta charset>` y en el archivo único el charset quedaba después de ~740 kB.
  - `npm run build:web` → `dist/web` (JS 739 kB + .glb 2,1 MB). `npm run build` → `dist/unico/ciudad-arcoiris.html`
    (3,6 MB, Three.js y el modelo adentro, `<script id="asset:nina">`).
  - `npm test` prueba 5 variantes (dev, dev-ipad, web, web-ipad, unico): 30 pruebas. Las capturas de las
    versiones nuevas salieron **idénticas byte a byte** a las de la etapa 0. El archivo único abre como
    `file://` y arranca sin red (sólo las fuentes de Google quedan afuera).
  - `.github/workflows/pages.yml` publica `dist/web` en cada push a main. Hay que activar una vez
    Settings → Pages → Source: "GitHub Actions".
  - Pendiente de la 1a: prueba en el iPad real (se hace más adelante, ver decisión 10).
- **Etapa 0 terminada.** Checklist manual en el PC: todo ✅; iPad pendiente.
  - `package.json` con `vite`, `@playwright/test` y `three@0.149.0` (fijo). Navegadores Chromium y WebKit instalados.
  - `npm test` corre 11 pruebas contra `juego_actual/ciudad-arcoiris-nina.html` (servido con `vite preview`):
    5 de humo en Chromium de escritorio y en WebKit con emulación de iPad (arranca, camina con teclado,
    joystick táctil, menú Acción, adoptar y recargar) + 5 capturas de referencia en Chromium
    (`tests/capturas/`: portada, Nina, bailando, parque, panel de mascotas). Pasaron dos corridas seguidas.
  - Las capturas son repetibles gracias a `Math.random` con semilla, el reloj de Playwright detenido y el
    audio desactivado (el ruido del audio consume `Math.random` según el equipo). No hizo falta tocar el juego.
  - Chromium usa la GPU del PC (con WebGL por software las capturas tardaban más de 2 minutos). Por eso
    las capturas dependen de este PC: en otro equipo (o en GitHub Actions) hay que regenerarlas.
  - Falta: el commit "Etapa 0: pruebas y capturas de referencia" desde GitHub Desktop.
  - Las capturas del salón de autos y de la tienda se agregan en la etapa 2, cuando existan los ganchos
    de prueba (`teleport`); sin ellos, llegar hasta allá caminando es frágil.

