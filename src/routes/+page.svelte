<script lang="ts">
  import { onMount } from 'svelte';
  import { Storage } from '../lib/storage.js';
  import Loader from '../lib/components/Loader.svelte';
  import FlashCard from '$lib/components/FlashCard.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import Header from '$lib/components/Header.svelte';
  import FinalResult from '$lib/components/FinalResult.svelte';
  import {
    testState,
    currentWord,
    progress,
    loadTestBatch,
    recordResponse,
    undo,
    getStartingWordForLevel
  } from '$lib/controllers/TestController';

  type AppState = 'loader' | 'landing' | 'learning';
  let currentState = $state<AppState>('loader');

  // Subscribe to our stores for level test
  const word = $derived($currentWord);
  const testProgress = $derived($progress);
  const isCompleted = $derived($testState.isCompleted);
  const detectedLevel = $derived($testState.detectedLevel);

  onMount(() => {
    // Register service worker
    registerServiceWorker();

    // Determine initial state
    const hasWords = Storage.getWords();
    const userLevel = Storage.getUserLevel();

    if (hasWords && userLevel) {
      currentState = 'learning';
    } else if (hasWords) {
      currentState = 'landing';
      // Initialize the test when we're in landing mode
      loadTestBatch(1, 100);
    } else {
      currentState = 'loader';
    }
  });

  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }

  function handleWordsLoaded() {
    currentState = 'landing';
    // Initialize the test after words are loaded
    loadTestBatch(1, 100);
  }

  function handleLandingComplete() {
    // Save the detected level
    if (detectedLevel) {
      Storage.setUserLevel(detectedLevel);
    }
    currentState = 'learning';
  }

  // Level test handlers
  function handleSwipeRight() {
    // User knows this word
    recordResponse(true);
  }

  function handleSwipeLeft() {
    // User doesn't know this word
    recordResponse(false);
  }

  function handleSwipeUp() {
    // Not used in test mode, but included for completeness
  }

  function handleUndo() {
    undo();
  }
</script>

<svelte:head>
  <title>5000 Words - French Learning</title>
  <meta name="description" content="Learn French vocabulary with 5000 most frequent words" />
  <meta name="theme-color" content="#2563eb" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<main class="min-h-screen w-full bg-gray-50">
  {#if currentState === 'loader'}
    <Loader on:wordsLoaded={handleWordsLoaded} />
  {:else if currentState === 'landing'}
    <div class="flex h-screen flex-col bg-gray-50">
      <Header
        title="French-Russian Flashcards"
        subtitle={`Testing words ${testProgress.batchRange}`}
        showUndo={testProgress.current > 0}
        onUndo={handleUndo}
      />

      <main class="flex flex-1 flex-col items-center justify-center p-4">
        {#if isCompleted}
          <FinalResult
            level={detectedLevel as 'A1' | 'A2' | 'B1' | 'B2'}
            startingWord={getStartingWordForLevel(detectedLevel)}
            onContinue={handleLandingComplete}
          />
        {:else if word}
          <FlashCard
            word={word?.word || ''}
            properties={word?.props || []}
            translations={word?.translations || []}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onSwipeUp={handleSwipeUp}
          />

          <div class="mt-8 w-full max-w-md text-center text-sm text-gray-500">
            <p>Tap the card to see the translation</p>
            <p class="mt-2">
              Swipe <span class="text-green-500">right</span> if you know the word,
              <span class="text-red-500">left</span> if you don't
            </p>
          </div>
        {:else}
          <div class="text-center">
            <p class="text-gray-600">Loading test words...</p>
          </div>
        {/if}
      </main>

      {#if !isCompleted && word}
        <ProgressBar current={testProgress.current} total={testProgress.total} />
      {/if}
    </div>
  {:else if currentState === 'learning'}
    <div class="flex min-h-screen items-center justify-center p-4">
      <p class="text-center text-xl text-gray-600">Learning component coming next...</p>
    </div>
  {/if}
</main>
