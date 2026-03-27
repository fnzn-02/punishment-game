document.addEventListener('DOMContentLoaded', () => {
  const setupPanel   = document.getElementById('setup-panel');
  const gamePanel    = document.getElementById('game-panel');
  const resultPanel  = document.getElementById('result-panel');
  const playerCountEl = document.getElementById('player-count');
  const btnDec       = document.getElementById('btn-dec');
  const btnInc       = document.getElementById('btn-inc');
  const timeBtns     = document.querySelectorAll('.time-btn');
  const startBtn     = document.getElementById('start-btn');
  const turnBadge    = document.getElementById('turn-badge');
  const swArea       = document.getElementById('sw-area');
  const swIcon       = document.getElementById('sw-icon');
  const swMsg        = document.getElementById('sw-msg');
  const swSub        = document.getElementById('sw-sub');
  const targetLabel  = document.getElementById('target-label');
  const restartBtn   = document.getElementById('restart-btn');
  const resultList   = document.getElementById('result-list');
  const loserBox     = document.getElementById('loser-box');
  const againBtn     = document.getElementById('again-btn');

  let playerCount = 2;
  let targetSec = 5;
  let players = [];
  let currentIdx = 0;
  let startTime = null;
  let phase = 'idle'; // idle | running | done

  btnDec.addEventListener('click', () => {
    if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; }
  });
  btnInc.addEventListener('click', () => {
    if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; }
  });

  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      targetSec = +btn.dataset.sec;
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', resetToSetup);
  againBtn.addEventListener('click', resetToSetup);

  function startGame() {
    players = Array.from({ length: playerCount }, (_, i) => ({
      name: `${i + 1}번`,
      elapsed: null,
      diff: null
    }));
    currentIdx = 0;

    setupPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    gamePanel.style.display = 'flex';

    nextTurn();
  }

  function nextTurn() {
    if (currentIdx >= playerCount) {
      showResult();
      return;
    }

    turnBadge.textContent = `👤 ${players[currentIdx].name}의 차례`;
    phase = 'idle';
    swArea.className = 'sw-area';
    swIcon.textContent = '⏱️';
    swMsg.textContent = '터치해서 시작';
    swSub.textContent = '';
    targetLabel.textContent = `목표: ${targetSec}초`;
  }

  swArea.addEventListener('click', () => {
    if (phase === 'idle') {
      phase = 'running';
      startTime = performance.now();
      swArea.className = 'sw-area running';
      swIcon.textContent = '⏱️';
      swMsg.textContent = '재는 중...';
      swSub.textContent = `${targetSec}초라고 느껴지면 터치!`;
      targetLabel.textContent = '';
      return;
    }

    if (phase === 'running') {
      const elapsed = (performance.now() - startTime) / 1000;
      const diff = Math.abs(elapsed - targetSec);
      players[currentIdx].elapsed = elapsed;
      players[currentIdx].diff = diff;
      phase = 'done';

      const isClose = diff <= 0.5;
      swArea.className = 'sw-area ' + (isClose ? 'done-good' : 'done-bad');
      swIcon.textContent = isClose ? '🎉' : (diff <= 1.5 ? '😅' : '😬');
      swMsg.textContent = elapsed.toFixed(2) + '초';
      swSub.textContent = isClose
        ? `오차 ${diff.toFixed(2)}초 — 대단해요!`
        : `오차 ${diff.toFixed(2)}초`;
      targetLabel.textContent = `목표: ${targetSec}초`;

      currentIdx++;
      setTimeout(() => nextTurn(), 2000);
    }
  });

  function showResult() {
    gamePanel.style.display = 'none';
    resultPanel.style.display = 'flex';

    const sorted = [...players].sort((a, b) => a.diff - b.diff);

    resultList.innerHTML = '';
    sorted.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'result-item';
      if (i === 0) div.classList.add('best');
      if (i === sorted.length - 1) div.classList.add('worst');

      const medals = ['🥇', '🥈', '🥉'];
      const rank = medals[i] || `${i + 1}위`;
      const sign = p.elapsed >= targetSec ? '+' : '-';

      div.innerHTML = `
        <span class="result-rank">${rank}</span>
        <span class="result-name">${p.name}</span>
        <div class="result-time-col">
          <div class="result-actual">${p.elapsed.toFixed(2)}초</div>
          <div class="result-diff">${sign}${p.diff.toFixed(2)}초 오차</div>
        </div>
      `;
      resultList.appendChild(div);
    });

    const loser = sorted[sorted.length - 1];
    const sign = loser.elapsed >= targetSec ? '+' : '-';
    loserBox.innerHTML = `💀 <strong>${loser.name}</strong> 벌칙! (${sign}${loser.diff.toFixed(2)}초 오차)`;
  }

  function resetToSetup() {
    phase = 'idle';
    gamePanel.style.display = 'none';
    resultPanel.style.display = 'none';
    setupPanel.style.display = 'flex';
  }
});
