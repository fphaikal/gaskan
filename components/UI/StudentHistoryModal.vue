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
const activeTab = ref('calendar'); // 'calendar' | 'logs'

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
  if (props.student) {
    const s = props.student;
    return s.userId || s.studentId || s.nis || (typeof s.id === 'string' && !s.id.startsWith('unscanned-') ? s.id : null) || s.id;
  }
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
    selectedDayLog.value = null;
    fetchHistory();
  }
}, { immediate: true });

watch([selectedMonth, selectedYear], () => {
  if (isVisible.value && targetId.value) {
    selectedDayLog.value = null;
    fetchHistory();
  }
});

// Student info computation
const studentDetail = computed(() => {
  const fetched = historyData.value?.student || {};
  const passed = props.student || {};
  return {
    name: fetched.name || passed.name || passed.studentName || 'Siswa',
    nis: fetched.nis || passed.nis || passed.studentNis || '-',
    nisn: fetched.nisn || passed.nisn || '',
    className: fetched.className || fetched.class?.className || passed.className || 'Belum Ada Kelas',
    majorName: fetched.majorName || fetched.class?.major?.name || passed.majorName || '',
    photoUrl: fetched.photoUrl || fetched.faceUrl || passed.photoUrl || passed.faceUrl || null
  };
});

const summaryStats = computed(() => {
  const sum = historyData.value?.summary || {
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    total: 0
  };
  const totalAccounted = sum.hadir + sum.terlambat + sum.izin + sum.sakit + sum.alpha;
  const percentage = totalAccounted > 0 ? Math.round(((sum.hadir + sum.terlambat) / totalAccounted) * 100) : 0;
  return {
    ...sum,
    percentage
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
      return {
        badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        card: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        label: 'Hadir',
        icon: 'mingcute:check-circle-fill'
      };
    case 'TERLAMBAT':
      return {
        badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        card: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        label: 'Lambat',
        icon: 'mingcute:time-fill'
      };
    case 'IZIN':
      return {
        badge: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
        card: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
        label: 'Izin',
        icon: 'mingcute:document-fill'
      };
    case 'SAKIT':
      return {
        badge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
        card: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
        label: 'Sakit',
        icon: 'mingcute:hospital-fill'
      };
    case 'ALPHA':
    case 'BELUM_ABSEN':
      return {
        badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        card: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        label: 'Alpha',
        icon: 'mingcute:close-circle-fill'
      };
    default:
      return {
        badge: 'bg-base-200 text-base-content/60 border border-base-300',
        card: 'bg-base-200/50 border-base-300 text-base-content/60',
        label: status || 'Belum Absen',
        icon: 'mingcute:information-fill'
      };
  }
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
        <!-- Backdrop Blur -->
        <div class="absolute inset-0 bg-black/75 backdrop-blur-md"></div>

        <!-- Main Modal Container (Glassmorphism & Rich Theme) -->
        <div class="relative bg-slate-950/90 text-slate-100 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] w-full max-w-4xl overflow-hidden z-10 border border-slate-800 flex flex-col max-h-[92vh]">
          
          <!-- Modal Top Glow Header -->
          <div class="p-6 sm:p-7 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800/80 flex items-center justify-between shrink-0 relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="flex items-center gap-4 sm:gap-5 min-w-0 z-10">
              <!-- Avatar with Ring Glow -->
              <div 
                class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-slate-800 border-2 border-primary/40 shrink-0 shadow-lg shadow-primary/20 relative cursor-pointer group"
                @click="openImagePreview(studentDetail.photoUrl || studentDetail.faceUrl)"
              >
                <img 
                  v-if="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :src="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :alt="studentDetail.name" 
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-violet-600 text-white font-black text-2xl">
                  {{ studentDetail.name?.charAt(0) || 'S' }}
                </div>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1 backdrop-blur-[1px]">
                  <Icon name="mingcute:zoom-in-line" size="18" />
                </div>
              </div>

              <!-- Student Header Meta -->
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary-content border border-primary/30 shadow-sm">
                    Riwayat Presensi Siswa
                  </span>
                  <span class="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                    NIS: {{ studentDetail.nis }}
                  </span>
                  <span class="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700" v-if="studentDetail.nisn">
                    NISN: {{ studentDetail.nisn }}
                  </span>
                </div>

                <h3 class="text-xl sm:text-2xl font-black text-white truncate leading-tight">{{ studentDetail.name }}</h3>
                <p class="text-xs sm:text-sm font-semibold text-slate-400 truncate mt-0.5 flex items-center gap-2">
                  <span class="text-amber-400 font-bold">{{ studentDetail.className }}</span>
                  <span v-if="studentDetail.majorName" class="text-slate-500">· {{ studentDetail.majorName }}</span>
                </p>
              </div>
            </div>

            <!-- Header Action Controls -->
            <div class="flex items-center gap-2 z-10 shrink-0">
              <button 
                @click="fetchHistory" 
                class="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-white hover:bg-slate-800"
                title="Refresh Data"
              >
                <Icon name="mingcute:refresh-3-line" size="18" :class="{ 'animate-spin': loading }" />
              </button>
              <button @click="closeModal" class="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-white hover:bg-slate-800">
                <Icon name="mingcute:close-line" size="22" />
              </button>
            </div>
          </div>

          <!-- Filter & View Switcher Bar -->
          <div class="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <!-- Period Selector -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                <Icon name="mingcute:calendar-fill" size="16" class="text-primary" />
                <span>Periode:</span>
              </div>
              <div class="flex gap-2">
                <select v-model="selectedMonth" class="select select-xs font-bold rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.name }}</option>
                </select>
                <select v-model="selectedYear" class="select select-xs font-bold rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
            </div>

            <!-- View Mode Switcher Tabs -->
            <div class="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button 
                @click="activeTab = 'calendar'" 
                :class="['flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all', activeTab === 'calendar' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200']"
              >
                <Icon name="mingcute:calendar-2-fill" size="14" /> Kalender
              </button>
              <button 
                @click="activeTab = 'logs'" 
                :class="['flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all', activeTab === 'logs' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-200']"
              >
                <Icon name="mingcute:pic-fill" size="14" /> Log & Foto Tap ({{ historyData?.data?.length || 0 }})
              </button>
            </div>
          </div>

          <!-- Body Scrollable Content -->
          <div class="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
            
            <!-- Loading Spinner -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3 text-primary">
              <span class="loading loading-spinner loading-lg"></span>
              <span class="text-xs font-bold text-slate-400">Memuat riwayat presensi...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="errorMsg" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-3">
              <Icon name="mingcute:warning-fill" size="22" class="shrink-0 text-rose-500" />
              <span>{{ errorMsg }}</span>
            </div>

            <!-- Main Content Area -->
            <template v-else>
              <!-- Summary Bento Stats -->
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div class="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/25 p-3.5 rounded-2xl text-center shadow-lg shadow-emerald-950/20 relative overflow-hidden group">
                  <div class="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
                    <Icon name="mingcute:check-circle-fill" size="18" />
                    <span class="text-xl sm:text-2xl font-black">{{ summaryStats.hadir || 0 }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase text-emerald-400/80 tracking-widest">Hadir</p>
                </div>

                <div class="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/25 p-3.5 rounded-2xl text-center shadow-lg shadow-amber-950/20 relative overflow-hidden group">
                  <div class="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
                    <Icon name="mingcute:time-fill" size="18" />
                    <span class="text-xl sm:text-2xl font-black">{{ summaryStats.terlambat || 0 }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase text-amber-400/80 tracking-widest">Terlambat</p>
                </div>

                <div class="bg-gradient-to-br from-sky-500/15 to-sky-500/5 border border-sky-500/25 p-3.5 rounded-2xl text-center shadow-lg shadow-sky-950/20 relative overflow-hidden group">
                  <div class="flex items-center justify-center gap-1.5 text-sky-400 mb-1">
                    <Icon name="mingcute:document-fill" size="18" />
                    <span class="text-xl sm:text-2xl font-black">{{ summaryStats.izin || 0 }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase text-sky-400/80 tracking-widest">Izin</p>
                </div>

                <div class="bg-gradient-to-br from-orange-500/15 to-orange-500/5 border border-orange-500/25 p-3.5 rounded-2xl text-center shadow-lg shadow-orange-950/20 relative overflow-hidden group">
                  <div class="flex items-center justify-center gap-1.5 text-orange-400 mb-1">
                    <Icon name="mingcute:hospital-fill" size="18" />
                    <span class="text-xl sm:text-2xl font-black">{{ summaryStats.sakit || 0 }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase text-orange-400/80 tracking-widest">Sakit</p>
                </div>

                <div class="col-span-2 sm:col-span-1 bg-gradient-to-br from-rose-500/15 to-rose-500/5 border border-rose-500/25 p-3.5 rounded-2xl text-center shadow-lg shadow-rose-950/20 relative overflow-hidden group">
                  <div class="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
                    <Icon name="mingcute:close-circle-fill" size="18" />
                    <span class="text-xl sm:text-2xl font-black">{{ summaryStats.alpha || 0 }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase text-rose-400/80 tracking-widest">Alpha</p>
                </div>
              </div>

              <!-- TAB 1: CALENDAR VIEW -->
              <div v-if="activeTab === 'calendar'" class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <h5 class="text-xs font-black text-slate-400 uppercase tracking-widest">Grid Kalender Presensi</h5>
                    <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                      {{ summaryStats.percentage }}% Kehadiran
                    </span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-500">Klik tanggal untuk rincian log</span>
                </div>
                
                <!-- Weekday Headers -->
                <div class="grid grid-cols-7 gap-2 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest bg-slate-900/80 py-2.5 rounded-2xl border border-slate-800">
                  <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-400">Sab</span><span class="text-rose-400">Min</span>
                </div>

                <!-- Day Grid Cells -->
                <div class="grid grid-cols-7 gap-2">
                  <div 
                    v-for="cell in calendarCells" 
                    :key="cell.id"
                    @click="cell.data && (selectedDayLog = selectedDayLog === cell.data ? null : cell.data)"
                    :class="[
                      'min-h-[64px] sm:min-h-[72px] rounded-2xl p-2 flex flex-col justify-between transition-all border text-xs font-bold relative group',
                      cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                      cell.isWeekend ? 'bg-slate-900/40 border-slate-800/80 text-slate-500' : 'bg-slate-900/80 border-slate-800 text-slate-300',
                      cell.data ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg' : '',
                      selectedDayLog === cell.data ? 'ring-2 ring-primary scale-105 shadow-primary/20 z-10' : '',
                      cell.data?.status === 'HADIR' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : '',
                      cell.data?.status === 'TERLAMBAT' ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : '',
                      cell.data?.status === 'IZIN' ? 'bg-sky-950/30 border-sky-500/40 text-sky-300' : '',
                      cell.data?.status === 'SAKIT' ? 'bg-orange-950/30 border-orange-500/40 text-orange-300' : '',
                      cell.data?.status === 'ALPHA' ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : ''
                    ]"
                  >
                    <!-- Top row: Day number + status indicator -->
                    <div class="flex items-center justify-between">
                      <span :class="['text-xs font-black', cell.isWeekend ? 'text-rose-400' : '']">{{ cell.day }}</span>
                      <Icon 
                        v-if="cell.data" 
                        :name="getStatusBadge(cell.data.status).icon" 
                        size="14" 
                      />
                    </div>

                    <!-- Bottom row: Status label or times -->
                    <div v-if="cell.data" class="mt-1">
                      <div class="text-[9px] font-black uppercase tracking-tight truncate">
                        {{ getStatusBadge(cell.data.status).label }}
                      </div>
                      <div class="text-[8px] font-mono text-slate-400 mt-0.5 truncate" v-if="cell.data.firstIn">
                        {{ formatLogTime(cell.data.firstIn.timestamp) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Day Log Banner when Cell Clicked -->
                <div v-if="selectedDayLog" class="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3 animate-in fade-in duration-200">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase tracking-widest text-primary">Detail Tapping Tanggal Ini</span>
                      <span class="text-xs font-mono font-bold text-slate-300">({{ formatLogDate(selectedDayLog.firstIn?.timestamp) }})</span>
                    </div>
                    <button @click="selectedDayLog = null" class="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-white">
                      <Icon name="mingcute:close-line" size="16" />
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                    <div v-for="log in selectedDayLog.logs" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <!-- Photo Thumbnail -->
                      <div 
                        class="w-11 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 relative cursor-pointer group/img"
                        @click="openImagePreview(getLogPhoto(log))"
                      >
                        <img 
                          v-if="getLogPhoto(log)" 
                          :src="getLogPhoto(log)" 
                          alt="scan" 
                          class="w-full h-full object-cover group-hover/img:scale-110 transition-transform" 
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                          <Icon name="mingcute:pic-line" size="16" />
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-mono font-bold text-white">{{ formatLogTime(log.timestamp) }}</span>
                          <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase', getStatusBadge(log.status).badge]">
                            {{ getStatusBadge(log.status).label }}
                          </span>
                        </div>
                        <p class="text-[9px] font-bold text-slate-400 truncate mt-0.5" v-if="log.device">
                          <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                          {{ log.device.name }} ({{ log.device.location || 'Utama' }})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TAB 2: LOGS & PHOTOS TIMELINE VIEW -->
              <div v-else class="space-y-3">
                <div class="flex items-center justify-between mb-2">
                  <h5 class="text-xs font-black text-slate-400 uppercase tracking-widest">Daftar Foto & Log Scan Kehadiran</h5>
                  <span class="text-[10px] font-bold text-slate-500" v-if="historyData?.data?.length">Total {{ historyData.data.length }} Tapping</span>
                </div>

                <div v-if="historyData?.data && historyData.data.length" class="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                  <div 
                    v-for="log in historyData.data" 
                    :key="log.id" 
                    class="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors group"
                  >
                    <!-- Captured Photo Thumbnail -->
                    <div 
                      class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 relative shadow-inner cursor-pointer group/img"
                      @click="openImagePreview(getLogPhoto(log))"
                    >
                      <img 
                        v-if="getLogPhoto(log)" 
                        :src="getLogPhoto(log)" 
                        alt="scan" 
                        class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800">
                        <Icon name="mingcute:pic-line" size="22" />
                      </div>
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Icon name="mingcute:zoom-in-line" size="16" />
                      </div>
                    </div>

                    <!-- Log Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2 flex-wrap">
                        <span class="font-black text-sm text-white font-mono">
                          {{ formatLogDate(log.timestamp) }} · {{ formatLogTime(log.timestamp) }}
                        </span>
                        <span :class="['px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider', getStatusBadge(log.status).badge]">
                          {{ getStatusBadge(log.status).label }}
                        </span>
                      </div>
                      
                      <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                        <span v-if="log.device" class="flex items-center gap-1 font-bold text-slate-300">
                          <Icon name="mingcute:location-fill" size="13" class="text-primary" />
                          {{ log.device.name }} <span class="text-slate-500">({{ log.device.location || 'Utama' }})</span>
                        </span>
                        <span class="text-slate-600">·</span>
                        <span class="font-mono text-[10px] text-slate-500 uppercase">
                          Metode: {{ log.method || 'FACE_RECOGNITION' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else class="flex flex-col items-center justify-center py-16 opacity-40">
                  <Icon name="mingcute:calendar-line" size="48" class="text-slate-500" />
                  <p class="text-xs font-black uppercase tracking-wider mt-3 text-slate-400">Belum ada data presensi pada bulan ini</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
            <span class="text-[10px] font-bold text-slate-500 hidden sm:inline">
              Gerbang Akses Pintar & Kehadiran GASKAN
            </span>
            <button @click="closeModal" class="btn btn-ghost btn-sm rounded-xl font-black px-6 text-slate-300 hover:text-white">
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
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
