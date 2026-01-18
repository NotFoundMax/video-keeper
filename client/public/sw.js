const CACHE_NAME = 'video-keeper-v3-final';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Cache First for Assets, Network First for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ONLY handle http and https requests
  if (!url.protocol.startsWith('http')) return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // CRITICAL: Skip /bookmarklet/ routes - they need to handle redirects directly
  if (url.pathname.startsWith('/bookmarklet/')) {
    return; // Let the network handle it directly, don't intercept
  }

  // For API calls, try Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For static assets and navigation, try Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      // For navigation requests (SPA routing), return index.html if not in cache
      if (request.mode === 'navigate') {
        return caches.match('/index.html');
      }

      return fetch(request).then((response) => {
        // Cache new static assets if they are from our own origin or common CDNs
        if (response.ok && (url.origin === self.location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com'))) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});
