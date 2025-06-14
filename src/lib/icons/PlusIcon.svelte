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
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
