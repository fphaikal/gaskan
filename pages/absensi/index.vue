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
const selectedClass = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(30);
const markingId = ref(null);

// Server-side fetch with pagination
const { data: attendanceData, refresh: refreshAttendance, pending: loading } = useFetch('/api/attendance/class-today', {
  query: computed(() => ({
    classId: selectedClass.value || undefined,
    page: currentPage.value,
    limit: itemsPerPage.value,
    search: searchQuery.value || undefined,
  })),
  watch: [selectedClass, currentPage, itemsPerPage, searchQuery],
});

const students = computed(() => attendanceData.value?.data || []);
const summary = computed(() => attendanceData.value?.summary || {});
const classes = computed(() => attendanceData.value?.classes || []);
const totalCount = computed(() => attendanceData.value?.pagination?.total || 0);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value));

// Reset page on filter/search change
watch([selectedClass, searchQuery, itemsPerPage], () => { currentPage.value = 1; });

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
    await refreshAttendance();
  } catch (e) {
    console.error('Mark failed:', e);
    $toast.error('Gagal mencatat absensi: ' + (e?.data?.message || e?.message || ''));
  } finally {
    markingId.value = null;
  }
};

// === MODAL STATE ===
const selectedAttendance = ref(null);
const showModal = ref(false);

const openDetail = (student) => {
  if (student.attendance) {
    selectedAttendance.value = {
      studentName: student.name,
      photoUrl: student.photoUrl,
      className: student.class?.className || '-',
      status: student.attendance.status,
      time: student.attendance.firstIn.timestamp,
      lastOutTime: student.attendance.lastOut?.timestamp || null,
      method: student.attendance.method,
      logs: student.attendance.logs
    };
    showModal.value = true;
  }
};
const closeModal = () => { showModal.value = false; selectedAttendance.value = null; };

const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const methodLabel = (m) => {
  if (m === 'FACE_RECOGNITION') return { label: 'Face ID', icon: 'mingcute:faceid-line', color: 'text-primary' };
  if (m === 'QR_CODE') return { label: 'QR Code', icon: 'mingcute:qrcode-2-line', color: 'text-info' };
  return { label: 'Manual', icon: 'mingcute:edit-2-line', color: 'text-base-content/40' };
};

// Status helpers
const statusConfig = {
  HADIR: { color: 'text-success', bg: 'bg-success/10', badge: 'badge-success', icon: 'mingcute:check-circle-fill', label: 'Hadir' },
  TERLAMBAT: { color: 'text-warning', bg: 'bg-warning/10', badge: 'badge-warning', icon: 'mingcute:time-fill', label: 'Terlambat' },
  PULANG: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', badge: 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400', icon: 'mingcute:exit-line', label: 'Pulang' },
  SCAN: { color: 'text-info', bg: 'bg-info/10', badge: 'bg-sky-500/10 border border-sky-500/30 text-sky-400', icon: 'mingcute:history-fill', label: 'Scan' },
  LOG: { color: 'text-info', bg: 'bg-info/10', badge: 'bg-sky-500/10 border border-sky-500/30 text-sky-400', icon: 'mingcute:history-fill', label: 'Scan' },
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

      <!-- Class Filter & Search -->
      <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
        <div class="relative w-full sm:w-64">
          <Icon name="mingcute:search-line" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Cari Siswa / NIS..."
            class="input input-bordered input-sm h-10 w-full pl-9 rounded-xl bg-base-100 font-bold border-base-300"
          />
        </div>
        <div class="relative w-full sm:w-48">
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
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-4 sm:grid-cols-7 gap-3">
      <div class="bg-base-100 rounded-2xl p-3 border border-base-200/60 text-center col-span-1">
        <p class="text-lg font-black text-base-content">{{ summary.total || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-base-content/30 mt-0.5">Total</p>
      </div>
      <div class="bg-emerald-500 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.hadir || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Hadir</p>
      </div>
      <div class="bg-amber-400 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.terlambat || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Terlambat</p>
      </div>
      <div class="bg-sky-400 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.izin || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Izin</p>
      </div>
      <div class="bg-orange-400 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.sakit || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Sakit</p>
      </div>
      <div class="bg-rose-500 rounded-2xl p-3 text-white text-center">
        <p class="text-lg font-black">{{ summary.alpha || 0 }}</p>
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Alpha</p>
      </div>
      <div class="bg-base-200/60 rounded-2xl p-3 text-center">
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
                <th class="py-4">Waktu</th>
                <th class="py-4">Metode</th>
                <th class="py-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-200/50">
              <tr v-for="(student, idx) in students" :key="student.id"
                  @click="openDetail(student)"
                  class="group hover:bg-base-200/30 transition-colors cursor-pointer">
                <td class="pl-6 text-[10px] font-black text-base-content/30">{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</td>
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
                <td class="py-3">
                  <template v-if="student.attendance">
                    <div class="flex flex-col gap-0.5 justify-center">
                      <div class="flex items-center gap-1">
                        <span class="text-[8px] font-black uppercase text-emerald-500/80">IN</span>
                        <span class="text-[10px] font-bold text-base-content/60">{{ formatTime(student.attendance.firstIn.timestamp) }}</span>
                      </div>
                      <div class="flex items-center gap-1" v-if="student.attendance.lastOut">
                        <span class="text-[8px] font-black uppercase text-rose-500/80">OUT</span>
                        <span class="text-[10px] font-bold text-base-content/60">{{ formatTime(student.attendance.lastOut.timestamp) }}</span>
                      </div>
                      <div class="flex items-center gap-1" v-else>
                        <span class="text-[8px] font-black uppercase text-base-content/20">OUT</span>
                        <span class="text-[10px] font-bold text-base-content/30">-</span>
                      </div>
                    </div>
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">
                  <template v-if="student.attendance">
                    {{ student.attendance.method === 'FACE_RECOGNITION' ? 'Face ID' : student.attendance.method === 'QR_CODE' ? 'QR' : 'Manual' }}
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="pr-6 text-right" @click.stop>
                  <div v-if="!student.attendance" class="flex justify-end gap-1">
                    <div class="dropdown dropdown-end">
                      <label tabindex="0" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black px-3 h-8 gap-1.5 shadow-sm shadow-orange-500/20 cursor-pointer">
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
  </div>

    <!-- ═══ DETAIL MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal && selectedAttendance" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="closeModal">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden z-10">
            
            <!-- Modal Header -->
            <div :class="['p-6 flex items-center justify-between', getStatus(selectedAttendance.status).bg.replace('/10', '/5')]">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative">
                  <img v-if="selectedAttendance.photoUrl" 
                       :src="selectedAttendance.photoUrl" 
                       :alt="selectedAttendance.studentName" 
                       class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300"
                       @click="openImagePreview(selectedAttendance.photoUrl)" />
                  <div v-else class="w-full h-full flex items-center justify-center text-primary font-black text-xl bg-primary/10">
                    {{ selectedAttendance.studentName?.charAt(0) }}
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content">{{ selectedAttendance.studentName }}</h3>
                  <p class="text-xs text-base-content/50 font-bold">{{ selectedAttendance.className }}</p>
                </div>
              </div>
              <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <!-- Status badge -->
              <div class="flex items-center justify-between p-4 rounded-2xl bg-base-200/40">
                <span class="text-xs font-black text-base-content/50 uppercase tracking-widest">Status Kehadiran</span>
                <div :class="['px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider', getStatus(selectedAttendance.status).badge]">
                  {{ getStatus(selectedAttendance.status).label }}
                </div>
              </div>

              <!-- Detail rows -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Masuk</span>
                  </div>
                  <span class="text-sm font-black text-base-content">
                    {{ selectedAttendance.time ? new Date(selectedAttendance.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-' }}
                  </span>
                </div>
                <div class="flex items-center justify-between" v-if="selectedAttendance.lastOutTime">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Pulang</span>
                  </div>
                  <span class="text-sm font-black text-base-content">
                    {{ new Date(selectedAttendance.lastOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon :name="methodLabel(selectedAttendance.method).icon" size="16" />
                    <span class="text-xs font-bold">Metode</span>
                  </div>
                  <span :class="['text-sm font-black', methodLabel(selectedAttendance.method).color]">{{ methodLabel(selectedAttendance.method).label }}</span>
                </div>
              </div>

              <!-- Detailed Scan Logs with Captured Photos -->
              <div class="pt-4 border-t border-base-200/50 space-y-3" v-if="selectedAttendance.logs && selectedAttendance.logs.length">
                <h4 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Detail Scan Wajah & Foto</h4>
                <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
                  <div v-for="log in selectedAttendance.logs" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/50 transition-colors">
                    <!-- Attendance Image -->
                    <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative">
                      <img :src="log.notes || selectedAttendance.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png'" 
                           alt="scan" 
                           class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300"
                           @click="openImagePreview(log.notes || selectedAttendance.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png')" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-mono font-bold text-base-content">
                          {{ new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                        <span :class="['px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider', getStatus(log.status).badge]">
                          {{ getStatus(log.status).label }}
                        </span>
                      </div>
                      <p class="text-[9px] font-bold text-base-content/40 truncate mt-0.5" v-if="log.gate">
                        <Icon name="mingcute:location-fill" size="11" class="text-primary/70 mr-0.5 inline shrink-0" />
                        {{ log.gate }}
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
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.08); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>