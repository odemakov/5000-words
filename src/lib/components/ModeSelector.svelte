<script lang="ts">
  import { learningState } from '$lib/controllers/LearningController';
  import {
    LEARNING_FORWARD,
    LEARNING_BACKWARD,
    RECAP_7,
    RECAP_14,
    RECAP_30,
    ADDING,
    MODE_INFO,
    isLearningMode,
    isLearningForwardMode,
    isLearningBackwardMode,
    isRecap7Mode,
    isRecap14Mode,
    isRecap30Mode,
    isAddingMode,
    type LearningMode
  } from '$lib/constants/modes';

  export let currentMode: LearningMode;
  export let onModeChange: (mode: LearningMode) => void;
  export let learningAvailable: boolean;
  export let dueReviewsCount: number = 0;

  // Calculate recap stats
  $: recap7Stats = getRecapStats($learningState.recap7);
  $: recap14Stats = getRecapStats($learningState.recap14);
  $: recap30Stats = getRecapStats($learningState.recap30);

  function getRecapStats(recapArray: Array<{ dueDate: number }>) {
    const now = Date.now();
    const ready = recapArray.filter((word) => word.dueDate <= now).length;
    const notReady = recapArray.length - ready;
    return { ready, notReady, total: recapArray.length };
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
      case RECAP_7:
        return { available: recap7Stats.ready, total: recap7Stats.total };
      case RECAP_14:
        return { available: recap14Stats.ready, total: recap14Stats.total };
      case RECAP_30:
        return { available: recap30Stats.ready, total: recap30Stats.total };
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
      class:bg-yellow-500={isRecap7Mode(currentMode)}
      class:text-white={isRecap7Mode(currentMode)}
      class:shadow-sm={isRecap7Mode(currentMode)}
      class:text-gray-600={!isRecap7Mode(currentMode)}
      class:hover:bg-gray-50={!isRecap7Mode(currentMode) && isModeAvailable(RECAP_7)}
      class:opacity-50={!isModeAvailable(RECAP_7)}
      class:cursor-not-allowed={!isModeAvailable(RECAP_7)}
      disabled={!isModeAvailable(RECAP_7)}
      on:click={() => handleModeClick(RECAP_7)}
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
        <span>{MODE_INFO[RECAP_7].label}</span>
        <div class="text-xs">
          <span class="text-green-600">{recap7Stats.ready}</span>
          {#if recap7Stats.notReady > 0}
            <span class="text-gray-400">/{recap7Stats.total}</span>
          {/if}
        </div>
      </div>
    </button>

    <button
      class="flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
      class:bg-orange-500={isRecap14Mode(currentMode)}
      class:text-white={isRecap14Mode(currentMode)}
      class:shadow-sm={isRecap14Mode(currentMode)}
      class:text-gray-600={!isRecap14Mode(currentMode)}
      class:hover:bg-gray-50={!isRecap14Mode(currentMode) && isModeAvailable(RECAP_14)}
      class:opacity-50={!isModeAvailable(RECAP_14)}
      class:cursor-not-allowed={!isModeAvailable(RECAP_14)}
      disabled={!isModeAvailable(RECAP_14)}
      on:click={() => handleModeClick(RECAP_14)}
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
        <span>{MODE_INFO[RECAP_14].label}</span>
        <div class="text-xs">
          <span class="text-green-600">{recap14Stats.ready}</span>
          {#if recap14Stats.notReady > 0}
            <span class="text-gray-400">/{recap14Stats.total}</span>
          {/if}
        </div>
      </div>
    </button>

    <button
      class="flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
      class:bg-green-500={isRecap30Mode(currentMode)}
      class:text-white={isRecap30Mode(currentMode)}
      class:shadow-sm={isRecap30Mode(currentMode)}
      class:text-gray-600={!isRecap30Mode(currentMode)}
      class:hover:bg-gray-50={!isRecap30Mode(currentMode) && isModeAvailable(RECAP_30)}
      class:opacity-50={!isModeAvailable(RECAP_30)}
      class:cursor-not-allowed={!isModeAvailable(RECAP_30)}
      disabled={!isModeAvailable(RECAP_30)}
      on:click={() => handleModeClick(RECAP_30)}
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
        <span>{MODE_INFO[RECAP_30].label}</span>
        <div class="text-xs">
          <span class="text-green-600">{recap30Stats.ready}</span>
          {#if recap30Stats.notReady > 0}
            <span class="text-gray-400">/{recap30Stats.total}</span>
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
{#if !learningAvailable && dueReviewsCount === 0}
  <div class="mb-4 rounded-lg bg-yellow-50 p-4 text-center">
    <p class="text-sm text-yellow-800">
      No cards available for study. Add more words to your queue! 📚
    </p>
  </div>
{:else if isAddingMode(currentMode)}
  <div class="mb-4 rounded-lg bg-purple-50 p-4 text-center">
    <p class="text-sm text-purple-800">
      Review words and decide which ones to add to your learning queue.
    </p>
  </div>
{/if}

{#if isLearningMode(currentMode) && dueReviewsCount > 0}
  <div class="mb-4 flex items-center justify-center rounded-md bg-red-50 py-2">
    <svg class="mr-2 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
    <span class="text-sm text-red-700">{dueReviewsCount} reviews are due</span>
  </div>
{/if}
