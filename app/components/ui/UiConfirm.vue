<template>
  <UiModal :open="!!state.resolve" @close="onCancel">
    <template #header>{{ t('confirm.title') }}</template>
    <p>{{ state.message }}</p>
    <template #footer>
      <button class="btn" type="button" @click="onCancel">{{ t('confirm.cancel') }}</button>
      <button class="btn btn-primary" type="button" @click="onConfirm">{{ t('confirm.ok') }}</button>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { state } = useConfirm()

function onConfirm() {
  state.value.resolve?.(true)
  state.value = { message: '', resolve: null }
}

function onCancel() {
  state.value.resolve?.(false)
  state.value = { message: '', resolve: null }
}
</script>
