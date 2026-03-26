document.addEventListener('DOMContentLoaded', () => {
  const mouthWrap  = document.getElementById('mouth-wrap');
  const upperJaw   = document.getElementById('upper-jaw');
  const upperRow   = document.getElementById('upper-teeth-row');
  const lowerRow   = document.getElementById('lower-teeth-row');
  const statusBox  = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const countNum   = document.getElementById('count-num');
  const restartBtn = document.getElementById('restart-btn');
  const biteFlash  = document.getElementById('bite-flash');

  // 이빨 개수 & 크기 정의 (13개, 자연스러운 U자형 크기 변화)
  const TEETH = [
    { w: 26, h: 38 }, // 1 — 가장자리
    { w: 30, h: 46 }, // 2
    { w: 34, h: 52 }, // 3
    { w: 36, h: 58 }, // 4
    { w: 38, h: 62 }, // 5 — 앞니
    { w: 40, h: 65 }, // 6 — 중앙 최대
    { w: 40, h: 65 }, // 7 — 중앙 최대
    { w: 38, h: 62 }, // 8
    { w: 36, h: 58 }, // 9
    { w: 34, h: 52 }, // 10
    { w: 30, h: 46 }, // 11
    { w: 26, h: 38 }, // 12
    { w: 22, h: 32 }, // 13 — 가장자리
  ];

  // 윗니: 아랫니보다 약간 작게, 위치 엇갈리게
  const UPPER = [
    { w: 22, h: 32 },
    { w: 28, h: 42 },
    { w: 32, h: 50 },
    { w: 36, h: 56 },
    { w: 34, h: 52 },
    { w: 28, h: 42 },
    { w: 22, h: 32 },
  ];

  const TOTAL = TEETH.length;
  let trapIndex = -1;
  let remaining = TOTAL;
  let gameOver  = false;

  function init() {
    gameOver  = false;
    remaining = TOTAL;
    trapIndex = Math.floor(Math.random() * TOTAL);
    countNum.textContent = TOTAL;
    restartBtn.style.display = 'none';

    mouthWrap.classList.remove('bite', 'shake');
    statusBox.classList.remove('danger', 'safe-msg');
    statusText.textContent = '두근두근... 이빨을 눌러보세요!';

    buildUpperTeeth();
    buildLowerTeeth();
  }

  function buildUpperTeeth() {
    upperRow.innerHTML = '';
    UPPER.forEach(t => {
      const el = document.createElement('div');
      el.className = 'upper-tooth';
      el.style.width  = t.w + 'px';
      el.style.height = t.h + 'px';
      upperRow.appendChild(el);
    });
  }

  function buildLowerTeeth() {
    lowerRow.innerHTML = '';
    TEETH.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.className = 'tooth-btn';
      btn.style.width  = t.w + 'px';
      btn.style.height = t.h + 'px';
      btn.addEventListener('click', () => handleClick(btn, i));
      lowerRow.appendChild(btn);
    });
  }

  function handleClick(btn, idx) {
    if (gameOver) return;
    if (navigator.vibrate) navigator.vibrate(25);

    if (idx === trapIndex) {
      btn.classList.add('dead');
      triggerBite();
    } else {
      btn.classList.add('pressed');
      btn.disabled = true;
      remaining--;
      countNum.textContent = remaining;
      if (remaining === 0) {
        allSafe();
      } else {
        showSafe();
      }
    }
  }

  function triggerBite() {
    gameOver = true;
    // 모든 버튼 비활성화
    lowerRow.querySelectorAll('.tooth-btn').forEach(b => { b.disabled = true; });

    // 입 닫기 애니메이션
    requestAnimationFrame(() => {
      mouthWrap.classList.add('bite');
      setTimeout(() => mouthWrap.classList.add('shake'), 180);
    });

    // 화면 플래시
    biteFlash.classList.remove('active');
    void biteFlash.offsetWidth;
    biteFlash.classList.add('active');

    // 진동
    if (navigator.vibrate) navigator.vibrate([110, 55, 380]);

    // 상태 메시지
    statusBox.classList.remove('safe-msg');
    statusBox.classList.add('danger');
    statusText.textContent = '🦷 으악!! 물렸다!!';

    setTimeout(() => { restartBtn.style.display = 'inline-block'; }, 850);
  }

  function showSafe() {
    statusBox.classList.remove('danger');
    statusBox.classList.add('safe-msg');
    statusText.textContent = '😮‍💨 휴... 살았습니다!';
    setTimeout(() => {
      statusBox.classList.remove('safe-msg');
      statusText.textContent = '다음 이빨을 눌러보세요!';
    }, 1100);
  }

  function allSafe() {
    statusBox.classList.remove('danger');
    statusBox.classList.add('safe-msg');
    statusText.textContent = '🎉 모두 살아남았어요!';
    restartBtn.style.display = 'inline-block';
  }

  restartBtn.addEventListener('click', init);
  init();
});
