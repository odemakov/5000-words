<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FlashCard from '$lib/components/FlashCard.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import Header from '$lib/components/Header.svelte';
  import FinalResult from '$lib/components/FinalResult.svelte';
  import UserInstructions from '$lib/components/UserInstructions.svelte';
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

  function handleKnown() {
    // User knows this word
    recordResponse(true);
  }

  function handleUnknown() {
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
        startingWord={getStartingWordForLevel(detectedLevel)}
        onContinue={handleStartLearning}
      />
    {:else if word}
      <FlashCard
        word={word?.word || ''}
        properties={word?.props || []}
        translations={word?.translations || []}
        onKnown={handleKnown}
        onUnknown={handleUnknown}
      />

      <UserInstructions />
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
