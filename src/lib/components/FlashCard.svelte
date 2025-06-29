<script lang="ts">
  import { onMount } from 'svelte';
  import { CardDirection } from '$lib/types/learning';

  // Props
  export let word = '';
  export let properties: string[] = [];
  export let translations: string[] = [];
  export let direction: CardDirection = CardDirection.FORWARD;

  // Semantic callback props - clearer than generic onSwipeRight/onSwipeLeft
  export let onKnown = () => {};
  export let onUnknown = () => {};

  // Determine what to show based on direction
  $: frontText = direction === CardDirection.FORWARD ? word : translations[0] || '';
  $: backText = direction === CardDirection.FORWARD ? translations : [word];
  $: frontLanguage = direction === CardDirection.FORWARD ? 'French' : 'Russian';
  $: backLanguage = direction === CardDirection.FORWARD ? 'Russian' : 'French';

  // State
  let isFlipped = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwipingRight = false;
  let isSwipingLeft = false;
  let isSwipingUp = false;

  // Reset flip state when card changes
  $: if (word || translations || direction) {
    isFlipped = false;
  }

  onMount(async () => {
    console.log(isFlipped);
  });

  function handleTap() {
    isFlipped = !isFlipped;
  }

  function handleClickRight() {
    iKnow();
  }

  function handleClickLeft() {
    iDontKnow();
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        handleTap();
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleClickRight();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleClickLeft();
        break;
    }
  }

  function handleArrowKeyDown(e: KeyboardEvent, action: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }

  function handleTouchStart(e: TouchEvent) {
    console.debug('Touch start');
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  // Reset swipe animations
  function resetAnimations() {
    setTimeout(() => {
      isSwipingRight = false;
      isSwipingLeft = false;
      isSwipingUp = false;
    }, 300);
  }

  function iDontKnow() {
    isSwipingLeft = true;
    resetAnimations();
    onUnknown(); // "Don't know"
  }

  function iKnow() {
    isSwipingRight = true;
    resetAnimations();
    onKnown(); // "I know this word"
  }

  function handleTouchEnd(e: TouchEvent) {
    console.debug('Touch end');
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Detect swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        iKnow();
      } else {
        iDontKnow();
      }
    }
  }
</script>

<div
  class="relative mx-auto h-64 w-full max-w-md rounded-xl shadow-lg transition-transform duration-300"
  class:translate-x-full={isSwipingRight}
  class:translate-x-[-100%]={isSwipingLeft}
  class:translate-y-[-100%]={isSwipingUp}
  on:click={handleTap}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  <div
    class="absolute inset-0 transform rounded-xl transition-all duration-300 backface-hidden"
    class:rotate-y-180={isFlipped}
  >
    <!-- Front of card -->
    <div class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white p-6">
      <h2 class="text-3xl font-bold text-gray-800">{frontText}</h2>
      <div class="mt-2 text-sm text-gray-500">
        {properties.join(', ')}
      </div>
      <div class="mt-1 text-xs text-blue-500">
        {frontLanguage}
      </div>
    </div>
  </div>

  <!-- Back of card -->
  <div
    class="absolute inset-0 rotate-y-180 transform rounded-xl transition-all duration-300 backface-hidden"
    class:rotate-y-0={isFlipped}
  >
    <div class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white p-6">
      <ul class="w-full text-center">
        {#each backText as text, i (i)}
          <li class="py-1 text-2xl text-gray-700">{text}</li>
        {/each}
      </ul>
      <div class="mt-2 text-sm text-gray-500">
        {direction === CardDirection.BACKWARD ? properties.join(', ') : ''}
      </div>
      <div class="mt-1 text-xs text-blue-500">
        {backLanguage}
      </div>
    </div>
  </div>

  <!-- Swipe/Click indicators -->
  <div
    class="bg-opacity-40 hover:bg-opacity-60 absolute inset-y-0 right-0 z-50 flex w-12 cursor-pointer items-center justify-center transition-colors"
    on:click|stopPropagation={handleClickRight}
    on:keydown={(e) => handleArrowKeyDown(e, handleClickRight)}
    role="button"
    tabindex="-2"
    title="I know this"
  >
    <svg
      class="h-6 w-6 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
    </svg>
  </div>
  <div
    class="bg-opacity-40 hover:bg-opacity-60 absolute inset-y-0 left-0 z-40 flex w-12 cursor-pointer items-center justify-center transition-colors"
    on:click|stopPropagation={handleClickLeft}
    on:keydown={(e) => handleArrowKeyDown(e, handleClickLeft)}
    role="button"
    tabindex="-3"
    title="Don't know"
  >
    <svg
      class="h-6 w-6 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
      ></path>
    </svg>
  </div>
</div>

<style>
  .backface-hidden {
    backface-visibility: hidden;
  }

  .rotate-y-180 {
    transform: rotateY(180deg);
  }

  .rotate-y-0 {
    transform: rotateY(0deg);
  }

  /* For browsers that don't support these classes natively */
  .translate-x-full {
    transform: translateX(100%);
  }

  .translate-x-\[-100\%\] {
    transform: translateX(-100%);
  }

  .translate-y-\[-100\%\] {
    transform: translateY(-100%);
  }
</style>
