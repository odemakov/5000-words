<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LEVEL_A1 } from '$lib/constants/modes';
  import QueueFilling from '$lib/components/QueueFilling.svelte';
  import { LearningController, learningState } from '$lib/controllers/LearningController';

  let currentWord: { word: string; props: string[]; translations: string[]; index: number } | null =
    null;
  let stats = { learnedCount: 0, canSwitchToLearning: false };
  let isInitialized = false;

  // Get level from URL params
  $: level = $page.url.searchParams.get('level') || LEVEL_A1;

  onMount(async () => {
    // Check if we have a valid learning state
    const savedState = LearningController.loadState();
    if (!savedState) {
      // Redirect back to home if no state
      goto('/');
      return;
    }

    isInitialized = true;
    loadNextWord();
    updateStats();
  });

  function loadNextWord() {
    currentWord = LearningController.getCurrentQueueFillingWord();
  }

  function updateStats() {
    const state = $learningState;
    stats = {
      learnedCount: state.learnedList.length,
      canSwitchToLearning: state.forwardQueue.length >= 10
    };
  }

  function handleAddToQueue() {
    if (currentWord) {
      LearningController.addWordToQueue(currentWord.index);
      loadNextWord();
      updateStats();
    }
  }

  function handleAddToLearned() {
    if (currentWord) {
      LearningController.addWordToLearned(currentWord.index);
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
      learningState.update((s) => ({
        ...s,
        progress: Math.max(s.progress, currentWord!.index + 1)
      }));
      LearningController.saveState();
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
    currentIndex={currentWord.index}
    totalWords={5000}
    learnedCount={stats.learnedCount}
    canSwitchToLearning={stats.canSwitchToLearning}
    {level}
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
          You can start learning with your queue of {$learningState.forwardQueue.length} words.
        {:else}
          You have {$learningState.forwardQueue.length} words in your queue and {stats.learnedCount}
          words marked as known.
        {/if}
      </p>

      <div class="space-y-3">
        {#if stats.canSwitchToLearning}
          <button
            on:click={handleSwitchToLearning}
            class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Start Learning ({$learningState.forwardQueue.length} words)
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
