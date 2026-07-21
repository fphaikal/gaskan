<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';
import { Calendar } from 'v-calendar';
import 'v-calendar/style.css';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'eventChanged']);

const authStore = useAuthStore();
const { role, userData } = storeToRefs(authStore);

const isDev = computed(() => role.value === 'developer');
const isAdmin = computed(() => role.value === 'admin' || isDev.value);
const isGuru = computed(() => role.value === 'guru');
const canManage = computed(() => isAdmin.value || isGuru.value);

const showModal = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Data state
const events = ref<any[]>([]);
const majors = ref<any[]>([]);
const classes = ref<any[]>([]);
const isLoading = ref(false);

const selectedDate = ref<Date | null>(new Date());
const activeScopeFilter = ref('ALL'); // ALL, GLOBAL, MAJOR, CLASS

// Form state for Create / Edit
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
  type: 'EFEKTIF', // EFEKTIF, FAKULTATIF, LIBUR_NASIONAL, LIBUR_SEKOLAH, UJIAN, KEGIATAN
  scope: 'GLOBAL', // GLOBAL, MAJOR, CLASS
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
  if (!canManage.value) return;
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
  if (showModal.value) {
    fetchEvents();
    fetchMajorsAndClasses();
  }
});

watch(showModal, (newVal) => {
  if (newVal) {
    fetchEvents();
    fetchMajorsAndClasses();
  }
});

// Filter events by scope filter dropdown (Admin view)
const filteredEvents = computed(() => {
  if (activeScopeFilter.value === 'ALL') return events.value;
  return events.value.filter(e => e.scope === activeScopeFilter.value);
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

const watchTypeChange = watch(() => form.value.type, (newType) => {
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
    emit('eventChanged');
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
    emit('eventChanged');
  } catch (err: any) {
    console.error('Failed to delete academic event:', err);
    alert('Gagal menghapus agenda akademik');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <dialog :class="['modal', { 'modal-open': showModal }]">
      <div class="modal-box bg-base-100 border border-base-200/80 p-0 overflow-hidden rounded-[2.5rem] max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        <!-- Header Modal -->
        <div class="px-6 py-4 border-b border-base-200/60 flex items-center justify-between bg-base-100 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-sm">
              <Icon name="mingcute:calendar-month-fill" size="22" />
            </div>
            <div>
              <h3 class="font-black text-base text-base-content leading-none">Kalender Akademik</h3>
              <p class="text-[9px] font-bold text-base-content/40 uppercase tracking-widest mt-1">SMTI Yogyakarta · Agenda & Ujian</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button v-if="canManage"
                    @click="openCreateModal"
                    class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black gap-1 shadow-sm">
              <Icon name="mingcute:add-fill" size="14" />
              + Agenda
            </button>
            <button @click="showModal = false" class="btn btn-ghost btn-xs btn-circle rounded-xl">
              <Icon name="mingcute:close-line" size="18" />
            </button>
          </div>
        </div>

        <!-- Filter Bar for Admin / Guru -->
        <div v-if="canManage" class="px-6 py-2 bg-base-200/40 border-b border-base-200/40 flex items-center justify-between gap-2 text-xs shrink-0">
          <span class="text-[10px] font-black uppercase text-base-content/40 tracking-wider">Filter Target:</span>
          <div class="flex items-center gap-1">
            <button v-for="sc in [
              { key: 'ALL', label: 'Semua' },
              { key: 'GLOBAL', label: 'Global' },
              { key: 'MAJOR', label: 'Jurusan' },
              { key: 'CLASS', label: 'Kelas' }
            ]" :key="sc.key"
                    @click="activeScopeFilter = sc.key"
                    :class="['px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all', activeScopeFilter === sc.key ? 'bg-orange-500 text-white shadow-sm' : 'text-base-content/50 hover:text-base-content']">
              {{ sc.label }}
            </button>
          </div>
        </div>

        <!-- Body Grid: Left Calendar, Right Day Details -->
        <div class="p-5 flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
          
          <!-- Calendar Widget -->
          <div class="md:col-span-7 flex flex-col items-center justify-start bg-base-200/20 p-3 rounded-2xl border border-base-200/40">
            <Calendar 
              expanded 
              borderless
              transparent
              locale="id"
              title-position="left"
              class="!bg-transparent w-full"
              :attributes="calendarAttributes"
              @dayclick="onDayClick"
            />

            <!-- Color Legend -->
            <div class="w-full grid grid-cols-2 gap-1.5 pt-3 border-t border-base-200/40 mt-2 text-[9px] font-bold">
              <div v-for="t in typeOptions" :key="t.value" class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: t.color }"></span>
                <span class="text-base-content/60 truncate">{{ t.label.split('(')[0] }}</span>
              </div>
            </div>
          </div>

          <!-- Day Agenda Detail Column -->
          <div class="md:col-span-5 flex flex-col min-h-0">
            <div class="mb-3 shrink-0 flex items-center justify-between">
              <h4 class="text-xs font-black text-base-content">
                Agenda {{ selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : 'Hari Ini' }}
              </h4>
              <span class="badge badge-xs bg-orange-500/10 text-orange-500 font-black border-0">
                {{ selectedDateEvents.length }} agenda
              </span>
            </div>

            <!-- List of events on this day -->
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-[180px]">
              <div v-for="ev in selectedDateEvents" :key="ev.id"
                   class="p-3 rounded-2xl bg-base-200/40 border border-base-200/60 hover:border-orange-500/30 transition-all flex flex-col gap-1.5 relative group">
                
                <div class="flex items-start justify-between gap-2">
                  <span :class="['px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border', getTypeConfig(ev.type).badgeClass]">
                    {{ getTypeConfig(ev.type).label.split('(')[0] }}
                  </span>
                  
                  <div v-if="canManage" class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button @click="openEditModal(ev)" class="btn btn-ghost btn-xs btn-square text-amber-500 h-6 w-6 min-h-0">
                      <Icon name="mingcute:edit-2-line" size="12" />
                    </button>
                    <button @click="handleDelete(ev.id)" class="btn btn-ghost btn-xs btn-square text-rose-500 h-6 w-6 min-h-0">
                      <Icon name="mingcute:delete-2-line" size="12" />
                    </button>
                  </div>
                </div>

                <p class="text-xs font-black text-base-content leading-tight">{{ ev.title }}</p>

                <!-- Time & Target Scope -->
                <div class="flex flex-wrap items-center gap-2 text-[9px] font-bold text-base-content/50 mt-0.5">
                  <div v-if="ev.startTime" class="flex items-center gap-1 text-orange-500">
                    <Icon name="mingcute:time-fill" size="11" />
                    <span>{{ ev.startTime }} {{ ev.endTime ? `- ${ev.endTime}` : '' }} WIB</span>
                  </div>

                  <span v-if="ev.scope === 'GLOBAL'" class="text-emerald-500">🌐 Global</span>
                  <span v-else-if="ev.scope === 'MAJOR'" class="text-sky-500">🎓 {{ ev.major?.alias || 'Jurusan' }}</span>
                  <span v-else-if="ev.scope === 'CLASS'" class="text-violet-500">🏫 {{ ev.class?.className || 'Kelas' }}</span>
                </div>

                <p v-if="ev.description" class="text-[10px] text-base-content/60 font-medium leading-relaxed mt-1 bg-base-100/60 p-2 rounded-xl border border-base-200/40">
                  {{ ev.description }}
                </p>
              </div>

              <div v-if="!selectedDateEvents.length" class="flex flex-col items-center justify-center py-12 opacity-30">
                <Icon name="mingcute:calendar-line" size="36" />
                <p class="text-[10px] font-black uppercase tracking-widest mt-2">Tidak ada agenda di tanggal ini</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <form method="dialog" class="modal-backdrop bg-black/60 backdrop-blur-sm" @click="showModal = false">
        <button>close</button>
      </form>
    </dialog>
  </Teleport>

  <!-- Create / Edit Form Modal -->
  <Teleport to="body">
    <dialog :class="['modal z-[999]', { 'modal-open': showFormModal }]">
      <div class="modal-box bg-base-100 border border-base-200 p-6 rounded-3xl max-w-md shadow-2xl relative">
        <h3 class="font-black text-base text-base-content mb-4 flex items-center gap-2">
          <Icon name="mingcute:edit-3-fill" class="text-orange-500" size="18" />
          {{ isEditing ? 'Edit Agenda Akademik' : 'Tambah Agenda Akademik Baru' }}
        </h3>

        <form @submit.prevent="handleSave" class="space-y-3">
          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Judul Agenda</label>
            <input v-model="form.title" type="text" placeholder="Misal: Ujian Akhir Semester / Pensi" required class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Tipe Agenda</label>
              <select v-model="form.type" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
                <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Cakupan (Scope)</label>
              <select v-model="form.scope" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
                <option v-for="s in scopeOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
          </div>

          <!-- Target Major / Class Select -->
          <div v-if="form.scope === 'MAJOR'">
            <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Pilih Jurusan</label>
            <select v-model="form.majorId" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
              <option value="">-- Pilih Jurusan --</option>
              <option v-for="m in majors" :key="m.id" :value="m.id">{{ m.name }} ({{ m.alias }})</option>
            </select>
          </div>

          <div v-if="form.scope === 'CLASS'">
            <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Pilih Kelas</label>
            <select v-model="form.classId" class="select select-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold">
              <option value="">-- Pilih Kelas --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.className }}</option>
            </select>
          </div>

          <!-- Date & Time range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Tanggal Mulai</label>
              <input v-model="form.startDate" type="date" required class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
            </div>
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Tanggal Selesai</label>
              <input v-model="form.endDate" type="date" class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Jam Mulai (Opt)</label>
              <input v-model="form.startTime" type="time" class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
            </div>
            <div>
              <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Jam Selesai (Opt)</label>
              <input v-model="form.endTime" type="time" class="input input-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-bold" />
            </div>
          </div>

          <div>
            <label class="text-[10px] font-black uppercase tracking-widest text-base-content/40 block mb-1">Deskripsi / Catatan</label>
            <textarea v-model="form.description" rows="2" placeholder="Catatan tambahan..." class="textarea textarea-sm w-full rounded-xl bg-base-200/40 border-base-200 text-xs font-medium"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-base-200/40">
            <button type="button" @click="showFormModal = false" class="btn btn-xs rounded-xl font-bold">Batal</button>
            <button type="submit" :disabled="isLoading" class="btn btn-xs bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-xl font-black">
              {{ isLoading ? 'Menyimpan...' : 'Simpan Agenda' }}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </Teleport>
</template>
