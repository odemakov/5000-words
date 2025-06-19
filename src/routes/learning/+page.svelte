<script lang="ts">
  import { onMount } from 'svelte';
  import {
    LearningController,
    currentCard,
    learningState,
    getDueReviewsCount,
    getLearningForwardCount,
    getLearningBackwardCount
  } from '$lib/controllers/LearningController';
  import { MODE_INFO } from '$lib/constants/modes';
  import FlashCard from '$lib/components/FlashCard.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import ProgressHeader from '$lib/components/ProgressHeader.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import QueueFilling from '$lib/components/QueueFilling.svelte';
  import {
    LEVEL_A1,
    LEARNING_FORWARD,
    ADDING,
    isLearningForwardMode,
    isLearningBackwardMode,
    isReviewingMode,
    isAddingMode,
    type LearningMode
  } from '$lib/constants/modes';
  import { POOLS } from '$lib/constants/review';

  // Reactive data
  $: card = $currentCard;
  $: state = $learningState;

  // Check if we should show empty state for current mode
  $: shouldShowEmptyState = (() => {
    if (isLearningForwardMode(state.currentMode) && state.forwardQueue.length === 0) return true;
    if (isLearningBackwardMode(state.currentMode) && state.backwardQueue.length === 0) return true;
    if (isReviewingMode(state.currentMode) && getDueReviewsCount() === 0) return true;
    if (isAddingMode(state.currentMode) && state.backwardQueue.length === 0) return true;

    return false;
  })();

  let showSettings = false;
  let isInitialized = false;
  let currentMode: LearningMode = LEARNING_FORWARD;
  let addingWord: { word: string; props: string[]; translations: string[]; index: number } | null =
    null;
  let addingStats = { learnedCount: 0, canSwitchToLearning: false };

  onMount(async () => {
    // Try to load existing state
    const savedState = LearningController.loadState();
    if (savedState) {
      learningState.set(savedState);
      isInitialized = true;
    } else {
      await LearningController.initializeQueueFilling(LEVEL_A1, []);
      isInitialized = true;
    }
  });

  // Card interaction handlers
  async function handleKnown() {
    await LearningController.processCardResponse(true);
  }

  async function handleUnknown() {
    await LearningController.processCardResponse(false);
  }

  function handleModeSwitch(mode: LearningMode) {
    // Check if mode switch is allowed
    if (isReviewingMode(mode) && getDueReviewsCount() === 0) {
      return; // Mode selector should handle disabled state
    }
    if (isLearningForwardMode(mode) && getLearningForwardCount() === 0) {
      return; // Mode selector should handle disabled state
    }
    if (isLearningBackwardMode(mode) && getLearningBackwardCount() === 0) {
      return; // Mode selector should handle disabled state
    }

    if (isAddingMode(mode)) {
      currentMode = ADDING;
      loadAddingWord();
      updateAddingStats();
    } else {
      currentMode = mode;
      LearningController.switchMode(mode);
    }
  }

  function handleSettingsToggle() {
    showSettings = !showSettings;
  }

  function handleSettingsClose() {
    showSettings = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (showSettings) return; // Don't handle shortcuts when settings are open

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        handleKnown();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handleUnknown();
        break;
      case 's':
      case 'S':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleSettingsToggle();
        }
        break;
      case 'Escape':
        if (showSettings) {
          handleSettingsClose();
        }
        break;
    }
  }

  // Adding mode handlers
  function loadAddingWord() {
    addingWord = LearningController.getCurrentQueueFillingWord();
  }

  function updateAddingStats() {
    addingStats = {
      learnedCount: $learningState.learnedList.length,
      canSwitchToLearning: $learningState.forwardQueue.length >= 10
    };
  }

  function handleAddToQueue() {
    if (addingWord) {
      LearningController.addWordToQueue(addingWord.index);
      loadAddingWord();
      updateAddingStats();
    }
  }

  function handleAddToLearned() {
    if (addingWord) {
      LearningController.addWordToLearned(addingWord.index);
      loadAddingWord();
      updateAddingStats();
    }
  }

  function handleSwitchToLearning() {
    if (addingStats.canSwitchToLearning) {
      currentMode = 'learning-forward';
      LearningController.switchMode('learning-forward');
    }
  }

  function handleSkipAddingWord() {
    if (addingWord) {
      // Just move to next word without adding to any list
      learningState.update((s) => ({
        ...s,
        progress: Math.max(s.progress, addingWord!.index + 1)
      }));
      LearningController.saveState();
      loadAddingWord();
    }
  }
</script>

<svelte:head>
  <title>Learning - 5000 Words</title>
  <meta name="description" content="Learn French vocabulary with spaced repetition" />
</svelte:head>

<svelte:window on:keydown={handleKeyDown} />

{#if !isInitialized}
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="text-center">
      <div
        class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
      ></div>
      <p class="text-gray-600">Loading your learning progress...</p>
    </div>
  </div>
{:else}
  <main class="min-h-screen bg-gray-50">
    <ProgressHeader onSettingsClick={handleSettingsToggle} />

    <div class="mx-auto flex max-w-2xl flex-col items-center px-4 py-6">
      <ModeSelector {currentMode} onModeChange={handleModeSwitch} />

      {#if currentMode === ADDING}
        <div class="w-full">
          {#if addingWord}
            <QueueFilling
              word={addingWord.word}
              properties={addingWord.props}
              translations={addingWord.translations}
              learnedCount={addingStats.learnedCount}
              canSwitchToLearning={addingStats.canSwitchToLearning}
              on:addToQueue={handleAddToQueue}
              on:addToLearned={handleAddToLearned}
              on:switchToLearning={handleSwitchToLearning}
              on:skip={handleSkipAddingWord}
            />
          {:else}
            <div class="p-6 text-center">
              <div class="mb-4">
                <svg
                  class="mx-auto h-16 w-16 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 class="mb-2 text-xl font-bold text-gray-900">All Words Reviewed!</h2>
              <p class="mb-4 text-gray-600">
                You've gone through all available words for your level.
              </p>
              <button
                on:click={() => {
                  currentMode = 'learning-forward';
                  LearningController.switchMode('learning-forward');
                }}
                class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Continue Learning
              </button>
            </div>
          {/if}
        </div>
      {:else if shouldShowEmptyState}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <svg
              class="h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 class="mb-2 text-xl font-bold text-gray-900">
            {MODE_INFO[state.currentMode].label} queue is empty
          </h3>
          <p class="mb-4 max-w-md text-gray-600">
            Try other queues or add new words to Receptive queue.
          </p>
        </div>
      {:else if card}
        <div class="w-full max-w-md">
          <FlashCard
            word={card.word}
            properties={card.props}
            translations={card.translations}
            direction={card.direction}
            onSwipeRight={handleKnown}
            onSwipeLeft={handleUnknown}
          />

          {#if card.isReview}
            <div class="mt-2 text-center">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                class:bg-yellow-100={card.reviewPool === POOLS.POOL1}
                class:text-yellow-800={card.reviewPool === POOLS.POOL1}
                class:bg-orange-100={card.reviewPool === POOLS.POOL2}
                class:text-orange-800={card.reviewPool === POOLS.POOL2}
                class:bg-green-100={card.reviewPool === POOLS.POOL3}
                class:text-green-800={card.reviewPool === POOLS.POOL3}
              >
                {card.reviewPool} review
              </span>
            </div>
          {/if}
        </div>

        <div class="mt-6 max-w-sm text-center text-sm text-gray-600">
          <p class="mb-2">
            <span class="font-medium">Tap</span> to reveal translation
          </p>
          <div class="flex items-center justify-center space-x-4 text-xs">
            <div class="flex items-center space-x-1">
              <span class="inline-block h-3 w-3 rounded bg-red-500"></span>
              <span>Don't know (← or swipe left)</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="inline-block h-3 w-3 rounded bg-green-500"></span>
              <span>Know (→ or swipe right)</span>
            </div>
          </div>
        </div>
      {:else}
        <EmptyState onModeSwitch={handleModeSwitch} />
      {/if}
    </div>

    {#if showSettings}
      <SettingsPanel onClose={handleSettingsClose} />
    {/if}
  </main>
{/if}

<style>
  main {
    transition: all 0.2s ease-in-out;
  }

  :global(html) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }

  :global(::-webkit-scrollbar) {
    width: 8px;
  }

  :global(::-webkit-scrollbar-track) {
    background: #f7fafc;
  }

  :global(::-webkit-scrollbar-thumb) {
    background: #cbd5e0;
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: #a0aec0;
  }
</style>
