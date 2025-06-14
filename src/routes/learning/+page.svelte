<script lang="ts">
  import { onMount } from 'svelte';
  import {
    LearningController,
    currentCard,
    learningState,
    getDueRecap7Count,
    getDueRecap14Count,
    getDueRecap30Count,
    getLearningForwardCount,
    getLearningBackwardCount
  } from '$lib/controllers/LearningController';
  import FlashCard from '$lib/components/FlashCard.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import ProgressHeader from '$lib/components/ProgressHeader.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import QueueFilling from '$lib/components/QueueFilling.svelte';
  import {
    LEARNING_FORWARD,
    ADDING,
    isLearningMode,
    isLearningForwardMode,
    type LearningMode,
    isLearningBackwardMode,
    isRecap7Mode,
    isRecap14Mode,
    isRecap30Mode,
    isAddingMode
  } from '$lib/constants/modes';

  // Reactive data
  $: card = $currentCard;
  $: state = $learningState;

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
      await LearningController.initializeQueueFilling('A1', []);
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
    if (isRecap7Mode(mode) && getDueRecap7Count() === 0) {
      return; // Mode selector should handle disabled state
    }
    if (isRecap14Mode(mode) && getDueRecap14Count() === 0) {
      return; // Mode selector should handle disabled state
    }
    if (isRecap30Mode(mode) && getDueRecap30Count() === 0) {
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

  // Determine if we can switch modes
  $: canSwitchToLearning =
    $learningState.forwardQueue.length > 0 || $learningState.backwardQueue.length > 0;
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
    <ProgressHeader
      level={state.detectedLevel}
      progress={state.progress}
      wordsLearned={state.wordsLearned}
      onSettingsClick={handleSettingsToggle}
    />

    <div class="mx-auto flex max-w-2xl flex-col items-center px-4 py-6">
      <ModeSelector
        {currentMode}
        onModeChange={handleModeSwitch}
        learningAvailable={canSwitchToLearning}
        addingAvailable={true}
      />

      {#if currentMode === ADDING}
        <div class="w-full">
          {#if addingWord}
            <QueueFilling
              word={addingWord.word}
              properties={addingWord.props}
              translations={addingWord.translations}
              currentIndex={addingWord.index}
              learnedCount={addingStats.learnedCount}
              canSwitchToLearning={addingStats.canSwitchToLearning}
              level={state.detectedLevel}
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
                class:bg-yellow-100={card.reviewType === '7'}
                class:text-yellow-800={card.reviewType === '7'}
                class:bg-orange-100={card.reviewType === '14'}
                class:text-orange-800={card.reviewType === '14'}
                class:bg-green-100={card.reviewType === '30'}
                class:text-green-800={card.reviewType === '30'}
              >
                {card.reviewType}-day review
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

          {#if isLearningMode(state.currentMode)}
            <p class="mt-3 text-xs text-blue-600">
              Mode: {isLearningForwardMode(state.currentMode)
                ? 'French → Russian'
                : 'Russian → French'}
            </p>
          {/if}
        </div>
      {:else}
        <EmptyState onModeSwitch={handleModeSwitch} />
      {/if}

      <div class="mt-8 text-center text-xs text-gray-400">
        <p>Keyboard shortcuts: ← → for answers, Ctrl+S for settings</p>
      </div>
    </div>

    {#if showSettings}
      <SettingsPanel
        onClose={handleSettingsClose}
        currentLevel={state.detectedLevel}
        todayStats={state.todayStats}
      />
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
