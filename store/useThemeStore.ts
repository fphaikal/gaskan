import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('mytheme')

  const isDark = computed(() => theme.value === 'mytheme')

  const toggleTheme = () => {
    theme.value = theme.value === 'mytheme' ? 'mytheme-light' : 'mytheme'
  }

  // Watch for changes and apply to DOM manually
  watch(theme, (newTheme) => {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }, { immediate: true })

  return { theme, isDark, toggleTheme }
}, {
  persist: true
})
