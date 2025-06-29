<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { LearningController, learningState } from '$lib/controllers/LearningController';
  import { POOLS } from '$lib/constants/review';
  import { LEVEL_A2 } from '$lib/constants/modes';
  import type { WordInQueue, ReviewWord, LearningState } from '$lib/types/learning';

  let isPopulating = true;
  let status = 'Populating learning store with debug data...';

  onMount(async () => {
    try {
      await populateDebugData();
      status = 'Debug data populated successfully! Redirecting...';

      setTimeout(() => {
        goto('/learning');
      }, 1500);
    } catch (error) {
      console.error('Failed to populate debug data:', error);
      status = 'Failed to populate debug data. Check console for details.';
      isPopulating = false;
    }
  });

  async function populateDebugData(): Promise<void> {
    const now = Date.now();

    const debugState: LearningState = {
      detectedLevel: LEVEL_A2,
      levelTestResults: [],
      progress: 60,
      wordsLearned: 30,
      wordsReviewed: 20,

      forwardQueue: Array.from(
        { length: 10 },
        (_, i): WordInQueue => ({
          wordIndex: i,
          addedAt: now - i * 1000 * 60,
          attempts: Math.floor(Math.random() * 3)
        })
      ),

      backwardQueue: Array.from(
        { length: 10 },
        (_, i): WordInQueue => ({
          wordIndex: i + 10,
          addedAt: now - i * 1000 * 60,
          attempts: Math.floor(Math.random() * 3)
        })
      ),

      reviewQueue: [
        ...Array.from(
          { length: 4 },
          (_, i): ReviewWord => ({
            wordIndex: i + 20,
            addedAt: now - 24 * 60 * 60 * 1000 - i * 60 * 60 * 1000, // Some due, some not
            attempts: 1,
            pool: POOLS.POOL1
          })
        ),
        ...Array.from(
          { length: 4 },
          (_, i): ReviewWord => ({
            wordIndex: i + 24,
            addedAt:
              now -
              72 * 60 * 60 * 1000 +
              (i % 2 === 0 ? -12 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000), // Mixed due times
            attempts: 2,
            pool: POOLS.POOL2
          })
        ),
        ...Array.from(
          { length: 4 },
          (_, i): ReviewWord => ({
            wordIndex: i + 28,
            addedAt: now - 144 * 60 * 60 * 1000 + i * 24 * 60 * 60 * 1000, // Future due dates
            attempts: 3,
            pool: POOLS.POOL3
          })
        )
      ],

      learnedList: Array.from({ length: 20 }, (_, i) => i + 40),

      currentMode: 'learning-forward',
      lastActivity: now,
      sessionStartTime: now,
      todayStats: {
        date: new Date().toISOString().split('T')[0],
        newWords: 15,
        reviewWords: 8,
        timeSpent: 1800,
        streakDays: 5
      }
    };

    learningState.set(debugState);
    LearningController.saveState();

    status = 'Debug data populated successfully!';
    isPopulating = false;
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
    <div class="text-center">
      <div class="mb-6">
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
        >
          {#if isPopulating}
            <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          {:else}
            <div class="text-2xl text-green-600">✓</div>
          {/if}
        </div>

        <h1 class="mb-2 text-2xl font-bold text-gray-900">Debug Mode</h1>
        <p class="text-gray-600">{status}</p>
      </div>

      {#if !isPopulating}
        <div class="mb-6 rounded-lg bg-gray-50 p-4 text-left text-sm text-gray-700">
          <h3 class="mb-2 font-semibold">Debug Data Created:</h3>
          <ul class="space-y-1">
            <li>• Forward Queue: 10 words</li>
            <li>• Backward Queue: 10 words</li>
            <li>• Review Queue: 12 words (4 per pool)</li>
            <li>• Learned Words: 20 words</li>
            <li>• Today's Stats: 15 new, 8 reviews</li>
            <li>• Streak: 5 days</li>
          </ul>
        </div>

        <button
          on:click={() => goto('/learning')}
          class="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Go to Learning
        </button>
      {/if}
    </div>
  </div>
</div>
