import { useStorage } from '@vueuse/core'

export const useTheme = () => {
  const theme = useStorage('gaskan-theme', 'mytheme')

  const isDark = computed(() => theme.value === 'mytheme')

  const toggleTheme = () => {
    theme.value = theme.value === 'mytheme' ? 'mytheme-light' : 'mytheme'
  }

  return { theme, isDark, toggleTheme }
}
