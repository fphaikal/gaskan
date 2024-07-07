// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      meta: [
        // <meta name="google-site-verification" content="zGcUSdyFHTHDyelIHIQ-fAu2Ir0mG8xxa9b4ToiCiic" />
        { name: 'google-site-verification', content: 'zGcUSdyFHTHDyelIHIQ-fAu2Ir0mG8xxa9b4ToiCiic' }
      ],
      noscript: [
        // <noscript>JavaScript is required</noscript>
        { children: 'JavaScript is required' }
      ]
    }
  },
  
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      ADMIN_KEY: process.env.NUXT_ROLE_ADMIN_KEY,
      DEVELOPER_KEY: process.env.NUXT_ROLE_DEVELOPER_KEY,
      buildId: process.env.VERCEL_GIT_COMMIT_SHA || 'development'
    },
  },
  
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "nuxt-icon",
    "@pinia-plugin-persistedstate/nuxt",
  ],
});
