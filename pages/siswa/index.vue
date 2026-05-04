<script setup>
const { data } = useFetch(`/api/primary`);

const users = ref([]);
const selectedClass = ref('');
const searchQuery = ref('');
const classOptions = ref([]);

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const isNotAdmin = user.Kelas !== 'admin' && user.Kelas !== 'developer';
    const matchesClass = selectedClass.value === '' || user.Kelas === selectedClass.value;
    const matchesSearch = searchQuery.value === '' || 
      user.Nama.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      user.NIS.includes(searchQuery.value);
    
    return isNotAdmin && matchesClass && matchesSearch;
  });
});

// Watch for changes in data and update users and classOptions accordingly
watch(data, (newData) => {
  if (newData) {
    users.value = Array.isArray(newData) ? newData : [];
    classOptions.value = [...new Set(users.value.map(user => user.Kelas))];
    classOptions.value = classOptions.value.filter(classOption => classOption !== 'admin' && classOption !== 'developer');
  }
});

onMounted(() => {
  if (data.value) {
    users.value = Array.isArray(data.value) ? data.value : [];
    classOptions.value = [...new Set(users.value.map(user => user.Kelas))];
    classOptions.value = classOptions.value.filter(classOption => classOption !== 'admin' && classOption !== 'developer');
  }
});

useSeoMeta({
  title: 'Daftar Siswa | GASKAN',
  ogTitle: 'Daftar Siswa | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/siswa',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/siswa',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Daftar Siswa | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/siswa`,
})
</script>

<template>
  <div class="px-4 pb-12 max-w-7xl mx-auto py-6">
    
    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-4xl font-black tracking-tight text-base-content mb-3">Daftar Siswa</h1>
      <p class="text-base-content/60 text-base">Kelola dan lihat direktori data siswa secara menyeluruh</p>
    </div>

    <!-- Filters Section -->
    <div class="flex flex-col md:flex-row gap-4 mb-8 bg-base-100 p-4 rounded-3xl border border-base-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative z-10">
      <!-- Search input -->
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon name="mingcute:search-line" size="20" class="text-base-content/40" />
        </div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari nama atau NIS siswa..." 
          class="input input-bordered w-full pl-11 bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] border-transparent rounded-2xl transition-all font-medium"
        >
      </div>
      
      <!-- Class Select -->
      <div class="relative w-full md:w-64 shrink-0">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Icon name="mingcute:filter-2-line" size="20" class="text-base-content/40" />
        </div>
        <select v-model="selectedClass" class="select select-bordered w-full pl-11 bg-base-200/50 focus:bg-base-100 focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--primary),0.1)] border-transparent rounded-2xl appearance-none transition-all font-bold">
          <option value="">Semua Kelas</option>
          <option v-for="option in classOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
    </div>

    <!-- List Container -->
    <div class="bg-base-100 border border-base-200/80 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      
      <!-- List Header (Desktop) -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-base-200/50 border-b border-base-200/80 text-xs font-black text-base-content/50 uppercase tracking-widest">
        <div class="col-span-3 pl-14">NIS</div>
        <div class="col-span-6">Nama Siswa</div>
        <div class="col-span-3 text-right pr-2">Kelas</div>
      </div>

      <!-- Loading State -->
      <div v-if="!data && users.length === 0" class="p-20 flex justify-center items-center">
        <span class="loading loading-spinner loading-lg text-primary opacity-50"></span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="p-20 flex flex-col items-center justify-center text-base-content/40">
        <div class="relative w-20 h-20 mb-5 flex items-center justify-center rounded-3xl bg-base-200/50 border border-base-300/50">
          <Icon name="mingcute:user-x-line" size="40" class="opacity-50" />
        </div>
        <p class="font-medium text-xl">Siswa tidak ditemukan.</p>
        <p class="text-sm mt-2">Coba ubah kata kunci pencarian atau filter kelas.</p>
      </div>

      <!-- User List -->
      <div v-else class="divide-y divide-base-200/60 relative">
        <TransitionGroup name="list">
          <NuxtLink :to="'/siswa/'+ user.NIS" class="block group relative overflow-hidden transition-colors hover:bg-base-200/30" v-for="user in filteredUsers" :key="user.NIS">
            
            <!-- Hover indicator line -->
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300"></div>
            
            <div class="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-6 py-5 items-start md:items-center">
              
              <!-- NIS & Icon -->
              <div class="md:col-span-3 flex items-center gap-4">
                 <div class="w-10 h-10 rounded-xl bg-base-200 text-base-content/50 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
                   <Icon name="mingcute:user-3-fill" size="20" />
                 </div>
                 <span class="text-base-content/60 font-mono font-bold text-sm">{{ user.NIS }}</span>
              </div>
              
              <!-- Nama -->
              <div class="md:col-span-6 w-full">
                <h3 class="text-base-content font-bold text-lg md:text-base group-hover:text-primary transition-colors truncate">{{ user.Nama }}</h3>
              </div>
              
              <!-- Kelas -->
              <div class="md:col-span-3 md:text-right w-full flex md:justify-end">
                <span class="bg-base-200 text-base-content/70 border border-base-300/60 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">{{ user.Kelas }}</span>
              </div>

            </div>
          </NuxtLink>
        </TransitionGroup>
      </div>
      
      <!-- Footer Info -->
      <div class="px-6 py-4 bg-base-200/30 border-t border-base-200/80 text-xs font-bold text-base-content/50 uppercase tracking-widest flex justify-between items-center">
        <span>Menampilkan {{ filteredUsers.length }} Siswa</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transition Group Animations for Search Filtering */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
