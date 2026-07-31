<template>
  <svg :width="width" :height="height" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ width?: number; height?: number }>(), { width: 24, height: 24 })
</script>
