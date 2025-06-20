const CACHE_NAME = '5000-words-v1';
const WORDS_VERSION = 'words-version.json';
const WORDS = 'words.json';
const urlsToCache = ['/', '/manifest.json', '/favicon.png', '/words.json', '/words-version.json'];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  // Force waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== 'words-cache-v1' &&
            cacheName !== 'version-cache-v1'
          ) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - custom caching strategies
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.includes(WORDS_VERSION)) {
    event.respondWith(handleVersionRequest(event.request));
  } else if (url.includes(WORDS)) {
    event.respondWith(handleWordsRequest(event.request));
  } else {
    event.respondWith(defaultCacheStrategy(event.request));
  }
});

// Always fetch words-version.json fresh (it's small)
async function handleVersionRequest(request) {
  try {
    const networkResponse = await fetch(request, {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (networkResponse.ok) {
      const cache = await caches.open('version-cache-v1');
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      throw new Error(`HTTP ${networkResponse.status}`);
    }
  } catch (err) {
    console.log('Service Worker: Network failed for words-version.json, trying cache', err);
    const cache = await caches.open('version-cache-v1');
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('{"error": "Offline"}', { status: 503 });
  }
}

// Cache words.json with daily update check
async function handleWordsRequest(request) {
  const cache = await caches.open('words-cache-v1');
  const cachedResponse = await cache.match(request);

  // Check network for updates - silent to avoid duplicate logs
  try {
    const networkResponse = await fetch(request, {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      throw new Error(`HTTP ${networkResponse.status}`);
    }
  } catch (err) {
    console.log('Service Worker: Network failed, serving from cache', err);
    return cachedResponse || new Response('{"error": "Offline"}', { status: 503 });
  }
}

// Default caching strategy for other resources
async function defaultCacheStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses for GET requests
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (err) {
    console.log('Service Worker: Network failed, trying cache', err);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request, return the cached index.html
    if (request.mode === 'navigate') {
      return cache.match('/');
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept').includes('text/html')) {
      return cache.match('/');
    }

    return new Response('Offline', { status: 503 });
  }
}
