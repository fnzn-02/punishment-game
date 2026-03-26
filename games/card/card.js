document.addEventListener('DOMContentLoaded', () => {
  // 요소
  const setupPanel  = document.getElementById('setup-panel');
  const gamePanel   = document.getElementById('game-panel');
  const resultPanel = document.getElementById('result-panel');
  const btnDec      = document.getElementById('btn-dec');
  const btnInc      = document.getElementById('btn-inc');
  const playerCount = document.getElementById('player-count');
  const jokerToggle = document.getElementById('joker-toggle');
  const startBtn    = document.getElementById('start-btn');
  const topCard     = document.getElementById('top-card');
  const deckEl      = document.getElementById('deck');
  const deckHint    = document.querySelector('.deck-hint');
  const drawnCards  = document.getElementById('drawn-cards');
  const turnInfo    = document.getElementById('current-player');
  const resetBtn    = document.getElementById('reset-btn');
  const againBtn    = document.getElementById('again-btn');
  const resultTitle = document.getElementById('result-title');
  const resultDesc  = document.getElementById('result-desc');
  const resultIcon  = document.getElementById('result-icon');
  const resultCards = document.getElementById('result-cards');

  let players  = 4;
  let current  = 0;
  let results  = [];
  let deck     = [];
  let useJoker = true;

  // 인원수 조절
  btnDec.addEventListener('click', () => {
    if (players > 2) { players--; playerCount.textContent = players; }
  });
  btnInc.addEventListener('click', () => {
    if (players < 8) { players++; playerCount.textContent = players; }
  });

  jokerToggle.addEventListener('change', () => { useJoker = jokerToggle.checked; });

  // 덱 생성
  function buildDeck() {
    const suits  = ['♠', '♥', '♦', '♣'];
    const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const cards  = [];
    for (const suit of suits) {
      for (const val of values) {
        cards.push({ suit, value: val, numeric: numericValue(val), isJoker: false });
      }
    }
    if (useJoker) {
      cards.push({ suit: '★', value: '🃏', numeric: 0, isJoker: true });
    }
    // 셔플
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  function numericValue(v) {
    if (v === 'A') return 14;
    if (v === 'K') return 13;
    if (v === 'Q') return 12;
    if (v === 'J') return 11;
    return parseInt(v) || 0;
  }

  // 게임 시작
  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', startGame);
  againBtn.addEventListener('click', () => {
    resultPanel.style.display = 'none';
    setupPanel.style.display  = 'flex';
  });

  function startGame() {
    current = 0;
    results = [];
    deck    = buildDeck();
    drawnCards.innerHTML = '';
    deckEl.classList.remove('empty');
    topCard.style.display = 'flex';
    deckHint.textContent = '카드를 클릭하여 뽑기';

    setupPanel.style.display  = 'none';
    resultPanel.style.display = 'none';
    gamePanel.style.display   = 'flex';

    updateTurn();
    topCard.onclick = drawCard;
  }

  function updateTurn() {
    if (current < players) {
      turnInfo.textContent = ordinal(current + 1) + '번째 플레이어';
    }
  }

  function ordinal(n) { return n; }

  function drawCard() {
    if (current >= players || deck.length === 0) return;

    const card = deck.pop();
    results.push({ player: current + 1, card });

    // 카드 요소 생성
    const el = document.createElement('div');
    const isRed = card.suit === '♥' || card.suit === '♦';
    if (card.isJoker) {
      el.className = 'playing-card joker-card';
      el.innerHTML = `🃏<span class="suit">조커</span><span class="player-label">${current + 1}번 플레이어</span>`;
    } else {
      el.className = `playing-card ${isRed ? 'red-card' : 'black-card'}`;
      el.innerHTML = `${card.value}<span class="suit">${card.suit}</span><span class="player-label">${current + 1}번 플레이어</span>`;
    }
    el.style.animationDelay = '0s';
    drawnCards.appendChild(el);

    if (navigator.vibrate) navigator.vibrate(20);

    current++;

    // 조커 즉시 벌칙
    if (card.isJoker) {
      setTimeout(() => showJokerResult(current), 600);
      topCard.onclick = null;
      return;
    }

    if (current >= players) {
      topCard.onclick = null;
      deckEl.classList.add('empty');
      topCard.style.display = 'none';
      deckHint.textContent = '';
      setTimeout(showResult, 600);
    } else {
      updateTurn();
    }
  }

  function showJokerResult(playerNum) {
    // 해당 카드 강조
    const cards = drawnCards.querySelectorAll('.playing-card');
    cards[playerNum - 1].classList.add('loser');

    resultIcon.textContent = '🃏';
    resultTitle.textContent = '조커 등장!';
    resultDesc.innerHTML = `<strong style="color:var(--neon)">${playerNum}번 플레이어</strong>가 조커를 뽑았습니다!<br>즉시 벌칙 실행!`;
    resultCards.innerHTML = '';

    gamePanel.style.display   = 'none';
    resultPanel.style.display = 'flex';
  }

  function showResult() {
    // 가장 낮은 숫자 찾기
    let minVal  = Infinity;
    let losers  = [];
    for (const r of results) {
      if (r.card.numeric < minVal) { minVal = r.card.numeric; losers = [r]; }
      else if (r.card.numeric === minVal) losers.push(r);
    }

    // 뽑힌 카드들 결과 패널에 표시
    resultCards.innerHTML = '';
    for (const r of results) {
      const card = r.card;
      const isRed = card.suit === '♥' || card.suit === '♦';
      const el = document.createElement('div');
      el.className = `playing-card ${isRed ? 'red-card' : 'black-card'}`;
      el.innerHTML = `${card.value}<span class="suit">${card.suit}</span><span class="player-label">${r.player}번</span>`;
      if (losers.some(l => l.player === r.player)) el.classList.add('loser');
      resultCards.appendChild(el);
    }

    const loserNames = losers.map(l => `${l.player}번 플레이어`).join(', ');
    resultIcon.textContent = losers.length > 1 ? '💀💀' : '💀';
    resultTitle.textContent = '벌칙자 결정!';
    resultDesc.innerHTML = `<strong style="color:var(--red)">${loserNames}</strong>이(가) 가장 낮은 카드를 뽑았습니다!`;

    gamePanel.style.display   = 'none';
    resultPanel.style.display = 'flex';
  }
});
