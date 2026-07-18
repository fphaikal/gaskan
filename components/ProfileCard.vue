<script setup>
import { format, parseISO } from 'date-fns';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const authStore = useAuthStore();
const { userData: user, userLoading: loading, authenticated } = storeToRefs(authStore);

// Use centralized fetcher
if (authenticated.value) {
  authStore.fetchUserData();
}

const refreshUser = () => authStore.fetchUserData(true);
const fetchError = ref(null);

// ── State ───────────────────────────────────────────────────
const err = ref(false);
const errMsg = ref('');
const isSaving = ref(false);
const showDatePicker = ref(false);

// Edit form state
const editForm = ref({
  // Personal
  birthPlace: '',
  birthDate: null,
  gender: '',
  religion: '',
  address: '',
  email: '',
  // Contact
  phone: '',
  // Vehicle
  vehiclePlate: '',
  // Password
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Debugging
watchEffect(() => {
  console.log('Profile User Data:', user.value);
  if (user.value === null) {
    console.warn('Profile data is null. Check backend/proxy logs.');
  }
});

// Pre-fill when data loads
watch(user, (val) => {
  if (!val) return;
  editForm.value.birthPlace = val.TempatLahir !== '-' ? val.TempatLahir : '';
  editForm.value.birthDate = val.TanggalLahir ? new Date(val.TanggalLahir) : null;
  editForm.value.gender = val.gender || '';
  editForm.value.religion = val.religion || '';
  editForm.value.address = val.Alamat !== '-' ? val.Alamat : '';
  editForm.value.email = val.Email !== '-' ? val.Email : '';
  editForm.value.phone = val.Nomor !== '-' ? val.Nomor : '';
  editForm.value.vehiclePlate = val.Plat_Nomor !== '-' ? val.Plat_Nomor : '';
}, { immediate: true });

// ── Helpers ─────────────────────────────────────────────────
const showModal = (id) => document.getElementById(id)?.showModal();
const closeModal = (id) => document.getElementById(id)?.close();

const { $toast } = useNuxtApp();
const config = useRuntimeConfig();

// ── Image Upload State ──────────────────────────────────────
const fileInput = ref(null);
const rawImage = ref(null);
const showCropper = ref(false);
const cropperRef = ref(null);
const isUploading = ref(false);

const onFileChange = (e) => {
  const files = e.target.files;
  if (files && files[0]) {
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      $toast.error('Ukuran file foto maksimal adalah 2MB!');
      if (fileInput.value) fileInput.value.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      rawImage.value = event.target.result;
      showCropper.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const cancelCrop = () => {
  showCropper.value = false;
  rawImage.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const uploadAvatar = async () => {
  const { canvas } = cropperRef.value.getResult();
  if (!canvas) return;

  isUploading.value = true;
  canvas.toBlob(async (blob) => {
    try {
      const formData = new FormData();
      formData.append('photo', blob, 'profile.jpg');

      const res = await $fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        await refreshUser();
        $toast.success('Foto profil berhasil diperbarui');
        cancelCrop();
      }
    } catch (error) {
      $toast.error(error.data?.statusMessage || 'Gagal mengunggah foto');
    } finally {
      isUploading.value = false;
    }
  }, 'image/jpeg', 0.9);
};

const showDeleteConfirm = ref(false);

const deletePhoto = async () => {
  isUploading.value = true;
  try {
    const res = await $fetch('/api/profile/photo', { method: 'DELETE' });
    if (res.success) {
      await refreshUser();
      $toast.success('Foto profil telah dihapus');
      showDeleteConfirm.value = false;
    }
  } catch (error) {
    $toast.error('Gagal menghapus foto');
  } finally {
    isUploading.value = false;
  }
};

const closeAndRefresh = async (modalId, successMsg = 'Berhasil diperbarui') => {
  await refreshUser();
  closeModal(modalId);
  err.value = false;
  errMsg.value = '';
  isSaving.value = false;
  $toast.success(successMsg);
};

const handleError = (error) => {
  err.value = true;
  isSaving.value = false;
  const msg =
    error?.data?.statusMessage ||
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    'Terjadi kesalahan.';
  errMsg.value = msg;
  $toast.error(msg);
};

const callApi = async (url, body) => {
  isSaving.value = true;
  err.value = false;
  return await $fetch(url, { method: 'PUT', body });
};

// ── Edit Handlers ───────────────────────────────────────────

// Edit personal info (TTL, Gender, Agama, Alamat, Email) — single request
const editPersonal = async () => {
  try {
    await callApi('/api/profile/biodata', {
      birthPlace: editForm.value.birthPlace || null,
      birthDate: editForm.value.birthDate
        ? format(editForm.value.birthDate, 'yyyy-MM-dd')
        : null,
      gender: editForm.value.gender || null,
      religion: editForm.value.religion || null,
      address: editForm.value.address || null,
      email: editForm.value.email || null,
    });
    await closeAndRefresh('editPersonal', 'Data pribadi berhasil disimpan');
  } catch (error) {
    handleError(error);
  }
};

const editNomor = async () => {
  try {
    if (!editForm.value.phone) { handleError({ message: 'Nomor tidak boleh kosong' }); return; }
    await callApi('/api/profile/nomor', { Nomor: editForm.value.phone.toString() });
    await closeAndRefresh('editNomor', 'Nomor telepon berhasil diperbarui');
  } catch (error) {
    handleError(error);
  }
};

const editPlat = async () => {
  try {
    await callApi('/api/profile/plat', { Plat_Nomor: editForm.value.vehiclePlate });
    await closeAndRefresh('editPlat', 'Plat nomor berhasil diperbarui');
  } catch (error) {
    handleError(error);
  }
};

const editPassword = async () => {
  if (!editForm.value.newPassword) { handleError({ message: 'Password baru wajib diisi' }); return; }
  if (editForm.value.newPassword.length < 6) { handleError({ message: 'Password minimal 6 karakter' }); return; }
  if (editForm.value.newPassword !== editForm.value.confirmPassword) { handleError({ message: 'Konfirmasi password tidak cocok' }); return; }
  try {
    await callApi('/api/profile/password', {
      Password: editForm.value.newPassword,
      CurrentPassword: editForm.value.currentPassword,
    });
    editForm.value.currentPassword = '';
    editForm.value.newPassword = '';
    editForm.value.confirmPassword = '';
    await closeAndRefresh('changePass', 'Password berhasil diganti');
  } catch (error) {
    handleError(error);
  }
};

// Religion labels
const religionOptions = [
  { value: 'ISLAM', label: 'Islam' },
  { value: 'KRISTEN', label: 'Kristen' },
  { value: 'KATOLIK', label: 'Katolik' },
  { value: 'HINDU', label: 'Hindu' },
  { value: 'BUDHA', label: 'Budha' },
  { value: 'KONGHUCU', label: 'Konghucu' },
];

const isUploadingFace = ref(false);
const faceFileInput = ref(null);

const detectFaceInBrowser = (imageSrc) => {
  return new Promise((resolve) => {
    if (typeof window.pico === 'undefined') {
      const script = document.createElement('script');
      script.src = '/pico.js';
      script.onload = () => runDetection(imageSrc, resolve);
      script.onerror = () => {
        console.error('Failed to load pico.js');
        resolve(true); // fallback to true to not block the user if the script fails to load
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

const showFaceUploadOptions = ref(false);
const showCameraModal = ref(false);
const videoStream = ref(null);
const videoRef = ref(null);
const showFaceCropper = ref(false);
const rawFaceImage = ref(null);
const faceCropperRef = ref(null);

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
        const res = await $fetch('/api/profile/face', {
          method: 'POST',
          body: formData,
        });

        if (res.success) {
          showFaceCropper.value = false;
          rawFaceImage.value = null;
          await refreshUser();
          $toast.success('Foto wajah absensi berhasil disimpan');
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

const resolvePhoto = (url) => {
  if (!url) return null;
  return url;
};

const genderLabel = (g) => g === 'L' ? 'Laki-Laki' : g === 'P' ? 'Perempuan' : 'Belum Diatur';
</script>

<template>
  <!-- ====== Profile Section ====== -->
  <div v-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 items-start">

    <!-- ── Left Column ── -->
    <div class="lg:col-span-2 flex flex-col gap-4 md:gap-6">

      <!-- 1. Identity Card -->
      <div class="overflow-hidden rounded-3xl bg-base-100 shadow-sm border border-base-200/60">
        <div class="relative z-20 h-32 md:h-44">
          <img src="../public/banner.webp" alt="profile cover" class="h-full w-full object-cover object-center" />
        </div>
        <div class="px-4 pb-6 lg:pb-8 text-center relative">
          <div class="relative z-30 mx-auto -mt-16 h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-base-100 p-1.5 shadow-md">
            <div class="relative h-full w-full mx-auto rounded-full overflow-hidden bg-base-200">
              <img 
                :src="user.url_picture" 
                alt="profile photo" 
                class="h-full w-full object-cover object-center" 
              />
              <!-- Clickable Action Button -->
              <button 
                @click="showModal('avatarActions')"
                class="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center transition-all duration-300 opacity-0 md:opacity-0 hover:opacity-100 group"
              >
                <Icon name="mingcute:pencil-fill" size="24" class="text-white drop-shadow-md" />
              </button>
              
              <!-- Mobile-friendly small edit button -->
              <button 
                @click="showModal('avatarActions')"
                class="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-base-100 md:hidden"
              >
                <Icon name="mingcute:pencil-fill" size="14" />
              </button>
              
              <!-- Desktop hover indicator -->
              <div @click="showModal('avatarActions')" class="absolute inset-0 cursor-pointer hidden md:block"></div>
            </div>
            <!-- Hidden Input -->
            <input 
              ref="fileInput"
              type="file" 
              class="hidden" 
              accept="image/*"
              @change="onFileChange"
            />
          </div>
          <div class="mt-4">
            <h3 class="mb-1 text-2xl font-bold text-base-content">{{ user.Nama }}</h3>
            <p class="font-medium text-base-content/70">{{ user.Kelas }}</p>
            <div class="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-base-200/50 border border-base-200 text-base-content/80 rounded-full text-sm font-semibold shadow-sm">
              NIS: {{ user.NIS }}
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Personal Info -->
      <div class="rounded-3xl bg-base-100 p-6 md:p-8 shadow-sm border border-base-200/60">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-base-200/60">
          <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Informasi Pribadi</h4>
          <button @click="showModal('editPersonal')" class="btn btn-sm btn-ghost gap-1.5 text-base-content/50 hover:text-primary">
            <Icon name="flowbite:edit-solid" size="15" /> Edit
          </button>
        </div>
        <div class="flex flex-col gap-5">

          <!-- TTL -->
          <div class="flex items-start gap-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60 shrink-0">
              <Icon name="mingcute:calendar-fill" size="20" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Tempat, Tanggal Lahir</p>
              <p class="text-base font-medium text-base-content">{{ user.TTL }}</p>
            </div>
          </div>

          <!-- Gender / Agama -->
          <div class="flex items-start gap-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60 shrink-0">
              <Icon name="mingcute:user-info-fill" size="20" />
            </div>
            <div>
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Gender / Agama</p>
              <p class="text-base font-medium text-base-content">{{ user.Gender }} &bull; {{ user.Agama }}</p>
            </div>
          </div>

          <!-- Email -->
          <div class="flex items-start gap-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60 shrink-0">
              <Icon name="mingcute:mail-fill" size="20" />
            </div>
            <div>
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Email</p>
              <p class="text-base font-medium text-base-content">{{ user.Email || 'Belum Diatur' }}</p>
            </div>
          </div>

          <!-- Alamat -->
          <div class="flex items-start gap-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60 shrink-0">
              <Icon name="mingcute:location-fill" size="20" />
            </div>
            <div>
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Alamat</p>
              <p class="text-base font-medium text-base-content leading-relaxed">{{ user.Alamat || 'Belum Diatur' }}</p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- ── Right Column ── -->
    <div class="lg:col-span-1 flex flex-col gap-4 md:gap-6">

      <!-- Contact -->
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60">
        <div class="flex items-center justify-between mb-5">
          <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kontak</h4>
          <button @click="showModal('editNomor')" class="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:text-primary">
            <Icon name="flowbite:edit-solid" size="16" />
          </button>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 text-success shadow-inner">
            <Icon name="mingcute:phone-fill" size="28" />
          </div>
          <div>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">WhatsApp / Telp</p>
            <p class="text-lg font-bold text-base-content">{{ user.Nomor }}</p>
          </div>
        </div>
      </div>

      <!-- Vehicle -->
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60">
        <div class="flex items-center justify-between mb-5">
          <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kendaraan</h4>
          <button @click="showModal('editPlat')" class="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:text-primary">
            <Icon name="flowbite:edit-solid" size="16" />
          </button>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-info/10 text-info shadow-inner">
            <Icon name="mingcute:car-fill" size="28" />
          </div>
          <div>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Plat Nomor</p>
            <div class="mt-1 px-3 py-1.5 bg-base-200/80 border border-base-300/50 rounded-lg inline-block">
              <span class="text-md font-mono font-bold tracking-widest text-base-content">{{ user.Plat_Nomor !== '-' ? user.Plat_Nomor : '----' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Foto Absensi (Face Recognition) -->
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 text-left">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Foto Absensi</h4>
          <span v-if="user.faceUrl" class="badge badge-success text-[10px] font-bold px-2.5 py-2.5 rounded-lg text-white">Terdaftar</span>
          <span v-else class="badge badge-warning text-[10px] font-bold px-2.5 py-2.5 rounded-lg text-white">Belum Ada</span>
        </div>
        
        <div class="flex flex-col gap-4">
          <div class="relative w-36 h-48 mx-auto rounded-2xl overflow-hidden bg-base-200 border border-base-300 flex items-center justify-center shadow-inner">
            <img 
              v-if="user.faceUrl"
              :src="resolvePhoto(user.faceUrl)" 
              alt="Face photo" 
              class="h-full w-full object-cover object-center" 
            />
            <div v-else class="flex flex-col items-center justify-center text-base-content/40 p-4 text-center">
              <Icon name="mingcute:face-fill" size="44" class="mb-2 opacity-55" />
              <p class="text-xs font-semibold">Belum ada foto</p>
            </div>
          </div>

          <!-- Upload action -->
          <div v-if="!user.faceUrl || user.role === 'ADMIN'">
            <button 
              @click="showFaceUploadOptions = true" 
              class="btn btn-primary btn-sm w-full rounded-xl font-bold h-10 gap-2"
              :disabled="isUploadingFace"
            >
              <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="mingcute:upload-2-fill" size="16" />
              {{ user.faceUrl ? 'Ganti Foto Wajah' : 'Unggah Foto Wajah' }}
            </button>
          </div>
          <div v-else class="bg-base-200/50 border border-base-300/40 p-3 rounded-2xl flex items-start gap-2.5">
            <Icon name="mingcute:information-line" class="text-primary shrink-0 mt-0.5" size="16" />
            <p class="text-[11px] text-base-content/60 font-semibold leading-relaxed">
              Foto wajah absensi sudah terdaftar. Hubungi Administrator jika ingin memperbarui foto wajah Anda.
            </p>
          </div>
        </div>
      </div>

      <!-- Security -->
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-error/10 text-error">
            <Icon name="mingcute:shield-shape-fill" size="20" />
          </div>
          <h4 class="text-sm font-bold text-base-content/80 uppercase tracking-wider">Keamanan</h4>
        </div>
        <p class="text-sm text-base-content/60 mb-5 leading-relaxed">Pastikan kata sandi Anda kuat dan tidak dibagikan ke siapapun.</p>
        <button @click="showModal('changePass')" class="btn btn-primary w-full rounded-xl gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
          <Icon name="mingcute:key-2-fill" size="18" />
          Ganti Password
        </button>
      </div>

    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="fetchError" class="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4 text-center">
    <div class="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center shadow-inner">
      <Icon name="mingcute:warning-fill" size="40" />
    </div>
    <div>
      <h3 class="text-xl font-bold text-base-content mb-2">Gagal Memuat Profil</h3>
      <p class="text-base-content/60 max-w-xs mx-auto">
        {{ fetchError.data?.statusMessage || fetchError.message || 'Terjadi kesalahan saat mengambil data.' }}
      </p>
    </div>
    <button @click="refreshUser" class="btn btn-primary rounded-xl px-10 shadow-md">
      Coba Lagi
    </button>
  </div>

  <!-- Loading State -->
  <div v-else class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <span class="loading loading-spinner loading-lg text-primary"></span>
    <p class="text-base-content/50 font-medium">Memuat profil...</p>
  </div>

  <!-- ══════════════════════════════════════════════════
       MODALS
  ══════════════════════════════════════════════════ -->

  <!-- Modal: Edit Informasi Pribadi -->
  <dialog id="editPersonal" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8 max-w-lg overflow-visible">
      <h3 class="font-bold text-xl text-base-content mb-6">Edit Informasi Pribadi</h3>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-4">

        <!-- Tempat & Tanggal Lahir -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="text-sm font-semibold text-base-content/70">Tempat Lahir</label>
            <input v-model="editForm.birthPlace" type="text" placeholder="Jakarta"
              class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div class="flex flex-col gap-1.5 flex-1 relative">
            <label class="text-sm font-semibold text-base-content/70">Tanggal Lahir</label>
            <button @click="showDatePicker = !showDatePicker"
              class="input input-bordered w-full bg-base-100 rounded-xl flex items-center justify-start text-left">
              <span v-if="editForm.birthDate" class="text-base-content">{{ format(editForm.birthDate, 'dd MMMM yyyy') }}</span>
              <span v-else class="text-base-content/40">Pilih tanggal</span>
            </button>
            <div v-if="showDatePicker" class="absolute top-full left-0 z-[100] mt-2 shadow-2xl rounded-2xl border border-base-200 bg-base-100">
              <ClientOnly>
                <DatePicker v-model="editForm.birthDate" mode="date" @dayclick="showDatePicker = false" />
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Gender -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Jenis Kelamin</label>
          <div class="flex gap-3">
            <label class="flex items-center gap-2 cursor-pointer flex-1 border border-base-300 rounded-xl p-3 hover:border-primary/50 transition-colors"
              :class="editForm.gender === 'L' ? 'border-primary bg-primary/5' : ''">
              <input type="radio" v-model="editForm.gender" value="L" class="radio radio-primary radio-sm" />
              <span class="font-medium">Laki-Laki</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer flex-1 border border-base-300 rounded-xl p-3 hover:border-primary/50 transition-colors"
              :class="editForm.gender === 'P' ? 'border-primary bg-primary/5' : ''">
              <input type="radio" v-model="editForm.gender" value="P" class="radio radio-primary radio-sm" />
              <span class="font-medium">Perempuan</span>
            </label>
          </div>
        </div>

        <!-- Agama -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Agama</label>
          <select v-model="editForm.religion" class="select select-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">-- Pilih Agama --</option>
            <option v-for="opt in religionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Email</label>
          <input v-model="editForm.email" type="email" placeholder="nama@email.com"
            class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <!-- Alamat -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Alamat</label>
          <textarea v-model="editForm.address" rows="3" placeholder="Jl. Contoh No. 1, Kota"
            class="textarea textarea-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"></textarea>
        </div>

      </div>

      <div class="modal-action mt-6">
        <form method="dialog" class="flex gap-3 w-full">
          <button class="btn btn-ghost rounded-xl flex-1" @click="err = false">Batal</button>
          <button type="button" @click="editPersonal" :disabled="isSaving"
            class="btn btn-primary rounded-xl flex-1 px-8">
            <Icon v-if="isSaving" name="mingcute:loading-3-line" class="animate-spin mr-1" />
            Simpan
          </button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button @click="showDatePicker = false; err = false">close</button></form>
  </dialog>

  <!-- Modal: Edit Nomor -->
  <dialog id="editNomor" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8">
      <h3 class="font-bold text-xl text-base-content mb-2">Ganti Nomor Kontak</h3>
      <p class="text-sm text-base-content/60 mb-6">Nomor ini digunakan untuk verifikasi dan komunikasi penting.</p>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-base-content/70">WhatsApp / Telepon</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-base-content/50">+62</span>
          <input type="tel" v-model="editForm.phone"
            class="input input-bordered w-full bg-base-100 rounded-xl pl-12 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="81234567890" />
        </div>
        <p class="text-xs text-base-content/50 mt-1 ml-1">Jangan sertakan angka 0 di awal. Contoh: 81234...</p>
      </div>

      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full">
          <button class="btn btn-ghost rounded-xl flex-1" @click="err = false">Batal</button>
          <button type="button" @click="editNomor" :disabled="isSaving" class="btn btn-primary rounded-xl flex-1 px-8">
            <Icon v-if="isSaving" name="mingcute:loading-3-line" class="animate-spin mr-1" />
            Simpan
          </button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button @click="err = false">close</button></form>
  </dialog>

  <!-- Modal: Edit Plat Nomor -->
  <dialog id="editPlat" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8">
      <h3 class="font-bold text-xl text-base-content mb-6">Ganti Plat Nomor</h3>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-base-content/70">Plat Kendaraan</label>
        <input type="text" v-model="editForm.vehiclePlate"
          class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase font-mono tracking-widest"
          placeholder="AB 1234 CD" />
      </div>

      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full">
          <button class="btn btn-ghost rounded-xl flex-1" @click="err = false">Batal</button>
          <button type="button" @click="editPlat" :disabled="isSaving" class="btn btn-primary rounded-xl flex-1 px-8">
            <Icon v-if="isSaving" name="mingcute:loading-3-line" class="animate-spin mr-1" />
            Simpan
          </button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button @click="err = false">close</button></form>
  </dialog>

  <!-- Modal: Ganti Password -->
  <dialog id="changePass" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Icon name="mingcute:key-2-fill" size="20" />
        </div>
        <h3 class="font-bold text-xl text-base-content">Ganti Password</h3>
      </div>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Password Saat Ini</label>
          <input type="password" v-model="editForm.currentPassword"
            class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Masukkan password lama" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Password Baru</label>
          <input type="password" v-model="editForm.newPassword"
            class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Minimal 6 karakter" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-base-content/70">Konfirmasi Password Baru</label>
          <input type="password" v-model="editForm.confirmPassword"
            class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Ulangi password baru" />
        </div>
      </div>

      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full">
          <button class="btn btn-ghost rounded-xl flex-1" @click="err = false">Batal</button>
          <button type="button" @click="editPassword" :disabled="isSaving" class="btn btn-primary rounded-xl flex-1 px-8">
            <Icon v-if="isSaving" name="mingcute:loading-3-line" class="animate-spin mr-1" />
            Simpan Password
          </button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button @click="err = false">close</button></form>
  </dialog>

  <!-- Modal: Avatar Actions -->
  <dialog id="avatarActions" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-3xl sm:rounded-3xl p-6">
      <h3 class="font-bold text-lg text-base-content mb-6 text-center sm:text-left">Foto Profil</h3>
      
      <div class="flex flex-col gap-3">
        <!-- Update Photo -->
        <button 
          @click="closeModal('avatarActions'); $refs.fileInput.click()"
          class="btn btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary rounded-2xl flex items-center justify-between px-6 h-16 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="mingcute:camera-fill" size="22" />
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">Ganti Foto</p>
              <p class="text-xs text-base-content/50">Unggah foto baru dari galeri</p>
            </div>
          </div>
          <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
        </button>

        <!-- Delete Photo (Only if custom photo exists) -->
        <button 
          v-if="user && !user.url_picture.includes('ui-avatars.com')"
          @click="closeModal('avatarActions'); showDeleteConfirm = true"
          class="btn btn-ghost bg-base-200/50 hover:bg-error/10 hover:text-error rounded-2xl flex items-center justify-between px-6 h-16 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
              <Icon name="mingcute:delete-2-fill" size="22" />
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">Hapus Foto</p>
              <p class="text-xs text-base-content/50">Kembali ke foto profil default</p>
            </div>
          </div>
          <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
        </button>
      </div>

      <div class="modal-action sm:mt-6 mt-4">
        <button @click="closeModal('avatarActions')" class="btn btn-ghost w-full rounded-2xl">Batal</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- Modal: Delete Photo Confirmation -->
  <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showDeleteConfirm }]">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-6 text-center">
      <div class="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
        <Icon name="mingcute:delete-2-fill" size="32" />
      </div>
      <h3 class="font-bold text-xl text-base-content mb-2">Hapus Foto Profil?</h3>
      <p class="text-sm text-base-content/60 mb-8 px-4">
        Tindakan ini akan menghapus foto profil kustom Anda dan mengembalikannya ke tampilan inisial default.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-3">
        <button @click="showDeleteConfirm = false" class="btn btn-ghost flex-1 rounded-2xl order-2 sm:order-1">Batal</button>
        <button 
          @click="deletePhoto" 
          class="btn btn-error text-white flex-1 rounded-2xl shadow-lg shadow-error/20 order-1 sm:order-2"
          :disabled="isUploading"
        >
          <span v-if="isUploading" class="loading loading-spinner loading-xs"></span>
          Ya, Hapus
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false">
      <button>close</button>
    </form>
  </dialog>
  
  <!-- ══════════════════════════════════════════════════
       MODAL: CROPPER
       ══════════════════════════════════════════════════ -->
  <dialog :class="['modal', { 'modal-open': showCropper }]">
    <div class="modal-box max-w-xl p-0 overflow-hidden bg-base-100 rounded-3xl shadow-2xl border border-base-200">
      <div class="p-6 border-b border-base-200 flex items-center justify-between bg-base-50/50">
        <div>
          <h3 class="text-xl font-bold text-base-content">Sesuaikan Foto</h3>
          <p class="text-xs text-base-content/50">Geser dan zoom untuk posisi terbaik</p>
        </div>
        <button @click="cancelCrop" class="btn btn-ghost btn-circle btn-sm">
          <Icon name="mingcute:close-line" size="20" />
        </button>
      </div>

      <div class="p-6 bg-neutral/5">
        <div class="aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-2xl shadow-inner bg-black">
          <Cropper
            ref="cropperRef"
            :src="rawImage"
            :stencil-props="{ aspectRatio: 1 }"
            class="w-full h-full"
          />
        </div>
      </div>

      <div class="p-6 bg-base-50/50 flex justify-end gap-3">
        <button @click="cancelCrop" class="btn btn-ghost rounded-xl px-6">Batal</button>
        <button 
          @click="uploadAvatar" 
          class="btn btn-primary rounded-xl px-8 shadow-lg shadow-primary/20"
          :disabled="isUploading"
        >
          <span v-if="isUploading" class="loading loading-spinner loading-xs"></span>
          Simpan Foto
        </button>
      </div>
    </div>
  </dialog>

  <!-- Modal: Opsi Upload Wajah -->
  <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showFaceUploadOptions }]">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-6">
      <h3 class="font-bold text-lg text-base-content mb-6 text-center sm:text-left">Pilih Metode Upload Wajah</h3>
      <div class="flex flex-col gap-3">
        <!-- Ambil Selfie -->
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

        <!-- Dari Galeri -->
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
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-0 overflow-hidden max-w-lg">
      <div class="p-6 border-b border-base-200 flex items-center justify-between bg-base-50/50">
        <h3 class="font-bold text-lg text-base-content">Ambil Foto Wajah</h3>
        <button @click="closeCamera" class="btn btn-ghost btn-circle btn-sm">
          <Icon name="mingcute:close-line" size="20" />
        </button>
      </div>
      
      <div class="relative bg-black aspect-[3/4] max-h-[60vh] w-full flex items-center justify-center overflow-hidden">
        <video ref="videoRef" autoplay playsinline muted class="h-full w-full object-cover scale-x-[-1]"></video>
        
        <!-- Oval Face Placeholder Guidelines -->
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
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-0 overflow-hidden max-w-lg">
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
          
          <!-- Oval Face Guideline Overlay inside Cropper -->
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
  <!-- ====== Profile Section End ====== -->
</template>
