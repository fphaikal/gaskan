<script setup>
import { storeToRefs } from 'pinia'
import { useSidebarStore } from '../store/sidebar'
import HeaderArea from '../components/Header/HeaderArea.vue'
import SidebarArea from '../components/Sidebar/SidebarArea.vue'

const sidebarStore = useSidebarStore()
const { isCollapsed } = storeToRefs(sidebarStore)
</script>

<template>
  <!-- ===== Page Wrapper Start ===== -->
  <div class="flex h-screen overflow-hidden bg-base-100 text-base-content transition-colors duration-300">
    <!-- ===== Sidebar Start ===== -->
    <SidebarArea />
    <!-- ===== Sidebar End ===== -->

    <!-- ===== Content Area Start ===== -->
    <div
      :class="[
        'relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300',
      ]"
    >
      <!-- ===== Header Start ===== -->
      <HeaderArea />
      <!-- ===== Header End ===== -->

      <!-- ===== Main Content Start ===== -->
      <main class="bg-base-200 flex-1 transition-colors duration-300">
        <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          <NuxtPage />
        </div>
      </main>
      <!-- ===== Main Content End ===== -->
    </div>
  </div>
  <!-- ===== Page Wrapper End ===== -->
</template>
