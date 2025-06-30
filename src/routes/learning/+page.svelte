<script lang="ts">
  import { onMount } from 'svelte';
  import {
    UnifiedLearningService,
    currentCard,
    unifiedLearningState,
    getWordByIndex
  } from '$lib/services/UnifiedLearningService';

  import FlashCard from '$lib/components/FlashCard.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import ProgressHeader from '$lib/components/ProgressHeader.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import QueueFilling from '$lib/components/QueueFilling.svelte';
  import UserInstructions from '$lib/components/UserInstructions.svelte';
  import {
    LEARNING,
    ADDING,
    isLearningMode,
    isReviewingMode,
    isAddingMode,
    type LearningMode
  } from '$lib/constants/modes';

  // Reactive data
  $: card = $currentCard;
  $: state = $unifiedLearningState;

  // Check if we should show empty state for current mode
  $: shouldShowEmptyState = (() => {
    if (isLearningMode(state.currentMode) && UnifiedLearningService.getAvailableWordsCount() === 0)
      return true;
    if (isReviewingMode(state.currentMode) && UnifiedLearningService.getOverdueWordsCount() === 0)
      return true;
    if (isAddingMode(state.currentMode)) return false; // Adding mode should show queue filling

    return false;
  })();

  let showSettings = false;
  let isInitialized = false;
  let currentMode: LearningMode = LEARNING;
  let addingWord: { word: string; props: string[]; translations: string[]; index: number } | null =
    null;
  let addingStats = { learnedCount: 0, canSwitchToLearning: false };

  onMount(async () => {
    // Initialize the unified learning service
    await UnifiedLearningService.initialize();

    const currentState = $unifiedLearningState;

    // Check if we have any data (words in queue or learned)
    const hasAnyData =
      currentState.learningQueue.length > 0 || currentState.learnedWords.length > 0;

    if (!hasAnyData) {
      // Start in adding mode if no data
      currentMode = ADDING;
      UnifiedLearningService.switchMode('adding');
    } else {
      currentMode = currentState.currentMode;
    }

    isInitialized = true;
  });

  // Card interaction handlers
  async function handleKnown() {
    if (!card) return;

    UnifiedLearningService.processCardResponse({
      wordId: card.wordId,
      known: true,
      responseTime: 0, // TODO: Track actual response time
      timestamp: Date.now()
    });
  }

  async function handleUnknown() {
    if (!card) return;

    UnifiedLearningService.processCardResponse({
      wordId: card.wordId,
      known: false,
      responseTime: 0, // TODO: Track actual response time
      timestamp: Date.now()
    });
  }

  function handleModeSwitch(mode: LearningMode) {
    // Check if mode switch is allowed
    if (isReviewingMode(mode) && UnifiedLearningService.getOverdueWordsCount() === 0) {
      return; // Mode selector should handle disabled state
    }
    if (isLearningMode(mode) && UnifiedLearningService.getAvailableWordsCount() === 0) {
      return; // Mode selector should handle disabled state
    }

    if (isAddingMode(mode)) {
      currentMode = ADDING;
      loadAddingWord();
      updateAddingStats();
    } else {
      currentMode = mode;
      UnifiedLearningService.switchMode(mode === 'learning' ? 'learning' : 'reviewing');
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
    // Get next word that's not in queue or learned
    const state = $unifiedLearningState;
    const currentProgress = state.progress;
    const wordsInQueue = new Set(state.learningQueue.map((item) => item.wordId));
    const learnedWords = new Set(state.learnedWords);

    // Find next available word
    for (let i = currentProgress; i < 5000; i++) {
      if (!wordsInQueue.has(i) && !learnedWords.has(i)) {
        const wordData = getWordByIndex(i);
        if (wordData) {
          addingWord = {
            word: wordData.word,
            props: wordData.props,
            translations: wordData.translations,
            index: i
          };
          return;
        }
      }
    }

    addingWord = null;
  }

  function nextAddingWord() {
    loadAddingWord();
  }

  function updateAddingStats() {
    addingStats = {
      learnedCount: $unifiedLearningState.learnedWords.length,
      canSwitchToLearning: UnifiedLearningService.getAvailableWordsCount() >= 10
    };
  }

  function handleAddToQueue() {
    if (addingWord) {
      UnifiedLearningService.addWordToQueue(addingWord.index);
      nextAddingWord();
      updateAddingStats();
    }
  }

  function handleAddToLearned() {
    if (addingWord) {
      // Add directly to learned words
      unifiedLearningState.update((state) => ({
        ...state,
        learnedWords: [...state.learnedWords, addingWord!.index]
      }));
      nextAddingWord();
      updateAddingStats();
    }
  }

  function handleSwitchToLearning() {
    if (addingStats.canSwitchToLearning) {
      currentMode = 'learning';
      UnifiedLearningService.switchMode('learning');
    }
  }

  function handleSkipAddingWord() {
    if (addingWord) {
      nextAddingWord();
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
                  currentMode = 'learning';
                  UnifiedLearningService.switchMode('learning');
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
          <h3 class="mb-2 text-xl font-bold text-gray-900">No words available for study</h3>
          <p class="mb-4 max-w-md text-gray-600">
            Add new words to your learning queue or check if any reviews are due.
          </p>
        </div>
      {:else if card}
        <div class="w-full max-w-md">
          <FlashCard
            word={card.word}
            properties={card.props}
            translations={card.translations}
            direction={card.direction}
            onKnown={handleKnown}
            onUnknown={handleUnknown}
          />

          <div class="mt-2 text-center">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              class:bg-blue-100={card.stage === 'passive'}
              class:text-blue-800={card.stage === 'passive'}
              class:bg-green-100={card.stage === 'active'}
              class:text-green-800={card.stage === 'active'}
              class:bg-yellow-100={card.stage === 'review1'}
              class:text-yellow-800={card.stage === 'review1'}
              class:bg-orange-100={card.stage === 'review2'}
              class:text-orange-800={card.stage === 'review2'}
              class:bg-purple-100={card.stage === 'review3'}
              class:text-purple-800={card.stage === 'review3'}
            >
              {card.stage}
              {#if card.consecutiveCorrect > 0}
                • {card.consecutiveCorrect}/3 ✓
              {/if}
            </span>
          </div>
        </div>

        <UserInstructions variant="compact" />
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
