<script setup>
import { useAuthStore } from '~/store/useAuthStore'; // import the auth store we just created
const { logUserOut } = useAuthStore(); // use authenticateUser action from  auth store
const router = useRouter();
const logout = () => {
  logUserOut();
  router.push('/login');
};


</script>
<template>
  <div class="text-white">
    Test
  </div>
</template>