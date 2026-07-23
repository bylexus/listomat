<template>
  <div class="ui-progress">
    <div class="ui-progress-track">
      <div class="ui-progress-fill" :style="{ width: percent + '%' }" />
    </div>
    <span class="ui-progress-label">{{ done }}/{{ total }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ done: number; total: number }>()
const percent = computed(() => (props.total > 0 ? Math.round((props.done / props.total) * 100) : 0))
</script>

<style scoped>
.ui-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ui-progress-track {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}
.ui-progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}
.ui-progress-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
