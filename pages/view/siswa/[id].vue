<script setup>
definePageMeta({
  layout: 'blank'
})
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
  ogTitle: 'Daftar Siswa | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',
})
</script>
<template>
  <div class="flex flex-col  mx-auto max-w-242.5 h-screen">
    <NuxtLink to="/view/siswa" class="flex gap-2 py-3 transition duration-200 hover:text-primary ">
      <Icon name="mingcute:back-fill" size="24"/>
      <span>Kembali</span>
    </NuxtLink>
    <!-- ====== Profile Section Start -->
    <div class="overflow-hidden rounded-md bg-dark shadow-default ">
      <div v-if="user" class="relative z-20 h-35 md:h-65">
        <img v-if="user.Nama === 'FAHREZA PASHA HAIKAL'" src="https://api.tierkun.my.id/file/picture/1.jpg" alt="profile cover"
          class="h-full w-full rounded-tl-sm rounded-tr-sm object-cover object-top" />
        <img v-else src="https://api.elearning.smtijogja.sch.id/api/v1/user-file/stream?file_uri=1859/news/685c8b90-ba1e-4806-81dc-d840c980322d.jpg" alt="profile cover"
          class="h-full w-full rounded-tl-sm rounded-tr-sm object-cover object-bottom " />
      </div>
      <div class="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
        <div v-if="user"
          class="relative z-30 mx-auto -mt-22 h-30 w-full max-w-30 rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
          <div class="relative z-20 h-[112px] sm:h-[150px] md:h-[150px] mx-auto">
            <img v-if="user.Nama === 'FAHREZA PASHA HAIKAL'" src="https://api.tierkun.my.id/file/picture/n.jpg"
              alt="profile cover" class="h-full w-full rounded-full object-cover object-center" />
            <img v-else :src="user.url_picture" alt="profile cover"
              class="h-full w-full rounded-full object-cover object-center" />
          </div>
        </div>
        <div v-if="user" class="mt-4">
          <h3 class="mb-1.5 text-2xl font-medium text-white">{{ user.Nama || '' }}</h3>
          <p class="font-medium">{{ user.Kelas }}</p>
        </div>
      </div>
    </div>
    <div v-if="user" class="bg-dark shadow-default rounded-md mt-3 p-5">
      <div class="overflow-x-auto">
        <table class="table">
          <tbody>
            <tr>
              <th>NIS</th>
              <td>{{ user.NIS }}</td>
            </tr>
            <tr>
              <th>Gender</th>
              <td>{{ gender(user.Gender) }}</td>
            </tr>
            <tr>
              <th>Tempat, Tanggal Lahir</th>
              <td>{{ user.TTL || 'Belum Diatur' }}</td>
            </tr>
            <!-- <tr>
              <th>Agama</th>
              <td>{{ user.Agama || 'Belum Diatur' }}</td>
            </tr>
            <tr>
              <th>Alamat</th>
              <td>{{ user.Alamat || 'Belum Diatur' }}</td>
            </tr> -->
          </tbody>
        </table>
      </div>
    </div>
<!-- ====== Profile Section End -->
  </div>
</template>
