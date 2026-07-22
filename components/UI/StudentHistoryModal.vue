<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  student: {
    type: Object,
    default: () => null
  },
  studentId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const isVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const closeModal = () => {
  isVisible.value = false;
  emit('close');
};

// Date Selection State
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());

const monthOptions = [
  { value: 1, name: 'Januari' },
  { value: 2, name: 'Februari' },
  { value: 3, name: 'Maret' },
  { value: 4, name: 'April' },
  { value: 5, name: 'Mei' },
  { value: 6, name: 'Juni' },
  { value: 7, name: 'Juli' },
  { value: 8, name: 'Agustus' },
  { value: 9, name: 'September' },
  { value: 10, name: 'Oktober' },
  { value: 11, name: 'November' },
  { value: 12, name: 'Desember' }
];

const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
});

// Data State
const loading = ref(false);
const errorMsg = ref('');
const historyData = ref(null);
const selectedDayLog = ref(null);
const activePreviewImage = ref(null);

const targetId = computed(() => {
  if (props.studentId) return props.studentId;
  if (props.student) return props.student.id || props.student.nis || props.student.studentId || props.student.userId;
  return null;
});

const fetchHistory = async () => {
  if (!targetId.value) return;
  
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await $fetch(`/api/attendance/student/${targetId.value}?month=${selectedMonth.value}&year=${selectedYear.value}`);
    historyData.value = res?.data || res || null;
  } catch (err) {
    console.error('Failed to fetch student attendance history:', err);
    errorMsg.value = err?.data?.message || err?.message || 'Gagal memuat riwayat presensi siswa';
  } finally {
    loading.value = false;
  }
};

watch([() => props.modelValue, targetId], ([newVisible, newId]) => {
  if (newVisible && newId) {
    fetchHistory();
  }
}, { immediate: true });

watch([selectedMonth, selectedYear], () => {
  if (isVisible.value && targetId.value) {
    fetchHistory();
  }
});

// Student info computation
const studentDetail = computed(() => {
  if (historyData.value?.student) {
    return historyData.value.student;
  }
  return props.student || {};
});

const summaryStats = computed(() => {
  return historyData.value?.summary || {
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    total: 0
  };
});

// Calendar grid generation
const calendarCells = computed(() => {
  const cells = [];
  const year = selectedYear.value;
  const month = selectedMonth.value - 1; // 0-indexed
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Calculate starting day (0 = Sunday, convert to Monday = 0)
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6;
  
  for (let i = 0; i < startDay; i++) {
    cells.push({ id: `empty-${i}`, type: 'empty' });
  }
  
  const dailyMap = historyData.value?.dailyMap || {};
  const totalDays = lastDayOfMonth.getDate();
  
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toLocaleDateString('en-CA');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const dayData = dailyMap[dateStr] || null;
    cells.push({
      id: `day-${day}`,
      type: 'day',
      day,
      dateStr,
      isWeekend,
      data: dayData
    });
  }
  
  return cells;
});

// Helper for status badge style
const getStatusBadge = (status) => {
  switch (status) {
    case 'HADIR':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'TERLAMBAT':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'IZIN':
      return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    case 'SAKIT':
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'ALPHA':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    default:
      return 'bg-base-200 text-base-content/60 border-base-300';
  }
};

const getStatusLabel = (status) => {
  if (status === 'TERLAMBAT') return 'Lambat';
  if (status === 'ALPHA') return 'Belum Absen';
  return status || 'Belum Absen';
};

// Check if a string is a valid image URL/path
const isImageUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http') || str.startsWith('/uploads') || str.endsWith('.jpg') || str.endsWith('.png') || str.endsWith('.jpeg') || str.endsWith('.webp');
};

const getLogPhoto = (log) => {
  if (log?.notes && isImageUrl(log.notes)) return log.notes;
  if (log?.photoUrl) return log.photoUrl;
  if (log?.image) return log.image;
  return studentDetail.value?.photoUrl || studentDetail.value?.faceUrl || null;
};

const openImagePreview = (url) => {
  if (url) {
    activePreviewImage.value = url;
  }
};

const closeImagePreview = () => {
  activePreviewImage.value = null;
};

// Format Date & Time helpers
const formatLogTime = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatLogDate = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5" @click.self="closeModal">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Main Modal Container -->
        <div class="relative bg-base-100 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden z-10 border border-base-200/80 flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="p-5 sm:p-6 bg-base-200/40 border-b border-base-200/60 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3.5 min-w-0">
              <div 
                class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border-2 border-primary/20 shrink-0 shadow-inner relative cursor-pointer group"
                @click="openImagePreview(studentDetail.photoUrl || studentDetail.faceUrl)"
              >
                <img 
                  v-if="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :src="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :alt="studentDetail.name" 
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl">
                  {{ studentDetail.name?.charAt(0) || 'S' }}
                </div>
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Icon name="mingcute:zoom-in-line" size="16" />
                </div>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Detail History Siswa
                  </span>
                  <span class="text-xs font-mono font-bold text-base-content/50" v-if="studentDetail.nis">
                    NIS: {{ studentDetail.nis }}
                  </span>
                </div>
                <h3 class="text-lg font-black text-base-content truncate mt-0.5">{{ studentDetail.name || 'Siswa' }}</h3>
                <p class="text-xs font-bold text-base-content/50 truncate">
                  {{ studentDetail.className || studentDetail.class?.className || 'Belum Ada Kelas' }}
                  <span v-if="studentDetail.majorName"> · {{ studentDetail.majorName }}</span>
                </p>
              </div>
            </div>

            <button @click="closeModal" class="btn btn-ghost btn-circle btn-sm shrink-0 hover:bg-base-300">
              <Icon name="mingcute:close-line" size="20" />
            </button>
          </div>

          <!-- Body Scrollable Content -->
          <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
            
            <!-- Month & Year Controls -->
            <div class="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-base-200/30 border border-base-200/50">
              <div class="flex items-center gap-2">
                <Icon name="mingcute:calendar-fill" size="18" class="text-primary" />
                <span class="text-xs font-black uppercase text-base-content/70 tracking-wide">Periode Presensi</span>
              </div>
              <div class="flex gap-2">
                <select v-model="selectedMonth" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                  <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.name }}</option>
                </select>
                <select v-model="selectedYear" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
            </div>

            <!-- Loading Spinner -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-12 gap-2 text-primary">
              <span class="loading loading-spinner loading-lg"></span>
              <span class="text-xs font-bold text-base-content/50">Memuat data riwayat...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="errorMsg" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-3">
              <Icon name="mingcute:warning-fill" size="20" />
              <span>{{ errorMsg }}</span>
            </div>

            <!-- Main Content Area -->
            <template v-else>
              <!-- Summary Stat Badges -->
              <div class="grid grid-cols-5 gap-2">
                <div class="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-center">
                  <p class="text-base font-black text-emerald-600">{{ summaryStats.hadir || 0 }}</p>
                  <p class="text-[9px] font-black uppercase text-emerald-600/70 tracking-wider">Hadir</p>
                </div>
                <div class="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl text-center">
                  <p class="text-base font-black text-amber-600">{{ summaryStats.terlambat || 0 }}</p>
                  <p class="text-[9px] font-black uppercase text-amber-600/70 tracking-wider">Lambat</p>
                </div>
                <div class="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-2xl text-center">
                  <p class="text-base font-black text-sky-600">{{ summaryStats.izin || 0 }}</p>
                  <p class="text-[9px] font-black uppercase text-sky-600/70 tracking-wider">Izin</p>
                </div>
                <div class="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-2xl text-center">
                  <p class="text-base font-black text-orange-600">{{ summaryStats.sakit || 0 }}</p>
                  <p class="text-[9px] font-black uppercase text-orange-600/70 tracking-wider">Sakit</p>
                </div>
                <div class="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl text-center">
                  <p class="text-base font-black text-rose-600">{{ summaryStats.alpha || 0 }}</p>
                  <p class="text-[9px] font-black uppercase text-rose-600/70 tracking-wider">Alpha</p>
                </div>
              </div>

              <!-- Interactive Monthly Grid -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <h5 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Kalender Kehadiran</h5>
                  <span class="text-[9px] font-bold text-base-content/40">Klik tanggal untuk filter detail tap</span>
                </div>
                
                <!-- Weekday Headers -->
                <div class="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-base-content/40 uppercase tracking-widest bg-base-200/50 py-1.5 rounded-xl">
                  <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-400">Sab</span><span class="text-rose-400">Min</span>
                </div>

                <!-- Day Grid Cells -->
                <div class="grid grid-cols-7 gap-1.5">
                  <div 
                    v-for="cell in calendarCells" 
                    :key="cell.id"
                    @click="cell.data && (selectedDayLog = selectedDayLog === cell.data ? null : cell.data)"
                    :class="[
                      'aspect-square rounded-xl p-1 flex flex-col justify-between text-center transition-all border text-[10px] font-bold cursor-pointer hover:scale-105',
                      cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                      cell.isWeekend ? 'bg-base-200/30 border-base-200 text-base-content/40' : 'bg-base-100 border-base-200',
                      selectedDayLog === cell.data ? 'ring-2 ring-primary scale-105 shadow-md' : '',
                      cell.data?.status === 'HADIR' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600' : '',
                      cell.data?.status === 'TERLAMBAT' ? 'bg-amber-500/10 border-amber-500/40 text-amber-600' : '',
                      cell.data?.status === 'IZIN' ? 'bg-sky-500/10 border-sky-500/40 text-sky-600' : '',
                      cell.data?.status === 'SAKIT' ? 'bg-orange-500/10 border-orange-500/40 text-orange-600' : '',
                      cell.data?.status === 'ALPHA' ? 'bg-rose-500/10 border-rose-500/40 text-rose-600' : ''
                    ]"
                  >
                    <span :class="['text-[10px] font-black', cell.isWeekend ? 'text-rose-400' : '']">{{ cell.day }}</span>
                    <div v-if="cell.data" class="text-[8px] font-black uppercase tracking-tighter truncate">
                      {{ cell.data.status?.slice(0, 3) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Filtered Day Log Popup Banner -->
              <div v-if="selectedDayLog" class="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-black uppercase tracking-widest text-primary">Detail Tapping Tanggal Ini</span>
                  <button @click="selectedDayLog = null" class="btn btn-ghost btn-xs btn-circle">
                    <Icon name="mingcute:close-line" size="14" />
                  </button>
                </div>
                <div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  <div v-for="log in selectedDayLog.logs" :key="log.id" class="flex items-center gap-3 p-2 rounded-xl bg-base-100 border border-base-200 shadow-sm">
                    <!-- Photo Thumbnail -->
                    <div 
                      class="w-10 h-10 rounded-lg overflow-hidden bg-base-200 shrink-0 border border-base-200 relative cursor-zoom-in group"
                      @click="openImagePreview(getLogPhoto(log))"
                    >
                      <img 
                        v-if="getLogPhoto(log)" 
                        :src="getLogPhoto(log)" 
                        alt="scan" 
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-base-content/30 bg-base-200">
                        <Icon name="mingcute:pic-line" size="16" />
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-mono font-bold text-base-content">{{ formatLogTime(log.timestamp) }}</span>
                        <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase border', getStatusBadge(log.status)]">
                          {{ getStatusLabel(log.status) }}
                        </span>
                      </div>
                      <p class="text-[9px] font-bold text-base-content/50 truncate mt-0.5" v-if="log.device">
                        <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                        {{ log.device.name }} ({{ log.device.location || '-' }})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed Scan Tapping Logs List with Captured Photos -->
              <div class="space-y-2.5 pt-2 border-t border-base-200">
                <div class="flex items-center justify-between">
                  <h5 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Daftar Foto & Log Scan Kehadiran</h5>
                  <span class="text-[9px] font-bold text-base-content/40" v-if="historyData?.data?.length">Total: {{ historyData.data.length }} log</span>
                </div>

                <div v-if="historyData?.data && historyData.data.length" class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  <div 
                    v-for="log in historyData.data" 
                    :key="log.id" 
                    class="flex items-center gap-3.5 p-3 rounded-2xl bg-base-200/30 border border-base-200/60 hover:bg-base-200/60 transition-colors group"
                  >
                    <!-- Captured Photo Thumbnail -->
                    <div 
                      class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 relative shadow-inner cursor-zoom-in group/img"
                      @click="openImagePreview(getLogPhoto(log))"
                    >
                      <img 
                        v-if="getLogPhoto(log)" 
                        :src="getLogPhoto(log)" 
                        alt="scan" 
                        class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-base-content/30 bg-base-200">
                        <Icon name="mingcute:pic-line" size="18" />
                      </div>
                      <div class="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Icon name="mingcute:zoom-in-line" size="14" />
                      </div>
                    </div>

                    <!-- Log Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-xs text-base-content">
                          {{ formatLogDate(log.timestamp) }} - {{ formatLogTime(log.timestamp) }}
                        </span>
                        <span :class="['px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase border tracking-wider', getStatusBadge(log.status)]">
                          {{ getStatusLabel(log.status) }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between mt-1 text-[9px] font-bold text-base-content/40">
                        <span v-if="log.device" class="truncate">
                          <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                          {{ log.device.name }} ({{ log.device.location || 'Utama' }})
                        </span>
                        <span v-else class="truncate">Metode: {{ log.method || 'FACE_RECOGNITION' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else class="flex flex-col items-center justify-center py-10 opacity-40">
                  <Icon name="mingcute:calendar-line" size="40" />
                  <p class="text-xs font-black uppercase tracking-wider mt-2">Belum ada data presensi pada bulan ini</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-base-200/30 border-t border-base-200/60 flex justify-end shrink-0">
            <button @click="closeModal" class="btn btn-ghost btn-sm rounded-xl font-black px-6">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Full-Screen Lightbox Image Preview Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="activePreviewImage" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4" @click="closeImagePreview">
        <button class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors btn btn-ghost btn-circle">
          <Icon name="mingcute:close-line" size="28" />
        </button>
        <img 
          :src="activePreviewImage" 
          class="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
          @click.stop 
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.12); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
