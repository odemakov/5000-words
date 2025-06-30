<script lang="ts">
  import {
    UnifiedLearningService,
    unifiedLearningState,
    queueStats
  } from '$lib/services/UnifiedLearningService';
  import QueueStatsDisplay from '$lib/components/QueueStatsDisplay.svelte';
  import { Storage } from '../storage.js';
  import { goto } from '$app/navigation';
  import { DEFAULT_SPACING_INTERVALS } from '$lib/types/queue';

  export let onClose: () => void;

  $: currentLevel = $unifiedLearningState.detectedLevel;
  $: todayStats = $unifiedLearningState.todayStats;

  let showResetConfirmation = false;
  let showExportSuccess = false;
  let importInput: HTMLInputElement;

  // Settings state
  let fontSize: 'small' | 'medium' | 'large' = 'medium';
  let theme: 'light' | 'dark' = 'light';
  let soundEffects = true;
  let dailyGoal = 20;
  let review1Hours = DEFAULT_SPACING_INTERVALS.review1 / (1000 * 60 * 60);
  let review2Hours = DEFAULT_SPACING_INTERVALS.review2 / (1000 * 60 * 60);
  let review3Hours = DEFAULT_SPACING_INTERVALS.review3 / (1000 * 60 * 60);

  // Load saved settings on component mount
  function loadSettings() {
    const settings = Storage.getAppSettings();
    if (settings) {
      fontSize = (settings.fontSize as 'small' | 'medium' | 'large') || 'medium';
      theme = (settings.theme as 'light' | 'dark') || 'light';
      soundEffects = settings.soundEffects !== false;
      dailyGoal = (settings.dailyGoal as number) || 20;
      review1Hours = settings.reviewIntervals?.pool1Hours || review1Hours;
      review2Hours = settings.reviewIntervals?.pool2Hours || review2Hours;
      review3Hours = settings.reviewIntervals?.pool3Hours || review3Hours;
    }
  }

  // Save settings
  function saveSettings() {
    Storage.saveAppSettings({
      fontSize,
      theme,
      soundEffects,
      dailyGoal,
      reviewIntervals: {
        pool1Hours: review1Hours,
        pool2Hours: review2Hours,
        pool3Hours: review3Hours
      }
    });
  }

  // Format time duration
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Reset progress
  function handleReset() {
    if (showResetConfirmation) {
      UnifiedLearningService.resetProgress();
      showResetConfirmation = false;
      onClose();
      // Reload the page to restart from level test
      window.location.reload();
    } else {
      showResetConfirmation = true;
    }
  }

  // Export data
  function handleExport() {
    try {
      const data = UnifiedLearningService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `5000-words-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showExportSuccess = true;
      setTimeout(() => {
        showExportSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }

  // Import data
  function handleImport() {
    importInput.click();
  }

  function handleFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (UnifiedLearningService.importData(e.target?.result as string)) {
          alert('Data imported successfully! The page will reload.');
          window.location.reload();
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }

  // Debug function
  function handleDebugData() {
    goto('/debug');
  }

  // Apply font size changes
  $: {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize =
        fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    }
    saveSettings();
  }

  // Apply theme changes
  $: {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    saveSettings();
  }

  // Save other settings when they change
  $: if (
    soundEffects !== undefined &&
    dailyGoal !== undefined &&
    pool1Hours !== undefined &&
    pool2Hours !== undefined &&
    pool3Hours !== undefined
  ) {
    saveSettings();
  }

  // Load settings when component mounts
  loadSettings();
</script>

<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
  <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Settings</h2>
      <button
        on:click={onClose}
        class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="Close settings"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Today's Statistics -->
    <div class="mb-6 rounded-lg bg-blue-50 p-4">
      <h3 class="mb-3 text-sm font-medium text-blue-900">Today's Progress</h3>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600">{todayStats.newWords}</div>
          <div class="text-xs text-blue-500">New Words</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-600">{todayStats.reviewWords}</div>
          <div class="text-xs text-blue-500">Reviews</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-600">{formatTime(todayStats.timeSpent)}</div>
          <div class="text-xs text-blue-500">Time Spent</div>
        </div>
      </div>
      <div class="mt-3 text-center">
        <div class="inline-flex items-center space-x-1 text-sm text-blue-700">
          <span>🔥</span>
          <span>{todayStats.streakDays} day streak</span>
        </div>
      </div>
    </div>

    <!-- Display Settings -->
    <div class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-gray-900">Display</h3>

      <!-- Font Size -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700" for="font-size-group">Font Size</label>
        <div class="flex space-x-2" role="group" aria-labelledby="font-size-group">
          {#each ['small', 'medium', 'large'] as size (size)}
            <button
              class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              class:bg-blue-500={fontSize === size}
              class:text-white={fontSize === size}
              class:bg-gray-100={fontSize !== size}
              class:text-gray-700={fontSize !== size}
              on:click={() => (fontSize = size as 'small' | 'medium' | 'large')}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          {/each}
        </div>
      </div>

      <!-- Theme -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700" for="theme-group">Theme</label>
        <div class="flex space-x-2" role="group" aria-labelledby="theme-group">
          {#each [['light', '☀️'], ['dark', '🌙']] as [themeOption, icon] (themeOption)}
            <button
              class="flex flex-1 items-center justify-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              class:bg-blue-500={theme === themeOption}
              class:text-white={theme === themeOption}
              class:bg-gray-100={theme !== themeOption}
              class:text-gray-700={theme !== themeOption}
              on:click={() => (theme = themeOption as 'light' | 'dark')}
            >
              <span>{icon}</span>
              <span>{themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Study Settings -->
    <div class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-gray-900">Study</h3>

      <!-- Daily Goal -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700" for="daily-goal"
          >Daily Goal (new words)</label
        >
        <input
          id="daily-goal"
          type="range"
          min="5"
          max="50"
          step="5"
          bind:value={dailyGoal}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>5 words</span>
          <span class="font-medium text-blue-600">{dailyGoal} words</span>
          <span>50 words</span>
        </div>
      </div>

      <!-- Sound Effects -->
      <div class="flex items-center justify-between">
        <label class="text-sm text-gray-700" for="sound-effects">Sound Effects</label>
        <button
          id="sound-effects"
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          class:bg-blue-600={soundEffects}
          class:bg-gray-200={!soundEffects}
          on:click={() => (soundEffects = !soundEffects)}
          aria-label="Toggle sound effects"
          role="switch"
          aria-checked={soundEffects}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            class:translate-x-5={soundEffects}
            class:translate-x-0={!soundEffects}
          ></span>
        </button>
      </div>
    </div>

    <!-- Review Settings -->
    <div class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-gray-900">Review Intervals</h3>
      <p class="mb-4 text-xs text-gray-600">
        Configure how long to wait before reviewing words from each pool
      </p>

      <!-- Pool 1 Interval -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700" for="pool1-hours">
          Pool 1 (Short-term) - Hours
        </label>
        <input
          id="pool1-hours"
          type="range"
          min="1"
          max="168"
          step="1"
          bind:value={pool1Hours}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>1 hour</span>
          <span class="font-medium text-blue-600"
            >{pool1Hours} hours ({Math.round((pool1Hours / 24) * 10) / 10} days)</span
          >
          <span>1 week</span>
        </div>
      </div>

      <!-- Pool 2 Interval -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700" for="pool2-hours">
          Pool 2 (Medium-term) - Hours
        </label>
        <input
          id="pool2-hours"
          type="range"
          min="1"
          max="720"
          step="1"
          bind:value={pool2Hours}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>1 hour</span>
          <span class="font-medium text-blue-600"
            >{pool2Hours} hours ({Math.round((pool2Hours / 24) * 10) / 10} days)</span
          >
          <span>1 month</span>
        </div>
      </div>

      <!-- Pool 3 Interval -->
      <div class="mb-4">
        <label class="mb-2 block text-sm text-gray-700" for="pool3-hours">
          Pool 3 (Long-term) - Hours
        </label>
        <input
          id="pool3-hours"
          type="range"
          min="1"
          max="2160"
          step="1"
          bind:value={pool3Hours}
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>1 hour</span>
          <span class="font-medium text-blue-600"
            >{pool3Hours} hours ({Math.round((pool3Hours / 24) * 10) / 10} days)</span
          >
          <span>3 months</span>
        </div>
      </div>

      <div class="rounded-lg bg-yellow-50 p-3">
        <p class="text-xs text-yellow-800">
          💡 <strong>Tip:</strong> Pool 1 = first review, Pool 2 = second review, Pool 3 = final review
          before "learned"
        </p>
      </div>
    </div>

    <!-- Debug Section (Development) -->
    <div class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-gray-900">Debug</h3>

      <button
        on:click={handleDebugData}
        class="flex w-full items-center justify-center space-x-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
        <span>Populate Test Data</span>
      </button>

      <p class="mt-2 text-center text-xs text-gray-500">
        Creates even numbers in all queues for testing
      </p>
    </div>

    <!-- Data Management -->
    <div class="mb-6">
      <h3 class="mb-3 text-sm font-medium text-gray-900">Data</h3>

      <div class="space-y-2">
        <!-- Export -->
        <button
          on:click={handleExport}
          class="flex w-full items-center justify-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Export Progress</span>
        </button>

        <!-- Import -->
        <button
          on:click={handleImport}
          class="flex w-full items-center justify-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <span>Import Progress</span>
        </button>

        <!-- Reset -->
        <button
          on:click={handleReset}
          class="flex w-full items-center justify-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          class:bg-red-600={showResetConfirmation}
          class:text-white={showResetConfirmation}
          class:hover:bg-red-700={showResetConfirmation}
          class:bg-gray-200={!showResetConfirmation}
          class:text-gray-700={!showResetConfirmation}
          class:hover:bg-gray-300={!showResetConfirmation}
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>{showResetConfirmation ? 'Confirm Reset' : 'Reset Progress'}</span>
        </button>

        {#if showResetConfirmation}
          <p class="text-center text-xs text-red-600">
            ⚠️ This will delete all your progress. Click again to confirm.
          </p>
        {/if}
      </div>
    </div>

    <!-- App Info -->
    <div class="border-t border-gray-200 pt-4">
      <div class="text-center text-xs text-gray-500">
        <p>5000 Words v1.0</p>
        <p class="mt-1">Level: {currentLevel}</p>
      </div>
    </div>

    <!-- Success Messages -->
    {#if showExportSuccess}
      <div
        class="fixed right-4 bottom-4 left-4 mx-auto max-w-sm rounded-lg bg-green-500 p-3 text-center text-sm text-white shadow-lg"
      >
        ✅ Progress exported successfully!
      </div>
    {/if}

    <!-- Hidden file input for import -->
    <input
      bind:this={importInput}
      type="file"
      accept=".json"
      on:change={handleFileSelect}
      class="hidden"
    />
  </div>
</div>
