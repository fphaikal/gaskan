import { defineStore } from "pinia";
import { useStorage } from '@vueuse/core'

export const useAuthStore = defineStore("auth", {
  state: () => ({
    authenticated: false,
    loading: false,
  }),
  actions: {
    async authenticateUser({ NIS, Password, force }) {
      try {
        // useFetch from nuxt 3
        const  data  = await $fetch('https://api.tierkun.my.id/api/login', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: {
            NIS,
            Password,
            force,
          },
        });

        console.log(data);
        if (data) {
          const token = useCookie('token'); // useCookie new hook in nuxt 3
          token.value = data?.sessionId; // set token to cookie
          this.authenticated = true; // set authenticated  state value to true
          console.log(data);
          const nis = useStorage('nis', data.NIS, localStorage)
          const role = useStorage('role', data.Kelas, localStorage)
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

      try {
        const token = useCookie('token'); // useCookie new hook in nuxt 3
        const data = await $fetch('https://api.tierkun.my.id/api/logout', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: { sessionId: token.value },
        });

        if (data) {
          this.authenticated = false; // set authenticated  state value to false
          token.value = null; // clear the token cookie
          const nis = useStorage('nis')
          const role = useStorage('role')
          nis.value = null;
          role.value = null;
          router.push("/login");
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  },
});