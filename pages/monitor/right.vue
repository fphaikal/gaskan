<script setup>
definePageMeta({
  layout: 'monitor',
})

const log = ref([]);
const socket = ref(null);

onMounted(() => {
  socket.value = new WebSocket('wss://api.tierkun.my.id/viewlf1');

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
</script>
<template>
  <div class="bg-cover" style="background-image: url(https://tailwindcomponents.com/gradient-generator/assets/header.a6837f08.webp);">
    <div class="flex items-center h-screen">
      <div v-if="log.lf1" class="flex flex-col p-5 h-fit my-auto w-1/2">
        <img :src="log.lf1.Image" alt="">
        <div class="bg-dark2 p-5">
          <p>{{ log.lf1.NIS }} | {{ log.lf1.Kelas }}</p>
          <p class="text-2xl font-bold">{{ log.lf1.Nama }}</p>
        </div>
        <div class="flex">
          <div class="bg-dark px-5 py-2 w-5/6">
            <p class="text-xl font-semibold ">{{ formatLongDate(log.lf1.timestamp) }}</p>
          </div>
          <div v-if="log.lf1.indexTelat === false" class="bg-success px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Tepat Waktu</p>
          </div>
          <div v-else class="bg-danger px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Terlambat</p>
          </div>
        </div>
      </div>
      <div v-if="log.lf2" class="flex flex-col p-5 h-fit my-auto w-1/2">
        <img :src="log.lf1.Image" alt="">
        <div class="bg-dark2 p-5">
          <p>{{ log.lf2.NIS }} | {{ log.lf2.Kelas }}</p>
          <p class="text-2xl font-bold">{{ log.lf2.Nama }}</p>
        </div>
        <div class="flex">
          <div class="bg-dark px-5 py-2 w-5/6">
            <p class="text-xl font-semibold ">{{ formatLongDate(log.lf2.timestamp) }}</p>
          </div>
          <div v-if="log.lf2.indexTelat === false" class="bg-success px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Tepat Waktu</p>
          </div>
          <div v-else class="bg-danger px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Terlambat</p>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>