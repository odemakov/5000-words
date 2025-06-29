<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Storage } from '../lib/storage.js';
  import { type Level } from '$lib/constants/modes';
  import { LearningController } from '../lib/controllers/LearningController.js';
  import Loader from '../lib/components/Loader.svelte';
  import FlashCard from '$lib/components/FlashCard.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import Header from '$lib/components/Header.svelte';
  import FinalResult from '$lib/components/FinalResult.svelte';
  import UserInstructions from '$lib/components/UserInstructions.svelte';
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
    const learningState = Storage.getLearningState();

    if (hasWords && userLevel && learningState) {
      // User has completed setup and has learning progress
      goto('/learning');
    } else if (hasWords && userLevel) {
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

  async function handleLandingComplete() {
    // Save the detected level
    if (detectedLevel) {
      Storage.setUserLevel(detectedLevel);

      // Initialize learning controller with test results
      const testResults = $testState.responses.map((response, index) => ({
        wordId: index,
        known: response
      }));

      await LearningController.initializeQueueFilling(detectedLevel as Level, testResults);

      // Navigate to learning page
      goto('/learning');
    }
  }

  // Level test handlers
  function handleKnown() {
    // User knows this word
    recordResponse(true);
  }

  function handleUnknown() {
    // User doesn't know this word
    recordResponse(false);
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
            startingWord={getStartingWordForLevel(detectedLevel)}
            onContinue={handleLandingComplete}
          />
        {:else if word}
          <FlashCard
            word={word?.word || ''}
            properties={word?.props || []}
            translations={word?.translations || []}
            onKnown={handleKnown}
            onUnknown={handleUnknown}
          />

          <UserInstructions />
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
      <div class="text-center">
        <div
          class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
        ></div>
        <p class="mb-2 text-xl text-gray-600">Setting up your learning experience...</p>
        <p class="text-sm text-gray-500">This will only take a moment</p>
      </div>
    </div>
  {/if}
</main>
