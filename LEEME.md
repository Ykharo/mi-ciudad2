# Ciudad Arcoíris con Nina

- `juego_actual/ciudad-arcoiris-nina.html` — el juego listo: ábrelo en el navegador (necesita internet para cargar Three.js r149 desde jsDelivr).
- `fuente/juego_fuente.html` — el mismo código, sin el modelo (legible y fácil de editar).
- `fuente/avatar_vestido.glb` — el modelo de Nina (esqueleto, 11 animaciones, ropa, caras).
- `fuente/armar_juego.py` — une código + modelo: `python3 fuente/armar_juego.py`.

## Dónde está cada cosa en `juego_fuente.html`
- `NINA: avatar .glb…` — carga del modelo, escala (`NINA_SCALE`), expresiones (`FACE_CELLS`),
  colores de los vecinos (`recolor`, `randomLook`), clones (`makeAvatar`) y mezcla de animaciones (`updateAvatar`, `avatarDo`).
- `ACTIONS` — la lista del menú 🎬 Acción (id = nombre de la animación en el .glb).
- `CAR_SCALE` — tamaño de los autos respecto al personaje.
- `PLAYER_SPEED` — velocidad al caminar/correr.

## Agregar ropa o personajes
1. Genera un .glb nuevo con los scripts del paquete original (misma armadura de 17 huesos y mismos nombres).
2. Arma el juego con él: `python3 fuente/armar_juego.py mi_modelo.glb`.
3. Las prendas nuevas son mallas separadas: se buscan por nombre (`model.getObjectByName('Ropa_…')`) para mostrarlas, ocultarlas o recolorearlas.
- `herramientas_avatar/` — scripts Python del paquete original (ropa, animaciones, expresiones) y atlas de la cara.
- `CLAUDE.md` — contexto para Claude Code. `PROMPT_REESTRUCTURAR.md` — el pedido de análisis y plan.

Nota: `armar_juego.py` sin argumentos escribe `ciudad-arcoiris-nina.html` en la raíz; usa
`python fuente/armar_juego.py fuente/avatar_vestido.glb juego_actual/ciudad-arcoiris-nina.html` para reemplazar el de `juego_actual/`.
