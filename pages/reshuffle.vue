<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import * as XLSX from 'xlsx';

useHead({
  title: 'Reshuffle & Acak Kelas | GASKAN'
});

const { $toast } = useNuxtApp();

const activeTab = ref('website'); // 'website' | 'excel'
const loading = ref(false);
const submitting = ref(false);

const classes = ref([]);
const sourceClassId = ref('');
const targetClassId = ref('');
const targetRombel = ref('');

const students = ref([]);
const selectedStudentIds = ref([]);
const searchQuery = ref('');

// Excel upload state
const excelFile = ref(null);
const excelRows = ref([]);
const excelParsing = ref(false);
const excelTemplateClassId = ref('');

const fetchClasses = async () => {
  const classRes = await $fetch('/api/classes').catch(() => null);
  classes.value = classRes?.data || classRes || [];
};

// Fetch all classes & initial students
const fetchData = async () => {
  loading.value = true;
  try {
    await fetchClasses();
    
    if (classes.value.length > 0 && !sourceClassId.value) {
      sourceClassId.value = classes.value[0].id;
    }
    await fetchSourceStudents();
  } catch (e) {
    console.error('Error fetching reshuffle data:', e);
  } finally {
    loading.value = false;
  }
};

const fetchSourceStudents = async () => {
  if (!sourceClassId.value) {
    students.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await $fetch(`/api/students?classId=${sourceClassId.value}&limit=200&status=AKTIF`).catch(() => null);
    students.value = res?.data || [];
    selectedStudentIds.value = [];
  } catch (e) {
    $toast.error('Gagal mengambil data siswa kelas asal');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

// Filtered students by search
const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value;
  const q = searchQuery.value.toLowerCase();
  return students.value.filter((s) => 
    s.name?.toLowerCase().includes(q) || 
    s.nis?.includes(q) || 
    s.nisn?.includes(q) ||
    s.rombel?.toLowerCase().includes(q)
  );
});

const isAllSelected = computed(() => {
  return filteredStudents.value.length > 0 && selectedStudentIds.value.length === filteredStudents.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedStudentIds.value = [];
  } else {
    selectedStudentIds.value = filteredStudents.value.map((s) => s.id);
  }
};

const toggleSelectStudent = (id) => {
  if (selectedStudentIds.value.includes(id)) {
    selectedStudentIds.value = selectedStudentIds.value.filter((item) => item !== id);
  } else {
    selectedStudentIds.value.push(id);
  }
};

// Confirmation Modal state
const showConfirmModal = ref(false);
const confirmMessage = ref('');
const confirmDetails = ref(null);
const pendingAction = ref(null);

const executeConfirmAction = async () => {
  if (pendingAction.value) {
    const action = pendingAction.value;
    pendingAction.value = null;
    showConfirmModal.value = false;
    await action();
  } else {
    showConfirmModal.value = false;
  }
};

// Website Reshuffle Submit
const openWebConfirm = () => {
  if (selectedStudentIds.value.length === 0) {
    $toast.error('Pilih minimal 1 siswa yang akan dipindahkan');
    return;
  }
  if (!targetClassId.value) {
    $toast.error('Pilih kelas tujuan terlebih dahulu');
    return;
  }

  const targetClassObj = classes.value.find((c) => c.id === targetClassId.value);
  const targetClassName = targetClassObj?.className || 'Kelas Tujuan';

  confirmMessage.value = `Apakah Anda yakin ingin memindahkan ${selectedStudentIds.value.length} siswa ke kelas "${targetClassName}"?`;
  confirmDetails.value = {
    count: selectedStudentIds.value.length,
    targetClass: targetClassName,
    rombel: targetRombel.value || null
  };
  pendingAction.value = handleWebReshuffle;
  showConfirmModal.value = true;
};

// Summary Modal State
const showSummaryModal = ref(false);
const summaryItems = ref([]);
const summaryTitle = ref('');

// Audit History Modal State
const showHistoryModal = ref(false);
const reshuffleLogs = ref([]);
const loadingLogs = ref(false);
const activeLogDetail = ref(null);

const fetchHistoryLogs = async () => {
  loadingLogs.value = true;
  try {
    const res = await $fetch('/api/system/reshuffle/history').catch(() => null);
    reshuffleLogs.value = res?.data || [];
  } catch (e) {
    console.error('Failed to fetch reshuffle logs:', e);
  } finally {
    loadingLogs.value = false;
  }
};

const openHistoryModal = async () => {
  showHistoryModal.value = true;
  activeLogDetail.value = null;
  await fetchHistoryLogs();
};

const resetAndContinue = () => {
  showSummaryModal.value = false;
  excelFile.value = null;
  excelRows.value = [];
  selectedStudentIds.value = [];
};

const handleWebReshuffle = async () => {
  submitting.value = true;
  showProgressModal.value = true;
  progressTitle.value = 'Memproses Reshuffle Siswa...';
  progressSubtitle.value = `Memindahkan ${selectedStudentIds.value.length} siswa ke kelas tujuan`;
  progressTotal.value = selectedStudentIds.value.length;
  progressCurrent.value = 0;
  progressPercent.value = 10;

  const timer = setInterval(() => {
    if (progressPercent.value < 90) {
      progressPercent.value += 10;
      progressCurrent.value = Math.min(progressTotal.value, Math.round((progressPercent.value / 100) * progressTotal.value));
    }
  }, 100);

  try {
    const res = await $fetch('/api/system/reshuffle', {
      method: 'POST',
      body: {
        studentIds: selectedStudentIds.value,
        targetClassId: targetClassId.value,
        rombel: targetRombel.value || null
      }
    });

    clearInterval(timer);
    progressPercent.value = 100;
    progressCurrent.value = progressTotal.value;

    summaryItems.value = res?.data?.summary || selectedStudentIds.value.map(id => {
      const st = students.value.find(s => s.id === id);
      const targetClassObj = classes.value.find(c => c.id === targetClassId.value);
      const sourceClassObj = classes.value.find(c => c.id === sourceClassId.value);
      return {
        name: st?.name || '-',
        nis: st?.nis || '-',
        fromClass: sourceClassObj?.className || 'Kelas Asal',
        toClass: targetClassObj?.className || 'Kelas Tujuan',
        rombel: targetRombel.value || '-'
      };
    });
    summaryTitle.value = `Reshuffle Berhasil! ${selectedStudentIds.value.length} Siswa Dipindahkan`;

    setTimeout(async () => {
      showProgressModal.value = false;
      selectedStudentIds.value = [];
      await fetchClasses();
      await fetchSourceStudents();
      showSummaryModal.value = true;
    }, 400);
  } catch (e) {
    clearInterval(timer);
    showProgressModal.value = false;
    $toast.error(e?.data?.message || 'Gagal memproses reshuffle siswa');
  } finally {
    submitting.value = false;
  }
};

// Download Template Excel
const handleDownloadTemplate = () => {
  const url = `/api/system/reshuffle/template${excelTemplateClassId.value ? '?classId=' + excelTemplateClassId.value : ''}`;
  window.open(url, '_blank');
};

// Handle Excel File Upload & Parse via SheetJS
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  excelFile.value = file;
  excelParsing.value = true;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows = XLSX.utils.sheet_to_json(firstSheet); // Row 1 is header (No, NIS, Nama, Rombel)

      excelRows.value = jsonRows.filter((row) => {
        const nis = row['NIS'] || row['nis'] || row['ID Siswa'] || row.id || row['NISN'] || row.nisn;
        const name = row['Nama'] || row['nama'] || row['Nama Siswa'] || row.name;
        return Boolean(nis || name);
      });

      if (excelRows.value.length === 0) {
        $toast.error('Tidak ada data siswa valid yang ditemukan di file Excel ini');
      } else {
        $toast.success(`Berhasil membaca ${excelRows.value.length} data siswa dari Excel`);
      }
    } catch (err) {
      console.error('Error parsing excel:', err);
      $toast.error('Gagal membaca file Excel. Pastikan format .xlsx valid.');
    } finally {
      excelParsing.value = false;
    }
  };

  reader.readAsArrayBuffer(file);
};

const excelTargetClassId = ref('');

// Submit Excel Reshuffle
const openExcelConfirm = () => {
  if (!excelTargetClassId.value) {
    $toast.error('Harap pilih Kelas Tujuan terlebih dahulu');
    return;
  }
  if (excelRows.value.length === 0) {
    $toast.error('Belum ada data Excel yang diunggah');
    return;
  }

  const targetClassObj = classes.value.find((c) => c.id === excelTargetClassId.value);
  const targetClassName = targetClassObj?.className || 'Kelas Tujuan';

  confirmMessage.value = `Apakah Anda yakin ingin menerapkan ${excelRows.value.length} data siswa Excel ke kelas "${targetClassName}"?`;
  confirmDetails.value = {
    count: excelRows.value.length,
    targetClass: targetClassName,
    rombel: null
  };
  pendingAction.value = handleExcelReshuffle;
  showConfirmModal.value = true;
};

const handleExcelReshuffle = async () => {
  submitting.value = true;
  showProgressModal.value = true;

  const targetClassObj = classes.value.find((c) => c.id === excelTargetClassId.value);
  const targetClassName = targetClassObj?.className || 'Kelas Tujuan';

  progressTitle.value = 'Mengimpor Data Excel...';
  progressSubtitle.value = `Memproses ${excelRows.value.length} siswa ke kelas "${targetClassName}"`;
  progressTotal.value = excelRows.value.length;
  progressCurrent.value = 0;
  progressPercent.value = 0;

  const CHUNK_SIZE = 25;
  const totalRows = excelRows.value.length;
  let processed = 0;

  summaryItems.value = excelRows.value.map(row => {
    return {
      name: row['Nama'] || row['nama'] || row['Nama Siswa'] || row.name || '-',
      nis: row['NIS'] || row['nis'] || row['ID Siswa'] || row.id || '-',
      fromClass: 'Sebelum Reshuffle',
      toClass: row['Kelas Tujuan'] || row['Kelas'] || targetClassName,
      rombel: row['Rombel'] || row['rombel'] || '-'
    };
  });
  summaryTitle.value = `Reshuffle Excel Selesai! ${totalRows} Data Siswa Berhasil Dipindahkan`;

  try {
    for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
      const chunk = excelRows.value.slice(i, i + CHUNK_SIZE);
      await $fetch('/api/system/reshuffle/import', {
        method: 'POST',
        body: {
          targetClassId: excelTargetClassId.value,
          rows: chunk
        }
      });
      processed += chunk.length;
      progressCurrent.value = Math.min(totalRows, processed);
      progressPercent.value = Math.round((progressCurrent.value / totalRows) * 100);
    }

    setTimeout(async () => {
      showProgressModal.value = false;
      excelRows.value = [];
      excelFile.value = null;
      await fetchClasses();
      await fetchSourceStudents();
      showSummaryModal.value = true;
    }, 400);
  } catch (e) {
    showProgressModal.value = false;
    $toast.error(e?.data?.message || 'Gagal mengimpor reshuffle dari Excel');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="space-y-6 pb-20 animate-in fade-in duration-500">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
      <div>
        <div class="flex items-center gap-2 text-xs font-bold text-base-content/40 mb-1">
          <NuxtLink to="/kelas" class="hover:text-primary transition-colors">Manajemen Kelas</NuxtLink>
          <span>/</span>
          <span class="text-primary">Reshuffle & Acak Kelas</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight">Reshuffle & Penataan Kelas</h1>
        <p class="text-xs text-base-content/60 mt-1">
          Pindahkan siswa antar kelas dan atur rombel (rombongan belajar) untuk persiapan tahun ajaran baru.
        </p>
      </div>

      <!-- Tab Selection Toggle -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 bg-base-200/60 rounded-2xl border border-base-300/40 shrink-0 gap-1.5 w-full sm:w-auto">
        <div class="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
          <button
            @click="activeTab = 'website'"
            :class="['px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2', activeTab === 'website' ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' : 'text-base-content/60 hover:text-base-content']"
          >
            <Icon name="mingcute:cursor-hand-line" size="16" />
            Pilih Langsung
          </button>
          <button
            @click="activeTab = 'excel'"
            :class="['px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2', activeTab === 'excel' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-base-content/60 hover:text-base-content']"
          >
            <Icon name="mingcute:file-import-fill" size="16" />
            Import Excel
          </button>
        </div>
        <button
          @click="openHistoryModal"
          class="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 text-sky-400 hover:text-white hover:bg-sky-500/20 border border-sky-500/20 w-full sm:w-auto shrink-0"
        >
          <Icon name="mingcute:history-line" size="16" />
          Riwayat Audit Log
        </button>
      </div>
    </div>

    <!-- TAB 1: RESHUFFLE SECARA WEBSITE -->
    <div v-if="activeTab === 'website'" class="space-y-6">
      
      <!-- Control Panel (Source Class -> Target Class & Rombel) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        <!-- Source Class Select -->
        <div class="md:col-span-4 bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm space-y-2">
          <label class="text-xs font-black uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
            <Icon name="mingcute:logout-box-line" class="text-amber-500" size="16" />
            1. Pilih Kelas Asal
          </label>
          <select 
            v-model="sourceClassId" 
            @change="fetchSourceStudents"
            class="select select-bordered select-sm w-full rounded-2xl font-bold text-xs focus:select-primary"
          >
            <option v-for="c in classes" :key="c.id" :value="c.id">
              {{ c.className }} ({{ c._count?.users ?? c._count?.students ?? c.studentCount ?? 0 }} siswa)
            </option>
          </select>
        </div>

        <!-- Target Class & Rombel Select -->
        <div class="md:col-span-8 bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div class="sm:col-span-6 space-y-1">
            <label class="text-xs font-black uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
              <Icon name="mingcute:login-box-line" class="text-emerald-500" size="16" />
              2. Pilih Kelas Tujuan
            </label>
            <select 
              v-model="targetClassId" 
              class="select select-bordered select-sm w-full rounded-2xl font-bold text-xs focus:select-primary"
            >
              <option value="" disabled>-- Pilih Kelas Tujuan --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">
                {{ c.className }}
              </option>
            </select>
          </div>

          <div class="sm:col-span-6 space-y-1">
            <label class="text-xs font-black uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
              <Icon name="mingcute:group-fill" class="text-sky-500" size="16" />
              Rombel Baru (Opsional)
            </label>
            <input 
              v-model="targetRombel"
              type="text" 
              placeholder="Contoh: Rombel A / 1" 
              class="input input-bordered input-sm w-full rounded-2xl font-bold text-xs focus:input-primary"
            />
          </div>
        </div>
      </div>

      <!-- Student Selection Table -->
      <div class="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        
        <!-- Search & Quick Selection Header -->
        <div class="p-5 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <input 
              type="checkbox" 
              :checked="isAllSelected" 
              @change="toggleSelectAll"
              class="checkbox checkbox-primary checkbox-sm rounded-lg"
            />
            <div>
              <h3 class="font-black text-sm text-base-content">
                Daftar Siswa ({{ selectedStudentIds.length }}/{{ filteredStudents.length }} Terpilih)
              </h3>
              <p class="text-[11px] text-base-content/50">Centang siswa yang akan dipindahkan ke kelas tujuan</p>
            </div>
          </div>

          <div class="relative w-full sm:w-64">
            <Icon name="mingcute:search-line" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size="16" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari nama, NIS, rombel..." 
              class="input input-sm input-bordered w-full pl-9 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full text-xs">
            <thead>
              <tr class="bg-base-200/40 text-[10px] uppercase tracking-wider font-black text-base-content/50">
                <th class="w-12 text-center">Pilih</th>
                <th>Siswa</th>
                <th>NIS / NISN</th>
                <th>Rombel Saat Ini</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="py-12 text-center text-base-content/40">
                  <span class="loading loading-spinner loading-md text-primary"></span>
                  <p class="mt-2 font-bold">Memuat daftar siswa...</p>
                </td>
              </tr>
              <tr v-else-if="filteredStudents.length === 0">
                <td colspan="5" class="py-12 text-center text-base-content/40 font-bold">
                  Tidak ada siswa aktif ditemukan di kelas asal ini.
                </td>
              </tr>
              <tr 
                v-else
                v-for="s in filteredStudents" 
                :key="s.id"
                @click="toggleSelectStudent(s.id)"
                :class="['cursor-pointer transition-colors', selectedStudentIds.includes(s.id) ? 'bg-primary/5' : '']"
              >
                <td class="text-center" @click.stop>
                  <input 
                    type="checkbox" 
                    :checked="selectedStudentIds.includes(s.id)"
                    @change="toggleSelectStudent(s.id)"
                    class="checkbox checkbox-primary checkbox-xs rounded"
                  />
                </td>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                      <img v-if="s.photoUrl || s.faceUrl" :src="s.photoUrl || s.faceUrl" class="w-full h-full object-cover" />
                      <span v-else>{{ s.name?.charAt(0) }}</span>
                    </div>
                    <span class="font-bold text-base-content">{{ s.name }}</span>
                  </div>
                </td>
                <td class="font-mono font-semibold text-base-content/70">
                  {{ s.nis || s.nisn || '-' }}
                </td>
                <td>
                  <span class="px-2.5 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-[10px]">
                    {{ s.rombel || 'Tanpa Rombel' }}
                  </span>
                </td>
                <td>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-black text-[9px] uppercase">
                    {{ s.status || 'AKTIF' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Floating Action Footer -->
      <div v-if="selectedStudentIds.length > 0" class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-base-100/95 backdrop-blur-xl border border-primary/30 p-3.5 sm:p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 z-50 animate-in slide-in-from-bottom duration-300">
        <div class="text-center sm:text-left">
          <p class="text-xs font-black text-white">
            {{ selectedStudentIds.length }} Siswa Terpilih
          </p>
          <p class="text-[10px] text-base-content/60">
            Akan dipindahkan ke kelas yang dipilih
          </p>
        </div>

        <button 
          @click="openWebConfirm"
          :disabled="submitting || !targetClassId"
          class="btn btn-primary btn-sm rounded-2xl font-black shadow-lg shadow-primary/30 px-6 gap-2 w-full sm:w-auto"
        >
          <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
          <Icon v-else name="mingcute:transfer-4-line" size="16" />
          Proses Reshuffle Ke Kelas Tujuan
        </button>
      </div>

    </div>

    <!-- TAB 2: RESHUFFLE VIA UPLOAD EXCEL -->
    <div v-if="activeTab === 'excel'" class="space-y-6">
      
      <!-- Step 1: Download Template -->
      <div class="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div class="md:col-span-7 space-y-1">
          <div class="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Icon name="mingcute:download-3-fill" size="16" />
            Langkah 1: Unduh Template Excel Reshuffle
          </div>
          <h3 class="text-base font-black text-base-content">Unduh File Template Pre-Filled</h3>
          <p class="text-xs text-base-content/60">
            Template 4 kolom (No, NIS, Nama, Rombel) berisi daftar siswa aktif yang siap Anda isi & edit.
          </p>
        </div>

        <div class="md:col-span-5 flex flex-col sm:flex-row items-center gap-3">
          <select v-model="excelTemplateClassId" class="select select-bordered select-sm w-full sm:w-auto rounded-2xl text-xs font-bold">
            <option value="">-- Semua Kelas --</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
          </select>

          <button 
            @click="handleDownloadTemplate"
            class="btn btn-amber bg-amber-500 hover:bg-amber-600 text-black border-0 btn-sm rounded-2xl font-black w-full sm:w-auto shrink-0 gap-2 shadow-lg shadow-amber-500/20"
          >
            <Icon name="mingcute:file-download-line" size="16" />
            Unduh Template .XLSX
          </button>
        </div>
      </div>

      <!-- Step 2: Upload Excel -->
      <div class="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Icon name="mingcute:upload-3-fill" size="16" />
            Langkah 2: Pilih Kelas Tujuan & Unggah File Excel
          </div>

          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-base-content/60 shrink-0">Kelas Tujuan:</label>
            <select v-model="excelTargetClassId" class="select select-bordered select-sm rounded-2xl font-bold text-xs focus:select-primary">
              <option value="" disabled>-- Pilih Kelas Tujuan --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
            </select>
          </div>
        </div>

        <div class="border-2 border-dashed border-base-300 rounded-3xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative bg-base-200/20">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            @change="handleFileUpload"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div class="space-y-2">
            <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/10">
              <Icon name="mingcute:upload-2-fill" size="32" />
            </div>
            <h4 class="font-black text-sm text-base-content">
              {{ excelFile ? excelFile.name : 'Klik atau drag & drop file Excel reshuffle (.xlsx) di sini' }}
            </h4>
            <p class="text-xs text-base-content/50">
              Format 4 Kolom Terbaca: <strong>No</strong> (Absen), <strong>NIS</strong>, <strong>Nama</strong>, <strong>Rombel</strong>
            </p>
          </div>
        </div>

        <!-- Excel Data Preview Table -->
        <div v-if="excelRows.length > 0" class="space-y-4 pt-4 border-t border-base-200">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase tracking-wider text-base-content">
              Preview Data Excel ({{ excelRows.length }} Siswa Terbaca)
            </h4>
            <button 
              @click="openExcelConfirm" 
              :disabled="submitting"
              class="btn btn-emerald bg-emerald-500 hover:bg-emerald-600 text-black border-0 btn-sm rounded-2xl font-black gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="mingcute:check-circle-line" size="16" />
              Proses Reshuffle Dari Excel
            </button>
          </div>

          <div class="overflow-x-auto max-h-96 rounded-2xl border border-base-200">
            <table class="table table-zebra table-compact w-full text-xs">
              <thead>
                <tr class="bg-base-200 text-[10px] uppercase font-black">
                  <th>No (Absen)</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Rombel</th>
                  <th>Kelas Tujuan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in excelRows" :key="idx">
                  <td class="font-bold text-center text-amber-400">{{ row['No'] || row['no'] || (idx + 1) }}</td>
                  <td class="font-mono font-bold">{{ row['NIS'] || row['nis'] || row['ID Siswa'] || row.id || '-' }}</td>
                  <td class="font-bold text-base-content">{{ row['Nama'] || row['nama'] || row['Nama Siswa'] || row.name || '-' }}</td>
                  <td>
                    <span class="px-2.5 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-[10px]">
                      {{ row['Rombel'] || row['rombel'] || '-' }}
                    </span>
                  </td>
                  <td>
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">
                      {{ row['Kelas Tujuan'] || row['Kelas'] || 'Sesuai Pilihan' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>

    <!-- MODAL KONFIRMASI RESHUFFLE -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirmModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showConfirmModal = false">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
          <div class="relative bg-base-100 rounded-[2.5rem] shadow-2xl w-full max-w-md z-10 p-6 sm:p-8 space-y-6 border border-primary/20 animate-in zoom-in-95 duration-200">
            
            <div class="text-center space-y-3">
              <div class="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Icon name="mingcute:transfer-4-line" size="36" />
              </div>
              <h3 class="text-xl font-black text-base-content tracking-tight">Konfirmasi Reshuffle</h3>
              <p class="text-xs text-base-content/70 font-medium leading-relaxed">
                {{ confirmMessage }}
              </p>
            </div>

            <div v-if="confirmDetails" class="bg-base-200/50 p-4 rounded-2xl border border-base-300/50 space-y-2 text-xs">
              <div class="flex justify-between items-center text-base-content/70 font-bold">
                <span>Jumlah Siswa:</span>
                <span class="text-amber-400 font-black text-sm">{{ confirmDetails.count }} Siswa</span>
              </div>
              <div class="flex justify-between items-center text-base-content/70 font-bold">
                <span>Kelas Tujuan:</span>
                <span class="text-emerald-400 font-black text-sm">{{ confirmDetails.targetClass }}</span>
              </div>
              <div v-if="confirmDetails.rombel" class="flex justify-between items-center text-base-content/70 font-bold">
                <span>Rombel Baru:</span>
                <span class="text-sky-400 font-black text-sm">{{ confirmDetails.rombel }}</span>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button @click="showConfirmModal = false" :disabled="submitting" class="btn btn-ghost flex-1 rounded-2xl font-black text-xs">
                Batal
              </button>
              <button @click="executeConfirmAction" :disabled="submitting" class="btn bg-emerald-500 hover:bg-emerald-600 text-black border-0 flex-1 rounded-2xl font-black shadow-lg shadow-emerald-500/20 gap-2 text-xs">
                <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="mingcute:check-circle-line" size="18" />
                Ya, Terapkan
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- REALTIME PROGRESS MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showProgressModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/75 backdrop-blur-md"></div>
          <div class="relative bg-base-100 rounded-[2.5rem] shadow-2xl w-full max-w-md z-10 p-6 sm:p-8 space-y-6 border border-emerald-500/30 animate-in zoom-in-95 duration-200">
            
            <div class="text-center space-y-3">
              <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-pulse">
                <Icon name="mingcute:transfer-4-line" size="36" />
              </div>
              <h3 class="text-xl font-black text-base-content tracking-tight">{{ progressTitle }}</h3>
              <p class="text-xs text-base-content/60 font-medium leading-relaxed">
                {{ progressSubtitle }}
              </p>
            </div>

            <!-- Progress Bar Indicator -->
            <div class="space-y-3 bg-base-200/40 p-4 rounded-2xl border border-base-300/40">
              <div class="flex justify-between items-center text-xs font-black">
                <span class="text-emerald-400 font-mono">{{ progressCurrent }} / {{ progressTotal }} Siswa</span>
                <span class="text-base-content/90 font-mono text-sm font-black">{{ progressPercent }}%</span>
              </div>

              <div class="w-full bg-base-200 rounded-full h-4 p-1 border border-base-300/60 overflow-hidden shadow-inner">
                <div 
                  class="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 h-full rounded-full transition-all duration-300 ease-out shadow-lg shadow-emerald-500/30"
                  :style="{ width: progressPercent + '%' }"
                ></div>
              </div>
            </div>

            <div class="text-center">
              <p class="text-[11px] text-base-content/50 font-bold flex items-center justify-center gap-2">
                <span class="loading loading-spinner loading-xs text-emerald-400"></span>
                Mohon tunggu, jangan menutup halaman...
              </p>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- SUMMARY MODAL AFTER RESHUFFLE -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSummaryModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="resetAndContinue">
          <div class="absolute inset-0 bg-black/75 backdrop-blur-md"></div>
          <div class="relative bg-base-100 rounded-[2.5rem] shadow-2xl w-full max-w-2xl z-10 p-6 sm:p-8 space-y-6 border border-emerald-500/30 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div class="text-center space-y-2 shrink-0">
              <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Icon name="mingcute:check-circle-fill" size="36" />
              </div>
              <h3 class="text-xl font-black text-base-content tracking-tight">{{ summaryTitle }}</h3>
              <p class="text-xs text-base-content/60 font-medium">
                Ringkasan rincian data siswa yang berhasil dipindahkan:
              </p>
            </div>

            <!-- Summary Table -->
            <div class="overflow-y-auto max-h-80 border border-base-200 rounded-2xl shrink-0">
              <table class="table table-zebra table-compact w-full text-xs">
                <thead>
                  <tr class="bg-base-200 text-[10px] uppercase font-black sticky top-0 z-10">
                    <th>#</th>
                    <th>Nama Siswa</th>
                    <th>NIS</th>
                    <th>Kelas Asal</th>
                    <th>Kelas Tujuan</th>
                    <th>Rombel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in summaryItems" :key="idx">
                    <td class="font-bold text-center text-amber-400">{{ idx + 1 }}</td>
                    <td class="font-bold text-base-content">{{ item.name }}</td>
                    <td class="font-mono text-base-content/60">{{ item.nis }}</td>
                    <td>
                      <span class="px-2 py-0.5 rounded-lg bg-base-200 border border-base-300 text-base-content/70 font-extrabold text-[10px]">
                        {{ item.fromClass }}
                      </span>
                    </td>
                    <td>
                      <span class="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">
                        {{ item.toClass }}
                      </span>
                    </td>
                    <td>
                      <span class="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-[10px]">
                        {{ item.rombel }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 pt-2 shrink-0">
              <button @click="resetAndContinue" class="btn btn-emerald bg-emerald-500 hover:bg-emerald-600 text-black border-0 w-full rounded-2xl font-black gap-2 shadow-lg shadow-emerald-500/20">
                <Icon name="mingcute:refresh-4-line" size="18" />
                Lanjut Reshuffle / Upload File Lagi
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- AUDIT LOG HISTORY MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showHistoryModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showHistoryModal = false">
          <div class="absolute inset-0 bg-black/75 backdrop-blur-md"></div>
          <div class="relative bg-base-100 rounded-[2.5rem] shadow-2xl w-full max-w-3xl z-10 p-6 sm:p-8 space-y-6 border border-sky-500/30 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div class="flex items-center justify-between border-b border-base-200 pb-4 shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Icon name="mingcute:history-line" size="24" />
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content">Riwayat Audit Log Reshuffle</h3>
                  <p class="text-xs text-base-content/60 font-medium">Rekaman histori pemindahan kelas oleh pengguna</p>
                </div>
              </div>
              <button @click="showHistoryModal = false" class="btn btn-ghost btn-circle btn-sm">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>

            <!-- Content Area -->
            <div class="overflow-y-auto space-y-4 pr-1 flex-1">
              <div v-if="loadingLogs" class="text-center py-12 space-y-3">
                <span class="loading loading-spinner loading-lg text-sky-400"></span>
                <p class="text-xs text-base-content/50 font-bold">Memuat riwayat audit log...</p>
              </div>

              <div v-else-if="reshuffleLogs.length === 0" class="text-center py-12 space-y-2">
                <Icon name="mingcute:inbox-line" size="48" class="text-base-content/30 mx-auto" />
                <p class="text-sm font-black text-base-content/60">Belum ada riwayat pemindahan</p>
              </div>

              <div v-else v-for="log in reshuffleLogs" :key="log.id" class="bg-base-200/40 p-5 rounded-3xl border border-base-300/50 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-300/30 pb-3">
                  <div class="flex items-center gap-2.5">
                    <span :class="['px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider', log.actionType === 'EXCEL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20']">
                      {{ log.actionType === 'EXCEL' ? 'Excel Import' : 'Pilih Langsung' }}
                    </span>
                    <span class="text-xs font-black text-base-content">{{ log.targetClassName }}</span>
                  </div>

                  <div class="text-[11px] text-base-content/50 font-mono font-bold flex items-center gap-2">
                    <Icon name="mingcute:time-line" size="14" />
                    {{ new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
                  </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div class="space-y-1">
                    <p class="text-[11px] text-base-content/60 font-bold">
                      Diproses Oleh: <strong class="text-base-content">{{ log.operatorName }}</strong> ({{ log.operatorNis }})
                    </p>
                    <p class="text-[11px] text-base-content/60 font-bold">
                      Jumlah Siswa: <strong class="text-emerald-400">{{ log.successCount }} Siswa Berhasil</strong>
                    </p>
                  </div>

                  <button 
                    @click="activeLogDetail = activeLogDetail === log.id ? null : log.id" 
                    class="btn btn-xs rounded-xl font-black gap-1.5"
                    :class="activeLogDetail === log.id ? 'btn-primary' : 'btn-ghost border border-base-300'"
                  >
                    <Icon :name="activeLogDetail === log.id ? 'mingcute:eye-close-line' : 'mingcute:eye-line'" size="14" />
                    {{ activeLogDetail === log.id ? 'Sembunyikan Rincian' : 'Lihat Rincian Siswa' }}
                  </button>
                </div>

                <!-- Expandable Detail Table -->
                <div v-if="activeLogDetail === log.id" class="pt-3 border-t border-base-300/30 animate-in fade-in duration-200">
                  <div class="overflow-x-auto max-h-60 rounded-2xl border border-base-300/60 bg-base-100">
                    <table class="table table-zebra table-compact w-full text-[11px]">
                      <thead>
                        <tr class="bg-base-200 text-[9px] uppercase font-black">
                          <th>#</th>
                          <th>Nama Siswa</th>
                          <th>NIS</th>
                          <th>Dari Kelas</th>
                          <th>Ke Kelas</th>
                          <th>Rombel</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in log.details" :key="idx">
                          <td class="font-bold text-center text-amber-400">{{ idx + 1 }}</td>
                          <td class="font-bold">{{ item.name }}</td>
                          <td class="font-mono text-base-content/60">{{ item.nis }}</td>
                          <td>{{ item.fromClass }}</td>
                          <td class="text-emerald-400 font-bold">{{ item.toClass }}</td>
                          <td class="text-sky-400 font-bold">{{ item.rombel }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            <div class="pt-2 text-right shrink-0">
              <button @click="showHistoryModal = false" class="btn btn-ghost rounded-2xl font-black text-xs px-6">
                Tutup
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
