<script setup>
definePageMeta({
  layout: 'blank'
})

const team = [
  {
    name: 'Joshua Williem',
    role: 'Pembimbing',
    image: 'joshua.jpeg',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/joshua.williem'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/joshua-williem'
      },
    ]
  },
  {
    name: 'Falah Khairullah',
    role: 'Pembimbing',
    image: 'https://api.tierkun.my.id/file/picture/0000.png',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/fallakhh'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/falah-k-05a9bb152'
      },
    ]
  },
  {
    name: 'Muhammad Ranah Azaly',
    role: 'Hardware Engineer',
    image: 'https://api.tierkun.my.id/file/picture/0000.png',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/razy_azaly'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/muhammad-ranah-azaly'
      },
      {
        name: 'github',
        link: 'https://github.com/MRAzaly20'
      },
    ]
  },
  {
    name: 'Muhammad Tier Sinyo C.U.S.',
    role: 'Backend Developer',
    image: 'sinyo.jpeg',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/tierkunn_'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/tiersinyo'
      },
      {
        name: 'github',
        link: 'https://github.com/Stalker-moment'
      },
    ]
  },
  {
    name: 'Fahreza Pasha Haikal',
    role: 'Frontend Developer',
    image: '',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/fp_haikal'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/fphaikal'
      },
      {
        name: 'github',
        link: 'https://github.com/fphaikal'
      },
    ]
  },
  {
    name: 'Benaya Rapha Julianto',
    role: 'Electrial Developer',
    image: '',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/benaya_r_j'
      },
    ]
  },
  {
    name: 'Bethlehem Alexander Maxymilian Siwy',
    role: 'Electrial Engineer',
    image: '',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/maxymiliansiwy'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/bethlehem-maxy'
      },
    ]
  },
  {
    name: 'Muhammad Firman Saleh',
    role: 'Mechanical Engineer',
    image: '',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/muhammadfirmansaleh82'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/firmansaleh'
      },
    ]
  },
  {
    name: 'Radita Aji Firmansyah',
    role: 'Mechanical Engineer',
    image: '',
    socmed: [
      {
        name: 'Instagram',
        link: 'https://instagram.com/raditaji2'
      },
      {
        name: 'LinkedIn',
        link: 'https://LinkedIn.com/in/raditaaji'
      },
    ]
  },
]

useSeoMeta({
  title: 'Team | GASKAN',
  ogTitle: 'Team | GASKAN',
  description: 'Tim Pengembang Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/team',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/team',
  ogDescription: 'Tim Pengembang Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Team | GASKAN`,
  twitterDescription: `Tim Pengembang Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/team`,
})
</script>
<template>
  <div class="min-h-screen flex flex-col justify-center items-center gap-5 sm:gap-10 mt-5 sm:mt-0">
    <h1 class="font-bold text-3xl">Our Team</h1>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
      <div v-for="t in team" class="flex flex-col justify-between transition duration-500 outline-dashed hover:bg-dark hover:drop-shadow-2xl hover:outline outline-2 outline-primary p-4 max-w-52 min-h-56 rounded-md">
        <h1 class="font-bold text-lg">{{ t.name }}</h1>
        <div class="flex flex-col gap-2">
          <h2 class="font-light text-sm">{{ t.role }} </h2>
          <div class="flex gap-1">
            <NuxtLink v-for="s in t.socmed" :to="s.link" class="transition duration-500 hover:text-primary">
              <Icon v-if="s.name === 'Instagram'" name="mage:instagram-circle" size="28" />
              <Icon v-if="s.name === 'LinkedIn'" name="entypo-social:linkedin-with-circle" size="26" />
              <Icon v-if="s.name === 'github'" name="mdi:github" size="28" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>