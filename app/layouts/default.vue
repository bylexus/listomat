<template>
  <div class="app-shell">
    <header class="app-header">
      <span class="app-title">{{ t('app.title') }}</span>
      <nav class="app-nav">
        <NuxtLink to="/">{{ t('nav.lists') }}</NuxtLink>
        <NuxtLink to="/templates">{{ t('nav.templates') }}</NuxtLink>
        <NuxtLink to="/admin/users">{{ t('nav.admin') }}</NuxtLink>
      </nav>
      <div class="app-lang">
        <Select
          v-model="locale"
          :options="availableLocales"
          option-label="name"
          option-value="code"
        />
      </div>
    </header>
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { t, locale, locales } = useI18n()
const availableLocales = computed(() => locales.value)
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}
.app-title {
  font-weight: 700;
  font-size: 1.1rem;
}
.app-nav {
  display: flex;
  gap: 1rem;
  flex: 1;
}
.app-main {
  padding: 1rem;
}
</style>
