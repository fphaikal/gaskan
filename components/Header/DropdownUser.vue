<script setup>
import { ref, computed, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore'; 

const target = ref(null);
const dropdownOpen = ref(false);

onClickOutside(target, () => {
  dropdownOpen.value = false;
});

const { userData: user, authenticated } = storeToRefs(useAuthStore());
const { fetchUserData, logUserOut } = useAuthStore();

const userRole = computed(() => {
  const r = role.value;
  if (r === 'admin') return 'admin';
  if (r === 'developer') return 'developer';
  if (r === 'guru') return 'guru';
  return 'siswa';
});

const showLogoutModal = ref(false);

const logout = () => {
  dropdownOpen.value = false;
  showLogoutModal.value = true;
};

const confirmLogout = () => {
  showLogoutModal.value = false;
  logUserOut();
};

// Use centralized fetcher — only call if not already loaded
if (authenticated.value) {
  fetchUserData();
} else {
  const unwatchHeader = watch(authenticated, (val) => {
    if (val) { fetchUserData(); unwatchHeader(); }
  });
}
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

          <button
            class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error/80 hover:text-error hover:bg-error/5 transition-colors duration-150"
            @click="logout"
          >
            <Icon name="mingcute:exit-line" class="text-base text-error/50" />
            Log Out
          </button>
        </div>
      </div>
    </Transition>

    <!-- Logout Confirmation Modal -->
    <Teleport to="body">
      <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showLogoutModal }]">
        <div class="modal-box bg-base-100 border border-base-300 shadow-2xl rounded-3xl">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
              <Icon name="mingcute:exit-line" class="text-2xl" />
            </div>
            <div>
              <h3 class="font-bold text-lg">Konfirmasi Keluar</h3>
              <p class="text-sm text-base-content/60">Apakah Anda yakin ingin keluar dari sistem?</p>
            </div>
          </div>
          <div class="modal-action gap-3">
            <button class="btn btn-ghost rounded-xl flex-1" @click="showLogoutModal = false">Batal</button>
            <button class="btn btn-error rounded-xl flex-1 text-white shadow-lg shadow-error/20" @click="confirmLogout">
              Ya, Keluar
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm" @click="showLogoutModal = false">
          <button>close</button>
        </form>
      </dialog>
    </Teleport>
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
