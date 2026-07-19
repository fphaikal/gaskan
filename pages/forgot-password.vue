<script setup>
definePageMeta({ layout: false })

const identifier = ref('')
const isLoading = ref(false)
const isSubmitted = ref(false)
const error = ref(false)
const errorMessage = ref('')
const requireAdmin = ref(false)

const handleSubmit = async () => {
  error.value = false
  requireAdmin.value = false
  isLoading.value = true
  
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { identifier: identifier.value }
    })
    isSubmitted.value = true
  } catch (err) {
    error.value = true
    const rootData = err.data || {}
    const innerData = rootData.data || {}
    errorMessage.value = innerData.message || rootData.message || 'Gagal memproses permintaan'
    if (innerData.requireAdmin || rootData.requireAdmin) {
      requireAdmin.value = true
    }
  } finally {
    isLoading.value = false
  }
}

useSeoMeta({
  title: 'Lupa Password | GASKAN',
})
</script>

<template>
  <div class="min-h-screen flex items-stretch bg-base-100 selection:bg-primary/30">
    <!-- Left panel: Decorative/Branding (Desktop Only) -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary/5 border-r border-base-300 relative overflow-hidden flex-col items-center justify-center p-12 gap-10 group">
      <!-- Animated Background Orbs -->
      <div class="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse duration-[10s]" />
      <div class="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px] animate-pulse duration-[8s] delay-700" />
      
      <!-- Dot Grid Mask -->
      <div class="absolute inset-0 opacity-20"
        style="background-image: radial-gradient(circle, oklch(0.6 0.1 265 / 30%) 1.5px, transparent 1.5px); background-size: 32px 32px; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);"
      />

      <div class="relative z-10 text-center space-y-8 max-w-md animate-in fade-in slide-in-from-left duration-1000">
        <!-- Logo -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <div class="w-16 h-16 rounded-[2rem] bg-primary/15 border border-primary/30 flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-transform duration-500">
            <Icon name="mingcute:key-2-fill" class="text-4xl text-primary" />
          </div>
          <div class="text-left">
            <span class="text-4xl font-black tracking-tighter italic uppercase block leading-none">GASKAN</span>
            <span class="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Security First</span>
          </div>
        </div>

        <div class="space-y-4">
          <h2 class="text-4xl font-black leading-[1.1] tracking-tight">
            Pemulihan Akses<br />
            <span class="text-primary">Akun Digital Anda</span>
          </h2>
          <p class="opacity-50 text-base leading-relaxed border-l-2 border-primary/20 pl-6 text-left">
            Kami membantu Anda mendapatkan kembali akses ke dashboard Sistem Absensi Digital SMTI Jogja dengan aman.
          </p>
        </div>

        <!-- Security Badge -->
        <div class="flex items-center gap-3 justify-center py-4 px-6 rounded-2xl bg-base-200/50 border border-base-300 w-fit mx-auto">
          <Icon name="mingcute:safe-shield-fill" class="text-success text-xl" />
          <span class="text-xs font-bold opacity-60">Enkripsi End-to-End Aktif</span>
        </div>
      </div>
      
      <!-- Footer Copyright (Desktop) -->
      <div class="absolute bottom-10 left-12 opacity-20 text-[10px] font-bold uppercase tracking-widest">
        © {{ new Date().getFullYear() }} SMK SMTI Yogyakarta
      </div>
    </div>

    <!-- Right panel: Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
      <div class="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-700">
        
        <!-- Mobile Logo -->
        <div class="flex lg:hidden items-center justify-center gap-3 mb-12">
          <div class="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Icon name="mingcute:key-2-fill" class="text-2xl text-primary" />
          </div>
          <span class="text-2xl font-black italic tracking-tighter uppercase">GASKAN</span>
        </div>

        <div v-if="!isSubmitted" class="space-y-10">
          <div class="space-y-3">
            <h1 class="text-3xl lg:text-4xl font-black tracking-tight">Lupa Password?</h1>
            <p class="opacity-50 text-sm lg:text-base leading-relaxed">
              Masukkan alamat email yang tertaut dengan akun Anda untuk memverifikasi identitas.
            </p>
          </div>

          <!-- Attention Notice: Email not set -->
          <Transition name="fade">
            <div v-if="requireAdmin" class="p-6 rounded-[2rem] bg-error/5 border border-error/10 flex gap-5 animate-in slide-in-from-top-4 duration-500">
              <div class="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center flex-shrink-0">
                <Icon name="mingcute:mail-send-fill" class="text-2xl text-error" />
              </div>
              <div class="text-left">
                <p class="text-sm font-black text-error mb-1 uppercase tracking-tight">Email Belum Terdaftar</p>
                <p class="text-xs opacity-60 leading-relaxed font-medium">
                  Akun Anda tidak memiliki email aktif. Mohon hubungi <span class="text-error font-bold">Admin IT atau Guru Piket</span> untuk reset manual.
                </p>
              </div>
            </div>
          </Transition>

          <!-- Standard Error -->
          <Transition name="fade">
            <div v-if="error && !requireAdmin" class="alert alert-error rounded-2xl text-sm mb-6 shadow-xl shadow-error/10">
              <Icon name="mingcute:warning-fill" class="text-xl shrink-0" />
              <span class="font-bold">{{ errorMessage }}</span>
            </div>
          </Transition>

          <form @submit.prevent="handleSubmit" class="space-y-8">
            <div class="space-y-3 group">
              <label class="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] ml-1 group-focus-within:text-primary transition-colors">Alamat Email Resmi</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <Icon name="mingcute:mail-line" class="text-xl opacity-20 group-focus-within:opacity-100" />
                </div>
                <input
                  v-model="identifier"
                  type="email"
                  placeholder="nama@smti-yk.sch.id"
                  required
                  :disabled="isLoading"
                  class="input input-bordered w-full pl-14 h-14 rounded-2xl bg-base-200 border-base-300 focus:border-primary focus:outline-none transition-all text-sm font-medium focus:bg-base-100"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="btn btn-primary w-full h-14 rounded-2xl font-black text-base shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Icon v-if="isLoading" name="mingcute:loading-3-line" class="animate-spin mr-3 text-xl" />
              <span>{{ isLoading ? 'Memverifikasi...' : 'Kirim Tautan Pemulihan' }}</span>
            </button>
          </form>

          <!-- Help / FAQ Card -->
          <div class="pt-10 border-t border-base-300">
            <div class="bg-base-200/50 rounded-[2rem] p-6 border border-base-300 space-y-4">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="mingcute:question-line" class="text-primary" />
                </div>
                <p class="text-xs font-black uppercase tracking-widest opacity-40">Butuh bantuan?</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <p class="text-[11px] font-black text-primary uppercase">Belum set email?</p>
                  <p class="text-[10px] opacity-40 leading-relaxed font-medium">
                    Reset mandiri hanya tersedia jika Anda telah mendaftarkan email di profil GASKAN.
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-[11px] font-black uppercase">Lapor ke Guru</p>
                  <p class="text-[10px] opacity-40 leading-relaxed font-medium">
                    Silakan hubungi admin sekolah di ruang piket untuk bantuan reset manual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success State -->
        <div v-else class="text-center space-y-10 py-10 animate-in zoom-in-95 duration-500">
          <div class="relative inline-block">
            <div class="w-24 h-24 rounded-[2.5rem] bg-success/10 flex items-center justify-center mx-auto rotate-6 border border-success/20 shadow-2xl shadow-success/10">
              <Icon name="mingcute:send-plane-fill" class="text-5xl text-success" />
            </div>
            <div class="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-success flex items-center justify-center text-white shadow-lg animate-bounce">
              <Icon name="mingcute:check-fill" class="text-xl" />
            </div>
          </div>
          
          <div class="space-y-4">
            <h2 class="text-3xl font-black tracking-tight">Email Terkirim!</h2>
            <p class="opacity-50 text-sm lg:text-base leading-relaxed max-w-xs mx-auto">
              Tautan pemulihan telah dikirim ke <span class="text-primary font-bold underline">{{ identifier }}</span>. 
              <br/><br/>
              Mohon cek folder <span class="font-bold opacity-100 underline">Spam</span> jika tidak ada di Inbox utama.
            </p>
          </div>

          <div class="pt-10 border-t border-base-300">
            <button
              @click="isSubmitted = false"
              class="btn btn-ghost btn-sm text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
            >
              Coba Email Lainnya
            </button>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink to="/login" class="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all hover:-translate-x-2">
            <Icon name="mingcute:arrow-left-line" class="text-xl" />
            Ke Halaman Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
