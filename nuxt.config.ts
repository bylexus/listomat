import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Listomat'
    }
  },

  modules: ['@nuxtjs/i18n', 'nuxt-auth-utils', 'shadcn-nuxt'],

  vite: {
    plugins: [tailwindcss()]
  },

  shadcn: {
    prefix: '',
    componentDir: '@/components/shadcn'
  },

  css: ['~/assets/css/tailwind.css'],

  i18n: {
    locales: [
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'de',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
