<template>
  <Card class="w-full max-w-sm">
    <CardHeader>
      <CardTitle class="text-xl">{{ t('app.title') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <div class="flex flex-col gap-2">
          <Label for="email">{{ t('auth.email') }}</Label>
          <Input id="email" v-model="email" type="email" autocomplete="username" required />
        </div>
        <div class="flex flex-col gap-2">
          <Label for="password">{{ t('auth.password') }}</Label>
          <Input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <Button type="submit" class="mt-2" :disabled="loading">
          {{ t('auth.login') }}
        </Button>
      </form>
    </CardContent>
  </Card>
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
