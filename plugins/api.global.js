/**
 * api.global.js — Universal Direct API Interceptor
 *
 * - Auth routes (/api/auth/**) → go through Nuxt Nitro proxy (session cookie handling)
 * - All other content routes (/api/**) → go directly to real backend when useProxy=false
 */
import { useAuthStore } from '~/store/useAuthStore';

const REAL_API_BASE = 'https://gaskan-api.smtijogja.my.id';

// Auth routes that MUST stay on Nitro proxy (session cookie + field mapping)
const AUTH_PROXY_PATHS = [
  '/api/auth/',
];

function isAuthRoute(url) {
  return AUTH_PROXY_PATHS.some(prefix => url.startsWith(prefix));
}

export default defineNuxtPlugin({
  name: 'api-global-interceptor',
  enforce: 'pre',
  setup(nuxtApp) {
    const config = useRuntimeConfig();
    const apiBase = (config.public.apiBase || REAL_API_BASE).replace(/\/+$/, '');

    nuxtApp.hook('app:created', () => {
      // Wrap $fetch to rewrite content API calls directly to backend
      const originalFetch = nuxtApp.$fetch ?? $fetch;

      nuxtApp.$fetch = new Proxy(originalFetch, {
        apply(target, thisArg, args) {
          const [request, options = {}] = args;
          const url = typeof request === 'string' ? request : (request?.url || '');

          // Skip auth routes — they stay on Nitro
          if (isAuthRoute(url)) {
            return Reflect.apply(target, thisArg, args);
          }

          let useProxy = false;
          let token = null;

          try {
            const authStore = useAuthStore();
            useProxy = Boolean(authStore.useProxy);
            token = authStore.token;
          } catch {}

          if (typeof localStorage !== 'undefined') {
            if (!token) token = localStorage.getItem('gaskan_jwt_token');
            if (!useProxy) {
              const stored = localStorage.getItem('gaskan_use_proxy');
              if (stored === 'true') useProxy = true;
            }
          }

          // Rewrite /api/... → https://gaskan-api.smtijogja.my.id/api/... when not proxying
          if (!useProxy && url.startsWith('/api/')) {
            const newUrl = `${apiBase}${url}`;
            const newOptions = { ...options };

            if (token) {
              const existing = newOptions.headers
                ? (newOptions.headers instanceof Headers
                    ? Object.fromEntries(newOptions.headers.entries())
                    : { ...newOptions.headers })
                : {};
              newOptions.headers = { ...existing, Authorization: `Bearer ${token}` };
            }

            return Reflect.apply(target, thisArg, [newUrl, newOptions]);
          }

          return Reflect.apply(target, thisArg, args);
        }
      });
    });

    return {
      provide: {
        api: (url, opts = {}) => {
          // useNuxtApp().$api() — same logic as above for explicit usage
          const isAuth = isAuthRoute(typeof url === 'string' ? url : '');
          if (!isAuth) {
            let token = null;
            try { token = useAuthStore().token; } catch {}
            if (!token && typeof localStorage !== 'undefined') token = localStorage.getItem('gaskan_jwt_token');
            if (token && typeof url === 'string' && url.startsWith('/api/')) {
              const newOpts = { ...opts };
              const existing = newOpts.headers ? { ...newOpts.headers } : {};
              newOpts.headers = { ...existing, Authorization: `Bearer ${token}` };
              return $fetch(`${apiBase}${url}`, newOpts);
            }
          }
          return $fetch(url, opts);
        },
      },
    };
  },
});
