<template>
  <div v-if="list">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1
        v-if="list.isOwner"
        class="rounded-md px-1.5 py-0.5 text-xl font-bold focus:ring-3 focus:ring-ring/50 focus:outline-none"
        contenteditable="true"
        spellcheck="false"
        @blur="onRenameList($event)"
        @keydown.enter.prevent="blurTarget($event)"
      >{{ list.name }}</h1>
      <h1 v-else class="px-1.5 py-0.5 text-xl font-bold">{{ list.name }}</h1>

      <div class="flex flex-wrap items-center gap-2">
        <Button @click="openGroupDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          {{ t('listDetail.newGroup') }}
        </Button>
        <Button variant="outline" :title="t('listDetail.reset')" @click="resetDialogOpen = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ t('listDetail.reset') }}
        </Button>
        <Button variant="outline" :title="t('listDetail.duplicate')" @click="duplicateList">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round" />
          </svg>
          {{ t('listDetail.duplicate') }}
        </Button>
        <Button variant="outline" :title="t('listDetail.export')" @click="openExportDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ t('listDetail.export') }}
        </Button>
        <Button v-if="list.isOwner" variant="outline" :title="t('listDetail.share')" @click="openShareDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2" />
          </svg>
          {{ t('listDetail.share') }}
        </Button>
      </div>
    </div>

    <p v-if="list.groups.length === 0" class="py-6 text-muted-foreground">{{ t('listDetail.empty') }}</p>

    <VueDraggable
      v-else
      v-model="list.groups"
      class="grid grid-cols-1 gap-4 md:grid-cols-2"
      :animation="150"
      handle=".group-drag-handle"
      @end="onGroupDragEnd"
    >
      <Card v-for="group in list.groups" :key="group.id" class="gap-2 p-4">
        <div class="flex items-center gap-2">
          <span
            class="group-drag-handle inline-flex shrink-0 cursor-grab text-muted-foreground"
            :title="t('listDetail.dragGroup')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
            </svg>
          </span>
          <h3
            class="-mx-1.5 -my-0.5 flex-1 rounded-md px-1.5 py-0.5 text-base font-semibold focus:ring-3 focus:ring-ring/50 focus:outline-none"
            contenteditable="true"
            spellcheck="false"
            @blur="onRenameGroup(group, $event)"
            @keydown.enter.prevent="blurTarget($event)"
          >{{ group.name }}</h3>
          <span class="text-sm text-muted-foreground tabular-nums">
            {{ doneCount(group) }}/{{ group.entries.length }}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            :title="t('listDetail.saveAsTemplate')"
            @click="saveAsTemplate(group)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" stroke-linejoin="round" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            :title="t('listDetail.deleteGroup')"
            @click="askDeleteGroup(group)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </Button>
        </div>

        <VueDraggable
          v-model="group.entries"
          class="flex min-h-2 flex-col gap-1"
          group="entries"
          :animation="150"
          handle=".entry-drag-handle"
          @update="onEntryReorder(group)"
          @add="onEntryMovedIn(group)"
        >
          <div v-for="entry in group.entries" :key="entry.id" class="flex items-center gap-2">
            <span
              class="entry-drag-handle inline-flex shrink-0 cursor-grab text-muted-foreground"
              :title="t('listDetail.dragEntry')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
            </span>
            <Checkbox
              :model-value="entry.done"
              :aria-label="entry.name"
              @update:model-value="(value) => onToggleDone(group, entry, value === true)"
            />
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                class="-mx-1.5 rounded-md px-1.5 py-0.5 text-sm focus:ring-3 focus:ring-ring/50 focus:outline-none"
                :class="entry.done ? 'text-muted-foreground line-through' : ''"
                contenteditable="true"
                spellcheck="false"
                @blur="onEntryNameBlur(group, entry, $event)"
                @keydown.enter.prevent="blurTarget($event)"
              >{{ entry.name }}</span>
              <Input
                class="h-8 text-muted-foreground italic"
                type="text"
                :value="entry.comment ?? ''"
                :placeholder="t('listDetail.commentPlaceholder')"
                @blur="onEntryCommentBlur(group, entry, $event)"
                @keydown.enter.prevent="blurTarget($event)"
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              :title="t('listDetail.deleteEntry')"
              @click="deleteEntry(group, entry)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </Button>
          </div>
        </VueDraggable>

        <Input
          v-model="newEntryDrafts[group.id]"
          type="text"
          class="border-dashed"
          :placeholder="t('listDetail.addEntryPlaceholder')"
          @keydown.enter.prevent="addEntry(group)"
        />
      </Card>
    </VueDraggable>

    <Dialog v-model:open="groupDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('listDetail.newGroupTitle') }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="d-groupname">{{ t('listDetail.groupNameLabel') }}</Label>
            <div class="flex items-center gap-2">
              <Input id="d-groupname" v-model="newGroupName" type="text" @keydown.enter.prevent="createGroup" />
              <Button :disabled="!newGroupName.trim()" @click="createGroup">
                {{ t('listDetail.create') }}
              </Button>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="d-template">{{ t('listDetail.orFromTemplate') }}</Label>
            <p v-if="templates.length === 0" class="text-muted-foreground">
              {{ t('listDetail.noTemplates') }}
            </p>
            <div v-else class="flex items-center gap-2">
              <NativeSelect id="d-template" v-model="selectedTemplateId" class="w-full">
                <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
              </NativeSelect>
              <Button :disabled="!selectedTemplateId" @click="insertTemplate">
                {{ t('listDetail.insert') }}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-if="list.isOwner" v-model:open="shareDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('listDetail.shareTitle') }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="d-shareemail">{{ t('listDetail.shareEmailLabel') }}</Label>
            <div class="flex items-center gap-2">
              <Input id="d-shareemail" v-model="newShareEmail" type="email" @keydown.enter.prevent="addShare" />
              <Button :disabled="!newShareEmail.trim()" @click="addShare">
                {{ t('listDetail.shareAdd') }}
              </Button>
            </div>
          </div>
          <p v-if="!list.shares || list.shares.length === 0" class="text-muted-foreground">
            {{ t('listDetail.noShares') }}
          </p>
          <ul v-else class="flex flex-col divide-y">
            <li v-for="share in list.shares" :key="share.id" class="flex items-center justify-between gap-2 py-1">
              <span class="text-sm">{{ share.email }}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                :title="t('listDetail.removeShare')"
                @click="removeShare(share)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </Button>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="exportDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('listDetail.exportTitle') }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label>{{ t('listDetail.formatLabel') }}</Label>
            <div class="flex flex-wrap gap-4">
              <Label class="font-normal">
                <input v-model="exportFormat" type="radio" value="pdf" class="accent-primary" />
                {{ t('listDetail.formatPdf') }}
              </Label>
              <Label class="font-normal">
                <input v-model="exportFormat" type="radio" value="xlsx" class="accent-primary" />
                {{ t('listDetail.formatExcel') }}
              </Label>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <Label>{{ t('listDetail.statusLabel') }}</Label>
            <div class="flex flex-wrap gap-4">
              <Label class="font-normal">
                <input v-model="exportStatus" type="radio" value="current" class="accent-primary" />
                {{ t('listDetail.statusCurrent') }}
              </Label>
              <Label class="font-normal">
                <input v-model="exportStatus" type="radio" value="empty" class="accent-primary" />
                {{ t('listDetail.statusEmpty') }}
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="runExport">{{ t('listDetail.exportAction') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="deleteGroupDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('confirm.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ groupToDelete ? t('listDetail.deleteGroupConfirm', { name: groupToDelete.name }) : '' }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('confirm.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="deleteGroup">{{ t('confirm.ok') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="resetDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('confirm.title') }}</AlertDialogTitle>
          <AlertDialogDescription>{{ t('listDetail.resetConfirm') }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('confirm.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="resetList">{{ t('confirm.ok') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

interface ListEntry {
  id: string
  name: string
  comment: string | null
  groupId: string
  creatorId: string
  sortOrder: number
  done: boolean
  createdAt: string
  updatedAt: string
}

interface ListGroup {
  id: string
  name: string
  ownerId: string
  listId: string | null
  origGroupId: string | null
  sortOrder: number
  entries: ListEntry[]
}

interface ListShare {
  id: string
  email: string
}

interface ListDetail {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
  groups: ListGroup[]
  isOwner: boolean
  shares?: ListShare[]
}

const { t } = useI18n()
const { call } = useApi()
const route = useRoute()
const router = useRouter()

const listId = route.params.id as string
const list = ref<ListDetail | null>(null)
const newEntryDrafts = reactive<Record<string, string>>({})

const groupDialogOpen = ref(false)
const newGroupName = ref('')
const templates = ref<{ id: string; name: string }[]>([])
const selectedTemplateId = ref('')

const shareDialogOpen = ref(false)
const newShareEmail = ref('')

const exportDialogOpen = ref(false)
const exportFormat = ref<'pdf' | 'xlsx'>('pdf')
const exportStatus = ref<'current' | 'empty'>('current')

const deleteGroupDialogOpen = ref(false)
const groupToDelete = ref<ListGroup | null>(null)
const resetDialogOpen = ref(false)

function blurTarget(event: Event) {
  ;(event.target as HTMLElement).blur()
}

function doneCount(group: ListGroup) {
  return group.entries.filter((e) => e.done).length
}

async function loadList() {
  const result = await call(() => $fetch<ListDetail>(`/api/lists/${listId}`))
  if (result) {
    list.value = result
  } else {
    router.replace('/')
  }
}

async function onRenameList(event: FocusEvent) {
  if (!list.value) return
  const el = event.target as HTMLElement
  const value = el.innerText.trim()
  if (!value) {
    el.innerText = list.value.name
    return
  }
  if (value === list.value.name) return
  const result = await call(() =>
    $fetch<{ name: string }>(`/api/lists/${listId}`, { method: 'PATCH', body: { name: value } })
  )
  if (result) {
    list.value.name = result.name
  } else {
    el.innerText = list.value.name
  }
}

// --- Gruppen ---

async function openGroupDialog() {
  newGroupName.value = ''
  selectedTemplateId.value = ''
  const result = await call(() => $fetch<{ id: string; name: string }[]>('/api/templates'))
  if (result) {
    templates.value = result.map((g) => ({ id: g.id, name: g.name }))
  }
  groupDialogOpen.value = true
}

async function createGroup() {
  const name = newGroupName.value.trim()
  if (!name || !list.value) return
  const result = await call(() =>
    $fetch<ListGroup>(`/api/lists/${listId}/groups`, { method: 'POST', body: { name } })
  )
  if (result) {
    result.entries = result.entries ?? []
    list.value.groups.push(result)
    groupDialogOpen.value = false
  }
}

async function insertTemplate() {
  if (!selectedTemplateId.value || !list.value) return
  const result = await call(() =>
    $fetch<ListGroup>(`/api/lists/${listId}/groups/from-template`, {
      method: 'POST',
      body: { templateId: selectedTemplateId.value }
    })
  )
  if (result) {
    list.value.groups.push(result)
    groupDialogOpen.value = false
  }
}

async function onRenameGroup(group: ListGroup, event: FocusEvent) {
  const el = event.target as HTMLElement
  const value = el.innerText.trim()
  if (!value) {
    el.innerText = group.name
    return
  }
  if (value === group.name) return
  const result = await call(() =>
    $fetch<ListGroup>(`/api/lists/${listId}/groups/${group.id}`, { method: 'PATCH', body: { name: value } })
  )
  if (result) {
    group.name = result.name
  } else {
    el.innerText = group.name
  }
}

function askDeleteGroup(group: ListGroup) {
  groupToDelete.value = group
  deleteGroupDialogOpen.value = true
}

async function deleteGroup() {
  const group = groupToDelete.value
  if (!group || !list.value) return
  const result = await call(() => $fetch(`/api/lists/${listId}/groups/${group.id}`, { method: 'DELETE' }))
  if (result) {
    list.value.groups = list.value.groups.filter((g) => g.id !== group.id)
    delete newEntryDrafts[group.id]
  }
  groupToDelete.value = null
}

async function saveAsTemplate(group: ListGroup) {
  const toast = useToast()
  const result = await call(() =>
    $fetch(`/api/lists/${listId}/groups/${group.id}/save-as-template`, { method: 'POST' })
  )
  if (result) {
    toast.add({ severity: 'success', summary: t('listDetail.savedAsTemplate'), life: 5000 })
  }
}

async function onGroupDragEnd() {
  if (!list.value) return
  const ids = list.value.groups.map((g) => g.id)
  const result = await call(() => $fetch(`/api/lists/${listId}/groups/order`, { method: 'PUT', body: { ids } }))
  if (!result) loadList()
}

// --- Einträge ---

async function addEntry(group: ListGroup) {
  const draft = (newEntryDrafts[group.id] || '').trim()
  if (!draft) return
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries`, { method: 'POST', body: { name: draft } })
  )
  if (result) {
    group.entries.push(result)
    newEntryDrafts[group.id] = ''
  }
}

async function onToggleDone(group: ListGroup, entry: ListEntry, done: boolean) {
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries/${entry.id}`, {
      method: 'PATCH',
      body: { done }
    })
  )
  // Bei Fehler bleibt entry.done unverändert; die Checkbox rendert wieder aus dem Prop.
  if (result) entry.done = result.done
}

async function onEntryNameBlur(group: ListGroup, entry: ListEntry, event: FocusEvent) {
  const el = event.target as HTMLElement
  const value = el.innerText.trim()
  if (!value) {
    el.innerText = entry.name
    return
  }
  if (value === entry.name) return
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries/${entry.id}`, {
      method: 'PATCH',
      body: { name: value }
    })
  )
  if (result) {
    entry.name = result.name
  } else {
    el.innerText = entry.name
  }
}

async function onEntryCommentBlur(group: ListGroup, entry: ListEntry, event: FocusEvent) {
  const el = event.target as HTMLInputElement
  const value = el.value.trim() || null
  if (value === entry.comment) return
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries/${entry.id}`, {
      method: 'PATCH',
      body: { comment: value }
    })
  )
  if (result) {
    entry.comment = result.comment
  } else {
    el.value = entry.comment ?? ''
  }
}

async function deleteEntry(group: ListGroup, entry: ListEntry) {
  const result = await call(() =>
    $fetch(`/api/lists/${listId}/groups/${group.id}/entries/${entry.id}`, { method: 'DELETE' })
  )
  if (result) {
    group.entries = group.entries.filter((e) => e.id !== entry.id)
  }
}

async function onEntryReorder(group: ListGroup) {
  const ids = group.entries.map((e) => e.id)
  const result = await call(() =>
    $fetch(`/api/lists/${listId}/groups/${group.id}/entries/order`, { method: 'PUT', body: { ids } })
  )
  if (!result) loadList()
}

async function onEntryMovedIn(group: ListGroup) {
  // Nach Cross-Gruppen-Drag: der Eintrag mit fremder groupId ist der verschobene.
  const moved = group.entries.find((e) => e.groupId !== group.id)
  if (!moved) return
  const ids = group.entries.map((e) => e.id)
  const result = await call(() =>
    $fetch(`/api/lists/${listId}/groups/${group.id}/entries/order`, {
      method: 'PUT',
      body: { ids, movedEntryId: moved.id }
    })
  )
  if (result) {
    moved.groupId = group.id
  } else {
    loadList()
  }
}

// --- Toolbar ---

async function resetList() {
  if (!list.value) return
  const result = await call(() => $fetch(`/api/lists/${listId}/reset`, { method: 'POST' }))
  if (result) {
    for (const group of list.value.groups) {
      for (const entry of group.entries) entry.done = false
    }
  }
}

async function duplicateList() {
  if (!list.value) return
  const result = await call(() =>
    $fetch<{ id: string }>(`/api/lists/${listId}/duplicate`, {
      method: 'POST',
      body: { name: `${list.value.name} ${t('lists.copySuffix')}` }
    })
  )
  if (result) {
    // Zur Kopie navigieren (Entscheid E7)
    await navigateTo(`/lists/${result.id}`)
  }
}

// --- Freigaben ---

function openShareDialog() {
  newShareEmail.value = ''
  shareDialogOpen.value = true
}

async function addShare() {
  const email = newShareEmail.value.trim()
  if (!email || !list.value) return
  const result = await call(() =>
    $fetch<ListShare>(`/api/lists/${listId}/shares`, { method: 'POST', body: { email } })
  )
  if (result) {
    if (!list.value.shares) list.value.shares = []
    list.value.shares.push(result)
    newShareEmail.value = ''
  }
}

async function removeShare(share: ListShare) {
  if (!list.value?.shares) return
  const result = await call(() => $fetch(`/api/lists/${listId}/shares/${share.id}`, { method: 'DELETE' }))
  if (result) {
    list.value.shares = list.value.shares.filter((s) => s.id !== share.id)
  }
}

// --- Export ---

function openExportDialog() {
  exportDialogOpen.value = true
}

function runExport() {
  const url = `/api/lists/${listId}/export/${exportFormat.value}?status=${exportStatus.value}`
  const link = document.createElement('a')
  link.href = url
  link.click()
  exportDialogOpen.value = false
}

onMounted(loadList)
</script>

