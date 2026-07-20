<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const props = defineProps({ count: Object, login: Array, system: Object });

const authStore = useAuthStore();
const { role, userData: user } = storeToRefs(authStore);

const isDev = computed(() => role.value === 'developer');
const isAdmin = computed(() => role.value === 'admin' || isDev.value);
const isGuru = computed(() => role.value === 'guru');

// FIX: userData uses 'Nama' (capital N) from the user proxy mapping
const displayName = computed(() => user.value?.Nama || user.value?.name || 'Administrator');
const firstWord = computed(() => displayName.value.split(' ')[0]);

const today = props.count?.today || { present: 0, late: 0, absent: 0, izin: 0, sakit: 0, attendancePercentage: 0 };
const todayStr = computed(() => format(new Date(), "EEEE, d MMMM yyyy", { locale: id }));

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 19) return 'Selamat Sore';
  return 'Selamat Malam';
});

const formatTime = (ts) => ts ? format(parseISO(ts), 'HH:mm') : '-';
const formatFull = (ts) => ts ? format(parseISO(ts), "EEEE, d MMM yyyy · HH:mm", { locale: id }) : '-';

const methodLabel = (m) => {
  if (m === 'FACE_RECOGNITION') return { label: 'Face ID', icon: 'mingcute:faceid-line', color: 'text-primary' };
  if (m === 'QR_CODE') return { label: 'QR Code', icon: 'mingcute:qrcode-2-line', color: 'text-info' };
  if (m === 'BELUM_ABSEN') return { label: 'Belum Absen', icon: 'mingcute:time-line', color: 'text-rose-500/60' };
  return { label: 'Manual', icon: 'mingcute:edit-2-line', color: 'text-base-content/40' };
};

const statusMap = {
  HADIR:       { color: 'text-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500' },
  TERLAMBAT:   { color: 'text-amber-500',   dot: 'bg-amber-500',   badge: 'bg-amber-500/10 border border-amber-500/30 text-amber-500' },
  IZIN:        { color: 'text-sky-500',     dot: 'bg-sky-500',     badge: 'bg-sky-500/10 border border-sky-500/30 text-sky-500' },
  SAKIT:       { color: 'text-orange-400',  dot: 'bg-orange-400',  badge: 'bg-orange-400/10 border border-orange-400/30 text-orange-400' },
  ALPHA:       { color: 'text-rose-500',    dot: 'bg-rose-500',    badge: 'bg-rose-500/10 border border-rose-500/30 text-rose-500' },
  BELUM_ABSEN: { color: 'text-rose-500',    dot: 'bg-rose-500',    badge: 'bg-rose-500/10 border border-rose-500/30 text-rose-500' },
};
const getStatus = (s) => statusMap[s] || statusMap.ALPHA;

const avatarColors = [
  'bg-primary/20 text-primary',
  'bg-emerald-500/20 text-emerald-600',
  'bg-amber-500/20 text-amber-600',
  'bg-sky-500/20 text-sky-600',
  'bg-rose-500/20 text-rose-600',
  'bg-violet-500/20 text-violet-600',
];
const avatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

// === MODAL STATE ===
const selectedAttendance = ref(null);
const selectedFailure = ref(null);
const selectedSecurityLog = ref(null);
const showModal = ref(false);
const activeTab = ref('attendance'); // attendance, failures

const openDetail = (a) => {
  selectedAttendance.value = a;
  showModal.value = true;
};
const closeModal = () => { showModal.value = false; selectedAttendance.value = null; };

const openFailureDetail = (f) => {
  selectedFailure.value = f;
};
const closeFailureDetail = () => {
  selectedFailure.value = null;
};

const openSecurityLogDetail = (log) => {
  selectedSecurityLog.value = log;
};
const closeSecurityLogDetail = () => {
  selectedSecurityLog.value = null;
};

// === FILTERING & PAGINATION FOR ATTENDANCE ===
const searchQuery = ref('');
const selectedClassFilter = ref('');
const statusFilter = ref('ALL'); // ALL, HADIR, TERLAMBAT, IZIN_SAKIT, ALPHA
const currentPage = ref(1);
const itemsPerPage = ref(10);

const classList = computed(() => {
  const list = props.count?.recentAttendances || [];
  const classes = new Set();
  list.forEach(a => {
    if (a.className) classes.add(a.className);
  });
  return Array.from(classes).sort();
});

const filteredAttendances = computed(() => {
  let list = props.count?.recentAttendances || [];
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(a =>
      (a.studentName && a.studentName.toLowerCase().includes(q)) ||
      (a.nis && a.nis.toString().toLowerCase().includes(q)) ||
      (a.className && a.className.toLowerCase().includes(q))
    );
  }

  if (selectedClassFilter.value) {
    list = list.filter(a => a.className === selectedClassFilter.value);
  }

  if (statusFilter.value !== 'ALL') {
    if (statusFilter.value === 'IZIN_SAKIT') {
      list = list.filter(a => a.status === 'IZIN' || a.status === 'SAKIT');
    } else {
      list = list.filter(a => a.status === statusFilter.value);
    }
  }

  return list;
});

const totalPages = computed(() => Math.ceil(filteredAttendances.value.length / itemsPerPage.value) || 1);

const paginatedAttendances = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredAttendances.value.slice(start, start + itemsPerPage.value);
});

watch([searchQuery, selectedClassFilter, statusFilter, itemsPerPage], () => {
  currentPage.value = 1;
});

const useProxy = computed(() => authStore.useProxy);
const toggleProxyMode = () => {
  const isNowProxy = authStore.toggleProxy();
  console.log(`[API MODE TOGGLED] Mode is now: ${isNowProxy ? 'Nitro Proxy (ON)' : 'Direct Real API (OFF)'}`);
};

const activePreviewImage = ref(null);
const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const useRouter = () => useNuxtApp().$router;
const navigateTo = useNuxtApp().$router?.push ?? (() => {});
</script>

<template>
  <div class="flex flex-col gap-4 animate-in fade-in duration-700">

    <!-- ROW 1: Hero + Stat Cards -->
    <div class="grid grid-cols-12 gap-4 shrink-0">

      <!-- Hero -->
      <NuxtLink to="/profile" class="col-span-12 md:col-span-5 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-orange-500/25 min-h-[100px] flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer group">
        <div class="relative z-10">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">{{ greeting }} — {{ todayStr }}</p>
          <h1 class="text-2xl font-black text-white leading-tight">{{ firstWord }}</h1>
          <p class="text-[11px] text-white/70 font-semibold mt-1">
            {{ count?.klasifikasi?.siswa || 0 }} siswa · {{ count?.pendingLeaves || 0 }} izin pending · {{ today.attendancePercentage || 0 }}% hadir
          </p>
        </div>
        <div class="absolute right-5 top-1/2 -translate-y-1/2 grid grid-cols-4 gap-1 opacity-10 group-hover:opacity-20 transition-opacity">
          <div v-for="i in 16" :key="i" class="w-3 h-3 rounded-sm bg-white"></div>
        </div>
      </NuxtLink>

      <!-- Alpha -->
      <NuxtLink to="/absensi" class="col-span-3 md:col-span-2 bg-rose-500 rounded-3xl p-4 text-white shadow-lg shadow-rose-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer">
        <Icon name="mingcute:close-circle-fill" size="20" class="mb-1 opacity-70" />
        <p class="text-3xl font-black leading-none">{{ today.absent }}</p>
        <p class="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">Alpha</p>
      </NuxtLink>

      <!-- Izin -->
      <NuxtLink to="/izin" class="col-span-3 md:col-span-2 bg-amber-500 rounded-3xl p-4 text-white shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer">
        <Icon name="mingcute:document-fill" size="20" class="mb-1 opacity-70" />
        <p class="text-3xl font-black leading-none">{{ today.izin + today.sakit }}</p>
        <p class="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">Izin/Sakit</p>
      </NuxtLink>

      <!-- Terlambat -->
      <NuxtLink to="/absensi" class="col-span-3 md:col-span-1 bg-orange-400 rounded-3xl p-4 text-white shadow-lg shadow-orange-400/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer">
        <Icon name="mingcute:time-fill" size="18" class="mb-1 opacity-70" />
        <p class="text-2xl font-black leading-none">{{ today.late }}</p>
        <p class="text-[8px] font-black uppercase tracking-widest mt-1 opacity-70">Lambat</p>
      </NuxtLink>

      <!-- Hadir (large) -->
      <NuxtLink to="/absensi" class="col-span-3 md:col-span-2 bg-emerald-500 rounded-3xl p-4 text-white shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer">
        <Icon name="mingcute:check-circle-fill" size="20" class="mb-1 opacity-70" />
        <p class="text-3xl font-black leading-none">{{ today.present + today.late }}</p>
        <p class="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">Hadir</p>
        <div class="w-full bg-white/20 h-1 rounded-full mt-2 overflow-hidden">
          <div class="h-full bg-white rounded-full transition-all duration-1000" :style="{ width: `${today.attendancePercentage || 0}%` }"></div>
        </div>
        <p class="text-[8px] opacity-60 mt-0.5">{{ today.attendancePercentage || 0 }}%</p>
      </NuxtLink>
    </div>

    <!-- ROW 2: Table + Sidebar -->
    <div class="grid grid-cols-12 gap-4">

      <!-- Activity Table -->
      <div class="col-span-12 lg:col-span-8 bg-base-100 rounded-3xl border border-base-200/60 shadow-sm flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b border-base-200/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div class="flex items-center gap-6">
            <button 
              @click="activeTab = 'attendance'" 
              :class="['flex items-center gap-2 pb-1 border-b-2 font-black text-sm tracking-wide transition-all', activeTab === 'attendance' ? 'border-orange-500 text-base-content' : 'border-transparent text-base-content/40 hover:text-base-content/75']"
            >
              Aktivitas Absensi
              <div :class="['badge badge-sm border-0 font-black text-[9px]', activeTab === 'attendance' ? 'bg-orange-500/10 text-orange-500' : 'bg-base-200 text-base-content/40']">
                {{ filteredAttendances.length }}
              </div>
            </button>
            <button 
              @click="activeTab = 'failures'" 
              :class="['flex items-center gap-2 pb-1 border-b-2 font-black text-sm tracking-wide transition-all', activeTab === 'failures' ? 'border-orange-500 text-base-content' : 'border-transparent text-base-content/40 hover:text-base-content/75']"
            >
              Gagal Deteksi Wajah
              <div :class="['badge badge-sm border-0 font-black text-[9px]', activeTab === 'failures' ? 'bg-orange-500/10 text-orange-500' : 'bg-base-200 text-base-content/40']">
                {{ count?.recentFaceFailures?.length || 0 }}
              </div>
            </button>
          </div>
          <NuxtLink v-if="activeTab === 'attendance'" to="/absensi" class="text-[10px] font-black uppercase text-orange-500 hover:underline tracking-widest">Lihat Semua →</NuxtLink>
          <NuxtLink v-else to="/log/error" class="text-[10px] font-black uppercase text-orange-500 hover:underline tracking-widest">Lihat Semua Log →</NuxtLink>
        </div>

        <template v-if="activeTab === 'attendance'">
          <!-- Filter Toolbar -->
          <div class="px-6 py-3 bg-base-200/30 border-b border-base-200/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <!-- Search input -->
            <div class="relative flex-1 min-w-[180px] max-w-xs">
              <Icon name="mingcute:search-line" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input v-model="searchQuery"
                     type="text"
                     placeholder="Cari nama / NIS..."
                     class="input input-xs w-full pl-8 rounded-xl bg-base-100 border-base-200 text-xs focus:border-orange-500 font-medium" />
            </div>

            <!-- Filters & Pills -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Class Dropdown Filter -->
              <select v-model="selectedClassFilter" class="select select-xs rounded-xl bg-base-100 border-base-200 text-xs font-bold">
                <option value="">Semua Kelas</option>
                <option v-for="c in classList" :key="c" :value="c">{{ c }}</option>
              </select>

              <!-- Status Filter Pills -->
              <div class="flex items-center gap-1 bg-base-100 p-0.5 rounded-xl border border-base-200">
                <button v-for="st in [
                  { key: 'ALL', label: 'Semua' },
                  { key: 'HADIR', label: 'Hadir' },
                  { key: 'TERLAMBAT', label: 'Lambat' },
                  { key: 'IZIN_SAKIT', label: 'Izin/Sakit' },
                  { key: 'ALPHA', label: 'Belum Absen' }
                ]" :key="st.key"
                        @click="statusFilter = st.key"
                        :class="['px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all', statusFilter === st.key ? 'bg-orange-500 text-white shadow-sm' : 'text-base-content/50 hover:text-base-content']">
                  {{ st.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto w-full flex-1 flex flex-col min-h-0 custom-scrollbar">
            <div class="min-w-[680px] flex-1 flex flex-col min-h-0">
              <!-- Col headers -->
              <div class="grid grid-cols-12 text-[9px] font-black uppercase tracking-widest text-base-content/25 px-6 py-2.5 border-b border-base-200/20 shrink-0">
                <div class="col-span-4">Siswa</div>
                <div class="col-span-3">Kelas / Jurusan</div>
                <div class="col-span-2">Waktu</div>
                <div class="col-span-2">Metode</div>
                <div class="col-span-1 text-right">Status</div>
              </div>

              <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-base-200/20">
                <div v-for="a in paginatedAttendances" :key="a.id"
                     @click="openDetail(a)"
                     class="grid grid-cols-12 items-center px-6 py-3 hover:bg-orange-500/5 transition-colors group cursor-pointer">

                  <!-- Avatar + Name -->
                  <div class="col-span-4 flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 group-hover:scale-110 transition-transform flex items-center justify-center shadow-inner">
                      <img v-if="a.photoUrl" :src="a.photoUrl" :alt="a.studentName" class="w-full h-full object-cover" />
                      <div v-else :class="['w-full h-full flex items-center justify-center text-xs font-black', avatarColor(a.studentName)]">
                        {{ a.studentName?.charAt(0) }}
                      </div>
                    </div>
                    <span class="font-semibold text-sm text-base-content truncate group-hover:text-orange-500 transition-colors">{{ a.studentName }}</span>
                  </div>

                  <!-- Class/Major -->
                  <div class="col-span-3 min-w-0">
                    <p class="text-xs font-bold text-base-content/70 truncate">{{ a.className || '—' }}</p>
                    <p class="text-[9px] font-black text-base-content/25 uppercase tracking-wider truncate">{{ a.majorName || 'Belum ada kelas' }}</p>
                  </div>

                  <!-- Time -->
                  <div class="col-span-2 flex flex-col justify-center min-w-0">
                    <div class="flex items-center gap-1">
                      <span class="text-[8px] font-black uppercase text-emerald-500/80">IN</span>
                      <span class="text-xs font-bold text-base-content/60">{{ formatTime(a.time) }}</span>
                    </div>
                    <div class="flex items-center gap-1" v-if="a.lastOutTime">
                      <span class="text-[8px] font-black uppercase text-rose-500/80">OUT</span>
                      <span class="text-xs font-bold text-base-content/60">{{ formatTime(a.lastOutTime) }}</span>
                    </div>
                    <div class="flex items-center gap-1" v-else>
                      <span class="text-[8px] font-black uppercase text-base-content/20">OUT</span>
                      <span class="text-xs font-bold text-base-content/30">-</span>
                    </div>
                  </div>

                  <!-- Method -->
                  <div class="col-span-2">
                    <div class="flex items-center gap-1.5">
                      <Icon :name="methodLabel(a.method).icon" size="13" :class="methodLabel(a.method).color" />
                      <span :class="['text-[9px] font-black uppercase tracking-tight', methodLabel(a.method).color]">{{ methodLabel(a.method).label }}</span>
                    </div>
                  </div>

                  <!-- Status -->
                  <div class="col-span-1 flex justify-end">
                    <div :class="['px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wide whitespace-nowrap', getStatus(a.status).badge]">
                      {{ a.status === 'TERLAMBAT' ? 'Lambat' : (a.status === 'ALPHA' ? 'Belum Absen' : a.status) }}
                    </div>
                  </div>
                </div>

                <div v-if="!filteredAttendances.length" class="flex flex-col items-center justify-center py-16 opacity-30">
                  <Icon name="mingcute:time-line" size="48" />
                  <p class="text-xs font-black uppercase mt-2 tracking-widest">Tidak ada data absensi sesuai filter</p>
                </div>
              </div>

              <!-- Pagination Footer -->
              <div class="px-6 py-2.5 bg-base-200/20 border-t border-base-200/40 flex items-center justify-between gap-4 text-xs font-bold text-base-content/60 shrink-0">
                <div class="text-[11px] font-bold text-base-content/50">
                  Menampilkan {{ filteredAttendances.length ? ((currentPage - 1) * itemsPerPage) + 1 : 0 }} - {{ Math.min(currentPage * itemsPerPage, filteredAttendances.length) }} dari {{ filteredAttendances.length }} siswa
                </div>

                <div class="flex items-center gap-2">
                  <select v-model="itemsPerPage" class="select select-xs rounded-lg bg-base-100 border-base-200 text-[10px] font-bold">
                    <option :value="10">10 / hal</option>
                    <option :value="20">20 / hal</option>
                    <option :value="50">50 / hal</option>
                    <option :value="100">100 / hal</option>
                  </select>

                  <div class="join">
                    <button class="join-item btn btn-xs rounded-l-lg font-black border-base-200" :disabled="currentPage <= 1" @click="currentPage--">«</button>
                    <button class="join-item btn btn-xs font-black bg-base-200 border-base-200 pointer-events-none">Hal {{ currentPage }} / {{ totalPages }}</button>
                    <button class="join-item btn btn-xs rounded-r-lg font-black border-base-200" :disabled="currentPage >= totalPages" @click="currentPage++">»</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="activeTab === 'failures'">
          <div class="overflow-x-auto w-full flex-1 flex flex-col min-h-0 custom-scrollbar">
            <div class="min-w-[680px] flex-1 flex flex-col min-h-0">
              <!-- Col headers for failures -->
              <div class="grid grid-cols-12 text-[9px] font-black uppercase tracking-widest text-base-content/25 px-6 py-2.5 border-b border-base-200/20 shrink-0">
                <div class="col-span-2">Foto</div>
                <div class="col-span-3">Identitas / Token</div>
                <div class="col-span-4">Pesan / Lokasi</div>
                <div class="col-span-3 text-right">Waktu</div>
              </div>

              <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-base-200/20">
                <div v-for="f in count?.recentFaceFailures || []" :key="f.id"
                     @click="openFailureDetail(f)"
                     class="grid grid-cols-12 items-center px-6 py-3 hover:bg-rose-500/5 transition-colors group cursor-pointer">
                  
                  <!-- Captured Photo Thumbnail -->
                  <div class="col-span-2 flex items-center">
                    <div class="w-10 h-10 rounded-xl overflow-hidden bg-base-200 border border-base-300 shadow-inner relative group-hover:scale-105 transition-transform duration-300">
                      <img v-if="f.image" 
                           :src="f.image" 
                           alt="Failed capture" 
                           class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center bg-rose-500/10 text-rose-500">
                        <Icon name="mingcute:user-close-line" size="18" />
                      </div>
                    </div>
                  </div>

                  <!-- Identity / Token -->
                  <div class="col-span-3 min-w-0 pr-2 text-left">
                    <p class="text-sm font-black text-rose-500 truncate" :title="f.identifier">{{ f.identifier }}</p>
                    <p class="text-[9px] font-black text-base-content/20 uppercase tracking-wider truncate">Token / NISN</p>
                  </div>

                  <!-- Message / Gate -->
                  <div class="col-span-4 min-w-0 pr-2 text-left">
                    <p class="text-xs font-semibold text-base-content/85 truncate" :title="f.message">{{ f.message }}</p>
                    <p class="text-[9px] font-bold text-orange-500/80 truncate mt-0.5" v-if="f.gate">
                      <Icon name="mingcute:location-fill" size="10" class="mr-0.5 inline shrink-0" />
                      {{ f.gate }}
                    </p>
                  </div>

                  <!-- Waktu -->
                  <div class="col-span-3 text-right">
                    <p class="text-xs font-black text-base-content/60">{{ formatTime(f.timestamp) }}</p>
                    <p class="text-[8px] font-bold text-base-content/30 mt-0.5">{{ format(parseISO(f.timestamp), 'dd MMM yyyy') }}</p>
                  </div>
                </div>

                <div v-if="!count?.recentFaceFailures?.length" class="flex flex-col items-center justify-center py-20 opacity-10">
                  <Icon name="mingcute:shield-check-line" size="56" class="text-emerald-500" />
                  <p class="text-xs font-black uppercase mt-3 tracking-widest text-emerald-500">Aman · Tidak ada kegagalan wajah</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- RIGHT SIDEBAR -->
      <div class="col-span-12 lg:col-span-4 flex flex-col gap-4">

        <!-- Quick Nav -->
        <div class="bg-base-100 rounded-3xl p-5 border border-base-200/60 shadow-sm shrink-0">
          <p class="text-[9px] font-black text-base-content/25 uppercase tracking-[0.2em] mb-4">Navigasi Cepat</p>
          <div class="grid grid-cols-2 gap-2">
            <NuxtLink v-for="nav in [
              { to: '/siswa',            icon: 'mingcute:user-add-fill',    label: 'Daftar Siswa', color: 'text-primary bg-primary/10' },
              { to: '/izin',             icon: 'mingcute:file-check-fill',  label: 'Review Izin',  color: 'text-amber-500 bg-amber-500/10' },
              { to: '/absensi',          icon: 'mingcute:calendar-2-fill',  label: 'Absensi',      color: 'text-emerald-600 bg-emerald-500/10' },
              { to: isAdmin ? '/admin/users' : '/profile', icon: 'mingcute:settings-6-fill', label: 'Manajemen', color: 'text-sky-500 bg-sky-500/10' }
            ]" :key="nav.to" :to="nav.to"
               class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-base-200/30 hover:bg-base-200/60 hover:scale-[1.02] transition-all group/nav">
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center group-hover/nav:scale-110 transition-transform', nav.color]">
                <Icon :name="nav.icon" size="22" />
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest text-base-content/40 text-center leading-tight">{{ nav.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Context Feed -->
        <div class="flex-1 bg-base-100 rounded-3xl p-5 border border-base-200/60 shadow-sm flex flex-col min-h-0">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <p class="text-[9px] font-black text-base-content/25 uppercase tracking-[0.2em]">{{ isGuru ? 'Izin Menunggu Review' : 'Security Monitor' }}</p>
            <NuxtLink :to="isGuru ? '/izin' : '/log/login'" class="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline">Semua</NuxtLink>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            <!-- Admin Log -->
            <template v-if="!isGuru">
              <div v-for="log in count?.recentLogs || []" :key="log.id"
                   @click="openSecurityLogDetail(log)"
                   class="flex items-center gap-3 p-3 rounded-2xl bg-base-200/30 hover:bg-base-200/50 hover:border-orange-500/20 border border-transparent transition-all group cursor-pointer">
                <div class="w-8 h-8 rounded-xl bg-white border border-base-200/50 flex items-center justify-center text-orange-500 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                  <Icon name="mingcute:key-2-fill" size="16" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold truncate text-base-content">{{ log.details?.identifier || log.details?.message || log.action || 'System Log' }}</p>
                  <p class="text-[8px] font-black uppercase text-base-content/40 tracking-tighter">{{ log.action }} · {{ formatTime(log.timestamp) }}</p>
                </div>
              </div>
            </template>

            <!-- Guru Leave Requests -->
            <template v-else>
              <div v-for="leave in count?.recentLeaves || []" :key="leave.id"
                   class="p-4 rounded-2xl bg-base-200/30 hover:bg-base-200/50 border border-transparent hover:border-amber-500/20 transition-all">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[8px] font-black uppercase tracking-widest text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">{{ leave.type }}</span>
                  <span class="text-[8px] text-base-content/30 font-bold">{{ format(parseISO(leave.createdAt), 'dd MMM') }}</span>
                </div>
                <p class="text-xs font-bold text-base-content mb-3 truncate">{{ leave.studentName }}</p>
                <NuxtLink to="/izin" class="btn btn-xs btn-block rounded-xl font-black text-[9px] h-8 min-h-0 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm transition-all">PROSES DATA</NuxtLink>
              </div>
              <div v-if="!count?.recentLeaves?.length" class="flex flex-col items-center justify-center py-12 opacity-10">
                <Icon name="mingcute:document-fill" size="40" />
                <p class="text-[9px] font-black uppercase mt-2">Tidak ada izin pending</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Dev strip -->
    <div v-if="isAdmin" class="shrink-0 flex flex-wrap items-center justify-between gap-4 bg-base-200/30 border border-base-200/40 rounded-2xl px-6 py-2.5">
      <div v-for="(v, l) in { HOST: system?.osInfo?.hostname, OS: system?.osInfo?.distro, RAM: system?.memory?.used + ' ' + system?.memory?.unit, DISK: system?.disk?.used + '/' + system?.disk?.total }" :key="l" class="flex items-center gap-2">
        <span class="text-[8px] font-black text-orange-500 uppercase tracking-widest">{{ l }}</span>
        <span class="text-[10px] font-bold text-base-content/50">{{ v }}</span>
      </div>
      <div class="flex items-center gap-3">
        <!-- Proxy Toggle Button -->
        <button @click="toggleProxyMode" 
                :title="useProxy ? 'Proxy aktif (lewat Nitro Server)' : 'Tembak Real API langsung (Super Cepat)'"
                class="btn btn-xs rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border"
                :class="useProxy ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'">
          <Icon :name="useProxy ? 'mingcute:server-line' : 'mingcute:flash-fill'" size="12" />
          API: {{ useProxy ? 'Nitro Proxy (ON)' : 'Direct Real API ⚡ (OFF)' }}
        </button>

        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span class="text-[9px] font-black uppercase tracking-widest text-emerald-500">Online</span>
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
            <div :class="['p-6 flex items-center justify-between', getStatus(selectedAttendance.status).dot.replace('bg-', 'bg-').replace('500', '500/10')]">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative">
                  <img v-if="selectedAttendance.photoUrl" 
                       :src="selectedAttendance.photoUrl" 
                       :alt="selectedAttendance.studentName" 
                       class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300" 
                       @click="openImagePreview(selectedAttendance.photoUrl)" />
                  <div v-else :class="['w-full h-full flex items-center justify-center text-xl font-black', avatarColor(selectedAttendance.studentName)]">
                    {{ selectedAttendance.studentName?.charAt(0) }}
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content">{{ selectedAttendance.studentName }}</h3>
                  <p class="text-xs text-base-content/50 font-bold">{{ selectedAttendance.className || 'Belum ada kelas' }} · {{ selectedAttendance.majorName || '' }}</p>
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
                  {{ selectedAttendance.status }}
                </div>
              </div>

              <!-- Detail rows -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Masuk</span>
                  </div>
                  <span class="text-sm font-black text-base-content">{{ formatFull(selectedAttendance.time) }}</span>
                </div>
                <div class="flex items-center justify-between" v-if="selectedAttendance.lastOutTime">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Pulang</span>
                  </div>
                  <span class="text-sm font-black text-base-content">{{ formatFull(selectedAttendance.lastOutTime) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon :name="methodLabel(selectedAttendance.method).icon" size="16" />
                    <span class="text-xs font-bold">Metode</span>
                  </div>
                  <span :class="['text-sm font-black', methodLabel(selectedAttendance.method).color]">{{ methodLabel(selectedAttendance.method).label }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:school-line" size="16" />
                    <span class="text-xs font-bold">Kelas</span>
                  </div>
                  <span class="text-sm font-black text-base-content">{{ selectedAttendance.className || '—' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:building-4-line" size="16" />
                    <span class="text-xs font-bold">Jurusan</span>
                  </div>
                  <span class="text-sm font-black text-base-content">{{ selectedAttendance.majorName || '—' }}</span>
                </div>
              </div>

              <!-- Detailed Scan Logs with Captured Photos -->
              <div class="pt-4 border-t border-base-200/50 space-y-3" v-if="selectedAttendance.logs && selectedAttendance.logs.length">
                <h4 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Detail Scan Wajah & Foto</h4>
                <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
                  <div v-for="log in selectedAttendance.logs" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/50 transition-colors">
                    <!-- Attendance Image (Photo taken during scan) -->
                    <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 shadow-inner relative">
                      <img :src="log.notes || selectedAttendance.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png'" 
                           alt="scan" 
                           class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300"
                           @click="openImagePreview(log.notes || selectedAttendance.photoUrl || 'https://api.tierkun.my.id/file/picture/0000.png')" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-mono font-bold text-base-content">{{ formatTime(log.timestamp) }}</span>
                        <span :class="['px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider', getStatus(log.status).badge]">
                          {{ log.status === 'TERLAMBAT' ? 'Lambat' : log.status }}
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
            <div class="p-6 pt-0 flex gap-3">
              <button @click="closeModal" class="btn btn-ghost flex-1 rounded-2xl font-black">Tutup</button>
              <NuxtLink :to="`/absensi`" @click="closeModal" class="btn bg-orange-500 hover:bg-orange-600 text-white flex-1 rounded-2xl font-black border-0 shadow-lg shadow-orange-500/20">
                Lihat Semua Absensi
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ FAILURE DETAIL MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedFailure" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="closeFailureDetail">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden z-10">
            
            <!-- Modal Header -->
            <div class="p-6 bg-rose-500/10 flex items-center justify-between border-b border-rose-500/20">
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border border-base-300 shrink-0 shadow-inner relative flex items-center justify-center">
                  <img v-if="selectedFailure.image" 
                       :src="selectedFailure.image" 
                       alt="Failed capture" 
                       class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300" 
                       @click.stop="openImagePreview(selectedFailure.image)" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-rose-500/10 text-rose-500">
                    <Icon name="mingcute:user-close-line" size="28" />
                  </div>
                </div>
                <div class="min-w-0">
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-1 inline-block">Gagal Deteksi Wajah</span>
                  <h3 class="text-base font-black text-rose-500 truncate" :title="selectedFailure.identifier">{{ selectedFailure.identifier || 'STRANGER/UNKNOWN' }}</h3>
                  <p class="text-xs text-base-content/50 font-bold">Token / NISN / Identitas</p>
                </div>
              </div>
              <button @click="closeFailureDetail" class="btn btn-ghost btn-sm btn-circle shrink-0">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              <!-- Image preview card if available -->
              <div v-if="selectedFailure.image" class="relative w-full h-44 rounded-2xl overflow-hidden bg-base-200 border border-base-300 shadow-inner flex items-center justify-center group/img cursor-pointer" @click="openImagePreview(selectedFailure.image)">
                <img :src="selectedFailure.image" alt="Captured Face" class="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300" />
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                  <Icon name="mingcute:zoom-in-line" size="18" /> Perbesar Foto
                </div>
              </div>

              <!-- Detail Rows -->
              <div class="space-y-3 pt-1">
                <div>
                  <p class="text-[10px] font-black text-base-content/40 uppercase tracking-widest mb-1">Pesan Kejadian / Alasan</p>
                  <div class="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-base-content/90 leading-relaxed">
                    {{ selectedFailure.message }}
                  </div>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:location-fill" size="16" class="text-orange-500" />
                    <span class="text-xs font-bold">Gerbang / Mesin</span>
                  </div>
                  <span class="text-xs font-black text-base-content">{{ selectedFailure.gate || 'Unknown' }}</span>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:time-fill" size="16" />
                    <span class="text-xs font-bold">Waktu Kejadian</span>
                  </div>
                  <span class="text-xs font-black text-base-content">{{ formatFull(selectedFailure.timestamp) }}</span>
                </div>

                <div v-if="selectedFailure.ip" class="flex items-center justify-between py-1 border-b border-base-200/50">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:wifi-line" size="16" />
                    <span class="text-xs font-bold">IP Mesin / URL</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-base-content/80">{{ selectedFailure.ip }}</span>
                </div>

                <div class="flex items-center justify-between py-1">
                  <div class="flex items-center gap-2 text-base-content/40">
                    <Icon name="mingcute:key-2-line" size="16" />
                    <span class="text-xs font-bold">Tipe Aksi Log</span>
                  </div>
                  <span class="text-xs font-mono font-bold text-rose-500 uppercase">{{ selectedFailure.action || 'FACE_RECOGNITION_FAILED' }}</span>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-6 pt-0 flex gap-3">
              <button @click="closeFailureDetail" class="btn btn-ghost flex-1 rounded-2xl font-black">Tutup</button>
              <NuxtLink to="/log/error" @click="closeFailureDetail" class="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 rounded-2xl font-black border-0 shadow-lg shadow-rose-500/20">
                Lihat Semua Log Error
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ SECURITY MONITOR LOG DETAIL MODAL ═══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedSecurityLog" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="closeSecurityLogDetail">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden z-10">
            
            <!-- Modal Header -->
            <div class="p-6 bg-orange-500/10 flex items-center justify-between border-b border-orange-500/20">
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-12 h-12 rounded-2xl bg-white border border-base-200 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                  <Icon name="mingcute:key-2-fill" size="24" />
                </div>
                <div class="min-w-0">
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-1 inline-block">Security Monitor Log</span>
                  <h3 class="text-base font-black text-base-content truncate">{{ selectedSecurityLog.action }}</h3>
                  <p class="text-xs text-base-content/50 font-bold">{{ formatFull(selectedSecurityLog.timestamp) }}</p>
                </div>
              </div>
              <button @click="closeSecurityLogDetail" class="btn btn-ghost btn-sm btn-circle shrink-0">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <!-- Detail Rows -->
              <div class="space-y-3">
                <div v-if="selectedSecurityLog.details?.message || selectedSecurityLog.details?.msg">
                  <p class="text-[10px] font-black text-base-content/40 uppercase tracking-widest mb-1">Detail Pesan</p>
                  <div class="p-3 rounded-2xl bg-base-200/50 border border-base-200 text-xs font-bold text-base-content/90 leading-relaxed">
                    {{ selectedSecurityLog.details?.message || selectedSecurityLog.details?.msg }}
                  </div>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50" v-if="selectedSecurityLog.details?.identifier">
                  <span class="text-xs font-bold text-base-content/40">Identitas / Subjek</span>
                  <span class="text-xs font-black text-orange-500">{{ selectedSecurityLog.details?.identifier }}</span>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50" v-if="selectedSecurityLog.details?.role">
                  <span class="text-xs font-bold text-base-content/40">Peran / Role</span>
                  <span class="text-xs font-black text-base-content uppercase">{{ selectedSecurityLog.details?.role }}</span>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50" v-if="selectedSecurityLog.details?.gate">
                  <span class="text-xs font-bold text-base-content/40">Gerbang / Perangkat</span>
                  <span class="text-xs font-black text-base-content">{{ selectedSecurityLog.details?.gate }}</span>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50" v-if="selectedSecurityLog.details?.ip">
                  <span class="text-xs font-bold text-base-content/40">Alamat IP</span>
                  <span class="text-xs font-mono font-bold text-base-content/80">{{ selectedSecurityLog.details?.ip }}</span>
                </div>

                <div class="flex items-center justify-between py-1 border-b border-base-200/50" v-if="selectedSecurityLog.entity">
                  <span class="text-xs font-bold text-base-content/40">Entitas Sistem</span>
                  <span class="text-xs font-mono font-bold text-base-content/70">{{ selectedSecurityLog.entity }} (ID: {{ selectedSecurityLog.entityId || '-' }})</span>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-6 pt-0 flex gap-3">
              <button @click="closeSecurityLogDetail" class="btn btn-ghost flex-1 rounded-2xl font-black">Tutup</button>
              <NuxtLink to="/log/login" @click="closeSecurityLogDetail" class="btn bg-orange-500 hover:bg-orange-600 text-white flex-1 rounded-2xl font-black border-0 shadow-lg shadow-orange-500/20">
                Lihat Semua Log
              </NuxtLink>
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
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.08); border-radius: 10px; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
