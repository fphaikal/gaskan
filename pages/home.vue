<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRequestFetch } from '#app';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';
import DashboardAdmin from '~/components/Dashboard/DashboardAdmin.vue';
import DashboardSiswa from '~/components/Dashboard/DashboardSiswa.vue';

const authStore = useAuthStore();
const { nis, role: sessionRole } = storeToRefs(authStore);
const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;

const currentRole = computed(() => sessionRole.value || 'siswa');
const isAdminOrDev = computed(() => ['admin', 'developer'].includes(currentRole.value));
const isDeveloper = computed(() => currentRole.value === 'developer');

// Fetch Data
const { data: user } = await useFetch(
  computed(() => `/api/user?role=${currentRole.value}&user=${nis.value}`)
);

const count = ref(null);
const login = ref(null);

if (isAdminOrDev.value) {
  count.value = await sessionFetch('/api/count');
  login.value = await sessionFetch('/api/log/login');
}

const system = ref(null);
let systemInterval = null;

const refreshSystem = async () => {
  if (!isDeveloper.value) return;

  try {
    system.value = await sessionFetch('/api/dev/system');
  } catch (error) {
    console.error('Error fetching system data:', error);
  }
};

onMounted(async () => {
  if (isDeveloper.value) {
    await refreshSystem();
    systemInterval = setInterval(refreshSystem, 5000);
  }
});

onBeforeUnmount(() => {
  if (systemInterval) clearInterval(systemInterval);
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

