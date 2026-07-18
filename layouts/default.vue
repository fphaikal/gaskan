<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSidebarStore } from '../store/sidebar'
import { useAuthStore } from '../store/useAuthStore'
import HeaderArea from '../components/Header/HeaderArea.vue'
import SidebarArea from '../components/Sidebar/SidebarArea.vue'

const sidebarStore = useSidebarStore()
const { isCollapsed } = storeToRefs(sidebarStore)

const authStore = useAuthStore()
const { userData, role } = storeToRefs(authStore)

// Fetch user data on mount if authenticated to update completeness alert
onMounted(async () => {
  if (authStore.authenticated) {
    await authStore.fetchUserData()
  }
})

const isProfileIncomplete = computed(() => {
  if (role.value !== 'siswa' || !userData.value) return false
  
  const u = userData.value
  const hasMissingEmail = !u.Email || u.Email === '-' || u.Email === ''
  const hasMissingPhone = !u.Nomor || u.Nomor === '-' || u.Nomor === '' || u.phone === '-'
  const hasMissingReligion = !u.Agama || u.Agama === '-' || u.Agama === ''
  const hasMissingPlate = !u.Plat_Nomor || u.Plat_Nomor === '-' || u.Plat_Nomor === ''
  const hasMissingAddress = !u.Alamat || u.Alamat === '-' || u.Alamat === ''
  
  return hasMissingEmail || hasMissingPhone || hasMissingReligion || hasMissingPlate || hasMissingAddress
})

const missingFieldsList = computed(() => {
  if (!userData.value) return []
  const u = userData.value
  const list = []
  if (!u.Email || u.Email === '-' || u.Email === '') list.push('Email')
  if (!u.Nomor || u.Nomor === '-' || u.Nomor === '' || u.phone === '-') list.push('Nomor Telepon')
  if (!u.Agama || u.Agama === '-' || u.Agama === '') list.push('Agama')
  if (!u.Plat_Nomor || u.Plat_Nomor === '-' || u.Plat_Nomor === '') list.push('Plat Nomor')
  if (!u.Alamat || u.Alamat === '-' || u.Alamat === '') list.push('Alamat')
  return list
})
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
          <!-- Profile Warning Alert -->
          <div v-if="isProfileIncomplete" class="mb-6 bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0 shadow-inner">
                <Icon name="mingcute:warning-line" size="18" />
              </div>
              <div class="text-xs text-base-content/80 font-medium">
                <span class="font-bold text-warning">Data profil belum lengkap!</span> Mohon lengkapi data 
                <span class="font-bold text-primary">{{ missingFieldsList.join(', ') }}</span> 
                Anda di <NuxtLink to="/profile" class="underline font-bold text-primary hover:text-primary-active">Halaman Profil</NuxtLink> 
                untuk kelancaran pemulihan kata sandi (Email) dan pendataan sekolah.
              </div>
            </div>
          </div>
          <NuxtPage />
        </div>
      </main>
      <!-- ===== Main Content End ===== -->
    </div>
  </div>
  <!-- ===== Page Wrapper End ===== -->
</template>
