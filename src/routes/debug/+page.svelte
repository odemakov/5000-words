<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { UnifiedLearningService, unifiedLearningState } from '$lib/services/UnifiedLearningService';
  import { LEVEL_A2 } from '$lib/constants/modes';
  import { Storage } from '$lib/storage';
  import type { WordLearningItem, UnifiedLearningState } from '$lib/types/queue';

  let isPopulating = true;
  let status = 'Populating learning store with debug data...';

  onMount(async () => {
    try {
      await populateDebugData();
      status = 'Debug data populated successfully! Redirecting...';

      setTimeout(() => {
        goto('/learning');
      }, 2000);
    } catch (error) {
      console.error('Failed to populate debug data:', error);
      status = 'Failed to populate debug data. Check console for details.';
      isPopulating = false;
    }
  });

  async function populateDebugData(): Promise<void> {
    const now = Date.now();

    // First, ensure words are loaded into localStorage
    let words = Storage.getWords();
    if (!words || words.length === 0) {
      console.log('=== DEBUG: Words not loaded, downloading from server ===');
      status = 'Loading words data...';

      try {
        const { words: downloadedWords, version } = await Storage.downloadWords();
        Storage.saveWords(downloadedWords);
        Storage.saveVersion(version);
      } catch (error) {
        console.error('Failed to load words:', error);
        throw new Error('Failed to load words data required for debug mode');
      }
    }

    status = 'Creating debug learning state...';

    // Get the loaded words to ensure we use valid indices
    const loadedWords = Storage.getWords();
    const maxIndex = Math.min(100, loadedWords ? loadedWords.length - 1 : 99); // Use first 100 words for safety

    const learningQueue: WordLearningItem[] = [
      // Passive stage words
      ...Array.from(
        { length: 5 },
        (_, i): WordLearningItem => ({
          wordId: i,
          stage: 'passive',
          consecutiveCorrect: Math.floor(Math.random() * 3),
          consecutiveWrong: 0,
          showAfter: now,
          attempts: Math.floor(Math.random() * 3),
          addedAt: now - i * 1000 * 60,
          lastSeen: now - i * 1000 * 30
        })
      ),
      // Active stage words
      ...Array.from(
        { length: 5 },
        (_, i): WordLearningItem => ({
          wordId: i + 5,
          stage: 'active',
          consecutiveCorrect: Math.floor(Math.random() * 3),
          consecutiveWrong: 0,
          showAfter: now,
          attempts: Math.floor(Math.random() * 5),
          addedAt: now - (i + 5) * 1000 * 60,
          lastSeen: now - i * 1000 * 30
        })
      ),
      // Review1 stage words
      ...Array.from(
        { length: 4 },
        (_, i): WordLearningItem => ({
          wordId: i + 10,
          stage: 'review1',
          consecutiveCorrect: Math.floor(Math.random() * 3),
          consecutiveWrong: 0,
          showAfter: now - 1000 * 60 * 60 * (i % 2), // Some ready, some not
          attempts: Math.floor(Math.random() * 8),
          addedAt: now - 1000 * 60 * 60 * 24,
          lastSeen: now - 1000 * 60 * 60 * 12
        })
      ),
      // Review2 stage words
      ...Array.from(
        { length: 3 },
        (_, i): WordLearningItem => ({
          wordId: i + 14,
          stage: 'review2',
          consecutiveCorrect: Math.floor(Math.random() * 3),
          consecutiveWrong: 0,
          showAfter: now + 1000 * 60 * 60 * i, // Scheduled for future
          attempts: Math.floor(Math.random() * 12),
          addedAt: now - 1000 * 60 * 60 * 24 * 3,
          lastSeen: now - 1000 * 60 * 60 * 24
        })
      ),
      // Review3 stage words
      ...Array.from(
        { length: 2 },
        (_, i): WordLearningItem => ({
          wordId: i + 17,
          stage: 'review3',
          consecutiveCorrect: Math.floor(Math.random() * 3),
          consecutiveWrong: 0,
          showAfter: now + 1000 * 60 * 60 * 24 * i, // Scheduled for future
          attempts: Math.floor(Math.random() * 15),
          addedAt: now - 1000 * 60 * 60 * 24 * 7,
          lastSeen: now - 1000 * 60 * 60 * 24 * 3
        })
      )
    ];

    const debugState: UnifiedLearningState = {
      detectedLevel: LEVEL_A2,
      levelTestResults: [],
      progress: maxIndex,
      wordsLearned: 20,
      wordsReviewed: 15,
      learningQueue,
      learnedWords: Array.from({ length: 20 }, (_, i) => i + 20),
      currentMode: 'learning',
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

    console.log('=== DEBUG: Setting unified learning state ===');
    console.log('Learning queue length:', debugState.learningQueue.length);
    console.log('Learned words length:', debugState.learnedWords.length);

    // Set the state using the unified service
    unifiedLearningState.set(debugState);
    UnifiedLearningService.saveState();

    // Wait a moment to ensure the state is fully processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('=== DEBUG: State saved successfully ===');

    // Validate that words can be loaded for the indices we created
    const wordsData = Storage.getWords();
    const testWordId = debugState.learningQueue[0]?.wordId;
    const testWord = wordsData?.[testWordId];
    console.log('=== DEBUG: Test word validation ===');
      console.log('Test word index:', testWordIndex);
      console.log('Test word data:', testWord);

      if (!testWord) {
        console.error(
          '=== DEBUG: WARNING - Test word not found! Words may not be loaded properly ==='
        );
      }
    } else {
      console.error('=== DEBUG: Failed to save/load state! ===');
    }

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
