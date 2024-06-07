<script setup>
const {data: log} = useFetch('/api/log/kehadiran');
</script>
<template>
  <div>
    <div class="flex flex-col gap-3">
      <h1 class="font-bold text-2xl">Log Presensi</h1>
      <div v-for="l in log" class="flex flex-col md:flex-row">
        <div class="">
          <p>{{ l.tanggal }}</p>
        </div>
        <div v-for="d in l.data" class="flex flex-col bg-dark2">
          <span>{{ d.Nama }}</span>
          <span>{{ d.Kelas }}</span>
          <span>{{ d.timestamp }}</span>
        </div>
      </div>
    </div>
  </div>
</template>