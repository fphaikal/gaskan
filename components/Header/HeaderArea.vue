<script setup lang="ts">
import { useSidebarStore } from '../../store/sidebar'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '../../store/useThemeStore'
import DropdownUser from './DropdownUser.vue'

const { isSidebarOpen, toggleSidebar } = useSidebarStore()

// Theme toggle
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const toggleTheme = themeStore.toggleTheme
</script>

<template>
  <header class="sticky top-0 z-999 flex w-full backdrop-blur-md bg-base-100/80 border-b border-base-300 transition-colors duration-300">
    <div class="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
      <div class="flex items-center gap-2 sm:gap-4 lg:hidden">
        <!-- Hamburger Toggle BTN -->
        <button class="z-99999 block items-center lg:hidden my-auto text-base-content" @click="toggleSidebar()">
          <Icon name="mingcute:align-justify-fill" size="24" />
        </button>
        <router-link class="flex gap-3 flex-shrink-0 lg:hidden my-auto" to="/home">
          <img src="../../public/smti_logo.svg" class="w-10 my-auto" alt="">
          <span class="self-center text-xl font-semibold whitespace-nowrap text-primary my-auto">| GASKAN</span>
        </router-link>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3 2xsm:gap-7 ml-auto">
        <ul class="flex items-center gap-2 2xsm:gap-4">
          <!-- Theme Toggle -->
          <li>
            <button
              id="theme-toggle"
              @click="toggleTheme"
              class="btn btn-ghost btn-sm btn-circle"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <Transition name="fade-spin" mode="out-in">
                <Icon v-if="isDark" key="sun" name="mingcute:sun-line" class="text-xl text-base-content" />
                <Icon v-else key="moon" name="mingcute:moon-line" class="text-xl text-base-content" />
              </Transition>
            </button>
          </li>
        </ul>

        <!-- User Area -->
        <DropdownUser />
      </div>
    </div>
  </header>
</template>
