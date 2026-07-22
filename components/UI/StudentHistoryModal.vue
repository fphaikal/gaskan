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

// Date Selection & Active Tab State
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const activeTab = ref('logs'); // Default to 'logs' per user requirement (calendar as optional tab)

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
    const res = await $fetch(`/api/attendance/student/${targetId.value}?month=${selectedMonth.value}&year=${selectedYear.value}`)
      .catch(() => $fetch(`/api/log/kehadiran/${targetId.value}`));

    if (Array.isArray(res)) {
      historyData.value = { data: res };
    } else if (res?.data && Array.isArray(res.data)) {
      historyData.value = res;
    } else if (res?.absen && Array.isArray(res.absen)) {
      // Handle legacy endpoint format
      const legacyLogs = [];
      res.absen.forEach(day => {
        if (day.enter && day.enter.time && day.enter.time.length) {
          day.enter.time.forEach((t, i) => {
            legacyLogs.push({
              id: `enter-${day.tanggal}-${i}`,
              timestamp: `${day.tanggal}T${t}`,
              status: day.indexTelat ? 'TERLAMBAT' : 'HADIR',
              notes: day.enter.image ? day.enter.image[i] : null,
              gate: day.enter.gate ? day.enter.gate[i] : 'Gerbang Utama'
            });
          });
        }
        if (day.exit && day.exit.time && day.exit.time.length) {
          day.exit.time.forEach((t, i) => {
            legacyLogs.push({
              id: `exit-${day.tanggal}-${i}`,
              timestamp: `${day.tanggal}T${t}`,
              status: 'PULANG',
              notes: day.exit.image ? day.exit.image[i] : null,
              gate: day.exit.gate ? day.exit.gate[i] : 'Gerbang Utama'
            });
          });
        }
      });
      historyData.value = {
        student: {
          name: res.Nama,
          nis: res.NIS,
          className: res.Kelas
        },
        data: legacyLogs
      };
    } else {
      historyData.value = res || null;
    }
  } catch (err) {
    console.error('Failed to fetch student attendance history:', err);
    errorMsg.value = err?.data?.message || err?.message || 'Gagal memuat riwayat presensi siswa';
  } finally {
    loading.value = false;
  }
};

watch([() => props.modelValue, targetId], ([newVisible, newId]) => {
  if (newVisible && newId) {
    activeTab.value = 'logs'; // Reset to default logs tab
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

// Robust data extractors
const rawLogs = computed(() => {
  if (!historyData.value) return [];
  if (Array.isArray(historyData.value)) return historyData.value;
  if (Array.isArray(historyData.value.data)) return historyData.value.data;
  return [];
});

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
  if (historyData.value?.summary && typeof historyData.value.summary === 'object') {
    const s = historyData.value.summary;
    const totalAcc = (s.hadir || 0) + (s.terlambat || 0) + (s.izin || 0) + (s.sakit || 0) + (s.alpha || 0);
    const percentage = totalAcc > 0 ? Math.round((((s.hadir || 0) + (s.terlambat || 0)) / totalAcc) * 100) : 0;
    return { ...s, percentage };
  }

  const dayStatuses = new Map();
  rawLogs.value.forEach(log => {
    if (!log.timestamp) return;
    const d = new Date(log.timestamp);
    const dateStr = d.toLocaleDateString('en-CA');
    if (!dayStatuses.has(dateStr)) {
      dayStatuses.set(dateStr, log.status);
    }
  });

  const list = Array.from(dayStatuses.values());
  const hadir = list.filter(s => s === 'HADIR').length;
  const terlambat = list.filter(s => s === 'TERLAMBAT').length;
  const izin = list.filter(s => s === 'IZIN').length;
  const sakit = list.filter(s => s === 'SAKIT').length;
  const alpha = list.filter(s => s === 'ALPHA').length;
  const total = list.length;
  const percentage = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

  return { hadir, terlambat, izin, sakit, alpha, total, percentage };
});

const computedDailyMap = computed(() => {
  if (historyData.value?.dailyMap && typeof historyData.value.dailyMap === 'object') {
    return historyData.value.dailyMap;
  }

  const map = {};
  rawLogs.value.forEach(log => {
    if (!log.timestamp) return;
    const d = new Date(log.timestamp);
    const dateStr = d.toLocaleDateString('en-CA');
    if (!map[dateStr]) {
      map[dateStr] = { status: log.status, firstIn: log, lastOut: null, logs: [] };
    }
    map[dateStr].logs.push(log);
  });

  Object.values(map).forEach(entry => {
    entry.logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    entry.firstIn = entry.logs[0];
    if (entry.logs.length > 1) {
      entry.lastOut = entry.logs[entry.logs.length - 1];
    }
  });

  return map;
});

// Calendar grid generation
const calendarCells = computed(() => {
  const cells = [];
  const year = selectedYear.value;
  const month = selectedMonth.value - 1; // 0-indexed
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6;
  
  for (let i = 0; i < startDay; i++) {
    cells.push({ id: `empty-${i}`, type: 'empty' });
  }
  
  const dailyMap = computedDailyMap.value;
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
        badge: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30',
        label: 'Hadir',
        icon: 'mingcute:check-circle-fill'
      };
    case 'TERLAMBAT':
      return {
        badge: 'bg-amber-500/10 text-amber-600 border border-amber-500/30',
        label: 'Lambat',
        icon: 'mingcute:time-fill'
      };
    case 'IZIN':
      return {
        badge: 'bg-sky-500/10 text-sky-600 border border-sky-500/30',
        label: 'Izin',
        icon: 'mingcute:document-fill'
      };
    case 'SAKIT':
      return {
        badge: 'bg-orange-500/10 text-orange-600 border border-orange-500/30',
        label: 'Sakit',
        icon: 'mingcute:hospital-fill'
      };
    case 'PULANG':
      return {
        badge: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30',
        label: 'Pulang',
        icon: 'mingcute:exit-line'
      };
    case 'ALPHA':
    case 'BELUM_ABSEN':
      return {
        badge: 'bg-rose-500/10 text-rose-600 border border-rose-500/30',
        label: 'Alpha',
        icon: 'mingcute:close-circle-fill'
      };
    default:
      return {
        badge: 'bg-base-200 text-base-content/70 border border-base-300',
        label: status || 'Tap Scan',
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
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Main Modal Container (Native Theme Design) -->
        <div class="relative bg-base-100 text-base-content rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden z-10 border border-base-200/80 flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="p-5 sm:p-6 bg-base-200/50 border-b border-base-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-4 min-w-0">
              <!-- Student Avatar -->
              <div 
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-base-200 border-2 border-primary/30 shrink-0 shadow-md relative cursor-pointer group"
                @click="openImagePreview(studentDetail.photoUrl || studentDetail.faceUrl)"
              >
                <img 
                  v-if="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :src="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :alt="studentDetail.name" 
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl sm:text-2xl">
                  {{ studentDetail.name?.charAt(0) || 'S' }}
                </div>
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Icon name="mingcute:zoom-in-line" size="18" />
                </div>
              </div>

              <!-- Student Meta Info -->
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Detail History Siswa
                  </span>
                  <span class="text-xs font-mono font-bold text-base-content/60 bg-base-200 px-2 py-0.5 rounded-md border border-base-300">
                    NIS: {{ studentDetail.nis }}
                  </span>
                  <span class="text-xs font-mono font-bold text-base-content/60 bg-base-200 px-2 py-0.5 rounded-md border border-base-300" v-if="studentDetail.nisn">
                    NISN: {{ studentDetail.nisn }}
                  </span>
                </div>

                <h3 class="text-xl sm:text-2xl font-black text-base-content truncate leading-tight">{{ studentDetail.name }}</h3>
                <p class="text-xs sm:text-sm font-semibold text-base-content/60 truncate mt-0.5 flex items-center gap-2">
                  <span class="text-primary font-bold">{{ studentDetail.className }}</span>
                  <span v-if="studentDetail.majorName" class="text-base-content/40">· {{ studentDetail.majorName }}</span>
                </p>
              </div>
            </div>

            <!-- Header Controls -->
            <div class="flex items-center gap-2 shrink-0">
              <button 
                @click="fetchHistory" 
                class="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
                title="Refresh Data"
              >
                <Icon name="mingcute:refresh-3-line" size="18" :class="{ 'animate-spin': loading }" />
              </button>
              <button @click="closeModal" class="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content">
                <Icon name="mingcute:close-line" size="22" />
              </button>
            </div>
          </div>

          <!-- Filter & View Switcher Bar -->
          <div class="px-6 py-3.5 bg-base-200/30 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <!-- Period Selector -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 text-xs font-black text-base-content/60 uppercase tracking-wider">
                <Icon name="mingcute:calendar-fill" size="16" class="text-primary" />
                <span>Periode:</span>
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

            <!-- View Switcher Tabs (Logs is primary, Calendar as additional menu) -->
            <div class="flex bg-base-200 p-1 rounded-2xl border border-base-300">
              <button 
                @click="activeTab = 'logs'" 
                :class="['flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all', activeTab === 'logs' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/60 hover:text-base-content']"
              >
                <Icon name="mingcute:pic-fill" size="15" /> Detail Log & Foto Tap ({{ rawLogs.length }})
              </button>
              <button 
                @click="activeTab = 'calendar'" 
                :class="['flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all', activeTab === 'calendar' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/60 hover:text-base-content']"
              >
                <Icon name="mingcute:calendar-2-fill" size="15" /> Menu Kalender
              </button>
            </div>
          </div>

          <!-- Body Scrollable Content -->
          <div class="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
            
            <!-- Loading Spinner -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3 text-primary">
              <span class="loading loading-spinner loading-lg"></span>
              <span class="text-xs font-bold text-base-content/50">Memuat data presensi...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="errorMsg" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-3">
              <Icon name="mingcute:warning-fill" size="22" class="shrink-0" />
              <span>{{ errorMsg }}</span>
            </div>

            <!-- Main Content Area -->
            <template v-else>
              <!-- Summary Stat Badges -->
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div class="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-center shadow-sm">
                  <div class="flex items-center justify-center gap-1.5 text-emerald-600 mb-0.5">
                    <Icon name="mingcute:check-circle-fill" size="18" />
                    <span class="text-xl font-black">{{ summaryStats.hadir || 0 }}</span>
                  </div>
                  <p class="text-[9px] font-black uppercase text-emerald-600/70 tracking-wider">Hadir</p>
                </div>

                <div class="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-center shadow-sm">
                  <div class="flex items-center justify-center gap-1.5 text-amber-600 mb-0.5">
                    <Icon name="mingcute:time-fill" size="18" />
                    <span class="text-xl font-black">{{ summaryStats.terlambat || 0 }}</span>
                  </div>
                  <p class="text-[9px] font-black uppercase text-amber-600/70 tracking-wider">Lambat</p>
                </div>

                <div class="bg-sky-500/10 border border-sky-500/20 p-3 rounded-2xl text-center shadow-sm">
                  <div class="flex items-center justify-center gap-1.5 text-sky-600 mb-0.5">
                    <Icon name="mingcute:document-fill" size="18" />
                    <span class="text-xl font-black">{{ summaryStats.izin || 0 }}</span>
                  </div>
                  <p class="text-[9px] font-black uppercase text-sky-600/70 tracking-wider">Izin</p>
                </div>

                <div class="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl text-center shadow-sm">
                  <div class="flex items-center justify-center gap-1.5 text-orange-600 mb-0.5">
                    <Icon name="mingcute:hospital-fill" size="18" />
                    <span class="text-xl font-black">{{ summaryStats.sakit || 0 }}</span>
                  </div>
                  <p class="text-[9px] font-black uppercase text-orange-600/70 tracking-wider">Sakit</p>
                </div>

                <div class="col-span-2 sm:col-span-1 bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-center shadow-sm">
                  <div class="flex items-center justify-center gap-1.5 text-rose-600 mb-0.5">
                    <Icon name="mingcute:close-circle-fill" size="18" />
                    <span class="text-xl font-black">{{ summaryStats.alpha || 0 }}</span>
                  </div>
                  <p class="text-[9px] font-black uppercase text-rose-600/70 tracking-wider">Alpha</p>
                </div>
              </div>

              <!-- TAB 1: DEFAULT - DETAIL LOGS & PHOTOS TIMELINE -->
              <div v-if="activeTab === 'logs'" class="space-y-3">
                <div class="flex items-center justify-between mb-2">
                  <h5 class="text-xs font-black text-base-content/50 uppercase tracking-widest">Rincian Tapping & Foto Bukti Scan</h5>
                  <span class="text-[10px] font-bold text-base-content/40" v-if="rawLogs.length">Total {{ rawLogs.length }} Tapping</span>
                </div>

                <div v-if="rawLogs.length" class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                  <div 
                    v-for="log in rawLogs" 
                    :key="log.id || log.timestamp" 
                    class="flex items-center gap-4 p-3.5 rounded-2xl bg-base-200/40 border border-base-200/70 hover:bg-base-200/80 transition-colors group"
                  >
                    <!-- Captured Photo Thumbnail with Lightbox Toggle -->
                    <div 
                      class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-base-200 border border-base-300 shrink-0 relative shadow-sm cursor-pointer group/img"
                      @click="openImagePreview(getLogPhoto(log))"
                    >
                      <img 
                        v-if="getLogPhoto(log)" 
                        :src="getLogPhoto(log)" 
                        alt="scan" 
                        class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                      />
                      <div v-else class="w-full h-full flex items-center justify-center text-base-content/30 bg-base-200">
                        <Icon name="mingcute:pic-line" size="24" />
                      </div>
                      <div class="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Icon name="mingcute:zoom-in-line" size="18" />
                      </div>
                    </div>

                    <!-- Log Details -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2 flex-wrap">
                        <span class="font-black text-sm text-base-content font-mono">
                          {{ formatLogDate(log.timestamp) }} · {{ formatLogTime(log.timestamp) }}
                        </span>
                        <span :class="['px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider', getStatusBadge(log.status).badge]">
                          {{ getStatusBadge(log.status).label }}
                        </span>
                      </div>
                      
                      <div class="flex items-center gap-3 mt-1.5 text-xs text-base-content/60 flex-wrap">
                        <span v-if="log.device || log.gate" class="flex items-center gap-1 font-bold text-base-content/80">
                          <Icon name="mingcute:location-fill" size="14" class="text-primary" />
                          {{ log.device?.name || log.gate || 'Mesin Scan' }}
                          <span v-if="log.device?.location" class="text-base-content/40">({{ log.device.location }})</span>
                        </span>
                        <span class="text-base-content/20">·</span>
                        <span class="font-mono text-[10px] text-base-content/40 uppercase">
                          Metode: {{ log.method || 'FACE_RECOGNITION' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else class="flex flex-col items-center justify-center py-16 opacity-40">
                  <Icon name="mingcute:calendar-line" size="48" />
                  <p class="text-xs font-black uppercase tracking-wider mt-3">Belum ada data presensi pada bulan ini</p>
                </div>
              </div>

              <!-- TAB 2: OPTIONAL MENU - CALENDAR VIEW -->
              <div v-else class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <h5 class="text-xs font-black text-base-content/50 uppercase tracking-widest">Menu Kalender Kehadiran</h5>
                    <span class="text-[10px] bg-base-200 text-base-content/70 px-2 py-0.5 rounded-md border border-base-300 font-mono">
                      {{ summaryStats.percentage }}% Kehadiran
                    </span>
                  </div>
                  <span class="text-[10px] font-bold text-base-content/40">Klik tanggal untuk filter detail tap</span>
                </div>
                
                <!-- Weekday Headers -->
                <div class="grid grid-cols-7 gap-2 text-center font-black text-[10px] text-base-content/40 uppercase tracking-widest bg-base-200/50 py-2.5 rounded-2xl border border-base-200">
                  <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-400">Sab</span><span class="text-rose-400">Min</span>
                </div>

                <!-- Day Grid Cells -->
                <div class="grid grid-cols-7 gap-2">
                  <div 
                    v-for="cell in calendarCells" 
                    :key="cell.id"
                    @click="cell.data && (selectedDayLog = selectedDayLog === cell.data ? null : cell.data)"
                    :class="[
                      'min-h-[60px] sm:min-h-[68px] rounded-2xl p-2 flex flex-col justify-between transition-all border text-xs font-bold relative group',
                      cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                      cell.isWeekend ? 'bg-base-200/30 border-base-200 text-base-content/40' : 'bg-base-100 border-base-200 text-base-content',
                      cell.data ? 'cursor-pointer hover:scale-[1.03] hover:shadow-md' : '',
                      selectedDayLog === cell.data ? 'ring-2 ring-primary scale-105 shadow-primary/20 z-10' : '',
                      cell.data?.status === 'HADIR' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600' : '',
                      cell.data?.status === 'TERLAMBAT' ? 'bg-amber-500/10 border-amber-500/40 text-amber-600' : '',
                      cell.data?.status === 'IZIN' ? 'bg-sky-500/10 border-sky-500/40 text-sky-600' : '',
                      cell.data?.status === 'SAKIT' ? 'bg-orange-500/10 border-orange-500/40 text-orange-600' : '',
                      cell.data?.status === 'ALPHA' ? 'bg-rose-500/10 border-rose-500/40 text-rose-600' : ''
                    ]"
                  >
                    <!-- Top row: Day number + status icon -->
                    <div class="flex items-center justify-between">
                      <span :class="['text-xs font-black', cell.isWeekend ? 'text-rose-400' : '']">{{ cell.day }}</span>
                      <Icon 
                        v-if="cell.data" 
                        :name="getStatusBadge(cell.data.status).icon" 
                        size="14" 
                      />
                    </div>

                    <!-- Bottom row: Status label -->
                    <div v-if="cell.data" class="mt-1">
                      <div class="text-[9px] font-black uppercase tracking-tight truncate">
                        {{ getStatusBadge(cell.data.status).label }}
                      </div>
                      <div class="text-[8px] font-mono text-base-content/50 mt-0.5 truncate" v-if="cell.data.firstIn">
                        {{ formatLogTime(cell.data.firstIn.timestamp) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Day Log Banner when Cell Clicked -->
                <div v-if="selectedDayLog" class="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black uppercase tracking-widest text-primary">Detail Tapping Tanggal Ini</span>
                      <span class="text-xs font-mono font-bold text-base-content/70">({{ formatLogDate(selectedDayLog.firstIn?.timestamp) }})</span>
                    </div>
                    <button @click="selectedDayLog = null" class="btn btn-ghost btn-xs btn-circle">
                      <Icon name="mingcute:close-line" size="16" />
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                    <div v-for="log in selectedDayLog.logs" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-xl bg-base-100 border border-base-200">
                      <!-- Photo Thumbnail -->
                      <div 
                        class="w-11 h-11 rounded-lg overflow-hidden bg-base-200 shrink-0 border border-base-200 relative cursor-pointer group/img"
                        @click="openImagePreview(getLogPhoto(log))"
                      >
                        <img 
                          v-if="getLogPhoto(log)" 
                          :src="getLogPhoto(log)" 
                          alt="scan" 
                          class="w-full h-full object-cover group-hover/img:scale-110 transition-transform" 
                        />
                        <div v-else class="w-full h-full flex items-center justify-center text-base-content/30 bg-base-200">
                          <Icon name="mingcute:pic-line" size="16" />
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-mono font-bold text-base-content">{{ formatLogTime(log.timestamp) }}</span>
                          <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase', getStatusBadge(log.status).badge]">
                            {{ getStatusBadge(log.status).label }}
                          </span>
                        </div>
                        <p class="text-[9px] font-bold text-base-content/50 truncate mt-0.5" v-if="log.device || log.gate">
                          <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                          {{ log.device?.name || log.gate || 'Mesin' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="p-4 bg-base-200/40 border-t border-base-200 flex items-center justify-between shrink-0">
            <span class="text-[10px] font-bold text-base-content/40 hidden sm:inline">
              Gerbang Akses Pintar & Kehadiran GASKAN
            </span>
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

.modal-enter-active, .modal-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
