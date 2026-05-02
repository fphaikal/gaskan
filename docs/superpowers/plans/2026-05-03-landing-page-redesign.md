# GASKAN Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the GASKAN landing page (`/`) into a full, polished, friendly & energetic landing page with dark/light mode toggle.

**Architecture:** Modular Landing components in `components/Landing/`, theme state via `composables/useTheme.ts`, new DaisyUI light theme tokens in `tailwind.css`. The `pages/index.vue` is reworked to compose these components.

**Tech Stack:** Nuxt 4, Vue 3, TailwindCSS v4, DaisyUI v5, VueUse (`useStorage`, `useIntersectionObserver`), `@nuxt/icon` (mingcute icons)

**Spec:** `docs/superpowers/specs/2026-05-03-landing-page-redesign.md`

---

## Task 1: Light Theme Tokens + useTheme Composable

**Files:**
- Modify: `assets/css/tailwind.css`
- Create: `composables/useTheme.ts`
- Modify: `app.vue`

- [ ] **Step 1: Add light theme tokens to tailwind.css**

Add after the existing `[data-theme="mytheme"]` block:

```css
[data-theme="mytheme-light"] {
  --p: 83.4% 0.164 85.84;      /* primary yellow - same */
  --pf: 73.4% 0.164 85.84;
  --pc: 20% 0.05 85;
  --s: 83.1% 0.015 286.37;
  --sf: 73.1% 0.015 286.37;
  --sc: 20% 0.01 286;
  --a: 82.7% 0.103 134.77;
  --af: 72.7% 0.103 134.77;
  --ac: 20% 0.05 134;
  --n: 75% 0.02 285;
  --nf: 70% 0.02 285;
  --nc: 20% 0.01 285;
  --b1: 97% 0.015 85;           /* warm cream background */
  --b2: 100% 0 0;               /* white surface */
  --b3: 93% 0.015 85;
  --bc: 17.3% 0.021 285.27;    /* dark text */
  --in: 65.6% 0.145 247.01;
  --inc: 98% 0.01 247;
  --su: 71% 0.169 149.47;
  --suc: 20% 0.05 149;
  --wa: 82.5% 0.166 84.75;
  --wac: 20% 0.05 84;
  --er: 64.9% 0.196 18.63;
  --erc: 98% 0.01 18;
  --rounded-box: 1rem;
  --rounded-btn: 0.5rem;
  --rounded-badge: 1.9rem;
}
```

- [ ] **Step 2: Create `composables/useTheme.ts`**

```typescript
export const useTheme = () => {
  const theme = useStorage('gaskan-theme', 'mytheme')

  const isDark = computed(() => theme.value === 'mytheme')

  const toggleTheme = () => {
    theme.value = theme.value === 'mytheme' ? 'mytheme-light' : 'mytheme'
  }

  return { theme, isDark, toggleTheme }
}
```

- [ ] **Step 3: Update `app.vue` to use reactive theme**

```vue
<script setup>
const { theme } = useTheme()
</script>

<template>
  <div :data-theme="theme">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

- [ ] **Step 4: Verify dev server still runs**

Run: `bun dev` — check `http://localhost:3000` loads without errors.

- [ ] **Step 5: Commit**

```bash
git add assets/css/tailwind.css composables/useTheme.ts app.vue
git commit -m "feat: add light theme tokens and useTheme composable"
```

---

## Task 2: LandingNavbar Component

**Files:**
- Create: `components/Landing/Navbar.vue`

- [ ] **Step 1: Create `components/Landing/Navbar.vue`**

```vue
<script setup>
const { isDark, toggleTheme } = useTheme()
const scrolled = ref(false)

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 10
  })
})
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="scrolled ? 'backdrop-blur-md bg-base-100/80 shadow-sm' : 'bg-transparent'"
  >
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <Icon name="mingcute:key-2-fill" class="text-primary text-2xl" />
        <span class="text-xl font-extrabold tracking-tight">GASKAN</span>
      </div>

      <!-- Nav links (desktop) -->
      <div class="hidden md:flex items-center gap-8 text-sm font-medium">
        <a href="#fitur" class="opacity-70 hover:opacity-100 transition-opacity">Fitur</a>
        <a href="#statistik" class="opacity-70 hover:opacity-100 transition-opacity">Statistik</a>
        <a href="#faq" class="opacity-70 hover:opacity-100 transition-opacity">FAQ</a>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- Theme toggle -->
        <button
          id="theme-toggle"
          @click="toggleTheme"
          class="btn btn-ghost btn-sm btn-circle"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Icon v-if="isDark" name="mingcute:sun-line" class="text-xl" />
          <Icon v-else name="mingcute:moon-line" class="text-xl" />
        </button>

        <!-- Login CTA -->
        <a href="/login" id="nav-login-btn" class="btn btn-primary btn-sm rounded-lg font-semibold">
          Masuk
        </a>
      </div>
    </div>
  </nav>
</template>
```

- [ ] **Step 2: Verify in browser**

Navbar should appear fixed at top, transparent initially, blurred on scroll.

- [ ] **Step 3: Commit**

```bash
git add components/Landing/Navbar.vue
git commit -m "feat: add LandingNavbar with theme toggle and scroll effect"
```

---

## Task 3: LandingHero Component

**Files:**
- Create: `components/Landing/Hero.vue`
- Modify: `assets/css/tailwind.css` (add @keyframes)

- [ ] **Step 1: Add custom keyframes to `tailwind.css`**

Add before the last line:

```css
@keyframes orbit {
  from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-12px); }
}

@utility animate-orbit {
  animation: orbit 4s linear infinite;
}

@utility animate-orbit-delay {
  animation: orbit 4s linear infinite;
  animation-delay: -1.33s;
}

@utility animate-orbit-delay2 {
  animation: orbit 4s linear infinite;
  animation-delay: -2.66s;
}

@utility animate-float {
  animation: float 3s ease-in-out infinite;
}
```

- [ ] **Step 2: Create `components/Landing/Hero.vue`**

```vue
<template>
  <section class="min-h-screen flex items-center pt-20 pb-16 relative overflow-hidden">
    <!-- Background blobs -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

    <!-- Dot grid background -->
    <div
      class="absolute inset-0 pointer-events-none opacity-20"
      style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 32px 32px;"
    />

    <div class="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
      <!-- Left: Text -->
      <div class="space-y-6">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-sm font-semibold">
          <span>✨</span>
          <span>Sistem Absensi Digital SMTI Jogja</span>
        </div>

        <!-- Heading -->
        <h1 class="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight">
          Gerbang Akses
          <span class="text-primary">Pintar</span>
          dan Kehadiran
        </h1>

        <!-- Subtext -->
        <p class="text-lg opacity-70 max-w-lg">
          Kelola dan pantau kehadiran siswa secara real-time dengan mudah, cepat, dan akurat.
        </p>

        <!-- CTA buttons -->
        <div class="flex flex-wrap gap-3">
          <a href="/login" id="hero-cta-primary" class="btn btn-primary rounded-xl font-bold px-6">
            Mulai Sekarang
            <Icon name="mingcute:arrow-right-line" />
          </a>
          <a href="#fitur" id="hero-cta-secondary" class="btn btn-ghost border border-current rounded-xl font-bold px-6 opacity-70 hover:opacity-100">
            Pelajari Lebih Lanjut
          </a>
        </div>
      </div>

      <!-- Right: Animation widget -->
      <div class="flex flex-col items-center gap-6">
        <!-- Orbit animation container -->
        <div class="relative w-56 h-56 flex items-center justify-center">
          <!-- Pulsing ring -->
          <div class="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" style="animation-duration: 2s;" />
          <div class="absolute inset-4 rounded-full border border-primary/20 animate-ping" style="animation-duration: 2.5s; animation-delay: 0.5s;" />

          <!-- Main circle -->
          <div class="w-36 h-36 rounded-full bg-primary/10 border-2 border-primary/50 flex items-center justify-center z-10">
            <Icon name="mingcute:fingerprint-line" class="text-6xl text-primary" />
          </div>

          <!-- Orbiting dots -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-3 h-3 rounded-full bg-primary animate-orbit" />
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-primary/70 animate-orbit-delay" />
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-primary/50 animate-orbit-delay2" />
          </div>
        </div>

        <!-- Floating attendance card -->
        <div class="animate-float backdrop-blur-md bg-base-100/60 border border-primary/30 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl">
          <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Icon name="mingcute:check-circle-fill" class="text-green-500 text-xl" />
          </div>
          <div>
            <p class="font-bold text-sm">Budi Santoso</p>
            <p class="text-xs opacity-60">Hadir · 07:32 WIB</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Verify animation in browser**

Dots should orbit, card should float up/down gently, rings should pulse.

- [ ] **Step 4: Commit**

```bash
git add components/Landing/Hero.vue assets/css/tailwind.css
git commit -m "feat: add LandingHero with CSS orbit and float animations"
```

---

## Task 4: LandingFeatures Component

**Files:**
- Create: `components/Landing/Features.vue`

- [ ] **Step 1: Create `components/Landing/Features.vue`**

```vue
<template>
  <section id="fitur" class="py-20 bg-base-200">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Section header -->
      <div class="text-center mb-14 space-y-3">
        <h2 class="text-3xl md:text-4xl font-bold">Kenapa <span class="text-primary">GASKAN</span>?</h2>
        <p class="opacity-60 max-w-xl mx-auto">Dirancang khusus untuk memudahkan pengelolaan kehadiran di lingkungan sekolah.</p>
      </div>

      <!-- Feature cards grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bg-base-100 rounded-2xl border border-base-300 p-6 flex flex-col gap-4 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-default"
        >
          <div class="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon :name="feature.icon" class="text-2xl text-primary" />
          </div>
          <div>
            <h3 class="font-bold text-base mb-1">{{ feature.title }}</h3>
            <p class="text-sm opacity-60 leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const features = [
  {
    icon: 'mingcute:time-fill',
    title: 'Absensi Real-time',
    description: 'Catat kehadiran siswa secara langsung tanpa penundaan dan sinkronisasi instan.'
  },
  {
    icon: 'mingcute:chart-bar-2-fill',
    title: 'Rekap Otomatis',
    description: 'Laporan kehadiran tersusun rapi dan dapat diakses kapan saja oleh admin.'
  },
  {
    icon: 'mingcute:eye-2-fill',
    title: 'Monitor Kehadiran',
    description: 'Pantau status kehadiran seluruh siswa dalam satu dashboard yang informatif.'
  },
  {
    icon: 'mingcute:lock-fill',
    title: 'Akses Multi-Role',
    description: 'Sistem hak akses terpisah untuk siswa, admin sekolah, dan developer.'
  }
]
</script>
```

- [ ] **Step 2: Verify cards in browser**

All 4 cards should render, hover scale effect should work.

- [ ] **Step 3: Commit**

```bash
git add components/Landing/Features.vue
git commit -m "feat: add LandingFeatures with 4 feature cards"
```

---

## Task 5: LandingStats Component

**Files:**
- Create: `components/Landing/Stats.vue`

- [ ] **Step 1: Create `components/Landing/Stats.vue`**

```vue
<script setup>
const statsRef = ref(null)
const animated = ref(false)

const stats = [
  { value: 500, suffix: '+', label: 'Siswa Terdaftar' },
  { value: 99, suffix: '.9%', label: 'Uptime Sistem' },
  { value: 3, suffix: '', label: 'Role Pengguna' },
  { value: 1, suffix: '', label: 'Sekolah Terhubung' }
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

useIntersectionObserver(statsRef, ([entry]) => {
  if (entry.isIntersecting) animateCountUp()
})
</script>

<template>
  <section id="statistik" ref="statsRef" class="py-20">
    <div class="max-w-6xl mx-auto px-4">
      <div class="text-center mb-14 space-y-3">
        <h2 class="text-3xl md:text-4xl font-bold">GASKAN dalam <span class="text-primary">Angka</span></h2>
        <p class="opacity-60">Data yang mencerminkan kepercayaan pengguna GASKAN.</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(stat, i) in stats"
          :key="stat.label"
          class="text-center p-6 rounded-2xl bg-base-200 border border-base-300"
        >
          <p class="text-4xl md:text-5xl font-extrabold text-primary">
            {{ displayed[i] }}{{ stat.suffix }}
          </p>
          <p class="mt-2 text-sm opacity-60 font-medium">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Verify count-up animation**

Scroll down to stats section — numbers should animate from 0.

- [ ] **Step 3: Commit**

```bash
git add components/Landing/Stats.vue
git commit -m "feat: add LandingStats with scroll-triggered count-up animation"
```

---

## Task 6: LandingFAQ Component

**Files:**
- Create: `components/Landing/FAQ.vue`

- [ ] **Step 1: Create `components/Landing/FAQ.vue`**

```vue
<script setup>
const faqs = [
  {
    q: 'Apa itu GASKAN?',
    a: 'GASKAN (Gerbang Akses Pintar dan Kehadiran) adalah sistem manajemen kehadiran digital yang dikembangkan khusus untuk SMTI Jogja.'
  },
  {
    q: 'Siapa yang bisa menggunakan GASKAN?',
    a: 'GASKAN memiliki tiga role pengguna: Siswa (melihat data kehadiran sendiri), Admin (mengelola seluruh data kehadiran), dan Developer (akses penuh termasuk monitoring sistem).'
  },
  {
    q: 'Apakah data kehadiran aman?',
    a: 'Ya. Data disimpan di server yang aman dengan sistem autentikasi berlapis. Setiap pengguna hanya dapat mengakses data sesuai role-nya.'
  },
  {
    q: 'Bagaimana cara login ke GASKAN?',
    a: 'Gunakan NIS (Nomor Induk Siswa) dan password yang diberikan oleh admin sekolah. Hubungi admin jika mengalami masalah login.'
  },
  {
    q: 'Apakah GASKAN gratis digunakan?',
    a: 'Ya, GASKAN adalah sistem internal SMTI Jogja yang dikembangkan oleh tim developer sekolah dan tidak dikenakan biaya apapun.'
  }
]
</script>

<template>
  <section id="faq" class="py-20 bg-base-200">
    <div class="max-w-3xl mx-auto px-4">
      <div class="text-center mb-14 space-y-3">
        <h2 class="text-3xl md:text-4xl font-bold">Pertanyaan <span class="text-primary">Umum</span></h2>
        <p class="opacity-60">Jawaban untuk pertanyaan yang sering ditanyakan tentang GASKAN.</p>
      </div>

      <div class="space-y-3">
        <div
          v-for="(faq, i) in faqs"
          :key="i"
          class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl"
        >
          <input type="radio" name="faq-accordion" :id="`faq-${i}`" />
          <div class="collapse-title font-semibold text-base">
            {{ faq.q }}
          </div>
          <div class="collapse-content">
            <p class="opacity-70 text-sm leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 2: Verify accordion behavior**

Clicking each FAQ should expand/collapse smoothly.

- [ ] **Step 3: Commit**

```bash
git add components/Landing/FAQ.vue
git commit -m "feat: add LandingFAQ with DaisyUI accordion"
```

---

## Task 7: LandingFooter Component

**Files:**
- Create: `components/Landing/Footer.vue`

- [ ] **Step 1: Create `components/Landing/Footer.vue`**

```vue
<template>
  <footer class="border-t border-base-300 py-8">
    <div class="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
      <div class="flex items-center gap-2">
        <Icon name="mingcute:key-2-fill" class="text-primary" />
        <span>© 2025 GASKAN — SMTI Jogja</span>
      </div>
      <span>Dibuat dengan <span class="text-red-400">❤️</span> oleh Tim Developer SMTI Jogja</span>
    </div>
  </footer>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/Landing/Footer.vue
git commit -m "feat: add LandingFooter"
```

---

## Task 8: Assemble pages/index.vue

**Files:**
- Modify: `pages/index.vue`

- [ ] **Step 1: Replace `pages/index.vue` content**

```vue
<script setup>
definePageMeta({ layout: 'blank' })

useSeoMeta({
  title: 'GASKAN',
  ogTitle: 'GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran — Sistem Absensi Digital SMTI Jogja',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran — Sistem Absensi Digital SMTI Jogja',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
  twitterCard: 'summary_large_image',
  twitterTitle: 'GASKAN',
  twitterDescription: 'Gerbang Akses Pintar dan Kehadiran — Sistem Absensi Digital SMTI Jogja',
  twitterImage: '/banner.webp',
  twitterUrl: 'https://gaskan.smtijogja.sch.id',
})
</script>

<template>
  <div>
    <LandingNavbar />
    <main>
      <LandingHero />
      <LandingFeatures />
      <LandingStats />
      <LandingFAQ />
    </main>
    <LandingFooter />
  </div>
</template>
```

- [ ] **Step 2: Full visual review in browser**

Check: `http://localhost:3000`
- [ ] Dark mode looks correct
- [ ] Toggle button switches to light mode (cream background, dark text)
- [ ] Theme persists on refresh
- [ ] All 6 sections present and scrollable
- [ ] Smooth scroll to `#fitur`, `#statistik`, `#faq` works
- [ ] Animations: orbit dots, float card, pulse rings
- [ ] Count-up triggers on scroll to Stats
- [ ] FAQ accordion opens/closes
- [ ] "Masuk" and "Mulai Sekarang" buttons navigate to `/login`
- [ ] Mobile: stacked layout, hamburger menu (if implemented)
- [ ] Other pages (`/login`, `/home`) are NOT broken

- [ ] **Step 3: Final commit**

```bash
git add pages/index.vue
git commit -m "feat: assemble GASKAN landing page with all sections"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Dark + Light mode toggle | Task 1, 2 |
| Sticky glassmorphism navbar | Task 2 |
| Hero with CSS animation (orbit, float, pulse) | Task 3 |
| 4 Feature cards with hover effects | Task 4 |
| Static stats with count-up on scroll | Task 5 |
| FAQ accordion | Task 6 |
| Footer | Task 7 |
| Assemble in index.vue | Task 8 |
| Theme persisted in localStorage | Task 1 |
| SEO meta tags | Task 8 |
| No breaking changes to other pages | Task 8 step 2 |
