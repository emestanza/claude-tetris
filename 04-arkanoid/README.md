# Arkanoid

Juego de Arkanoid hecho con HTML, CSS y JavaScript puro: cero dependencias, sin build, y se juega directamente en el navegador.

## Cómo jugar

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8000   # y visita http://localhost:8000
```

| Acción | Control |
| --- | --- |
| Mover el paddle | `←` `→` o `A` `D`, o el ratón |
| Lanzar la pelota / reiniciar | `Espacio` o clic |
| Pausa | `P` |

## Características

- 5 niveles con disposiciones distintas y pelota más rápida en cada uno.
- Bloques `gray` que aguantan 2 golpes.
- Animación de explosión al romper bloques y efectos de sonido.
- 3 vidas, pantallas de "Game over" y "Victoria".

## Desarrollo

El proyecto sigue Spec-Driven Development: cada funcionalidad se define en `specs/` y se implementa con `/spec-impl <NN-spec>`. Ver `CLAUDE.md` para el flujo y la arquitectura.

| Spec | Descripción | Estado |
| --- | --- | --- |
| 01 | MVP jugable | Implementado |
| 02 | Animación de explosión de bloques | Implementado |
| 03 | Niveles con dificultad creciente | Implementado |
