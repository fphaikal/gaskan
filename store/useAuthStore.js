import { defineStore } from "pinia";

const isClient = typeof localStorage !== 'undefined';

const getInitialData = () => {
  if (!isClient) return { token: null, user: null, role: null, nis: null, nama: null, kelas: null, userData: null };
  const token = localStorage.getItem('gaskan_jwt_token');
  const role = localStorage.getItem('gaskan_user_role');
  const nis = localStorage.getItem('gaskan_user_nis');
  const nama = localStorage.getItem('gaskan_user_nama');
  const kelas = localStorage.getItem('gaskan_user_kelas');
  let userData = null;
  try {
    const raw = localStorage.getItem('gaskan_user_data');
    if (raw) userData = JSON.parse(raw);
  } catch {}

  return {
    authenticated: Boolean(token || role),
    token: token || null,
    role: role || null,
    nis: nis || null,
    nama: nama || null,
    kelas: kelas || null,
    userData: userData || null,
  };
};

const initial = getInitialData();

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authenticated: initial.authenticated || false,
    loading: false,
    nis: initial.nis || null,
    role: initial.role || null,
    kelas: initial.kelas || null,
    nama: initial.nama || null,
    token: initial.token || null,
    useProxy: false,
    initialized: false,
    userData: initial.userData || null,
    userLoading: false,
  }),
  actions: {
    setSessionUser(user, token = null) {
      this.authenticated = true;
      this.nis = user?.nis || null;
      this.role = user?.role || null;
      this.kelas = user?.kelas || null;
      this.nama = user?.nama || null;

      if (isClient) {
        if (user?.nis) localStorage.setItem('gaskan_user_nis', String(user.nis));
        if (user?.role) localStorage.setItem('gaskan_user_role', String(user.role));
        if (user?.kelas) localStorage.setItem('gaskan_user_kelas', String(user.kelas));
        if (user?.nama) localStorage.setItem('gaskan_user_nama', String(user.nama));
      }

      if (token) {
        this.token = token;
        if (isClient) {
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
      if (isClient) {
        localStorage.removeItem('gaskan_jwt_token');
        localStorage.removeItem('gaskan_user_nis');
        localStorage.removeItem('gaskan_user_role');
        localStorage.removeItem('gaskan_user_kelas');
        localStorage.removeItem('gaskan_user_nama');
        localStorage.removeItem('gaskan_user_data');
      }
    },

    async toggleProxy(value) {
      const newValue = value !== undefined ? Boolean(value) : !this.useProxy;
      this.useProxy = newValue;
      if (isClient) {
        localStorage.setItem('gaskan_use_proxy', String(newValue));
      }
      try {
        await $fetch('/api/system/settings', {
          method: 'POST',
          body: { useProxy: newValue }
        });
        console.log('[SYSTEM PROXY SETTING SAVED TO DATABASE]:', newValue);
      } catch (err) {
        console.warn('Gagal menyimpan pengaturan proxy ke server DB:', err);
      }
      return this.useProxy;
    },

    async fetchSystemSettings() {
      try {
        const res = await $fetch('/api/system/settings');
        if (res?.success && res.data?.useProxy !== undefined) {
          this.useProxy = Boolean(res.data.useProxy);
          if (isClient) {
            localStorage.setItem('gaskan_use_proxy', String(this.useProxy));
          }
        }
      } catch (err) {
        // Fallback silently if unauthenticated
      }
    },

    async refreshSession() {
      try {
        const fetcher = useRequestFetch();
        const data = await fetcher("/api/auth/me");
        if (data?.user) {
          this.setSessionUser(data.user, data.token);
        }
        this.initialized = true;
        this.fetchSystemSettings();
        return this.authenticated ? { role: this.role } : null;
      } catch (error) {
        // Only clear if status is 401 (explicitly unauthorized session)
        if (error?.response?.status === 401 || error?.statusCode === 401) {
          this.clearSessionUser();
        }
        this.initialized = true;
        return this.authenticated ? { role: this.role } : null;
      }
    },

    async fetchUserData(force = false) {
      if (this.userData && !force) return this.userData;
      if (!this.authenticated) return null;

      this.userLoading = true;
      try {
        const fetcher = useRequestFetch();
        const data = await fetcher("/api/user");
        if (data) {
          this.userData = data;
          if (isClient) {
            localStorage.setItem('gaskan_user_data', JSON.stringify(data));
          }
        }
        return data;
      } catch (error) {
        console.error("[AuthStore] Failed to fetch detailed user data:", error);
        return this.userData;
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
        await $fetch("/api/auth/logout", { method: "POST" }).catch((err) => {
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
