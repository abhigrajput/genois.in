const CACHE_NAME = 'genois-v4';
const URLS_TO_CACHE = ['/', '/dashboard', '/login'];

const SKIP_CACHE = [
  '/api/',
  'googletagmanager.com',
  'google-analytics.com',
  'supabase.co',
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
  if (SKIP_CACHE.some(s => event.request.url.includes(s))) {
    return; // let browser handle normally
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
