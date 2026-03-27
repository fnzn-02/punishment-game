document.addEventListener('DOMContentLoaded', () => {
  const setupPanel  = document.getElementById('setup-panel');
  const gamePanel   = document.getElementById('game-panel');
  const resultPanel = document.getElementById('result-panel');
  const playerCountEl = document.getElementById('player-count');
  const btnDec      = document.getElementById('btn-dec');
  const btnInc      = document.getElementById('btn-inc');
  const roundBtns   = document.querySelectorAll('.round-btn');
  const startBtn    = document.getElementById('start-btn');
  const turnBadge   = document.getElementById('turn-badge');
  const reactionArea = document.getElementById('reaction-area');
  const reactionIcon = document.getElementById('reaction-icon');
  const reactionMsg  = document.getElementById('reaction-msg');
  const reactionSub  = document.getElementById('reaction-sub');
  const restartBtn  = document.getElementById('restart-btn');
  const resultList  = document.getElementById('result-list');
  const loserBox    = document.getElementById('loser-box');
  const againBtn    = document.getElementById('again-btn');

  let playerCount = 2;
  let roundCount  = 1;
  let players     = []; // [{ name, times: [], avg }]
  let currentPlayerIdx = 0;
  let currentRound = 1;
  let phase = 'idle'; // idle | waiting | ready | done
  let signalTimer = null;
  let signalStart = 0;

  // 플레이어 수 조절
  btnDec.addEventListener('click', () => {
    if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; }
  });
  btnInc.addEventListener('click', () => {
    if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; }
  });

  roundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roundCount = +btn.dataset.rounds;
      roundBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', resetToSetup);
  againBtn.addEventListener('click', resetToSetup);

  function startGame() {
    players = Array.from({ length: playerCount }, (_, i) => ({
      name: `${i + 1}번`,
      times: [],
      avg: 0
    }));
    currentPlayerIdx = 0;
    currentRound = 1;

    setupPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    gamePanel.style.display = 'flex';

    nextTurn();
  }

  function nextTurn() {
    // 모든 플레이어가 현재 라운드 완료했으면 다음 라운드
    if (currentPlayerIdx >= playerCount) {
      currentRound++;
      currentPlayerIdx = 0;
    }

    // 모든 라운드 완료
    if (currentRound > roundCount) {
      showResult();
      return;
    }

    const player = players[currentPlayerIdx];
    turnBadge.textContent = `👤 ${player.name} — ${roundCount > 1 ? `${currentRound}/${roundCount} 라운드` : '차례'}`;

    setPhase('idle');
  }

  function setPhase(p) {
    phase = p;
    reactionArea.classList.remove('wait', 'go');

    if (p === 'idle') {
      reactionIcon.textContent = '⚡';
      reactionMsg.textContent = '터치해서 시작';
      reactionSub.textContent = '';
    } else if (p === 'waiting') {
      reactionArea.classList.add('wait');
      reactionIcon.textContent = '🔴';
      reactionMsg.textContent = '잠깐...';
      reactionSub.textContent = '신호가 뜰 때까지 기다리세요!';

      const delay = 1500 + Math.random() * 3000;
      signalTimer = setTimeout(() => {
        setPhase('ready');
      }, delay);
    } else if (p === 'ready') {
      reactionArea.classList.add('go');
      reactionIcon.textContent = '🟢';
      reactionMsg.textContent = '지금!!!';
      reactionSub.textContent = '빨리 터치!';
      signalStart = performance.now();
    } else if (p === 'done') {
      reactionIcon.textContent = '✅';
      reactionMsg.textContent = '';
    }
  }

  reactionArea.addEventListener('click', () => {
    if (phase === 'idle') {
      setPhase('waiting');
      return;
    }

    if (phase === 'waiting') {
      // 너무 일찍 눌렀음
      clearTimeout(signalTimer);
      reactionArea.classList.remove('wait');
      reactionIcon.textContent = '❌';
      reactionMsg.textContent = '너무 일찍!';
      reactionSub.textContent = '다시 시도하세요';
      phase = 'penalized';

      setTimeout(() => setPhase('idle'), 1200);
      return;
    }

    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - signalStart);
      players[currentPlayerIdx].times.push(elapsed);

      setPhase('done');
      reactionMsg.textContent = `${elapsed}ms`;
      reactionSub.textContent = elapsed < 250 ? '엄청 빠르다! 🔥' : elapsed < 400 ? '잘 했어요!' : '조금 느렸어요...';

      currentPlayerIdx++;

      setTimeout(() => {
        nextTurn();
      }, 1500);
    }
  });

  function showResult() {
    // 평균 계산
    players.forEach(p => {
      p.avg = p.times.length
        ? Math.round(p.times.reduce((a, b) => a + b, 0) / p.times.length)
        : 9999;
    });

    // 정렬 (빠른 순)
    const sorted = [...players].sort((a, b) => a.avg - b.avg);

    gamePanel.style.display = 'none';
    resultPanel.style.display = 'flex';

    resultList.innerHTML = '';
    sorted.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'result-item';
      if (i === 0) div.classList.add('fastest');
      if (i === sorted.length - 1) div.classList.add('slowest');

      const medals = ['🥇', '🥈', '🥉'];
      const rank = medals[i] || `${i + 1}위`;

      div.innerHTML = `
        <span class="result-rank">${rank}</span>
        <span class="result-name">${p.name}</span>
        <span class="result-time">${p.avg}ms</span>
      `;
      resultList.appendChild(div);
    });

    const loser = sorted[sorted.length - 1];
    loserBox.innerHTML = `💀 <strong>${loser.name}</strong> 벌칙! (${loser.avg}ms)`;
  }

  function resetToSetup() {
    clearTimeout(signalTimer);
    phase = 'idle';
    gamePanel.style.display = 'none';
    resultPanel.style.display = 'none';
    setupPanel.style.display = 'flex';
  }
});
