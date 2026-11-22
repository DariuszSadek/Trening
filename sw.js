// Service worker – lista plików i wersja cache aktualizowane przez tools/build.py.
/*BUILD:BEGIN*/
const CACHE = 'trening-1.2.3-1c6063d181';
const ASSETS = ["./", "assets/fonts/OFL.txt", "assets/fonts/libre-baskerville-latin-400-italic.woff2", "assets/fonts/libre-baskerville-latin-400-normal.woff2", "assets/fonts/libre-baskerville-latin-700-normal.woff2", "assets/fonts/libre-baskerville-latin-ext-400-italic.woff2", "assets/fonts/libre-baskerville-latin-ext-400-normal.woff2", "assets/fonts/libre-baskerville-latin-ext-700-normal.woff2", "assets/icon-180.png", "assets/icon-192.png", "assets/icon-512.png", "css/app.css", "index.html", "js/app.js", "js/cwiczenia.js", "js/figs.js", "js/figure.js", "js/plan.js", "js/sound.js", "js/version.js", "manifest.webmanifest"];
/*BUILD:END*/
// Pobieranie z parametrem wersji omija pamięć CDN GitHub Pages (inaczej nowa wersja mogłaby zapisać stare pliki)
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(async u => {
    const r = await fetch(u + (u.includes('?') ? '&' : '?') + 'v=' + CACHE, { cache: 'reload' });
    if (!r.ok) throw new Error(u + ' ' + r.status);
    await c.put(u, r);
  }))));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('trening-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
const ROOT = new URL('./', self.location).pathname;
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // aplikacje synów mają własne service workery – nie przejmuję ich adresów
  if (['brunon/', 'tymon/', 'synowie/', 'syn1/', 'syn2/'].some(d => url.pathname.startsWith(ROOT + d))) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate' && (url.pathname === ROOT || url.pathname === ROOT + 'index.html')) { const idx = await c.match('./') || await c.match('index.html'); if (idx) return idx; }
    try { return await fetch(req); } catch { return new Response('Offline', { status: 503 }); }
  })());
});
