import { defineStore } from "pinia";

const REAL_API_BASE = 'https://gaskan-api.smtijogja.my.id';

// Helper: get current API base based on proxy setting
function getDirectBase() {
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
        const base = getDirectBase();
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
        const base = getDirectBase();
        const res = await $fetch(`${base}/api/system/settings`, {
          headers: authHeaders(this.token),
        });
        if (res?.success && res.data?.useProxy !== undefined) {
          this.useProxy = Boolean(res.data.useProxy);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gaskan_use_proxy', String(this.useProxy));
          }
        }
      } catch (err) {
        // Fallback silently
      }
    },

    async refreshSession() {
      // auth/me goes through Nitro server (session cookie based)
      try {
        const data = await $fetch("/api/auth/me");
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
        // Direct to real backend for content data
        const base = getDirectBase();
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
      // Login goes through Nuxt Nitro server handler (server/api/auth/login.post.js)
      // which handles: field mapping (NIS → identifier), session cookie, etc.
      try {
        const data = await $fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { NIS, Password, force },
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
      // Logout through Nitro to clear session cookie
      try {
        await $fetch("/api/auth/logout", {
          method: "POST",
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
