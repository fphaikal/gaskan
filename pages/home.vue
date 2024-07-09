<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { useStorage } from '@vueuse/core';
const config = useRuntimeConfig();

const { nis } = storeToRefs(useAuthStore()); // make authenticated state reactive

const getRole = useStorage('_id');

const role = () => {
  const getRole = useStorage('_id');
  if (getRole.value === config.public.ADMIN_KEY) {
    return 'admin';
  } else if (getRole.value === config.public.DEVELOPER_KEY) {
    return 'developer';
  } else {
    return 'siswa';
  }
};

const { data: user } = await useFetch(`/api/user?role=${role()}&user=${nis.value}`);
const { data: count } = await useFetch(`/api/count`);

const system = ref([]);
const socket = ref(null);

onMounted(async () => {
  socket.value = new WebSocket('wss://api.tierkun.my.id/system');

  socket.value.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  socket.value.onmessage = async (event) => {
    try {
      system.value = await JSON.parse(event.data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.value.onclose = () => {
    console.log('Disconnected from WebSocket server');
  };
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close();
  }
});

useSeoMeta({
  title: 'Home | GASKAN',
  ogTitle: 'Home | GASKAN',
  description: 'Dashboard Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/home',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/home',
  ogDescription: 'Dashboard Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Home | GASKAN`,
  twitterDescription: `Dashboard Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/home`,
});

const messages = [
  { text: 'Hallo Sayangkuuu, Naira👋', img: '/gif/yellow-dragon-nailong.gif' },
  { text: 'Perempuanku yang suka banget makan😋', img: '/gif/nailong-yellow-dragon (1).gif' },
  { text: 'Perempuan yang selalu membuatku rindu🥲', img: '/gif/nailong_sad.webp' },
  { text: 'Perempuan yang aku harapkan bisa menjadi masa depanku🥰', img: '/gif/yellow-dragon-nailong (1).gif' },
  { text: 'Aku mau tanya dehh😇', img: '' },
  { text: 'Dihati kamu itu ada aku nggak sih?🤭', img: '/gif/nailong.webp' },
];

const currentMessageIndex = ref(0);
const displayedText = ref('');
const displayIndex = ref(0);

const typeText = () => {
  if (displayIndex.value < messages[currentMessageIndex.value].text.length) {
    displayedText.value += messages[currentMessageIndex.value].text[displayIndex.value];
    displayIndex.value++;
    setTimeout(typeText, 100); // Adjust the speed by changing the delay
  }
};

const nextMessage = () => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length;
  displayedText.value = '';
  displayIndex.value = 0;
  typeText();
};

const moveNoButton = () => {
  const button = document.querySelector('#noButton');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const buttonRect = button.getBoundingClientRect();
  const newLeft = Math.random() * (viewportWidth - buttonRect.width);
  const newTop = Math.random() * (viewportHeight - buttonRect.height);
  button.style.left = `${newLeft}px`;
  button.style.top = `${newTop}px`;
};

// Memantau ukuran jendela untuk memastikan tombol "No" tetap di dalam batas layar
const handleResize = () => {
  moveNoButton(); // Panggil fungsi perpindahan saat jendela diubah ukurannya
};

onMounted(() => {
  typeText();
  window.addEventListener('resize', handleResize); // Tambahkan event listener saat mounted
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize); // Hapus event listener saat komponen di-unmount
});
</script>

<style>
#noButton {
  position: fixed;
  transition: left 0.3s, top 0.3s;
}
</style>

<template>
  <div v-if="user">
    <div v-if="user.Nama === 'NAIRA SALIMA'" class="text-white relative">
      <div class="flex flex-col gap-4 justify-center items-center h-full">
        <h1 class="text-2xl font-bold text-center">{{ displayedText }}</h1>
        <img v-if="messages[currentMessageIndex].img" :src="messages[currentMessageIndex].img" alt="">
        <button v-if="currentMessageIndex !== 5" @click="nextMessage"
          class="bg-primary px-6 py-2 rounded-full">Next</button>
        <div v-else class="relative">
          <a href="/fornaira" class="bg-primary px-6 py-2 rounded-full">Ada</a>
          <button id="noButton" @mouseover="moveNoButton" class="bg-primary px-6 py-2 rounded-full ms-2">Nggak
            Ada</button>
        </div>
      </div>
    </div>
    <div v-else class="text-white">
      <div v-if="getRole === config.public.DEVELOPER_KEY" class="flex flex-col gap-2">
        <div class="flex gap-2">
          <div class="bg-primary rounded-md flex flex-col w-full py-4 px-4">
            <p>Total Developer</p>
            <p class="text-3xl font-bold">{{ count?.klasifikasi?.developer }} </p>
          </div>
          <div class="bg-primary rounded-md flex flex-col w-full py-4 px-4">
            <p>Total Admin</p>
            <p class="text-3xl font-bold">{{ count?.klasifikasi?.admin }} </p>
          </div>
          <div class="bg-primary rounded-md w-full py-4 px-4">
            <p>Total Siswa</p>
            <p class="text-3xl font-bold">{{ count?.klasifikasi?.siswa }} </p>
          </div>
        </div>
        <div v-if="system" class="flex flex-col md:flex-row gap-2">
          <div class="bg-secondary/10 rounded-md flex flex-col w-full py-4 px-4">
            <h1 class="mb-3">Device Specifications</h1>
            <div class="flex gap-6">
              <p class="w-1/4">Device Name</p>
              <span class="text-secondary w-3/4">{{ system?.osInfo?.hostname }} </span>
            </div>
            <div class="flex gap-6">
              <p class="w-1/4">Motherboard</p>
              <span class="text-secondary w-3/4">{{ system?.motherBoard?.model }} </span>
            </div>
            <div class="flex gap-6">
              <p class="w-1/4">Installed RAM</p>
              <span class="text-secondary w-3/4">16,0 GB ({{ system?.memory?.used }} {{ system?.memory?.unit }} usable) </span>
            </div>
            <div class="flex gap-6">
              <p class="w-1/4">Storage</p>
              <span class="text-secondary w-3/4">{{ system?.disk?.total }} {{ system?.disk?.unit }} ({{ system?.disk?.used }} {{ system?.disk?.unit }} usable) </span>
            </div>
            <div class="flex gap-6">
              <p class="w-1/4">System Info</p>
              <span class="text-secondary w-3/4">64-bit operating system, x64-based processor</span>
            </div>
          </div>
          <div class="bg-secondary/10 rounded-md flex flex-col w-full py-4 px-4">
            <p class="mb-3">Windows Specifications</p>
            <div class="flex gap-6">
              <p class="w-1/4">Edition</p>
              <span class="text-secondary w-3/4">{{ system?.osInfo?.distro }} </span>
            </div>
            <div class="flex gap-6">
              <p class="w-1/4">OS Build</p>
              <span class="text-secondary w-3/4">{{ system?.osInfo?.build }} </span>
            </div>
            <div class="flex gap-6">
              <p class="w-1/4">Uptime</p>
              <span class="text-secondary w-3/4">{{ system?.uptime }} (update every 5 second)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
