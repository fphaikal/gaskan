<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const props = defineProps({
  count: Object,
  login: Array,
  system: Object
});

const { role } = storeToRefs(useAuthStore());
const isDev = computed(() => role.value === 'developer');

// Base bento card class
const bentoCard = "bg-base-100 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50 transition-all duration-300 flex flex-col justify-center";
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Overview Stats -->
    <div :class="bentoCard">
      <div class="flex items-center justify-between">
        <p class="text-base-content/70 font-medium">Total Developer</p>
        <div class="bg-primary/20 p-2 rounded-full"><Icon name="mingcute:code-fill" class="text-primary text-xl" /></div>
      </div>
      <p class="text-4xl font-bold mt-4 text-base-content">{{ count?.klasifikasi?.developer || 0 }}</p>
    </div>
    <div :class="bentoCard">
      <div class="flex items-center justify-between">
        <p class="text-base-content/70 font-medium">Total Admin</p>
        <div class="bg-primary/20 p-2 rounded-full"><Icon name="mingcute:user-setting-fill" class="text-primary text-xl" /></div>
      </div>
      <p class="text-4xl font-bold mt-4 text-base-content">{{ count?.klasifikasi?.admin || 0 }}</p>
    </div>
    <div :class="bentoCard">
      <div class="flex items-center justify-between">
        <p class="text-base-content/70 font-medium">Total Siswa</p>
        <div class="bg-primary/20 p-2 rounded-full"><Icon name="mingcute:group-fill" class="text-primary text-xl" /></div>
      </div>
      <p class="text-4xl font-bold mt-4 text-base-content">{{ count?.klasifikasi?.siswa || 0 }}</p>
    </div>

    <!-- Progress Metrics -->
    <div :class="[bentoCard, 'md:col-span-2 lg:col-span-1']">
      <p class="text-base-content/70 font-medium mb-4">Siswa Onsite</p>
      <div class="flex items-center gap-4">
        <progress class="progress progress-primary w-full bg-base-200" :value="count?.onsite_only || 0" :max="count?.klasifikasi?.siswa || 100"></progress>
        <p class="font-bold text-base-content whitespace-nowrap">{{ count?.onsite_siswa || 0 }} / {{ count?.klasifikasi?.siswa || 0 }}</p>
      </div>
    </div>
    <div :class="[bentoCard, 'md:col-span-2 lg:col-span-2']">
      <p class="text-base-content/70 font-medium mb-4">Total User Login</p>
      <div class="flex items-center gap-4">
        <progress class="progress progress-primary w-full bg-base-200" :value="login?.length || 0" :max="count?.total || 100"></progress>
        <p class="font-bold text-base-content whitespace-nowrap">{{ login?.length || 0 }} / {{ count?.total || 0 }}</p>
      </div>
    </div>

    <!-- Developer Specs -->
    <div v-if="system && isDev" :class="[bentoCard, 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 !flex-row !justify-start items-start']">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:computer-line" /><span>Hostname</span></div>
        <p class="font-semibold text-base-content">{{ system?.osInfo?.hostname }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:cpu-line" /><span>OS Build</span></div>
        <p class="font-semibold text-base-content">{{ system?.osInfo?.distro }} {{ system?.osInfo?.build }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:chip-line" /><span>Memory (RAM)</span></div>
        <p class="font-semibold text-base-content">{{ system?.memory?.used }} {{ system?.memory?.unit }} / 16.0 GB</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:server-line" /><span>Storage</span></div>
        <p class="font-semibold text-base-content">{{ system?.disk?.used }} / {{ system?.disk?.total }} {{ system?.disk?.unit }}</p>
      </div>
    </div>
  </div>
</template>

