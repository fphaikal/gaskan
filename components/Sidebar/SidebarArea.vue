<script setup>
import { useSidebarStore } from '../../store/sidebar'
import { useAuthStore } from '~/store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { storeToRefs } from 'pinia'
import { onClickOutside } from '@vueuse/core'
import { ref, computed, watch } from 'vue'
import SidebarItem from './SidebarItem.vue'

const target = ref(null)
const sidebarStore = useSidebarStore()
const { isCollapsed } = storeToRefs(sidebarStore)
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const { nis, role: userRole } = storeToRefs(authStore)
const { fetchUserData, logUserOut } = authStore
const currentRole = computed(() => (userRole.value || 'siswa').toLowerCase())

// Close mobile sidebar on click outside
onClickOutside(target, () => {
  sidebarStore.isSidebarOpen = false
})

// Derive role label
const roleLabel = computed(() => {
  const r = currentRole.value
  if (r === 'admin') return 'Admin'
  if (r === 'developer') return 'Developer'
  if (r === 'guru') return 'Guru'
  return 'Siswa'
})

const { userData: currentUser, authenticated } = storeToRefs(authStore)

// Use centralized fetcher
if (authenticated.value) {
  fetchUserData()
} else {
  const unwatchSidebar = watch(authenticated, (val) => {
    if (val) { fetchUserData(); unwatchSidebar() }
  })
}

const showLogoutModal = ref(false)

const logout = () => {
  showLogoutModal.value = true
}

const confirmLogout = () => {
  showLogoutModal.value = false
  logUserOut()
}

const menuGroups = [
  {
    name: 'MENU UTAMA',
    menuItems: [
      {
        icon: 'mingcute:classify-2-fill',
        role: ['all'],
        label: 'Dashboard',
        route: '/home',
      },
      {
        icon: 'mingcute:user-3-line',
        role: ['all'],
        label: 'Profil Saya',
        route: '/profile',
      },
    ]
  },
  {
    name: 'DATA MASTER',
    menuItems: [
      {
        icon: 'mingcute:user-3-fill',
        role: ['admin', 'developer', 'guru'],
        label: 'Daftar Siswa',
        route: '/siswa',
      },
      {
        icon: 'mingcute:school-fill',
        role: ['admin', 'developer', 'guru'],
        label: 'Manajemen Kelas',
        route: '/kelas',
      },
      {
        icon: 'mingcute:calendar-2-fill',
        role: ['admin'],
        label: 'Semester',
        route: '/semester',
      },
      {
        icon: 'mingcute:user-setting-fill',
        role: ['admin', 'developer'],
        label: 'Manajemen User',
        route: '/admin/users',
      },
      {
        icon: 'mingcute:group-fill',
        role: ['admin', 'developer'],
        label: 'Manajemen Tim',
        route: '/admin/team',
      },
    ]
  },
  {
    name: 'PRESENSI & KEHADIRAN',
    menuItems: [
      {
        icon: 'mingcute:clipboard-fill',
        role: ['admin', 'developer', 'guru'],
        label: 'Absensi',
        route: '/absensi',
      },
      {
        icon: 'mingcute:list-check-2-fill',
        role: ['all'],
        label: 'Log Kehadiran',
        route: '/log/kehadiran',
      },
      {
        icon: 'mingcute:location-2-fill',
        role: ['admin', 'developer', 'guru'],
        label: 'On Site',
        route: '/log/onsite',
      },
      {
        icon: 'mingcute:document-2-fill',
        role: ['all'],
        label: 'Surat Izin',
        route: '/izin',
      },
      {
        icon: 'mingcute:file-export-fill',
        role: ['admin', 'developer', 'guru'],
        label: 'Laporan Absensi',
        route: '/absensi/laporan',
      },
    ]
  },
  {
    name: 'SISTEM & LOG',
    menuItems: [
      {
        icon: 'mingcute:settings-6-fill',
        role: ['admin'],
        label: 'Konfigurasi Mesin',
        route: '/config/device',
      },
      {
        icon: 'mingcute:enter-door-fill',
        role: ['admin', 'developer'],
        label: 'Log Sistem',
        route: '/log/login',
      },
      {
        icon: 'ic:outline-error',
        role: ['developer'],
        label: 'Log Error',
        route: '/log/error',
      },
    ]
  }
]

</script>

<template>
  <!-- Mobile Overlay -->
  <Transition name="overlay">
    <div
      v-if="sidebarStore.isSidebarOpen"
      class="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm lg:hidden"
      @click="sidebarStore.isSidebarOpen = false"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    ref="target"
    :class="[
      'group fixed left-0 top-0 z-[999] flex h-screen flex-col overflow-hidden bg-base-100 border-r border-base-300 duration-300 ease-in-out',
      'lg:static lg:translate-x-0',
      sidebarStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      isCollapsed ? 'lg:w-[72px]' : 'lg:w-72',
      'w-72',
    ]"
  >
    <!-- ─── SIDEBAR HEADER ─── -->
    <div class="flex h-16 flex-shrink-0 items-center justify-between border-b border-base-300 px-4">
      <router-link
        to="/home"
        :class="['flex items-center gap-3 overflow-hidden transition-all duration-300', isCollapsed ? 'lg:justify-center' : '']"
      >
        <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <img 
            src="../../public/smti_logo.svg" 
            class="w-5 h-5 transition-all duration-300" 
            :style="!isDark ? 'filter: invert(1) brightness(0)' : ''" 
            alt="GASKAN Logo" 
          />
        </div>
        <span
          :class="['text-lg font-bold text-primary whitespace-nowrap transition-all duration-300', isCollapsed ? 'lg:hidden' : '']"
        >
          GASKAN
        </span>
      </router-link>

      <!-- Desktop Collapse Toggle -->
      <button
        @click="sidebarStore.toggleCollapse()"
        class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all duration-200"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <Icon
          :name="isCollapsed ? 'mingcute:right-fill' : 'mingcute:left-fill'"
          class="text-base"
        />
      </button>

      <!-- Mobile Close Button -->
      <button
        @click="sidebarStore.isSidebarOpen = false"
        class="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all duration-200"
        aria-label="Close sidebar"
      >
        <Icon name="mingcute:close-fill" class="text-base" />
      </button>
    </div>

    <!-- ─── SIDEBAR CONTENT (Scrollable) ─── -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden py-4 no-scrollbar">
      <nav class="flex flex-col gap-6 px-3">
        <template v-for="menuGroup in menuGroups" :key="menuGroup.name">
          <!-- Filter: Only show group if it has visible items for this role -->
          <div
            v-if="menuGroup.menuItems.some(i => i.role.includes('all') || i.role.includes(currentRole))"
          >
            <!-- Group Label -->
            <div
              :class="[
                'mb-2 px-3 flex items-center overflow-hidden transition-all duration-300',
                isCollapsed ? 'lg:justify-center lg:px-0' : ''
              ]"
            >
              <span
                :class="[
                  'text-[10px] font-semibold uppercase tracking-widest text-base-content/40 whitespace-nowrap transition-all duration-300',
                  isCollapsed ? 'lg:hidden' : ''
                ]"
              >
                {{ menuGroup.name }}
              </span>
              <!-- Divider for collapsed mode -->
              <div
                :class="[
                  'hidden h-px w-full bg-base-200',
                  isCollapsed ? 'lg:block' : ''
                ]"
              />
            </div>

            <!-- Menu Items -->
            <ul class="flex flex-col gap-0.5">
              <SidebarItem
                v-for="menuItem in menuGroup.menuItems"
                :key="menuItem.label"
                :item="menuItem"
                :userRole="currentRole"
                :isCollapsed="isCollapsed"
              />
            </ul>
          </div>
        </template>
      </nav>
    </div>

    <!-- ─── SIDEBAR FOOTER (User Card) ─── -->
    <div class="flex-shrink-0 border-t border-base-300 p-3">
      <div
        :class="[
          'flex items-center gap-3 rounded-xl p-2 hover:bg-base-200 transition-colors duration-200',
          isCollapsed ? 'lg:justify-center' : ''
        ]"
      >
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          <div class="avatar">
            <div class="w-9 h-9 rounded-full overflow-hidden bg-primary/10">
              <img
                v-if="currentUser?.url_picture"
                :src="currentUser.url_picture"
                :alt="currentUser?.Nama"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-primary font-bold">
                {{ currentUser?.Nama?.charAt(0) || '?' }}
              </div>
            </div>
          </div>
          <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-base-100" />
        </div>

        <!-- User Info -->
        <div :class="['flex-1 overflow-hidden min-w-0', isCollapsed ? 'lg:hidden' : '']">
          <p class="text-sm font-semibold text-base-content truncate leading-tight">
            {{ currentUser?.Nama || 'Loading...' }}
          </p>
          <p class="text-xs text-base-content/50 truncate leading-tight">
            {{ roleLabel }}
          </p>
        </div>

        <!-- Logout Button -->
        <button
          :class="[
            'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-base-content/40 hover:text-error hover:bg-error/10 transition-all duration-200',
            isCollapsed ? 'lg:hidden' : ''
          ]"
          @click="logout"
          aria-label="Logout"
        >
          <Icon name="mingcute:exit-line" class="text-base" />
        </button>
      </div>
    </div>
  </aside>
  
  <!-- Logout Confirmation Modal -->
  <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showLogoutModal }]">
    <div class="modal-box bg-base-100 border border-base-300 shadow-2xl rounded-3xl">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
          <Icon name="mingcute:exit-line" class="text-2xl" />
        </div>
        <div>
          <h3 class="font-bold text-lg">Konfirmasi Keluar</h3>
          <p class="text-sm text-base-content/60">Apakah Anda yakin ingin keluar dari sistem?</p>
        </div>
      </div>
      <div class="modal-action gap-3">
        <button class="btn btn-ghost rounded-xl flex-1" @click="showLogoutModal = false">Batal</button>
        <button class="btn btn-error rounded-xl flex-1 text-white shadow-lg shadow-error/20" @click="confirmLogout">
          Ya, Keluar
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm" @click="showLogoutModal = false">
      <button>close</button>
    </form>
  </dialog>
</template>

<style scoped>
/* Smooth overlay transition */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

