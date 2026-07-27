<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold">{{ t('nav.lists') }}</h1>
      <Button @click="addList">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        {{ t('lists.newList') }}
      </Button>
    </div>

    <p v-if="loading" class="text-muted-foreground">…</p>

    <template v-else>
      <section>
        <h2 class="mt-6 mb-2 text-base text-muted-foreground">{{ t('lists.mine') }}</h2>
        <p v-if="own.length === 0" class="text-muted-foreground">{{ t('lists.empty') }}</p>
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            v-for="list in own"
            :key="list.id"
            class="cursor-pointer gap-2 p-4"
            @click="openList(list, $event)"
          >
            <div class="flex items-center gap-1">
              <h3
                :ref="(el) => setNameRef(list.id, el)"
                class="flex-1 rounded-md px-1 py-0.5 text-base font-medium focus:ring-3 focus:ring-ring/50 focus:outline-none"
                contenteditable="true"
                spellcheck="false"
                @blur="onRenameList(list, $event)"
                @keydown.enter.prevent="blurTarget($event)"
              >{{ list.name }}</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                :title="t('lists.rename')"
                @click="focusName(list.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M17 3l4 4L8 20l-5 1 1-5L17 3z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                :title="t('lists.duplicate')"
                @click="duplicateList(list)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                :title="t('lists.deleteList')"
                @click="askDeleteList(list)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </Button>
            </div>
            <ListProgress :done="list.progress.done" :total="list.progress.total" />
          </Card>
        </div>
      </section>

      <section v-if="shared.length > 0">
        <h2 class="mt-6 mb-2 text-base text-muted-foreground">{{ t('lists.sharedWithMe') }}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            v-for="list in shared"
            :key="list.id"
            class="cursor-pointer gap-2 p-4"
            @click="openList(list, $event)"
          >
            <div class="flex items-center gap-1">
              <h3 class="flex-1 px-1 py-0.5 text-base font-medium">{{ list.name }}</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                :title="t('lists.duplicate')"
                @click="duplicateList(list)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="9" y="9" width="12" height="12" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke-linecap="round" />
                </svg>
              </Button>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ t('lists.byOwner', { name: list.ownerName }) }}
            </p>
            <ListProgress :done="list.progress.done" :total="list.progress.total" />
          </Card>
        </div>
      </section>
    </template>

    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('confirm.title') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ listToDelete ? t('lists.deleteConfirm', { name: listToDelete.name }) : '' }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('confirm.cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="deleteList">{{ t('confirm.ok') }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
interface ListSummary {
  id: string
  name: string
  ownerName: string
  progress: { done: number; total: number }
  updatedAt: string
}

const { t } = useI18n()
const { call } = useApi()

const own = ref<ListSummary[]>([])
const shared = ref<ListSummary[]>([])
const loading = ref(false)
const nameRefs = new Map<string, HTMLElement>()

const deleteDialogOpen = ref(false)
const listToDelete = ref<ListSummary | null>(null)

function setNameRef(id: string, el: any) {
  if (el) nameRefs.set(id, el as HTMLElement)
  else nameRefs.delete(id)
}

function focusName(id: string) {
  const el = nameRefs.get(id)
  if (!el) return
  el.focus()
  // Gesamten Text selektieren für direktes Überschreiben
  const range = document.createRange()
  range.selectNodeContents(el)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function blurTarget(event: Event) {
  ;(event.target as HTMLElement).blur()
}

async function loadLists() {
  loading.value = true
  const result = await call(() => $fetch<{ own: ListSummary[]; shared: ListSummary[] }>('/api/lists'))
  if (result) {
    own.value = result.own
    shared.value = result.shared
  }
  loading.value = false
}

async function addList() {
  const result = await call(() =>
    $fetch<{ id: string; name: string; updatedAt: string }>('/api/lists', {
      method: 'POST',
      body: { name: t('lists.defaultName') }
    })
  )
  if (!result) return
  // Anlegen öffnet direkt das Detail
  await navigateTo(`/lists/${result.id}`)
}

function openList(list: ListSummary, event: MouseEvent) {
  // Klicks auf Buttons oder den editierbaren Namen navigieren nicht
  if ((event.target as HTMLElement).closest('button, [contenteditable]')) return
  navigateTo(`/lists/${list.id}`)
}

async function duplicateList(list: ListSummary) {
  const result = await call(() =>
    $fetch<{ id: string }>(`/api/lists/${list.id}/duplicate`, {
      method: 'POST',
      body: { name: `${list.name} ${t('lists.copySuffix')}` }
    })
  )
  if (result) {
    // Zur Kopie navigieren (Entscheid E7)
    await navigateTo(`/lists/${result.id}`)
  }
}

async function onRenameList(list: ListSummary, event: FocusEvent) {
  const el = event.target as HTMLElement
  const value = el.innerText.trim()
  if (!value) {
    el.innerText = list.name
    return
  }
  if (value === list.name) return
  const result = await call(() =>
    $fetch<{ name: string }>(`/api/lists/${list.id}`, { method: 'PATCH', body: { name: value } })
  )
  if (result) {
    list.name = result.name
  } else {
    el.innerText = list.name
  }
}

function askDeleteList(list: ListSummary) {
  listToDelete.value = list
  deleteDialogOpen.value = true
}

async function deleteList() {
  const list = listToDelete.value
  if (!list) return
  const result = await call(() => $fetch(`/api/lists/${list.id}`, { method: 'DELETE' }))
  if (result) {
    own.value = own.value.filter((l) => l.id !== list.id)
  }
  listToDelete.value = null
}

onMounted(loadLists)
</script>
