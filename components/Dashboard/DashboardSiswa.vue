<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  user: Object
});

// Attendance data
const attendance = ref(null);
const loading = ref(true);

const fetchAttendance = async () => {
  try {
    const now = new Date();
    const data = await $fetch(`/api/attendance/my?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
    attendance.value = data?.data || null;
  } catch (e) {
    console.error('Failed to fetch attendance:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAttendance);

// Computed
const summary = computed(() => attendance.value?.summary || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, total: 0 });
const todayStatus = computed(() => attendance.value?.today);
const recentRecords = computed(() => (attendance.value?.attendances || []).slice(0, 10));
const attendanceRate = computed(() => {
  const s = summary.value;
  if (!s.total) return 0;
  return Math.round(((s.hadir + s.terlambat) / s.total) * 100);
});

// Status helpers
const statusConfig = {
  HADIR: { color: 'text-success', bg: 'bg-success/10', icon: 'mingcute:check-circle-fill', label: 'Hadir' },
  TERLAMBAT: { color: 'text-warning', bg: 'bg-warning/10', icon: 'mingcute:time-fill', label: 'Terlambat' },
  IZIN: { color: 'text-info', bg: 'bg-info/10', icon: 'mingcute:document-fill', label: 'Izin' },
  SAKIT: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: 'mingcute:heart-fill', label: 'Sakit' },
  ALPHA: { color: 'text-error', bg: 'bg-error/10', icon: 'mingcute:close-circle-fill', label: 'Alpha' },
};

const getStatus = (status) => statusConfig[status] || statusConfig.ALPHA;

const formatTime = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
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

    <!-- Riwayat Kehadiran Terakhir (Full span) -->
    <div :class="[bentoCard, 'lg:col-span-4']">
      <p class="text-base-content/70 font-medium mb-4">Riwayat Kehadiran Terakhir</p>
      <div v-if="loading" class="flex justify-center py-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      <div v-else-if="recentRecords.length === 0" class="text-center py-8 text-base-content/40">
        <Icon name="mingcute:inbox-line" class="text-5xl mb-2" />
        <p>Belum ada data kehadiran</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr class="text-base-content/50">
              <th>Tanggal</th>
              <th>Waktu</th>
              <th>Status</th>
              <th>Metode</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in recentRecords" :key="record.id" class="hover:bg-base-200/50">
              <td class="font-medium">{{ formatDate(record.timestamp) }}</td>
              <td>{{ formatTime(record.timestamp) }}</td>
              <td>
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="[getStatus(record.status).color, getStatus(record.status).bg]"
                >
                  <Icon :name="getStatus(record.status).icon" class="text-sm" />
                  {{ getStatus(record.status).label }}
                </span>
              </td>
              <td class="text-base-content/50 text-xs">
                {{ record.method === 'FACE_RECOGNITION' ? 'Face ID' : record.method === 'QR_CODE' ? 'QR Code' : 'Manual' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
  </div>
</template>
