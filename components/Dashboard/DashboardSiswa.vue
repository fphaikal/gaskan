<script setup>
const props = defineProps({
  user: Object
});

const bentoCard = "bg-base-100 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50 transition-all duration-300 flex flex-col justify-center relative overflow-hidden";
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    
    <!-- Profil Siswa (2x1 on large) -->
    <div :class="[bentoCard, 'lg:col-span-2 bg-gradient-to-br from-primary/20 to-base-100']">
      <div class="flex items-center gap-6">
        <div class="avatar">
          <div class="w-20 rounded-full overflow-hidden bg-primary text-primary-content shadow-inner">
            <img v-if="user?.url_picture" :src="user.url_picture" :alt="user?.Nama" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-3xl font-bold">
              {{ user?.Nama?.charAt(0) || 'S' }}
            </div>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-base-content">Halo, {{ user?.Nama || 'Siswa' }}!</h2>
          <p class="text-base-content/70 mt-1">NIS: {{ user?.NIS || '-' }} | Siap belajar hari ini?</p>
        </div>
      </div>
    </div>

    <!-- Status Kehadiran Hari Ini (1x1) -->
    <div :class="bentoCard">
      <p class="text-base-content/70 font-medium mb-2">Status Hari Ini</p>
      <div class="flex items-center gap-3 text-success">
        <Icon name="mingcute:check-circle-fill" class="text-4xl" />
        <span class="text-2xl font-bold">HADIR</span>
      </div>
    </div>

    <!-- Pengumuman (1x1) -->
    <div :class="bentoCard">
      <p class="text-base-content/70 font-medium mb-2">Jadwal Selanjutnya</p>
      <p class="text-lg font-bold text-base-content">Matematika Dasar</p>
      <p class="text-sm text-base-content/70">08:00 - 09:30 | Ruang 101</p>
    </div>

    <!-- Statistik Bulanan (Full span on lg) -->
    <div :class="[bentoCard, 'lg:col-span-4']">
      <p class="text-base-content/70 font-medium mb-4">Rekap Absensi Bulan Ini</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-success mb-1">12</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Hadir</p>
        </div>
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-info mb-1">1</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Izin</p>
        </div>
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-warning mb-1">0</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Sakit</p>
        </div>
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-error mb-1">0</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Alpa</p>
        </div>
      </div>
    </div>
    
  </div>
</template>
