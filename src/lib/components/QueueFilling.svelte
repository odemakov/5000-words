<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FlashCard from './FlashCard.svelte';
  import UserInstructions from './UserInstructions.svelte';
  import { CardDirection } from '$lib/types/queue';
  import { unifiedLearningState, queueStats } from '$lib/services/UnifiedLearningService';

  export let word: string = '';
  export let properties: string[] = [];
  export let translations: string[] = [];
  export const totalWords: number = 0;
  export let learnedCount: number = 0;
  export let canSwitchToLearning: boolean = false;

  type Events = {
    addToQueue: void;
    addToLearned: void;
    switchToLearning: void;
    skip: void;
  };

  const dispatch = createEventDispatcher<Events>();

  function handleUnknown() {
    dispatch('addToQueue');
  }

  function handleKnown() {
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
        handleUnknown();
        break;
      case 'ArrowRight':
        event.preventDefault();
        handleKnown();
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
  <!-- Main Content -->
  <div class="mx-auto flex max-w-2xl flex-col items-center px-4 py-6">
    <!-- Queue Stats -->
    <div class="mb-6 w-full rounded-lg bg-white p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600">
            {$queueStats.passive.total + $queueStats.active.total}
          </div>
          <div class="text-xs tracking-wide text-gray-500 uppercase">To Learn</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">{learnedCount}</div>
          <div class="text-xs tracking-wide text-gray-500 uppercase">Already Know</div>
        </div>
      </div>
    </div>

    <!-- Flash Card -->
    {#if word}
      <div class="w-full max-w-md">
        <FlashCard
          {word}
          {properties}
          {translations}
          direction={CardDirection.PASSIVE}
          onKnown={handleKnown}
          onUnknown={handleUnknown}
        />
      </div>

      <!-- Instructions -->
      <UserInstructions showTapInstruction={false} variant="compact" />
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
          Start Learning ({$queueStats.passive.total + $queueStats.active.total} words)
        </button>
        <p class="mt-2 text-center text-xs text-gray-500">
          Or continue adding words • Press Enter to start learning
        </p>
      </div>
    {/if}
  </div>
</div>
