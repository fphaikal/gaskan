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
    initialized: false,
    userData: null,
    userLoading: false,
  }),
  actions: {
    setSessionUser(user) {
      this.authenticated = true;
      this.nis = user?.nis || null;
      this.role = user?.role || null;
      this.kelas = user?.kelas || null;
      this.nama = user?.nama || null;
    },

    clearSessionUser() {
      this.authenticated = false;
      this.nis = null;
      this.role = null;
      this.kelas = null;
      this.nama = null;
      this.userData = null;
    },

    async refreshSession() {
      try {
        const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;
        const data = await sessionFetch("/api/auth/me");
        this.setSessionUser(data.user);
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
          this.setSessionUser(data.user);
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
        this.clearSessionUser();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        $fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  }
});
