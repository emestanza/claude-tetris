# SPEC 03 — Niveles con dificultad creciente

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-18
> **Objective:** Añadir 5 niveles con disposiciones de bloques distintas, bloques `gray` de dos golpes y pelota más rápida en cada nivel, de modo que al limpiar un nivel se pase al siguiente.

---

## Alcance

**Dentro:**

- 5 niveles fijos definidos a mano en `game.js`, cada uno con su mapa de bloques y su velocidad de pelota.
- Mapas de hasta 8 filas × 12 columnas, con huecos (celdas vacías) y bloques `gray`.
- Bloques `gray` que aguantan 2 golpes. Tras el primer golpe se dibujan atenuados por código (`globalAlpha`) y suena `ball-bounce.mp3`. El segundo golpe los rompe con `break-sound.mp3` y su explosión.
- Velocidad de la pelota por nivel: 380, 418, 456, 494 y 532 px/s.
- Al romper el último bloque de un nivel que no es el 5 y terminar su explosión, aparece el overlay "Nivel N" con la pelota pegada al paddle. `Espacio` o clic lo lanzan y empieza el nivel.
- Al limpiar el nivel 5 y terminar su explosión, aparece "Victoria".
- Las vidas se conservan al cambiar de nivel. Con 0 vidas aparece "Game over" y el reinicio vuelve al nivel 1 con 3 vidas.
- HUD con el nivel actual: "Nivel: N / 5".
- Cambios solo en `game.js`. `assets/spritesheet.js` y `index.html` no se modifican.

**Fuera de alcance (para specs futuras):**

- Niveles aleatorios o generados por código; niveles infinitos.
- Bloques de 3 o más golpes, bloques indestructibles y sprites de daño propios para `gray`.
- Frames de explosión propios para `gray`: se usan los de `red`, que son un placeholder (ver SPEC 02).
- Puntuación y récord.
- Power-ups, paddle más pequeño y cualquier otra mecánica de dificultad.
- Guardar el progreso o elegir nivel desde un menú.
- Cuenta atrás automática entre niveles.

---

## Modelo de datos

Se sustituyen `BALL_SPEED` y `BRICK_COLORS` por una tabla de niveles y una leyenda de mapa. Todo vive en `game.js`:

```js
// Leyenda de los mapas: una letra por celda, '.' es hueco.
const LEGEND = {
  r: 'red', y: 'yellow', c: 'cyan', m: 'magenta', h: 'hotpink', g: 'green',
  X: 'gray', // 2 golpes
};
const GRAY_HP = 2;

const LEVELS = [
  { speed: 380, map: [ /* 12 caracteres por fila, 6 a 8 filas */ ] },
  // ...5 entradas
];

const state = {
  status: 'ready', // 'ready' | 'playing' | 'paused' | 'clearing' | 'intro' | 'gameover' | 'won'
  level: 1,        // 1..LEVELS.length
  // ...resto igual que en las SPEC 01 y 02
  bricks: [ /* { x, y, w, h, color, alive, hp } */ ],
};
```

Convenciones:

- Cada fila del mapa mide exactamente `COLS` (12) caracteres. La fila `r` del mapa va en `y = BRICK_OFFSET_Y + r * (BRICK_H + BRICK_GAP)`, igual que ahora.
- `hp` es 1 en los bloques de color y `GRAY_HP` en los `gray`. Cada golpe resta 1 y el bloque se rompe al llegar a 0.
- Un bloque `gray` con `hp < GRAY_HP` se dibuja con `ctx.globalAlpha = 0.6`, restaurando `1` después.
- `intro` es el estado entre el fin de la explosión del último bloque y el lanzamiento del nivel siguiente. En él la pelota sigue al paddle y `Espacio` o clic la lanzan directamente.
- La velocidad activa es `LEVELS[state.level - 1].speed` y sustituye a `BALL_SPEED` tanto en el lanzamiento como en el rebote del paddle.
- Los 5 mapas (`.` hueco, `X` gray):

```
Nivel 1 (72 bloques, 380 px/s)   Nivel 2 (36 bloques, 418 px/s)
rrrrrrrrrrrr                     r.r.r.r.r.r.
yyyyyyyyyyyy                     .y.y.y.y.y.y
cccccccccccc                     c.c.c.c.c.c.
mmmmmmmmmmmm                     .m.m.m.m.m.m
hhhhhhhhhhhh                     h.h.h.h.h.h.
gggggggggggg                     .g.g.g.g.g.g

Nivel 3 (54 bloques, 456 px/s)   Nivel 4 (72 bloques, 494 px/s)
.....XX.....                     X..........X
....rrrr....                     XrrrrrrrrrrX
...yyyyyy...                     XyyyyyyyyyyX
..cccccccc..                     X.cccccccc.X
.mmmmmmmmmm.                     XmmmmmmmmmmX
hhhhhhhhhhhh                     XhhhhhhhhhhX
gggggggggggg                     XggggggggggX

Nivel 5 (78 bloques, 532 px/s)
XXXXXXXXXXXX
rrrrrrrrrrrr
y.yy.yy.yy.y
cccccccccccc
m.mm.mm.mm.m
hhhhhhhhhhhh
X..........X
gggggggggggg
```

- El nivel 1 es idéntico al nivel único de la SPEC 01. Los niveles 3, 4 y 5 usan 2, 14 y 14 bloques `gray`; el nivel 2 no usa ninguno.

---

## Plan de implementación

1. Datos por nivel sin cambiar el juego: añadir `LEGEND`, `LEVELS` (solo con el nivel 1), `state.level = 1` y un helper `ballSpeed()`. `createBricks()` pasa a leer `LEVELS[state.level - 1].map` y añade `hp`. Eliminar `BALL_SPEED` y `BRICK_COLORS`. Añadir al HUD "Nivel: 1 / 5". Prueba: el juego se comporta exactamente como antes, con los mismos 72 bloques.
2. Bloques `gray`: soportar `X` en el mapa con `hp = GRAY_HP`. En `bounceOffBricks`, un golpe resta `hp`; si queda más de 0, el bloque sigue vivo, rebota y suena `ball-bounce.mp3`; si llega a 0, hace lo de hoy (explosión y `break-sound.mp3`). Dibujar atenuado el `gray` dañado. Prueba: cambiar temporalmente `state.level` inicial a 3 con el mapa del nivel 3 añadido en `LEVELS`, y comprobar que el `gray` aguanta 2 golpes. Revertir el cambio temporal.
3. Progresión: añadir los niveles 2 a 5 a `LEVELS` con sus mapas y velocidades. Añadir el estado `intro`. Al terminar `clearing`, si `state.level < LEVELS.length`, incrementar `state.level`, regenerar los bloques, dejar la pelota pegada, pasar a `intro` y dibujar el overlay "Nivel N" con la pista "Espacio o clic para empezar". Si es el último nivel, pasar a `won` como hoy. `launchBall` acepta `intro` y lanza la pelota. Prueba: se encadenan los niveles 1 a 5 y tras el último aparece Victoria.
4. Reinicio: `restartGame()` vuelve a `state.level = 1` antes de crear los bloques, y `Game over` restaura 3 vidas. Las vidas no se tocan al cambiar de nivel. Prueba: perder todas las vidas en el nivel 3 y reiniciar deja nivel 1 con 3 vidas y 72 bloques.

---

## Criterios de aceptación

- [ ] `index.html` carga sin errores en la consola y la partida completa de 5 niveles no genera ningún error.
- [ ] La partida empieza en el nivel 1 con 72 bloques, igual que antes, y el HUD muestra "Nivel: 1 / 5".
- [ ] Cada nivel muestra el número de bloques indicado: 72, 36, 54, 72 y 78.
- [ ] Las disposiciones de los niveles 2 a 5 coinciden con los mapas de esta spec, con sus huecos y bloques `gray` en las celdas indicadas.
- [ ] Un bloque `gray` no desaparece al primer golpe, rebota la pelota y suena `ball-bounce.mp3`.
- [ ] Tras el primer golpe el bloque `gray` se ve atenuado.
- [ ] Un bloque `gray` desaparece al segundo golpe, suena `break-sound.mp3` y se ve su explosión.
- [ ] Los bloques de color siguen rompiéndose de un golpe.
- [ ] La velocidad de la pelota es constante dentro de cada nivel y vale 380, 418, 456, 494 y 532 px/s en los niveles 1 a 5.
- [ ] Al romper el último bloque de los niveles 1 a 4, se ve la explosión completa y después aparece el overlay "Nivel N+1" con la pelota pegada al paddle.
- [ ] En el overlay de nivel, `Espacio` o clic lanzan la pelota y el nivel empieza sin overlay.
- [ ] Perder una vida no cambia el nivel ni sus bloques, y las vidas que quedan pasan al nivel siguiente.
- [ ] Al romper el último bloque del nivel 5 y terminar su explosión, aparece "Victoria".
- [ ] Tras "Victoria" o "Game over", `Espacio` o clic reinician en el nivel 1 con 3 vidas y 72 bloques.
- [ ] `P` sigue pausando y reanudando durante los niveles, y no hace nada en el overlay de nivel.

---

## Decisiones

- **Sí:** 5 niveles finitos. Da una meta clara, permite ajustar la dificultad a mano y no exige una fórmula con tope.
- **No:** niveles infinitos. Necesitan una fórmula de dificultad y nunca hay Victoria.
- **Sí:** subir la dificultad con velocidad, disposición y bloques `gray` a la vez. Es lo que pidió el usuario y las tres mecánicas son pequeñas sobre la base actual.
- **No:** paddle más pequeño. Se descartó para no sumar una cuarta palanca de dificultad.
- **Sí:** velocidad +10% lineal (paso de 38 px/s) en una tabla `LEVELS`. Se ve la subida sin dejar la pelota injugable, y el valor de cada nivel queda explícito.
- **No:** +5% (casi no se nota) y +15% (en el nivel 5 la pelota iría a ~600 px/s y el tunneling empieza a ser un riesgo).
- **Sí:** los mapas se guardan como filas de texto con una leyenda. Se leen y editan a ojo, y añadir un nivel no toca la lógica.
- **No:** mapas como matrices de números o generados por código. Son difíciles de revisar.
- **Sí:** `gray` con 2 golpes y daño atenuado con `globalAlpha`. Solo existe un sprite `gray`, así que el daño se muestra por código sin tocar el spritesheet.
- **No:** `gray` de 3 golpes o indestructible. Exigen más estados y sprites, y un bloque indestructible podría bloquear el nivel.
- **Sí:** explosión de `gray` con los frames de `red`. Es el placeholder que ya documenta la SPEC 02 y evita trabajo de arte.
- **Sí:** overlay "Nivel N" y espera de `Espacio` o clic entre niveles. Da un respiro al jugador y reutiliza la mecánica de lanzamiento.
- **No:** paso inmediato ni cuenta atrás. El primero no avisa del cambio y la segunda añade un temporizador.
- **Sí:** `Espacio` o clic en `intro` lanzan la pelota directamente, en un solo gesto. Un paso extra tras el overlay sería fricción.
- **Sí:** las vidas se conservan entre niveles y Game over reinicia en el nivel 1. Mantiene la tensión de una partida completa.
- **No:** restaurar vidas por nivel ni repetir el nivel alcanzado. Quitan riesgo a los niveles finales.
- **Sí:** el nivel 1 es idéntico al juego actual. Evita regresiones en la base ya verificada.
- **Sí:** la propuesta de los 5 mapas la hizo Claude, a pedido del usuario, y queda sujeta a su revisión al aprobar la spec.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| A 532 px/s el avance por frame crece y la pelota podría atravesar bloques | A ~60 fps avanza ~9 px por frame. Con `dt` limitado a 50 ms el máximo es ~27 px, menor que el alto del bloque (28 px). Se verifica jugando el nivel 5. |
| Un mapa con una fila mal escrita (≠ 12 caracteres) rompe el nivel | `createBricks()` solo lee los primeros `COLS` caracteres y las celdas ausentes quedan como hueco. Se verifica el recuento de bloques de cada nivel en los criterios. |
| Un nivel queda injugable por una zona inalcanzable | Todos los mapas tienen la fila inferior completa o abierta y ningún bloque indestructible, así que todo se rompe desde abajo. Se verifica jugando cada nivel. |
| `intro` no se contempla en pausa, lanzamiento o reinicio | `togglePause` solo actúa en `playing` y `paused`, así que `intro` la ignora. `launchBall` incorpora `intro` explícitamente en el paso 3. |
| El `gray` atenuado se confunde con un bloque de otro color | Mantiene su sprite gris y solo baja la opacidad. Si no se distingue, se ajusta el valor `0.6` en otra spec. |
| El overlay "Nivel N" tapa el mapa nuevo | Es un overlay semitransparente, como los de Game over y Pausa. El jugador ve el mapa tras él. |

---

## Qué **no** está en esta spec

- Niveles aleatorios, infinitos o con editor.
- Bloques de 3 o más golpes, bloques indestructibles y sprites de daño propios.
- Frames de explosión propios para `gray`.
- Puntuación, récord y guardado de progreso.
- Power-ups, paddle variable y otras mecánicas de dificultad.
- Menú de inicio, selector de nivel, cuenta atrás y soporte móvil.

Cada uno, si se hace, va en su propia spec.
