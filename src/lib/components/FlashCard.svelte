<script lang="ts">
  // Props
  export let word = '';
  export let properties: string[] = [];
  export let translations: string[] = [];

  // Callback props instead of event dispatcher
  export let onSwipeRight = () => {};
  export let onSwipeLeft = () => {};
  export let onSwipeUp = () => {};

  // State
  let isFlipped = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwipingRight = false;
  let isSwipingLeft = false;
  let isSwipingUp = false;

  function handleTap() {
    isFlipped = !isFlipped;
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Reset swipe animations
    const resetAnimations = () => {
      setTimeout(() => {
        isSwipingRight = false;
        isSwipingLeft = false;
        isSwipingUp = false;
      }, 300);
    };

    // Detect swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        isSwipingRight = true;
        resetAnimations();
        onSwipeRight(); // "I know this word"
      } else {
        isSwipingLeft = true;
        resetAnimations();
        onSwipeLeft(); // "Don't know"
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY < 0) {
        isSwipingUp = true;
        resetAnimations();
        onSwipeUp(); // "I learned this word" (only used in main learning)
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
  on:keydown={(e) => e.key === 'Enter' && handleTap()}
  role="button"
  tabindex="0"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  <div
    class="absolute inset-0 transform rounded-xl transition-all duration-300 backface-hidden"
    class:rotate-y-180={isFlipped}
  >
    <!-- Front of card (French word) -->
    <div class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white p-6">
      <h2 class="text-3xl font-bold text-gray-800">{word}</h2>
      <div class="mt-2 text-sm text-gray-500">
        {properties.join(', ')}
      </div>
    </div>
  </div>

  <!-- Back of card (Russian translations) -->
  <div
    class="absolute inset-0 rotate-y-180 transform rounded-xl transition-all duration-300 backface-hidden"
    class:rotate-y-0={isFlipped}
  >
    <div class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white p-6">
      <ul class="w-full text-center">
        {#each translations as translation, i (i)}
          <li class="py-1 text-2xl text-gray-700">{translation}</li>
        {/each}
      </ul>
    </div>
  </div>

  <!-- Swipe indicators -->
  <div
    class="pointer-events-none absolute inset-x-0 top-0 flex h-8 items-center justify-center opacity-50"
  >
    <svg
      class="h-6 w-6 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      ></path>
    </svg>
  </div>
  <div
    class="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-center opacity-50"
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
    class="pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center opacity-50"
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
