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
          const token = useCookie("token"); // useCookie new hook in nuxt 3
          token.value = data?.sessionId; // set token to cookie
          this.authenticated = true; // set authenticated  state value to true
          this.nis = data.NIS;
          console.log(data);
          
          if (data.Kelas === "admin") {
            useStorage("_id", config.public.ADMIN_KEY, localStorage);
          } else if (data.Kelas === "developer") {
            useStorage("_id", config.public.DEVELOPER_KEY, localStorage);
          } else {
            useStorage("_id", data.Kelas, localStorage);
          }
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
        this.authenticated = false; // set authenticated  state value to false
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
