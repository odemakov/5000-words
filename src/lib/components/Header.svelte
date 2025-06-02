<script lang="ts">
  // Props
  export let title = 'French-Russian Flashcards';
  export let subtitle = '';
  export let showUndo = true;

  // Callback props
  export let onUndo = () => {};
</script>

<header class="w-full bg-blue-600 px-6 py-4 text-white shadow-md">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold">{title}</h1>
      {#if subtitle}
        <p class="text-sm opacity-80">{subtitle}</p>
      {/if}
    </div>

    {#if showUndo}
      <button
        on:click={onUndo}
        class="rounded-full p-2 transition hover:bg-blue-700"
        aria-label="Undo last action"
      >
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
      </button>
    {/if}
  </div>
</header>
