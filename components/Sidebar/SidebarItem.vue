<script setup>
import { useSidebarStore } from '../../store/sidebar'
import { useRoute } from 'vue-router'
import SidebarDropdown from './SidebarDropdown.vue'

const route = useRoute()
const sidebarStore = useSidebarStore()

const props = defineProps({
  item: Object,
  userRole: String,
  isCollapsed: Boolean
})

const isActive = computed(() => route.path === props.item.route)
</script>

<template>
  <li v-if="item.role.includes('all') || item.role.includes(userRole)">
    <!-- Tooltip wrapper for collapsed mode -->
    <div class="relative group/tooltip">
      <router-link
        :to="item.route"
        :class="[
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          // Layout: center icon when collapsed
          isCollapsed ? 'lg:justify-center lg:px-2' : '',
          // Active vs default state
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-base-content/70 hover:text-base-content hover:bg-base-200',
        ]"
        @click="sidebarStore.isSidebarOpen = false"
      >
        <!-- Icon with active highlight -->
        <Icon
          :name="item.icon"
          :class="['flex-shrink-0 text-[18px] transition-colors duration-200', isActive ? 'text-primary' : '']"
        />

        <!-- Label — hidden in collapsed desktop -->
        <span :class="['whitespace-nowrap truncate transition-all duration-300', isCollapsed ? 'lg:hidden' : '']">
          {{ item.label }}
        </span>

        <!-- Active indicator dot -->
        <span
          v-if="isActive && !isCollapsed"
          class="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
        />

        <!-- Chevron for children -->
        <svg v-if="item.children && !isCollapsed" class="ml-auto flex-shrink-0 fill-current text-base-content/30"
          :class="{ 'rotate-180': sidebarStore.page === item.label }" width="16" height="16" viewBox="0 0 20 20"
          fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
            fill="" />
        </svg>
      </router-link>

      <!-- Tooltip: only visible when collapsed on desktop -->
      <div
        :class="[
          'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[9999]',
          'hidden lg:block opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150',
          isCollapsed ? 'lg:block' : 'lg:hidden',
        ]"
      >
        <div class="bg-base-300 text-base-content text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          {{ item.label }}
          <!-- Arrow -->
          <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-base-300" />
        </div>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <div class="translate transform overflow-hidden" v-show="sidebarStore.page === item.label">
      <SidebarDropdown v-if="item.children" :items="item.children" :currentPage="route.name" :page="item.label" />
    </div>
  </li>
</template>
