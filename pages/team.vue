<script setup>
definePageMeta({ layout: 'blank' })


const team = ref([])
const loading = ref(true)

const fetchTeam = async () => {
  try {
    const res = await $fetch('/api/team')
    if (res?.data) {
      team.value = res.data.filter(m => m.isActive)
    }
  } catch (error) {
    console.error('Failed to fetch team:', error)
    // Fallback to static data if needed, or just leave empty
  } finally {
    loading.value = false;
  }
}

onMounted(fetchTeam)

const groupedTeam = computed(() => {
  const pembimbing = []
  const pengembang = []
  
  team.value.forEach(m => {
    const isPembimbing = m.role?.toLowerCase().includes('pembimbing')
    if (isPembimbing) {
      pembimbing.push(m)
    } else {
      pengembang.push(m)
    }
  })

  // Sort each group by 'order'
  pembimbing.sort((a, b) => (a.order || 0) - (b.order || 0))
  pengembang.sort((a, b) => (a.order || 0) - (b.order || 0))

  const result = []
  if (pembimbing.length > 0) {
    result.push({
      title: 'Pembimbing',
      icon: 'mingcute:academic-2-fill',
      members: pembimbing
    })
  }
  if (pengembang.length > 0) {
    result.push({
      title: 'Tim Pengembang',
      icon: 'mingcute:code-fill',
      members: pengembang
    })
  }
  return result
})

const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/team/')) {
    return `/api${url}`;
  }
  return url;
};

const getSocmed = (m) => {
  const socmed = []
  if (m.instagram) socmed.push({ name: 'Instagram', link: m.instagram })
  if (m.linkedin) socmed.push({ name: 'LinkedIn', link: m.linkedin })
  if (m.github) socmed.push({ name: 'github', link: m.github })
  return socmed
}

const roleColor = (role) => {
  if (!role) return 'text-secondary'
  if (role.includes('Backend')) return 'text-blue-400'
  if (role.includes('Frontend')) return 'text-green-400'
  if (role.includes('Hardware') || role.includes('Electrical') || role.includes('Mechanical')) return 'text-orange-400'
  if (role.includes('Pembimbing')) return 'text-primary'
  return 'text-secondary'
}

useSeoMeta({
  title: 'Team | GASKAN',
  ogTitle: 'Team | GASKAN',
  description: 'Tim Pengembang Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/team',
  ogUrl: 'https://gaskan.smtijogja.sch.id/team',
  ogDescription: 'Tim Pengembang Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Team | GASKAN',
  twitterDescription: 'Tim Pengembang Gerbang Akses Pintar dan Kehadiran',
  twitterImage: '/banner.webp',
  twitterUrl: 'https://gaskan.smtijogja.sch.id/team',
})
</script>

<template>
  <div class="min-h-screen py-24 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16 space-y-3">
        <div class="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
          Tim GASKAN
        </div>
        <h1 class="text-3xl md:text-4xl font-bold">
          Orang-orang di Balik <span class="text-primary">GASKAN</span>
        </h1>
        <p class="opacity-50 max-w-md mx-auto text-sm leading-relaxed">
          Tim multidisiplin yang membangun dan menjaga sistem kehadiran digital SMTI Jogja.
        </p>
      </div>


      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary opacity-40"></span>
      </div>

      <!-- Grouped Team Sections (by Role Category) -->
      <div v-else class="space-y-16 py-4">
        <div
          v-for="group in groupedTeam"
          :key="group.title"
          class="space-y-6"
        >
          <!-- Section Header -->
          <div class="border-b border-base-200/80 pb-4 text-left">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Icon :name="group.icon" size="20" />
              </div>
              <div>
                <h2 class="text-2xl font-black tracking-tight text-base-content">
                  {{ group.title }}
                </h2>
                <p class="text-xs opacity-50 mt-0.5">
                  {{ group.title === 'Pembimbing' ? 'Pembimbing dan penanggung jawab proyek GASKAN.' : 'Anggota tim pengembang dan pembuat sistem GASKAN.' }}
                </p>
              </div>
              <span class="badge badge-primary badge-outline font-semibold px-2 py-3 text-xs ml-auto">
                {{ group.members.length }} Orang
              </span>
            </div>
          </div>

          <!-- Team grid for this category -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="t in group.members"
              :key="t.id"
              class="group bg-base-200 border border-base-300 hover:border-primary/40 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <!-- Avatar + Period Badge -->
              <div class="flex items-start justify-between gap-2">
                <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="t.photoUrl && !t.photoUrl.includes('0000')" :src="resolvePhoto(t.photoUrl)" :alt="t.name" class="w-full h-full object-cover" />
                  <Icon v-else name="mingcute:user-4-fill" class="text-2xl text-primary/60" />
                </div>
                <span v-if="t.year" class="badge badge-sm bg-base-300/60 border border-base-300/60 text-[9px] font-black py-2 rounded-lg text-base-content/60">
                  {{ t.year }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 text-left">
                <h3 class="font-bold text-sm leading-tight text-base-content">{{ t.name }}</h3>
                <p class="text-xs mt-1 font-medium" :class="roleColor(t.role)">{{ t.role }}</p>
              </div>

              <!-- Social links -->
              <div class="flex gap-1.5">
                <a
                  v-for="s in getSocmed(t)"
                  :key="s.name"
                  :href="s.link"
                  target="_blank"
                  class="w-7 h-7 rounded-lg bg-base-300 hover:bg-primary hover:text-dark flex items-center justify-center transition-colors duration-200"
                  :aria-label="s.name"
                >
                  <Icon v-if="s.name === 'Instagram'" name="mage:instagram-circle" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                  <Icon v-else-if="s.name === 'LinkedIn'" name="entypo-social:linkedin-with-circle" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                  <Icon v-else-if="s.name === 'github'" name="mdi:github" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>