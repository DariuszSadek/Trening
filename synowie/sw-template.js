// Service worker aplikacji syna – generowany przez tools/build.py z synowie/sw-template.js.
/*BUILD:BEGIN*/
const CACHE = 'synX-dev';
const PREFIX = 'synX-';
const ASSETS = [];
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
