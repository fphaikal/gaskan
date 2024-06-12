<script setup lang="ts">
import { ref } from 'vue'
import ProfileCard from '../../components/ProfileCard.vue'

const pageTitle = ref('Profile')

useSeoMeta({
  title: 'Profile | GASKAN',
  ogTitle: 'Profile | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
})
</script>

<template>
  <div class="mx-auto max-w-242.5">

    <!-- Breadcrumb End -->
    <ProfileCard />
  </div>
</template>
