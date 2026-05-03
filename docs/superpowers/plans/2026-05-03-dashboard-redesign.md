# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the GASKAN application dashboard, Sidebar, and Header into a premium "Bento Box Grid" UI with a distinct Siswa and Admin/Developer dashboard, fully supporting light/dark themes.

**Architecture:** We will update the layout components (`layouts/default.vue`, `SidebarArea.vue`, `HeaderArea.vue`) with semantic DaisyUI theme tokens and Glassmorphism styling. We will decouple `pages/home.vue` into two clean components (`DashboardAdmin.vue` and `DashboardSiswa.vue`) using a responsive CSS grid for the Bento Box layout.

**Tech Stack:** Nuxt 4, Vue 3, TailwindCSS v4, DaisyUI v4/v5, @nuxt/icon.

---

### Task 1: Update Layout Wrapper

**Files:**
- Modify: `layouts/default.vue`

- [ ] **Step 1: Write the minimal implementation**
Modify `layouts/default.vue` to use semantic colors for light/dark mode and adjust the padding for the bento grid.

```vue
<script setup>
import HeaderArea from '../components/Header/HeaderArea.vue'
import SidebarArea from '../components/Sidebar/SidebarArea.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-base-100 text-base-content transition-colors duration-300">
    <SidebarArea />

    <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <HeaderArea />

      <main class="bg-base-200 flex-1 transition-colors duration-300">
        <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add layouts/default.vue
git commit -m "feat: apply semantic background colors to default layout wrapper for theme support"
```

---

### Task 2: Refactor Sidebar Aesthetic

**Files:**
- Modify: `components/Sidebar/SidebarArea.vue`
- Modify: `components/Sidebar/SidebarItem.vue`

- [ ] **Step 1: Write the minimal implementation for SidebarArea**
Remove `bg-dark` from the sidebar and add a border right.

```vue
<!-- components/Sidebar/SidebarArea.vue (replace template) -->
<template>
  <aside
    class="absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-base-100 border-r border-base-300 duration-300 ease-linear lg:static lg:translate-x-0"
    :class="{
      'translate-x-0': sidebarStore.isSidebarOpen,
      '-translate-x-full': !sidebarStore.isSidebarOpen
    }" ref="target">
    <!-- SIDEBAR HEADER -->
    <div class="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-5">
      <router-link class="flex gap-3" to="/home">
        <img src="../../public/smti_logo.svg" class="w-12 my-auto" alt="">
        <span class="self-center text-2xl font-bold whitespace-nowrap text-primary my-auto">| GASKAN</span>
      </router-link>

      <button class="block lg:hidden" @click="sidebarStore.isSidebarOpen = false">
        <Icon name="mingcute:close-fill" class="text-2xl text-base-content" />
      </button>
    </div>

    <div class="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
      <nav class="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
        <template v-for="menuGroup in menuGroups" :key="menuGroup.name">
          <div>
            <h3 class="mb-4 ml-4 text-sm font-medium text-base-content/60">{{ menuGroup.name }}</h3>
            <ul class="mb-6 flex flex-col gap-1.5">
              <SidebarItem v-for="menuItem in menuGroup.menuItems" :key="menuItem.label" :item="menuItem"
                :userRole="userRole" />
            </ul>
          </div>
        </template>
      </nav>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Write the minimal implementation for SidebarItem**
Apply floating pill design for menu items. Find `components/Sidebar/SidebarItem.vue` and replace the generic link styling. Assuming standard Vue template:

```vue
<!-- components/Sidebar/SidebarItem.vue (replace template) -->
<template>
  <li v-if="item.role.includes('all') || item.role.includes(userRole)">
    <router-link
      :to="item.route"
      class="group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 font-medium text-base-content duration-300 ease-in-out hover:bg-base-200"
      active-class="bg-primary/10 text-primary hover:bg-primary/20"
    >
      <Icon :name="item.icon" size="20" class="group-[.router-link-exact-active]:text-primary" />
      {{ item.label }}
    </router-link>
  </li>
</template>
```

*(Note: We preserve existing script logic inside SidebarItem.vue, only updating template classes.)*

- [ ] **Step 3: Commit**

```bash
git add components/Sidebar/SidebarArea.vue components/Sidebar/SidebarItem.vue
git commit -m "feat: redesign sidebar with glassmorphism and rounded floating pill navigation"
```

---

### Task 3: Refactor Header and Theme Toggle

**Files:**
- Modify: `components/Header/HeaderArea.vue`

- [ ] **Step 1: Write the minimal implementation**
Replace `bg-dark` with `backdrop-blur-md bg-base-100/80 border-b border-base-300`. Import `useThemeStore` and add the toggle button.

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add components/Header/HeaderArea.vue
git commit -m "feat: redesign header with glassmorphism and add theme toggle button"
```

---

### Task 4: Scaffold Dashboard Admin Component

**Files:**
- Create: `components/Dashboard/DashboardAdmin.vue`

- [ ] **Step 1: Write the minimal implementation**
Extract the Admin/Developer logic from `home.vue` and wrap it in Bento Grid styling (`bg-base-100 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50 transition-all duration-300`).

```vue
<script setup>
import { useRuntimeConfig } from '#app';
import { useStorage } from '@vueuse/core';

const props = defineProps({
  count: Object,
  login: Array,
  system: Object
});

const config = useRuntimeConfig();
const getRole = useStorage('_id');
const isDev = getRole.value === config.public.DEVELOPER_KEY;

// Base bento card class
const bentoCard = "bg-base-100 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50 transition-all duration-300 flex flex-col justify-center";
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Overview Stats -->
    <div :class="bentoCard">
      <div class="flex items-center justify-between">
        <p class="text-base-content/70 font-medium">Total Developer</p>
        <div class="bg-primary/20 p-2 rounded-full"><Icon name="mingcute:code-fill" class="text-primary text-xl" /></div>
      </div>
      <p class="text-4xl font-bold mt-4 text-base-content">{{ count?.klasifikasi?.developer || 0 }}</p>
    </div>
    <div :class="bentoCard">
      <div class="flex items-center justify-between">
        <p class="text-base-content/70 font-medium">Total Admin</p>
        <div class="bg-primary/20 p-2 rounded-full"><Icon name="mingcute:user-setting-fill" class="text-primary text-xl" /></div>
      </div>
      <p class="text-4xl font-bold mt-4 text-base-content">{{ count?.klasifikasi?.admin || 0 }}</p>
    </div>
    <div :class="bentoCard">
      <div class="flex items-center justify-between">
        <p class="text-base-content/70 font-medium">Total Siswa</p>
        <div class="bg-primary/20 p-2 rounded-full"><Icon name="mingcute:group-fill" class="text-primary text-xl" /></div>
      </div>
      <p class="text-4xl font-bold mt-4 text-base-content">{{ count?.klasifikasi?.siswa || 0 }}</p>
    </div>

    <!-- Progress Metrics -->
    <div :class="[bentoCard, 'md:col-span-2 lg:col-span-1']">
      <p class="text-base-content/70 font-medium mb-4">Siswa Onsite</p>
      <div class="flex items-center gap-4">
        <progress class="progress progress-primary w-full bg-base-200" :value="count?.onsite_only || 0" :max="count?.klasifikasi?.siswa || 100"></progress>
        <p class="font-bold text-base-content whitespace-nowrap">{{ count?.onsite_siswa || 0 }} / {{ count?.klasifikasi?.siswa || 0 }}</p>
      </div>
    </div>
    <div :class="[bentoCard, 'md:col-span-2 lg:col-span-2']">
      <p class="text-base-content/70 font-medium mb-4">Total User Login</p>
      <div class="flex items-center gap-4">
        <progress class="progress progress-primary w-full bg-base-200" :value="login?.length || 0" :max="count?.total || 100"></progress>
        <p class="font-bold text-base-content whitespace-nowrap">{{ login?.length || 0 }} / {{ count?.total || 0 }}</p>
      </div>
    </div>

    <!-- Developer Specs -->
    <div v-if="system && isDev" :class="[bentoCard, 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 !flex-row !justify-start items-start']">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:computer-line" /><span>Hostname</span></div>
        <p class="font-semibold text-base-content">{{ system?.osInfo?.hostname }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:cpu-line" /><span>OS Build</span></div>
        <p class="font-semibold text-base-content">{{ system?.osInfo?.distro }} {{ system?.osInfo?.build }}</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:chip-line" /><span>Memory (RAM)</span></div>
        <p class="font-semibold text-base-content">{{ system?.memory?.used }} {{ system?.memory?.unit }} / 16.0 GB</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-base-content/70"><Icon name="mingcute:server-line" /><span>Storage</span></div>
        <p class="font-semibold text-base-content">{{ system?.disk?.used }} / {{ system?.disk?.total }} {{ system?.disk?.unit }}</p>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/Dashboard/DashboardAdmin.vue
git commit -m "feat: create Bento Grid based DashboardAdmin component"
```

---

### Task 5: Scaffold Dashboard Siswa Component

**Files:**
- Create: `components/Dashboard/DashboardSiswa.vue`

- [ ] **Step 1: Write the minimal implementation**
Create a new Bento Box layout for students.

```vue
<script setup>
const props = defineProps({
  user: Object
});

const bentoCard = "bg-base-100 rounded-3xl p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/50 transition-all duration-300 flex flex-col justify-center relative overflow-hidden";
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    
    <!-- Profil Siswa (2x1 on large) -->
    <div :class="[bentoCard, 'lg:col-span-2 bg-gradient-to-br from-primary/20 to-base-100']">
      <div class="flex items-center gap-6">
        <div class="avatar placeholder">
          <div class="bg-primary text-primary-content rounded-full w-20">
            <span class="text-3xl">{{ user?.Nama?.charAt(0) || 'S' }}</span>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-base-content">Halo, {{ user?.Nama || 'Siswa' }}!</h2>
          <p class="text-base-content/70 mt-1">NIS: {{ user?.NIS || '-' }} | Siap belajar hari ini?</p>
        </div>
      </div>
    </div>

    <!-- Status Kehadiran Hari Ini (1x1) -->
    <div :class="bentoCard">
      <p class="text-base-content/70 font-medium mb-2">Status Hari Ini</p>
      <div class="flex items-center gap-3 text-success">
        <Icon name="mingcute:check-circle-fill" class="text-4xl" />
        <span class="text-2xl font-bold">HADIR</span>
      </div>
    </div>

    <!-- Pengumuman (1x1) -->
    <div :class="bentoCard">
      <p class="text-base-content/70 font-medium mb-2">Jadwal Selanjutnya</p>
      <p class="text-lg font-bold text-base-content">Matematika Dasar</p>
      <p class="text-sm text-base-content/70">08:00 - 09:30 | Ruang 101</p>
    </div>

    <!-- Statistik Bulanan (Full span on lg) -->
    <div :class="[bentoCard, 'lg:col-span-4']">
      <p class="text-base-content/70 font-medium mb-4">Rekap Absensi Bulan Ini</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-success mb-1">12</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Hadir</p>
        </div>
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-info mb-1">1</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Izin</p>
        </div>
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-warning mb-1">0</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Sakit</p>
        </div>
        <div class="bg-base-200 p-4 rounded-2xl text-center">
          <p class="text-3xl font-bold text-error mb-1">0</p>
          <p class="text-xs text-base-content/70 uppercase tracking-wider">Alpa</p>
        </div>
      </div>
    </div>
    
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/Dashboard/DashboardSiswa.vue
git commit -m "feat: create Bento Grid based DashboardSiswa component"
```

---

### Task 6: Refactor home.vue Page

**Files:**
- Modify: `pages/home.vue`

- [ ] **Step 1: Write the minimal implementation**
Clean up `pages/home.vue` by importing the two new components and removing the Naira Easter Egg. Remove the typing animation logic as well.

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { useStorage } from '@vueuse/core';
import DashboardAdmin from '~/components/Dashboard/DashboardAdmin.vue';
import DashboardSiswa from '~/components/Dashboard/DashboardSiswa.vue';

const config = useRuntimeConfig();
const authStore = useAuthStore();
const { nis } = storeToRefs(authStore);

const getRole = useStorage('_id');

const role = () => {
  if (getRole.value === config.public.ADMIN_KEY) return 'admin';
  if (getRole.value === config.public.DEVELOPER_KEY) return 'developer';
  return 'siswa';
};

const isAdminOrDev = computed(() => ['admin', 'developer'].includes(role()));

// Fetch Data
const { data: user } = await useFetch(`/api/user?role=${role()}&user=${nis.value}`);
const { data: count } = await useFetch(`/api/count`);
const { data: login } = await useFetch('/api/log/login');

const system = ref(null);
const socket = ref(null);

onMounted(async () => {
  if (isAdminOrDev.value) {
    socket.value = new WebSocket('wss://api.tierkun.my.id/system');
    socket.value.onopen = () => console.log('Connected to WebSocket server');
    socket.value.onmessage = async (event) => {
      try {
        system.value = await JSON.parse(event.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    socket.value.onclose = () => console.log('Disconnected from WebSocket server');
  }
});

onBeforeUnmount(() => {
  if (socket.value) socket.value.close();
});

useSeoMeta({
  title: 'Home | GASKAN',
  description: 'Dashboard Gerbang Akses Pintar dan Kehadiran',
});
</script>

<template>
  <div>
    <!-- Render Dashboard Admin/Dev -->
    <DashboardAdmin 
      v-if="user && isAdminOrDev" 
      :count="count" 
      :login="login" 
      :system="system" 
    />
    
    <!-- Render Dashboard Siswa -->
    <DashboardSiswa 
      v-else-if="user" 
      :user="user" 
    />

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add pages/home.vue
git commit -m "refactor: clean up home page and integrate Bento dashboard components"
```
