<script setup>
const { theme } = useTheme()

useHead({
  htmlAttrs: {
    'data-theme': theme,
  },
})
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content transition-colors duration-300">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
