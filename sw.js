// Service worker – lista plików i wersja cache aktualizowane przez tools/build.py.
/*BUILD:BEGIN*/
const CACHE = 'trening-1.0.1-63105d738a';
const ASSETS = ["./", "assets/fonts/OFL.txt", "assets/fonts/libre-baskerville-latin-400-italic.woff2", "assets/fonts/libre-baskerville-latin-400-normal.woff2", "assets/fonts/libre-baskerville-latin-700-normal.woff2", "assets/fonts/libre-baskerville-latin-ext-400-italic.woff2", "assets/fonts/libre-baskerville-latin-ext-400-normal.woff2", "assets/fonts/libre-baskerville-latin-ext-700-normal.woff2", "assets/icon-180.png", "assets/icon-192.png", "assets/icon-512.png", "css/app.css", "index.html", "js/app.js", "js/cwiczenia.js", "js/figs.js", "js/figure.js", "js/plan.js", "js/sound.js", "js/version.js", "manifest.webmanifest"];
/*BUILD:END*/
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('trening-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const idx = await c.match('./') || await c.match('index.html'); if (idx) return idx; }
    try { return await fetch(req); } catch { return new Response('Offline', { status: 503 }); }
  })());
});
