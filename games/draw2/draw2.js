// ─── State ────────────────────────────────────────────────────────────────────
const SLIP_COLORS = [
  { name: '블루',   hex: '#60a5fa' },
  { name: '옐로우', hex: '#fbbf24' },
  { name: '그린',   hex: '#4ade80' },
  { name: '핑크',   hex: '#f472b6' },
  { name: '퍼플',   hex: '#c084fc' },
  { name: '오렌지', hex: '#fb923c' },
  { name: '민트',   hex: '#22d3ee' },
  { name: '연보라', hex: '#a78bfa' },
];

let playerCount = 2;
let results = [];
let slips = []; // {color, result, el}
let pulledCount = 0;
let stars = [], dustParticles = [];
let animId = null;
let resultParticles = [], resultAnimId = null;
let pulling = false;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const setupPanel  = document.getElementById('setup-panel');
const gamePanel   = document.getElementById('game-panel');
const resultPanel = document.getElementById('result-panel');
const bgCanvas    = document.getElementById('bg-canvas');
const bgCtx       = bgCanvas.getContext('2d');
const fanWrap     = document.getElementById('fan-wrap');
const resultLog   = document.getElementById('result-log');
const revealStage = document.getElementById('reveal-stage');
const revealPaper = document.getElementById('reveal-paper');
const rpBack       = document.getElementById('rp-back');
const resultListEl = document.getElementById('result-list');
const playerCountEl = document.getElementById('player-count');

document.getElementById('btn-dec').addEventListener('click', () => {
  if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; buildResultInputs(); }
});
document.getElementById('btn-inc').addEventListener('click', () => {
  if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; buildResultInputs(); }
});
document.getElementById('start-btn').addEventListener('click', startGame);

document.getElementById('batch-btn').addEventListener('click', () => {
  const val = prompt('결과를 쉼표(,)로 구분해서 입력하세요.');
  if (!val) return;
  const items = val.split(',').map(s => s.trim()).filter(Boolean);
  const count = Math.min(Math.max(items.length, 2), 8);
  playerCount = count;
  playerCountEl.textContent = count;
  buildResultInputs();
  const inputs = resultListEl.querySelectorAll('.name-input');
  items.forEach((v, i) => { if (inputs[i]) inputs[i].value = v; });
});

document.getElementById('clear-btn').addEventListener('click', () => {
  resultListEl.querySelectorAll('.name-input').forEach(inp => inp.value = '');
});

document.getElementById('again-btn').addEventListener('click', () => {
  stopResultAnim();
  resultPanel.style.display = 'none';
  resetGame();
});

document.getElementById('rename-btn').addEventListener('click', () => {
  stopResultAnim();
  showPanel('setup');
});

// ─── Setup ────────────────────────────────────────────────────────────────────
function buildResultInputs() {
  const prev = Array.from(resultListEl.querySelectorAll('.name-input')).map(i => i.value);
  resultListEl.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const inp = document.createElement('input');
    inp.className = 'name-input';
    inp.type = 'text';
    inp.placeholder = `결과 입력`;
    inp.maxLength = 16;
    inp.value = prev[i] || '';
    resultListEl.appendChild(inp);
  }
}
buildResultInputs();

function startGame() {
  const inputs = resultListEl.querySelectorAll('.name-input');
  const vals = Array.from(inputs).map(inp => inp.value.trim());
  if (vals.some(v => v === '')) { alert('모든 결과를 입력해주세요!'); return; }
  results = vals;
  showPanel('game');
  setTimeout(() => {
    resizeBg();
    initSlips();
    animId = requestAnimationFrame(bgLoop);
  }, 50);
}

// ─── Canvas background ────────────────────────────────────────────────────────
function resizeBg() {
  const dpr = window.devicePixelRatio || 1;
  bgCanvas.width  = gamePanel.clientWidth  * dpr;
  bgCanvas.height = gamePanel.clientHeight * dpr;
  bgCanvas.style.width  = gamePanel.clientWidth  + 'px';
  bgCanvas.style.height = gamePanel.clientHeight + 'px';
  bgCtx.scale(dpr, dpr);
  initStars();
}

function cw() { return bgCanvas.width  / (window.devicePixelRatio || 1); }
function ch() { return bgCanvas.height / (window.devicePixelRatio || 1); }

function initStars() {
  stars = [];
  for (let i = 0; i < 160; i++) {
    stars.push({
      x: Math.random() * cw(), y: Math.random() * ch(),
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.7 + 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.015,
    });
  }
}

// Dust particles that rise from the jar
function spawnDust() {
  const jarX = cw() / 2;
  const jarY = ch() - 120; // approx jar rim Y
  for (let i = 0; i < 2; i++) {
    dustParticles.push({
      x: jarX + (Math.random() - 0.5) * 100,
      y: jarY,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.3 + Math.random() * 0.5),
      r: 1 + Math.random() * 2,
      life: 1,
      decay: 0.006 + Math.random() * 0.006,
    });
  }
}

function bgLoop(t) {
  bgCtx.fillStyle = '#060612';
  bgCtx.fillRect(0, 0, cw(), ch());

  // Stars
  stars.forEach(s => {
    const a = s.a + Math.sin(t * 0.001 * s.speed + s.phase) * 0.3;
    bgCtx.save();
    bgCtx.globalAlpha = Math.max(0, Math.min(1, a));
    bgCtx.fillStyle = '#fff';
    bgCtx.shadowColor = 'rgba(255,255,255,0.5)';
    bgCtx.shadowBlur = 2;
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();
  });

  // Spawn & draw dust
  if (Math.random() < 0.25) spawnDust();
  dustParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.life <= 0) return;
    bgCtx.save();
    bgCtx.globalAlpha = p.life * 0.5;
    bgCtx.fillStyle = '#c084fc';
    bgCtx.shadowColor = '#a855f7';
    bgCtx.shadowBlur = 4;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();
  });
  dustParticles = dustParticles.filter(p => p.life > 0);

  animId = requestAnimationFrame(bgLoop);
}

// ─── Slips (제비) ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initSlips() {
  pulling = false;
  pulledCount = 0;
  revealStage.classList.remove('active');
  revealPaper.classList.remove('open');
  resultLog.innerHTML = '';

  // 결과를 섞어서 각 플레이어에 랜덤 배정
  const shuffled = shuffle(results);
  slips = shuffled.map((result, i) => ({ color: SLIP_COLORS[i], result, el: null }));

  renderFan();
}

function renderFan() {
  fanWrap.innerHTML = '';

  slips.forEach((slip, i) => {
    const tilt = (Math.random() - 0.5) * 7; // 자연스러운 살짝 기울기
    const el = document.createElement('div');
    el.className = 'slip';
    el.style.setProperty('--tilt', `${tilt}deg`);
    el.style.transform = `rotate(${tilt}deg)`;
    el.innerHTML = `
      <div class="slip-body" style="background:linear-gradient(160deg,${slip.color.hex}22,${slip.color.hex}44);border-color:${slip.color.hex}88;">
        <span class="slip-color-dot" style="background:${slip.color.hex};box-shadow:0 0 8px ${slip.color.hex}"></span>
        <span class="slip-num" style="color:${slip.color.hex};text-shadow:0 0 10px ${slip.color.hex}88">${slip.color.name}</span>
      </div>
    `;
    el.addEventListener('click', () => pullSlip(i));
    fanWrap.appendChild(el);
    slip.el = el;
  });
}

function pullSlip(idx) {
  if (pulling) return;
  const slip = slips[idx];
  pulling = true;

  slip.el.classList.add('gone');

  // 결과 텍스트로 뒷면 구성
  rpBack.className = 'rp-face rp-back';
  rpBack.style.cssText = `background:linear-gradient(145deg,#16103a,${slip.color.hex}66,#1e1040);border-color:${slip.color.hex};box-shadow:0 0 60px ${slip.color.hex}aa,0 8px 40px rgba(0,0,0,.8)`;
  rpBack.innerHTML = `
    <span class="rp-name-text" style="color:${slip.color.hex}">${slip.color.name}</span>
    <div class="rp-divider" style="background:${slip.color.hex}55"></div>
    <span class="rp-result-text">${slip.result}</span>
  `;

  revealPaper.classList.remove('open');
  revealStage.classList.add('active');

  setTimeout(() => revealPaper.classList.add('open'), 550);

  // 뒤집힌 후 로그 칩 추가 + 탭 대기
  setTimeout(() => {
    const chip = document.createElement('div');
    chip.className = 'log-chip';
    chip.style.cssText = `border-color:${slip.color.hex}66;background:${slip.color.hex}18`;
    chip.innerHTML = `<span class="log-dot" style="background:${slip.color.hex};box-shadow:0 0 6px ${slip.color.hex}"></span><span style="color:${slip.color.hex};font-weight:800">${slip.color.name}</span><span style="opacity:.5;font-size:.7em;margin:0 3px">→</span><span style="color:#f0f0f8">${slip.result}</span>`;
    resultLog.appendChild(chip);

    const hintEl = document.getElementById('reveal-hint');
    hintEl.classList.add('show');

    function dismiss() {
      revealStage.removeEventListener('click', dismiss);
      hintEl.classList.remove('show');
      revealStage.classList.remove('active');
      revealPaper.classList.remove('open');
      pulling = false;
      pulledCount++;
      if (pulledCount === slips.length) {
        setTimeout(() => {
          if (animId) { cancelAnimationFrame(animId); animId = null; }
          buildSummary();
          showPanel('result');
          startResultAnim();
        }, 400);
      }
    }
    revealStage.addEventListener('click', dismiss);
  }, 1200);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function buildSummary() {
  const el = document.getElementById('draw-summary');
  el.innerHTML = '';
  slips.forEach((slip, i) => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.style.animationDelay = `${i * 0.07}s`;
    row.innerHTML = `
      <span class="summary-dot" style="background:${slip.color.hex};box-shadow:0 0 6px ${slip.color.hex}"></span>
      <span class="summary-color-name" style="color:${slip.color.hex}">${slip.color.name}</span>
      <span class="summary-arrow">→</span>
      <span class="summary-result">${slip.result}</span>
    `;
    el.appendChild(row);
  });
}

// ─── Result particles ─────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1;
    this.color = color;
    this.size = 3 + Math.random() * 4;
    this.life = 1;
    this.decay = 0.01 + Math.random() * 0.015;
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += 0.1; this.vx *= 0.98; this.life -= this.decay; }
  draw(c) {
    if (this.life <= 0) return;
    c.save(); c.globalAlpha = this.life;
    c.fillStyle = this.color; c.shadowColor = this.color; c.shadowBlur = 6;
    c.beginPath(); c.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  get dead() { return this.life <= 0; }
}

function startResultAnim() {
  const rc   = document.getElementById('result-canvas');
  const rctx = rc.getContext('2d');
  const dpr  = window.devicePixelRatio || 1;
  rc.width  = gamePanel.clientWidth  * dpr;
  rc.height = gamePanel.clientHeight * dpr;
  rc.style.width  = gamePanel.clientWidth  + 'px';
  rc.style.height = gamePanel.clientHeight + 'px';
  rctx.scale(dpr, dpr);
  resultParticles = [];
  const colors = ['#c084fc','#fbbf24','#60a5fa','#f472b6','#34d399','#f87171','#fff'];
  let bursts = 0;
  function burst() {
    if (bursts >= 15) return;
    const x = 40 + Math.random() * (gamePanel.clientWidth - 80);
    const y = 30 + Math.random() * (gamePanel.clientHeight * 0.6);
    for (let i = 0; i < 40; i++)
      resultParticles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    bursts++;
    setTimeout(burst, 300 + Math.random() * 200);
  }
  burst();
  function rl() {
    rctx.clearRect(0, 0, gamePanel.clientWidth, gamePanel.clientHeight);
    resultParticles.forEach(p => { p.update(); p.draw(rctx); });
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
  setupPanel.style.display  = 'none';
  gamePanel.style.display   = 'none';
  resultPanel.style.display = 'none';
  if (name === 'setup') setupPanel.style.display = '';
  else if (name === 'game') gamePanel.style.display = '';
  else { gamePanel.style.display = ''; resultPanel.style.display = ''; }
}

function resetGame() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  dustParticles = [];
  pulledCount = 0;
  setTimeout(() => {
    resizeBg();
    initSlips();
    animId = requestAnimationFrame(bgLoop);
  }, 50);
}

window.addEventListener('resize', () => {
  if (gamePanel.style.display !== 'none') resizeBg();
});
