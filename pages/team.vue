<script setup>
definePageMeta({ layout: 'blank' })

const team = ref([])
const loading = ref(true)

const selectedMember = ref(null)
const showDetailModal = ref(false)

const openDetail = (member) => {
  selectedMember.value = member
  showDetailModal.value = true
}

const closeDetail = () => {
  showDetailModal.value = false
  selectedMember.value = null
}

const fetchTeam = async () => {
  try {
    const res = await $fetch('/api/team')
    if (res?.data) {
      team.value = res.data.filter(m => m.isActive)
    }
  } catch (error) {
    console.error('Failed to fetch team:', error)
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

  pembimbing.sort((a, b) => (a.order || 0) - (b.order || 0))
  pengembang.sort((a, b) => (a.order || 0) - (b.order || 0))

  const result = []
  if (pembimbing.length > 0) {
    result.push({
      title: 'Pembimbing',
      icon: 'mingcute:school-fill',
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

const parseCustomLinks = (raw) => {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? raw : []
}

const getSocmed = (m) => {
  const socmed = []
  if (m.instagram) socmed.push({ name: 'Instagram', link: m.instagram })
  if (m.linkedin) socmed.push({ name: 'LinkedIn', link: m.linkedin })
  if (m.github) socmed.push({ name: 'github', link: m.github })

  const custom = parseCustomLinks(m.customLinks)
  custom.forEach(item => {
    if (item.url) {
      socmed.push({ name: item.label || 'Link', link: item.url, isCustom: true, icon: item.icon })
    }
  })

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
  <div class="min-h-screen py-20 px-4">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12 space-y-3">
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
      <div v-else class="space-y-14 py-4">
        <div
          v-for="group in groupedTeam"
          :key="group.title"
          class="space-y-6"
        >
          <!-- Section Header -->
          <div class="border-b border-base-200/80 pb-4 text-left">
            <div class="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Icon :name="group.icon" size="20" />
                </div>
                <div class="min-w-0">
                  <h2 class="text-xl sm:text-2xl font-black tracking-tight text-base-content leading-tight">
                    {{ group.title }}
                  </h2>
                  <p class="text-xs opacity-50 mt-0.5 leading-normal">
                    {{ group.title === 'Pembimbing' ? 'Pembimbing dan penanggung jawab proyek GASKAN.' : 'Anggota tim pengembang dan pembuat sistem GASKAN.' }}
                  </p>
                </div>
              </div>
              <span class="shrink-0 bg-primary/10 border border-primary/20 text-primary font-bold text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1 self-start sm:self-center">
                <span>{{ group.members.length }}</span>
                <span>Orang</span>
              </span>
            </div>
          </div>

          <!-- Team grid for this category -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="t in group.members"
              :key="t.id"
              @click="openDetail(t)"
              class="group bg-base-200 border border-base-300 hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative overflow-hidden"
            >
              <!-- Avatar + Period Badge -->
              <div class="flex items-start justify-between gap-2">
                <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="t.photoUrl && !t.photoUrl.includes('0000')" :src="resolvePhoto(t.photoUrl)" :alt="t.name" class="w-full h-full object-cover" />
                  <Icon v-else name="mingcute:user-4-fill" class="text-2xl text-primary/60" />
                </div>
                <span v-if="t.year" class="badge badge-sm bg-base-300/60 border border-base-300/60 text-[9px] font-black py-1.5 px-2 rounded-lg text-base-content/60 shrink-0 truncate max-w-[80px]">
                  {{ t.year }}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 text-left min-w-0">
                <h3 class="font-bold text-xs sm:text-sm leading-tight text-base-content line-clamp-2">{{ t.name }}</h3>
                <p class="text-[11px] sm:text-xs mt-1 font-medium truncate" :class="roleColor(t.role)">{{ t.role }}</p>
                <p v-if="t.bio" class="text-[10px] opacity-60 mt-1.5 line-clamp-2 italic leading-relaxed">
                  "{{ t.bio }}"
                </p>
              </div>

              <!-- Social links -->
              <div class="flex flex-wrap gap-1.5 pt-1">
                <a
                  v-for="s in getSocmed(t)"
                  :key="s.name + s.link"
                  :href="s.link"
                  target="_blank"
                  @click.stop
                  class="w-7 h-7 rounded-lg bg-base-300 hover:bg-primary hover:text-dark flex items-center justify-center transition-colors duration-200 shrink-0"
                  :title="s.name"
                  :aria-label="s.name"
                >
                  <Icon v-if="s.name === 'Instagram'" name="mage:instagram-circle" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                  <Icon v-else-if="s.name === 'LinkedIn'" name="entypo-social:linkedin-with-circle" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                  <Icon v-else-if="s.name === 'github'" name="mdi:github" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                  <Icon v-else :name="s.icon || 'mingcute:external-link-line'" class="text-sm text-base-content/60 group-hover:text-primary-content" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Member Detail Modal -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showDetailModal }]">
      <div v-if="selectedMember" class="modal-box bg-base-100 border border-base-300 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-w-md relative overflow-hidden">
        <!-- Close Button X -->
        <button
          @click="closeDetail"
          class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 z-10 text-base-content/60 hover:text-base-content"
        >
          <Icon name="mingcute:close-line" class="text-xl" />
        </button>

        <!-- Header Decorative Background -->
        <div class="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-primary/15 to-transparent pointer-events-none" />

        <!-- Member Profile Content -->
        <div class="relative z-10 text-center space-y-4 pt-2">
          <!-- Large Avatar Frame -->
          <div class="w-28 h-28 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto overflow-hidden shadow-2xl shadow-primary/20">
            <img
              v-if="selectedMember.photoUrl && !selectedMember.photoUrl.includes('0000')"
              :src="resolvePhoto(selectedMember.photoUrl)"
              :alt="selectedMember.name"
              class="w-full h-full object-cover"
            />
            <Icon v-else name="mingcute:user-4-fill" class="text-5xl text-primary/60" />
          </div>

          <!-- Name & Role -->
          <div>
            <h3 class="text-2xl font-black text-base-content tracking-tight">{{ selectedMember.name }}</h3>
            <p class="text-sm font-bold mt-1" :class="roleColor(selectedMember.role)">{{ selectedMember.role }}</p>
          </div>

          <!-- Bio Section if present -->
          <div v-if="selectedMember.bio" class="px-2">
            <div class="p-3.5 rounded-2xl bg-base-200/70 border border-base-300 text-xs text-base-content/80 leading-relaxed text-left italic relative">
              <Icon name="mingcute:quote-left-fill" class="text-primary/20 text-xl absolute top-2 left-2 pointer-events-none" />
              <p class="relative z-10 pl-3 font-medium">{{ selectedMember.bio }}</p>
            </div>
          </div>

          <!-- Period Badge -->
          <div v-if="selectedMember.year" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-base-200 border border-base-300 text-xs font-bold opacity-75">
            <Icon name="mingcute:time-line" class="text-primary text-sm" />
            <span>Periode {{ selectedMember.year }}</span>
          </div>

          <!-- Email Info if available -->
          <div v-if="selectedMember.email" class="pt-1">
            <a
              :href="`mailto:${selectedMember.email}`"
              class="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/10 px-3.5 py-2 rounded-xl border border-primary/20"
            >
              <Icon name="mingcute:mail-line" class="text-sm" />
              <span>{{ selectedMember.email }}</span>
            </a>
          </div>

          <!-- Social & Custom Links Section -->
          <div class="pt-4 border-t border-base-200/80 space-y-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-base-content/40">Media Sosial & Tautan Custom</p>
            <div class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              <a
                v-if="selectedMember.github"
                :href="selectedMember.github"
                target="_blank"
                class="flex items-center gap-3 p-3 rounded-2xl bg-base-200 hover:bg-base-300 border border-base-300 transition-all font-semibold text-xs text-base-content group"
              >
                <div class="w-8 h-8 rounded-xl bg-base-300 group-hover:bg-primary group-hover:text-dark flex items-center justify-center transition-colors">
                  <Icon name="mdi:github" class="text-lg" />
                </div>
                <span class="flex-1 text-left truncate">GitHub</span>
                <Icon name="mingcute:external-link-line" class="text-sm opacity-40 group-hover:opacity-100" />
              </a>

              <a
                v-if="selectedMember.linkedin"
                :href="selectedMember.linkedin"
                target="_blank"
                class="flex items-center gap-3 p-3 rounded-2xl bg-base-200 hover:bg-base-300 border border-base-300 transition-all font-semibold text-xs text-base-content group"
              >
                <div class="w-8 h-8 rounded-xl bg-base-300 group-hover:bg-primary group-hover:text-dark flex items-center justify-center text-blue-400 transition-colors">
                  <Icon name="entypo-social:linkedin-with-circle" class="text-lg" />
                </div>
                <span class="flex-1 text-left truncate">LinkedIn</span>
                <Icon name="mingcute:external-link-line" class="text-sm opacity-40 group-hover:opacity-100" />
              </a>

              <a
                v-if="selectedMember.instagram"
                :href="selectedMember.instagram"
                target="_blank"
                class="flex items-center gap-3 p-3 rounded-2xl bg-base-200 hover:bg-base-300 border border-base-300 transition-all font-semibold text-xs text-base-content group"
              >
                <div class="w-8 h-8 rounded-xl bg-base-300 group-hover:bg-primary group-hover:text-dark flex items-center justify-center text-pink-400 transition-colors">
                  <Icon name="mage:instagram-circle" class="text-lg" />
                </div>
                <span class="flex-1 text-left truncate">Instagram</span>
                <Icon name="mingcute:external-link-line" class="text-sm opacity-40 group-hover:opacity-100" />
              </a>

              <!-- Custom Links -->
              <a
                v-for="(link, idx) in parseCustomLinks(selectedMember.customLinks)"
                :key="idx"
                :href="link.url"
                target="_blank"
                class="flex items-center gap-3 p-3 rounded-2xl bg-base-200 hover:bg-base-300 border border-base-300 transition-all font-semibold text-xs text-base-content group"
              >
                <div class="w-8 h-8 rounded-xl bg-base-300 group-hover:bg-primary group-hover:text-dark flex items-center justify-center text-primary transition-colors">
                  <Icon :name="link.icon || 'mingcute:link-2-line'" class="text-lg" />
                </div>
                <span class="flex-1 text-left truncate">{{ link.label || 'Tautan Custom' }}</span>
                <Icon name="mingcute:external-link-line" class="text-sm opacity-40 group-hover:opacity-100" />
              </a>

              <div v-if="!selectedMember.github && !selectedMember.linkedin && !selectedMember.instagram && !selectedMember.email && parseCustomLinks(selectedMember.customLinks).length === 0" class="text-xs opacity-40 italic py-2">
                Tidak ada tautan kontak tambahan
              </div>
            </div>
          </div>

          <!-- Close Action -->
          <div class="pt-2">
            <button @click="closeDetail" class="btn btn-ghost w-full rounded-2xl text-xs font-bold opacity-60 hover:opacity-100">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</template>