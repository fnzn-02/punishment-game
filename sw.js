const CACHE = 'punishment-game-v8';

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

// Cache-first: 캐시에 있으면 캐시, 없으면 네트워크
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
