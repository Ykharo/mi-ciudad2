# Ciudad Arcoíris con Nina

Juego 3D para niños en el navegador. Se juega con el dedo en tablet o teléfono y con el teclado en el computador.

## Para jugar
- **En internet**: la versión web se publica en GitHub Pages cada vez que se sube un cambio a `main`.
- **Un solo archivo**: `npm run build` crea `dist/unico/ciudad-arcoiris.html`; ábrelo con doble clic
  (no necesita internet).

## Para trabajar en el juego
Requiere Node (una vez: `npm install`).

- `npm run dev` — abre el juego en http://localhost:5173 y se recarga solo al guardar.
  Para probar en el iPad, usa la dirección con la IP del PC que muestra la terminal.
- `npm test` — arma el juego y corre las pruebas automáticas.
- `npm run build:web` / `npm run build` — arma la versión web o la de un solo archivo.

## Dónde está cada cosa
- `index.html` y `src/styles/juego.css` — pantalla, botones y paneles.
- `src/` — el código del juego, separado por tema. Algunos puntos útiles:
  - `characters/avatar.js` — carga del modelo, escala (`NINA_SCALE`), colores de los vecinos (`recolor`, `randomLook`)
    y clones (`makeAvatar`). `characters/face.js` — expresiones (`FACE_CELLS`). `characters/animator.js` — animaciones.
  - `ui/action-menu.js` — `ACTIONS`, la lista del menú 🎬 Acción (id = nombre de la animación en el .glb).
  - `cars/build.js` — `CAR_SCALE`, tamaño de los autos respecto al personaje. `cars/catalog.js` — tipos, colores, adornos.
  - `game/player.js` — `PLAYER_SPEED`, velocidad al caminar/correr.
  - `world/city.js` arma la ciudad; cada lugar especial está en `world/places/`.
  - `main.js` — arranque y bucle principal.
- `assets/modelos/avatar_vestido.glb` — el modelo de Nina (esqueleto, 11 animaciones, ropa, caras).
- `herramientas_avatar/` — scripts Python que generaron el modelo (ropa, animaciones, expresiones) y atlas de la cara.
- `PLAN.md` — plan de la reestructuración y en qué etapa vamos. `CLAUDE.md` — contexto para Claude Code.
- `fuente/` y `juego_actual/` — la versión anterior (un solo HTML armado con Python). Ya no se edita.
