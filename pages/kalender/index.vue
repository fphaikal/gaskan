<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';
import { Calendar } from 'v-calendar';
import 'v-calendar/style.css';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

import { useThemeStore } from '~/store/useThemeStore';

useSeoMeta({
  title: 'Kalender Akademik & Jadwal Ujian | GASKAN',
  description: 'Pengaturan hari efektif, fakultatif, libur nasional, dan jadwal ujian jam pelajaran SMTI Yogyakarta',
});

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const authStore = useAuthStore();
const { role, userData } = storeToRefs(authStore);

const isDev = computed(() => role.value === 'developer');
const isAdmin = computed(() => role.value === 'admin' || isDev.value);
const isGuru = computed(() => role.value === 'guru');
const canManage = computed(() => isAdmin.value || isGuru.value);

// View Mode: 'calendar' | 'table'
const viewMode = ref<'calendar' | 'table'>('calendar');

// Data State
const events = ref<any[]>([]);
const majors = ref<any[]>([]);
const classes = ref<any[]>([]);
const isLoading = ref(false);

const searchQuery = ref('');
const activeScopeFilter = ref('ALL'); // ALL, GLOBAL, MAJOR, CLASS
const selectedMajorFilter = ref('');
const selectedClassFilter = ref('');
const selectedDate = ref<Date | null>(new Date());

// Modal Form State
const showFormModal = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

const form = ref({
  title: '',
  description: '',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: '',
  startTime: '08:00',
  endTime: '10:00',
  type: 'EFEKTIF',
  scope: 'GLOBAL',
  majorId: '',
  classId: '',
  color: '#10B981'
});

const typeOptions = [
  { value: 'EFEKTIF', label: 'Hari Efektif (Wajib)', color: '#10B981', badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
  { value: 'FAKULTATIF', label: 'Hari Fakultatif (Opsional)', color: '#38BDF8', badgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  { value: 'LIBUR_NASIONAL', label: 'Libur Nasional (Tanggal Merah)', color: '#EF4444', badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-500' },
  { value: 'LIBUR_SEKOLAH', label: 'Libur Sekolah / Semester', color: '#F43F5E', badgeClass: 'bg-pink-500/10 border-pink-500/30 text-pink-500' },
  { value: 'UJIAN', label: 'Jadwal Ujian (Jam Pelajaran)', color: '#F59E0B', badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-500' },
  { value: 'KEGIATAN', label: 'Kegiatan / Upacara / Pensi', color: '#8B5CF6', badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-400' }
];

const getTypeConfig = (type: string) => {
  return typeOptions.find(t => t.value === type) || typeOptions[0];
};

const scopeOptions = [
  { value: 'GLOBAL', label: 'Semua (Global Sekolah)' },
  { value: 'MAJOR', label: 'Khusus Jurusan' },
  { value: 'CLASS', label: 'Khusus Kelas' }
];

const fetchEvents = async () => {
  try {
    isLoading.value = true;
    const res = await $fetch<any>('/api/academic-events');
    events.value = Array.isArray(res?.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching academic events:', err);
  } finally {
    isLoading.value = false;
  }
};

const fetchMajorsAndClasses = async () => {
  try {
    const [majorsRes, classesRes] = await Promise.allSettled([
      $fetch<any>('/api/dev/majors'),
      $fetch<any>('/api/classes')
    ]);
    if (majorsRes.status === 'fulfilled') majors.value = majorsRes.value?.data || [];
    if (classesRes.status === 'fulfilled') classes.value = classesRes.value?.data || [];
  } catch (err) {
    console.error('Error fetching majors and classes:', err);
  }
};

onMounted(() => {
  fetchEvents();
  fetchMajorsAndClasses();
});

// Filtering logic
const filteredEvents = computed(() => {
  let list = events.value;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(e =>
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  }

  if (activeScopeFilter.value !== 'ALL') {
    list = list.filter(e => e.scope === activeScopeFilter.value);
  }

  if (selectedMajorFilter.value) {
    list = list.filter(e => e.majorId === selectedMajorFilter.value || e.scope === 'GLOBAL');
  }

  if (selectedClassFilter.value) {
    list = list.filter(e => e.classId === selectedClassFilter.value || e.scope === 'GLOBAL');
  }

  return list;
});

// Stat Counters
const stats = computed(() => {
  const all = filteredEvents.value;
  return {
    total: all.length,
    efektif: all.filter(e => e.type === 'EFEKTIF').length,
    fakultatif: all.filter(e => e.type === 'FAKULTATIF').length,
    libur: all.filter(e => e.type === 'LIBUR_NASIONAL' || e.type === 'LIBUR_SEKOLAH').length,
    ujian: all.filter(e => e.type === 'UJIAN').length
  };
});

// v-calendar dot attributes
const calendarAttributes = computed(() => {
  return filteredEvents.value.map(event => {
    const start = new Date(event.startDate);
    const end = event.endDate ? new Date(event.endDate) : start;
    const typeConf = getTypeConfig(event.type);

    return {
      key: event.id,
      dot: {
        style: { backgroundColor: event.color || typeConf.color },
      },
      dates: { start, end },
      popover: {
        label: `${event.title} (${typeConf.label})`,
        visibility: 'hover',
      },
      customData: event
    };
  });
});

// Events on selected date
const selectedDateEvents = computed(() => {
  if (!selectedDate.value) return [];
  const targetStr = format(selectedDate.value, 'yyyy-MM-dd');

  return filteredEvents.value.filter(event => {
    const startStr = format(new Date(event.startDate), 'yyyy-MM-dd');
    const endStr = event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : startStr;
    return targetStr >= startStr && targetStr <= endStr;
  });
});

const onDayClick = (day: any) => {
  if (day.date) {
    selectedDate.value = new Date(day.date);
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  editingId.value = null;
  const initialDate = selectedDate.value ? format(selectedDate.value, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  form.value = {
    title: '',
    description: '',
    startDate: initialDate,
    endDate: initialDate,
    startTime: '08:00',
    endTime: '10:00',
    type: 'EFEKTIF',
    scope: 'GLOBAL',
    majorId: '',
    classId: '',
    color: '#10B981'
  };
  showFormModal.value = true;
};

const openEditModal = (ev: any) => {
  isEditing.value = true;
  editingId.value = ev.id;
  form.value = {
    title: ev.title || '',
    description: ev.description || '',
    startDate: ev.startDate ? format(new Date(ev.startDate), 'yyyy-MM-dd') : '',
    endDate: ev.endDate ? format(new Date(ev.endDate), 'yyyy-MM-dd') : '',
    startTime: ev.startTime || '08:00',
    endTime: ev.endTime || '10:00',
    type: ev.type || 'EFEKTIF',
    scope: ev.scope || 'GLOBAL',
    majorId: ev.majorId || '',
    classId: ev.classId || '',
    color: ev.color || getTypeConfig(ev.type || 'EFEKTIF').color
  };
  showFormModal.value = true;
};

watch(() => form.value.type, (newType) => {
  form.value.color = getTypeConfig(newType).color;
});

const handleSave = async () => {
  if (!form.value.title || !form.value.startDate) return;

  try {
    isLoading.value = true;
    const payload = { ...form.value };

    if (isEditing.value && editingId.value) {
      await $fetch(`/api/academic-events/${editingId.value}`, {
        method: 'PUT',
        body: payload
      });
    } else {
      await $fetch('/api/academic-events', {
        method: 'POST',
        body: payload
      });
    }

    showFormModal.value = false;
    await fetchEvents();
  } catch (err: any) {
    console.error('Failed to save academic event:', err);
    alert(err?.data?.message || 'Gagal menyimpan agenda akademik');
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus agenda akademik ini?')) return;
  try {
    isLoading.value = true;
    await $fetch(`/api/academic-events/${id}`, {
      method: 'DELETE'
    });
    await fetchEvents();
  } catch (err: any) {
    console.error('Failed to delete academic event:', err);
    alert('Gagal menghapus agenda akademik');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6 pb-12">
    
    <!-- PAGE HERO BANNER -->
    <div class="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="relative z-10 max-w-xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white/90 mb-3 border border-white/20">
          <Icon name="mingcute:calendar-month-fill" size="14" />
          Kalender Akademik SMTI Yogyakarta
        </div>
        <h1 class="text-2xl sm:text-3xl font-black leading-tight">Pengaturan Agenda & Jadwal Ujian</h1>
        <p class="text-xs sm:text-sm font-semibold text-white/80 mt-2 leading-relaxed">
          Kelola hari efektif, hari fakultatif, libur sekolah, dan slot jam ujian pelajaran per kelas/jurusan dengan terpusat.
        </p>
      </div>

      <!-- Quick Action & Counters -->
      <div class="relative z-10 flex flex-wrap items-center gap-3">
        <button v-if="canManage"
                @click="openCreateModal"
                class="btn bg-white hover:bg-white/90 text-orange-600 border-0 rounded-2xl font-black text-xs shadow-lg gap-2">
          <Icon name="mingcute:add-fill" size="16" />
          + Tambah Agenda Baru
        </button>
      </div>

      <div class="absolute -right-8 -bottom-12 opacity-10 pointer-events-none">
        <Icon name="mingcute:calendar-month-fill" size="260" />
      </div>
    </div>

    <!-- STATS ROW -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
      <div class="bg-base-100 rounded-3xl p-4 border border-base-200/80 shadow-sm flex flex-col justify-between">
        <span class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Total Agenda</span>
        <div class="flex items-baseline justify-between mt-2">
          <span class="text-2xl font-black text-base-content">{{ stats.total }}</span>
          <Icon name="mingcute:calendar-line" size="20" class="text-base-content/20" />
        </div>
      </div>

      <div class="bg-base-100 rounded-3xl p-4 border border-base-200/80 shadow-sm flex flex-col justify-between">
        <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Hari Efektif</span>
        <div class="flex items-baseline justify-between mt-2">
          <span class="text-2xl font-black text-emerald-500">{{ stats.efektif }}</span>
          <Icon name="mingcute:check-circle-fill" size="20" class="text-emerald-500/30" />
        </div>
      </div>

      <div class="bg-base-100 rounded-3xl p-4 border border-base-200/80 shadow-sm flex flex-col justify-between">
        <span class="text-[10px] font-black text-sky-400 uppercase tracking-widest">Fakultatif</span>
        <div class="flex items-baseline justify-between mt-2">
          <span class="text-2xl font-black text-sky-400">{{ stats.fakultatif }}</span>
          <Icon name="mingcute:star-fill" size="20" class="text-sky-400/30" />
        </div>
      </div>

      <div class="bg-base-100 rounded-3xl p-4 border border-base-200/80 shadow-sm flex flex-col justify-between">
        <span class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Libur Resmi</span>
        <div class="flex items-baseline justify-between mt-2">
          <span class="text-2xl font-black text-rose-500">{{ stats.libur }}</span>
          <Icon name="mingcute:close-circle-fill" size="20" class="text-rose-500/30" />
        </div>
      </div>

      <div class="bg-base-100 rounded-3xl p-4 border border-base-200/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
        <span class="text-[10px] font-black text-amber-500 uppercase tracking-widest">Jadwal Ujian</span>
        <div class="flex items-baseline justify-between mt-2">
          <span class="text-2xl font-black text-amber-500">{{ stats.ujian }}</span>
          <Icon name="mingcute:time-fill" size="20" class="text-amber-500/30" />
        </div>
      </div>
    </div>

    <!-- WORKSPACE CONTROLS & TOOLBAR -->
    <div class="bg-base-100 rounded-3xl p-4 border border-base-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
      
      <!-- Left: Search & View Switcher -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search bar -->
        <div class="relative min-w-[200px] max-w-xs">
          <Icon name="mingcute:search-line" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input v-model="searchQuery"
                 type="text"
                 placeholder="Cari agenda / catatan..."
                 class="input input-sm w-full pl-8 rounded-xl bg-base-200/40 border-base-200 text-xs font-medium" />
        </div>

        <!-- View Mode Switcher -->
        <div class="flex items-center gap-1 bg-base-200/50 p-1 rounded-2xl border border-base-200">
          <button @click="viewMode = 'calendar'"
                  :class="['px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5', viewMode === 'calendar' ? 'bg-orange-500 text-white shadow-sm' : 'text-base-content/60 hover:text-base-content']">
            <Icon name="mingcute:calendar-month-fill" size="14" />
            Tampilan Kalender
          </button>
          <button @click="viewMode = 'table'"
                  :class="['px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5', viewMode === 'table' ? 'bg-orange-500 text-white shadow-sm' : 'text-base-content/60 hover:text-base-content']">
            <Icon name="mingcute:list-check-fill" size="14" />
            Daftar Tabel
          </button>
        </div>
      </div>

      <!-- Right: Target Scope Pills & Class Dropdown -->
      <div class="flex flex-wrap items-center gap-2">
        <select v-if="canManage" v-model="selectedMajorFilter" class="select select-sm rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
          <option value="">Semua Jurusan</option>
          <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.alias }} ({{ m.name }})</option>
        </select>

        <select v-if="canManage" v-model="selectedClassFilter" class="select select-sm rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
          <option value="">Semua Kelas</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
        </select>

        <div class="flex items-center gap-1 bg-base-200/50 p-1 rounded-2xl border border-base-200">
          <button v-for="sc in [
            { key: 'ALL', label: 'Semua Target' },
            { key: 'GLOBAL', label: 'Global' },
            { key: 'MAJOR', label: 'Jurusan' },
            { key: 'CLASS', label: 'Kelas' }
          ]" :key="sc.key"
                  @click="activeScopeFilter = sc.key"
                  :class="['px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all', activeScopeFilter === sc.key ? 'bg-orange-500 text-white shadow-sm' : 'text-base-content/50 hover:text-base-content']">
            {{ sc.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT AREA -->
    <template v-if="viewMode === 'calendar'">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Big Calendar Grid -->
        <div class="lg:col-span-8 bg-base-100 rounded-3xl p-6 border border-base-200/80 shadow-sm flex flex-col justify-between">
          <Calendar 
            expanded 
            borderless
            transparent
            :is-dark="isDark"
            locale="id"
            title-position="left"
            class="!bg-transparent w-full"
            :attributes="calendarAttributes"
            @dayclick="onDayClick"
          />

          <!-- Legend Bar -->
          <div class="pt-4 border-t border-base-200/60 mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <span class="text-[10px] uppercase font-black text-base-content/40 tracking-wider">Keterangan Warna Tipe Hari:</span>
            <div class="flex flex-wrap items-center gap-3">
              <div v-for="t in typeOptions" :key="t.value" class="flex items-center gap-1.5 text-[10px]">
                <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: t.color }"></span>
                <span class="text-base-content/70 font-semibold">{{ t.label.split('(')[0] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Date Detail Panel -->
        <div class="lg:col-span-4 bg-base-100 rounded-3xl p-6 border border-base-200/80 shadow-sm flex flex-col min-h-[450px]">
          <div class="flex items-center justify-between pb-4 border-b border-base-200/60 mb-4 shrink-0">
            <div>
              <p class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Detail Agenda Tanggal</p>
              <h3 class="text-base font-black text-base-content mt-0.5">
                {{ selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id }) : 'Hari Ini' }}
              </h3>
            </div>
            <span class="badge bg-orange-500/10 text-orange-500 font-black border-0 px-3 py-2 text-xs">
              {{ selectedDateEvents.length }} agenda
            </span>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            <div v-for="ev in selectedDateEvents" :key="ev.id"
                 class="p-4 rounded-2xl bg-base-200/30 border border-base-200/60 hover:border-orange-500/30 transition-all flex flex-col gap-2 relative group">
              
              <div class="flex items-start justify-between gap-2">
                <span :class="['px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border', getTypeConfig(ev.type).badgeClass]">
                  {{ getTypeConfig(ev.type).label.split('(')[0] }}
                </span>
                
                <div v-if="canManage" class="flex items-center gap-1">
                  <button @click="openEditModal(ev)" class="btn btn-ghost btn-xs btn-square text-amber-500">
                    <Icon name="mingcute:edit-2-line" size="14" />
                  </button>
                  <button @click="handleDelete(ev.id)" class="btn btn-ghost btn-xs btn-square text-rose-500">
                    <Icon name="mingcute:delete-2-line" size="14" />
                  </button>
                </div>
              </div>

              <h4 class="text-sm font-black text-base-content leading-snug">{{ ev.title }}</h4>

              <div class="flex flex-wrap items-center gap-2 text-[10px] font-bold text-base-content/60">
                <div v-if="ev.startTime" class="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                  <Icon name="mingcute:time-fill" size="12" />
                  <span>{{ ev.startTime }} {{ ev.endTime ? `- ${ev.endTime}` : '' }} WIB</span>
                </div>

                <span v-if="ev.scope === 'GLOBAL'" class="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">🌐 Global Sekolah</span>
                <span v-else-if="ev.scope === 'MAJOR'" class="text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-md">🎓 {{ ev.major?.alias || 'Jurusan' }}</span>
                <span v-else-if="ev.scope === 'CLASS'" class="text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-md">🏫 {{ ev.class?.className || 'Kelas' }}</span>
              </div>

              <p v-if="ev.description" class="text-xs text-base-content/70 font-medium leading-relaxed mt-1 bg-base-100 p-3 rounded-xl border border-base-200/40">
                {{ ev.description }}
              </p>
            </div>

            <div v-if="!selectedDateEvents.length" class="flex flex-col items-center justify-center py-20 opacity-30">
              <Icon name="mingcute:calendar-line" size="48" />
              <p class="text-xs font-black uppercase tracking-widest mt-3">Tidak ada agenda di tanggal ini</p>
            </div>
          </div>
        </div>

      </div>
    </template>

    <!-- DATATABLE VIEW -->
    <template v-else-if="viewMode === 'table'">
      <div class="bg-base-100 rounded-3xl border border-base-200/80 shadow-sm overflow-hidden flex flex-col">
        <div class="overflow-x-auto w-full">
          <table class="table w-full text-xs">
            <thead>
              <tr class="bg-base-200/40 text-[10px] font-black uppercase tracking-wider text-base-content/40 border-b border-base-200/60">
                <th class="py-3 px-6">Agenda & Catatan</th>
                <th class="py-3 px-4">Tipe & Impact Absensi</th>
                <th class="py-3 px-4">Cakupan Target</th>
                <th class="py-3 px-4">Tanggal & Jam</th>
                <th v-if="canManage" class="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-200/40">
              <tr v-for="ev in filteredEvents" :key="ev.id" class="hover:bg-base-200/20 transition-colors">
                
                <!-- Agenda Title & Description -->
                <td class="py-3.5 px-6">
                  <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: ev.color || getTypeConfig(ev.type).color }"></span>
                    <div>
                      <p class="font-black text-sm text-base-content leading-tight">{{ ev.title }}</p>
                      <p v-if="ev.description" class="text-[11px] text-base-content/50 font-medium truncate max-w-md mt-0.5">{{ ev.description }}</p>
                    </div>
                  </div>
                </td>

                <!-- Type Badge -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span :class="['px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border', getTypeConfig(ev.type).badgeClass]">
                    {{ getTypeConfig(ev.type).label }}
                  </span>
                </td>

                <!-- Target Scope -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span v-if="ev.scope === 'GLOBAL'" class="badge badge-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold">Global Sekolah</span>
                  <span v-else-if="ev.scope === 'MAJOR'" class="badge badge-sm bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold">Jurusan: {{ ev.major?.alias || '—' }}</span>
                  <span v-else-if="ev.scope === 'CLASS'" class="badge badge-sm bg-violet-500/10 border-violet-500/30 text-violet-400 font-bold">Kelas: {{ ev.class?.className || '—' }}</span>
                </td>

                <!-- Dates & Times -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <p class="font-bold text-xs text-base-content">
                    {{ format(new Date(ev.startDate), 'd MMM yyyy', { locale: id }) }}
                    <span v-if="ev.endDate"> - {{ format(new Date(ev.endDate), 'd MMM yyyy', { locale: id }) }}</span>
                  </p>
                  <p v-if="ev.startTime" class="text-[10px] font-bold text-orange-500 mt-0.5">
                    {{ ev.startTime }} {{ ev.endTime ? `- ${ev.endTime}` : '' }} WIB
                  </p>
                </td>

                <!-- Actions -->
                <td v-if="canManage" class="py-3.5 px-6 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1">
                    <button @click="openEditModal(ev)" class="btn btn-ghost btn-xs btn-square text-amber-500">
                      <Icon name="mingcute:edit-2-line" size="16" />
                    </button>
                    <button @click="handleDelete(ev.id)" class="btn btn-ghost btn-xs btn-square text-rose-500">
                      <Icon name="mingcute:delete-2-line" size="16" />
                    </button>
                  </div>
                </td>

              </tr>

              <tr v-if="!filteredEvents.length">
                <td :colspan="canManage ? 5 : 4" class="text-center py-16 opacity-30">
                  <Icon name="mingcute:calendar-line" size="48" />
                  <p class="text-xs font-black uppercase tracking-widest mt-2">Tidak ada data agenda akademik</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- CREATE / EDIT MODAL FORM -->
    <Teleport to="body">
      <dialog :class="['modal z-[999]', { 'modal-open': showFormModal }]">
        <div class="modal-box bg-base-100 border border-base-200 p-6 rounded-3xl max-w-lg shadow-2xl relative">
          <h3 class="font-black text-lg text-base-content mb-4 flex items-center gap-2">
            <Icon name="mingcute:edit-3-fill" class="text-orange-500" size="20" />
            {{ isEditing ? 'Edit Agenda Akademik' : 'Tambah Agenda Akademik Baru' }}
          </h3>

          <form @submit.prevent="handleSave" class="space-y-4">
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Judul Agenda</label>
              <input v-model="form.title" type="text" placeholder="Misal: Ujian Akhir Semester Teori / Hari Fakultatif Pensi" required class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Tipe Agenda</label>
                <select v-model="form.type" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
                  <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Cakupan (Scope)</label>
                <select v-model="form.scope" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
                  <option v-for="s in scopeOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
            </div>

            <!-- Target Major / Class Select -->
            <div v-if="form.scope === 'MAJOR'">
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Pilih Jurusan</label>
              <select v-model="form.majorId" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
                <option value="">-- Pilih Jurusan --</option>
                <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.name }} ({{ m.alias }})</option>
              </select>
            </div>

            <div v-if="form.scope === 'CLASS'">
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Pilih Kelas</label>
              <select v-model="form.classId" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
                <option value="">-- Pilih Kelas --</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
              </select>
            </div>

            <!-- Date & Time Range -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Tanggal Mulai</label>
                <input v-model="form.startDate" type="date" required class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
              </div>
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Tanggal Selesai</label>
                <input v-model="form.endDate" type="date" class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Jam Mulai (Opt)</label>
                <input v-model="form.startTime" type="time" class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
              </div>
              <div>
                <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Jam Selesai (Opt)</label>
                <input v-model="form.endTime" type="time" class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
              </div>
            </div>

            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/50 block mb-1">Deskripsi / Catatan Agenda</label>
              <textarea v-model="form.description" rows="3" placeholder="Catatan tambahan untuk siswa/guru..." class="textarea textarea-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-medium"></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-base-200/60">
              <button type="button" @click="showFormModal = false" class="btn btn-xs rounded-xl font-bold">Batal</button>
              <button type="submit" :disabled="isLoading" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black">
                {{ isLoading ? 'Menyimpan...' : 'Simpan Agenda' }}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </Teleport>

  </div>
</template>

<style scoped>
:deep(.vc-container) {
  font-family: inherit;
  border: none !important;
  background-color: transparent !important;
}

:deep(.vc-title),
:deep(.vc-weekday),
:deep(.vc-header .vc-title),
:deep(.vc-nav-title),
:deep(.vc-nav-item),
:deep(.vc-arrow) {
  color: var(--fallback-bc, oklch(var(--bc))) !important;
  font-weight: 800 !important;
}

:deep(.vc-day-content) {
  color: var(--fallback-bc, oklch(var(--bc))) !important;
  font-weight: 700 !important;
}

:deep(.vc-day-content:hover) {
  background-color: rgba(249, 115, 22, 0.25) !important;
  color: #f97316 !important;
}

:deep(.vc-day-content.is-disabled) {
  opacity: 0.25 !important;
}

:deep(.vc-popover-content) {
  background-color: var(--fallback-b1, oklch(var(--b1))) !important;
  color: var(--fallback-bc, oklch(var(--bc))) !important;
  border: 1px solid var(--fallback-b3, oklch(var(--b3))) !important;
  border-radius: 1rem !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}
</style>
