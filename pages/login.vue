<script setup>
definePageMeta({ layout: false })

import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';
const { authenticateUser } = useAuthStore()
const { authenticated } = storeToRefs(useAuthStore())
const router = useRouter()

const user = ref({ NIS: '', Password: '', force: false })
const error = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)
const showPassword = ref(false)

const login = async () => {
  error.value = false
  isLoading.value = true
  try {
    await authenticateUser(user.value)
    if (authenticated.value) {
      router.push('/home')
    }
  } catch (err) {
    error.value = true
    errorMessage.value = err.data?.data || err.data || { error: err.message || 'Terjadi kesalahan internal' }
  } finally {
    isLoading.value = false
  }
}

const forceLogin = async () => {
  user.value.force = true
  await authenticateUser(user.value)
  if (authenticated.value) {
    router.push('/home')
  }
}

useSeoMeta({
  title: 'Login | GASKAN',
  ogTitle: 'Login | GASKAN',
  description: 'Login ke Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/login',
  ogUrl: 'https://gaskan.smtijogja.sch.id/login',
  ogDescription: 'Login ke Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Login | GASKAN',
  twitterDescription: 'Login ke Gerbang Akses Pintar dan Kehadiran',
  twitterImage: '/banner.webp',
  twitterUrl: 'https://gaskan.smtijogja.sch.id/login',
})
</script>

<template>
  <div class="min-h-screen flex items-stretch">
    <!-- Left panel: Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary/10 border-r border-base-300 relative overflow-hidden flex-col items-center justify-center p-12 gap-8">
      <!-- Background blobs -->
      <div class="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div class="relative z-10 text-center space-y-6 max-w-sm">
        <!-- Logo -->
        <div class="flex items-center justify-center gap-3 mb-4">
          <div class="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Icon name="mingcute:key-2-fill" class="text-3xl text-primary" />
          </div>
          <span class="text-3xl font-extrabold">GASKAN</span>
        </div>

        <h2 class="text-2xl font-bold leading-tight">
          Sistem Absensi Digital<br />
          <span class="text-primary">SMTI Jogja</span>
        </h2>
        <p class="opacity-50 text-sm leading-relaxed">
          Kelola dan pantau kehadiran siswa secara real-time dengan mudah, cepat, dan akurat.
        </p>

        <!-- Stats preview -->
        <div class="grid grid-cols-3 gap-3 pt-4">
          <div class="bg-base-100/60 rounded-xl p-3 border border-base-300">
            <p class="text-xl font-bold text-primary">500+</p>
            <p class="text-xs opacity-50 mt-0.5">Siswa</p>
          </div>
          <div class="bg-base-100/60 rounded-xl p-3 border border-base-300">
            <p class="text-xl font-bold text-primary">3</p>
            <p class="text-xs opacity-50 mt-0.5">Role</p>
          </div>
          <div class="bg-base-100/60 rounded-xl p-3 border border-base-300">
            <p class="text-xl font-bold text-primary">99.9%</p>
            <p class="text-xs opacity-50 mt-0.5">Uptime</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: Login form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile logo -->
        <div class="flex lg:hidden items-center gap-2 mb-2">
          <Icon name="mingcute:key-2-fill" class="text-primary text-2xl" />
          <span class="text-xl font-extrabold">GASKAN</span>
        </div>

        <!-- Heading -->
        <div class="space-y-1">
          <h1 class="text-3xl font-extrabold">Selamat Datang</h1>
          <p class="opacity-50 text-sm">Masuk dengan NIS dan password kamu</p>
        </div>

        <!-- Error alert -->
        <Transition name="fade">
          <div v-if="error" class="alert alert-error rounded-xl text-sm">
            <Icon name="mingcute:warning-fill" class="text-lg shrink-0" />
            <div class="flex-1">
              <span>{{ errorMessage.error }}</span>
            </div>
            <button
              v-if="errorMessage.code === 400"
              @click.prevent="forceLogin"
              class="btn btn-sm btn-ghost"
            >
              Paksa Masuk
            </button>
          </div>
        </Transition>

        <!-- Form -->
        <form class="space-y-5" @submit.prevent="login">
          <!-- NIS field -->
          <div class="space-y-2">
            <label for="nis" class="block text-sm font-semibold">NIS</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon name="mingcute:user-4-line" class="text-lg opacity-40" />
              </div>
              <input
                type="number"
                id="nis"
                v-model="user.NIS"
                placeholder="Masukkan NIS kamu"
                required
                class="input input-bordered w-full pl-10 rounded-xl bg-base-200 border-base-300 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <!-- Password field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon name="mingcute:lock-line" class="text-lg opacity-40" />
              </div>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="user.Password"
                placeholder="••••••••"
                required
                class="input input-bordered w-full pl-10 pr-12 rounded-xl bg-base-200 border-base-300 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center opacity-40 hover:opacity-80 transition-opacity"
              >
                <Icon :name="showPassword ? 'mingcute:eye-close-line' : 'mingcute:eye-line'" class="text-lg" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            id="login-submit"
            type="submit"
            :disabled="isLoading"
            class="btn btn-primary w-full rounded-xl font-bold text-base shadow-lg hover:shadow-primary/30 transition-shadow"
          >
            <Icon v-if="isLoading" name="mingcute:loading-3-line" class="animate-spin mr-2" />
            <span>{{ isLoading ? 'Memproses...' : 'Masuk ke GASKAN' }}</span>
          </button>
        </form>

        <!-- Back to landing -->
        <p class="text-center text-sm opacity-40">
          <a href="/" class="hover:opacity-80 transition-opacity hover:text-primary">
            ← Kembali ke halaman utama
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>