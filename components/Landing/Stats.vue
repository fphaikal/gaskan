<script setup>
const statsRef = ref(null)
const animated = ref(false)

const stats = [
  { value: 500, suffix: '+', label: 'Siswa Terdaftar', icon: 'mingcute:group-fill' },
  { value: 99,  suffix: '.9%', label: 'Uptime Sistem', icon: 'mingcute:lightning-fill' },
  { value: 3,   suffix: '', label: 'Role Pengguna', icon: 'mingcute:shield-fill' },
  { value: 1,   suffix: '', label: 'Sekolah Terhubung', icon: 'mingcute:building-4-fill' }
]

const displayed = ref(stats.map(() => 0))

const animateCountUp = () => {
  if (animated.value) return
  animated.value = true
  stats.forEach((stat, i) => {
    const duration = 1500
    const steps = 60
    const increment = stat.value / steps
    let current = 0
    const interval = setInterval(() => {
      current = Math.min(current + increment, stat.value)
      displayed.value[i] = Math.floor(current)
      if (current >= stat.value) clearInterval(interval)
    }, duration / steps)
  })
}

const { stop } = useIntersectionObserver(statsRef, ([entry]) => {
  if (entry.isIntersecting) {
    animateCountUp()
    stop()
  }
})
</script>

<template>
  <section id="statistik" ref="statsRef" class="py-24">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Section header -->
      <div class="text-center mb-16 space-y-3">
        <div class="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
          Angka Berbicara
        </div>
        <h2 class="text-3xl md:text-4xl font-bold">
          GASKAN dalam <span class="text-primary">Angka</span>
        </h2>
        <p class="opacity-50">Data yang mencerminkan kepercayaan pengguna GASKAN setiap harinya.</p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(stat, i) in stats"
          :key="stat.label"
          class="text-center p-6 rounded-2xl bg-base-200 border border-base-300 hover:border-primary/30 transition-colors duration-300"
        >
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon :name="stat.icon" class="text-xl text-primary" />
          </div>
          <p class="text-4xl md:text-5xl font-extrabold text-primary tabular-nums">
            {{ displayed[i] }}{{ stat.suffix }}
          </p>
          <p class="mt-2 text-sm opacity-50 font-medium">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
