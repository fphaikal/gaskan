<script setup>
import { ref, onMounted, computed } from 'vue';
const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Manajemen Kelas | GASKAN',
  description: 'Kelola data kelas dan jurusan',
});

// State
const classes = ref([]);
const majors = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const showDeleteModal = ref(false);
const deleteId = ref(null);

const form = ref({
  id: null,
  majorId: '',
  grade: 10,
  section: '',
  isActive: true,
});

const searchQuery = ref('');
const selectedGrade = ref('');
const selectedMajor = ref('');

const filteredClasses = computed(() => {
  return classes.value.filter(cls => {
    const matchesSearch = cls.className.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          cls.major?.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesGrade = !selectedGrade.value || cls.grade === parseInt(selectedGrade.value);
    const matchesMajor = !selectedMajor.value || cls.majorId === selectedMajor.value;
    return matchesSearch && matchesGrade && matchesMajor;
  });
});

const computedClassName = computed(() => {
  if (!form.value.grade || !form.value.majorId || !form.value.section) return '';
  const romanGrades = { 10: 'X', 11: 'XI', 12: 'XII' };
  const major = majors.value.find(m => m.id === form.value.majorId);
  if (!major) return '';
  return `${romanGrades[form.value.grade]} ${major.alias} ${form.value.section.toUpperCase()}`;
});

const isDuplicate = computed(() => {
  if (!computedClassName.value) return false;
  return classes.value.some(cls => cls.className === computedClassName.value && cls.id !== form.value.id);
});

// Fetch initial data
const fetchData = async () => {
  loading.value = true;
  try {
    const [classData, majorData] = await Promise.all([
      $fetch('/api/classes'),
      $fetch('/api/classes/majors')
    ]);
    classes.value = classData?.data || [];
    majors.value = majorData?.data || [];
  } catch (e) {
    console.error('Failed to fetch data:', e);
  } finally {
    loading.value = false;
  }
};

const fetchClasses = fetchData; // Alias for compatibility

onMounted(fetchData);

// Actions
const openCreate = () => {
  editMode.value = false;
  form.value = { id: null, majorId: '', grade: 10, section: '', isActive: true };
  showModal.value = true;
};

const openEdit = (cls) => {
  editMode.value = true;
  form.value = {
    id: cls.id,
    majorId: cls.majorId,
    grade: cls.grade,
    section: cls.section || '',
    isActive: cls.isActive,
  };
  showModal.value = true;
};

const saveClass = async () => {
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (editMode.value && form.value.id) {
      await $fetch(`/api/classes/${form.value.id}`, { method: 'PUT', body: payload });
    } else {
      await $fetch('/api/classes', { method: 'POST', body: payload });
    }
    showModal.value = false;
    $toast.success(editMode.value ? 'Kelas berhasil diperbarui' : 'Kelas berhasil ditambahkan');
    await fetchClasses();
  } catch (e) {
    console.error('Save class failed:', e);
    $toast.error('Gagal menyimpan kelas: ' + (e?.data?.message || e?.message || 'Unknown error'));
  } finally {
    saving.value = false;
  }
};

const deleteClass = async () => {
  if (!deleteId.value) return;
  try {
    await $fetch(`/api/classes/${deleteId.value}`, { method: 'DELETE' });
    $toast.success('Kelas berhasil dihapus');
    showDeleteModal.value = false;
    await fetchClasses();
  } catch (e) {
    console.error('Delete class failed:', e);
    $toast.error('Gagal menghapus kelas');
  } finally {
    deleteId.value = null;
  }
};

const confirmDelete = (id) => {
  deleteId.value = id;
  showDeleteModal.value = true;
};

const bentoCard = "bg-base-100 rounded-[2rem] p-6 border border-base-200/60 shadow-sm transition-all duration-300";
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight">Manajemen Kelas</h1>
          <p class="text-xs sm:text-base text-base-content/60 mt-1">Kelola daftar kelas dan rombel</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/reshuffle" class="btn btn-sm sm:btn-md bg-amber-500 hover:bg-amber-600 text-black border-0 rounded-xl sm:rounded-2xl gap-2 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Icon name="mingcute:transfer-4-line" size="18" />
            <span>Reshuffle Kelas</span>
          </NuxtLink>
          <button @click="openCreate" class="btn btn-sm sm:btn-md bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl sm:rounded-2xl gap-2 font-black shadow-lg shadow-orange-500/20 shrink-0">
            <Icon name="mingcute:add-circle-fill" size="18" class="sm:text-[20px]" />
            <span class="hidden xsm:inline">Tambah</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col gap-3">
        <!-- Top row: Search -->
        <div class="relative group w-full">
          <Icon name="mingcute:search-line" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-primary transition-colors" />
          <input v-model="searchQuery" type="text" placeholder="Cari nama kelas..." class="input input-bordered pl-11 rounded-2xl bg-base-100 w-full" />
        </div>

        <!-- Bottom row: Selects and Actions -->
        <div class="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <select v-model="selectedGrade" class="select select-bordered rounded-2xl bg-base-100 w-full sm:w-auto">
            <option value="">Semua Tingkat</option>
            <option value="10">Kelas 10</option>
            <option value="11">Kelas 11</option>
            <option value="12">Kelas 12</option>
          </select>
          <select v-model="selectedMajor" class="select select-bordered rounded-2xl bg-base-100 w-full sm:min-w-[160px] sm:w-auto">
            <option value="">Semua Jurusan</option>
            <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.alias }}</option>
          </select>
          <NuxtLink to="/jurusan" class="btn btn-ghost rounded-2xl gap-2 border-base-200 col-span-2 sm:col-span-1">
            <Icon name="mingcute:settings-6-fill" size="18" />
            <span class="text-sm">Kelola Jurusan</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="bg-base-100 rounded-[2rem] p-5 border border-base-200/60 shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <div class="skeleton w-10 h-10 rounded-2xl shrink-0"></div>
            <div class="space-y-1.5">
              <div class="skeleton h-2 w-10 opacity-40"></div>
              <div class="skeleton h-3 w-16"></div>
            </div>
          </div>
          <div class="flex gap-1">
            <div class="skeleton w-7 h-7 rounded-full opacity-30"></div>
            <div class="skeleton w-7 h-7 rounded-full opacity-30"></div>
          </div>
        </div>
        <div class="flex-1">
          <div class="skeleton h-5 w-3/4 mb-2"></div>
          <div class="skeleton h-2 w-1/2 mb-6 opacity-40"></div>
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="skeleton h-12 rounded-2xl opacity-60"></div>
            <div class="skeleton h-12 rounded-2xl opacity-60"></div>
          </div>
          <div class="skeleton h-8 w-full rounded-xl opacity-50"></div>
        </div>
      </div>
    </div>

    <!-- Class Grid -->
    <div v-else-if="filteredClasses.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="cls in filteredClasses" :key="cls.id" class="bg-base-100 rounded-[2rem] p-5 border border-base-200/60 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
        <!-- Background Icon Decor -->
        <Icon :name="cls.major?.icon || 'mingcute:school-fill'" class="absolute -right-4 -bottom-4 text-8xl opacity-[0.03] -rotate-12 group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-500" />

        <div class="flex items-center justify-between mb-4 relative z-10">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-content transition-all duration-300">
              <Icon :name="cls.major?.icon || 'mingcute:school-fill'" size="20" />
            </div>
            <div>
               <span class="text-[10px] font-black tracking-widest uppercase opacity-40 block leading-none mb-1">TINGKAT</span>
               <span class="text-xs font-black text-base-content leading-none">KELAS {{ cls.grade }}</span>
            </div>
          </div>
          <div class="flex gap-1">
            <button @click="openEdit(cls)" class="btn btn-ghost btn-circle btn-sm text-base-content/30 hover:text-primary hover:bg-primary/10 transition-all"><Icon name="mingcute:edit-2-fill" size="16" /></button>
            <button @click="confirmDelete(cls.id)" class="btn btn-ghost btn-circle btn-sm text-base-content/30 hover:text-error hover:bg-error/10 transition-all"><Icon name="mingcute:delete-2-fill" size="16" /></button>
          </div>
        </div>
        
        <div class="relative z-10 flex-1">
          <h3 class="text-xl font-black text-base-content group-hover:text-primary transition-colors leading-tight mb-1">{{ cls.className }}</h3>
          <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-5 truncate">{{ cls.major?.name }}</p>
          
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="bg-base-200/40 rounded-2xl p-3 flex flex-col">
              <span class="text-[8px] font-black text-base-content/30 uppercase tracking-widest mb-1">TOTAL SISWA</span>
              <div class="flex items-center gap-1.5 text-base-content">
                <Icon name="mingcute:group-fill" size="14" class="opacity-40" />
                <span class="text-sm font-black">{{ cls._count?.users || 0 }}</span>
              </div>
            </div>
            <div class="bg-base-200/40 rounded-2xl p-3 flex flex-col">
              <span class="text-[8px] font-black text-base-content/30 uppercase tracking-widest mb-1">STATUS</span>
              <div class="flex items-center gap-1.5">
                <div :class="['w-2 h-2 rounded-full', cls.isActive ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-base-300']"></div>
                <span class="text-xs font-black text-base-content uppercase tracking-tight">{{ cls.isActive ? 'Aktif' : 'Non-Aktif' }}</span>
              </div>
            </div>
          </div>

          <NuxtLink :to="`/siswa?classId=${cls.id}`" class="btn btn-sm btn-block rounded-xl border-none bg-base-200/60 hover:bg-primary hover:text-primary-content transition-all font-black text-[11px] uppercase tracking-wider gap-2">
            Detail Siswa
            <Icon name="mingcute:arrow-right-line" size="14" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else :class="[bentoCard, 'text-center py-24 flex flex-col items-center justify-center']">
      <div class="w-20 h-20 rounded-3xl bg-base-200/50 flex items-center justify-center text-base-content/20 mb-6">
        <Icon name="mingcute:school-line" size="40" />
      </div>
      <p class="text-xl font-bold text-base-content/40">Belum ada data kelas</p>
      <button @click="openCreate" class="btn btn-primary btn-sm rounded-xl mt-4">Tambah Sekarang</button>
    </div>

    <Teleport to="body">
      <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showModal }]">
        <div class="modal-box bg-base-100 p-0 overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-md border border-base-200 max-h-[90vh] flex flex-col">
          <div class="p-6 border-b border-base-200/40 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Icon name="mingcute:school-fill" size="22" />
              </div>
              <div>
                <h3 class="text-lg font-black text-base-content leading-none">{{ editMode ? 'Edit Kelas' : 'Tambah Kelas' }}</h3>
                <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mt-1">Formulir Data Kelas</p>
              </div>
            </div>
            <button @click="showModal = false" class="btn btn-ghost btn-sm btn-circle rounded-xl"><Icon name="mingcute:close-line" size="20" /></button>
          </div>
          
          <div class="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-[10px] font-black uppercase tracking-widest text-base-content/40">Tingkat</span></label>
                <select v-model="form.grade" class="select select-bordered w-full rounded-2xl font-bold bg-base-200/30 border-base-300">
                  <option :value="10">Kelas 10</option>
                  <option :value="11">Kelas 11</option>
                  <option :value="12">Kelas 12</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-[10px] font-black uppercase tracking-widest text-base-content/40">Jurusan</span></label>
                <select v-model="form.majorId" class="select select-bordered w-full rounded-2xl font-bold bg-base-200/30 border-base-300">
                  <option value="" disabled>Pilih Jurusan</option>
                  <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.alias }} ({{ m.name }})</option>
                </select>
              </div>
            </div>
            
            <div class="form-control">
              <label class="label py-1"><span class="label-text text-[10px] font-black uppercase tracking-widest text-base-content/40">Abjad / Seksi Kelas</span></label>
              <input v-model="form.section" type="text" placeholder="Contoh: A, B, atau 1" :class="['input input-bordered w-full rounded-2xl uppercase bg-base-200/30 border-base-300 font-bold', isDuplicate ? 'border-rose-500 bg-rose-50' : '']" />
              <div v-if="isDuplicate" class="mt-2 text-[10px] text-rose-500 font-black uppercase tracking-widest px-1 flex items-center gap-1">
                <Icon name="mingcute:alert-line" /> Kelas {{ computedClassName }} sudah terdaftar
              </div>
              <div v-else class="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                <Icon name="mingcute:information-line" class="text-primary" size="18" />
                <p class="text-[10px] text-base-content/60 font-bold uppercase tracking-tight leading-tight">
                  Pratinjau Nama: <span v-if="computedClassName" class="text-primary font-black">{{ computedClassName }}</span><span v-else class="italic">(Lengkapi form diatas)</span>
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-2xl bg-base-200/50 border border-base-300">
              <div class="flex items-center gap-3">
                <div :class="['w-8 h-8 rounded-lg flex items-center justify-center', form.isActive ? 'bg-success/10 text-success' : 'bg-base-300 text-base-content/30']">
                  <Icon :name="form.isActive ? 'mingcute:check-fill' : 'mingcute:close-fill'" size="18" />
                </div>
                <p class="text-xs font-black text-base-content uppercase tracking-widest">Status Aktif</p>
              </div>
              <input v-model="form.isActive" type="checkbox" class="toggle toggle-primary toggle-sm" />
            </div>
          </div>

          <div class="p-6 pt-0 flex gap-3 shrink-0">
            <button @click="showModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black uppercase text-xs tracking-widest">Batal</button>
            <button @click="saveClass" :disabled="saving || !form.majorId || !form.section || isDuplicate"
              class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-500/20">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              {{ editMode ? 'Simpan' : 'Tambah Kelas' }}
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop bg-black/60 backdrop-blur-sm" @click="showModal = false">
          <button>close</button>
        </form>
      </dialog>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showDeleteModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <Icon name="mingcute:alert-line" size="32" />
            </div>
            <h3 class="text-xl font-black text-base-content">Hapus Kelas?</h3>
            <p class="py-4 text-sm text-base-content/50 font-medium">Data yang dihapus tidak dapat dikembalikan.</p>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" class="btn btn-ghost rounded-2xl px-6 font-black">Batal</button>
              <button @click="deleteClass" class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl px-6 font-black shadow-lg shadow-rose-500/20">Ya, Hapus</button>
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
