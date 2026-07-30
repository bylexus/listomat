// Restores the locale the user explicitly picked via the language menu (localStorage).
export default defineNuxtPlugin(async (nuxtApp) => {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (!saved) return

  const i18n = nuxtApp.$i18n
  const known = i18n.locales.value.some((l) => l.code === saved)
  if (known && i18n.locale.value !== saved) {
    await i18n.setLocale(saved as 'de' | 'en')
  }
})
