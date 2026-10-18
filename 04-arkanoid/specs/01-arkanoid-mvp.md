# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Implementado
> **Depends on:** ninguna
> **Date:** 2026-10-18
> **Objective:** Crear un Arkanoid jugable de un solo nivel, con paddle, pelota, bloques, vidas, sonidos y reinicio, en HTML, CSS y JavaScript puro.

---

## Alcance

**Dentro:**

- Archivos nuevos `index.html`, `style.css` y `game.js` en `04-arkanoid/`, sin dependencias ni build.
- Aplanar los assets: mover `assets/assets/*` a `assets/` y borrar `assets/assets/` y `assets/__MACOSX/` junto con los `.DS_Store`.
- Canvas de 800×600 con un nivel fijo: cuadrícula de 12 columnas × 6 filas, una fila por color (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
- Todos los bloques se rompen de un golpe.
- Paddle controlable con teclado (flechas o A/D) y con ratón.
- Pelota pegada al paddle al inicio y tras perder una vida; se lanza con `Espacio` o clic.
- Rebote de la pelota en paredes, techo, bloques y paddle. En el paddle el ángulo depende del punto de impacto.
- Velocidad de la pelota constante.
- 3 vidas, mostradas en pantalla.
- Pantalla de game over (sin vidas) y de victoria (sin bloques), ambas con reinicio por `Espacio` o clic.
- Pausa con `P`.
- Sonidos: `ball-bounce.mp3` en rebotes y `break-sound.mp3` al romper un bloque.

**Fuera de alcance (para specs futuras):**

- Puntuación y récord persistente.
- Animación de explosión (`EXPLOSION_FRAMES`).
- Varios niveles, niveles aleatorios y progresión.
- Bloques con más de un golpe, incluido el color `gray`.
- Power-ups y aumento de velocidad.
- Soporte táctil y adaptación a móvil.
- Menú de inicio, silenciar sonido y ajustes.

---

## Modelo de datos

`spritesheet.js` ya aporta los globales `SPRITES`, `loadSpritesheet`, `drawSprite` y `drawFrame`. Esta spec no los modifica. Los datos nuevos viven en `game.js`:

```js
// Constantes ajustables (arriba de game.js)
const W = 800, H = 600;
const COLS = 12, ROWS = 6;
const BRICK_W = 56, BRICK_H = 28, BRICK_GAP = 4;
const BRICK_OFFSET_X = 42, BRICK_OFFSET_Y = 60;
const BRICK_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']; // una por fila, de arriba abajo
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 500; // px/s
const BALL_SIZE = 16, BALL_SPEED = 380;                                    // px/s
const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; // respecto a la vertical
const START_LIVES = 3;

// Estado de la partida
const state = {
  status: 'ready',   // 'ready' | 'playing' | 'paused' | 'gameover' | 'won'
  lives: START_LIVES,
  paddle: { x, y, w, h },
  ball: { x, y, vx, vy, size, stuck },  // stuck: true mientras sigue al paddle
  bricks: [ /* { x, y, w, h, color, alive } */ ],
};
```

Convenciones:

- Origen de coordenadas arriba a la izquierda.
- Velocidades en píxeles por segundo, integradas con el `dt` de `requestAnimationFrame`.
- Los bloques se dibujan con `drawSprite(ctx, 'block_' + color, ...)`. El sprite fuente es 32×16 y se escala a 56×28.
- La pelota usa el sprite `ball` (16×16) y el paddle el sprite `paddle` (162×14), escalado a 120×14.
- Las constantes son valores iniciales ajustables. Si cambian `W` o `H`, hay que actualizar el `<canvas>` en `index.html`.

---

## Plan de implementación

1. Aplanar los assets: mover `assets/assets/*` a `assets/` y borrar `assets/assets/`, `assets/__MACOSX/` y los `.DS_Store`. Verificar que existen `assets/spritesheet.js`, `assets/spritesheet-breakout.png` y `assets/sounds/*.mp3`.
2. Crear `index.html` (canvas 800×600, carga `assets/spritesheet.js` y `game.js`), `style.css` (centrar el canvas, fondo oscuro) y `game.js` con el esqueleto. `game.js` llama a `loadSpritesheet` y arranca el bucle desde su callback. Prueba: se ve el canvas con el paddle dibujado.
3. Mover el paddle con flechas y A/D, y con el ratón. El paddle no sale del canvas. Prueba: el paddle sigue las teclas y el cursor.
4. Pelota pegada al paddle, lanzamiento con `Espacio` o clic, y rebote en paredes laterales y techo. Prueba: la pelota sube y rebota en los bordes.
5. Rebote en el paddle con ángulo según el punto de impacto (máximo `MAX_BOUNCE_ANGLE`, velocidad constante). Prueba: el borde del paddle desvía más que el centro.
6. Crear y dibujar la cuadrícula de bloques, y colisión pelota-bloque: el bloque deja de existir y la pelota rebota. Prueba: se rompen bloques uno a uno.
7. Añadir los sonidos: `ball-bounce.mp3` en rebotes contra paredes, techo y paddle, y `break-sound.mp3` al romper un bloque. Prueba: suena en cada caso.
8. Vidas y estados: la pelota que cae por debajo del paddle resta una vida y vuelve al paddle. Sin vidas aparece game over, sin bloques aparece victoria, ambas con reinicio. Añadir HUD de vidas y pausa con `P`. Prueba: se recorre el flujo completo de la partida.

---

## Criterios de aceptación

- [ ] `index.html` carga sin errores en la consola, abierto con `python3 -m http.server 8000`.
- [ ] No existen `assets/assets/`, `assets/__MACOSX/` ni archivos `.DS_Store` bajo `04-arkanoid/`.
- [ ] Se ven 72 bloques (12×6) con los colores en este orden de arriba abajo: red, yellow, cyan, magenta, hotpink, green.
- [ ] El paddle se mueve con flechas, A/D y ratón, y no sale del canvas.
- [ ] La pelota empieza pegada al paddle y no se mueve hasta pulsar `Espacio` o hacer clic.
- [ ] La pelota rebota en las paredes laterales, el techo, el paddle y los bloques.
- [ ] Golpear el paddle por el borde desvía la pelota más que golpearlo por el centro, y nunca más de 60° respecto a la vertical.
- [ ] La velocidad de la pelota (módulo de `vx, vy`) es la misma en todo momento.
- [ ] Un bloque golpeado desaparece y suena `break-sound.mp3`.
- [ ] Rebotar en pared, techo o paddle suena `ball-bounce.mp3`.
- [ ] Si la pelota cae por debajo del paddle, las vidas bajan en 1 y la pelota vuelve pegada al paddle.
- [ ] Las vidas restantes se muestran en pantalla y empiezan en 3.
- [ ] Al llegar a 0 vidas aparece "Game over", y `Espacio` o clic reinician con 3 vidas y los 72 bloques.
- [ ] Al romper los 72 bloques aparece "Victoria", y `Espacio` o clic reinician la partida.
- [ ] `P` pausa y reanuda; en pausa la pelota y el paddle no se mueven.

---

## Decisiones

- **Sí:** vidas + game over + reinicio. Sin ellos la partida no tiene final y no es un juego completo.
- **Sí:** sonidos. Los assets ya existen y cuestan poco.
- **No:** puntuación. Se deja para otra spec junto con el récord persistente.
- **No:** animación de explosión. `gray` reutiliza los frames de `red` y los demás colores necesitarían su propia integración. Va en otra spec.
- **Sí:** un solo nivel fijo. Evita añadir estado de niveles y mantiene el plan corto.
- **Sí:** teclado + ratón. El teclado es consistente con el Tetris del repo y el ratón es el control natural en Arkanoid.
- **Sí:** rebote en el paddle con ángulo según el punto de impacto. Da control al jugador y es el comportamiento clásico.
- **No:** rebote especular simple. La trayectoria sería incontrolable.
- **Sí:** velocidad constante. Evita definir una fórmula y un tope de aceleración.
- **Sí:** aplanar los assets. `spritesheet.js` carga `assets/spritesheet-breakout.png` con ruta fija y así no hay que tocarlo.
- **No:** bloques `gray`. Quedan fuera hasta que existan bloques con varios golpes.
- **Sí:** canvas 800×600 con 12×6 bloques de 56×28 (proporción 2:1 del sprite). Es horizontal y deja 42 px de margen por lado.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Abrir `index.html` por `file://` puede dar problemas al cargar recursos | Servir con `python3 -m http.server 8000` y verificar así. |
| El navegador bloquea el audio hasta que hay una interacción del usuario | El primer sonido ocurre tras `Espacio` o clic de lanzamiento, que cuenta como interacción. |
| Atravesar bloques o paddle a alta velocidad (tunneling) | Con 380 px/s y `dt` de ~16 ms el avance por frame es ~6 px, menor que el bloque más fino. Limitar `dt` a 50 ms si la pestaña pierde el foco. |
| La pelota queda en un bucle horizontal o vertical casi puro | El ángulo máximo es 60° respecto a la vertical, así que `vy` nunca es cero tras rebotar en el paddle. |

---

## Qué **no** está en esta spec

- Puntuación y récord.
- Animación de explosión.
- Varios niveles o niveles aleatorios.
- Bloques de varios golpes, incluido `gray`.
- Power-ups y aumento de velocidad.
- Soporte móvil o táctil.
- Menú de inicio y ajustes.

Cada uno, si se hace, va en su propia spec.
