// Offline support: app shell is served stale-while-revalidate, news is network-first.
// WaniKani API calls are cross-origin and never cached here.

// The origin (solthax.github.io) is shared with other apps: only ever touch caches named benkyo-*.
const CACHE = 'benkyo-v6';
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/api.js',
  'js/store.js',
  'js/progress.js',
  'js/curriculum.js',
  'js/jp.js',
  'js/sync.js',
  'js/obsidian.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' bypasses the HTTP cache (10 min on Pages) so a new version never caches stale files.
  const fresh = SHELL.map((u) => new Request(u, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(fresh)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('benkyo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.endsWith('/data/news.json')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('data/news.json', copy));
          return res;
        })
        .catch(() => caches.match('data/news.json')),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
