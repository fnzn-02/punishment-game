const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let names = ['', ''];
let board = [];
let turn = 0; // 0=X, 1=O
let gameOver = false;

const setupPanel = document.getElementById('setup-panel');
const gamePanel  = document.getElementById('game-panel');
const resultPanel= document.getElementById('result-panel');
const turnBadge  = document.getElementById('turn-badge');
const boardEl    = document.getElementById('board');
const cells      = Array.from(document.querySelectorAll('.cell'));

document.getElementById('start-btn').addEventListener('click', () => {
  const n1 = document.getElementById('name1').value.trim() || '플레이어 1';
  const n2 = document.getElementById('name2').value.trim() || '플레이어 2';
  names = [n1, n2];
  startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  setupPanel.style.display = '';
  gamePanel.style.display = 'none';
  resultPanel.style.display = 'none';
});

document.getElementById('again-btn').addEventListener('click', startGame);

document.getElementById('rename-btn').addEventListener('click', () => {
  setupPanel.style.display = '';
  gamePanel.style.display = 'none';
  resultPanel.style.display = 'none';
});

cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const i = parseInt(cell.dataset.i);
    if (gameOver || board[i] !== null) return;
    placeMove(i);
  });
});

function startGame() {
  board = Array(9).fill(null);
  turn = 0;
  gameOver = false;

  cells.forEach(c => {
    c.className = 'cell';
    c.innerHTML = '';
  });

  setupPanel.style.display = 'none';
  resultPanel.style.display = 'none';
  gamePanel.style.display = '';
  updateTurnBadge();
}

function placeMove(i) {
  const mark = turn === 0 ? 'X' : 'O';
  board[i] = mark;

  const cell = cells[i];
  cell.classList.add('taken', mark.toLowerCase());
  cell.innerHTML = `<span class="cell-mark">${mark === 'X' ? '✕' : '○'}</span>`;

  const winLine = checkWin(mark);
  if (winLine) {
    gameOver = true;
    winLine.forEach(idx => cells[idx].classList.add(`win-${mark.toLowerCase()}`));
    setTimeout(() => showResult('win', turn), 400);
    return;
  }

  if (board.every(v => v !== null)) {
    gameOver = true;
    setTimeout(() => showResult('draw'), 400);
    return;
  }

  turn = 1 - turn;
  updateTurnBadge();
}

function checkWin(mark) {
  return WINS.find(line => line.every(i => board[i] === mark)) || null;
}

function updateTurnBadge() {
  const cls = turn === 0 ? 'x-turn' : 'o-turn';
  const sym = turn === 0 ? '✕' : '○';
  turnBadge.className = `turn-badge ${cls}`;
  turnBadge.textContent = `${sym} ${names[turn]}의 차례`;
}

function showResult(type, winnerIdx) {
  gamePanel.style.display = 'none';
  resultPanel.style.display = '';

  const iconEl  = document.getElementById('result-icon');
  const titleEl = document.getElementById('result-title');
  const boxEl   = document.getElementById('result-box');

  if (type === 'draw') {
    iconEl.textContent = '🤝';
    titleEl.textContent = '무승부!';
    boxEl.className = 'result-box draw';
    boxEl.textContent = '아무도 벌칙 없음\n다시 한 판?';
  } else {
    const loserIdx = 1 - winnerIdx;
    iconEl.textContent = '🏆';
    titleEl.textContent = `${names[winnerIdx]} 승리!`;
    boxEl.className = 'result-box loser';
    boxEl.innerHTML = `😈 벌칙자<br><strong>${names[loserIdx]}</strong>`;
  }
}
