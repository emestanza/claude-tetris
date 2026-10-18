# SPEC 02 — Animación de explosión al destruir bloques

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-18
> **Objective:** Mostrar una animación de explosión de 4 frames, con el color del bloque, cada vez que la pelota destruye un bloque.

---

## Alcance

**Dentro:**

- Animación de explosión en la posición del bloque destruido, usando `EXPLOSION_FRAMES[color]` de `assets/spritesheet.js` (4 frames de 32×16 escalados a 56×28).
- Duración total igual a `EXPLOSION_DURATION` (150 ms), con los 4 frames repartidos a partes iguales.
- La física no cambia: el bloque deja de colisionar en el momento del golpe y la animación es solo visual.
- Las explosiones se congelan en pausa y se descartan al reiniciar.
- La pantalla de Victoria aparece cuando termina la animación del último bloque. Mientras tanto la pelota queda quieta.
- Cambios solo en `game.js`. `assets/spritesheet.js` no se modifica.

**Fuera de alcance (para specs futuras):**

- Partículas, temblor de pantalla u otros efectos.
- Animaciones distintas por color o por fila.
- El color `gray`, cuyos frames son un placeholder que reutiliza los de `red`. No hay bloques `gray` en el juego.
- Sonidos nuevos. `break-sound.mp3` sigue sonando en el momento del golpe, como en la SPEC 01.
- Puntuación, power-ups y cualquier otra mecánica de la lista "fuera de alcance" de la SPEC 01.

---

## Modelo de datos

Se añade una lista de explosiones activas al estado de `game.js` y un estado de juego nuevo:

```js
const state = {
  status: 'ready', // 'ready' | 'playing' | 'paused' | 'clearing' | 'gameover' | 'won'
  // ...resto igual que en la SPEC 01
  explosions: [ /* { x, y, w, h, color, elapsed } */ ], // elapsed en ms
};
```

Convenciones:

- `elapsed` empieza en 0 y crece con `dt * 1000` mientras el juego corre.
- Frame mostrado: `Math.min(3, Math.floor(elapsed / EXPLOSION_DURATION * 4))`.
- La explosión se elimina de la lista cuando `elapsed >= EXPLOSION_DURATION`.
- `x`, `y`, `w`, `h` y `color` se copian del bloque en el momento en que se destruye.
- `clearing` es el estado entre la destrucción del último bloque y la aparición de Victoria. En él la pelota no se mueve.
- Se usa `drawFrame(ctx, frame, x, y, w, h)` y `EXPLOSION_FRAMES` de `assets/spritesheet.js`, sin cambios.
- Los frames ya están en `assets/spritesheet-breakout.png`: una fila por color (`sy` de 176 a 256, de 16 en 16) y 4 columnas (`sx` = 256, 288, 320, 352). Cada frame es 32×16 con fondo transparente.
- Verificado sobre el PNG: el color de cada fila de explosión coincide con el del bloque del mismo nombre. Los nombres no siempre coinciden con el tono visible (`cyan` es verde azulado, `green` es azul, `magenta` es morado, `hotpink` es naranja), pero la correspondencia por nombre es consistente.
- Los frames se desvanecen: el primero es el más lleno (267 píxeles opacos) y el cuarto casi vacío (25 píxeles). No hay que fundir ni escalar nada por código.

---

## Plan de implementación

1. En `game.js`, añadir `state.explosions`. Al destruir un bloque en `bounceOffBricks`, crear su explosión. En `update`, avanzar `elapsed` y eliminar las terminadas. En `draw`, dibujar las explosiones con `drawFrame`, después de los bloques y antes del paddle y la pelota. Prueba: cada bloque roto muestra su explosión y desaparece en ~150 ms.
2. Pausa y reinicio: comprobar que `update` no avanza las explosiones en estado `paused` y vaciar `state.explosions` en `restartGame()`. Prueba: al pausar durante una explosión queda congelada, y al reiniciar no queda ninguna.
3. Victoria diferida: al destruir el último bloque, pasar a `clearing` en lugar de `won`, dejar la pelota quieta, y pasar a `won` cuando `state.explosions` esté vacía. Prueba: se ve completa la explosión del último bloque y luego aparece Victoria.

---

## Criterios de aceptación

- [ ] Al destruir un bloque aparece una explosión en su posición, con las mismas medidas que el bloque (56×28).
- [ ] La explosión usa los frames de `EXPLOSION_FRAMES` del color del bloque destruido.
- [ ] La explosión muestra los 4 frames en orden y desaparece a los 150 ms.
- [ ] La pelota no colisiona con un bloque ya destruido mientras se reproduce su explosión.
- [ ] Varias explosiones simultáneas se reproducen a la vez sin interferir.
- [ ] Las explosiones se dibujan detrás del paddle y de la pelota.
- [ ] Al pausar con `P`, las explosiones activas quedan congeladas, y al reanudar continúan desde el mismo frame.
- [ ] Al reiniciar tras Game over o Victoria no queda ninguna explosión en pantalla.
- [ ] Al destruir el último bloque la pelota se detiene, se ve la explosión completa y después aparece "Victoria".
- [ ] `break-sound.mp3` sigue sonando una vez por bloque, en el momento del golpe.
- [ ] La consola no muestra errores durante una partida completa.

---

## Decisiones

- **Sí:** la animación es solo visual y el bloque deja de colisionar al romperse. Mantiene la física de la SPEC 01 y evita golpes dobles sobre un bloque ya destruido.
- **No:** bloque sólido hasta el fin de la animación. Añade estado por bloque y casos raros sin aportar nada visible.
- **Sí:** duración de `EXPLOSION_DURATION` (150 ms) con frames a partes iguales. Reutiliza la constante que ya traen los assets.
- **No:** duración propia más larga. Ignoraría la constante de `spritesheet.js`. Si la animación queda corta, se ajusta en otra spec.
- **Sí:** Victoria al terminar la última explosión, con un estado `clearing` en el que la pelota queda quieta. Así la explosión final se ve completa y la pelota no puede perderse durante la espera.
- **No:** Victoria inmediata. El overlay taparía la última explosión.
- **Sí:** pausa congela las explosiones y reiniciar las descarta. La animación avanza solo mientras el juego corre y no queda residuo entre partidas.
- **Sí:** guardar las explosiones en una lista aparte, `state.explosions`, y no en cada bloque. El bloque sigue siendo `{ alive }` y se pueden solapar varias explosiones.
- **No:** `gray`. Sus frames son un placeholder y no hay bloques `gray`.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| El estado `clearing` no se contempla en la pausa, el lanzamiento o el reinicio | `launchBall` y `togglePause` solo actúan en `ready`, `playing`, `paused`, `gameover` y `won`, así que `clearing` los ignora. Se verifica en los criterios. |
| Una pestaña sin foco deja `dt` enorme y la explosión salta frames | `dt` ya se limita a 50 ms en el bucle, así que la animación no se salta enteros. |
| Los frames de explosión no coinciden con el tamaño del bloque | Los 4 frames miden 32×16, la misma proporción 2:1 que el bloque (56×28). |
| El frame 4 tiene pocos píxeles y puede parecer que la animación acaba antes de tiempo | Es el diseño del sprite. Dura ~37,5 ms de los 150 ms. Si se ve corto, se ajusta en otra spec. |
| Los frames escalados 1,75× se ven borrosos | Desactivar el suavizado (`ctx.imageSmoothingEnabled = false`) solo si se nota. La SPEC 01 no lo toca y los bloques ya se escalan igual. |

---

## Qué **no** está en esta spec

- Partículas, temblor de pantalla y otros efectos.
- Animaciones distintas por color o por fila.
- Bloques `gray` o de varios golpes.
- Sonidos nuevos.
- Puntuación, power-ups, varios niveles y móvil.

Cada uno, si se hace, va en su propia spec.
