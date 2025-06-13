<script lang="ts">
  export let currentMode: 'learning' | 'reviews' | 'adding';
  export let onModeChange: (mode: 'learning' | 'reviews' | 'adding') => void;
  export let learningAvailable: boolean;
  export let reviewsAvailable: boolean;
  export let addingAvailable: boolean = true;
  export let dueReviewsCount: number = 0;
  export let forwardQueueCount: number = 0;
</script>

<div class="mb-6 flex rounded-lg bg-white p-1 shadow-sm">
  <button
    class="flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
    class:bg-blue-500={currentMode === 'learning'}
    class:text-white={currentMode === 'learning'}
    class:shadow-sm={currentMode === 'learning'}
    class:text-gray-600={currentMode !== 'learning'}
    class:hover:bg-gray-50={currentMode !== 'learning' && learningAvailable}
    class:opacity-50={!learningAvailable}
    class:cursor-not-allowed={!learningAvailable}
    disabled={!learningAvailable}
    on:click={() => onModeChange('learning')}
  >
    <div class="flex items-center justify-center space-x-2">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <span>Learning</span>
      {#if forwardQueueCount > 0}
        <span class="ml-1 text-xs opacity-75">({forwardQueueCount})</span>
      {/if}
    </div>
  </button>

  <button
    class="relative flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
    class:bg-blue-500={currentMode === 'reviews'}
    class:text-white={currentMode === 'reviews'}
    class:shadow-sm={currentMode === 'reviews'}
    class:text-gray-600={currentMode !== 'reviews'}
    class:hover:bg-gray-50={currentMode !== 'reviews' && reviewsAvailable}
    class:opacity-50={!reviewsAvailable}
    class:cursor-not-allowed={!reviewsAvailable}
    disabled={!reviewsAvailable}
    on:click={() => onModeChange('reviews')}
  >
    <div class="flex items-center justify-center space-x-2">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>Reviews</span>
      {#if dueReviewsCount > 0}
        <span
          class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
        >
          {dueReviewsCount > 99 ? '99+' : dueReviewsCount}
        </span>
      {/if}
    </div>
  </button>

  <button
    class="flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
    class:bg-blue-500={currentMode === 'adding'}
    class:text-white={currentMode === 'adding'}
    class:shadow-sm={currentMode === 'adding'}
    class:text-gray-600={currentMode !== 'adding'}
    class:hover:bg-gray-50={currentMode !== 'adding' && addingAvailable}
    class:opacity-50={!addingAvailable}
    class:cursor-not-allowed={!addingAvailable}
    disabled={!addingAvailable}
    on:click={() => onModeChange('adding')}
  >
    <div class="flex items-center justify-center space-x-2">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      <span>Add Words</span>
    </div>
  </button>
</div>

{#if !learningAvailable && !reviewsAvailable}
  <div class="mb-4 rounded-lg bg-yellow-50 p-4 text-center">
    <p class="text-sm text-yellow-800">
      No cards available for study. Add more words to your queue! 📚
    </p>
  </div>
{:else if currentMode === 'learning' && !learningAvailable}
  <div class="mb-4 rounded-lg bg-blue-50 p-4 text-center">
    <p class="text-sm text-blue-800">
      All learning queues are empty. Add more words or switch to Reviews to continue studying.
    </p>
  </div>
{:else if currentMode === 'reviews' && !reviewsAvailable}
  <div class="mb-4 rounded-lg bg-green-50 p-4 text-center">
    <p class="text-sm text-green-800">
      No reviews due yet. Continue learning new words or add more to your queue!
    </p>
  </div>
{:else if currentMode === 'adding'}
  <div class="mb-4 rounded-lg bg-purple-50 p-4 text-center">
    <p class="text-sm text-purple-800">
      Review words and decide which ones to add to your learning queue.
    </p>
  </div>
{/if}
