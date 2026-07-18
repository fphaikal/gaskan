<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/store/useAuthStore'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { authenticated } = storeToRefs(authStore)

const recentAttendances = ref([
  { name: 'Budi Santoso', timestamp: new Date().toISOString(), status: 'HADIR' },
  { name: 'Shalwa Andini', timestamp: new Date().toISOString(), status: 'HADIR' },
  { name: 'Fa\'iq Naufal', timestamp: new Date().toISOString(), status: 'HADIR' },
  { name: 'Muhammad Tier', timestamp: new Date().toISOString(), status: 'HADIR' },
  { name: 'Fahreza Pasha', timestamp: new Date().toISOString(), status: 'HADIR' }
])

const activeIndex = ref(0)
let cycleInterval = null

const fetchRecentAttendance = async () => {
  try {
    const res = await $fetch('/api/attendance/recent')
    if (res?.success && res.data?.length > 0) {
      recentAttendances.value = res.data
    }
  } catch (e) {
    console.error('Failed to fetch recent attendance for landing page:', e)
  }
}

const formatTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const getStatusLabel = (s) => {
  if (s === 'TERLAMBAT') return 'Terlambat'
  if (s === 'SAKIT') return 'Sakit'
  if (s === 'IZIN') return 'Izin'
  return 'Hadir'
}

const getStatusIconColor = (s) => {
  if (s === 'TERLAMBAT') return 'text-amber-500 bg-amber-500/15 border-amber-500/30'
  if (s === 'SAKIT') return 'text-orange-400 bg-orange-400/15 border-orange-400/30'
  if (s === 'IZIN') return 'text-sky-500 bg-sky-500/15 border-sky-500/30'
  return 'text-green-500 bg-green-500/15 border-green-500/30'
}

const getStatusIcon = (s) => {
  if (s === 'TERLAMBAT') return 'mingcute:time-fill'
  if (s === 'SAKIT') return 'mingcute:heart-fill'
  if (s === 'IZIN') return 'mingcute:document-fill'
  return 'mingcute:check-circle-fill'
}

onMounted(async () => {
  await fetchRecentAttendance()
  cycleInterval = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % recentAttendances.value.length
  }, 4000)
})

onUnmounted(() => {
  if (cycleInterval) clearInterval(cycleInterval)
})
</script>

<template>
  <section class="min-h-screen flex items-center pt-24 pb-16 relative overflow-hidden">
    <!-- Background blobs -->
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
    <div class="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none translate-y-1/4 -translate-x-1/4" />

    <!-- Dot grid background -->
    <div
      class="absolute inset-0 pointer-events-none opacity-10"
      style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 32px 32px;"
    />

    <div class="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
      <!-- Left: Text -->
      <div class="space-y-6">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-sm font-semibold">
          <span>✨</span>
          <span>Sistem Absensi Digital SMTI Jogja</span>
        </div>

        <!-- Heading -->
        <h1 class="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight">
          Gerbang Akses
          <span class="text-primary relative">
            Pintar
            <span class="absolute -bottom-1 left-0 right-0 h-1 bg-primary/30 rounded-full" />
          </span>
          dan Kehadiran
        </h1>

        <!-- Subtext -->
        <p class="text-lg opacity-60 max-w-lg leading-relaxed">
          Kelola dan pantau kehadiran siswa secara real-time dengan mudah, cepat, dan akurat.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-wrap gap-3 pt-2">
          <NuxtLink
            :to="authenticated ? '/home' : '/login'"
            id="hero-cta-primary"
            class="btn btn-primary rounded-xl font-bold px-7 shadow-lg hover:shadow-primary/40 transition-shadow duration-300"
          >
            {{ authenticated ? 'Ke Dashboard' : 'Mulai Sekarang' }}
            <Icon name="mingcute:arrow-right-line" class="ml-1" />
          </NuxtLink>
          <a
            href="#fitur"
            id="hero-cta-secondary"
            class="btn btn-ghost border border-current rounded-xl font-bold px-7 opacity-60 hover:opacity-100 transition-opacity"
          >
            Pelajari Lebih Lanjut
          </a>
        </div>
      </div>

      <!-- Right: Animation widget -->
      <div class="flex flex-col items-center justify-center gap-8">
        <!-- Orbit animation container -->
        <div class="relative w-64 h-64 flex items-center justify-center">
          <!-- Outer pulsing rings -->
          <div class="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style="animation-duration: 2.5s;" />
          <div class="absolute inset-6 rounded-full border border-primary/20 animate-ping" style="animation-duration: 3.2s; animation-delay: 0.8s;" />

          <!-- Main circle -->
          <div class="w-40 h-40 rounded-full bg-primary/10 border-2 border-primary/50 flex items-center justify-center z-10 shadow-xl shadow-primary/20">
            <Icon name="mingcute:fingerprint-line" class="text-7xl text-primary" />
          </div>

          <!-- Orbiting dot 1 -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-3.5 h-3.5 rounded-full bg-primary shadow-lg shadow-primary/50 animate-orbit" />
          </div>
          <!-- Orbiting dot 2 -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-2.5 h-2.5 rounded-full bg-primary/70 animate-orbit-delay" />
          </div>
          <!-- Orbiting dot 3 -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-2 h-2 rounded-full bg-primary/50 animate-orbit-delay2" />
          </div>
        </div>

        <!-- Floating attendance card with smooth transition -->
        <div class="animate-float h-20 flex items-center justify-center">
          <Transition name="slide-up" mode="out-in">
            <div 
              :key="activeIndex"
              class="backdrop-blur-md bg-base-100/70 border border-primary/30 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl w-80 max-w-full"
            >
              <div :class="['w-11 h-11 rounded-full border flex items-center justify-center shrink-0', getStatusIconColor(recentAttendances[activeIndex]?.status)]">
                <Icon :name="getStatusIcon(recentAttendances[activeIndex]?.status)" class="text-2xl" />
              </div>
              <div class="flex-1 min-w-0 text-left">
                <p class="font-bold text-sm truncate">{{ recentAttendances[activeIndex]?.name }}</p>
                <p class="text-xs opacity-50 mt-0.5">
                  {{ getStatusLabel(recentAttendances[activeIndex]?.status) }} · {{ formatTime(recentAttendances[activeIndex]?.timestamp) }} WIB
                </p>
              </div>
              <div class="text-xs text-primary font-semibold opacity-80 shrink-0">
                ✓ Terverifikasi
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.97);
}
</style>
