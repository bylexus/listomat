export interface ToastMessage {
  id: string
  severity: 'success' | 'error' | 'info' | 'warn'
  summary: string
  detail?: string
}

export function useToast() {
  const toasts = useState<ToastMessage[]>('toasts', () => [])

  function add(message: { severity: ToastMessage['severity']; summary: string; detail?: string; life?: number }) {
    const id = crypto.randomUUID()
    const { life = 5000, ...rest } = message
    toasts.value = [...toasts.value, { id, ...rest }]
    if (life > 0) {
      setTimeout(() => remove(id), life)
    }
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, add, remove }
}
