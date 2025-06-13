<script lang="ts">
  import { learningState } from '$lib/controllers/LearningController';

  export let dueReviewsCount: number;
  export let totalReviewsCount: number;
  export let currentMode: 'learning' | 'reviews';
  export let currentDirection: 'forward' | 'backward';
  export let recap7Count: number = 0;
  export let recap14Count: number = 0;
  export let recap30Count: number = 0;

  // Directly use queue lengths instead of passed props
  $: forwardCount = $learningState.forwardQueue.length;
  $: backwardCount = $learningState.backwardQueue.length;
</script>

<div class="mb-6 rounded-lg bg-white p-4 shadow-sm">
  {#if currentMode === 'learning'}
    <div class="flex items-center justify-between">
      <div class="flex space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{forwardCount}</div>
          <div class="text-xs tracking-wide text-gray-500 uppercase">Forward</div>
          <div class="text-xs text-gray-400">FR → RU</div>
        </div>

        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{backwardCount}</div>
          <div class="text-xs tracking-wide text-gray-500 uppercase">Backward</div>
          <div class="text-xs text-gray-400">RU → FR</div>
        </div>
      </div>

      <div class="text-right">
        <div class="text-xs tracking-wide text-gray-400 uppercase">Current</div>
        <div class="font-medium text-blue-600">
          {currentDirection === 'forward' ? 'FR → RU' : 'RU → FR'}
        </div>
        <div class="mt-1 h-1 w-16 rounded-full bg-gray-200">
          <div
            class="h-1 rounded-full bg-blue-500 transition-all duration-300"
            style="width: {currentDirection === 'forward'
              ? (forwardCount / (forwardCount + backwardCount)) * 100
              : (backwardCount / (forwardCount + backwardCount)) * 100}%"
          ></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center">
      <div class="text-3xl font-bold text-gray-900">{dueReviewsCount}</div>
      <div class="text-sm text-gray-500">Due for Review</div>

      {#if totalReviewsCount > 0}
        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
          <div class="rounded-lg bg-yellow-50 p-2">
            <div class="text-lg font-semibold text-yellow-800">{recap7Count}</div>
            <div class="text-xs text-yellow-600">7-day</div>
          </div>
          <div class="rounded-lg bg-orange-50 p-2">
            <div class="text-lg font-semibold text-orange-800">{recap14Count}</div>
            <div class="text-xs text-orange-600">14-day</div>
          </div>
          <div class="rounded-lg bg-green-50 p-2">
            <div class="text-lg font-semibold text-green-800">{recap30Count}</div>
            <div class="text-xs text-green-600">30-day</div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if currentMode === 'learning' && dueReviewsCount > 0}
    <div class="mt-3 flex items-center justify-center rounded-md bg-red-50 py-2">
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
</div>
