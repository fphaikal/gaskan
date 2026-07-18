<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Konfigurasi Mesin & Gerbang | GASKAN',
  description: 'Pengaturan beberapa perangkat absensi Hikvision',
});

const devices = ref([]);
const loading = ref(true);
const saving = ref(false);
const testingId = ref(null);

// Late setting state
const lateHour = ref(7);
const lateMinute = ref(0);
const savingSettings = ref(false);

const lateTime = computed({
  get() {
    const h = String(lateHour.value).padStart(2, '0');
    const m = String(lateMinute.value).padStart(2, '0');
    return `${h}:${m}`;
  },
  set(val) {
    if (val) {
      const [h, m] = val.split(':');
      lateHour.value = Number(h);
      lateMinute.value = Number(m);
    }
  }
});

// Modal state
const showModal = ref(false);
const isEdit = ref(false);
const currentId = ref(null);
const form = ref({
  name: '',
  location: '',
  url: '',
  username: '',
  password: '',
  poolingInterval: 30,
  isActive: true,
});

const fetchDevices = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/device');
    if (data?.success) {
      devices.value = data.data || [];
    }
  } catch (e) {
    console.error('Failed to fetch devices:', e);
    $toast.error('Gagal mengambil daftar perangkat');
  } finally {
    loading.value = false;
  }
};

const fetchSettings = async () => {
  try {
    const res = await $fetch('/api/system/settings');
    if (res?.success && res.data) {
      lateHour.value = res.data.lateHour;
      lateMinute.value = res.data.lateMinute;
    }
  } catch (e) {
    console.error('Failed to fetch settings:', e);
  }
};

onMounted(async () => {
  await fetchDevices();
  await fetchSettings();
});

const openAddModal = () => {
  isEdit.value = false;
  currentId.value = null;
  form.value = {
    name: '',
    location: '',
    url: '',
    username: '',
    password: '',
    poolingInterval: 30,
    isActive: true,
  };
  showModal.value = true;
};

const openEditModal = (device) => {
  isEdit.value = true;
  currentId.value = device.id;
  form.value = {
    name: device.name,
    location: device.location,
    url: device.url,
    username: device.username,
    password: '', // Biarkan kosong
    poolingInterval: device.poolingInterval,
    isActive: device.isActive,
  };
  showModal.value = true;
};

const handleSave = async () => {
  if (!form.value.name || !form.value.location || !form.value.url || !form.value.username) {
    $toast.error('Harap isi semua kolom wajib!');
    return;
  }
  if (!isEdit.value && !form.value.password) {
    $toast.error('Password wajib diisi untuk perangkat baru!');
    return;
  }
  if (form.value.poolingInterval < 1) {
    $toast.error('Interval sinkronisasi tidak boleh kurang dari 1 detik!');
    return;
  }

  saving.value = true;
  try {
    const payload = { ...form.value };
    if (isEdit.value && !payload.password) {
      delete payload.password;
    }

    if (isEdit.value) {
      await $fetch(`/api/device/${currentId.value}`, {
        method: 'PUT',
        body: payload,
      });
      $toast.success('Perangkat berhasil diperbarui');
    } else {
      await $fetch('/api/device', {
        method: 'POST',
        body: payload,
      });
      $toast.success('Perangkat berhasil ditambahkan');
    }
    showModal.value = false;
    await fetchDevices();
  } catch (e) {
    console.error('Save failed:', e);
    $toast.error(e.data?.message || 'Gagal menyimpan perangkat');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini?')) return;
  
  try {
    await $fetch(`/api/device/${id}`, {
      method: 'DELETE',
    });
    $toast.success('Perangkat berhasil dihapus');
    await fetchDevices();
  } catch (e) {
    console.error('Delete failed:', e);
    $toast.error('Gagal menghapus perangkat');
  }
};

const testConnection = async (device) => {
  testingId.value = device.id;
  try {
    const res = await $fetch('/api/device/test-connection', {
      method: 'POST',
      body: {
        url: device.url,
        username: device.username,
        password: 'mock-password',
      },
    });
    if (res?.success) {
      $toast.success(`${device.name}: ${res.message}`);
    } else {
      $toast.error(`${device.name}: ${res.message || 'Koneksi gagal'}`);
    }
  } catch (e) {
    $toast.error(`${device.name}: ${e.data?.message || 'Gagal terhubung'}`);
  } finally {
    testingId.value = null;
  }
};

const testFormConnection = async () => {
  if (!form.value.url || !form.value.username) {
    $toast.error('Harap isi URL dan Username untuk tes koneksi');
    return;
  }
  if (form.value.poolingInterval < 1) {
    $toast.error('Interval sinkronisasi tidak boleh kurang dari 1 detik!');
    return;
  }
  
  saving.value = true;
  try {
    const res = await $fetch('/api/device/test-connection', {
      method: 'POST',
      body: {
        url: form.value.url,
        username: form.value.username,
        password: form.value.password || 'mock-password',
      },
    });
    if (res?.success) {
      $toast.success('Koneksi berhasil!');
    } else {
      $toast.error(res?.message || 'Koneksi gagal');
    }
  } catch (e) {
    $toast.error(e.data?.message || 'Gagal menghubungkan perangkat');
  } finally {
    saving.value = false;
  }
};

const settingPushId = ref(null);

const handleSetupPush = async (device) => {
  const guessedBackend = `${window.location.protocol}//${window.location.hostname}:5000`;
  const serverUrl = prompt(
    `Masukkan Alamat IP/Port Server GASKAN (IP Backend) agar perangkat bisa mengirim data presensi secara real-time (Push Mode):`,
    guessedBackend
  );
  
  if (!serverUrl) return;
  
  settingPushId.value = device.id;
  try {
    const res = await $fetch(`/api/device/${device.id}`, {
      method: 'POST',
      body: { serverUrl }
    });
    
    if (res?.success) {
      $toast.success(res.message);
    } else {
      $toast.error(res.message || 'Gagal konfigurasi push mode');
    }
  } catch (e) {
    console.error('Setup push failed:', e);
    $toast.error(e.data?.message || 'Gagal terhubung ke mesin untuk setup push');
  } finally {
    settingPushId.value = null;
  }
};

const toggleDeviceStatus = async (device) => {
  try {
    await $fetch(`/api/device/${device.id}`, {
      method: 'PUT',
      body: { isActive: !device.isActive },
    });
    device.isActive = !device.isActive;
    $toast.success(`Status ${device.name} berhasil diperbarui`);
  } catch (e) {
    $toast.error('Gagal mengubah status perangkat');
  }
};

const saveLateSettings = async () => {
  savingSettings.value = true;
  try {
    const res = await $fetch('/api/system/settings', {
      method: 'PUT',
      body: {
        lateHour: Number(lateHour.value),
        lateMinute: Number(lateMinute.value)
      }
    });
    if (res?.success) {
      $toast.success(res.message || 'Pengaturan terlambat berhasil disimpan');
    }
  } catch (e) {
    console.error('Save settings failed:', e);
    $toast.error(e.data?.message || 'Gagal menyimpan pengaturan');
  } finally {
    savingSettings.value = false;
  }
};

const showStatsModal = ref(false);
const loadingStats = ref(false);
const statsDevice = ref(null);
const statsData = ref(null);

// Stream & Door Control States
const streamActive = ref(false);
const streamUrl = ref('');
const sendingDoorCmd = ref(false);
let streamTimer = null;

// WebRTC Specific States
const videoElement = ref(null);
const peerConnection = ref(null);
const webrtcConnected = ref(false);

const startStreamTimer = () => {
  stopStreamTimer();
  if (webrtcConnected.value) return; // No snapshots needed if WebRTC is connected
  streamTimer = setInterval(() => {
    if (streamActive.value && statsDevice.value && !webrtcConnected.value) {
      streamUrl.value = `/api/device/${statsDevice.value.id}/capture?t=${Date.now()}`;
    }
  }, 1500);
};

const stopStreamTimer = () => {
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
  }
};

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

const connectWebRTC = async (device) => {
  try {
    disconnectWebRTC();

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const go2rtcHost = isLocal ? 'http://localhost:1984' : 'https://stream-gaskan.smtijogja.my.id';
    const streamIdName = device.id;
    const slugName = slugify(device.name);

    peerConnection.value = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnection.value.ontrack = (event) => {
      if (videoElement.value) {
        videoElement.value.srcObject = event.streams[0];
      }
    };

    // Add transceivers
    peerConnection.value.addTransceiver('video', { direction: 'recvonly' });
    peerConnection.value.addTransceiver('audio', { direction: 'recvonly' });

    const offer = await peerConnection.value.createOffer();
    await peerConnection.value.setLocalDescription(offer);

    let activeStreamName = slugName;
    let res = null;
    let timeoutId = null;

    // Try slugName first (e.g. gerbang_depan)
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 1200);

      res = await fetch(`${go2rtcHost}/api/webrtc?src=${slugName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: offer.sdp,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (e) {
      console.warn(`WebRTC failed with slug '${slugName}', trying ID...`, e);
    }

    // If slug name was not found or failed, try device CUID
    if (!res || !res.ok) {
      activeStreamName = streamIdName;
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 1200);
      
      res = await fetch(`${go2rtcHost}/api/webrtc?src=${streamIdName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: offer.sdp,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    }

    if (!res || !res.ok) {
      throw new Error(`go2rtc returned error status`);
    }

    const answerSdp = await res.text();
    await peerConnection.value.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: answerSdp
    }));

    webrtcConnected.value = true;
    streamActive.value = true;
  } catch (err) {
    console.warn('WebRTC connection failed, falling back to snapshots:', err);
    disconnectWebRTC();
    
    // Fall back to snapshot stream
    webrtcConnected.value = false;
    streamActive.value = true;
    streamUrl.value = `/api/device/${device.id}/capture?t=${Date.now()}`;
    startStreamTimer();
  }
};

const disconnectWebRTC = () => {
  if (peerConnection.value) {
    peerConnection.value.close();
    peerConnection.value = null;
  }
  webrtcConnected.value = false;
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
};

const toggleStream = () => {
  streamActive.value = !streamActive.value;
  if (streamActive.value) {
    if (webrtcConnected.value && statsDevice.value) {
      connectWebRTC(statsDevice.value);
    } else {
      refreshStreamOnce();
    }
  } else {
    disconnectWebRTC();
  }
};

const refreshStreamOnce = () => {
  if (webrtcConnected.value && statsDevice.value) {
    connectWebRTC(statsDevice.value);
  } else if (statsDevice.value) {
    streamUrl.value = `/api/device/${statsDevice.value.id}/capture?t=${Date.now()}`;
  }
};

const handleStreamError = () => {
  streamActive.value = false;
};

const sendDoorCommand = async (cmd) => {
  if (!statsDevice.value) return;
  sendingDoorCmd.value = true;
  try {
    const res = await $fetch(`/api/device/${statsDevice.value.id}/door-control`, {
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

const closeStatsModal = () => {
  showStatsModal.value = false;
  streamActive.value = false;
  disconnectWebRTC();
  stopStreamTimer();
};

const showDeviceStats = async (device) => {
  statsDevice.value = device;
  showStatsModal.value = true;
  loadingStats.value = true;
  statsData.value = null;
  
  // Set up live stream preview
  connectWebRTC(device);

  try {
    const res = await $fetch(`/api/device/${device.id}/stats`);
    if (res?.success) {
      statsData.value = res;
    } else {
      $toast.error(res?.message || 'Gagal memuat statistik perangkat');
      closeStatsModal();
    }
  } catch (e) {
    console.error('Failed to load device stats:', e);
    $toast.error(e.data?.message || 'Gagal menghubungkan ke perangkat untuk mengambil statistik');
    closeStatsModal();
  } finally {
    loadingStats.value = false;
  }
};

onUnmounted(() => {
  disconnectWebRTC();
  stopStreamTimer();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 md:px-0 py-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-base-content mb-2 flex items-center gap-3">
          Mesin & Gerbang Presensi
          <span class="px-2.5 py-1 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-full">
            {{ devices.length }} Perangkat
          </span>
        </h1>
        <p class="text-base-content/60 text-sm">Kelola beberapa mesin absensi Hikvision beserta nama dan lokasinya untuk pelacakan gerbang pintu masuk.</p>
      </div>

      <button @click="openAddModal" class="btn btn-primary rounded-2xl px-6 h-12 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
        <Icon name="mingcute:plus-fill" size="20" class="mr-1.5" />
        Tambah Perangkat
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 3" :key="n" class="bg-base-100/60 border border-base-200 rounded-3xl p-6 shadow-sm space-y-4 animate-pulse">
        <div class="h-6 w-1/2 bg-base-300 rounded-lg"></div>
        <div class="h-4 w-1/3 bg-base-200 rounded-lg"></div>
        <div class="space-y-2 pt-4">
          <div class="h-4 bg-base-200 rounded"></div>
          <div class="h-4 bg-base-200 rounded w-5/6"></div>
        </div>
        <div class="h-10 bg-base-300 rounded-2xl w-full pt-4"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="devices.length === 0" class="bg-base-100/60 border border-base-200/80 backdrop-blur-md rounded-3xl p-16 text-center max-w-lg mx-auto shadow-sm">
      <div class="w-16 h-16 rounded-2xl bg-base-200/50 border border-base-300 flex items-center justify-center mx-auto mb-5">
        <Icon name="mingcute:cpu-line" size="32" class="text-base-content/40" />
      </div>
      <h3 class="text-xl font-bold text-base-content mb-2">Belum ada perangkat terdaftar</h3>
      <p class="text-base-content/50 text-sm mb-6">Tambahkan mesin sidik jari/wajah Hikvision pertama Anda untuk mulai sinkronisasi data kehadiran siswa secara otomatis.</p>
      <button @click="openAddModal" class="btn btn-primary rounded-xl px-5 btn-sm h-10">
        <Icon name="mingcute:plus-fill" size="16" class="mr-1" />
        Daftarkan Mesin
      </button>
    </div>

    <!-- Grid of Devices -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="d in devices" :key="d.id" class="bg-base-100 border border-base-200/80 hover:border-primary/30 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
        <!-- Decoration light glow -->
        <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>

        <div>
          <!-- Header Card -->
          <div class="flex justify-between items-start mb-4">
            <div>
              <h2 class="text-xl font-bold text-base-content group-hover:text-primary transition-colors">{{ d.name }}</h2>
              <div class="flex items-center gap-1 text-xs text-base-content/50 mt-1 font-medium">
                <Icon name="mingcute:location-fill" class="text-primary/70 shrink-0" size="14" />
                <span>{{ d.location }}</span>
              </div>
            </div>
            <!-- Toggle switch to activate/deactivate -->
            <input 
              type="checkbox" 
              class="toggle toggle-primary toggle-sm" 
              :checked="d.isActive" 
              @change="toggleDeviceStatus(d)"
            />
          </div>

          <!-- Divider -->
          <div class="border-t border-base-200/60 my-4"></div>

          <!-- Connection Stats -->
          <div class="space-y-2.5 text-sm font-medium text-base-content/70">
            <div class="flex items-center gap-2">
              <Icon name="mingcute:link-2-line" size="16" class="opacity-60" />
              <span class="font-mono text-xs truncate bg-base-200/50 px-2 py-0.5 rounded-lg">{{ d.url }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="mingcute:user-3-line" size="16" class="opacity-60" />
              <span>Username: <span class="font-semibold text-base-content">{{ d.username }}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="mingcute:transmission-line" size="16" class="opacity-60" />
              <span>Mode: <span class="font-semibold text-primary">Push Webhook (Real-time)</span></span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="mingcute:time-line" size="16" class="opacity-60" />
              <span>Interval: <span class="font-semibold text-base-content">{{ d.poolingInterval }} detik</span></span>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-6 pt-4 border-t border-base-200/60 space-y-3">
          <div class="flex gap-2">
            <button 
              @click="testConnection(d)" 
              :disabled="testingId === d.id"
              class="btn btn-outline btn-primary btn-sm rounded-xl px-3 flex-1 h-9"
            >
              <span v-if="testingId === d.id" class="loading loading-spinner loading-xs mr-1"></span>
              <Icon v-else name="mingcute:radar-fill" size="14" class="mr-1" />
              Test Koneksi
            </button>
            <button 
              @click="handleSetupPush(d)" 
              :disabled="settingPushId === d.id"
              class="btn btn-primary btn-sm rounded-xl px-3 flex-1 h-9 text-xs"
            >
              <span v-if="settingPushId === d.id" class="loading loading-spinner loading-xs mr-1"></span>
              <Icon v-else name="mingcute:upload-2-fill" size="14" class="mr-1" />
              Setup Push
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-xs text-base-content/40 font-medium">Aksi Perangkat:</span>
            <div class="flex items-center gap-1.5">
              <button @click="showDeviceStats(d)" class="btn btn-square btn-ghost btn-sm rounded-xl border border-base-200 hover:border-success/20 hover:text-success" title="Statistik & Kapasitas Alat">
                <Icon name="mingcute:chart-bar-fill" size="16" />
              </button>
              <button @click="openEditModal(d)" class="btn btn-square btn-ghost btn-sm rounded-xl border border-base-200 hover:border-primary/20 hover:text-primary">
                <Icon name="mingcute:pencil-fill" size="16" />
              </button>
              <button @click="handleDelete(d.id)" class="btn btn-square btn-ghost btn-sm rounded-xl border border-base-200 hover:border-error/20 hover:text-error">
                <Icon name="mingcute:delete-2-fill" size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Late Threshold Configuration Card -->
    <div class="mt-12 max-w-xl bg-base-100 border border-base-200/80 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden group">
      <!-- Glow decoration -->
      <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>

      <div class="flex items-start gap-4 mb-6">
        <div class="w-12 h-12 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning shrink-0">
          <Icon name="mingcute:time-fill" size="24" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-base-content">Batas Jam Terlambat</h2>
          <p class="text-xs text-base-content/50 mt-1">Konfigurasi jam batas presensi masuk. Siswa yang melakukan tap setelah waktu yang ditentukan akan otomatis ditandai sebagai "TERLAMBAT".</p>
        </div>
      </div>

      <div class="form-control mb-6 max-w-xs">
        <label class="label"><span class="label-text font-bold text-base-content/80">Batas Waktu Masuk <span class="text-error">*</span></span></label>
        <input 
          v-model="lateTime" 
          type="time" 
          class="input input-bordered w-full rounded-2xl font-bold text-base h-12"
        />
      </div>

      <div class="flex justify-end pt-4 border-t border-base-200/60">
        <button 
          @click="saveLateSettings" 
          :disabled="savingSettings" 
          class="btn btn-primary rounded-2xl px-6 h-12 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span v-if="savingSettings" class="loading loading-spinner loading-xs mr-1"></span>
          <Icon v-else name="mingcute:check-fill" size="18" class="mr-1" />
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- Frosted Glass CRUD Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-opacity duration-300">
      <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl relative animate-scale-in">
        <!-- Close Button -->
        <button @click="showModal = false" class="btn btn-square btn-ghost btn-sm rounded-xl absolute top-6 right-6">
          <Icon name="mingcute:close-line" size="20" />
        </button>

        <h3 class="text-2xl font-extrabold text-base-content mb-2 flex items-center gap-2">
          <Icon :name="isEdit ? 'mingcute:pencil-fill' : 'mingcute:plus-fill'" class="text-primary" />
          {{ isEdit ? 'Edit Perangkat' : 'Daftarkan Perangkat Baru' }}
        </h3>
        <p class="text-sm text-base-content/50 mb-6">Atur rincian mesin absensi Anda untuk diletakkan pada gerbang penyeberangan masuk siswa.</p>

        <!-- Form fields -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-base-content/80">Nama Perangkat <span class="text-error">*</span></span></label>
              <input v-model="form.name" type="text" placeholder="Misal: Gerbang Depan" class="input input-bordered w-full rounded-2xl font-medium" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-base-content/80">Lokasi / Gate <span class="text-error">*</span></span></label>
              <input v-model="form.location" type="text" placeholder="Misal: Lobi Depan" class="input input-bordered w-full rounded-2xl font-medium" />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-base-content/80">Base URL Mesin <span class="text-error">*</span></span></label>
            <input v-model="form.url" type="text" placeholder="http://192.168.1.64" class="input input-bordered w-full rounded-2xl font-mono text-sm" />
            <span class="text-[10px] text-base-content/40 mt-1 italic pl-1">Gunakan alamat IP lokal mesin yang statis</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-base-content/80">Username <span class="text-error">*</span></span></label>
              <input v-model="form.username" type="text" placeholder="admin" class="input input-bordered w-full rounded-2xl font-medium" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-base-content/80">Password <span v-if="!isEdit" class="text-error">*</span></span></label>
              <input v-model="form.password" type="password" :placeholder="isEdit ? '•••••••• (Biarkan kosong)' : 'Password mesin'" class="input input-bordered w-full rounded-2xl" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-base-content/80">Interval Sinkronisasi (Detik) <span class="text-error">*</span></span></label>
              <input v-model.number="form.poolingInterval" type="number" min="1" class="input input-bordered w-full rounded-2xl font-semibold" />
            </div>
            <div class="form-control flex flex-row items-center justify-between border border-base-200 rounded-2xl p-4 mt-8">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-base-content">Status Aktif</span>
                <span class="text-xs text-base-content/50">Aktifkan sinkronisasi wajah dan event</span>
              </div>
              <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="form.isActive" />
            </div>
          </div>

          <!-- Action buttons inside modal -->
          <div class="flex flex-col sm:flex-row gap-3 pt-6">
            <button @click="testFormConnection" :disabled="saving" class="btn btn-outline btn-primary rounded-2xl px-6 flex-1 h-12">
              <Icon name="mingcute:radar-line" size="18" class="mr-1" />
              Test Koneksi
            </button>
            <div class="flex gap-2 flex-1">
              <button @click="showModal = false" class="btn btn-ghost rounded-2xl px-5 flex-1 h-12">Batal</button>
              <button @click="handleSave" :disabled="saving" class="btn btn-primary rounded-2xl px-6 flex-1 h-12 shadow-lg shadow-primary/25">
                <span v-if="saving" class="loading loading-spinner loading-xs mr-1"></span>
                <Icon v-else name="mingcute:check-fill" size="18" class="mr-1" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Device Stats Modal -->
    <div v-if="showStatsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm transition-opacity duration-300">
      <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 md:p-8 w-full max-w-4xl shadow-2xl relative animate-scale-in flex flex-col gap-6" @click.stop>
        <!-- Close Button -->
        <button @click="closeStatsModal()" class="btn btn-square btn-ghost btn-sm rounded-xl absolute top-6 right-6">
          <Icon name="mingcute:close-line" size="20" />
        </button>

        <div>
          <h3 class="text-2xl font-extrabold text-base-content mb-1 flex items-center gap-2">
            <Icon name="mingcute:chart-bar-fill" class="text-success" />
            Statistik & Kapasitas Alat
          </h3>
          <p class="text-sm text-base-content/50">Detail kapasitas terpasang dan kontrol mesin absensi <strong>{{ statsDevice?.name }}</strong></p>
        </div>

        <!-- Loading State -->
        <div v-if="loadingStats" class="flex flex-col items-center justify-center py-16 gap-3">
          <span class="loading loading-spinner loading-lg text-success"></span>
          <p class="text-sm font-bold text-base-content/60">Menghubungi mesin absensi di {{ statsDevice?.url }}...</p>
        </div>

        <div v-else-if="statsData" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Col: Live Preview & Door Control -->
          <div class="lg:col-span-5 flex flex-col gap-4">
            <h4 class="text-xs font-bold text-base-content/50 uppercase tracking-wider">Live Video Stream</h4>
            
            <div class="relative aspect-video w-full rounded-2xl border border-base-200 overflow-hidden bg-black flex items-center justify-center group/cam shadow-inner">
              <video 
                v-if="streamActive && webrtcConnected"
                ref="videoElement"
                autoplay 
                playsinline 
                controls
                class="w-full h-full object-cover" 
              ></video>
              <img 
                v-else-if="streamActive && streamUrl"
                :src="streamUrl" 
                @error="handleStreamError"
                class="w-full h-full object-cover" 
                alt="Live Camera Stream"
              />
              <div v-else class="flex flex-col items-center text-base-content/30 gap-2">
                <Icon name="mingcute:videocam-off-fill" size="36" />
                <span class="text-xs font-semibold">Stream Kamera Mati</span>
              </div>

              <!-- Live Badge -->
              <div v-if="streamActive" class="absolute top-3 left-3 bg-red-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-md">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                LIVE
              </div>

              <!-- Controls -->
              <div class="absolute bottom-3 right-3 opacity-0 group-hover/cam:opacity-100 transition-opacity flex gap-1.5">
                <button @click="toggleStream" class="btn btn-circle btn-xs btn-primary bg-black/60 border-none text-white hover:bg-primary shadow" :title="streamActive ? 'Pause Stream' : 'Play Stream'">
                  <Icon :name="streamActive ? 'mingcute:pause-fill' : 'mingcute:play-fill'" size="12" />
                </button>
                <button @click="refreshStreamOnce" class="btn btn-circle btn-xs btn-primary bg-black/60 border-none text-white hover:bg-primary shadow" title="Refresh Capture">
                  <Icon name="mingcute:refresh-1-line" size="12" />
                </button>
              </div>
            </div>

            <h4 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mt-2">Kontrol Pintu Akses</h4>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="sendDoorCommand('open')" 
                :disabled="sendingDoorCmd"
                class="btn btn-success btn-sm rounded-xl h-10 font-bold flex items-center justify-center gap-1 text-xs"
              >
                <span v-if="sendingDoorCmd" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:door-open-fill" size="14" />
                Buka Pintu
              </button>
              <button 
                @click="sendDoorCommand('close')" 
                :disabled="sendingDoorCmd"
                class="btn btn-neutral btn-sm rounded-xl h-10 font-bold flex items-center justify-center gap-1 text-xs"
              >
                <span v-if="sendingDoorCmd" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:door-close-fill" size="14" />
                Kunci Pintu
              </button>
              <button 
                @click="sendDoorCommand('alwaysOpen')" 
                :disabled="sendingDoorCmd"
                class="btn btn-outline btn-success btn-sm rounded-xl h-10 font-bold text-xs"
              >
                Buka Terus
              </button>
              <button 
                @click="sendDoorCommand('alwaysClose')" 
                :disabled="sendingDoorCmd"
                class="btn btn-outline btn-error btn-sm rounded-xl h-10 font-bold text-xs"
              >
                Kunci Terus
              </button>
            </div>
          </div>

          <!-- Right Col: Capacity Stats & Hardware Spec -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Basic Device Info -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-base-200/40 border border-base-200/60 p-4 rounded-2xl">
              <div>
                <span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Model</span>
                <p class="text-xs font-extrabold text-base-content mt-1 flex items-center gap-1">
                  <Icon name="mingcute:cpu-line" size="14" class="text-primary/70" />
                  {{ statsData.deviceInfo?.model }}
                </p>
              </div>
              <div>
                <span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Serial No</span>
                <p class="text-xs font-extrabold text-base-content mt-1 flex items-center gap-1 font-mono truncate" :title="statsData.deviceInfo?.serialNo">
                  <Icon name="mingcute:key-2-line" size="14" class="text-primary/70 shrink-0" />
                  {{ statsData.deviceInfo?.serialNo }}
                </p>
              </div>
              <div>
                <span class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest leading-none">Firmware</span>
                <p class="text-xs font-extrabold text-base-content mt-1 flex items-center gap-1">
                  <Icon name="mingcute:package-line" size="14" class="text-primary/70" />
                  {{ statsData.deviceInfo?.firmwareVersion }}
                </p>
              </div>
            </div>

            <!-- go2rtc Stream ID Info Box -->
            <div class="bg-base-200/30 border border-base-200/50 p-4 rounded-2xl space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200/50 pb-2">
                <div>
                  <span class="text-[10px] font-bold text-base-content/45 uppercase tracking-widest leading-none">Nama Stream (Rekomendasi)</span>
                  <p class="text-sm font-extrabold text-success font-mono mt-0.5 select-all">{{ slugify(statsDevice?.name) }}</p>
                </div>
                <span class="text-[10px] text-base-content/50 italic leading-snug sm:text-right">
                  Lebih mudah diketik di file <code class="font-mono text-primary font-bold">go2rtc.yaml</code>
                </span>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span class="text-[10px] font-bold text-base-content/45 uppercase tracking-widest leading-none">ID Perangkat (Cadangan)</span>
                  <p class="text-xs font-semibold text-base-content/70 font-mono mt-0.5 select-all">{{ statsDevice?.id }}</p>
                </div>
                <span class="text-[10px] text-base-content/40 italic leading-snug sm:text-right">
                  ID unik permanen perangkat
                </span>
              </div>
            </div>

            <!-- Capacity Bars -->
            <div>
              <h4 class="text-xs font-bold text-base-content/50 uppercase tracking-wider mb-4">Kapasitas & Penggunaan Biometrik</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Person Capacity -->
                <div class="space-y-1.5">
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
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button @click="closeStatsModal()" class="btn btn-outline border-base-200 hover:bg-base-200/50 rounded-2xl px-6">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
