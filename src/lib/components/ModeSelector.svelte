<script lang="ts">
  import { learningState, getReviewsCountByPool } from '$lib/controllers/LearningController';
  import {
    LEARNING_FORWARD,
    LEARNING_BACKWARD,
    REVIEWING,
    ADDING,
    isLearningMode,
    isAddingMode,
    isReviewingMode,
    type LearningMode
  } from '$lib/constants/modes';
  import { POOLS } from '$lib/constants/review';
  import ModeButton from './ModeButton.svelte';

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

  // Only log when there are significant changes (for debugging)
  let lastQueueCounts = { forward: 0, backward: 0, reviewReady: 0 };
  $: {
    const currentCounts = {
      forward: $learningState.forwardQueue?.length || 0,
      backward: $learningState.backwardQueue?.length || 0,
      reviewReady: totalReviewStats.ready
    };

    // Only log if counts actually changed significantly
    if (
      currentCounts.forward !== lastQueueCounts.forward ||
      currentCounts.backward !== lastQueueCounts.backward ||
      currentCounts.reviewReady !== lastQueueCounts.reviewReady
    ) {
      console.log('Queue counts updated:', currentCounts);
      lastQueueCounts = currentCounts;
    }
  }

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
  <div class="pp-1 flex rounded-lg bg-white shadow-sm">
    <ModeButton
      mode={LEARNING_FORWARD}
      {currentMode}
      count={getModeStats(LEARNING_FORWARD).available}
      total={getModeStats(LEARNING_FORWARD).total}
      enabled={isModeAvailable(LEARNING_FORWARD)}
      onClick={() => handleModeClick(LEARNING_FORWARD)}
    />

    <ModeButton
      mode={LEARNING_BACKWARD}
      {currentMode}
      count={getModeStats(LEARNING_BACKWARD).available}
      total={getModeStats(LEARNING_BACKWARD).total}
      enabled={isModeAvailable(LEARNING_BACKWARD)}
      onClick={() => handleModeClick(LEARNING_BACKWARD)}
    />

    <ModeButton
      mode={REVIEWING}
      {currentMode}
      count={getModeStats(REVIEWING).available}
      total={getModeStats(REVIEWING).total}
      enabled={isModeAvailable(REVIEWING)}
      onClick={() => handleModeClick(REVIEWING)}
    />
  </div>

  <!-- Add Words Button -->
  {#if currentMode !== ADDING}
    <div class="flex rounded-lg bg-white p-1 shadow-sm">
      <ModeButton
        mode={ADDING}
        {currentMode}
        count={0}
        total={0}
        enabled={true}
        onClick={() => handleModeClick(ADDING)}
      />
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
