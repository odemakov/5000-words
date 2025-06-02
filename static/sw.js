const CACHE_NAME = '5000-words-v1';
const urlsToCache = ['/', '/words.json'];

// Install event - cache app shell
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('Service Worker: Caching app shell');
			return cache.addAll(urlsToCache);
		})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('Service Worker: Deleting old cache', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

// Fetch event - custom caching strategies
self.addEventListener('fetch', (event) => {
	if (event.request.url.includes('words.json')) {
		event.respondWith(handleWordsRequest(event.request));
	} else {
		event.respondWith(defaultCacheStrategy(event.request));
	}
});

// Custom handler for words.json with daily update check
async function handleWordsRequest(request) {
	const cache = await caches.open('words-cache-v1');
	const cachedResponse = await cache.match(request);

	// Check if we should update (once per day)
	if (cachedResponse && !(await shouldCheckForUpdates())) {
		console.log('Service Worker: Serving words.json from cache (checked today)');
		return cachedResponse;
	}

	// Check network for updates
	console.log('Service Worker: Checking for words.json updates...');
	try {
		const networkResponse = await fetch(request, {
			cache: 'no-cache',
			headers: {
				'Cache-Control': 'no-cache'
			}
		});

		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
			return networkResponse;
		} else {
			throw new Error(`HTTP ${networkResponse.status}`);
		}
	} catch (error) {
		console.log('Service Worker: Network failed, serving from cache', error);
		return cachedResponse || new Response('Offline', { status: 503 });
	}
}

// Default caching strategy for other resources
async function defaultCacheStrategy(request) {
	const cache = await caches.open(CACHE_NAME);

	try {
		// Try network first
		const networkResponse = await fetch(request);

		// Cache successful responses
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	} catch (error) {
		// Network failed, try cache
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		// If it's a navigation request, return the cached index.html
		if (request.mode === 'navigate') {
			return cache.match('/');
		}

		return new Response('Offline', { status: 503 });
	}
}

// Check if we should update words.json (once per day)
async function shouldCheckForUpdates() {
	try {
		const lastCheck = await getLastCheckTimestamp();
		const now = Date.now();
		const oneDayMs = 24 * 60 * 60 * 1000;

		if (!lastCheck || now - lastCheck > oneDayMs) {
			await setLastCheckTimestamp(now);
			return true;
		}
		return false;
	} catch (error) {
		console.log('Service Worker: Error checking update timestamp', error);
		return true;
	}
}

// Timestamp storage using Cache API
async function getLastCheckTimestamp() {
	try {
		const cache = await caches.open('timestamp-cache');
		const response = await cache.match('/last-check');
		if (response) {
			const timestamp = await response.text();
			return parseInt(timestamp);
		}
	} catch (error) {
		console.log('Service Worker: Error getting timestamp', error);
	}
	return null;
}

async function setLastCheckTimestamp(timestamp) {
	try {
		const cache = await caches.open('timestamp-cache');
		await cache.put('/last-check', new Response(timestamp.toString()));
	} catch (error) {
		console.log('Service Worker: Error setting timestamp', error);
	}
}
