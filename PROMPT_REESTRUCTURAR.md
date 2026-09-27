# Prompt para Claude Code — analizar y planificar la reestructuración

Copia desde aquí hacia abajo y pégalo en Claude Code, abierto en la carpeta `mi-ciudad`.

---

Hola. Este proyecto es **Ciudad Arcoíris**, un juego 3D infantil para navegador hecho con Three.js r149.
Lee primero `CLAUDE.md` y `LEEME.md` (contexto y datos del avatar). **No abras `juego_actual/ciudad-arcoiris-nina.html`**
ni el contenido del bloque `<script id="nina-glb">`: es el modelo en base64 y sólo te llenaría el contexto.

## Qué se hizo hasta ahora
Todo el juego vive en un solo archivo, `fuente/juego_fuente.html` (~2700 líneas). Tiene:
- Una ciudad procedural (calles, casas, parque, heladería, refugio de mascotas, Boutique decorativa, salón "Autos Arcoíris").
- **Nina**, protagonista cargada desde `fuente/avatar_vestido.glb` (esqueleto de 17 huesos, 11 animaciones, caras por atlas).
  Un animador propio mezcla idle/walk/run con una fase de zancada compartida y superpone acciones
  (saltar, saludar, bailar, sentarse, etc.). Menú "🎬 Acción" con todos los movimientos.
- **Vecinos (NPC)**: clones de Nina (SkeletonUtils) con colores, estatura y tamaño de cabeza al azar; pasean, saludan y hablan.
- **Mascotas** procedurales que siguen a la jugadora, **autos** procedurales que se diseñan en la tienda, se compran y se manejan.
- Audio sintetizado con WebAudio, guardado en localStorage, cámara en tercera persona, joystick táctil.
- Antes existía un personaje hecho con primitivas y un Vestidor; eso se eliminó y ya no debe volver.

Secciones de `fuente/juego_fuente.html` (líneas aproximadas):
| Líneas | Sección |
|---|---|
| 1–260 | HTML, CSS, importmap, bloque del modelo |
| 264–426 | Motor y utilidades (renderer, luces, cachés de material/geometría, merge de mallas, carteles) |
| 427–897 | Mundo: suelo, calles, árboles, casas, lugares especiales, layout de la ciudad |
| 898–1127 | Personajes: paletas, carga del glb, `makeAvatar`, `updateAvatar`, caras, helado en la mano |
| 1128–1210 | Mascotas |
| 1211–1811 | Autos: modelos, pintura, ruedas, adornos, tienda |
| 1812–2081 | Gameplay: guardado, jugadora, vecinos, zonas, cámara |
| 2082–2249 | Manejo de autos |
| 2250–2343 | Audio |
| 2344–2661 | Interfaz: joystick, botones, menú de acciones, paneles de mascotas y autos |
| 2662–fin | Bucle principal y arranque |

`fuente/armar_juego.py` inserta el .glb en base64 y produce el juego de un solo archivo. `herramientas_avatar/`
tiene los scripts Python que generan la ropa (`vestir_avatar.py`), las animaciones (`reanimar_avatar.py`) y las
expresiones (`armar_expresiones.py`, `ajustar_cara.py`).

## Qué necesito
Quiero que el juego **pueda seguir creciendo**. Lo que viene:
- Más ropa para Nina (prendas nuevas como mallas skinneadas al mismo esqueleto) y un vestidor para ponerlas, quitarlas y recolorearlas.
- Más personajes: variaciones de vecinos (peinados, caras) y personajes nuevos que compartan el esqueleto y las animaciones.
- Nuevos lugares, actividades y objetos en la ciudad.
- Que siga funcionando bien en tablet/teléfono (iPad incluido) y que se pueda seguir publicando como página web.

## Tu tarea ahora: analizar y proponer un PLAN (no implementes todavía)
1. **Analiza** `fuente/juego_fuente.html`, `fuente/armar_juego.py` y `herramientas_avatar/`. Entiende cómo se conectan
   el modelo, el animador, los vecinos, los autos y la interfaz. Anota dependencias entre secciones y estado global compartido
   (por ejemplo `player`, `mode`, `cam`, `npcs`, `cars`, `zones`, `obstacles`, `animated`).
2. **Propón una estructura de proyecto** con módulos ES separados (por ejemplo `src/engine`, `src/world`, `src/characters`,
   `src/pets`, `src/cars`, `src/ui`, `src/audio`, `src/game`) y `assets/` para los .glb y texturas. Justifica los límites
   entre módulos y cómo compartir el estado sin enredos.
3. **Diseña cómo se agregarán ropa y personajes** sin tocar el núcleo: por ejemplo un catálogo de datos (prendas, personajes,
   paletas) y un cargador de modelos con caché, que clone y recolore. Considera cargar prendas como .glb separados vs. todo en uno.
4. **Decide la herramienta de desarrollo**: servidor local simple vs. Vite; si conviene actualizar Three.js
   (ojo: desde r152 cambia la gestión de color y desde r155 la intensidad de las luces; el look actual depende de r149);
   y cómo seguir generando además una versión de un solo archivo para publicar (el visor bloquea `fetch(blob:)`).
5. **Plan por etapas**, cada una pequeña y verificable, con el juego funcionando al final de cada etapa. La primera debe ser
   una separación en módulos **sin cambiar el comportamiento**. Incluye cómo probar cada etapa (checklist manual y, si
   propones, pruebas automáticas con Playwright: arrancar, caminar, abrir menús, manejar, sin errores en consola).
6. Lista **riesgos y decisiones** que necesitas que yo tome (por ejemplo, versión de Three.js, bundler sí/no, formato de guardado).

Entrega el plan en un archivo `PLAN.md` en la raíz, en español, y luego resume las decisiones pendientes para que las revise.
No modifiques ni borres archivos existentes en esta etapa.
