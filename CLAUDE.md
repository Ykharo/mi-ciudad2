# Ciudad Arcoíris — contexto del proyecto

Juego 3D infantil para navegador (Three.js r149 desde npm, empaquetado con Vite). En español, pensado
para niños, se juega con toque (joystick en pantalla) en tablet/teléfono y con teclado en computador.
La protagonista es **Nina**, un avatar low-poly en `.glb` con esqueleto y animaciones.
Se está reestructurando por etapas: estado actual y lo que sigue en `PLAN.md` (sección "Dónde quedamos", corta).
El detalle de cada etapa está en `HISTORIAL.md` (largo: leerlo sólo si hace falta el porqué de algo). Al terminar
un trabajo: el detalle va arriba en `HISTORIAL.md` y en "Dónde quedamos" sólo se actualiza el resumen.

## Archivos
- `index.html` — HTML del juego. Sin `<!doctype>` a propósito (modo quirks, como siempre).
- `src/` — el código, en ~50 módulos ES (estructura de `PLAN.md` sección 2):
  `core/` (estado `state.js`, eventos `events.js`, matemática), `engine/` (Three.js, renderer, materiales, geometría,
  texturas), `world/` (ciudad, zonas, `places/` un archivo por lugar), `characters/` (Nina, animador, caras), `pets/`,
  `cars/` (catálogo, modelos, autos en la calle), `game/` (`actors.js` datos compartidos, jugadora, manejo, vecinos,
  cámara, guardado), `audio/`, `ui/` (HUD, joystick, `panels/`), `debug/` (ganchos de prueba), `main.js` (arranque y bucle).
  - **Capas** (`PLAN.md` 2.1, las verifica `npm run lint`): core ← engine ← assets ← contenido (world, characters,
    pets, cars) ← game ← audio, ui ← debug ← main.js. Nadie importa capas de más arriba y no hay ciclos.
    Para avisar hacia arriba se usan eventos: `emit('zona' | 'aviso' | 'sonido' | 'menu' | 'auto' | 'motor', …)`
    (lista en `core/events.js`); `game/` no toca el DOM ni el audio.
  - Lugares: un archivo en `world/places/` con `definePlace({ id, nombre, orden, area, build(ctx) })`
    (`world/place.js`; `city.js` los encuentra solo). `ctx`: `world`, `scene`, `addObs`, `addObsRot`, `addZone`,
    `onFrame`. `area` = `[x0, x1, z0, z1]` da el nombre del lugar; no cambiar el `orden` de los que existen.
    Un lugar en una manzana de afuera reemplaza su casa (`ocupada` en `city.js`). Ej.: `places/plaza.js`.
    `area: manzana(x, z)` (`world/layout.js`) calcula la manzana; `articulo` ('el'/'la') para las frases.
    Pisos más altos que el suelo (una tarima): `addPiso` (`world/physics.js`); la jugadora sube sola. `sueloEn(x, z)`
    incluye las veredas (0,18 m, `enVereda` en `world/layout.js`); vecinos y mascotas usan `sueloSuave`. Con
    `espera: { x, z, mira }` las mascotas no suben: esperan sentadas ahí (`waitAt` en `pets/follow.js`).
    Mascotas sentadas: `animatePet(…, sentada)`; también junto a la jugadora sentada.
  - **Vecinos en los juegos** (`game/vecinosJuegos.js`): eligen al llegar a una esquina (gancho `onEsquina` de
    `npcs.js`; `n.uso` los maneja). Ocupación compartida con la jugadora: `ancla.userData.quien`, `bench.quien`,
    `juego.ocupado` (contador), `juego.reservado`; `privado` = sólo la jugadora; `pareja` = de a dos (sube y baja).
    Adentro de un lugar caminan por sus senderos (`ctx.addSenderos`, `world/senderos.js`: nodos, aristas, entradas en
    la vereda); a veces sólo lo cruzan de paseo.
  - **Escenario del Aura** (`places/escenario_aura.js`): se cambia de lugar sólo con `ESCENARIO = { x, z, giro }`
    (giro en múltiplos de 90°); jurado, público y las pistas del cartel (`game/aura.js`, `pistasEscenario`) se ajustan
    solos. El cartel tiene dos botones: mirar y "💬 Preguntar dónde es" (`game/cartel.js`). Al sentarse en las
    graderías compiten dos vecinos (3 bailes cada uno, jurado, ganador; pasos en `game/aura.js`, medidores de la
    pantalla con `ESCENARIO.medidor`; `window.__juego.competencia.rapido(x)` para probarla). Si sigue sentada, tras
    `DESCANSO` llegan otros dos (reserva de looks, `relevo()`). Un asiento con `userData.mascotas` sienta a las
    mascotas a su lado (`waitAt`). La jugadora compite con "😎 Competir" (delante de la tarima): ventana
    `ui/panels/aura.js` (evento `'aura'`), `competir(movs)`; modo `'aura'`, la mueve un `player.seat` fijo y la cámara
    `cam.cine` (tomas por paso: `toma`/`objetivo`; `game/camera.js` se desliza hacia ellas). Cada movimiento suyo es
    un Código Aura (`retoAura`): `ui/codigoAura.js` muestra la ventana y el criptex (evento `'aura'`) y responde con
    `responderCodigo`; acertar: `efectoAura` (`engine/efectoAura.js`) + `camaraLenta` + toma 'lenta' (vuelta de 360°)
    + `celebrarAura` (un juez de pie con `estrellaAura()` y `alzar_estrella`; el público con `aplaudir`).
    Puntos: `BAILE` 500, `AURA` +1000, `RAPIDO` hasta +500 por movimiento; los vecinos sacan Aura al azar
    (`PROB_AURA`). La pantalla muestra `ESCENARIO.medidor.puntos` en barras + dígitos de calculadora
    (`engine/digitos.js`) + nombres; al final los jueces alzan `cartelPuntos(total)`.
  - Zonas: el lugar hace `addZone({ id, x, z, r, label })` y quien sabe qué hacer registra `onZoneAction(id, fn)`.
    Con `opciones: [{ id, label }, …]` el HUD muestra un botón por opción (`#btnAction2`) y la acción recibe
    `fn(zona, opcion)` (tobogán y columpio: 'sentada' / 'de_pie').
  - Juegos que se usan (carrusel, columpio, tobogán…): zona `{ id: 'juego', juego: { tipo, … } }` con anclas
    (`ancla()` de `world/place.js`: dónde van las caderas, mirando a su +z); los mueve `game/juegos.js`
    (tipos `asiento`, `cama`, `tobogan`, `columpio`; `juego.ocupado`, `juego.vista`). Bajarse = moverse, salvo
    `seat.fijo` (tobogán, columpio: se baja saltando, `seat.saltar`). El columpio es un péndulo simulado en
    `places/park.js` que se impulsa con la palanca vertical (`userData.impulso`). Las animaciones de los juegos
    (`subir_escalera`, `tobogan`, `columpio`) están en `tools/animaciones/juegos.mjs`; la de la escalera depende de
    las medidas de la escalera del parque (repetidas en `ESCALERA` de `game/juegos.js`).
  - `engine/three.js` es el único que importa `three`.
  - Variables que se reasignan desde varios módulos viven en `state` (`state.mode`, `state.clock`, `state.currentZone`,
    `state.lastCar`, `state.shopSpec`, `state.ttModel/ttSpin/ttDrag`, `state.musicOn`, `state.joyId`, `state.preview`).
  - `main.js` importa todos los módulos en el orden original de las secciones: ese orden define el arranque.
  - Ganchos de prueba `window.__juego` (state, player, npcs, cars, cam, `teleport(x, z)`): sólo en desarrollo o con `?test`.
    Para fotos de revisión: `cam.fijo = { pos: [x, y, z], look: [x, y, z] }` deja la cámara fija (null la suelta).
- `src/styles/juego.css` — estilos.
- Imágenes del juego en `src/assets/imagenes/` (se importan desde el código; Vite las publica como archivos aparte). Cartel de la competencia de farmear aura: `world/places/cartel.js` (letrero + zona "Mirar el
  cartel") y `game/cartel.js` (espectador que lo lee con la animación `mirar_cartel`); `main.js` espera la imagen.
- `src/assets/loader.js` + `manifest.js` — `loadGLB(id)`: lee cada modelo (`fetch` con `?v=<huella>`: la huella
  md5 de cada .glb la calcula `vite.config.js`, módulo `virtual:huellas-modelos`, para que el navegador no use uno viejo),
  lo decodifica (texturas como imágenes `data:`, colores a sRGB) y lo guarda. Ids: `nina_base`, `prenda:<id>`.
- `assets/modelos/nina_base.glb` (esqueleto, cuerpo, cabeza, cara, 11 animaciones) y `assets/modelos/prendas/<id>.glb`
  (una prenda cada uno). Generados, cuantizados: **no editar a mano**; se regeneran con `node tools/separar_glb.mjs`
  desde `herramientas_avatar/avatar_vestido.glb` (el modelo vestido completo que sale de los scripts de Python).
  Las prendas **nuevas** (sin `mallas` en el catálogo: falda_tableada, chaqueta, pelo_largo y los accesorios gorra,
  jockey, lentes, audifonos, audifonos_grandes, mochila; del niño: pelo_corto, poleron, buzo, guantes; de la amiga:
  top_corto, chaqueta_oversize, pantalon_ancho, zapatillas_plataforma; y polera_corta, polera_larga,
  poleron_oversize, gorro_lana; lentes de sol lentes_aviador, lentes_clasicos, lentes_corazon; peinados pelo_lacio,
  trenzas, pelo_largo_desordenado, pelo_rizado) salen de `node tools/generar_prendas.mjs [id…]`: un archivo por prenda en
  `tools/prendas/`, que mide el cuerpo con rayos (`cuerpo.mjs`) y escribe/valida/cuantiza el .glb (`escribir.mjs`).
  Superficies con grosor: `orientar()` antes de `cascara()` (el grosor va hacia adentro según la normal). Sólidos
  cerrados (accesorios): `tubo()`, `revolucion()`, `caja()`. Los accesorios son rígidos: todos sus vértices pesan en un
  hueso (HeadBone o Chest). Revisar con el probador (`?con=slot:id,…&dist=1.5&mira=1.8` para ver de cerca).
  `separar_glb.mjs` aparta partes en mallas propias para poder esconderlas (tabla `APARTAR`): las regiones del cuerpo
  `Body_Pies`, `Body_Piernas`, `Body_Brazos` (por hueso dominante; `Body_Base` queda con torso, cuello y manos) y el
  tope del moño `Pelo_Moño_Tope`. Si aparece otro peinado, sumarlo a `queTapa` (gorra.mjs) y regenerar gorra,
  jockey, gorro_lana y audifonos_grandes: se calzan por fuera de los peinados. Un peinado con mucho volumen arriba
  (como el rizado) pone esa parte en una malla `*_Tope` que los gorros esconden (`oculta`), en vez de ir a `queTapa`.
  Tope por prenda: 650 KB (`escribir.mjs`).
  **Formas de cabeza** (morph targets, hoy `redonda`): `formasCabeza(C)` en `cuerpo.mjs` define cada una como un
  desplazamiento que depende sólo de la dirección desde el centro de la cabeza, y `agregarFormas` se la pone a toda
  malla que alcance a mover (cabeza, orejas y todo lo que va sobre la cabeza), así el pelo y los gorros siguen a la
  cabeza (más de 1,5 mm). Después de cuantizar, `juntarFormas` (quantize copia la forma por material; guarda "sparse"
  las que mueven poco). Para revisar una forma: dibujar el contorno de perfil y de arriba, y fotos de costado exacto
  en el probador (`&fov=6&dist=14`, apuntando la cámara con `window.__probador.orb` al hueso de la cabeza). El look elige cuánto:
  `formas: { redonda: 0..1 }` (`FORMAS_CABEZA` en `catalog/personajes.js`, los nombres deben coincidir).
  `assets/` es el publicDir de Vite.
- **Vecinos**: estilos en `VECINOS` (`characters/catalog/personajes.js`: listas de prendas, opcionales con
  probabilidad, colores al azar de las paletas); `randomLook` los arma; `lookVecinos` (game/npcs.js) sortea los 7 antes
  de cargar, para cargar sólo sus prendas. Una prenda nueva sólo aparece en los vecinos si se agrega a un estilo.
- **Personajes jugables**: Nina, Amiga y Amigo (nombres provisorios; `PERSONAJES` en `characters/catalog/personajes.js`).
  Se eligen en el inicio y con el botón redondo de arriba (`ui/personajes.js`); `game/personajes.js` los cambia.
  Cada uno guarda su look: `player.looks[id]`; `player.look` es el del que se usa. En el guardado: `jugador`,
  `nina.look` y `personajes: { amiga: { look }, amigo: { look } }`. `fixLook(look, defecto)` valida contra el look del
  personaje. Probador: `?look=amigo`.
- `src/characters/wardrobe.js` — pegar/quitar prendas (`ponerPrenda`, `quitarPrenda`, `recolorear`), materiales
  compartidos. `src/characters/avatar.js` — `loadCharacters(looks)` y `makeAvatar(look)` (base + prendas).
- `src/ui/panels/wardrobe.js` — el Vestidor (zona `boutique` en la Boutique Arcoíris, modo `wardrobe`): colores por
  canal, extras, piel, Sorpréndeme, Original. Guarda en `player.look` (y en el guardado v2). Espacios del cuerpo
  (`SLOTS`): pelo, torso, abrigo, piernas, pies y los de accesorios (`SLOTS_ACCESORIOS`: cabeza, orejas, cara, cuello,
  espalda, manos). `abrigo` y los accesorios son opcionales; los accesorios comparten la pestaña "Accesorios" (se prenden
  y apagan; dos del mismo espacio se reemplazan). `oculta: [nombre de malla]` en una prenda esconde partes de la base
  o de otras prendas mientras está puesta (pantalón → `Body_Piernas`, zapatillas → `Body_Pies`, chaqueta →
  `Body_Brazos`, pelo largo → orejas, gorra → `Pelo_Moño_Tope`). Lo hace `applyLook` en `characters/wardrobe.js`:
  se esconde el objeto, no el material compartido; las partes del cuerpo usan el material `FANTASMA` (no pinta nada
  pero sigue haciendo sombra, porque en r149 lo invisible no hace sombra y la ropa pegada no la hace).
- `src/debug/probador.html` — probador de prendas y animaciones (sólo con `npm run dev`:
  http://localhost:5173/src/debug/probador.html). `tools/fotos_poses.mjs` fotografía las poses difíciles con él.
  Comparador con las hojas de `referencias/ropa/` (`src/debug/referencias.js`): modo "Dos vistas lado a lado" (frente y
  lado, casi sin perspectiva), pose de reposo, encuadre de cuerpo o cabeza; la hoja encima de cada vista con
  transparencia, "Diferencia", reflejar, recortes por hoja (`RECORTES`: frontal, lateral, cabeza, cabeza de lado),
  mover arrastrando y agrandar con la rueda (botón 🖐 o Mayús), "Alinear con 4 toques", líneas guía, cargar otra
  imagen. El ajuste se guarda en el navegador por hoja. Tecla P: ocultar el panel.
- `src/debug/criptex.html` — prototipo del criptex del "Código Aura" (sólo `npm run dev`): `ui/criptex3d.js` (criptex
  3D colgado de la cámara) y `game/palabras.js` (palabras, sílabas, emoji provisorio, "parecidas" = distractores).
- `tests/` — Playwright: humo, lugares (con los ganchos), manejo (joystick con el mouse real), guardado, vestidor,
  capturas de referencia (`tests/capturas/`), sin red.
  Checklist manual en `tests/checklist_manual.md`.
- `juego_actual/ciudad-arcoiris-nina.html` — el juego armado antiguo (3 MB, modelo incrustado).
  **No leer este archivo**: es código + un bloque base64 enorme. Tampoco leer `dist/`.

## Comandos
- `npm run dev` — desarrollo con recarga (http://localhost:5173, y desde el iPad con la IP del PC).
- `npm run build:web` → `dist/web/` (GitHub Pages, se publica solo con GitHub Actions al hacer push a main).
- `npm run build` = `npm run build:web`. **Ya no hay versión de un solo archivo** (se quitó el 30-09-2026 para poder
  seguir agregando contenido: llevaba todas las prendas adentro). Los modelos se descargan cuando se usan; no hace
  falta que el juego funcione sin red ni abriéndolo con doble clic.
- `npm run lint` — ESLint, incluidas las reglas de capas y ciclos.
- `npm test` — lint + arma el juego + todas las pruebas (dev y web, en Chromium y en WebKit con emulación de iPad). Las capturas deben salir
  iguales; sólo se regeneran (`npm run test:capturas`) cuando un cambio visible es a propósito.
  Ojo: Three.js r149 usa `Math.random` para los UUID, así que crear más o menos materiales/geometrías mueve a los
  vecinos en las capturas aunque nada se dibuje distinto. Con `npm run dev` prendido las capturas pueden salir
  enteras distintas (la tarjeta de video compartida): apagarlo antes. Para comprobar que el dibujo no cambió:
  `$env:UUID_APARTE=1` + capturas en el proyecto dev, antes y después del cambio, y comparar.
- Git no está en el PATH: los commits los hace el usuario desde GitHub Desktop.
- `herramientas_avatar/` — scripts Python que generaron el modelo (ropa, animaciones, expresiones) y atlas de la cara.
  Requieren numpy, scipy y mathutils (o Blender).

## Datos del avatar (`herramientas_avatar/avatar_vestido.glb`, separado en base + prendas)
- Espacio glTF: +Y arriba, el personaje mira hacia +Z. Mide ~1,65 m; en el juego se escala `NINA_SCALE = 1.4`.
- Esqueleto de 17 huesos: Hips, Spine, Chest, Neck, HeadBone, UpperArm/Forearm/Hand L/R, Thigh/Shin/Foot L/R.
  Sin rotaciones en reposo.
- Mallas: Body_Base, Head_Base, orejas, capas de cara Face_Eyes / Face_Eyebrows / Face_Mouth / Face_Blush,
  y ropa separada: Pelo_Moño, Ropa_Peto, Ropa_Pantalon, Ropa_Zapatillas (todas skinneadas al mismo esqueleto).
  Cada prenda tiene varios materiales (una malla por material en Three.js: `Ropa_Peto_1..4`). El peto usa el mismo
  material de costura que el pantalón (`Cargo_Stitch`), así que sus costuras toman el color del pantalón.
- Sombras: el cuerpo (Body_Base y sus regiones), Head_Base y las prendas con `sombra: true` en el catálogo (el pelo,
  la gorra, la mochila). La ropa pegada al cuerpo
  no proyecta sombra (ya la hace el cuerpo). Hasta la etapa 4 el pelo no hacía sombra por un error de nombres.
- Cara: atlas 4×2 para ojos, cejas y boca. Casillas: normal (0,0), feliz (1,0), triste (2,0), sorpresa (3,0),
  enojada (0,1), guiño (1,1). Se cambia con `map.offset.set(col*0.25, fila*0.5)`. Parpadeo = ojos de (1,0).
- 11 animaciones: idle, walk (0,47 m/s), run (1,75 m/s), jump, wave, sit, lie, dance, split,
  walk_back (−0,32 m/s), candle. Sólo el hueso Hips tiene traslación (en Y/Z), no hay root motion.
  Más 9 bailes (aura, seis_siete, sigma, take_l, siuu, griddy, spin, fresh, floss) armados en Node:
  `tools/animaciones/pose.mjs` (las utilidades de `reanimar_avatar.py` en JavaScript: poses, IK de pies y brazos,
  curvas `K`; validado contra "wave") y `tools/animaciones/bailes.mjs` (+ `juegos.mjs`: escalera, tobogán, columpio,
  alzar_estrella, aplaudir —éste parte de la pose final de "sit"—); `separar_glb.mjs` los hornea en
  `nina_base.glb` (`SIN_BAILES=1` para armarla sin ellos). También los de los juegos (`juegos.mjs`) y los del reposo
  (`reposo.mjs`: sentarse en el suelo, bostezar, leer sentada/acostada; los usa `game/reposo.js`, que empieza cuando
  la mascota termina su ciclo de espera de `pets/follow.js`, busca pasto con `world/pasto.js` y pone el libro de
  `characters/libro.js` entre las manos). En el menú Acción: `characters/catalog/acciones.js`
  (`AUTO_FACE` puede cambiar la cara con el tiempo: `[[segundo, cara], …]`).
- Las texturas de los .glb se cargan como imágenes `data:` (no `blob:`): venía del visor donde se publicaba antes,
  que bloqueaba `fetch(blob:)` en Safari iPad. Ya no es necesario, pero funciona en todos lados.

## Convenciones del juego
- Sin gestión de color (r149, modo legacy): los colores hex se usan tal cual; al cargar el glb se pasan
  los `baseColorFactor` de lineal a sRGB.
- Huesitos de Aura 🦴 (la moneda): `game/huesitos.js` (`ganarHuesitos`, `gastarHuesitos`), `player.huesitos`,
  contador `ui/huesitos.js`. Se ganan leyendo (Código Aura) y compitiendo.
- Encargos de lectura (`game/encargos.js`, `ui/panels/encargos.js`, evento `encargo`): cartelera en la Plaza, personas
  (Tito, Rosa, Beto, Sofía; Robi en la Mascotienda), pasos `elegir` / `entregar` / `invitaciones` / `caja` (el criptex
  como caja fuerte: evento `aura` con `origen: 'caja'`). Carta diaria de Robi en el buzón de Mi Casa (`game/cartas.js`,
  `player.carta`).
- "Mis mascotas" (botón 🐾 Mascotas): el archivador personal, `ui/panels/archivador.js` + `game/fichas.js` (adopción,
  estado energía/diversión que cambia solo, controles médicos, fotos; se guardan con cada mascota). Adoptar: en el Refugio.
- Mascotienda Arcoíris: `world/places/mascotienda.js` (fachada + sala de adentro lejos del mapa, `addInterior`),
  `game/mascotienda.js` (entrar/salir, comprar, ponerse; `p.cosas` = lo comprado PARA cada mascota, `p.extras` = lo
  puesto; las dos se guardan con la mascota), `ui/panels/mascotienda.js`,
  artículos en `pets/catalog/articulos.js` y sus efectos en `pets/extras.js` (`ponerExtras(P, { transporte, arcoiris })`).
  Lo que se pone a una mascota se calza con el **mapa de anclajes** (`ANCLAJES` en `pets/models.js`: espalda, lomo,
  cuello, cabeza, cola + medidas; `P.anclas.*` son Object3D que siguen al cuerpo). Usarlo para capas, monturas, cohetes.
  `escala` de la especie (perro 0,8, gato 0,6, conejo 0,4) se aplica a `P.root`: el mapa está en el espacio propio,
  antes de escalar.
  El libro de Nina también tiene su mapa (`agarre` en `characters/libro.js`: el centro del borde de cada tapa).
  Ropa de mascotas (`pets/ropa.js`: `extras.ropa = { cuello, cabeza, lomo, cara, cola, espalda, arriba, cuerpo, piernas,
  pies }`; el set superhéroe es `capa`; chalecos, pantalones, botas y disfraces en `pets/ropaCuerpo.js`, calzados con
  `TORSO` de `pets/models.js`),
  pelaje (`pets/pelaje.js`: arcoíris, pastillas de diseño, invisible), partículas (`pets/efectos.js`), compañeros
  (`pets/companeros.js`: la mariposa), voces (`vozDe` en `pets/follow.js`) y juguetes (pelota, frisbee y palito:
  `game/pelota.js` + `#btnPelota`/`#btnPelotaOtro`; burbujero: `game/burbujero.js` + `#btnBurbujas`; hueso:
  `pets/hueso.js`; aro: `game/aro.js` + `#btnAro`). Convertidor sorpresa: formas extra en `buildPet` (`FORMAS` y
  `ANCLAJES` en `pets/models.js`), `cambiarCuerpo` en `pets/extras.js` (`P.especie` = la de verdad). Píxeles: en
  `pets/pelaje.js` (`P.mallas`). Trucos (tipo `truco`): `game/trucos.js` + poses `pets/trucos.js` + `ui/trucos.js`
  (botón 🎉). Casitas (tipo `casa`, `extras.casa`): modelos `pets/casas.js`, Patio de mascotas en
  `world/places/casa.js` (`PATIO`), `game/casas.js` (`p.enCasa`). El collar musical suena con `saltoMascota(P)` (pets/ropa.js) cuando la mascota salta. Un artículo nuevo: datos en `pets/catalog/articulos.js` (tipo
  `transporte` / `pocion` / `ropa` con `lugar` / `juguete`) y su modelo en `extras.js` o `ropa.js`.
- Guardado en `localStorage` con clave `ciudadArcoiris.v2`: `{ version: 2, jugador, nina: { look }, personajes, pets (con ficha, cosas y extras), cars, shop, huesitos }`
  (`game/save.js`). Una partida `ciudadArcoiris.v1` se migra al cargar y la clave v1 no se borra. Envolver en try/catch.
  Todo lo guardado se valida al cargar (`fixLook`, `fixCarSpec`, tipos de mascota).
- Personajes guiados por datos: `characters/catalog/` (paletas, prendas con canales y derivados, personajes y
  plantillas de vecinos, acciones) es SÓLO DATOS; `characters/looks.js` los aplica. Un look es JSON; lo que no
  indica queda como viene en el modelo (el look de fábrica de Nina no cambia ningún color).
- Los materiales de los personajes se comparten por (material, color, visible), salvo las capas de la cara.
  Nunca modificar el material de un personaje después de crearlo (salvo `Face_*`): afectaría a otros.
- Autos a escala `CAR_SCALE = 0.7`; `M.hw/hl/camY` están en metros del mundo, `M.sy/seat/passenger` en unidades locales del auto.
- Textos de interfaz en español de Chile, tono infantil.
