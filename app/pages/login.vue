<template>
  <Card style="width: 100%; max-width: 380px">
    <template #title>{{ t('app.title') }}</template>
    <template #content>
      <form class="login-form" @submit.prevent="onSubmit">
        <div class="field">
          <label for="email">{{ t('auth.email') }}</label>
          <InputText id="email" v-model="email" type="email" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">{{ t('auth.password') }}</label>
          <Password id="password" v-model="password" :feedback="false" toggle-mask autocomplete="current-password" />
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Button type="submit" :label="t('auth.login')" :loading="loading" class="submit-btn" />
      </form>
    </template>
  </Card>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })
    await refreshSession()
    await navigateTo('/')
  } catch {
    error.value = t('auth.invalidCredentials')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.submit-btn {
  margin-top: 0.5rem;
}
</style>
