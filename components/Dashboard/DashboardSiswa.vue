<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  user: Object
});

// Selected Month & Year
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());

const months = [
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

const years = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
});

// Lightbox state
const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

// Daily logs detail modal
const selectedDayLog = ref(null);
const showDetailModal = ref(false);
const openDayDetail = (day) => {
  if (day.record) {
    selectedDayLog.value = day;
    showDetailModal.value = true;
  }
};
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedDayLog.value = null;
};

// Attendance data
const attendance = ref(null);
const loading = ref(true);

const fetchAttendance = async () => {
  loading.value = true;
  try {
    const data = await $fetch(`/api/attendance/my?month=${selectedMonth.value}&year=${selectedYear.value}`);
    attendance.value = data?.data || null;
  } catch (e) {
    console.error('Failed to fetch attendance:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAttendance);

// Watch filters
watch([selectedMonth, selectedYear], fetchAttendance);

// Computed
const summary = computed(() => attendance.value?.summary || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, total: 0 });
const todayStatus = computed(() => attendance.value?.today);

const groupedByDate = computed(() => {
  if (!attendance.value?.attendances) return [];
  
  const groups = {};
  attendance.value.attendances.forEach(att => {
    const dateStr = att.timestamp.substring(0, 10); // YYYY-MM-DD
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(att);
  });
  
  const list = Object.keys(groups).map(dateStr => {
    const atts = groups[dateStr];
    atts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const checkIn = atts[0];
    const checkOut = atts.length > 1 ? atts[atts.length - 1] : null;
    
    const status = checkIn.status;
    const method = checkIn.method;
    
    return {
      date: dateStr,
      status,
      method,
      checkInTime: checkIn.timestamp,
      checkOutTime: checkOut ? checkOut.timestamp : null,
      photoUrl: checkIn.notes || null,
      checkOutPhotoUrl: checkOut ? checkOut.notes : null,
      logs: atts.map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        status: a.status,
        method: a.method,
        notes: a.notes
      }))
    };
  });
  
  return list;
});

const calendarDays = computed(() => {
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate();
  const list = [];
  
  const grouped = {};
  groupedByDate.value.forEach(item => {
    const d = new Date(item.date).getDate();
    grouped[d] = item;
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(selectedYear.value, selectedMonth.value - 1, i);
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    const isWeekendVal = dayOfWeek === 0 || dayOfWeek === 6;
    
    const compareDate = new Date(selectedYear.value, selectedMonth.value - 1, i);
    compareDate.setHours(0, 0, 0, 0);
    const isFuture = compareDate > today;
    
    const record = grouped[i];
    
    list.push({
      dayNum: i,
      dateObject: currentDate,
      isWeekend: isWeekendVal,
      isFuture,
      record: record || null
    });
  }
  
  return list.reverse();
});

const attendanceRate = computed(() => {
  const s = summary.value;
  if (!s.total) return 0;
  return Math.round(((s.hadir + s.terlambat) / s.total) * 100);
});

// Status helpers
const statusConfig = {
  HADIR: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500', icon: 'mingcute:check-circle-fill', label: 'Hadir' },
  TERLAMBAT: { color: 'text-amber-500', bg: 'bg-amber-500/10 border border-amber-500/30 text-amber-500', icon: 'mingcute:time-fill', label: 'Terlambat' },
  IZIN: { color: 'text-sky-500', bg: 'bg-sky-500/10 border border-sky-500/30 text-sky-500', icon: 'mingcute:document-fill', label: 'Izin' },
  SAKIT: { color: 'text-orange-400', bg: 'bg-orange-400/10 border border-orange-400/30 text-orange-400', icon: 'mingcute:heart-fill', label: 'Sakit' },
  ALPHA: { color: 'text-rose-500', bg: 'bg-rose-500/10 border border-rose-500/30 text-rose-500', icon: 'mingcute:close-circle-fill', label: 'Alpha' },
};

const getStatus = (status) => statusConfig[status] || statusConfig.ALPHA;

const formatTime = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateObj) => {
  return dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
};

const bentoCard = "bg-base-100 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50 transition-all duration-300 flex flex-col justify-center relative overflow-hidden";
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    
    <!-- Profil Siswa (2x1) -->
    <div :class="[bentoCard, 'lg:col-span-2 bg-gradient-to-br from-primary/20 to-base-100']">
      <div class="flex items-center gap-6">
        <div class="avatar">
          <div class="w-20 rounded-full overflow-hidden bg-primary text-primary-content shadow-inner">
            <img v-if="user?.url_picture" :src="user.url_picture" :alt="user?.Nama" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-3xl font-bold">
              {{ user?.Nama?.charAt(0) || 'S' }}
            </div>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-base-content">Halo, {{ user?.Nama?.split(' ')[0] || 'Siswa' }}!</h2>
          <p class="text-base-content/70 mt-1">{{ user?.Kelas }} · NIS: {{ user?.NIS || '-' }}</p>
        </div>
      </div>
    </div>

    <!-- Status Hari Ini (1x1) -->
    <div :class="bentoCard">
      <p class="text-base-content/70 font-medium mb-2 text-sm">Status Hari Ini</p>
      <div v-if="loading" class="flex items-center gap-3">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>
      <div v-else-if="todayStatus" class="flex items-center gap-3" :class="getStatus(todayStatus.status).color">
        <Icon :name="getStatus(todayStatus.status).icon" class="text-4xl" />
        <div>
          <span class="text-2xl font-bold">{{ getStatus(todayStatus.status).label }}</span>
          <p class="text-xs opacity-70">{{ formatTime(todayStatus.time) }}</p>
        </div>
      </div>
      <div v-else class="flex items-center gap-3 text-base-content/40">
        <Icon name="mingcute:time-line" class="text-4xl" />
        <span class="text-lg font-semibold">Belum Absen</span>
      </div>
    </div>

    <!-- Persentase Kehadiran (1x1) -->
    <div :class="bentoCard">
      <p class="text-base-content/70 font-medium mb-2 text-sm">Kehadiran Bulan Ini</p>
      <div class="flex items-end gap-2">
        <span class="text-4xl font-bold" :class="attendanceRate >= 80 ? 'text-success' : attendanceRate >= 60 ? 'text-warning' : 'text-error'">
          {{ attendanceRate }}%
        </span>
        <span class="text-sm text-base-content/50 pb-1">dari {{ summary.total }} hari</span>
      </div>
      <progress
        class="progress w-full mt-3"
        :class="attendanceRate >= 80 ? 'progress-success' : attendanceRate >= 60 ? 'progress-warning' : 'progress-error'"
        :value="attendanceRate"
        max="100"
      ></progress>
    </div>

    <!-- Rekap Absensi Bulan Ini (Full span) -->
    <div :class="[bentoCard, 'lg:col-span-4']">
      <p class="text-base-content/70 font-medium mb-4">Rekap Absensi Bulan Ini</p>
      <div v-if="loading" class="flex justify-center py-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      <div v-else class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-success/10 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-success mb-1">{{ summary.hadir }}</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Hadir</p>
        </div>
        <div class="bg-warning/10 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-warning mb-1">{{ summary.terlambat }}</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Terlambat</p>
        </div>
        <div class="bg-info/10 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-info mb-1">{{ summary.izin }}</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Izin</p>
        </div>
        <div class="bg-orange-400/10 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-orange-400 mb-1">{{ summary.sakit }}</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Sakit</p>
        </div>
        <div class="bg-error/10 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-error mb-1">{{ summary.alpha }}</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Alpha</p>
        </div>
      </div>
    </div>

    <!-- Riwayat Kehadiran Bulanan (Full span) -->
    <div :class="[bentoCard, 'lg:col-span-4 flex flex-col min-h-0']">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <p class="text-base-content/70 font-semibold text-lg">Riwayat Kehadiran Bulanan</p>
          <p class="text-xs text-base-content/40 font-medium">Lihat seluruh riwayat jam IN, OUT, beserta hasil foto tap absensi</p>
        </div>
        <!-- Select Month & Year -->
        <div class="flex gap-2">
          <select v-model="selectedMonth" class="select select-bordered select-sm rounded-xl font-bold">
            <option v-for="m in months" :key="m.value" :value="m.value">{{ m.name }}</option>
          </select>
          <select v-model="selectedYear" class="select select-bordered select-sm rounded-xl font-bold">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12 shrink-0">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      
      <div v-else class="overflow-x-auto w-full custom-scrollbar flex-1">
        <table class="table table-sm min-w-[720px] w-full">
          <thead>
            <tr class="text-base-content/30 text-[10px] font-black uppercase tracking-wider border-b border-base-200">
              <th class="w-32">Tanggal</th>
              <th class="w-36 text-center">Status</th>
              <th class="w-44 text-center">Jam IN / Masuk (Foto)</th>
              <th class="w-44 text-center">Jam OUT / Pulang (Foto)</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-base-200/50">
            <tr v-for="day in calendarDays" :key="day.dayNum" 
                :class="[
                  'hover:bg-base-200/30 transition-colors', 
                  day.isWeekend ? 'bg-base-200/10' : '',
                  day.isFuture ? 'opacity-30 pointer-events-none' : ''
                ]">
              <!-- Tanggal -->
              <td class="font-bold text-xs">
                {{ formatDate(day.dateObject) }}
              </td>

              <!-- Status -->
              <td class="text-center">
                <!-- If has record -->
                <span v-if="day.record"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  :class="[getStatus(day.record.status).color, getStatus(day.record.status).bg]"
                >
                  <Icon :name="getStatus(day.record.status).icon" class="text-xs" />
                  {{ getStatus(day.record.status).label }}
                </span>
                <!-- If weekend & no record -->
                <span v-else-if="day.isWeekend" class="text-[9px] font-black uppercase text-base-content/30 tracking-widest">
                  Akhir Pekan
                </span>
                <!-- If future & no record -->
                <span v-else-if="day.isFuture" class="text-[9px] font-black uppercase text-base-content/20 tracking-widest">
                  Mendatang
                </span>
                <!-- If past/today weekday & no record -->
                <span v-else
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider"
                  :class="[getStatus('ALPHA').color, getStatus('ALPHA').bg]"
                >
                  <Icon :name="getStatus('ALPHA').icon" class="text-xs" />
                  Tanpa Absen
                </span>
              </td>

              <!-- Jam IN (Foto) -->
              <td class="text-center">
                <div v-if="day.record" class="flex items-center justify-center gap-2">
                  <span class="text-xs font-mono font-bold text-base-content/80">{{ formatTime(day.record.checkInTime) }}</span>
                  <div class="w-8 h-8 rounded-lg overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-sm cursor-zoom-in group" @click="openImagePreview(day.record.photoUrl || props.user?.url_picture)">
                    <img v-if="day.record.photoUrl" :src="day.record.photoUrl" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <img v-else-if="props.user?.url_picture" :src="props.user.url_picture" class="w-full h-full object-cover group-hover:scale-110 transition-transform opacity-30" />
                    <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
                      <Icon name="mingcute:pic-line" size="14" />
                    </div>
                  </div>
                </div>
                <span v-else class="text-base-content/20">-</span>
              </td>

              <!-- Jam OUT (Foto) -->
              <td class="text-center">
                <div v-if="day.record && day.record.checkOutTime" class="flex items-center justify-center gap-2">
                  <span class="text-xs font-mono font-bold text-base-content/80">{{ formatTime(day.record.checkOutTime) }}</span>
                  <div class="w-8 h-8 rounded-lg overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-sm cursor-zoom-in group" @click="openImagePreview(day.record.checkOutPhotoUrl || props.user?.url_picture)">
                    <img v-if="day.record.checkOutPhotoUrl" :src="day.record.checkOutPhotoUrl" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <img v-else-if="props.user?.url_picture" :src="props.user.url_picture" class="w-full h-full object-cover group-hover:scale-110 transition-transform opacity-30" />
                    <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
                      <Icon name="mingcute:pic-line" size="14" />
                    </div>
                  </div>
                </div>
                <span v-else class="text-base-content/20">-</span>
              </td>

              <!-- Aksi / Detail logs -->
              <td class="text-right">
                <button v-if="day.record" @click="openDayDetail(day)" 
                        class="btn btn-ghost btn-xs rounded-lg hover:bg-primary/10 hover:text-primary font-bold">
                  {{ day.record.logs.length }} Log Tap
                </button>
                <span v-else class="text-base-content/20">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ DETAIL LOG TAP MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailModal && selectedDayLog" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="closeDetailModal">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden z-10 max-h-[85vh] flex flex-col">
            
            <!-- Modal Header -->
            <div class="p-6 border-b border-base-200/40 flex items-center justify-between shrink-0 bg-primary/5">
              <div>
                <h3 class="text-lg font-black text-base-content">Detail Log Tap Absensi</h3>
                <p class="text-xs text-base-content/40 font-bold uppercase tracking-wider mt-0.5">Tanggal: {{ formatDate(selectedDayLog.dateObject) }}</p>
              </div>
              <button @click="closeDetailModal" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div class="space-y-3">
                <div v-for="(log, idx) in selectedDayLog.record.logs" :key="log.id" 
                     class="flex items-center gap-4 p-3 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/60 transition-colors">
                  <!-- Index / Count -->
                  <div class="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] shrink-0">
                    {{ idx + 1 }}
                  </div>
                  <!-- Time -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-mono font-bold text-base-content">{{ formatTime(log.timestamp) }}</p>
                    <p class="text-[9px] font-black uppercase tracking-wider text-base-content/30 mt-0.5">
                      Metode: {{ log.method === 'FACE_RECOGNITION' ? 'Face ID' : log.method === 'QR_CODE' ? 'QR Code' : 'Manual' }}
                    </p>
                  </div>
                  <!-- Thumbnail Photo -->
                  <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-sm cursor-zoom-in group" @click="openImagePreview(log.notes || props.user?.url_picture)">
                    <img v-if="log.notes" :src="log.notes" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <img v-else-if="props.user?.url_picture" :src="props.user.url_picture" class="w-full h-full object-cover group-hover:scale-110 transition-transform opacity-30" />
                    <div v-else class="w-full h-full flex items-center justify-center text-base-content/20">
                      <Icon name="mingcute:pic-line" size="16" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-6 pt-0 shrink-0">
              <button @click="closeDetailModal" class="btn btn-ghost btn-block rounded-2xl font-black">Tutup</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.08); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
