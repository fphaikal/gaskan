<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

useSeoMeta({
  title: 'Dokumentasi Backend API | GASKAN',
  description: 'Dokumentasi Terproteksi Resmi Backend API GASKAN SMK SMTI Yogyakarta',
});

const config = useRuntimeConfig();
const authStore = useAuthStore();
const { role, userData } = storeToRefs(authStore);

const isDev = computed(() => role.value === 'developer');
const isAdmin = computed(() => role.value === 'admin' || isDev.value);
const isGuru = computed(() => role.value === 'guru');

const iframeUrl = ref('');
const token = ref('');

onMounted(() => {
  // Get token from authStore or cookie
  const storedToken = useCookie('auth_token').value || localStorage.getItem('token') || '';
  token.value = storedToken;

  const baseUrl = (config.public.apiBase || 'https://gaskan-api.smtijogja.my.id').replace(/\/+$/, '');
  iframeUrl.value = `${baseUrl}/docs?token=${encodeURIComponent(storedToken)}`;
});

const openNewTab = () => {
  if (iframeUrl.value) {
    window.open(iframeUrl.value, '_blank');
  }
};
</script>

<template>
  <div class="space-y-4 pb-12 flex flex-col h-[calc(100vh-5rem)]">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-[#161b22] via-[#1f242d] to-[#0d1117] rounded-3xl p-5 border border-base-200/80 shadow-xl flex flex-wrap items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner shrink-0">
          ⚡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-black text-lg text-white leading-tight">Dokumentasi Backend API Terproteksi</h1>
            <span class="badge badge-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[9px]">LIVE OpenAPI 3.0</span>
          </div>
          <p class="text-xs font-semibold text-base-content/60 mt-0.5">
            Gerbang Akses Pintar dan Kehadiran · SMK SMTI Yogyakarta
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="openNewTab" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black gap-1.5 shadow-sm">
          <Icon name="mingcute:external-link-line" size="14" />
          Buka di Tab Baru ↗
        </button>
      </div>
    </div>

    <!-- Embedded Protected Viewer -->
    <div class="flex-1 bg-base-100 rounded-3xl border border-base-200/80 shadow-2xl overflow-hidden relative min-h-0">
      <iframe v-if="iframeUrl"
              :src="iframeUrl"
              class="w-full h-full border-0 rounded-3xl"
              allow="clipboard-write"
              title="GASKAN Backend API Documentation">
      </iframe>
      <div v-else class="flex flex-col items-center justify-center h-full opacity-40">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-xs font-black uppercase tracking-widest mt-3">Memuat Dokumentasi API Backend...</p>
      </div>
    </div>
  </div>
</template>
