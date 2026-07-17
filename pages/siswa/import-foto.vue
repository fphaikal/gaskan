<script setup>
import { ref, computed } from 'vue';

const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Bulk Upload Foto Siswa | GASKAN',
  description: 'Upload foto profil siswa masal dengan pencocokan nama file otomatis',
});

// State
const fileInput = ref(null);
const selectedFiles = ref([]);
const matchBy = ref('auto'); // auto, nis, nisn, email
const uploading = ref(false);
const isDragging = ref(false);
const uploadResult = ref(null);

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

  // Prevent duplicate files in selection
  newFiles.forEach(file => {
    if (!selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.value.push(file);
    }
  });
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const clearSelection = () => {
  selectedFiles.value = [];
  uploadResult.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const triggerUpload = async () => {
  if (selectedFiles.value.length === 0) {
    $toast.error('Silakan pilih minimal satu file foto');
    return;
  }

  uploading.value = true;
  uploadResult.value = null;

  try {
    const formData = new FormData();
    formData.append('matchBy', matchBy.value);
    
    selectedFiles.value.forEach(file => {
      formData.append('photos', file);
    });

    const res = await $fetch('/api/students/bulk-photos', {
      method: 'POST',
      body: formData,
    });

    if (res?.success) {
      uploadResult.value = res.data;
      $toast.success(res.message || 'Bulk upload foto berhasil selesai');
      // Clear files after successful upload
      selectedFiles.value = [];
    } else {
      $toast.error(res?.message || 'Gagal mengupload foto');
    }
  } catch (error) {
    console.error('[BULK-UPLOAD-PHOTOS]', error);
    $toast.error(error.data?.message || 'Terjadi kesalahan saat mengupload foto');
  } finally {
    uploading.value = false;
  }
};
</script>

<template>
  <div class="px-4 pb-12 max-w-7xl mx-auto py-6">
    <!-- Header -->
    <div class="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <NuxtLink to="/siswa" class="btn btn-ghost btn-circle btn-sm">
            <Icon name="mingcute:left-line" size="24" />
          </NuxtLink>
          <h1 class="text-3xl font-extrabold tracking-tight text-base-content">Bulk Upload Foto Siswa</h1>
        </div>
        <p class="text-base-content/60 text-sm ml-10">Upload foto profil siswa secara masal dengan pencocokan nama file otomatis</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Upload Panel -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Setup Match Type Card -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
            <Icon name="mingcute:settings-6-line" class="text-primary" size="20" />
            Pengaturan Pencocokan
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-bold text-base-content/75">Metode Cocok</span>
              </label>
              <select v-model="matchBy" class="select select-bordered rounded-2xl bg-base-100 text-base-content">
                <option value="auto">Auto (NIS / NISN / Email / Nama)</option>
                <option value="nis">NIS (Contoh: 12345.jpg)</option>
                <option value="nisn">NISN (Contoh: 0098765432.png)</option>
                <option value="email">Email (Contoh: siswa@sekolah.sch.id.webp)</option>
                <option value="name">Nama Lengkap/Sebagian (Contoh: Budiman Setiawan.jpg)</option>
              </select>
            </div>
            <div class="flex items-center text-xs text-base-content/60 bg-base-200/40 border border-base-200 p-4 rounded-2xl leading-relaxed mt-2 md:mt-8">
              <Icon name="mingcute:information-line" class="mr-2 text-primary shrink-0" size="18" />
              <span>Sistem akan membaca nama file asli foto Anda (tanpa ekstensi), membersihkan prefix seperti <code>nis_</code> atau <code>profile_</code>, dan mencocokkannya ke database sesuai metode terpilih.</span>
            </div>
          </div>
        </div>

        <!-- Dropzone Card -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          :class="[
            'border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] shadow-inner bg-base-100',
            isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-base-300 hover:border-primary/50'
          ]"
        >
          <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
            <Icon name="mingcute:pic-line" size="36" />
          </div>
          <h3 class="text-xl font-bold text-base-content mb-1">Pilih atau Tarik File Foto</h3>
          <p class="text-base-content/50 text-sm mb-6 max-w-sm leading-relaxed">
            Format yang diizinkan: JPEG, PNG, WEBP. Maksimal ukuran file 5MB per foto.
          </p>
          <button @click="fileInput.click()" class="btn btn-primary rounded-2xl px-6 shadow-md shadow-primary/20">
            <Icon name="mingcute:upload-2-line" />
            Pilih Foto
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

        <!-- Selected Queue Card -->
        <div v-if="selectedFiles.length > 0" class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-base-content flex items-center gap-2">
              <Icon name="mingcute:list-check-line" class="text-primary" size="20" />
              Daftar Foto Dipilih ({{ selectedFiles.length }})
            </h2>
            <button @click="clearSelection" class="btn btn-ghost btn-xs text-error rounded-xl">Hapus Semua</button>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1">
            <div 
              v-for="(file, idx) in selectedFiles" :key="file.name + idx"
              class="group relative border border-base-200 rounded-2xl p-3 bg-base-200/10 hover:bg-base-200/30 transition-all flex flex-col gap-2.5 overflow-hidden"
            >
              <!-- Thumbnail preview using local object URL -->
              <div class="w-full aspect-square rounded-xl bg-base-200 border border-base-300 overflow-hidden relative shadow-inner">
                <img :src="URL.createObjectURL(file)" class="w-full h-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-base-content truncate" :title="file.name">{{ file.name }}</p>
                <p class="text-[10px] text-base-content/40 font-mono mt-0.5">{{ (file.size / (1024 * 1024)).toFixed(2) }} MB</p>
              </div>
              <button 
                @click="removeFile(idx)" 
                class="absolute top-4 right-4 btn btn-circle btn-xs btn-error shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="mingcute:close-line" size="14" />
              </button>
            </div>
          </div>

          <div class="mt-8 border-t border-base-200/60 pt-6 flex justify-end gap-3">
            <button @click="clearSelection" :disabled="uploading" class="btn btn-ghost rounded-2xl px-6">Batal</button>
            <button @click="triggerUpload" :disabled="uploading" class="btn btn-primary rounded-2xl px-8 shadow-lg shadow-primary/20">
              <span v-if="uploading" class="loading loading-spinner"></span>
              <Icon v-else name="mingcute:upload-cloud-line" />
              Upload & Sinkronkan
            </button>
          </div>
        </div>

      </div>

      <!-- Results Sidebar Panel -->
      <div class="space-y-6">
        
        <!-- Instructions / Guidelines -->
        <div class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm">
          <h2 class="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
            <Icon name="mingcute:book-open-line" class="text-primary" size="20" />
            Panduan Penamaan File
          </h2>
          <div class="space-y-4 text-sm leading-relaxed text-base-content/75">
            <p>Untuk efisiensi maksimal, silakan namai file foto Anda sebelum diupload:</p>
            <ul class="list-disc pl-5 space-y-2">
              <li><strong>Menggunakan NIS</strong>: Namai file seperti <code>230104.jpg</code>.</li>
              <li><strong>Menggunakan NISN</strong>: Namai file seperti <code>0098765432.png</code>.</li>
              <li><strong>Menggunakan Nama</strong>: Namai file seperti <code>Budiman Setiawan.jpg</code> atau <code>budiman-setiawan.png</code>. Kata kunci nama akan dicocokkan otomatis.</li>
              <li><strong>Prefix Tambahan</strong>: Sistem mendukung pembersihan prefix otomatis seperti <code>nis_12345.png</code> atau <code>profile_budiman.webp</code>.</li>
            </ul>
            <p class="text-xs text-base-content/40 italic">Pastikan format gambar yang diupload adalah JPG, PNG, atau WEBP.</p>
          </div>
        </div>

        <!-- Upload Status / Summary Card -->
        <div v-if="uploadResult" class="bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 class="text-lg font-bold text-base-content flex items-center gap-2">
            <Icon name="mingcute:task-fill" class="text-success" size="20" />
            Hasil Upload Massal
          </h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-success/5 border border-success/20 p-4 rounded-2xl flex flex-col items-center">
              <span class="text-2xl font-black text-success">{{ uploadResult.successCount }}</span>
              <span class="text-[10px] uppercase font-bold text-success/60 mt-1">Berhasil</span>
            </div>
            <div class="bg-error/5 border border-error/20 p-4 rounded-2xl flex flex-col items-center">
              <span class="text-2xl font-black text-error">{{ uploadResult.failCount }}</span>
              <span class="text-[10px] uppercase font-bold text-error/60 mt-1">Gagal</span>
            </div>
          </div>

          <div v-if="uploadResult.failList && uploadResult.failList.length > 0" class="space-y-3 pt-2">
            <h3 class="text-xs font-black uppercase text-base-content/40 tracking-wider">Rincian Kegagalan</h3>
            <div class="max-h-48 overflow-y-auto border border-base-200 rounded-2xl p-2.5 space-y-2 bg-base-200/10 custom-scrollbar">
              <div 
                v-for="(fail, idx) in uploadResult.failList" :key="fail.filename + idx"
                class="text-xs border-b border-base-200/50 last:border-0 pb-2 last:pb-0"
              >
                <p class="font-bold text-base-content truncate">{{ fail.filename }}</p>
                <p class="text-error mt-0.5 font-medium leading-relaxed">{{ fail.reason }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Complete Detailed Results Modal/Table below if there are results -->
    <div v-if="uploadResult && uploadResult.successList && uploadResult.successList.length > 0" class="mt-8 bg-base-100 border border-base-200/80 rounded-3xl p-6 shadow-sm">
      <h2 class="text-lg font-bold text-base-content mb-6 flex items-center gap-2">
        <Icon name="mingcute:check-circle-line" class="text-success" size="20" />
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
