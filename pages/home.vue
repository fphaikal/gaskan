<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRequestFetch } from '#app';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';
import DashboardAdmin from '~/components/Dashboard/DashboardAdmin.vue';
import DashboardSiswa from '~/components/Dashboard/DashboardSiswa.vue';

const authStore = useAuthStore();
const { nis, role: sessionRole } = storeToRefs(authStore);
const sessionFetch = $fetch;

const currentRole = computed(() => sessionRole.value || 'siswa');
const isAdminOrDev = computed(() => ['admin', 'developer', 'guru'].includes(currentRole.value));
const isDeveloper = computed(() => currentRole.value === 'developer');

const { userData: user, userLoading } = storeToRefs(authStore);

// Use centralized fetcher
if (authStore.authenticated) {
  await authStore.fetchUserData();
} else {
  const unwatch = watch(() => authStore.authenticated, async (newVal) => {
    if (newVal) {
      await authStore.fetchUserData();
      unwatch();
    }
  });
}

const count = ref(null);
const login = ref(null);

if (isAdminOrDev.value) {
  try { count.value = await sessionFetch('/api/count'); } catch {}
  try { login.value = await sessionFetch('/api/log/login'); } catch {}
}

const system = ref(null);
let systemInterval = null;

const refreshSystem = async () => {
  if (!isAdminOrDev.value) return;

  try {
    const res = await sessionFetch('/api/system/metrics');
    system.value = res?.data || res;
  } catch (error) {
    console.error('Error fetching system data:', error);
  }
};

onMounted(async () => {
  if (isAdminOrDev.value) {
    await refreshSystem();
    systemInterval = setInterval(refreshSystem, 10000);
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
      :login="login?.data || []" 
      :system="system" 
    />
    
    <!-- Render Dashboard Siswa -->
    <DashboardSiswa 
      v-else-if="user" 
      :user="user" 
    />

    <!-- Loading State -->
    <div v-else-if="userLoading" class="flex items-center justify-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error State (no user found) -->
    <div v-else class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Icon name="mingcute:warning-fill" class="text-5xl text-warning" />
      <p class="text-base-content/70">Gagal memuat profil. Silakan coba login ulang.</p>
    </div>
  </div>
</template>
