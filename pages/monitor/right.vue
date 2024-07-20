<script setup>
definePageMeta({
  layout: 'monitor',
})

const log = ref([]);
const socket = ref(null);

onMounted(() => {
  socket.value = new WebSocket('wss://api.tierkun.my.id/viewlf3');

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
      <div v-if="log.lf3" class="flex flex-col p-5 h-fit my-auto w-1/2 items-center">
        <div class="bg-dark2 p-5 w-full">
          <p>{{ log.lf3.NIS }} | {{ log.lf3.Kelas }}</p>
          <p class="text-2xl font-bold">{{ log.lf3.Nama }}</p>
        </div>
        <div class="flex w-full">
          <div class="bg-dark px-5 py-2 w-5/6">
            <p class="text-xl font-semibold ">{{ new Date(log.lf3.timestamp).toLocaleString('id-ID') }}</p>
          </div>
          <div v-if="log.lf3.indexTelat === false" class="bg-success px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Tepat Waktu</p>
          </div>
          <div v-else class="bg-danger px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Terlambat</p>
          </div>
        </div>
        <img :src="log.lf3.Image" class="w-2/3 flex justify-center items-center mt-10" alt="">
      </div>
      <div v-if="log.lf4" class="flex flex-col p-5 h-fit my-auto w-1/2 items-center">
        <div class="bg-dark2 p-5 w-full">
          <p>{{ log.lf4.NIS }} | {{ log.lf4.Kelas }}</p>
          <p class="text-2xl font-bold">{{ log.lf4.Nama }}</p>
        </div>
        <div class="flex w-full">
          <div class="bg-dark px-5 py-2 w-5/6">
            <p class="text-xl font-semibold ">{{ new Date(log.lf4.timestamp).toLocaleString('id-ID') }}</p>
          </div>
          <div v-if="log.lf4.indexTelat === false" class="bg-success px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Tepat Waktu</p>
          </div>
          <div v-else class="bg-danger px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Terlambat</p>
          </div>
        </div>
        <img :src="log.lf3.Image" class="w-2/3 flex justify-center items-center mt-10" alt="">
      </div>
    </div>
  </div>
</template>