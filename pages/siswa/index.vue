<script setup>
const { data } = useFetch(`/api/primary`);

const users = ref([]);
const selectedClass = ref('');
const classOptions = ref([]);

const filteredUsers = computed(() => {
  return users.value.filter(user => 
    user.Kelas !== 'admin' && user.Kelas !== 'developer' && 
    (selectedClass.value === '' || user.Kelas === selectedClass.value)
  );
});

// Watch for changes in data and update users and classOptions accordingly
watch(data, (newData) => {
  if (newData) {
    users.value = Array.isArray(newData) ? newData : [];
    classOptions.value = [...new Set(users.value.map(user => user.Kelas))];
    classOptions.value = classOptions.value.filter(classOption => classOption !== 'admin' && classOption !== 'developer');
  }
});

onMounted(() => {
  if (data.value) {
    users.value = Array.isArray(data.value) ? data.value : [];
    classOptions.value = [...new Set(users.value.map(user => user.Kelas))];
    classOptions.value = classOptions.value.filter(classOption => classOption !== 'admin' && classOption !== 'developer');
  }
});

useSeoMeta({
  title: 'Daftar Siswa | GASKAN',
  ogTitle: 'Daftar Siswa | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/siswa',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/siswa',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Daftar Siswa | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/siswa`,
})
</script>

<template>
  <div class="px-4 pb-8 max-w-6xl mx-auto">
    <div class="mb-6">
      <select v-model="selectedClass" class="select select-bordered select-primary bg-base-200 w-full max-w-xs focus:outline-none">
      <option value="">All Classes</option>
      <option v-for="option in classOptions" :key="option" :value="option">{{ option }}</option>
    </select>
    </div>
    <NuxtLink :to="'/siswa/'+ user.NIS" class="flex flex-row gap-4 group" v-for="user in filteredUsers" :key="user.NIS">
      <div class="flex bg-base-200 border border-base-300 w-full mt-2 p-5 rounded-xl gap-4 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-md">
        <div class="flex w-24">
          <span class="text-base-content font-mono font-medium">{{ user.NIS }}</span>
        </div>
        <div class="flex flex-col md:flex-row gap-2 w-full md:justify-between md:items-center">
          <span class="text-base-content font-bold">{{ user.Nama }}</span>
          <span class="text-primary-content bg-primary rounded-full px-3 py-1 text-xs font-bold w-fit">{{ user.Kelas }}</span>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>
