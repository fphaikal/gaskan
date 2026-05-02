<script setup>
definePageMeta({ layout: 'blank' })

useSeoMeta({
  title: 'GASKAN',
  ogTitle: 'GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran — Sistem Absensi Digital SMTI Jogja',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran — Sistem Absensi Digital SMTI Jogja',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
  twitterCard: 'summary_large_image',
  twitterTitle: 'GASKAN',
  twitterDescription: 'Gerbang Akses Pintar dan Kehadiran — Sistem Absensi Digital SMTI Jogja',
  twitterImage: '/banner.webp',
  twitterUrl: 'https://gaskan.smtijogja.sch.id',
})
</script>

<template>
  <div>
    <LandingNavbar />
    <main>
      <LandingHero />
      <LandingFeatures />
      <LandingStats />
      <LandingFAQ />
    </main>
    <LandingFooter />
  </div>
</template>