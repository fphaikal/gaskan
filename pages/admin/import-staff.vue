<script setup>
import { ref, computed, onMounted } from 'vue';
const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Bulk Import Staff | GASKAN',
  description: 'Import data Admin & Guru masal menggunakan Excel with local preview',
});

// State
const fileInput = ref(null);
const selectedFile = ref(null);
const importing = ref(false);
const validating = ref(false);
const isDragging = ref(false);
const step = ref(0); // 0: Upload, 1: Preview, 2: Success
const previewData = ref([]);
const errors = ref([]);
const fatalError = ref('');
const stats = ref({ total: 0 });

// Load XLSX from CDN
const loadXLSX = () => {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    document.head.appendChild(script);
  });
};

const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
    await handlePreview();
  }
};

const onDrop = async (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file) {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      selectedFile.value = file;
      await handlePreview();
    } else {
      $toast.error('File harus berupa Excel (.xlsx atau .xls)');
    }
  }
};

const handlePreview = async () => {
  if (!selectedFile.value) return;
  validating.value = true;
  errors.value = [];
  previewData.value = [];
  try {
    const XLSX = await loadXLSX();
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length < 2) throw new Error('File kosong');
        const headers = rows[0].map(h => String(h || '').trim());
        const expected = ['Nama Lengkap*', 'Role (ADMIN/GURU)*', 'NIS (Username)*'];
        for (let i = 0; i < expected.length; i++) {
          if (headers[i] !== expected[i]) {
            throw new Error(`Format header salah pada kolom ${i+1}. Ditemukan: "${headers[i] || 'Kosong'}", Seharusnya: "${expected[i]}".`);
          }
        }
        const parsedData = [];
        const localErrors = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const name = String(row[0] || '').trim();
          const role = String(row[1] || '').trim().toUpperCase();
          const nis = String(row[2] || '').trim();
          const email = row[3] ? String(row[3]).trim() : '';
          
          if (!name && !role && !nis) continue;
          
          const rowErrors = [];
          if (!name) rowErrors.push('Nama wajib diisi');
          if (!role) rowErrors.push('Role wajib diisi');
          else if (role !== 'ADMIN' && role !== 'GURU') rowErrors.push('Role harus ADMIN atau GURU');
          if (!nis) rowErrors.push('NIS/Username wajib diisi');

          if (rowErrors.length > 0) localErrors.push(...rowErrors.map(e => `Baris ${i + 1}: ${e}`));

          parsedData.push({ 
            name: name || '[KOSONG]', 
            role: role || '-', 
            nis, 
            email, 
            status: rowErrors.length > 0 ? 'ERROR' : 'READY',
            rowErrors 
          });
        }
        errors.value = localErrors;
        previewData.value = parsedData; 
        stats.value.total = parsedData.length; 
        step.value = 1;
      } catch (err) {
        fatalError.value = err.message;
      } finally {
        validating.value = false;
        if (fileInput.value) fileInput.value.value = '';
      }
    };
    reader.readAsArrayBuffer(selectedFile.value);
  } catch (e) {
    fatalError.value = 'Gagal membaca file atau file rusak';
    validating.value = false;
  }
};

const handleImport = async () => {
  if (!selectedFile.value) return;
  importing.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    const res = await $fetch('/api/users/import', { method: 'POST', body: formData });
    if (res.success) { $toast.success(res.message); step.value = 2; }
  } catch (e) { $toast.error('Gagal import'); }
  finally { importing.value = false; }
};

const reset = () => { step.value = 0; selectedFile.value = null; previewData.value = []; errors.value = []; fatalError.value = ''; };

const downloadTemplate = async () => {
  try {
    const res = await fetch('/api/users/template');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Template_Staff.xlsx'; a.click();
  } catch (e) { $toast.error('Gagal download'); }
};

const bentoCard = "bg-base-100/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 transition-all duration-500";
</script>

<template>
  <div class="max-w-6xl mx-auto py-4 md:py-8 px-4 space-y-6 md:space-y-8 min-h-[80vh] relative z-10">
    <!-- Background Accents -->
    <div class="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/5 blur-[120px]"></div>
    </div>

    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12 bg-base-100/40 border border-white/5 p-6 md:p-8 rounded-[2rem] backdrop-blur-xl shadow-sm">
      <div>
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
            <Icon name="mingcute:upload-3-fill" size="28" />
          </div>
          <h1 class="text-3xl md:text-4xl font-black tracking-tight">
            <span class="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Import</span> Staff
          </h1>
        </div>
        <p class="text-sm md:text-base text-base-content/60 font-medium max-w-xl">
          Tambahkan data guru dan administrator secara massal dengan mudah. Unggah file Excel sesuai format yang telah disediakan.
        </p>
      </div>
    </div>

    <!-- Step Indicator -->
    <Transition name="fade">
      <div v-if="step > 0" class="flex justify-center mb-10 w-full">
        <div class="flex items-center justify-center w-full max-w-2xl relative">
          <!-- Background Line -->
          <div class="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1.5 bg-base-200 rounded-full z-0"></div>
          <!-- Active Line -->
          <div class="absolute left-8 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full z-0 transition-all duration-700 ease-out" :style="{ width: step === 0 ? '0%' : step === 1 ? '50%' : 'calc(100% - 4rem)' }"></div>
          
          <div class="w-full flex justify-between z-10 px-2">
            <!-- Step 1 -->
            <div class="flex flex-col items-center gap-2">
              <div :class="['w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-500', step >= 0 ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-600/30 scale-110' : 'bg-base-100 border-2 border-base-200 text-base-content/40']">
                <Icon name="mingcute:upload-2-fill" size="24" />
              </div>
              <span :class="['text-xs font-bold transition-colors mt-1', step >= 0 ? 'text-violet-600' : 'text-base-content/40']">Upload</span>
            </div>
            <!-- Step 2 -->
            <div class="flex flex-col items-center gap-2">
              <div :class="['w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-500', step >= 1 ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-600/30 scale-110' : 'bg-base-100 border-2 border-base-200 text-base-content/40']">
                <Icon name="mingcute:check-2-fill" size="24" />
              </div>
              <span :class="['text-xs font-bold transition-colors mt-1', step >= 1 ? 'text-violet-600' : 'text-base-content/40']">Validasi</span>
            </div>
            <!-- Step 3 -->
            <div class="flex flex-col items-center gap-2">
              <div :class="['w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black transition-all duration-500', step >= 2 ? 'bg-gradient-to-br from-success to-emerald-500 text-white shadow-xl shadow-success/30 scale-110' : 'bg-base-100 border-2 border-base-200 text-base-content/40']">
                <Icon name="mingcute:flag-4-fill" size="24" />
              </div>
              <span :class="['text-xs font-bold transition-colors mt-1', step >= 2 ? 'text-success' : 'text-base-content/40']">Selesai</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Step 0: Upload -->
    <Transition name="fade-slide" mode="out-in">
      <div v-if="step === 0" class="flex flex-col lg:grid lg:grid-cols-5 gap-6 md:gap-8">
        
        <!-- Upload (with Drag & Drop) -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          :class="[
            bentoCard, 
            'lg:col-span-3 order-1 lg:order-2 border-dashed border-2 relative overflow-hidden group transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center',
            isDragging ? 'border-violet-600 bg-violet-600/5 scale-[1.01]' : 'border-base-200/60 bg-base-200/20'
          ]"
        >
          <!-- Dropzone Pattern Background -->
          <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0); background-size: 24px 24px;"></div>
          
          <div v-if="!fatalError" class="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/5 blur-[80px] rounded-full group-hover:bg-violet-600/10 transition-all duration-500"></div>

          <div v-if="fatalError" class="relative z-10 w-full max-w-lg px-6 text-center py-6 animate-in zoom-in-95 duration-300">
            <div class="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4 shadow-lg shadow-rose-500/10">
              <Icon name="mingcute:alert-line" size="28" />
            </div>
            <h3 class="text-lg font-bold text-base-content mb-2 tracking-tight">Format File Tidak Sesuai</h3>
            <div class="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 mb-6 text-xs text-rose-600 font-bold whitespace-pre-line leading-relaxed">
              {{ fatalError }}
            </div>
            <button @click="reset" class="btn bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-xl px-8 h-10 font-bold shadow-md shadow-violet-600/20 transition-all hover:scale-105 active:scale-95 text-sm">
              Mulai Lagi
            </button>
          </div>

          <div v-else class="h-full flex flex-col items-center justify-center py-6 relative z-10 text-center w-full">
            <div 
              :class="[
                'w-16 h-16 rounded-2xl shadow-md border flex items-center justify-center mb-4 transition-all duration-500',
                isDragging ? 'bg-violet-600 text-white scale-110 shadow-violet-600/30' : 'bg-base-100 border-base-200 group-hover:scale-110'
              ]"
            >
               <Icon v-if="!validating" name="mingcute:upload-2-fill" size="28" :class="isDragging ? 'text-white' : 'text-violet-600'" />
               <span v-else class="loading loading-spinner loading-md text-violet-600"></span>
            </div>
            <div class="max-w-xs">
              <h3 class="text-base font-extrabold mb-1 tracking-tight">
                {{ isDragging ? 'Lepaskan File Staff' : 'Pilih File Staff' }}
              </h3>
              <p class="text-xs text-base-content/40 mb-4 font-medium">
                {{ isDragging ? 'Siap memproses data staff' : 'Pilih template .xlsx Admin/Guru Anda' }}
              </p>
              <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />
              <button @click="fileInput.click()" class="btn bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl px-6 h-10 w-full md:w-auto font-bold text-sm shadow-[0_4px_12px_rgb(124,58,237,0.2)] hover:shadow-[0_6px_16px_rgb(124,58,237,0.3)] transition-all hover:-translate-y-0.5" :disabled="validating">
                {{ validating ? 'Memvalidasi...' : 'Mulai Sekarang' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="lg:col-span-2 order-2 lg:order-1 space-y-6 text-left">
          <div :class="[bentoCard, 'bg-gradient-to-br from-base-100/80 to-violet-50/10']">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 flex items-center justify-center text-violet-600 mb-4 md:mb-6 shadow-sm border border-violet-600/10">
              <Icon name="mingcute:book-2-fill" size="24" />
            </div>
            <h2 class="text-xl md:text-2xl font-black mb-4">Petunjuk Staff</h2>
            <ul class="space-y-3 text-sm text-base-content/70 mb-8">
              <li v-for="(item, i) in ['Gunakan template resmi.', 'Role: Tulis ADMIN atau GURU.', 'Gunakan NIS atau Email sebagai ID.', 'Password default: password123']" :key="i" class="flex gap-3">
                <div class="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center text-[10px] font-black text-violet-600 shrink-0">{{ i+1 }}</div>
                <span>{{ item }}</span>
              </li>
            </ul>
            
            <!-- Download Template Banner -->
            <div class="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-5 relative overflow-hidden group cursor-pointer shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all hover:-translate-y-1" @click="downloadTemplate">
               <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
               <div class="relative z-10 flex items-center justify-between">
                  <div>
                     <h3 class="text-white font-black text-lg mb-1">Butuh Template?</h3>
                     <p class="text-violet-50 text-xs font-medium">Download format excel yang valid.</p>
                  </div>
                  <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform shadow-inner">
                     <Icon name="mingcute:download-2-fill" size="24" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: Preview -->
      <div v-else-if="step === 1" class="space-y-4 md:space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="text-center md:text-left">
            <h2 class="text-2xl md:text-3xl font-black">Preview Staff</h2>
            <p v-if="errors.length" class="text-xs font-bold text-rose-500">Terdeteksi {{ errors.length }} kesalahan data</p>
            <p v-else class="text-xs text-base-content/50">Cek data sebelum disimpan</p>
          </div>
          <div class="flex flex-col-reverse md:flex-row gap-2">
             <button @click="reset" class="btn btn-ghost border-base-200 hover:bg-base-200/50 rounded-xl h-10 px-5 transition-all text-sm font-semibold">Ganti File</button>
             <button @click="handleImport" class="btn bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl px-6 h-10 shadow-[0_4px_12px_rgb(124,58,237,0.2)] hover:shadow-[0_6px_16px_rgb(124,58,237,0.3)] transition-all hover:-translate-y-0.5 font-bold text-sm" :disabled="importing || errors.length > 0">
               <span v-if="importing" class="loading loading-spinner loading-xs"></span> 
               {{ importing ? 'Mengimport...' : 'Simpan Data' }}
             </button>
          </div>
        </div>

        <div :class="[bentoCard, 'p-0 overflow-hidden rounded-2xl md:rounded-[2.5rem]']">
          <div class="overflow-x-auto max-h-[400px] md:max-h-[500px] custom-scrollbar">
            <table class="table table-sm md:table-lg w-full border-separate border-spacing-0 min-w-max">
              <thead class="sticky top-0 z-10 bg-base-100 shadow-sm">
                <tr class="bg-base-200/50 text-base-content/50 uppercase text-[9px] md:text-[10px] tracking-widest font-black">
                  <th class="pl-4 md:pl-8 py-4">Nama Staff</th>
                  <th>Role</th>
                  <th class="hidden md:table-cell">NIS/Email</th>
                  <th class="pr-4 md:pr-8 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-200/40 text-left">
                <tr v-for="(user, idx) in previewData" :key="idx" :class="[user.status === 'ERROR' ? 'bg-rose-50/50 hover:bg-rose-100/50' : 'hover:bg-base-200/20']">
                  <td class="pl-4 md:pl-8 py-3 font-bold text-sm md:text-base" :class="user.status === 'ERROR' && !user.name.includes('[') ? 'text-rose-600' : ''">{{ user.name }}</td>
                  <td><span class="badge badge-outline text-[9px] font-black uppercase">{{ user.role }}</span></td>
                  <td class="hidden md:table-cell text-xs text-base-content/60">{{ user.nis || user.email }}</td>
                  <td class="pr-4 md:pr-8 text-right">
                    <div v-if="user.status === 'ERROR'" class="flex flex-col items-end gap-1">
                      <div class="flex items-center gap-1 text-rose-500 font-black text-[10px]">
                        <Icon name="mingcute:alert-fill" size="14" />
                        ERROR
                      </div>
                      <div class="text-[8px] text-rose-400 font-medium leading-tight max-w-[150px]">
                        {{ user.rowErrors.join(', ') }}
                      </div>
                    </div>
                    <Icon v-else name="mingcute:check-circle-fill" class="text-success" size="18" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-3 bg-base-200/30 border-t flex justify-center text-[10px] font-black text-base-content/40 uppercase">Total: {{ stats.total }} Staff</div>
        </div>
      </div>

      <!-- Step 2: Success -->
      <div v-else-if="step === 2" class="max-w-md mx-auto text-center py-6 px-4">
        <div :class="[bentoCard, 'flex flex-col items-center']">
           <div class="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center mb-6 relative">
              <Icon name="mingcute:check-fill" size="40" />
           </div>
           <h2 class="text-2xl font-black mb-2">Berhasil!</h2>
           <p class="text-sm text-base-content/50 mb-8 text-center">Data staff telah disimpan.</p>
           <div class="flex flex-col md:flex-row gap-3 w-full">
             <button @click="reset" class="btn btn-ghost border-base-200 hover:bg-base-200/50 rounded-xl h-10 w-full transition-all text-sm font-semibold">Import Lagi</button>
             <NuxtLink to="/admin/users" class="btn bg-gradient-to-r from-success to-emerald-500 hover:from-success hover:to-emerald-600 text-white border-0 rounded-xl h-10 w-full shadow-[0_4px_12px_rgb(34,197,94,0.2)] hover:shadow-[0_6px_16px_rgb(34,197,94,0.3)] transition-all hover:-translate-y-0.5 font-bold text-sm flex items-center justify-center">Selesai</NuxtLink>
           </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-20px); }
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.1); border-radius: 10px; }
</style>
