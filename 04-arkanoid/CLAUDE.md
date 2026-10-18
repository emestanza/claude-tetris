# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope of this directory

`04-arkanoid/` is a sub-project inside the Tetris repo (`/var/www/claude-tetris`, whose root `CLAUDE.md` describes the Tetris game). Nothing in the root applies to Arkanoid code except the shared conventions: vanilla HTML/CSS/JS, HTML5 Canvas, zero dependencies, no build step, no `package.json`, no test tooling.

Arkanoid is built with **Spec-Driven Development (SDD)**: every feature starts as a spec in `specs/`, is approved by a human, and is then implemented step by step. Specs and commit messages are written in Spanish and English respectively (see below); the README is in Spanish.

## Running / testing

```bash
xdg-open index.html          # open directly
python3 -m http.server 8000  # or serve the folder, then visit localhost:8000
```

There are no automated tests. Verify by playing: launch the ball (`Space`/click), move the paddle, break bricks (including two-hit gray ones), lose a life, clear a level, reach "Victoria", get "Game over", restart, pause with `P`. Each spec's **Criterios de aceptación** checklist is the source of truth for what to verify.

## Spec-driven workflow

### Specs (`specs/NN-slug.md`)

Numbered, written in Spanish. Header block:

```
# SPEC NN — Title
> **Status:** Borrador | En revisión | Aprobado | Implementado | Obsoleto
> **Depends on:** SPEC XX | ninguna
> **Date:** YYYY-MM-DD
> **Objective:** one sentence
```

Sections, in order: `## Alcance` (Dentro / Fuera de alcance), `## Modelo de datos`, `## Plan de implementación` (numbered steps), `## Criterios de aceptación` (checklist), `## Decisiones`, `## Riesgos`, `## Qué **no** está en esta spec`.

Status lifecycle: Draft → In review → **Approved** (set by the human only) → **Implemented** (set after all acceptance criteria are verified, in a `docs(arkanoid): mark spec NN as implemented` commit).

Existing specs: `01-arkanoid-mvp` (playable single level), `02-brick-explosion-animation`, `03-levels-and-difficulty` (all Implemented). New work = new spec; do not widen an existing one's scope in code.

### Implementing a spec

- `/spec-impl <NN-spec-name>` (`.claude/skills/spec-impl/SKILL.md`) is the entry point. It only proceeds when the spec's status means "Approved" (any language), creates branch `spec-NN-slug` (controlled by `specs/.spec-config.yml` → `AutoCreateBranch`), shows the spec summary, then implements **one plan step at a time**, pausing for diff review.
- Follow the spec exactly. If something looks suboptimal, mention it as an observation; changes go into the spec, not into the code by surprise. Ambiguities: stop, present 2–3 options, wait.
- Out-of-scope requests: point out they're out of scope and suggest a future spec.
- Never commit automatically; commit only when the user asks.

### Git conventions

- Branch per spec (`spec-NN-slug`), sometimes per step (`spec-NN-step-0X`), merged to `main` via PR.
- Conventional commits in English with the spec and step in the scope line, e.g. `feat(arkanoid): two-hit gray bricks with damage tint (spec 03, step 2)`, `docs(arkanoid): add spec 03, levels and difficulty`.
- Spec edits (status changes, corrections) are `docs(arkanoid): ...` commits.

## Architecture

Three files plus assets: `index.html` (800×600 `<canvas id="board">`, loads `assets/spritesheet.js` then `game.js`), `style.css`, and `game.js` (single script, no modules, ~350 lines).

`game.js` layout:

- **Constants and data** (top): `W/H`, brick grid (`COLS`, `BRICK_*`), paddle/ball sizes, `START_LIVES`, `LEGEND` (map letter → color; `X` = gray, `.` = gap), `GRAY_HP`, and `LEVELS` — an array of `{ speed, map }` where `map` is rows of up to 12 chars. Adding or tuning a level means editing `LEVELS` only.
- **`state`**: single object — `status`, `level`, `lives`, `paddle`, `ball` (`stuck` = follows paddle), `bricks` (`{x,y,w,h,color,alive,hp}`), `explosions` (`{x,y,w,h,color,elapsed}` in ms).
- **Status machine**: `ready` (ball stuck, before launch) → `playing` ⇄ `paused` (`P`); last brick destroyed → `clearing` (ball frozen until explosions finish) → `intro` (next level overlay, `Space`/click to start) or `won` after the last level; 0 lives → `gameover`. `gameover`/`won` + `Space`/click → `restartGame()` (level 1, 3 lives).
- **Loop**: `loop(time)` → `update(dt)` + `draw()` every `requestAnimationFrame`; `dt` capped at 0.05 s. Started from the `loadSpritesheet` callback because drawing is a no-op until the sheet loads.
- **Collisions**: walls/ceiling inline in `update`; `bounceOffBricks()` (min-penetration axis decides side vs. vertical hit, decrements `hp`, one brick per frame); paddle bounce angle depends on hit point (±`MAX_BOUNCE_ANGLE`), speed always `ballSpeed()` of the current level.
- **Input**: `keydown`/`keyup` with `e.code` (`ArrowLeft/Right` or `KeyA/D` move, `Space` launch/restart, `KeyP` pause), `click` on canvas launches, `mousemove` positions the paddle (scaled by canvas CSS size).
- **Rendering**: bricks (gray with `hp < GRAY_HP` drawn at `globalAlpha` 0.6) → explosions (frame = elapsed / `EXPLOSION_DURATION` × 4) → paddle → ball → HUD ("Vidas", "Nivel: N / 5") → `drawOverlay()` for `gameover`/`won`/`intro`/`paused`.
- **Audio**: `playSound()` resets and plays; `.play()` rejections are swallowed (autoplay policy). Bounce sound for walls/paddle/damaged gray; break sound when a brick dies.

## Assets

- `assets/spritesheet-breakout.png` (559×337 RGBA) — one spritesheet for paddle, ball, blocks and explosion frames.
- `assets/spritesheet.js` — plain-script helper defining globals `SPRITES`, `EXPLOSION_FRAMES` (4 frames per color), `EXPLOSION_DURATION` (150 ms), `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)` (blocks are `block_<color>`) and `drawFrame(ctx, frame, x, y, w, h)`. **Do not modify it** unless a spec says so.
- `assets/sounds/ball-bounce.mp3`, `break-sound.mp3`.
- `EXPLOSION_FRAMES.gray` reuses the `red` frames — a known placeholder, not a distinct sprite.
- Colors: gray, red, yellow, cyan, magenta, hotpink, green.

## Other tooling

- `.claude/skills/neko/SKILL.md` — `/neko` makes replies terse and cat-like (Spanish); only applies when invoked.
- `README.md` (Spanish) documents controls, features and the spec status table; update the table when a spec is marked Implemented.
