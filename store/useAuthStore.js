import { defineStore } from "pinia";

const REAL_API_BASE = 'https://gaskan-api.smtijogja.my.id';

// Helper: get current API base based on proxy setting
function getApiBase(useProxy = false) {
  if (useProxy) return ''; // empty = relative URL → goes through Nitro proxy
  // Read from runtimeConfig if available
  if (typeof window !== 'undefined') {
    try {
      const nuxtApp = window.__NUXT__;
      const configBase = nuxtApp?.config?.public?.apiBase;
      if (configBase) return configBase.replace(/\/+$/, '');
    } catch {}
  }
  return REAL_API_BASE;
}

// Helper: build headers with Bearer token
function authHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authenticated: false,
    loading: false,
    nis: null,
    role: null,
    kelas: null,
    nama: null,
    token: typeof localStorage !== 'undefined' ? localStorage.getItem('gaskan_jwt_token') || null : null,
    useProxy: false, // Global system setting — synced from database on login
    initialized: false,
    userData: null,
    userLoading: false,
  }),
  actions: {
    setSessionUser(user, token = null) {
      this.authenticated = true;
      this.nis = user?.nis || null;
      this.role = user?.role || null;
      this.kelas = user?.kelas || null;
      this.nama = user?.nama || null;
      if (token) {
        this.token = token;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('gaskan_jwt_token', token);
        }
      }
    },

    clearSessionUser() {
      this.authenticated = false;
      this.nis = null;
      this.role = null;
      this.kelas = null;
      this.nama = null;
      this.token = null;
      this.userData = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gaskan_jwt_token');
      }
    },

    async toggleProxy(value) {
      const newValue = value !== undefined ? Boolean(value) : !this.useProxy;
      this.useProxy = newValue;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gaskan_use_proxy', String(newValue));
      }
      // Persist to database so ALL users pick it up on next load
      try {
        const base = getApiBase(false); // always use direct for settings save
        await $fetch(`${base}/api/system/settings`, {
          method: 'POST',
          headers: authHeaders(this.token),
          body: { useProxy: newValue }
        });
        console.log('[SYSTEM PROXY SETTING SAVED TO DATABASE]:', newValue);
      } catch (err) {
        console.warn('Gagal menyimpan pengaturan proxy ke server DB:', err);
      }
      return this.useProxy;
    },

    async fetchSystemSettings() {
      // Fetch useProxy value from database and sync to store
      try {
        const base = getApiBase(false); // always direct for system settings
        const res = await $fetch(`${base}/api/system/settings`, {
          headers: authHeaders(this.token),
        });
        if (res?.success && res.data?.useProxy !== undefined) {
          this.useProxy = Boolean(res.data.useProxy);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gaskan_use_proxy', String(this.useProxy));
          }
          console.log('[SYSTEM SETTINGS SYNCED] useProxy =', this.useProxy);
        }
      } catch (err) {
        // Fallback silently
      }
    },

    async refreshSession() {
      try {
        const base = getApiBase(this.useProxy);
        const data = await $fetch(`${base}/api/auth/me`, {
          headers: authHeaders(this.token),
        });
        this.setSessionUser(data.user, data.token);
        this.initialized = true;
        // Sync proxy setting from DB in background (non-blocking)
        this.fetchSystemSettings();
        return data.user;
      } catch (error) {
        this.clearSessionUser();
        this.initialized = true;
        throw error;
      }
    },

    async fetchUserData(force = false) {
      if (this.userData && !force) return this.userData;
      if (!this.authenticated) return null;

      this.userLoading = true;
      try {
        const base = getApiBase(this.useProxy);
        const data = await $fetch(`${base}/api/user`, {
          headers: authHeaders(this.token),
        });
        this.userData = data;
        return data;
      } catch (error) {
        console.error("[AuthStore] Failed to fetch detailed user data:", error);
        return null;
      } finally {
        this.userLoading = false;
      }
    },

    async authenticateUser({ NIS, Password, force }) {
      try {
        // Login ALWAYS goes directly to real backend (no proxy for auth)
        const base = getApiBase(false);
        const data = await $fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Backend Zod schema expects: identifier (NIS/email) + password (lowercase)
          body: {
            identifier: NIS,
            password: Password,
            force,
          },
        });

        if (data?.user) {
          this.setSessionUser(data.user, data.token);
          // After login, sync proxy setting from DB
          this.fetchSystemSettings();
        }
      } catch (error) {
        this.loading = false;
        console.error("Authentication error:", error.data);
        const errorData = error.data;
        throw errorData;
      }
    },

    async logUserOut() {
      try {
        const base = getApiBase(false);
        await $fetch(`${base}/api/auth/logout`, {
          method: "POST",
          headers: authHeaders(this.token),
        }).catch((err) => {
          console.error("Logout API error:", err);
        });
      } finally {
        this.clearSessionUser();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    },
  }
});
