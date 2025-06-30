<script lang="ts">
  import { unifiedLearningState, queueStats } from '$lib/services/UnifiedLearningService';
  import { UnifiedLearningService } from '$lib/services/UnifiedLearningService';
  import { type LearningMode } from '$lib/constants/modes';
  import ModeButton from './ModeButton.svelte';

  export let currentMode: LearningMode;
  export let onModeChange: (mode: LearningMode) => void;

  // Calculate stats from unified queue
  $: learningStats = {
    available: $queueStats.passive.available + $queueStats.active.available,
    total: $queueStats.passive.total + $queueStats.active.total
  };

  $: reviewStats = {
    available:
      $queueStats.review1.available + $queueStats.review2.available + $queueStats.review3.available,
    total: $queueStats.review1.total + $queueStats.review2.total + $queueStats.review3.total
  };

  function getModeStats(mode: LearningMode): { available: number; total: number } {
    switch (mode) {
      case 'learning':
        return learningStats;
      case 'reviewing':
        return reviewStats;
      default:
        return { available: 0, total: 0 };
    }
  }

  function isModeAvailable(mode: LearningMode): boolean {
    if (mode === 'adding') return true;
    const stats = getModeStats(mode);
    return stats.available > 0;
  }

  function handleModeClick(mode: LearningMode) {
    if (isModeAvailable(mode) && mode !== currentMode) {
      UnifiedLearningService.switchMode(mode);
      onModeChange(mode);
    }
  }
</script>

<div class="mb-6 w-full max-w-md space-y-2">
  <!-- Learning Modes Row -->
  <div class="pp-1 flex rounded-lg bg-white shadow-sm">
    <ModeButton
      mode={'learning'}
      {currentMode}
      count={getModeStats('learning').available}
      total={getModeStats('learning').total}
      enabled={isModeAvailable('learning')}
      onClick={() => handleModeClick('learning')}
    />

    <ModeButton
      mode={'reviewing'}
      {currentMode}
      count={getModeStats('reviewing').available}
      total={getModeStats('reviewing').total}
      enabled={isModeAvailable('reviewing')}
      onClick={() => handleModeClick('reviewing')}
    />
  </div>

  <!-- Add Words Button -->
  {#if currentMode !== 'adding'}
    <div class="flex rounded-lg bg-white p-1 shadow-sm">
      <ModeButton
        mode={'adding'}
        {currentMode}
        count={0}
        total={0}
        enabled={true}
        onClick={() => handleModeClick('adding')}
      />
    </div>
  {/if}
</div>

<!-- Mode-specific messages -->
{#if currentMode === 'adding'}
  <div class="mb-4 rounded-lg bg-blue-50 p-4 text-center">
    <p class="text-sm text-blue-800">
      Review words and decide which ones to add to your learning queue.
    </p>
  </div>
{/if}

{#if currentMode === 'learning' && reviewStats.available > 0}
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
      <span class="text-sm text-yellow-700">{reviewStats.available} reviews are due</span>
    </div>
    {#if $queueStats.review1.available > 0 || $queueStats.review2.available > 0 || $queueStats.review3.available > 0}
      <div class="mt-2 flex justify-center space-x-3 text-xs text-yellow-600">
        {#if $queueStats.review1.available > 0}
          <span>Review 1: {$queueStats.review1.available}</span>
        {/if}
        {#if $queueStats.review2.available > 0}
          <span>Review 2: {$queueStats.review2.available}</span>
        {/if}
        {#if $queueStats.review3.available > 0}
          <span>Review 3: {$queueStats.review3.available}</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if currentMode === 'reviewing' && reviewStats.total > 0}
  <div class="mb-4 rounded-lg bg-gray-50 p-3">
    <div class="text-center text-sm text-gray-600">
      <div class="font-medium">Review Progress</div>
      <div class="mt-1 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div class="font-medium">Review 1</div>
          <div>{$queueStats.review1.available}/{$queueStats.review1.total}</div>
        </div>
        <div>
          <div class="font-medium">Review 2</div>
          <div>{$queueStats.review2.available}/{$queueStats.review2.total}</div>
        </div>
        <div>
          <div class="font-medium">Review 3</div>
          <div>{$queueStats.review3.available}/{$queueStats.review3.total}</div>
        </div>
      </div>
    </div>
  </div>
{/if}
