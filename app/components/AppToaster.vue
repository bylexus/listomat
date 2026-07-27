<template>
  <div
    class="pointer-events-none fixed top-4 right-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    role="region"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="translate-x-2 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="translate-x-2 opacity-0"
      move-class="transition duration-150"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg"
        :class="borderClass(toast.severity)"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ toast.summary }}</p>
          <p v-if="toast.detail" class="mt-0.5 text-sm text-muted-foreground break-words">
            {{ toast.detail }}
          </p>
        </div>
        <button
          type="button"
          class="-m-1 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          :aria-label="t('toast.dismiss')"
          @click="remove(toast.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { ToastMessage } from '~/composables/useToast'

const { t } = useI18n()
const { toasts, remove } = useToast()

function borderClass(severity: ToastMessage['severity']) {
  switch (severity) {
    case 'success':
      return 'border-l-4 border-l-emerald-600'
    case 'error':
      return 'border-l-4 border-l-destructive'
    case 'warn':
      return 'border-l-4 border-l-amber-500'
    default:
      return 'border-l-4 border-l-primary'
  }
}
</script>
