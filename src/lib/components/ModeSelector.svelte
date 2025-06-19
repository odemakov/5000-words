<script lang="ts">
  import { learningState, getReviewsCountByPool } from '$lib/controllers/LearningController';
  import {
    LEARNING_FORWARD,
    LEARNING_BACKWARD,
    REVIEWING,
    ADDING,
    MODE_INFO,
    isLearningMode,
    isLearningForwardMode,
    isLearningBackwardMode,
    isReviewingMode,
    isAddingMode,
    type LearningMode
  } from '$lib/constants/modes';
  import { POOLS } from '$lib/constants/review';

  export let currentMode: LearningMode;
  export let onModeChange: (mode: LearningMode) => void;

  // Calculate review stats by pool
  $: pool1Stats = $learningState.reviewQueue && getReviewsCountByPool(POOLS.POOL1);
  $: pool2Stats = $learningState.reviewQueue && getReviewsCountByPool(POOLS.POOL2);
  $: pool3Stats = $learningState.reviewQueue && getReviewsCountByPool(POOLS.POOL3);
  $: totalReviewStats = {
    ready: pool1Stats.ready + pool2Stats.ready + pool3Stats.ready,
    notReady: pool1Stats.notReady + pool2Stats.notReady + pool3Stats.notReady,
    total: pool1Stats.total + pool2Stats.total + pool3Stats.total
  };

  function getModeStats(mode: LearningMode): { available: number; total: number } {
    switch (mode) {
      case LEARNING_FORWARD:
        return {
          available: $learningState.forwardQueue.length,
          total: $learningState.forwardQueue.length
        };
      case LEARNING_BACKWARD:
        return {
          available: $learningState.backwardQueue.length,
          total: $learningState.backwardQueue.length
        };
      case REVIEWING:
        return { available: totalReviewStats.ready, total: totalReviewStats.total };
      default:
        return { available: 0, total: 0 };
    }
  }

  function isModeAvailable(mode: LearningMode): boolean {
    if (isAddingMode(mode)) return true;
    const stats = getModeStats(mode);
    return stats.available > 0;
  }

  function handleModeClick(mode: LearningMode) {
    if (isModeAvailable(mode) && mode !== currentMode) {
      onModeChange(mode);
    }
  }
</script>

<div class="mb-6 w-full max-w-md space-y-2">
  <!-- Learning Modes Row -->
  <div class="flex rounded-lg bg-white p-1 shadow-sm">
    <button
      class="flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
      class:bg-blue-500={isLearningForwardMode(currentMode)}
      class:text-white={isLearningForwardMode(currentMode)}
      class:shadow-sm={isLearningForwardMode(currentMode)}
      class:text-gray-600={!isLearningForwardMode(currentMode)}
      class:hover:bg-gray-50={!isLearningForwardMode(currentMode) &&
        isModeAvailable(LEARNING_FORWARD)}
      class:opacity-50={!isModeAvailable(LEARNING_FORWARD)}
      class:cursor-not-allowed={!isModeAvailable(LEARNING_FORWARD)}
      disabled={!isModeAvailable(LEARNING_FORWARD)}
      on:click={() => handleModeClick(LEARNING_FORWARD)}
    >
      <div class="flex flex-col items-center">
        <svg class="mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span class="text-sm">{MODE_INFO[LEARNING_FORWARD].label}</span>
        {#if $learningState.forwardQueue.length > 0}
          <span class="text-xs opacity-75">{$learningState.forwardQueue.length}</span>
        {/if}
      </div>
    </button>

    <button
      class="flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
      class:bg-blue-500={isLearningBackwardMode(currentMode)}
      class:text-white={isLearningBackwardMode(currentMode)}
      class:shadow-sm={isLearningBackwardMode(currentMode)}
      class:text-gray-600={!isLearningBackwardMode(currentMode)}
      class:hover:bg-gray-50={!isLearningBackwardMode(currentMode) &&
        isModeAvailable(LEARNING_BACKWARD)}
      class:opacity-50={!isModeAvailable(LEARNING_BACKWARD)}
      class:cursor-not-allowed={!isModeAvailable(LEARNING_BACKWARD)}
      disabled={!isModeAvailable(LEARNING_BACKWARD)}
      on:click={() => handleModeClick(LEARNING_BACKWARD)}
    >
      <div class="flex flex-col items-center">
        <svg class="mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span>{MODE_INFO[LEARNING_BACKWARD].label}</span>
        {#if $learningState.backwardQueue.length > 0}
          <span class="text-xs opacity-75">{$learningState.backwardQueue.length}</span>
        {/if}
      </div>
    </button>

    <button
      class="flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
      class:bg-yellow-500={isReviewingMode(currentMode)}
      class:text-white={isReviewingMode(currentMode)}
      class:shadow-sm={isReviewingMode(currentMode)}
      class:text-gray-600={!isReviewingMode(currentMode)}
      class:hover:bg-gray-50={!isReviewingMode(currentMode) && isModeAvailable(REVIEWING)}
      class:opacity-50={!isModeAvailable(REVIEWING)}
      class:cursor-not-allowed={!isModeAvailable(REVIEWING)}
      disabled={!isModeAvailable(REVIEWING)}
      on:click={() => handleModeClick(REVIEWING)}
    >
      <div class="flex flex-col items-center">
        <svg class="mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{MODE_INFO[REVIEWING].label}</span>
        <div class="text-xs">
          <span class="text-green-600">{totalReviewStats.ready}</span>
          {#if totalReviewStats.notReady > 0}
            <span class="text-gray-400">/{totalReviewStats.total}</span>
          {/if}
        </div>
      </div>
    </button>
  </div>

  <!-- Add Words Button -->
  {#if currentMode !== ADDING}
    <div class="flex rounded-lg bg-white p-1 shadow-sm">
      <button
        class="etxt-gray-600 flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50"
        on:click={() => handleModeClick(ADDING)}
      >
        <div class="flex items-center justify-center space-x-2">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>{MODE_INFO[ADDING].label}</span>
        </div>
      </button>
    </div>
  {/if}
</div>

<!-- Mode-specific messages -->
{#if isAddingMode(currentMode)}
  <div class="mb-4 rounded-lg bg-blue-50 p-4 text-center">
    <p class="text-sm text-blue-800">
      Review words and decide which ones to add to your learning queue.
    </p>
  </div>
{/if}

{#if isLearningMode(currentMode) && totalReviewStats.ready > 0}
  <div class="mb-4 rounded-md bg-yellow-50 p-3">
    <div class="flex items-center justify-center">
      <svg
        class="mr-2 h-4 w-4 text-yellow-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <span class="text-sm text-yellow-700">{totalReviewStats.ready} reviews are due</span>
    </div>
    {#if pool1Stats.ready > 0 || pool2Stats.ready > 0 || pool3Stats.ready > 0}
      <div class="mt-2 flex justify-center space-x-3 text-xs text-yellow-600">
        {#if pool1Stats.ready > 0}
          <span>Pool 1: {pool1Stats.ready}</span>
        {/if}
        {#if pool2Stats.ready > 0}
          <span>Pool 2: {pool2Stats.ready}</span>
        {/if}
        {#if pool3Stats.ready > 0}
          <span>Pool 3: {pool3Stats.ready}</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if isReviewingMode(currentMode) && totalReviewStats.total > 0}
  <div class="mb-4 rounded-lg bg-gray-50 p-3">
    <div class="text-center text-sm text-gray-600">
      <div class="font-medium">Review Progress</div>
      <div class="mt-1 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div class="font-medium">Pool 1</div>
          <div>{pool1Stats.ready}/{pool1Stats.total}</div>
        </div>
        <div>
          <div class="font-medium">Pool 2</div>
          <div>{pool2Stats.ready}/{pool2Stats.total}</div>
        </div>
        <div>
          <div class="font-medium">Pool 3</div>
          <div>{pool3Stats.ready}/{pool3Stats.total}</div>
        </div>
      </div>
    </div>
  </div>
{/if}
