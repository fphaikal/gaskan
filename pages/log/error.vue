<script setup>
import { useStorage } from '@vueuse/core';
const role = useStorage('_id');
const config = useRuntimeConfig();

//const { data: err } = useFetch('/api/log/error')
const err = ref([]);
const socket = ref(null);

onMounted(() => {
  socket.value = new WebSocket('wss://api.tierkun.my.id/error/reverse');

  socket.value.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  socket.value.onmessage = async (event) => {
    try {
      err.value = await JSON.parse(event.data);
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
  title: 'Log Error | GASKAN',
  ogTitle: 'Log Error | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/log/error',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/log/error',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Log Error | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/log/error`,
})
</script>

<template>
  <div>
    <div v-if="role === config.public.ADMIN_KEY || role === config.public.DEVELOPER_KEY" class="flex flex-col">
      <h1 class="font-bold text-2xl my-auto">Log Error</h1>
      <div v-if="err" v-for="l in err" class="flex flex-col md:flex-row gap-3 w-full mt-5">
  
        <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
          <li class="mb-10 ms-4">
            <div
              class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700">
            </div>
            <time class="mb-1 text-xl font-bold leading-none text-gray-400 dark:text-gray-500">{{ l.tanggal }}</time>
            <div v-for="d in l.data" class="flex bg-dark w-full p-4 rounded-md space-y-2 mt-2">
              <div class="flex space-x-4">
                <div class="flex flex-col justify-between">
                  <div class="flex flex-col">
                    <span class="text-md font font-semibold">
                      {{ d.code }} | {{ d.msg }}
                    </span>
                    <span>
                      {{ d.Kelas }}
                    </span>
                  </div>
                  <time>
                    {{ formatLongDate(d.timestamp, true) }}
                  </time>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </div>
    <div v-else class="flex flex-col mt-10 gap-4">
      <img :src="'/404_1.svg'" class="w-1/4 mx-auto" alt="">
      <h1 class="text-lg font-semibold mx-auto">Maaf, Halaman tidak ditemukan</h1>
      <a href="/home" class="btn btn-primary hover:bg-dark2 w-fit mx-auto">Kembali Ke Halaman Utama</a>
    </div>
  </div>
</template>