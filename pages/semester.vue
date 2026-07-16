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

// Fetch semesters
const fetchSemesters = async () => {
  loading.value = true;
  try {
    const [semData, ayData] = await Promise.all([
      $fetch('/api/semester'),
      $fetch('/api/academic-years')
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

const runPromotion = async () => {
  if (!promoForm.value.targetSemesterId) return;
  saving.value = true;
  try {
    const res = await $fetch('/api/system/promote', { 
      method: 'POST', 
      body: { targetSemesterId: promoForm.value.targetSemesterId } 
    });
    $toast.success(`Kenaikan kelas selesai: ${res.data.promoted} naik, ${res.data.graduated} lulus`);
    showPromotionModal.value = false;
  } catch (e) {
    $toast.error('Gagal memproses kenaikan kelas');
  } finally {
    saving.value = false;
  }
};

const bentoCard = "bg-base-100 rounded-3xl p-6 transition-all duration-300";
</script>

<template>
  <div class="space-y-6">
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
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md z-10">
            <div class="p-6 border-b border-base-200/40 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Icon name="mingcute:calendar-add-fill" size="20" />
                </div>
                <h3 class="text-lg font-black text-base-content">{{ editMode ? 'Edit Semester' : 'Tambah Semester' }}</h3>
              </div>
              <button @click="showModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>
            <div class="p-6 space-y-4">
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
            <div class="p-6 pt-0 flex gap-3">
              <button @click="showModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="saveSemester" :disabled="saving || !form.name || !form.startDate || !form.endDate"
                class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 flex-1 rounded-2xl font-black shadow-lg shadow-orange-500/20">
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                {{ editMode ? 'Simpan Perubahan' : 'Tambah Semester' }}
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
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md z-10">
            <div class="p-6 border-b border-base-200/40">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Icon name="mingcute:arrow-up-circle-fill" size="24" />
                </div>
                <h3 class="text-lg font-black text-base-content">Proses Kenaikan Kelas</h3>
              </div>
              <p class="text-sm text-base-content/50 font-medium pl-13">Siswa akan dipindahkan ke tingkat berikutnya. Siswa kelas XII akan menjadi Alumni.</p>
            </div>
            <div class="p-6">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Semester Tujuan</span></label>
                <select v-model="promoForm.targetSemesterId" class="select select-bordered w-full rounded-2xl font-bold">
                  <option value="" disabled>Pilih Semester Tujuan</option>
                  <option v-for="s in semesters" :key="s.id" :value="s.id">{{ s.name }} {{ s.academicYear?.year }}</option>
                </select>
              </div>
            </div>
            <div class="p-6 pt-0 flex gap-3">
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
