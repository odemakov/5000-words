<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Storage } from '../storage.js';

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
      // Get cached data
      const cachedWords = Storage.getWords();
      const cachedVersion = Storage.getVersion();

      // If we have both cached words and version, we can check for updates
      if (cachedWords && cachedVersion) {
        // Check for updates
        const { needsUpdate, version } = await Storage.checkForWordsUpdate();

        if (!needsUpdate && version) {
          console.log('Words are up to date');
          ready = true;
          loading = false;
          return;
        }

        // If update needed, download with the version we already retrieved
        console.log('Downloading words...');
        if (version) {
          const { words } = await Storage.downloadWords(version);

          // Save to storage
          Storage.saveWords(words);
          Storage.saveVersion(version);

          console.log(`Downloaded ${words.length} words (version: ${version.words_version})`);
        }
      } else {
        // No cached data, download everything
        console.log('First-time download...');
        const { version } = await Storage.checkForWordsUpdate();

        if (version) {
          const { words } = await Storage.downloadWords(version);

          // Save to storage
          Storage.saveWords(words);
          Storage.saveVersion(version);

          console.log(`Downloaded ${words.length} words (version: ${version.words_version})`);
        }
      }

      ready = true;
      loading = false;
    } catch (err) {
      console.error('Failed to load words:', err);

      // Try to use cached words as fallback
      const cachedWords = Storage.getWords();
      if (cachedWords) {
        console.log('Using cached words as fallback');
        ready = true;
        loading = false;
      } else {
        error = true;
        loading = false;
      }
    }
  }

  function handleStartClick() {
    dispatch('wordsLoaded');
  }

  function handleRetry() {
    checkAndLoadWords();
  }
</script>

<div class="flex min-h-screen w-full flex-col items-center justify-center px-4 py-6 md:p-6">
  <!-- Header -->
  <div class="mb-6 text-center md:mb-8">
    <h1 class="mb-2 text-3xl font-bold text-blue-600 md:text-4xl">5000 Words</h1>
    <p class="text-sm text-gray-600 md:text-base">Setting up your flashcards...</p>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="text-center">
      <div
        class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 md:h-16 md:w-16"
      ></div>
      <p class="mb-2 text-sm text-gray-600 md:text-base">Loading 5000 French words...</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="text-center">
      <div
        class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 md:h-16 md:w-16"
      >
        <svg
          class="h-6 w-6 text-red-500 md:h-8 md:w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      </div>
      <p class="mb-4 text-sm text-red-600 md:text-base">
        Download failed. Check connection and retry.
      </p>
      <button
        onclick={handleRetry}
        class="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600 md:px-6 md:py-2 md:text-base"
      >
        Retry
      </button>
    </div>
  {/if}

  <!-- Success State -->
  {#if ready}
    <div class="text-center">
      <div
        class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 md:h-16 md:w-16"
      >
        <svg
          class="h-6 w-6 text-green-500 md:h-8 md:w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
          ></path>
        </svg>
      </div>
      <p class="mb-4 text-sm text-green-600 md:mb-6 md:text-base">Ready to start learning!</p>
      <button
        onclick={handleStartClick}
        class="w-full max-w-xs rounded-lg bg-blue-600 px-6 py-2 text-base font-semibold text-white transition-colors hover:bg-blue-700 md:w-auto md:px-8 md:py-3 md:text-lg"
      >
        Begin Level Test
      </button>
    </div>
  {/if}
</div>
