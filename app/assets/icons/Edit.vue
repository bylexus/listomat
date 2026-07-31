<template>
  <svg :width="width" :height="height" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path
      d="M17 3l4 4L8 20l-5 1 1-5L17 3z"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ width?: number; height?: number }>(), { width: 24, height: 24 })
</script>
