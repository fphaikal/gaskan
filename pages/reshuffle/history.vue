<script setup>
import { ref, computed, onMounted } from 'vue';

useHead({ title: 'Riwayat Audit Log Reshuffle | GASKAN' });

const { $toast } = useNuxtApp();

const logs = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const filterType = ref('');
const expandedLogId = ref(null);

const page = ref(1);
const perPage = 10;

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await $fetch('/api/system/reshuffle/history').catch(() => null);
    logs.value = res?.data || [];
  } catch (e) {
    $toast.error('Gagal memuat riwayat audit log');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLogs);

const filteredLogs = computed(() => {
  let result = logs.value;
  if (filterType.value) result = result.filter(l => l.actionType === filterType.value);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(l =>
      l.operatorName?.toLowerCase().includes(q) ||
      l.operatorNis?.toLowerCase().includes(q) ||
      l.targetClassName?.toLowerCase().includes(q)
    );
  }
  return result;
});

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * perPage;
  return filteredLogs.value.slice(start, start + perPage);
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / perPage)));

const stats = computed(() => ({
  total: logs.value.length,
  excel: logs.value.filter(l => l.actionType === 'EXCEL').length,
  website: logs.value.filter(l => l.actionType !== 'EXCEL').length,
  totalStudents: logs.value.reduce((sum, l) => sum + (l.successCount || 0), 0),
}));

const toggleDetail = (id) => { expandedLogId.value = expandedLogId.value === id ? null : id; };

const formatDateShort = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<template>
  <div class="space-y-6 pb-10 animate-in fade-in duration-500">

    <!-- Header -->
    <div class="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
      <div class="flex items-center gap-2 text-xs font-bold text-base-content/40 mb-3">
        <NuxtLink to="/kelas" class="hover:text-primary transition-colors">Manajemen Kelas</NuxtLink>
        <span>/</span>
        <NuxtLink to="/reshuffle" class="hover:text-primary transition-colors">Reshuffle Kelas</NuxtLink>
        <span>/</span>
        <span class="text-sky-400">Riwayat Audit Log</span>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Icon name="mingcute:history-line" size="26" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight">Riwayat Audit Log</h1>
            <p class="text-xs text-base-content/60 mt-1">Rekaman lengkap setiap operasi pemindahan kelas beserta data siswa yang dipindahkan.</p>
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button @click="fetchLogs" :disabled="loading" class="btn btn-ghost btn-sm rounded-2xl font-black gap-2 border border-base-300/60">
            <Icon name="mingcute:refresh-4-line" size="16" :class="{ 'animate-spin': loading }" />
            Refresh
          </button>
          <NuxtLink to="/reshuffle" class="btn btn-primary btn-sm rounded-2xl font-black gap-2 shadow-lg shadow-primary/20">
            <Icon name="mingcute:arrow-left-line" size="16" />
            Kembali
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm text-center space-y-1">
        <p class="text-[10px] font-black uppercase tracking-wider text-base-content/50">Total Operasi</p>
        <p class="text-3xl font-black text-base-content">{{ stats.total }}</p>
        <p class="text-[10px] text-base-content/40 font-bold">semua waktu</p>
      </div>
      <div class="bg-base-100 p-5 rounded-3xl border border-primary/20 shadow-sm text-center space-y-1">
        <p class="text-[10px] font-black uppercase tracking-wider text-primary/60">Pilih Langsung</p>
        <p class="text-3xl font-black text-primary">{{ stats.website }}</p>
        <p class="text-[10px] text-base-content/40 font-bold">via website</p>
      </div>
      <div class="bg-base-100 p-5 rounded-3xl border border-amber-500/20 shadow-sm text-center space-y-1">
        <p class="text-[10px] font-black uppercase tracking-wider text-amber-500/60">Import Excel</p>
        <p class="text-3xl font-black text-amber-400">{{ stats.excel }}</p>
        <p class="text-[10px] text-base-content/40 font-bold">via excel</p>
      </div>
      <div class="bg-base-100 p-5 rounded-3xl border border-emerald-500/20 shadow-sm text-center space-y-1">
        <p class="text-[10px] font-black uppercase tracking-wider text-emerald-500/60">Total Siswa</p>
        <p class="text-3xl font-black text-emerald-400">{{ stats.totalStudents }}</p>
        <p class="text-[10px] text-base-content/40 font-bold">dipindahkan</p>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="bg-base-100 p-4 rounded-3xl border border-base-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div class="relative flex-1">
        <Icon name="mingcute:search-line" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size="16" />
        <input v-model="searchQuery" @input="page = 1" type="text" placeholder="Cari operator, NIS, atau kelas tujuan..." class="input input-sm input-bordered w-full pl-9 rounded-2xl text-xs font-semibold" />
      </div>
      <div class="flex gap-2 shrink-0">
        <button @click="filterType = ''; page = 1" :class="['btn btn-sm rounded-2xl font-black text-xs gap-1.5 px-4', filterType === '' ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost border border-base-300/60']">
          <Icon name="mingcute:grid-fill" size="14" /> Semua
        </button>
        <button @click="filterType = 'WEBSITE'; page = 1" :class="['btn btn-sm rounded-2xl font-black text-xs gap-1.5 px-4', filterType === 'WEBSITE' ? 'bg-indigo-500 text-white border-0 shadow-lg' : 'btn-ghost border border-base-300/60']">
          <Icon name="mingcute:cursor-hand-line" size="14" /> Website
        </button>
        <button @click="filterType = 'EXCEL'; page = 1" :class="['btn btn-sm rounded-2xl font-black text-xs gap-1.5 px-4', filterType === 'EXCEL' ? 'bg-amber-500 text-black border-0 shadow-lg' : 'btn-ghost border border-base-300/60']">
          <Icon name="mingcute:file-import-fill" size="14" /> Excel
        </button>
      </div>
    </div>

    <div v-if="!loading" class="flex items-center gap-2 text-xs text-base-content/50 font-bold px-1">
      <Icon name="mingcute:filter-line" size="14" />
      Menampilkan <strong class="text-base-content mx-1">{{ filteredLogs.length }}</strong> dari <strong class="text-base-content mx-1">{{ logs.length }}</strong> log
    </div>

    <!-- Log Cards -->
    <div class="space-y-3">
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm animate-pulse space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex gap-2"><div class="w-24 h-7 bg-base-200 rounded-xl"></div><div class="w-32 h-7 bg-base-200 rounded-xl"></div></div>
            <div class="w-36 h-5 bg-base-200 rounded-xl"></div>
          </div>
          <div class="flex items-center gap-3"><div class="w-8 h-8 bg-base-200 rounded-xl"></div><div class="w-40 h-4 bg-base-200 rounded-xl"></div></div>
        </div>
      </template>

      <div v-else-if="filteredLogs.length === 0" class="bg-base-100 p-16 rounded-3xl border border-base-200 shadow-sm text-center space-y-4">
        <div class="w-20 h-20 rounded-3xl bg-base-200 flex items-center justify-center mx-auto">
          <Icon name="mingcute:inbox-line" size="40" class="text-base-content/30" />
        </div>
        <div>
          <p class="text-base font-black text-base-content/60">Tidak ada riwayat ditemukan</p>
          <p class="text-xs text-base-content/40 mt-1">{{ searchQuery || filterType ? 'Coba ubah filter atau pencarian' : 'Belum ada operasi reshuffle yang dilakukan' }}</p>
        </div>
        <NuxtLink v-if="!searchQuery && !filterType" to="/reshuffle" class="btn btn-primary btn-sm rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 inline-flex">
          <Icon name="mingcute:transfer-4-line" size="16" /> Mulai Reshuffle Pertama
        </NuxtLink>
      </div>

      <template v-else>
        <div v-for="log in paginatedLogs" :key="log.id" class="bg-base-100 rounded-3xl border shadow-sm overflow-hidden transition-all duration-200" :class="expandedLogId === log.id ? 'border-sky-500/30 shadow-sky-500/5' : 'border-base-200 hover:border-base-300'">

          <!-- Top Row -->
          <div class="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span :class="['px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0', log.actionType === 'EXCEL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-primary/10 text-primary border border-primary/20']">
                <Icon :name="log.actionType === 'EXCEL' ? 'mingcute:file-import-fill' : 'mingcute:cursor-hand-line'" size="12" />
                {{ log.actionType === 'EXCEL' ? 'Excel Import' : 'Pilih Langsung' }}
              </span>
              <div class="flex items-center gap-1.5 text-xs font-black">
                <span v-if="log.sourceClassName" class="px-2.5 py-1 rounded-xl bg-base-200/70 text-base-content/60 border border-base-300/50">{{ log.sourceClassName }}</span>
                <Icon v-if="log.sourceClassName" name="mingcute:arrow-right-line" size="14" class="text-base-content/30" />
                <span class="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{{ log.targetClassName }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-base-content/50 font-mono font-bold shrink-0">
              <Icon name="mingcute:time-line" size="14" />
              {{ formatDateShort(log.createdAt) }}
            </div>
          </div>

          <!-- Body Row -->
          <div class="px-5 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div class="space-y-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-[11px] shrink-0 border border-primary/10">{{ log.operatorName?.charAt(0) || 'A' }}</div>
                <div>
                  <p class="font-black text-base-content text-xs">{{ log.operatorName }}</p>
                  <p class="text-[10px] text-base-content/50 font-bold font-mono">{{ log.operatorNis }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-[11px] font-bold pl-[42px]">
                <span class="flex items-center gap-1 text-emerald-400"><Icon name="mingcute:check-circle-fill" size="14" />{{ log.successCount || 0 }} Siswa Berhasil</span>
                <span v-if="log.failCount" class="flex items-center gap-1 text-red-400"><Icon name="mingcute:close-circle-fill" size="14" />{{ log.failCount }} Gagal</span>
              </div>
            </div>
            <button @click="toggleDetail(log.id)" :class="['btn btn-sm rounded-2xl font-black gap-2 text-xs shrink-0', expandedLogId === log.id ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost border border-base-300/60 hover:border-sky-400/40 hover:text-sky-400']">
              <Icon :name="expandedLogId === log.id ? 'mingcute:eye-close-line' : 'mingcute:eye-line'" size="14" />
              {{ expandedLogId === log.id ? 'Sembunyikan' : 'Lihat Rincian Siswa' }}
              <span class="px-1.5 py-0.5 rounded-lg bg-base-200 text-[10px] font-black">{{ log.details?.length || log.successCount || 0 }}</span>
            </button>
          </div>

          <!-- Detail Table -->
          <div v-if="expandedLogId === log.id" class="border-t border-base-200 bg-base-200/20 animate-in fade-in slide-in-from-top-1 duration-200">
            <div class="p-5 space-y-3">
              <p class="text-[10px] font-black uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
                <Icon name="mingcute:list-check-fill" size="14" class="text-sky-400" />
                Rincian {{ log.details?.length || 0 }} Siswa yang Dipindahkan
              </p>
              <div class="overflow-x-auto rounded-2xl border border-base-200 bg-base-100">
                <table class="table table-zebra table-compact w-full text-xs">
                  <thead>
                    <tr class="bg-base-200/80 text-[10px] uppercase font-black text-base-content/50 tracking-wider">
                      <th class="text-center w-10">#</th>
                      <th>Nama Siswa</th>
                      <th>NIS</th>
                      <th>Dari Kelas</th>
                      <th>Ke Kelas</th>
                      <th>Rombel</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in log.details" :key="idx" class="hover:bg-primary/5 transition-colors">
                      <td class="font-bold text-center text-base-content/40 text-[11px]">{{ idx + 1 }}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] shrink-0">{{ item.name?.charAt(0) || '?' }}</div>
                          <span class="font-bold text-base-content">{{ item.name }}</span>
                        </div>
                      </td>
                      <td class="font-mono text-base-content/60 font-semibold text-[11px]">{{ item.nis || '-' }}</td>
                      <td><span class="px-2 py-0.5 rounded-lg bg-base-200/80 border border-base-300/60 text-base-content/60 font-extrabold text-[10px]">{{ item.fromClass || '-' }}</span></td>
                      <td><span class="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">{{ item.toClass }}</span></td>
                      <td><span class="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-[10px]">{{ item.rombel || '-' }}</span></td>
                    </tr>
                    <tr v-if="!log.details?.length">
                      <td colspan="6" class="py-8 text-center text-base-content/40 font-bold text-xs">Tidak ada rincian tersedia</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between bg-base-100 p-4 rounded-3xl border border-base-200 shadow-sm gap-3">
      <p class="text-xs font-bold text-base-content/60">Halaman <strong class="text-base-content">{{ page }}</strong> dari <strong class="text-base-content">{{ totalPages }}</strong> · {{ filteredLogs.length }} total log</p>
      <div class="flex items-center gap-1.5">
        <button @click="page--" :disabled="page <= 1" class="btn btn-ghost btn-sm rounded-xl font-black disabled:opacity-30"><Icon name="mingcute:arrow-left-line" size="16" /></button>
        <template v-for="p in totalPages" :key="p">
          <button v-if="p === 1 || p === totalPages || Math.abs(p - page) <= 1" @click="page = p" :class="['btn btn-sm rounded-xl font-black min-w-[36px]', p === page ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-ghost']">{{ p }}</button>
          <span v-else-if="Math.abs(p - page) === 2" class="text-base-content/30 font-black px-1">...</span>
        </template>
        <button @click="page++" :disabled="page >= totalPages" class="btn btn-ghost btn-sm rounded-xl font-black disabled:opacity-30"><Icon name="mingcute:arrow-right-line" size="16" /></button>
      </div>
    </div>

  </div>
</template>
