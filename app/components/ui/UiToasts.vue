<template>
  <div class="ui-toasts">
    <div v-for="msg in toasts" :key="msg.id" class="ui-toast" :class="`ui-toast-${msg.severity}`">
      <div class="ui-toast-summary">{{ msg.summary }}</div>
      <div v-if="msg.detail" class="ui-toast-detail">{{ msg.detail }}</div>
      <button class="ui-toast-close" type="button" aria-label="close" @click="remove(msg.id)">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<style scoped>
.ui-toasts {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 320px;
}
.ui-toast {
  position: relative;
  padding: 0.75rem 1.75rem 0.75rem 0.9rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  font-size: 0.85rem;
  color: #fff;
}
.ui-toast-summary {
  font-weight: 600;
}
.ui-toast-detail {
  margin-top: 0.15rem;
  opacity: 0.9;
}
.ui-toast-success {
  background: var(--color-success);
}
.ui-toast-error {
  background: var(--color-danger);
}
.ui-toast-info {
  background: var(--color-primary);
}
.ui-toast-warn {
  background: #d97706;
}
.ui-toast-close {
  position: absolute;
  top: 0.35rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
}
.ui-toast-close:hover {
  opacity: 1;
}
</style>
