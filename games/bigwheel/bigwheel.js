// ─── State ────────────────────────────────────────────────────────────────────
let playerCount = 4, names = [], soundOn = true;
let angle = 0, velocity = 0, spinning = false;
let animId = null, lastTick = null;
let lastSector = -1;
let resultParticles = [], resultAnimId = null;

const SEGMENT_COLORS = [
  ['#7c3aed','#a855f7'], ['#0ea5e9','#38bdf8'], ['#16a34a','#4ade80'],
  ['#d97706','#fbbf24'], ['#dc2626','#f87171'], ['#db2777','#f472b6'],
  ['#7c3aed','#c084fc'], ['#0284c7','#60a5fa'],
];

// ─── DOM ──────────────────────────────────────────────────────────────────────
const setupPanel  = document.getElementById('setup-panel');
const gamePanel   = document.getElementById('game-panel');
const resultPanel = document.getElementById('result-panel');
const canvas      = document.getElementById('wheel-canvas');
const ctx         = canvas.getContext('2d');
const spinBtn     = document.getElementById('spin-btn');
const nameListEl  = document.getElementById('name-list');
const playerCountEl = document.getElementById('player-count');

document.getElementById('btn-dec').addEventListener('click', () => { if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; buildInputs(); } });
document.getElementById('btn-inc').addEventListener('click', () => { if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; buildInputs(); } });
document.getElementById('start-btn').addEventListener('click', startGame);

document.getElementById('batch-btn').addEventListener('click', () => {
  const val = prompt('이름을 쉼표(,)로 구분해서 입력하세요.\n예: 1,2,3,4');
  if (!val) return;
  const items = val.split(',').map(s => s.trim()).filter(Boolean);
  const count = Math.min(Math.max(items.length, 2), 8);
  playerCount = count;
  playerCountEl.textContent = count;
  buildInputs();
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
spinBtn.addEventListener('click', doSpin);
document.getElementById('again-btn').addEventListener('click', () => { stopResultAnim(); resultPanel.style.display = 'none'; resetWheel(); });
document.getElementById('rename-btn').addEventListener('click', () => { stopResultAnim(); showPanel('setup'); });

// ─── Inputs ───────────────────────────────────────────────────────────────────
function buildInputs() {
  const prev = Array.from(nameListEl.querySelectorAll('.name-input')).map(i => i.value);
  nameListEl.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const inp = document.createElement('input');
    inp.className = 'name-input'; inp.type = 'text';
    inp.placeholder = `플레이어 ${i + 1}`; inp.maxLength = 8;
    inp.value = prev[i] || '';
    nameListEl.appendChild(inp);
  }
}
buildInputs();

function startGame() {
  const inputs = nameListEl.querySelectorAll('.name-input');
  names = Array.from(inputs).map((inp, i) => inp.value.trim() || `플레이어 ${i + 1}`);
  showPanel('game');
  setTimeout(() => { resizeCanvas(); resetWheel(); }, 50);
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = gamePanel.clientWidth;
  const h = gamePanel.clientHeight - 76;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
}
function cw() { return canvas.width / (window.devicePixelRatio || 1); }
function ch() { return canvas.height / (window.devicePixelRatio || 1); }
function R()  { return Math.min(cw(), ch()) * 0.43; }
function cx() { return cw() / 2; }
function cy() { return ch() / 2; }

// ─── Draw ─────────────────────────────────────────────────────────────────────
function drawWheel(t) {
  const n = names.length;
  const arc = (Math.PI * 2) / n;
  const r = R();

  ctx.clearRect(0, 0, cw(), ch());

  // Outer glow ring
  const outerGlow = ctx.createRadialGradient(cx(), cy(), r * 0.9, cx(), cy(), r * 1.25);
  outerGlow.addColorStop(0, 'rgba(168,85,247,0.15)');
  outerGlow.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = outerGlow; ctx.fillRect(0, 0, cw(), ch());

  // Drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(124,58,237,0.5)';
  ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();

  // Segments
  for (let i = 0; i < n; i++) {
    const start = angle + i * arc - Math.PI / 2;
    const end = start + arc;
    const [c1, c2] = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    ctx.save();

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx(), cy());
    ctx.arc(cx(), cy(), r - 4, start, end);
    ctx.closePath();
    const radGrad = ctx.createRadialGradient(cx(), cy(), r * 0.15, cx(), cy(), r - 4);
    radGrad.addColorStop(0, c1);
    radGrad.addColorStop(1, c2 + 'cc');
    ctx.fillStyle = radGrad;
    ctx.fill();

    // Segment border
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Name text
    ctx.save();
    ctx.translate(cx(), cy());
    ctx.rotate(start + arc / 2);
    const textR = r * 0.62;
    ctx.translate(textR, 0);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
    const fontSize = Math.max(11, Math.min(16, 90 / n + 4));
    ctx.font = `bold ${fontSize}px "Apple SD Gothic Neo",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(names[i], 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // Center circle
  ctx.save();
  ctx.shadowColor = 'rgba(192,132,252,0.6)'; ctx.shadowBlur = 20;
  const centerGrad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), r * 0.12);
  centerGrad.addColorStop(0, '#e0c8ff'); centerGrad.addColorStop(1, '#7c3aed');
  ctx.beginPath(); ctx.arc(cx(), cy(), r * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = centerGrad; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  // Outer ring
  ctx.save();
  ctx.beginPath(); ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(192,132,252,0.5)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();

  // Decorative dots on ring
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + angle;
    const dotX = cx() + Math.cos(a) * (r + 2);
    const dotY = cy() + Math.sin(a) * (r + 2);
    ctx.save();
    ctx.beginPath(); ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#c084fc' : '#f0e6ff';
    ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 6;
    ctx.fill(); ctx.restore();
  }

  // Pointer (arrow at top)
  drawPointer(r);

}

function drawPointer(r) {
  const px = cx(), py = cy() - r - 12;
  const pw = 18, ph = 28;
  ctx.save();
  ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 20;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(px, py + ph);
  ctx.lineTo(px - pw / 2, py);
  ctx.lineTo(px + pw / 2, py);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

// ─── Physics ──────────────────────────────────────────────────────────────────
function loop(ts) {
  const dt = lastTick ? Math.min(ts - lastTick, 50) : 16;
  lastTick = ts;

  if (spinning) {
    angle += velocity * (dt / 16);
    // Friction
    velocity *= velocity > 0.02 ? 0.9935 : 0.97;

    // Sector tick sound + flash
    const n = names.length;
    const arc = (Math.PI * 2) / n;
    // Pointer is at top (-PI/2), find current sector under pointer
    const normalized = ((-angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const sector = Math.floor(normalized / arc) % n;
    if (sector !== lastSector) {
      lastSector = sector;
      if (velocity > 0.04) playTick(velocity);
    }

    if (velocity < 0.003) {
      velocity = 0; spinning = false;
      spinBtn.disabled = false;
      onStopped();
    }
  }

  drawWheel(ts);
  animId = requestAnimationFrame(loop);
}

function onStopped() {
  const n = names.length;
  const arc = (Math.PI * 2) / n;
  const normalized = ((-angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const sector = Math.floor(normalized / arc) % n;

  playBoom();
  setTimeout(() => {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    document.getElementById('loser-name').textContent = names[sector];
    showPanel('result');
    startResultAnim();
  }, 900);
}

function doSpin() {
  if (spinning) return;
  spinning = true; spinBtn.disabled = true;
  velocity = 0.22 + Math.random() * 0.18;
  lastSector = -1; lastTick = null;
  if (!animId) animId = requestAnimationFrame(loop);
}

// ─── Audio ───────────────────────────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  return audioCtx;
}
function playTick(vel) {
  if (!soundOn) return;
  const a = getAudio(); if (!a) return;
  try {
    const osc = a.createOscillator(), gain = a.createGain();
    osc.connect(gain); gain.connect(a.destination);
    osc.type = 'triangle';
    osc.frequency.value = 800 + vel * 200;
    gain.gain.setValueAtTime(0.3, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.08);
    osc.start(); osc.stop(a.currentTime + 0.08);
  } catch(e) {}
}
function playBoom() {
  if (!soundOn) return;
  const a = getAudio(); if (!a) return;
  try {
    const buf = a.createBuffer(1, a.sampleRate * 0.4, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
    const src = a.createBufferSource(), g = a.createGain(), lpf = a.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 500;
    src.buffer = buf; src.connect(lpf); lpf.connect(g); g.connect(a.destination);
    g.gain.setValueAtTime(0.25, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5);
    src.start();
    for (let i = 0; i < 3; i++) {
      const osc = a.createOscillator(), og = a.createGain();
      osc.connect(og); og.connect(a.destination);
      osc.frequency.setValueAtTime(400 - i * 80, a.currentTime + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(60 - i * 10, a.currentTime + 0.4 + i * 0.06);
      og.gain.setValueAtTime(0.1, a.currentTime + i * 0.06);
      og.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.5 + i * 0.06);
      osc.start(a.currentTime + i * 0.06); osc.stop(a.currentTime + 0.55 + i * 0.06);
    }
  } catch(e) {}
}

// ─── Result particles ─────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.size = 3 + Math.random() * 4;
    this.life = 1;
    this.decay = 0.01 + Math.random() * 0.015;
    this.vy -= 1;
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
  const rc = document.getElementById('result-canvas');
  const rctx = rc.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  rc.width = gamePanel.clientWidth * dpr; rc.height = gamePanel.clientHeight * dpr;
  rc.style.width = gamePanel.clientWidth + 'px'; rc.style.height = gamePanel.clientHeight + 'px';
  rctx.scale(dpr, dpr);
  resultParticles = [];
  const colors = ['#c084fc','#fbbf24','#60a5fa','#f472b6','#34d399','#f87171','#fff'];
  let bursts = 0;
  function burst() {
    if (bursts >= 15) return;
    const x = 40 + Math.random() * (gamePanel.clientWidth - 80);
    const y = 30 + Math.random() * (gamePanel.clientHeight * 0.6);
    for (let i = 0; i < 40; i++) {
      resultParticles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
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
  setupPanel.style.display = 'none'; gamePanel.style.display = 'none'; resultPanel.style.display = 'none';
  if (name === 'setup') setupPanel.style.display = '';
  else if (name === 'game') gamePanel.style.display = '';
  else { gamePanel.style.display = ''; resultPanel.style.display = ''; }
}

function resetWheel() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  spinning = false; velocity = 0; angle = 0; lastSector = -1; lastTick = null;
  spinBtn.disabled = false;
  resizeCanvas();
  animId = requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { if (gamePanel.style.display !== 'none') resizeCanvas(); });
