// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      ADMIN_KEY: process.env.NUXT_ROLE_ADMIN_KEY,
      DEVELOPER_KEY: process.env.NUXT_ROLE_DEVELOPER_KEY,
      buildId: process.env.NUXT_ENV_VERCEL_GIT_COMMIT_SHA || 'development'
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
