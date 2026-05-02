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
          <a
            href="/login"
            id="hero-cta-primary"
            class="btn btn-primary rounded-xl font-bold px-7 shadow-lg hover:shadow-primary/40 transition-shadow duration-300"
          >
            Mulai Sekarang
            <Icon name="mingcute:arrow-right-line" class="ml-1" />
          </a>
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

        <!-- Floating attendance card -->
        <div class="animate-float backdrop-blur-md bg-base-100/70 border border-primary/30 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl">
          <div class="w-11 h-11 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
            <Icon name="mingcute:check-circle-fill" class="text-green-500 text-2xl" />
          </div>
          <div>
            <p class="font-bold text-sm">Budi Santoso</p>
            <p class="text-xs opacity-50 mt-0.5">Hadir · 07:32 WIB</p>
          </div>
          <div class="ml-3 text-xs text-primary font-semibold opacity-80 shrink-0">
            ✓ Terverifikasi
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
