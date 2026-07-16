<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
const { $toast } = useNuxtApp();
const authStore = useAuthStore();
const userRole = computed(() => authStore.role);
const isAdmin = computed(() => ['admin', 'developer'].includes(userRole.value));

useSeoMeta({
  title: 'Manajemen Jurusan | GASKAN',
  description: 'Kelola data jurusan dan departemen',
});

// State
const majors = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const showDeleteModal = ref(false);
const deleteId = ref(null);

const form = ref({
  id: null,
  name: '',
  alias: '',
  icon: 'mingcute:school-fill',
});

const availableIcons = [
  { id: 'chemistry', name: 'mingcute:flask-fill' },
  { id: 'industry', name: 'mingcute:factory-fill' },
  { id: 'mechanical', name: 'mingcute:settings-3-fill' },
  { id: 'computer', name: 'mingcute:computer-fill' },
  { id: 'electrical', name: 'mingcute:lightning-fill' },
  { id: 'school', name: 'mingcute:school-fill' },
  { id: 'building', name: 'mingcute:building-1-fill' },
  { id: 'science', name: 'mingcute:microscope-fill' },
  { id: 'tool', name: 'mingcute:tool-fill' },
  { id: 'art', name: 'mingcute:palette-fill' },
  { id: 'tech', name: 'mingcute:settings-1-fill' },
  { id: 'server', name: 'mingcute:server-fill' },
  { id: 'education', name: 'mingcute:book-4-fill' },
  { id: 'graduate', name: 'mingcute:book-2-fill' },
  { id: 'business', name: 'mingcute:briefcase-fill' },
  { id: 'certificate', name: 'mingcute:certificate-fill' },
  { id: 'group', name: 'mingcute:group-fill' },
  { id: 'device', name: 'mingcute:device-fill' },
];
const isDuplicateName = computed(() => {
  if (!form.value.name) return false;
  return majors.value.some(m => m.name.toLowerCase() === form.value.name.toLowerCase() && m.id !== form.value.id);
});

const isDuplicateAlias = computed(() => {
  if (!form.value.alias) return false;
  return majors.value.some(m => m.alias.toLowerCase() === form.value.alias.toLowerCase() && m.id !== form.value.id);
});

// Fetch majors
const fetchMajors = async () => {
  loading.value = true;
  try {
    const data = await $fetch('/api/classes/majors');
    majors.value = data?.data || [];
  } catch (e) {
    console.error('Failed to fetch majors:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchMajors);

// Actions
const openCreate = () => {
  editMode.value = false;
  form.value = { id: null, name: '', alias: '', icon: 'mingcute:school-fill' };
  showModal.value = true;
};

const openEdit = (m) => {
  editMode.value = true;
  form.value = { ...m };
  showModal.value = true;
};

const saveMajor = async () => {
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (editMode.value && form.value.id) {
      await $fetch(`/api/classes/majors/${form.value.id}`, { method: 'PUT', body: payload });
    } else {
      delete payload.id;
      await $fetch('/api/classes/majors', { method: 'POST', body: payload });
    }
    showModal.value = false;
    $toast.success(editMode.value ? 'Jurusan berhasil diperbarui' : 'Jurusan berhasil ditambahkan');
    await fetchMajors();
  } catch (e) {
    console.error('Save major failed:', e);
    $toast.error('Gagal menyimpan jurusan: ' + (e?.data?.message || 'Error'));
  } finally {
    saving.value = false;
  }
};

const deleteMajor = async () => {
  if (!deleteId.value) return;
  try {
    await $fetch(`/api/classes/majors/${deleteId.value}`, { method: 'DELETE' });
    $toast.success('Jurusan berhasil dihapus');
    showDeleteModal.value = false;
    await fetchMajors();
  } catch (e) {
    console.error('Delete major failed:', e);
    $toast.error(e?.data?.message || 'Gagal menghapus jurusan');
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
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-base-content">Manajemen Jurusan</h1>
        <p class="text-sm text-base-content/40 font-medium mt-0.5">Kelola daftar jurusan dan departemen sekolah</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink to="/kelas" class="btn btn-ghost border border-base-200 rounded-2xl gap-2 font-black">
          <Icon name="mingcute:arrow-left-line" size="18" /> Kembali ke Kelas
        </NuxtLink>
        <button v-if="isAdmin" @click="openCreate" class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl gap-2 font-black shadow-lg shadow-orange-500/20">
          <Icon name="mingcute:add-circle-fill" size="20" /> Tambah Jurusan
        </button>
      </div>
    </div>

    <!-- Info Banner -->
    <div v-if="!isAdmin" class="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-4 flex items-center gap-4 text-orange-600">
      <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
        <Icon name="mingcute:information-line" size="20" />
      </div>
      <p class="text-sm font-bold">Anda masuk sebagai Guru. Penambahan atau perubahan data hanya dapat dilakukan oleh Admin.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-dots loading-lg text-orange-500"></span>
    </div>

    <!-- Major Grid -->
    <div v-else-if="majors.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="m in majors" :key="m.id" class="bg-base-100 rounded-3xl p-6 border border-base-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
        <Icon :name="m.icon || 'mingcute:school-fill'" class="absolute -right-4 -bottom-4 text-9xl opacity-[0.03] -rotate-12" />

        <div class="flex items-center justify-between mb-6 relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
            <Icon :name="m.icon || 'mingcute:school-fill'" size="28" />
          </div>
          <div v-if="isAdmin" class="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button @click="openEdit(m)" class="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-orange-500 hover:bg-orange-500/10">
              <Icon name="mingcute:edit-2-fill" />
            </button>
            <button @click="confirmDelete(m.id)" class="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-rose-500 hover:bg-rose-500/10">
              <Icon name="mingcute:delete-2-fill" />
            </button>
          </div>
        </div>

        <div class="relative z-10">
          <div class="inline-flex px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 text-[10px] font-black tracking-[0.2em] uppercase border border-orange-500/20 mb-2">{{ m.alias }}</div>
          <h3 class="text-xl font-black text-base-content mb-3 group-hover:text-orange-500 transition-colors leading-tight">{{ m.name }}</h3>

          <div class="flex items-center gap-4 py-3 border-y border-base-200/60 mb-3">
            <div class="flex items-center gap-1.5">
              <Icon name="mingcute:school-line" class="text-orange-500/60" size="14" />
              <span class="text-xs font-bold text-base-content/60">{{ m.totalClasses || 0 }} Kelas</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon name="mingcute:group-line" class="text-orange-500/60" size="14" />
              <span class="text-xs font-bold text-base-content/60">{{ m.totalStudents || 0 }} Siswa</span>
            </div>
          </div>
          <p class="text-[9px] font-bold text-base-content/20 uppercase tracking-widest">Update: {{ new Date(m.updatedAt).toLocaleDateString('id-ID') }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-base-100 rounded-3xl border border-dashed border-base-200 p-20 flex flex-col items-center justify-center opacity-40">
      <Icon name="mingcute:school-line" size="64" />
      <p class="text-sm font-black uppercase tracking-widest mt-4">Belum ada jurusan</p>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md z-10">
            <div class="p-6 border-b border-base-200/40 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Icon name="mingcute:school-fill" size="20" />
                </div>
                <h3 class="text-lg font-black text-base-content">{{ editMode ? 'Edit Jurusan' : 'Tambah Jurusan' }}</h3>
              </div>
              <button @click="showModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>
            <div class="p-6 space-y-4">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Nama Jurusan</span></label>
                <input v-model="form.name" type="text" placeholder="Contoh: Kimia Analisis" :class="['input input-bordered w-full rounded-2xl', isDuplicateName ? 'border-rose-500' : '']" />
                <p v-if="isDuplicateName" class="mt-1 text-[10px] text-rose-500 font-black uppercase tracking-widest flex items-center gap-1">
                  <Icon name="mingcute:alert-line" /> Nama jurusan sudah digunakan
                </p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Alias (Kode)</span></label>
                  <input v-model="form.alias" type="text" placeholder="KA" :class="['input input-bordered w-full rounded-2xl font-black uppercase', isDuplicateAlias ? 'border-rose-500' : '']" />
                  <p v-if="isDuplicateAlias" class="mt-1 text-[10px] text-rose-500 font-black uppercase tracking-widest flex items-center gap-1">
                    <Icon name="mingcute:alert-line" /> Alias sudah ada
                  </p>
                </div>
                <div class="form-control">
                  <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Ikon Terpilih</span></label>
                  <div class="flex items-center gap-3 px-4 h-12 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <Icon :name="form.icon || 'mingcute:school-fill'" size="20" />
                    <span class="text-[10px] font-black uppercase tracking-widest truncate">{{ form.icon?.split(':').pop() }}</span>
                  </div>
                </div>
              </div>
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Pilih Ikon</span></label>
                <div class="grid grid-cols-6 gap-2 p-3 rounded-2xl bg-base-200/50 border border-base-200">
                  <button v-for="icon in availableIcons" :key="icon.id" type="button" @click="form.icon = icon.name"
                    :class="['w-10 h-10 rounded-xl flex items-center justify-center transition-all', form.icon === icon.name ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-110' : 'bg-base-300/50 text-base-content/60 hover:bg-base-300 hover:text-orange-500']">
                    <Icon :name="icon.name" size="20" />
                  </button>
                </div>
              </div>
              <p class="text-[10px] text-base-content/30 font-bold italic">*Jika Alias diubah, semua nama kelas terkait akan otomatis diperbarui.</p>
            </div>
            <div class="p-6 pt-0 flex gap-3">
              <button @click="showModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="saveMajor" :disabled="saving || !form.name || !form.alias || isDuplicateName || isDuplicateAlias"
                class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 flex-1 rounded-2xl font-black shadow-lg shadow-orange-500/20">
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                {{ editMode ? 'Simpan Perubahan' : 'Tambah Jurusan' }}
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
            <h3 class="text-xl font-black text-base-content">Hapus Jurusan?</h3>
            <p class="py-4 text-sm text-base-content/50 font-medium">Pastikan tidak ada kelas yang masih terhubung. Tindakan ini tidak dapat dibatalkan.</p>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" class="btn btn-ghost rounded-2xl px-6 font-black">Batal</button>
              <button @click="deleteMajor" class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl px-6 font-black shadow-lg shadow-rose-500/20">Ya, Hapus</button>
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
