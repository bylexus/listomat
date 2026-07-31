<template>
  <div v-if="list">
    <div class="page-header toolbar">
      <h1
        v-if="list.isOwner"
        :ref="(el) => setTitleRef(el)"
        class="list-title"
        contenteditable="true"
        spellcheck="false"
        @blur="onRenameList($event)"
        @keydown.enter.prevent="blurTarget($event)"
      >{{ list.name }}</h1>
      <h1 v-else class="list-title">{{ list.name }}</h1>

      <div class="toolbar">
        <button class="btn btn-primary" type="button" @click="openGroupDialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          {{ t('listDetail.newGroup') }}
        </button>
        <button class="btn" type="button" :title="t('listDetail.reset')" @click="confirmReset">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ t('listDetail.reset') }}
        </button>
        <button class="btn" type="button" :title="t('listDetail.duplicate')" @click="duplicateList">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round" />
          </svg>
          {{ t('listDetail.duplicate') }}
        </button>
        <button class="btn" type="button" :title="t('listDetail.export')" @click="openExportDialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ t('listDetail.export') }}
        </button>
        <button v-if="list.isOwner" class="btn" type="button" :title="t('listDetail.share')" @click="openShareDialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2" />
          </svg>
          {{ t('listDetail.share') }}
        </button>
      </div>
    </div>

    <UiProgress v-if="totalEntries > 0" class="list-progress" :done="totalDone" :total="totalEntries" />

    <p v-if="list.groups.length === 0" class="empty-state">{{ t('listDetail.empty') }}</p>

    <VueDraggable
      v-else
      v-model="list.groups"
      class="groups-grid"
      :animation="150"
      handle=".group-drag-handle"
      @end="onGroupDragEnd"
    >
      <div v-for="group in list.groups" :key="group.id" class="card group-card">
        <div class="group-card-header">
          <span class="drag-handle group-drag-handle" :title="t('listDetail.dragGroup')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
            </svg>
          </span>
          <h3
            class="group-name"
            contenteditable="true"
            spellcheck="false"
            @blur="onRenameGroup(group, $event)"
            @keydown.enter.prevent="blurTarget($event)"
          >{{ group.name }}</h3>
          <span class="group-progress">{{ doneCount(group) }}/{{ group.entries.length }}</span>
          <button
            class="btn btn-ghost"
            type="button"
            :title="t('listDetail.saveAsTemplate')"
            @click="openSaveTemplateDialog(group)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="btn btn-ghost" type="button" :title="t('listDetail.deleteGroup')" @click="confirmDeleteGroup(group)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <VueDraggable
          v-model="group.entries"
          class="entry-list"
          group="entries"
          :animation="150"
          handle=".entry-drag-handle"
          @update="onEntryReorder(group)"
          @add="onEntryMovedIn(group)"
        >
          <div v-for="entry in group.entries" :key="entry.id" class="entry-row">
            <span class="drag-handle entry-drag-handle" :title="t('listDetail.dragEntry')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
            </span>
            <input
              type="checkbox"
              class="entry-done"
              :checked="entry.done"
              @change="onToggleDone(group, entry, $event)"
            />
            <div class="entry-texts">
              <div class="entry-main">
                <span
                  class="entry-name"
                  :class="{ done: entry.done }"
                  contenteditable="true"
                  spellcheck="false"
                  @blur="onEntryNameBlur(group, entry, $event)"
                  @keydown.enter.prevent="blurTarget($event)"
                >{{ entry.name }}</span>
                <input
                  class="entry-quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  :title="t('listDetail.quantityLabel')"
                  :value="entry.quantity ?? ''"
                  @blur="onEntryQuantityBlur(group, entry, $event)"
                  @keydown.enter.prevent="blurTarget($event)"
                />
              </div>
              <input
                class="entry-comment"
                type="text"
                :value="entry.comment ?? ''"
                :placeholder="t('listDetail.commentPlaceholder')"
                @blur="onEntryCommentBlur(group, entry, $event)"
                @keydown.enter.prevent="blurTarget($event)"
              />
            </div>
            <button class="btn btn-ghost entry-delete" type="button" :title="t('listDetail.deleteEntry')" @click="deleteEntry(group, entry)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </VueDraggable>

        <div class="entry-add-row">
          <input
            v-model="newEntryDrafts[group.id].name"
            type="text"
            class="entry-add-input"
            :placeholder="t('listDetail.addEntryPlaceholder')"
            @keydown.enter.prevent="addEntry(group)"
          />
          <input
            v-model="newEntryDrafts[group.id].quantity"
            type="number"
            min="0"
            class="entry-add-quantity"
            placeholder="0"
            :title="t('listDetail.quantityLabel')"
            @keydown.enter.prevent="addEntry(group)"
            @blur="addEntry(group)"
          />
        </div>
      </div>
    </VueDraggable>

    <UiModal :open="groupDialogOpen" @close="groupDialogOpen = false">
      <template #header>{{ t('listDetail.newGroupTitle') }}</template>
      <div class="form-field">
        <label>{{ t('listDetail.groupNameLabel') }}</label>
        <div class="dialog-row">
          <input v-model="newGroupName" type="text" @keydown.enter.prevent="createGroup" />
          <button class="btn btn-primary" type="button" :disabled="!newGroupName.trim()" @click="createGroup">
            {{ t('listDetail.create') }}
          </button>
        </div>
      </div>
      <div class="form-field">
        <label>{{ t('listDetail.orFromTemplate') }}</label>
        <p v-if="templates.length === 0" class="empty-state">{{ t('listDetail.noTemplates') }}</p>
        <div v-else class="dialog-row">
          <select v-model="selectedTemplateId">
            <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
          </select>
          <button class="btn btn-primary" type="button" :disabled="!selectedTemplateId" @click="insertTemplate">
            {{ t('listDetail.insert') }}
          </button>
        </div>
      </div>
    </UiModal>

    <UiModal v-if="list.isOwner" :open="shareDialogOpen" @close="shareDialogOpen = false">
      <template #header>{{ t('listDetail.shareTitle') }}</template>
      <div class="form-field">
        <label>{{ t('listDetail.shareEmailLabel') }}</label>
        <div class="dialog-row">
          <input v-model="newShareEmail" type="email" @keydown.enter.prevent="addShare" />
          <button class="btn btn-primary" type="button" :disabled="!newShareEmail.trim()" @click="addShare">
            {{ t('listDetail.shareAdd') }}
          </button>
        </div>
      </div>
      <div class="form-field">
        <p v-if="!list.shares || list.shares.length === 0" class="empty-state">{{ t('listDetail.noShares') }}</p>
        <ul v-else class="share-list">
          <li v-for="share in list.shares" :key="share.id" class="share-row">
            <span>{{ share.email }}</span>
            <button class="btn btn-ghost" type="button" :title="t('listDetail.removeShare')" @click="removeShare(share)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </UiModal>

    <UiModal :open="saveTemplateDialogOpen" @close="saveTemplateDialogOpen = false">
      <template #header>{{ t('listDetail.saveAsTemplate') }}</template>
      <div class="form-field">
        <label>{{ t('listDetail.templateNameLabel') }}</label>
        <div class="dialog-row">
          <input v-model="saveTemplateName" type="text" @keydown.enter.prevent="saveAsTemplate" />
          <button class="btn btn-primary" type="button" :disabled="!saveTemplateName.trim()" @click="saveAsTemplate">
            {{ t('listDetail.saveTemplateAction') }}
          </button>
        </div>
      </div>
    </UiModal>

    <UiModal :open="exportDialogOpen" @close="exportDialogOpen = false">
      <template #header>{{ t('listDetail.exportTitle') }}</template>
      <div class="form-field">
        <label>{{ t('listDetail.formatLabel') }}</label>
        <div class="radio-row">
          <label class="radio-option"><input v-model="exportFormat" type="radio" value="pdf" /> {{ t('listDetail.formatPdf') }}</label>
          <label class="radio-option"><input v-model="exportFormat" type="radio" value="xlsx" /> {{ t('listDetail.formatExcel') }}</label>
        </div>
      </div>
      <div class="form-field">
        <label>{{ t('listDetail.statusLabel') }}</label>
        <div class="radio-row">
          <label class="radio-option"><input v-model="exportStatus" type="radio" value="current" /> {{ t('listDetail.statusCurrent') }}</label>
          <label class="radio-option"><input v-model="exportStatus" type="radio" value="empty" /> {{ t('listDetail.statusEmpty') }}</label>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-primary" type="button" @click="runExport">{{ t('listDetail.exportAction') }}</button>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

interface ListEntry {
  id: string
  name: string
  comment: string | null
  quantity: number | null
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
const { confirm } = useConfirm()
const route = useRoute()
const router = useRouter()

const listId = route.params.id as string
const list = ref<ListDetail | null>(null)
const newEntryDrafts = reactive<Record<string, { name: string; quantity: string }>>({})
const titleEl = ref<HTMLElement | null>(null)

function setTitleRef(el: any) {
  titleEl.value = (el as HTMLElement) ?? null
}

function ensureDraft(groupId: string) {
  if (!newEntryDrafts[groupId]) {
    newEntryDrafts[groupId] = { name: '', quantity: '' }
  }
}

const groupDialogOpen = ref(false)
const newGroupName = ref('')
const templates = ref<{ id: string; name: string }[]>([])
const selectedTemplateId = ref('')

const shareDialogOpen = ref(false)
const newShareEmail = ref('')

const saveTemplateDialogOpen = ref(false)
const saveTemplateName = ref('')
const saveTemplateGroup = ref<ListGroup | null>(null)

const exportDialogOpen = ref(false)
const exportFormat = ref<'pdf' | 'xlsx'>('pdf')
const exportStatus = ref<'current' | 'empty'>('current')

function blurTarget(event: Event) {
  ;(event.target as HTMLElement).blur()
}

function doneCount(group: ListGroup) {
  return group.entries.filter((e) => e.done).length
}

const totalDone = computed(() => list.value?.groups.reduce((sum, g) => sum + doneCount(g), 0) ?? 0)
const totalEntries = computed(() => list.value?.groups.reduce((sum, g) => sum + g.entries.length, 0) ?? 0)

async function loadList() {
  const { consume, focusAndSelect } = useFocusNewItem()
  const result = await call(() => $fetch<ListDetail>(`/api/lists/${listId}`))
  if (result) {
    list.value = result
    for (const group of result.groups) ensureDraft(group.id)
    if (consume('list', listId)) {
      await nextTick()
      focusAndSelect(titleEl.value)
    }
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
    ensureDraft(result.id)
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
    ensureDraft(result.id)
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

async function confirmDeleteGroup(group: ListGroup) {
  const ok = await confirm(t('listDetail.deleteGroupConfirm', { name: group.name }))
  if (!ok || !list.value) return
  const result = await call(() => $fetch(`/api/lists/${listId}/groups/${group.id}`, { method: 'DELETE' }))
  if (result) {
    list.value.groups = list.value.groups.filter((g) => g.id !== group.id)
    delete newEntryDrafts[group.id]
  }
}

function openSaveTemplateDialog(group: ListGroup) {
  saveTemplateGroup.value = group
  saveTemplateName.value = group.name
  saveTemplateDialogOpen.value = true
}

async function saveAsTemplate() {
  const group = saveTemplateGroup.value
  const name = saveTemplateName.value.trim()
  if (!group || !name) return
  const toast = useToast()
  const result = await call(() =>
    $fetch(`/api/lists/${listId}/groups/${group.id}/save-as-template`, { method: 'POST', body: { name } })
  )
  if (result) {
    saveTemplateDialogOpen.value = false
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
  const draft = newEntryDrafts[group.id]
  const name = String(draft?.name ?? '').trim()
  if (!name) return
  const quantityRaw = draft?.quantity
  const quantity =
    quantityRaw === '' || quantityRaw === null || quantityRaw === undefined
      ? null
      : Number(quantityRaw)
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries`, {
      method: 'POST',
      body: { name, quantity }
    })
  )
  if (result) {
    group.entries.push(result)
    newEntryDrafts[group.id] = { name: '', quantity: '' }
  }
}

async function onToggleDone(group: ListGroup, entry: ListEntry, event: Event) {
  const el = event.target as HTMLInputElement
  const done = el.checked
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries/${entry.id}`, {
      method: 'PATCH',
      body: { done }
    })
  )
  if (result) {
    entry.done = result.done
  } else {
    el.checked = entry.done
  }
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

async function onEntryQuantityBlur(group: ListGroup, entry: ListEntry, event: FocusEvent) {
  const el = event.target as HTMLInputElement
  const value = el.value === '' ? null : Number(el.value)
  if (value === entry.quantity) return
  const result = await call(() =>
    $fetch<ListEntry>(`/api/lists/${listId}/groups/${group.id}/entries/${entry.id}`, {
      method: 'PATCH',
      body: { quantity: value }
    })
  )
  if (result) {
    entry.quantity = result.quantity
  } else {
    el.value = entry.quantity === null ? '' : String(entry.quantity)
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

async function confirmReset() {
  const ok = await confirm(t('listDetail.resetConfirm'))
  if (!ok || !list.value) return
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

<style scoped>
.page-header {
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: var(--space-3);
}
.list-title {
  margin: 0;
  padding: 2px 6px;
  border-radius: var(--radius);
}
.list-title[contenteditable]:focus {
  outline: 2px solid var(--color-primary);
}
.empty-state {
  color: var(--color-text-muted);
}
.list-progress {
  margin-bottom: var(--space-3);
}
.groups-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  align-items: start;
}
@media (min-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.group-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.group-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.drag-handle {
  cursor: grab;
  color: var(--color-text-muted);
  display: inline-flex;
  touch-action: none;
}
.group-name {
  flex: 1;
  margin: 0;
  font-size: 1.05rem;
  padding: 2px 4px;
  border-radius: var(--radius);
}
.group-name[contenteditable]:focus {
  outline: 2px solid var(--color-primary);
}
.group-progress {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.entry-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.entry-done {
  flex-shrink: 0;
  align-self: flex-start;
}
.entry-texts {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.entry-main {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.entry-name {
  flex: 1;
  min-width: 0;
  padding: 1px 4px;
  border-radius: var(--radius);
}
.entry-name.done {
  text-decoration: line-through;
  color: var(--color-text-muted);
}
.entry-name[contenteditable]:focus {
  outline: 2px solid var(--color-primary);
}
.entry-quantity {
  width: 2.5rem;
  flex-shrink: 0;
  font-size: inherit;
  border: none;
  padding: 1px 4px;
  background: transparent;
  color: var(--color-text-muted);
  text-align: right;
  appearance: textfield;
  -moz-appearance: textfield;
}
.entry-quantity::-webkit-inner-spin-button,
.entry-quantity::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.entry-quantity:focus {
  outline: 2px solid var(--color-primary);
}
.entry-delete,
.entry-drag-handle {
  align-self: flex-start;
}
.entry-comment {
  font-size: 0.8rem;
  border: none;
  padding: 1px 4px;
  background: transparent;
  color: var(--color-text-muted);
}
.entry-comment:focus {
  outline: 2px solid var(--color-primary);
}
.entry-add-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.entry-add-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: var(--space-1) 4px;
}
.entry-add-quantity {
  width: 2.5rem;
  flex-shrink: 0;
  font-size: inherit;
  border: none;
  padding: 1px 4px;
  background: transparent;
  color: var(--color-text-muted);
  text-align: right;
  appearance: textfield;
  -moz-appearance: textfield;
}
.entry-add-quantity::-webkit-inner-spin-button,
.entry-add-quantity::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.entry-add-quantity:focus {
  outline: 2px solid var(--color-primary);
}
.dialog-row {
  display: flex;
  gap: var(--space-2);
}
.dialog-row input,
.dialog-row select {
  flex: 1;
  min-width: 0;
}
.share-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 2px 4px;
}
.radio-row {
  display: flex;
  gap: var(--space-3);
}
.radio-option {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: normal;
}
</style>
