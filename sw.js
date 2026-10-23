const CACHE = 'punishment-game-v11';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './theme.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './games/ladder/ladder.html',
  './games/ladder/ladder.css',
  './games/ladder/ladder.js',
  './games/draw/draw.html',
  './games/draw/draw.css',
  './games/draw/draw.js',
  './games/updown/updown.html',
  './games/updown/updown.css',
  './games/updown/updown.js',
  './games/lucky/lucky.html',
  './games/lucky/lucky.css',
  './games/lucky/lucky.js',
  './games/reaction/reaction.html',
  './games/reaction/reaction.css',
  './games/reaction/reaction.js',
  './games/timing/timing.html',
  './games/timing/timing.css',
  './games/timing/timing.js',
  './games/stopwatch/stopwatch.html',
  './games/stopwatch/stopwatch.css',
  './games/stopwatch/stopwatch.js',
  './games/mole/mole.html',
  './games/mole/mole.css',
  './games/mole/mole.js',
  './games/dice/dice.html',
  './games/dice/dice.css',
  './games/dice/dice.js',
  './games/tictactoe/tictactoe.html',
  './games/tictactoe/tictactoe.css',
  './games/tictactoe/tictactoe.js',
  './games/fireworks/fireworks.html',
  './games/fireworks/fireworks.css',
  './games/fireworks/fireworks.js',
  './games/bigwheel/bigwheel.html',
  './games/bigwheel/bigwheel.css',
  './games/bigwheel/bigwheel.js',
  './games/draw2/draw2.html',
  './games/draw2/draw2.css',
  './games/draw2/draw2.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: 온라인이면 항상 최신 파일을 받아 캐시를 갱신하고,
// 오프라인이거나 요청이 실패하면 캐시된 파일로 대체한다.
// (배포할 때마다 CACHE 버전을 올리지 않아도 수정본이 바로 반영됨)
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || Response.error()))
  );
});
