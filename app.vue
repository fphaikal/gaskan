<script setup>
const { theme } = useTheme()
</script>

<template>
  <div :data-theme="theme">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
