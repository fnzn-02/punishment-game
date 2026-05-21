document.addEventListener('DOMContentLoaded', () => {
  const panels = {
    setup:  document.getElementById('setup-panel'),
    game:   document.getElementById('game-panel'),
    result: document.getElementById('result-panel'),
  };

  const playerCountEl = document.getElementById('player-count');
  const btnDec        = document.getElementById('btn-dec');
  const btnInc        = document.getElementById('btn-inc');
  const startBtn      = document.getElementById('start-btn');
  const turnBadge     = document.getElementById('turn-badge');
  const ruleBadge     = document.getElementById('rule-badge');
  const diceEl        = document.getElementById('dice');
  const rollBtn       = document.getElementById('roll-btn');
  const resultReveal  = document.getElementById('result-reveal');
  const scoreList     = document.getElementById('score-list');
  const resultList    = document.getElementById('result-list');
  const loserBox      = document.getElementById('loser-box');
  const rerollBtn     = document.getElementById('reroll-btn');
  const againBtn      = document.getElementById('again-btn');

  let playerCount = 2;
  let punishRule  = 'low'; // 'low' | 'high'
  let players     = [];
  let currentIdx  = 0;
  let rolling     = false;
  const pip = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  // Final dice rotations to bring each face toward the viewer.
  // Face positions in CSS (face-N transform):
  //   face-1: translateZ(+)         → front face   → dice needs 0 rotation
  //   face-2: rotateY(+90) + trans  → right face   → dice rotateY(-90) to face viewer
  //   face-3: rotateX(-90) + trans  → top face     → dice rotateX(+90)
  //   face-4: rotateX(+90) + trans  → bottom face  → dice rotateX(-90)
  //   face-5: rotateY(-90) + trans  → left face    → dice rotateY(+90)
  //   face-6: rotateY(180) + trans  → back face    → dice rotateY(180)
  const faceRot = {
    1: { x: 0,   y: 0   },
    2: { x: 0,   y: -90 },
    3: { x: 90,  y: 0   },
    4: { x: -90, y: 0   },
    5: { x: 0,   y: 90  },
    6: { x: 0,   y: 180 },
  };

  // Subtle tilt after landing — face is ~front-facing but with depth
  const TILT_X = -10;
  const TILT_Y = 14;

  // --- Setup ---
  btnDec.addEventListener('click', () => {
    if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; }
    btnDec.disabled = playerCount <= 2;
    btnInc.disabled = false;
  });

  btnInc.addEventListener('click', () => {
    if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; }
    btnInc.disabled = playerCount >= 8;
    btnDec.disabled = false;
  });

  document.querySelectorAll('.rule-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rule-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      punishRule = btn.dataset.rule;
    });
  });

  startBtn.addEventListener('click', () => {
    const list = Array.from({ length: playerCount }, (_, i) => ({ name: `${i + 1}번`, roll: null }));
    startGame(list);
  });

  // --- Game ---
  function startGame(list) {
    players    = list;
    currentIdx = 0;
    rolling    = false;

    scoreList.innerHTML = '';
    hideReveal();
    resetDice();
    showPanel('game');

    ruleBadge.textContent = punishRule === 'low' ? '낮은 숫자 벌칙' : '높은 숫자 벌칙';
    updateTurn();
  }

  function showPanel(name) {
    Object.values(panels).forEach(p => p.style.display = 'none');
    panels[name].style.display = 'flex';
  }

  function resetDice() {
    diceEl.style.transition = 'none';
    diceEl.style.transform  = 'rotateX(-22deg) rotateY(28deg)';
  }

  function updateTurn() {
    turnBadge.textContent = `👤 ${players[currentIdx].name}의 차례`;
    rollBtn.disabled      = false;
    rollBtn.textContent   = '🎲 굴리기';
  }

  function hideReveal() {
    resultReveal.classList.remove('show');
    resultReveal.innerHTML = '';
  }

  function showReveal(result) {
    resultReveal.innerHTML = `
      <span class="result-pip">${pip[result]}</span>
      <span class="result-num">${result}</span>
    `;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resultReveal.classList.add('show'))
    );
  }

  rollBtn.addEventListener('click', () => { if (!rolling) doRoll(); });

  function doRoll() {
    rolling          = true;
    rollBtn.disabled = true;
    rollBtn.textContent = '굴리는 중...';
    hideReveal();

    const result = Math.ceil(Math.random() * 6);

    // Snap to neutral without transition, then animate
    diceEl.style.transition = 'none';
    diceEl.style.transform  = 'rotateX(0deg) rotateY(0deg)';
    diceEl.getBoundingClientRect(); // force reflow

    const spins  = 3 + Math.floor(Math.random() * 2);
    const finalX = faceRot[result].x + TILT_X + spins * 360;
    const finalY = faceRot[result].y + TILT_Y + spins * 360;

    diceEl.style.transition = 'transform 1.5s cubic-bezier(0.18, 0.05, 0.08, 1)';
    diceEl.style.transform  = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;

    if (navigator.vibrate) navigator.vibrate([20, 50, 20, 50, 15]);

    setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(45);

      players[currentIdx].roll = result;
      showReveal(result);
      addScoreRow(players[currentIdx].name, result);

      currentIdx++;
      rolling = false;

      if (currentIdx < players.length) {
        updateTurn();
      } else {
        rollBtn.disabled    = true;
        rollBtn.textContent = '완료!';
        setTimeout(showResult, 800);
      }
    }, 1550);
  }

  function addScoreRow(name, result) {
    const row = document.createElement('div');
    row.className = 'score-row';
    row.innerHTML = `
      <span class="score-row-name">${name}</span>
      <span class="score-row-pip">${pip[result]}</span>
      <span class="score-row-num">${result}</span>
    `;
    scoreList.appendChild(row);
  }

  // --- Result ---
  function showResult() {
    showPanel('result');

    // Sort: highest roll first
    const sorted = [...players].sort((a, b) => b.roll - a.roll);
    const medals = ['🥇', '🥈', '🥉'];

    // Determine punish target based on rule
    const punishScore = punishRule === 'low'
      ? sorted[sorted.length - 1].roll  // lowest roll loses
      : sorted[0].roll;                  // highest roll loses

    // Winner: the other extreme
    const winScore = punishRule === 'low' ? sorted[0].roll : sorted[sorted.length - 1].roll;

    const losers      = sorted.filter(p => p.roll === punishScore);
    const isLoserTie  = losers.length > 1;
    const isWinnerTie = sorted.filter(p => p.roll === winScore).length > 1;

    resultList.innerHTML = '';
    sorted.forEach(p => {
      // Rank by distance from winning score
      const rank = punishRule === 'low'
        ? sorted.filter(o => o.roll > p.roll).length + 1   // higher is better
        : sorted.filter(o => o.roll < p.roll).length + 1;  // lower is better

      const rankDisplay = medals[rank - 1] || `${rank}위`;
      const isLoser     = p.roll === punishScore;
      const isWinner    = p.roll === winScore;

      const div = document.createElement('div');
      div.className = 'result-item'
        + (isWinner && !isWinnerTie ? ' winner' : '')
        + (isLoser ? ' loser' : '');
      div.innerHTML = `
        <span class="result-rank">${rankDisplay}</span>
        <span class="result-name">${p.name}</span>
        <span class="result-score">${pip[p.roll]} ${p.roll}</span>
      `;
      resultList.appendChild(div);
    });

    if (isLoserTie) {
      const names = losers.map(p => `<strong>${p.name}</strong>`).join(', ');
      loserBox.innerHTML      = `💀 ${names} 동점! 재대결합니다 (${punishScore})`;
      rerollBtn.style.display = 'block';
    } else {
      loserBox.innerHTML      = `💀 <strong>${losers[0].name}</strong> 벌칙! (${punishScore})`;
      rerollBtn.style.display = 'none';
    }
  }

  // Reroll: only tied punish-score players reroll
  rerollBtn.addEventListener('click', () => {
    const punishScore = punishRule === 'low'
      ? Math.min(...players.map(p => p.roll))
      : Math.max(...players.map(p => p.roll));
    const tiedPlayers = players
      .filter(p => p.roll === punishScore)
      .map(p => ({ name: p.name, roll: null }));
    startGame(tiedPlayers);
  });

  againBtn.addEventListener('click', () => showPanel('setup'));
});
