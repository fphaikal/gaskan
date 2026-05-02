<script setup>
const features = [
  {
    icon: 'mingcute:time-fill',
    title: 'Absensi Real-time',
    description: 'Catat kehadiran siswa secara langsung tanpa penundaan dan sinkronisasi instan ke sistem.'
  },
  {
    icon: 'mingcute:chart-bar-2-fill',
    title: 'Rekap Otomatis',
    description: 'Laporan kehadiran tersusun rapi secara otomatis dan dapat diakses kapan saja oleh admin.'
  },
  {
    icon: 'mingcute:eye-2-fill',
    title: 'Monitor Kehadiran',
    description: 'Pantau status kehadiran seluruh siswa dalam satu dashboard yang informatif dan mudah dibaca.'
  },
  {
    icon: 'mingcute:lock-fill',
    title: 'Akses Multi-Role',
    description: 'Sistem hak akses terpisah untuk siswa, admin sekolah, dan developer dengan keamanan berlapis.'
  }
]
</script>

<template>
  <section id="fitur" class="py-24 bg-base-200">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Section header -->
      <div class="text-center mb-16 space-y-3">
        <div class="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
          Fitur Unggulan
        </div>
        <h2 class="text-3xl md:text-4xl font-bold">
          Kenapa <span class="text-primary">GASKAN</span>?
        </h2>
        <p class="opacity-50 max-w-xl mx-auto leading-relaxed">
          Dirancang khusus untuk memudahkan pengelolaan kehadiran di lingkungan sekolah, dengan teknologi yang andal dan mudah digunakan.
        </p>
      </div>

      <!-- Feature cards -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group bg-base-100 rounded-2xl border border-base-300 p-6 flex flex-col gap-4 hover:scale-105 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-default"
        >
          <!-- Icon -->
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            <Icon :name="feature.icon" class="text-2xl text-primary" />
          </div>
          <!-- Text -->
          <div>
            <h3 class="font-bold text-base mb-2">{{ feature.title }}</h3>
            <p class="text-sm opacity-50 leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
