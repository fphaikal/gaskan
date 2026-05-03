import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = useCookie('theme-mode', { default: () => 'dark', watch: true })

  const isDark = computed(() => theme.value === 'dark')

  const toggleTheme = () => {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    console.debug('[theme] toggleTheme ->', { from: theme.value, to: next })
    theme.value = next
  }

  // Watch for changes and apply to DOM manually
  watch(theme, (newTheme) => {
    if (typeof document !== 'undefined') {
      console.debug('[theme] applying to DOM ->', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme || 'dark')
    }
  }, { immediate: true })

  return { theme, isDark, toggleTheme }
})
