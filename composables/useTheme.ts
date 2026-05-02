import { storeToRefs } from 'pinia'
import { useThemeStore } from '~/store/useThemeStore'

export const useTheme = () => {
  const store = useThemeStore()
  const { theme, isDark } = storeToRefs(store)
  const { toggleTheme } = store
  
  return { theme, isDark, toggleTheme }
}
