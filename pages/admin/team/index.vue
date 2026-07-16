<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

const { $toast } = useNuxtApp();
const { role } = storeToRefs(useAuthStore());

useSeoMeta({
  title: 'Manajemen Tim | GASKAN',
  description: 'Kelola anggota tim pengembang GASKAN',
});

// State
const members = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const showDeleteModal = ref(false);
const deleteId = ref(null);

const form = ref({
  id: null,
  name: '',
  role: '',
  photoUrl: '',
  github: '',
  linkedin: '',
  instagram: '',
  email: '',
  year: '2024',
  order: 0,
  isActive: true,
});

// Helper for Photo
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/team/')) {
    return `/api${url}`;
  }
  return url;
};

// Fetch data
const fetchMembers = async () => {
  loading.value = true;
  try {
    const res = await $fetch('/api/team');
    members.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error('Failed to fetch team members:', e);
    $toast.error('Gagal mengambil data tim');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchMembers);

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value;
  const q = searchQuery.value.toLowerCase();
  return members.value.filter(m => 
    m.name.toLowerCase().includes(q) || 
    m.role.toLowerCase().includes(q)
  );
});

const photoFile = ref(null);
const photoPreview = ref(null);

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    photoFile.value = file;
    photoPreview.value = URL.createObjectURL(file);
  }
};

const openCreate = () => {
  editMode.value = false;
  photoFile.value = null;
  photoPreview.value = null;
  form.value = {
    id: null,
    name: '',
    role: '',
    photoUrl: '',
    github: '',
    linkedin: '',
    instagram: '',
    email: '',
    year: '2024',
    order: members.value.length,
    isActive: true,
  };
  showModal.value = true;
};

const openEdit = (member) => {
  editMode.value = true;
  photoFile.value = null;
  photoPreview.value = member.photoUrl;
  form.value = { ...member };
  showModal.value = true;
};

const saveMember = async () => {
  saving.value = true;
  try {
    const formData = new FormData();
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== null && form.value[key] !== undefined) {
        formData.append(key, form.value[key]);
      }
    });
    if (photoFile.value) {
      formData.append('photo', photoFile.value);
    }

    if (editMode.value) {
      await $fetch(`/api/team/${form.value.id}`, { method: 'PUT', body: formData });
      $toast.success('Anggota tim diperbarui');
    } else {
      await $fetch('/api/team', { method: 'POST', body: formData });
      $toast.success('Anggota tim ditambahkan');
    }
    showModal.value = false;
    await fetchMembers();
  } catch (e) {
    $toast.error('Gagal menyimpan data');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (id) => {
  deleteId.value = id;
  showDeleteModal.value = true;
};

const deleteMember = async () => {
  try {
    await $fetch(`/api/team/${deleteId.value}`, { method: 'DELETE' });
    $toast.success('Anggota tim dihapus');
    showDeleteModal.value = false;
    await fetchMembers();
  } catch (e) {
    $toast.error('Gagal menghapus anggota');
  }
};

const bentoCard = "bg-base-100 rounded-[2rem] p-6 border border-base-200/60 shadow-sm transition-all duration-300";

const roleColor = (role) => {
  if (!role) return 'text-base-content/40';
  if (role.includes('Backend')) return 'text-blue-400';
  if (role.includes('Frontend')) return 'text-green-400';
  if (role.includes('Hardware') || role.includes('Electrical') || role.includes('Mechanical')) return 'text-orange-400';
  if (role.includes('Pembimbing')) return 'text-primary';
  return 'text-secondary';
};
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 pb-12 text-left">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-base-content tracking-tight">Manajemen Tim</h1>
        <p class="text-sm text-base-content/60 mt-1">Kelola orang-orang di balik GASKAN</p>
      </div>
      <button @click="openCreate" class="btn btn-primary rounded-2xl gap-2 h-12 shadow-lg shadow-primary/20">
        <Icon name="mingcute:user-add-fill" size="18" />
        <span>Tambah Anggota</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-base-100 p-4 rounded-[2rem] border border-base-200/60 shadow-sm">
      <div class="md:col-span-2 relative">
        <Icon name="mingcute:search-line" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari Nama atau Peran..." 
          class="input input-bordered w-full pl-11 rounded-2xl bg-base-200/30" 
        />
      </div>
      <div class="flex items-center justify-center font-bold text-xs text-base-content/40 uppercase tracking-widest">
        Total: {{ filteredMembers.length }} Orang
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" :class="[bentoCard, 'flex flex-col animate-pulse']">
        <div class="flex items-start gap-4">
          <div class="skeleton w-16 h-16 rounded-2xl shrink-0"></div>
          <div class="flex-1 space-y-2.5">
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-2 w-1/2 opacity-40"></div>
            <div class="flex gap-2 mt-2">
              <div class="skeleton w-5 h-5 rounded-full opacity-30"></div>
              <div class="skeleton w-5 h-5 rounded-full opacity-30"></div>
              <div class="skeleton w-5 h-5 rounded-full opacity-30"></div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div class="skeleton w-6 h-6 rounded-lg opacity-20"></div>
            <div class="skeleton w-6 h-6 rounded-lg opacity-20"></div>
          </div>
        </div>
        <div class="mt-6 pt-4 border-t border-base-200/60 flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div class="skeleton w-2 h-2 rounded-full"></div>
            <div class="skeleton h-2 w-12 opacity-30"></div>
          </div>
          <div class="skeleton h-2 w-10 opacity-20"></div>
        </div>
      </div>
    </div>

    <!-- Team List -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="m in filteredMembers" :key="m.id" :class="[bentoCard, 'group hover:border-primary/40']">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden border border-primary/10">
            <img v-if="m.photoUrl" :src="resolvePhoto(m.photoUrl)" class="w-full h-full object-cover" />
            <Icon v-else name="mingcute:user-4-fill" size="24" class="opacity-40" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-base-content truncate">{{ m.name }}</h3>
            <p class="text-xs font-bold uppercase tracking-wider mt-0.5" :class="roleColor(m.role)">{{ m.role }}</p>
            <div class="flex gap-2 mt-3">
              <a v-if="m.github" :href="m.github" target="_blank" class="text-base-content/40 hover:text-primary transition-colors">
                <Icon name="mdi:github" size="18" />
              </a>
              <a v-if="m.linkedin" :href="m.linkedin" target="_blank" class="text-base-content/40 hover:text-primary transition-colors">
                <Icon name="entypo-social:linkedin-with-circle" size="18" />
              </a>
              <a v-if="m.instagram" :href="m.instagram" target="_blank" class="text-base-content/40 hover:text-primary transition-colors">
                <Icon name="mage:instagram-circle" size="18" />
              </a>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <!-- Space for actions -->
          </div>
          <div class="flex flex-col gap-2">
            <button @click="openEdit(m)" class="btn btn-ghost btn-xs rounded-lg hover:bg-primary/10 hover:text-primary">
              <Icon name="mingcute:edit-2-line" />
            </button>
            <button @click="confirmDelete(m.id)" class="btn btn-ghost btn-xs rounded-lg hover:bg-error/10 hover:text-error">
              <Icon name="mingcute:delete-2-line" />
            </button>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-base-200/60 flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div :class="['w-2 h-2 rounded-full', m.isActive ? 'bg-success' : 'bg-base-300']"></div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-base-content/40">{{ m.isActive ? 'Aktif' : 'Nonaktif' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="badge badge-sm badge-outline text-[10px] py-2 opacity-60">Periode {{ m.year || '2024' }}</span>
            <span class="text-[10px] font-bold text-base-content/20">Order: {{ m.order }}</span>
          </div>
        </div>
      </div>

      <div v-if="filteredMembers.length === 0" class="col-span-full text-center py-20 text-base-content/30 italic bg-base-100 rounded-[2rem] border border-base-200/60">
        Belum ada data anggota tim
      </div>
    </div>

    <!-- Modal Form -->
    <dialog :class="['modal modal-bottom sm:modal-middle', showModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 md:p-8 max-w-2xl">
        <h3 class="text-xl md:text-2xl font-black text-base-content mb-6">
          {{ editMode ? 'Edit Anggota Tim' : 'Tambah Anggota Tim' }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Nama Lengkap</span></label>
            <input v-model="form.name" type="text" placeholder="Contoh: John Doe" class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Peran / Role</span></label>
            <input v-model="form.role" type="text" placeholder="Contoh: Backend Developer" class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control md:col-span-2">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Foto Anggota</span></label>
            <div class="flex items-center gap-4 p-4 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
              <div class="w-20 h-20 rounded-2xl bg-base-300 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="photoPreview" :src="photoPreview" class="w-full h-full object-cover" />
                <Icon v-else name="mingcute:photo-album-line" size="24" class="opacity-20" />
              </div>
              <div class="flex-1">
                <input type="file" accept="image/*" @change="handleFileChange" class="file-input file-input-bordered file-input-primary file-input-sm w-full rounded-xl" />
                <p class="text-[9px] mt-2 opacity-40">Rekomendasi: Persegi (1:1), Max 2MB (JPG, PNG, WebP)</p>
              </div>
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">GitHub URL</span></label>
            <input v-model="form.github" type="text" placeholder="https://github.com/..." class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">LinkedIn URL</span></label>
            <input v-model="form.linkedin" type="text" placeholder="https://linkedin.com/in/..." class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Instagram URL</span></label>
            <input v-model="form.instagram" type="text" placeholder="https://instagram.com/..." class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Email</span></label>
            <input v-model="form.email" type="email" placeholder="email@example.com" class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Tahun / Periode</span></label>
            <input v-model="form.year" type="text" placeholder="Contoh: 2025 - 2026 atau 2026 - sekarang" class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Urutan Tampil</span></label>
            <input v-model.number="form.order" type="number" class="input input-bordered w-full rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control md:col-span-2">
            <label class="label cursor-pointer justify-start gap-3 px-1">
              <input v-model="form.isActive" type="checkbox" class="toggle toggle-primary toggle-sm" />
              <span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-60">Aktif & Tampilkan</span>
            </label>
          </div>
        </div>
        <div class="modal-action mt-8 gap-2">
          <button @click="showModal = false" class="btn btn-ghost rounded-2xl px-6">Batal</button>
          <button @click="saveMember" class="btn btn-primary rounded-2xl px-8 shadow-lg shadow-primary/20" :disabled="saving || !form.name || !form.role">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span> Simpan
          </button>
        </div>
      </div>
    </dialog>

    <!-- Delete Confirmation -->
    <dialog :class="['modal modal-bottom sm:modal-middle', showDeleteModal ? 'modal-open' : '']">
      <div class="modal-box max-w-sm text-center bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8">
        <div class="w-16 h-16 rounded-3xl bg-error/10 flex items-center justify-center text-error mx-auto mb-4">
          <Icon name="mingcute:alert-line" size="32" />
        </div>
        <h3 class="text-xl font-black text-base-content">Hapus Anggota</h3>
        <p class="py-4 text-base-content/60 text-sm">Hapus anggota tim ini secara permanen?</p>
        <div class="flex gap-2 justify-center mt-2 w-full">
          <button @click="showDeleteModal = false" class="btn btn-ghost rounded-2xl flex-1">Batal</button>
          <button @click="deleteMember" class="btn btn-error rounded-2xl flex-1">Hapus</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
