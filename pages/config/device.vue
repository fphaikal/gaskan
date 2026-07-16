<script setup>
import { ref, onMounted } from 'vue';
const { $toast } = useNuxtApp();

useSeoMeta({
  title: 'Konfigurasi Mesin | GASKAN',
  description: 'Pengaturan perangkat Hikvision',
});

const config = ref({
  url: '',
  username: '',
  password: '',
  pollingInterval: 30,
});
const loading = ref(true);
const saving = ref(false);

onMounted(async () => {
  try {
    const data = await $fetch('/api/device');
    if (data?.data) {
      config.value = {
        url: data.data.url || '',
        username: data.data.username || '',
        password: '', // Don't show password
        pollingInterval: data.data.pollingInterval || 30,
      };
    }
  } catch (e) {
    console.error('Failed to fetch device config:', e);
  } finally {
    loading.value = false;
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    const payload = { ...config.value };
    if (!payload.password) delete payload.password;
    
    await $fetch('/api/device', {
      method: 'POST',
      body: payload
    });
    $toast.success('Konfigurasi berhasil disimpan');
  } catch (e) {
    console.error('Save failed:', e);
    $toast.error('Gagal menyimpan konfigurasi');
  } finally {
    saving.value = false;
  }
};

const bentoCard = "bg-base-100 rounded-3xl p-8 border border-base-300 shadow-sm";
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Icon name="mingcute:cpu-fill" class="text-3xl text-primary" />
      </div>
      <h1 class="text-2xl font-bold text-base-content">Konfigurasi Mesin</h1>
      <p class="text-base-content/60 mt-1">Atur koneksi dan sinkronisasi perangkat Hikvision</p>
    </div>

    <div :class="bentoCard">
      <div class="space-y-5">
        <div class="form-control">
          <label class="label"><span class="label-text font-bold">Base URL Perangkat</span></label>
          <input
            v-model="config.url"
            type="text"
            placeholder="http://192.168.1.100"
            class="input input-bordered w-full rounded-2xl"
          />
          <label class="label"><span class="label-text-alt text-base-content/40 italic">Contoh: http://192.168.1.100</span></label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold">Username</span></label>
            <input
              v-model="config.username"
              type="text"
              class="input input-bordered w-full rounded-2xl"
            />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-bold">Password</span></label>
            <input
              v-model="config.password"
              type="password"
              placeholder="••••••••"
              class="input input-bordered w-full rounded-2xl"
            />
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold">Interval Sinkronisasi (Detik)</span></label>
          <input
            v-model.number="config.pollingInterval"
            type="number"
            class="input input-bordered w-full rounded-2xl"
          />
        </div>

        <div class="pt-6">
          <button
            @click="handleSave"
            :disabled="saving || loading"
            class="btn btn-primary w-full rounded-2xl h-14"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            <Icon v-else name="mingcute:save-fill" class="text-xl" />
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
