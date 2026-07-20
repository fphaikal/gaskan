import { useAuthStore } from '~/store/useAuthStore';

export default defineNuxtPlugin({
  name: 'api-fetch-interceptor',
  enforce: 'pre',
  setup(nuxtApp) {
    const config = useRuntimeConfig();
    const rawApiBase = config.public.apiBase || 'https://gaskan-api.smtijogja.my.id';
    const apiBase = rawApiBase.replace(/\/+$/, '');

    const apiFetch = $fetch.create({
      onRequest({ request, options }) {
        let useProxy = false;
        let token = null;

        try {
          const authStore = useAuthStore();
          useProxy = Boolean(authStore.useProxy);
          token = authStore.token;
        } catch {
          useProxy = false;
        }

        if (typeof localStorage !== 'undefined' && !token) {
          token = localStorage.getItem('gaskan_jwt_token');
        }

        const reqUrl = typeof request === 'string' ? request : (request.url || '');

        // Direct Real API Mode (useProxy = false - DEFAULT):
        // Rewrite relative /api/... calls directly to Real API backend URL (https://gaskan-api.smtijogja.my.id)
        if (
          !useProxy &&
          reqUrl.startsWith('/api/') &&
          !reqUrl.startsWith('/api/auth/login') &&
          !reqUrl.startsWith('/api/auth/logout')
        ) {
          options.baseURL = apiBase;

          if (token) {
            const existingHeaders = options.headers
              ? (options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : options.headers)
              : {};
            options.headers = {
              ...existingHeaders,
              Authorization: `Bearer ${token}`,
            };
          }
        }
      },
      onResponseError({ response }) {
        if (response && response.status === 401) {
          if (import.meta.client) {
            const router = useRouter();
            if (router.currentRoute.value?.path !== '/login') {
              console.warn('Sesi habis (401 terdeteksi), mengarahkan ke halaman login...');
              try {
                useAuthStore().clearSessionUser();
              } catch {}
              router.push('/login');
            }
          }
        }
      }
    });

    // Replace $fetch globally across Nuxt instance and window
    globalThis.$fetch = apiFetch;
    nuxtApp.$fetch = apiFetch;

    return {
      provide: {
        api: apiFetch,
      },
    };
  }
});
