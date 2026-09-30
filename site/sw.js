/* Maps 64 service worker: network first, cache as fallback, so the game plays offline
   once loaded and an online visit always picks up the latest deploy. */
const CACHE = 'maps64-v3';
const CORE = [
  './', 'index.html', 'jukebox.html', 'manifest.webmanifest',
  'audio.js', 'vendor/d3.min.js', 'vendor/topojson-client.min.js', 'vendor/countries-50m.json',
  'fonts/pixelify-400.woff2', 'fonts/pixelify-500.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
