<script setup>
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>
<template>
  <div>
    <header>
      <nav class="border-gray-200 px-4 lg:px-6 py-2.5">
        <div class="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <a href="/" class="flex items-center gap-2">
            <img src="../public/smti_logo.svg" class="w-12 my-auto" alt="">
            <span class="self-center text-xl font-semibold whitespace-nowrap text-primary my-auto">| GASKAN</span>
          </a>
          <div class="flex items-center lg:order-2">
            <a href="/login"
              class="text-white bg-primary dark:text-white hover:bg-dark focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">Log
              in</a>
            <button @click="toggleMobileMenu" type="button"
              class="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              :aria-expanded="isMobileMenuOpen">
              <span class="sr-only">Open main menu</span>
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"
                v-if="!isMobileMenuOpen">
                <path fill-rule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"></path>
              </svg>
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" v-else>
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
          <div
            :class="{ 'hidden': !isMobileMenuOpen, 'flex': isMobileMenuOpen, 'w-full': isMobileMenuOpen, 'lg:flex': true, 'lg:w-auto': true, 'lg:order-1': true }"
            id="mobile-menu">
            <ul class="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li>
                <a href="/"
                  class="block py-2 pr-4 pl-3 text-white rounded bg-primary-700 lg:bg-transparent lg:text-primary-700 lg:p-0 dark:text-white"
                  aria-current="page">Home</a>
              </li>
              <li>
                <a href="/view/siswa"
                  class="block py-2 pr-4 pl-3 text-white rounded bg-primary-700 lg:bg-transparent lg:text-primary-700 lg:p-0 dark:text-white"
                  aria-current="page">Siswa</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
    <NuxtPage />
    <footer class="p-4 sm:p-6 bg-dark2">
      <div class="mx-auto max-w-screen-xl">
        <div class="sm:flex sm:items-center sm:justify-between">
          <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2024 <a href="/"
              class="hover:underline">GASKAN</a>. All Rights Reserved.
          </span>
          <div class="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
            <a href="https://www.facebook.com/SMTIYk" class="text-gray-500 hover:text-gray-900 dark:hover:text-white"
              target="_blank">
              <Icon name="mingcute:facebook-fill" size="25" />
              <span class="sr-only">Facebook Page</span>
            </a>
            <a href="https://www.instagram.com/smksmtijogja/"
              class="text-gray-500 hover:text-gray-900 dark:hover:text-white" target="_blank">
              <Icon name="mage:instagram-square" size="25" />
              <span class="sr-only">Instagram Account</span>
            </a>
            <a href="https://www.tiktok.com/@smksmtijogja"
              class="text-gray-500 hover:text-gray-900 dark:hover:text-white" target="_blank">
              <Icon name="ic:baseline-tiktok" size="25" />
              <span class="sr-only">TikTok Account</span>
            </a>
            <a href="https://www.youtube.com/@SMKSMTIYogyakarta"
              class="text-gray-500 hover:text-gray-900 dark:hover:text-white" target="_blank">
              <Icon name="entypo-social:youtube-with-circle" size="25" />
              <span class="sr-only">Youtube Channel</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>