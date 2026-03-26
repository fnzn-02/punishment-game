document.addEventListener('DOMContentLoaded', () => {
  const PLAYER_COLORS = [
    { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#ef4444' },
    { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#3b82f6' },
    { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', text: '#22c55e' },
    { bg: 'rgba(234,179,8,0.15)',  border: '#eab308', text: '#eab308' },
    { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#a855f7' },
    { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#f97316' },
  ];

  // 요소
  const setupPanel  = document.getElementById('setup-panel');
  const gamePanel   = document.getElementById('game-panel');
  const resultPanel = document.getElementById('result-panel');
  const btnDec      = document.getElementById('btn-dec');
  const btnInc      = document.getElementById('btn-inc');
  const playerCountEl = document.getElementById('player-count');
  const startBtn    = document.getElementById('start-btn');
  const playerBadges = document.getElementById('player-badges');
  const hintArrow   = document.getElementById('hint-arrow');
  const rangeLabel  = document.getElementById('range-label');
  const triesBar    = document.getElementById('tries-bar');
  const triesDots   = document.getElementById('tries-dots');
  const triesLabel  = document.getElementById('tries-label');
  const guessInput  = document.getElementById('guess-input');
  const submitBtn   = document.getElementById('submit-btn');
  const historyEl   = document.getElementById('history');
  const resultIcon  = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const resultDesc  = document.getElementById('result-desc');
  const answerReveal= document.getElementById('answer-reveal');
  const playAgainBtn= document.getElementById('play-again-btn');

  // 설정 변수
  let maxRange   = 50;
  let maxTries   = 7;
  let players    = 2;

  // 게임 상태
  let answer     = 0;
  let triesUsed  = 0;
  let currentPlayer = 0;
  let rangeMin   = 1;
  let rangeMax   = 50;

  // 범위 버튼
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      maxRange = parseInt(btn.dataset.range);
    });
  });

  // 시도 버튼
  document.querySelectorAll('.tries-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tries-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      maxTries = parseInt(btn.dataset.tries);
    });
  });

  // 인원수
  btnDec.addEventListener('click', () => {
    if (players > 2) { players--; playerCountEl.textContent = players; }
  });
  btnInc.addEventListener('click', () => {
    if (players < 6) { players++; playerCountEl.textContent = players; }
  });

  startBtn.addEventListener('click', startGame);
  playAgainBtn.addEventListener('click', () => {
    resultPanel.style.display = 'none';
    setupPanel.style.display  = 'flex';
  });

  function startGame() {
    answer  = Math.floor(Math.random() * maxRange) + 1;
    triesUsed = 0;
    currentPlayer = 0;
    rangeMin = 1;
    rangeMax = maxRange;

    setupPanel.style.display  = 'none';
    resultPanel.style.display = 'none';
    gamePanel.style.display   = 'flex';

    hintArrow.textContent = '?';
    hintArrow.className   = 'hint-arrow';
    rangeLabel.textContent = `${rangeMin} ~ ${rangeMax}`;
    historyEl.innerHTML   = '';
    guessInput.value      = '';
    guessInput.max        = maxRange;

    buildBadges();
    buildTriesDots();
    updateActivePlayer();
    guessInput.focus();
  }

  function buildBadges() {
    playerBadges.innerHTML = '';
    for (let i = 0; i < players; i++) {
      const c   = PLAYER_COLORS[i];
      const el  = document.createElement('div');
      el.className = 'player-badge';
      el.id     = `badge-${i}`;
      el.style.background   = c.bg;
      el.style.borderColor  = c.border;
      el.style.color        = c.text;
      el.textContent = `${i + 1}P`;
      playerBadges.appendChild(el);
    }
  }

  function buildTriesDots() {
    if (maxTries === 0) {
      triesBar.style.display = 'none';
      return;
    }
    triesBar.style.display = 'flex';
    triesDots.innerHTML = '';
    for (let i = 0; i < maxTries; i++) {
      const dot = document.createElement('div');
      dot.className = 'try-dot';
      dot.id = `dot-${i}`;
      triesDots.appendChild(dot);
    }
    updateTriesLabel();
  }

  function updateActivePlayer() {
    document.querySelectorAll('.player-badge').forEach((b, i) => {
      b.classList.toggle('active', i === currentPlayer);
    });
  }

  function updateTriesLabel() {
    if (maxTries === 0) return;
    const left = maxTries - triesUsed;
    triesLabel.textContent = `남은 시도: ${left}번`;
  }

  submitBtn.addEventListener('click', handleGuess);
  guessInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleGuess();
  });

  function handleGuess() {
    const val = parseInt(guessInput.value);
    if (isNaN(val) || val < 1 || val > maxRange) {
      guessInput.style.borderColor = '#ef4444';
      setTimeout(() => { guessInput.style.borderColor = ''; }, 600);
      return;
    }

    guessInput.value = '';
    triesUsed++;

    // 시도 점 업데이트
    if (maxTries > 0) {
      const dot = document.getElementById(`dot-${triesUsed - 1}`);
      if (dot) dot.classList.add('used');
      updateTriesLabel();
    }

    if (navigator.vibrate) navigator.vibrate(30);

    if (val === answer) {
      // 정답!
      hintArrow.textContent = '🎯';
      hintArrow.className   = 'hint-arrow exact';
      setTimeout(() => showWin(val), 400);
      return;
    }

    const isUp = val < answer;

    // 범위 업데이트
    if (isUp)  rangeMin = Math.max(rangeMin, val + 1);
    else       rangeMax = Math.min(rangeMax, val - 1);
    rangeLabel.textContent = `${rangeMin} ~ ${rangeMax}`;

    // 화살표 업데이트
    hintArrow.className   = `hint-arrow ${isUp ? 'up' : 'down'}`;
    hintArrow.textContent = isUp ? '▲ UP' : '▼ DOWN';

    // 히스토리 추가
    const chip = document.createElement('div');
    chip.className = `history-chip ${isUp ? 'up' : 'down'}`;
    chip.textContent = `${val} ${isUp ? '▲' : '▼'}`;
    historyEl.appendChild(chip);

    // 다음 플레이어
    currentPlayer = (currentPlayer + 1) % players;
    updateActivePlayer();

    // 시도 초과 → 패배 처리 (틀린 플레이어가 벌칙)
    if (maxTries > 0 && triesUsed >= maxTries) {
      const loserIdx = currentPlayer === 0 ? players - 1 : currentPlayer - 1;
      setTimeout(() => showLose(loserIdx), 400);
    }

    guessInput.focus();
  }

  function showWin(val) {
    // 직전 입력한 플레이어 찾기 (currentPlayer는 이미 넘어간 상태)
    const winnerIdx = currentPlayer === 0 ? players - 1 : currentPlayer - 1;
    const winColor  = PLAYER_COLORS[winnerIdx].text;

    answerReveal.textContent = `정답: ${val}`;
    resultIcon.textContent   = '🎉';
    resultTitle.textContent  = '정답!';
    resultTitle.style.color  = '#22c55e';
    resultDesc.innerHTML     = `<strong style="color:${winColor}">${winnerIdx + 1}번 플레이어</strong>가 정답을 맞혔습니다!<br>다른 플레이어들이 벌칙 실행!`;

    gamePanel.style.display   = 'none';
    resultPanel.style.display = 'flex';
  }

  function showLose(loserIdx) {
    const loserColor = PLAYER_COLORS[loserIdx].text;

    answerReveal.textContent = `정답: ${answer}`;
    resultIcon.textContent   = '💀';
    resultTitle.textContent  = '시도 초과!';
    resultTitle.style.color  = '#ef4444';
    resultDesc.innerHTML     = `마지막으로 틀린 <strong style="color:${loserColor}">${loserIdx + 1}번 플레이어</strong>가 벌칙 실행!`;

    gamePanel.style.display   = 'none';
    resultPanel.style.display = 'flex';
  }
});
