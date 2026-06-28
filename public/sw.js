const CACHE_NAME = 'btz-silos-cache-v3';

// Install Event
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate Event - immediately clean up ALL caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          console.log('Deletando cache antigo:', cache);
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Direct Network-First Fetch without caching files
self.addEventListener('fetch', event => {
  // Always fetch directly from the network to avoid stale/cached HTML/JS bundle issues
  event.respondWith(fetch(event.request));
});
