<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRequestFetch } from '#app';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

// === MODAL STATE ===
const selectedAttendance = ref(null);
const showModal = ref(false);

const openDetail = (d) => {
  selectedAttendance.value = d;
  showModal.value = true;
};
const closeModal = () => { showModal.value = false; selectedAttendance.value = null; };

const formatTimeOnly = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const getStatus = (s) => {
  const statusMap = {
    HADIR:     { color: 'text-emerald-500', badge: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500', label: 'Hadir' },
    TERLAMBAT: { color: 'text-amber-500',   badge: 'bg-amber-500/10 border border-amber-500/30 text-amber-500', label: 'Lambat' },
    IZIN:      { color: 'text-sky-500',     badge: 'bg-sky-500/10 border border-sky-500/30 text-sky-500', label: 'Izin' },
    SAKIT:     { color: 'text-orange-400',  badge: 'bg-orange-400/10 border border-orange-400/30 text-orange-400', label: 'Sakit' },
    ALPHA:     { color: 'text-rose-500',    badge: 'bg-rose-500/10 border border-rose-500/30 text-rose-500', label: 'Alpha' },
  };
  return statusMap[s] || statusMap.ALPHA;
};

const { nis, role } = storeToRefs(useAuthStore());
const isAdminOrDev = computed(() => ['admin', 'developer', 'guru'].includes(role.value));
const sessionFetch = import.meta.server ? useRequestFetch() : $fetch;

const log = ref([]);
const logSiswa = ref(null);
const isLive = ref(false); // true saat socket terhubung

const refreshLog = async () => {
  if (!isAdminOrDev.value) return;
  try {
    log.value = await sessionFetch('/api/log/kehadiran');
  } catch (error) {
    console.error('Error fetching attendance log:', error);
  }
};

if (isAdminOrDev.value) {
  await refreshLog();
} else {
  logSiswa.value = await sessionFetch('/api/log/kehadiran/' + nis.value);
}

// Format today's date key (same format as API response)
const todayKey = () => {
  const d = new Date();
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

let socketCleanup = null;

onMounted(() => {
  if (!isAdminOrDev.value) return;

  // Use Socket.io plugin
  const nuxtApp = useNuxtApp();
  const socket = nuxtApp.$socket;
  if (!socket) return;

  const onConnect = () => { isLive.value = true; };
  const onDisconnect = () => { isLive.value = false; };

  const onAttendanceNew = (data) => {
    // Find today's group or create it
    const key = todayKey();
    const todayGroup = log.value.find((g) => g.tgal === key);
    if (todayGroup) {
      // Prepend new entry so it appears at top
      todayGroup.a = [data, ...todayGroup.a];
    } else {
      // No group for today yet, add one
      log.value = [{ tgal: key, a: [data] }, ...log.value];
    }
  };

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('attendance:new', onAttendanceNew);

  // Set initial live status
  if (socket.connected) isLive.value = true;

  socketCleanup = () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('attendance:new', onAttendanceNew);
  };
});

onUnmounted(() => {
  if (socketCleanup) socketCleanup();
});


const type = (type) => {
  switch (type) {
    case 'enter':
      return 'Masuk';
    case 'exit':
      return 'Pulang';
    default:
      return 'Tidak diketahui';
  }
};

useSeoMeta({
  title: 'Log Kehadiran | GASKAN',
  ogTitle: 'Log Kehadiran | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.idlog/kehadiran',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.idlog/kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Log Kehadiran | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.idlog/kehadiran`,
})
</script>
<template>
  <div class="max-w-7xl mx-auto px-4 md:px-0 py-6">
    <!-- Admin/Developer View -->
    <div v-if="isAdminOrDev">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-base-content mb-2 flex items-center gap-3">
            Log Presensi
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span class="text-xs font-bold text-success uppercase tracking-wider">Live</span>
            </div>
          </h1>
          <p class="text-base-content/60 text-sm">Pemantauan rekapitulasi kehadiran dengan auto-refresh aman</p>
        </div>
        
        <div class="flex items-center gap-2">
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-primary btn-sm rounded-xl px-4">
              <Icon name="mingcute:download-2-fill" size="18" class="mr-1"/>
              Export Data
              <Icon name="mingcute:down-fill" size="16" class="ml-1 opacity-70"/>
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 border border-base-200/80 mt-2 font-medium">
              <li><a href="/api/log/kehadiran/export?type=json" target="_blank" class="hover:text-primary"><Icon name="mingcute:braces-fill" size="18" class="opacity-70"/> JSON Format</a></li>
              <li><a href="/api/log/kehadiran/export?type=txt" target="_blank" class="hover:text-primary"><Icon name="mingcute:document-text-fill" size="18" class="opacity-70"/> Text Format</a></li>
              <li><a href="/api/log/kehadiran/export?type=xlsx" target="_blank" class="hover:text-primary"><Icon name="mingcute:table-2-fill" size="18" class="opacity-70"/> Excel Format</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="log.length === 0" class="bg-base-100 border border-base-200/60 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-base-content/40">
        <div class="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-base-200/50 border border-base-300/50">
            <Icon name="mingcute:radar-line" size="32" class="animate-spin-slow opacity-50" />
        </div>
        <p class="font-medium text-lg">Menunggu data rekap...</p>
      </div>

      <div v-else class="space-y-12">
        <TransitionGroup name="list" tag="div" class="space-y-10">
          <div v-for="l in log" :key="l.tanggal" class="relative">
            <!-- Date Header -->
            <div class="sticky top-[64px] z-10 bg-base-100/95 backdrop-blur-md py-4 mb-4 flex items-center gap-4 border-b border-base-200/50">
              <div class="h-8 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
              <h2 class="text-2xl font-extrabold text-base-content tracking-tight">{{ l.tanggal }}</h2>
            </div>
            
            <!-- Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div v-for="d in l.data" :key="d.timestamp"
                   @click="openDetail(d)"
                   class="bg-base-100 border border-base-200/80 hover:border-primary/30 rounded-3xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex gap-4 items-center group cursor-pointer">
                <div class="relative w-16 h-16 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-base-200 shrink-0 shadow-inner">
                  <img :src="d.Image" alt="avatar" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  <div class="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold text-base-content truncate group-hover:text-primary transition-colors">{{ d.Nama }}</h3>
                  <p class="text-[11px] font-bold text-base-content/40 uppercase tracking-widest mb-2 truncate">{{ d.Kelas }}</p>
                  
                  <div class="flex flex-col gap-1.5 mb-1">
                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-success/10 text-success border border-success/20">Masuk</span>
                      <span class="text-xs font-mono font-bold text-base-content/70">
                        {{ d.timestamp ? formatTimeOnly(d.timestamp) : '-' }}
                      </span>
                      <span v-if="d.Gate" class="text-[8px] font-bold text-base-content/35 truncate max-w-[80px]" :title="d.Gate">
                        ({{ d.Gate.split(' ')[0] }})
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Pulang</span>
                      <span class="text-xs font-mono font-bold text-base-content/70">
                        {{ d.lastOutTime ? formatTimeOnly(d.lastOutTime) : 'Belum pulang' }}
                      </span>
                      <span v-if="d.lastOutGate" class="text-[8px] font-bold text-base-content/35 truncate max-w-[80px]" :title="d.lastOutGate">
                        ({{ d.lastOutGate.split(' ')[0] }})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Siswa View -->
    <div v-else-if="logSiswa">
      <div class="mb-10">
        <h1 class="text-4xl font-black tracking-tight text-base-content mb-3">Riwayat Kehadiran</h1>
        <p class="text-base-content/60 text-base">Rekapitulasi jam masuk dan pulang harian Anda</p>
      </div>

      <div v-if="!logSiswa.absen || logSiswa.absen.length === 0" class="bg-base-100 border border-base-200/60 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-base-content/40">
        <Icon name="mingcute:calendar-time-line" size="64" class="opacity-30 mb-5" />
        <p class="font-medium text-xl">Belum ada riwayat kehadiran.</p>
      </div>

      <div v-else class="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-primary/50 before:to-transparent before:rounded-full">
        <div v-for="(l, i) in logSiswa.absen" :key="l.tanggal" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          
          <!-- Icon Marker -->
          <div class="flex items-center justify-center w-12 h-12 rounded-full border-[6px] border-base-100 bg-primary text-primary-content shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
            <Icon name="mingcute:calendar-month-fill" size="20"/>
          </div>
          
          <!-- Card -->
          <div class="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-base-100 hover:bg-base-100/80 border border-base-200/80 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <!-- Background glow decoration -->
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

            <div class="flex items-center justify-between mb-5 border-b border-base-200/60 pb-4 relative z-10">
              <time class="text-xl font-extrabold text-base-content">{{ l.tanggal }}</time>
              <div class="px-3 py-1 bg-base-200/50 rounded-lg border border-base-300 text-xs font-bold text-base-content/50 uppercase">Hari ke-{{ logSiswa.absen.length - i }}</div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 relative z-10">
              <!-- Masuk Column -->
              <div class="bg-success/5 rounded-2xl border border-success/10 overflow-hidden flex flex-col transition-colors hover:bg-success/10">
                <div class="bg-success/10 px-4 py-2.5 border-b border-success/10 flex items-center gap-2">
                  <Icon name="mingcute:arrow-right-circle-fill" size="18" class="text-success" />
                  <span class="text-xs font-black text-success uppercase tracking-widest">Masuk</span>
                </div>
                <div class="p-4 flex-1 flex flex-col gap-3 justify-center">
                  <div v-if="!l.enter.time || l.enter.time.length === 0" class="text-sm text-base-content/40 font-medium italic text-center py-2">Tidak ada data</div>
                  <div v-else v-for="(d, idx) in l.enter.time" :key="d" class="flex flex-col gap-2 items-start w-full">
                    <div class="flex items-center justify-between w-full gap-2">
                      <span class="text-xl font-mono font-bold text-base-content">{{ d }}</span>
                      <span v-if="l.enter.gate && l.enter.gate[idx]" class="text-[9px] font-bold text-success/80 bg-success/5 px-2 py-0.5 rounded border border-success/10 truncate max-w-[120px]" :title="l.enter.gate[idx]">
                        {{ l.enter.gate[idx] }}
                      </span>
                    </div>
                    <span v-if="l.indexTelat === false" class="px-2.5 py-1 text-[10px] font-black text-success bg-success/20 border border-success/30 rounded-lg w-fit tracking-widest uppercase">TEPAT WAKTU</span>
                    <span v-else class="px-2.5 py-1 text-[10px] font-black text-error bg-error/20 border border-error/30 rounded-lg w-fit tracking-widest uppercase">TERLAMBAT</span>
                  </div>
                </div>
              </div>
              
              <!-- Keluar Column -->
              <div class="bg-error/5 rounded-2xl border border-error/10 overflow-hidden flex flex-col transition-colors hover:bg-error/10">
                <div class="bg-error/10 px-4 py-2.5 border-b border-error/10 flex items-center gap-2">
                  <Icon name="mingcute:arrow-left-circle-fill" size="18" class="text-error" />
                  <span class="text-xs font-black text-error uppercase tracking-widest">Pulang</span>
                </div>
                <div class="p-4 flex-1 flex flex-col gap-3 justify-center">
                   <div v-if="!l.exit.time || l.exit.time.length === 0" class="text-sm text-base-content/40 font-medium flex flex-col items-center justify-center gap-2 py-2 text-center">
                     <Icon name="mingcute:time-fill" size="24" class="opacity-30"/> 
                     <span>Belum Pulang</span>
                   </div>
                   <div v-else v-for="(d, idx) in l.exit.time" :key="d" class="flex flex-col gap-2 items-start w-full">
                     <div class="flex items-center justify-between w-full gap-2">
                       <span class="text-xl font-mono font-bold text-base-content">{{ d }}</span>
                       <span v-if="l.exit.gate && l.exit.gate[idx]" class="text-[9px] font-bold text-error/80 bg-error/5 px-2 py-0.5 rounded border border-error/10 truncate max-w-[120px]" :title="l.exit.gate[idx]">
                         {{ l.exit.gate[idx] }}
                       </span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- ═══ DETAIL MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal && selectedAttendance" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="closeModal">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden z-10">
            
            <!-- Modal Header -->
            <div class="p-6 flex items-center justify-between bg-primary/5">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border border-base-200 shrink-0">
                  <img :src="selectedAttendance.Image" alt="avatar" class="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content">{{ selectedAttendance.Nama }}</h3>
                  <p class="text-xs text-base-content/50 font-bold">{{ selectedAttendance.Kelas }}</p>
                </div>
              </div>
              <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <!-- Detail rows -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Masuk</span>
                  </div>
                  <span class="text-sm font-black text-base-content">
                    {{ selectedAttendance.timestamp ? formatTimeOnly(selectedAttendance.timestamp) : '-' }}
                  </span>
                </div>
                <div class="flex items-center justify-between" v-if="selectedAttendance.lastOutTime">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Pulang</span>
                  </div>
                  <span class="text-sm font-black text-base-content">
                    {{ formatTimeOnly(selectedAttendance.lastOutTime) }}
                  </span>
                </div>
              </div>

              <!-- Detailed Scan Logs with Captured Photos -->
              <div class="pt-4 border-t border-base-200/50 space-y-3" v-if="selectedAttendance.logs && selectedAttendance.logs.length">
                <h4 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Detail Scan Wajah & Foto</h4>
                <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
                  <div v-for="log in selectedAttendance.logs" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/50 transition-colors">
                    <!-- Attendance Image -->
                    <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative">
                      <img :src="log.Image" alt="scan" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-mono font-bold text-base-content">
                          {{ formatTimeOnly(log.timestamp) }}
                        </span>
                        <span :class="['px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider', getStatus(log.status).badge]">
                          {{ getStatus(log.status).label }}
                        </span>
                      </div>
                      <p class="text-[9px] font-bold text-base-content/40 truncate mt-0.5" v-if="log.Gate">
                        <Icon name="mingcute:location-fill" size="11" class="text-primary/70 mr-0.5 inline shrink-0" />
                        {{ log.Gate }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-6 pt-0">
              <button @click="closeModal" class="btn btn-ghost btn-block rounded-2xl font-black">Tutup</button>
            </div>
          </div>
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

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.08); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
</style>
