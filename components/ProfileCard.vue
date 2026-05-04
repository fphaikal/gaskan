<script setup>
import { format } from 'date-fns'
import { setupCalendar, Calendar, DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { nis, role: sessionRole } = storeToRefs(useAuthStore()); // make authenticated state reactive

const date = ref(new Date())

const role = computed(() => sessionRole.value || 'siswa')
const gender = (getGender) => {
  if (getGender === 'L') {
    return 'Laki-Laki'
  } else if (getGender === 'P') {
    return 'Perempuan'
  } else {
    return 'Belum diatur'
  }
}

const { data: user, refresh: refreshUser } = useFetch(
  computed(() => `/api/user?role=${role.value}&user=${nis.value}`)
);

const err = ref(false);
const errMsg = ref('');
const newData = ref({
  TTL: '',
  Nomor: '',
  Plat: '',
  Password: ''
});

const closeAndRefresh = async (modalId) => {
  await refreshUser();
  document.getElementById(modalId)?.close();
  err.value = false;
  errMsg.value = '';
};

const handleError = (error) => {
  err.value = true;
  errMsg.value = error?.data?.error || error?.data?.statusMessage || error?.message || 'Terjadi kesalahan.';
};

const editTTL = async () => {
  if (!newData.value.TTL) {
    handleError({ message: 'Tempat lahir tidak boleh kosong' });
    return;
  }
  try {
    const data = {
      TTL: newData.value.TTL + ', ' + format(date.value, 'yyyy-MM-dd')
    };
    await $fetch('/api/profile/ttl', {
      method: 'PUT',
      body: data
    });
    await closeAndRefresh('editTTL');
  } catch (error) {
    handleError(error);
  }
};

const editNomor = async () => {
  try {
    const nomor = {
      Nomor: newData.value.Nomor.toString()
    };
    await $fetch('/api/profile/nomor', {
      method: 'PUT',
      body: nomor
    });
    await closeAndRefresh('editNomor');
  } catch (error) {
    handleError(error);
  }
};

const editPlat = async () => {
  try {
    const plat = {
      Plat_Nomor: newData.value.Plat
    };
    await $fetch('/api/profile/plat', {
      method: 'PUT',
      body: plat
    });
    await closeAndRefresh('editPlat');
  } catch (error) {
    handleError(error);
  }
};

const editPassword = async () => {
  if (!newData.value.Password) {
    handleError({ message: 'Password tidak boleh kosong' });
    return;
  }
  try {
    const data = {
      Password: newData.value.Password
    };
    await $fetch('/api/profile/password', {
      method: 'PUT',
      body: data
    });
    newData.value.Password = ''; // Reset input
    await closeAndRefresh('changePass');
  } catch (error) {
    handleError(error);
  }
};

const showDatePicker = ref(false); // Controls popover visibility

const toggleDatePicker = () => {
  showDatePicker.value = !showDatePicker.value;
};


</script>
<template>
  <!-- ====== Profile Section Start -->
  <div v-if="user" class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 items-start">
    
    <!-- Left Column (Identity & Personal Info) -->
    <div class="lg:col-span-2 flex flex-col gap-4 md:gap-6">
      
      <!-- 1. Identity Block -->
      <div class="overflow-hidden rounded-3xl bg-base-100 shadow-sm border border-base-200/60">
        <div class="relative z-20 h-32 md:h-44">
          <img src="../public/banner.webp" alt="profile cover" class="h-full w-full object-cover object-center" />
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
                <button @click="document.getElementById('editTTL').showModal()" class="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:text-primary transition-colors" title="Edit TTL">
                  <Icon name="flowbite:edit-solid" size="16" />
                </button>
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
    
    <!-- Right Column (Contact, Vehicle, Security) -->
    <div class="lg:col-span-1 flex flex-col gap-4 md:gap-6">
      
      <!-- Contact Block -->
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative group transition-all duration-300 hover:shadow-md">
        <div class="flex items-center justify-between mb-5">
          <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kontak</h4>
          <button @click="document.getElementById('editNomor').showModal()" class="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:text-primary transition-colors bg-base-200/30" title="Edit Nomor">
            <Icon name="flowbite:edit-solid" size="16" />
          </button>
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
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 relative group transition-all duration-300 hover:shadow-md">
        <div class="flex items-center justify-between mb-5">
          <h4 class="text-sm font-bold text-base-content/60 uppercase tracking-wider">Kendaraan</h4>
          <button @click="document.getElementById('editPlat').showModal()" class="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:text-primary transition-colors bg-base-200/30" title="Edit Plat Nomor">
            <Icon name="flowbite:edit-solid" size="16" />
          </button>
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

      <!-- Security Block -->
      <div class="rounded-3xl bg-base-100 p-6 shadow-sm border border-base-200/60 flex flex-col justify-center">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-error/10 text-error">
            <Icon name="mingcute:shield-shape-fill" size="20" />
          </div>
          <h4 class="text-sm font-bold text-base-content/80 uppercase tracking-wider">Keamanan</h4>
        </div>
        <p class="text-sm text-base-content/60 mb-5 leading-relaxed">Pastikan kata sandi Anda kuat dan tidak dibagikan ke siapapun.</p>
        <div v-if="user.Nomor">
          <button @click="document.getElementById('changePass').showModal()" class="btn btn-primary w-full rounded-xl gap-2 font-semibold shadow-sm hover:shadow-md transition-all">
            <Icon name="mingcute:key-2-fill" size="18" />
            Ganti Password
          </button>
        </div>
        <div v-else class="p-3.5 bg-warning/10 border border-warning/20 rounded-xl text-sm text-warning-content flex items-start gap-3">
          <Icon name="mingcute:warning-fill" size="20" class="shrink-0 mt-0.5" />
          <p class="leading-relaxed font-medium text-xs">Isi nomor WhatsApp pada kolom Kontak untuk mengganti password.</p>
        </div>
      </div>

    </div>
  </div>

  <!-- Loading State -->
  <div v-else class="flex items-center justify-center min-h-[50vh]">
    <span class="loading loading-spinner loading-lg text-primary"></span>
  </div>

  <!-- Modals -->
  <dialog id="editTTL" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8 overflow-visible">
      <h3 class="font-bold text-xl text-base-content mb-6">Ganti Tempat & Tanggal Lahir</h3>
      
      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-6 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex flex-col gap-2 w-full">
          <label for="TTL" class="text-base-content/80 font-medium text-sm ml-1">Tempat</label>
          <input type="text" id="TTL" v-model="newData.TTL" class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Contoh: Jakarta" />
        </div>
        <div class="flex flex-col gap-2 w-full relative">
          <label for="TTLDate" class="text-base-content/80 font-medium text-sm ml-1">Tanggal Lahir</label>
          <button @click="toggleDatePicker" class="input input-bordered w-full bg-base-100 rounded-xl flex items-center justify-start text-left hover:border-base-content/30 transition-all">
            <span v-if="date">{{ format(date, 'yyyy-MM-dd') }}</span>
            <span v-else class="text-base-content/40">Pilih tanggal</span>
          </button>
          <!-- Date Picker Dropdown -->
          <div v-if="showDatePicker" class="absolute top-full left-0 z-50 mt-2">
            <DatePicker v-model="date" mode="date" @input="toggleDatePicker" class="shadow-xl rounded-2xl border-none" />
          </div>
        </div>
      </div>
      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full sm:w-auto">
          <button class="btn btn-ghost rounded-xl flex-1 sm:flex-none">Batal</button>
          <button @click.prevent="editTTL" class="btn btn-primary rounded-xl flex-1 sm:flex-none px-8">Simpan</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="showDatePicker = false">close</button>
    </form>
  </dialog>

  <dialog id="editNomor" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8">
      <h3 class="font-bold text-xl text-base-content mb-2">Ganti Nomor Kontak</h3>
      <p class="text-sm text-base-content/60 mb-6">Nomor ini digunakan untuk verifikasi dan komunikasi penting.</p>
      
      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-6 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2 w-full">
          <label for="Nomor" class="text-base-content/80 font-medium text-sm ml-1">WhatsApp / Telepon</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-base-content/50">+62</span>
            <input type="number" id="Nomor" v-model="newData.Nomor" class="input input-bordered w-full bg-base-100 rounded-xl pl-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="81234567890" />
          </div>
          <div class="flex flex-col gap-1 text-xs text-base-content/50 mt-2 ml-1">
            <p>&bull; Jangan sertakan angka 0 di awal (contoh: 812...)</p>
            <p>&bull; Pastikan nomor Anda terdaftar di WhatsApp</p>
          </div>
        </div>
      </div>
      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full sm:w-auto">
          <button class="btn btn-ghost rounded-xl flex-1 sm:flex-none">Batal</button>
          <button @click.prevent="editNomor" class="btn btn-primary rounded-xl flex-1 sm:flex-none px-8">Simpan</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>

  <dialog id="editPlat" class="modal">
    <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8">
      <h3 class="font-bold text-xl text-base-content mb-6">Ganti Plat Nomor</h3>
      
      <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-6 shadow-sm">
        <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
        <span class="text-sm font-medium">{{ errMsg }}</span>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2 w-full">
          <label for="Plat" class="text-base-content/80 font-medium text-sm ml-1">Plat Kendaraan</label>
          <input type="text" id="Plat" v-model="newData.Plat" class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase font-mono"
            placeholder="B 1234 ABC" />
        </div>
      </div>
      <div class="modal-action mt-8">
        <form method="dialog" class="flex gap-3 w-full sm:w-auto">
          <button class="btn btn-ghost rounded-xl flex-1 sm:flex-none">Batal</button>
          <button @click.prevent="editPlat" class="btn btn-primary rounded-xl flex-1 sm:flex-none px-8">Simpan</button>
        </form>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>

  <div v-if="user">
    <dialog v-if="user.Nomor" id="changePass" class="modal">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="mingcute:key-2-fill" size="20" />
          </div>
          <h3 class="font-bold text-xl text-base-content">Ganti Password</h3>
        </div>
        
        <div v-if="err" role="alert" class="alert alert-error rounded-xl mb-6 shadow-sm">
          <Icon name="mingcute:warning-fill" size="20" class="shrink-0" />
          <span class="text-sm font-medium">{{ errMsg }}</span>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2 w-full">
            <label for="NewPassword" class="text-base-content/80 font-medium text-sm ml-1">Password Baru</label>
            <input type="password" id="NewPassword" v-model="newData.Password" class="input input-bordered w-full bg-base-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Masukkan password baru" />
          </div>
        </div>
        <div class="modal-action mt-8">
          <form method="dialog" class="flex gap-3 w-full sm:w-auto">
            <button class="btn btn-ghost rounded-xl flex-1 sm:flex-none">Batal</button>
            <button @click.prevent="editPassword" class="btn btn-primary rounded-xl flex-1 sm:flex-none px-8">Simpan Password</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
    
    <dialog v-else id="changePass" class="modal">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-3xl p-6 sm:p-8 text-center">
        <div class="mx-auto w-16 h-16 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4">
          <Icon name="mingcute:warning-fill" size="32" />
        </div>
        <h3 class="font-bold text-xl text-base-content mb-2">Akses Ditolak</h3>
        <p class="text-base-content/70">Isi nomor telepon/WhatsApp Anda pada bagian Kontak terlebih dahulu sebelum mengganti password.</p>
        <div class="modal-action justify-center mt-8">
          <form method="dialog">
            <button class="btn btn-ghost rounded-xl px-8">Tutup</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
  <!-- ====== Profile Section End -->
</template>

