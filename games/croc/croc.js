document.addEventListener('DOMContentLoaded', () => {
  const overlay    = document.getElementById('teeth-overlay');
  const crocEl     = document.getElementById('croc-container');
  const statusBox  = document.getElementById('status-box');
  const statusText = document.getElementById('status-text');
  const countNum   = document.getElementById('count-num');
  const restartBtn = document.getElementById('restart-btn');
  const biteFlash  = document.getElementById('bite-flash');

  const TOTAL = 13;
  let trapIndex = -1;
  let remaining = TOTAL;
  let gameOver  = false;

  function init() {
    gameOver  = false;
    remaining = TOTAL;
    trapIndex = Math.floor(Math.random() * TOTAL);
    countNum.textContent = TOTAL;
    restartBtn.style.display = 'none';
    crocEl.classList.remove('bite', 'shake', 'danger');
    statusBox.classList.remove('danger', 'safe-msg');
    statusText.textContent = '두근두근... 이빨을 눌러보세요!';
    buildTeeth();
  }

  function buildTeeth() {
    overlay.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      const btn = document.createElement('button');
      btn.className = 'tooth-btn';
      // 양 끝 이빨 위로 살짝 올려서 U자형 느낌
      if (i < 3 || i >= TOTAL - 3) btn.style.marginBottom = '10%';
      btn.addEventListener('click', () => handleClick(btn, i));
      overlay.appendChild(btn);
    }
  }

  function handleClick(btn, idx) {
    if (gameOver) return;
    if (navigator.vibrate) navigator.vibrate(30);

    if (idx === trapIndex) {
      btn.classList.add('dead');
      triggerBite();
    } else {
      btn.classList.add('pressed');
      btn.disabled = true;
      remaining--;
      countNum.textContent = remaining;
      showSafe();
      if (remaining === 0) showAllSafe();
    }
  }

  function triggerBite() {
    gameOver = true;
    overlay.querySelectorAll('.tooth-btn').forEach(b => { b.disabled = true; });

    crocEl.classList.add('bite');
    setTimeout(() => {
      crocEl.classList.add('shake');
      crocEl.classList.add('danger');
    }, 80);

    // 화면 플래시
    biteFlash.classList.remove('active');
    void biteFlash.offsetWidth;
    biteFlash.classList.add('active');

    if (navigator.vibrate) navigator.vibrate([120, 60, 420]);

    statusBox.classList.add('danger');
    statusText.textContent = '🦷 으악!! 물렸다!!';

    setTimeout(() => {
      restartBtn.style.display = 'inline-block';
    }, 900);
  }

  function showSafe() {
    statusBox.classList.remove('danger');
    statusBox.classList.add('safe-msg');
    statusText.textContent = '😮‍💨 휴... 살았습니다!';
    setTimeout(() => {
      statusBox.classList.remove('safe-msg');
      statusText.textContent = '다음 이빨을 눌러보세요!';
    }, 1200);
  }

  function showAllSafe() {
    statusBox.classList.remove('safe-msg');
    statusBox.classList.add('safe-msg');
    statusText.textContent = '🎉 모두 살아남았어요!';
    restartBtn.style.display = 'inline-block';
  }

  // 눈동자 마우스 추적
  document.addEventListener('mousemove', (e) => {
    if (gameOver) return;
    const pl = document.getElementById('pupil-l');
    const pr = document.getElementById('pupil-r');
    if (!pl || !pr) return;
    const rect = crocEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-6, Math.min(6, (e.clientX - cx) / 40));
    const dy = Math.max(-5, Math.min(5, (e.clientY - cy) / 40));
    pl.setAttribute('transform', `translate(${dx},${dy})`);
    pr.setAttribute('transform', `translate(${dx},${dy})`);
  });

  restartBtn.addEventListener('click', init);
  init();
});
