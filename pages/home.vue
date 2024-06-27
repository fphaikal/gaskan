<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { useStorage } from '@vueuse/core';
const config = useRuntimeConfig();

const { nis } = storeToRefs(useAuthStore()); // make authenticated state reactive

const role = () => {
  const getRole = useStorage('_id');
  if (getRole.value === config.public.ADMIN_KEY) {
    return 'admin'
  } else if (getRole.value === config.public.DEVELOPER_KEY) {
    return 'developer'
  } else {
    return 'siswa'
  }
}

const { data: user } = await useFetch(`/api/user?role=${role()}&user=${nis.value}`);

useSeoMeta({
  title: 'Home | GASKAN',
  ogTitle: 'Home | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
})

const messages = [
  { text: 'Hallo Sayangkuuu, Naira👋', img: '/gif/yellow-dragon-nailong.gif' },
  { text: 'Perempuanku yang suka banget makan😋', img: '/gif/nailong-yellow-dragon (1).gif' },
  { text: 'Perempuan yang selalu membuatku rindu🥲', img: '/gif/nailong_sad.webp' },
  { text: 'Perempuan yang aku harapkan menjadi masa depanku🥰', img: '/gif/yellow-dragon-nailong (1).gif' },
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
}

const nextMessage = () => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length;
  displayedText.value = '';
  displayIndex.value = 0;
  typeText();
}

const moveNoButton = () => {
  const button = document.querySelector('#noButton');
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const buttonRect = button.getBoundingClientRect();
  const newLeft = Math.random() * (viewportWidth - buttonRect.width);
  const newTop = Math.random() * (viewportHeight - buttonRect.height);
  button.style.left = `${newLeft}px`;
  button.style.top = `${newTop}px`;
}

// Memantau ukuran jendela untuk memastikan tombol "No" tetap di dalam batas layar
const handleResize = () => {
  moveNoButton(); // Panggil fungsi perpindahan saat jendela diubah ukurannya
}

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
  <div v-if="user.Nama === 'NAIRA SALIMA'" class="text-white relative">
    <div class="flex flex-col gap-4 justify-center items-center h-full">
      <h1 class="text-2xl font-bold text-center">{{ displayedText }}</h1>
      <img v-if="messages[currentMessageIndex].img" :src="messages[currentMessageIndex].img" alt="">
      <button v-if="currentMessageIndex !== 5" @click="nextMessage" class="bg-primary px-6 py-2 rounded-full">Next</button>
      <div v-else class="relative">
        <a href="/fornaira" class="bg-primary px-6 py-2 rounded-full">Ada</a>
        <button id="noButton" @mouseover="moveNoButton" class="bg-primary px-6 py-2 rounded-full ms-2">Nggak Ada</button>
      </div>
    </div>
  </div>
  <div v-else class="text-white">
    test
  </div>
</template>
