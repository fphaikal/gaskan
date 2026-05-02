<script setup>
const faqs = [
  {
    q: 'Apa itu GASKAN?',
    a: 'GASKAN (Gerbang Akses Pintar dan Kehadiran) adalah sistem manajemen kehadiran digital yang dikembangkan khusus untuk SMTI Jogja guna memudahkan pencatatan dan pemantauan absensi siswa secara real-time.'
  },
  {
    q: 'Siapa yang bisa menggunakan GASKAN?',
    a: 'GASKAN memiliki tiga role pengguna: Siswa (dapat melihat data kehadiran sendiri), Admin (mengelola seluruh data kehadiran dan laporan), dan Developer (akses penuh termasuk monitoring sistem dan konfigurasi).'
  },
  {
    q: 'Apakah data kehadiran aman?',
    a: 'Ya. Data disimpan di server yang aman dengan sistem autentikasi berlapis. Setiap pengguna hanya dapat mengakses data sesuai role-nya, sehingga privasi dan keamanan data terjaga.'
  },
  {
    q: 'Bagaimana cara login ke GASKAN?',
    a: 'Gunakan NIS (Nomor Induk Siswa) dan password yang diberikan oleh admin sekolah. Jika mengalami masalah login, segera hubungi admin atau guru yang bertanggung jawab.'
  },
  {
    q: 'Apakah GASKAN gratis digunakan?',
    a: 'Ya, GASKAN adalah sistem internal SMTI Jogja yang dikembangkan oleh tim developer siswa sekolah dan tidak dikenakan biaya apapun untuk penggunanya.'
  }
]
</script>

<template>
  <section id="faq" class="py-24 bg-base-200">
    <div class="max-w-3xl mx-auto px-4">
      <!-- Section header -->
      <div class="text-center mb-16 space-y-3">
        <div class="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
          FAQ
        </div>
        <h2 class="text-3xl md:text-4xl font-bold">
          Pertanyaan <span class="text-primary">Umum</span>
        </h2>
        <p class="opacity-50">Jawaban untuk pertanyaan yang sering ditanyakan tentang GASKAN.</p>
      </div>

      <!-- FAQ accordion -->
      <div class="space-y-3">
        <div
          v-for="(faq, i) in faqs"
          :key="i"
          class="collapse collapse-arrow bg-base-100 border border-base-300 hover:border-primary/30 rounded-2xl transition-colors duration-200"
        >
          <input type="radio" name="faq-accordion" :id="`faq-${i}`" />
          <div class="collapse-title font-semibold text-base pr-8">
            {{ faq.q }}
          </div>
          <div class="collapse-content">
            <p class="opacity-60 text-sm leading-relaxed pt-1">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
