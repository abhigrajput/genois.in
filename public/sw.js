const CACHE_NAME = 'genois-v3';
const URLS_TO_CACHE = ['/', '/dashboard', '/login'];

const PASSTHROUGH_DOMAINS = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (PASSTHROUGH_DOMAINS.some(d => event.request.url.includes(d))) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.url.includes('/api/')) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
