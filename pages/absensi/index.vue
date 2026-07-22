<script setup>
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

useSeoMeta({
  title: 'Absensi Kelas | GASKAN',
  description: 'Kelola dan lihat history absensi siswa per tanggal kalender',
});

const { role } = storeToRefs(useAuthStore());
const { $toast } = useNuxtApp();

// State
const selectedDate = ref(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD
const selectedClass = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(30);
const markingId = ref(null);

// Date Navigation Helpers
const shiftDate = (days) => {
  const d = new Date(selectedDate.value + 'T00:00:00');
  d.setDate(d.getDate() + days);
  selectedDate.value = d.toLocaleDateString('en-CA');
};
const setToday = () => {
  selectedDate.value = new Date().toLocaleDateString('en-CA');
};

const isTodaySelected = computed(() => {
  return selectedDate.value === new Date().toLocaleDateString('en-CA');
});

const selectedDateFormatted = computed(() => {
  if (!selectedDate.value) return '-';
  const d = new Date(selectedDate.value + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

// Server-side fetch with pagination & date filter
const { data: attendanceData, refresh: refreshAttendance, pending: loading } = useFetch('/api/attendance/class-today', {
  query: computed(() => ({
    classId: selectedClass.value || undefined,
    page: currentPage.value,
    limit: itemsPerPage.value,
    search: searchQuery.value || undefined,
    date: selectedDate.value,
  })),
  watch: [selectedClass, currentPage, itemsPerPage, searchQuery, selectedDate],
});

const students = computed(() => attendanceData.value?.data || []);
const summary = computed(() => attendanceData.value?.summary || {});
const classes = computed(() => attendanceData.value?.classes || []);
const totalCount = computed(() => attendanceData.value?.pagination?.total || 0);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value));

// Reset page on filter/search/date change
watch([selectedClass, searchQuery, itemsPerPage, selectedDate], () => { currentPage.value = 1; });

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
        timestamp: new Date(selectedDate.value + 'T08:00:00').toISOString(),
      },
    });
    $toast.success('Absensi berhasil dicatat');
    await refreshAttendance();
  } catch (e) {
    console.error('Mark failed:', e);
    $toast.error('Gagal mencatat absensi: ' + (e?.data?.message || e?.message || ''));
  } finally {
    markingId.value = null;
  }
};

// === STUDENT DETAIL & MONTHLY HISTORY MODAL ===
const showModal = ref(false);
const modalTab = ref('today'); // 'today' | 'monthly'
const currentStudent = ref(null);
const currentStudentAttendance = ref(null);
const historyLoading = ref(false);
const historyData = ref(null);
const selectedCellDay = ref(null);

const historyMonth = ref(new Date().getMonth() + 1);
const historyYear = ref(new Date().getFullYear());

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
  { value: 12, name: 'Desember' },
];

const yearOptions = computed(() => {
  const cur = new Date().getFullYear();
  return [cur - 1, cur, cur + 1];
});

const loadStudentHistory = async () => {
  if (!currentStudent.value?.id) return;
  historyLoading.value = true;
  try {
    const res = await $fetch(`/api/attendance/student/${currentStudent.value.id}`, {
      query: { month: historyMonth.value, year: historyYear.value }
    });
    historyData.value = res;
  } catch (err) {
    console.error('Failed to load student history:', err);
  } finally {
    historyLoading.value = false;
  }
};

watch([historyMonth, historyYear], () => {
  if (showModal.value && currentStudent.value) {
    loadStudentHistory();
  }
});

const openDetail = async (student) => {
  currentStudent.value = student;
  currentStudentAttendance.value = student.attendance;
  modalTab.value = 'today';
  showModal.value = true;
  await loadStudentHistory();
};

const closeModal = () => {
  showModal.value = false;
  currentStudent.value = null;
  currentStudentAttendance.value = null;
  historyData.value = null;
};

// Calendar Grid Generator for Monthly Tab
const calendarCells = computed(() => {
  const year = historyYear.value;
  const month = historyMonth.value;
  
  const totalDays = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0...Sun=6
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ type: 'empty', id: `empty-${i}` });
  }
  
  const dailyMap = historyData.value?.dailyMap || {};
  
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = (new Date(year, month - 1, day).getDay() + 6) % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sabtu / Minggu
    const dayData = dailyMap[dateStr] || null;
    
    cells.push({
      type: 'day',
      day,
      dateStr,
      isWeekend,
      data: dayData
    });
  }
  
  return cells;
});

const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const methodLabel = (m) => {
  if (m === 'FACE_RECOGNITION') return { label: 'Face ID', icon: 'mingcute:faceid-line', color: 'text-primary' };
  if (m === 'QR_CODE') return { label: 'QR Code', icon: 'mingcute:qrcode-2-line', color: 'text-info' };
  return { label: 'Manual', icon: 'mingcute:edit-2-line', color: 'text-base-content/40' };
};

const statusConfig = {
  HADIR: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30', icon: 'mingcute:check-circle-fill', label: 'Hadir' },
  TERLAMBAT: { color: 'text-amber-500', bg: 'bg-amber-500/10', badge: 'bg-amber-500/10 text-amber-500 border border-amber-500/30', icon: 'mingcute:time-fill', label: 'Terlambat' },
  PULANG: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', badge: 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400', icon: 'mingcute:exit-line', label: 'Pulang' },
  SCAN: { color: 'text-sky-400', bg: 'bg-sky-500/10', badge: 'bg-sky-500/10 border border-sky-500/30 text-sky-400', icon: 'mingcute:history-fill', label: 'Scan' },
  LOG: { color: 'text-sky-400', bg: 'bg-sky-500/10', badge: 'bg-sky-500/10 border border-sky-500/30 text-sky-400', icon: 'mingcute:history-fill', label: 'Scan' },
  IZIN: { color: 'text-sky-500', bg: 'bg-sky-500/10', badge: 'bg-sky-500/10 text-sky-500 border border-sky-500/30', icon: 'mingcute:document-fill', label: 'Izin' },
  SAKIT: { color: 'text-orange-400', bg: 'bg-orange-400/10', badge: 'bg-orange-400/10 text-orange-400 border border-orange-400/30', icon: 'mingcute:heart-fill', label: 'Sakit' },
  ALPHA: { color: 'text-rose-500', bg: 'bg-rose-500/10', badge: 'bg-rose-500/10 text-rose-500 border border-rose-500/30', icon: 'mingcute:close-circle-fill', label: 'Alpha' },
};
const getStatus = (s) => statusConfig[s] || statusConfig.ALPHA;

const formatTime = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Date Picker & Navigation -->
    <div class="bg-base-100 rounded-3xl p-6 border border-base-200/60 shadow-sm space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Title & Selected Date Display -->
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-black text-base-content leading-tight">Absensi Kelas</h1>
            <span v-if="isTodaySelected" class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">Hari Ini</span>
          </div>
          <p class="text-sm text-base-content/60 font-bold mt-1 flex items-center gap-1.5">
            <Icon name="mingcute:calendar-month-fill" class="text-orange-500" />
            {{ selectedDateFormatted }}
          </p>
        </div>

        <!-- Datepicker Controls & Filters -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Quick Date Navigation -->
          <div class="flex items-center bg-base-200/50 rounded-2xl p-1 border border-base-200">
            <button @click="shiftDate(-1)" title="Hari Sebelumnya" class="btn btn-ghost btn-xs btn-square rounded-xl hover:bg-base-100">
              <Icon name="mingcute:left-line" size="16" />
            </button>
            <button @click="setToday" :class="['px-3 py-1 text-xs font-black rounded-xl transition-all', isTodaySelected ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'hover:bg-base-100 text-base-content/70']">
              Hari Ini
            </button>
            <button @click="shiftDate(1)" title="Hari Selanjutnya" class="btn btn-ghost btn-xs btn-square rounded-xl hover:bg-base-100">
              <Icon name="mingcute:right-line" size="16" />
            </button>
          </div>

          <!-- Native Date Picker -->
          <div class="relative">
            <input 
              v-model="selectedDate" 
              type="date" 
              class="input input-bordered input-sm h-10 rounded-2xl bg-base-100 font-bold border-base-300 text-xs shadow-sm hover:border-orange-500 transition-colors"
            />
          </div>

          <!-- Class Filter Dropdown -->
          <div class="relative w-44">
            <select
              v-model="selectedClass"
              class="select select-bordered select-sm h-10 w-full rounded-2xl bg-base-100 font-bold border-base-300 text-xs"
            >
              <option value="">Semua Kelas</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                {{ cls.className }}
              </option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="relative w-48">
            <Icon name="mingcute:search-line" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Cari Siswa / NIS..."
              class="input input-bordered input-sm h-10 w-full pl-9 rounded-2xl bg-base-100 font-bold border-base-300 text-xs"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-4 sm:grid-cols-7 gap-3">
      <div class="bg-base-100 rounded-2xl p-3 border border-base-200/60 text-center col-span-1 shadow-sm">
        <p class="text-lg font-black text-base-content">{{ summary.total || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-base-content/30 mt-0.5">Total</p>
      </div>
      <div class="bg-emerald-500 rounded-2xl p-3 text-white text-center shadow-sm shadow-emerald-500/20">
        <p class="text-lg font-black">{{ summary.hadir || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Hadir</p>
      </div>
      <div class="bg-amber-400 rounded-2xl p-3 text-white text-center shadow-sm shadow-amber-400/20">
        <p class="text-lg font-black">{{ summary.terlambat || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Terlambat</p>
      </div>
      <div class="bg-sky-400 rounded-2xl p-3 text-white text-center shadow-sm shadow-sky-400/20">
        <p class="text-lg font-black">{{ summary.izin || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Izin</p>
      </div>
      <div class="bg-orange-400 rounded-2xl p-3 text-white text-center shadow-sm shadow-orange-400/20">
        <p class="text-lg font-black">{{ summary.sakit || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Sakit</p>
      </div>
      <div class="bg-rose-500 rounded-2xl p-3 text-white text-center shadow-sm shadow-rose-500/20">
        <p class="text-lg font-black">{{ summary.alpha || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Alpha</p>
      </div>
      <div class="bg-base-200/60 rounded-2xl p-3 text-center border border-base-200">
        <p class="text-lg font-black text-base-content/40">{{ summary.belumAbsen || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-base-content/30 mt-0.5">Belum</p>
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
        <p class="text-sm text-base-content/40 mt-1">Pilih kelas atau sesuaikan pencarian Anda</p>
      </div>

      <!-- Table -->
      <div v-else>
        <div class="overflow-x-auto">
          <table class="table table-sm min-w-max">
            <thead>
              <tr class="bg-base-200/30 text-[10px] font-black uppercase tracking-widest text-base-content/40 border-b border-base-200">
                <th class="py-4 pl-6 w-12">#</th>
                <th class="py-4">Informasi Siswa</th>
                <th class="py-4">Kelas</th>
                <th class="py-4">Status</th>
                <th class="py-4">Waktu IN / OUT</th>
                <th class="py-4">Metode</th>
                <th class="py-4 pr-6 text-right">Aksi & Detail</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-200/50">
              <tr v-for="(student, idx) in students" :key="student.id"
                  @click="openDetail(student)"
                  class="group hover:bg-base-200/30 transition-colors cursor-pointer">
                <td class="pl-6 text-[10px] font-black text-base-content/30">{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</td>
                <td class="py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner">
                      <img v-if="student.photoUrl" :src="student.photoUrl" :alt="student.name" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center text-primary/70 font-black text-xs uppercase bg-primary/10">
                        {{ student.name?.charAt(0) }}
                      </div>
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-sm text-base-content group-hover:text-orange-500 transition-colors truncate">{{ student.name }}</p>
                      <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">NIS: {{ student.nis }}</p>
                    </div>
                  </div>
                </td>
                <td class="text-[11px] font-black text-base-content/60">{{ student.class?.className || '-' }}</td>
                <td>
                  <div v-if="student.attendance" class="flex items-center gap-1.5">
                    <span :class="['px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider', getStatus(student.attendance.status).badge]">
                      {{ getStatus(student.attendance.status).label }}
                    </span>
                  </div>
                  <span v-else class="text-[9px] font-bold text-base-content/30 uppercase tracking-widest italic bg-base-200/50 px-2 py-0.5 rounded-lg">Belum Absen</span>
                </td>
                <td class="py-3">
                  <template v-if="student.attendance">
                    <div class="flex flex-col gap-0.5 justify-center">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[9px] font-black uppercase text-emerald-500">IN</span>
                        <span class="text-[11px] font-bold font-mono text-base-content">{{ formatTime(student.attendance.firstIn.timestamp) }}</span>
                      </div>
                      <div class="flex items-center gap-1.5" v-if="student.attendance.lastOut">
                        <span class="text-[9px] font-black uppercase text-rose-500">OUT</span>
                        <span class="text-[11px] font-bold font-mono text-base-content">{{ formatTime(student.attendance.lastOut.timestamp) }}</span>
                      </div>
                    </div>
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="text-[10px] font-bold text-base-content/50 uppercase tracking-widest">
                  <template v-if="student.attendance">
                    <span class="flex items-center gap-1">
                      <Icon :name="methodLabel(student.attendance.method).icon" size="14" :class="methodLabel(student.attendance.method).color" />
                      {{ methodLabel(student.attendance.method).label }}
                    </span>
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="pr-6 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Manual Attendance Button -->
                    <div v-if="!student.attendance" class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black px-3 h-8 gap-1.5 shadow-sm shadow-orange-500/20 cursor-pointer">
                        <Icon v-if="markingId === student.id" name="mingcute:loading-fill" class="animate-spin" size="14" />
                        <Icon v-else name="mingcute:check-2-fill" size="14" />
                        Absen
                      </label>
                      <ul tabindex="0" class="dropdown-content z-[10] menu p-1.5 shadow-xl bg-base-100 rounded-xl w-44 border border-base-200 mt-1">
                        <li class="menu-title px-3 py-1"><span class="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Pilih Status</span></li>
                        <li><a @click="markAttendance(student.id, 'HADIR')" class="text-emerald-500 font-bold text-xs rounded-lg hover:bg-emerald-500/10"><Icon name="mingcute:check-circle-line" /> Hadir</a></li>
                        <li><a @click="markAttendance(student.id, 'TERLAMBAT')" class="text-amber-500 font-bold text-xs rounded-lg hover:bg-amber-500/10"><Icon name="mingcute:time-line" /> Terlambat</a></li>
                        <li><a @click="markAttendance(student.id, 'IZIN')" class="text-sky-500 font-bold text-xs rounded-lg hover:bg-sky-500/10"><Icon name="mingcute:document-line" /> Izin</a></li>
                        <li><a @click="markAttendance(student.id, 'SAKIT')" class="text-orange-400 font-bold text-xs rounded-lg hover:bg-orange-400/10"><Icon name="mingcute:heart-line" /> Sakit</a></li>
                        <li><a @click="markAttendance(student.id, 'ALPHA')" class="text-rose-500 font-bold text-xs rounded-lg hover:bg-rose-500/10"><Icon name="mingcute:close-circle-line" /> Alpha</a></li>
                      </ul>
                    </div>

                    <!-- View Detail Button -->
                    <button @click="openDetail(student)" class="btn btn-xs btn-ghost hover:bg-base-200 rounded-xl font-bold h-8 px-2.5 text-base-content/60 gap-1">
                      <Icon name="mingcute:eye-2-line" size="14" />
                      Detail
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <UIPagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="totalCount"
          :itemsPerPage="itemsPerPage"
          itemLabel="siswa"
          @update:currentPage="currentPage = $event"
          @update:itemsPerPage="itemsPerPage = $event; currentPage = 1"
        />
      </div>
    </div>

    <!-- ═══ STUDENT DETAIL & HISTORY MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal && currentStudent" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="closeModal">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            
            <!-- Modal Header -->
            <div class="p-6 bg-gradient-to-r from-orange-500/10 via-base-200/50 to-base-100 border-b border-base-200/60 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border-2 border-orange-500/30 shrink-0 shadow-inner relative">
                  <img v-if="currentStudent.photoUrl" 
                       :src="currentStudent.photoUrl" 
                       :alt="currentStudent.name" 
                       class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300"
                       @click="openImagePreview(currentStudent.photoUrl)" />
                  <div v-else class="w-full h-full flex items-center justify-center text-orange-500 font-black text-xl bg-orange-500/10">
                    {{ currentStudent.name?.charAt(0) }}
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content leading-tight">{{ currentStudent.name }}</h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="px-2 py-0.5 rounded-md bg-base-200 text-[10px] font-black uppercase tracking-wider text-base-content/60">
                      {{ currentStudent.class?.className || 'Tanpa Kelas' }}
                    </span>
                    <span class="text-xs font-mono font-bold text-base-content/40">NIS: {{ currentStudent.nis }}</span>
                  </div>
                </div>
              </div>
              <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content">
                <Icon name="mingcute:close-line" size="22" />
              </button>
            </div>

            <!-- Tab Buttons -->
            <div class="flex border-b border-base-200 px-6 bg-base-200/20">
              <button 
                @click="modalTab = 'today'" 
                :class="['py-3 px-4 text-xs font-black border-b-2 transition-all gap-2 flex items-center', modalTab === 'today' ? 'border-orange-500 text-orange-500' : 'border-transparent text-base-content/50 hover:text-base-content']"
              >
                <Icon name="mingcute:calendar-day-line" size="16" />
                Tanggal Terpilih ({{ selectedDate }})
              </button>
              <button 
                @click="modalTab = 'monthly'" 
                :class="['py-3 px-4 text-xs font-black border-b-2 transition-all gap-2 flex items-center', modalTab === 'monthly' ? 'border-orange-500 text-orange-500' : 'border-transparent text-base-content/50 hover:text-base-content']"
              >
                <Icon name="mingcute:calendar-month-line" size="16" />
                Kalender & History Bulanan
              </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
              
              <!-- TAB 1: Selected Date Attendance Detail -->
              <div v-if="modalTab === 'today'" class="space-y-4">
                <div v-if="currentStudentAttendance" class="space-y-4">
                  <!-- Status badge & date -->
                  <div class="flex items-center justify-between p-4 rounded-2xl bg-base-200/40 border border-base-200/60">
                    <div>
                      <p class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Tanggal Presensi</p>
                      <p class="text-xs font-bold text-base-content mt-0.5">{{ selectedDateFormatted }}</p>
                    </div>
                    <div :class="['px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider', getStatus(currentStudentAttendance.status).badge]">
                      {{ getStatus(currentStudentAttendance.status).label }}
                    </div>
                  </div>

                  <!-- In / Out Time Grid -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                      <p class="text-[9px] font-black uppercase tracking-widest text-emerald-600">Jam Masuk (IN)</p>
                      <p class="text-xl font-black font-mono text-emerald-600 mt-1">
                        {{ currentStudentAttendance.firstIn?.timestamp ? formatTime(currentStudentAttendance.firstIn.timestamp) : '-' }}
                      </p>
                    </div>
                    <div class="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                      <p class="text-[9px] font-black uppercase tracking-widest text-rose-600">Jam Pulang (OUT)</p>
                      <p class="text-xl font-black font-mono text-rose-600 mt-1">
                        {{ currentStudentAttendance.lastOut?.timestamp ? formatTime(currentStudentAttendance.lastOut.timestamp) : '-' }}
                      </p>
                    </div>
                  </div>

                  <!-- Scan Logs -->
                  <div class="space-y-2">
                    <h4 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Detail Log Tapping / Scan Machine</h4>
                    <div class="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                      <div v-for="log in currentStudentAttendance.logs" :key="log.id" class="flex items-center gap-3 p-3 rounded-2xl bg-base-200/40 border border-base-200/60">
                        <div class="w-10 h-10 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 relative">
                          <img :src="log.notes || currentStudent.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png'" 
                               alt="scan" 
                               class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform"
                               @click="openImagePreview(log.notes || currentStudent.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png')" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-mono font-bold text-base-content">{{ formatTime(log.timestamp) }}</span>
                            <span :class="['px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider', getStatus(log.status).badge]">
                              {{ getStatus(log.status).label }}
                            </span>
                          </div>
                          <p class="text-[10px] font-bold text-base-content/50 truncate mt-0.5" v-if="log.gate">
                            <Icon name="mingcute:location-fill" size="12" class="text-orange-500 mr-0.5 inline" />
                            {{ log.gate }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-12 bg-base-200/20 rounded-2xl border border-dashed border-base-300">
                  <Icon name="mingcute:calendar-close-line" class="text-5xl text-base-content/20 mb-2" />
                  <p class="text-sm font-bold text-base-content/60">Belum Ada Presensi</p>
                  <p class="text-xs text-base-content/40 mt-0.5">Siswa belum melakukan tapping/absen pada {{ selectedDateFormatted }}</p>
                </div>
              </div>

              <!-- TAB 2: Monthly Calendar Grid & Full History -->
              <div v-else-if="modalTab === 'monthly'" class="space-y-5">
                <!-- Month & Year Selectors -->
                <div class="flex items-center justify-between bg-base-200/40 p-3 rounded-2xl border border-base-200">
                  <span class="text-xs font-black text-base-content/60 uppercase tracking-wider">Pilih Bulan & Tahun</span>
                  <div class="flex gap-2">
                    <select v-model="historyMonth" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                      <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.name }}</option>
                    </select>
                    <select v-model="historyYear" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                      <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                    </select>
                  </div>
                </div>

                <div v-if="historyLoading" class="flex justify-center py-10">
                  <span class="loading loading-spinner loading-md text-orange-500"></span>
                </div>

                <template v-else-if="historyData">
                  <!-- Monthly Summary Badges -->
                  <div class="grid grid-cols-5 gap-2">
                    <div class="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                      <p class="text-base font-black text-emerald-600">{{ historyData.summary?.hadir || 0 }}</p>
                      <p class="text-[9px] font-black uppercase text-emerald-600/70 tracking-wider">Hadir</p>
                    </div>
                    <div class="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
                      <p class="text-base font-black text-amber-600">{{ historyData.summary?.terlambat || 0 }}</p>
                      <p class="text-[9px] font-black uppercase text-amber-600/70 tracking-wider">Terlambat</p>
                    </div>
                    <div class="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl text-center">
                      <p class="text-base font-black text-sky-600">{{ historyData.summary?.izin || 0 }}</p>
                      <p class="text-[9px] font-black uppercase text-sky-600/70 tracking-wider">Izin</p>
                    </div>
                    <div class="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl text-center">
                      <p class="text-base font-black text-orange-600">{{ historyData.summary?.sakit || 0 }}</p>
                      <p class="text-[9px] font-black uppercase text-orange-600/70 tracking-wider">Sakit</p>
                    </div>
                    <div class="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center">
                      <p class="text-base font-black text-rose-600">{{ historyData.summary?.alpha || 0 }}</p>
                      <p class="text-[9px] font-black uppercase text-rose-600/70 tracking-wider">Alpha</p>
                    </div>
                  </div>

                  <!-- Monthly Interactive Calendar Grid -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <h4 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Grid Kalender Bulanan</h4>
                      <span class="text-[9px] font-bold text-base-content/40">Klik tanggal untuk rincian foto & log</span>
                    </div>
                    
                    <!-- Weekday Header -->
                    <div class="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-base-content/40 uppercase tracking-widest bg-base-200/50 py-1.5 rounded-xl">
                      <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-400">Sab</span><span class="text-rose-400">Min</span>
                    </div>

                    <!-- Day Grid -->
                    <div class="grid grid-cols-7 gap-1.5">
                      <div 
                        v-for="cell in calendarCells" 
                        :key="cell.id || cell.dateStr"
                        @click="cell.data && (selectedCellDay = cell.data)"
                        :class="[
                          'aspect-square rounded-xl p-1 flex flex-col justify-between text-center transition-all border text-[10px] font-bold cursor-pointer hover:scale-105',
                          cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                          cell.isWeekend ? 'bg-base-200/30 border-base-200 text-base-content/40' : 'bg-base-100 border-base-200',
                          selectedCellDay && selectedCellDay === cell.data ? 'ring-2 ring-orange-500 scale-105' : '',
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

                  <!-- Selected Cell Day Log Popup Card -->
                  <div v-if="selectedCellDay" class="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-black uppercase tracking-widest text-orange-500">Log Presensi Tapping</span>
                      <button @click="selectedCellDay = null" class="btn btn-ghost btn-xs btn-circle">
                        <Icon name="mingcute:close-line" size="14" />
                      </button>
                    </div>
                    <div class="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                      <div v-for="log in selectedCellDay.logs" :key="log.id" class="flex items-center gap-3 p-2 rounded-xl bg-base-100 border border-base-200">
                        <div class="w-10 h-10 rounded-lg overflow-hidden bg-base-200 shrink-0 border border-base-200 relative">
                          <img :src="log.notes || currentStudent?.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png'" 
                               alt="scan" 
                               class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform"
                               @click="openImagePreview(log.notes || currentStudent?.photoUrl)" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-mono font-bold text-base-content">{{ formatTime(log.timestamp) }}</span>
                            <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase', getStatus(log.status).badge]">
                              {{ getStatus(log.status).label }}
                            </span>
                          </div>
                          <p class="text-[9px] font-bold text-base-content/50 truncate mt-0.5" v-if="log.device">
                            <Icon name="mingcute:location-fill" size="11" class="text-orange-500 inline mr-0.5" />
                            {{ log.device.name }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Monthly Logs List -->
                  <div class="space-y-2 pt-2 border-t border-base-200">
                    <h4 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Daftar Presensi Masuk Bulan Ini</h4>
                    <div v-if="historyData.data && historyData.data.length" class="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                      <div v-for="att in historyData.data" :key="att.id" class="flex items-center gap-3 p-2.5 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/60 transition-colors">
                        <!-- Captured Photo Thumbnail -->
                        <div class="w-10 h-10 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 relative">
                          <img :src="att.notes || currentStudent?.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png'" 
                               alt="scan" 
                               class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform"
                               @click="openImagePreview(att.notes || currentStudent?.photoUrl)" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <span class="font-bold text-xs text-base-content">{{ new Date(att.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }} - {{ formatTime(att.timestamp) }}</span>
                            <span :class="['px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider', getStatus(att.status).badge]">
                              {{ getStatus(att.status).label }}
                            </span>
                          </div>
                          <p class="text-[9px] font-bold text-base-content/40 truncate mt-0.5" v-if="att.device">
                            <Icon name="mingcute:location-fill" size="11" class="text-orange-500 inline mr-0.5" />
                            {{ att.device.name }} ({{ att.device.location }})
                          </p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-xs text-base-content/40 italic text-center py-4">Belum ada data presensi untuk bulan ini</p>
                  </div>
                </template>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="p-4 bg-base-200/30 border-t border-base-200 flex justify-end">
              <button @click="closeModal" class="btn btn-sm btn-ghost rounded-xl font-bold">Tutup</button>
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
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.1); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>