<script setup>
const { data: err } = useFetch('/api/log/error')
</script>

<template>
  <div class="flex flex-col">
    <h1 class="font-bold text-2xl my-auto">Log Error</h1>
    <div v-if="err" v-for="l in err" class="flex flex-col md:flex-row gap-3 w-full mt-5">

      <ol class="relative border-s border-gray-200 dark:border-gray-700 w-full">
        <li class="mb-10 ms-4">
          <div
            class="absolute w-3 h-3 bg-white rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700">
          </div>
          <time class="mb-1 text-xl font-bold leading-none text-gray-400 dark:text-gray-500">{{ l.tanggal }}</time>
          <div v-for="d in l.data" class="flex bg-dark w-full p-4 rounded-md space-y-2 mt-2">
            <div class="flex space-x-4">
              <div class="flex flex-col justify-between">
                <div class="flex flex-col">
                  <span class="text-md font font-semibold">
                    {{ d.code }} | {{ d.msg }}
                  </span>
                  <span>
                    {{ d.Kelas }}
                  </span>
                </div>
                <time>
                  {{ formatLongDate(d.timestamp, true) }}
                </time>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>