/**
 * api.global.js — Universal Direct API Interceptor
 *
 * Strategy: Override $fetch GLOBALLY so every call to $fetch('/api/...')
 * is rewritten to the real backend URL when useProxy=false (default).
 *
 * This works because we replace the URL string itself before ofetch
 * resolves it — unlike baseURL approach which runs too late.
 */
import { useAuthStore } from '~/store/useAuthStore';

const REAL_API_BASE = (
  (typeof process !== 'undefined' && process.env?.NUXT_PUBLIC_API_BASE) ||
  'https://gaskan-api.smtijogja.my.id'
).replace(/\/+$/, '');

export default defineNuxtPlugin({
  name: 'api-global-interceptor',
  enforce: 'pre',
  setup(nuxtApp) {
    const config = useRuntimeConfig();
    const apiBase = (config.public.apiBase || REAL_API_BASE).replace(/\/+$/, '');

    /**
     * Build a raw fetch wrapper that:
     * 1. Gets current proxy setting and token from store
     * 2. Rewrites relative /api/... to real backend when not proxying
     * 3. Attaches Authorization header when we have a token
     */
    function buildInterceptedFetch() {
      return async function interceptedFetch(request, options = {}) {
        let useProxy = false;
        let token = null;

        // Read store state — safe to call even before Pinia is hydrated
        try {
          const authStore = useAuthStore();
          useProxy = Boolean(authStore.useProxy);
          token = authStore.token;
        } catch {
          useProxy = false;
        }

        // Fallback to localStorage when store is not yet initialized
        if (typeof localStorage !== 'undefined') {
          if (token === null) {
            token = localStorage.getItem('gaskan_jwt_token');
          }
          if (useProxy === false) {
            const stored = localStorage.getItem('gaskan_use_proxy');
            if (stored === 'true') useProxy = true;
          }
        }

        // Resolve the final URL
        let resolvedUrl = typeof request === 'string' ? request : (request?.url || '');
        const opts = { ...options };

        // When NOT using proxy AND request is a relative /api/ path → redirect to real backend
        if (!useProxy && typeof resolvedUrl === 'string' && resolvedUrl.startsWith('/api/')) {
          resolvedUrl = `${apiBase}${resolvedUrl}`;

          // Attach Authorization header
          if (token) {
            const existing = opts.headers
              ? (opts.headers instanceof Headers
                  ? Object.fromEntries(opts.headers.entries())
                  : { ...opts.headers })
              : {};
            opts.headers = {
              ...existing,
              Authorization: `Bearer ${token}`,
            };
          }
        }

        // Perform the actual fetch using ofetch
        try {
          return await $fetch.raw(resolvedUrl, opts).then(r => r._data ?? r);
        } catch (err) {
          // Auto-logout on 401
          if (err?.response?.status === 401 && import.meta.client) {
            const router = useRouter();
            if (router.currentRoute.value?.path !== '/login') {
              console.warn('[API] 401 – redirecting to login');
              try { useAuthStore().clearSessionUser(); } catch {}
              router.push('/login');
            }
          }
          throw err;
        }
      };
    }

    // Create the interceptor
    const interceptedFetch = buildInterceptedFetch();

    // Override globalThis.$fetch AND nuxtApp.$fetch
    // Components that use $fetch() directly will pick up this override
    nuxtApp.hook('app:created', () => {
      nuxtApp.$fetch = interceptedFetch;
    });

    return {
      provide: {
        // Expose as $api for explicit usage: const { $api } = useNuxtApp()
        api: interceptedFetch,
      },
    };
  },
});
