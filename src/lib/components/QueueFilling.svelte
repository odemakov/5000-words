<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FlashCard from './FlashCard.svelte';

  export let word: string = '';
  export let properties: string[] = [];
  export let translations: string[] = [];
  export let currentIndex: number = 0;
  export const totalWords: number = 0;
  import { learningState } from '$lib/controllers/LearningController';
  export let learnedCount: number = 0;
  export let canSwitchToLearning: boolean = false;
  export let level: string = '';

  type Events = {
    addToQueue: void;
    addToLearned: void;
    switchToLearning: void;
    skip: void;
  };

  const dispatch = createEventDispatcher<Events>();

  function handleDontKnow() {
    dispatch('addToQueue');
  }

  function handleKnow() {
    dispatch('addToLearned');
  }

  function handleSwitchToLearning() {
    dispatch('switchToLearning');
  }

  function handleSkip() {
    dispatch('skip');
  }

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handleDontKnow();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleKnow();
        break;
      case 'Enter':
        if (canSwitchToLearning) {
          event.preventDefault();
          handleSwitchToLearning();
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleSkip();
        break;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white shadow-sm">
    <div class="mx-auto max-w-2xl px-4 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Building Your Learning Queue</h1>
          <p class="text-sm text-gray-600">Level {level} • Word {currentIndex + 1}</p>
        </div>
        <button on:click={handleSkip} class="text-sm text-gray-500 hover:text-gray-700">
          Skip
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto flex max-w-2xl flex-col items-center px-4 py-6">
    <!-- Queue Stats -->
    <div class="mb-6 w-full rounded-lg bg-white p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600">{$learningState.forwardQueue.length}</div>
          <div class="text-xs tracking-wide text-gray-500 uppercase">To Learn</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">{learnedCount}</div>
          <div class="text-xs tracking-wide text-gray-500 uppercase">Already Know</div>
        </div>
      </div>

      {#if $learningState.forwardQueue.length >= 10}
        <div class="mt-4 rounded-md bg-green-50 p-3 text-center">
          <p class="text-sm font-medium text-green-800">
            Ready to start learning! You have {$learningState.forwardQueue.length} words in your queue.
          </p>
        </div>
      {:else}
        <div class="mt-4 rounded-md bg-blue-50 p-3 text-center">
          <p class="text-sm text-blue-800">
            Add {10 - $learningState.forwardQueue.length} more words to unlock learning mode
          </p>
        </div>
      {/if}
    </div>

    <!-- Flash Card -->
    {#if word}
      <div class="w-full max-w-md">
        <FlashCard
          {word}
          {properties}
          {translations}
          direction="forward"
          onSwipeRight={handleKnow}
          onSwipeLeft={handleDontKnow}
        />
      </div>

      <!-- Instructions -->
      <div class="mt-6 max-w-sm text-center text-sm text-gray-600">
        <p class="mb-3 font-medium">Do you know this word?</p>
        <div class="flex items-center justify-center space-x-6 text-xs">
          <div class="flex items-center space-x-2">
            <span class="inline-block h-3 w-3 rounded bg-red-500"></span>
            <span>Don't know<br />(← or swipe left)</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="inline-block h-3 w-3 rounded bg-green-500"></span>
            <span>I know this<br />(→ or swipe right)</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center">
        <div
          class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
        ></div>
        <p class="text-gray-600">Loading next word...</p>
      </div>
    {/if}

    <!-- Action Button -->
    {#if canSwitchToLearning}
      <div class="mt-8 w-full max-w-md">
        <button
          on:click={handleSwitchToLearning}
          class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Start Learning ({$learningState.forwardQueue.length} words)
        </button>
        <p class="mt-2 text-center text-xs text-gray-500">
          Or continue adding words • Press Enter to start learning
        </p>
      </div>
    {/if}

    <!-- Progress Bar -->
    <div class="mt-8 w-full max-w-md">
      <div class="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Queue Progress</span>
        <span>{Math.min($learningState.forwardQueue.length, 10)}/10 minimum</span>
      </div>
      <div class="h-2 w-full rounded-full bg-gray-200">
        <div
          class="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style="width: {Math.min(($learningState.forwardQueue.length / 10) * 100, 100)}%"
        ></div>
      </div>
    </div>

    <!-- Keyboard Shortcuts -->
    <div class="mt-8 text-center text-xs text-gray-400">
      <p>Keyboard shortcuts: ← → for answers, Enter to start learning, Esc to skip</p>
    </div>
  </div>
</div>
