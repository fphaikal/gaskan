# Profile Card Bento Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merombak tampilan `ProfileCard.vue` dari layout tabel vertikal ke arsitektur Bento Grid modern.

**Architecture:** Menerapkan CSS Grid dengan Tailwind CSS (`grid-cols-1 md:grid-cols-3 gap-4`) untuk membuat kotak-kotak informasi yang modular. Memecah Identity, Personal Info, Contact, Vehicle, dan Security menjadi card terpisah. Mempertahankan semua fungsi API dan state eksisting (modal DaisyUI).

**Tech Stack:** Vue 3, TailwindCSS, DaisyUI.

---

### Task 1: Setup Bento Grid Container & Identity Block

**Files:**
- Modify: `c:\Users\fahreza.haikal\Documents\GitHub\gaskan\components\ProfileCard.vue`

- [ ] **Step 1: Replace main template structure with CSS Grid container**

Ubah bagian `<template>` untuk mulai menggunakan Grid dan masukkan *Identity Block*.

```vue
    <!-- ====== Profile Section Start ====== -->
    <div v-if="user" class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-4">
      
      <!-- 1. Identity Block (Span Full/2 cols) -->
      <div class="col-span-1 md:col-span-3 lg:col-span-2 overflow-hidden rounded-2xl bg-base-100 shadow-sm border border-base-200">
        <div class="relative z-20 h-35 md:h-48">
          <img src="../public/banner.webp" alt="profile cover" class="h-full w-full object-cover object-center" />
        </div>
        <div class="px-4 pb-6 lg:pb-8 text-center relative">
          <div class="relative z-30 mx-auto -mt-16 h-32 w-32 rounded-full bg-base-100 p-1 shadow-sm sm:h-40 sm:w-40 sm:p-2">
            <div class="relative z-20 h-full w-full mx-auto rounded-full overflow-hidden">
              <img :src="user.url_picture" alt="profile photo" class="h-full w-full object-cover object-center" />
            </div>
          </div>
          <div class="mt-4">
            <h3 class="mb-1 text-2xl font-bold text-base-content">{{ user.Nama || '' }}</h3>
            <p class="font-medium text-base-content/70">{{ user.Kelas }}</p>
            <div class="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-base-200 text-base-content/80 rounded-full text-sm font-semibold">
              NIS: {{ user.NIS }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Placeholder for next blocks -->
      <div id="bento-right-col" class="col-span-1 flex flex-col gap-4 md:gap-6">
      </div>

    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
```

*(Note: Pastikan kode di atas menggantikan struktur `Profile Section Start` yang lama hingga sebelum tabel yang lama, namun tabel lamanya kita pindahkan bertahap).*

- [ ] **Step 2: Verify in browser**
Run: Buka http://localhost:3000/profile (atau cek log `bun dev`).
Expected: Terdapat blok utama dengan foto profil di tengah, banner, nama, kelas, dan NIS.

- [ ] **Step 3: Commit**
```bash
git add components/ProfileCard.vue
git commit -m "feat(ui): implement bento grid container and identity block in profile"
```

---

### Task 2: Implement Contact & Vehicle Blocks

**Files:**
- Modify: `c:\Users\fahreza.haikal\Documents\GitHub\gaskan\components\ProfileCard.vue`

- [ ] **Step 1: Add Contact & Vehicle Blocks inside the right column**

Ganti `div id="bento-right-col"` dengan kode ini:

```vue
      <!-- Right Column (Contact & Vehicle) -->
      <div class="col-span-1 flex flex-col gap-4 md:gap-6">
        
        <!-- Contact Block -->
        <div class="rounded-2xl bg-base-100 p-5 shadow-sm border border-base-200 relative group transition-all duration-300 hover:shadow-md">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider">Kontak</h4>
            <button onclick="editNomor.showModal()" class="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:text-primary transition-colors" title="Edit Nomor">
              <Icon name="flowbite:edit-solid" size="18" />
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success">
              <Icon name="mingcute:phone-fill" size="24" />
            </div>
            <div>
              <p class="text-sm text-base-content/50">WhatsApp / Telp</p>
              <p class="text-lg font-bold text-base-content">{{ user.Nomor || 'Belum Diatur' }}</p>
            </div>
          </div>
        </div>

        <!-- Vehicle Block -->
        <div class="rounded-2xl bg-base-100 p-5 shadow-sm border border-base-200 relative group transition-all duration-300 hover:shadow-md">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider">Kendaraan</h4>
            <button onclick="editPlat.showModal()" class="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:text-primary transition-colors" title="Edit Plat Nomor">
              <Icon name="flowbite:edit-solid" size="18" />
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-full bg-info/10 text-info">
              <Icon name="mingcute:car-fill" size="24" />
            </div>
            <div>
              <p class="text-sm text-base-content/50">Plat Nomor</p>
              <div class="mt-1 px-3 py-1 bg-base-200 border border-base-300 rounded text-center">
                <span class="text-md font-mono font-bold tracking-widest text-base-content">{{ user.Plat_Nomor || '----' }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
```

- [ ] **Step 2: Verify in browser**
Run: Buka http://localhost:3000/profile.
Expected: Terdapat 2 blok (Kontak dan Kendaraan) di sebelah kanan (atau di bawah di mobile). Tombol edit memanggil modal eksisting.

- [ ] **Step 3: Commit**
```bash
git add components/ProfileCard.vue
git commit -m "feat(ui): add contact and vehicle bento blocks"
```

---

### Task 3: Implement Personal Info & Security Blocks

**Files:**
- Modify: `c:\Users\fahreza.haikal\Documents\GitHub\gaskan\components\ProfileCard.vue`

- [ ] **Step 1: Add Personal Info & Security blocks below Identity**

Hapus layout tabel lama (`<div v-if="user" class="bg-dark shadow-default rounded-md mt-3 p-5">...`) dan tombol change password lama, lalu tambahkan kode ini di dalam div `grid` (setelah penutup blok identitas dan sebelum penutup div grid):

```vue
      <!-- Bottom Row: Personal Info & Security -->
      <div class="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-2">
        
        <!-- Personal Info Block -->
        <div class="rounded-2xl bg-base-100 p-5 shadow-sm border border-base-200">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-base-200">
            <h4 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider">Informasi Pribadi</h4>
          </div>
          <div class="flex flex-col gap-4">
            <div class="flex items-start gap-3">
              <Icon name="mingcute:calendar-fill" size="20" class="text-base-content/40 mt-0.5" />
              <div class="flex-1">
                <p class="text-xs text-base-content/50">Tempat, Tanggal Lahir</p>
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-base-content">{{ user.TTL || 'Belum Diatur' }}</p>
                  <!-- <button onclick="editTTL.showModal()" class="text-base-content/40 hover:text-primary transition-colors">
                    <Icon name="flowbite:edit-solid" size="16" />
                  </button> -->
                </div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="mingcute:user-info-fill" size="20" class="text-base-content/40 mt-0.5" />
              <div>
                <p class="text-xs text-base-content/50">Gender / Agama</p>
                <p class="text-sm font-medium text-base-content">{{ gender(user.Gender) }} &bull; {{ user.Agama || 'Belum Diatur' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="mingcute:location-fill" size="20" class="text-base-content/40 mt-0.5" />
              <div>
                <p class="text-xs text-base-content/50">Alamat</p>
                <p class="text-sm font-medium text-base-content">{{ user.Alamat || 'Belum Diatur' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Block -->
        <div class="rounded-2xl bg-base-100 p-5 shadow-sm border border-base-200 flex flex-col justify-center">
          <h4 class="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">Keamanan Akun</h4>
          <p class="text-sm text-base-content/70 mb-4">Pastikan kata sandi Anda kuat dan tidak dibagikan ke siapapun.</p>
          <div v-if="user.Nomor">
            <button onclick="changePass.showModal()" class="btn btn-primary w-full sm:w-auto gap-2">
              <Icon name="mingcute:key-2-fill" size="18" />
              Ganti Password
            </button>
          </div>
          <div v-else class="p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning-content flex items-start gap-2">
            <Icon name="mingcute:warning-fill" size="20" class="shrink-0 text-warning" />
            <p>Isi nomor WhatsApp/Telepon kamu terlebih dahulu pada kolom Kontak untuk dapat mengganti password.</p>
          </div>
        </div>
      </div>
```

*(Pastikan `<div v-if="user"> <dialog v-if="user.Nomor" ...>` bagian bawah untuk modal tetap dipertahankan utuh).*

- [ ] **Step 2: Verify in browser**
Run: Buka http://localhost:3000/profile.
Expected: Tampilan lama berupa tabel sudah hilang digantikan bento grid yang modern. Semua info dari tabel sudah pindah ke card Personal Info dan Security. Tombol Change Password berfungsi.

- [ ] **Step 3: Commit**
```bash
git add components/ProfileCard.vue
git commit -m "feat(ui): complete profile bento grid with personal info and security blocks"
```

---

### Task 4: Fix Modal Styling

**Files:**
- Modify: `c:\Users\fahreza.haikal\Documents\GitHub\gaskan\components\ProfileCard.vue`

- [ ] **Step 1: Replace hardcoded bg-dark inside modals**

Dalam `ProfileCard.vue` terdapat 4 `<dialog>` modal. Masing-masing memiliki hardcoded class `bg-dark` dan text color seperti `text-white`. Ubah agar menggunakan semantic UI DaisyUI (`bg-base-100`, `text-base-content`, dll).

Contoh yang perlu di-edit (gunakan global find/replace untuk `modal-box bg-dark`):
- `class="modal-box bg-dark"` -> `class="modal-box bg-base-100 border border-base-300 shadow-xl"`
- `<label for="TTL" class="text-white">` -> `<label for="TTL" class="text-base-content font-medium text-sm">`
- `class="input input-bordered bg-dark"` -> `class="input input-bordered w-full bg-base-100"`

*Note: Pastikan semua modal diedit: `editTTL`, `editNomor`, `editPlat`, dan kedua versi `changePass`.*

- [ ] **Step 2: Verify in browser**
Run: Klik tombol edit Kontak di profile card.
Expected: Modal muncul dengan warna yang sesuai dengan tema (light/dark mode) tidak terjebak di bg-dark terus-menerus.

- [ ] **Step 3: Commit**
```bash
git add components/ProfileCard.vue
git commit -m "fix(ui): update modal styling in profile card to use theme semantic colors"
```
