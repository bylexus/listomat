<template>
  <div class="flex flex-col gap-1">
    <span class="text-sm text-muted-foreground">{{ done }} / {{ total }}</span>
    <Progress :model-value="percent" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ done: number; total: number }>()

const percent = computed(() => (props.total > 0 ? Math.round((props.done / props.total) * 100) : 0))
</script>
