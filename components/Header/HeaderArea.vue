<script setup lang="ts">
import { useSidebarStore } from '../../store/sidebar'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '../../store/useThemeStore'
import { useRoute } from 'vue-router'
import DropdownUser from './DropdownUser.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Calendar } from 'v-calendar'
import 'v-calendar/style.css'

const route = useRoute()
const { toggleSidebar } = useSidebarStore()

// Theme toggle
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const toggleTheme = themeStore.toggleTheme

// Clock logic
const currentTime = ref('')
const currentDate = ref('')
const showCalendarModal = ref(false)

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Academic Events Logic
const academicEvents = ref([])
const fetchEvents = async () => {
  try {
    const res = await $fetch('/api/academic-events')
    academicEvents.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    console.error('Failed to fetch academic events:', e)
  }
}

const calendarAttributes = computed(() => {
  return academicEvents.value.map(event => ({
    key: event.id,
    dot: {
      style: { backgroundColor: event.color || '#F2C300' },
    },
    dates: new Date(event.date),
    popover: {
      label: event.title,
      visibility: 'hover',
    }
  }))
})

let timer: any
onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)
  fetchEvents()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Derive a human-readable page title from the route
const pageTitle = computed(() => {
  const name = route.name?.toString() || ''
  const map: Record<string, string> = {
    'home': 'Dashboard',
    'siswa': 'Daftar Siswa',
    'siswa-id': 'Profil Siswa',
    'log-kehadiran': 'Log Kehadiran',
    'log-onsite': 'Log On Site',
    'log-login': 'Log Sistem',
    'log-error': 'Log Error',
    'profile': 'Profil Saya',
    'siswa-import-foto': 'Bulk Upload Foto Siswa',
    'admin-team': 'Manajemen Tim',
    'kelas': 'Manajemen Kelas',
  }
  return map[name] || name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
})
</script>

<template>
  <header class="sticky top-0 z-[997] flex h-16 w-full flex-shrink-0 items-center backdrop-blur-md border-b border-base-300 transition-colors duration-300" style="background-color: oklch(var(--b1) / 0.8)">
    <div class="flex w-full items-center justify-between px-4 md:px-6">

      <!-- Left: Mobile hamburger + Page title -->
      <div class="flex items-center gap-3">
        <!-- Mobile hamburger -->
        <button
          id="mobile-sidebar-toggle"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-200 transition-all duration-200 lg:hidden"
          @click="toggleSidebar()"
          aria-label="Open sidebar"
        >
          <Icon name="mingcute:align-left-fill" size="20" />
        </button>

        <!-- Mobile logo -->
        <router-link class="flex items-center gap-2 lg:hidden" to="/home">
          <img 
            src="../../public/smti_logo.svg" 
            class="h-7 w-7 transition-all duration-300" 
            :style="!isDark ? 'filter: invert(1) brightness(0)' : ''" 
            alt="Logo" 
          />
          <span class="text-base font-bold text-primary">GASKAN</span>
        </router-link>

        <!-- Desktop: Page title -->
        <div class="hidden lg:flex items-center gap-2">
          <span class="text-sm font-semibold text-base-content">{{ pageTitle }}</span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 sm:gap-2">
        <!-- Clock Display -->
        <div 
          @click="showCalendarModal = true"
          class="flex flex-col items-end mr-1 sm:mr-3 select-none cursor-pointer hover:bg-base-200/50 p-1.5 sm:p-2 rounded-xl transition-colors active:scale-95"
          title="Klik untuk Kalender Akademik"
        >
          <span class="text-[7px] sm:text-[9px] font-black text-base-content/30 uppercase tracking-[0.1em] sm:tracking-[0.2em] leading-none whitespace-nowrap">{{ currentDate }}</span>
          <span class="text-[10px] sm:text-xs font-black text-base-content leading-none mt-1 sm:mt-1.5 font-mono tabular-nums tracking-tight">{{ currentTime }}</span>
        </div>

        <!-- Theme Toggle -->
        <button
          id="theme-toggle"
          @click="toggleTheme"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-200 transition-all duration-200"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Transition name="icon-spin" mode="out-in">
            <Icon v-if="isDark" key="sun" name="mingcute:sun-line" class="text-[18px]" />
            <Icon v-else key="moon" name="mingcute:moon-line" class="text-[18px]" />
          </Transition>
        </button>

        <!-- Divider -->
        <div class="h-6 w-px bg-base-300 mx-1" />

        <!-- User Area -->
        <DropdownUser />
      </div>
    </div>

    <!-- Kalender Akademik Popup -->
    <Teleport to="body">
      <dialog :class="['modal', { 'modal-open': showCalendarModal }]">
        <div class="modal-box bg-base-100 border border-base-200 p-0 overflow-visible rounded-[2.5rem] max-w-sm shadow-2xl relative">
          <!-- Header Popup -->
          <div class="p-6 pb-2 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="mingcute:calendar-month-fill" size="20" />
              </div>
              <div>
                <h3 class="font-black text-lg text-base-content leading-none">Kalender</h3>
                <p class="text-[9px] font-bold text-base-content/30 uppercase tracking-widest mt-1">Akademik SMTI</p>
              </div>
            </div>
            <button @click="showCalendarModal = false" class="btn btn-ghost btn-sm btn-circle rounded-xl">
              <Icon name="mingcute:close-line" size="20" />
            </button>
          </div>
          
          <!-- Calendar Content -->
          <div class="p-4 flex justify-center">
            <Calendar 
            expanded 
            borderless
            transparent
            :is-dark="isDark"
            locale="id"
            title-position="left"
            class="!bg-transparent"
            :attributes="calendarAttributes"
          />
          </div>

          <!-- Footer Popup -->
          <div class="p-4 pt-0">
            <div class="bg-base-200/50 rounded-2xl p-3 flex items-center gap-3 border border-base-300">
              <div class="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <Icon name="mingcute:announcement-fill" size="16" />
              </div>
              <p class="text-[10px] font-bold text-base-content/60 leading-tight">
                Klik tanggal untuk melihat detail agenda akademik hari tersebut.
              </p>
            </div>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop bg-black/60 backdrop-blur-sm" @click="showCalendarModal = false">
          <button>close</button>
        </form>
      </dialog>
    </Teleport>
  </header>
</template>

<style scoped>
/* Icon spin animation for theme toggle */
.icon-spin-enter-active,
.icon-spin-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.icon-spin-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.7);
}
.icon-spin-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.7);
}
</style>
