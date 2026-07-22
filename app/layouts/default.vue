<template>
  <div class="app-shell">
    <Toast />
    <div v-if="session?.impersonatedBy" class="impersonation-banner">
      <span>{{ t('admin.impersonating', { name: `${user?.firstName} ${user?.lastName}` }) }}</span>
      <Button :label="t('admin.backToAdmin')" size="small" severity="contrast" @click="stopImpersonation" />
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
        <Select
          v-model="locale"
          :options="availableLocales"
          option-label="name"
          option-value="code"
        />
        <Button v-if="loggedIn" :label="t('nav.logout')" severity="secondary" text @click="logout" />
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
