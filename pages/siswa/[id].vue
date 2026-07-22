<script setup>
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const route = useRoute();
const nis = route.params.id;

const authStore = useAuthStore();
const { userData: currentUser } = storeToRefs(authStore);

const isUploadingFace = ref(false);
const faceFileInput = ref(null);
const { $toast } = useNuxtApp();

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
const activePhotoTab = ref('upload');


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

const selectedPhotoType = ref('both');

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
      formData.append('photo', blob, 'photo.jpg');
      formData.append('type', selectedPhotoType.value);

      try {
        const res = await $fetch(`/api/students/${user.value.id}/photo?type=${selectedPhotoType.value}`, {
          method: 'POST',
          body: formData,
        });

        if (res.success) {
          showFaceCropper.value = false;
          rawFaceImage.value = null;
          const updated = await $fetch(`/api/user?role=siswa&user=${nis}`);
          user.value = updated;
          $toast.success(res.message || 'Foto profil siswa berhasil diperbarui');
        }
      } catch (error) {
        $toast.error(error.data?.statusMessage || error.data?.message || 'Gagal mengunggah foto');
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

const deleteStudentPhotoNow = async (targetType = 'both') => {
  try {
    const res = await $fetch(`/api/students/${user.value.id}/photo?type=${targetType}`, {
      method: 'DELETE',
    });
    if (res.success) {
      showFaceUploadOptions.value = false;
      const updated = await $fetch(`/api/user?role=siswa&user=${nis}`);
      user.value = updated;
      $toast.success('Foto siswa berhasil dihapus');
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal menghapus foto siswa');
  }
};

const isSyncingStudentPhotos = ref(false);

const syncStudentPhotoDirection = async (direction) => {
  isSyncingStudentPhotos.value = true;
  try {
    const res = await $fetch(`/api/students/${user.value.id}/sync-photos`, {
      method: 'POST',
      body: { direction }
    });
    if (res?.success) {
      showFaceUploadOptions.value = false;
      const updated = await $fetch(`/api/user?role=siswa&user=${nis}`);
      user.value = updated;
      $toast.success(res.message);
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal menyamakan foto siswa');
  } finally {
    isSyncingStudentPhotos.value = false;
  }
};



const cancelFaceCrop = () => {
  showFaceCropper.value = false;
  rawFaceImage.value = null;
};

const gender = (getGender) => {
  if (getGender === 'L') {
    return 'Laki-Laki'
  } else if (getGender === 'P'){
    return 'Perempuan'
  } else {
    return 'Belum diatur'
  }
}

const { data: user } = await useFetch(`/api/user?role=siswa&user=${nis}`);

// Attendance History & Calendar Grid State
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const attendanceHistory = ref(null);
const historyLoading = ref(false);
const selectedCellLog = ref(null);
const activePreviewImage = ref(null);

const openImagePreview = (url) => { if (url) activePreviewImage.value = url; };
const closeImagePreview = () => { activePreviewImage.value = null; };

const getLogImage = (log) => {
  if (log?.notes && (log.notes.startsWith('http') || log.notes.startsWith('/uploads') || log.notes.endsWith('.jpg') || log.notes.endsWith('.png') || log.notes.endsWith('.jpeg') || log.notes.endsWith('.webp'))) return log.notes;
  if (log?.photoUrl) return log.photoUrl;
  if (log?.image) return log.image;
  return user.value?.url_picture || user.value?.photoUrl || user.value?.faceUrl || 'https://api.tierkun.my.id/file/picture/0000.png';
};

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

const years = computed(() => {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
});

const fetchStudentAttendanceHistory = async () => {
  if (!user.value?.id) return;
  historyLoading.value = true;
  try {
    const data = await $fetch(`/api/attendance/student/${user.value.id}?month=${selectedMonth.value}&year=${selectedYear.value}`);
    attendanceHistory.value = data;
  } catch (e) {
    console.error('Failed to fetch student attendance history:', e);
  } finally {
    historyLoading.value = false;
  }
};

onMounted(fetchStudentAttendanceHistory);
watch([selectedMonth, selectedYear], fetchStudentAttendanceHistory);

const historySummary = computed(() => attendanceHistory.value?.summary || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, total: 0 });

const calendarCells = computed(() => {
  const year = selectedYear.value;
  const month = selectedMonth.value;
  
  const totalDays = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ type: 'empty', id: `empty-${i}` });
  }
  
  const dailyMap = attendanceHistory.value?.dailyMap || {};
  
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = (new Date(year, month - 1, day).getDay() + 6) % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const dayData = dailyMap[dateStr] || null;
    
    cells.push({
      type: 'day',
      day,
      dateStr,
      isWeekend,
      data: dayData
    });
  }
  
  return cells;
});

const getStatusBadge = (s) => {
  const map = {
    HADIR: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    TERLAMBAT: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    IZIN: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
    SAKIT: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    ALPHA: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  };
  return map[s] || 'bg-base-200 text-base-content/50 border-base-300';
};

useSeoMeta({
  title: computed(() => `Profil ${user.value?.Nama || 'Siswa'} | GASKAN`),
  ogTitle: computed(() => `Profil ${user.value?.Nama || 'Siswa'} | GASKAN`),
  image: computed(() => user.value?.url_picture),
  description: computed(() => `Profil Siswa ${user.value?.Nama || ''}`),
  url: `https://gaskan.smtijogja.sch.id/siswa/${nis}`,
  ogUrl: `https://gaskan.smtijogja.sch.id/siswa/${nis}`,
})
</script>
<template>
  <div class="mx-auto max-w-7xl px-4 md:px-0">
    <!-- ====== Profile Section Start -->
    <div v-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 items-start">
      
      <!-- Left Column (Identity & Personal Info) -->
      <div class="lg:col-span-2 flex flex-col gap-4 md:gap-6">
        
        <!-- 1. Identity Block -->
        <div class="overflow-hidden rounded-3xl bg-base-100 shadow-sm border border-base-200/60">
          <div class="relative z-20 h-32 md:h-44">
            <img src="../../public/banner.webp" alt="profile cover" class="h-full w-full object-cover object-center" />
          </div>
          <div class="px-4 pb-6 lg:pb-8 text-center relative">
            <div class="relative z-30 mx-auto -mt-16 h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-base-100 p-1.5 shadow-md group">
              <div class="relative z-20 h-full w-full mx-auto rounded-full overflow-hidden bg-base-200">
                <img :src="user.url_picture" alt="profile photo" class="h-full w-full object-cover object-center" />
                <button 
                  @click="showFaceUploadOptions = true"
                  class="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs gap-1"
                  title="Ubah Foto Siswa"
                >
                  <Icon name="mingcute:camera-fill" size="20" />
                  <span>Ubah Foto</span>
                </button>
              </div>
            </div>

            <div class="mt-4">
              <h3 class="mb-1 text-2xl font-bold text-base-content">{{ user.Nama || '' }}</h3>
              <p class="font-medium text-base-content/70">{{ user.Kelas }}</p>
              <div class="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-base-200/50 border border-base-200 text-base-content/80 rounded-full text-sm font-semibold shadow-sm">
                NIS: {{ user.NIS }}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Personal Info Block -->
        <div class="rounded-3xl bg-base-100 p-6 md:p-8 shadow-sm border border-base-200/60">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-base-200/60">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Informasi Pribadi</h4>
          </div>
          <div class="flex flex-col gap-6">
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:calendar-fill" size="20" />
              </div>
              <div class="flex-1">
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Tempat, Tanggal Lahir</p>
                <p class="text-base font-medium text-base-content">{{ user.TTL }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:user-info-fill" size="20" />
              </div>
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Gender / Agama</p>
                <p class="text-base font-medium text-base-content">{{ user.Gender }} &bull; {{ user.Agama }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:mail-fill" size="20" />
              </div>
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Email</p>
                <p class="text-base font-medium text-base-content">{{ user.Email || 'Belum Diatur' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:location-fill" size="20" />
              </div>
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Alamat</p>
                <p class="text-base font-medium text-base-content leading-relaxed">{{ user.Alamat }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- Right Column (Contact & Vehicle) -->
      <div class="lg:col-span-1 flex flex-col gap-4 md:gap-6">
        
        <!-- Contact Block -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative transition-all duration-300 hover:shadow-md">
          <div class="flex items-center justify-between mb-5">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kontak</h4>
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

        <!-- Vehicle Block -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative transition-all duration-300 hover:shadow-md">
          <div class="flex items-center justify-between mb-5">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kendaraan</h4>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-info/10 text-info shadow-inner">
              <Icon name="mingcute:car-fill" size="28" />
            </div>
            <div>
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Plat Nomor</p>
              <div class="mt-1 px-3 py-1.5 bg-base-200/80 border border-base-300/50 rounded-lg inline-block">
                <span class="text-md font-mono font-bold tracking-widest text-base-content">{{ user.Plat_Nomor || '----' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Foto Absensi (Face Recognition) -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Foto Absensi</h4>
            <span v-if="user.faceUrl" class="badge badge-success text-[10px] font-bold px-2.5 py-2.5 rounded-lg text-white">Terdaftar</span>
            <span v-else class="badge badge-warning text-[10px] font-bold px-2.5 py-2.5 rounded-lg text-white">Belum Ada</span>
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
                <p class="text-xs font-semibold">Belum ada foto</p>
              </div>
            </div>

            <!-- Upload action (Only Admin or Guru can upload/change it from this view page) -->
            <div v-if="currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER' || currentUser.role === 'GURU')">
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
          </div>
        </div>

        <!-- History & Kalender Presensi Siswa -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-200/60">
            <div>
              <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kalender & History Presensi</h4>
              <p class="text-xs text-base-content/40 font-medium">Riwayat tapping dan foto scan kehadiran siswa</p>
            </div>
            
            <!-- Month / Year Selector -->
            <div class="flex gap-2">
              <select v-model="selectedMonth" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.name }}</option>
              </select>
              <select v-model="selectedYear" class="select select-bordered select-xs font-bold rounded-xl bg-base-100">
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <div v-if="historyLoading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md text-primary"></span>
          </div>

          <template v-else>
            <!-- Summary Stats Badges -->
            <div class="grid grid-cols-5 gap-2">
              <div class="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-center">
                <p class="text-base font-black text-emerald-600">{{ historySummary.hadir || 0 }}</p>
                <p class="text-[9px] font-black uppercase text-emerald-600/70 tracking-wider">Hadir</p>
              </div>
              <div class="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl text-center">
                <p class="text-base font-black text-amber-600">{{ historySummary.terlambat || 0 }}</p>
                <p class="text-[9px] font-black uppercase text-amber-600/70 tracking-wider">Terlambat</p>
              </div>
              <div class="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-2xl text-center">
                <p class="text-base font-black text-sky-600">{{ historySummary.izin || 0 }}</p>
                <p class="text-[9px] font-black uppercase text-sky-600/70 tracking-wider">Izin</p>
              </div>
              <div class="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-2xl text-center">
                <p class="text-base font-black text-orange-600">{{ historySummary.sakit || 0 }}</p>
                <p class="text-[9px] font-black uppercase text-orange-600/70 tracking-wider">Sakit</p>
              </div>
              <div class="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-2xl text-center">
                <p class="text-base font-black text-rose-600">{{ historySummary.alpha || 0 }}</p>
                <p class="text-[9px] font-black uppercase text-rose-600/70 tracking-wider">Alpha</p>
              </div>
            </div>

            <!-- Monthly Interactive Calendar Grid -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h5 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Grid Kalender Bulanan</h5>
                <span class="text-[9px] font-bold text-base-content/40">Klik tanggal untuk rincian log</span>
              </div>
              
              <!-- Weekday Header -->
              <div class="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-base-content/40 uppercase tracking-widest bg-base-200/50 py-1.5 rounded-xl">
                <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span class="text-rose-400">Sab</span><span class="text-rose-400">Min</span>
              </div>

              <!-- Day Grid -->
              <div class="grid grid-cols-7 gap-1.5">
                <div 
                  v-for="cell in calendarCells" 
                  :key="cell.id || cell.dateStr"
                  @click="cell.data && (selectedCellLog = cell.data)"
                  :class="[
                    'aspect-square rounded-xl p-1 flex flex-col justify-between text-center transition-all border text-[10px] font-bold cursor-pointer hover:scale-105',
                    cell.type === 'empty' ? 'opacity-0 pointer-events-none' : '',
                    cell.isWeekend ? 'bg-base-200/30 border-base-200 text-base-content/40' : 'bg-base-100 border-base-200',
                    selectedCellLog && selectedCellLog === cell.data ? 'ring-2 ring-primary scale-105' : '',
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

            <!-- Selected Cell Day Log Popup Card -->
            <div v-if="selectedCellLog" class="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-widest text-primary">Log Presensi Tapping</span>
                <button @click="selectedCellLog = null" class="btn btn-ghost btn-xs btn-circle">
                  <Icon name="mingcute:close-line" size="14" />
                </button>
              </div>
              <div class="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                <div v-for="log in selectedCellLog.logs" :key="log.id" class="flex items-center gap-3 p-2 rounded-xl bg-base-100 border border-base-200">
                  <div class="w-10 h-10 rounded-lg overflow-hidden bg-base-200 shrink-0 border border-base-200 relative">
                    <img :src="getLogImage(log)" 
                         alt="scan" 
                         class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform"
                         @click="openImagePreview(getLogImage(log))" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-mono font-bold text-base-content">{{ new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</span>
                      <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase border', getStatusBadge(log.status)]">
                        {{ log.status }}
                      </span>
                    </div>
                    <p class="text-[9px] font-bold text-base-content/50 truncate mt-0.5" v-if="log.device">
                      <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                      {{ log.device.name }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Detailed Logs with Captured Photos -->
            <div class="space-y-2 pt-2 border-t border-base-200">
              <h5 class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Daftar Foto & Log Scan Kehadiran</h5>
              <div v-if="attendanceHistory?.data && attendanceHistory.data.length" class="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                <div v-for="log in attendanceHistory.data" :key="log.id" class="flex items-center gap-3 p-2.5 rounded-2xl bg-base-200/30 border border-base-200/50 hover:bg-base-200/60 transition-colors">
                  <!-- Captured Photo Thumbnail -->
                  <div class="w-11 h-11 rounded-xl overflow-hidden bg-base-200 border border-base-200 shrink-0 relative shadow-inner">
                    <img :src="getLogImage(log)" 
                         alt="scan" 
                         class="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-300"
                         @click="openImagePreview(getLogImage(log))" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-base-content">{{ new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }} - {{ new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</span>
                      <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase border', getStatusBadge(log.status)]">
                        {{ log.status }}
                      </span>
                    </div>
                    <p class="text-[9px] font-bold text-base-content/40 truncate mt-0.5" v-if="log.device">
                      <Icon name="mingcute:location-fill" size="11" class="text-primary inline mr-0.5" />
                      {{ log.device.name }} ({{ log.device.location }})
                    </p>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40 italic text-center py-6">Belum ada data presensi bulan ini</p>
            </div>
          </template>
        </div>
        
        <!-- Leave Requests Block -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative">
          <div class="flex items-center justify-between mb-5 pb-3 border-b border-base-200/60">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Riwayat Surat Izin</h4>
            <span class="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg uppercase">Terbaru</span>
          </div>
          
          <div v-if="user.leaveRequests && user.leaveRequests.length > 0" class="flex flex-col gap-5">
            <div v-for="leave in user.leaveRequests" :key="leave.id" class="relative group">
              <div class="flex items-start gap-4">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', 
                  leave.type === 'SAKIT' ? 'bg-error/10 text-error' : 'bg-info/10 text-info'
                ]">
                  <Icon :name="leave.type === 'SAKIT' ? 'mingcute:hospital-fill' : 'mingcute:file-info-fill'" size="20" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-xs font-bold text-base-content">{{ leave.type }}</p>
                    <span :class="['text-[9px] font-black uppercase px-2 py-0.5 rounded-md', 
                      leave.status === 'APPROVED' ? 'bg-success/10 text-success' : 
                      leave.status === 'PENDING' ? 'bg-warning/10 text-warning' : 
                      'bg-error/10 text-error'
                    ]">
                      {{ leave.status }}
                    </span>
                  </div>
                  <p class="text-[10px] font-bold text-base-content/40 mb-2">
                    {{ new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }} 
                    - 
                    {{ new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}
                  </p>
                  <p class="text-[10px] text-base-content/60 leading-relaxed italic line-clamp-2">"{{ leave.reason }}"</p>
                  
                  <div v-if="leave.proofs?.length" class="mt-3 flex gap-2">
                    <a v-for="proof in leave.proofs" :key="proof.id" :href="proof.fileUrl" target="_blank" class="btn btn-ghost btn-xs rounded-lg bg-base-200/50 gap-1 text-[9px] font-bold lowercase">
                      <Icon name="mingcute:attachment-2-line" />
                      bukti
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="flex flex-col items-center justify-center py-10 text-center opacity-40">
            <Icon name="mingcute:document-fill" size="40" class="mb-2" />
            <p class="text-xs font-bold uppercase tracking-widest">Tidak Ada Izin</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
    <!-- Modal: Opsi Upload & Kelola Foto Siswa -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showFaceUploadOptions }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-w-lg">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 border-b border-base-200/60 pb-3">
          <div>
            <h3 class="font-black text-xl text-base-content">Kelola Foto Siswa</h3>
            <p class="text-xs opacity-60">Atur foto profil dan foto presensi wajah siswa</p>
          </div>
          <button @click="showFaceUploadOptions = false" class="btn btn-sm btn-circle btn-ghost">
            <Icon name="mingcute:close-line" size="18" />
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="grid grid-cols-2 gap-2 bg-base-200/60 p-1.5 rounded-2xl mb-5">
          <button 
            type="button" 
            @click="activePhotoTab = 'upload'"
            :class="['btn btn-sm rounded-xl font-bold transition-all gap-2', activePhotoTab === 'upload' ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/60']"
          >
            <Icon name="mingcute:camera-fill" size="16" />
            <span>Unggah Foto Baru</span>
          </button>
          <button 
            type="button" 
            @click="activePhotoTab = 'sync'"
            :class="['btn btn-sm rounded-xl font-bold transition-all gap-2', activePhotoTab === 'sync' ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/60']"
          >
            <Icon name="mingcute:transfer-line" size="16" />
            <span>Sinkron & Hapus</span>
          </button>
        </div>

        <!-- TAB 1: Unggah Foto Baru -->
        <div v-if="activePhotoTab === 'upload'" class="space-y-4">
          <!-- Target Foto Selector -->
          <div class="space-y-2 bg-base-200/30 p-3.5 rounded-2xl border border-base-200/60">
            <label class="text-xs font-black text-base-content/70 uppercase tracking-wider block">1. Pilih Target Foto yang Diperbarui:</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button 
                type="button"
                @click="selectedPhotoType = 'both'"
                :class="['btn btn-xs rounded-xl font-bold text-[10px]', selectedPhotoType === 'both' ? 'btn-primary' : 'btn-ghost bg-base-100']"
              >
                Profil &amp; Wajah
              </button>
              <button 
                type="button"
                @click="selectedPhotoType = 'profile'"
                :class="['btn btn-xs rounded-xl font-bold text-[10px]', selectedPhotoType === 'profile' ? 'btn-primary' : 'btn-ghost bg-base-100']"
              >
                Foto Profil
              </button>
              <button 
                type="button"
                @click="selectedPhotoType = 'face'"
                :class="['btn btn-xs rounded-xl font-bold text-[10px]', selectedPhotoType === 'face' ? 'btn-primary' : 'btn-ghost bg-base-100']"
              >
                Wajah Absensi
              </button>
            </div>
          </div>

          <!-- Method Selector -->
          <div class="space-y-2">
            <label class="text-xs font-black text-base-content/70 uppercase tracking-wider block">2. Pilih Metode Pengambilan Foto:</label>
            <div class="grid grid-cols-1 gap-2.5">
              <!-- Kamera -->
              <button @click="startCamera" class="btn btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary rounded-2xl flex items-center justify-between px-5 h-14 transition-all">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name="mingcute:camera-fill" size="22" />
                  </div>
                  <div class="text-left">
                    <p class="font-bold text-sm">Ambil Foto dari Kamera</p>
                    <p class="text-[11px] text-base-content/50">Gunakan webcam / kamera HP/laptop</p>
                  </div>
                </div>
                <Icon name="mingcute:right-line" size="18" class="text-base-content/30" />
              </button>

              <!-- Galeri -->
              <button @click="$refs.faceFileInputHelper.click()" class="btn btn-ghost bg-base-200/50 hover:bg-success/10 hover:text-success rounded-2xl flex items-center justify-between px-5 h-14 transition-all">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                    <Icon name="mingcute:pic-fill" size="22" />
                  </div>
                  <div class="text-left">
                    <p class="font-bold text-sm">Pilih Berkas dari Galeri</p>
                    <p class="text-[11px] text-base-content/50">Unggah berkas foto dari perangkat</p>
                  </div>
                </div>
                <Icon name="mingcute:right-line" size="18" class="text-base-content/30" />
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: Sinkron & Hapus Foto -->
        <div v-else class="space-y-4">
          <!-- Section Sinkronisasi -->
          <div class="space-y-2">
            <label class="text-xs font-black text-base-content/70 uppercase tracking-wider block">1. Sinkronisasi Antar Foto:</label>
            <div class="grid grid-cols-1 gap-2.5">
              <button @click="syncStudentPhotoDirection('FACE_TO_PROFILE')" :disabled="isSyncingStudentPhotos" class="btn btn-ghost bg-base-200/50 hover:bg-info/10 hover:text-info rounded-2xl flex items-center justify-between px-5 h-14 transition-all text-left">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
                    <Icon name="mingcute:face-fill" size="22" />
                  </div>
                  <div>
                    <p class="font-bold text-sm">Wajah Absensi ➔ Foto Profil</p>
                    <p class="text-[11px] text-base-content/50">Salin foto wajah absensi untuk foto profil</p>
                  </div>
                </div>
                <Icon name="mingcute:transfer-line" size="18" class="text-base-content/30" />
              </button>

              <button @click="syncStudentPhotoDirection('PROFILE_TO_FACE')" :disabled="isSyncingStudentPhotos" class="btn btn-ghost bg-base-200/50 hover:bg-amber-500/10 hover:text-amber-500 rounded-2xl flex items-center justify-between px-5 h-14 transition-all text-left">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Icon name="mingcute:user-4-fill" size="22" />
                  </div>
                  <div>
                    <p class="font-bold text-sm">Foto Profil ➔ Wajah Absensi</p>
                    <p class="text-[11px] text-base-content/50">Salin foto profil untuk wajah absensi</p>
                  </div>
                </div>
                <Icon name="mingcute:transfer-line" size="18" class="text-base-content/30" />
              </button>
            </div>
          </div>

          <!-- Section Hapus Foto -->
          <div class="space-y-2 border-t border-base-200/60 pt-3">
            <label class="text-xs font-black text-rose-500 uppercase tracking-wider block">2. Tindakan Hapus Foto:</label>
            <div class="flex flex-col gap-2">
              <button @click="deleteStudentPhotoNow('both')" class="btn btn-ghost bg-error/10 text-error hover:bg-error/20 rounded-2xl flex items-center justify-between px-5 h-12 transition-all">
                <div class="flex items-center gap-3">
                  <Icon name="mingcute:delete-2-fill" size="18" />
                  <span class="font-bold text-xs">Hapus Kedua Foto (Profil &amp; Wajah)</span>
                </div>
              </button>

              <div class="grid grid-cols-2 gap-2">
                <button @click="deleteStudentPhotoNow('profile')" class="btn btn-ghost bg-error/5 text-error hover:bg-error/15 rounded-xl font-bold text-xs h-10">
                  Hapus Foto Profil
                </button>
                <button @click="deleteStudentPhotoNow('face')" class="btn btn-ghost bg-error/5 text-error hover:bg-error/15 rounded-xl font-bold text-xs h-10">
                  Hapus Wajah Absensi
                </button>
              </div>
            </div>
          </div>
        </div>

        <input ref="faceFileInputHelper" type="file" class="hidden" accept="image/*" @change="onFaceFileSelect" />

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
    <!-- ====== Profile Section End -->
  </div>
</template>
