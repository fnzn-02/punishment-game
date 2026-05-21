document.addEventListener('DOMContentLoaded', () => {
  const setupPanel   = document.getElementById('setup-panel');
  const gamePanel    = document.getElementById('game-panel');
  const resultPanel  = document.getElementById('result-panel');
  const playerCountEl = document.getElementById('player-count');
  const btnDec       = document.getElementById('btn-dec');
  const btnInc       = document.getElementById('btn-inc');
  const startBtn     = document.getElementById('start-btn');
  const turnBadge    = document.getElementById('turn-badge');
  const needle       = document.getElementById('needle');
  const tapArea      = document.getElementById('tap-area');
  const tapIcon      = document.getElementById('tap-icon');
  const tapMsg       = document.getElementById('tap-msg');
  const tapSub       = document.getElementById('tap-sub');
  const restartBtn   = document.getElementById('restart-btn');
  const resultList   = document.getElementById('result-list');
  const loserBox     = document.getElementById('loser-box');
  const againBtn     = document.getElementById('again-btn');

  let playerCount = 2;
  let players = [];
  let currentIdx = 0;

  // 바늘 상태
  let pos = 0;        // 0 ~ 100 (%)
  let dir = 1;        // 1 or -1
  let speed = 100;    // % per second
  let lastTime = null;
  let animFrame = null;
  let phase = 'idle'; // idle | running | done

  let TARGET_LEFT = 44;
  let TARGET_RIGHT = 56;
  const TARGET_CENTER = 50;
  const targetZoneEl = document.getElementById('target-zone');

  btnDec.addEventListener('click', () => {
    if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; }
  });
  btnInc.addEventListener('click', () => {
    if (playerCount < 8) { playerCount++; playerCountEl.textContent = playerCount; }
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', resetToSetup);
  againBtn.addEventListener('click', resetToSetup);

  function startGame() {
    players = Array.from({ length: playerCount }, (_, i) => ({
      name: `${i + 1}번`,
      deviation: null,
      inZone: false
    }));
    currentIdx = 0;

    TARGET_LEFT = 44;
    TARGET_RIGHT = 56;
    targetZoneEl.style.left = '';
    targetZoneEl.style.width = '';

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

    const player = players[currentIdx];
    turnBadge.textContent = `👤 ${player.name}의 차례`;

    // 바늘 초기화
    stopAnimation();
    pos = 0;
    dir = 1;
    needle.style.left = '0%';
    needle.className = 'needle';

    tapArea.className = 'tap-area';
    tapIcon.textContent = '👆';
    tapMsg.textContent = '터치해서 시작';
    tapSub.textContent = '';
    phase = 'idle';
  }

  tapArea.addEventListener('click', () => {
    if (phase === 'idle') {
      phase = 'running';
      tapMsg.textContent = '멈춰!';
      tapIcon.textContent = '🎯';
      tapSub.textContent = '초록 구역에 맞춰 터치!';
      // 라운드마다 속도 살짝 다르게
      // 낚시게임급 속도 (280~380% per second), 뒤 순서일수록 더 빠름
      speed = 280 + currentIdx * 20 + Math.random() * 100;
      lastTime = null;
      animFrame = requestAnimationFrame(animate);
      return;
    }

    if (phase === 'running') {
      stopAnimation();
      phase = 'done';

      const deviation = Math.abs(pos - TARGET_CENTER);
      const inZone = pos >= TARGET_LEFT && pos <= TARGET_RIGHT;

      players[currentIdx].deviation = Math.round(deviation * 10) / 10;
      players[currentIdx].inZone = inZone;

      needle.classList.add(inZone ? 'stopped-safe' : 'stopped-miss');
      tapArea.className = 'tap-area ' + (inZone ? 'hit' : 'miss');
      tapIcon.textContent = inZone ? '🎉' : '😬';
      tapMsg.textContent = inZone ? '구역 안!' : '빗나감!';
      tapSub.textContent = `중앙에서 ${players[currentIdx].deviation}% 벗어남`;

      currentIdx++;
      setTimeout(() => nextTurn(), 1800);
    }
  });

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    pos += dir * speed * delta;

    if (pos >= 100) { pos = 100; dir = -1; }
    if (pos <= 0) { pos = 0; dir = 1; }

    needle.style.left = `calc(${pos}% - 3px)`;
    animFrame = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    lastTime = null;
  }

  function showResult() {
    stopAnimation();

    const allInZone = players.every(p => p.inZone);

    if (allInZone) {
      // 모두 구역 안 — 구역 줄이고 다시 하기
      TARGET_LEFT = 46;
      TARGET_RIGHT = 54;
      targetZoneEl.style.left = '46%';
      targetZoneEl.style.width = '8%';

      currentIdx = 0;
      players.forEach(p => { p.deviation = null; p.inZone = false; });
      turnBadge.textContent = '🎉 모두 성공! 다시 도전!';
      setTimeout(() => nextTurn(), 1500);
      return;
    }

    gamePanel.style.display = 'none';
    resultPanel.style.display = 'flex';

    const sorted = [...players].sort((a, b) => a.deviation - b.deviation);

    resultList.innerHTML = '';
    sorted.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'result-item';
      if (i === 0) div.classList.add('fastest');
      if (i === sorted.length - 1) div.classList.add('slowest');

      const medals = ['🥇', '🥈', '🥉'];
      const rank = medals[i] || `${i + 1}위`;
      const zoneText = p.inZone ? ' ✅' : '';

      div.innerHTML = `
        <span class="result-rank">${rank}</span>
        <span class="result-name">${p.name}${zoneText}</span>
        <span class="result-score">${p.deviation}% 벗어남</span>
      `;
      resultList.appendChild(div);
    });

    const loser = sorted[sorted.length - 1];
    loserBox.innerHTML = `💀 <strong>${loser.name}</strong> 벌칙! (${loser.deviation}% 벗어남)`;
  }

  function resetToSetup() {
    stopAnimation();
    phase = 'idle';
    gamePanel.style.display = 'none';
    resultPanel.style.display = 'none';
    setupPanel.style.display = 'flex';
  }
});
