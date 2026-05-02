export const useTheme = () => {
  // useState is globally shared across all components - SSR safe
  // Each call with the same key returns the SAME reactive ref
  const theme = useState<string>('gaskan-theme', () => 'mytheme')

  const isDark = computed(() => theme.value === 'mytheme')

  const toggleTheme = () => {
    theme.value = theme.value === 'mytheme' ? 'mytheme-light' : 'mytheme'
    // Persist to localStorage (client only)
    if (import.meta.client) {
      localStorage.setItem('gaskan-theme', theme.value)
    }
  }

  // On first mount (client side), restore from localStorage
  onMounted(() => {
    const stored = localStorage.getItem('gaskan-theme')
    if (stored && stored !== theme.value) {
      theme.value = stored
    }
  })

  return { theme, isDark, toggleTheme }
}
