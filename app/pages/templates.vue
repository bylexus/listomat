<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold">{{ t('nav.templates') }}</h1>
      <Button @click="addGroup">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        {{ t('templates.newGroup') }}
      </Button>
    </div>

    <p v-if="loading" class="py-6 text-muted-foreground">…</p>
    <p v-else-if="groupList.length === 0" class="py-6 text-muted-foreground">
      {{ t('templates.empty') }}
    </p>

    <VueDraggable
      v-else
      v-model="groupList"
      class="grid grid-cols-1 gap-4 md:grid-cols-2"
      :animation="150"
      handle=".group-drag-handle"
      @end="onGroupDragEnd"
    >
      <Card v-for="group in groupList" :key="group.id" class="gap-2 p-4">
        <div class="flex items-center gap-2">
          <span
            class="group-drag-handle inline-flex shrink-0 cursor-grab text-muted-foreground"
            :title="t('templates.dragGroup')"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="size-4"
              aria-hidden="true"
            >
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
          <Button
            variant="ghost"
            size="icon-sm"
            :title="t('templates.deleteGroup')"
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
          :animation="150"
          handle=".entry-drag-handle"
          @end="onEntryDragEnd(group)"
        >
          <div v-for="entry in group.entries" :key="entry.id" class="flex items-center gap-2">
            <span
              class="entry-drag-handle inline-flex shrink-0 cursor-grab text-muted-foreground"
              :title="t('templates.dragEntry')"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="size-3.5"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
              </svg>
            </span>
            <span
              class="flex-2 rounded-md px-1.5 py-0.5 text-sm focus:ring-3 focus:ring-ring/50 focus:outline-none"
              contenteditable="true"
              spellcheck="false"
              @blur="onEntryNameBlur(group, entry, $event)"
              @keydown.enter.prevent="blurTarget($event)"
            >{{ entry.name }}</span>
            <Input
              class="h-8 flex-2 text-muted-foreground italic"
              type="text"
              :value="entry.comment ?? ''"
              :placeholder="t('templates.commentPlaceholder')"
              @blur="onEntryCommentBlur(group, entry, $event)"
              @keydown.enter.prevent="blurTarget($event)"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              :title="t('templates.deleteEntry')"
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
          :placeholder="t('templates.addEntryPlaceholder')"
          @keydown.enter.prevent="addEntry(group)"
        />
      </Card>
    </VueDraggable>

    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('confirm.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ groupToDelete ? t('templates.deleteGroupConfirm', { name: groupToDelete.name }) : '' }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('confirm.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="deleteGroup">{{ t('confirm.ok') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

interface TemplateEntry {
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

const groupList = ref<TemplateGroup[]>([])
const loading = ref(false)
const newEntryDrafts = reactive<Record<string, string>>({})

const deleteDialogOpen = ref(false)
const groupToDelete = ref<TemplateGroup | null>(null)

function blurTarget(event: Event) {
  ;(event.target as HTMLElement).blur()
}

async function loadTemplates() {
  loading.value = true
  const result = await call(() => $fetch<TemplateGroup[]>('/api/templates'))
  if (result) groupList.value = result
  loading.value = false
}

async function addGroup() {
  const result = await call(() =>
    $fetch<TemplateGroup>('/api/templates', { method: 'POST', body: { name: t('templates.defaultGroupName') } })
  )
  if (result) groupList.value.push(result)
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

function askDeleteGroup(group: TemplateGroup) {
  groupToDelete.value = group
  deleteDialogOpen.value = true
}

async function deleteGroup() {
  const group = groupToDelete.value
  if (!group) return
  const result = await call(() => $fetch(`/api/templates/${group.id}`, { method: 'DELETE' }))
  if (result) {
    groupList.value = groupList.value.filter((g) => g.id !== group.id)
    delete newEntryDrafts[group.id]
  }
  groupToDelete.value = null
}

async function onGroupDragEnd() {
  const ids = groupList.value.map((g) => g.id)
  await call(() => $fetch('/api/templates/order', { method: 'PUT', body: { ids } }))
}

async function addEntry(group: TemplateGroup) {
  const draft = (newEntryDrafts[group.id] || '').trim()
  if (!draft) return
  const result = await call(() =>
    $fetch<TemplateEntry>(`/api/templates/${group.id}/entries`, { method: 'POST', body: { name: draft } })
  )
  if (result) {
    group.entries.push(result)
    newEntryDrafts[group.id] = ''
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

