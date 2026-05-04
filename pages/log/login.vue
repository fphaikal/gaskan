<script setup>
import { computed, ref } from 'vue';
import { useRequestFetch } from '#app';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { role } = storeToRefs(useAuthStore());
const isAdminOrDev = computed(() => ['admin', 'developer'].includes(role.value));
const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;
const log = ref(null);

if (isAdminOrDev.value) {
  log.value = await sessionFetch('/api/log/login');
}

useSeoMeta({
  title: 'Log Login | GASKAN',
  ogTitle: 'Log Login | GASKAN',
  description: 'Log riwayat akses login pengguna',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/log/login',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/log/login',
  ogDescription: 'Log riwayat akses login pengguna',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Log Login | GASKAN`,
  twitterDescription: `Log riwayat akses login pengguna`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/log/login`,
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-0 py-6">
    
    <!-- Admin/Developer View -->
    <div v-if="isAdminOrDev">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-base-content mb-2 flex items-center gap-3">
            Log Sistem (Login)
          </h1>
          <p class="text-base-content/60 text-sm">Pemantauan riwayat aktivitas akses sistem pengguna</p>
        </div>
      </div>

      <div v-if="!log || log.length === 0" class="bg-base-100 border border-base-200/60 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-base-content/40">
        <div class="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-base-200/50 border border-base-300/50">
            <Icon name="mingcute:history-line" size="32" class="opacity-50" />
        </div>
        <p class="font-medium text-lg">Belum ada riwayat akses terbaru.</p>
      </div>

      <div v-else class="space-y-12">
        <div v-for="l in log" :key="l.tanggal" class="relative">
          <!-- Date Header -->
          <div class="sticky top-[64px] z-10 bg-base-100/95 backdrop-blur-md py-4 mb-4 flex items-center gap-4 border-b border-base-200/50">
            <div class="h-8 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
            <h2 class="text-2xl font-extrabold text-base-content tracking-tight">{{ l.tanggal }}</h2>
          </div>
          
          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div v-for="d in l.data" :key="d.timestamp" class="bg-base-100 border border-base-200/80 hover:border-primary/30 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 group cursor-default">
              
              <div class="flex gap-4 items-start">
                <div class="relative w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                  <Icon name="mingcute:key-2-fill" size="24" class="group-hover:scale-110 transition-transform duration-500" />
                  <div class="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold text-base-content truncate group-hover:text-primary transition-colors">{{ d.Nama }}</h3>
                  <p class="text-[11px] font-bold text-base-content/40 uppercase tracking-widest truncate">{{ d.Kelas }}</p>
                </div>
              </div>

              <div class="flex items-center justify-between border-t border-base-200/60 pt-3">
                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border bg-info/10 text-info border-info/20 shadow-[0_0_10px_rgba(var(--info),0.1)]">
                  {{ d.action || 'LOGIN' }}
                </span>
                <span class="text-xs font-mono font-bold text-base-content/60 bg-base-200/50 px-2 py-1 border border-base-300/50 rounded-lg">
                  {{ formatLongDate(d.timestamp).split(' ').slice(1).join(' ') || formatLongDate(d.timestamp) }}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Unauthorized View -->
    <div v-else class="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      <div class="relative">
        <div class="absolute inset-0 bg-error/20 blur-3xl rounded-full"></div>
        <Icon name="mingcute:lock-fill" size="120" class="text-error relative z-10 drop-shadow-[0_0_15px_rgba(var(--error),0.5)]" />
      </div>
      <div class="max-w-md">
        <h1 class="text-4xl font-black text-base-content mb-3 tracking-tight">Akses Ditolak</h1>
        <p class="text-base-content/60 font-medium mb-8">Halaman ini dikhususkan untuk Administrator. Anda tidak memiliki izin untuk melihat log akses sistem.</p>
        <NuxtLink to="/home" class="btn btn-primary hover:scale-105 transition-transform shadow-lg shadow-primary/30 rounded-2xl px-8">
          <Icon name="mingcute:home-3-fill" size="20" class="mr-2" />
          Kembali ke Beranda
        </NuxtLink>
      </div>
    </div>
    
  </div>
</template>
