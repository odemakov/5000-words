<script lang="ts">
  import { type LearningMode } from '$lib/constants/modes';
  export let onModeSwitch: (mode: LearningMode) => void;
  import { learningState } from '$lib/controllers/LearningController';
  import {
    LEARNING_FORWARD,
    LEARNING_BACKWARD,
    RECAP_7,
    RECAP_14,
    RECAP_30
  } from '$lib/constants/modes';

  $: canSwitchToForward = $learningState.forwardQueue.length > 0;
  $: canSwitchToBackward = $learningState.backwardQueue.length > 0;
  $: canSwitchToLearning = canSwitchToForward || canSwitchToBackward;

  $: canSwitchToRecap7 = $learningState.forwardQueue.length > 0;
  $: canSwitchToRecap14 = $learningState.recap14.length > 0;
  $: canSwitchToRecap30 = $learningState.recap30.length > 0;
  $: canSwitchToRecap = canSwitchToRecap7 || canSwitchToRecap14 || canSwitchToRecap30;

  function handleRecapModes() {
    if (canSwitchToRecap7) {
      onModeSwitch(RECAP_7);
    } else if (canSwitchToRecap14) {
      onModeSwitch(RECAP_14);
    } else if (canSwitchToRecap30) {
      onModeSwitch(RECAP_30);
    }
  }
  function handleLearningModes() {
    if (canSwitchToForward) {
      onModeSwitch(LEARNING_FORWARD);
    } else if (canSwitchToBackward) {
      onModeSwitch(LEARNING_BACKWARD);
    }
  }
</script>

<div class="flex flex-col items-center justify-center py-12 text-center">
  {#if !canSwitchToLearning && !canSwitchToRecap}
    <!-- Completed all words -->
    <div
      class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500"
    >
      <svg class="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 class="mb-2 text-2xl font-bold text-gray-900">Congratulations! 🎉</h3>
    <p class="max-w-md text-gray-600">
      You've mastered all available words! You're doing an amazing job learning French vocabulary.
    </p>
    <div class="mt-6 rounded-lg bg-yellow-50 p-4">
      <p class="text-sm text-yellow-800">
        Keep reviewing your learned words to maintain your knowledge, or check back later for new
        content!
      </p>
    </div>
  {:else if canSwitchToForward || canSwitchToBackward}
    <!-- No learning cards available -->
    <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
      <svg class="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    </div>
    <h3 class="mb-2 text-xl font-bold text-gray-900">All caught up!</h3>
    <p class="mb-4 max-w-md text-gray-600">
      You've worked through all available learning cards. Great progress!
    </p>
    {#if canSwitchToRecap7}
      <button
        on:click={handleRecapModes}
        class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Switch to Reviews
      </button>
    {:else}
      <div class="rounded-lg bg-green-50 p-4">
        <p class="text-sm text-green-800">
          No reviews are due yet. Take a break and come back later, or check your progress in
          settings.
        </p>
      </div>
    {/if}
  {:else if canSwitchToRecap && !canSwitchToLearning}
    <!-- No review cards available -->
    <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
      <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 class="mb-2 text-xl font-bold text-gray-900">No reviews due!</h3>
    <p class="mb-4 max-w-md text-gray-600">
      All your words are still fresh in memory. Come back later for spaced repetition reviews.
    </p>
    {#if canSwitchToLearning}
      <button
        on:click={handleLearningModes}
        class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        Continue Learning
      </button>
    {:else}
      <div class="rounded-lg bg-blue-50 p-4">
        <p class="text-sm text-blue-800">
          Perfect timing for a study break! Your next reviews will be ready soon.
        </p>
      </div>
    {/if}
  {/if}

  <!-- Study tips -->
  <div class="mt-8 max-w-md text-left">
    <h4 class="mb-3 text-sm font-medium text-gray-900">💡 Study Tips</h4>
    <ul class="space-y-2 text-sm text-gray-600">
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>Regular daily practice is more effective than long cramming sessions</span>
      </li>
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>Don't worry if you forget words - repetition strengthens memory</span>
      </li>
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>Try to use new words in sentences to reinforce learning</span>
      </li>
    </ul>
  </div>
</div>
