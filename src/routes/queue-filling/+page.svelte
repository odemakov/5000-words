<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import QueueFilling from '$lib/components/QueueFilling.svelte';
  import {
    UnifiedLearningService,
    unifiedLearningState,
    getWordByIndex
  } from '$lib/services/UnifiedLearningService';

  let currentWord: { word: string; props: string[]; translations: string[]; index: number } | null =
    null;
  let stats = { learnedCount: 0, canSwitchToLearning: false };
  let isInitialized = false;

  onMount(async () => {
    // Initialize the unified learning service
    await UnifiedLearningService.initialize();

    const state = $unifiedLearningState;

    // Check if we have any learning data
    const hasData = state.learningQueue.length > 0 || state.learnedWords.length > 0;
    if (!hasData) {
      // If no data, redirect to home to take level test
      goto('/');
      return;
    }

    isInitialized = true;
    loadNextWord();
    updateStats();
  });

  function loadNextWord() {
    const state = $unifiedLearningState;
    const currentProgress = state.progress;
    const wordsInQueue = new Set(state.learningQueue.map((item) => item.wordId));
    const learnedWords = new Set(state.learnedWords);

    // Find next available word
    for (let i = currentProgress; i < 5000; i++) {
      if (!wordsInQueue.has(i) && !learnedWords.has(i)) {
        const wordData = getWordByIndex(i);
        if (wordData) {
          currentWord = {
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            index: i
          };
          return;
        }
      }
    }

    currentWord = null;
  }

  function updateStats() {
    const state = $unifiedLearningState;
    stats = {
      learnedCount: state.learnedWords.length,
      canSwitchToLearning: UnifiedLearningService.getAvailableWordsCount() >= 10
    };
  }

  function handleAddToQueue() {
    if (currentWord) {
      UnifiedLearningService.addWordToQueue(currentWord.index);
      loadNextWord();
      updateStats();
    }
  }

  function handleAddToLearned() {
    if (currentWord) {
      UnifiedLearningService.addWordToLearned(currentWord.index);
      loadNextWord();
      updateStats();
    }
  }

  function handleSwitchToLearning() {
    if (stats.canSwitchToLearning) {
      goto('/learning');
    }
  }

  function handleSkip() {
    if (currentWord) {
      // Just move to next word without adding to any list
      unifiedLearningState.update((s) => ({
        ...s,
        progress: Math.max(s.progress, currentWord!.index + 1)
      }));
      loadNextWord();
    }
  }
</script>

<svelte:head>
  <title>Building Your Queue - 5000 Words</title>
  <meta name="description" content="Build your learning queue with French vocabulary" />
</svelte:head>

{#if !isInitialized}
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <div
        class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
      ></div>
      <p class="text-gray-600">Setting up your queue...</p>
    </div>
  </div>
{:else if currentWord}
  <QueueFilling
    word={currentWord.word}
    properties={currentWord.props}
    translations={currentWord.translations}
    totalWords={5000}
    learnedCount={stats.learnedCount}
    canSwitchToLearning={stats.canSwitchToLearning}
    on:addToQueue={handleAddToQueue}
    on:addToLearned={handleAddToLearned}
    on:switchToLearning={handleSwitchToLearning}
    on:skip={handleSkip}
  />
{:else}
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="mx-auto max-w-md p-6 text-center">
      <div class="mb-4">
        <svg
          class="mx-auto h-16 w-16 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 class="mb-2 text-2xl font-bold text-gray-900">All Words Reviewed!</h1>
      <p class="mb-6 text-gray-600">
        You've gone through all available words for your level.
        {#if stats.canSwitchToLearning}
          You can start learning with your queue of {UnifiedLearningService.getAvailableWordsCount()}
          words.
        {:else}
          You have {UnifiedLearningService.getAvailableWordsCount()} words in your queue and {stats.learnedCount}
          words marked as known.
        {/if}
      </p>

      <div class="space-y-3">
        {#if stats.canSwitchToLearning}
          <button
            on:click={handleSwitchToLearning}
            class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Start Learning ({UnifiedLearningService.getAvailableWordsCount()} words)
          </button>
        {/if}

        <button
          on:click={() => goto('/learning')}
          class="w-full rounded-lg bg-gray-600 px-4 py-3 font-medium text-white transition-colors hover:bg-gray-700"
        >
          Go to Learning Page
        </button>
      </div>
    </div>
  </div>
{/if}
