<script lang="ts">
  import { onMount } from 'svelte';

  let online = true;
  let swStatus = 'Not registered';
  let cacheStatus: string[] = [];
  let networkTests: { url: string; status: string; cached: boolean }[] = [];

  onMount(() => {
    // Check online status
    online = navigator.onLine;
    window.addEventListener('online', () => (online = true));
    window.addEventListener('offline', () => (online = false));

    // Check service worker status
    checkServiceWorker();

    // Check caches
    checkCaches();

    // Test network requests
    testNetworkRequests();
  });

  async function checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        if (registration.active) {
          swStatus = 'Active';
        } else if (registration.installing) {
          swStatus = 'Installing';
        } else if (registration.waiting) {
          swStatus = 'Waiting';
        } else {
          swStatus = 'Registered but not active';
        }
      } else {
        swStatus = 'Not registered';
      }
    } else {
      swStatus = 'Not supported';
    }
  }

  async function checkCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      cacheStatus = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cacheStatus.push(`${cacheName}: ${requests.length} items cached`);
      }
    }
  }

  async function testNetworkRequests() {
    const urls = [
      '/',
      '/manifest.json',
      '/favicon.png',
      '/words.json',
      '/words-version.json',
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
      '/apple-touch-icon.png',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/favicon.ico'
    ];

    networkTests = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const cache = await caches.match(url);

        networkTests.push({
          url,
          status: `${response.status} ${response.statusText}`,
          cached: !!cache
        });
      } catch {
        networkTests.push({
          url,
          status: 'Failed',
          cached: !!(await caches.match(url))
        });
      }
    }
  }

  async function clearCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await checkCaches();
      alert('All caches cleared!');
    }
  }

  async function unregisterServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        await checkServiceWorker();
        alert('Service Worker unregistered!');
      }
    }
  }
</script>

<div class="container mx-auto max-w-4xl p-4">
  <h1 class="mb-6 text-3xl font-bold">PWA Offline Test</h1>

  <div class="grid gap-6">
    <!-- Connection Status -->
    <div class="card bg-base-200 rounded-lg p-4">
      <h2 class="mb-3 text-xl font-semibold">Connection Status</h2>
      <p class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full {online ? 'bg-green-500' : 'bg-red-500'}"></span>
        {online ? 'Online' : 'Offline'}
      </p>
    </div>

    <!-- Service Worker Status -->
    <div class="card bg-base-200 rounded-lg p-4">
      <h2 class="mb-3 text-xl font-semibold">Service Worker</h2>
      <p>Status: <span class="font-mono">{swStatus}</span></p>
      <button on:click={unregisterServiceWorker} class="btn btn-sm btn-error mt-2">
        Unregister Service Worker
      </button>
    </div>

    <!-- Cache Status -->
    <div class="card bg-base-200 rounded-lg p-4">
      <h2 class="mb-3 text-xl font-semibold">Cache Status</h2>
      {#if cacheStatus.length > 0}
        <ul class="space-y-1">
          {#each cacheStatus as status (status)}
            <li class="font-mono text-sm">{status}</li>
          {/each}
        </ul>
      {:else}
        <p>No caches found</p>
      {/if}
      <button on:click={clearCaches} class="btn btn-sm btn-error mt-2"> Clear All Caches </button>
    </div>

    <!-- Network Requests Test -->
    <div class="card bg-base-200 rounded-lg p-4">
      <h2 class="mb-3 text-xl font-semibold">Resource Status</h2>
      <div class="overflow-x-auto">
        <table class="table-sm table w-full">
          <thead>
            <tr>
              <th>URL</th>
              <th>Network Status</th>
              <th>Cached</th>
            </tr>
          </thead>
          <tbody>
            {#each networkTests as test (test)}
              <tr>
                <td class="font-mono">{test.url}</td>
                <td>{test.status}</td>
                <td>
                  <span class="badge {test.cached ? 'badge-success' : 'badge-error'}">
                    {test.cached ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <button on:click={testNetworkRequests} class="btn btn-sm btn-primary mt-2">
        Refresh Tests
      </button>
    </div>

    <!-- Instructions -->
    <div class="card bg-base-200 rounded-lg p-4">
      <h2 class="mb-3 text-xl font-semibold">Testing Instructions</h2>
      <ol class="list-inside list-decimal space-y-2">
        <li>Open DevTools Network tab</li>
        <li>Enable "Offline" mode in Network conditions</li>
        <li>Refresh this page - it should still load</li>
        <li>Navigate to the main app - it should work offline</li>
        <li>Check if words data loads from cache</li>
      </ol>
    </div>
  </div>
</div>

<style>
  .card {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
