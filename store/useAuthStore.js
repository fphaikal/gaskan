import { defineStore } from "pinia";
import { useStorage } from "@vueuse/core";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authenticated: false,
    loading: false,
    nis: null,
  }),
  persist: true,
  actions: {
    async authenticateUser({ NIS, Password, force }) {
      const config = useRuntimeConfig(); // get runtime config

      try {
        // useFetch from nuxt 3
        const data = await $fetch(config.public.apiBase + "/api/login", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: {
            NIS,
            Password,
            force,
          },
        });

        if (data) {
          const token = useCookie("token", { maxAge: 3600 }); // set token to expire in 1 hour
          token.value = data?.sessionId; // set token to cookie
          this.authenticated = true; // set authenticated state value to true
          this.nis = data.NIS;
          console.log(data);

          // FIX: Must assign .value to actually write to localStorage.
          // useStorage("_id", defaultValue) only sets a default — it won't
          // overwrite an existing key, causing stale roles from previous sessions.
          const roleStorage = useStorage("_id");
          if (data.Kelas === "admin") {
            roleStorage.value = config.public.ADMIN_KEY;
          } else if (data.Kelas === "developer") {
            roleStorage.value = config.public.DEVELOPER_KEY;
          } else {
            roleStorage.value = data.Kelas;
          }
          // NOTE: Session expiry cleanup is now handled by the global auth
          // middleware on every navigation. The unreliable setTimeout has been
          // removed because it is lost on page refresh/tab close.
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
      const router = useRouter();
      const config = useRuntimeConfig(); // get runtime config

      try {
        const token = useCookie("token"); // useCookie new hook in nuxt 3
        await $fetch(config.public.apiBase + "/api/logout", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: { sessionId: token.value },
        });
        this.authenticated = false; // set authenticated state value to false
        token.value = null; // clear the token cookie
        const nis = useStorage("nis");
        const role = useStorage('_id');
        nis.value = null;
        role.value = null;
        router.push("/login");

      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  },
});
