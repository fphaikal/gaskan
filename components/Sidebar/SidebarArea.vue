<script setup>
import { useSidebarStore } from '../../store/sidebar'
import { onClickOutside, useStorage } from '@vueuse/core'
import { ref } from 'vue'
import SidebarItem from './SidebarItem.vue'

const config = useRuntimeConfig();
const target = ref(null)
const sidebarStore = useSidebarStore()
const userRole = useStorage('_id') // Assuming the role is stored in localStorage

onClickOutside(target, () => {
  sidebarStore.isSidebarOpen = false
})

const menuGroups = [
  {
    name: 'MENU',
    menuItems: [
      {
        icon: `mingcute:classify-2-fill`,
        role: ["all"],
        label: 'Dashboard',
        route: '/home',
      },
      {
        icon: `mingcute:location-2-fill`,
        role: [config.public.ADMIN_KEY, config.public.DEVELOPER_KEY],
        label: 'On Site',
        route: '/log/onsite'
      },
      {
        icon: `mingcute:user-3-fill`,
        role: ["all"],
        label: 'Daftar Siswa',
        route: '/siswa'
      },
      {
        icon: `mingcute:list-check-2-fill`,
        role: ["all"],
        label: 'Log Kehadiran',
        route: '/log/kehadiran'
      },
      {
        icon: `mingcute:enter-door-fill`,
        role: [config.public.ADMIN_KEY, config.public.DEVELOPER_KEY],
        label: 'Log Login',
        route: '/log/login'
      },
      {
        icon: `ic:outline-error`,
        role: [config.public.DEVELOPER_KEY],
        label: 'Log Error',
        route: '/log/error'
      },
    ]
  }
]
</script>

<template>
  <aside
    class="absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-dark duration-300 ease-linear lg:static lg:translate-x-0"
    :class="{
      'translate-x-0': sidebarStore.isSidebarOpen,
      '-translate-x-full': !sidebarStore.isSidebarOpen
    }" ref="target">
    <!-- SIDEBAR HEADER -->
    <div class="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-5">
      <router-link class="flex gap-3" to="/home">
        <img src="../../public/smti_logo.svg" class="w-12 my-auto" alt="">
        <span class="self-center text-2xl font-bold whitespace-nowrap text-primary my-auto">| GASKAN</span>
      </router-link>

      <button class="block lg:hidden" @click="sidebarStore.isSidebarOpen = false">
        <svg class="fill-current" width="20" height="18" viewBox="0 0 20 18" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
            fill="" />
        </svg>
      </button>
    </div>
    <!-- SIDEBAR HEADER -->

    <div class="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
      <!-- Sidebar Menu -->
      <nav class="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
        <template v-for="menuGroup in menuGroups" :key="menuGroup.name">
          <div>
            <h3 class="mb-4 ml-4 text-sm font-medium text-bodydark2">{{ menuGroup.name }}</h3>
            <ul class="mb-6 flex flex-col gap-1.5">
              <SidebarItem v-for="menuItem in menuGroup.menuItems" :key="menuItem.label" :item="menuItem"
                :userRole="userRole" />
            </ul>
          </div>
        </template>
      </nav>
      <!-- Sidebar Menu -->
    </div>
  </aside>
</template>
