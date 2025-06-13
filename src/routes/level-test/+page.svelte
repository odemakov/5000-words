<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FlashCard from '$lib/components/FlashCard.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import Header from '$lib/components/Header.svelte';
  import FinalResult from '$lib/components/FinalResult.svelte';
  import {
    testState,
    currentWord,
    progress,
    loadTestBatch,
    recordResponse,
    undo,
    getStartingWordForLevel
  } from '$lib/controllers/TestController';

  // Subscribe to our stores using $derived rune
  const word = $derived($currentWord);
  const testProgress = $derived($progress);
  const isCompleted = $derived($testState.isCompleted);
  const detectedLevel = $derived($testState.detectedLevel);

  // Initialize test on mount
  onMount(() => {
    loadTestBatch(1, 100);
  });

  function handleSwipeRight() {
    // User knows this word
    recordResponse(true);
  }

  function handleSwipeLeft() {
    // User doesn't know this word
    recordResponse(false);
  }

  function handleUndo() {
    undo();
  }

  function handleStartLearning() {
    goto(`/learning?level=${detectedLevel}`);
  }
</script>

<div class="flex h-screen flex-col bg-gray-50">
  <Header
    title="French-Russian Flashcards"
    subtitle={`Testing words ${testProgress.batchRange}`}
    showUndo={testProgress.current > 0}
    onUndo={handleUndo}
  />

  <main class="flex flex-1 flex-col items-center justify-center p-4">
    {#if isCompleted}
      <FinalResult
        level={detectedLevel as 'A1' | 'A2' | 'B1' | 'B2'}
        startingWord={getStartingWordForLevel(detectedLevel)}
        onContinue={handleStartLearning}
      />
    {:else if word}
      <FlashCard
        word={word?.word || ''}
        properties={word?.props || []}
        translations={word?.translations || []}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
      />

      <div class="mt-8 w-full max-w-md text-center text-sm text-gray-500">
        <p>Tap the card to see the translation</p>
        <p class="mt-2">
          Swipe <span class="text-green-500">right</span> if you know the word,
          <span class="text-red-500">left</span> if you don't
        </p>
      </div>
    {:else}
      <div class="text-center">
        <p class="text-gray-600">Loading test words...</p>
      </div>
    {/if}
  </main>

  {#if !isCompleted && word}
    <ProgressBar current={testProgress.current} total={testProgress.total} />
  {/if}
</div>
