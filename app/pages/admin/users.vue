<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold">{{ t('nav.admin') }}</h1>
      <Button @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        {{ t('admin.newUser') }}
      </Button>
    </div>

    <Card class="overflow-x-auto p-0">
      <Table class="min-w-160">
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('admin.email') }}</TableHead>
            <TableHead>{{ t('admin.firstName') }} / {{ t('admin.lastName') }}</TableHead>
            <TableHead>{{ t('admin.role') }}</TableHead>
            <TableHead>{{ t('admin.active') }}</TableHead>
            <TableHead>{{ t('admin.lastLogin') }}</TableHead>
            <TableHead>{{ t('admin.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="6">…</TableCell>
          </TableRow>
          <TableRow v-for="row in userList" v-else :key="row.id">
            <TableCell>{{ row.email }}</TableCell>
            <TableCell>{{ row.firstName }} {{ row.lastName }}</TableCell>
            <TableCell>{{ row.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser') }}</TableCell>
            <TableCell>
              <Badge :variant="row.active ? 'default' : 'destructive'">
                {{ row.active ? t('admin.activeYes') : t('admin.activeNo') }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(row.lastLoginAt) }}</TableCell>
            <TableCell>
              <div class="flex gap-1">
                <Button variant="ghost" size="icon-sm" :title="t('admin.editUser')" @click="openEdit(row)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path
                      d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :disabled="row.id === currentUser?.id"
                  :title="row.active ? t('admin.activeNo') : t('admin.activeYes')"
                  @click="toggleActive(row)"
                >
                  <svg
                    v-if="row.active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M4.9 4.9l14.2 14.2" stroke-linecap="round" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </Button>
                <Button variant="ghost" size="icon-sm" :title="t('admin.setPassword')" @click="openPassword(row)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="8" cy="15" r="4" />
                    <path d="M10.5 12.5 20 3M17 6l2 2M14 9l2 2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  :disabled="row.id === currentUser?.id || !row.active"
                  :title="t('admin.impersonate')"
                  @click="impersonate(row)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke-linecap="round" />
                  </svg>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <Dialog v-model:open="editDialogVisible">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingId ? t('admin.editUser') : t('admin.newUser') }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="f-email">{{ t('admin.email') }}</Label>
            <Input id="f-email" v-model="form.email" type="email" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="f-first">{{ t('admin.firstName') }}</Label>
            <Input id="f-first" v-model="form.firstName" type="text" />
          </div>
          <div class="flex flex-col gap-2">
            <Label for="f-last">{{ t('admin.lastName') }}</Label>
            <Input id="f-last" v-model="form.lastName" type="text" />
          </div>
          <div v-if="!editingId" class="flex flex-col gap-2">
            <Label for="f-pw">{{ t('admin.password') }}</Label>
            <Input id="f-pw" v-model="form.password" type="password" />
          </div>
          <div v-if="editingId" class="flex flex-col gap-2">
            <Label for="f-role">{{ t('admin.role') }}</Label>
            <NativeSelect id="f-role" v-model="form.role" class="w-full">
              <option value="user">{{ t('admin.roleUser') }}</option>
              <option value="admin">{{ t('admin.roleAdmin') }}</option>
            </NativeSelect>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editDialogVisible = false">{{ t('admin.cancel') }}</Button>
          <Button :disabled="saving" @click="saveUser">{{ t('admin.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="passwordDialogVisible">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('admin.setPassword') }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-2">
          <Label for="f-newpw">{{ t('admin.newPassword') }}</Label>
          <Input id="f-newpw" v-model="newPassword" type="password" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="passwordDialogVisible = false">{{ t('admin.cancel') }}</Button>
          <Button :disabled="saving" @click="savePassword">{{ t('admin.save') }}</Button>
        </DialogFooter>
      </DialogContent>
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
