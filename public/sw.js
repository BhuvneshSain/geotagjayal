const CACHE_NAME = 'geotag-jayal-v1';
const PRE_CACHE_ASSETS = [
  '/geotagjayal/',
  '/geotagjayal/index.html',
  '/geotagjayal/manifest.json',
  '/geotagjayal/icon-192.png',
  '/geotagjayal/icon-512.png',
  '/geotagjayal/bharatnet/',
  '/geotagjayal/bharatnet/index.html',
  '/geotagjayal/bharatnet/admin/',
  '/geotagjayal/bharatnet/admin/index.html'
];

// Install: pre-cache static application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline portal shell...');
      return cache.addAll(PRE_CACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Failed to pre-cache some assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up older caches if version shifts
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache storage:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fallback to network and dynamically cache
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip caching for API queries (e.g. Dropbox, reverse geocoding OSM)
  if (
    requestUrl.hostname.includes('api.dropboxapi.com') ||
    requestUrl.hostname.includes('content.dropboxapi.com') ||
    requestUrl.hostname.includes('api.dropbox.com') ||
    requestUrl.hostname.includes('nominatim.openstreetmap.org') ||
    requestUrl.hostname.includes('corsproxy.io') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached resource immediately
        return cachedResponse;
      }

      // Fallback to network and cache dynamically for styles/scripts/fonts/images
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an HTML page, serve main index fallback if appropriate
          if (event.request.mode === 'navigate') {
            return caches.match('/geotagjayal/index.html');
          }
        });
    })
  );
});
