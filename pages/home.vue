<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { useStorage } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import DashboardAdmin from '~/components/Dashboard/DashboardAdmin.vue';
import DashboardSiswa from '~/components/Dashboard/DashboardSiswa.vue';

const config = useRuntimeConfig();
const authStore = useAuthStore();
const { nis } = storeToRefs(authStore);

const getRole = useStorage('_id');

const role = () => {
  if (getRole.value === config.public.ADMIN_KEY) return 'admin';
  if (getRole.value === config.public.DEVELOPER_KEY) return 'developer';
  return 'siswa';
};

const isAdminOrDev = computed(() => ['admin', 'developer'].includes(role()));

// Fetch Data
const { data: user } = await useFetch(`/api/user?role=${role()}&user=${nis.value}`);
const { data: count } = await useFetch(`/api/count`);
const { data: login } = await useFetch('/api/log/login');

const system = ref(null);
const socket = ref(null);

onMounted(async () => {
  if (isAdminOrDev.value) {
    socket.value = new WebSocket('wss://api.tierkun.my.id/system');
    socket.value.onopen = () => console.log('Connected to WebSocket server');
    socket.value.onmessage = async (event) => {
      try {
        system.value = await JSON.parse(event.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    socket.value.onclose = () => console.log('Disconnected from WebSocket server');
  }
});

onBeforeUnmount(() => {
  if (socket.value) socket.value.close();
});

useSeoMeta({
  title: 'Home | GASKAN',
  description: 'Dashboard Gerbang Akses Pintar dan Kehadiran',
});
</script>

<template>
  <div>
    <!-- Render Dashboard Admin/Dev -->
    <DashboardAdmin 
      v-if="user && isAdminOrDev" 
      :count="count" 
      :login="login" 
      :system="system" 
    />
    
    <!-- Render Dashboard Siswa -->
    <DashboardSiswa 
      v-else-if="user" 
      :user="user" 
    />

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>
