document.addEventListener('DOMContentLoaded', () => {
  const setupPanel  = document.getElementById('setup-panel');
  const gamePanel   = document.getElementById('game-panel');
  const resultPanel = document.getElementById('result-panel');
  const playerCountEl = document.getElementById('player-count');
  const btnDec      = document.getElementById('btn-dec');
  const btnInc      = document.getElementById('btn-inc');
  const trapBtns    = document.querySelectorAll('.trap-btn');
  const startBtn    = document.getElementById('start-btn');
  const turnInfo    = document.getElementById('turn-info');
  const capsuleGrid = document.getElementById('capsule-grid');
  const restartBtn  = document.getElementById('restart-btn');
  const resultIcon  = document.getElementById('result-icon');
  const resultTitle = document.getElementById('result-title');
  const resultDesc  = document.getElementById('result-desc');
  const againBtn    = document.getElementById('again-btn');

  let playerCount = 4;
  let trapCount   = 1;
  let currentTurn = 0;  // index into players array
  let players     = []; // [{ name, eliminated }]
  let trapIndexes = new Set();
  let openedCount = 0;
  let capsuleCount = 0;
  let isAnimating = false;


  // 플레이어 수 조절
  btnDec.addEventListener('click', () => {
    if (playerCount > 2) { playerCount--; playerCountEl.textContent = playerCount; clampTraps(); }
  });
  btnInc.addEventListener('click', () => {
    if (playerCount < 10) { playerCount++; playerCountEl.textContent = playerCount; clampTraps(); }
  });

  function clampTraps() {
    const max = Math.max(1, playerCount - 1);
    if (trapCount > max) {
      trapCount = max;
      trapBtns.forEach(b => {
        b.classList.toggle('active', +b.dataset.traps === trapCount);
        b.disabled = +b.dataset.traps > max;
      });
    } else {
      trapBtns.forEach(b => { b.disabled = +b.dataset.traps > max; });
    }
  }

  trapBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      trapCount = +btn.dataset.traps;
      trapBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', resetToSetup);
  againBtn.addEventListener('click', resetToSetup);

  function startGame() {
    players = Array.from({ length: playerCount }, (_, i) => ({ name: `${i + 1}번`, eliminated: false }));
    currentTurn = 0;
    openedCount = 0;
    capsuleCount = playerCount;
    isAnimating = false;

    // 캡슐 수와 동일한 trapIndexes 생성 (capsuleCount 중 trapCount개 랜덤)
    trapIndexes = new Set();
    while (trapIndexes.size < Math.min(trapCount, capsuleCount)) {
      trapIndexes.add(Math.floor(Math.random() * capsuleCount));
    }

    buildCapsules();
    updateTurnDisplay();

    setupPanel.style.display = 'none';
    resultPanel.style.display = 'none';
    gamePanel.style.display = 'flex';
  }

  function buildCapsules() {
    capsuleGrid.innerHTML = '';
    for (let i = 0; i < capsuleCount; i++) {
      const el = document.createElement('div');
      el.className = 'capsule-item';
      el.textContent = '🎱';
      el.dataset.index = i;
      el.addEventListener('click', () => onCapsuleClick(el, i));
      capsuleGrid.appendChild(el);
    }
  }

  function updateTurnDisplay() {
    const active = players.filter(p => !p.eliminated);
    if (active.length === 0) return;
    const player = active[currentTurn % active.length];
    turnInfo.innerHTML = `<div class="turn-badge">👤 ${player.name}의 차례</div>`;
  }

  function onCapsuleClick(el, index) {
    if (isAnimating || el.classList.contains('opened')) return;

    isAnimating = true;
    el.classList.add('opened');
    openedCount++;

    const active = players.filter(p => !p.eliminated);
    const currentPlayer = active[currentTurn % active.length];

    if (trapIndexes.has(index)) {
      // 벌칙 캡슐!
      el.textContent = '💣';
      el.classList.add('trap');
      if (navigator.vibrate) navigator.vibrate([80, 40, 200]);

      currentPlayer.eliminated = true;

      const remainingTraps = [...trapIndexes].filter(t => {
        const caps = capsuleGrid.querySelectorAll('.capsule-item');
        return !caps[t].classList.contains('opened') || t === index;
      });
      const activePlayers = players.filter(p => !p.eliminated);

      setTimeout(() => {
        // 게임 종료 조건: 모든 트랩이 열렸거나 한 명만 남음
        const allTrapsFound = [...capsuleGrid.querySelectorAll('.capsule-item.trap')].length >= Math.min(trapCount, capsuleCount);

        if (allTrapsFound || activePlayers.length === 0) {
          showResult(true, currentPlayer, players.filter(p => p.eliminated));
        } else {
          // 게임 계속 — 탈락자 제거 후 같은 인덱스 위치가 다음 플레이어
          const remaining = players.filter(p => !p.eliminated);
          currentTurn = currentTurn % remaining.length;
          updateTurnDisplay();
          isAnimating = false;
        }
      }, 700);
    } else {
      // 안전 캡슐
      el.textContent = '✅';
      el.classList.add('safe');

      setTimeout(() => {
        advanceTurn();
        isAnimating = false;
      }, 500);
    }
  }

  function advanceTurn() {
    const active = players.filter(p => !p.eliminated);
    currentTurn = (currentTurn + 1) % active.length;
    updateTurnDisplay();
  }

  function showResult(hasTrap, lastLoser, losers) {
    gamePanel.style.display = 'none';
    resultPanel.style.display = 'flex';

    if (losers.length === 1) {
      resultIcon.textContent = '💀';
      resultTitle.textContent = `${losers[0].name} 벌칙!`;
      resultDesc.textContent = `${losers[0].name}이(가) 벌칙 캡슐을 뽑았습니다!`;
    } else {
      resultIcon.textContent = '💥';
      resultTitle.textContent = `${losers.map(p => p.name).join(', ')} 벌칙!`;
      resultDesc.textContent = `벌칙 캡슐을 뽑은 ${losers.length}명이 벌칙을 받습니다!`;
    }
  }

  function resetToSetup() {
    gamePanel.style.display = 'none';
    resultPanel.style.display = 'none';
    setupPanel.style.display = 'flex';
    clampTraps();
  }
});
