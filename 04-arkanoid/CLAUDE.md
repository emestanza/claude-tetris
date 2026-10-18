# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope of this directory

`04-arkanoid/` is a sub-project inside the Tetris repo (`/var/www/claude-tetris`, whose root `CLAUDE.md` describes the Tetris game: `game.js`, `index.html`, `style.css`). Nothing in the root applies to Arkanoid code except the shared conventions: vanilla HTML/CSS/JS, HTML5 Canvas, zero dependencies, no build step, no `package.json`, no test tooling.

The README (in Spanish) states the goal: an Arkanoid game with plain HTML, CSS and JavaScript. **The game itself is not implemented yet** — there is no `index.html`, `game.js` or `style.css` here, only assets and a README. Run it (once it exists) by opening `index.html` or serving the folder with `python3 -m http.server 8000`; verify by playing it, as there are no automated tests.

## Assets (already provided)

- `assets/assets/spritesheet-breakout.png` (559×337 RGBA) — single spritesheet for paddle, ball, blocks and explosion frames.
- `assets/assets/spritesheet.js` — plain-script (non-module) helper that defines globals: `SPRITES` (source rects for `paddle`, `ball`, and `blocks` by color: gray, red, yellow, cyan, magenta, hotpink, green), `EXPLOSION_FRAMES` (4 frames per color) and `EXPLOSION_DURATION` (150 ms), plus `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)` (block names are prefixed `block_`, e.g. `block_red`) and `drawFrame(ctx, frame, x, y, w, h)`. Drawing is a no-op until `loadSpritesheet`'s callback has fired, so start the game loop from that callback.
- `assets/assets/sounds/ball-bounce.mp3`, `break-sound.mp3` — sound effects.
- Gotchas:
  - The zip was extracted into a doubled path (`assets/assets/...`), and `assets/__MACOSX/` and `.DS_Store` files are macOS junk. `spritesheet.js` loads the PNG via the hard-coded relative URL `assets/spritesheet-breakout.png` (relative to the HTML page), so either flatten the folders (move `assets/assets/*` up one level) or change that URL; don't just reference the files at their current nested path without fixing it.
  - In `EXPLOSION_FRAMES`, the `gray` entry reuses the `red` frames (same coordinates); this appears to be a placeholder, not a distinct sprite.
  - `spritesheet.js` copies the PNG to an offscreen canvas on load; if you serve it from `file://`, `getImageData`-style reads would taint the canvas, but plain `drawImage` works.

## Project tooling

- `.claude/skills/spec-impl/SKILL.md` — `/spec-impl <NN-spec-name>` implements an approved spec from `specs/` (this directory; the folder does not exist yet). It only proceeds if the spec's status line means "Approved" (any language), creates branch `spec-NN-slug` (controlled by `specs/.spec-config.yml` → `AutoCreateBranch`), and implements one plan step at a time, pausing for diff review. It never commits automatically and must follow the spec exactly rather than improvising.
- `.claude/skills/neko/SKILL.md` — `/neko` makes replies terse and cat-like (Spanish); only applies when invoked.
- Specs are expected to have: an objective, a scope section, a numbered implementation plan, and an acceptance-criteria checklist. If a task refers to a spec, look in `specs/` first.
