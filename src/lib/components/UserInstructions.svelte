<script lang="ts">
  /**
   * Whether to show the tap instruction text
   * @default true
   */
  export let showTapInstruction: boolean = true;

  /**
   * Display variant for the instructions
   * - 'default': Full instructions with margins and detailed text
   * - 'compact': Minimal spacing and shorter text
   * @default 'default'
   */
  export let variant: 'default' | 'compact' = 'default';
</script>

<div
  class="w-full max-w-md text-center text-sm text-gray-500"
  class:mt-8={variant === 'default'}
  class:mt-6={variant === 'compact'}
>
  {#if showTapInstruction}
    <p class:mb-2={variant === 'default'} class:mb-3={variant === 'compact'}>
      {variant === 'default' ? 'Tap the card to see the translation' : 'Tap to reveal translation'}
    </p>
  {/if}

  <div class="flex items-center justify-center space-x-4 text-xs">
    <div class="flex items-center space-x-1">
      <span class="inline-block h-3 w-3 rounded bg-red-500"></span>
      <span>Don't know{variant === 'default' ? ' (← or swipe left)' : ''}</span>
    </div>
    <div class="flex items-center space-x-1">
      <span class="inline-block h-3 w-3 rounded bg-green-500"></span>
      <span>Know it{variant === 'default' ? ' (→ or swipe right)' : ''}</span>
    </div>
  </div>
</div>
