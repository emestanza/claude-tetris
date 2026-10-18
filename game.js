'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const BOMB_TYPE = 8;
const BOMB_CHANCE = 0.06;
const BOMB_CELL_SCORE = 10;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#64b5f6', // J - pale blue
  '#ffb74d', // L - orange
  '#ff5252', // bomb
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8]],                                       // bomb
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const GRID_COLORS = { dark: '#22222e', light: '#d8d8e4' };

// Softer palette used by the "pastel" skin, index-aligned with COLORS.
const PASTEL_COLORS = [
  null,
  '#aee6ef', // I
  '#fdeaa8', // O
  '#d9bfec', // T
  '#bfe6bd', // S
  '#f2b8b8', // Z
  '#b9d6f5', // J
  '#f7cfa0', // L
  '#f5a9a9', // bomb
];

const SKINS = ['retro', 'neon', 'pastel', 'pixel'];
const SKIN_PALETTES = { retro: COLORS, neon: COLORS, pastel: PASTEL_COLORS, pixel: COLORS };
const NEON_BG = '#05050d';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');
const skinSelect = document.getElementById('skin-select');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, explosionFx;
let theme = localStorage.getItem('tetris-theme') === 'light' ? 'light' : 'dark';
let skin = SKINS.includes(localStorage.getItem('tetris-skin')) ? localStorage.getItem('tetris-skin') : 'retro';

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.random() < BOMB_CHANCE ? BOMB_TYPE : Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function explodeBomb() {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nx = current.x + dc;
      const ny = current.y + dr;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (board[ny][nx]) {
        board[ny][nx] = 0;
        score += BOMB_CELL_SCORE;
      }
    }
  }
  explosionFx = { x: current.x, y: current.y, ttl: 250, max: 250 };
  updateHUD();
}

function lockPiece() {
  if (current.type === BOMB_TYPE) {
    explodeBomb();
  } else {
    merge();
  }
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

// Draws a rounded-rect path into `context`, feature-detecting the native
// ctx.roundRect and falling back to a manual arc-based path otherwise.
function roundRectPath(context, x, y, w, h, r) {
  context.beginPath();
  if (typeof context.roundRect === 'function') {
    context.roundRect(x, y, w, h, r);
    return;
  }
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

// Draws a small checker/noise texture over a block for the "pixel" skin.
function drawPixelTexture(context, px, py, w) {
  const cell = Math.max(2, Math.floor(w / 5));
  let row = 0;
  for (let yy = 0; yy < w; yy += cell, row++) {
    let col = 0;
    for (let xx = 0; xx < w; xx += cell, col++) {
      const light = (row + col) % 2 === 0;
      context.fillStyle = light ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.16)';
      context.fillRect(px + xx, py + yy, cell, cell);
    }
  }
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const palette = SKIN_PALETTES[skin] || COLORS;
  const color = palette[colorIndex] || COLORS[colorIndex];
  const px = x * size + 1;
  const py = y * size + 1;
  const w = size - 2;

  context.save();
  context.globalAlpha = alpha ?? 1;

  if (skin === 'neon') {
    context.shadowBlur = size * 0.5;
    context.shadowColor = color;
    context.fillStyle = color;
    context.fillRect(px, py, w, w);
    context.shadowBlur = 0;
    context.strokeStyle = 'rgba(255,255,255,0.55)';
    context.lineWidth = 1;
    context.strokeRect(px + 0.5, py + 0.5, w - 1, w - 1);
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(px, py, w, 4);
  } else if (skin === 'pastel') {
    const radius = Math.min(8, w / 3);
    roundRectPath(context, px, py, w, w, radius);
    context.fillStyle = color;
    context.fill();
    context.save();
    roundRectPath(context, px, py, w, w, radius);
    context.clip();
    context.fillStyle = 'rgba(255,255,255,0.4)';
    context.fillRect(px, py, w, 4);
    context.restore();
  } else if (skin === 'pixel') {
    context.fillStyle = color;
    context.fillRect(px, py, w, w);
    drawPixelTexture(context, px, py, w);
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(px, py, w, 4);
  } else {
    // retro (default)
    context.fillStyle = color;
    context.fillRect(px, py, w, w);
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(px, py, w, 4);
  }

  // Bomb rendering must stay consistent across every skin.
  if (colorIndex === BOMB_TYPE) {
    context.shadowBlur = 0;
    const cx = x * size + size / 2;
    const cy = y * size + size / 2;
    context.beginPath();
    context.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
    context.fillStyle = '#1a1a1a';
    context.fill();
    context.beginPath();
    context.arc(cx - size * 0.08, cy - size * 0.08, size * 0.07, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255,255,255,0.6)';
    context.fill();
  }

  context.restore();
}

function drawGrid() {
  ctx.strokeStyle = GRID_COLORS[theme];
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (skin === 'neon') {
    ctx.fillStyle = NEON_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);

  drawExplosion();
}

function drawExplosion() {
  if (!explosionFx) return;
  const { x, y, ttl, max } = explosionFx;
  const alpha = Math.max(0, ttl / max);
  const cx = (x + 0.5) * BLOCK;
  const cy = (y + 0.5) * BLOCK;
  const radius = BLOCK * 1.8 * (1 - alpha * 0.3);
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255, 220, 120, ${0.9 * alpha})`);
  gradient.addColorStop(0.5, `rgba(255, 100, 60, ${0.6 * alpha})`);
  gradient.addColorStop(1, 'rgba(255, 100, 60, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (skin === 'neon') {
    nextCtx.fillStyle = NEON_BG;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  }
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function applyTheme() {
  document.body.dataset.theme = theme;
  themeToggle.checked = theme === 'light';
  draw();
}

function toggleTheme() {
  theme = themeToggle.checked ? 'light' : 'dark';
  localStorage.setItem('tetris-theme', theme);
  applyTheme();
}

function applySkin() {
  if (skinSelect) skinSelect.value = skin;
  draw();
  drawNext();
}

function changeSkin() {
  skin = SKINS.includes(skinSelect.value) ? skinSelect.value : 'retro';
  localStorage.setItem('tetris-skin', skin);
  applySkin();
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  if (explosionFx) {
    explosionFx.ttl -= dt;
    if (explosionFx.ttl <= 0) explosionFx = null;
  }
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  explosionFx = null;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  applyTheme();
  applySkin();
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);
themeToggle.addEventListener('change', toggleTheme);
skinSelect.addEventListener('change', changeSkin);

init();
