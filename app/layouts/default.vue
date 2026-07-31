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
      <div ref="menuRef" class="app-menu">
        <button
          class="btn btn-ghost app-menu-trigger"
          type="button"
          :aria-label="t('nav.menu')"
          :aria-expanded="menuOpen"
          aria-haspopup="true"
          @click="menuOpen = !menuOpen"
        >
          <Menu :width="20" :height="20" />
        </button>
        <div v-if="menuOpen" class="app-menu-panel" role="menu">
          <label class="app-menu-locale">
            <select :value="locale" :aria-label="t('app.title')" @change="onLocaleChange">
              <option v-for="l in availableLocales" :key="l.code" :value="l.code">{{ l.name }}</option>
            </select>
          </label>
          <NuxtLink to="/about" class="btn btn-ghost app-menu-item" role="menuitem" @click="closeMenu">{{ t('nav.about') }}</NuxtLink>
          <button
            v-if="loggedIn"
            class="btn btn-ghost app-menu-item"
            type="button"
            role="menuitem"
            @click="onLogout"
          >
            {{ t('nav.logout') }}
          </button>
        </div>
      </div>
    </header>
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Menu from '~/assets/icons/Menu.vue'

const { t, locale, locales, setLocale } = useI18n()
const availableLocales = computed(() => locales.value)

async function onLocaleChange(event: Event) {
  const code = (event.target as HTMLSelectElement).value as 'de' | 'en'
  await setLocale(code)
  localStorage.setItem(LOCALE_STORAGE_KEY, code)
}
const { loggedIn, user, session, clear, fetch: refreshSession } = useUserSession()
const { call } = useApi()

const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function closeMenu() {
  menuOpen.value = false
}

async function onLogout() {
  closeMenu()
  await clear()
  await navigateTo('/login')
}

async function stopImpersonation() {
  await call(() => $fetch('/api/admin/impersonate/stop', { method: 'POST' }))
  await refreshSession()
  await navigateTo('/admin/users')
}

function onDocumentMouseDown(event: MouseEvent) {
  if (!menuOpen.value) return
  const root = menuRef.value
  if (root && !root.contains(event.target as Node)) {
    closeMenu()
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && menuOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
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
.app-menu {
  position: relative;
  margin-left: auto;
}
.app-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
}
.app-menu-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: 0;
  min-width: 12rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 20;
}
.app-menu-locale select {
  width: 100%;
}
.app-menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: inherit;
  text-decoration: none;
}
.app-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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