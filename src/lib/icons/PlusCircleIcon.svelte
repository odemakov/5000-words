<script>
  export let size = 6;
  export let strokeWidth = 1.5;
  export let color = 'currentColor';
  export let className = '';
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  stroke-width={strokeWidth}
  stroke={color}
  class="size-{size} {className}"
>
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
  />
</svg>
