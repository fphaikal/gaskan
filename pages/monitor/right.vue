<script setup>
definePageMeta({
  layout: 'monitor',
});

const log = ref([]);
const socket = ref(null);
let reconnectInterval = null;
let refreshInterval = null;

const connectWebSocket = () => {
  socket.value = new WebSocket('wss://api.tierkun.my.id/viewlf3');

  socket.value.onopen = () => {
    console.log('Connected to WebSocket server');
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  socket.value.onmessage = async (event) => {
    try {
      log.value = await JSON.parse(event.data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.value.onclose = () => {
    console.log('Disconnected from WebSocket server. Attempting to reconnect...');
    if (!reconnectInterval) {
      reconnectInterval = setInterval(connectWebSocket, 5000); // Retry every 5 seconds
    }
  };

  socket.value.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket.value.close(); // Close socket on error to trigger onclose event
  };
};

onMounted(() => {
  connectWebSocket();

  // Refresh the page every 5 minutes
  refreshInterval = setInterval(() => {
    window.location.reload();
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<template>
  <div class="bg-cover" style="background-image: url(https://tailwindcomponents.com/gradient-generator/assets/header.a6837f08.webp);">
    <div class="flex items-center h-screen">
      <div v-if="log.lf3" class="flex flex-col p-5 h-fit my-auto w-1/2 items-center">
        <div class="bg-dark2 p-5 w-full">
          <p>{{ log.lf3.NIS || '22100579' }} | {{ log.lf3.Kelas || 'XII KA A' }}</p>
          <p class="text-2xl font-bold">{{ log.lf3.Nama || 'NAIRA SALIMA' }}</p>
        </div>
        <div class="flex w-full">
          <div class="bg-dark px-5 py-2 w-5/6">
            <p class="text-xl font-semibold ">{{ new Date(log.lf3.timestamp || new Date).toLocaleString('id-ID') }}</p>
          </div>
          <div v-if="log.lf3.indexTelat === false" class="bg-success px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Tepat Waktu</p>
          </div>
          <div v-else class="bg-danger px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Terlambat</p>
          </div>
        </div>
        <img v-if="log.lf3.Image" :src="log.lf3.Image" class="w-2/3 flex justify-center items-center mt-10" alt="">
        <img v-else :src="'/smti_logo.svg'" class="w-1/3 flex justify-center items-center mt-10" alt="">
        <div v-if="log.lf3.Nama === 'NAIRA SALIMA'" class="bg-dark p-5 w-full mt-10 text-center">
          <p v-if="log.lf3.action === 'enter'" class="text-3xl font-bold">SELAMAT BERSEKOLAH KAK NAIRA CANTIK</p>
          <p v-if="log.lf3.action === 'exit'" class="text-3xl font-bold">SELAMAT BERISTIRAHAT KAK NAIRA CANTIK</p>
        </div>
      </div>
      <div v-if="log.lf4 " class="flex flex-col p-5 h-fit my-auto w-1/2 items-center">
        <div class="bg-dark2 p-5 w-full">
          <p>{{ log.lf4.NIS || '22100697' }} | {{ log.lf4.Kelas || 'XII TM A' }}</p>
          <p class="text-2xl font-bold">{{ log.lf4.Nama || 'FAHREZA PASHA HAIKAL' }}</p>
        </div>
        <div class="flex w-full">
          <div class="bg-dark px-5 py-2 w-5/6">
            <p class="text-xl font-semibold ">{{ new Date(log.lf4.timestamp || new Date).toLocaleString('id-ID') }}</p>
          </div>
          <div v-if="log.lf4.indexTelat === false" class="bg-success px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Tepat Waktu</p>
          </div>
          <div v-else class="bg-danger px-5 py-2 w-3/6">
            <p class="text-xl font-semibold flex justify-end">Terlambat</p>
          </div>
        </div>
        <img v-if="log.lf4.Image" :src="log.lf4.Image" class="w-2/3 flex justify-center items-center mt-10" alt="">
        <img v-else :src="'/smti_logo.svg'" class="w-1/3 flex justify-center items-center mt-10" alt="">
        <div v-if="log.lf4.Nama === 'NAIRA SALIMA'" class="bg-dark p-5 w-full mt-10 text-center">
          <p v-if="log.lf4.action === 'enter'" class="text-3xl font-bold">SELAMAT BERSEKOLAH KAK NAIRA CANTIK</p>
          <p v-if="log.lf4.action === 'exit'" class="text-3xl font-bold">SELAMAT BERISTIRAHAT KAK NAIRA CANTIK</p>
        </div>
      </div>
    </div>
  </div>
</template>
