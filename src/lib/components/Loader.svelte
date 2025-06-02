<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Storage, type WordData } from '../storage.js';

  const dispatch = createEventDispatcher<{
    wordsLoaded: void;
  }>();

  let loading = $state(false);
  let error = $state(false);
  let ready = $state(false);

  onMount(() => {
    checkAndLoadWords();
  });

  async function checkAndLoadWords() {
    loading = true;
    error = false;
    ready = false;

    try {
      // Check if we need to download words
      const cachedWords = Storage.getWords();
      const shouldUpdate = Storage.shouldCheckForUpdates();

      if (cachedWords && !shouldUpdate) {
        console.log('Using cached words');
        ready = true;
        loading = false;
        return;
      }

      console.log('Downloading words...');
      
      // Download words.json
      const response = await fetch('/words.json', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate data structure
      if (!data.words || !Array.isArray(data.words) || data.words.length === 0) {
        throw new Error('Invalid words data structure');
      }

      // Save to storage
      Storage.saveWords(data.words);
      Storage.saveWordsVersion(data.version || '1.0.0');

      console.log(`Loaded ${data.words.length} words (version: ${data.version})`);
      
      ready = true;
      loading = false;

    } catch (err) {
      console.error('Failed to load words:', err);
      error = true;
      loading = false;
    }
  }

  function handleStartClick() {
    dispatch('wordsLoaded');
  }

  function handleRetry() {
    checkAndLoadWords();
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-6">
  <!-- Header -->
  <div class="mb-8 text-center">
    <h1 class="mb-2 text-4xl font-bold text-blue-600">5000 Words</h1>
    <p class="text-gray-600">Setting up your flashcards...</p>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="text-center">
      <div class="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      <p class="mb-2 text-gray-600">Loading 5000 French words...</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <p class="mb-4 text-red-600">Download failed. Check connection and retry.</p>
      <button 
        onclick={handleRetry}
        class="rounded-lg bg-red-500 px-6 py-2 text-white transition-colors hover:bg-red-600"
      >
        Retry
      </button>
    </div>
  {/if}

  <!-- Success State -->
  {#if ready}
    <div class="text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg class="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <p class="mb-6 text-green-600">Ready to start learning!</p>
      <button 
        onclick={handleStartClick}
        class="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Begin Level Test
      </button>
    </div>
  {/if}
</div>