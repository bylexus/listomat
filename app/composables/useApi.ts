export function useApi() {
  const toast = useToast()
  const { t } = useI18n()

  async function call<T>(request: () => Promise<T>): Promise<T | null> {
    try {
      return await request()
    } catch (err: any) {
      const message = err?.data?.statusMessage || err?.statusMessage || t('errors.generic')
      toast.add({ severity: 'error', summary: t('errors.title'), detail: message, life: 5000 })
      return null
    }
  }

  return { call }
}
