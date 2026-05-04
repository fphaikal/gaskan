<script setup>
const route = useRoute();
const nis = route.params.id;

const gender = (getGender) => {
  if (getGender === 'L') {
    return 'Laki-Laki'
  } else if (getGender === 'P'){
    return 'Perempuan'
  } else {
    return 'Belum diatur'
  }
}

const { data: user } = await useFetch(`/api/user?role=siswa&user=${nis}`);

useSeoMeta({
  title: `Profil ${user.value.Nama} | GASKAN`,
  ogTitle: `Profil ${user.value.Nama} | GASKAN`,
  image: user.value.url_picture,
  description:  `Profil Siswa ${user.value.Nama}`,
  url: `https://gaskan.smtijogja.sch.id/siswa/${nis}`,
  site_name: 'GASKAN',
  ogUrl: `https://gaskan.smtijogja.sch.id/siswa/${nis}`,
  ogDescription:  `Profil Siswa ${user.value.Nama}`,
  ogImage: user.value.url_picture,
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `${user.value.Name} | GASKAN`,
  twitterDescription: `Profil ${user.value.Name} | GASKAN`,
  twitterImage: user.value.url_picture,
  twitterUrl: `https://gaskan.smtijogja.sch.id/siswa/${nis}`,
})
</script>
<template>
  <div class="mx-auto max-w-7xl px-4 md:px-0">
    <!-- ====== Profile Section Start -->
    <div v-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 items-start">
      
      <!-- Left Column (Identity & Personal Info) -->
      <div class="lg:col-span-2 flex flex-col gap-4 md:gap-6">
        
        <!-- 1. Identity Block -->
        <div class="overflow-hidden rounded-3xl bg-base-100 shadow-sm border border-base-200/60">
          <div class="relative z-20 h-32 md:h-44">
            <img src="../../public/banner.webp" alt="profile cover" class="h-full w-full object-cover object-center" />
          </div>
          <div class="px-4 pb-6 lg:pb-8 text-center relative">
            <div class="relative z-30 mx-auto -mt-16 h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-base-100 p-1.5 shadow-md">
              <div class="relative z-20 h-full w-full mx-auto rounded-full overflow-hidden bg-base-200">
                <img :src="user.url_picture" alt="profile photo" class="h-full w-full object-cover object-center" />
              </div>
            </div>
            <div class="mt-4">
              <h3 class="mb-1 text-2xl font-bold text-base-content">{{ user.Nama || '' }}</h3>
              <p class="font-medium text-base-content/70">{{ user.Kelas }}</p>
              <div class="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-base-200/50 border border-base-200 text-base-content/80 rounded-full text-sm font-semibold shadow-sm">
                NIS: {{ user.NIS }}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Personal Info Block -->
        <div class="rounded-3xl bg-base-100 p-6 md:p-8 shadow-sm border border-base-200/60">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-base-200/60">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Informasi Pribadi</h4>
          </div>
          <div class="flex flex-col gap-6">
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:calendar-fill" size="20" />
              </div>
              <div class="flex-1">
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Tempat, Tanggal Lahir</p>
                <div class="flex items-center justify-between">
                  <p class="text-base font-medium text-base-content">{{ user.TTL || 'Belum Diatur' }}</p>
                </div>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:user-info-fill" size="20" />
              </div>
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Gender / Agama</p>
                <p class="text-base font-medium text-base-content">{{ gender(user.Gender) }} &bull; {{ user.Agama || 'Belum Diatur' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-base-200/50 text-base-content/60">
                <Icon name="mingcute:location-fill" size="20" />
              </div>
              <div>
                <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Alamat</p>
                <p class="text-base font-medium text-base-content leading-relaxed">{{ user.Alamat || 'Belum Diatur' }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- Right Column (Contact & Vehicle) -->
      <div class="lg:col-span-1 flex flex-col gap-4 md:gap-6">
        
        <!-- Contact Block -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative transition-all duration-300 hover:shadow-md">
          <div class="flex items-center justify-between mb-5">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kontak</h4>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-success/10 text-success shadow-inner">
              <Icon name="mingcute:phone-fill" size="28" />
            </div>
            <div>
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">WhatsApp / Telp</p>
              <p class="text-lg font-bold text-base-content">{{ user.Nomor || 'Belum Diatur' }}</p>
            </div>
          </div>
        </div>

        <!-- Vehicle Block -->
        <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative transition-all duration-300 hover:shadow-md">
          <div class="flex items-center justify-between mb-5">
            <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kendaraan</h4>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-info/10 text-info shadow-inner">
              <Icon name="mingcute:car-fill" size="28" />
            </div>
            <div>
              <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">Plat Nomor</p>
              <div class="mt-1 px-3 py-1.5 bg-base-200/80 border border-base-300/50 rounded-lg inline-block">
                <span class="text-md font-mono font-bold tracking-widest text-base-content">{{ user.Plat_Nomor || '----' }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[50vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
    <!-- ====== Profile Section End -->
  </div>
</template>
