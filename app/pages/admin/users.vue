<template>
  <div>
    <div class="page-header">
      <h1>{{ t('nav.admin') }}</h1>
      <Button :label="t('admin.newUser')" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable :value="userList" data-key="id" :loading="loading">
      <Column field="email" :header="t('admin.email')" />
      <Column :header="t('admin.firstName') + ' / ' + t('admin.lastName')">
        <template #body="{ data }">{{ data.firstName }} {{ data.lastName }}</template>
      </Column>
      <Column :header="t('admin.role')">
        <template #body="{ data }">{{ data.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser') }}</template>
      </Column>
      <Column :header="t('admin.active')">
        <template #body="{ data }">
          <Tag :severity="data.active ? 'success' : 'danger'" :value="data.active ? t('admin.activeYes') : t('admin.activeNo')" />
        </template>
      </Column>
      <Column :header="t('admin.lastLogin')">
        <template #body="{ data }">{{ formatDate(data.lastLoginAt) }}</template>
      </Column>
      <Column :header="t('admin.actions')">
        <template #body="{ data }">
          <div class="row-actions">
            <Button icon="pi pi-pencil" text rounded :title="t('admin.editUser')" @click="openEdit(data)" />
            <Button
              :icon="data.active ? 'pi pi-ban' : 'pi pi-check'"
              text
              rounded
              :disabled="data.id === currentUser?.id"
              :title="data.active ? t('admin.activeNo') : t('admin.activeYes')"
              @click="toggleActive(data)"
            />
            <Button icon="pi pi-key" text rounded :title="t('admin.setPassword')" @click="openPassword(data)" />
            <Button
              icon="pi pi-user"
              text
              rounded
              :disabled="data.id === currentUser?.id || !data.active"
              :title="t('admin.impersonate')"
              @click="impersonate(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="editDialogVisible" modal :header="editingId ? t('admin.editUser') : t('admin.newUser')" style="width: 420px">
      <div class="dialog-form">
        <div class="field">
          <label for="f-email">{{ t('admin.email') }}</label>
          <InputText id="f-email" v-model="form.email" />
        </div>
        <div class="field">
          <label for="f-first">{{ t('admin.firstName') }}</label>
          <InputText id="f-first" v-model="form.firstName" />
        </div>
        <div class="field">
          <label for="f-last">{{ t('admin.lastName') }}</label>
          <InputText id="f-last" v-model="form.lastName" />
        </div>
        <div v-if="!editingId" class="field">
          <label for="f-pw">{{ t('admin.password') }}</label>
          <Password id="f-pw" v-model="form.password" :feedback="false" toggle-mask />
        </div>
        <div v-if="editingId" class="field">
          <label for="f-role">{{ t('admin.role') }}</label>
          <Select
            id="f-role"
            v-model="form.role"
            :options="[{ label: t('admin.roleUser'), value: 'user' }, { label: t('admin.roleAdmin'), value: 'admin' }]"
            option-label="label"
            option-value="value"
          />
        </div>
      </div>
      <template #footer>
        <Button :label="t('admin.cancel')" severity="secondary" text @click="editDialogVisible = false" />
        <Button :label="t('admin.save')" :loading="saving" @click="saveUser" />
      </template>
    </Dialog>

    <Dialog v-model:visible="passwordDialogVisible" modal :header="t('admin.setPassword')" style="width: 380px">
      <div class="field">
        <label for="f-newpw">{{ t('admin.newPassword') }}</label>
        <Password id="f-newpw" v-model="newPassword" :feedback="false" toggle-mask />
      </div>
      <template #footer>
        <Button :label="t('admin.cancel')" severity="secondary" text @click="passwordDialogVisible = false" />
        <Button :label="t('admin.save')" :loading="saving" @click="savePassword" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user'
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

const { t, locale } = useI18n()
const { call } = useApi()
const toast = useToast()
const { user: currentUser, fetch: refreshSession } = useUserSession()

const userList = ref<AdminUser[]>([])
const loading = ref(false)

const editDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = reactive({ email: '', firstName: '', lastName: '', password: '', role: 'user' as 'admin' | 'user' })

const passwordDialogVisible = ref(false)
const passwordTargetId = ref<string | null>(null)
const newPassword = ref('')

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString(locale.value)
}

async function loadUsers() {
  loading.value = true
  const result = await call(() => $fetch<AdminUser[]>('/api/admin/users'))
  if (result) userList.value = result
  loading.value = false
}

function openCreate() {
  editingId.value = null
  form.email = ''
  form.firstName = ''
  form.lastName = ''
  form.password = ''
  form.role = 'user'
  editDialogVisible.value = true
}

function openEdit(data: AdminUser) {
  editingId.value = data.id
  form.email = data.email
  form.firstName = data.firstName
  form.lastName = data.lastName
  form.password = ''
  form.role = data.role
  editDialogVisible.value = true
}

async function saveUser() {
  saving.value = true
  if (editingId.value) {
    const result = await call(() => $fetch(`/api/admin/users/${editingId.value}`, {
      method: 'PATCH',
      body: { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role }
    }))
    if (result) {
      toast.add({ severity: 'success', summary: t('admin.userUpdated'), life: 3000 })
      editDialogVisible.value = false
      await loadUsers()
    }
  } else {
    const result = await call(() => $fetch('/api/admin/users', {
      method: 'POST',
      body: { email: form.email, firstName: form.firstName, lastName: form.lastName, password: form.password }
    }))
    if (result) {
      toast.add({ severity: 'success', summary: t('admin.userCreated'), life: 3000 })
      editDialogVisible.value = false
      await loadUsers()
    }
  }
  saving.value = false
}

async function toggleActive(data: AdminUser) {
  const result = await call(() => $fetch(`/api/admin/users/${data.id}`, {
    method: 'PATCH',
    body: { active: !data.active }
  }))
  if (result) {
    toast.add({ severity: 'success', summary: t('admin.userUpdated'), life: 3000 })
    await loadUsers()
  }
}

function openPassword(data: AdminUser) {
  passwordTargetId.value = data.id
  newPassword.value = ''
  passwordDialogVisible.value = true
}

async function savePassword() {
  if (!passwordTargetId.value) return
  saving.value = true
  const result = await call(() => $fetch(`/api/admin/users/${passwordTargetId.value}`, {
    method: 'PATCH',
    body: { password: newPassword.value }
  }))
  if (result) {
    toast.add({ severity: 'success', summary: t('admin.passwordSet'), life: 3000 })
    passwordDialogVisible.value = false
  }
  saving.value = false
}

async function impersonate(data: AdminUser) {
  const result = await call(() => $fetch('/api/admin/impersonate', {
    method: 'POST',
    body: { userId: data.id }
  }))
  if (result) {
    await refreshSession()
    await navigateTo('/')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.row-actions {
  display: flex;
  gap: 0.25rem;
}
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
