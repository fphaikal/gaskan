<script setup>
import { useAuthStore } from '~/store/useAuthStore'
import { storeToRefs } from 'pinia'

const { isDark, toggleTheme } = useTheme()
const authStore = useAuthStore()
const { authenticated } = storeToRefs(authStore)
const route = useRoute()
const scrolled = ref(false)
let scrollHandler = null

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tim', href: '/team' },
]

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

      <!-- Nav links (desktop) — route-aware -->
      <div class="hidden md:flex items-center gap-8 text-sm font-medium">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          class="opacity-60 hover:opacity-100 hover:text-primary transition-all duration-200"
          :class="route.path === link.href ? 'opacity-100 text-primary' : ''"
        >
          {{ link.label }}
        </a>
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

        <!-- Login/Dashboard CTA -->
        <NuxtLink 
          :to="authenticated ? '/home' : '/login'" 
          id="nav-login-btn" 
          class="btn btn-primary btn-sm rounded-lg font-semibold shadow-md hover:shadow-primary/30 transition-shadow"
        >
          {{ authenticated ? 'Dashboard' : 'Masuk' }}
        </NuxtLink>

        <!-- Mobile Nav Hamburger Dropdown -->
        <div class="dropdown dropdown-end md:hidden">
          <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle cursor-pointer">
            <Icon name="mingcute:menu-fill" class="text-xl" />
          </div>
          <ul tabindex="0" class="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-2xl w-44 border border-base-200 mt-2 font-semibold !bg-opacity-100" style="background-color: oklch(var(--b1)) !important; opacity: 1 !important;">
            <li v-for="link in navLinks" :key="link.href">
              <a :href="link.href" :class="route.path === link.href ? 'text-primary' : ''" class="flex items-center gap-2">
                <Icon v-if="link.label === 'Beranda'" name="mingcute:home-5-line" size="18" />
                <Icon v-else-if="link.label === 'Tim'" name="mingcute:group-line" size="18" />
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
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
