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
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, stuck: true }, // stuck: sigue al paddle
  bricks: [], // { x, y, w, h, color, alive }
};

const bounceSound = new Audio('assets/sounds/ball-bounce.mp3');
const breakSound = new Audio('assets/sounds/break-sound.mp3');

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {}); // el navegador puede rechazarlo antes de una interacción
}

const LAUNCH_ANGLE = 30 * Math.PI / 180; // respecto a la vertical, hacia la derecha

let lastTime = 0;
const keys = new Set();

function clampPaddle() {
  const p = state.paddle;
  p.x = Math.max(0, Math.min(W - p.w, p.x));
}

function createBricks() {
  const bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_GAP),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        color: BRICK_COLORS[r],
        alive: true,
      });
    }
  }
  return bricks;
}

function bounceOffBricks() {
  const { ball } = state;
  for (const brick of state.bricks) {
    if (
      !brick.alive ||
      ball.x + ball.size <= brick.x || ball.x >= brick.x + brick.w ||
      ball.y + ball.size <= brick.y || ball.y >= brick.y + brick.h
    ) continue;
    brick.alive = false;
    playSound(breakSound);
    // El eje de menor penetración decide si el golpe es lateral o vertical.
    const overlapX = Math.min(ball.x + ball.size - brick.x, brick.x + brick.w - ball.x);
    const overlapY = Math.min(ball.y + ball.size - brick.y, brick.y + brick.h - ball.y);
    const fromLeft = ball.x + ball.size / 2 < brick.x + brick.w / 2;
    const fromTop = ball.y + ball.size / 2 < brick.y + brick.h / 2;
    if (overlapX < overlapY) {
      ball.vx = fromLeft ? -Math.abs(ball.vx) : Math.abs(ball.vx);
      ball.x += fromLeft ? -overlapX : overlapX;
    } else {
      ball.vy = fromTop ? -Math.abs(ball.vy) : Math.abs(ball.vy);
      ball.y += fromTop ? -overlapY : overlapY;
    }
    return;
  }
}

function stickBall() {
  const { paddle, ball } = state;
  ball.stuck = true;
  ball.vx = 0;
  ball.vy = 0;
  ball.x = paddle.x + (paddle.w - ball.size) / 2;
  ball.y = paddle.y - ball.size;
}

function restartGame() {
  state.lives = START_LIVES;
  state.bricks = createBricks();
  state.status = 'ready';
  stickBall();
}

function launchBall() {
  if (state.status === 'gameover' || state.status === 'won') {
    restartGame();
    return;
  }
  if (state.status !== 'ready') return;
  const { ball } = state;
  ball.stuck = false;
  ball.vx = BALL_SPEED * Math.sin(LAUNCH_ANGLE);
  ball.vy = -BALL_SPEED * Math.cos(LAUNCH_ANGLE);
  state.status = 'playing';
}

function togglePause() {
  if (state.status === 'playing') state.status = 'paused';
  else if (state.status === 'paused') state.status = 'playing';
}

document.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyP') togglePause();
  if (e.code === 'Space') {
    e.preventDefault();
    launchBall();
  }
});
document.addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('click', launchBall);

canvas.addEventListener('mousemove', (e) => {
  if (state.status === 'paused') return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (W / rect.width);
  state.paddle.x = mouseX - state.paddle.w / 2;
  clampPaddle();
});

function update(dt) {
  if (state.status === 'paused') return;
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  state.paddle.x += (right - left) * PADDLE_SPEED * dt;
  clampPaddle();

  const { ball } = state;
  if (ball.stuck) {
    stickBall();
    return;
  }
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    playSound(bounceSound);
  } else if (ball.x + ball.size > W) {
    ball.x = W - ball.size;
    ball.vx = -Math.abs(ball.vx);
    playSound(bounceSound);
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    playSound(bounceSound);
  }
  bounceOffBricks();
  if (state.bricks.every((brick) => !brick.alive)) {
    state.status = 'won';
    stickBall();
    return;
  }

  const paddle = state.paddle;
  if (
    ball.vy > 0 &&
    ball.x + ball.size > paddle.x && ball.x < paddle.x + paddle.w &&
    ball.y + ball.size > paddle.y && ball.y < paddle.y + paddle.h
  ) {
    const hit = (ball.x + ball.size / 2 - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    const angle = Math.max(-1, Math.min(1, hit)) * MAX_BOUNCE_ANGLE;
    ball.vx = BALL_SPEED * Math.sin(angle);
    ball.vy = -BALL_SPEED * Math.cos(angle);
    ball.y = paddle.y - ball.size;
    playSound(bounceSound);
  }
  if (ball.y > H) {
    state.lives--;
    state.status = state.lives > 0 ? 'ready' : 'gameover';
    stickBall();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (const brick of state.bricks) {
    if (brick.alive) drawSprite(ctx, 'block_' + brick.color, brick.x, brick.y, brick.w, brick.h);
  }
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
  const b = state.ball;
  drawSprite(ctx, 'ball', b.x, b.y, b.size, b.size);

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Vidas: ' + state.lives, 20, 32);

  if (state.status === 'gameover') drawOverlay('Game over');
  if (state.status === 'won') drawOverlay('Victoria');
  if (state.status === 'paused') drawOverlay('Pausa', 'P para reanudar');
}

function drawOverlay(title, hint = 'Espacio o clic para reiniciar') {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(title, W / 2, H / 2);
  ctx.font = '20px sans-serif';
  ctx.fillText(hint, W / 2, H / 2 + 40);
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

state.bricks = createBricks();

loadSpritesheet(() => {
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
});
