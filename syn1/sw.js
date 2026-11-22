// Service worker aplikacji syna – generowany przez tools/build.py z synowie/sw-template.js.
/*BUILD:BEGIN*/
const CACHE = 'syn1-1.0.0-c948e9ae38';
const PREFIX = 'syn1-';
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "../css/app.css", "../synowie/syn.css", "../synowie/app-syn.js", "../synowie/plan-syn.js", "../synowie/version.js", "../js/cwiczenia.js", "../js/figs.js", "../js/figure.js", "../js/sound.js", "../assets/fonts/OFL.txt", "../assets/fonts/libre-baskerville-latin-400-italic.woff2", "../assets/fonts/libre-baskerville-latin-400-normal.woff2", "../assets/fonts/libre-baskerville-latin-700-normal.woff2", "../assets/fonts/libre-baskerville-latin-ext-400-italic.woff2", "../assets/fonts/libre-baskerville-latin-ext-400-normal.woff2", "../assets/fonts/libre-baskerville-latin-ext-700-normal.woff2"];
/*BUILD:END*/
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
const ROOT = new URL('./', self.location).pathname;
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate' && (url.pathname === ROOT || url.pathname === ROOT + 'index.html')) { const idx = await c.match('./') || await c.match('index.html'); if (idx) return idx; }
    try { return await fetch(req); } catch { return new Response('Offline', { status: 503 }); }
  })());
});
