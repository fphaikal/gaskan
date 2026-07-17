<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { role } = storeToRefs(useAuthStore());
const { $toast } = useNuxtApp();
const config = useRuntimeConfig();

useSeoMeta({
  title: 'Manajemen User | GASKAN',
  description: 'Kelola semua pengguna sistem (Admin, Guru, Siswa)',
});

// State
const classes = ref([]);
const showModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const showDeleteModal = ref(false);
const deleteId = ref(null);
const activeDropdown = ref(null);

// Pagination + filter state
const searchQuery = ref('');
const filterRole = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(15);

// Helper for Profile Picture
const getAvatar = (user) => {
  if (!user || !user.photoUrl) return null;
  if (user.photoUrl.startsWith('http')) return user.photoUrl;
  
  // Use the Nuxt API proxy for uploads
  // If the path contains /uploads/profiles/, we need to extract the filename or the relative path
  const filename = user.photoUrl.split('/').pop();
  return `/api/uploads/profiles/${filename}`;
};

const getInitials = (name) => {
  if (!name) return '??';
  try {
    return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  } catch (e) {
    return '??';
  }
};

// Toggle mobile dropdown
const toggleDropdown = (id) => {
  if (activeDropdown.value === id) activeDropdown.value = null;
  else activeDropdown.value = id;
};

// Close dropdown on click outside
if (process.client) {
  onMounted(() => {
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.mobile-dropdown')) {
        activeDropdown.value = null;
      }
    });
  });
}

// Server-side fetch with pagination
const { data: userData, refresh: refreshUsers, pending: loading } = useFetch('/api/users', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage.value,
    search: searchQuery.value,
    role: filterRole.value,
  })),
  watch: [currentPage, itemsPerPage, searchQuery, filterRole],
});

const pagedUsers = computed(() => Array.isArray(userData.value?.data) ? userData.value.data : []);
const totalCount = computed(() => userData.value?.pagination?.total || 0);
const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage.value));

// Reset page on filter change
watch([searchQuery, filterRole, itemsPerPage], () => { currentPage.value = 1; });

const fetchClasses = async () => {
  try {
    const data = await $fetch('/api/classes');
    classes.value = Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    console.error('Failed to fetch classes:', e);
  }
};

onMounted(() => { fetchClasses(); });

const form = ref({
  id: null,
  name: '',
  email: '',
  nis: '',
  nisn: '',
  password: '',
  role: 'GURU',
  classId: '',
  isActive: true,
});

const openCreate = () => {
  editMode.value = false;
  form.value = { id: null, name: '', email: '', nis: '', nisn: '', password: '', role: 'GURU', classId: '', isActive: true };
  showModal.value = true;
};

const openEdit = (user) => {
  if (!user) return;
  editMode.value = true;
  form.value = {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    nis: user.nis || '',
    nisn: user.nisn || '',
    password: '', 
    role: user.role || 'GURU',
    classId: user.classId || '',
    isActive: user.isActive ?? true,
  };
  showModal.value = true;
  activeDropdown.value = null;
};

const saveUser = async () => {
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (!payload.password) delete payload.password;
    if (!payload.email) payload.email = null;
    if (!payload.nis) payload.nis = null;
    if (!payload.nisn) payload.nisn = null;
    if (!payload.classId) payload.classId = null;

    if (editMode.value && form.value.id) {
      await $fetch(`/api/users/${form.value.id}`, { method: 'PUT', body: payload });
    } else {
      await $fetch('/api/users', { method: 'POST', body: payload });
    }

    showModal.value = false;
    $toast.success(editMode.value ? 'User diperbarui' : 'User ditambahkan');
    await refreshUsers();
  } catch (e) {
    const msg = e?.data?.message || e?.message || 'Error';
    $toast.error('Gagal simpan: ' + msg);
  } finally {
    saving.value = false;
  }
};

const deleteUser = async () => {
  if (!deleteId.value) return;
  try {
    await $fetch(`/api/users/${deleteId.value}`, { method: 'DELETE' });
    $toast.success('User dihapus');
    showDeleteModal.value = false;
    await refreshUsers();
  } catch (e) {
    $toast.error('Gagal hapus user');
  }
};

const confirmDelete = (id) => {
  deleteId.value = id;
  showDeleteModal.value = true;
  activeDropdown.value = null;
};

const bentoCard = "bg-base-100 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-base-200/60 shadow-sm transition-all duration-300";
</script>

<template>
  <div class="space-y-4 md:space-y-6 max-w-7xl mx-auto px-4 pb-12 text-left">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-base-content tracking-tight">Manajemen User</h1>
        <p class="text-sm md:text-base text-base-content/60 mt-1">Kelola akses Admin, Guru, dan Siswa</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2">
        <div class="flex gap-2 w-full sm:w-auto">
          <NuxtLink to="/siswa/import" class="btn btn-ghost btn-sm md:btn-md border-base-300 rounded-xl md:rounded-2xl gap-2 h-10 md:h-12 flex-1">
            <Icon name="mingcute:user-add-fill" size="18" class="text-primary/60" />
            <span class="text-xs md:text-sm">Bulk Siswa</span>
          </NuxtLink>
          <NuxtLink to="/admin/import-staff" class="btn btn-ghost btn-sm md:btn-md border-base-300 rounded-xl md:rounded-2xl gap-2 h-10 md:h-12 flex-1">
            <Icon name="mingcute:file-import-fill" size="18" class="text-violet-500/60" />
            <span class="text-xs md:text-sm">Bulk Staff</span>
          </NuxtLink>
        </div>
        <button @click="openCreate" class="btn btn-primary btn-sm md:btn-md rounded-xl md:rounded-2xl gap-2 h-10 md:h-12 shadow-lg shadow-primary/20 w-full sm:w-auto">
          <Icon name="mingcute:user-add-fill" size="18" />
          <span class="text-xs md:text-sm">Tambah User</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-base-100 p-4 rounded-[1.5rem] md:rounded-[2rem] border border-base-200/60 shadow-sm">
      <div class="md:col-span-2 relative">
        <Icon name="mingcute:search-line" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari Nama, Email, atau NIS..." 
          autocomplete="off"
          class="input input-bordered w-full pl-11 rounded-xl md:rounded-2xl bg-base-200/30" 
        />
      </div>
      <div>
        <select v-model="filterRole" class="select select-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30">
          <option value="">Semua Role</option>
          <option value="ADMIN">ADMIN</option>
          <option value="GURU">GURU</option>
          <option value="SISWA">SISWA</option>
        </select>
      </div>
      <div class="flex items-center justify-center font-bold text-[10px] md:text-xs text-base-content/40 uppercase tracking-widest">
        Total: <span class="text-primary ml-1">{{ totalCount }}</span>&nbsp;User
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary opacity-40"></span>
    </div>

    <!-- User List / Table -->
    <div v-else class="space-y-3">
      <!-- Desktop Table -->
      <div :class="[bentoCard, 'hidden md:block p-0 overflow-hidden']">
        <div class="overflow-x-auto">
          <table class="table table-lg w-full border-separate border-spacing-0">
            <thead class="sticky top-0 z-10 bg-base-100 shadow-sm">
              <tr class="bg-base-200/50 text-base-content/50 uppercase text-[10px] tracking-widest font-black">
                <th class="pl-8 py-4">Pengguna</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email / NIS</th>
                <th class="text-right pr-8">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-200/40">
              <tr v-for="user in pagedUsers" :key="user.id" class="hover:bg-base-200/30 transition-colors group">
                <td class="pl-8">
                  <div class="flex items-center gap-3 py-1">
                    <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden border border-primary/5">
                      <img v-if="getAvatar(user)" :src="getAvatar(user)" class="w-full h-full object-cover" />
                      <span v-else class="font-black text-xs">{{ getInitials(user?.name) }}</span>
                    </div>
                    <div class="min-w-0 max-w-[200px]">
                      <p class="font-bold text-base-content truncate">{{ user?.name || 'User' }}</p>
                      <p v-if="user?.role === 'SISWA'" class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest truncate">{{ user.class?.className || 'Tanpa Kelas' }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span v-if="user?.role" :class="['px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border', user.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : user.role === 'GURU' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20']">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-1.5">
                    <div :class="['w-2 h-2 rounded-full', user?.isActive ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-base-300']"></div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-base-content/50">{{ user?.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                  </div>
                </td>
                <td class="text-sm font-medium text-base-content/60">
                  {{ user?.email || user?.nis || user?.nisn || '-' }}
                </td>
                <td class="text-right pr-8">
                  <div class="flex items-center justify-end gap-2">
                    <NuxtLink :to="`/admin/users/detail/${user.id}`" class="btn btn-ghost btn-xs rounded-lg hover:bg-base-200">Detail</NuxtLink>
                    <button @click="openEdit(user)" class="btn btn-ghost btn-xs rounded-lg hover:bg-primary/10 hover:text-primary transition-all">Edit</button>
                    <button @click="confirmDelete(user?.id)" class="btn btn-ghost btn-xs rounded-lg hover:bg-error/10 hover:text-error transition-all">Hapus</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <UIPagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="totalCount"
          :itemsPerPage="itemsPerPage"
          itemLabel="user"
          @update:currentPage="currentPage = $event"
          @update:itemsPerPage="itemsPerPage = $event"
        />
      </div>

      <!-- Mobile List + Pagination -->
      <div class="md:hidden space-y-3">
        <div v-for="user in pagedUsers" :key="user.id" :class="[bentoCard, 'p-4 border-l-4 !overflow-visible', user?.role === 'ADMIN' ? 'border-l-violet-500' : user?.role === 'GURU' ? 'border-l-indigo-500' : 'border-l-emerald-500']">
          <div v-if="user" class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center text-base-content/40 shrink-0 overflow-hidden border border-base-300">
                <img v-if="getAvatar(user)" :src="getAvatar(user)" class="w-full h-full object-cover" />
                <span v-else class="font-black text-xs">{{ getInitials(user?.name) }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="font-bold text-base-content truncate">{{ user?.name || 'User' }}</h4>
                <div class="flex items-center flex-wrap gap-2 mt-1">
                   <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-base-200 text-base-content/60">{{ user?.role || 'User' }}</span>
                   <span v-if="user?.role === 'SISWA'" class="text-[9px] font-bold text-primary truncate max-w-[100px]">{{ user.class?.className || 'Tanpa Kelas' }}</span>
                </div>
              </div>
            </div>
            <div class="relative mobile-dropdown shrink-0">
              <button 
                @click.stop="toggleDropdown(user.id)"
                class="btn btn-ghost btn-xs px-1 h-8 w-8 rounded-lg"
              >
                <Icon name="mingcute:more-2-fill" />
              </button>
              
              <div v-if="activeDropdown === user.id" class="absolute right-0 top-full z-[50] mt-1 p-2 shadow-2xl bg-base-100 border border-base-200 rounded-2xl w-40 animate-in fade-in zoom-in duration-200">
                <NuxtLink :to="`/admin/users/detail/${user.id}`" class="w-full flex items-center gap-3 py-3 px-4 font-bold text-xs hover:bg-base-200 rounded-xl transition-colors">
                  <Icon name="mingcute:eye-2-line" class="text-base-content/60" /> Lihat Detail
                </NuxtLink>
                <button @click="openEdit(user)" class="w-full flex items-center gap-3 py-3 px-4 font-bold text-xs hover:bg-base-200 rounded-xl transition-colors">
                  <Icon name="mingcute:edit-2-line" class="text-primary" /> Edit User
                </button>
                <button @click="confirmDelete(user.id)" class="w-full flex items-center gap-3 py-3 px-4 font-bold text-xs text-error hover:bg-error/5 rounded-xl transition-colors text-left">
                  <Icon name="mingcute:delete-2-line" /> Hapus User
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between border-t border-base-200 pt-3">
             <div class="text-[10px] text-base-content/50 truncate max-w-[150px]">
               {{ user?.email || user?.nis || '-' }}
             </div>
             <div class="flex items-center gap-1.5 shrink-0">
                <div :class="['w-1.5 h-1.5 rounded-full', user?.isActive ? 'bg-success' : 'bg-base-300']"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-base-content/40">{{ user?.isActive ? 'AKTIF' : 'NONAKTIF' }}</span>
             </div>
          </div>
        </div>
        <UIPagination
          :currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="totalCount"
          :itemsPerPage="itemsPerPage"
          itemLabel="user"
          @update:currentPage="currentPage = $event"
          @update:itemsPerPage="itemsPerPage = $event"
        />
      </div>

      <div v-if="pagedUsers.length === 0 && !loading" class="text-center py-20 text-base-content/30 italic bg-base-100 rounded-[2rem] border border-base-200/60">
        Tidak ada data user yang ditemukan
      </div>
    </div>

    <!-- Modals -->
    <dialog :class="['modal modal-bottom sm:modal-middle', showModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 md:p-8 max-w-lg">
        <h3 class="text-xl md:text-2xl font-black text-base-content mb-6">
          {{ editMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}
        </h3>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control sm:col-span-2">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Nama Lengkap</span></label>
              <input v-model="form.name" type="text" autocomplete="off" placeholder="Nama Lengkap" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Role</span></label>
              <select v-model="form.role" class="select select-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30">
                <option value="ADMIN">ADMIN</option>
                <option value="GURU">GURU</option>
                <option value="SISWA">SISWA</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Email (Opsional)</span></label>
              <input v-model="form.email" type="email" autocomplete="off" placeholder="email@example.com" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30" />
            </div>
          </div>
          <div v-if="form.role === 'SISWA'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">NISN / NIS</span></label>
              <input v-model="form.nisn" type="text" autocomplete="off" placeholder="NISN/NIS" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Kelas</span></label>
              <select v-model="form.classId" class="select select-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30">
                <option value="">Pilih Kelas</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
              </select>
            </div>
          </div>
          <div v-else class="form-control">
             <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">NIS (Username)</span></label>
             <input v-model="form.nis" type="text" autocomplete="off" placeholder="Nomor Induk Staff" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Password</span></label>
            <input v-model="form.password" type="password" autocomplete="new-password" placeholder="••••••" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30" />
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3 px-1">
              <input v-model="form.isActive" type="checkbox" class="toggle toggle-primary toggle-sm" />
              <span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-60">Status Akun Aktif</span>
            </label>
          </div>
        </div>
        <div class="modal-action mt-8 gap-2">
          <button @click="showModal = false" class="btn btn-ghost rounded-xl md:rounded-2xl px-6 flex-1 sm:flex-none">Batal</button>
          <button @click="saveUser" class="btn btn-primary rounded-xl md:rounded-2xl px-8 shadow-lg shadow-primary/20 flex-1 sm:flex-none" :disabled="saving || !form.name">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span> Simpan
          </button>
        </div>
      </div>
    </dialog>

    <dialog :class="['modal modal-bottom sm:modal-middle', showDeleteModal ? 'modal-open' : '']">
      <div class="modal-box max-w-sm text-center bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8">
        <div class="w-16 h-16 rounded-3xl bg-error/10 flex items-center justify-center text-error mx-auto mb-4">
          <Icon name="mingcute:alert-line" size="32" />
        </div>
        <h3 class="text-xl font-black text-base-content">Konfirmasi Hapus</h3>
        <p class="py-4 text-base-content/60 text-sm">Hapus pengguna ini secara permanen?</p>
        <div class="flex gap-2 justify-center mt-2 w-full">
          <button @click="showDeleteModal = false" class="btn btn-ghost rounded-xl md:rounded-2xl flex-1">Batal</button>
          <button @click="deleteUser" class="btn btn-error rounded-xl md:rounded-2xl flex-1">Hapus</button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.1); border-radius: 10px; }
</style>
