<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const { role } = storeToRefs(useAuthStore());
const isAdminOrDev = computed(() => ['admin', 'developer', 'guru'].includes(role.value));

const page = ref(1);
const limit = ref(50);
const search = ref('');
const dateFilter = ref('');

// Modal state
const showDetail = ref(false);
const selectedLog = ref(null);
const locationInfo = ref(null);
const locationLoading = ref(false);

const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const openDetail = async (log) => {
  selectedLog.value = log;
  showDetail.value = true;
  locationInfo.value = null;
  
  const ip = log.details?.ip;
  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    locationLoading.value = true;
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await res.json();
      if (data.status === 'success') {
        locationInfo.value = `${data.city}, ${data.regionName}, ${data.country}`;
      } else {
        locationInfo.value = 'Lokasi tidak ditemukan';
      }
    } catch (e) {
      locationInfo.value = 'Gagal memuat lokasi';
    } finally {
      locationLoading.value = false;
    }
  } else if (ip === '::1' || ip === '127.0.0.1') {
    locationInfo.value = 'Localhost (Internal)';
  }
};

const { data: logResponse, refresh, pending, error: asyncError } = await useAsyncData(
  'logs-login',
  () => $fetch('/api/log/login', {
    params: { 
      page: page.value, 
      limit: limit.value,
      search: search.value,
      date: dateFilter.value
    }
  }).catch(e => {
    console.error('[FETCH LOGS ERROR]', e);
    return { data: [], pagination: { total: 0 } };
  }),
  {
    watch: [page, limit, search, dateFilter],
    immediate: isAdminOrDev.value
  }
);

// No grouping anymore as per user request
const flatLogs = computed(() => logResponse.value?.data || []);

const formatDateRow = (isoString) => {
  if (!isoString) return '-';
  return format(parseISO(isoString), 'd MMM yyyy', { locale: id });
};

const totalPages = computed(() => {
  if (!logResponse.value?.pagination) return 0;
  return Math.ceil(logResponse.value.pagination.total / limit.value);
});

const formatTime = (isoString) => {
  return format(parseISO(isoString), 'HH:mm:ss');
};

useSeoMeta({
  title: 'Log Login | GASKAN',
  description: 'Log riwayat akses login pengguna',
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-0 py-6">
    
    <!-- Admin/Developer View -->
    <div v-if="isAdminOrDev">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div class="flex-1">
          <h1 class="text-3xl font-extrabold tracking-tight text-base-content mb-2 flex items-center gap-3">
            Log Sistem (Login)
          </h1>
          <p class="text-base-content/60 text-sm">Pemantauan riwayat aktivitas akses sistem pengguna</p>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <!-- Search Input -->
          <div class="relative w-full sm:w-64">
            <Icon name="mingcute:search-line" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30" />
            <input 
              v-model="search"
              type="text" 
              placeholder="Cari NIS/Nama..." 
              class="input input-bordered w-full pl-11 rounded-2xl bg-base-100"
            />
          </div>

          <!-- Date Filter -->
          <div class="relative w-full sm:w-auto">
            <input 
              v-model="dateFilter"
              type="date" 
              class="input input-bordered w-full sm:w-44 rounded-2xl bg-base-100 [color-scheme:dark]"
            />
          </div>

          <!-- Limit Selector -->
          <div class="flex items-center gap-1 bg-base-100 p-1 rounded-2xl border border-base-200">
             <button 
              v-for="l in [20, 50, 100]" :key="l"
              @click="limit = l; page = 1"
              :class="['btn btn-sm rounded-xl px-4 border-none shadow-none', limit === l ? 'btn-primary' : 'btn-ghost']"
             >
              {{ l }}
             </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="flex flex-col items-center justify-center py-20 gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/50 font-medium">Memuat data log...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!logResponse?.data || logResponse.data.length === 0" class="bg-base-100 border border-base-200/60 rounded-[2.5rem] p-16 shadow-sm flex flex-col items-center justify-center text-base-content/40">
        <div class="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-base-200/50 border border-base-300/50">
            <Icon name="mingcute:history-line" size="32" class="opacity-50" />
        </div>
        <p class="font-medium text-lg">{{ search || dateFilter ? 'Tidak ada data yang cocok dengan filter.' : 'Belum ada riwayat akses terbaru.' }}</p>
        <button v-if="search || dateFilter" @click="search = ''; dateFilter = ''" class="btn btn-ghost btn-sm mt-4 text-primary">Bersihkan Filter</button>
      </div>

      <!-- Data List (Refined Table) -->
      <div v-else class="space-y-6 mb-12">
        <div class="overflow-x-auto bg-base-100 rounded-[2.5rem] border border-base-200/60 shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar">
          <table class="table table-lg w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-20 bg-base-100 shadow-sm">
              <tr class="bg-base-200/50 text-base-content/50 uppercase text-[10px] tracking-[0.2em] font-black">
                <th class="w-16 pl-8">No</th>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Action</th>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th class="text-right pr-8">IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(item, idx) in flatLogs" :key="item.id" 
                @click="openDetail(item)"
                class="hover:bg-base-200/30 transition-colors border-b border-base-200/40 last:border-0 group cursor-pointer"
              >
                <td class="font-mono text-xs text-base-content/30 pl-8">{{ (page - 1) * limit + idx + 1 }}</td>
                <td>
                  <div class="flex items-center gap-3">
                    <div v-if="item.details?.image" class="w-9 h-9 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative">
                      <img :src="item.details.image" alt="avatar" class="w-full h-full object-cover"/>
                    </div>
                    <div v-else class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="mingcute:user-3-fill" class="text-primary text-lg" />
                    </div>
                    <span class="font-bold text-base-content">{{ item.details?.identifier || 'Unknown' }}</span>
                  </div>
                </td>
                <td>
                  <span 
                    :class="[
                      'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border',
                      item.details?.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                      item.details?.role === 'GURU' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    ]"
                  >
                    {{ item.details?.role || 'USER' }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span class="text-xs font-bold text-base-content/70">{{ item.action }}</span>
                  </div>
                </td>
                <td>
                  <span class="text-sm font-medium text-base-content/80">{{ formatDateRow(item.createdAt) }}</span>
                </td>
                <td>
                  <span class="text-sm font-mono font-bold text-base-content/80">{{ formatTime(item.createdAt) }}</span>
                </td>
                <td class="text-right pr-8">
                  <span class="text-xs font-mono text-base-content/30 bg-base-200/50 px-2.5 py-1 rounded-lg group-hover:bg-base-200 transition-colors">
                    {{ item.details?.ip || '0.0.0.0' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Controller -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8 pb-12">
        <button 
          @click="page--" 
          :disabled="page === 1"
          class="btn btn-circle btn-ghost disabled:opacity-30"
        >
          <Icon name="mingcute:left-line" size="24" />
        </button>
        
        <div class="flex items-center gap-1">
          <button 
            v-for="p in totalPages" :key="p"
            v-show="p === 1 || p === totalPages || Math.abs(p - page) <= 2"
            @click="page = p"
            :class="['btn btn-sm rounded-xl w-10', page === p ? 'btn-primary' : 'btn-ghost']"
          >
            {{ p }}
          </button>
        </div>

        <button 
          @click="page++" 
          :disabled="page === totalPages"
          class="btn btn-circle btn-ghost disabled:opacity-30"
        >
          <Icon name="mingcute:right-line" size="24" />
        </button>
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

    <!-- Detail Modal -->
    <dialog :class="['modal modal-bottom sm:modal-middle', showDetail ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-[2.5rem] p-8 max-w-lg">
        <div class="flex items-start justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="mingcute:history-fill" size="32" />
            </div>
            <div>
              <h3 class="text-2xl font-black text-base-content">Detail Aktivitas</h3>
              <p class="text-sm text-base-content/50">Log ID: {{ selectedLog?.id }}</p>
            </div>
          </div>
          <button @click="showDetail = false" class="btn btn-ghost btn-circle btn-sm">
            <Icon name="mingcute:close-line" size="24" />
          </button>
        </div>

        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-base-200/30 p-4 rounded-3xl border border-base-200/50">
              <p class="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Pengguna</p>
              <p class="font-bold text-base-content">{{ selectedLog?.details?.identifier }}</p>
            </div>
            <div class="bg-base-200/30 p-4 rounded-3xl border border-base-200/50">
              <p class="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Role</p>
              <p class="font-bold text-base-content">{{ selectedLog?.details?.role }}</p>
            </div>
          </div>

          <div class="bg-base-200/30 p-5 rounded-3xl border border-base-200/50">
            <div class="flex items-center justify-between mb-4 pb-4 border-b border-base-200/50">
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Aksi</p>
                <p class="font-black text-primary text-lg">{{ selectedLog?.action }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Waktu</p>
                <p class="font-bold text-base-content">{{ selectedLog ? formatDateRow(selectedLog.createdAt) : '' }} {{ selectedLog ? formatTime(selectedLog.createdAt) : '' }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon name="mingcute:earth-line" class="text-base-content/40" />
                  <span class="text-xs font-bold text-base-content/60">IP Address</span>
                </div>
                <span class="font-mono text-sm font-bold">{{ selectedLog?.details?.ip }}</span>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon name="mingcute:location-fill" class="text-primary" />
                  <span class="text-xs font-bold text-base-content/60">Lokasi (GeoIP)</span>
                </div>
                <div class="text-right">
                  <span v-if="locationLoading" class="loading loading-dots loading-xs text-primary"></span>
                  <span v-else class="text-xs font-bold text-base-content">{{ locationInfo || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-primary/5 p-4 rounded-3xl border border-primary/10">
            <p class="text-[10px] font-black uppercase tracking-widest text-primary mb-2">User Agent</p>
            <p class="text-[10px] font-mono text-base-content/60 leading-relaxed italic">{{ selectedLog?.details?.userAgent || 'Tidak ada data user agent' }}</p>
          </div>

          <!-- Captured Scan Photo -->
          <div v-if="selectedLog?.details?.image" class="bg-base-200/20 p-4 rounded-3xl border border-base-200/50 flex flex-col gap-2">
            <p class="text-[10px] font-black uppercase tracking-widest text-base-content/40">Foto Scan Wajah</p>
            <div class="w-full h-48 rounded-2xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative flex items-center justify-center">
              <img :src="selectedLog.details.image" 
                   alt="Captured face" 
                   class="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300"
                   @click="openImagePreview(selectedLog.details.image)" />
            </div>
          </div>
        </div>

        <div class="modal-action mt-8">
          <button @click="showDetail = false" class="btn btn-primary w-full rounded-2xl h-12 shadow-lg shadow-primary/30">
            Tutup Detail
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showDetail = false">
        <button>close</button>
      </form>
    </dialog>

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
    
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--bc), 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--bc), 0.2);
}

/* Ensure sticky header background stays solid */
thead tr th {
  background: inherit;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
