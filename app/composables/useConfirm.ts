interface ConfirmState {
  message: string
  resolve: ((value: boolean) => void) | null
}

export function useConfirm() {
  const state = useState<ConfirmState>('confirm-dialog', () => ({ message: '', resolve: null }))

  function confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = { message, resolve }
    })
  }

  return { confirm, state }
}
