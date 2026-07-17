<script setup>
import { ref, onUnmounted, watch, nextTick } from 'vue';

const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Bulk Upload Foto Siswa | GASKAN',
  description: 'Upload foto profil siswa masal dengan pencocokan nama file otomatis',
});

// State
const fileInput = ref(null);
const selectedFiles = ref([]); // item: { id, file, previewUrl, status: 'pending'|'uploading'|'success'|'error', errorMsg: '' }
const matchBy = ref('auto'); // auto, nis, nisn, email, name
const uploading = ref(false);
const isDragging = ref(false);
const uploadResult = ref(null);

const completedCount = ref(0);
const successCount = ref(0);
const failCount = ref(0);
const successList = ref([]);
const failList = ref([]);

// Manual link states
const showManualLinkModal = ref(false);
const fileToLink = ref(null);
const studentSearchQuery = ref('');
const studentSearchResults = ref([]);
const studentSearchPending = ref(false);
const selectedStudentToLink = ref(null);
const linkingState = ref(false);

const openManualLink = (failFilename) => {
  const item = selectedFiles.value.find(f => f.file.name === failFilename);
  if (!item) {
    $toast.error('File gambar tidak ditemukan');
    return;
  }
  fileToLink.value = item;
  studentSearchQuery.value = '';
  studentSearchResults.value = [];
  selectedStudentToLink.value = null;
  showManualLinkModal.value = true;
};

const searchStudentsForLink = async () => {
  if (!studentSearchQuery.value) {
    studentSearchResults.value = [];
    return;
  }
  studentSearchPending.value = true;
  try {
    const res = await $fetch('/api/students', {
      query: {
        search: studentSearchQuery.value,
        limit: 10,
        status: 'AKTIF'
      }
    });
    studentSearchResults.value = res?.data || [];
  } catch (e) {
    console.error('Failed to search students:', e);
  } finally {
    studentSearchPending.value = false;
  }
};

let searchDebounce = null;
watch(studentSearchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(searchStudentsForLink, 300);
});

const linkStudentAndUpload = async () => {
  if (!selectedStudentToLink.value || !fileToLink.value) return;
  linkingState.value = true;
  
  const formData = new FormData();
  formData.append('photo', fileToLink.value.file);
  
  try {
    const res = await $fetch(`/api/students/${selectedStudentToLink.value.id}/photo`, {
      method: 'POST',
      body: formData
    });
    
    if (res.success) {
      $toast.success(`Foto profil "${selectedStudentToLink.value.name}" berhasil dihubungkan!`);
      
      // Mark file as success in our local files list
      fileToLink.value.status = 'success';
      fileToLink.value.errorMsg = '';
      
      // Update uploadResult summary statistics
      if (uploadResult.value) {
        uploadResult.value.failList = uploadResult.value.failList.filter(
          f => f.filename !== fileToLink.value.file.name
        );
        uploadResult.value.failCount = uploadResult.value.failList.length;
        
        // Add to successList
        uploadResult.value.successList.push({
          filename: fileToLink.value.file.name,
          studentName: selectedStudentToLink.value.name,
          nis: selectedStudentToLink.value.nis,
          photoUrl: res.photoUrl
        });
        uploadResult.value.successCount = uploadResult.value.successList.length;
      }
      
      showManualLinkModal.value = false;
    }
  } catch (err) {
    console.error('Failed to manually link photo:', err);
    $toast.error(err.data?.message || 'Gagal mengunggah foto');
  } finally {
    linkingState.value = false;
  }
};

const onFileChange = (e) => {
  const files = Array.from(e.target.files || []);
  addFiles(files);
};

const onDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files || []);
  addFiles(files);
};

const addFiles = (files) => {
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const newFiles = files.filter(file => {
    const isValidType = validImageTypes.includes(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    const isUnderLimit = file.size <= 5 * 1024 * 1024; // 5MB limit
    if (!isValidType) $toast.error(`File "${file.name}" bukan format gambar yang diizinkan`);
    if (!isUnderLimit) $toast.error(`File "${file.name}" melebihi batas ukuran 5MB`);
    return isValidType && isUnderLimit;
  });

  newFiles.forEach(file => {
    if (!selectedFiles.value.some(item => item.file.name === file.name && item.file.size === file.size)) {
      // Safely pre-generate local preview URL on the client-side
      const previewUrl = window.URL.createObjectURL(file);
      selectedFiles.value.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
        status: 'pending',
        errorMsg: ''
      });
    }
  });
};

const removeFile = (index) => {
  const item = selectedFiles.value[index];
  if (item.previewUrl) {
    window.URL.revokeObjectURL(item.previewUrl);
  }
  selectedFiles.value.splice(index, 1);
};

const clearSelection = () => {
  selectedFiles.value.forEach(item => {
    if (item.previewUrl) {
      window.URL.revokeObjectURL(item.previewUrl);
    }
  });
  selectedFiles.value = [];
  uploadResult.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

// Clean up object URLs to prevent browser memory leaks
onUnmounted(() => {
  selectedFiles.value.forEach(item => {
    if (item.previewUrl) {
      window.URL.revokeObjectURL(item.previewUrl);
    }
  });
});

const triggerUpload = async () => {
  if (selectedFiles.value.length === 0) {
    $toast.error('Silakan pilih minimal satu file foto');
    return;
  }

  uploading.value = true;
  completedCount.value = 0;
  successCount.value = 0;
  failCount.value = 0;
  successList.value = [];
  failList.value = [];
  uploadResult.value = null;

  const total = selectedFiles.value.length;
  const queue = [...selectedFiles.value];
  const concurrencyLimit = 3; // Upload up to 3 files in parallel for efficiency

  const runUpload = async (item) => {
    item.status = 'uploading';
    try {
      const formData = new FormData();
      formData.append('matchBy', matchBy.value);
      formData.append('photos', item.file);

      const res = await $fetch('/api/students/bulk-photos', {
        method: 'POST',
        body: formData,
      });

      if (res?.success && res.data?.successCount > 0) {
        item.status = 'success';
        successCount.value++;
        successList.value.push(...res.data.successList);
      } else {
        item.status = 'error';
        const reason = res.data?.failList?.[0]?.reason || 'Siswa tidak ditemukan';
        item.errorMsg = reason;
        failCount.value++;
        failList.value.push({ filename: item.file.name, reason });
      }
    } catch (error) {
      item.status = 'error';
      const reason = error.data?.message || 'Terjadi kesalahan jaringan/server';
      item.errorMsg = reason;
      failCount.value++;
      failList.value.push({ filename: item.file.name, reason });
    } finally {
      completedCount.value++;
    }
  };

  const processQueue = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        await runUpload(item);
      }
    }
  };

  const processors = [];
  for (let i = 0; i < Math.min(concurrencyLimit, total); i++) {
    processors.push(processQueue());
  }
  await Promise.all(processors);

  // Set final result card summary
  uploadResult.value = {
    successCount: successCount.value,
    failCount: failCount.value,
    successList: successList.value,
    failList: failList.value
  };

  if (successCount.value > 0) {
    $toast.success(`Proses upload selesai. ${successCount.value} berhasil, ${failCount.value} gagal.`);
  } else {
    $toast.error('Gagal mengupload foto siswa');
  }
  
  uploading.value = false;
};

const bentoCard = "bg-base-100/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 transition-all duration-500";
</script>

<template>
  <div class="max-w-6xl mx-auto py-4 md:py-8 px-4 space-y-6 md:space-y-8 min-h-[80vh] relative z-10">
    <!-- Background Accents -->
    <div class="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px]"></div>
    </div>

    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12 bg-base-100/40 border border-white/5 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl shadow-sm">
      <div class="flex items-center gap-4">
        <NuxtLink to="/siswa" class="btn btn-ghost btn-circle rounded-xl hover:bg-base-200/50">
          <Icon name="mingcute:left-line" size="24" class="text-base-content/80" />
        </NuxtLink>
        <div>
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Icon name="mingcute:pic-fill" size="24" />
            </div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-base-content">
              <span class="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">Bulk Upload</span> Foto Siswa
            </h1>
          </div>
          <p class="text-sm text-base-content/60 font-medium ml-1">Upload foto profil siswa secara masal dengan pencocokan nama file otomatis</p>
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:grid lg:grid-cols-5 gap-6 md:gap-8">
      
      <!-- Left Column: Instructions & Setup -->
      <div class="lg:col-span-2 space-y-6 text-left">
        <!-- Instructions Card -->
        <div :class="[bentoCard, 'bg-gradient-to-br from-base-100/80 to-orange-50/10']">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center text-orange-500 mb-4 md:mb-6 shadow-sm border border-orange-500/10">
            <Icon name="mingcute:book-2-fill" size="24" />
          </div>
          <h2 class="text-xl md:text-2xl font-black text-base-content mb-4 tracking-tight">Petunjuk</h2>
          <ul class="space-y-3 md:space-y-4">
            <li v-for="(item, i) in [
              'Namai file dengan <b>NIS</b> (230104.jpg) atau <b>NISN</b> (009876.png).',
              'Dapat menggunakan <b>Nama Lengkap</b> (Budiman Setiawan.jpg) sebagai nama file.',
              'Sistem mendukung pembersihan prefix otomatis seperti <code>nis_12345.png</code>.',
              'Format gambar wajib <b>JPG/JPEG, PNG, atau WEBP</b>.',
              'Ukuran maksimum file <b>5MB per foto</b>.'
            ]" :key="i" class="flex gap-3 items-start text-sm text-base-content/70">
              <div class="mt-1 w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-black text-orange-500 shrink-0">{{ i+1 }}</div>
              <span v-html="item"></span>
            </li>
          </ul>
        </div>

        <!-- Setup Match Type Card -->
        <div :class="bentoCard">
          <h2 class="text-lg font-extrabold text-base-content mb-4 flex items-center gap-2">
            <Icon name="mingcute:settings-6-fill" class="text-orange-500" size="20" />
            Pengaturan Pencocokan
          </h2>
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-bold text-base-content/75">Metode Cocok</span>
            </label>
            <select v-model="matchBy" class="select select-bordered rounded-2xl bg-base-100 text-base-content focus:border-orange-500 focus:outline-none">
              <option value="auto">Auto (NIS / NISN / Email / Nama)</option>
              <option value="nis">NIS (Contoh: 12345.jpg)</option>
              <option value="nisn">NISN (Contoh: 0098765432.png)</option>
              <option value="email">Email (Contoh: siswa@sekolah.sch.id.webp)</option>
              <option value="name">Nama Lengkap/Sebagian (Contoh: Budiman Setiawan.jpg)</option>
            </select>
          </div>
          <div class="flex items-start text-xs text-base-content/60 bg-base-200/40 border border-base-200 p-4 rounded-2xl leading-relaxed mt-5">
            <Icon name="mingcute:information-line" class="mr-2 text-orange-500 shrink-0 mt-0.5" size="18" />
            <span>Sistem otomatis membersihkan prefix angka baris (seperti <code>1. </code> atau <code>15 </code>) dan kode kamera (seperti <code>DSC_</code> atau <code>IMG_</code>) pada nama file.</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Dropzone & Selection Queue -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Dropzone -->
        <div 
          v-if="!uploading && !uploadResult"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          :class="[
            bentoCard,
            'border-dashed border-2 relative overflow-hidden group transition-all duration-300 min-h-[350px] flex flex-col items-center justify-center',
            isDragging ? 'border-orange-500 bg-orange-500/5 scale-[1.01]' : 'border-base-200/60 bg-base-200/20'
          ]"
        >
          <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0); background-size: 24px 24px;"></div>
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full group-hover:bg-orange-500/10 transition-all duration-500"></div>

          <div class="h-full flex flex-col items-center justify-center py-6 text-center w-full relative z-10">
            <div class="w-20 h-20 rounded-[2rem] bg-orange-500/15 text-orange-500 flex items-center justify-center mb-6 shadow-md border border-orange-500/10">
              <Icon name="mingcute:pic-line" size="36" />
            </div>
            <h3 class="text-xl font-black text-base-content mb-2">Pilih atau Tarik File Foto</h3>
            <p class="text-base-content/50 text-sm mb-6 max-w-sm leading-relaxed">
              Seret file foto siswa Anda ke sini atau klik tombol di bawah untuk memilih file.
            </p>
            <button @click="fileInput.click()" class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl px-8 shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95">
              Pilih File Foto
            </button>
            <input 
              ref="fileInput"
              type="file" 
              multiple 
              accept="image/*" 
              class="hidden" 
              @change="onFileChange" 
            />
          </div>
        </div>

        <!-- Selection Queue -->
        <div v-if="selectedFiles.length > 0" :class="bentoCard">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-base-content flex items-center gap-2">
              <Icon name="mingcute:list-check-line" class="text-orange-500" size="20" />
              Daftar Foto Dipilih ({{ selectedFiles.length }})
            </h2>
            <button v-if="!uploading" @click="clearSelection" class="btn btn-ghost btn-xs text-rose-500 rounded-xl hover:bg-rose-500/10">Hapus Semua</button>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            <div 
              v-for="(item, idx) in selectedFiles" :key="item.id"
              class="group relative border rounded-2xl p-3 bg-base-200/10 hover:bg-base-200/30 transition-all flex flex-col gap-2 overflow-hidden"
              :class="{
                'border-orange-500/40': item.status === 'uploading',
                'border-emerald-500/40': item.status === 'success',
                'border-rose-500/40': item.status === 'error',
                'border-base-200/60': item.status === 'pending'
              }"
            >
              <div class="w-full aspect-square rounded-xl bg-base-200 border border-base-300 overflow-hidden relative shadow-inner">
                <img :src="item.previewUrl" class="w-full h-full object-cover" />
                
                <!-- Status Overlay Icon -->
                <div v-if="item.status !== 'pending'" class="absolute inset-0 bg-black/45 flex items-center justify-center text-white backdrop-blur-[1px] transition-all">
                  <div v-if="item.status === 'uploading'" class="loading loading-spinner loading-md text-orange-400"></div>
                  <Icon v-else-if="item.status === 'success'" name="mingcute:check-circle-fill" class="text-emerald-400 animate-in zoom-in-50 duration-300" size="32" />
                  <Icon v-else-if="item.status === 'error'" name="mingcute:close-circle-fill" class="text-rose-400 animate-in zoom-in-50 duration-300" size="32" />
                </div>
              </div>
              
              <div class="min-w-0 text-left">
                <p class="text-xs font-bold text-base-content truncate" :title="item.file.name">{{ item.file.name }}</p>
                <p v-if="item.status === 'error'" class="text-[10px] text-rose-500 font-bold mt-0.5 truncate" :title="item.errorMsg">
                  {{ item.errorMsg }}
                </p>
                <p v-else class="text-[10px] text-base-content/40 font-mono mt-0.5">
                  {{ (item.file.size / (1024 * 1024)).toFixed(2) }} MB
                </p>
              </div>

              <button 
                v-if="item.status === 'pending' && !uploading"
                @click="removeFile(idx)" 
                class="absolute top-4 right-4 btn btn-circle btn-xs btn-error shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="mingcute:close-line" size="14" />
              </button>
            </div>
          </div>

          <!-- Concrete Progress Bar -->
          <div v-if="uploading" class="space-y-2 mt-6">
            <div class="flex justify-between items-center text-xs font-bold text-base-content/75">
              <span class="flex items-center gap-1.5">
                <span class="loading loading-spinner loading-xs text-orange-500"></span>
                Sedang mengupload foto siswa...
              </span>
              <span>{{ completedCount }} / {{ selectedFiles.length }} ({{ Math.round((completedCount / selectedFiles.length) * 100) }}%)</span>
            </div>
            <progress class="progress progress-warning w-full h-2.5 rounded-full" :value="completedCount" :max="selectedFiles.length"></progress>
          </div>

          <div v-if="!uploading" class="mt-8 border-t border-base-200/60 pt-6 flex justify-end gap-3">
            <button @click="clearSelection" class="btn btn-ghost rounded-2xl px-6">Batal / Reset</button>
            <button @click="triggerUpload" class="btn bg-orange-500 hover:bg-orange-600 border-0 text-white rounded-2xl px-8 shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95">
              <Icon name="mingcute:upload-cloud-line" />
              Upload & Sinkronkan
            </button>
          </div>
        </div>

        <!-- Upload Status / Summary Card -->
        <div v-if="uploadResult" :class="bentoCard" class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-bold text-base-content flex items-center gap-2">
              <Icon name="mingcute:task-fill" class="text-emerald-500" size="20" />
              Hasil Upload Massal
            </h2>
            <button @click="clearSelection" class="btn btn-ghost btn-sm rounded-2xl text-xs font-bold hover:bg-base-200/60">Upload Foto Baru</button>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex flex-col items-center">
              <span class="text-2xl font-black text-emerald-500">{{ uploadResult.successCount }}</span>
              <span class="text-[10px] uppercase font-bold text-emerald-500/60 mt-1">Berhasil</span>
            </div>
            <div class="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl flex flex-col items-center">
              <span class="text-2xl font-black text-rose-500">{{ uploadResult.failCount }}</span>
              <span class="text-[10px] uppercase font-bold text-rose-500/60 mt-1">Gagal</span>
            </div>
          </div>

          <div v-if="uploadResult.failList && uploadResult.failList.length > 0" class="space-y-3 pt-2">
            <h3 class="text-xs font-black uppercase text-base-content/40 tracking-wider text-left">Rincian Kegagalan</h3>
            <div class="max-h-64 overflow-y-auto border border-base-200 rounded-2xl p-2.5 space-y-2 bg-base-200/10 custom-scrollbar text-left">
              <div 
                v-for="(fail, idx) in uploadResult.failList" :key="fail.filename + idx"
                class="text-xs border-b border-base-200/50 last:border-0 pb-2.5 last:pb-0 flex items-start justify-between gap-4"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-base-content truncate">{{ fail.filename }}</p>
                  <p class="text-rose-500 mt-0.5 font-medium leading-relaxed">{{ fail.reason }}</p>
                </div>
                <button 
                  @click="openManualLink(fail.filename)"
                  class="btn btn-ghost btn-xs text-primary font-bold shrink-0 hover:bg-primary/10 rounded-lg h-7 px-2.5"
                >
                  <Icon name="mingcute:user-link-line" class="mr-1" />
                  Hubungkan
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Complete Detailed Results Table below if there are results -->
    <div v-if="uploadResult && uploadResult.successList && uploadResult.successList.length > 0" :class="bentoCard" class="text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 class="text-lg font-bold text-base-content mb-6 flex items-center gap-2">
        <Icon name="mingcute:check-circle-line" class="text-emerald-500" size="20" />
        Foto Siswa Berhasil Diperbarui
      </h2>
      <div class="overflow-x-auto">
        <table class="table table-md w-full">
          <thead>
            <tr class="bg-base-200/50 text-base-content/50 uppercase text-[10px] tracking-wider font-bold">
              <th>No</th>
              <th>Nama File</th>
              <th>Nama Siswa</th>
              <th>Identitas</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(success, idx) in uploadResult.successList" :key="success.filename + idx">
              <td class="font-mono text-xs text-base-content/30">{{ idx + 1 }}</td>
              <td class="font-bold text-sm text-base-content">{{ success.filename }}</td>
              <td>{{ success.studentName }}</td>
              <td class="font-mono text-xs">{{ success.nis }}</td>
              <td>
                <div class="avatar">
                  <div class="w-10 h-10 rounded-xl overflow-hidden border border-base-300">
                    <img :src="success.photoUrl" class="object-cover" />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Manual Link Modal -->
    <dialog :class="['modal sm:modal-middle', showManualLinkModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-[2rem] p-6 sm:p-8 max-w-md overflow-visible text-left">
        <h3 class="text-2xl font-black text-base-content mb-2">Pilih Siswa Manual</h3>
        <p class="text-xs text-base-content/50 font-medium mb-6">
          Hubungkan file foto berikut ke data profil siswa secara manual.
        </p>

        <div v-if="fileToLink" class="space-y-4">
          <!-- Photo Thumbnail and Filename -->
          <div class="flex items-center gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-200/80">
            <div class="w-14 h-14 rounded-xl overflow-hidden bg-base-200 border border-base-300 shrink-0 shadow-inner">
              <img :src="fileToLink.previewUrl" class="w-full h-full object-cover" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-sm text-base-content truncate">{{ fileToLink.file.name }}</p>
              <p class="text-[10px] text-base-content/40 font-mono mt-0.5">
                {{ (fileToLink.file.size / (1024 * 1024)).toFixed(2) }} MB
              </p>
            </div>
          </div>

          <!-- Search Input -->
          <div class="form-control relative">
            <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Cari Nama / NIS / NISN Siswa</span></label>
            <div class="relative">
              <Icon name="mingcute:search-line" class="absolute left-4 top-1/2 -translate-y-1/2 opacity-35" size="18" />
              <input 
                v-model="studentSearchQuery"
                type="text" 
                placeholder="Ketik nama siswa..." 
                class="input input-bordered w-full pl-11 bg-base-200/30 rounded-2xl font-bold"
                @input="searchStudentsForLink"
              />
            </div>
          </div>

          <!-- Search Results -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Pilih Hasil Pencarian</label>
            <div class="max-h-40 overflow-y-auto border border-base-200 rounded-2xl p-2 bg-base-200/20 custom-scrollbar space-y-1">
              <div v-if="studentSearchPending" class="text-center py-6 text-xs text-base-content/40 font-bold flex items-center justify-center gap-1.5 animate-pulse">
                <span class="loading loading-spinner loading-xs text-primary"></span>
                Mencari siswa...
              </div>
              <div v-else-if="studentSearchResults.length === 0" class="text-center py-8 text-xs text-base-content/30 italic">
                {{ studentSearchQuery ? 'Siswa tidak ditemukan' : 'Ketik nama siswa di atas untuk mencari' }}
              </div>
              <button 
                v-else
                v-for="s in studentSearchResults" :key="s.id"
                @click="selectedStudentToLink = s"
                type="button"
                :class="[
                  'w-full text-left p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-colors border',
                  selectedStudentToLink?.id === s.id 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-base-100 text-base-content border-transparent hover:bg-base-200/55'
                ]"
              >
                <div>
                  <p class="font-black text-sm">{{ s.name }}</p>
                  <p class="text-[10px] font-medium text-base-content/40 mt-0.5">NIS: {{ s.nis }} | Kelas: {{ s.class?.className || 'N/A' }}</p>
                </div>
                <Icon 
                  v-if="selectedStudentToLink?.id === s.id" 
                  name="mingcute:checkbox-fill" 
                  class="text-primary shrink-0" 
                  size="18" 
                />
              </button>
            </div>
          </div>
        </div>

        <div class="modal-action flex justify-between gap-4 mt-8">
          <button @click="showManualLinkModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold" :disabled="linkingState">Batal</button>
          <button 
            @click="linkStudentAndUpload" 
            class="btn btn-primary rounded-2xl flex-1 font-bold shadow-lg shadow-primary/20" 
            :disabled="linkingState || !selectedStudentToLink"
          >
            <span v-if="linkingState" class="loading loading-spinner loading-xs mr-1"></span>
            Hubungkan
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="!linkingState && (showManualLinkModal = false)">
        <button :disabled="linkingState">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--bc), 0.1);
  border-radius: 10px;
}
</style>
