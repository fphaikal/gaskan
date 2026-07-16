<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

useSeoMeta({
  title: 'Absensi Kelas | GASKAN',
  description: 'Kelola absensi siswa hari ini',
});

const { role } = storeToRefs(useAuthStore());
const { $toast } = useNuxtApp();

// State
const students = ref([]);
const summary = ref({});
const classes = ref([]);
const selectedClass = ref('');
const loading = ref(true);
const markingId = ref(null);

// Fetch
const fetchClassAttendance = async () => {
  loading.value = true;
  try {
    const params = selectedClass.value ? `?classId=${selectedClass.value}` : '';
    const data = await $fetch(`/api/attendance/class-today${params}`);
    students.value = data?.data || [];
    summary.value = data?.summary || {};
    classes.value = data?.classes || [];
  } catch (e) {
    console.error('Failed to fetch:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchClassAttendance);
watch(selectedClass, fetchClassAttendance);

// Mark attendance manually
const markAttendance = async (studentId, status) => {
  markingId.value = studentId;
  try {
    await $fetch('/api/attendance/create', {
      method: 'POST',
      body: {
        userId: studentId,
        status,
        method: 'MANUAL',
        timestamp: new Date().toISOString(),
      },
    });
    $toast.success('Absensi berhasil dicatat');
    await fetchClassAttendance();
  } catch (e) {
    console.error('Mark failed:', e);
    $toast.error('Gagal mencatat absensi: ' + (e?.data?.message || e?.message || ''));
  } finally {
    markingId.value = null;
  }
};

// Status helpers
const statusConfig = {
  HADIR: { color: 'text-success', bg: 'bg-success/10', badge: 'badge-success', icon: 'mingcute:check-circle-fill', label: 'Hadir' },
  TERLAMBAT: { color: 'text-warning', bg: 'bg-warning/10', badge: 'badge-warning', icon: 'mingcute:time-fill', label: 'Terlambat' },
  IZIN: { color: 'text-info', bg: 'bg-info/10', badge: 'badge-info', icon: 'mingcute:document-fill', label: 'Izin' },
  SAKIT: { color: 'text-orange-400', bg: 'bg-orange-400/10', badge: 'badge-warning', icon: 'mingcute:heart-fill', label: 'Sakit' },
  ALPHA: { color: 'text-error', bg: 'bg-error/10', badge: 'badge-error', icon: 'mingcute:close-circle-fill', label: 'Alpha' },
};
const getStatus = (s) => statusConfig[s] || statusConfig.ALPHA;

const formatTime = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const todayStr = computed(() => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

const bentoCard = "bg-base-100 rounded-3xl p-6 transition-all duration-300";
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-black text-base-content leading-tight">Absensi Kelas</h1>
        <p class="text-sm text-base-content/40 font-medium mt-0.5">{{ todayStr }}</p>
      </div>

      <!-- Class Filter -->
      <div class="relative w-full md:w-56 shrink-0">
        <select
          v-model="selectedClass"
          class="select select-bordered select-sm h-10 w-full rounded-xl bg-base-100 font-bold border-base-300"
        >
          <option value="">Semua Kelas</option>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">
            {{ cls.className }}
          </option>
        </select>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-4 sm:grid-cols-7 gap-3">
      <div class="bg-base-100 rounded-2xl p-3 border border-base-200/60 text-center col-span-1">
        <p class="text-lg font-black text-base-content">{{ summary.total || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest text-base-content/30 mt-0.5">Total</p>
      </div>
      <div class="bg-emerald-500 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.hadir || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Hadir</p>
      </div>
      <div class="bg-amber-400 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.terlambat || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Terlambat</p>
      </div>
      <div class="bg-sky-400 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.izin || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Izin</p>
      </div>
      <div class="bg-orange-400 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.sakit || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Sakit</p>
      </div>
      <div class="bg-rose-500 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.alpha || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Alpha</p>
      </div>
      <div class="bg-base-200/60 rounded-2xl p-3 text-center">
        <p class="text-lg font-black text-base-content/40">{{ summary.belumAbsen || 0 }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest text-base-content/30 mt-0.5">Belum</p>
      </div>
    </div>



    <!-- Table -->
    <div class="bg-base-100 rounded-3xl border border-base-200/60 shadow-sm overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-dots loading-lg text-orange-500"></span>
      </div>

      <!-- Empty -->
      <div v-else-if="!students.length" class="text-center py-16">
        <Icon name="mingcute:user-3-line" class="text-6xl text-base-content/20 mb-4" />
        <p class="text-lg font-semibold text-base-content/50">Tidak ada siswa ditemukan</p>
        <p class="text-sm text-base-content/40 mt-1">Pilih kelas untuk melihat daftar siswa</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-200/30 text-[10px] font-black uppercase tracking-widest text-base-content/40 border-b border-base-200">
              <th class="py-4 pl-6 w-12">#</th>
              <th class="py-4">Informasi Siswa</th>
              <th class="py-4">Kelas</th>
              <th class="py-4">Status</th>
              <th class="py-4">Waktu</th>
              <th class="py-4">Metode</th>
              <th class="py-4 pr-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-base-200/50">
            <tr v-for="(student, idx) in students" :key="student.id" class="group hover:bg-base-200/30 transition-colors">
              <td class="pl-6 text-[10px] font-black text-base-content/30">{{ idx + 1 }}</td>
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0">
                    <img v-if="student.photoUrl" :src="student.photoUrl" :alt="student.name" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-primary/50 font-black text-xs uppercase">
                      {{ student.name?.charAt(0) }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-sm text-base-content group-hover:text-primary transition-colors truncate">{{ student.name }}</p>
                    <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">{{ student.nis }}</p>
                  </div>
                </div>
              </td>
              <td class="text-[10px] font-black text-base-content/50">{{ student.class?.className || '-' }}</td>
              <td>
                <div v-if="student.attendance" class="flex items-center gap-1.5">
                  <div :class="['w-1.5 h-1.5 rounded-full', getStatus(student.attendance.status).bg.replace('/10', '')]"></div>
                  <span :class="['text-[10px] font-black uppercase tracking-wider', getStatus(student.attendance.status).color]">
                    {{ getStatus(student.attendance.status).label }}
                  </span>
                </div>
                <span v-else class="text-[9px] font-bold text-base-content/30 uppercase tracking-widest italic">Belum absen</span>
              </td>
              <td class="text-[10px] font-bold text-base-content/60">
                {{ student.attendance ? formatTime(student.attendance.timestamp) : '-' }}
              </td>
              <td class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">
                <template v-if="student.attendance">
                  {{ student.attendance.method === 'FACE_RECOGNITION' ? 'Face ID' : student.attendance.method === 'QR_CODE' ? 'QR' : 'Manual' }}
                </template>
                <template v-else>-</template>
              </td>
              <td class="pr-6 text-right">
                <div v-if="!student.attendance" class="flex justify-end gap-1">
                  <div class="dropdown dropdown-end">
                    <label tabindex="0" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-lg font-black px-3 h-8 gap-1.5 shadow-sm shadow-orange-500/20">
                      <Icon v-if="markingId === student.id" name="mingcute:loading-fill" class="animate-spin" size="14" />
                      <Icon v-else name="mingcute:check-2-fill" size="14" />
                      Absen
                    </label>
                    <ul tabindex="0" class="dropdown-content z-[10] menu p-1.5 shadow-xl bg-base-100 rounded-xl w-44 border border-base-200 mt-1">
                      <li class="menu-title px-3 py-1"><span class="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Pilih Status</span></li>
                      <li><a @click="markAttendance(student.id, 'HADIR')" class="text-success font-bold text-xs rounded-lg hover:bg-success/10"><Icon name="mingcute:check-circle-line" /> Hadir</a></li>
                      <li><a @click="markAttendance(student.id, 'TERLAMBAT')" class="text-warning font-bold text-xs rounded-lg hover:bg-warning/10"><Icon name="mingcute:time-line" /> Terlambat</a></li>
                      <li><a @click="markAttendance(student.id, 'IZIN')" class="text-info font-bold text-xs rounded-lg hover:bg-info/10"><Icon name="mingcute:document-line" /> Izin</a></li>
                      <li><a @click="markAttendance(student.id, 'SAKIT')" class="text-orange-400 font-bold text-xs rounded-lg hover:bg-orange-400/10"><Icon name="mingcute:heart-line" /> Sakit</a></li>
                      <li><a @click="markAttendance(student.id, 'ALPHA')" class="text-error font-bold text-xs rounded-lg hover:bg-error/10"><Icon name="mingcute:close-circle-line" /> Alpha</a></li>
                    </ul>
                  </div>
                </div>
                <div v-else class="flex justify-end">
                   <div class="w-8 h-8 rounded-lg bg-base-200/50 flex items-center justify-center text-base-content/20">
                     <Icon name="mingcute:check-2-line" size="16" />
                   </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>