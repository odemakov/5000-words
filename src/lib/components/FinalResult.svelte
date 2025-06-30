<script lang="ts">
  import { type Level } from '../constants/modes';
  import { unifiedLearningState } from '$lib/services/UnifiedLearningService';
  // Props
  export let startingWord = 1;

  $: level = $unifiedLearningState.detectedLevel;

  // Callback props
  export let onContinue = () => {};

  // Map level to descriptive text
  const levelDescriptions: Record<Level, string> = {
    A1: 'Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate'
  };
</script>

<div class="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
  <h2 class="mb-4 text-2xl font-bold text-gray-800">Your French Level</h2>

  <div class="py-6">
    <span class="text-5xl font-bold text-blue-600">{level}</span>
    <p class="mt-2 text-gray-600">{levelDescriptions[level]}</p>
  </div>

  <p class="mb-6 text-gray-700">You'll start learning from word {startingWord}.</p>

  <button
    on:click={onContinue}
    class="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
  >
    Begin Learning
  </button>
</div>
