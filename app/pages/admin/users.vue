<template>
  <div>
    <div class="page-header toolbar">
      <h1>{{ t('nav.admin') }}</h1>
      <button class="btn btn-primary" type="button" @click="openCreate">
        <Plus :width="16" :height="16" />
        {{ t('admin.newUser') }}
      </button>
    </div>

    <div class="card table-card">
      <table>
        <thead>
          <tr>
            <th>{{ t('admin.email') }}</th>
            <th>{{ t('admin.firstName') }} / {{ t('admin.lastName') }}</th>
            <th>{{ t('admin.role') }}</th>
            <th>{{ t('admin.active') }}</th>
            <th>{{ t('admin.lastLogin') }}</th>
            <th>{{ t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6">…</td>
          </tr>
          <tr v-for="row in userList" v-else :key="row.id">
            <td>{{ row.email }}</td>
            <td>{{ row.firstName }} {{ row.lastName }}</td>
            <td>{{ row.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser') }}</td>
            <td>
              <span class="badge" :class="row.active ? 'badge-success' : 'badge-danger'">
                {{ row.active ? t('admin.activeYes') : t('admin.activeNo') }}
              </span>
            </td>
            <td>{{ formatDate(row.lastLoginAt) }}</td>
            <td>
              <div class="row-actions">
                <button class="btn btn-ghost" type="button" :title="t('admin.editUser')" @click="openEdit(row)">
                  <EditUser />
                </button>
                <button
                  class="btn btn-ghost"
                  type="button"
                  :disabled="row.id === currentUser?.id"
                  :title="row.active ? t('admin.activeNo') : t('admin.activeYes')"
                  @click="toggleActive(row)"
                >
                  <Ban v-if="row.active" />
                  <Check v-else />
                </button>
                <button class="btn btn-ghost" type="button" :title="t('admin.setPassword')" @click="openPassword(row)">
                  <Key />
                </button>
                <button
                  class="btn btn-ghost"
                  type="button"
                  :disabled="row.id === currentUser?.id || !row.active"
                  :title="t('admin.impersonate')"
                  @click="impersonate(row)"
                >
                  <User />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UiModal :open="editDialogVisible" @close="editDialogVisible = false">
      <template #header>{{ editingId ? t('admin.editUser') : t('admin.newUser') }}</template>
      <div class="form-field">
        <label for="f-email">{{ t('admin.email') }}</label>
        <input id="f-email" v-model="form.email" type="email" />
      </div>
      <div class="form-field">
        <label for="f-first">{{ t('admin.firstName') }}</label>
        <input id="f-first" v-model="form.firstName" type="text" />
      </div>
      <div class="form-field">
        <label for="f-last">{{ t('admin.lastName') }}</label>
        <input id="f-last" v-model="form.lastName" type="text" />
      </div>
      <div v-if="!editingId" class="form-field">
        <label for="f-pw">{{ t('admin.password') }}</label>
        <input id="f-pw" v-model="form.password" type="password" />
      </div>
      <div v-if="editingId" class="form-field">
        <label for="f-role">{{ t('admin.role') }}</label>
        <select id="f-role" v-model="form.role">
          <option value="user">{{ t('admin.roleUser') }}</option>
          <option value="admin">{{ t('admin.roleAdmin') }}</option>
        </select>
      </div>
      <template #footer>
        <button class="btn" type="button" @click="editDialogVisible = false">{{ t('admin.cancel') }}</button>
        <button class="btn btn-primary" type="button" :disabled="saving" @click="saveUser">{{ t('admin.save') }}</button>
      </template>
    </UiModal>

    <UiModal :open="passwordDialogVisible" @close="passwordDialogVisible = false">
      <template #header>{{ t('admin.setPassword') }}</template>
      <div class="form-field">
        <label for="f-newpw">{{ t('admin.newPassword') }}</label>
        <input id="f-newpw" v-model="newPassword" type="password" />
      </div>
      <template #footer>
        <button class="btn" type="button" @click="passwordDialogVisible = false">{{ t('admin.cancel') }}</button>
        <button class="btn btn-primary" type="button" :disabled="saving" @click="savePassword">{{ t('admin.save') }}</button>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import Ban from '~/assets/icons/Ban.vue'
import Check from '~/assets/icons/Check.vue'
import EditUser from '~/assets/icons/EditUser.vue'
import Key from '~/assets/icons/Key.vue'
import Plus from '~/assets/icons/Plus.vue'
import User from '~/assets/icons/User.vue'

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
    const result = await call(() =>
      $fetch(`/api/admin/users/${editingId.value}`, {
        method: 'PATCH',
        body: { email: form.email, firstName: form.firstName, lastName: form.lastName, role: form.role }
      })
    )
    if (result) {
      toast.add({ severity: 'success', summary: t('admin.userUpdated') })
      editDialogVisible.value = false
      await loadUsers()
    }
  } else {
    const result = await call(() =>
      $fetch('/api/admin/users', {
        method: 'POST',
        body: { email: form.email, firstName: form.firstName, lastName: form.lastName, password: form.password }
      })
    )
    if (result) {
      toast.add({ severity: 'success', summary: t('admin.userCreated') })
      editDialogVisible.value = false
      await loadUsers()
    }
  }
  saving.value = false
}

async function toggleActive(data: AdminUser) {
  const result = await call(() =>
    $fetch(`/api/admin/users/${data.id}`, {
      method: 'PATCH',
      body: { active: !data.active }
    })
  )
  if (result) {
    toast.add({ severity: 'success', summary: t('admin.userUpdated') })
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
  const result = await call(() =>
    $fetch(`/api/admin/users/${passwordTargetId.value}`, {
      method: 'PATCH',
      body: { password: newPassword.value }
    })
  )
  if (result) {
    toast.add({ severity: 'success', summary: t('admin.passwordSet') })
    passwordDialogVisible.value = false
  }
  saving.value = false
}

async function impersonate(data: AdminUser) {
  const result = await call(() =>
    $fetch('/api/admin/impersonate', {
      method: 'POST',
      body: { userId: data.id }
    })
  )
  if (result) {
    await refreshSession()
    await navigateTo('/')
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.page-header {
  justify-content: space-between;
  margin-bottom: 1rem;
}
.table-card {
  padding: 0;
  overflow-x: auto;
}
.table-card table {
  min-width: 640px;
}
.row-actions {
  display: flex;
  gap: 0.25rem;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}
.badge-success {
  background: var(--color-success);
}
.badge-danger {
  background: var(--color-danger);
}
</style>
