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
    class="absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-base-100 border-r border-base-300 duration-300 ease-linear lg:static lg:translate-x-0"
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
        <Icon name="mingcute:close-fill" class="text-2xl text-base-content" />
      </button>
    </div>

    <div class="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
      <nav class="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
        <template v-for="menuGroup in menuGroups" :key="menuGroup.name">
          <div>
            <h3 class="mb-4 ml-4 text-sm font-medium text-base-content/60">{{ menuGroup.name }}</h3>
            <ul class="mb-6 flex flex-col gap-1.5">
              <SidebarItem v-for="menuItem in menuGroup.menuItems" :key="menuItem.label" :item="menuItem"
                :userRole="userRole" />
            </ul>
          </div>
        </template>
      </nav>
    </div>
  </aside>
</template>
