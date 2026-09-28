// Offline cache for the drift game. Bump VERSION when you upload new files so phones pick them up.
const VERSION = 'nostalgia-drift-v9';
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "s15.b64.txt", "red_front.jpg", "red_rear.jpg", "red_left.jpg", "red_right.jpg", "black_front.jpg", "black_rear.jpg", "black_left.jpg", "black_right.jpg"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// stale-while-revalidate: answer from cache at once, refresh it in the background (also caches three.js and fonts)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // cache only the game itself, three.js/peerjs from jsdelivr and the fonts; never the room server (peerjs.com)
  const h = new URL(e.request.url).host;
  if (h !== location.host && h !== 'cdn.jsdelivr.net' && h !== 'fonts.googleapis.com' && h !== 'fonts.gstatic.com') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
