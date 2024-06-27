<script setup>
import { useStorage } from '@vueuse/core';
const role = useStorage('_id');
const nis = useStorage('nis');

const { data: log } = useFetch('/api/log/onsite');

</script>
<template>
  <div>
    <div v-if="role === 'admin' || role === 'developer'" class="flex flex-col">
      <h1 class="font-bold text-2xl mb-5">On Site</h1>

      <div v-for="l in log" class="flex flex-col md:flex-row w-full gap-0">

        <!-- <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
          <li class="mb-10 ms-4">
            <div
              class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700">
            </div>
            <time class="mb-1 text-normal font-bold leading-none text-gray-400 dark:text-gray-500">{{
              formatLongDate(l.time_enter) }}</time>
            <div class="flex bg-dark w-full p-4 rounded-md space-y-2 mt-2">
              <div class="flex space-x-4">
                <div class="flex flex-col justify-between">
                  <div class="flex flex-col">
                    <span class="text-md font font-semibold">
                      {{ l.Nama }}
                    </span>
                    <span>
                      {{ l.Kelas }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ol> -->

        <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
          <li class="mb-5 ms-6">
            <div class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700">
            </div>
            <div class="items-center p-4 bg-dark rounded-lg shadow-sm sm:flex dark:bg-gray-700 dark:border-gray-600">
              <time class="text-xs font-normal text-gray-400 sm:mb-0 w-28">{{ formatLongDate(l.time_enter) }} </time>
              <div class="text-sm font-normal text-gray-500 dark:text-gray-300">{{ l.Nama }}</div>
            </div>
          </li>
        </ol>


      </div>

    </div>
    <div v-else class="flex flex-col justify-center items-center gap-5">
      <img src="../../public/404_1.svg" class="w-1/4" alt="">
      <h1 class="text-lg font-semibold">Maaf, Halaman tidak ditemukan</h1>
      <a href="/home" class="btn btn-primary hover:bg-dark2">Kembali Ke Halaman Utama</a>
    </div>
  </div>
</template>