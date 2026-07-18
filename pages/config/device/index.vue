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

const router = useRouter();

const showDeviceStats = (device) => {
  router.push(`/config/device/${device.id}`);
};
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
        <div class="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none"></div>

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
              <NuxtLink :to="`/config/device/${d.id}`" class="btn btn-square btn-ghost btn-sm rounded-xl border border-base-200 hover:border-success/20 hover:text-success" title="Statistik & Kapasitas Alat">
                <Icon name="mingcute:chart-bar-fill" size="16" />
              </NuxtLink>
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
