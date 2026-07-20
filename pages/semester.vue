<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { role } = storeToRefs(useAuthStore());
const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Manajemen Semester | GASKAN',
  description: 'Kelola semester akademik',
});

// State
const semesters = ref([]);
const academicYears = ref([]);
const loading = ref(true);
const showModal = ref(false);
const showAYModal = ref(false);
const showPromotionModal = ref(false);
const showDeleteModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const deleteId = ref(null);

const form = ref({
  id: null,
  name: '',
  academicYearId: '',
  startDate: '',
  endDate: '',
  isActive: false,
});

const ayForm = ref({
  year: '',
  isActive: false
});

const promoForm = ref({
  targetSemesterId: ''
});

// Actions
const openCreate = () => {
  editMode.value = false;
  form.value = { 
    id: null, 
    name: '', 
    academicYearId: academicYears.value.find(ay => ay.isActive)?.id || '',
    startDate: '', 
    endDate: '', 
    isActive: false 
  };
  showModal.value = true;
};

const openEdit = (semester) => {
  editMode.value = true;
  form.value = {
    id: semester.id,
    name: semester.name,
    academicYearId: semester.academicYearId,
    startDate: semester.startDate?.split('T')[0] || '',
    endDate: semester.endDate?.split('T')[0] || '',
    isActive: semester.isActive,
  };
  showModal.value = true;
};

const saveSemester = async () => {
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      academicYearId: form.value.academicYearId,
      startDate: new Date(form.value.startDate).toISOString(),
      endDate: new Date(form.value.endDate).toISOString(),
      isActive: form.value.isActive,
    };

    // Peringatan jika mengaktifkan semester yang sudah lewat
    if (payload.isActive) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(payload.endDate);
      if (endDate < today) {
        $toast.error('Tidak dapat mengaktifkan semester yang telah lewat dari tanggal berakhirnya.');
        saving.value = false;
        return;
      }
    }

    if (editMode.value && form.value.id) {
      await $fetch(`/api/semester/${form.value.id}`, { method: 'PUT', body: payload });
      $toast.success('Semester berhasil diperbarui');
    } else {
      await $fetch('/api/semester', { method: 'POST', body: payload });
      $toast.success('Semester berhasil ditambahkan');
    }

    showModal.value = false;
    await fetchSemesters();
  } catch (e) {
    console.error('Save failed:', e);
    $toast.error('Gagal menyimpan semester: ' + (e?.data?.message || e?.message || 'Unknown error'));
  } finally {
    saving.value = false;
  }
};

const activateSemester = async (semester) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(semester.endDate);
  if (endDate < today) {
    $toast.error('Tidak dapat mengaktifkan semester yang telah lewat dari tanggal berakhirnya.');
    return;
  }

  try {
    await $fetch(`/api/semester/${semester.id}/activate`, { method: 'PUT' });
    $toast.success(`Semester ${semester.name} berhasil diaktifkan`);
    await fetchSemesters();
  } catch (e) {
    console.error('Activate failed:', e);
    $toast.error('Gagal mengaktifkan semester: ' + (e?.data?.message || 'Terjadi kesalahan'));
  }
};

const deleteSemester = async () => {
  if (!deleteId.value) return;
  try {
    await $fetch(`/api/semester/${deleteId.value}`, { method: 'DELETE' });
    $toast.success('Semester berhasil dihapus');
    showDeleteModal.value = false;
    await fetchSemesters();
  } catch (e) {
    console.error('Delete failed:', e);
    $toast.error('Gagal menghapus semester');
  } finally {
    deleteId.value = null;
  }
};

const confirmDelete = (id) => {
  deleteId.value = id;
  showDeleteModal.value = true;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const saveAcademicYear = async () => {
  saving.value = true;
  try {
    await $fetch('/api/academic-years', { method: 'POST', body: ayForm.value });
    $toast.success('Tahun ajaran berhasil ditambahkan');
    showAYModal.value = false;
    await fetchSemesters();
  } catch (e) {
    $toast.error('Gagal menambah tahun ajaran');
  } finally {
    saving.value = false;
  }
};

const alumniOnDevice = ref([]);
const selectedAlumniIds = ref([]);
const showDetachModal = ref(false);
const detaching = ref(false);
const promotionStep = ref(0);
const promotionResult = ref(null);

const fetchAlumniDeviceStatus = async () => {
  try {
    const res = await $fetch('/api/system/alumni-device-status').catch(() => null);
    alumniOnDevice.value = res?.data?.alumni || res?.alumni || [];
  } catch (e) {
    console.error('Error fetching alumni device status:', e);
  }
};

// Fetch semesters
const fetchSemesters = async () => {
  loading.value = true;
  try {
    const [semData, ayData] = await Promise.all([
      $fetch('/api/semester'),
      $fetch('/api/academic-years'),
      fetchAlumniDeviceStatus()
    ]);
    semesters.value = semData?.data || [];
    academicYears.value = ayData?.data || [];
  } catch (e) {
    console.error('Failed to fetch data:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSemesters);

const runPromotion = async () => {
  if (!promoForm.value.targetSemesterId) return;
  saving.value = true;
  promotionStep.value = 1;
  promotionResult.value = null;

  try {
    await new Promise((r) => setTimeout(r, 600));
    promotionStep.value = 2;
    await new Promise((r) => setTimeout(r, 800));
    promotionStep.value = 3;

    const res = await $fetch('/api/system/promote', { 
      method: 'POST', 
      body: { targetSemesterId: promoForm.value.targetSemesterId } 
    });

    promotionResult.value = res?.data || res;
    promotionStep.value = 4;
    $toast.success(`Kenaikan kelas selesai: ${res?.data?.promoted || 0} naik, ${res?.data?.graduated || 0} lulus`);
    await fetchSemesters();
  } catch (e) {
    $toast.error('Gagal memproses kenaikan kelas');
    promotionStep.value = 0;
  } finally {
    saving.value = false;
  }
};

const toggleSelectAlumni = (id) => {
  if (selectedAlumniIds.value.includes(id)) {
    selectedAlumniIds.value = selectedAlumniIds.value.filter((item) => item !== id);
  } else {
    selectedAlumniIds.value.push(id);
  }
};

const toggleSelectAllAlumni = () => {
  if (selectedAlumniIds.value.length === alumniOnDevice.value.length) {
    selectedAlumniIds.value = [];
  } else {
    selectedAlumniIds.value = alumniOnDevice.value.map((a) => a.id);
  }
};

const handleDetachAlumni = async () => {
  if (selectedAlumniIds.value.length === 0) {
    $toast.error('Pilih minimal 1 alumni yang ingin dilepas dari mesin');
    return;
  }
  detaching.value = true;
  try {
    const res = await $fetch('/api/system/alumni-detach', {
      method: 'POST',
      body: { studentIds: selectedAlumniIds.value }
    });
    $toast.success(res?.message || 'Berhasil melepas alumni dari mesin');
    showDetachModal.value = false;
    selectedAlumniIds.value = [];
    await fetchSemesters();
  } catch (e) {
    $toast.error('Gagal melepas alumni dari mesin');
  } finally {
    detaching.value = false;
  }
};

const bentoCard = "bg-base-100 rounded-3xl p-6 transition-all duration-300";
</script>

<template>
  <div class="space-y-6">
    <!-- ⚠️ ALUMNI WARNING BANNER -->
    <div v-if="alumniOnDevice.length > 0" class="bg-amber-500/15 border border-amber-500/40 rounded-3xl p-5 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
      <div class="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Icon name="mingcute:alert-fill" size="24" class="animate-pulse" />
        </div>
        <div>
          <h4 class="text-sm font-black text-white">
            Peringatan Keamanan Perangkat Hikvision ({{ alumniOnDevice.length }} Alumni Terdeteksi)
          </h4>
          <p class="text-xs text-amber-200/80 mt-0.5">
            Terdapat {{ alumniOnDevice.length }} siswa berstatus ALUMNI yang datanya masih aktif di mesin scan wajah.
          </p>
        </div>
      </div>

      <button
        @click="selectedAlumniIds = alumniOnDevice.map(a => a.id); showDetachModal = true"
        class="btn bg-amber-500 hover:bg-amber-600 text-black border-0 rounded-xl font-black text-xs shrink-0"
      >
        <Icon name="mingcute:settings-6-fill" size="16" />
        Kelola & Detach Alumni
      </button>
    </div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-base-content">Manajemen Akademik</h1>
        <p class="text-sm text-base-content/40 font-medium mt-0.5">Kelola tahun ajaran, semester, dan kenaikan kelas</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button @click="showAYModal = true" class="btn btn-ghost border border-base-200 rounded-2xl gap-2 font-black">
          <Icon name="mingcute:calendar-add-fill" size="18" />
          <span class="whitespace-nowrap">Tahun Ajaran</span>
        </button>
        <button @click="navigateTo('/reshuffle')" class="btn btn-ghost border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-2xl gap-2 font-black">
          <Icon name="mingcute:transfer-4-line" size="18" />
          <span class="whitespace-nowrap">Reshuffle Kelas</span>
        </button>
        <button @click="showPromotionModal = true" class="btn bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-2xl gap-2 font-black shadow-lg shadow-amber-500/20">
          <Icon name="mingcute:arrow-up-circle-fill" size="18" />
          <span class="whitespace-nowrap">Naik Kelas</span>
        </button>
        <button @click="openCreate" class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl gap-2 font-black shadow-lg shadow-orange-500/20">
          <Icon name="mingcute:add-fill" size="18" />
          Tambah Semester
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-dots loading-lg text-orange-500"></span>
    </div>

    <div v-else-if="semesters.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="semester in semesters" :key="semester.id"
        :class="['bg-base-100 rounded-3xl p-6 border shadow-sm transition-all hover:shadow-md overflow-hidden', semester.isActive ? 'border-orange-500/40 ring-2 ring-orange-500/20' : 'border-base-200/60']">
        <!-- Active top bar -->
        <div v-if="semester.isActive" class="h-1 bg-gradient-to-r from-orange-500 to-amber-400 -mx-6 -mt-6 mb-6 rounded-t-3xl"></div>

        <div class="flex items-start justify-between mb-5 gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h3 class="text-lg font-black text-base-content truncate">{{ semester.name }}</h3>
              <span class="px-2 py-0.5 rounded-lg bg-base-200 text-[9px] font-black uppercase tracking-widest text-base-content/40">{{ semester.academicYear?.year }}</span>
              <span v-if="semester.isActive" class="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-500/20">Aktif</span>
            </div>
            <p class="text-sm text-base-content/50 font-medium flex items-center gap-1.5">
              <Icon name="mingcute:time-line" size="14" class="text-orange-500" />
              {{ formatDate(semester.startDate) }} - {{ formatDate(semester.endDate) }}
            </p>
          </div>
          <div :class="['p-3 rounded-2xl shrink-0', semester.isActive ? 'bg-orange-500/10 text-orange-500' : 'bg-base-200 text-base-content/20']">
            <Icon name="mingcute:calendar-2-fill" size="28" />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-base-200/40">
          <button v-if="!semester.isActive" @click="activateSemester(semester)"
            class="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-xl font-black gap-1.5 shadow-sm">
            <Icon name="mingcute:check-circle-fill" size="16" /> Aktifkan
          </button>
          <button @click="openEdit(semester)" class="btn btn-sm btn-ghost rounded-xl font-black gap-1.5">
            <Icon name="mingcute:edit-2-fill" size="16" /> Edit
          </button>
          <button v-if="!semester.isActive" @click="confirmDelete(semester.id)" class="btn btn-sm btn-ghost text-rose-500 hover:bg-rose-500/10 rounded-xl font-black gap-1.5">
            <Icon name="mingcute:delete-2-fill" size="16" /> Hapus
          </button>
        </div>
      </div>
    </div>



    <div v-else class="bg-base-100 rounded-3xl border border-dashed border-base-200 p-20 flex flex-col items-center justify-center opacity-40">
      <Icon name="mingcute:calendar-2-line" size="64" />
      <p class="text-sm font-black uppercase tracking-widest mt-4">Belum ada semester</p>
      <p class="text-xs font-bold mt-1">Klik "Tambah Semester" untuk memulai</p>
    </div>

    <!-- â•â•â• MODALS â•â•â• -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md z-10 max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b border-base-200/40 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Icon name="mingcute:calendar-add-fill" size="20" />
                </div>
                <h3 class="text-lg font-black text-base-content">{{ editMode ? 'Edit Semester' : 'Tambah Semester' }}</h3>
              </div>
              <button @click="showModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Tahun Ajaran</span></label>
                <select v-model="form.academicYearId" class="select select-bordered w-full rounded-2xl font-bold">
                  <option value="" disabled>Pilih Tahun Ajaran</option>
                  <option v-for="ay in academicYears" :key="ay.id" :value="ay.id">{{ ay.year }} {{ ay.isActive ? '(Aktif)' : '' }}</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Nama Semester</span></label>
                <select v-model="form.name" class="select select-bordered w-full rounded-2xl font-bold">
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="form-control">
                  <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Tanggal Mulai</span></label>
                  <input v-model="form.startDate" type="date" class="input input-bordered w-full rounded-2xl font-bold" />
                </div>
                <div class="form-control">
                  <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Tanggal Selesai</span></label>
                  <input v-model="form.endDate" type="date" class="input input-bordered w-full rounded-2xl font-bold" />
                </div>
              </div>
              <div class="flex items-center gap-3 p-4 rounded-2xl bg-base-200/30 border border-base-200/40">
                <input v-model="form.isActive" type="checkbox" class="toggle toggle-sm" style="--tglbg: rgb(249 115 22);" />
                <div>
                  <p class="text-sm font-black text-base-content">Aktifkan Semester Ini</p>
                  <p class="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">Akan menonaktifkan semester lain</p>
                </div>
              </div>
            </div>
            <div class="p-6 pt-0 flex gap-3 shrink-0">
              <button @click="showModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="saveSemester" :disabled="saving || !form.name || !form.startDate || !form.endDate"
                class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 flex-1 rounded-2xl font-black shadow-lg shadow-orange-500/20">
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                {{ editMode ? 'Simpan' : 'Tambah Semester' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAYModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showAYModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-sm z-10">
            <div class="p-6 border-b border-base-200/40 flex items-center justify-between">
              <h3 class="text-lg font-black text-base-content">Tambah Tahun Ajaran</h3>
              <button @click="showAYModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>
            <div class="p-6">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Tahun (Format: 2024/2025)</span></label>
                <input v-model="ayForm.year" type="text" placeholder="2025/2026" class="input input-bordered w-full rounded-2xl font-bold" />
              </div>
            </div>
            <div class="p-6 pt-0 flex gap-3">
              <button @click="showAYModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="saveAcademicYear" :disabled="saving || !ayForm.year"
                class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 flex-1 rounded-2xl font-black shadow-lg shadow-orange-500/20">
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>Simpan
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPromotionModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showPromotionModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
            <div class="border-b border-base-200/40 pb-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Icon name="mingcute:arrow-up-circle-fill" size="24" />
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content">Proses Kenaikan Kelas</h3>
                  <p class="text-xs text-base-content/40 font-bold">Otomatisasi & Deteksi Perangkat</p>
                </div>
              </div>
              <button @click="showPromotionModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>

            <!-- STEP TRACKER REALTIME -->
            <div v-if="promotionStep > 0" class="bg-base-200/50 rounded-2xl p-4 space-y-2">
              <h4 class="font-black text-amber-500 text-xs flex items-center gap-2">
                <span v-if="promotionStep < 4" class="loading loading-spinner loading-xs"></span>
                Status Progress Migrasi Realtime:
              </h4>
              <div class="space-y-1.5 text-xs font-bold">
                <div :class="promotionStep >= 1 ? 'text-emerald-500' : 'opacity-40'" class="flex items-center gap-2">
                  <Icon :name="promotionStep >= 1 ? 'mingcute:check-circle-fill' : 'mingcute:time-line'" size="16" />
                  1. Validasi semester & data siswa aktif
                </div>
                <div :class="promotionStep >= 2 ? 'text-emerald-500' : 'opacity-40'" class="flex items-center gap-2">
                  <Icon :name="promotionStep >= 2 ? 'mingcute:check-circle-fill' : 'mingcute:time-line'" size="16" />
                  2. Elevasi kelas (Kelas X → XI & Kelas XI → XII)
                </div>
                <div :class="promotionStep >= 3 ? 'text-emerald-500' : 'opacity-40'" class="flex items-center gap-2">
                  <Icon :name="promotionStep >= 3 ? 'mingcute:check-circle-fill' : 'mingcute:time-line'" size="16" />
                  3. Pengalihan status Kelas XII ke ALUMNI
                </div>
                <div :class="promotionStep >= 4 ? 'text-emerald-500' : 'opacity-40'" class="flex items-center gap-2">
                  <Icon :name="promotionStep >= 4 ? 'mingcute:check-circle-fill' : 'mingcute:time-line'" size="16" />
                  4. Pemeriksaan data siswa Alumni di mesin Hikvision
                </div>
              </div>
            </div>

            <div v-if="promotionStep === 0" class="space-y-4">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Semester Tujuan</span></label>
                <select v-model="promoForm.targetSemesterId" class="select select-bordered w-full rounded-2xl font-bold">
                  <option value="" disabled>Pilih Semester Tujuan</option>
                  <option v-for="s in semesters" :key="s.id" :value="s.id">{{ s.name }} {{ s.academicYear?.year }}</option>
                </select>
              </div>
            </div>

            <!-- SUMMARY & PROMPT DETACH -->
            <div v-if="promotionResult" class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-600 text-xs space-y-2">
              <p class="font-black text-sm">Migrasi Kenaikan Kelas Berhasil!</p>
              <p>✓ Berhasil Naik Kelas: <strong>{{ promotionResult.promoted || 0 }} Siswa</strong></p>
              <p>✓ Berhasil Lulus Alumni: <strong>{{ promotionResult.graduated || 0 }} Siswa</strong></p>

              <div v-if="promotionResult.alumniOnDeviceCount > 0" class="pt-2 border-t border-emerald-500/20 text-amber-600 space-y-2">
                <p class="font-bold">
                  ⚠️ Terdeteksi {{ promotionResult.alumniOnDeviceCount }} Alumni masih terdaftar di mesin Hikvision.
                </p>
                <button
                  @click="showPromotionModal = false; selectedAlumniIds = (promotionResult.alumniOnDevice || []).map(a => a.id); showDetachModal = true"
                  class="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white border-0 w-full rounded-xl font-black"
                >
                  Kelola & Detach Alumni dari Mesin
                </button>
              </div>
            </div>

            <div v-if="promotionStep === 0" class="pt-2 flex gap-3">
              <button @click="showPromotionModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="runPromotion" :disabled="saving || !promoForm.targetSemesterId"
                class="btn bg-amber-500 hover:bg-amber-600 text-white border-0 flex-1 rounded-2xl font-black shadow-lg shadow-amber-500/20">
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>Mulai Proses
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL DETACH ALUMNI HIKVISION -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetachModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showDetachModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-lg z-10 p-6 space-y-4">
            <div class="border-b border-base-200/40 pb-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Icon name="mingcute:settings-6-fill" size="24" />
                </div>
                <div>
                  <h3 class="text-lg font-black text-base-content">Kelola Detach Alumni</h3>
                  <p class="text-xs text-base-content/40 font-bold">Pilih alumni yang ingin dilepas dari mesin</p>
                </div>
              </div>
              <button @click="showDetachModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>

            <div class="flex items-center justify-between bg-base-200/50 p-3 rounded-2xl">
              <span class="font-black text-xs">Terpilih {{ selectedAlumniIds.length }} dari {{ alumniOnDevice.length }} Alumni</span>
              <button @click="toggleSelectAllAlumni" class="btn btn-xs btn-ghost text-orange-500 font-black">
                {{ selectedAlumniIds.length === alumniOnDevice.length ? 'Batal Pilih Semua' : 'Pilih Semua' }}
              </button>
            </div>

            <div class="max-h-60 overflow-y-auto rounded-2xl border border-base-200/60 divide-y divide-base-200/40">
              <div
                v-for="alumni in alumniOnDevice"
                :key="alumni.id"
                @click="toggleSelectAlumni(alumni.id)"
                :class="selectedAlumniIds.includes(alumni.id) ? 'bg-amber-500/10' : 'hover:bg-base-200/30'"
                class="p-3 flex items-center justify-between cursor-pointer transition-colors text-xs font-bold"
              >
                <div class="flex items-center gap-3">
                  <input type="checkbox" :checked="selectedAlumniIds.includes(alumni.id)" class="checkbox checkbox-sm checkbox-warning" />
                  <div>
                    <p class="font-black text-base-content">{{ alumni.name }}</p>
                    <p class="text-[10px] text-base-content/40 font-mono">NIS: {{ alumni.nis || alumni.isapiId || '-' }}</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase">Terdaftar di Alat</span>
              </div>
            </div>

            <div class="pt-2 flex gap-3 justify-between">
              <button @click="showDetachModal = false" class="btn btn-ghost rounded-2xl font-black text-xs">Biarkan Saja (Tutup)</button>
              <button
                @click="handleDetachAlumni"
                :disabled="detaching || selectedAlumniIds.length === 0"
                class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl font-black text-xs shadow-lg shadow-rose-500/20"
              >
                <span v-if="detaching" class="loading loading-spinner loading-xs"></span>
                Detach ({{ selectedAlumniIds.length }}) Alumni Terpilih
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showDeleteModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <Icon name="mingcute:alert-line" size="32" />
            </div>
            <h3 class="text-xl font-black text-base-content">Hapus Semester?</h3>
            <p class="py-4 text-sm text-base-content/50 font-medium">Tindakan ini tidak dapat dibatalkan.</p>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" class="btn btn-ghost rounded-2xl px-6 font-black">Batal</button>
              <button @click="deleteSemester" class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl px-6 font-black shadow-lg shadow-rose-500/20">Ya, Hapus</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97); }
</style>
