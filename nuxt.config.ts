// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-12-12',
  devtools: { enabled: true },

  css: ['~/assets/css/tailwind.css'],

  routeRules: {
    '/home': { ssr: false },
    '/admin/**': { ssr: false },
    '/absensi/**': { ssr: false },
    '/siswa/**': { ssr: false },
    '/izin/**': { ssr: false },
    '/kelas/**': { ssr: false },
    '/semester/**': { ssr: false },
    '/jurusan/**': { ssr: false },
    '/log/**': { ssr: false },
    '/config/**': { ssr: false },
    '/reshuffle/**': { ssr: false },
    '/profile': { ssr: false },
    '/monitor/**': { ssr: false },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      meta: [
        // <meta name="google-site-verification" content="zGcUSdyFHTHDyelIHIQ-fAu2Ir0mG8xxa9b4ToiCiic" />
        {
          name: "google-site-verification",
          content: "zGcUSdyFHTHDyelIHIQ-fAu2Ir0mG8xxa9b4ToiCiic",
        },
      ],
      noscript: [
        // <noscript>JavaScript is required</noscript>
        { children: "JavaScript is required" },
      ],
    },
  },
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL,
  },
  sitemap: {
    // exclude all URLs that start with /secret
    exclude: ['/monitor/**', '/fornaira', '/log/**'],
  },
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || process.env.SESSION_SECRET,
    public: {
      apiBase: (process.env.NUXT_PUBLIC_API_BASE || 'https://gaskan-api.smtijogja.my.id').replace(/\/+$/, ''),
      wsBase: (process.env.NUXT_PUBLIC_WS_BASE || 'wss://gaskan-api.smtijogja.my.id').replace(/\/+$/, ''),
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || "development",
    },
  },

  modules: [
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "@nuxt/icon",
    "@pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/sitemap"
  ],

  icon: {
    mode: 'css',
    clientBundle: {
      scan: true,
    },
    serverBundle: {
      collections: ['mingcute', 'ic', 'mdi', 'mage', 'entypo-social'],
    },
  },
});
