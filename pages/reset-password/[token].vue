<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const token = route.params.token

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const isSuccess = ref(false)
const error = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = true
    errorMessage.value = 'Password tidak cocok'
    return
  }

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
    errorMessage.value = err.data?.message || 'Gagal mengubah password'
  } finally {
    isLoading.value = false
  }
}

useSeoMeta({
  title: 'Reset Password | GASKAN',
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-base-100">
    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Icon name="mingcute:key-2-fill" class="text-2xl text-primary" />
        </div>
        <span class="text-2xl font-extrabold">GASKAN</span>
      </div>

      <div class="bg-base-200 border border-base-300 rounded-[2rem] p-8 shadow-xl">
        <div v-if="!isSuccess">
          <div class="mb-8">
            <h1 class="text-2xl font-extrabold mb-2">Reset Password</h1>
            <p class="opacity-50 text-sm leading-relaxed">
              Silakan masukkan kata sandi baru untuk akun Anda.
            </p>
          </div>

          <Transition name="fade">
            <div v-if="error" class="alert alert-error rounded-xl text-sm mb-6">
              <Icon name="mingcute:warning-fill" class="text-lg shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1">Password Baru</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon name="mingcute:lock-line" class="text-lg opacity-40" />
                </div>
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  minlength="6"
                  :disabled="isLoading"
                  class="input input-bordered w-full pl-10 pr-12 rounded-xl bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3.5 flex items-center opacity-40 hover:opacity-80"
                >
                  <Icon :name="showPassword ? 'mingcute:eye-close-line' : 'mingcute:eye-line'" class="text-lg" />
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold ml-1">Konfirmasi Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon name="mingcute:lock-line" class="text-lg opacity-40" />
                </div>
                <input
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  :disabled="isLoading"
                  class="input input-bordered w-full pl-10 rounded-xl bg-base-100 border-base-300 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="btn btn-primary w-full rounded-xl font-bold mt-2"
            >
              <Icon v-if="isLoading" name="mingcute:loading-3-line" class="animate-spin mr-2" />
              <span>{{ isLoading ? 'Memperbarui...' : 'Simpan Password Baru' }}</span>
            </button>
          </form>
        </div>

        <div v-else class="text-center py-6">
          <div class="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Icon name="mingcute:check-circle-fill" class="text-5xl text-success" />
          </div>
          <h2 class="text-2xl font-bold mb-4">Berhasil!</h2>
          <p class="opacity-50 text-sm leading-relaxed mb-8">
            Kata sandi Anda telah berhasil diperbarui. Halaman akan otomatis berpindah ke halaman login.
          </p>
          <NuxtLink
            to="/login"
            class="btn btn-outline rounded-xl"
          >
            Ke Login Sekarang
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
