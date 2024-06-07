<script setup lang="ts">
import { ref } from 'vue'
import ProfileCard from '../../components/ProfileCard.vue'

const pageTitle = ref('Profile')
</script>

<template>
  <div class="mx-auto max-w-242.5">

    <!-- Breadcrumb End -->
    <ProfileCard />
  </div>
</template>
