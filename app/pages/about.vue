<template>
  <article class="about-page">
    <h1>{{ t('about.title') }}</h1>
    <p>{{ t('about.description') }}</p>
    <p>&copy; 2026 <a href="mailto:info@alexi.ch">alexi.ch</a></p>
  </article>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped>
.about-page {
  max-width: 40rem;
  margin: 0 auto;
}
</style>
