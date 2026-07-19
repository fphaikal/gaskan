<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const token = route.params.token

const isVerifying = ref(true)
const isTokenValid = ref(false)
const tokenErrorMessage = ref('')

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const isSuccess = ref(false)
const error = ref(false)
const errorMessage = ref('')

const verifyToken = async () => {
  if (!token) {
    isTokenValid.value = false
    tokenErrorMessage.value = 'Token tidak ditemukan pada tautan.'
    isVerifying.value = false
    return
  }

  isVerifying.value = true
  try {
    await $fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
    isTokenValid.value = true
  } catch (err) {
    isTokenValid.value = false
    const rootData = err.data || {}
    const innerData = rootData.data || {}
    tokenErrorMessage.value = innerData.message || rootData.message || err.statusMessage || 'Tautan ini tidak valid atau sudah kedaluwarsa.'
  } finally {
    isVerifying.value = false
  }
}

onMounted(() => {
  verifyToken()
})

// Password validation criteria
const checks = computed(() => {
  const p = password.value || ''
  return [
    { id: 'length', label: 'Minimal 8 karakter', met: p.length >= 8 },
    { id: 'uppercase', label: 'Huruf besar (A-Z)', met: /[A-Z]/.test(p) },
    { id: 'number', label: 'Angka (0-9)', met: /[0-9]/.test(p) },
    { id: 'special', label: 'Karakter spesial (!@#$ dll.)', met: /[^A-Za-z0-9]/.test(p) }
  ]
})

// Progress percentage based on criteria met
const strengthProgress = computed(() => {
  const metCount = checks.value.filter(c => c.met).length
  return (metCount / checks.value.length) * 100
})

// Text label for strength progress
const strengthLabel = computed(() => {
  const metCount = checks.value.filter(c => c.met).length
  if (metCount === 0) return { text: 'Belum diisi', color: 'text-neutral' }
  if (metCount <= 2) return { text: 'Lemah', color: 'text-error' }
  if (metCount === 3) return { text: 'Sedang', color: 'text-warning' }
  return { text: 'Kuat & Aman', color: 'text-success' }
})

// Progress bar color based on strength
const strengthBarColor = computed(() => {
  const metCount = checks.value.filter(c => c.met).length
  if (metCount <= 2) return 'bg-error'
  if (metCount === 3) return 'bg-warning'
  return 'bg-success'
})

// Check if all password criteria are met
const isPasswordStrong = computed(() => {
  return checks.value.every(check => check.met)
})

// Check if confirm password matches password
const isConfirmMatch = computed(() => {
  return password.value === confirmPassword.value && confirmPassword.value.length > 0
})

// Validate form submission availability
const isFormValid = computed(() => {
  return isPasswordStrong.value && isConfirmMatch.value && !isLoading.value
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  error.value = false
  isLoading.value = true
  
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { 
        token, 
        password: password.value 
      }
    })
    isSuccess.value = true
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    error.value = true
    const rootData = err.data || {}
    const innerData = rootData.data || {}
    errorMessage.value = innerData.message || rootData.message || 'Gagal mengubah password'
  } finally {
    isLoading.value = false
  }
}

useSeoMeta({
  title: 'Reset Password | GASKAN',
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
            Atur Ulang<br />
            <span class="text-primary">Kata Sandi Anda</span>
          </h2>
          <p class="opacity-50 text-base leading-relaxed border-l-2 border-primary/20 pl-6 text-left">
            Kami membantu mengamankan kembali akun Sistem Absensi Digital SMTI Jogja Anda dengan verifikasi enkripsi ganda.
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

        <!-- Loading State -->
        <div v-if="isVerifying" class="text-center py-16 space-y-4 animate-in fade-in duration-500">
          <Icon name="mingcute:loading-3-line" class="animate-spin text-5xl text-primary mx-auto" />
          <p class="font-bold text-sm opacity-60">Memverifikasi tautan reset password...</p>
        </div>

        <!-- Invalid / Expired Token State -->
        <div v-else-if="!isTokenValid" class="text-center space-y-8 py-6 animate-in zoom-in-95 duration-500">
          <div class="w-20 h-20 rounded-3xl bg-error/15 text-error flex items-center justify-center mx-auto border border-error/20 shadow-xl shadow-error/10">
            <Icon name="mingcute:close-circle-fill" class="text-4xl" />
          </div>

          <div class="space-y-3">
            <h2 class="text-2xl lg:text-3xl font-black tracking-tight text-error">Tautan Tidak Valid</h2>
            <p class="opacity-60 text-sm leading-relaxed max-w-sm mx-auto">
              {{ tokenErrorMessage }}
            </p>
          </div>

          <div class="pt-4 space-y-3">
            <NuxtLink
              to="/forgot-password"
              class="btn btn-primary w-full h-14 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Icon name="mingcute:mail-send-line" class="text-xl" />
              <span>Minta Link Reset Password Baru</span>
            </NuxtLink>

            <NuxtLink
              to="/login"
              class="btn btn-ghost w-full text-xs font-bold opacity-50 hover:opacity-100"
            >
              Kembali ke Halaman Login
            </NuxtLink>
          </div>
        </div>

        <!-- Valid Token Form State -->
        <div v-else-if="!isSuccess" class="space-y-8">
          <div class="space-y-3">
            <h1 class="text-3xl lg:text-4xl font-black tracking-tight">Buat Password Baru</h1>
            <p class="opacity-50 text-sm lg:text-base leading-relaxed">
              Silakan masukkan kata sandi baru yang kuat untuk akun Anda.
            </p>
          </div>

          <!-- Alert Error -->
          <Transition name="fade">
            <div v-if="error" class="alert alert-error rounded-2xl text-sm mb-6 shadow-xl shadow-error/10">
              <Icon name="mingcute:warning-fill" class="text-xl shrink-0" />
              <span class="font-bold">{{ errorMessage }}</span>
            </div>
          </Transition>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Password Field -->
            <div class="space-y-3 group">
              <label class="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] ml-1 group-focus-within:text-primary transition-colors">Password Baru</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <Icon name="mingcute:lock-line" class="text-xl opacity-20 group-focus-within:opacity-100" />
                </div>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password baru"
                  required
                  :disabled="isLoading"
                  class="input input-bordered w-full pl-14 pr-12 h-14 rounded-2xl bg-base-200 border-base-300 focus:border-primary focus:outline-none transition-all text-sm font-medium focus:bg-base-100"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-5 flex items-center opacity-30 hover:opacity-100 transition-opacity"
                >
                  <Icon :name="showPassword ? 'mingcute:eye-close-line' : 'mingcute:eye-line'" class="text-xl" />
                </button>
              </div>

              <!-- Password Strength Checker Card -->
              <div class="mt-4 p-5 rounded-2xl bg-base-200 border border-base-300 space-y-4">
                <div class="flex items-center justify-between text-xs font-bold">
                  <span class="opacity-50">Kekuatan Password:</span>
                  <span :class="[strengthLabel.color, 'transition-colors']">{{ strengthLabel.text }}</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-base-300 rounded-full h-2 overflow-hidden">
                  <div 
                    class="h-full transition-all duration-500 ease-out" 
                    :class="strengthBarColor"
                    :style="{ width: `${strengthProgress}%` }"
                  />
                </div>

                <!-- Validation Indicators Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div 
                    v-for="check in checks" 
                    :key="check.id"
                    class="flex items-center gap-2.5 text-xs transition-all duration-300"
                    :class="check.met ? 'text-success font-semibold' : 'opacity-40 font-medium'"
                  >
                    <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                      :class="check.met ? 'bg-success/15 text-success' : 'bg-base-300 text-neutral-content'"
                    >
                      <Icon :name="check.met ? 'mingcute:check-fill' : 'mingcute:close-line'" class="text-xs" />
                    </div>
                    <span>{{ check.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div class="space-y-3 group">
              <label class="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] ml-1 group-focus-within:text-primary transition-colors">Konfirmasi Password Baru</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                  <Icon name="mingcute:lock-line" class="text-xl opacity-20 group-focus-within:opacity-100" />
                </div>
                <input
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Ketik ulang password baru"
                  required
                  :disabled="isLoading"
                  class="input input-bordered w-full pl-14 h-14 rounded-2xl bg-base-200 border-base-300 focus:border-primary focus:outline-none transition-all text-sm font-medium focus:bg-base-100"
                />
                
                <!-- Match Indicator Badge -->
                <div v-if="confirmPassword.length > 0" class="absolute inset-y-0 right-5 flex items-center">
                  <span 
                    class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                    :class="isConfirmMatch ? 'bg-success/15 text-success border border-success/20' : 'bg-error/15 text-error border border-error/20'"
                  >
                    {{ isConfirmMatch ? 'Cocok' : 'Beda' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!isFormValid || isLoading"
              class="btn btn-primary w-full h-14 rounded-2xl font-black text-base shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Icon v-if="isLoading" name="mingcute:loading-3-line" class="animate-spin mr-3 text-xl" />
              <span>{{ isLoading ? 'Memperbarui...' : 'Simpan Password Baru' }}</span>
            </button>
          </form>
        </div>

        <!-- Success State -->
        <div v-else class="text-center space-y-10 py-10 animate-in zoom-in-95 duration-500">
          <div class="relative inline-block">
            <div class="w-24 h-24 rounded-[2.5rem] bg-success/10 flex items-center justify-center mx-auto rotate-6 border border-success/20 shadow-2xl shadow-success/10">
              <Icon name="mingcute:check-circle-fill" class="text-5xl text-success" />
            </div>
            <div class="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-success flex items-center justify-center text-white shadow-lg animate-bounce">
              <Icon name="mingcute:check-fill" class="text-xl" />
            </div>
          </div>
          
          <div class="space-y-4">
            <h2 class="text-3xl font-black tracking-tight">Password Diperbarui!</h2>
            <p class="opacity-50 text-sm lg:text-base leading-relaxed max-w-xs mx-auto">
              Kata sandi Anda telah berhasil diubah. Halaman ini akan beralih ke menu login secara otomatis.
            </p>
          </div>

          <div class="pt-10 border-t border-base-300">
            <NuxtLink
              to="/login"
              class="btn btn-ghost btn-sm text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
            >
              Kembali Ke Login Sekarang
            </NuxtLink>
          </div>
        </div>

        <div class="text-center">
          <NuxtLink to="/login" class="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all hover:-translate-x-2">
            <Icon name="mingcute:arrow-left-line" class="text-xl" />
            Kembali Ke Login
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
