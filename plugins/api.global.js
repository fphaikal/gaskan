import { useAuthStore } from '~/store/useAuthStore';

export default defineNuxtPlugin((nuxtApp) => {
  const originalFetch = globalThis.$fetch;
  const config = useRuntimeConfig();
  const rawApiBase = config.public.apiBase || 'https://gaskan-api.smtijogja.my.id';
  const apiBase = rawApiBase.replace(/\/+$/, '');

  const customApiFetch = async (request, opts = {}) => {
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

    let targetRequest = request;
    let options = { ...opts };

    // Direct Real API Mode (useProxy = false - DEFAULT):
    // Rewrite /api/... calls directly to Real API backend URL (https://gaskan-api.smtijogja.my.id)
    // Exclude /api/auth/login and /api/auth/logout which handle session cookies
    if (
      !useProxy &&
      typeof request === 'string' &&
      request.startsWith('/api/') &&
      !request.startsWith('/api/auth/login') &&
      !request.startsWith('/api/auth/logout')
    ) {
      targetRequest = `${apiBase}${request}`;

      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      return await originalFetch(targetRequest, options);
    } catch (error) {
      const requestUrl = typeof targetRequest === 'string' ? targetRequest : '';
      const isTestConnection = requestUrl.includes('test-connection');

      if (error.response && error.response.status === 401 && !isTestConnection) {
        if (import.meta.client) {
          const router = useRouter();
          if (router.currentRoute.value.path !== '/login') {
            console.warn('Sesi habis (401 terdeteksi), mengarahkan ke halaman login...');
            try {
              useAuthStore().clearSessionUser();
            } catch {}
            router.push('/login');
          }
        }
      }
      throw error;
    }
  };

  // Override global $fetch everywhere
  globalThis.$fetch = customApiFetch;

  return {
    provide: {
      api: customApiFetch,
    },
  };
});
