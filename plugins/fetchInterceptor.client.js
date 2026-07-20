import { useAuthStore } from '~/store/useAuthStore';

export default defineNuxtPlugin((nuxtApp) => {
  const originalFetch = globalThis.$fetch;
  const config = useRuntimeConfig();
  const rawApiBase = config.public.apiBase || 'http://localhost:5000';
  const apiBase = rawApiBase.replace(/\/+$/, '');

  globalThis.$fetch = async (request, opts = {}) => {
    const authStore = useAuthStore();
    
    // Determine whether to use proxy or direct real API
    let useProxy = authStore.useProxy;
    if (typeof localStorage !== 'undefined') {
      const storedProxy = localStorage.getItem('gaskan_use_proxy');
      if (storedProxy !== null) {
        useProxy = storedProxy === 'true';
      }
    }

    let targetRequest = request;
    let options = { ...opts };

    // Direct Real API Mode: rewrite /api/... to direct backend URL
    // Exclude /api/auth/login and /api/auth/logout which set Nitro session cookies
    if (!useProxy && typeof request === 'string' && request.startsWith('/api/') && !request.startsWith('/api/auth/login') && !request.startsWith('/api/auth/logout')) {
      targetRequest = `${apiBase}${request}`;

      const token = authStore.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('gaskan_jwt_token') : null);
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
        const router = useRouter();
        
        if (router.currentRoute.value.path !== '/login') {
          console.warn('Sesi habis (401 terdeteksi), mengarahkan ke halaman login...');
          useAuthStore().clearSessionUser();
          router.push('/login');
        }
      }
      
      throw error;
    }
  };
});

