<script setup>
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

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

const onFaceFileChange = async (e) => {
  const files = e.target.files;
  if (files && files[0]) {
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      $toast.error('Ukuran file foto maksimal adalah 5MB!');
      if (faceFileInput.value) faceFileInput.value.value = '';
      return;
    }

    isUploadingFace.value = true;
    try {
      const reader = new FileReader();
      const fileDataUrl = await new Promise((resolve, reject) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const faceDetected = await detectFaceInBrowser(fileDataUrl);
      if (!faceDetected) {
        $toast.error('Wajah tidak terdeteksi pada foto! Harap pastikan foto menampilkan wajah Anda dengan jelas.');
        isUploadingFace.value = false;
        if (faceFileInput.value) faceFileInput.value.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);

      const res = await $fetch(`/api/students/${user.value.id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        const updated = await $fetch(`/api/user?role=siswa&user=${nis}`);
        user.value = updated;
        $toast.success('Foto wajah absensi berhasil diperbarui');
      }
    } catch (error) {
      $toast.error(error.data?.statusMessage || 'Gagal mengunggah foto wajah');
    } finally {
      isUploadingFace.value = false;
      if (faceFileInput.value) faceFileInput.value.value = '';
    }
  }
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
            <div class="relative z-30 mx-auto -mt-16 h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-base-100 p-1.5 shadow-md">
              <div class="relative z-20 h-full w-full mx-auto rounded-full overflow-hidden bg-base-200">
                <img :src="user.url_picture" alt="profile photo" class="h-full w-full object-cover object-center" />
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
                @click="$refs.faceFileInput.click()" 
                class="btn btn-primary btn-sm w-full rounded-xl font-bold h-10 gap-2"
                :disabled="isUploadingFace"
              >
                <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:upload-2-fill" size="16" />
                {{ user.faceUrl ? 'Ganti Foto Wajah' : 'Unggah Foto Wajah' }}
              </button>
              <input 
                ref="faceFileInput"
                type="file" 
                class="hidden" 
                accept="image/*"
                @change="onFaceFileChange"
              />
            </div>
          </div>
        </div>

        <!-- Attendance Log Block -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative">
          <div class="flex items-center justify-between mb-5 pb-3 border-b border-base-200/60">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Log Kehadiran Terbaru</h4>
            <span class="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg uppercase">10 Terakhir</span>
          </div>
          
          <div v-if="user.attendances && user.attendances.length > 0" class="flex flex-col gap-4">
            <div v-for="log in user.attendances" :key="log.id" class="flex items-center justify-between group">
              <div class="flex items-center gap-3">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center transition-colors', 
                  log.status === 'HADIR' ? 'bg-success/10 text-success' : 
                  log.status === 'TERLAMBAT' ? 'bg-warning/10 text-warning' : 
                  'bg-error/10 text-error'
                ]">
                  <Icon :name="log.status === 'HADIR' ? 'mingcute:check-2-fill' : 'mingcute:time-fill'" size="20" />
                </div>
                <div>
                  <p class="text-xs font-bold text-base-content">{{ log.status }}</p>
                  <p class="text-[10px] font-medium text-base-content/40">
                    {{ new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}, 
                    {{ new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                  </p>
                </div>
              </div>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                 <div class="badge badge-ghost badge-xs text-[8px] font-bold uppercase tracking-tighter">{{ log.method }}</div>
              </div>
            </div>
          </div>
          
          <div v-else class="flex flex-col items-center justify-center py-10 text-center opacity-40">
            <Icon name="mingcute:empty-box-line" size="40" class="mb-2" />
            <p class="text-xs font-bold uppercase tracking-widest">Belum Ada Data</p>
          </div>
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
    <!-- ====== Profile Section End -->
  </div>
</template>
