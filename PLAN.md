# Plan de reestructuración — Ciudad Arcoíris

Este documento propone cómo reorganizar el proyecto para que pueda seguir creciendo (ropa, personajes, lugares)
sin romper lo que ya funciona. Es sólo un plan: todavía no se tocó ningún archivo existente.

## Dónde quedamos (30-09-2026)

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
  - Siguiente: peinados (ondulado largo con mechas rosadas, lacio y trenzas de la amiga; pelo largo desordenado del
    amigo), lo que falta de las hojas (jeans baggy, reloj, zapatillas deportivas, clip de estrella, celular, botella), y
    los nombres de la amiga y el amigo.
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
