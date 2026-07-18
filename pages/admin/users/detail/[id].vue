<script setup>
import { ref, onMounted, computed } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { $toast } = useNuxtApp();
const authStore = useAuthStore();
const { userData: currentUser } = storeToRefs(authStore);

const user = ref(null);
const loading = ref(true);
const classes = ref([]);
const editMode = ref(false);
const showEditModal = ref(false);
const saving = ref(false);

const showRegisterDeviceModal = ref(false);
const selectedDeviceForRegister = ref('ALL');
const activeDevices = ref([]);
const registeringState = ref(false);
const syncFinished = ref(false);
const syncProgress = ref({
  total: 0,
  current: 0,
  percentage: 0,
  currentStudent: '',
  currentDevice: '',
  logs: []
});

const editForm = ref({
  name: '',
  email: '',
  nis: '',
  nisn: '',
  password: '',
  role: 'SISWA',
  classId: '',
  phone: '',
  gender: '',
  religion: '',
  birthDate: '',
  birthPlace: '',
  address: '',
  vehiclePlate: '',
  status: 'AKTIF',
  isActive: true
});

const classSearch = ref('');
const showClassDropdown = ref(false);

const filteredClassesForSelect = computed(() => {
  if (!classSearch.value) return classes.value;
  return classes.value.filter(c => 
    c.className.toLowerCase().includes(classSearch.value.toLowerCase())
  );
});

const selectClass = (c) => {
  editForm.value.classId = c.id;
  classSearch.value = c.className;
  showClassDropdown.value = false;
};

const toggleClassDropdown = () => {
  showClassDropdown.value = !showClassDropdown.value;
  if (showClassDropdown.value) {
    classSearch.value = '';
  }
};

const fetchUserDetail = async () => {
  loading.value = true;
  try {
    const res = await $fetch(`/api/users/${route.params.id}`);
    user.value = res?.data || null;
  } catch (err) {
    $toast.error('Gagal mengambil data user');
    router.push('/admin/users');
  } finally {
    loading.value = false;
  }
};

const fetchClasses = async () => {
  try {
    const res = await $fetch('/api/classes');
    classes.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error('Failed to fetch classes:', e);
  }
};

onMounted(() => {
  fetchUserDetail();
  fetchClasses();
});

const openEdit = () => {
  if (!user.value) return;
  editForm.value = {
    name: user.value.name || '',
    email: user.value.email || '',
    nis: user.value.nis || '',
    nisn: user.value.nisn || '',
    password: '',
    role: user.value.role || 'SISWA',
    classId: user.value.classId || '',
    phone: user.value.phone || '',
    gender: user.value.gender || '',
    religion: user.value.religion || '',
    birthDate: user.value.birthDate ? new Date(user.value.birthDate).toISOString().split('T')[0] : '',
    birthPlace: user.value.birthPlace || '',
    address: user.value.address || '',
    vehiclePlate: user.value.vehiclePlate || '',
    status: user.value.status || 'AKTIF',
    isActive: user.value.isActive ?? true
  };
  classSearch.value = user.value.class?.className || '';
  showEditModal.value = true;
};

const saveUserDetail = async () => {
  if (!editForm.value.name) {
    $toast.error('Nama wajib diisi');
    return;
  }
  saving.value = true;
  try {
    const res = await $fetch(`/api/users/${route.params.id}`, {
      method: 'PUT',
      body: editForm.value
    });
    if (res.success) {
      $toast.success('Data pengguna berhasil diperbarui');
      showEditModal.value = false;
      await fetchUserDetail();
    }
  } catch (e) {
    $toast.error(e.data?.message || 'Gagal memperbarui data pengguna');
  } finally {
    saving.value = false;
  }
};

const openRegisterDeviceModal = async () => {
  selectedDeviceForRegister.value = 'ALL';
  showRegisterDeviceModal.value = true;
  syncFinished.value = false;
  
  try {
    const res = await $fetch('/api/device');
    activeDevices.value = (res?.data || []).filter(d => d.isActive);
  } catch (e) {
    console.error('Gagal mengambil daftar perangkat:', e);
  }
};

const handleRegisterToDevice = async () => {
  const devicesToSync = selectedDeviceForRegister.value === 'ALL'
    ? activeDevices.value
    : activeDevices.value.filter(d => d.id === selectedDeviceForRegister.value);
    
  if (devicesToSync.length === 0) {
    $toast.error('Tidak ada perangkat aktif yang dipilih');
    return;
  }
  
  registeringState.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const device of devicesToSync) {
    try {
      const res = await $fetch(`/api/students/${user.value.id}/register-device`, {
        method: 'POST',
        body: { deviceId: device.id }
      });
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.error(err);
      failCount++;
    }
  }

  registeringState.value = false;
  showRegisterDeviceModal.value = false;
  if (failCount === 0) {
    $toast.success(`Berhasil mendaftarkan wajah ke ${successCount} perangkat`);
  } else {
    $toast.warning(`Selesai dengan hambatan. Sukses: ${successCount}, Gagal: ${failCount}`);
  }
  await fetchUserDetail();
};

const handleUnregisterFromDevice = async () => {
  const devicesToSync = selectedDeviceForRegister.value === 'ALL'
    ? activeDevices.value
    : activeDevices.value.filter(d => d.id === selectedDeviceForRegister.value);
    
  if (devicesToSync.length === 0) {
    $toast.error('Tidak ada perangkat aktif yang dipilih');
    return;
  }
  
  registeringState.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const device of devicesToSync) {
    try {
      const res = await $fetch(`/api/students/${user.value.id}/unregister-device`, {
        method: 'POST',
        body: { deviceId: device.id }
      });
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.error(err);
      failCount++;
    }
  }

  registeringState.value = false;
  if (successCount > 0) {
    $toast.success(`Sinkronisasi berhasil dihapus dari ${successCount} perangkat`);
    showRegisterDeviceModal.value = false;
    await fetchUserDetail();
  } else {
    $toast.error('Gagal menghapus sinkronisasi dari perangkat');
  }
};

const getAvatar = (u) => {
  if (!u || !u.photoUrl) return null;
  if (u.photoUrl.startsWith('http')) return u.photoUrl;
  const filename = u.photoUrl.split('/').pop();
  return `/api/uploads/profiles/${filename}`;
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const bentoCard = "bg-base-100 rounded-3xl p-6 md:p-8 border border-base-200/60 shadow-sm transition-all duration-300 hover:shadow-md";

const showDeleteConfirm = ref(false);
const isDeletingPhoto = ref(false);

const deleteUserPhoto = async () => {
  isDeletingPhoto.value = true;
  try {
    const res = await $fetch(`/api/users/${route.params.id}/photo`, { method: 'DELETE' });
    if (res.success) {
      $toast.success('Foto profil berhasil dihapus');
      showDeleteConfirm.value = false;
      await fetchUserDetail();
    }
  } catch (e) {
    $toast.error('Gagal menghapus foto profil');
  } finally {
    isDeletingPhoto.value = false;
  }
};

// Face camera selfie/cropper variables
const showFaceUploadOptions = ref(false);
const showCameraModal = ref(false);
const videoStream = ref(null);
const videoRef = ref(null);
const showFaceCropper = ref(false);
const rawFaceImage = ref(null);
const faceCropperRef = ref(null);
const isUploadingFace = ref(false);

const startCamera = async () => {
  showFaceUploadOptions.value = false;
  showCameraModal.value = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }
    });
    videoStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error(err);
    $toast.error('Tidak dapat mengakses kamera!');
    closeCamera();
  }
};

const closeCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop());
    videoStream.value = null;
  }
  showCameraModal.value = false;
};

const capturePhoto = () => {
  if (videoRef.value) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value.videoWidth || 640;
    canvas.height = videoRef.value.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    rawFaceImage.value = dataUrl;
    closeCamera();
    showFaceCropper.value = true;
  }
};

const onFaceFileSelect = (e) => {
  const files = e.target.files;
  if (files && files[0]) {
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      $toast.error('Ukuran file foto maksimal adalah 5MB!');
      return;
    }
    showFaceUploadOptions.value = false;
    const reader = new FileReader();
    reader.onload = (event) => {
      rawFaceImage.value = event.target.result;
      showFaceCropper.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const detectFaceInBrowser = (imageSrc) => {
  return new Promise((resolve) => {
    if (typeof window.pico === 'undefined') {
      const script = document.createElement('script');
      script.src = '/pico.js';
      script.onload = () => runDetection(imageSrc, resolve);
      script.onerror = () => {
        console.error('Failed to load pico.js');
        resolve(true);
      };
      document.head.appendChild(script);
    } else {
      runDetection(imageSrc, resolve);
    }
  });
};

const runDetection = async (imageSrc, resolve) => {
  try {
    const cascadeResponse = await fetch('/facefinder');
    const cascadeBuffer = await cascadeResponse.arrayBuffer();
    const cascadeBytes = new Uint8Array(cascadeBuffer);
    const classifyRegion = window.pico.unpack_cascade(cascadeBytes);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 360;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h).data;

      const rgbaToGray = (rgba, nrows, ncols) => {
        const gray = new Uint8Array(nrows * ncols);
        for (let r = 0; r < nrows; r++) {
          for (let c = 0; c < ncols; c++) {
            const idx = 4 * (r * ncols + c);
            gray[r * ncols + c] = 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
          }
        }
        return gray;
      };

      const pixels = rgbaToGray(imgData, h, w);
      const imageDesc = {
        pixels: pixels,
        nrows: h,
        ncols: w,
        ldim: w,
      };

      const params = {
        shiftfactor: 0.1,
        minsize: 20,
        maxsize: 1000,
        scalefactor: 1.1,
      };

      let dets = window.pico.run_cascade(imageDesc, classifyRegion, params);
      dets = window.pico.cluster_detections(dets, 0.2);

      const detected = dets.some((d) => d[3] > 4.5);
      console.log('Pico.js detection score:', dets.map(d => d[3]));
      resolve(detected);
    };
    img.onerror = () => resolve(true);
  } catch (error) {
    console.error('Face detection error:', error);
    resolve(true);
  }
};

const uploadFacePhoto = async () => {
  const { canvas } = faceCropperRef.value.getResult();
  if (!canvas) return;

  isUploadingFace.value = true;
  try {
    const fileDataUrl = canvas.toDataURL('image/jpeg');
    
    const faceDetected = await detectFaceInBrowser(fileDataUrl);
    if (!faceDetected) {
      $toast.error('Wajah tidak terdeteksi pada area potongan! Pastikan wajah masuk ke dalam panduan lingkaran.');
      isUploadingFace.value = false;
      return;
    }

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('photo', blob, 'face.jpg');

      try {
        const res = await $fetch(`/api/students/${user.value.id}/photo`, {
          method: 'POST',
          body: formData,
        });

        if (res.success) {
          showFaceCropper.value = false;
          rawFaceImage.value = null;
          await fetchUserDetail();
          $toast.success('Foto wajah absensi berhasil diperbarui');
        }
      } catch (error) {
        $toast.error(error.data?.statusMessage || 'Gagal mengunggah foto wajah');
      } finally {
        isUploadingFace.value = false;
      }
    }, 'image/jpeg');
  } catch (err) {
    console.error(err);
    $toast.error('Gagal memproses gambar');
    isUploadingFace.value = false;
  }
};

const cancelFaceCrop = () => {
  showFaceCropper.value = false;
  rawFaceImage.value = null;
};
</script>

<template>
  <div class="max-w-6xl mx-auto py-6 md:py-10 px-4 space-y-6 md:space-y-8 text-left">
    
    <!-- Back Button & Title -->
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="btn btn-ghost btn-sm md:btn-md rounded-2xl bg-base-200/50">
        <Icon name="mingcute:left-line" size="20" />
        <span class="hidden md:inline">Kembali</span>
      </button>
      <div>
        <h1 class="text-xl md:text-2xl font-black text-base-content tracking-tight">Detail Pengguna</h1>
        <p class="text-xs md:text-sm text-base-content/50">Informasi sistem dan data personal lengkap</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <span class="loading loading-spinner loading-lg text-primary opacity-40"></span>
      <p class="text-xs font-bold uppercase tracking-widest text-base-content/30">Memuat Data...</p>
    </div>

    <div v-else-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      
      <!-- Left Column: Profile Summary & Face Photo -->
      <div class="lg:col-span-1 space-y-6">
        
        <!-- Summary Card -->
        <div :class="[bentoCard, 'flex flex-col items-center text-center pt-10']">
          <div class="relative group">
            <div class="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary text-3xl md:text-4xl font-black overflow-hidden border-4 border-base-200 shadow-xl mb-6">
              <img v-if="getAvatar(user)" :src="getAvatar(user)" class="w-full h-full object-cover" />
              <span v-else>{{ getInitials(user.name) }}</span>
            </div>
            <div :class="['absolute bottom-8 right-0 w-6 h-6 rounded-full border-4 border-base-100 shadow-sm', user.isActive ? 'bg-success' : 'bg-base-300']"></div>
          </div>
          
          <h2 class="text-xl md:text-2xl font-black text-base-content break-words max-w-full leading-tight">{{ user.name }}</h2>
          <div class="flex flex-wrap items-center justify-center gap-1.5 mt-2">
            <div :class="['px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest border uppercase', 
              user.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 
              user.role === 'GURU' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            ]">
              {{ user.role }}
            </div>
            <div v-if="user.role === 'SISWA' && user.class" class="badge badge-primary badge-outline text-[9px] font-black h-5 py-0 px-2 rounded-full border-primary/30">
              {{ user.class?.className }}
            </div>
          </div>
          
          <!-- Admin Action: Delete Photo -->
          <button 
            v-if="user.photoUrl"
            @click="showDeleteConfirm = true"
            class="btn btn-ghost btn-xs mt-4 text-error gap-1.5 hover:bg-error/10 rounded-lg font-bold"
          >
            <Icon name="mingcute:delete-2-fill" />
            Hapus Foto Profil
          </button>
          
          <div class="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-base-200/60">
             <div class="text-center">
               <p class="text-[10px] font-bold text-base-content/30 uppercase mb-1">Status</p>
               <p :class="['text-xs font-black uppercase', user.isActive ? 'text-success' : 'text-base-content/40']">{{ user.isActive ? 'Aktif' : 'Nonaktif' }}</p>
             </div>
             <div class="text-center border-l border-base-200/60 min-w-0">
               <p class="text-[10px] font-bold text-base-content/30 uppercase mb-1">ID Sistem</p>
               <p class="text-[10px] font-black text-base-content/60 truncate px-1" :title="user.id">#{{ user.id.substring(0, 8) }}...</p>
             </div>
          </div>
        </div>

        <!-- Foto Absensi (Face Recognition & Sync) -->
        <div :class="[bentoCard]">
          <div class="flex items-center justify-between mb-5">
            <h4 class="text-xs font-black text-base-content/40 uppercase tracking-wider">Foto Absensi</h4>
            <span v-if="user.faceUrl" class="badge badge-success text-[9px] font-bold px-2 py-2 rounded-lg text-white">Terdaftar</span>
            <span v-else class="badge badge-warning text-[9px] font-bold px-2 py-2 rounded-lg text-white">Belum Ada</span>
          </div>

          <div class="flex flex-col gap-4">
            <div class="relative w-36 h-48 mx-auto rounded-2xl overflow-hidden bg-base-200 border border-base-300 flex items-center justify-center shadow-inner">
              <img 
                v-if="user.faceUrl"
                :src="user.faceUrl" 
                alt="Face photo" 
                class="h-full w-full object-cover object-center" 
              />
              <div v-else class="flex flex-col items-center justify-center text-base-content/40 p-4 text-center">
                <Icon name="mingcute:face-fill" size="44" class="mb-2 opacity-55" />
                <p class="text-[10px] font-bold uppercase tracking-wider">Belum ada wajah</p>
              </div>
            </div>

            <!-- Upload face action (Admin only) -->
            <div class="flex flex-col gap-2 mt-2">
              <button 
                @click="showFaceUploadOptions = true"
                class="btn btn-primary btn-sm w-full rounded-xl font-bold h-10 gap-2"
                :disabled="isUploadingFace"
              >
                <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:upload-2-fill" size="16" />
                {{ user.faceUrl ? 'Ganti Foto Wajah' : 'Unggah Foto Wajah' }}
              </button>
              
              <button 
                @click="openRegisterDeviceModal"
                class="btn btn-ghost hover:bg-base-200 border border-base-300 btn-sm w-full rounded-xl font-bold h-10 gap-2"
              >
                <Icon name="mingcute:fingerprint-fill" size="16" />
                Sinkronisasi Alat
              </button>
            </div>
          </div>
        </div>

        <!-- System Metadata -->
        <div :class="[bentoCard, 'bg-base-200/20 border-dashed']">
          <h3 class="text-xs font-black text-base-content/40 uppercase tracking-widest mb-4">Metadata Sistem</h3>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <Icon name="mingcute:time-line" class="text-base-content/30 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-base-content/30 uppercase">Dibuat Pada</p>
                <p class="text-xs font-semibold text-base-content/70 leading-relaxed">{{ formatDate(user.createdAt) }} &bull; {{ formatTime(user.createdAt) }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="mingcute:refresh-2-line" class="text-base-content/30 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-base-content/30 uppercase">Update Terakhir</p>
                <p class="text-xs font-semibold text-base-content/70 leading-relaxed">{{ formatDate(user.updatedAt) }} &bull; {{ formatTime(user.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Account Information & Detailed Biodata -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Account Information Card -->
        <div :class="[bentoCard]">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon name="mingcute:idcard-fill" size="20" />
            </div>
            <h3 class="text-lg font-black text-base-content tracking-tight">Informasi Akun</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-base-200/50 pb-6 mb-6">
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Email</p>
              <p class="text-sm font-semibold text-base-content/85 break-all">{{ user.email || 'Tidak Terhubung' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">NIS / USERNAME</p>
              <p class="text-sm font-semibold text-base-content/85 font-mono">{{ user.nis || '-' }}</p>
            </div>
            <div v-if="user.role === 'SISWA'">
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">NISN</p>
              <p class="text-sm font-semibold text-base-content/85 font-mono">{{ user.nisn || '-' }}</p>
            </div>
            <div v-if="user.role === 'SISWA'">
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Kelas Saat Ini</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge badge-primary badge-outline font-black text-[10px]">{{ user.class?.className || 'BELUM SET' }}</span>
                <span v-if="user.class" class="text-[10px] text-base-content/40 font-semibold font-mono">ID: #{{ user.classId }}</span>
              </div>
            </div>
          </div>

          <!-- Role Description / Permissions Alert -->
          <div class="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3.5">
            <Icon name="mingcute:safety-certificate-fill" class="text-primary shrink-0 mt-0.5" size="20" />
            <div>
              <h4 class="font-bold text-xs text-base-content mb-0.5">Hak Akses: {{ user.role }}</h4>
              <p class="text-[11px] text-base-content/60 leading-relaxed font-semibold">
                {{ 
                  user.role === 'ADMIN' ? 'Memiliki kontrol penuh terhadap manajemen user, sistem import, konfigurasi perangkat absensi, dan seluruh modul sistem.' :
                  user.role === 'GURU' ? 'Dapat merekam presensi harian, memantau riwayat jurnal absen kelas, serta mengelola izin siswa.' :
                  'Dapat memantau statistik presensi personal, mendaftarkan wajah secara mandiri, dan melacak riwayat kehadiran pribadi.'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Biodata Pribadi Card -->
        <div :class="[bentoCard]">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0">
              <Icon name="mingcute:user-info-fill" size="20" />
            </div>
            <h3 class="text-lg font-black text-base-content tracking-tight">Biodata Personal</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-12">
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Tempat, Tanggal Lahir</p>
              <p class="text-sm font-semibold text-base-content/85">{{ user.birthPlace || '-' }}{{ user.birthDate ? ', ' + formatDate(user.birthDate) : '' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Gender / Agama</p>
              <p class="text-sm font-semibold text-base-content/85">
                {{ user.gender === 'L' ? 'Laki-laki (L)' : user.gender === 'P' ? 'Perempuan (P)' : '-' }} &bull; {{ user.religion || '-' }}
              </p>
            </div>
            <div class="md:col-span-2">
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Alamat Lengkap</p>
              <p class="text-sm font-semibold text-base-content/80 leading-relaxed">{{ user.address || 'Belum diisi' }}</p>
            </div>
          </div>
        </div>

        <!-- Kontak & Kendaraan Card -->
        <div :class="[bentoCard]">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info shrink-0">
              <Icon name="mingcute:phone-fill" size="20" />
            </div>
            <h3 class="text-lg font-black text-base-content tracking-tight">Kontak & Kendaraan</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Nomor WhatsApp / Telp</p>
              <p class="text-sm font-semibold text-base-content/85">{{ user.phone || 'Belum diisi' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Plat Nomor Kendaraan</p>
              <div class="mt-1">
                <span v-if="user.vehiclePlate" class="px-3 py-1.5 font-mono text-sm font-bold bg-base-200 border border-base-300 rounded-lg inline-block text-base-content tracking-wider">
                  {{ user.vehiclePlate }}
                </span>
                <span v-else class="text-sm font-semibold text-base-content/40">-</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="flex flex-wrap gap-4 mt-8 pt-4">
          <button @click="openEdit" class="btn btn-primary rounded-2xl font-bold px-6 shadow-md shadow-primary/10 gap-2 flex-1 md:flex-none">
            <Icon name="mingcute:edit-4-line" />
            Edit Biodata
          </button>
          <NuxtLink :to="`/admin/users`" class="btn btn-ghost hover:bg-base-200 border border-base-300 rounded-2xl font-bold px-6 gap-2 flex-1 md:flex-none">
            <Icon name="mingcute:list-check-line" />
            Kembali ke Manajemen User
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- Modal: Edit Biodata -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showEditModal }]">
      <div class="modal-box max-w-2xl bg-base-100 border border-base-200 rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8">
        <h3 class="text-xl font-black text-base-content mb-6">Edit Data Pengguna</h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Nama Lengkap*</span></label>
            <input v-model="editForm.name" type="text" placeholder="Nama Lengkap" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">NIS (Username)*</span></label>
            <input v-model="editForm.nis" type="text" placeholder="NIS" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control" v-if="editForm.role === 'SISWA'">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">NISN</span></label>
            <input v-model="editForm.nisn" type="text" placeholder="NISN" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Email</span></label>
            <input v-model="editForm.email" type="email" placeholder="Email" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Password (Kosongkan jika tidak diubah)</span></label>
            <input v-model="editForm.password" type="password" placeholder="Password Baru" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Nomor WhatsApp / Telp</span></label>
            <input v-model="editForm.phone" type="text" placeholder="08xxxxxxxxx" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          
          <div class="form-control" v-if="editForm.role === 'SISWA'">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Kelas*</span></label>
            <div class="relative">
              <button 
                type="button"
                @click="toggleClassDropdown"
                class="btn btn-outline border-base-300 w-full rounded-xl font-bold justify-between bg-base-200/30 h-12"
              >
                <span>{{ classSearch || 'Pilih Kelas' }}</span>
                <Icon name="mingcute:down-line" />
              </button>
              <div v-if="showClassDropdown" class="absolute left-0 right-0 mt-1 p-2 bg-base-100 border border-base-200 rounded-xl shadow-2xl z-[70] max-h-48 overflow-y-auto">
                <input 
                  v-model="classSearch" 
                  type="text" 
                  placeholder="Cari kelas..." 
                  class="input input-bordered input-sm w-full rounded-lg mb-2 bg-base-200/30 font-bold" 
                />
                <button 
                  v-for="c in filteredClassesForSelect" 
                  :key="c.id" 
                  @click="selectClass(c)"
                  class="w-full text-left py-2 px-3 hover:bg-base-200 rounded-lg text-xs font-bold transition-colors"
                >
                  {{ c.className }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Gender</span></label>
            <select v-model="editForm.gender" class="select select-bordered w-full rounded-xl bg-base-200/30 font-bold">
              <option value="">Pilih Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Agama</span></label>
            <select v-model="editForm.religion" class="select select-bordered w-full rounded-xl bg-base-200/30 font-bold">
              <option value="">Pilih Agama</option>
              <option value="ISLAM">ISLAM</option>
              <option value="KRISTEN">KRISTEN</option>
              <option value="KATOLIK">KATOLIK</option>
              <option value="HINDU">HINDU</option>
              <option value="BUDHA">BUDHA</option>
              <option value="KONGHUCU">KONGHUCU</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Tempat Lahir</span></label>
            <input v-model="editForm.birthPlace" type="text" placeholder="Tempat Lahir" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Tanggal Lahir</span></label>
            <input v-model="editForm.birthDate" type="date" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Plat Nomor Kendaraan</span></label>
            <input v-model="editForm.vehiclePlate" type="text" placeholder="AB 1234 CD" class="input input-bordered w-full rounded-xl bg-base-200/30 font-bold" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Status Akun</span></label>
            <select v-model="editForm.status" class="select select-bordered w-full rounded-xl bg-base-200/30 font-bold">
              <option value="AKTIF">AKTIF</option>
              <option value="ALUMNI">ALUMNI</option>
              <option value="KELUAR">KELUAR</option>
              <option value="MUTASI">MUTASI</option>
            </select>
          </div>
          <div class="form-control sm:col-span-2">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Alamat Lengkap</span></label>
            <textarea v-model="editForm.address" placeholder="Tulis alamat lengkap disini..." class="textarea textarea-bordered w-full rounded-xl bg-base-200/30 h-20 resize-none py-3 font-bold"></textarea>
          </div>
          <div class="form-control sm:col-span-2">
            <label class="label cursor-pointer flex items-center gap-3">
              <input type="checkbox" v-model="editForm.isActive" class="checkbox checkbox-primary rounded-lg" />
              <span class="label-text font-bold text-xs uppercase tracking-wider">Akun Aktif</span>
            </label>
          </div>
        </div>

        <div class="modal-action flex justify-between gap-4 mt-8">
          <button @click="showEditModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold">Batal</button>
          <button @click="saveUserDetail" class="btn btn-primary rounded-2xl flex-1 font-bold shadow-lg shadow-primary/20" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            Simpan Perubahan
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showEditModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Modal: Sinkronisasi Mesin -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showRegisterDeviceModal }]">
      <div class="modal-box bg-base-100 border border-base-200 rounded-t-[2rem] sm:rounded-[2rem] p-6 max-w-md">
        <h3 class="text-xl font-black text-base-content mb-2">Sinkronisasi Wajah ke Alat</h3>
        <p class="text-xs text-base-content/50 font-medium mb-6">Daftarkan biometrik wajah siswa ini ke mesin Hikvision.</p>

        <div class="space-y-4">
          <div class="flex items-center gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-200/80">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 shrink-0">
              <img :src="getAvatar(user) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=ffffff&bold=true`" class="w-full h-full object-cover" />
            </div>
            <div>
              <h4 class="font-bold text-sm text-base-content">{{ user.name }}</h4>
              <p class="text-xs text-base-content/40 font-mono">NIS: {{ user.nis }}</p>
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Pilih Mesin Absensi*</span></label>
            <select v-model="selectedDeviceForRegister" class="select select-bordered w-full rounded-2xl bg-base-200/30 font-bold">
              <option value="ALL">Semua Perangkat Aktif</option>
              <option v-for="d in activeDevices" :key="d.id" :value="d.id">
                {{ d.name }} ({{ d.location }})
              </option>
            </select>
          </div>

          <div v-if="!user.faceUrl" class="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex items-start gap-3">
            <Icon name="mingcute:warning-line" class="text-warning shrink-0" size="18" />
            <div class="text-[10px] font-bold text-warning/80 tracking-wider leading-relaxed">
              PERHATIAN: USER TIDAK MEMILIKI FOTO ABSENSI. HARAP UNGGAH FOTO WAJAH TERLEBIH DAHULU UNTUK SYNC WAJAH.
            </div>
          </div>
        </div>

        <div class="modal-action flex justify-between gap-4 mt-8">
          <button @click="showRegisterDeviceModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold" :disabled="registeringState">Batal</button>
          <button 
            v-if="user.faceToken"
            @click="handleUnregisterFromDevice"
            class="btn btn-error text-white rounded-2xl flex-1 font-bold shadow-lg shadow-error/20"
            :disabled="registeringState || activeDevices.length === 0"
          >
            <span v-if="registeringState" class="loading loading-spinner loading-xs"></span>
            Hapus Sync
          </button>
          <button @click="handleRegisterToDevice" class="btn btn-primary rounded-2xl flex-1 font-bold shadow-lg shadow-primary/20" :disabled="registeringState || activeDevices.length === 0">
            <span v-if="registeringState" class="loading loading-spinner loading-xs mr-1"></span>
            {{ user.faceToken ? 'Sync Ulang' : 'Daftarkan' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showRegisterDeviceModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Modal: Delete Photo Confirmation -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showDeleteConfirm }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
          <Icon name="mingcute:delete-2-fill" size="32" />
        </div>
        <h3 class="font-bold text-xl text-base-content mb-2">Hapus Foto Profil?</h3>
        <p class="text-sm text-base-content/60 mb-8 px-4">
          Tindakan ini akan menghapus foto profil kustom milik <b>{{ user.name }}</b>.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="showDeleteConfirm = false" class="btn btn-ghost flex-1 rounded-2xl order-2 sm:order-1">Batal</button>
          <button 
            @click="deleteUserPhoto" 
            class="btn btn-error text-white flex-1 rounded-2xl shadow-lg shadow-error/20 order-1 sm:order-2"
            :disabled="isDeletingPhoto"
          >
            <span v-if="isDeletingPhoto" class="loading loading-spinner loading-xs"></span>
            Ya, Hapus
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Modal: Opsi Upload Wajah -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showFaceUploadOptions }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-6 z-[60]">
        <h3 class="font-bold text-lg text-base-content mb-6 text-center sm:text-left">Pilih Metode Upload Wajah</h3>
        <div class="flex flex-col gap-3">
          <button @click="startCamera" class="btn btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary rounded-2xl flex items-center justify-between px-6 h-16 transition-all">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="mingcute:camera-fill" size="22" />
              </div>
              <div class="text-left">
                <p class="font-bold text-sm">Ambil Foto (Selfie)</p>
                 <p class="text-xs text-base-content/50">Gunakan kamera depan HP / laptop</p>
              </div>
            </div>
            <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
          </button>

          <button @click="$refs.faceFileInputHelper.click()" class="btn btn-ghost bg-base-200/50 hover:bg-success/10 hover:text-success rounded-2xl flex items-center justify-between px-6 h-16 transition-all">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <Icon name="mingcute:pic-fill" size="22" />
              </div>
              <div class="text-left">
                <p class="font-bold text-sm">Pilih dari Galeri</p>
                <p class="text-xs text-base-content/50">Unggah berkas gambar yang sudah ada</p>
              </div>
            </div>
            <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
          </button>
          <input ref="faceFileInputHelper" type="file" class="hidden" accept="image/*" @change="onFaceFileSelect" />
        </div>
        <div class="modal-action sm:mt-6 mt-4">
          <button @click="showFaceUploadOptions = false" class="btn btn-ghost w-full rounded-2xl">Batal</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showFaceUploadOptions = false"><button>close</button></form>
    </dialog>

    <!-- Modal: Kamera Selfie -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showCameraModal }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-0 overflow-hidden max-w-lg z-[60]">
        <div class="p-6 border-b border-base-200 flex items-center justify-between bg-base-50/50">
          <h3 class="font-bold text-lg text-base-content">Ambil Foto Wajah</h3>
          <button @click="closeCamera" class="btn btn-ghost btn-circle btn-sm">
            <Icon name="mingcute:close-line" size="20" />
          </button>
        </div>
        
        <div class="relative bg-black aspect-[3/4] max-h-[60vh] w-full flex items-center justify-center overflow-hidden">
          <video ref="videoRef" autoplay playsinline muted class="h-full w-full object-cover scale-x-[-1]"></video>
          
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-48 h-64 border-4 border-dashed border-primary/70 rounded-[50%] bg-transparent flex items-center justify-center">
              <div class="absolute text-[10px] font-bold text-primary bg-base-100/90 px-3 py-1 rounded-full border border-primary/30 -top-3 shadow-md">
                Posisikan Wajah Di Sini
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-base-50/50 flex gap-3 justify-center">
          <button @click="closeCamera" class="btn btn-ghost rounded-xl px-6 flex-1">Batal</button>
          <button @click="capturePhoto" class="btn btn-primary rounded-xl px-8 flex-1 gap-2 shadow-lg shadow-primary/20">
            <Icon name="mingcute:camera-fill" size="18" />
            Ambil Foto
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeCamera"><button>close</button></form>
    </dialog>

    <!-- Modal: Crop Foto Wajah -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showFaceCropper }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-0 overflow-hidden max-w-lg z-[60]">
        <div class="p-6 border-b border-base-200 flex items-center justify-between bg-base-50/50">
          <div>
            <h3 class="font-bold text-lg text-base-content">Sesuaikan Foto Wajah</h3>
            <p class="text-xs text-base-content/50">Sesuaikan agar wajah masuk ke dalam panduan</p>
          </div>
          <button @click="cancelFaceCrop" class="btn btn-ghost btn-circle btn-sm">
            <Icon name="mingcute:close-line" size="20" />
          </button>
        </div>
        
        <div class="p-6 bg-neutral/5 flex items-center justify-center">
          <div class="relative w-72 h-96 overflow-hidden rounded-2xl shadow-inner bg-black">
            <Cropper
              v-if="showFaceCropper"
              ref="faceCropperRef"
              :src="rawFaceImage"
              :stencil-props="{ aspectRatio: 3/4 }"
              :image-restriction="'none'"
              class="w-full h-full"
            />
            
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div class="w-44 h-60 border-4 border-dashed border-primary/60 rounded-[50%] bg-transparent flex items-center justify-center">
                <div class="absolute text-[9px] font-bold text-primary bg-base-100/90 px-2 py-0.5 rounded-full border border-primary/30 -top-3">
                  Area Wajah
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-base-50/50 flex gap-3">
          <button @click="cancelFaceCrop" class="btn btn-ghost rounded-xl px-6 flex-1">Batal</button>
          <button 
            @click="uploadFacePhoto" 
            class="btn btn-primary rounded-xl px-8 flex-1 shadow-lg shadow-primary/20"
            :disabled="isUploadingFace"
          >
            <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
            Simpan Foto Wajah
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cancelFaceCrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.1); border-radius: 10px; }
</style>
