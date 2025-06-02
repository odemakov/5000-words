<script lang="ts">
  export let current = 0;
  export let total = 10;
  export let label = '';
</script>

<div class="w-full px-6 py-4">
  <div class="mb-2 flex items-center justify-between">
    <span class="text-sm text-gray-600">
      {label || `Question ${current} of ${total}`}
    </span>
  </div>

  <div class="h-2.5 w-full rounded-full bg-gray-200">
    <div
      class="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
      style="width: {(current / total) * 100}%"
    ></div>
  </div>
</div>
