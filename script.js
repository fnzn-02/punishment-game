// 파티클 생성
(function() {
  const container = document.getElementById('particles');
  if (!container) return;
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.bottom = '-10px';
    p.style.animationDuration = (6 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.width = p.style.height = (1.5 + Math.random() * 3.5) + 'px';
    p.style.opacity = (0.35 + Math.random() * 0.5).toString();
    container.appendChild(p);
  }
})();
