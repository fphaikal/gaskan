<script setup>
const { isDark, toggleTheme } = useTheme()
const scrolled = ref(false)
let scrollHandler = null

onMounted(() => {
  scrollHandler = () => { scrolled.value = window.scrollY > 10 }
  window.addEventListener('scroll', scrollHandler, { passive: true })
})

onBeforeUnmount(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
})
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="scrolled ? 'backdrop-blur-md bg-base-100/80 shadow-sm border-b border-base-300' : 'bg-transparent'"
  >
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 group">
        <Icon name="mingcute:key-2-fill" class="text-primary text-2xl transition-transform group-hover:rotate-12 duration-300" />
        <span class="text-xl font-extrabold tracking-tight">GASKAN</span>
      </a>

      <!-- Nav links (desktop) -->
      <div class="hidden md:flex items-center gap-8 text-sm font-medium">
        <a href="#fitur" class="opacity-60 hover:opacity-100 hover:text-primary transition-all duration-200">Fitur</a>
        <a href="#statistik" class="opacity-60 hover:opacity-100 hover:text-primary transition-all duration-200">Statistik</a>
        <a href="#faq" class="opacity-60 hover:opacity-100 hover:text-primary transition-all duration-200">FAQ</a>
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
          <Transition name="fade-spin" mode="out-in">
            <Icon v-if="isDark" key="sun" name="mingcute:sun-line" class="text-xl" />
            <Icon v-else key="moon" name="mingcute:moon-line" class="text-xl" />
          </Transition>
        </button>

        <!-- Login CTA -->
        <a href="/login" id="nav-login-btn" class="btn btn-primary btn-sm rounded-lg font-semibold shadow-md hover:shadow-primary/30 transition-shadow">
          Masuk
        </a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.fade-spin-enter-active,
.fade-spin-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-spin-enter-from { opacity: 0; transform: rotate(-90deg) scale(0.7); }
.fade-spin-leave-to   { opacity: 0; transform: rotate(90deg) scale(0.7); }
</style>
