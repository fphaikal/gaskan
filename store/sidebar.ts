import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const isSidebarOpen = ref(false)
  // Persisted collapsed state for desktop mini-sidebar
  const isCollapsed = useStorage('sidebar-collapsed', false)
  const selected = useStorage('selected', ref('eCommerce'))
  const page = useStorage('page', ref('Dashboard'))

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
  }

  return { isSidebarOpen, isCollapsed, toggleSidebar, toggleCollapse, selected, page }
})
