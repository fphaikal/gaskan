<script setup>
const route = useRoute();
const router = useRouter();
const id = route.params.id;




const device = ref(null);
const statsData = ref(null);
const loading = ref(true);
const sendingDoorCmd = ref(false);

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_');
};

const fetchDeviceDetails = async () => {
  loading.value = true;
  try {
    // 1. Fetch devices list to get current device name/url
    const devicesList = await $fetch('/api/device');
    const currentDevice = devicesList.find(d => d.id === id);
    if (!currentDevice) {
      $toast.error('Perangkat tidak ditemukan');
      router.push('/config/device');
      return;
    }
    device.value = currentDevice;

    // 2. Fetch specific hardware stats
    const res = await $fetch(`/api/device/${id}/stats`);
    if (res?.success) {
      statsData.value = res;
    } else {
      $toast.error(res?.message || 'Gagal memuat statistik perangkat');
    }
  } catch (e) {
    console.error('Failed to load device stats:', e);
    $toast.error(e.data?.message || 'Gagal menghubungkan ke perangkat');
  } finally {
    loading.value = false;
  }
};

const sendDoorCommand = async (cmd) => {
  if (!device.value) return;
  sendingDoorCmd.value = true;
  try {
    const res = await $fetch(`/api/device/${id}/door-control`, {
      method: 'POST',
      body: { cmd }
    });
    if (res?.success) {
      $toast.success(res.message);
    } else {
      $toast.error(res?.message || 'Gagal mengirim perintah pintu');
    }
  } catch (e) {
    $toast.error(e.data?.message || 'Gagal terhubung ke mesin untuk mengontrol pintu');
  } finally {
    sendingDoorCmd.value = false;
  }
};

const streamIframeUrl = computed(() => {
  if (!device.value) return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const go2rtcHost = isLocal ? 'http://localhost:1984' : 'https://stream-gaskan.smtijogja.my.id';
  const streamName = slugify(device.value.name);
  return `${go2rtcHost}/stream.html?src=${streamName}&mode=webrtc,mse,hls`;
});

onMounted(() => {
  fetchDeviceDetails();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-0 py-6">
    <!-- Breadcrumbs / Back button -->
    <div class="mb-6">
      <button 
        @click="router.push('/config/device')" 
        class="btn btn-ghost btn-sm rounded-xl gap-1.5 font-bold hover:bg-base-200/60"
      >
        <Icon name="mingcute:arrow-left-line" size="16" />
        Kembali ke Daftar Mesin
      </button>
    </div>

    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-base-content flex items-center gap-2.5 tracking-tight">
          <Icon name="mingcute:cpu-fill" class="text-primary animate-pulse" size="32" />
          {{ device?.name || 'Loading Perangkat...' }}
        </h1>
        <p class="text-sm text-base-content/50 mt-1">Detail statistik, kapasitas hardware, dan live control mesin absensi.</p>
      </div>
      <button 
        @click="fetchDeviceDetails" 
        :disabled="loading" 
        class="btn btn-primary rounded-2xl px-5 h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <span v-if="loading" class="loading loading-spinner loading-xs mr-1"></span>
        <Icon v-else name="mingcute:refresh-1-line" size="18" class="mr-1" />
        Refresh Data
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !device" class="flex flex-col items-center justify-center py-32 gap-3 bg-base-100/50 rounded-3xl border border-base-200/80 backdrop-blur-md shadow-sm">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-sm font-bold text-base-content/50">Membaca detail perangkat...</p>
    </div>

    <!-- Main Dynamic Layout -->
    <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-6">
      <!-- Left Column: Stream preview and access control -->
      <div class="md:col-span-5 flex flex-col gap-6">
        <!-- Live Video Stream -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 class="text-xs font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="mingcute:videocam-fill" class="text-red-500" size="14" />
            Live Preview Camera
          </h3>

          <div class="relative aspect-video w-full rounded-2xl border border-base-200 overflow-hidden bg-black flex items-center justify-center shadow-inner">
            <iframe 
              v-if="device && streamIframeUrl"
              :src="streamIframeUrl" 
              class="w-full h-full border-none"
              allow="autoplay; fullscreen"
            ></iframe>
            <div v-else class="flex flex-col items-center text-base-content/30 gap-2">
              <Icon name="mingcute:videocam-off-fill" size="36" />
              <span class="text-xs font-semibold">Live Preview Tidak Aktif</span>
            </div>
          </div>
        </div>

        <!-- Door controls -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 class="text-xs font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="mingcute:key-fill" class="text-success" size="14" />
            Kontrol Pintu Akses
          </h3>
          
          <div class="flex flex-col gap-2.5">
            <!-- Normal open/close row -->
            <div class="flex gap-2.5">
              <button 
                @click="sendDoorCommand('open')" 
                :disabled="sendingDoorCmd"
                class="btn btn-success btn-sm flex-1 rounded-xl h-11 font-bold flex items-center justify-center gap-1.5 text-xs text-white"
              >
                <span v-if="sendingDoorCmd" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:door-open-fill" size="16" />
                Buka Pintu
              </button>
              <button 
                @click="sendDoorCommand('close')" 
                :disabled="sendingDoorCmd"
                class="btn btn-neutral btn-sm flex-1 rounded-xl h-11 font-bold flex items-center justify-center gap-1.5 text-xs"
              >
                <span v-if="sendingDoorCmd" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:door-close-fill" size="16" />
                Kunci Pintu
              </button>
            </div>
            <!-- Permanent lock/unlock row -->
            <div class="flex gap-2.5">
              <button 
                @click="sendDoorCommand('alwaysOpen')" 
                :disabled="sendingDoorCmd"
                class="btn btn-outline btn-success btn-sm flex-1 rounded-xl h-11 font-bold text-xs"
              >
                Buka Terus
              </button>
              <button 
                @click="sendDoorCommand('alwaysClose')" 
                :disabled="sendingDoorCmd"
                class="btn btn-outline btn-error btn-sm flex-1 rounded-xl h-11 font-bold text-xs"
              >
                Kunci Terus
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Device Specs, Capacity, Stream ID Configuration -->
      <div class="md:col-span-7 space-y-6">
        <!-- Specs Info -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <h3 class="text-xs font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="mingcute:settings-6-fill" class="text-primary" size="14" />
            Informasi & Spesifikasi Perangkat
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-base-200/30 border border-base-200/60 p-4 rounded-2xl">
            <div>
              <span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Model</span>
              <p class="text-sm font-extrabold text-base-content mt-1 flex items-center gap-1.5">
                <Icon name="mingcute:cpu-line" size="14" class="text-primary/70" />
                {{ statsData?.deviceInfo?.model || '-' }}
              </p>
            </div>
            <div>
              <span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Serial No</span>
              <p class="text-sm font-extrabold text-base-content mt-1 flex items-center gap-1.5 font-mono truncate" :title="statsData?.deviceInfo?.serialNo">
                <Icon name="mingcute:key-2-line" size="14" class="text-primary/70 shrink-0" />
                {{ statsData?.deviceInfo?.serialNo || '-' }}
              </p>
            </div>
            <div>
              <span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Firmware</span>
              <p class="text-sm font-extrabold text-base-content mt-1 flex items-center gap-1.5">
                <Icon name="mingcute:package-line" size="14" class="text-primary/70" />
                {{ statsData?.deviceInfo?.firmwareVersion || '-' }}
              </p>
            </div>
          </div>

          <!-- Connection configuration details -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-base-content/70 border-t border-base-200/60 pt-4">
            <div class="flex items-center gap-2">
              <Icon name="mingcute:link-2-line" size="18" class="opacity-60" />
              <span>IP / Url: <span class="font-mono text-xs bg-base-200/50 px-2 py-0.5 rounded-lg text-base-content">{{ device?.url }}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="mingcute:user-3-line" size="18" class="opacity-60" />
              <span>Username: <span class="font-bold text-base-content">{{ device?.username }}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="mingcute:time-line" size="18" class="opacity-60" />
              <span>Interval Pooling: <span class="font-bold text-base-content">{{ device?.poolingInterval }} detik</span></span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="mingcute:shield-check-line" size="18" class="opacity-60" />
              <span>Status Perangkat: <span :class="['font-bold', device?.isActive ? 'text-success' : 'text-error']">{{ device?.isActive ? 'Aktif' : 'Non-Aktif' }}</span></span>
            </div>
          </div>
        </div>

        <!-- go2rtc Stream ID configuration box -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 class="text-xs font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="mingcute:code-box-fill" class="text-warning" size="14" />
            Konfigurasi Stream go2rtc
          </h3>
          
          <div class="bg-base-200/30 border border-base-200/50 p-4 rounded-2xl space-y-3.5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200/50 pb-2">
              <div>
                <span class="text-[10px] font-bold text-base-content/45 uppercase tracking-widest leading-none">Nama Stream (Rekomendasi)</span>
                <p class="text-sm font-extrabold text-success font-mono mt-0.5 select-all">{{ slugify(device?.name) }}</p>
              </div>
              <span class="text-[10px] text-base-content/50 italic leading-snug sm:text-right">
                Lebih mudah diketik di file <code class="font-mono text-primary font-bold">go2rtc.yaml</code>
              </span>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-[10px] font-bold text-base-content/45 uppercase tracking-widest leading-none">ID Perangkat (Cadangan)</span>
                <p class="text-xs font-semibold text-base-content/70 font-mono mt-0.5 select-all">{{ device?.id }}</p>
              </div>
              <span class="text-[10px] text-base-content/40 italic leading-snug sm:text-right">
                ID unik permanen perangkat
              </span>
            </div>
          </div>
        </div>

        <!-- Biometric Capacity details -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <h3 class="text-xs font-bold text-base-content/40 uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="mingcute:dashboard-3-fill" class="text-info" size="14" />
            Kapasitas & Penggunaan Biometrik
          </h3>

          <div v-if="statsData" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Person Capacity -->
            <div class="space-y-1.5 font-sans">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-base-content flex items-center gap-1.5">
                  <Icon name="mingcute:user-3-fill" class="text-primary" size="14" />
                  Person (Pengguna)
                </span>
                <span class="font-semibold text-base-content/60">{{ statsData.stats?.person }} / {{ statsData.capabilities?.maxPerson }}</span>
              </div>
              <progress 
                class="progress progress-primary w-full h-2 rounded-full" 
                :value="statsData.stats?.person" 
                :max="statsData.capabilities?.maxPerson"
              ></progress>
            </div>

            <!-- Face Capacity -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-base-content flex items-center gap-1.5">
                  <Icon name="mingcute:scan-face-fill" class="text-success" size="14" />
                  Wajah Terdaftar
                </span>
                <span class="font-semibold text-base-content/60">{{ statsData.stats?.face }} / {{ statsData.capabilities?.maxFace }}</span>
              </div>
              <progress 
                class="progress progress-success w-full h-2 rounded-full" 
                :value="statsData.stats?.face" 
                :max="statsData.capabilities?.maxFace"
              ></progress>
            </div>

            <!-- Card Capacity -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-base-content flex items-center gap-1.5">
                  <Icon name="mingcute:card-membership-fill" class="text-info" size="14" />
                  Kartu RFID
                </span>
                <span class="font-semibold text-base-content/60">{{ statsData.stats?.card }} / {{ statsData.capabilities?.maxCard }}</span>
              </div>
              <progress 
                class="progress progress-info w-full h-2 rounded-full" 
                :value="statsData.stats?.card" 
                :max="statsData.capabilities?.maxCard"
              ></progress>
            </div>

            <!-- Fingerprint Capacity -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-base-content flex items-center gap-1.5">
                  <Icon name="mingcute:fingerprint-fill" class="text-warning" size="14" />
                  Sidik Jari
                </span>
                <span class="font-semibold text-base-content/60">{{ statsData.stats?.fingerprint }} / {{ statsData.capabilities?.maxFingerprint }}</span>
              </div>
              <progress 
                class="progress progress-warning w-full h-2 rounded-full" 
                :value="statsData.stats?.fingerprint" 
                :max="statsData.capabilities?.maxFingerprint"
              ></progress>
            </div>
          </div>

          <div v-else class="text-center py-6 text-sm text-base-content/40 italic">
            Spesifikasi biometrik tidak tersedia.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
