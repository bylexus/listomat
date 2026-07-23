<template>
  <div class="app-shell">
    <UiToasts />
    <UiConfirm />
    <div v-if="session?.impersonatedBy" class="impersonation-banner">
      <span>{{ t('admin.impersonating', { name: `${user?.firstName} ${user?.lastName}` }) }}</span>
      <button class="btn" type="button" @click="stopImpersonation">{{ t('admin.backToAdmin') }}</button>
    </div>
    <header class="app-header">
      <span class="app-title">{{ t('app.title') }}</span>
      <nav v-if="loggedIn" class="app-nav">
        <NuxtLink to="/">{{ t('nav.lists') }}</NuxtLink>
        <NuxtLink to="/templates">{{ t('nav.templates') }}</NuxtLink>
        <NuxtLink v-if="user?.role === 'admin'" to="/admin/users">{{ t('nav.admin') }}</NuxtLink>
      </nav>
      <div v-else class="app-nav" />
      <div class="app-lang">
        <select v-model="locale" :aria-label="t('app.title')">
          <option v-for="l in availableLocales" :key="l.code" :value="l.code">{{ l.name }}</option>
        </select>
        <button v-if="loggedIn" class="btn btn-ghost" type="button" @click="logout">{{ t('nav.logout') }}</button>
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
const { loggedIn, user, session, clear, fetch: refreshSession } = useUserSession()
const { call } = useApi()

async function logout() {
  await clear()
  await navigateTo('/login')
}

async function stopImpersonation() {
  await call(() => $fetch('/api/admin/impersonate/stop', { method: 'POST' }))
  await refreshSession()
  await navigateTo('/admin/users')
}
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
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
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
.app-lang {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.app-lang select {
  width: auto;
}
.app-main {
  padding: 1rem;
}
.impersonation-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.9rem;
}
</style>
