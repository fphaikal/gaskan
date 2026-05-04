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
    },

    async refreshSession() {
      try {
        const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;
        const data = await sessionFetch("/api/auth/me");
        this.setSessionUser(data.user);
        return data.user;
      } catch (error) {
        this.clearSessionUser();
        throw error;
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
        console.error("Authentication error:", error);
        const errorData = error.data;
        throw errorData;
      }
    },

    async logUserOut() {
      try {
        await $fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        this.clearSessionUser();

        // Redirect to login manually since router cannot be used here safely
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  }
});

