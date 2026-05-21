document.addEventListener('DOMContentLoaded', () => {
  const HOLES = 9;

  const panels = {
    setup: document.getElementById('setup-panel'),
    game:  document.getElementById('game-panel'),
    result: document.getElementById('result-panel'),
  };

  const playerCountEl = document.getElementById('player-count');
  const btnDec = document.getElementById('btn-dec');
  const btnInc = document.getElementById('btn-inc');
  const startBtn = document.getElementById('start-btn');
  const turnBadge = document.getElementById('turn-badge');
  const scoreVal = document.getElementById('score-val');
  const timerVal = document.getElementById('timer-val');
  const timerBar = document.getElementById('timer-bar');
  const comboWrap = document.getElementById('combo-wrap');
  const comboText = document.getElementById('combo-text');
  const moleGrid = document.getElementById('mole-grid');
  const resultList = document.getElementById('result-list');
  const loserBox = document.getElementById('loser-box');
  const againBtn = document.getElementById('again-btn');
  const readyOverlay = document.getElementById('ready-overlay');
  const readyName = document.getElementById('ready-name');
  const readyPrev = document.getElementById('ready-prev');

  let playerCount = 2;
  let selectedTime = 10;
  let selectedSpeed = 1;
  let players = [];
  let currentIdx = 0;
  let score = 0;
  let combo = 0;
  let comboTimerId = null;
  let timerIntervalId = null;
  let spawnTimerId = null;
  let timeLeft = 0;
  let gameActive = false;
  let readyActive = false;
  const holes = []; // { el, moleEl, active, hideId }
  let audioCtx = null;

  // --- Audio (Web Audio API) ---
  function ctx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  function tone(freq, dur, type = 'square', vol = 0.25) {
    const c = ctx();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, c.currentTime + dur);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch(e) {}
  }

  function playHit(comboLv) {
    const f = 220 + comboLv * 90;
    tone(f, 0.12, 'square', 0.28);
    if (comboLv >= 2) setTimeout(() => tone(f * 1.6, 0.1, 'sine', 0.22), 55);
    if (comboLv >= 4) setTimeout(() => tone(f * 2.2, 0.1, 'sine', 0.18), 110);
  }

  // --- Player count & time ---
  btnDec.addEventListener('click', () => {
    if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; }
  });
  btnInc.addEventListener('click', () => {
    if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; }
  });

  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTime = +btn.dataset.time;
    });
  });

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSpeed = +btn.dataset.speed;
    });
  });

  // --- Grid ---
  function buildGrid() {
    moleGrid.innerHTML = '';
    holes.length = 0;
    for (let i = 0; i < HOLES; i++) {
      const hole = document.createElement('div');
      hole.className = 'hole';
      hole.innerHTML = `
        <div class="hole-pit"></div>
        <div class="mole" data-i="${i}">
          <div class="mole-head">
            <div class="mole-ear l"></div>
            <div class="mole-ear r"></div>
            <div class="mole-face">
              <div class="mole-eyes">
                <div class="mole-eye"></div>
                <div class="mole-eye"></div>
              </div>
              <div class="mole-star-eyes"><span>✦</span><span>✦</span></div>
              <div class="mole-nose"></div>
              <div class="mole-blush l"></div>
              <div class="mole-blush r"></div>
            </div>
          </div>
        </div>
        <div class="hole-rim"></div>
      `;
      const moleEl = hole.querySelector('.mole');
      moleEl.addEventListener('pointerdown', e => { e.preventDefault(); onHit(i, e); });
      moleGrid.appendChild(hole);
      holes.push({ el: hole, moleEl, active: false, hideId: null });
    }
  }

  // --- Game flow ---
  startBtn.addEventListener('click', () => {
    players = Array.from({ length: playerCount }, (_, i) => ({ name: `${i + 1}번`, score: 0 }));
    currentIdx = 0;
    showPanel('game');
    buildGrid();
    beginTurn(''); // 첫 번째 플레이어 준비 화면
  });

  againBtn.addEventListener('click', () => showPanel('setup'));

  function showPanel(name) {
    Object.values(panels).forEach(p => p.style.display = 'none');
    panels[name].style.display = 'flex';
    if (name !== 'game') readyOverlay.style.display = 'none';
  }

  // 준비 화면 표시 (탭하면 실제 게임 시작)
  function beginTurn(prevMsg = '') {
    score = 0;
    combo = 0;
    timeLeft = selectedTime;
    gameActive = false;

    const player = players[currentIdx];
    turnBadge.textContent = `👤 ${player.name}의 차례`;
    scoreVal.textContent = '0';
    timerVal.textContent = timeLeft;
    timerVal.classList.remove('urgent');
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    timerBar.getBoundingClientRect(); // 강제 리플로우 후 트랜지션 복구
    timerBar.style.transition = '';
    timerBar.classList.remove('urgent');
    comboWrap.style.visibility = 'hidden';

    holes.forEach(h => {
      clearTimeout(h.hideId);
      h.moleEl.className = 'mole';
      h.active = false;
    });
    clearTimeout(comboTimerId);

    readyPrev.textContent = prevMsg;
    readyName.textContent = `${player.name}의 차례!`;
    readyActive = false;
    readyOverlay.classList.remove('ready-go', 'end-state');
    readyOverlay.style.display = 'flex';
    setTimeout(() => {
      readyActive = true;
      readyOverlay.classList.add('ready-go');
    }, 900);
  }

  function startTurn() {
    if (!readyActive) return;
    readyOverlay.style.display = 'none';
    readyOverlay.classList.remove('ready-go');
    readyActive = false;
    gameActive = true;
    spawnLoop();
    timerIntervalId = setInterval(tick, 1000);
  }

  readyOverlay.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startTurn();
  });

  function tick() {
    timeLeft--;
    timerVal.textContent = timeLeft;
    timerBar.style.width = `${(timeLeft / selectedTime) * 100}%`;
    // urgent 기준: 남은 시간의 30% 또는 최소 3초
    const urgentAt = Math.max(3, Math.floor(selectedTime * 0.3));
    if (timeLeft <= urgentAt) {
      timerVal.classList.add('urgent');
      timerBar.classList.add('urgent');
    }
    if (timeLeft <= 0) {
      clearInterval(timerIntervalId);
      timerBar.style.transition = 'none';
      timerBar.style.width = '0%';
      setTimeout(endTurn, 400);
    }
  }

  // Difficulty ramps up as time runs out
  function diff() {
    const elapsed = selectedTime - timeLeft;
    const t = Math.min(elapsed / selectedTime, 0.96);
    const fast = selectedSpeed === 2;
    const sm = fast ? 0.55 : 1;
    return {
      showMs:  Math.max(fast ? 280 : 520, (1450 - t * 950) * sm),
      spawnMs: Math.max(fast ? 140 : 220, (680  - t * 460) * sm),
      maxUp:   Math.min(5, (t < 0.35 ? 2 : t < 0.65 ? 3 : 4) + (fast ? 1 : 0)),
    };
  }

  function spawnLoop() {
    clearTimeout(spawnTimerId);
    if (!gameActive) return;

    const { showMs, spawnMs, maxUp } = diff();
    const activeCount = holes.filter(h => h.active).length;
    if (activeCount < maxUp) {
      const free = holes.filter(h => !h.active);
      if (free.length) {
        const pick = free[Math.floor(Math.random() * free.length)];
        popUp(pick, showMs);
      }
    }
    spawnTimerId = setTimeout(spawnLoop, spawnMs);
  }

  function popUp(hole, ms) {
    if (!gameActive) return;
    hole.active = true;
    hole.moleEl.classList.add('up');
    clearTimeout(hole.hideId);
    hole.hideId = setTimeout(() => retract(hole), ms);
  }

  function retract(hole) {
    hole.active = false;
    hole.moleEl.classList.remove('up', 'hit');
  }

  function onHit(idx, e) {
    if (!gameActive) return;
    const h = holes[idx];
    if (!h.active) return;

    h.active = false;
    clearTimeout(h.hideId);
    h.moleEl.classList.remove('up');
    h.moleEl.classList.add('hit');
    setTimeout(() => h.moleEl.classList.remove('hit'), 380);

    combo++;
    clearTimeout(comboTimerId);
    comboTimerId = setTimeout(() => { combo = 0; }, 1200);

    const pts = 10 * combo;
    score += pts;
    scoreVal.textContent = score;
    // Bump animation
    scoreVal.classList.remove('bump');
    void scoreVal.offsetWidth;
    scoreVal.classList.add('bump');
    setTimeout(() => scoreVal.classList.remove('bump'), 150);

    if (navigator.vibrate) navigator.vibrate(combo >= 3 ? [30, 10, 30] : [30]);
    playHit(combo);
    spawnParticles(e.clientX, e.clientY);
    floatScore(e.clientX, e.clientY, `+${pts}`);

    if (combo >= 2) {
      comboText.textContent = `${combo} COMBO!`;
      comboWrap.style.visibility = 'visible';
      // Restart animation
      comboText.style.animation = 'none';
      void comboText.offsetWidth;
      comboText.style.animation = '';
    } else {
      comboWrap.style.visibility = 'hidden';
    }
  }

  function floatScore(x, y, text) {
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  function spawnParticles(x, y) {
    const colors = ['#fbbf24', '#f97316', '#c084fc', '#34d399', '#60a5fa', '#f472b6'];
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 35 + Math.random() * 55;
      const size = 5 + Math.random() * 7;
      p.style.cssText = `
        left:${x}px; top:${y}px;
        width:${size}px; height:${size}px;
        background:${colors[i % colors.length]};
        --tx:${Math.cos(angle) * dist}px;
        --ty:${Math.sin(angle) * dist}px;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 580);
    }
  }

  function endTurn() {
    gameActive = false;
    clearInterval(timerIntervalId);
    clearTimeout(spawnTimerId);
    clearTimeout(comboTimerId);
    holes.forEach(h => { clearTimeout(h.hideId); h.moleEl.className = 'mole'; h.active = false; });
    comboWrap.style.visibility = 'hidden';

    players[currentIdx].score = score;
    currentIdx++;

    const prev = players[currentIdx - 1];

    // 즉시 "시간 종료" 오버레이 표시
    readyName.textContent = '⏰ 시간 종료!';
    readyPrev.textContent = `${prev.name}: ${prev.score}점`;
    readyActive = false;
    readyOverlay.classList.remove('ready-go');
    readyOverlay.classList.add('end-state');
    readyOverlay.style.display = 'flex';

    if (currentIdx < playerCount) {
      const msg = `✅ ${prev.name}: ${prev.score}점`;
      setTimeout(() => beginTurn(msg), 1400);
    } else {
      setTimeout(showResult, 1400);
    }
  }

  function showResult() {
    showPanel('result');
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const medals = ['🥇', '🥈', '🥉'];
    const lowestScore = sorted[sorted.length - 1].score;
    const highestScore = sorted[0].score;
    const losers = sorted.filter(p => p.score === lowestScore);
    const isLoserTie = losers.length > 1;
    const isWinnerTie = sorted.filter(p => p.score === highestScore).length > 1;

    resultList.innerHTML = '';
    sorted.forEach((p) => {
      const rank = sorted.filter(o => o.score > p.score).length + 1;
      const rankDisplay = medals[rank - 1] || `${rank}위`;
      const isLoser = p.score === lowestScore;
      const div = document.createElement('div');
      div.className = 'result-item'
        + (rank === 1 && !isWinnerTie ? ' winner' : '')
        + (isLoser ? ' loser' : '');
      div.innerHTML = `
        <span class="result-rank">${rankDisplay}</span>
        <span class="result-name">${p.name}</span>
        <span class="result-score">${p.score}점</span>
      `;
      resultList.appendChild(div);
    });

    if (isLoserTie) {
      const names = losers.map(p => `<strong>${p.name}</strong>`).join(', ');
      loserBox.innerHTML = `💀 ${names} 공동 벌칙! (${lowestScore}점)`;
    } else {
      loserBox.innerHTML = `💀 <strong>${losers[0].name}</strong> 벌칙! (${lowestScore}점)`;
    }
  }
});
