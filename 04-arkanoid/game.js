const W = 800, H = 600;
const COLS = 12, ROWS = 6;
const BRICK_W = 56, BRICK_H = 28, BRICK_GAP = 4;
const BRICK_OFFSET_X = 42, BRICK_OFFSET_Y = 60;
const BRICK_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']; // una por fila, de arriba abajo
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 500; // px/s
const BALL_SIZE = 16, BALL_SPEED = 380; // px/s
const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; // respecto a la vertical
const START_LIVES = 3;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const state = {
  status: 'ready', // 'ready' | 'playing' | 'paused' | 'gameover' | 'won'
  lives: START_LIVES,
  paddle: { x: (W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
};

let lastTime = 0;
const keys = new Set();

function clampPaddle() {
  const p = state.paddle;
  p.x = Math.max(0, Math.min(W - p.w, p.x));
}

document.addEventListener('keydown', (e) => keys.add(e.code));
document.addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (W / rect.width);
  state.paddle.x = mouseX - state.paddle.w / 2;
  clampPaddle();
});

function update(dt) {
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  state.paddle.x += (right - left) * PADDLE_SPEED * dt;
  clampPaddle();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
});
