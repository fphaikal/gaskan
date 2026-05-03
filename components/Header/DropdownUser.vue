<script setup>
import { ref, computed } from 'vue';
import { onClickOutside, useStorage } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore'; 

const config = useRuntimeConfig();
const target = ref(null);
const dropdownOpen = ref(false);

onClickOutside(target, () => {
  dropdownOpen.value = false;
});

const { nis } = storeToRefs(useAuthStore());

const role = useStorage('_id');

const userRole = computed(() => {
  if (role.value === config.public.ADMIN_KEY) return 'admin';
  if (role.value === config.public.DEVELOPER_KEY) return 'developer';
  return 'siswa';
});

const { data: user } = useFetch(
  computed(() => `/api/user?role=${userRole.value}&user=${nis.value}`)
);
</script>

<template>
  <div class="relative" ref="target">
    <button
      class="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-base-200 transition-all duration-200"
      @click="dropdownOpen = !dropdownOpen"
      :aria-expanded="dropdownOpen"
      aria-haspopup="true"
    >
      <!-- Avatar -->
      <div class="relative">
        <div class="avatar">
          <div class="w-8 h-8 rounded-full overflow-hidden bg-primary/10">
            <img
              v-if="user?.url_picture"
              :src="user.url_picture"
              :alt="user?.Nama"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
              {{ user?.Nama?.charAt(0) || '?' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Name (hidden on small screens) -->
      <div class="hidden md:flex flex-col items-start leading-tight">
        <span class="text-sm font-semibold text-base-content">{{ user?.Nama?.split(' ')[0] || 'User' }}</span>
      </div>

      <!-- Chevron -->
      <Icon
        name="mingcute:down-fill"
        :class="['text-xs text-base-content/50 transition-transform duration-200', dropdownOpen ? 'rotate-180' : '']"
      />
    </button>

    <!-- Dropdown Panel -->
    <Transition name="dropdown">
      <div
        v-show="dropdownOpen"
        class="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-base-300 bg-base-100 shadow-lg shadow-base-300/30 overflow-hidden"
      >
        <!-- User Info Header -->
        <div class="px-4 py-3 border-b border-base-300">
          <p class="text-sm font-semibold text-base-content truncate">{{ user?.Nama }}</p>
          <p class="text-xs text-base-content/50 truncate">{{ user?.NIS || user?.Kelas }}</p>
        </div>

        <!-- Menu Items -->
        <div class="py-1.5">
          <router-link
            to="/profile"
            class="flex items-center gap-3 px-4 py-2.5 text-sm text-base-content/80 hover:text-base-content hover:bg-base-200 transition-colors duration-150"
            @click="dropdownOpen = false"
          >
            <Icon name="mingcute:user-3-line" class="text-base text-base-content/50" />
            My Profile
          </router-link>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
