import { defineStore } from "pinia";
import { useRequestFetch } from "#app";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authenticated: false,
    loading: false,
    nis: null,
    role: null,
    kelas: null,
    nama: null,
    token: typeof localStorage !== 'undefined' ? localStorage.getItem('gaskan_jwt_token') || null : null,
    useProxy: typeof localStorage !== 'undefined' ? localStorage.getItem('gaskan_use_proxy') === 'true' : false, // Default: false (Direct Real API mode for max speed)
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

    toggleProxy(value) {
      this.useProxy = value !== undefined ? Boolean(value) : !this.useProxy;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gaskan_use_proxy', String(this.useProxy));
      }
      return this.useProxy;
    },

    async refreshSession() {
      try {
        const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;
        const data = await sessionFetch("/api/auth/me");
        this.setSessionUser(data.user, data.token);
        this.initialized = true;
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
        const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;
        const data = await sessionFetch("/api/user");
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
        const data = await $fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            NIS,
            Password,
            force,
          },
        });

        if (data?.user) {
          this.setSessionUser(data.user, data.token);
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
        // Panggil endpoint logout secara synchronous (ditunggu) agar cookie terhapus sebelum redirect
        await $fetch("/api/auth/logout", { method: "POST" }).catch((err) => {
          console.error("Logout API error:", err);
        });
      } finally {
        // Bersihkan state di Pinia
        this.clearSessionUser();
        
        // Redirect ke halaman login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    },
  }
});
