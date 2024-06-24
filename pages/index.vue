<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'blank'
})

useSeoMeta({
  title: 'GASKAN',
  ogTitle: 'GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
})


</script>

<template>
  <div class="h-screen">
    

    <section class="bg-dark2">
      <div class="grid py-8 h-screen px-4 mx-auto max-w-screen-xl lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div class="place-self-center mr-auto lg:col-span-7">
          <h1 class="mb-4 max-w-2xl text-4xl font-extrabold leading-none md:text-5xl xl:text-6xl text-primary">Gerbang
            Akses Pintar dan Kehadiran</h1>
          <p class="mb-6 max-w-2xl font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Digunakan
            untuk merekap absensi siswa</p>
          <a href="/login"
            class="inline-flex justify-center transition duration-500 hover:bg-dark items-center py-3 px-5 mr-3 text-base font-medium text-center text-white rounded-lg bg-primary hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900">
            Get started
            <svg class="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>

    
  </div>
</template>