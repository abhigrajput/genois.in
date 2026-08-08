const CACHE_NAME = 'genois-v5';
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

  // Only ever touch our OWN requests.
  //
  // This handler used to intercept every GET, cross-origin included. A
  // cross-origin subresource (an <img> from i.ytimg.com, say) is a `no-cors`
  // request; re-issuing it here with `fetch(event.request)` and handing the
  // result back through respondWith() gives the page an opaque response it
  // cannot use, so the load fails. The symptom was silent and total: EVERY
  // cross-origin image on the site rendered as a broken-image glyph — the
  // YouTube thumbnails behind <VideoPlayer asModal> among them.
  //
  // Cross-origin <iframe> navigations are not routed through a service worker,
  // which is why the video player itself looked fine while its poster did not.
  //
  // There is nothing to gain by proxying another origin's assets: we do not
  // cache them (they are not in URLS_TO_CACHE) and the browser's own HTTP cache
  // already handles them. So we decline, and the browser fetches them natively.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  if (SKIP_CACHE.some(s => event.request.url.includes(s))) {
    return; // let browser handle normally
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
