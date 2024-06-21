<script setup>
const { data: err } = useFetch('/api/log/error')
</script>

<template>
  <div class="flex flex-col">
    <h1 class="font-bold text-2xl my-auto">Log Error</h1>
    <div v-for="l in err" class="flex flex-col md:flex-row w-full gap-0">

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
</template>