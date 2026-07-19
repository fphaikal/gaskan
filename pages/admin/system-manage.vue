<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

useSeoMeta({
  title: 'Kelola Sistem | GASKAN',
  description: 'Statistik Penyimpanan Server dan Metrik Performa Hardware',
});

const { $toast } = useNuxtApp();

const loading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const metrics = ref(null);
let refreshTimer = null;

const fetchMetrics = async (isManual = false) => {
  if (isManual) refreshing.value = true;
  try {
    const res = await $fetch('/api/system/metrics');
    if (res?.success && res.data) {
      metrics.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch system metrics:', err);
    if (isManual) $toast.error('Gagal memperbarui metrik sistem');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

onMounted(() => {
  fetchMetrics();
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      fetchMetrics();
    }
  }, 10000); // refresh every 10 seconds
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getCpuTempColor = (temp) => {
  if (!temp) return { text: 'text-success', bg: 'bg-success/15 border-success/30', label: 'Normal' };
  if (temp < 60) return { text: 'text-success', bg: 'bg-success/15 border-success/30', label: 'Normal' };
  if (temp < 75) return { text: 'text-warning', bg: 'bg-warning/15 border-warning/30', label: 'Warm' };
  return { text: 'text-error', bg: 'bg-error/15 border-error/30', label: 'Panas' };
};

const getUsageColor = (percent) => {
  if (percent < 50) return 'bg-success';
  if (percent < 80) return 'bg-warning';
  return 'bg-error';
};

const storageBreakdownWithPercentage = computed(() => {
  if (!metrics.value?.storage?.breakdown) return [];
  const total = metrics.value.storage.total.sizeBytes || 1;
  return metrics.value.storage.breakdown.map(item => ({
    ...item,
    percent: Math.round((item.sizeBytes / total) * 100)
  }));
});

const bentoCard = "bg-base-100 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 border border-base-200/60 shadow-sm transition-all duration-300";
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 pb-16 text-left">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
          <Icon name="mingcute:server-2-fill" class="text-sm" />
          <span>Super Admin & Developer Dashboard</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-black text-base-content tracking-tight">Kelola Sistem & Metrik Server</h1>
        <p class="text-sm text-base-content/60 mt-1">
          Pantau penggunaan memori storage (foto & file) serta performa hardware server secara real-time.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <label class="label cursor-pointer gap-2 bg-base-200/50 px-3 py-2 rounded-xl border border-base-300">
          <input v-model="autoRefresh" type="checkbox" class="toggle toggle-primary toggle-xs" />
          <span class="label-text text-xs font-bold opacity-70">Auto Refresh</span>
        </label>

        <button 
          @click="fetchMetrics(true)" 
          class="btn btn-primary rounded-xl md:rounded-2xl gap-2 shadow-lg shadow-primary/20"
          :disabled="refreshing"
        >
          <Icon name="mingcute:refresh-1-line" :class="['text-lg', refreshing ? 'animate-spin' : '']" />
          <span>{{ refreshing ? 'Memuat...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-24">
      <span class="loading loading-spinner loading-lg text-primary opacity-40"></span>
    </div>

    <div v-else-if="metrics" class="space-y-6 animate-in fade-in duration-500">
      
      <!-- Top Metrik Highlight Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Total Storage -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Icon name="mingcute:hard-drive-fill" size="24" />
            </div>
            <span class="badge badge-primary badge-outline text-[10px] font-black">
              {{ metrics.storage.total.fileCount }} Berkas
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Total Storage File</p>
            <h3 class="text-2xl md:text-3xl font-black text-base-content mt-1">
              {{ metrics.storage.total.sizeFormatted }}
            </h3>
            <p class="text-[11px] text-base-content/50 mt-1">Direktori /uploads</p>
          </div>
        </div>

        <!-- Card 2: CPU Temperature -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Icon name="mingcute:fire-fill" size="24" />
            </div>
            <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', getCpuTempColor(metrics.hardware.cpu.tempCelsius).bg, getCpuTempColor(metrics.hardware.cpu.tempCelsius).text]">
              {{ getCpuTempColor(metrics.hardware.cpu.tempCelsius).label }}
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Suhu CPU Server</p>
            <h3 class="text-2xl md:text-3xl font-black text-base-content mt-1 flex items-baseline gap-1">
              <span>{{ metrics.hardware.cpu.tempCelsius }}</span>
              <span class="text-lg font-bold opacity-60">°C</span>
            </h3>
            <p class="text-[11px] text-base-content/50 mt-1">Sensor Termal OS</p>
          </div>
        </div>

        <!-- Card 3: RAM Memory -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Icon name="mingcute:cpu-fill" size="24" />
            </div>
            <span class="text-xs font-bold opacity-60">{{ metrics.hardware.memory.usagePercent }}%</span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">RAM Digunakan</p>
            <h3 class="text-2xl md:text-3xl font-black text-base-content mt-1">
              {{ (metrics.hardware.memory.usedMB / 1024).toFixed(2) }} GB
            </h3>
            <div class="w-full bg-base-300 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                class="h-full transition-all duration-500"
                :class="getUsageColor(metrics.hardware.memory.usagePercent)"
                :style="{ width: `${metrics.hardware.memory.usagePercent}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Card 4: Server Uptime -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icon name="mingcute:time-fill" size="24" />
            </div>
            <span class="badge badge-success badge-outline text-[10px] font-black">Online</span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Uptime Server OS</p>
            <h3 class="text-xl md:text-2xl font-black text-base-content mt-1 truncate">
              {{ metrics.hardware.os.uptimeFormatted }}
            </h3>
            <p class="text-[11px] text-base-content/50 mt-1">OS: {{ metrics.hardware.os.platform }} ({{ metrics.hardware.os.arch }})</p>
          </div>
        </div>
      </div>

      <!-- Storage Breakdown Section -->
      <div :class="bentoCard" class="space-y-6">
        <div class="flex items-center justify-between border-b border-base-200/80 pb-4">
          <div>
            <h2 class="text-xl font-black text-base-content flex items-center gap-2">
              <Icon name="mingcute:folder-3-fill" class="text-primary" />
              <span>Rincian Penggunaan Storage File (/uploads)</span>
            </h2>
            <p class="text-xs opacity-50 mt-1">
              Detail kapasitas penyimpanan yang digunakan oleh foto profil, foto wajah ISAPI, surat izin, dan foto tim.
            </p>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold text-primary">{{ formatBytes(metrics.storage.total.sizeBytes) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="item in storageBreakdownWithPercentage" 
            :key="item.key"
            class="p-4 rounded-2xl bg-base-200/40 border border-base-200 flex flex-col justify-between space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon v-if="item.key === 'photos'" name="mingcute:user-4-fill" class="text-base" />
                  <Icon v-else-if="item.key === 'faces'" name="mingcute:scan-fill" class="text-base" />
                  <Icon v-else-if="item.key === 'team'" name="mingcute:group-fill" class="text-base" />
                  <Icon v-else-if="item.key === 'proofs'" name="mingcute:document-2-fill" class="text-base" />
                  <Icon v-else name="mingcute:folder-fill" class="text-base" />
                </div>
                <span class="font-bold text-sm text-base-content">{{ item.category }}</span>
              </div>
              <span class="badge badge-sm bg-base-300 font-bold border-none text-[10px]">
                {{ item.fileCount }} berkas
              </span>
            </div>

            <div>
              <div class="flex justify-between items-baseline text-xs mb-1 font-semibold">
                <span class="opacity-60">Ukuran: {{ formatBytes(item.sizeBytes) }}</span>
                <span class="text-primary font-bold">{{ item.percent }}%</span>
              </div>
              <div class="w-full bg-base-300 rounded-full h-2 overflow-hidden">
                <div 
                  class="bg-primary h-full transition-all duration-500 rounded-full"
                  :style="{ width: `${item.percent}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hardware & Server Specs Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Hardware CPU & Memory Details -->
        <div :class="bentoCard" class="space-y-6">
          <div class="border-b border-base-200/80 pb-4">
            <h2 class="text-xl font-black text-base-content flex items-center gap-2">
              <Icon name="mingcute:cpu-line" class="text-primary" />
              <span>Metrik CPU & Memory Node.js</span>
            </h2>
            <p class="text-xs opacity-50 mt-1">Spesifikasi prosesor dan konsumsi memori proses aplikasi.</p>
          </div>

          <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-base-200/40 border border-base-200 space-y-2">
              <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Model CPU Server</p>
              <p class="font-black text-sm text-base-content">{{ metrics.hardware.cpu.model }}</p>
              <div class="flex items-center gap-4 text-xs font-semibold pt-1">
                <span>Cores: <strong class="text-primary">{{ metrics.hardware.cpu.cores }}</strong></span>
                <span>Load Avg: <strong class="text-primary">{{ metrics.hardware.cpu.loadAvg.join(', ') }}</strong></span>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-base-200/40 border border-base-200 space-y-3">
              <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Memori Proses Node.js</p>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-2 rounded-xl bg-base-100 border border-base-300">
                  <p class="text-[9px] font-bold opacity-50 uppercase">Heap Used</p>
                  <p class="font-black text-sm text-primary mt-0.5">{{ metrics.hardware.process.heapUsedMB }} MB</p>
                </div>
                <div class="p-2 rounded-xl bg-base-100 border border-base-300">
                  <p class="text-[9px] font-bold opacity-50 uppercase">Heap Total</p>
                  <p class="font-black text-sm text-base-content mt-0.5">{{ metrics.hardware.process.heapTotalMB }} MB</p>
                </div>
                <div class="p-2 rounded-xl bg-base-100 border border-base-300">
                  <p class="text-[9px] font-bold opacity-50 uppercase">RSS Memory</p>
                  <p class="font-black text-sm text-base-content mt-0.5">{{ metrics.hardware.process.rssMB }} MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Database & Accounts Summary -->
        <div :class="bentoCard" class="space-y-6">
          <div class="border-b border-base-200/80 pb-4">
            <h2 class="text-xl font-black text-base-content flex items-center gap-2">
              <Icon name="mingcute:user-setting-fill" class="text-primary" />
              <span>Statistik Akun & Database</span>
            </h2>
            <p class="text-xs opacity-50 mt-1">Jumlah akun terdaftar per role dan jumlah entri database.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
              <p class="text-[10px] font-black uppercase tracking-wider text-amber-400">Developer Role</p>
              <h3 class="text-2xl font-black text-amber-300 mt-1">{{ metrics.database.accounts.DEVELOPER }}</h3>
              <p class="text-[10px] opacity-60 mt-1">Akses Penuh Super Admin</p>
            </div>

            <div class="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-left">
              <p class="text-[10px] font-black uppercase tracking-wider text-violet-400">Administrator Role</p>
              <h3 class="text-2xl font-black text-violet-300 mt-1">{{ metrics.database.accounts.ADMIN }}</h3>
              <p class="text-[10px] opacity-60 mt-1">Pengelola Sekolah</p>
            </div>

            <div class="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-left">
              <p class="text-[10px] font-black uppercase tracking-wider text-indigo-400">Guru Role</p>
              <h3 class="text-2xl font-black text-indigo-300 mt-1">{{ metrics.database.accounts.GURU }}</h3>
              <p class="text-[10px] opacity-60 mt-1">Tenaga Pendidik</p>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left">
              <p class="text-[10px] font-black uppercase tracking-wider text-emerald-400">Siswa Role</p>
              <h3 class="text-2xl font-black text-emerald-300 mt-1">{{ metrics.database.accounts.SISWA }}</h3>
              <p class="text-[10px] opacity-60 mt-1">Peserta Didik</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-base-200/40 border border-base-200 flex items-center justify-between text-xs font-bold">
            <span class="opacity-60">Total Record Presensi DB:</span>
            <span class="text-primary font-black text-base">{{ metrics.database.counts.attendance }} Log</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
