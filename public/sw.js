// Offline support: pages and assets you have already opened keep working without a connection.
const CACHE = 'readup-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/') || req.headers.has('range')) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname === '/icon.svg') {
    e.respondWith(
      caches.match(req).then(
        (hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      )
    );
    return;
  }

  // Pages: network first, fall back to the last copy we saw.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || new Response('You are offline, and this page has not been opened before.', { status: 503, headers: { 'content-type': 'text/plain' } })))
  );
});
