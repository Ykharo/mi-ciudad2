# Ciudad Arcoíris — contexto del proyecto

Juego 3D infantil para navegador (Three.js r149 desde npm, empaquetado con Vite). En español, pensado
para niños, se juega con toque (joystick en pantalla) en tablet/teléfono y con teclado en computador.
La protagonista es **Nina**, un avatar low-poly en `.glb` con esqueleto y animaciones.
Se está reestructurando por etapas: ver `PLAN.md` (sección "Dónde quedamos").

## Archivos
- `index.html` — HTML del juego. Sin `<!doctype>` a propósito (modo quirks, como siempre).
- `src/` — el código, en ~50 módulos ES (estructura de `PLAN.md` sección 2):
  `core/` (estado compartido `state.js`, matemática), `engine/` (Three.js, renderer, materiales, geometría, texturas),
  `world/` (ciudad, `places/` un archivo por lugar), `characters/` (Nina, animador, caras), `pets/`, `cars/`,
  `game/` (jugadora, vecinos, cámara, guardado), `audio/`, `ui/` (HUD, joystick, `panels/`), `main.js` (arranque y bucle).
  - `engine/three.js` es el único que importa `three`.
  - Variables que se reasignan desde varios módulos viven en `state` (`state.mode`, `state.clock`, `state.currentZone`,
    `state.lastCar`, `state.shopSpec`, `state.ttModel/ttSpin/ttDrag`, `state.musicOn`, `state.joyId`).
  - `main.js` importa todos los módulos en el orden original de las secciones: ese orden define el arranque.
- `src/styles/juego.css` — estilos.
- `src/assets/loader.js` + `manifest.js` — lee cada modelo del bloque base64 incrustado o con `fetch`.
- `assets/modelos/avatar_vestido.glb` — modelo de Nina (2,1 MB). No editar a mano. `assets/` es el publicDir de Vite.
- `tools/vite-embed-assets.js` — incrusta los modelos en la versión de un solo archivo.
- `tests/` — Playwright: humo, capturas de referencia (`tests/capturas/`), sin red. Checklist manual en `tests/checklist_manual.md`.
- `juego_actual/ciudad-arcoiris-nina.html` — el juego armado antiguo (3 MB, modelo incrustado).
  **No leer este archivo**: es código + un bloque base64 enorme. Tampoco leer `dist/`.

## Comandos
- `npm run dev` — desarrollo con recarga (http://localhost:5173, y desde el iPad con la IP del PC).
- `npm run build:web` → `dist/web/` (GitHub Pages, se publica solo con GitHub Actions al hacer push a main).
- `npm run build` → `dist/unico/ciudad-arcoiris.html` (un solo archivo, abre con doble clic).
- `npm test` — arma ambas versiones y corre todas las pruebas (~2 min). Las capturas deben salir iguales;
  sólo se regeneran (`npm run test:capturas`) cuando un cambio visible es a propósito.
- Git no está en el PATH: los commits los hace el usuario desde GitHub Desktop.
- `herramientas_avatar/` — scripts Python que generaron el modelo (ropa, animaciones, expresiones) y atlas de la cara.
  Requieren numpy, scipy y mathutils (o Blender).

## Datos del avatar (`avatar_vestido.glb`)
- Espacio glTF: +Y arriba, el personaje mira hacia +Z. Mide ~1,65 m; en el juego se escala `NINA_SCALE = 1.4`.
- Esqueleto de 17 huesos: Hips, Spine, Chest, Neck, HeadBone, UpperArm/Forearm/Hand L/R, Thigh/Shin/Foot L/R.
  Sin rotaciones en reposo.
- Mallas: Body_Base, Head_Base, orejas, capas de cara Face_Eyes / Face_Eyebrows / Face_Mouth / Face_Blush,
  y ropa separada: Pelo_Moño, Ropa_Peto, Ropa_Pantalon, Ropa_Zapatillas (todas skinneadas al mismo esqueleto).
- Cara: atlas 4×2 para ojos, cejas y boca. Casillas: normal (0,0), feliz (1,0), triste (2,0), sorpresa (3,0),
  enojada (0,1), guiño (1,1). Se cambia con `map.offset.set(col*0.25, fila*0.5)`. Parpadeo = ojos de (1,0).
- 11 animaciones: idle, walk (0,47 m/s), run (1,75 m/s), jump, wave, sit, lie, dance, split,
  walk_back (−0,32 m/s), candle. Sólo el hueso Hips tiene traslación (en Y/Z), no hay root motion.
- Las texturas incrustadas se cargan como imágenes `data:` (no `blob:`) porque el visor donde se publica
  bloquea `fetch(blob:)` en algunos navegadores (Safari iPad). Mantener ese truco o servir los PNG aparte.

## Convenciones del juego
- Sin gestión de color (r149, modo legacy): los colores hex se usan tal cual; al cargar el glb se pasan
  los `baseColorFactor` de lineal a sRGB.
- Guardado en `localStorage` con clave `ciudadArcoiris.v1` (mascotas, autos, diseño en la tienda). Envolver en try/catch.
- Autos a escala `CAR_SCALE = 0.7`; `M.hw/hl/camY` están en metros del mundo, `M.sy/seat/passenger` en unidades locales del auto.
- Textos de interfaz en español de Chile, tono infantil.
