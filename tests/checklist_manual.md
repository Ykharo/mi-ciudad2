# Checklist manual

Se recorre al cerrar cada etapa (ver PLAN.md, sección 6.1). Marcar con ✅, ❌ (anotar qué pasó) o — (no aplica).
PC = Chrome/Edge de escritorio. iPad = Safari en un iPad real, en horizontal y vertical.

| Revisión | Etapa 0 PC | Etapa 0 iPad |
|---|---|---|
| Carga: el botón pasa a "¡A jugar!", sin errores en la consola | ✅ | pendiente |
| Caminar y correr (joystick y WASD/flechas); saltar (botón y espacio) | ✅ | pendiente |
| Cámara: arrastrar, pellizcar, rueda del mouse; no atraviesa las casas | ✅ (pellizcar: —) | pendiente |
| Menú 🎬 Acción: las 9 opciones; moverse corta la acción; "Quedarse quieta" | ✅ | pendiente |
| Saludar: los vecinos cercanos responden con burbuja y saludo | ✅ | pendiente |
| Banca del parque: sentarse; al moverse se para | ✅ | pendiente |
| Heladería: helado en la mano (con cara feliz); desaparece solo | ✅ | pendiente |
| Refugio: adoptar con nombre, las mascotas siguen en fila, "Llevar a casa" | ✅ | pendiente |
| Autos Arcoíris: pestañas, "Sorpréndeme", bocina, comprar → manejar, frenar, retroceder, chocar, bajarse; mascota de copiloto | ✅ | pendiente |
| "Mi auto" trae el auto; "Mi garaje": cambiar y devolver | ✅ | pendiente |
| Recargar: mascotas, autos y diseño de la tienda se conservan | ✅ | pendiente |
| Vestidor (desde la etapa 5): pestañas, colores, mariposa, piel, Sorpréndeme, Original; girar a Nina arrastrando; al recargar Nina sigue igual | — | — |
| Prendas nuevas (desde la etapa 6): pelo largo, chaqueta (y "Sin chaqueta"), falda; se ven bien caminando, sentada, bailando y manejando | — | — |
| Accesorios (etapa 6): gorra, lentes, audífonos y mochila a la vez; con gorra no asoma el moño y al sacarla vuelve; colores, estrella y mariposa; se ven bien caminando, sentada, bailando y manejando | — | — |
| Música on/off; al cambiar de pestaña el audio se pausa | ✅ | pendiente |
| Rendimiento: fluido caminando por el centro con vecinos a la vista | ✅ | pendiente |
| Versión de un solo archivo: abre con doble clic y en el visor donde se publica | ✅ | pendiente |

## Notas

- iPad: no hay uno a mano por ahora (27-09-2026). La columna iPad queda pendiente y se recorre más adelante;
  mientras tanto, la emulación de iPad en WebKit (`npm test`, proyecto `ipad`) es la única referencia.

- Etapa 0 (juego de hoy): en todas las vistas asoma un borde blanco arriba al centro: es el aviso (`#toast`)
  vacío que no queda del todo escondido. Es así desde antes; no se corrige durante la reestructuración para no
  cambiar las capturas.
