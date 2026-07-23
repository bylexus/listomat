<template>
  <div class="card login-card">
    <h1>{{ t('app.title') }}</h1>
    <form class="login-form" @submit.prevent="onSubmit">
      <div class="form-field">
        <label for="email">{{ t('auth.email') }}</label>
        <input id="email" v-model="email" type="email" autocomplete="username" required />
      </div>
      <div class="form-field">
        <label for="password">{{ t('auth.password') }}</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
        {{ t('auth.login') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const { fetch: refreshSession } = useUserSession()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    await refreshSession()
    await navigateTo('/')
  } catch {
    toast.add({ severity: 'error', summary: t('auth.invalidCredentials') })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 380px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.submit-btn {
  margin-top: 0.5rem;
}
</style>
