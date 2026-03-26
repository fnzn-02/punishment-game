// theme.js — 공통 라이트/다크 모드 관리
(function () {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  // 토글 버튼 CSS 주입
  const s = document.createElement('style');
  s.textContent = `
    .theme-toggle {
      margin-left: auto;
      background: none;
      border: 1px solid var(--card-border, #2a2a4a);
      border-radius: 0.5rem;
      padding: 0.35rem 0.65rem;
      cursor: pointer;
      font-size: 1.05rem;
      line-height: 1;
      height: auto !important;
      width: auto !important;
      transition: border-color 0.2s, background 0.2s;
      flex-shrink: 0;
    }
    .theme-toggle:hover {
      border-color: var(--accent2, #a855f7);
      background: rgba(168,85,247,0.08);
    }
  `;
  document.head.appendChild(s);

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.app-header') || document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.title = '라이트/다크 모드 전환';
    btn.textContent = saved === 'dark' ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
    header.appendChild(btn);
  });
})();
