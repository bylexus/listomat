<template>
  <div>
    <div class="page-header toolbar">
      <h1>{{ t('nav.lists') }}</h1>
      <button class="btn btn-primary" type="button" @click="addList">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        {{ t('lists.newList') }}
      </button>
    </div>

    <p v-if="loading" class="empty-state">…</p>

    <template v-else>
      <section>
        <h2 class="section-title">{{ t('lists.mine') }}</h2>
        <p v-if="own.length === 0" class="empty-state">{{ t('lists.empty') }}</p>
        <div v-else class="lists-grid">
          <div v-for="list in own" :key="list.id" class="card list-card">
            <div class="list-card-header">
              <h3
                :ref="(el) => setNameRef(list.id, el)"
                class="list-name"
                contenteditable="true"
                spellcheck="false"
                @blur="onRenameList(list, $event)"
                @keydown.enter.prevent="blurTarget($event)"
              >{{ list.name }}</h3>
              <button class="btn btn-ghost" type="button" :title="t('lists.rename')" @click="focusName(list.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M17 3l4 4L8 20l-5 1 1-5L17 3z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
              <button class="btn btn-ghost" type="button" :title="t('lists.deleteList')" @click="confirmDeleteList(list)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
            <UiProgress :done="list.progress.done" :total="list.progress.total" />
          </div>
        </div>
      </section>

      <section v-if="shared.length > 0">
        <h2 class="section-title">{{ t('lists.sharedWithMe') }}</h2>
        <div class="lists-grid">
          <div v-for="list in shared" :key="list.id" class="card list-card">
            <div class="list-card-header">
              <h3 class="list-name">{{ list.name }}</h3>
            </div>
            <p class="list-owner">{{ t('lists.byOwner', { name: list.ownerName }) }}</p>
            <UiProgress :done="list.progress.done" :total="list.progress.total" />
          </div>
        </div>
      </section>
    </template>
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
const { confirm } = useConfirm()

const own = ref<ListSummary[]>([])
const shared = ref<ListSummary[]>([])
const loading = ref(false)
const nameRefs = new Map<string, HTMLElement>()

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
  own.value.unshift({
    id: result.id,
    name: result.name,
    ownerName: '',
    progress: { done: 0, total: 0 },
    updatedAt: result.updatedAt
  })
  // Titel der neuen Kachel direkt zum Umbenennen fokussieren
  await nextTick()
  focusName(result.id)
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

async function confirmDeleteList(list: ListSummary) {
  const ok = await confirm(t('lists.deleteConfirm', { name: list.name }))
  if (!ok) return
  const result = await call(() => $fetch(`/api/lists/${list.id}`, { method: 'DELETE' }))
  if (result) {
    own.value = own.value.filter((l) => l.id !== list.id)
  }
}

onMounted(loadLists)
</script>

<style scoped>
.page-header {
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.section-title {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin: var(--space-4) 0 var(--space-2);
}
.empty-state {
  color: var(--color-text-muted);
}
.lists-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}
@media (min-width: 768px) {
  .lists-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.list-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.list-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.list-name {
  flex: 1;
  margin: 0;
  font-size: 1.05rem;
  padding: 2px 4px;
  border-radius: var(--radius);
  outline-offset: 2px;
}
.list-name[contenteditable]:focus {
  outline: 2px solid var(--color-primary);
}
.list-owner {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
</style>
