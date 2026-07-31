<template>
  <div>
    <div class="page-header toolbar">
      <h1>{{ t('nav.templates') }}</h1>
      <button class="btn btn-primary" type="button" @click="addGroup">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        {{ t('templates.newGroup') }}
      </button>
    </div>

    <p v-if="loading" class="empty-state">…</p>
    <p v-else-if="groupList.length === 0" class="empty-state">{{ t('templates.empty') }}</p>

    <VueDraggable
      v-else
      v-model="groupList"
      class="groups-grid"
      :animation="150"
      handle=".group-drag-handle"
      @end="onGroupDragEnd"
    >
      <div v-for="group in groupList" :key="group.id" class="card group-card">
        <div class="group-card-header">
          <span class="drag-handle group-drag-handle" :title="t('templates.dragGroup')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
            </svg>
          </span>
          <h3
            :ref="(el) => setGroupNameRef(group.id, el)"
            class="group-name"
            contenteditable="true"
            spellcheck="false"
            @blur="onRenameGroup(group, $event)"
            @keydown.enter.prevent="blurTarget($event)"
          >{{ group.name }}</h3>
          <button class="btn btn-ghost" type="button" :title="t('templates.deleteGroup')" @click="confirmDeleteGroup(group)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <VueDraggable
          v-model="group.entries"
          class="entry-list"
          :animation="150"
          handle=".entry-drag-handle"
          @end="onEntryDragEnd(group)"
        >
          <div v-for="entry in group.entries" :key="entry.id" class="entry-row">
            <span class="drag-handle entry-drag-handle" :title="t('templates.dragEntry')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
            </span>
            <span
              class="entry-name"
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
              :title="t('templates.quantityLabel')"
              :value="entry.quantity ?? ''"
              @blur="onEntryQuantityBlur(group, entry, $event)"
              @keydown.enter.prevent="blurTarget($event)"
            />
            <input
              class="entry-comment"
              type="text"
              :value="entry.comment ?? ''"
              :placeholder="t('templates.commentPlaceholder')"
              @blur="onEntryCommentBlur(group, entry, $event)"
              @keydown.enter.prevent="blurTarget($event)"
            />
            <button class="btn btn-ghost" type="button" :title="t('templates.deleteEntry')" @click="deleteEntry(group, entry)">
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
            :placeholder="t('templates.addEntryPlaceholder')"
            @keydown.enter.prevent="addEntry(group)"
          />
          <input
            v-model="newEntryDrafts[group.id].quantity"
            type="number"
            min="0"
            class="entry-add-quantity"
            placeholder="0"
            :title="t('templates.quantityLabel')"
            @keydown.enter.prevent="addEntry(group)"
            @blur="addEntry(group)"
          />
        </div>
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

interface TemplateEntry {
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

interface TemplateGroup {
  id: string
  name: string
  ownerId: string
  listId: string | null
  origGroupId: string | null
  sortOrder: number
  entries: TemplateEntry[]
}

const { t } = useI18n()
const { call } = useApi()
const { confirm } = useConfirm()

const groupList = ref<TemplateGroup[]>([])
const loading = ref(false)
const newEntryDrafts = reactive<Record<string, { name: string; quantity: string }>>({})
const groupNameRefs = new Map<string, HTMLElement>()

function setGroupNameRef(id: string, el: any) {
  if (el) groupNameRefs.set(id, el as HTMLElement)
  else groupNameRefs.delete(id)
}

function ensureDraft(groupId: string) {
  if (!newEntryDrafts[groupId]) {
    newEntryDrafts[groupId] = { name: '', quantity: '' }
  }
}

function blurTarget(event: Event) {
  ;(event.target as HTMLElement).blur()
}

async function loadTemplates() {
  loading.value = true
  const result = await call(() => $fetch<TemplateGroup[]>('/api/templates'))
  if (result) {
    groupList.value = result
    for (const group of result) ensureDraft(group.id)
  }
  loading.value = false
}

async function addGroup() {
  const { focusAndSelect } = useFocusNewItem()
  const result = await call(() =>
    $fetch<TemplateGroup>('/api/templates', { method: 'POST', body: { name: t('templates.defaultGroupName') } })
  )
  if (!result) return
  groupList.value.push(result)
  ensureDraft(result.id)
  // Direkt nach dem Anlegen den Gruppennamen fokussieren, damit der Name
  // ohne weiteren Klick überschrieben werden kann.
  await nextTick()
  focusAndSelect(groupNameRefs.get(result.id))
}

async function onRenameGroup(group: TemplateGroup, event: FocusEvent) {
  const el = event.target as HTMLElement
  const value = el.innerText.trim()
  if (!value) {
    el.innerText = group.name
    return
  }
  if (value === group.name) return
  const result = await call(() =>
    $fetch<TemplateGroup>(`/api/templates/${group.id}`, { method: 'PATCH', body: { name: value } })
  )
  if (result) {
    group.name = result.name
  } else {
    el.innerText = group.name
  }
}

async function confirmDeleteGroup(group: TemplateGroup) {
  const ok = await confirm(t('templates.deleteGroupConfirm', { name: group.name }))
  if (!ok) return
  const result = await call(() => $fetch(`/api/templates/${group.id}`, { method: 'DELETE' }))
  if (result) {
    groupList.value = groupList.value.filter((g) => g.id !== group.id)
    delete newEntryDrafts[group.id]
  }
}

async function onGroupDragEnd() {
  const ids = groupList.value.map((g) => g.id)
  await call(() => $fetch('/api/templates/order', { method: 'PUT', body: { ids } }))
}

async function addEntry(group: TemplateGroup) {
  const draft = newEntryDrafts[group.id]
  const name = String(draft?.name ?? '').trim()
  if (!name) return
  const quantityRaw = draft?.quantity
  const quantity =
    quantityRaw === '' || quantityRaw === null || quantityRaw === undefined
      ? null
      : Number(quantityRaw)
  const result = await call(() =>
    $fetch<TemplateEntry>(`/api/templates/${group.id}/entries`, {
      method: 'POST',
      body: { name, quantity }
    })
  )
  if (result) {
    group.entries.push(result)
    newEntryDrafts[group.id] = { name: '', quantity: '' }
  }
}

async function onEntryNameBlur(group: TemplateGroup, entry: TemplateEntry, event: FocusEvent) {
  const el = event.target as HTMLElement
  const value = el.innerText.trim()
  if (!value) {
    el.innerText = entry.name
    return
  }
  if (value === entry.name) return
  const result = await call(() =>
    $fetch<TemplateEntry>(`/api/templates/${group.id}/entries/${entry.id}`, { method: 'PATCH', body: { name: value } })
  )
  if (result) {
    entry.name = result.name
  } else {
    el.innerText = entry.name
  }
}

async function onEntryCommentBlur(group: TemplateGroup, entry: TemplateEntry, event: FocusEvent) {
  const el = event.target as HTMLInputElement
  const value = el.value.trim() || null
  if (value === entry.comment) return
  const result = await call(() =>
    $fetch<TemplateEntry>(`/api/templates/${group.id}/entries/${entry.id}`, { method: 'PATCH', body: { comment: value } })
  )
  if (result) {
    entry.comment = result.comment
  } else {
    el.value = entry.comment ?? ''
  }
}

async function onEntryQuantityBlur(group: TemplateGroup, entry: TemplateEntry, event: FocusEvent) {
  const el = event.target as HTMLInputElement
  const value = el.value === '' ? null : Number(el.value)
  if (value === entry.quantity) return
  const result = await call(() =>
    $fetch<TemplateEntry>(`/api/templates/${group.id}/entries/${entry.id}`, { method: 'PATCH', body: { quantity: value } })
  )
  if (result) {
    entry.quantity = result.quantity
  } else {
    el.value = entry.quantity === null ? '' : String(entry.quantity)
  }
}

async function deleteEntry(group: TemplateGroup, entry: TemplateEntry) {
  const result = await call(() => $fetch(`/api/templates/${group.id}/entries/${entry.id}`, { method: 'DELETE' }))
  if (result) {
    group.entries = group.entries.filter((e) => e.id !== entry.id)
  }
}

async function onEntryDragEnd(group: TemplateGroup) {
  const ids = group.entries.map((e) => e.id)
  await call(() => $fetch(`/api/templates/${group.id}/entries/order`, { method: 'PUT', body: { ids } }))
}

onMounted(loadTemplates)
</script>

<style scoped>
.page-header {
  justify-content: space-between;
  margin-bottom: 1rem;
}

.empty-state {
  color: var(--color-text-muted);
  padding: var(--space-4) 0;
}

.groups-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
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
  gap: var(--space-2);
}

.group-name {
  flex: 1;
  font-size: 1.05rem;
  font-weight: 600;
  outline: none;
  border-radius: var(--radius);
  padding: 0.15rem 0.35rem;
  margin: -0.15rem -0.35rem;
}

.group-name:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

.drag-handle {
  color: var(--color-text-muted);
  cursor: grab;
  display: inline-flex;
  flex-shrink: 0;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 0.5rem;
}

.entry-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.entry-name {
  flex: 2;
  padding: 0.15rem 0.35rem;
  border-radius: var(--radius);
  outline: none;
}

.entry-name:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

.entry-quantity {
  flex: 0 0 4rem;
  width: 4rem;
  padding: 0.15rem 0.35rem;
  border-radius: var(--radius);
  color: var(--color-text-muted);
}

.entry-comment {
  flex: 2;
  color: var(--color-text-muted);
  font-style: italic;
}

.entry-add-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.entry-add-input {
  flex: 1;
  min-width: 0;
  border-style: dashed;
}
.entry-add-quantity {
  flex: 0 0 4rem;
  width: 4rem;
  padding: 0.15rem 0.35rem;
  border-radius: var(--radius);
  color: var(--color-text-muted);
  appearance: textfield;
  -moz-appearance: textfield;
}
.entry-add-quantity::-webkit-inner-spin-button,
.entry-add-quantity::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
