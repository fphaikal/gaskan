<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

definePageMeta({
  layout: 'monitor',
});

const { role } = storeToRefs(useAuthStore());
const canMonitor = computed(() => ['admin', 'developer'].includes(role.value));
const log = ref([]);
const socket = ref(null);
let reconnectInterval = null;
let refreshInterval = null;

const connectWebSocket = () => {
  if (!canMonitor.value) return;

  socket.value = new WebSocket('wss://api.tierkun.my.id/viewlf1');

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
  if (!canMonitor.value) {
    navigateTo('/home');
    return;
  }

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
  <div class="bg-cover bg-center min-h-screen relative overflow-hidden" style="background-image: url(/header.webp);">
    <div class="absolute inset-0 bg-black/40"></div>
    
    <!-- Top LIVE Badge -->
    <div class="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
      <div class="flex items-center gap-3 bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span class="text-white/90 font-bold tracking-widest text-sm drop-shadow-md shadow-black">LIVE MONITORING</span>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="relative z-10 w-full flex flex-col lg:flex-row items-stretch justify-center min-h-screen gap-8 pt-24 pb-10 px-10 max-w-[1920px] mx-auto">
      
      <!-- Card lf1 -->
      <div v-if="log.lf1" class="flex-1 flex flex-col rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500">
        <div class="p-8 border-b border-white/5 bg-gradient-to-br from-white/10 to-transparent">
          <p class="text-white/50 text-sm font-semibold tracking-widest mb-2 uppercase">{{ log.lf1.NIS || '22100579' }} <span class="mx-2 text-white/20">&bull;</span> {{ log.lf1.Kelas || 'XII KA A' }}</p>
          <p class="text-4xl font-extrabold text-white tracking-wide truncate">{{ log.lf1.Nama || 'Medina Karin Xena' }}</p>
        </div>
        
        <div class="px-8 py-5 flex items-center justify-between bg-white/5">
          <p class="text-xl lg:text-2xl font-mono text-white/80">{{ new Date(log.lf1.timestamp || new Date()).toLocaleString('id-ID') }}</p>
          <div v-if="log.lf1.indexTelat === false" class="badge badge-success badge-lg font-bold shadow-[0_0_15px_rgba(54,211,153,0.4)] px-5 py-4 text-base">Tepat Waktu</div>
          <div v-else class="badge badge-error badge-lg font-bold shadow-[0_0_15px_rgba(248,113,113,0.4)] px-5 py-4 text-base">Terlambat</div>
        </div>
        
        <div class="p-8 flex flex-col items-center justify-center flex-grow">
          <div class="w-full flex justify-center items-center h-[400px] mb-4">
            <img v-if="log.lf1.Image" :src="log.lf1.Image" class="max-h-full max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain" alt="">
            <img v-else src="/smti_logo.svg" class="h-48 opacity-40 drop-shadow-2xl" alt="">
          </div>
          
          <div v-if="log.lf1.Nama === 'Medina Karin Xena' || log.lf1.Nama === 'NAIRA SALIMA'" class="w-full mt-auto bg-pink-500/10 backdrop-blur-md p-6 rounded-2xl border border-pink-500/30 shadow-[0_0_25px_rgba(236,72,153,0.2)] text-center animate-pulse">
            <p v-if="log.lf1.action === 'enter'" class="text-2xl lg:text-3xl font-extrabold text-pink-300 drop-shadow-md">SELAMAT BERSEKOLAH KAK {{ log.lf1.Nama === 'NAIRA SALIMA' ? 'NAIRA' : 'MEDINA' }} CANTIK ?</p>
            <p v-if="log.lf1.action === 'exit'" class="text-2xl lg:text-3xl font-extrabold text-pink-300 drop-shadow-md">SELAMAT BERISTIRAHAT KAK {{ log.lf1.Nama === 'NAIRA SALIMA' ? 'NAIRA' : 'MEDINA' }} CANTIK ??</p>
          </div>
        </div>
      </div>

      <!-- Card lf2 -->
      <div v-if="log.lf2" class="flex-1 flex flex-col rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500">
        <div class="p-8 border-b border-white/5 bg-gradient-to-br from-white/10 to-transparent">
          <p class="text-white/50 text-sm font-semibold tracking-widest mb-2 uppercase">{{ log.lf2.NIS || '22100697' }} <span class="mx-2 text-white/20">&bull;</span> {{ log.lf2.Kelas || 'XII TM A' }}</p>
          <p class="text-4xl font-extrabold text-white tracking-wide truncate">{{ log.lf2.Nama || 'FAHREZA PASHA HAIKAL' }}</p>
        </div>
        
        <div class="px-8 py-5 flex items-center justify-between bg-white/5">
          <p class="text-xl lg:text-2xl font-mono text-white/80">{{ new Date(log.lf2.timestamp || new Date()).toLocaleString('id-ID') }}</p>
          <div v-if="log.lf2.indexTelat === false" class="badge badge-success badge-lg font-bold shadow-[0_0_15px_rgba(54,211,153,0.4)] px-5 py-4 text-base">Tepat Waktu</div>
          <div v-else class="badge badge-error badge-lg font-bold shadow-[0_0_15px_rgba(248,113,113,0.4)] px-5 py-4 text-base">Terlambat</div>
        </div>
        
        <div class="p-8 flex flex-col items-center justify-center flex-grow">
          <div class="w-full flex justify-center items-center h-[400px] mb-4">
            <img v-if="log.lf2.Image" :src="log.lf2.Image" class="max-h-full max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain" alt="">
            <img v-else src="/smti_logo.svg" class="h-48 opacity-40 drop-shadow-2xl" alt="">
          </div>
          
          <div v-if="log.lf2.Nama === 'NAIRA SALIMA'" class="w-full mt-auto bg-pink-500/10 backdrop-blur-md p-6 rounded-2xl border border-pink-500/30 shadow-[0_0_25px_rgba(236,72,153,0.2)] text-center animate-pulse">
            <p v-if="log.lf2.action === 'enter'" class="text-2xl lg:text-3xl font-extrabold text-pink-300 drop-shadow-md">SELAMAT BERSEKOLAH KAK NAIRA CANTIK ?</p>
            <p v-if="log.lf2.action === 'exit'" class="text-2xl lg:text-3xl font-extrabold text-pink-300 drop-shadow-md">SELAMAT BERISTIRAHAT KAK NAIRA CANTIK ??</p>
          </div>
        </div>
      </div>

      <!-- Fallback when no lf1/lf2 -->
      <div v-if="!log.lf1 && !log.lf2" class="w-full flex flex-col lg:flex-row gap-8 items-stretch justify-center h-full">
        <!-- Fallback Card 1 -->
        <div class="flex-1 flex flex-col rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
          <div class="p-8 border-b border-white/5 bg-gradient-to-br from-white/10 to-transparent">
            <p class="text-white/50 text-sm font-semibold tracking-widest mb-2 uppercase">22100597 <span class="mx-2 text-white/20">&bull;</span> X KA C</p>
            <p class="text-4xl font-extrabold text-white tracking-wide truncate">NAIRA SALIMA</p>
          </div>
          <div class="px-8 py-5 flex items-center justify-between bg-white/5">
            <p class="text-xl lg:text-2xl font-mono text-white/80">{{ new Date().toLocaleString('id-ID') }}</p>
             <div class="badge badge-success badge-lg font-bold shadow-[0_0_15px_rgba(54,211,153,0.4)] px-5 py-4 text-base">Tepat Waktu</div>
          </div>
          <div class="p-8 flex flex-col items-center justify-center flex-grow">
            <div class="w-full flex justify-center items-center h-[400px]">
              <img src="/smti_logo.svg" class="h-48 opacity-40 drop-shadow-2xl" alt="">
            </div>
          </div>
        </div>
        <!-- Fallback Card 2 -->
        <div class="flex-1 flex flex-col rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
          <div class="p-8 border-b border-white/5 bg-gradient-to-br from-white/10 to-transparent">
            <p class="text-white/50 text-sm font-semibold tracking-widest mb-2 uppercase">- <span class="mx-2 text-white/20">&bull;</span> X KA C</p>
            <p class="text-4xl font-extrabold text-white tracking-wide truncate">Medina Karin Xena</p>
          </div>
          <div class="px-8 py-5 flex items-center justify-between bg-white/5">
            <p class="text-xl lg:text-2xl font-mono text-white/80">{{ new Date().toLocaleString('id-ID') }}</p>
            <div class="badge badge-success badge-lg font-bold shadow-[0_0_15px_rgba(54,211,153,0.4)] px-5 py-4 text-base">Tepat Waktu</div>
          </div>
          <div class="p-8 flex flex-col items-center justify-center flex-grow">
            <div class="w-full flex justify-center items-center h-[400px]">
              <img src="/smti_logo.svg" class="h-48 opacity-40 drop-shadow-2xl" alt="">
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
