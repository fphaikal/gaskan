<script setup>
import { useStorage } from '@vueuse/core';
const role = useStorage('_id');
const nis = useStorage('nis');
const config = useRuntimeConfig();

const log = ref([]);
const socket = ref(null);

onMounted(() => {
  socket.value = new WebSocket('wss://api.tierkun.my.id/onsite/reverse');

  socket.value.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  socket.value.onmessage = async (event) => {
    try {
      log.value = await JSON.parse(event.data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.value.onclose = () => {
    console.log('Disconnected from WebSocket server');
  };
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});

useSeoMeta({
  title: 'Log Onsite | GASKAN',
  ogTitle: 'Log Onsite | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/log/onsite',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/log/onsite',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Log Onsite | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/log/onsite`,
});
</script>

<template>
  <div>
    <div v-if="role === config.public.ADMIN_KEY || role === config.public.DEVELOPER_KEY" class="flex flex-col   ">
      <h1 class="font-bold text-2xl mb-5">On Site</h1>
      <div v-for="l in log" :key="l.id || l.NIS" class="flex flex-col md:flex-row w-full gap-0">
        <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
          <li class="mb-5 ms-6">
            <div class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
            <div class="items-center p-4 bg-dark rounded-lg shadow-sm sm:flex dark:bg-gray-700 dark:border-gray-600">
              <time class="text-xs font-normal text-gray-400 sm:mb-0 w-28">{{ new Date(l.time_enter).toLocaleString() }}</time>
              <div class="text-sm font-normal text-gray-500 dark:text-gray-300">{{ l.Nama }}</div>
            </div>
          </li>
        </ol>
      </div>
    </div>
    <div v-else class="flex flex-col ">
      <img src="../../public/404_1.svg" class="w-1/4" alt="">
      <h1 class="text-lg font-semibold">Maaf, Halaman tidak ditemukan</h1>
      <a href="/home" class="btn btn-primary hover:bg-dark2">Kembali Ke Halaman Utama</a>
    </div>
  </div>
</template>
