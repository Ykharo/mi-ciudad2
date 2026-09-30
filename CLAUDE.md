# Ciudad Arcoíris — contexto del proyecto

Juego 3D infantil para navegador (Three.js r149 desde npm, empaquetado con Vite). En español, pensado
para niños, se juega con toque (joystick en pantalla) en tablet/teléfono y con teclado en computador.
La protagonista es **Nina**, un avatar low-poly en `.glb` con esqueleto y animaciones.
Se está reestructurando por etapas: ver `PLAN.md` (sección "Dónde quedamos").

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
  - Zonas: el lugar hace `addZone({ id, x, z, r, label })` y quien sabe qué hacer registra `onZoneAction(id, fn)`.
    Nombre del lugar: `addArea(...)` en `world/city.js`.
  - `engine/three.js` es el único que importa `three`.
  - Variables que se reasignan desde varios módulos viven en `state` (`state.mode`, `state.clock`, `state.currentZone`,
    `state.lastCar`, `state.shopSpec`, `state.ttModel/ttSpin/ttDrag`, `state.musicOn`, `state.joyId`, `state.preview`).
  - `main.js` importa todos los módulos en el orden original de las secciones: ese orden define el arranque.
  - Ganchos de prueba `window.__juego` (state, player, npcs, cars, `teleport(x, z)`): sólo en desarrollo o con `?test`.
- `src/styles/juego.css` — estilos.
- `src/assets/loader.js` + `manifest.js` — `loadGLB(id)`: lee cada modelo (bloque base64 incrustado o `fetch`),
  lo decodifica (texturas como imágenes `data:`, colores a sRGB) y lo guarda. Ids: `nina_base`, `prenda:<id>`.
- `assets/modelos/nina_base.glb` (esqueleto, cuerpo, cabeza, cara, 11 animaciones) y `assets/modelos/prendas/<id>.glb`
  (una prenda cada uno). Generados, cuantizados: **no editar a mano**; se regeneran con `node tools/separar_glb.mjs`
  desde `herramientas_avatar/avatar_vestido.glb` (el modelo vestido completo que sale de los scripts de Python).
  Las prendas **nuevas** (sin `mallas` en el catálogo: falda_tableada, chaqueta, pelo_largo y los accesorios gorra,
  jockey, lentes, audifonos, audifonos_grandes, mochila; del niño: pelo_corto, poleron, buzo, guantes) salen de `node tools/generar_prendas.mjs [id…]`: un archivo por prenda en
  `tools/prendas/`, que mide el cuerpo con rayos (`cuerpo.mjs`) y escribe/valida/cuantiza el .glb (`escribir.mjs`).
  Superficies con grosor: `orientar()` antes de `cascara()` (el grosor va hacia adentro según la normal). Sólidos
  cerrados (accesorios): `tubo()`, `revolucion()`, `caja()`. Los accesorios son rígidos: todos sus vértices pesan en un
  hueso (HeadBone o Chest). Revisar con el probador (`?con=slot:id,…&dist=1.5&mira=1.8` para ver de cerca).
  `separar_glb.mjs` aparta partes en mallas propias para poder esconderlas (tabla `APARTAR`): las regiones del cuerpo
  `Body_Pies`, `Body_Piernas`, `Body_Brazos` (por hueso dominante; `Body_Base` queda con torso, cuello y manos) y el
  tope del moño `Pelo_Moño_Tope`. Si aparece otro peinado, sumarlo a `queTapa` (gorra.mjs) y regenerar gorra,
  jockey y audifonos_grandes: se calzan por fuera de los peinados.
  **Formas de cabeza** (morph targets, hoy `redonda`): `formasCabeza(C)` en `cuerpo.mjs` define cada una como un
  desplazamiento que depende sólo de la dirección desde el centro de la cabeza, y `agregarFormas` se la pone a toda
  malla que alcance a mover (cabeza, orejas y todo lo que va sobre la cabeza), así el pelo y los gorros siguen a la
  cabeza (más de 1,5 mm). Después de cuantizar, `juntarFormas` (quantize copia la forma por material; guarda "sparse"
  las que mueven poco). Para revisar una forma: dibujar el contorno de perfil y de arriba, y fotos de costado exacto
  en el probador (`&fov=6&dist=14`, apuntando la cámara con `window.__probador.orb` al hueso de la cabeza). El look elige cuánto:
  `formas: { redonda: 0..1 }` (`FORMAS_CABEZA` en `catalog/personajes.js`, los nombres deben coincidir).
  `assets/` es el publicDir de Vite.
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
- `tools/vite-embed-assets.js` — incrusta los modelos (base + todas las prendas) en la versión de un solo archivo.
- `tests/` — Playwright: humo, lugares (con los ganchos), manejo (joystick con el mouse real), guardado, vestidor,
  capturas de referencia (`tests/capturas/`), sin red.
  Checklist manual en `tests/checklist_manual.md`.
- `juego_actual/ciudad-arcoiris-nina.html` — el juego armado antiguo (3 MB, modelo incrustado).
  **No leer este archivo**: es código + un bloque base64 enorme. Tampoco leer `dist/`.

## Comandos
- `npm run dev` — desarrollo con recarga (http://localhost:5173, y desde el iPad con la IP del PC).
- `npm run build:web` → `dist/web/` (GitHub Pages, se publica solo con GitHub Actions al hacer push a main).
- `npm run build` → `dist/unico/ciudad-arcoiris.html` (un solo archivo, abre con doble clic).
- `npm run lint` — ESLint, incluidas las reglas de capas y ciclos.
- `npm test` — lint + arma ambas versiones + todas las pruebas (~10 min, 145 pruebas). Las capturas deben salir
  iguales; sólo se regeneran (`npm run test:capturas`) cuando un cambio visible es a propósito.
  Ojo: Three.js r149 usa `Math.random` para los UUID, así que crear más o menos materiales/geometrías mueve a los
  vecinos en las capturas aunque nada se dibuje distinto. Para comprobar que el dibujo no cambió:
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
- Las texturas incrustadas se cargan como imágenes `data:` (no `blob:`) porque el visor donde se publica
  bloquea `fetch(blob:)` en algunos navegadores (Safari iPad). Mantener ese truco o servir los PNG aparte.

## Convenciones del juego
- Sin gestión de color (r149, modo legacy): los colores hex se usan tal cual; al cargar el glb se pasan
  los `baseColorFactor` de lineal a sRGB.
- Guardado en `localStorage` con clave `ciudadArcoiris.v2`: `{ version: 2, jugador, nina: { look }, personajes, pets, cars, shop }`
  (`game/save.js`). Una partida `ciudadArcoiris.v1` se migra al cargar y la clave v1 no se borra. Envolver en try/catch.
  Todo lo guardado se valida al cargar (`fixLook`, `fixCarSpec`, tipos de mascota).
- Personajes guiados por datos: `characters/catalog/` (paletas, prendas con canales y derivados, personajes y
  plantillas de vecinos, acciones) es SÓLO DATOS; `characters/looks.js` los aplica. Un look es JSON; lo que no
  indica queda como viene en el modelo (el look de fábrica de Nina no cambia ningún color).
- Los materiales de los personajes se comparten por (material, color, visible), salvo las capas de la cara.
  Nunca modificar el material de un personaje después de crearlo (salvo `Face_*`): afectaría a otros.
- Autos a escala `CAR_SCALE = 0.7`; `M.hw/hl/camY` están en metros del mundo, `M.sy/seat/passenger` en unidades locales del auto.
- Textos de interfaz en español de Chile, tono infantil.
