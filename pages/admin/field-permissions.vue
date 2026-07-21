<script setup>
import { ref, onMounted } from 'vue';

useSeoMeta({
  title: 'Izin Profil Siswa | GASKAN',
  description: 'Pengaturan Hak Akses dan Perizinan Edit Field Profil Siswa',
});

const { $toast } = useNuxtApp();

const fieldPermissions = ref([]);
const loading = ref(true);
const saving = ref(false);

const fetchFieldPermissions = async () => {
  loading.value = true;
  try {
    const res = await $fetch('/api/system/field-permissions');
    if (res?.success && res.data) {
      fieldPermissions.value = res.data;
    }
  } catch (err) {
    console.error('Failed to fetch field permissions:', err);
    $toast.error('Gagal mengambil data perizinan field siswa');
  } finally {
    loading.value = false;
  }
};

const saveFieldPermissions = async () => {
  saving.value = true;
  try {
    const res = await $fetch('/api/system/field-permissions', {
      method: 'PUT',
      body: { permissions: fieldPermissions.value }
    });
    if (res?.success) {
      $toast.success('Perizinan field profil siswa berhasil disimpan!');
      await fetchFieldPermissions();
    }
  } catch (err) {
    $toast.error(err?.data?.message || 'Gagal menyimpan perizinan field');
  } finally {
    saving.value = false;
  }
};

const setAllModes = (targetMode) => {
  fieldPermissions.value.forEach((item) => {
    item.mode = targetMode;
  });
};

onMounted(() => {
  fetchFieldPermissions();
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 md:px-0 py-6 space-y-6">
    <!-- Header Page -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-6 md:p-8 rounded-[2rem] border border-base-200/80 shadow-sm">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <NuxtLink to="/siswa" class="btn btn-ghost btn-xs btn-circle rounded-lg hover:bg-base-200">
            <Icon name="mingcute:left-line" size="18" />
          </NuxtLink>
          <span class="badge badge-primary font-bold text-[10px]">DATA MASTER</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-black text-base-content tracking-tight">Pengaturan Izin Profil Siswa</h1>
        <p class="text-xs md:text-sm opacity-60 mt-1">
          Kelola perizinan edit tiap field profil biodata siswa. Pengaturan ini berlaku khusus untuk akun <strong>SISWA</strong>.
        </p>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button 
          @click="saveFieldPermissions" 
          :disabled="saving || loading"
          class="btn btn-primary rounded-2xl px-6 font-bold gap-2 shadow-lg shadow-primary/20"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          <Icon v-else name="mingcute:save-fill" size="18" />
          <span>Simpan Perizinan Field</span>
        </button>
      </div>
    </div>

    <!-- Quick Bulk Actions & Legend -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-4 md:px-6 rounded-2xl border border-base-200/80">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-black opacity-50 mr-2 uppercase tracking-wider">Aksi Masal:</span>
        <button @click="setAllModes('FREELY_EDITABLE')" class="btn btn-xs btn-ghost bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-bold">
          🟢 Set Semua Bebas
        </button>
        <button @click="setAllModes('LOCKED')" class="btn btn-xs btn-ghost bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold">
          🔴 Set Semua Terkunci
        </button>
        <button @click="setAllModes('FILL_ONCE')" class="btn btn-xs btn-ghost bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-xl font-bold">
          🟡 Set Semua 1x Isi
        </button>
      </div>

      <div class="flex items-center gap-3 text-xs font-bold opacity-70">
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Bebas</span>
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Dikunci</span>
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> 1x Isi Kosong</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[40vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Field Cards Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div 
        v-for="field in fieldPermissions" 
        :key="field.fieldName"
        class="bg-base-100 p-6 rounded-[2rem] border border-base-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
      >
        <div class="flex items-center justify-between border-b border-base-200/60 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Icon v-if="field.fieldName.includes('photo')" name="mingcute:user-4-fill" size="18" />
              <Icon v-else-if="field.fieldName.includes('face')" name="mingcute:face-fill" size="18" />
              <Icon v-else-if="field.fieldName.includes('phone')" name="mingcute:phone-fill" size="18" />
              <Icon v-else-if="field.fieldName.includes('email')" name="mingcute:mail-fill" size="18" />
              <Icon v-else-if="field.fieldName.includes('address')" name="mingcute:location-fill" size="18" />
              <Icon v-else-if="field.fieldName.includes('birth')" name="mingcute:calendar-fill" size="18" />
              <Icon v-else name="mingcute:file-text-fill" size="18" />
            </div>
            <span class="font-black text-base text-base-content">{{ field.label }}</span>
          </div>

          <span 
            :class="[
              'badge badge-sm font-bold text-[10px] px-2.5 py-2',
              field.mode === 'FREELY_EDITABLE' ? 'badge-success text-white' : 
              field.mode === 'LOCKED' ? 'badge-error text-white' : 'badge-warning text-slate-900'
            ]"
          >
            {{ field.mode === 'FREELY_EDITABLE' ? 'Bebas Diedit' : field.mode === 'LOCKED' ? 'Terkunci' : '1x Isi Kosong' }}
          </span>
        </div>

        <div class="space-y-2">
          <!-- Option 1: FREELY_EDITABLE -->
          <label 
            @click="field.mode = 'FREELY_EDITABLE'" 
            class="flex items-center gap-3 text-xs font-bold cursor-pointer p-3 rounded-2xl border transition-all"
            :class="field.mode === 'FREELY_EDITABLE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'bg-base-200/30 border-base-200 text-base-content/60 hover:bg-base-200/60'"
          >
            <input type="radio" :name="`perm-${field.fieldName}`" value="FREELY_EDITABLE" v-model="field.mode" class="radio radio-xs radio-success" />
            <div class="flex flex-col">
              <span class="font-bold">🟢 Bebas Diedit Siswa</span>
              <span class="text-[10px] opacity-60 font-normal">Siswa bebas mengubah data field ini kapan saja</span>
            </div>
          </label>

          <!-- Option 2: LOCKED -->
          <label 
            @click="field.mode = 'LOCKED'" 
            class="flex items-center gap-3 text-xs font-bold cursor-pointer p-3 rounded-2xl border transition-all"
            :class="field.mode === 'LOCKED' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm' : 'bg-base-200/30 border-base-200 text-base-content/60 hover:bg-base-200/60'"
          >
            <input type="radio" :name="`perm-${field.fieldName}`" value="LOCKED" v-model="field.mode" class="radio radio-xs radio-error" />
            <div class="flex flex-col">
              <span class="font-bold">🔴 Tidak Boleh Diedit</span>
              <span class="text-[10px] opacity-60 font-normal">Siswa tidak dapat mengedit field ini sama sekali</span>
            </div>
          </label>

          <!-- Option 3: FILL_ONCE -->
          <label 
            @click="field.mode = 'FILL_ONCE'" 
            class="flex items-center gap-3 text-xs font-bold cursor-pointer p-3 rounded-2xl border transition-all"
            :class="field.mode === 'FILL_ONCE' ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-sm' : 'bg-base-200/30 border-base-200 text-base-content/60 hover:bg-base-200/60'"
          >
            <input type="radio" :name="`perm-${field.fieldName}`" value="FILL_ONCE" v-model="field.mode" class="radio radio-xs radio-warning" />
            <div class="flex flex-col">
              <span class="font-bold">🟡 Sekali Isi Jika Kosong</span>
              <span class="text-[10px] opacity-60 font-normal">Boleh diisi jika kosong. Begitu terisi, langsung terkunci</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
