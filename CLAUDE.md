# Ciudad Arcoíris — contexto del proyecto

Juego 3D infantil para navegador (Three.js r149 por CDN, ES modules + importmap). En español, pensado
para niños, se juega con toque (joystick en pantalla) en tablet/teléfono y con teclado en computador.
La protagonista es **Nina**, un avatar low-poly en `.glb` con esqueleto y animaciones.

## Archivos
- `fuente/juego_fuente.html` — TODO el código del juego (HTML + CSS + un `<script type="module">`, ~2700 líneas).
  Contiene la marca `@@NINA_GLB@@` donde se inserta el modelo en base64.
- `fuente/avatar_vestido.glb` — modelo de Nina (2,1 MB). No editar a mano.
- `fuente/armar_juego.py` — genera el juego de un solo archivo: `python fuente/armar_juego.py`.
- `juego_actual/ciudad-arcoiris-nina.html` — el juego armado (3 MB, modelo incrustado).
  **No leer este archivo**: es el mismo código que `juego_fuente.html` más un bloque base64 enorme.
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
