document.addEventListener('DOMContentLoaded', () => {
  const COLORS = [
    { bg: '#ef4444', text: '#ff9999', name: '빨강' },
    { bg: '#f97316', text: '#ffb570', name: '주황' },
    { bg: '#eab308', text: '#fde68a', name: '노랑' },
    { bg: '#22c55e', text: '#86efac', name: '초록' },
    { bg: '#3b82f6', text: '#93c5fd', name: '파랑' },
    { bg: '#a855f7', text: '#d8b4fe', name: '보라' },
    { bg: '#ec4899', text: '#f9a8d4', name: '분홍' },
    { bg: '#6b7280', text: '#d1d5db', name: '회색' },
  ];

  const EMOJIS = ['🎉','💀','🌟','🔥','😈','🎁','👑','💣'];

  const inputPanel   = document.getElementById('input-panel');
  const playPanel    = document.getElementById('play-panel');
  const itemsGrid    = document.getElementById('items-grid');
  const readyBtn     = document.getElementById('ready-btn');
  const editBtn      = document.getElementById('edit-btn');
  const coinSlot     = document.getElementById('coin-slot');
  const capsuleInner = document.getElementById('capsules-inside');
  const capsuleResult= document.getElementById('capsule-result');
  const capsule3d    = document.getElementById('capsule-3d');
  const capTop       = document.getElementById('cap-top');
  const capBottom    = document.getElementById('cap-bottom');
  const resultContent= document.getElementById('result-content');
  const resultEmoji  = document.getElementById('result-emoji');
  const resultText   = document.getElementById('result-text');
  const statusMsg    = document.getElementById('status-msg');
  const pulledList   = document.getElementById('pulled-list');
  const chuteDoor    = document.getElementById('chute-door');

  let items    = [];
  let remaining= [];
  let isAnimating = false;

  // 입력 행 만들기
  function buildItemRows() {
    itemsGrid.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const row = document.createElement('div');
      row.className = 'item-row';
      const dot = document.createElement('div');
      dot.className = 'item-dot';
      dot.style.background = COLORS[i].bg;
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `${COLORS[i].name} 항목`;
      input.id = `item-${i}`;
      row.appendChild(dot);
      row.appendChild(input);
      itemsGrid.appendChild(row);
    }
  }

  // 안에 미니 캡슐 채우기
  function buildGlobeCapsules(colorList) {
    capsuleInner.innerHTML = '';
    colorList.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'mini-capsule';
      el.style.background = c.bg;
      el.style.setProperty('--delay', `${i * 0.3}s`);
      capsuleInner.appendChild(el);
    });
  }

  readyBtn.addEventListener('click', () => {
    items = [];
    for (let i = 0; i < 8; i++) {
      const val = document.getElementById(`item-${i}`).value.trim();
      if (val) items.push({ label: val, color: COLORS[i], emoji: EMOJIS[i] });
    }
    if (items.length < 2) {
      alert('최소 2개 이상 입력해주세요!');
      return;
    }
    remaining = [...items];
    buildGlobeCapsules(remaining.map(r => r.color));
    pulledList.innerHTML = '';
    statusMsg.textContent = '코인 슬롯을 눌러 캡슐을 뽑으세요!';
    capsuleResult.style.display = 'none';
    resultContent.style.display = 'none';
    capsule3d.classList.remove('open');
    inputPanel.style.display = 'none';
    playPanel.style.display  = 'flex';
  });

  editBtn.addEventListener('click', () => {
    inputPanel.style.display = 'flex';
    playPanel.style.display  = 'none';
  });

  coinSlot.addEventListener('click', async () => {
    if (isAnimating) return;
    if (remaining.length === 0) {
      statusMsg.textContent = '모든 캡슐을 뽑았습니다! 항목을 수정하고 다시 하세요.';
      return;
    }

    isAnimating = true;
    coinSlot.classList.add('disabled');

    // 랜덤으로 하나 뽑기
    const idx  = Math.floor(Math.random() * remaining.length);
    const item = remaining.splice(idx, 1)[0];

    // 캡슐 색상 설정
    capTop.style.background = item.color.bg;
    capBottom.style.background = item.color.bg;

    // 출구 열기
    chuteDoor.classList.add('open');

    // 캡슐 등장
    capsuleResult.style.display = 'flex';
    resultContent.style.display = 'none';
    capsule3d.classList.remove('open');
    await delay(600);

    if (navigator.vibrate) navigator.vibrate([60, 40, 120]);

    // 캡슐 열리기
    capsule3d.classList.add('open');
    await delay(600);

    // 결과 표시
    resultEmoji.textContent = item.emoji;
    resultText.textContent  = item.label;
    resultContent.style.display = 'flex';

    // 뽑힌 목록 추가
    const tag = document.createElement('div');
    tag.className = 'pulled-tag';
    tag.style.background   = `${item.color.bg}22`;
    tag.style.color        = item.color.text;
    tag.style.borderColor  = item.color.bg;
    tag.textContent = `${item.emoji} ${item.label}`;
    pulledList.appendChild(tag);

    // 유리구 업데이트
    buildGlobeCapsules(remaining.map(r => r.color));

    statusMsg.textContent = remaining.length > 0
      ? `남은 캡슐: ${remaining.length}개`
      : '모든 캡슐을 뽑았습니다!';

    await delay(400);
    chuteDoor.classList.remove('open');
    coinSlot.classList.remove('disabled');
    isAnimating = false;
  });

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  buildItemRows();
});
