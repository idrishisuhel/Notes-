const CACHE = 'vibenote-v1';
const CORE = ['./widget.html', './widget.webmanifest', './widget-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const ours = u.origin === self.location.origin && /\/widget[^/]*$/.test(u.pathname);
  const lib = /^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(u.hostname);
  if (!ours && !lib) return; // the video app and everything else stay untouched
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((r) => {
          if (r && (r.ok || r.type === 'opaque')) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
