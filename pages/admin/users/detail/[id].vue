<script setup>
import { ref, onMounted } from 'vue';
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { $toast } = useNuxtApp();

const user = ref(null);
const loading = ref(true);

const fetchUserDetail = async () => {
  loading.value = true;
  try {
    const res = await $fetch(`/api/users/${route.params.id}`);
    user.value = res?.data || null;
  } catch (err) {
    $toast.error('Gagal mengambil data user');
    router.push('/admin/users');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserDetail();
});

const getAvatar = (u) => {
  if (!u || !u.photoUrl) return null;
  if (u.photoUrl.startsWith('http')) return u.photoUrl;
  
  // Use the Nuxt API proxy for uploads
  const filename = u.photoUrl.split('/').pop();
  return `/api/uploads/profiles/${filename}`;
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const bentoCard = "bg-base-100 rounded-3xl p-6 md:p-8 border border-base-200/60 shadow-sm transition-all duration-300";

const isDeletingPhoto = ref(false);
const showDeleteConfirm = ref(false);

const deleteUserPhoto = async () => {
  isDeletingPhoto.value = true;
  try {
    const res = await $fetch(`/api/users/${route.params.id}/photo`, { method: 'DELETE' });
    if (res.success) {
      $toast.success('Foto profil berhasil dihapus');
      showDeleteConfirm.value = false;
      await fetchUserDetail();
    }
  } catch (e) {
    $toast.error('Gagal menghapus foto profil');
  } finally {
    isDeletingPhoto.value = false;
  }
};
</script>

<template>
  <div class="max-w-5xl mx-auto py-6 md:py-10 px-4 space-y-6 md:space-y-8 text-left">
    
    <!-- Back Button & Title -->
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="btn btn-ghost btn-sm md:btn-md rounded-2xl bg-base-200/50">
        <Icon name="mingcute:left-line" size="20" />
        <span class="hidden md:inline">Kembali</span>
      </button>
      <div>
        <h1 class="text-xl md:text-2xl font-black text-base-content tracking-tight">Detail Pengguna</h1>
        <p class="text-xs md:text-sm text-base-content/50">Informasi sistem lengkap untuk akun ini</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <span class="loading loading-spinner loading-lg text-primary opacity-40"></span>
      <p class="text-xs font-bold uppercase tracking-widest text-base-content/30">Memuat Data...</p>
    </div>

    <div v-else-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      
      <!-- Left: Profile Summary -->
      <div class="lg:col-span-1 space-y-6">
        <div :class="[bentoCard, 'flex flex-col items-center text-center pt-10']">
          <div class="relative group">
            <div class="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary text-3xl md:text-4xl font-black overflow-hidden border-4 border-base-200 shadow-xl mb-6">
              <img v-if="getAvatar(user)" :src="getAvatar(user)" class="w-full h-full object-cover" />
              <span v-else>{{ getInitials(user.name) }}</span>
            </div>
            <div :class="['absolute bottom-8 right-0 w-6 h-6 rounded-full border-4 border-base-100 shadow-sm', user.isActive ? 'bg-success' : 'bg-base-300']"></div>
          </div>
          
          <h2 class="text-xl md:text-2xl font-black text-base-content break-words max-w-full">{{ user.name }}</h2>
          <div :class="['mt-2 px-4 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase', 
            user.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 
            user.role === 'GURU' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          ]">
            {{ user.role }}
          </div>
          
          <!-- Admin Action: Delete Photo -->
          <button 
            v-if="user.photoUrl"
            @click="showDeleteConfirm = true"
            class="btn btn-ghost btn-xs mt-4 text-error gap-1.5 hover:bg-error/10 rounded-lg"
          >
            <Icon name="mingcute:delete-2-fill" />
            Hapus Foto
          </button>
          
          <div class="w-full grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-base-200/60">
             <div class="text-center">
               <p class="text-[10px] font-bold text-base-content/30 uppercase mb-1">Status</p>
               <p :class="['text-xs font-black uppercase', user.isActive ? 'text-success' : 'text-base-content/40']">{{ user.isActive ? 'Aktif' : 'Nonaktif' }}</p>
             </div>
             <div class="text-center border-l border-base-200/60 min-w-0">
               <p class="text-[10px] font-bold text-base-content/30 uppercase mb-1">ID Sistem</p>
               <p class="text-[10px] font-black text-base-content/60 truncate px-1" :title="user.id">#{{ user.id }}</p>
             </div>
          </div>
        </div>

        <!-- System Times -->
        <div :class="[bentoCard, 'p-6 bg-base-200/20']">
          <h3 class="text-xs font-black text-base-content/40 uppercase tracking-widest mb-4">Metadata Sistem</h3>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <Icon name="mingcute:time-line" class="text-base-content/30 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-base-content/30 uppercase">Dibuat Pada</p>
                <p class="text-xs font-medium text-base-content/70">{{ formatDate(user.createdAt) }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="mingcute:refresh-2-line" class="text-base-content/30 mt-0.5" />
              <div>
                <p class="text-[10px] font-bold text-base-content/30 uppercase">Update Terakhir</p>
                <p class="text-xs font-medium text-base-content/70">{{ formatDate(user.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Detailed Info -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Account Information -->
        <div :class="[bentoCard]">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="mingcute:idcard-fill" size="20" />
            </div>
            <h3 class="text-lg font-black text-base-content tracking-tight">Informasi Akun</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-12">
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Email</p>
              <p class="text-sm font-medium text-base-content/80 break-all">{{ user.email || 'Tidak Terhubung' }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">NIS (Username)</p>
              <p class="text-sm font-medium text-base-content/80">{{ user.nis || '-' }}</p>
            </div>
            <div v-if="user.role === 'SISWA'">
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">NISN</p>
              <p class="text-sm font-medium text-base-content/80">{{ user.nisn || '-' }}</p>
            </div>
            <div v-if="user.role === 'SISWA'">
              <p class="text-[10px] font-bold text-base-content/30 uppercase tracking-widest mb-1">Kelas Saat Ini</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="badge badge-primary badge-outline font-black text-[10px]">{{ user.class?.className || 'BELUM SET' }}</span>
                <span v-if="user.class" class="text-[10px] text-base-content/40 font-medium">#{{ user.classId }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Permissions Info -->
        <div :class="[bentoCard, 'bg-primary/5 border-primary/10']">
           <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <Icon name="mingcute:safety-certificate-fill" size="24" />
              </div>
              <div>
                <h4 class="font-black text-base-content mb-1">Hak Akses: {{ user.role }}</h4>
                <p class="text-xs text-base-content/60 leading-relaxed">
                  {{ 
                    user.role === 'ADMIN' ? 'Memiliki kontrol penuh terhadap manajemen user, sistem import, pengaturan kelas, dan seluruh modul akademik.' :
                    user.role === 'GURU' ? 'Dapat melakukan absensi harian, mengelola jurnal kelas, dan melihat data siswa yang terdaftar di kelasnya.' :
                    'Dapat melihat dashboard pribadi, status kehadiran, dan menerima pengumuman dari sekolah.'
                  }}
                </p>
              </div>
           </div>
        </div>

        <!-- System ID (Full) -->
        <div :class="[bentoCard, 'bg-base-200/20 border-dashed']">
          <p class="text-[10px] font-bold text-base-content/30 uppercase mb-2">ID Sistem Lengkap</p>
          <div class="bg-base-100 p-3 rounded-xl border border-base-200 font-mono text-[10px] text-base-content/60 break-all select-all cursor-pointer" title="Klik untuk pilih">
            {{ user.id }}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-wrap gap-3">
          <button @click="$toast.info('Fitur reset password menyusul')" class="btn btn-ghost border-base-300 rounded-2xl gap-2 flex-1 md:flex-none">
            <Icon name="mingcute:key-2-line" />
            Reset Password
          </button>
          <NuxtLink :to="`/admin/users`" class="btn btn-ghost border-base-300 rounded-2xl gap-2 flex-1 md:flex-none">
            <Icon name="mingcute:list-check-line" />
            Manajemen User
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- Modal: Delete Photo Confirmation -->
    <dialog v-if="user" :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showDeleteConfirm }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
          <Icon name="mingcute:delete-2-fill" size="32" />
        </div>
        <h3 class="font-bold text-xl text-base-content mb-2">Hapus Foto User?</h3>
        <p class="text-sm text-base-content/60 mb-8 px-4">
          Tindakan ini akan menghapus foto profil kustom milik <b>{{ user.name }}</b> secara permanen.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <button @click="showDeleteConfirm = false" class="btn btn-ghost flex-1 rounded-2xl order-2 sm:order-1">Batal</button>
          <button 
            @click="deleteUserPhoto" 
            class="btn btn-error text-white flex-1 rounded-2xl shadow-lg shadow-error/20 order-1 sm:order-2"
            :disabled="isDeletingPhoto"
          >
            <span v-if="isDeletingPhoto" class="loading loading-spinner loading-xs"></span>
            Ya, Hapus
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--bc), 0.1); border-radius: 10px; }
</style>
