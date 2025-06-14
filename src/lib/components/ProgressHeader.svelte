<script lang="ts">
  import { learningState } from '$lib/controllers/LearningController';

  export let onSettingsClick: () => void;

  $: level = $learningState.detectedLevel;
  $: progress = $learningState.progress;
  $: wordsLearned = $learningState.wordsLearned;

  const levelRanges = {
    A1: { min: 0, max: 799 },
    A2: { min: 800, max: 1999 },
    B1: { min: 2000, max: 3999 },
    B2: { min: 4000, max: 4999 }
  };

  $: levelProgress = Math.min(
    progress - levelRanges[level].min,
    levelRanges[level].max - levelRanges[level].min + 1
  );
  $: totalWords = levelRanges[level].max - levelRanges[level].min + 1;
  $: progressPercentage = Math.max(0, Math.min(100, (levelProgress / totalWords) * 100));

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }
</script>

<header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
  <div class="flex items-center justify-between px-4 py-3">
    <div class="flex items-center space-x-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
        <img src="/favicon.png" alt="Logo" />
      </div>
      <div>
        <h1 class="text-xl font-bold">5000 Words</h1>
        <p class="text-sm opacity-90">Level {level}</p>
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <div class="text-right">
        <div class="text-sm opacity-90">Progress</div>
        <div class="font-semibold">{formatNumber(levelProgress)}/{formatNumber(totalWords)}</div>
      </div>

      <div class="text-right">
        <div class="text-sm opacity-90">Learned</div>
        <div class="font-semibold">{formatNumber(wordsLearned)}</div>
      </div>

      <button
        on:click={onSettingsClick}
        class="rounded-full p-2 transition-colors hover:bg-white/20 focus:bg-white/20 focus:outline-none"
        aria-label="Settings"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  </div>

  <div class="px-4 pb-3">
    <div class="flex items-center space-x-2">
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-blue-800/30">
        <div
          class="h-full rounded-full bg-white transition-all duration-500 ease-out"
          style="width: {progressPercentage}%"
        ></div>
      </div>
      <span class="min-w-[3rem] text-right text-xs font-medium">
        {Math.round(progressPercentage)}%
      </span>
    </div>

    {#if progressPercentage >= 100}
      <div class="mt-2 flex items-center justify-center space-x-1 text-sm">
        <svg class="h-4 w-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
        <span class="text-yellow-100">Level {level} Complete!</span>
      </div>
    {/if}
  </div>
</header>
