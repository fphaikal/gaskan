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

const isSyncingPhotos = ref(false);


const syncPhotos = async (direction) => {
  isSyncingPhotos.value = true;
  try {
    const res = await $fetch('/api/profile/sync-photos', {
      method: 'POST',
      body: { direction }
    });
    if (res?.success) {
      await refreshUser();
      $toast.success(res.message);
      closeModal('avatarActions');
    }
  } catch (error) {
    $toast.error(error?.data?.message || 'Gagal menyamakan foto');
  } finally {

    isSyncingPhotos.value = false;
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

// ── Student Field Permissions State ──────────────────────────
const fieldPermissionsMap = ref({});

const fetchFieldPermissions = async () => {
  try {
    const res = await $fetch('/api/profile/field-permissions');
    if (res?.success && res.data) {
      const map = {};
      res.data.forEach(p => {
        map[p.fieldName] = p.mode;
      });
      fieldPermissionsMap.value = map;
    }
  } catch (err) {
    console.error('Failed to fetch profile field permissions:', err);
  }
};

onMounted(() => {
  fetchFieldPermissions();
});

const userRole = computed(() => (user.value?.role || 'SISWA').toUpperCase());

const getFieldPermissionMode = (fieldName) => {
  return fieldPermissionsMap.value[fieldName] || 'FREELY_EDITABLE';
};

const isValuePresent = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed !== '' && trimmed !== '-';
  }
  if (val instanceof Date) return true;
  return Boolean(val);
};

const isFieldDisabled = (fieldName, currentValue) => {
  if (userRole.value !== 'SISWA') return false;
  const mode = getFieldPermissionMode(fieldName);
  if (mode === 'LOCKED') return true;
  if (mode === 'FILL_ONCE') {
    return isValuePresent(currentValue);
  }
  return false;
};

const getFieldBadge = (fieldName, currentValue) => {
  if (userRole.value !== 'SISWA') return null;
  const mode = getFieldPermissionMode(fieldName);
  if (mode === 'LOCKED') {
    return { label: 'Terkunci', color: 'badge-error text-white font-bold', icon: 'mingcute:lock-fill' };
  }
  if (mode === 'FILL_ONCE') {
    if (isValuePresent(currentValue)) {
      return { label: 'Sekali Isi (Terisi)', color: 'badge-ghost bg-base-300 text-base-content/70 font-bold', icon: 'mingcute:lock-fill' };
    } else {
      return { label: '⚠️ Sekali Isi (Kosong)', color: 'badge-warning text-slate-900 font-extrabold animate-pulse', icon: 'mingcute:alert-fill' };
    }
  }
  return { label: 'Bebas Diedit', color: 'badge-success text-white font-bold', icon: 'mingcute:check-fill' };
};

const hasFillOnceWarningInPersonal = computed(() => {
  if (userRole.value !== 'SISWA') return false;
  const fields = [
    { name: 'birthPlace', val: user.value?.TempatLahir },
    { name: 'birthDate', val: user.value?.TanggalLahir },
    { name: 'gender', val: user.value?.gender },
    { name: 'religion', val: user.value?.religion },
    { name: 'email', val: user.value?.Email },
    { name: 'address', val: user.value?.Alamat },
  ];
  return fields.some(f => getFieldPermissionMode(f.name) === 'FILL_ONCE' && !isValuePresent(f.val));
});

const hasFillOnceWarningInPhone = computed(() => {
  if (userRole.value !== 'SISWA') return false;
  return getFieldPermissionMode('phone') === 'FILL_ONCE' && !isValuePresent(user.value?.Nomor);
});

const hasFillOnceWarningInPlat = computed(() => {
  if (userRole.value !== 'SISWA') return false;
  return getFieldPermissionMode('vehiclePlate') === 'FILL_ONCE' && !isValuePresent(user.value?.Plat_Nomor);
});

const hasFillOnceWarningInPhoto = computed(() => {
  if (userRole.value !== 'SISWA') return false;
  const hasPhoto = user.value?.url_picture && !user.value.url_picture.includes('ui-avatars.com');
  return getFieldPermissionMode('photoUrl') === 'FILL_ONCE' && !hasPhoto;
});

const hasFillOnceWarningInFace = computed(() => {
  if (userRole.value !== 'SISWA') return false;
  return getFieldPermissionMode('faceUrl') === 'FILL_ONCE' && !isValuePresent(user.value?.faceUrl);
});



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

// ── Student Attendance History State ────────────────────────
const profileAttendanceMonth = ref(new Date().getMonth() + 1);
const profileAttendanceYear = ref(new Date().getFullYear());
const profileAttendanceData = ref(null);
const isProfileAttendanceLoading = ref(false);
const profileSelectedDayLog = ref(null);
const activeProfilePreviewImage = ref(null);

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
  { value: 12, name: 'Desember' }
];

const yearOptions = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
});

const fetchProfileAttendance = async () => {
  if (userRole.value !== 'SISWA') return;
  const targetId = user.value?.id || user.value?.nis || user.value?.NIS;
  if (!targetId) return;

  isProfileAttendanceLoading.value = true;
  try {
    const res = await $fetch(`/api/attendance/student/${targetId}?month=${profileAttendanceMonth.value}&year=${profileAttendanceYear.value}`);
    profileAttendanceData.value = res?.data || res || null;
  } catch (err) {
    console.error('Failed to fetch profile attendance:', err);
  } finally {
    isProfileAttendanceLoading.value = false;
  }
};

watch([user, profileAttendanceMonth, profileAttendanceYear], () => {
  if (user.value && userRole.value === 'SISWA') {
    fetchProfileAttendance();
  }
}, { immediate: true });

const profileSummaryStats = computed(() => {
  return profileAttendanceData.value?.summary || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, total: 0 };
});

const profileCalendarCells = computed(() => {
  const cells = [];
  const year = profileAttendanceYear.value;
  const month = profileAttendanceMonth.value - 1;
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6;
  for (let i = 0; i < startDay; i++) {
    cells.push({ id: `p-empty-${i}`, type: 'empty' });
  }

  const dailyMap = profileAttendanceData.value?.dailyMap || {};
  const totalDays = lastDayOfMonth.getDate();
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toLocaleDateString('en-CA');
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayData = dailyMap[dateStr] || null;
    cells.push({
      id: `p-day-${day}`,
      type: 'day',
      day,
      dateStr,
      isWeekend,
      data: dayData
    });
  }
  return cells;
});

const getProfileLogPhoto = (log) => {
  if (log?.notes && (log.notes.startsWith('http') || log.notes.startsWith('/uploads') || log.notes.endsWith('.jpg') || log.notes.endsWith('.png') || log.notes.endsWith('.jpeg') || log.notes.endsWith('.webp'))) return log.notes;
  if (log?.photoUrl) return log.photoUrl;
  if (log?.image) return log.image;
  return user.value?.url_picture || user.value?.photoUrl || user.value?.faceUrl || null;
};

const getProfileStatusBadge = (status) => {
  switch (status) {
    case 'HADIR': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'TERLAMBAT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'IZIN': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    case 'SAKIT': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    case 'ALPHA': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    default: return 'bg-base-200 text-base-content/60 border-base-300';
  }
};

const formatProfileLogTime = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatProfileLogDate = (ts) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};
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

      <!-- 3. Student Attendance History Card (For Student Role) -->
      <div v-if="userRole === 'SISWA'" class="rounded-3xl bg-base-100 p-6 md:p-8 shadow-sm border border-base-200/60 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-200/60">
          <div>
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Riwayat Presensi Kehadiran Siswa</h4>
            <p class="text-xs text-base-content/40 font-medium mt-0.5">Rekapitulasi tapping presensi, status, dan foto scan wajah</p>
          </div>
          <!-- Month & Year Selector -->
          <div class="flex gap-2">
            <select v-model="profileAttendanceMonth" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
              <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.name }}</option>
            </select>
            <select v-model="profileAttendanceYear" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>

        <div v-if="isProfileAttendanceLoading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <template v-else>
          <!-- Summary Stat Badges -->
          <div class="grid grid-cols-5 gap-2">
            <div class="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-center">
              <p class="text-base font-black text-emerald-600">{{ profileSummaryStats.hadir || 0 }}</p>
              <p class="text-[9px] font-black uppercase text-emerald-600/70 tracking-wider">Hadir</p>
            </div>
            <div class="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl text-center">
              <p class="text-base font-black text-amber-600">{{ profileSummaryStats.terlambat || 0 }}</p>
              <p class="text-[9px] font-black uppercase text-amber-600/70 tracking-wider">Lambat</p>
            </div>
            <div class="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-2xl text-center">
              <p class="text-base font-black text-sky-600">{{ profileSummaryStats.izin || 0 }}</p>
              <p class="text-[9px] font-black uppercase text-sky-600/70 tracking-wider">Izin</p>
            </div>
            <div class="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-2xl text-center">
              <p class="text-base font-black text-orange-600">{{ profileSummaryStats.sakit || 0 }}</p>
              <p class="text-[9px] font-black uppercase text-orange-600/70 tracking-wider">Sakit</p>
            </div>
            <div class="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl text-center">
              <p class="text-base font-black text-rose-600">{{ profileSummaryStats.alpha || 0 }}</p>
              <p class="text-[9px] font-black uppercase text-rose-600/70 tracking-wider">Alpha</p>
            </div>
          </div>

          <!-- Interactive Calendar Grid -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h5 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Kalender Presensi</h5>
              <span class="text-[9px] font-bold text-base-content/40">Klik tanggal untuk melihat foto & jam tap</span>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-base-content/40 uppercase tracking-widest bg-base-200/50 py-1.5 rounded-xl">
              <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-400">Sab</span><span class="text-rose-400">Min</span>
            </div>
            <div class="grid grid-cols-7 gap-1.5">
              <div 
                v-for="cell in profileCalendarCells" 
                :key="cell.id"
                @click="cell.data && (profileSelectedDayLog = profileSelectedDayLog === cell.data ? null : cell.data)"
                :class="[
                  'aspect-square rounded-xl p-1 flex flex-col justify-between text-center transition-all border text-[10px] font-bold cursor-pointer hover:scale-105',
                  cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                  cell.isWeekend ? 'bg-base-200/30 border-base-200 text-base-content/40' : 'bg-base-100 border-base-200',
                  profileSelectedDayLog === cell.data ? 'ring-2 ring-primary scale-105' : '',
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

          <!-- Tapping Photos & Log List -->
          <div class="space-y-2.5 pt-2 border-t border-base-200">
            <h5 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Daftar Foto & Tapping Log</h5>
            <div v-if="profileAttendanceData?.data && profileAttendanceData.data.length" class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              <div 
                v-for="log in profileAttendanceData.data" 
                :key="log.id"
                class="flex items-center gap-3 p-2.5 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/60 transition-colors"
              >
                <!-- Thumbnail Image with Click-to-Preview -->
                <div 
                  class="w-11 h-11 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 relative shadow-inner cursor-zoom-in group/img"
                  @click="activeProfilePreviewImage = getProfileLogPhoto(log)"
                >
                  <img 
                    v-if="getProfileLogPhoto(log)"
                    :src="getProfileLogPhoto(log)"
                    alt="scan"
                    class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-base-content/30 bg-base-200">
                    <Icon name="mingcute:pic-line" size="16" />
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs text-base-content">{{ formatProfileLogDate(log.timestamp) }} - {{ formatProfileLogTime(log.timestamp) }}</span>
                    <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase border', getProfileStatusBadge(log.status)]">
                      {{ log.status }}
                    </span>
                  </div>
                  <p class="text-[9px] font-bold text-base-content/40 truncate mt-0.5" v-if="log.device">
                    <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                    {{ log.device.name }} ({{ log.device.location || '-' }})
                  </p>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-base-content/40 italic text-center py-4">Belum ada data presensi bulan ini</p>
          </div>
        </template>
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
      <h3 class="font-bold text-xl text-base-content mb-4">Edit Informasi Pribadi</h3>

      <!-- Attention Warning Banner for Students -->
      <div v-if="userRole === 'SISWA'" class="space-y-2 mb-4">
        <div v-if="hasFillOnceWarningInPersonal" role="alert" class="alert alert-warning rounded-2xl border border-amber-500/30 p-3 shadow-sm text-xs font-medium">
          <Icon name="mingcute:warning-fill" size="22" class="text-amber-600 shrink-0" />
          <div>
            <p class="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI ISI!)</p>
            <p class="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
              Field bertanda <strong>"Sekali Isi"</strong> hanya dapat diisi <strong>SEKALI</strong>. Mohon periksa kembali dan isi dengan <strong>sungguh-sungguh &amp; benar</strong> karena begitu Anda klik Simpan, data tidak dapat diubah lagi!
            </p>
          </div>
        </div>
      </div>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-4">

        <!-- Tempat & Tanggal Lahir -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex flex-col gap-1.5 flex-1">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold text-base-content/70">Tempat Lahir</label>
              <span v-if="getFieldBadge('birthPlace', user?.TempatLahir)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('birthPlace', user?.TempatLahir).color]">
                {{ getFieldBadge('birthPlace', user?.TempatLahir).label }}
              </span>
            </div>
            <input 
              v-model="editForm.birthPlace" 
              type="text" 
              placeholder="Jakarta"
              :disabled="isFieldDisabled('birthPlace', user?.TempatLahir)"
              class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed" 
            />
          </div>

          <div class="flex flex-col gap-1.5 flex-1 relative">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold text-base-content/70">Tanggal Lahir</label>
              <span v-if="getFieldBadge('birthDate', user?.TanggalLahir)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('birthDate', user?.TanggalLahir).color]">
                {{ getFieldBadge('birthDate', user?.TanggalLahir).label }}
              </span>
            </div>
            <button 
              type="button"
              @click="!isFieldDisabled('birthDate', user?.TanggalLahir) && (showDatePicker = !showDatePicker)"
              :disabled="isFieldDisabled('birthDate', user?.TanggalLahir)"
              class="input input-bordered w-full bg-base-100 rounded-xl flex items-center justify-start text-left disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed"
            >
              <span v-if="editForm.birthDate" class="text-base-content">{{ format(editForm.birthDate, 'dd MMMM yyyy') }}</span>
              <span v-else class="text-base-content/40">Pilih tanggal</span>
            </button>
            <div v-if="showDatePicker && !isFieldDisabled('birthDate', user?.TanggalLahir)" class="absolute top-full left-0 z-[100] mt-2 shadow-2xl rounded-2xl border border-base-200 bg-base-100">
              <ClientOnly>
                <DatePicker v-model="editForm.birthDate" mode="date" @dayclick="showDatePicker = false" />
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Gender -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-sm font-semibold text-base-content/70">Jenis Kelamin</label>
            <span v-if="getFieldBadge('gender', user?.gender)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('gender', user?.gender).color]">
              {{ getFieldBadge('gender', user?.gender).label }}
            </span>
          </div>
          <div class="flex gap-3">
            <label 
              class="flex items-center gap-2 cursor-pointer flex-1 border border-base-300 rounded-xl p-3 hover:border-primary/50 transition-colors"
              :class="[
                editForm.gender === 'L' ? 'border-primary bg-primary/5' : '',
                isFieldDisabled('gender', user?.gender) ? 'opacity-50 pointer-events-none bg-base-200/40' : ''
              ]"
            >
              <input type="radio" v-model="editForm.gender" value="L" :disabled="isFieldDisabled('gender', user?.gender)" class="radio radio-primary radio-sm" />
              <span class="font-medium">Laki-Laki</span>
            </label>
            <label 
              class="flex items-center gap-2 cursor-pointer flex-1 border border-base-300 rounded-xl p-3 hover:border-primary/50 transition-colors"
              :class="[
                editForm.gender === 'P' ? 'border-primary bg-primary/5' : '',
                isFieldDisabled('gender', user?.gender) ? 'opacity-50 pointer-events-none bg-base-200/40' : ''
              ]"
            >
              <input type="radio" v-model="editForm.gender" value="P" :disabled="isFieldDisabled('gender', user?.gender)" class="radio radio-primary radio-sm" />
              <span class="font-medium">Perempuan</span>
            </label>
          </div>
        </div>

        <!-- Agama -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-sm font-semibold text-base-content/70">Agama</label>
            <span v-if="getFieldBadge('religion', user?.religion)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('religion', user?.religion).color]">
              {{ getFieldBadge('religion', user?.religion).label }}
            </span>
          </div>
          <select 
            v-model="editForm.religion" 
            :disabled="isFieldDisabled('religion', user?.religion)"
            class="select select-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed"
          >
            <option value="">-- Pilih Agama --</option>
            <option v-for="opt in religionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-sm font-semibold text-base-content/70">Email</label>
            <span v-if="getFieldBadge('email', user?.Email)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('email', user?.Email).color]">
              {{ getFieldBadge('email', user?.Email).label }}
            </span>
          </div>
          <input 
            v-model="editForm.email" 
            type="email" 
            placeholder="nama@email.com"
            :disabled="isFieldDisabled('email', user?.Email)"
            class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed" 
          />
        </div>

        <!-- Alamat -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label class="text-sm font-semibold text-base-content/70">Alamat</label>
            <span v-if="getFieldBadge('address', user?.Alamat)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('address', user?.Alamat).color]">
              {{ getFieldBadge('address', user?.Alamat).label }}
            </span>
          </div>
          <textarea 
            v-model="editForm.address" 
            rows="3" 
            placeholder="Jl. Contoh No. 1, Kota"
            :disabled="isFieldDisabled('address', user?.Alamat)"
            class="textarea textarea-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed"
          ></textarea>
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
      <p class="text-sm text-base-content/60 mb-4">Nomor ini digunakan untuk verifikasi dan komunikasi penting.</p>

      <!-- Attention Warning Banner for Students -->
      <div v-if="userRole === 'SISWA' && hasFillOnceWarningInPhone" role="alert" class="alert alert-warning rounded-2xl border border-amber-500/30 p-3 shadow-sm text-xs font-medium mb-4">
        <Icon name="mingcute:warning-fill" size="22" class="text-amber-600 shrink-0" />
        <div>
          <p class="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI ISI!)</p>
          <p class="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
            Field Nomor Telepon hanya dapat diisi <strong>SEKALI</strong>. Mohon periksa kembali dan pastikan nomor aktif &amp; benar karena setelah disimpan tidak dapat diubah lagi!
          </p>
        </div>
      </div>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-base-content/70">WhatsApp / Telepon</label>
          <span v-if="getFieldBadge('phone', user?.Nomor)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('phone', user?.Nomor).color]">
            {{ getFieldBadge('phone', user?.Nomor).label }}
          </span>
        </div>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-base-content/50">+62</span>
          <input 
            type="tel" 
            v-model="editForm.phone"
            :disabled="isFieldDisabled('phone', user?.Nomor)"
            class="input input-bordered w-full bg-base-100 rounded-xl pl-12 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed"
            placeholder="81234567890" 
          />
        </div>
        <p class="text-xs text-base-content/50 mt-1 ml-1">Jangan sertakan angka 0 di awal. Contoh: 81234...</p>
      </div>

      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full">
          <button class="btn btn-ghost rounded-xl flex-1" @click="err = false">Batal</button>
          <button type="button" @click="editNomor" :disabled="isSaving || isFieldDisabled('phone', user?.Nomor)" class="btn btn-primary rounded-xl flex-1 px-8">
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
      <h3 class="font-bold text-xl text-base-content mb-4">Ganti Plat Nomor</h3>

      <!-- Attention Warning Banner for Students -->
      <div v-if="userRole === 'SISWA' && hasFillOnceWarningInPlat" role="alert" class="alert alert-warning rounded-2xl border border-amber-500/30 p-3 shadow-sm text-xs font-medium mb-4">
        <Icon name="mingcute:warning-fill" size="22" class="text-amber-600 shrink-0" />
        <div>
          <p class="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI ISI!)</p>
          <p class="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
            Plat Nomor Kendaraan hanya dapat diisi <strong>SEKALI</strong>. Mohon periksa kembali dan pastikan plat nomor kendaraan Anda sudah benar!
          </p>
        </div>
      </div>

      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-4 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-base-content/70">Plat Kendaraan</label>
          <span v-if="getFieldBadge('vehiclePlate', user?.Plat_Nomor)" :class="['badge badge-xs text-[9px] px-2 py-1', getFieldBadge('vehiclePlate', user?.Plat_Nomor).color]">
            {{ getFieldBadge('vehiclePlate', user?.Plat_Nomor).label }}
          </span>
        </div>
        <input 
          type="text" 
          v-model="editForm.vehiclePlate"
          :disabled="isFieldDisabled('vehiclePlate', user?.Plat_Nomor)"
          class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase font-mono tracking-widest disabled:bg-base-200/60 disabled:text-base-content/60 disabled:cursor-not-allowed"
          placeholder="AB 1234 CD" 
        />
      </div>

      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full">
          <button class="btn btn-ghost rounded-xl flex-1" @click="err = false">Batal</button>
          <button type="button" @click="editPlat" :disabled="isSaving || isFieldDisabled('vehiclePlate', user?.Plat_Nomor)" class="btn btn-primary rounded-xl flex-1 px-8">
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
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg text-base-content">Foto Profil</h3>
        <span v-if="getFieldBadge('photoUrl', user?.url_picture)" :class="['badge badge-sm font-bold px-2.5 py-1.5', getFieldBadge('photoUrl', user?.url_picture).color]">
          {{ getFieldBadge('photoUrl', user?.url_picture).label }}
        </span>
      </div>

      <!-- Attention Warning Banner for Photo Upload -->
      <div v-if="userRole === 'SISWA'" class="space-y-2 mb-4">
        <div v-if="hasFillOnceWarningInPhoto" role="alert" class="alert alert-warning rounded-2xl border border-amber-500/30 p-3 shadow-sm text-xs font-medium">
          <Icon name="mingcute:warning-fill" size="22" class="text-amber-600 shrink-0" />
          <div>
            <p class="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI UNGGAN!)</p>
            <p class="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
              Foto profil berstatus <strong>"Sekali Isi Jika Kosong"</strong>. Mohon unggah foto profil resmi, rapi, dan jelas karena begitu tersimpan, foto profil <strong>TIDAK DAPAT DIUBAH LAGI</strong>!
            </p>
          </div>
        </div>

        <div v-else-if="isFieldDisabled('photoUrl', user?.url_picture)" role="alert" class="alert alert-error rounded-2xl border border-rose-500/30 p-3 shadow-sm text-xs font-medium">
          <Icon name="mingcute:lock-fill" size="20" class="text-rose-600 shrink-0" />
          <div>
            <p class="font-extrabold text-rose-900 dark:text-rose-300">🔒 FOTO PROFIL TERKUNCI</p>
            <p class="text-[11px] text-rose-800 dark:text-rose-200 mt-0.5">
              Foto profil Anda telah dikunci oleh pihak sekolah dan tidak dapat diubah atau dihapus.
            </p>
          </div>
        </div>
      </div>
      
      <div class="flex flex-col gap-3">
        <!-- Update Photo -->
        <button 
          @click="!isFieldDisabled('photoUrl', user?.url_picture) && (closeModal('avatarActions'), $refs.fileInput.click())"
          :disabled="isFieldDisabled('photoUrl', user?.url_picture)"
          class="btn btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary rounded-2xl flex items-center justify-between px-6 h-16 transition-all disabled:bg-base-200/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="mingcute:camera-fill" size="22" />
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">Ganti Foto Baru</p>
              <p class="text-xs text-base-content/50">Unggah foto baru dari perangkat</p>
            </div>
          </div>
          <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
        </button>

        <!-- Samakan Foto Profil dengan Foto Wajah Absensi -->
        <button 
          @click="syncPhotos('FACE_TO_PROFILE')"
          :disabled="isSyncingPhotos || isFieldDisabled('photoUrl', user?.url_picture) || !user?.faceUrl"
          class="btn btn-ghost bg-base-200/50 hover:bg-info/10 hover:text-info rounded-2xl flex items-center justify-between px-6 h-16 transition-all disabled:bg-base-200/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
              <Icon name="mingcute:face-fill" size="22" />
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">Gunakan Foto Wajah Absensi</p>
              <p class="text-xs text-base-content/50">Samakan foto profil dengan foto wajah absensi</p>
            </div>
          </div>
          <Icon name="mingcute:transfer-line" size="18" class="text-base-content/20" />
        </button>

        <!-- Samakan Foto Wajah Absensi dengan Foto Profil -->
        <button 
          @click="syncPhotos('PROFILE_TO_FACE')"
          :disabled="isSyncingPhotos || isFieldDisabled('faceUrl', user?.faceUrl) || !user?.url_picture || user.url_picture.includes('ui-avatars.com')"
          class="btn btn-ghost bg-base-200/50 hover:bg-amber-500/10 hover:text-amber-500 rounded-2xl flex items-center justify-between px-6 h-16 transition-all disabled:bg-base-200/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Icon name="mingcute:user-4-fill" size="22" />
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">Gunakan Foto Profil untuk Absensi</p>
              <p class="text-xs text-base-content/50">Samakan foto wajah absensi dengan foto profil saat ini</p>
            </div>
          </div>
          <Icon name="mingcute:transfer-line" size="18" class="text-base-content/20" />
        </button>


        <!-- Delete Photo (Only if custom photo exists & not locked) -->
        <button 
          v-if="user && !user.url_picture.includes('ui-avatars.com') && !isFieldDisabled('photoUrl', user?.url_picture)"
          @click="closeModal('avatarActions'); showDeleteConfirm = true"
          class="btn btn-ghost bg-base-200/50 hover:bg-error/10 hover:text-error rounded-2xl flex items-center justify-between px-6 h-16 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error">
              <Icon name="mingcute:delete-2-fill" size="22" />
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">Hapus Foto Profil</p>
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

  <!-- Lightbox Image Preview Modal for Profile Attendance -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="activeProfilePreviewImage" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4" @click="activeProfilePreviewImage = null">
        <button class="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors btn btn-ghost btn-circle">
          <Icon name="mingcute:close-line" size="28" />
        </button>
        <img :src="activeProfilePreviewImage" class="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10" @click.stop />
      </div>
    </Transition>
  </Teleport>
  <!-- ====== Profile Section End ====== -->
</template>
