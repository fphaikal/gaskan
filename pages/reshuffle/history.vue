<script setup>
import { ref, computed, watch, onMounted } from 'vue';

useHead({ title: 'Riwayat Audit Log Reshuffle | GASKAN' });

const { $toast } = useNuxtApp();

// ─── Data ────────────────────────────────────────────────────────────────────
const logs        = ref([]);
const loading     = ref(true);
const expandedLogId = ref(null);

// ─── Filters & Pagination (server-side) ──────────────────────────────────────
const searchQuery = ref('');
const filterType  = ref('');
const page        = ref(1);
const limit       = 20;

// Server pagination meta
const pagination  = ref({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });

// Stats (from server totals — updated on first load / type-filter only)
const stats = ref({ total: 0, excel: 0, website: 0, totalStudents: 0 });

// ─── Debounce helper ─────────────────────────────────────────────────────────
let debounceTimer = null;
const debounce = (fn, ms = 350) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fn, ms);
};

// ─── Fetch ───────────────────────────────────────────────────────────────────
const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page:  String(page.value),
      limit: String(limit),
    });
    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim());
    if (filterType.value)         params.set('type',   filterType.value);

    const res = await $fetch(`/api/system/reshuffle/history?${params.toString()}`).catch(() => null);

    logs.value       = res?.data || [];
    pagination.value = res?.pagination || { total: 0, totalPages: 1, hasNext: false, hasPrev: false };

    // Recompute overview stats when not filtering
    if (!searchQuery.value && !filterType.value) {
      stats.value.total         = res?.pagination?.total ?? logs.value.length;
      stats.value.totalStudents = logs.value.reduce((s, l) => s + (l.successCount || 0), 0);
      // We need overall breakdown — fetch a quick count-only pass if first load
      // For now derive from current page as best-effort; update on type filter
    }
    if (filterType.value === 'EXCEL')   stats.value.excel   = res?.pagination?.total ?? 0;
    if (filterType.value === 'WEBSITE') stats.value.website = res?.pagination?.total ?? 0;

  } catch (e) {
    $toast.error('Gagal memuat riwayat audit log');
  } finally {
    loading.value = false;
  }
};

// Fetch stats overview (total, excel count, website count, total students)
const fetchStats = async () => {
  try {
    // Fetch totals per type without affecting the main list
    const [allRes, excelRes, webRes] = await Promise.all([
      $fetch(`/api/system/reshuffle/history?page=1&limit=1`).catch(() => null),
      $fetch(`/api/system/reshuffle/history?page=1&limit=1&type=EXCEL`).catch(() => null),
      $fetch(`/api/system/reshuffle/history?page=1&limit=1&type=WEBSITE`).catch(() => null),
    ]);
    stats.value = {
      total:         allRes?.pagination?.total   ?? 0,
      excel:         excelRes?.pagination?.total ?? 0,
      website:       webRes?.pagination?.total   ?? 0,
      totalStudents: stats.value.totalStudents,   // keep from main fetch
    };
  } catch (_) {}
};

onMounted(async () => {
  await fetchLogs();
  fetchStats(); // async, don't await — stats load in background
});

// ─── Watchers ─────────────────────────────────────────────────────────────────
// Debounce search — reset to page 1 on change
watch(searchQuery, () => {
  page.value = 1;
  debounce(fetchLogs);
});

// Instant filter change
watch(filterType, () => {
  page.value = 1;
  fetchLogs();
});

// ─── Pagination helpers ───────────────────────────────────────────────────────
const goToPage = (p) => {
  if (p < 1 || p > pagination.value.totalPages) return;
  page.value = p;
  fetchLogs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Generate page numbers with ellipsis
const pageNumbers = computed(() => {
  const total = pagination.value.totalPages;
  const cur   = page.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
});

// ─── UI helpers ───────────────────────────────────────────────────────────────
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
      Menampilkan <strong class="text-base-content mx-1">{{ logs.length }}</strong> dari total <strong class="text-base-content mx-1">{{ pagination.total }}</strong> log
      <span v-if="pagination.totalPages > 1" class="text-base-content/30">· Halaman {{ page }}/{{ pagination.totalPages }}</span>
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

      <div v-else-if="logs.length === 0" class="bg-base-100 p-16 rounded-3xl border border-base-200 shadow-sm text-center space-y-4">
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
        <div v-for="log in logs" :key="log.id" class="bg-base-100 rounded-3xl border shadow-sm overflow-hidden transition-all duration-200" :class="expandedLogId === log.id ? 'border-sky-500/30 shadow-sky-500/5' : 'border-base-200 hover:border-base-300'">

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
    <div v-if="!loading && pagination.totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between bg-base-100 p-4 sm:p-5 rounded-3xl border border-base-200 shadow-sm gap-4">
      <!-- Info -->
      <div class="text-xs font-bold text-base-content/60 text-center sm:text-left">
        Halaman <strong class="text-base-content">{{ page }}</strong> dari <strong class="text-base-content">{{ pagination.totalPages }}</strong>
        &nbsp;·&nbsp; Total <strong class="text-base-content">{{ pagination.total }}</strong> log
      </div>

      <!-- Page Buttons -->
      <div class="flex items-center gap-1.5">
        <!-- First + Prev -->
        <button @click="goToPage(1)" :disabled="!pagination.hasPrev" class="btn btn-ghost btn-xs rounded-xl font-black disabled:opacity-30 hidden sm:flex" title="Pertama">
          <Icon name="mingcute:skip-previous-line" size="14" />
        </button>
        <button @click="goToPage(page - 1)" :disabled="!pagination.hasPrev" class="btn btn-ghost btn-sm rounded-xl font-black disabled:opacity-30 gap-1">
          <Icon name="mingcute:arrow-left-line" size="16" />
          <span class="hidden sm:inline text-xs">Prev</span>
        </button>

        <!-- Page numbers with smart ellipsis -->
        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '...'" class="text-base-content/30 font-black px-1 text-sm select-none">…</span>
          <button
            v-else
            @click="goToPage(p)"
            :class="[
              'btn btn-sm rounded-xl font-black min-w-[36px] transition-all',
              p === page
                ? 'btn-primary shadow-lg shadow-primary/20 scale-105'
                : 'btn-ghost hover:btn-primary/20'
            ]"
          >{{ p }}</button>
        </template>

        <!-- Next + Last -->
        <button @click="goToPage(page + 1)" :disabled="!pagination.hasNext" class="btn btn-ghost btn-sm rounded-xl font-black disabled:opacity-30 gap-1">
          <span class="hidden sm:inline text-xs">Next</span>
          <Icon name="mingcute:arrow-right-line" size="16" />
        </button>
        <button @click="goToPage(pagination.totalPages)" :disabled="!pagination.hasNext" class="btn btn-ghost btn-xs rounded-xl font-black disabled:opacity-30 hidden sm:flex" title="Terakhir">
          <Icon name="mingcute:skip-forward-line" size="14" />
        </button>
      </div>
    </div>

  </div>
</template>
