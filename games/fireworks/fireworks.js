// ─── State ───────────────────────────────────────────────────────────────────
let playerCount = 4;
let soundOn = true;
let names = [];
let cards = [];      // {name, x, y, w, h, color, opacity, scale, shakeX, shakeTimer, alive}
let particles = [];
let rocket = null;
let stars = [];
let phase = 'idle';  // idle | launching | exploding | done
let shockwaves = [];
let animId = null;
let startTime = 0;
let resultCanvas, resultCtx, resultParticles = [], resultAnimId = null;

const COLORS = ['#c084fc','#fbbf24','#60a5fa','#4ade80','#f472b6','#f87171','#22d3ee','#fb923c'];
const CARD_W = 130, CARD_H = 56;

// ─── DOM ─────────────────────────────────────────────────────────────────────
const setupPanel  = document.getElementById('setup-panel');
const gamePanel   = document.getElementById('game-panel');
const resultPanel = document.getElementById('result-panel');
const canvas      = document.getElementById('fw-canvas');
const ctx         = canvas.getContext('2d');
const launchBtn   = document.getElementById('launch-btn');
const remainBadge = document.getElementById('remain-badge');
const loserNameEl = document.getElementById('loser-name');
const nameListEl  = document.getElementById('name-list');
const playerCountEl = document.getElementById('player-count');

document.getElementById('btn-dec').addEventListener('click', () => {
  if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; buildNameInputs(); }
});
document.getElementById('btn-inc').addEventListener('click', () => {
  if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; buildNameInputs(); }
});
document.getElementById('start-btn').addEventListener('click', startGame);

document.getElementById('batch-btn').addEventListener('click', () => {
  const val = prompt('이름을 쉼표(,)로 구분해서 입력하세요.\n예: 1,2,3,4');
  if (!val) return;
  const items = val.split(',').map(s => s.trim()).filter(Boolean);
  const count = Math.min(Math.max(items.length, 2), 8);
  playerCount = count;
  playerCountEl.textContent = count;
  buildNameInputs();
  const inputs = nameListEl.querySelectorAll('.name-input');
  items.forEach((name, i) => { if (inputs[i]) inputs[i].value = name; });
});

document.getElementById('clear-btn').addEventListener('click', () => {
  nameListEl.querySelectorAll('.name-input').forEach(inp => inp.value = '');
});

const soundToggleBtn = document.getElementById('sound-toggle');
soundToggleBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggleBtn.textContent = soundOn ? '🔊 ON' : '🔇 OFF';
  soundToggleBtn.classList.toggle('off', !soundOn);
});
launchBtn.addEventListener('click', onLaunch);
document.getElementById('again-btn').addEventListener('click', () => {
  stopResultAnim();
  resultPanel.style.display = 'none';
  resetGame();
});
document.getElementById('rename-btn').addEventListener('click', () => {
  stopResultAnim();
  showPanel('setup');
});

// ─── Setup ───────────────────────────────────────────────────────────────────
function buildNameInputs() {
  const prev = Array.from(nameListEl.querySelectorAll('.name-input')).map(i => i.value);
  nameListEl.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const inp = document.createElement('input');
    inp.className = 'name-input';
    inp.type = 'text';
    inp.placeholder = `플레이어 ${i + 1} 이름`;
    inp.maxLength = 8;
    inp.value = prev[i] || '';
    nameListEl.appendChild(inp);
  }
}
buildNameInputs();

function startGame() {
  const inputs = nameListEl.querySelectorAll('.name-input');
  names = Array.from(inputs).map((inp, i) => inp.value.trim() || `플레이어 ${i + 1}`);
  showPanel('game');
  resetGame();
}

// ─── Canvas resize ────────────────────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = (gamePanel.clientHeight - 80) * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = (gamePanel.clientHeight - 80) + 'px';
  ctx.scale(dpr, dpr);
  initStars();
  positionCards();
}

function cw() { return canvas.width / (window.devicePixelRatio || 1); }
function ch() { return canvas.height / (window.devicePixelRatio || 1); }

// ─── Stars ───────────────────────────────────────────────────────────────────
function initStars() {
  stars = [];
  for (let i = 0; i < 180; i++) {
    stars.push({
      x: Math.random() * cw(),
      y: Math.random() * ch(),
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.7 + 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.015,
    });
  }
}

// ─── Cards ───────────────────────────────────────────────────────────────────
function positionCards() {
  const alive = cards.filter(c => c.alive);
  if (!alive.length) return;
  const n = alive.length;
  const cols = Math.min(n, n <= 4 ? 2 : 3);
  const rows = Math.ceil(n / cols);
  const gapX = 14, gapY = 14;
  const totalW = cols * CARD_W + (cols - 1) * gapX;
  const totalH = rows * CARD_H + (rows - 1) * gapY;
  const startX = (cw() - totalW) / 2;
  const startY = (ch() - totalH) / 2 - 20;
  alive.forEach((c, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const offset = (cols * 2 < n && row === rows - 1) ? ((n % cols === 1 ? (CARD_W + gapX) / 2 : 0)) : 0;
    c.x = startX + col * (CARD_W + gapX) + CARD_W / 2 + offset;
    c.y = startY + row * (CARD_H + gapY) + CARD_H / 2;
  });
}

function initCards() {
  cards = names.map((name, i) => ({
    name,
    x: 0, y: 0,
    w: CARD_W, h: CARD_H,
    color: COLORS[i % COLORS.length],
    opacity: 1,
    scale: 1,
    shakeX: 0,
    shakeTimer: 0,
    bobPhase: i * 0.7,
    alive: true,
    exploding: false,
  }));
  positionCards();
}

// ─── Particles ───────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color, angle, speed, size, type = 'circle') {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.size = size;
    this.life = 1;
    this.decay = 0.011 + Math.random() * 0.016;
    this.grav = 0.13;
    this.type = type;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += this.grav;
    this.vx *= 0.975;
    this.life -= this.decay;
  }
  draw(c) {
    if (this.life <= 0) return;
    c.save();
    c.globalAlpha = Math.max(0, this.life);
    if (this.type === 'trail') {
      c.strokeStyle = this.color;
      c.lineWidth = this.size * this.life;
      c.shadowColor = this.color;
      c.shadowBlur = 6;
      c.beginPath();
      c.moveTo(this.x - this.vx * 3, this.y - this.vy * 3);
      c.lineTo(this.x, this.y);
      c.stroke();
    } else if (this.type === 'ring') {
      c.strokeStyle = this.color;
      c.lineWidth = 1.5;
      c.shadowColor = this.color;
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(this.x, this.y, this.size * (2 - this.life), 0, Math.PI * 2);
      c.stroke();
    } else {
      c.fillStyle = this.color;
      c.shadowColor = this.color;
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  get dead() { return this.life <= 0; }
}

function spawnExplosion(x, y, color) {
  const colors = [color, '#fff', '#f0e6ff', '#fbbf24'];
  for (let i = 0; i < 70; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5;
    const c = colors[Math.floor(Math.random() * colors.length)];
    const type = i < 20 ? 'trail' : i < 30 ? 'ring' : 'circle';
    particles.push(new Particle(x, y, c, angle, speed, 2 + Math.random() * 3, type));
  }
  shockwaves.push({ x, y, color, r: 5, alpha: 0.9 });
}

// ─── Rocket ───────────────────────────────────────────────────────────────────
class Rocket {
  constructor(sx, sy, tx, ty) {
    this.sx = sx; this.sy = sy;
    this.tx = tx; this.ty = ty;
    this.cpx = tx; this.cpy = Math.min(ty - 180, 30);
    this.t = 0; this.speed = 0.032;
    this.trail = [];
    this.done = false;
    this.x = sx; this.y = sy;
  }
  bezier(t) {
    return {
      x: (1-t)*(1-t)*this.sx + 2*(1-t)*t*this.cpx + t*t*this.tx,
      y: (1-t)*(1-t)*this.sy + 2*(1-t)*t*this.cpy + t*t*this.ty,
    };
  }
  update() {
    this.t = Math.min(1, this.t + this.speed);
    const p = this.bezier(this.t);
    this.trail.push({x: p.x, y: p.y});
    if (this.trail.length > 30) this.trail.shift();
    this.x = p.x; this.y = p.y;
    if (this.t >= 1) this.done = true;
  }
  draw(c) {
    this.trail.forEach((pt, i) => {
      const frac = i / this.trail.length;
      c.save();
      c.globalAlpha = frac * 0.7;
      c.fillStyle = '#f0e6ff';
      c.shadowColor = '#c084fc';
      c.shadowBlur = 10;
      c.beginPath();
      c.arc(pt.x, pt.y, frac * 3.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
    if (!this.done) {
      c.save();
      c.fillStyle = '#fff';
      c.shadowColor = '#fff';
      c.shadowBlur = 20;
      c.beginPath();
      c.arc(this.x, this.y, 4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
}


// ─── Audio ───────────────────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  return audioCtx;
}
function playWhoosh() {
  if (!soundOn) return;
  const a = getAudio(); if (!a) return;
  try {
    const osc = a.createOscillator(), gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, a.currentTime);
    osc.frequency.linearRampToValueAtTime(800, a.currentTime + 0.6);
    gain.gain.setValueAtTime(0.15, a.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, a.currentTime + 0.7);
    osc.start(); osc.stop(a.currentTime + 0.7);
  } catch(e) {}
}
function playBoom() {
  if (!soundOn) return;
  const a = getAudio(); if (!a) return;
  try {
    const buf = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const src = a.createBufferSource(), gain = a.createGain(), bpf = a.createBiquadFilter();
    bpf.type = 'lowpass'; bpf.frequency.value = 400;
    src.buffer = buf; src.connect(bpf); bpf.connect(gain); gain.connect(a.destination);
    gain.gain.setValueAtTime(0.6, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.4);
    src.start();
    const osc = a.createOscillator(), g2 = a.createGain();
    osc.connect(g2); g2.connect(a.destination);
    osc.frequency.setValueAtTime(600, a.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, a.currentTime + 0.4);
    g2.gain.setValueAtTime(0.3, a.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.4);
    osc.start(); osc.stop(a.currentTime + 0.4);
  } catch(e) {}
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function drawBg(t) {
  ctx.fillStyle = '#060612';
  ctx.fillRect(0, 0, cw(), ch());
  // stars
  stars.forEach(s => {
    const a = s.a + Math.sin(t * 0.001 * s.speed + s.phase) * 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

function drawCards(t) {
  cards.forEach(card => {
    if (!card.alive && card.opacity <= 0) return;
    const bob = card.alive ? Math.sin(t * 0.001 + card.bobPhase) * 3 : 0;
    if (card.shakeTimer > 0) {
      card.shakeX = (Math.random() - 0.5) * 10;
      card.shakeTimer -= 16;
    } else { card.shakeX = 0; }

    ctx.save();
    ctx.globalAlpha = card.opacity;
    ctx.translate(card.x + card.shakeX, card.y + bob);
    ctx.scale(card.scale, card.scale);

    // Shadow glow
    ctx.shadowColor = card.color;
    ctx.shadowBlur = card.alive ? 14 : 6;

    // Background
    const grad = ctx.createLinearGradient(-card.w/2, -card.h/2, card.w/2, card.h/2);
    grad.addColorStop(0, 'rgba(18,10,42,0.92)');
    grad.addColorStop(1, 'rgba(30,16,64,0.92)');
    ctx.fillStyle = grad;
    roundRect(ctx, -card.w/2, -card.h/2, card.w, card.h, 10);
    ctx.fill();

    // Border
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = card.opacity * (card.alive ? 0.8 : 0.4);
    ctx.stroke();

    // Name text
    ctx.globalAlpha = card.opacity;
    ctx.shadowColor = card.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0f0f8';
    ctx.font = `bold 14px "Apple SD Gothic Neo",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.name, 0, 0);
    ctx.restore();
  });
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function loop(t) {
  if (!startTime) startTime = t;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  drawBg(t);

  // Update cards
  cards.forEach(card => {
    if (card.exploding) {
      card.opacity = Math.max(0, card.opacity - 0.04);
      card.scale = Math.max(0, card.scale - 0.03);
      if (card.opacity <= 0) { card.alive = false; card.exploding = false; }
    }
  });

  drawCards(t);

  // Rocket
  if (rocket) {
    rocket.update();
    rocket.draw(ctx);
    if (rocket.done) {
      const target = cards.find(c => c.alive && c.name === rocket.targetName);
      if (target) {
        playBoom();
        spawnExplosion(target.x, target.y, target.color);
        target.shakeTimer = 80;
        setTimeout(() => { target.exploding = true; }, 120);
        setTimeout(() => {
          positionCards();
          const aliveCount = cards.filter(c => c.alive).length;
          updateBadge();
          if (aliveCount === 1) {
            setTimeout(showLoser, 600);
          } else {
            phase = 'idle';
            launchBtn.disabled = false;
          }
        }, 600);
      }
      rocket = null;
    }
  }

  // Particles
  particles.forEach(p => p.update());
  particles = particles.filter(p => !p.dead);
  particles.forEach(p => p.draw(ctx));

  // Shockwave
  shockwaves.forEach(sw => {
    ctx.save();
    const g = ctx.createRadialGradient(sw.x, sw.y, 0, sw.x, sw.y, sw.r);
    g.addColorStop(0, `rgba(255,255,255,${sw.alpha})`);
    g.addColorStop(0.35, `rgba(255,255,255,${sw.alpha * 0.4})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = sw.alpha * 0.5;
    ctx.strokeStyle = sw.color;
    ctx.shadowColor = sw.color;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.r * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    sw.r += 9;
    sw.alpha = Math.max(0, sw.alpha - 0.05);
  });
  shockwaves = shockwaves.filter(sw => sw.alpha > 0);

  animId = requestAnimationFrame(loop);
}

// ─── Launch ───────────────────────────────────────────────────────────────────
function onLaunch() {
  if (phase !== 'idle') return;
  const alive = cards.filter(c => c.alive);
  if (alive.length <= 1) return;
  phase = 'launching';
  launchBtn.disabled = true;

  const target = alive[Math.floor(Math.random() * alive.length)];
  playWhoosh();
  rocket = new Rocket(cw() / 2, ch() + 10, target.x, target.y);
  rocket.targetName = target.name;
}

function showLoser() {
  const loser = cards.find(c => c.alive);
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  loserNameEl.textContent = loser ? loser.name : '?';
  showPanel('result');
  startResultAnim();
}

function updateBadge() {
  const n = cards.filter(c => c.alive).length;
  remainBadge.textContent = `남은 인원 ${n}명`;
}

// ─── Result canvas ────────────────────────────────────────────────────────────
function startResultAnim() {
  resultCanvas = document.getElementById('result-canvas');
  resultCtx = resultCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  resultCanvas.width = gamePanel.clientWidth * dpr;
  resultCanvas.height = gamePanel.clientHeight * dpr;
  resultCanvas.style.width = gamePanel.clientWidth + 'px';
  resultCanvas.style.height = gamePanel.clientHeight + 'px';
  resultCtx.scale(dpr, dpr);
  resultParticles = [];
  let launches = 0;
  function launchResult() {
    if (launches >= 12) return;
    const x = 60 + Math.random() * (gamePanel.clientWidth - 120);
    const y = gamePanel.clientHeight - 20;
    const colors = ['#c084fc','#fbbf24','#60a5fa','#f472b6','#34d399','#fff'];
    const boom = colors[Math.floor(Math.random() * colors.length)];
    const ty = 40 + Math.random() * gamePanel.clientHeight * 0.5;
    setTimeout(() => {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const c = colors[Math.floor(Math.random() * colors.length)];
        resultParticles.push(new Particle(x, ty, c, angle, speed, 2 + Math.random() * 3));
      }
    }, 300 + launches * 400);
    launches++;
    setTimeout(launchResult, 400 + Math.random() * 200);
  }
  launchResult();
  function rl(t) {
    const rw = gamePanel.clientWidth, rh = gamePanel.clientHeight;
    resultCtx.clearRect(0, 0, rw, rh);
    resultParticles.forEach(p => { p.update(); p.draw(resultCtx); });
    resultParticles = resultParticles.filter(p => !p.dead);
    resultAnimId = requestAnimationFrame(rl);
  }
  resultAnimId = requestAnimationFrame(rl);
}

function stopResultAnim() {
  if (resultAnimId) { cancelAnimationFrame(resultAnimId); resultAnimId = null; }
  resultParticles = [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showPanel(name) {
  setupPanel.style.display = 'none';
  gamePanel.style.display = 'none';
  resultPanel.style.display = 'none';
  if (name === 'setup') { setupPanel.style.display = ''; }
  else if (name === 'game') { gamePanel.style.display = ''; }
  else if (name === 'result') { gamePanel.style.display = ''; resultPanel.style.display = ''; }
}

function resetGame() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  particles = []; rocket = null; shockwaves = []; phase = 'idle';
  startTime = 0;
  setTimeout(() => {
    resizeCanvas();
    initCards();
    updateBadge();
    launchBtn.disabled = false;
    animId = requestAnimationFrame(loop);
  }, 50);
}

window.addEventListener('resize', () => {
  if (gamePanel.style.display !== 'none') resizeCanvas();
});
