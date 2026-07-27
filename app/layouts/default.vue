<template>
  <div class="flex min-h-screen flex-col">
    <AppToaster />

    <div
      v-if="session?.impersonatedBy"
      class="flex flex-wrap items-center justify-center gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-900"
    >
      <span>{{ t('admin.impersonating', { name: `${user?.firstName} ${user?.lastName}` }) }}</span>
      <Button variant="outline" size="sm" @click="stopImpersonation">
        {{ t('admin.backToAdmin') }}
      </Button>
    </div>

    <header class="flex flex-wrap items-center gap-4 border-b bg-card px-4 py-3">
      <span class="text-lg font-bold">{{ t('app.title') }}</span>

      <nav v-if="loggedIn" class="flex flex-1 gap-4 text-sm">
        <NuxtLink to="/" class="text-primary underline-offset-4 hover:underline">
          {{ t('nav.lists') }}
        </NuxtLink>
        <NuxtLink to="/templates" class="text-primary underline-offset-4 hover:underline">
          {{ t('nav.templates') }}
        </NuxtLink>
        <NuxtLink
          v-if="user?.role === 'admin'"
          to="/admin/users"
          class="text-primary underline-offset-4 hover:underline"
        >
          {{ t('nav.admin') }}
        </NuxtLink>
      </nav>
      <div v-else class="flex-1" />

      <div class="flex items-center gap-2">
        <NativeSelect v-model="locale" :aria-label="t('nav.language')">
          <option v-for="l in availableLocales" :key="l.code" :value="l.code">{{ l.name }}</option>
        </NativeSelect>
        <Button v-if="loggedIn" variant="ghost" size="sm" @click="logout">
          {{ t('nav.logout') }}
        </Button>
      </div>
    </header>

    <main class="p-4">
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
