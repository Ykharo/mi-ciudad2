# Plan de reestructuración — Ciudad Arcoíris

Este documento propone cómo reorganizar el proyecto para que pueda seguir creciendo (ropa, personajes, lugares)
sin romper lo que ya funciona. Es sólo un plan: todavía no se tocó ningún archivo existente.

## Dónde quedamos (30-09-2026)

Sólo el estado actual y lo que sigue. **El detalle de cada etapa (qué se hizo, decisiones, tropiezos, números de las
pruebas) está en `HISTORIAL.md`**: leerlo sólo si hace falta el porqué de algo. Al terminar un trabajo, el detalle va
arriba en `HISTORIAL.md` y aquí sólo se actualiza el resumen.

**Estado**
- Etapas 0–6 y 8 terminadas. **Etapa 7 en curso** (personajes nuevos y variedad). Todo hasta la etapa 8 tiene commit.
- Etapa 8: los lugares se registran con `definePlace` (`world/place.js`) y `city.js` los encuentra solos. Lugar nuevo
  hecho con un solo archivo: **Plaza de Juegos** (`places/plaza.js`, frente al Refugio cruzando la Avenida Menta).
- Juegos que se usan: carrusel, cama elástica y sube y baja de la plaza; columpios y tobogán del parque
  (`game/juegos.js`, zonas `juego` con anclas). Todo con commit (01-10-2026). El tobogán se sube por la escalera (animaciones
  `subir_escalera` y `tobogan`) y el columpio tiene física de péndulo que se impulsa con la palanca (animación
  `columpio`); se baja saltando. Los dos se pueden usar sentada o de pie (dos botones). Los modelos se piden con su
  huella (`?v=`), así el navegador no se queda con uno viejo. 77/77 en Chromium.
- Repositorio `github.com/Ykharo/mi-ciudad2`; se publica sólo en GitHub Pages (Actions con `npm run build:web`).
  Commits desde GitHub Desktop (Git no está en el PATH).
- **Una sola versión: la web.** La de un solo archivo se quitó (decisión del usuario: quiere seguir agregando
  contenido). Cada prenda se descarga sólo si alguien la usa; tope por prenda 650 KB.
- Personajes jugables: **Nina, Amiga y Amigo** (nombres provisorios), cada uno con su look guardado. Vecinos con dos
  estilos (clásico y urbano) que usan toda la ropa.
- Ropa y peinados: 32 prendas, 28 generadas por código (`tools/prendas/`) + las 4 originales. Accesorios en 6 espacios
  (cabeza, orejas, cara, cuello, espalda, manos). Cabeza redonda (forma `redonda`) para el amigo y algunos vecinos.
- 24 animaciones: las 11 originales + 9 bailes (aura, Six Seven, sigma, Take the L, Siuuu, Griddy, Spin, Fresh,
  Floss) + `mirar_cartel` + las de los juegos (`subir_escalera`, `tobogan`, `columpio` y sus versiones `_de_pie`) +
  las de la competencia (`alzar_estrella`, `aplaudir`) + las del reposo (`sentarse_suelo`, `bostezo`, `leer_sentada`,
  `leer_acostada`, `acostarse_leer`, `sentarse_leer`): 34. Cartel de la competencia de farmear aura frente a la Boutique, con alguien leyéndolo.
- Probador (`src/debug/probador.html`) con comparador de referencias (vistas frente/lado, transparencia, alinear).

- **Competencia de aura, etapa A hecha** (sin commit): el Escenario del Aura en la Calle Mora frente a la Plaza de
  Juegos (`world/places/escenario_aura.js`; se cambia de lugar con `ESCENARIO`), jurado y público sentados, y pistas
  de quien lee el cartel ("💬 Preguntar dónde es"). En la tarima las mascotas esperan abajo sentadas; en las
  graderías la jugadora se sienta a mirar (adelante o arriba), y al sentarse dos vecinos compiten en la tarima, por
  turnos, un baile cada vez (3 rondas, notas del jurado, ganador); si sigue sentada, tras un descanso compiten otros
  dos vecinos. Su mascota se sienta a su lado en las graderías. **La jugadora compite**: "😎 Competir" delante de la
  tarima (se anota si hay una en curso), elige 3 movimientos en una ventana y compite contra un vecino, por ahora
  automático, con cámaras de cerca, desde abajo y girando. 91/91 en Chromium.
- **Código Aura en la competencia (sin commit)**: en cada movimiento de la jugadora, un código de 3 palabras y el
  criptex 3D (`ui/criptex3d.js`, `ui/codigoAura.js`, `game/codigoAura.js`); acertar da aura, puntos y una vuelta de
  360° en cámara lenta, con un juez de pie alzando la estrella dorada con la "A" y el público aplaudiendo (también al
  ganar). Puntos coherentes (baile 500, Aura +1000, rápido +500) en la pantalla con dígitos de calculadora y nombres;
  los vecinos también sacan Aura; al final los jueces alzan carteles con el total. El prototipo sigue en `src/debug/criptex.html`. Falta: probar en el iPad,
  el set de imágenes propio, la dificultad que se ajusta sola y el botón 🔊 de ayuda.

**Tienda de mascotas "con Huesitos que se ganan leyendo" (plan por etapas)**
1. Huesitos de Aura ✅ (`game/huesitos.js`, contador en el HUD; se ganan en la competencia).
2. La Mascotienda Arcoíris ✅ (frente al Refugio; adentro, sala 3D con pasillos, carteles, probador y Robi, el perro
   robot; jarabe arcoíris, patines, burbuja, mini globo, alitas; diario de la mascota).
   "Mis mascotas" ✅: el archivador personal (ficha, estado, salud, cosas). Falta la veterinaria (controles pendientes).
   Artículos con movimiento ✅ (inercia de burbuja, globo y alitas; un patín en cada pata). Ciclo de espera de las
   mascotas ✅ (espera, se sienta, se acuesta, salta con su voz; en la ficha "Ahora: …") y **reposo de Nina** ✅ (tras
   un ciclo de la mascota: busca pasto, se sienta, bosteza y lee un libro acostada / sentada; `game/reposo.js`).
3. Más artículos. La lista del usuario (✅ hecho):
   - Transporte: ✅ patines (chispitas, curvas), ✅ globo (5 colores), ✅ alitas de hada (aletean al saltar), ✅ burbuja
     ("plop"), ✅ alitas de murciélago, ✅ platillo volador con rayo abductor; patineta con propulsores, mini auto a
     control remoto, nube con rayos (y paraguas) que la lleva, alfombra mágica, zapatos con resortes.
   - Pociones: ✅ jarabe arcoíris, ✅ gigante / mini, ✅ pastillas de diseño (vaca, cebra, estrellas, corazones,
     lunares, galaxia), ✅ invisible, ✅ convertidor sorpresa (dinosaurio, vaca, pingüino, león, chanchito y las 4
     especies, al azar), ✅ píxeles, ✅ voz (pato, león, "muuu"), ✅ caramelo de aura; brillo fosforescente (cuando
     haya noche). (Extra: ✅ polvo de estrellas, ✅ jarabe de burbujas.)
   - Accesorios: ✅ set superhéroe (capa, antifaz, emblema, cinturón, muñequeras), ✅ lentes que cambian de forma,
     ✅ bufanda arcoíris larguísima, ✅ sombrero de mago con conejito, ✅ corona que gira, ✅ aureola, ✅ cuernito,
     ✅ antenas de abeja, ✅ mochila cohete con humito, ✅ collar musical, ✅ paraguas.
     (Extra: ✅ collar con placa, ✅ gorro de cumpleaños, ✅ moño en la cola.)
   - Compañeros: ✅ mariposa, ✅ pajarito, ✅ ratoncito encima; pez en pecera flotante.
   - Juguetes: ✅ pelota, ✅ hueso eterno, ✅ burbujero, ✅ frisbee, ✅ palito mágico que crece, ✅ aro de circo.
   - Trucos ✅ (botón 🎉: patita, saludar, vuelta, dos patas, hacerse la muerta, bailar).
   - Hogar ✅ (Patio de mascotas en Mi Casa: casita de perro, torre de gato, madriguera, iglú, hongo, castillo, nave);
     falta cama-nube / hamaca / flotante, comedero de estrellitas, y estantes de Trucos y Hogar en la sala 3D.
4. ✅ Poción transformadora (el convertidor sorpresa).
5. ✅ Encargos de lectura (cartelera de la Plaza: helado para Tito, huesos para el Refugio, invitaciones de Sofía; caja
   fuerte con criptex; `game/encargos.js`). Siguientes ideas: auto equivocado, mascota extraviada, receta de helado,
   paquete misterioso, más personas.
6. ✅ Carta diaria de Robi con racha (buzón de Mi Casa). Faltan letreros escondidos.

**Competencia de aura (plan por etapas)**
- A. El lugar ✅.
- B. La jugadora compite ✅ (por ahora automático: elige 3 movimientos y se hacen solos). Falta: que interactúe
  durante sus movimientos (eso es la etapa C) y un panel final con puntaje y nivel (novata / pro / leyenda).
- C. El ritmo: música con pulso de 0,55 s, círculo que late, botón "✨ ¡Aura!" (perfecto / bien), medido con el reloj
  del juego.
- D. Jurado y público con vida: animaciones `aplaudir`, `levantar_cartel`, `celebrar`; notas del jurado; rivales.
- E. Premio y guardado: corona (accesorio nuevo) al llegar a leyenda, `aura: { mejor, corona }` en el guardado.
- F. (Opcional) flecha o huellas desde el cartel, brillo de aura, prueba en iPad.

**Siguiente (a elegir)**
- Lo que falta de las hojas: jeans baggy, reloj, zapatillas deportivas, clip de estrella; celular y botella en la
  mano (necesitan poses).
- Nombres definitivos de la amiga y el amigo (una línea en `characters/catalog/personajes.js`).
- Competencia de aura: etapa B (arriba).
- Menú Acción con 18 opciones: separar en "Acciones" y "Bailes" si molesta.
- Cartel: que la cámara se ajuste al mirarlo, o abrir la imagen en grande.
- Etapa 7 del plan: altura de sentarse medida del esqueleto (quitar el 0,158 fijo); caras alternativas.
- Juegos: el arenero (sentarse a jugar con la pala). (Los vecinos ya usan los juegos y las bancas.)

**Pendientes y avisos**
- **TEMPORAL — quitar**: regalo de 1000 Huesitos (una vez por partida) para probar la Mascotienda. En el juego hay que
  ganárselos. Para quitarlo: `REGALO_PRUEBA = 0` en `game/huesitos.js` (y, si se quiere, borrar `regaloPrueba` del
  guardado en `game/save.js`). Y el botón "🧪 +100 🦴 de prueba" de la ventana de la Mascotienda
  (`ui/panels/mascotienda.js`, `data-prueba`).
- **WebKit no arranca en este PC** (Windows lo bloquea, código `0xC0E90002`): las pruebas de iPad no corren. Revisar
  la seguridad de Windows o `npx playwright install webkit`.
- Probar en un iPad real (pendiente desde la etapa 0).
- `index.html` no tiene `<meta name="viewport">` (Safari de teléfono dibuja a 980 px): agregarla es un cambio visible,
  pendiente de decidir.
- La carpeta `mi-ciudad/` dentro del proyecto es un repositorio vacío de un intento anterior: se puede borrar.
- Con los abrigos holgados, las correas de la mochila quedan en parte por dentro del abrigo.

Índice:
1. [Diagnóstico del código actual](#1-diagnóstico-del-código-actual)
2. [Estructura de proyecto propuesta](#2-estructura-de-proyecto-propuesta)
3. [Ropa y personajes sin tocar el núcleo](#3-ropa-y-personajes-sin-tocar-el-núcleo)
4. [Herramientas: Vite, Three.js y la versión de un solo archivo](#4-herramientas-vite-threejs-y-la-versión-de-un-solo-archivo)
5. [Plan por etapas](#5-plan-por-etapas)
6. [Cómo probar](#6-cómo-probar)
7. [Riesgos](#7-riesgos)
8. [Decisiones que necesito que tomes](#8-decisiones-que-necesito-que-tomes)

---

## 1. Diagnóstico del código actual

### 1.1 Cómo está armado

`fuente/juego_fuente.html` (2727 líneas) tiene un solo `<script type="module">` en el que todo comparte un ámbito:
las funciones se llaman entre secciones sin importar el orden porque las declaraciones `function` se "elevan"
(hoisting). `armar_juego.py` reemplaza `@@NINA_GLB@@` por el .glb en base64; al arrancar, `loadNina()` lee ese
bloque con `atob`, separa las texturas (`glbSplitTextures`) y las carga como imágenes `data:` para esquivar el
bloqueo de `fetch(blob:)` en Safari/iPad.

Flujo de arranque (`boot`, línea 2689): fuentes → `buildSky` / `buildClouds` / `buildCity` (que también crea
los autos estacionados y el salón de autos) → `loadNina` → `makeAvatar(null)` para Nina → mascotas y autos
guardados → `refreshTT` → `spawnNPCs(7)` → bucle `frame`.

Orden del bucle (`frame`, línea 2665), que hay que respetar:
`updatePlayer` (o `updateCar` si se maneja) → `followChain` de mascotas → `updateNPCs` → `updatePreview` →
`updateZones` → funciones de `animated` → `updateCamera` → cielo → `cullAvatars` → nombre del lugar → `render`.

### 1.2 Qué ya está bien encaminado (y conviene conservar)

- **El animador es genérico**: `makeAvatar` / `avatarDo` / `updateAvatar` funcionan con cualquier modelo que
  tenga los mismos 17 huesos y los mismos nombres de clip. La fase de zancada compartida y la mezcla por pesos
  no dependen de Nina.
- **Los autos ya son "datos + constructores"**: `CAR_TYPES`, `DECALS`, `RIMS`, `TOPPERS`, `EXTRAS`, `HORNS` son
  catálogos; `fixCarSpec` valida lo guardado. Es exactamente el patrón que conviene copiar para la ropa.
- Cachés de material y geometría (`mat`, `G`), fusión de mallas estáticas (`mergeStatic`), recorte manual de
  avatares (`cullAvatars`): buenas decisiones de rendimiento para iPad.

### 1.3 Estado global compartido: quién escribe y quién lee

| Estado | Declarado en | Lo escriben | Lo leen |
|---|---|---|---|
| `scene`, `world`, `camera`, `renderer`, `sun`, `fill` | Motor | Mundo, personajes, mascotas (agregan objetos); cámara (mueve luces) | Todos |
| `obstacles` | Mundo | Constructores del mundo (`addObs`), `spawnCar`/`removeCar`, `syncCar` | `collide`, `cameraBlock`, `buildCity` |
| `zones` | Mundo | `shelter`, `iceCreamShop`, `bench`, `carShop` | `updateZones` |
| `animated` | Mundo | Nubes, fuente, columpios, mascotas del refugio, salón de autos | `frame` |
| `cars` | **Mundo** (pero es de Autos) | `spawnCar`, `removeCar` | `nearestCar`, `updateNPCs` |
| `avatars`, `NINA` | Personajes | `makeAvatar`, `loadNina` | `cullAvatars`, `updateAvatar` |
| `player` | Gameplay | Jugadora, manejo, paneles (mascotas/tienda), banca | Cámara, vecinos, mascotas, **`carFitsAt` (Autos)** |
| `mode` (`let`) | Gameplay | `enterMenu`, `leaveMenu`, `enterCar`, `exitCar`, botón Jugar | Casi todo, **incluida una animación del salón de autos** |
| `cam`, `input` | Gameplay | Interfaz (arrastre, pellizco, joystick, teclado), menús, manejo | Jugadora, manejo, cámara |
| `npcs` | Gameplay | `spawnNPCs` | Jugadora (esquivar), manejo (choques), saludar, bocina |
| `driving` (`let`) | Manejo | `enterCar`, `exitCar` | Cámara, audio (`setEngine`), `frame`, bocina |
| `currentZone` (`let`) | Gameplay | `updateZones`, `sitOnBench`, `enterCar`, `enterMenu` | Teclado (E), botón de acción |
| `ownedCars`, `lastCar`, `shopSpec` | Gameplay | Panel de tienda, `callCar`, `exitCar`, `boot` | `save` |
| `ttGroup`, `ttModel`, `ttSpin`, `ttDrag` (`let`) | Autos | Panel de tienda, arrastre en el canvas | Cámara, animación del torno |
| `preview` (`let`) | Interfaz (mascotas) | Panel de mascotas | Cámara, `frame` |
| `pointers`, `joyId`, `knob`, `joyHint` | Interfaz | Interfaz, **`enterMenu` y `enterCar` (Gameplay)** | Cámara (auto-giro al manejar) |
| `AC`, `engine`, `musicOn` (`let`) | Audio | Botón música, `visibilitychange` | Sonidos |
| `clock` (`let`) | Gameplay | `frame` | `updateCar` |

### 1.4 Dependencias cruzadas que hoy funcionan "de casualidad"

Todas funcionan por hoisting dentro de un solo script; al separar en módulos hay que tratarlas una por una:

- **Mundo → Mascotas**: `shelter()` llama `buildPet`/`animatePet`, definidas más abajo.
- **Mundo → Autos**: `buildCity()` llama `spawnCar` y `carShop`; el arreglo `cars` vive en la sección Mundo.
- **Autos → Gameplay**: `carFitsAt` usa `collide` y `player.pos`; el torno del salón lee `mode`.
- **Gameplay → Interfaz**: `sitOnBench`, `enterCar`, `enterMenu` llaman `setActionButton`, `setActMenu`,
  tocan `gameEl`, `joyHint`, `knob`, `joyId`.
- **Gameplay → Audio**: `updatePlayer` y el manejo llaman `sfx`, `startEngine`, `setEngine`; `setEngine` lee `driving`.
- **Interfaz → todo**: el botón de acción decide qué hacer con un `if` por `id` de zona
  (`bench`/`pets`/`icecream`/`shop`/`car`). Agregar un lugar nuevo obliga a tocar la interfaz.
- **Nombres de lugares escritos a mano**: `areaName` repite los rectángulos de cada lugar; agregar un lugar
  obliga a tocarla.

**El problema técnico principal para separar en módulos**: las variables `let` que se reasignan desde otras
secciones (`mode`, `driving`, `currentZone`, `lastCar`, `shopSpec`, `ttModel`, `ttSpin`, `ttDrag`, `preview`,
`joyId`, `musicOn`, `clock`, `sky`…). En módulos ES un `import` es de sólo lectura: `mode = 'play'` desde otro
archivo no se puede hacer. Hay que moverlas a un objeto de estado compartido (`state.mode = 'play'`).
Los arreglos (`obstacles`, `zones`, `cars`, `npcs`…) no tienen ese problema: se exportan y se modifican.

### 1.5 Otras observaciones

- **Código muerto**: `rand`, `hedge`, `player.phase` y la rama `skin` de `swHTML` (resto del Vestidor antiguo).
  Se eliminan en la etapa 2, no en la 1.
- **El `.glb` pesa 2,1 MB y sube a ~2,9 MB en base64**. Los pesos aproximados por malla: `Ropa_Pantalon` ~1 MB
  (19 448 vértices), `Pelo_Moño` ~670 KB (12 345), `Ropa_Peto` ~500 KB (8 228), `Body_Base` ~250 KB,
  animaciones ~360 KB, texturas de la cara ~420 KB. La ropa es lo que más pesa, y cada prenda nueva va a
  sumar. Hay margen para comprimir (cuantizar), ver etapa 4.
- **El `importmap` exige Safari 16.4 o más nuevo** (iPadOS 16.4). Al empaquetar Three.js dentro del juego
  (etapa 1) desaparece esa exigencia.
- **Hay números atados a la pose "sit" de Nina**: caderas a 0,158 m y 0,10 m atrás (`seatPlayer`, `sitOnBench`).
  Un personaje con otras proporciones quedaría mal sentado; habrá que calcularlo desde el esqueleto (etapa 7).
- **`recolor()` conoce los nombres de material de cada prenda** (`Cotton_Charcoal`, `Cargo_Pearl`…). Es el
  punto que hay que convertir en datos para poder agregar ropa sin tocar código.
- **Entorno**: Node 24 y Python 3.14 están instalados; **Git no**, y Python no tiene `numpy`/`scipy`/`mathutils`
  (los scripts de `herramientas_avatar/` no corren tal cual). El proyecto está dentro de OneDrive.

---

## 2. Estructura de proyecto propuesta

```
mi-ciudad/
├─ index.html                 HTML del juego (sin CSS ni JS en línea, salvo el aviso de error de carga)
├─ package.json               scripts: dev, build, build:web, test, publicar
├─ vite.config.js
├─ assets/                    (publicDir de Vite: se sirve tal cual en desarrollo)
│  ├─ modelos/
│  │  ├─ avatar_vestido.glb   etapa 1: el mismo archivo de hoy
│  │  ├─ nina_base.glb        etapa 4: cuerpo + cabeza + cara + esqueleto + animaciones
│  │  └─ prendas/             etapa 4: pelo_mono.glb, peto.glb, pantalon_cargo.glb, zapatillas.glb, …
│  └─ caras/                  etapa 7: atlas de caras alternativos (ojos/cejas/boca 4×2)
├─ src/
│  ├─ main.js                 arranque (boot) y bucle (frame): el único que conoce a todos
│  ├─ styles/                 base.css, hud.css, paneles.css
│  ├─ core/                   sin Three.js ni DOM; lo puede importar cualquiera
│  │  ├─ state.js             estado mutable compartido: mode, clock, driving, currentZone, …
│  │  ├─ events.js            emisor mínimo de eventos (on/off/emit)
│  │  ├─ math.js              TAU, clamp, lerp, lerpAngle, seeded, pick
│  │  └─ save.js              cargar/guardar, versión y migración, validadores (fix*)
│  ├─ engine/                 Three.js "genérico", sin nada del juego
│  │  ├─ three.js             único punto que importa 'three' y los addons (cambiar de versión = un archivo)
│  │  ├─ renderer.js          renderer, scene, camera, luces, resize
│  │  ├─ materials.js         mat, shade, tint
│  │  ├─ geometry.js          G, box, sph, cyl, cone, rbox, rlo, mesh, tube, disc, formas (corazón, estrella)
│  │  ├─ merge.js             mergeInto, mergeStatic, mergeChildren
│  │  ├─ textures.js          canvas: carteles, etiquetas, rayas, cuadros, pasto
│  │  └─ loop.js              onFrame(fn) para animaciones decorativas (hoy "animated")
│  ├─ assets/
│  │  ├─ manifest.js          id → archivo (nina_base, prenda:peto, …)
│  │  └─ loader.js            loadGLB(id) con caché; lee del bloque incrustado o hace fetch
│  ├─ world/
│  │  ├─ layout.js            LINES, WALK, EXT, nombres de calles
│  │  ├─ physics.js           obstacles, addObs, addObsRot, collide
│  │  ├─ zones.js             zones, addZone (con su acción), areaName desde los lugares registrados
│  │  ├─ ground.js, sky.js, nature.js (árboles, flores), houses.js
│  │  ├─ places/              un archivo por lugar: park.js, icecream.js, shelter.js, boutique.js, carshop.js
│  │  └─ city.js              buildCity: arma la ciudad a partir de la lista de lugares
│  ├─ characters/
│  │  ├─ avatar.js            makeAvatar, cullAvatars, huesos por nombre
│  │  ├─ animator.js          avatarDo, avatarStop, avatarBusy, updateAvatar
│  │  ├─ face.js              setFace, parpadeo, cambio de atlas
│  │  ├─ wardrobe.js          ponerPrenda / quitarPrenda / recolorear (etapa 4–5)
│  │  ├─ props.js             objetos en la mano (helado) → genérico: attachToBone
│  │  └─ catalog/             SÓLO DATOS: paletas.js, prendas.js, personajes.js, acciones.js
│  ├─ pets/                   models.js (buildPet), catalog.js, follow.js (followChain)
│  ├─ cars/
│  │  ├─ catalog.js           CAR_TYPES, DECALS, RIMS, TOPPERS, EXTRAS, HORNS, fixCarSpec
│  │  ├─ models/              clasico.js, jeep.js, … (un constructor por tipo)
│  │  ├─ build.js             carKit, buildCarModel, ruedas, adornos, dibujos
│  │  ├─ fleet.js             cars, spawnCar, removeCar, syncCar, carDist, carFitsAt
│  │  └─ driving.js           enterCar, exitCar, updateCar, callCar
│  ├─ game/
│  │  ├─ player.js            player, updatePlayer, saltar, bancas
│  │  ├─ npcs.js              vecinos
│  │  ├─ camera.js            updateCamera, cameraBlock
│  │  └─ modes.js             enterMenu, leaveMenu (cambios de modo en un solo lugar)
│  ├─ audio/                  audio.js (contexto, música), sfx.js, engine.js (motor del auto)
│  ├─ ui/
│  │  ├─ dom.js               $, toast, botón de acción, esc
│  │  ├─ joystick.js, pointer-camera.js, keyboard.js
│  │  ├─ action-menu.js       menú 🎬 Acción (lee catalog/acciones.js)
│  │  ├─ widgets.js           optsHTML, swHTML, svgI, carIcon
│  │  └─ panels/              pets.js, shop.js, wardrobe.js (etapa 5)
│  └─ debug/                  sólo desarrollo/pruebas: window.__juego, stats, probador
├─ tools/
│  ├─ vite-embed-assets.js    plugin: incrusta los .glb en base64 en la versión de un solo archivo
│  ├─ separar_glb.mjs         etapa 4: parte avatar_vestido.glb en base + prendas
│  └─ validar_prenda.mjs      etapa 6: revisa huesos, matrices de enlace, materiales y peso
├─ herramientas_avatar/       (se queda; con requirements.txt y exportación por prenda)
├─ tests/                     Playwright
├─ dist/                      salida de build (no se versiona)
└─ juego_actual/              copia publicada (npm run publicar)
```

### 2.1 Reglas de dependencia (quién puede importar a quién)

```
core  ←  engine  ←  assets
                 ←  world, characters, pets, cars   (contenido)
                         ←  game                     (sistemas: jugadora, vecinos, cámara, manejo)
                               ←  ui, audio
                                     ←  main.js      (conecta todo)
```

- **`core/`** no importa nada del juego. `state.js` es el único lugar con estado reasignable.
- **Contenido (`world`, `characters`, `pets`, `cars`) no importa `game/` ni `ui/`**. Si necesita saber algo de la
  partida, lo lee de `state` o lo recibe como parámetro. Ejemplos concretos:
  `carFitsAt(…, evitar)` recibe la posición a evitar en vez de leer `player.pos`;
  el torno del salón lee `state.mode`.
- **`game/` no toca el DOM**. Avisa con eventos: `emit('zona', z)`, `emit('aviso', texto)`, `emit('modo', m)`,
  y `ui/` escucha. Así desaparecen las llamadas directas a `setActionButton`, `joyHint`, `knob`.
- **`audio/` escucha eventos** (`'salto'`, `'choque'`, `'bocina'`…) o expone funciones puras que `game/` llama;
  no lee `driving`: `setEngine(velocidad, tono)` recibe todo por parámetro.
- **Las zonas traen su acción**: `addZone({ id, x, z, r, label, action })`. El botón de acción sólo hace
  `currentZone.action()`. Agregar un lugar = agregar un archivo en `world/places/`.
- **`main.js` es el único que conoce a todos**: construye, registra y define el orden del bucle.
  El orden de actualización queda explícito en una lista, no disperso.

### 2.2 El estado compartido

```js
// src/core/state.js — lo único reasignable entre módulos
export const state = {
  mode: 'intro',        // intro | play | pets | shop | drive | wardrobe
  clock: 0,
  driving: null,        // auto que se está manejando
  currentZone: null,
  lastCar: null,
  shopSpec: null,
};
```

Los objetos que ya son "contenedores" (`player`, `cam`, `input`) y los arreglos (`obstacles`, `zones`, `cars`,
`npcs`, `avatars`) se exportan como `const` desde su módulo dueño; se modifican sus propiedades, nunca se
reasignan. Estado local de un solo módulo (`ttSpin`, `preview`, `joyId`, `engine`) se queda privado en ese
módulo, con funciones para leerlo si otro lo necesita (`getPreview()`), o se mueve a `state` si lo leen varios.

En la **etapa 1** se permite que queden ciclos de importación entre módulos (los módulos ES los aguantan si
sólo se llaman funciones, no si se usa un `const` antes de inicializarse). En la **etapa 2** se eliminan con
eventos y parámetros, y un linter (`eslint-plugin-import`, regla `no-cycle`) impide que vuelvan.

---

## 3. Ropa y personajes sin tocar el núcleo

### 3.1 Idea general

Separar **tres cosas** que hoy vienen juntas en `avatar_vestido.glb`:

1. **Base** (`nina_base.glb`): esqueleto de 17 huesos, `Body_Base`, `Head_Base`, orejas, capas de cara
   y las 11 animaciones.
2. **Prendas** (`prendas/*.glb`): cada una es una o más mallas skinneadas al mismo esqueleto
   (mismos nombres de huesos, misma pose de reposo, mismas matrices de enlace). Sin animaciones.
3. **Datos** (`src/characters/catalog/*.js`): qué prendas hay, a qué "espacio" del cuerpo van, qué partes se
   pueden recolorear y con qué paletas; qué personajes hay y cómo se ven.

El código (`wardrobe.js`) sólo sabe "cargar una prenda, pegarla al esqueleto de un personaje, recolorearla y
quitarla". Agregar ropa = agregar un `.glb` + una entrada en `prendas.js`.

### 3.2 Catálogo de prendas (datos)

```js
// src/characters/catalog/prendas.js
export const SLOTS = ['pelo', 'cabeza', 'torso', 'abrigo', 'piernas', 'pies', 'accesorio'];

export const PRENDAS = [
  { id: 'peto', nombre: 'Peto', ic: '👚', slot: 'torso', archivo: 'prendas/peto.glb',
    // canales recoloreables → materiales del .glb; los derivados se calculan solos
    canales: { principal: { mats: ['Cotton_Charcoal'], paleta: 'ropa' } },
    derivados: { Cotton_Edge: ['principal', 'borde'] },   // 'borde' = oscurecer, o aclarar si es muy oscuro
    extras: { Top_Emblem: { opcional: true } },            // la mariposa se puede quitar
    porDefecto: { principal: '#2E3350' },
    ocultaCuerpo: [] },                                    // regiones del cuerpo a esconder (etapa 6)
  { id: 'pantalon_cargo', nombre: 'Pantalón cargo', ic: '👖', slot: 'piernas', archivo: 'prendas/pantalon_cargo.glb',
    canales: { principal: { mats: ['Cargo_Pearl'], paleta: 'pantalon' } },
    derivados: { Cargo_Pocket: ['principal', 'sombra'], Cargo_Stitch: ['principal', 'costura'] },
    porDefecto: { principal: '#D9D6E3' } },
  { id: 'mono', nombre: 'Moño alto', ic: '🎀', slot: 'pelo', archivo: 'prendas/pelo_mono.glb',
    canales: { principal: { mats: ['Hair_Chestnut'], paleta: 'pelo' } },
    derivados: { Hair_Light: ['principal', 'brillo'], Hair_Dark: ['principal', 'sombra'] },
    sombra: true },                                        // hoy SHADOW_PARTS: sólo cuerpo, cabeza y pelo proyectan sombra
  // …
];
```

Las reglas `borde` / `sombra` / `brillo` / `costura` son las que hoy están escritas dentro de `recolor()`
(`shade(c, 0.84)`, `tint(c, 0.12)`…); pasan a una tabla con nombre y se reutilizan en todas las prendas.

### 3.3 Catálogo de personajes y "look"

```js
// Un "look" es JSON puro: se guarda, se valida y se usa igual para Nina y para los vecinos
const look = {
  base: 'nina',                              // modelo de cuerpo (etapa 7: otros cuerpos)
  piel: '#F6C9A4',
  cara: 'nina',                              // juego de atlas de cara
  escala: 1, cabeza: 1,
  prendas: {
    pelo:    { id: 'mono',           colores: { principal: '#5A3521' } },
    torso:   { id: 'peto',           colores: { principal: '#2E3350' }, extras: { Top_Emblem: true } },
    piernas: { id: 'pantalon_cargo', colores: { principal: '#D9D6E3' } },
    pies:    { id: 'zapatillas',     colores: { principal: '#FFFFFF', panel: '#FF6FAE' } },
  },
};

// src/characters/catalog/personajes.js
export const PERSONAJES = {
  nina: { nombre: 'Nina', look: { /* el de arriba */ } },
};
// Plantillas de vecinos: de qué pools se sortea cada cosa (reemplaza a randomLook)
export const VECINOS = [
  { peso: 3, pelo: ['mono', 'colitas', 'corto'], torso: ['peto', 'polera'], piernas: ['pantalon_cargo', 'falda'], … },
];
```

`fixLook(look)` valida contra el catálogo (igual que `fixCarSpec`): si una prenda guardada ya no existe, se
reemplaza por la de fábrica en vez de romper el juego.

### 3.4 Cargador de modelos con caché

```js
// src/assets/loader.js (esquema)
const cache = new Map();
export function loadGLB(id) {                 // una promesa por id: se descarga y decodifica una sola vez
  if (!cache.has(id)) cache.set(id, readBytes(id).then(parseGLB));
  return cache.get(id);
}
async function readBytes(id) {
  const el = document.getElementById('asset:' + id);    // versión de un solo archivo: bloque base64
  if (el) return base64ToBytes(el.textContent);
  const r = await fetch(MANIFEST[id]);                   // desarrollo / versión web normal
  return new Uint8Array(await r.arrayBuffer());
}
// parseGLB = lo que hoy hace loadNina: glbSplitTextures + imágenes data: + GLTFLoader.parse + color a sRGB
```

Siempre se usa el **mismo camino de decodificación** que hoy (bytes → quitar texturas → `data:` → `parse`),
venga de un bloque incrustado o de un `fetch`, para no reabrir el problema de `blob:` en iPad.

### 3.5 Pegar una prenda a un personaje

```js
// src/characters/wardrobe.js (esquema, se valida en la etapa 4)
export async function ponerPrenda(ch, slot, sel) {
  const P = PRENDA[sel.id], g = await loadGLB('prenda:' + P.id);
  quitarPrenda(ch, slot);
  const partes = [];
  g.scene.traverse(o => { if (o.isSkinnedMesh) partes.push(o); });
  for (const src of partes) {
    const m = src.clone();                                          // comparte geometría con el original
    const bones = src.skeleton.bones.map(b => ch.bones[b.name]);    // re-mapear por nombre de hueso
    m.bind(new THREE.Skeleton(bones, src.skeleton.boneInverses), src.bindMatrix);
    m.material = materialesDe(ch, P, sel);                          // recoloreados, desde caché por color
    m.frustumCulled = false; m.castShadow = !!P.sombra;
    ch.cuerpo.add(m);                                               // mismo padre que Body_Base (misma escala)
    partes.push(m);
  }
  ch.prendas[slot] = { id: sel.id, mallas: partes };
}
```

- **Geometría compartida**: diez vecinos con el mismo pantalón usan un solo buffer de vértices.
- **Materiales con caché por (material, color)**: dos vecinos con el mismo color comparten material. Hoy cada
  avatar clona los ~19 materiales. Las capas de la cara sí siguen siendo por personaje (cada uno tiene su
  expresión), pero sólo se clona la textura (comparte la imagen).
- **Espacios que no quedan vacíos**: como es un juego para niños, propongo que `torso`, `piernas` y `pies`
  siempre tengan algo puesto (se cambian, no se quitan); `pelo`, `cabeza`, `abrigo` y `accesorio` sí se
  pueden quitar. (Decisión 7.)
- **Accesorios rígidos** (gafas, mochila, corona) no necesitan skinning: se cuelgan de un hueso, como hoy el
  helado de `HandR`. `setHolding` se generaliza a `attachToBone(ch, 'HeadBone', objeto)`.

### 3.6 ¿Un .glb por prenda o todo junto?

| | Un .glb por prenda (recomendado) | Todo en uno (como hoy) |
|---|---|---|
| Agregar una prenda | Crear un archivo nuevo; nada más cambia | Regenerar y volver a probar el archivo completo |
| Carga | Sólo lo que se usa; en paralelo | Todo, siempre |
| Versión de un solo archivo | Un bloque base64 por prenda, que se decodifica sólo al usarla | Un bloque |
| Riesgo | Hay que validar que cada prenda calce con el esqueleto | Ninguno nuevo |

La herramienta de armado puede juntar varias prendas en un "paquete" más adelante si la cantidad de
archivos llega a molestar; el catálogo no cambia.

### 3.7 Ropa que atraviesa el cuerpo

Con poses extremas (`split`, `candle`, `lie`) el cuerpo puede asomarse por la ropa. La solución estándar: partir
`Body_Base` en regiones (torso, brazos, piernas, pies) y que cada prenda declare cuáles esconde
(`ocultaCuerpo: ['piernas']`). Además ahorra trabajo de dibujo. Requiere un cambio en los scripts de Python
(etapa 6). Mientras tanto, las prendas actuales funcionan igual que hoy.

### 3.8 Personajes nuevos que comparten esqueleto y animaciones

- **Variaciones de vecinos** (etapa 7): peinados = prendas del espacio `pelo`; caras = otros atlas 4×2 con la
  misma distribución (`FACE_CELLS` no cambia), cambiando `map.image` de las capas `Face_*`.
- **Cuerpos distintos** (niño, abuela, adulto alto): otro `*_base.glb` con los mismos 17 huesos. Las animaciones
  se toman de un solo lugar (los clips apuntan a huesos por nombre, así que sirven para cualquier cuerpo
  compatible). Si cambia el largo de piernas, se crea una copia del clip con la traslación de `Hips` escalada
  (`largo_nuevo / largo_nina`), para que los pies no floten ni se hundan. La altura al sentarse
  (hoy 0,158 m fijo) se mide del esqueleto al cargar.
- Las prendas se diseñan para un cuerpo; en un cuerpo distinto necesitan su propia versión
  (`archivo: { nina: 'prendas/peto.glb', nino: 'prendas/peto_nino.glb' }`).

### 3.9 Vestidor

Un panel nuevo (como Mascotas y Autos) que se abre en la **Boutique Arcoíris**, que hoy es sólo decorado:
pestañas por espacio (Pelo, Arriba, Abajo, Zapatos, Accesorios), opciones de prenda, muestras de color por
canal, "Sorpréndeme", y Nina girando frente a la cámara como en el panel de mascotas. Lo que se elige se guarda
en `look` dentro del guardado. Nota: esto **no** es el Vestidor antiguo de primitivas; trabaja sobre el
modelo `.glb`.

---

## 4. Herramientas: Vite, Three.js y la versión de un solo archivo

### 4.1 Servidor simple vs. Vite

Al separar el código en archivos, el juego ya no se puede abrir con doble clic durante el desarrollo
(los navegadores no cargan módulos desde `file://`). Se necesita un servidor local sí o sí.

| | Servidor simple (`python -m http.server`) + importmap | **Vite (recomendado)** |
|---|---|---|
| Instalación | Nada | `npm install` (una vez) |
| Recarga al guardar | Manual | Automática |
| Versión de un solo archivo | Hay que escribir un empaquetador propio | `vite-plugin-singlefile` + un plugin chico para los .glb |
| Three.js | Sigue desde el CDN | Desde npm, versión fija, empaquetado dentro del juego |
| Probar en el iPad | Con la IP del PC | `vite --host` y abrir la IP del PC en el iPad |

**Recomiendo Vite**, sin TypeScript (JavaScript con comentarios JSDoc si se quiere ayuda del editor). Scripts:

- `npm run dev` — desarrollo con recarga.
- `npm run build:web` — **versión principal para GitHub Pages** (`.js` + `.glb` separados, `base: './'`),
  donde las prendas se descargan sólo cuando se usan.
- `npm run build` — versión de un solo archivo en `dist/ciudad-arcoiris.html` (opcional: para abrir con doble
  clic o compartir un solo archivo).
- `npm run publicar` — publica en GitHub Pages (idealmente automático con GitHub Actions al hacer `git push`).
- `npm test` — pruebas Playwright.

### 4.2 La versión de un solo archivo

- `vite-plugin-singlefile` mete todo el JavaScript (incluido Three.js) y el CSS dentro del HTML.
- Un plugin propio (`tools/vite-embed-assets.js`, ~40 líneas) agrega un
  `<script id="asset:nina_base" type="application/octet-stream">…base64…</script>` por cada .glb, igual que
  hoy `@@NINA_GLB@@`. El cargador lo lee con `atob`, y las texturas siguen yendo por imágenes `data:`.
  **No se usa `fetch(blob:)` ni `fetch(data:)`**: se conserva exactamente el truco que ya funciona en el visor.
- Beneficios extra: el juego ya no depende del CDN de jsDelivr (funciona sin internet, salvo las fuentes de
  Google, que tienen respaldo), y deja de exigir `importmap` (Safari 16.4+).
- Tamaño esperado en la etapa 1: ~3,5 MB (hoy 3,0 MB + Three.js minificado).
- `fuente/armar_juego.py` queda obsoleto cuando la etapa 1 esté verificada (no se borra hasta que lo decidas).

### 4.3 ¿Actualizar Three.js?

**Recomendación: quedarse en r149 (fijado en `package.json` como `three@0.149.0`) durante las etapas 1 a 8.**
Nada de lo planificado necesita una versión nueva: `GLTFLoader`, `SkeletonUtils`, `SkinnedMesh.bind` y la
cuantización de mallas (`KHR_mesh_quantization`) ya funcionan en r149.

Cuando haya una razón concreta (un error de Three.js, una función nueva, o que un navegador falle), se hace en
una etapa aparte (etapa 9) con este "modo compatibilidad" en `engine/renderer.js` para conservar el look:

- r152+: `THREE.ColorManagement.enabled = false` y `renderer.outputColorSpace = THREE.LinearSRGBColorSpace`
  (equivale al modo sin gestión de color de hoy). Las texturas de canvas y de la cara quedan sin espacio de
  color, como ahora. Revisar que `convertLinearToSRGB` de los colores del glb siga dando lo mismo.
- r155+: luces "físicas" por defecto → multiplicar las intensidades de la luz hemisférica y las direccionales
  por π (la opción `useLegacyLights` existió por un tiempo y después se eliminó).
- Versiones más nuevas eliminan WebGL 1 (el iPad con iPadOS 15+ tiene WebGL 2, así que no debería afectar,
  pero se prueba).
- La etapa sólo se aprueba si las capturas de referencia (sección 6) salen iguales dentro de un margen.

Como `engine/three.js` es el único que importa Three.js, el cambio de versión toca un archivo más el de luces.

### 4.4 Git y OneDrive

- **Instalar Git antes de empezar**: cada etapa termina en un commit, y si algo sale mal se vuelve atrás en
  segundos. Hoy no hay control de versiones.
- **OneDrive + `node_modules`**: `npm install` crea miles de archivos chicos que OneDrive intenta sincronizar
  (lento, y a veces bloquea archivos mientras Vite los usa). Opciones: mover el proyecto fuera de OneDrive
  (por ejemplo `C:\proyectos\mi-ciudad`) y respaldar con GitHub (repositorio privado), o dejarlo donde está y
  aceptar el riesgo. (Decisión 5.)
- **Python**: crear `herramientas_avatar/requirements.txt` y un entorno virtual. `mathutils` puede no tener
  paquete para Python 3.14; lo más seguro es un Python 3.11/3.12 aparte o el Python que trae Blender.

---

## 5. Plan por etapas

Cada etapa es chica, termina con el juego funcionando, con las pruebas pasando y con un commit.
Las etapas 0–2 no cambian nada de lo que ve la jugadora.

### Etapa 0 — Red de seguridad (sin tocar el juego)

- Instalar Git, `git init`, `.gitignore` (`node_modules/`, `dist/`, `test-results/`). Primer commit con todo tal cual.
- `package.json` con Vite, Playwright y `three@0.149.0`.
- Pruebas Playwright de humo **contra el juego actual** (`juego_actual/ciudad-arcoiris-nina.html`), usando sólo
  el DOM y el teclado (ver 6.2), y **capturas de referencia** deterministas (6.3).
- Anotar el checklist manual (6.1) recorrido sobre el juego actual en PC e iPad.

**Hecho cuando**: `npm test` pasa contra el juego de hoy y hay capturas de referencia guardadas.

### Etapa 1a — Vite con el código tal cual

- `index.html` con el HTML actual; el CSS pasa a `src/styles/juego.css`; el script entero pasa **sin cambios**
  a `src/main.js` (sólo se cambian los `import` de Three.js para que vengan de npm).
- `assets/modelos/avatar_vestido.glb` (copia) y `src/assets/loader.js` con los dos orígenes (bloque incrustado o
  `fetch`). `loadNina()` usa el cargador; el resto del código no se entera.
- Plugin de incrustado + `vite-plugin-singlefile`. `npm run build` produce el archivo único.

**Hecho cuando**: `npm run dev` y el archivo de `dist/` pasan las mismas pruebas y capturas que la etapa 0,
la versión web funciona publicada en GitHub Pages (prueba real en el iPad), y el archivo único abre con doble clic.

### Etapa 1b — Separar en módulos (mecánico, sin cambiar comportamiento)

- Cortar `main.js` por las secciones existentes en ~15 módulos (motor, mundo, lugares, personajes, mascotas,
  autos, manejo, gameplay, audio, interfaz), con la estructura de la sección 2 pero **sin rediseñar nada**:
  mismos nombres de funciones, mismos cuerpos.
- Mover las variables `let` reasignadas a `core/state.js` (`mode` → `state.mode`, etc.). Es el único cambio
  "de contenido" y es de búsqueda-reemplazo.
- Mantener el orden de los efectos de nivel superior (crear el renderer, registrar listeners del DOM, crear
  `GLASS_M`), que ahora dependen del orden de importación en `main.js`.
- Se permiten ciclos de importación en esta etapa (se anotan cuáles quedan).

**Hecho cuando**: mismas pruebas y capturas; sin errores ni advertencias nuevas en consola; checklist manual
en iPad.

### Etapa 2 — Desenredar

- Eventos (`core/events.js`) para Gameplay → Interfaz y Gameplay → Audio. Zonas con su propia `action`.
  `areaName` calculado desde los lugares registrados. `carFitsAt` recibe la posición a evitar.
- `cars` pasa a `cars/fleet.js`; `shelter` recibe las mascotas del refugio por parámetro o las importa desde
  `pets/` (contenido → contenido está permitido).
- ESLint con `import/no-cycle`. Quitar código muerto (`rand`, `hedge`, `player.phase`, rama `skin` de `swHTML`).
- Ganchos de prueba: `window.__juego` (estado, jugadora, vecinos, autos, `teleport(x, z)`), sólo con `?test`
  en la URL o en desarrollo.

**Hecho cuando**: cero ciclos, mismas pruebas y capturas, y las pruebas nuevas que usan los ganchos pasan
(manejar, comprar un auto, sentarse en una banca).

### Etapa 3 — Catálogo de personajes y guardado v2 (todavía con el .glb de hoy)

- `catalog/paletas.js` (SKIN, HAIR_COLORS…), `catalog/acciones.js` (ACTIONS, AUTO_FACE, HOLD),
  `catalog/personajes.js`.
- `recolor()` pasa a ser guiado por datos (canales + derivados de la sección 3.2) y `randomLook` usa plantillas.
  Los vecinos se ven igual que antes (misma semilla → mismos colores; se verifica con las capturas).
- Materiales con caché por color.
- Guardado `ciudadArcoiris.v2` = `{ version: 2, nina: { look }, pets, cars, shop }`. Al cargar: si no hay v2 pero
  sí v1, se migra (mascotas y autos pasan tal cual; `look` de fábrica). **La clave v1 no se borra**, para poder
  volver atrás.

**Hecho cuando**: pruebas + capturas iguales; prueba de migración (se siembra un guardado v1 en `localStorage`,
se recarga y las mascotas y autos siguen ahí).

### Etapa 4 — Partir el .glb en base + prendas

- `tools/separar_glb.mjs` (con `@gltf-transform/core`) genera, **a partir del `avatar_vestido.glb` de hoy**,
  `nina_base.glb` y `prendas/{pelo_mono,peto,pantalon_cargo,zapatillas}.glb`, conservando esqueleto, matrices
  de enlace y nombres de material. No hay que volver a correr los scripts de Python.
- `wardrobe.js` con `ponerPrenda` / `quitarPrenda` / recolorear (sección 3.5). Nina y los vecinos se arman con
  base + prendas según su `look`.
- Medir y, si conviene, **cuantizar** las mallas (`KHR_mesh_quantization`, que r149 soporta sin decodificador
  extra). Se compara tamaño y se revisa que no aparezcan grietas.
- Página de desarrollo `debug/probador.html`: un personaje con selector de prendas y de las 11 animaciones,
  para revisar a mano cada prenda en cada pose.

**Hecho cuando**: capturas iguales (misma ropa, mismo look), las 11 animaciones se ven bien en el probador,
tamaño del archivo único igual o menor, y el iPad carga en un tiempo parecido.

### Etapa 5 — Vestidor v1

- Zona en la Boutique, panel `ui/panels/wardrobe.js`, modo `wardrobe`, cámara como en el panel de mascotas.
- Con las 4 prendas que ya existen: cambiar colores por canal, poner/quitar la mariposa, "Sorpréndeme".
  El look se guarda.

**Hecho cuando**: prueba Playwright entra a la Boutique, cambia colores, recarga y el look persiste;
checklist en iPad (vertical: el panel es hoja inferior y Nina queda visible arriba).

### Etapa 6 — Primera prenda nueva, de punta a punta

- Refactorizar `vestir_avatar.py` para exportar cada prenda en su propio `.glb`
  (`python vestir_avatar.py nina_base.glb --prenda falda salida.glb`) y separar `Body_Base` en regiones
  ocultables.
- `tools/validar_prenda.mjs`: mismos 17 huesos y nombres, matrices de enlace iguales a la base, pesos que suman 1,
  materiales declarados en el catálogo, tope de vértices/KB.
- Una prenda nueva real (por ejemplo falda o vestido, que ocupa `torso` + `piernas`) + un accesorio rígido
  (gorro o lentes con `attachToBone`).

**Hecho cuando**: la prenda pasa el validador, se ve bien en las 11 animaciones del probador y aparece en el
Vestidor sin cambios de código fuera del catálogo.

### Etapa 7 — Variedad de vecinos y personajes nuevos

- Peinados nuevos (prendas de `pelo`), caras alternativas (atlas en `assets/caras/`), plantillas de vecinos.
- Altura de sentarse medida desde el esqueleto (quitar el 0,158 fijo).
- Opcional: un segundo cuerpo base con clips reescalados.

### Etapa 8 — Lugares y actividades como módulos

- API `definePlace({ id, nombre, area, build(ctx) })`, donde `ctx` trae `addObs`, `addZone`, `onFrame`,
  `world`. Los 5 lugares actuales se pasan a esta forma.
- Un lugar nuevo como prueba de que sólo se agrega un archivo.

### Etapa 9 (opcional) — Actualizar Three.js

Ver 4.3. Sólo si hay un motivo, y sólo si las capturas salen iguales.

---

## 6. Cómo probar

### 6.1 Checklist manual (en cada etapa)

En Chrome/Edge de escritorio **y** en un iPad real (Safari), en horizontal y vertical:

- [ ] Carga: el botón pasa a "¡A jugar!"; sin errores en la consola.
- [ ] Caminar y correr con joystick y con WASD/flechas; saltar (botón y espacio).
- [ ] Cámara: arrastrar, pellizcar, rueda del mouse; no atraviesa las casas.
- [ ] Menú 🎬 Acción: las 9 opciones; moverse corta la acción; "Quedarse quieta".
- [ ] Saludar: los vecinos cercanos responden con burbuja y saludo.
- [ ] Banca del parque: sentarse; al moverse se para.
- [ ] Heladería: helado en la mano (con cara feliz); desaparece solo.
- [ ] Refugio: adoptar con nombre, las mascotas siguen en fila, "Llevar a casa".
- [ ] Autos Arcoíris: todas las pestañas, "Sorpréndeme", la bocina suena al elegirla, comprar → se maneja;
      frenar, retroceder, chocar (cara de sorpresa), bocina, bajarse; la mascota va de copiloto.
- [ ] "Mi auto" trae el auto; "Mi garaje": cambiar y devolver.
- [ ] Recargar: mascotas, autos (donde quedaron) y diseño de la tienda se conservan.
- [ ] Música on/off; al cambiar de pestaña el audio se pausa.
- [ ] Rendimiento en iPad: fluido caminando por el centro con vecinos a la vista.
- [ ] Versión de un solo archivo: abre con doble clic y en el visor donde se publica.

### 6.2 Pruebas automáticas (Playwright)

- Navegadores: Chromium (escritorio) y WebKit con emulación de iPad (toque, `hasTouch`), que es lo más parecido
  a Safari que se puede automatizar en Windows. No reemplaza la prueba en el iPad real.
- `webServer` de Playwright levanta `vite` (desarrollo) o `vite preview` (build); otra configuración abre el
  archivo único de `dist/`.
- Todas fallan si hay `pageerror` o `console.error`.

| Prueba | Qué hace | Desde etapa |
|---|---|---|
| Arranca | Espera "¡A jugar!" (≤ 30 s), clic, desaparece la portada | 0 |
| Camina | Mantiene `W` 1 s; cambia el nombre del lugar o la posición (con ganchos) | 0 / 2 |
| Joystick táctil | Arrastre con toque sobre `#joy` en WebKit-iPad | 0 |
| Menú Acción | Abre el menú, elige "Bailar", el menú se cierra y el botón queda marcado al reabrir | 0 |
| Mascotas | Abre Mascotas, adopta, recarga, la mascota sigue | 0 |
| Tienda y manejo | `teleport` al salón, abre la tienda, compra, `mode === 'drive'`, acelera, `E` para bajarse | 2 |
| Banca | `teleport` a una banca, botón de acción, sentada; moverse la para | 2 |
| Migración | Siembra guardado v1, recarga, revisa v2 | 3 |
| Vestidor | Cambia colores, recarga, el look persiste | 5 |
| Sin red | Bloquea todo menos el archivo único: el juego arranca igual | 1a |

### 6.3 Capturas de referencia (para "sin cambiar comportamiento")

- Playwright permite controlar el reloj de la página (`page.clock`) y se puede inyectar un `Math.random` con
  semilla antes de que cargue el juego (`page.addInitScript`). Con eso la ciudad, los vecinos y la cámara quedan
  iguales en cada corrida, sin tocar el código del juego.
- 4–5 vistas fijas (portada, Nina de cerca, parque, salón de autos, panel de la tienda) comparadas con
  `toHaveScreenshot` y un margen chico (el render por software de WebGL puede variar algún píxel).
- Si el control del reloj no alcanza para que sean deterministas, se agrega en la etapa 2 un modo `?test` que
  fija la semilla y permite avanzar el bucle cuadro a cuadro.

---

## 7. Riesgos

| Riesgo | Cómo se mitiga |
|---|---|
| Cambios sutiles de look (color, luces, sombras) al reorganizar o actualizar | Capturas de referencia desde la etapa 0; Three.js fijo en 0.149.0 |
| Errores de orden de carga al separar (un `const` usado antes de existir en un ciclo de módulos) | Etapa 1b mecánica, prueba de arranque en cada paso, etapa 2 elimina ciclos |
| El visor de publicación bloquea algo nuevo (CSP, tamaño, scripts grandes en línea) | Se conserva el truco actual (base64 + `data:`); la etapa 1a se prueba en el visor real antes de seguir |
| Memoria y tiempo de carga en iPad al crecer la ropa | Prendas por separado y decodificadas sólo al usarse; geometría y materiales compartidos; cuantización; tope de KB por prenda en el validador |
| Prendas nuevas que se atraviesan en poses extremas | Probador con las 11 animaciones; regiones del cuerpo ocultables |
| Personajes con otras proporciones: pies que patinan o flotan, mal sentados | Clips con `Hips` reescalado; altura de sentarse medida del esqueleto |
| Guardados viejos incompatibles | Versión en el guardado, migración v1→v2, validadores `fix*`, la clave v1 se conserva |
| OneDrive sincronizando `node_modules` / bloqueando archivos | Mover el proyecto o aceptar el riesgo (decisión 5) |
| Scripts de Python sin dependencias instaladas | `requirements.txt` + entorno virtual con Python 3.11/3.12 o el de Blender |
| Sin control de versiones | Git desde la etapa 0, un commit por etapa |

---

## 8. Decisiones

**Resumen (27-09-2026)**: se aceptaron todas las recomendaciones. Donde el plan no traía una recomendación
explícita (publicación desde qué repositorio, archivos viejos) se eligió la opción más simple y se anota abajo.

1. **Decidido:** Three.js se queda en **r149** (`three@0.149.0`) hasta que haya un motivo para cambiar (etapa 9).
2. **Decidido:** **Vite**, sin TypeScript.
3. **Decidido:** **Three.js dentro del juego** (funciona sin internet y sin `importmap`).
4. ~~**Publicación**~~ **Decidido:** se publica en **GitHub Pages** y se juega en el navegador del PC y del iPad.
   Consecuencias: la versión principal pasa a ser `npm run build:web` (archivos separados, la ropa se descarga
   sólo cuando se usa); la versión de un solo archivo queda como extra opcional. Se mantiene igual la carga de
   texturas por imágenes `data:`, porque ya está probada en Safari del iPad. La publicación se puede automatizar
   con GitHub Actions (cada `git push` actualiza la página).
   **Decidido:** se publica **desde este repositorio** (`Ykharo/mi-ciudad2`, público, así que Pages es gratis)
   con GitHub Actions. El repositorio donde se copiaba el juego antes se deja de actualizar cuando la versión
   de Pages esté probada en el iPad.
5. **Decidido:** GitHub Desktop (trae Git) y el proyecto en `C:\proyectos\mi-ciudad`, fuera de OneDrive.
6. **Decidido:** migrar el guardado **v1 → v2** conservando mascotas y autos; la clave v1 no se borra.
7. **Decidido:** **un .glb por prenda**. Torso, piernas y pies nunca quedan vacíos (se cambian, no se quitan);
   pelo, gorro, abrigo y accesorios sí se pueden quitar.
8. **Decidido:** el Vestidor va en la **Boutique Arcoíris**.
9. **Decidido:** como hoy: funciones y archivos en inglés; textos, comentarios y datos de catálogo en español.
10. **Decidido:** Playwright con Chromium y WebKit. **iPad real: por ahora no hay uno a mano**; su prueba se
    hace más adelante. Hasta entonces las etapas se cierran con la emulación de WebKit y el PC, y antes de
    publicar en Pages se recorre el checklist en el iPad (cubre lo acumulado).
11. **Python**: se decide en la etapa 6 (Python 3.11/3.12 aparte o el de Blender).
12. **Decidido:** cuando la etapa 1 esté verificada, `fuente/juego_fuente.html` y `fuente/armar_juego.py` se
    **borran** (quedan en la historia de Git; no hace falta una carpeta `legado/`).
