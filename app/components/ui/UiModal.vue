<template>
  <dialog ref="dialogRef" class="ui-modal" @close="emit('close')" @click="onBackdropClick">
    <div class="ui-modal-content">
      <header v-if="$slots.header" class="ui-modal-header">
        <slot name="header" />
      </header>
      <div class="ui-modal-body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="ui-modal-footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    const dialog = dialogRef.value
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }
)

onMounted(() => {
  if (props.open) dialogRef.value?.showModal()
})

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) {
    dialogRef.value?.close()
  }
}
</script>

<style scoped>
.ui-modal {
  border: none;
  border-radius: var(--radius);
  padding: 0;
  box-shadow: var(--shadow);
  max-width: 90vw;
  width: 420px;
}
.ui-modal::backdrop {
  background: rgba(15, 23, 42, 0.4);
}
.ui-modal-content {
  display: flex;
  flex-direction: column;
}
.ui-modal-header {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
}
.ui-modal-body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.ui-modal-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
