import { useAuthStore } from '~/store/useAuthStore';

export default defineNuxtPlugin((nuxtApp) => {
  // Simpan instance $fetch bawaan Nuxt
  const originalFetch = globalThis.$fetch;

  // Timpa dengan wrapper interceptor
  globalThis.$fetch = async (...args) => {
    try {
      // Jalankan request normal
      return await originalFetch(...args);
    } catch (error) {
      // Tangkap error jika statusnya 401 Unauthorized
      if (error.response && error.response.status === 401) {
        const router = useRouter();
        
        // Pastikan kita tidak mencegat 401 di halaman login (misal saat salah password)
        if (router.currentRoute.value.path !== '/login') {
          console.warn('Sesi habis (401 terdeteksi), mengarahkan ke halaman login...');
          
          // Bersihkan data sesi client. Session sebenarnya ada di cookie HttpOnly.
          useAuthStore().clearSessionUser();
          
          // Redirect ke login
          router.push('/login');
        }
      }
      
      // Lempar kembali errornya agar komponen yang memanggil (seperti useFetch) tetap bisa menanganinya
      throw error;
    }
  };
});
