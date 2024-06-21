<script setup>
import { useStorage } from '@vueuse/core';
const role = useStorage('role');
const nis = useStorage('nis');

const { data: log } = useFetch('/api/log/kehadiran');
const { data: logSiswa } = await useFetch('/api/log/kehadiran/' + nis.value);

const type = (type) => {
  switch (type) {
    case 'enter':
      return 'Masuk';
    case 'exit':
      return 'Pulang';
    default:
      return 'Tidak diketahui';
  }
};


useSeoMeta({
  title: 'Log Kehadiran | GASKAN',
  ogTitle: 'Log Kehadiran | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
})
</script>
<template>
  <div>
    <div class="flex flex-col">
      <div class="flex justify-between mb-5">
        <h1 class="font-bold text-2xl my-auto">Log Presensi</h1>
        <div class="flex my-auto gap-2">
          <button class="px-4 py-2 bg-primary rounded-lg">
            <a href="https://api.tierkun.my.id/file/kehadiran?type=json">JSON</a>
          </button>
          <button class="px-4 py-2 bg-primary rounded-lg">
            <a href="https://api.tierkun.my.id/file/kehadiran?type=txt">TXT</a>
          </button>
          <button class="px-4 py-2 bg-primary rounded-lg">
            <a href="https://api.tierkun.my.id/file/kehadiran?type=xlsx">XLSX</a>
          </button>
        </div>
      </div>

      <div v-if="role === 'admin' || role === 'developer'" v-for="l in log"
        class="flex flex-col md:flex-row gap-3 w-full">

        <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
          <li class="mb-10 ms-4">
            <div class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700">
            </div>
            <time class="mb-1 text-xl font-bold leading-none text-gray-400 dark:text-gray-500">{{ l.tanggal }}</time>
            <div v-for="d in l.data" class="flex bg-dark w-full p-4 rounded-md space-y-2 mt-2">
              <div class="flex space-x-4">
                <img class="w-1/5 rounded-sm" :src="d.Image" alt="avatar">
                <div class="flex flex-col justify-between">
                  <div class="flex flex-col">
                    <span class="text-md font font-semibold">
                      {{ d.Nama }}
                    </span>
                    <span>
                      {{ d.Kelas }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <span class="badge badge-accent">
                      {{ type(d.action) }}
                    </span>
                    <time>
                      {{ formatDate(d.timestamp) }}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>
      <div v-else v-if="logSiswa" v-for="l in logSiswa.absen" class="flex flex-col md:flex-row gap-3 w-full">

        <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
          <li class="mb-10 ms-4">
            <div
              class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700">
            </div>
            <time class="mb-1 text-xl font-bold leading-none text-gray-400 dark:text-gray-500">{{ l.tanggal }}</time>
            <div class="flex space-x-2">
              <div class="flex flex-col w-full">
                <div class="flex bg-success w-full p-4 rounded-t-md space-y-2 mt-2">
                  <div class="flex space-x-4">
                    <div class="flex flex-col justify-between">
                      <div class="flex flex-col">
                        <span class="text-md font font-semibold">
                          Masuk
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-for="d in l.enter.time" class="flex bg-dark w-full p-4 space-y-2">
                  <div class="flex space-x-4">
                    <div class="flex flex-col justify-between">
                      <div class="flex flex-col">
                        <span class="flex gap-3 text-md font font-semibold">
                          {{ d }}
                          <span class="badge badge-accent my-auto">
                           
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col w-full">
                <div class="flex bg-error w-full p-4 rounded-t-md space-y-2 mt-2">
                  <div class="flex space-x-4">
                    <div class="flex flex-col justify-between">
                      <div class="flex flex-col">
                        <span class="text-md font font-semibold">
                          Keluar
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="l.exit.time.length > 0" v-for="d in l.exit.time" class="flex bg-dark w-full p-4 space-y-2">
                  <div class="flex space-x-4">
                    <div class="flex flex-col justify-between">
                      <div class="flex flex-col">
                        <span class="text-md font font-semibold">
                          {{ d }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="flex bg-dark w-full p-4 space-y-2">
                  <div class="flex space-x-4">
                    <div class="flex flex-col justify-between">
                      <div class="flex flex-col">
                        <span class="text-md font font-semibold">
                          Anda Belum Keluar Sekolah
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>