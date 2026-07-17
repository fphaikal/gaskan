<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRequestFetch } from '#app';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { role } = storeToRefs(useAuthStore());
const isAdminOrDev = computed(() => ['admin', 'developer', 'guru'].includes(role.value));
const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;

const log = ref([]);
let logInterval = null;

const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const refreshLog = async () => {
  if (!isAdminOrDev.value) return;

  try {
    log.value = await sessionFetch('/api/log/onsite');
  } catch (error) {
    console.error('Error fetching onsite log:', error);
  }
};

await refreshLog();

onMounted(() => {
  if (isAdminOrDev.value) {
    logInterval = setInterval(refreshLog, 5000);
  }
});

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval);
});

useSeoMeta({
  title: 'Log Onsite | GASKAN',
  ogTitle: 'Log Onsite | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/log/onsite',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/log/onsite',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Log Onsite | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/log/onsite`,
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 md:px-0 py-6">
    <div v-if="isAdminOrDev">
      
      <!-- Header Area -->
      <div class="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-extrabold tracking-tight text-base-content">Log On-Site</h1>
            <!-- Live Indicator -->
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span class="text-xs font-bold text-success uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p class="text-base-content/60 text-sm">Pemantauan aktivitas masuk area dengan auto-refresh aman</p>
        </div>
        <div class="flex items-center gap-2 text-sm font-semibold text-base-content bg-base-200/50 px-4 py-2 rounded-xl border border-base-300/50 shadow-sm">
          <Icon name="mingcute:group-fill" size="18" class="text-primary" />
          <span>{{ log.length }} Total Tercatat</span>
        </div>
      </div>

      <!-- Timeline Container -->
      <div class="bg-base-100 border border-base-200/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <!-- Empty State -->
        <div v-if="log.length === 0" class="flex flex-col items-center justify-center py-16 text-base-content/40">
          <div class="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-base-200/50 border border-base-300/50">
            <Icon name="mingcute:radar-line" size="32" class="animate-spin-slow opacity-50" />
          </div>
          <p class="font-medium text-lg">Menunggu data masuk...</p>
          <p class="text-sm mt-1 opacity-70">Sistem siap menangkap log berikutnya.</p>
        </div>
        
        <!-- Timeline State -->
        <div v-else class="relative border-l-2 border-base-200/80 ml-3 md:ml-4">
          <TransitionGroup name="list" tag="div" class="flex flex-col gap-6">
            <div v-for="(l, index) in log" :key="l.id || l.NIS || index" class="relative pl-6 md:pl-8 group">
              <!-- Timeline Dot -->
              <div class="absolute -left-[9px] top-4 flex h-4 w-4 items-center justify-center rounded-full bg-base-100 border-2 border-primary ring-4 ring-base-100 transition-transform group-hover:scale-125"></div>
              
              <!-- Card -->
              <div class="bg-base-100 hover:bg-base-200/30 border border-base-200/60 rounded-2xl p-4 transition-all duration-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-md flex flex-col sm:flex-row sm:items-center gap-4">
                
                <!-- Time Badge -->
                <div class="shrink-0 flex items-center justify-center bg-base-200/70 text-base-content/80 rounded-xl px-3 py-2 border border-base-300/50 w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon name="mingcute:time-fill" size="18" class="mr-2" />
                  <time class="text-sm font-mono font-bold tracking-tight">
                    {{ new Date(l.time_enter).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
                  </time>
                  <span class="ml-2 text-xs font-semibold uppercase opacity-60">WIB</span>
                </div>

                <!-- Photo Avatar -->
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative flex items-center justify-center">
                  <img :src="l.Image || 'https://api.tierkun.my.id/file/picture/0000.png'" alt="avatar" class="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300" @click="openImagePreview(l.Image || 'https://api.tierkun.my.id/file/picture/0000.png')" />
                  <div class="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl"></div>
                </div>
                
                <!-- User Info -->
                <div class="flex-1 flex flex-col">
                  <h3 class="text-lg font-bold text-base-content">{{ l.Nama || 'Tanpa Nama' }}</h3>
                  <div class="flex items-center gap-3 mt-1 text-xs text-base-content/50 font-semibold uppercase tracking-wider">
                    <span v-if="l.NIS" class="flex items-center gap-1.5"><Icon name="mingcute:idcard-fill" size="14"/> {{ l.NIS }}</span>
                    <span v-if="l.NIS && l.Kelas" class="opacity-40">&bull;</span>
                    <span v-if="l.Kelas" class="flex items-center gap-1.5"><Icon name="mingcute:book-2-fill" size="14"/> {{ l.Kelas }}</span>
                  </div>
                </div>
                
                <!-- Status Action / Tag -->
                <div class="shrink-0 flex sm:flex-col items-end gap-2 sm:gap-1 mt-2 sm:mt-0">
                  <div class="px-3 py-1.5 text-xs font-bold text-success bg-success/10 rounded-lg border border-success/20 uppercase tracking-widest inline-flex items-center gap-1.5">
                    <Icon name="mingcute:check-circle-fill" size="14"/>
                    On-Site
                  </div>
                </div>

              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
    
    <!-- Unauthorized State -->
    <div v-else class="min-h-[70vh] flex flex-col items-center justify-center text-center gap-6">
      <div class="relative w-48 h-48 mb-4 group">
        <div class="absolute inset-0 bg-error/20 rounded-full blur-3xl group-hover:bg-error/30 transition-colors duration-500"></div>
        <img :src="'/404_1.svg'" class="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" alt="Not Found">
      </div>
      <div>
        <h1 class="text-4xl font-extrabold text-base-content mb-3 tracking-tight">Akses Ditolak</h1>
        <p class="text-base-content/60 text-lg max-w-md mx-auto leading-relaxed">Anda tidak memiliki hak akses (Admin/Developer) untuk melihat log on-site real-time.</p>
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
  transform: translateX(-40px) scale(0.95);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

