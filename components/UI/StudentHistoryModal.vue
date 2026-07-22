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
const activeTab = ref('logs'); // Default to 'logs' per user requirement
const logSubFilter = ref('today'); // 'today' | 'all'

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
      // Legacy endpoint format mapping
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
    activeTab.value = 'logs';
    logSubFilter.value = 'today';
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

// Extract raw logs
const rawLogs = computed(() => {
  if (!historyData.value) return [];
  if (Array.isArray(historyData.value)) return historyData.value;
  if (Array.isArray(historyData.value.data)) return historyData.value.data;
  return [];
});

// Group logs by local date
const groupedLogs = computed(() => {
  const map = new Map();
  const todayStr = new Date().toLocaleDateString('en-CA');

  rawLogs.value.forEach(log => {
    if (!log.timestamp) return;
    const d = new Date(log.timestamp);
    const dateStr = d.toLocaleDateString('en-CA');

    if (!map.has(dateStr)) {
      map.set(dateStr, {
        dateStr,
        isToday: dateStr === todayStr,
        formattedDate: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        logs: []
      });
    }
    map.get(dateStr).logs.push(log);
  });

  // Sort groups descending by date
  return Array.from(map.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
});

// Today's logs group (or latest active day if no taps today)
const todayGroup = computed(() => {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const exactToday = groupedLogs.value.find(g => g.dateStr === todayStr);
  if (exactToday) return exactToday;
  return groupedLogs.value[0] || null;
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
  const month = selectedMonth.value - 1;
  
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
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        label: 'Hadir',
        icon: 'mingcute:check-circle-fill'
      };
    case 'TERLAMBAT':
      return {
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
        label: 'Lambat',
        icon: 'mingcute:time-fill'
      };
    case 'IZIN':
      return {
        badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
        label: 'Izin',
        icon: 'mingcute:document-fill'
      };
    case 'SAKIT':
      return {
        badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
        label: 'Sakit',
        icon: 'mingcute:hospital-fill'
      };
    case 'PULANG':
      return {
        badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
        label: 'Pulang',
        icon: 'mingcute:exit-line'
      };
    case 'ALPHA':
    case 'BELUM_ABSEN':
      return {
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
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

const getStatusDot = (status) => {
  switch (status) {
    case 'HADIR': return 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
    case 'TERLAMBAT': return 'bg-amber-500 shadow-sm shadow-amber-500/50';
    case 'IZIN': return 'bg-sky-500 shadow-sm shadow-sky-500/50';
    case 'SAKIT': return 'bg-orange-500 shadow-sm shadow-orange-500/50';
    case 'PULANG': return 'bg-indigo-500 shadow-sm shadow-indigo-500/50';
    case 'ALPHA':
    case 'BELUM_ABSEN': return 'bg-rose-500 shadow-sm shadow-rose-500/50';
    default: return 'bg-base-300';
  }
};

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
      <div v-if="isVisible" class="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-5" @click.self="closeModal">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Main Modal Container -->
        <div class="relative bg-base-100 text-base-content rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden z-10 border border-base-200/80 flex flex-col max-h-[92vh]">
          
          <!-- Header -->
          <div class="p-4 sm:p-6 bg-base-200/50 border-b border-base-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3 sm:gap-4 min-w-0">
              <!-- Student Avatar -->
              <div 
                class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-base-200 border-2 border-primary/30 shrink-0 shadow-md relative cursor-pointer group"
                @click="openImagePreview(studentDetail.photoUrl || studentDetail.faceUrl)"
              >
                <img 
                  v-if="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :src="studentDetail.photoUrl || studentDetail.faceUrl" 
                  :alt="studentDetail.name" 
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-lg sm:text-2xl">
                  {{ studentDetail.name?.charAt(0) || 'S' }}
                </div>
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Icon name="mingcute:zoom-in-line" size="18" />
                </div>
              </div>

              <!-- Student Meta Info -->
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Detail History Siswa
                  </span>
                  <span class="text-[10px] sm:text-xs font-mono font-bold text-base-content/60 bg-base-200 px-2 py-0.5 rounded-md border border-base-300">
                    NIS: {{ studentDetail.nis }}
                  </span>
                </div>

                <h3 class="text-lg sm:text-2xl font-black text-base-content truncate leading-tight">{{ studentDetail.name }}</h3>
                <p class="text-xs sm:text-sm font-semibold text-base-content/60 truncate mt-0.5 flex items-center gap-2">
                  <span class="text-primary font-bold">{{ studentDetail.className }}</span>
                  <span v-if="studentDetail.majorName" class="text-base-content/40">· {{ studentDetail.majorName }}</span>
                </p>
              </div>
            </div>

            <!-- Header Controls -->
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              <button 
                @click="fetchHistory" 
                class="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
                title="Refresh Data"
              >
                <Icon name="mingcute:refresh-3-line" size="18" :class="{ 'animate-spin': loading }" />
              </button>
              <button @click="closeModal" class="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>
          </div>

          <!-- Filter & View Switcher Bar -->
          <div class="px-4 sm:px-6 py-3 bg-base-200/40 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <!-- Period Selector -->
            <div class="flex items-center justify-between sm:justify-start gap-2">
              <div class="flex items-center gap-1.5 text-xs font-black text-base-content/60 uppercase tracking-wider">
                <Icon name="mingcute:calendar-fill" size="14" class="text-primary" />
                <span>Periode:</span>
              </div>
              <div class="flex gap-1.5">
                <select v-model="selectedMonth" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                  <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.name }}</option>
                </select>
                <select v-model="selectedYear" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
              </div>
            </div>

            <!-- View Switcher Tabs -->
            <div class="flex bg-base-200 p-1 rounded-2xl border border-base-300 shrink-0">
              <button 
                @click="activeTab = 'logs'" 
                :class="['flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all', activeTab === 'logs' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/60 hover:text-base-content']"
              >
                <Icon name="mingcute:pic-fill" size="14" /> Detail Log Tap ({{ rawLogs.length }})
              </button>
              <button 
                @click="activeTab = 'calendar'" 
                :class="['flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all', activeTab === 'calendar' ? 'bg-primary text-primary-content shadow-md' : 'text-base-content/60 hover:text-base-content']"
              >
                <Icon name="mingcute:calendar-2-fill" size="14" /> Menu Kalender
              </button>
            </div>
          </div>

          <!-- Body Scrollable Content -->
          <div class="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
            
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
              <!-- Compact Stat Cards (Grid-5 or Horizontal Scroll on Mobile) -->
              <div class="grid grid-cols-5 gap-1.5 sm:gap-3">
                <div class="bg-emerald-500/10 border border-emerald-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                  <div class="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
                    <Icon name="mingcute:check-circle-fill" size="14" class="hidden sm:inline" />
                    <span class="text-sm sm:text-xl font-black">{{ summaryStats.hadir || 0 }}</span>
                  </div>
                  <p class="text-[8px] sm:text-[9px] font-black uppercase text-emerald-600/80 tracking-tighter truncate">Hadir</p>
                </div>

                <div class="bg-amber-500/10 border border-amber-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                  <div class="flex items-center justify-center gap-1 text-amber-600 mb-0.5">
                    <Icon name="mingcute:time-fill" size="14" class="hidden sm:inline" />
                    <span class="text-sm sm:text-xl font-black">{{ summaryStats.terlambat || 0 }}</span>
                  </div>
                  <p class="text-[8px] sm:text-[9px] font-black uppercase text-amber-600/80 tracking-tighter truncate">Lambat</p>
                </div>

                <div class="bg-sky-500/10 border border-sky-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                  <div class="flex items-center justify-center gap-1 text-sky-600 mb-0.5">
                    <Icon name="mingcute:document-fill" size="14" class="hidden sm:inline" />
                    <span class="text-sm sm:text-xl font-black">{{ summaryStats.izin || 0 }}</span>
                  </div>
                  <p class="text-[8px] sm:text-[9px] font-black uppercase text-sky-600/80 tracking-tighter truncate">Izin</p>
                </div>

                <div class="bg-orange-500/10 border border-orange-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                  <div class="flex items-center justify-center gap-1 text-orange-600 mb-0.5">
                    <Icon name="mingcute:hospital-fill" size="14" class="hidden sm:inline" />
                    <span class="text-sm sm:text-xl font-black">{{ summaryStats.sakit || 0 }}</span>
                  </div>
                  <p class="text-[8px] sm:text-[9px] font-black uppercase text-orange-600/80 tracking-tighter truncate">Sakit</p>
                </div>

                <div class="bg-rose-500/10 border border-rose-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                  <div class="flex items-center justify-center gap-1 text-rose-600 mb-0.5">
                    <Icon name="mingcute:close-circle-fill" size="14" class="hidden sm:inline" />
                    <span class="text-sm sm:text-xl font-black">{{ summaryStats.alpha || 0 }}</span>
                  </div>
                  <p class="text-[8px] sm:text-[9px] font-black uppercase text-rose-600/80 tracking-tighter truncate">Alpha</p>
                </div>
              </div>

              <!-- TAB 1: DEFAULT - DAILY TAPPING LOGS & EVENT PHOTOS -->
              <div v-if="activeTab === 'logs'" class="space-y-4">
                
                <!-- Sub Filter Pills (Today vs All Days) -->
                <div class="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-base-200">
                  <div class="flex gap-1.5">
                    <button 
                      @click="logSubFilter = 'today'"
                      :class="['px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1', logSubFilter === 'today' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-base-200 text-base-content/60']"
                    >
                      <Icon name="mingcute:time-line" size="13" /> Tapping Hari Ini
                    </button>
                    <button 
                      @click="logSubFilter = 'all'"
                      :class="['px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1', logSubFilter === 'all' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-base-200 text-base-content/60']"
                    >
                      <Icon name="mingcute:list-unordered-line" size="13" /> Semua Log Bulan Ini ({{ rawLogs.length }})
                    </button>
                  </div>
                  <span class="text-[10px] font-mono font-bold text-base-content/40">
                    {{ summaryStats.percentage }}% Tingkat Kehadiran
                  </span>
                </div>

                <!-- MODE A: TODAY'S LOGS GROUP -->
                <div v-if="logSubFilter === 'today'" class="space-y-3">
                  <div v-if="todayGroup" class="space-y-3">
                    <!-- Date Header Card -->
                    <div class="p-3 rounded-2xl bg-base-200/60 border border-base-200 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="font-black text-xs sm:text-sm text-base-content capitalize">
                          {{ todayGroup.formattedDate }}
                        </span>
                        <span v-if="todayGroup.isToday" class="badge badge-primary badge-xs font-black">HARI INI</span>
                      </div>
                      <span class="text-[10px] font-mono font-bold text-base-content/50">
                        {{ todayGroup.logs.length }} Kali Scan Tap
                      </span>
                    </div>

                    <!-- Today's Individual Tapping Events -->
                    <div class="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                      <div 
                        v-for="log in todayGroup.logs" 
                        :key="log.id || log.timestamp"
                        class="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-base-100 border border-base-200 shadow-sm hover:border-primary/40 transition-colors"
                      >
                        <!-- Scan Photo Thumbnail -->
                        <div 
                          class="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-base-200 border border-base-300 shrink-0 relative cursor-pointer group/img"
                          @click="openImagePreview(getLogPhoto(log))"
                        >
                          <img 
                            v-if="getLogPhoto(log)" 
                            :src="getLogPhoto(log)" 
                            alt="scan" 
                            class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                          />
                          <div v-else class="w-full h-full flex items-center justify-center text-base-content/30 bg-base-200">
                            <Icon name="mingcute:pic-line" size="20" />
                          </div>
                          <div class="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Icon name="mingcute:zoom-in-line" size="16" />
                          </div>
                        </div>

                        <!-- Event Information -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <span class="font-black text-sm sm:text-base font-mono text-base-content">
                              {{ formatLogTime(log.timestamp) }}
                            </span>
                            <span :class="['px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider', getStatusBadge(log.status).badge]">
                              {{ getStatusBadge(log.status).label }}
                            </span>
                          </div>

                          <div class="flex items-center gap-2 mt-1 text-xs text-base-content/60 flex-wrap">
                            <span v-if="log.device || log.gate" class="flex items-center gap-1 font-bold text-base-content/80">
                              <Icon name="mingcute:location-fill" size="13" class="text-primary shrink-0" />
                              {{ log.device?.name || log.gate || 'Mesin Tap' }}
                              <span v-if="log.device?.location" class="text-base-content/40 hidden sm:inline">({{ log.device.location }})</span>
                            </span>
                            <span class="text-base-content/30">·</span>
                            <span class="font-mono text-[10px] text-base-content/40 uppercase">
                              {{ log.method || 'FACE_RECOGNITION' }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Empty Today State -->
                  <div v-else class="flex flex-col items-center justify-center py-12 opacity-40">
                    <Icon name="mingcute:time-line" size="40" />
                    <p class="text-xs font-black uppercase tracking-wider mt-2">Belum ada catatan scan tap hari ini</p>
                  </div>
                </div>

                <!-- MODE B: ALL MONTHLY LOGS GROUPED BY DATE -->
                <div v-else class="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  <div v-if="groupedLogs.length" v-for="group in groupedLogs" :key="group.dateStr" class="space-y-2">
                    <!-- Day Group Header -->
                    <div class="sticky top-0 z-10 px-3 py-1.5 rounded-xl bg-base-200/90 backdrop-blur-sm border border-base-300 flex items-center justify-between text-xs font-bold">
                      <span class="text-base-content capitalize flex items-center gap-1.5">
                        <Icon name="mingcute:calendar-fill" size="12" class="text-primary" />
                        {{ group.formattedDate }}
                      </span>
                      <span class="text-[9px] font-mono text-base-content/50">
                        {{ group.logs.length }} Event Tap
                      </span>
                    </div>

                    <!-- Logs under this date -->
                    <div class="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
                      <div 
                        v-for="log in group.logs" 
                        :key="log.id || log.timestamp" 
                        class="flex items-center gap-3 p-2.5 rounded-xl bg-base-100 border border-base-200 shadow-xs"
                      >
                        <div 
                          class="w-11 h-11 rounded-lg overflow-hidden bg-base-200 border border-base-300 shrink-0 relative cursor-pointer group/img"
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
                            <span class="font-black text-xs font-mono text-base-content">
                              {{ formatLogTime(log.timestamp) }}
                            </span>
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

                  <div v-else class="flex flex-col items-center justify-center py-12 opacity-40">
                    <Icon name="mingcute:calendar-line" size="40" />
                    <p class="text-xs font-black uppercase tracking-wider mt-2">Belum ada data presensi bulan ini</p>
                  </div>
                </div>
              </div>

              <!-- TAB 2: OPTIONAL MENU - CALENDAR GRID (MINIMALIST & SLEEK) -->
              <div v-else class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h5 class="text-xs font-black text-base-content/60 uppercase tracking-widest">Menu Kalender Kehadiran</h5>
                    <p class="text-[10px] text-base-content/40 mt-0.5">Klik tanggal bertanda untuk melihat detail log</p>
                  </div>
                  <span class="text-[10px] font-mono font-bold bg-base-200 px-2.5 py-1 rounded-lg border border-base-300">
                    {{ summaryStats.percentage }}% Kehadiran
                  </span>
                </div>
                
                <div class="p-3 bg-base-200/30 rounded-3xl border border-base-200/80 space-y-2">
                  <!-- Weekday Headers -->
                  <div class="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-base-content/40 uppercase tracking-wider py-1.5">
                    <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-500">Sab</span><span class="text-rose-500">Min</span>
                  </div>

                  <!-- Day Grid Cells (Clean Minimalist Square Matrix) -->
                  <div class="grid grid-cols-7 gap-1.5">
                    <div 
                      v-for="cell in calendarCells" 
                      :key="cell.id"
                      @click="cell.data && (selectedDayLog = selectedDayLog === cell.data ? null : cell.data)"
                      :class="[
                        'aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-1 transition-all text-xs relative select-none',
                        cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                        !cell.data && cell.isWeekend ? 'bg-base-200/30 text-rose-400/80' : '',
                        !cell.data && !cell.isWeekend ? 'bg-base-200/50 text-base-content/70 hover:bg-base-200' : '',
                        cell.data ? 'cursor-pointer hover:scale-105 shadow-xs border' : '',
                        selectedDayLog === cell.data ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100 scale-105 shadow-md z-10' : '',
                        cell.data?.status === 'HADIR' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-black' : '',
                        cell.data?.status === 'TERLAMBAT' ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 font-black' : '',
                        cell.data?.status === 'IZIN' ? 'bg-sky-500/20 border-sky-500/40 text-sky-600 dark:text-sky-400 font-black' : '',
                        cell.data?.status === 'SAKIT' ? 'bg-orange-500/20 border-orange-500/40 text-orange-600 dark:text-orange-400 font-black' : '',
                        cell.data?.status === 'ALPHA' ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-400 font-black' : ''
                      ]"
                    >
                      <!-- Day Number -->
                      <span class="text-xs sm:text-sm font-black font-mono leading-none">{{ cell.day }}</span>

                      <!-- Status Indicator Dot -->
                      <div v-if="cell.data" class="w-1.5 h-1.5 rounded-full mt-1 bg-current shadow-xs"></div>
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

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <div v-for="log in selectedDayLog.logs" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-xl bg-base-100 border border-base-200">
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
          <div class="p-3.5 sm:p-4 bg-base-200/40 border-t border-base-200 flex items-center justify-between shrink-0">
            <span class="text-[10px] font-bold text-base-content/40 hidden sm:inline">
              Gerbang Akses Pintar & Kehadiran GASKAN
            </span>
            <button @click="closeModal" class="btn btn-ghost btn-sm rounded-xl font-black px-6 w-full sm:w-auto">
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
