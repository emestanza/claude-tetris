const W = 800, H = 600;
const COLS = 12, ROWS = 6;
const BRICK_W = 56, BRICK_H = 28, BRICK_GAP = 4;
const BRICK_OFFSET_X = 42, BRICK_OFFSET_Y = 60;
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 500; // px/s
const BALL_SIZE = 16; // px
const MAX_BOUNCE_ANGLE = 60 * Math.PI / 180; // respecto a la vertical
const START_LIVES = 3;

// Leyenda de los mapas: una letra por celda, '.' es hueco.
const LEGEND = {
  r: 'red', y: 'yellow', c: 'cyan', m: 'magenta', h: 'hotpink', g: 'green',
  X: 'gray', // 2 golpes
};
const GRAY_HP = 2;

const LEVELS = [
  {
    speed: 380, // px/s
    map: [
      'rrrrrrrrrrrr',
      'yyyyyyyyyyyy',
      'cccccccccccc',
      'mmmmmmmmmmmm',
      'hhhhhhhhhhhh',
      'gggggggggggg',
    ],
  },
  {
    speed: 418,
    map: [
      'r.r.r.r.r.r.',
      '.y.y.y.y.y.y',
      'c.c.c.c.c.c.',
      '.m.m.m.m.m.m',
      'h.h.h.h.h.h.',
      '.g.g.g.g.g.g',
    ],
  },
  {
    speed: 456,
    map: [
      '.....XX.....',
      '....rrrr....',
      '...yyyyyy...',
      '..cccccccc..',
      '.mmmmmmmmmm.',
      'hhhhhhhhhhhh',
      'gggggggggggg',
    ],
  },
  {
    speed: 494,
    map: [
      'X..........X',
      'XrrrrrrrrrrX',
      'XyyyyyyyyyyX',
      'X.cccccccc.X',
      'XmmmmmmmmmmX',
      'XhhhhhhhhhhX',
      'XggggggggggX',
    ],
  },
  {
    speed: 532,
    map: [
      'XXXXXXXXXXXX',
      'rrrrrrrrrrrr',
      'y.yy.yy.yy.y',
      'cccccccccccc',
      'm.mm.mm.mm.m',
      'hhhhhhhhhhhh',
      'X..........X',
      'gggggggggggg',
    ],
  },
];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const state = {
  status: 'ready', // 'ready' | 'playing' | 'paused' | 'clearing' | 'intro' | 'gameover' | 'won'
  level: 1, // 1..LEVELS.length
  lives: START_LIVES,
  paddle: { x: (W - PADDLE_W) / 2, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, stuck: true }, // stuck: sigue al paddle
  bricks: [], // { x, y, w, h, color, alive, hp }
  explosions: [], // { x, y, w, h, color, elapsed }, elapsed en ms
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

function ballSpeed() {
  return LEVELS[state.level - 1].speed;
}

function createBricks() {
  const bricks = [];
  const { map } = LEVELS[state.level - 1];
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < COLS; c++) {
      const color = LEGEND[map[r][c]];
      if (!color) continue; // '.' o celda ausente: hueco
      bricks.push({
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_GAP),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        color,
        alive: true,
        hp: color === 'gray' ? GRAY_HP : 1,
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
    brick.hp--;
    if (brick.hp <= 0) {
      brick.alive = false;
      state.explosions.push({ x: brick.x, y: brick.y, w: brick.w, h: brick.h, color: brick.color, elapsed: 0 });
      playSound(breakSound);
    } else {
      playSound(bounceSound);
    }
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
  state.level = 1;
  state.bricks = createBricks();
  state.explosions = [];
  state.status = 'ready';
  stickBall();
}

function launchBall() {
  if (state.status === 'gameover' || state.status === 'won') {
    restartGame();
    return;
  }
  if (state.status !== 'ready' && state.status !== 'intro') return;
  const { ball } = state;
  ball.stuck = false;
  ball.vx = ballSpeed() * Math.sin(LAUNCH_ANGLE);
  ball.vy = -ballSpeed() * Math.cos(LAUNCH_ANGLE);
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
  for (const explosion of state.explosions) explosion.elapsed += dt * 1000;
  state.explosions = state.explosions.filter((explosion) => explosion.elapsed < EXPLOSION_DURATION);

  // Último bloque destruido: la pelota queda quieta hasta que acabe su explosión.
  if (state.status === 'clearing') {
    if (state.explosions.length === 0) {
      if (state.level < LEVELS.length) {
        state.level++;
        state.bricks = createBricks();
        state.status = 'intro';
      } else {
        state.status = 'won';
      }
      stickBall();
    }
    return;
  }

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
    state.status = 'clearing';
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
    ball.vx = ballSpeed() * Math.sin(angle);
    ball.vy = -ballSpeed() * Math.cos(angle);
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
    if (!brick.alive) continue;
    // El gray dañado se dibuja atenuado.
    ctx.globalAlpha = brick.color === 'gray' && brick.hp < GRAY_HP ? 0.6 : 1;
    drawSprite(ctx, 'block_' + brick.color, brick.x, brick.y, brick.w, brick.h);
  }
  ctx.globalAlpha = 1;
  for (const explosion of state.explosions) {
    const frame = Math.min(3, Math.floor(explosion.elapsed / EXPLOSION_DURATION * 4));
    drawFrame(ctx, EXPLOSION_FRAMES[explosion.color][frame], explosion.x, explosion.y, explosion.w, explosion.h);
  }
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
  const b = state.ball;
  drawSprite(ctx, 'ball', b.x, b.y, b.size, b.size);

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Vidas: ' + state.lives, 20, 32);
  ctx.textAlign = 'right';
  ctx.fillText('Nivel: ' + state.level + ' / ' + LEVELS.length, W - 20, 32);

  if (state.status === 'gameover') drawOverlay('Game over');
  if (state.status === 'won') drawOverlay('Victoria');
  if (state.status === 'intro') drawOverlay('Nivel ' + state.level, 'Espacio o clic para empezar');
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
