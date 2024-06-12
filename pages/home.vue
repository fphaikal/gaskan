<script setup>
import { useAuthStore } from '~/store/useAuthStore'; // import the auth store we just created
const { logUserOut } = useAuthStore(); // use authenticateUser action from  auth store
const router = useRouter();
const logout = () => {
  logUserOut();
  router.push('/login');
};

useSeoMeta({
  title: 'Home | GASKAN',
  ogTitle: 'Home | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
})
</script>
<template>
  <div class="text-white">
    Test
  </div>
</template>