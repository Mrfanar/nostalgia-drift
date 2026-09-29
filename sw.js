// Offline cache for the drift game. Bump VERSION when you upload new files so phones pick them up.
const VERSION = 'nostalgia-drift-v16';
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "s15.b64.txt", "red_front.jpg", "red_rear.jpg", "red_left.jpg", "red_right.jpg", "black_front.jpg", "black_rear.jpg", "black_left.jpg", "black_right.jpg", "a1_col.jpg", "a1_nor.jpg", "a1_rgh.jpg", "a2_col.jpg", "a2_nor.jpg", "a2_rgh.jpg", "gr_col.jpg", "gr_nor.jpg", "gr_rgh.jpg", "pano.webp", "night.webp"];
self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never stores the old files again
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // cache only the game itself, three.js/peerjs from jsdelivr and the fonts; never the room server (peerjs.com)
  const url = new URL(e.request.url), h = url.host;
  if (h !== location.host && h !== 'cdn.jsdelivr.net' && h !== 'fonts.googleapis.com' && h !== 'fonts.gstatic.com') return;
  // the game page itself: network first (always the newest version), the cached copy only when offline
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); }
      return r;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // everything else (model, liveries, libraries): answer from cache at once, refresh it in the background
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
