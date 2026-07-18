<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRequestFetch } from '#app';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { role } = storeToRefs(useAuthStore());
const isAdminOrDev = computed(() => ['admin', 'developer'].includes(role.value));
const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;

const errorResponse = ref(null);
let errInterval = null;

const currentPage = ref(1);
const itemsPerPage = ref(20); // Show 20 records per page

const totalPages = computed(() => {
  if (!errorResponse.value?.pagination) return 0;
  return Math.ceil(errorResponse.value.pagination.total / itemsPerPage.value);
});

const paginatedErr = computed(() => {
  return errorResponse.value?.data || [];
});

const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const refreshErrorLog = async () => {
  if (!isAdminOrDev.value) return;

  try {
    errorResponse.value = await sessionFetch(`/api/log/error?page=${currentPage.value}&limit=${itemsPerPage.value}`);
  } catch (error) {
    console.error('Error fetching error log:', error);
  }
};

watch([currentPage, itemsPerPage], refreshErrorLog);

await refreshErrorLog();

onMounted(() => {
  if (isAdminOrDev.value) {
    errInterval = setInterval(refreshErrorLog, 5000);
  }
});

onUnmounted(() => {
  if (errInterval) clearInterval(errInterval);
});

useSeoMeta({
  title: 'Log Error | GASKAN',
  ogTitle: 'Log Error | GASKAN',
  description: 'Log riwayat error dan anomali sistem',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/log/error',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/log/error',
  ogDescription: 'Log riwayat error dan anomali sistem',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Log Error | GASKAN`,
  twitterDescription: `Log riwayat error dan anomali sistem`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/log/error`,
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-0 py-6">
    <!-- Developer/Admin View -->
    <div v-if="isAdminOrDev">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-base-content mb-2 flex items-center gap-3">
            Log Sistem (Error)
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/10 border border-error/20">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
              </span>
              <span class="text-xs font-bold text-error uppercase tracking-wider">Live</span>
            </div>
          </h1>
          <p class="text-base-content/60 text-sm">Pemantauan aktivitas anomali dan error sistem dengan auto-refresh aman</p>
        </div>
      </div>

      <div v-if="!errorResponse || paginatedErr.length === 0" class="bg-base-100 border border-base-200/60 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-base-content/40">
        <div class="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-base-200/50 border border-base-300/50">
            <Icon name="mingcute:bug-line" size="32" class="opacity-50" />
        </div>
        <p class="font-medium text-lg">Sistem berjalan normal. Belum ada error tercatat.</p>
      </div>

      <div v-else class="space-y-12">
        <TransitionGroup name="list" tag="div" class="space-y-10">
          <div v-for="l in paginatedErr" :key="l.tanggal" class="relative">
            <!-- Date Header -->
            <div class="sticky top-[64px] z-10 bg-base-100/95 backdrop-blur-md py-4 mb-4 flex items-center gap-4 border-b border-base-200/50">
              <div class="h-8 w-1.5 rounded-full bg-error shadow-[0_0_10px_rgba(var(--error),0.5)]"></div>
              <h2 class="text-2xl font-extrabold text-base-content tracking-tight">{{ l.tanggal }}</h2>
            </div>
            
            <!-- Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div v-for="d in l.data" :key="d.timestamp" class="bg-base-100 border border-base-200/80 hover:border-error/30 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 group cursor-default relative overflow-hidden">
                
                <!-- Background subtle glow -->
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-colors"></div>

                <div class="flex gap-4 items-start relative z-10">
                  <div class="relative w-12 h-12 rounded-2xl overflow-hidden bg-error/10 text-error flex items-center justify-center shrink-0 shadow-inner">
                    <Icon name="mingcute:warning-fill" size="24" class="group-hover:scale-110 transition-transform duration-500" />
                    <div class="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-base font-bold text-base-content line-clamp-2 leading-tight group-hover:text-error transition-colors">{{ d.msg }}</h3>
                    <p class="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mt-1 truncate">{{ d.Kelas || 'Sistem' }}</p>
                  </div>
                </div>

                <!-- Captured Scan Photo -->
                <div v-if="d.image" class="w-full h-32 rounded-2xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative flex items-center justify-center z-10">
                  <img :src="d.image" alt="Captured face" class="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300" @click="openImagePreview(d.image)" />
                  <div class="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                </div>

                <div class="flex items-center justify-between border-t border-base-200/60 pt-3 relative z-10">
                  <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border bg-error/10 text-error border-error/20 shadow-[0_0_10px_rgba(var(--error),0.1)]">
                    ERR: {{ d.code || 'UNKNOWN' }}
                  </span>
                  <span class="text-xs font-mono font-bold text-base-content/60 bg-base-200/50 px-2 py-1 border border-base-300/50 rounded-lg">
                    {{ formatLongDate(d.timestamp, false, true) }}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </TransitionGroup>

        <UIPagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="errorResponse?.pagination?.total || 0"
          :itemsPerPage="itemsPerPage"
          :perPageOptions="[10, 20, 50]"
          itemLabel="log error"
          @update:currentPage="currentPage = $event"
          @update:itemsPerPage="itemsPerPage = $event; currentPage = 1"
        />
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
        <p class="text-base-content/60 font-medium mb-8">Halaman ini dikhususkan untuk Admin dan Developer. Anda tidak memiliki izin untuk melihat log error sistem.</p>
        <NuxtLink to="/home" class="btn btn-primary hover:scale-105 transition-transform shadow-lg shadow-primary/30 rounded-2xl px-8">
          <Icon name="mingcute:home-3-fill" size="20" class="mr-2" />
          Kembali ke Beranda
        </NuxtLink>
      </div>
    </div>
  </div>

  <!-- ═══ IMAGE PREVIEW MODAL (LIGHTBOX) ═══ -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="activePreviewImage" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4" @click="closeImagePreview">
        <button class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors btn btn-ghost btn-circle">
          <Icon name="mingcute:close-line" size="28" />
        </button>
        <img :src="activePreviewImage" class="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10" @click.stop />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Transition Group Animations for live data */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
