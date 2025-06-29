<script lang="ts">
  import { learningState } from '$lib/controllers/LearningController';
  import { Storage } from '$lib/storage';
  import {
    LEARNING_FORWARD,
    LEARNING_BACKWARD,
    REVIEWING,
    ADDING,
    MODE_INFO,
    type LearningMode
  } from '$lib/constants/modes';
  import { activeTooltip, toggleTooltip, closeTooltip } from '$lib/stores/tooltipStore';
  import { onMount } from 'svelte';

  export let mode: LearningMode;
  export let currentMode: LearningMode;
  export let count: number;
  export let total: number;
  export let enabled: boolean;
  export let onClick: () => void;

  let tooltipElement: HTMLDivElement;
  let buttonElement: HTMLButtonElement;

  // Get words data for tooltip
  function getWordsForMode(): Array<{ word: string; translations: string[]; info: string }> {
    const state = $learningState;
    const allWords = Storage.getWords() || [];

    switch (mode) {
      case LEARNING_FORWARD:
        return state.forwardQueue
          .map((item) => {
            const wordData = allWords[item.wordIndex];
            return wordData
              ? {
                  word: wordData.word,
                  translations: wordData.translations,
                  info: `Attempts: ${item.attempts}`
                }
              : null;
          })
          .filter(
            (item): item is { word: string; translations: string[]; info: string } => item !== null
          );

      case LEARNING_BACKWARD:
        return state.backwardQueue
          .map((item) => {
            const wordData = allWords[item.wordIndex];
            return wordData
              ? {
                  word: wordData.word,
                  translations: wordData.translations,
                  info: `Attempts: ${item.attempts}`
                }
              : null;
          })
          .filter(
            (item): item is { word: string; translations: string[]; info: string } => item !== null
          );

      case REVIEWING: {
        const now = Date.now();
        return state.reviewQueue
          .sort((a, b) => a.dueDate - b.dueDate) // Sort by due date (earliest first)
          .map((item) => {
            const wordData = allWords[item.wordIndex];
            if (!wordData) return null;

            const timeUntilDue = item.dueDate - now;
            let dueInfo: string;

            if (timeUntilDue <= 0) {
              dueInfo = 'Ready now';
            } else {
              const hours = Math.floor(timeUntilDue / (1000 * 60 * 60));
              const days = Math.floor(hours / 24);

              if (days > 0) {
                dueInfo = `Due in ${days}d ${hours % 24}h`;
              } else if (hours > 0) {
                dueInfo = `Due in ${hours}h`;
              } else {
                const minutes = Math.floor(timeUntilDue / (1000 * 60));
                dueInfo = `Due in ${minutes}m`;
              }
            }

            return {
              word: wordData.word,
              translations: wordData.translations,
              info: `${dueInfo} • Pool #${item.pool.replace('POOL', '')}`
            };
          })
          .filter(
            (item): item is { word: string; translations: string[]; info: string } => item !== null
          );
      }

      default:
        return [];
    }
  }

  function handleHelpClick(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation();
    toggleTooltip(mode);
  }

  function handleClickOutside(event: MouseEvent) {
    if (
      $activeTooltip === mode &&
      tooltipElement &&
      !tooltipElement.contains(event.target as Node) &&
      !buttonElement.contains(event.target as Node)
    ) {
      closeTooltip();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  $: isActive = currentMode === mode;
  $: showTooltip = $activeTooltip === mode;
  $: wordsForTooltip = showTooltip ? getWordsForMode() : [];
  $: hasWords = count > 0 || mode === ADDING;

  function getButtonClasses() {
    const baseClasses =
      'relative flex-1 cursor-pointer rounded-md px-4 py-3 text-sm font-medium transition-all duration-200';

    if (!enabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed text-gray-600`;
    }

    if (isActive) {
      const activeColor = mode === REVIEWING ? 'bg-yellow-500' : 'bg-blue-500';
      return `${baseClasses} ${activeColor} text-white shadow-sm`;
    }

    return `${baseClasses} text-gray-600 hover:bg-gray-50`;
  }
</script>

<div class="relative flex-1 text-center">
  <button
    bind:this={buttonElement}
    class={getButtonClasses()}
    disabled={!enabled}
    on:click={onClick}
  >
    <div class="flex flex-col items-center">
      <!-- Help icon -->
      {#if hasWords && mode !== ADDING}
        <div
          class="absolute top-1 right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-400 text-white transition-colors hover:bg-gray-500"
          on:click={handleHelpClick}
          on:keydown={(e) => e.key === 'Enter' && handleHelpClick(e)}
          role="button"
          tabindex="0"
          aria-label="Show words in queue"
        >
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      {/if}

      <!-- Main icon -->
      <svg class="mb-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if mode === LEARNING_FORWARD || mode === LEARNING_BACKWARD}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        {:else if mode === REVIEWING}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        {:else if mode === ADDING}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        {/if}
      </svg>

      <!-- Label -->
      <span class="text-sm">{MODE_INFO[mode].label}</span>

      <!-- Stats -->
      {#if mode === LEARNING_FORWARD || mode === LEARNING_BACKWARD}
        {#if count > 0}
          <span class="text-xs opacity-75">{count} words</span>
        {/if}
      {:else if mode === REVIEWING}
        <div class="text-xs opacity-75">{count}/{total} words</div>
      {/if}
    </div>
  </button>

  <!-- Tooltip -->
  {#if showTooltip && wordsForTooltip.length > 0}
    <div
      bind:this={tooltipElement}
      class="absolute z-50 mt-2 max-h-64 w-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
      style="top: calc(100% + 8px); left: 50%; transform: translateX(-50%);"
    >
      <div class="p-3">
        <div class="mb-2 text-sm font-medium text-gray-900">
          {MODE_INFO[mode].fullLabel}
        </div>
        <div class="space-y-1.5 text-xs">
          {#each wordsForTooltip as item (item.word)}
            <div
              class="flex items-start justify-between border-b border-gray-100 pb-1 last:border-b-0"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium text-gray-900">{item.word}</div>
                <div class="truncate text-gray-600">{item.translations.join(', ')}</div>
              </div>
              {#if item.info}
                <div class="ml-2 shrink-0 text-right text-gray-500">
                  {item.info}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
