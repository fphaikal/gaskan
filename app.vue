<script setup>
const { theme } = useTheme()

// Apply data-theme on <html> element so DaisyUI CSS variables cascade correctly
// Placing on a child <div> won't affect body/html base styles
useHead({
  htmlAttrs: { 'data-theme': theme }
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
</template>
