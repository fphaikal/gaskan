<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { io } from 'socket.io-client';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

useSeoMeta({
  title: 'Kelola Sistem | GASKAN',
  description: 'Statistik Penyimpanan Server dan Metrik Performa Hardware Real-Time',
});

const { $toast } = useNuxtApp();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const { role: userRole } = storeToRefs(authStore);

const isDeveloper = computed(() => {
  const r = (userRole.value || '').toLowerCase();
  return r === 'developer';
});

const loading = ref(true);
const refreshing = ref(false);
const autoRefresh = ref(true);
const isWsConnected = ref(false);
const metrics = ref(null);
let socket = null;

const fetchMetrics = async (isManual = false) => {
  if (isManual) refreshing.value = true;
  try {
    const res = await $fetch('/api/system/metrics');
    if (res?.success && res.data) {
      metrics.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch system metrics via HTTP:', err);
    if (isManual) $toast.error('Gagal memperbarui metrik sistem');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// Backup CDN & Cloud Storage State
const backupConfig = ref({
  gdriveEnabled: false,
  gdClientId: '',
  gdClientSecret: '',
  gdRefreshToken: '',
  gdFolderId: '',
  hfEnabled: false,
  hfAutoDeleteLocal: false,
  hfThresholdGB: 40,
  hfRepoId: '',
  hfToken: '',
});
const backupProgress = ref(null);
const gdriveCount = ref(0);
const gdriveSizeFormatted = ref('0 B');
const hfCount = ref(0);
const hfSizeFormatted = ref('0 B');
const totalBackedUpCount = ref(0);
const totalBackedUpSizeFormatted = ref('0 B');
const savingBackupConfig = ref(false);
const startingBackupProvider = ref(null);
const purgingLocalFiles = ref(false);
const showHfToken = ref(false);
const connectingGoogle = ref(false);
const unlinkingGoogle = ref(false);

const connectGoogleAccount = async () => {
  if (!backupConfig.value.gdClientId || !backupConfig.value.gdClientSecret) {
    $toast.error('Harap isi dan simpan Client ID & Client Secret Google terlebih dahulu!');
    return;
  }

  connectingGoogle.value = true;
  try {
    await saveBackupConfigSettings();
    const res = await $fetch('/api/system/backup/google/auth-url');
    if (res?.success && res.authUrl) {
      window.location.href = res.authUrl;
    } else {
      $toast.error(res?.message || 'Gagal membuat URL Otentikasi Google');
    }
  } catch (err) {
    $toast.error(err.data?.message || err.message || 'Gagal koneksi Google');
  } finally {
    connectingGoogle.value = false;
  }
};

const unlinkGoogleAccountNow = async () => {
  unlinkingGoogle.value = true;
  try {
    const res = await $fetch('/api/system/backup/google/unlink', { method: 'POST' });
    if (res?.success) {
      $toast.success(res.message);
      backupConfig.value.gdRefreshToken = '';
      fetchBackupStatus();
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal memutuskan koneksi Google');
  } finally {
    unlinkingGoogle.value = false;
  }
};

const totalBackedUpCount = ref(0);
const totalBackedUpSizeFormatted = ref('0 B');
const detailedStats = ref(null);
const savingBackupConfig = ref(false);

const fetchBackupStatus = async () => {
  try {
    const res = await $fetch('/api/system/backup/status');
    if (res?.success && res.data) {
      backupConfig.value = res.data.config || backupConfig.value;
      backupProgress.value = res.data.progress || null;
      gdriveCount.value = res.data.gdriveCount || 0;
      gdriveSizeFormatted.value = res.data.gdriveSizeFormatted || '0 B';
      hfCount.value = res.data.hfCount || 0;
      hfSizeFormatted.value = res.data.hfSizeFormatted || '0 B';
      totalBackedUpCount.value = res.data.totalCount || 0;
      totalBackedUpSizeFormatted.value = res.data.totalSizeFormatted || '0 B';
      detailedStats.value = res.data.detailed || null;
    }
  } catch (err) {
    console.error('Failed to fetch backup status:', err);
  }
};

const saveBackupConfigSettings = async () => {
  savingBackupConfig.value = true;
  try {
    const res = await $fetch('/api/system/backup/config', {
      method: 'POST',
      body: backupConfig.value
    });
    if (res?.success) {
      $toast.success(res.message);
      backupConfig.value = res.data;
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal menyimpan konfigurasi Cloud');
  } finally {
    savingBackupConfig.value = false;
  }
};

const triggerBackupNow = async (provider) => {
  startingBackupProvider.value = provider;
  try {
    const res = await $fetch('/api/system/backup/start', {
      method: 'POST',
      body: { provider }
    });
    if (res?.success) {
      $toast.success(res.message);
      fetchBackupStatus();
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal memulai backup Cloud');
  } finally {
    startingBackupProvider.value = null;
  }
};

const purgeLocalFilesNow = async () => {
  purgingLocalFiles.value = true;
  try {
    const res = await $fetch('/api/system/backup/purge', {
      method: 'POST'
    });
    if (res?.success) {
      $toast.success(res.message);
      fetchBackupStatus();
      fetchMetrics(true);
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal menghapus berkas lokal');
  } finally {
    purgingLocalFiles.value = false;
  }
};

onMounted(() => {
  fetchMetrics();
  fetchBackupStatus();

  const route = useRoute();
  if (route.query.gd_auth === 'success') {
    $toast.success('Akun Google Drive Berhasil Terhubung!');
  } else if (route.query.gd_auth === 'error') {
    $toast.error(route.query.message || 'Gagal menghubungkan Akun Google Drive.');
  }

  try {
    const wsUrl = config.public.wsBase || (process.client ? window.location.origin : '');
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      isWsConnected.value = true;
      socket.emit('system:subscribe');
    });

    socket.on('system:metrics', (data) => {
      if (autoRefresh.value && data) {
        metrics.value = data;
        loading.value = false;
      }
    });

    socket.on('system:backup_progress', (data) => {
      if (data) {
        backupConfig.value = data.config || backupConfig.value;
        backupProgress.value = data.progress || null;
        gdriveCount.value = data.gdriveCount || 0;
        gdriveSizeFormatted.value = data.gdriveSizeFormatted || '0 B';
        hfCount.value = data.hfCount || 0;
        hfSizeFormatted.value = data.hfSizeFormatted || '0 B';
        totalBackedUpCount.value = data.totalCount || 0;
        totalBackedUpSizeFormatted.value = data.totalSizeFormatted || '0 B';
        detailedStats.value = data.detailed || null;
      }
    });

    socket.on('disconnect', () => {
      isWsConnected.value = false;
    });
  } catch (err) {
    console.warn('WebSocket init failed, fallback to HTTP:', err);
  }
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
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

const getDiskStatusColor = (percent) => {
  if (percent < 70) return { bg: 'bg-success', badge: 'bg-success/15 text-success border-success/30', label: 'Aman' };
  if (percent < 85) return { bg: 'bg-warning', badge: 'bg-warning/15 text-warning border-warning/30', label: 'Waspada' };
  return { bg: 'bg-error', badge: 'bg-error/15 text-error border-error/30', label: 'Hampir Penuh' };
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
          Pantau penggunaan memori storage (foto & file) serta performa hardware server secara real-time via WebSocket.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- WebSocket Badge Indicator -->
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-base-200/50 border-base-300">
          <span :class="['w-2 h-2 rounded-full animate-pulse', isWsConnected ? 'bg-success' : 'bg-warning']"></span>
          <span class="opacity-80">{{ isWsConnected ? 'WebSocket Live' : 'HTTP Mode' }}</span>
        </div>

        <label class="label cursor-pointer gap-2 bg-base-200/50 px-3 py-2 rounded-xl border border-base-300">
          <input v-model="autoRefresh" type="checkbox" class="toggle toggle-primary toggle-xs" />
          <span class="label-text text-xs font-bold opacity-70">Auto Sync</span>
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
      
      <!-- Top Metrik Highlight Grid (5 Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Card 1: Total Storage -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Icon name="mingcute:drive-fill" size="24" />
            </div>
            <span class="badge badge-primary badge-outline text-[10px] font-black">
              {{ metrics.storage.total.fileCount }} Berkas
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Total Storage File</p>
            <h3 class="text-xl md:text-2xl font-black text-base-content mt-1">
              {{ metrics.storage.total.sizeFormatted }}
            </h3>
            <p class="text-[11px] text-base-content/50 mt-1">Direktori /uploads</p>
          </div>
        </div>

        <!-- Card 2: Free Disk Space Server -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Icon name="mingcute:storage-fill" size="24" />
            </div>
            <span v-if="metrics.disk" :class="['px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border', getDiskStatusColor(metrics.disk.usagePercent).badge]">
              {{ getDiskStatusColor(metrics.disk.usagePercent).label }}
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Free Storage Server</p>
            <h3 class="text-xl md:text-2xl font-black text-base-content mt-1">
              {{ metrics.disk ? metrics.disk.freeGB : 'N/A' }} GB Free
            </h3>
            <div v-if="metrics.disk" class="w-full bg-base-300 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                class="h-full transition-all duration-500"
                :class="getDiskStatusColor(metrics.disk.usagePercent).bg"
                :style="{ width: `${metrics.disk.usagePercent}%` }"
              />
            </div>
            <p v-if="metrics.disk" class="text-[10px] text-base-content/50 mt-1">
              Total Disk: {{ metrics.disk.totalGB }} GB ({{ metrics.disk.usagePercent }}% Terpakai)
            </p>
          </div>
        </div>

        <!-- Card 3: CPU Temperature -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Icon name="mingcute:flash-fill" size="24" />
            </div>
            <span :class="['px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border', getCpuTempColor(metrics.hardware.cpu.tempCelsius).bg, getCpuTempColor(metrics.hardware.cpu.tempCelsius).text]">
              {{ getCpuTempColor(metrics.hardware.cpu.tempCelsius).label }}
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Suhu CPU Server</p>
            <h3 class="text-xl md:text-2xl font-black text-base-content mt-1 flex items-baseline gap-1">
              <span>{{ metrics.hardware.cpu.tempCelsius }}</span>
              <span class="text-lg font-bold opacity-60">°C</span>
            </h3>
            <p class="text-[11px] text-base-content/50 mt-1">Sensor Termal OS</p>
          </div>
        </div>

        <!-- Card 4: RAM Memory -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Icon name="mingcute:chip-line" size="24" />
            </div>
            <span class="text-xs font-bold opacity-60">{{ metrics.hardware.memory.usagePercent }}%</span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">RAM Digunakan</p>
            <h3 class="text-xl md:text-2xl font-black text-base-content mt-1">
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

        <!-- Card 5: Server Uptime -->
        <div :class="bentoCard" class="relative overflow-hidden group">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icon name="mingcute:time-fill" size="24" />
            </div>
            <span class="badge badge-success badge-outline text-[10px] font-black">Online</span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-base-content/40">Uptime Server OS</p>
            <h3 class="text-lg md:text-xl font-black text-base-content mt-1 truncate">
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
              <span>Rincian Auto Sync Storage File (/uploads)</span>
            </h2>
            <p class="text-xs opacity-50 mt-1">
              Pemindaian otomatis seluruh subdirektori di folder uploads untuk sinkronisasi persentase kapasitas yang terpakai.
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
                  <Icon v-if="item.key.includes('photo') || item.key.includes('profile')" name="mingcute:user-4-fill" class="text-base" />
                  <Icon v-else-if="item.key.includes('face') || item.key.includes('log')" name="mingcute:face-fill" class="text-base" />
                  <Icon v-else-if="item.key.includes('team')" name="mingcute:group-fill" class="text-base" />
                  <Icon v-else-if="item.key.includes('proof') || item.key.includes('surat') || item.key.includes('leave')" name="mingcute:document-2-fill" class="text-base" />
                  <Icon v-else-if="item.key.includes('import') || item.key.includes('temp')" name="mingcute:folder-3-fill" class="text-base" />
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
              <Icon name="mingcute:chip-line" class="text-primary" />
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

        <!-- Sistem Dual Auto Backup CDN & Cloud Storage (Khusus Akun Developer) -->
        <div v-if="isDeveloper" :class="bentoCard" class="space-y-6 md:col-span-2">
          <div class="border-b border-base-200/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="text-left">
              <h2 class="text-xl font-black text-base-content flex items-center gap-2">
                <Icon name="mingcute:upload-3-fill" class="text-sky-500" />
                <span>Sistem Dual Cloud Backup (Developer Exclusive)</span>
              </h2>
              <p class="text-xs opacity-50 mt-1">Dua jalur backup independen: Google Drive untuk semua berkas baru & Hugging Face CDN untuk penghemat memori saat disk penuh.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span :class="['px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider', backupProgress?.active ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30']">
                {{ backupProgress?.active ? `Backup ${backupProgress.pipeline}...` : 'Status: Ready' }}
              </span>
              <span class="px-3 py-1 rounded-full bg-base-200 text-xs font-bold border border-base-300">
                Total {{ totalBackedUpCount }} File ({{ totalBackedUpSizeFormatted }}) Ter-backup
              </span>
            </div>
          </div>

          <!-- DETAILED STORAGE METRICS BENTO CARDS -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Card 1: Local /uploads Disk Stats -->
            <div class="p-4 rounded-2xl bg-base-200/40 border border-base-200 space-y-2 text-left">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="mingcute:folder-fill" class="text-amber-500" size="16" />
                  Disk Lokal /uploads
                </span>
                <span class="badge badge-warning badge-xs font-mono font-bold">{{ detailedStats?.local?.totalFiles || 0 }} File</span>
              </div>
              <div class="text-2xl font-black text-base-content font-mono">
                {{ detailedStats?.local?.totalSizeFormatted || '0 B' }}
              </div>
              <div class="flex items-center justify-between text-[11px] font-medium pt-1 border-t border-base-200/60 opacity-70">
                <span>Foto: {{ detailedStats?.local?.imagesCount || 0 }} ({{ detailedStats?.local?.imagesSizeFormatted || '0 B' }})</span>
                <span>Dokumen: {{ detailedStats?.local?.docsCount || 0 }}</span>
              </div>
            </div>

            <!-- Card 2: Google Drive Cloud Stats -->
            <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-left">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="mingcute:drive-fill" class="text-emerald-500" size="16" />
                  Google Drive Backup
                </span>
                <span class="badge badge-emerald badge-xs font-mono font-bold">{{ detailedStats?.gdrive?.coveragePct || 0 }}% Coverage</span>
              </div>
              <div class="text-2xl font-black text-emerald-400 font-mono">
                {{ detailedStats?.gdrive?.sizeFormatted || '0 B' }}
              </div>
              <div class="flex items-center justify-between text-[11px] font-medium pt-1 border-t border-emerald-500/20 text-emerald-300/80">
                <span>Ter-backup: {{ detailedStats?.gdrive?.count || 0 }} File</span>
                <span>Foto: {{ detailedStats?.gdrive?.imagesCount || 0 }}</span>
              </div>
            </div>

            <!-- Card 3: Hugging Face CDN Stats -->
            <div class="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2 text-left">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="mingcute:upload-3-fill" class="text-sky-500" size="16" />
                  Hugging Face CDN
                </span>
                <span class="badge badge-sky badge-xs font-mono font-bold">{{ detailedStats?.huggingface?.coveragePct || 0 }}% Foto</span>
              </div>
              <div class="text-2xl font-black text-sky-400 font-mono">
                {{ detailedStats?.huggingface?.sizeFormatted || '0 B' }}
              </div>
              <div class="flex items-center justify-between text-[11px] font-medium pt-1 border-t border-sky-500/20 text-sky-300/80">
                <span>Ter-backup: {{ detailedStats?.huggingface?.count || 0 }} Foto</span>
                <span>Repo CDN Active</span>
              </div>
            </div>

            <!-- Card 4: Memory Storage Freed (Purged) -->
            <div class="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2 text-left">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="mingcute:safe-shield-fill" class="text-purple-500" size="16" />
                  Disk Terhemat (Freed)
                </span>
                <span class="badge badge-purple badge-xs font-mono font-bold">Storage Saver</span>
              </div>
              <div class="text-2xl font-black text-purple-400 font-mono">
                {{ detailedStats?.huggingface?.freedSpaceFormatted || '0 B' }}
              </div>
              <div class="flex items-center justify-between text-[11px] font-medium pt-1 border-t border-purple-500/20 text-purple-300/80">
                <span>Bebas dari Disk Lokal</span>
                <span>Redireksi CDN 302</span>
              </div>
            </div>
          </div>

          <!-- Progress Bar (When Active) -->
          <div v-if="backupProgress?.active" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div class="flex justify-between items-center text-xs font-bold">
              <span class="text-amber-400 flex items-center gap-1.5">
                <span class="loading loading-spinner loading-xs"></span>
                {{ backupProgress.statusMessage }}
              </span>
              <span class="text-amber-300 font-mono">{{ backupProgress.processedFiles }} / {{ backupProgress.totalFiles }} File</span>
            </div>
            <progress 
              class="progress progress-warning w-full h-2.5 rounded-full" 
              :value="backupProgress.processedFiles" 
              :max="backupProgress.totalFiles || 1"
            ></progress>
            <div v-if="backupProgress.currentFile" class="text-[10px] font-mono opacity-60 truncate text-left">
              File saat ini: {{ backupProgress.currentFile }}
            </div>
          </div>

          <!-- 2 Distinct Pipelines Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            <!-- PIPELINE 1: Google Drive (All Files Realtime) -->
            <div class="space-y-4 bg-base-200/30 p-5 rounded-2xl border border-base-200 flex flex-col justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-base-200 pb-3">
                  <h3 class="text-sm font-black text-base-content flex items-center gap-2">
                    <Icon name="mingcute:drive-fill" class="text-emerald-500" size="18" />
                    1. Google Drive (Semua Berkas Baru)
                  </h3>
                  <span class="badge badge-emerald badge-xs font-mono font-bold">{{ gdriveCount }} File ({{ gdriveSizeFormatted }})</span>
                </div>

                <p class="text-[11px] opacity-60 leading-relaxed">
                  Backup otomatis berkas baru (foto, dokumen, excel, pdf, dll.) ke Google Drive saat terunggah.
                </p>

                <!-- Enable/Disable Switch -->
                <div class="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-200">
                  <div>
                    <p class="text-xs font-bold">Backup Google Drive Realtime</p>
                    <p class="text-[10px] opacity-50">Curi cadangan saat ada berkas baru</p>
                  </div>
                  <input type="checkbox" v-model="backupConfig.gdriveEnabled" class="toggle toggle-success toggle-sm" />
                </div>

                <!-- Google Drive Config Credentials -->
                <div class="space-y-2.5 pt-1">
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Google Drive Client ID</label>
                    <input 
                      v-model="backupConfig.gdClientId" 
                      type="text" 
                      placeholder="xxxxxx.apps.googleusercontent.com" 
                      class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Google Drive Client Secret</label>
                    <input 
                      v-model="backupConfig.gdClientSecret" 
                      type="password" 
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx" 
                      class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
                    />
                  </div>

                  <!-- Google Account OAuth Connect Status & Button -->
                  <div class="p-3 rounded-xl bg-base-100 border border-base-200 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold">Status Otentikasi Google:</span>
                      <span :class="['px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider', backupConfig.gdRefreshToken ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30']">
                        {{ backupConfig.gdRefreshToken ? '✓ Terhubung' : 'Belum Terhubung' }}
                      </span>
                    </div>

                    <button 
                      v-if="!backupConfig.gdRefreshToken"
                      type="button" 
                      @click="connectGoogleAccount" 
                      :disabled="connectingGoogle || !backupConfig.gdClientId || !backupConfig.gdClientSecret" 
                      class="btn btn-primary btn-xs w-full rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span v-if="connectingGoogle" class="loading loading-spinner loading-xs"></span>
                      <Icon v-else name="mingcute:google-fill" size="14" />
                      Hubungkan Akun Google (Google OAuth)
                    </button>

                    <button 
                      v-else
                      type="button" 
                      @click="unlinkGoogleAccountNow" 
                      :disabled="unlinkingGoogle" 
                      class="btn btn-outline btn-error btn-xs w-full rounded-lg font-bold flex items-center justify-center gap-1.5"
                    >
                      <span v-if="unlinkingGoogle" class="loading loading-spinner loading-xs"></span>
                      <Icon v-else name="mingcute:close-circle-fill" size="14" />
                      Putuskan Koneksi Akun Google
                    </button>
                  </div>

                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Google Drive Folder ID (Opsional)</label>
                    <input 
                      v-model="backupConfig.gdFolderId" 
                      type="text" 
                      placeholder="1a2b3c4d5e6f7g8h9i" 
                      class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <button 
                @click="triggerBackupNow('GOOGLE_DRIVE')" 
                :disabled="startingBackupProvider === 'GOOGLE_DRIVE' || backupProgress?.active" 
                class="btn btn-emerald btn-sm rounded-xl font-bold w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-md shadow-emerald-500/20"
              >
                <span v-if="startingBackupProvider === 'GOOGLE_DRIVE'" class="loading loading-spinner loading-xs mr-1"></span>
                <Icon v-else name="mingcute:drive-fill" class="mr-1" />
                Upload Manual ke Google Drive Sekarang
              </button>
            </div>

            <!-- PIPELINE 2: Hugging Face CDN (Images Only Low-Storage Trigger) -->
            <div class="space-y-4 bg-base-200/30 p-5 rounded-2xl border border-base-200 flex flex-col justify-between">
              <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-base-200 pb-3">
                  <h3 class="text-sm font-black text-base-content flex items-center gap-2">
                    <Icon name="mingcute:upload-3-fill" class="text-sky-500" size="18" />
                    2. Hugging Face CDN (Khusus Foto / Low Storage)
                  </h3>
                  <span class="badge badge-sky badge-xs font-mono font-bold">{{ hfCount }} Foto ({{ hfSizeFormatted }})</span>
                </div>

                <p class="text-[11px] opacity-60 leading-relaxed">
                  Backup otomatis khusus gambar/foto saat memori disk server menipis (&lt; threshold), dilengkapi opsi pembersihan berkas lokal.
                </p>

                <!-- Enable/Disable Switch & Threshold -->
                <div class="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-200">
                  <div>
                    <p class="text-xs font-bold">Auto Backup Disk Menipis</p>
                    <p class="text-[10px] opacity-50">Picu saat sisa disk &lt; threshold</p>
                  </div>
                  <input type="checkbox" v-model="backupConfig.hfEnabled" class="toggle toggle-primary toggle-sm" />
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Batas Sisa Disk (GB Free Threshold)</label>
                  <div class="flex items-center gap-2">
                    <input 
                      v-model.number="backupConfig.hfThresholdGB" 
                      type="number" 
                      min="5" 
                      max="500" 
                      class="input input-sm input-bordered w-full rounded-xl font-bold text-xs"
                    />
                    <span class="text-xs font-black opacity-60">GB Free</span>
                  </div>
                </div>

                <!-- Auto Delete Switch -->
                <div class="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-200">
                  <div>
                    <p class="text-xs font-bold text-error">Hapus Gambar Lokal Otomatis</p>
                    <p class="text-[10px] opacity-50">Hapus gambar dari disk lokal setelah commit ke HF</p>
                  </div>
                  <input type="checkbox" v-model="backupConfig.hfAutoDeleteLocal" class="toggle toggle-error toggle-sm" />
                </div>

                <!-- Hugging Face Config -->
                <div class="space-y-2.5 pt-1">
                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Hugging Face Repo ID</label>
                    <input 
                      v-model="backupConfig.hfRepoId" 
                      type="text" 
                      placeholder="username/gaskan-uploads-backup" 
                      class="input input-sm input-bordered w-full rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div class="space-y-1">
                    <label class="text-[10px] font-black uppercase tracking-widest opacity-50">Hugging Face Access Token (Write)</label>
                    <div class="relative">
                      <input 
                        v-model="backupConfig.hfToken" 
                        :type="showHfToken ? 'text' : 'password'" 
                        placeholder="hf_xxxxxxxxxxxxxxxxxxxxxx" 
                        class="input input-sm input-bordered w-full rounded-xl font-mono text-xs pr-10"
                      />
                      <button type="button" @click="showHfToken = !showHfToken" class="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content">
                        <Icon :name="showHfToken ? 'mingcute:eye-close-line' : 'mingcute:eye-line'" size="16" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                @click="triggerBackupNow('HUGGINGFACE')" 
                :disabled="startingBackupProvider === 'HUGGINGFACE' || backupProgress?.active" 
                class="btn bg-sky-500 hover:bg-sky-600 text-white border-0 btn-sm rounded-xl font-bold w-full mt-4 shadow-md shadow-sky-500/20"
              >
                <span v-if="startingBackupProvider === 'HUGGINGFACE'" class="loading loading-spinner loading-xs mr-1"></span>
                <Icon v-else name="mingcute:upload-3-fill" class="mr-1" />
                Upload Manual ke Hugging Face Sekarang
              </button>
            </div>
          </div>

          <!-- Bottom Action Buttons: Save Config & Purge Storage -->
          <div class="pt-4 border-t border-base-200/80 flex flex-col sm:flex-row justify-between gap-3">
            <button 
              @click="saveBackupConfigSettings" 
              :disabled="savingBackupConfig" 
              class="btn btn-primary btn-sm rounded-xl font-bold px-6 shadow-md shadow-primary/20"
            >
              <span v-if="savingBackupConfig" class="loading loading-spinner loading-xs mr-1"></span>
              <Icon v-else name="mingcute:save-fill" class="mr-1" />
              Simpan Semua Konfigurasi Cloud
            </button>

            <button 
              @click="purgeLocalFilesNow" 
              :disabled="purgingLocalFiles || backupProgress?.active" 
              class="btn btn-outline btn-error btn-sm rounded-xl font-bold px-5"
            >
              <span v-if="purgingLocalFiles" class="loading loading-spinner loading-xs mr-1"></span>
              <Icon v-else name="mingcute:delete-2-fill" class="mr-1" />
              Hapus File Lokal Ter-backup (Purge Storage)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
