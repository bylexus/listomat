<template>
  <div>
    <h1>{{ t('nav.lists') }}</h1>
    <p>E1: Projekt-Setup. PrimeVue-Button und Sprachumschaltung testen.</p>
    <Button :label="t('nav.lists')" icon="pi pi-check" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
