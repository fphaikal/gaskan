<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

useSeoMeta({
  title: 'File Explorer | GASKAN Developer',
  description: 'Developer-only file directory explorer with issuer tracking, CDN backup URLs, and detailed metadata.',
});

const { $toast } = useNuxtApp();
const authStore = useAuthStore();
const { role: userRole } = storeToRefs(authStore);

const isDeveloper = computed(() => {
  const r = (userRole.value || '').toLowerCase();
  return r === 'developer';
});

// ── State ──────────────────────────────────────────────────────────────
const files = ref([]);
const loading = ref(true);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(50);

// Filters
const search = ref('');
const typeFilter = ref('all');
const dirFilter = ref('all');
const backupStatusFilter = ref('all');
const directories = ref([]);
let searchTimer = null;

// Detail Panel
const selectedFile = ref(null);
const showDetail = ref(false);

// ── Fetch Data ─────────────────────────────────────────────────────────
const fetchFiles = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      search: search.value,
      type: typeFilter.value,
      dir: dirFilter.value,
      backupStatus: backupStatusFilter.value,
    };
    const res = await $fetch('/api/system/files', { params });
    if (res?.success && res.data) {
      files.value = res.data.files;
      total.value = res.data.total;
      totalPages.value = res.data.totalPages;
      if (res.data.directories) {
        directories.value = res.data.directories;
      }
    }
  } catch (err) {
    $toast.error(err?.data?.message || 'Gagal memuat data file explorer');
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    fetchFiles();
  }, 400);
};

const applyFilter = () => {
  page.value = 1;
  fetchFiles();
};

const copyToClipboard = async (text) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    $toast.success('URL disalin ke clipboard!');
  } catch {
    $toast.error('Gagal menyalin URL');
  }
};

const openFile = (url) => {
  if (!url) return;
  window.open(url, '_blank');
};

const deletingFile = ref(false);
const showDeleteConfirm = ref(false);
const deleteTargets = ref({
  local: false,
  gdrive: false,
  hf: false,
});

const openDetailPanel = (file) => {
  selectedFile.value = file;
  showDetail.value = true;
  deleteTargets.value = {
    local: !!file.existsLocally,
    gdrive: !!file.gdUrl,
    hf: !!file.hfUrl,
  };
};

const closeDetailPanel = () => {
  showDetail.value = false;
  showDeleteConfirm.value = false;
  setTimeout(() => { selectedFile.value = null; }, 300);
};

const deleteSelectedFile = async () => {
  if (!selectedFile.value) return;
  const targets = deleteTargets.value;

  if (!targets.local && !targets.gdrive && !targets.hf) {
    $toast.error('Harap pilih setidaknya satu target penghapusan.');
    return;
  }

  deletingFile.value = true;
  try {
    const res = await $fetch('/api/system/files', {
      method: 'DELETE',
      body: {
        relativePath: selectedFile.value.relativePath,
        targets,
      },
    });
    if (res?.success) {
      $toast.success(res.message || 'Berkas berhasil dihapus.');
      showDeleteConfirm.value = false;
      closeDetailPanel();
      fetchFiles();
    }
  } catch (err) {
    $toast.error(err.data?.message || 'Gagal menghapus berkas.');
  } finally {
    deletingFile.value = false;
  }
};

// Watchers
watch([typeFilter, dirFilter, backupStatusFilter], applyFilter);

// ── Computed Helpers ───────────────────────────────────────────────────
const backupStatusLabel = (status) => {
  const map = {
    LOCAL_ONLY: { label: 'Lokal Saja', color: 'badge-warning', icon: 'mingcute:folder-fill' },
    GD_ONLY: { label: 'Google Drive', color: 'badge-success', icon: 'mingcute:drive-fill' },
    HF_ONLY: { label: 'HuggingFace', color: 'badge-info', icon: 'mingcute:upload-3-fill' },
    GD_AND_HF: { label: 'GD + HF', color: 'badge-accent', icon: 'mingcute:cloud-fill' },
    PURGED: { label: 'Purged (CDN)', color: 'badge-error', icon: 'mingcute:delete-fill' },
  };
  return map[status] || { label: status, color: 'badge-ghost', icon: 'mingcute:file-fill' };
};

const issuerBadgeColor = (type) => {
  const map = {
    student: 'badge-primary',
    staff: 'badge-secondary',
    team: 'badge-accent',
    leave_proof: 'badge-warning',
    unknown: 'badge-ghost',
  };
  return map[type] || 'badge-ghost';
};

const issuerLabel = (type) => {
  const map = {
    student: 'Siswa',
    staff: 'Staf/Guru',
    team: 'Tim',
    leave_proof: 'Bukti Izin',
    unknown: 'Tidak Diketahui',
  };
  return map[type] || type;
};

const fileIconName = (ext, isImage) => {
  if (isImage) return 'mingcute:image-fill';
  const map = {
    '.pdf': 'mingcute:pdf-fill',
    '.xlsx': 'mingcute:table-fill',
    '.xls': 'mingcute:table-fill',
    '.docx': 'mingcute:document-fill',
    '.doc': 'mingcute:document-fill',
    '.csv': 'mingcute:table-fill',
    '.txt': 'mingcute:txt-fill',
    '.json': 'mingcute:code-fill',
    '.zip': 'mingcute:zip-fill',
  };
  return map[ext] || 'mingcute:file-fill';
};

const fileIconColor = (ext, isImage) => {
  if (isImage) return 'text-sky-400';
  const map = {
    '.pdf': 'text-red-400',
    '.xlsx': 'text-emerald-400',
    '.xls': 'text-emerald-400',
    '.docx': 'text-blue-400',
    '.doc': 'text-blue-400',
    '.csv': 'text-yellow-400',
  };
  return map[ext] || 'text-base-content/50';
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const visiblePages = computed(() => {
  const current = page.value;
  const total = totalPages.value;
  const range = 2; // number of pages to show before/after current
  const pages = [];

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - range && i <= current + range)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return pages;
});

const backendBase = () => {
  const config = useRuntimeConfig();
  return config.public.apiBase || 'http://localhost:5001';
};

onMounted(() => {
  if (isDeveloper.value) fetchFiles();
});
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 pb-16 text-left">

    <!-- Access Denied -->
    <div v-if="!isDeveloper" class="flex items-center justify-center py-24">
      <div class="text-center space-y-4 p-8 bg-base-100 rounded-3xl border border-base-200/60 shadow-sm max-w-md">
        <Icon name="mingcute:lock-fill" class="text-error mx-auto" size="64" />
        <h1 class="text-2xl font-black text-error">Akses Ditolak</h1>
        <p class="text-base-content/60">Halaman ini hanya dapat diakses oleh Developer.</p>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold mb-2">
            <Icon name="mingcute:shield-fill" class="text-sm" />
            <span>Developer File Explorer (Developer Only)</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-base-content tracking-tight">Eksplorasi & Manajemen File</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Pantau dan kelola seluruh file yang tersimpan di server lokal maupun cadangan cloud CDN.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-base-200/50 border-base-300">
            <span class="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            <span class="opacity-80 font-mono">{{ total }} Files</span>
          </div>
          <button
            class="btn btn-primary rounded-xl md:rounded-2xl gap-2 shadow-lg shadow-primary/20"
            :disabled="loading"
            @click="fetchFiles"
          >
            <span v-if="loading" class="loading loading-spinner loading-xs"></span>
            <Icon v-else name="mingcute:refresh-2-fill" size="16" />
            Refresh
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-base-100 rounded-[1.5rem] md:rounded-[2rem] p-4 border border-base-200/60 shadow-sm flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative w-full md:flex-1 md:max-w-sm">
          <Icon name="mingcute:search-2-fill" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size="16" />
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama file atau path..."
            class="input input-sm input-bordered w-full pl-9 bg-base-200/60 text-sm"
            @input="onSearchInput"
          />
        </div>

        <!-- Type Filter -->
        <select v-model="typeFilter" class="select select-sm select-bordered bg-base-200/60 text-sm flex-1 md:flex-none">
          <option value="all">Semua Tipe</option>
          <option value="image">🖼️ Gambar</option>
          <option value="doc">📄 Dokumen</option>
          <option value="other">📦 Lainnya</option>
        </select>

        <!-- Directory Filter -->
        <select v-model="dirFilter" class="select select-sm select-bordered bg-base-200/60 text-sm flex-1 md:flex-none">
          <option value="all">Semua Direktori</option>
          <option
            v-for="d in directories"
            :key="d"
            :value="d"
          >
            📁 /{{ d }}
          </option>
        </select>

        <!-- Backup Status Filter -->
        <select v-model="backupStatusFilter" class="select select-sm select-bordered bg-base-200/60 text-sm w-full md:w-auto">
          <option value="all">Semua Status Backup</option>
          <option value="local_only">⚠️ Lokal Saja</option>
          <option value="gd">🟢 Ada di Google Drive</option>
          <option value="hf">🔵 Ada di HuggingFace</option>
          <option value="gd_and_hf">✅ GD + HF</option>
          <option value="purged">🗑️ Purged (CDN Only)</option>
        </select>

        <!-- Limit -->
        <select v-model.number="limit" class="select select-sm select-bordered bg-base-200/60 text-sm w-20 md:w-24 ml-auto md:ml-0" @change="applyFilter">
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="200">200</option>
        </select>
      </div>

      <!-- Main Content -->
      <div class="space-y-4">

        <!-- Loading Skeleton -->
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 8" :key="i" class="h-16 rounded-[1.5rem] bg-base-200/50 animate-pulse"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="files.length === 0" class="flex flex-col items-center justify-center py-24 gap-4 text-center bg-base-100 rounded-[1.5rem] md:rounded-[2rem] border border-base-200/60 shadow-sm">
          <Icon name="mingcute:folder-open-fill" class="text-base-content/20" size="80" />
          <p class="text-base-content/50 font-semibold text-lg">Tidak ada file ditemukan</p>
          <p class="text-base-content/30 text-sm">Coba ubah filter atau pencarian</p>
        </div>

        <!-- File Directory Container -->
        <div v-else>
          <!-- Mobile Layout: Card Grid (visible on mobile only) -->
          <!-- Mobile Layout: Card Grid (visible on mobile only) -->
          <div class="md:hidden space-y-3">
            <div
              v-for="file in files"
              :key="file.relativePath"
              class="p-4 rounded-2xl border border-base-200/60 bg-base-100 shadow-sm active:bg-violet-500/5 cursor-pointer transition-colors space-y-3"
              :class="{ 'opacity-60': file.backupStatus === 'PURGED' }"
              @click="openDetailPanel(file)"
            >
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl overflow-hidden bg-base-300 flex items-center justify-center flex-shrink-0">
                    <img
                      v-if="file.isImage && file.existsLocally"
                      :src="`${backendBase()}${file.localUrl}`"
                      class="w-full h-full object-cover"
                      loading="lazy"
                      @error="(e) => e.target.style.display='none'"
                    />
                    <Icon
                      v-else
                      :name="fileIconName(file.ext, file.isImage)"
                      :class="fileIconColor(file.ext, file.isImage)"
                      size="20"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-black font-mono truncate text-base-content leading-snug">
                      {{ file.fileName }}
                    </p>
                    <p class="text-[10px] opacity-40 font-mono truncate mt-0.5">{{ file.relativePath }}</p>
                  </div>
                </div>
                <span :class="['badge badge-xs font-bold shrink-0 py-2', backupStatusLabel(file.backupStatus).color]">
                  {{ backupStatusLabel(file.backupStatus).label }}
                </span>
              </div>

              <!-- Card Body: Issuer & Directory -->
              <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-2.5 border-t border-base-200/60">
                <div class="flex items-center gap-1.5 font-mono">
                  <span class="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    /{{ file.directory }}
                  </span>
                  <span class="opacity-30">•</span>
                  <span class="opacity-70">{{ file.sizeFormatted }}</span>
                </div>
                <div v-if="file.issuer.type !== 'unknown'" class="flex items-center gap-1 bg-base-300/40 px-2 py-0.5 rounded-full border border-base-200">
                  <span class="font-bold text-base-content/85 truncate max-w-[80px]">{{ file.issuer.userName }}</span>
                  <span class="opacity-40">({{ issuerLabel(file.issuer.type) }})</span>
                </div>
                <div v-else class="text-[9px] opacity-35 italic">Tanpa Issuer</div>
              </div>

              <!-- Card Footer: Time & Action buttons -->
              <div class="flex items-center justify-between pt-1.5 text-[9px] opacity-60">
                <span class="font-mono">{{ formatDate(file.mtime) }}</span>
                <div class="flex items-center gap-1">
                  <button
                    v-if="file.gdUrl"
                    class="btn btn-xs btn-circle btn-ghost text-emerald-400"
                    @click.stop="openFile(file.gdUrl)"
                  >
                    <Icon name="mingcute:drive-fill" size="13" />
                  </button>
                  <button
                    v-if="file.hfUrl"
                    class="btn btn-xs btn-circle btn-ghost text-sky-400"
                    @click.stop="openFile(file.hfUrl)"
                  >
                    <Icon name="mingcute:upload-3-fill" size="13" />
                  </button>
                  <button
                    v-if="file.existsLocally"
                    class="btn btn-xs btn-circle btn-ghost text-amber-400"
                    @click.stop="openFile(`${backendBase()}${file.localUrl}`)"
                  >
                    <Icon name="mingcute:folder-fill" size="13" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Layout: Table (hidden on mobile) -->
          <div class="hidden md:block bg-base-100 rounded-[1.5rem] md:rounded-[2rem] border border-base-200/60 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table table-zebra table-sm w-full">
                <thead>
                  <tr class="bg-base-200/80 text-xs font-black uppercase tracking-widest opacity-70">
                    <th class="w-10"></th>
                    <th>File</th>
                    <th>Direktori</th>
                    <th>Pemilik (Issuer)</th>
                    <th>Ukuran</th>
                    <th>Status Backup</th>
                    <th>CDN URLs</th>
                    <th>Diubah</th>
                    <th class="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="file in files"
                    :key="file.relativePath"
                    class="hover:bg-violet-500/5 cursor-pointer transition-colors duration-100 group"
                    :class="{ 'opacity-60': file.backupStatus === 'PURGED' }"
                    @click="openDetailPanel(file)"
                  >
                    <!-- File Icon / Thumbnail -->
                    <td class="text-center">
                      <div class="w-9 h-9 rounded-lg overflow-hidden bg-base-200 flex items-center justify-center flex-shrink-0">
                        <img
                          v-if="file.isImage && file.existsLocally"
                          :src="`${backendBase()}${file.localUrl}`"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          @error="(e) => e.target.style.display='none'"
                        />
                        <Icon
                          v-else
                          :name="fileIconName(file.ext, file.isImage)"
                          :class="fileIconColor(file.ext, file.isImage)"
                          size="18"
                        />
                      </div>
                    </td>

                    <!-- File Name -->
                    <td>
                      <div class="max-w-[200px]">
                        <p class="text-xs font-bold font-mono truncate text-base-content/90 group-hover:text-violet-400 transition-colors">
                          {{ file.fileName }}
                        </p>
                        <p class="text-[10px] opacity-40 font-mono truncate">{{ file.relativePath }}</p>
                      </div>
                    </td>

                    <!-- Directory -->
                    <td>
                      <span class="font-mono text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        /{{ file.directory }}
                      </span>
                    </td>

                    <!-- Issuer -->
                    <td>
                      <div v-if="file.issuer.type !== 'unknown'" class="flex items-center gap-2 min-w-[160px]">
                        <div class="avatar">
                          <div class="w-7 h-7 rounded-full bg-base-200 overflow-hidden flex-shrink-0">
                            <img
                              v-if="file.issuer.userPhotoUrl"
                              :src="`${backendBase()}${file.issuer.userPhotoUrl}`"
                              class="w-full h-full object-cover"
                              @error="(e) => e.target.style.display='none'"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center">
                              <Icon name="mingcute:user-fill" class="text-base-content/40" size="14" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <p class="text-xs font-semibold leading-tight max-w-[120px] truncate">{{ file.issuer.userName || '—' }}</p>
                          <div class="flex items-center gap-1 mt-0.5">
                            <span :class="['badge badge-xs font-mono', issuerBadgeColor(file.issuer.type)]">
                              {{ issuerLabel(file.issuer.type) }}
                            </span>
                            <span v-if="file.issuer.userNis" class="text-[9px] opacity-40 font-mono">{{ file.issuer.userNis }}</span>
                          </div>
                        </div>
                      </div>
                      <span v-else class="text-[11px] opacity-30 italic">Tidak diketahui</span>
                    </td>

                    <!-- Size -->
                    <td>
                      <span class="text-xs font-mono text-base-content/70">{{ file.sizeFormatted }}</span>
                    </td>

                    <!-- Backup Status -->
                    <td>
                      <span :class="['badge badge-sm font-bold gap-1', backupStatusLabel(file.backupStatus).color]">
                        <Icon :name="backupStatusLabel(file.backupStatus).icon" size="11" />
                        {{ backupStatusLabel(file.backupStatus).label }}
                      </span>
                    </td>

                    <!-- CDN URLs Quick Buttons -->
                    <td>
                      <div class="flex items-center gap-1.5">
                        <button
                          v-if="file.gdUrl"
                          class="btn btn-xs btn-circle btn-ghost text-emerald-400 hover:bg-emerald-500/20"
                          title="Buka Google Drive"
                          @click.stop="openFile(file.gdUrl)"
                        >
                          <Icon name="mingcute:drive-fill" size="13" />
                        </button>
                        <button
                          v-if="file.hfUrl"
                          class="btn btn-xs btn-circle btn-ghost text-sky-400 hover:bg-sky-500/20"
                          title="Buka Hugging Face"
                          @click.stop="openFile(file.hfUrl)"
                        >
                          <Icon name="mingcute:upload-3-fill" size="13" />
                        </button>
                        <button
                          v-if="file.existsLocally"
                          class="btn btn-xs btn-circle btn-ghost text-amber-400 hover:bg-amber-500/20"
                          title="Buka File Lokal"
                          @click.stop="openFile(`${backendBase()}${file.localUrl}`)"
                        >
                          <Icon name="mingcute:folder-fill" size="13" />
                        </button>
                        <span v-if="!file.gdUrl && !file.hfUrl && !file.existsLocally" class="text-[10px] opacity-30">—</span>
                      </div>
                    </td>

                    <!-- Modified Date -->
                    <td>
                      <span class="text-[10px] font-mono opacity-50 whitespace-nowrap">{{ formatDate(file.mtime) }}</span>
                    </td>

                    <!-- Detail Button -->
                    <td>
                      <button class="btn btn-xs btn-circle btn-ghost opacity-0 group-hover:opacity-100 transition-opacity" @click.stop="openDetailPanel(file)">
                        <Icon name="mingcute:right-fill" size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
          <button class="btn btn-sm btn-ghost" :disabled="page <= 1" @click="page--; fetchFiles()">
            <Icon name="mingcute:left-fill" size="16" />
          </button>
          
          <div class="flex items-center gap-1 flex-wrap">
            <template v-for="(p, idx) in visiblePages" :key="idx">
              <span v-if="p === '...'" class="px-2 opacity-50 select-none">...</span>
              <button
                v-else
                class="btn btn-sm btn-circle min-w-[32px] h-[32px]"
                :class="p === page ? 'btn-primary' : 'btn-ghost'"
                @click="page = p; fetchFiles()"
              >
                {{ p }}
              </button>
            </template>
          </div>

          <button class="btn btn-sm btn-ghost" :disabled="page >= totalPages" @click="page++; fetchFiles()">
            <Icon name="mingcute:right-fill" size="16" />
          </button>
        </div>

      </div>
    </template>

    <!-- ── Detail Side Panel ─────────────────────────────────────────── -->
    <Transition name="slide-panel">
      <div
        v-if="showDetail && selectedFile"
        class="fixed inset-0 z-[1050] flex items-stretch justify-end"
        @click.self="closeDetailPanel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDetailPanel"></div>

        <!-- Panel -->
        <div class="relative w-full max-w-md bg-base-200 border-l border-base-300 h-full overflow-y-auto shadow-2xl z-10 flex flex-col">

          <!-- Panel Header -->
          <div class="sticky top-0 bg-base-200/95 backdrop-blur-xl border-b border-base-300 p-4 flex items-start justify-between gap-3 z-10">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-base-300 flex items-center justify-center flex-shrink-0">
                <Icon :name="fileIconName(selectedFile.ext, selectedFile.isImage)" :class="fileIconColor(selectedFile.ext, selectedFile.isImage)" size="22" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black truncate text-base-content">{{ selectedFile.fileName }}</p>
                <p class="text-[10px] font-mono opacity-40 truncate">{{ selectedFile.relativePath }}</p>
              </div>
            </div>
            <button class="btn btn-sm btn-circle btn-ghost flex-shrink-0" @click="closeDetailPanel">
              <Icon name="mingcute:close-fill" size="18" />
            </button>
          </div>

          <!-- Preview -->
          <div class="p-4">
            <div v-if="selectedFile.isImage" class="rounded-2xl overflow-hidden bg-base-300 border border-base-300 mb-4">
              <img
                :src="selectedFile.existsLocally ? `${backendBase()}${selectedFile.localUrl}` : (selectedFile.gdUrl || selectedFile.hfUrl)"
                class="w-full max-h-72 object-contain"
                @error="(e) => e.target.parentElement.style.display='none'"
              />
            </div>
            <div v-else class="rounded-2xl bg-base-300 border border-base-300 p-8 flex flex-col items-center justify-center gap-3 mb-4">
              <Icon :name="fileIconName(selectedFile.ext, false)" :class="fileIconColor(selectedFile.ext, false)" size="52" />
              <span class="text-xs font-mono opacity-50 uppercase">{{ selectedFile.ext || 'File' }}</span>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center justify-between mb-4">
              <span :class="['badge badge-sm font-bold gap-1', backupStatusLabel(selectedFile.backupStatus).color]">
                <Icon :name="backupStatusLabel(selectedFile.backupStatus).icon" size="12" />
                {{ backupStatusLabel(selectedFile.backupStatus).label }}
              </span>
              <span class="badge badge-ghost badge-sm font-mono">{{ selectedFile.sizeFormatted }}</span>
            </div>

            <!-- Issuer Card -->
            <div v-if="selectedFile.issuer.type !== 'unknown'" class="p-3 rounded-2xl bg-base-300 border border-base-200 mb-4">
              <p class="text-[10px] font-black opacity-50 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Icon name="mingcute:user-star-fill" size="12" />
                Pemilik File (Issuer)
              </p>
              <div class="flex items-center gap-3">
                <div class="avatar">
                  <div class="w-12 h-12 rounded-2xl bg-base-200 overflow-hidden">
                    <img
                      v-if="selectedFile.issuer.userPhotoUrl"
                      :src="`${backendBase()}${selectedFile.issuer.userPhotoUrl}`"
                      class="w-full h-full object-cover"
                      @error="(e) => e.target.parentElement.parentElement.style.display='none'"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <Icon name="mingcute:user-fill" class="text-base-content/30" size="24" />
                    </div>
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="font-black text-sm truncate">{{ selectedFile.issuer.userName || '—' }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span :class="['badge badge-xs font-bold', issuerBadgeColor(selectedFile.issuer.type)]">
                      {{ issuerLabel(selectedFile.issuer.type) }}
                    </span>
                    <span v-if="selectedFile.issuer.userRole" class="text-[10px] font-mono opacity-50">{{ selectedFile.issuer.userRole }}</span>
                  </div>
                  <p v-if="selectedFile.issuer.userNis" class="text-[10px] font-mono opacity-40 mt-0.5">NIS: {{ selectedFile.issuer.userNis }}</p>
                </div>
              </div>
              <div v-if="selectedFile.issuer.context" class="mt-2 text-[11px] opacity-60 italic bg-base-200/50 rounded-xl px-3 py-1.5">
                {{ selectedFile.issuer.context }}
              </div>
            </div>
            <div v-else class="p-3 rounded-2xl bg-base-300/50 border border-base-200 mb-4">
              <p class="text-[10px] font-black opacity-50 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Icon name="mingcute:user-star-fill" size="12" />
                Pemilik File (Issuer)
              </p>
              <p class="text-xs opacity-40 italic">Tidak dapat diidentifikasi secara otomatis</p>
            </div>

            <!-- File Metadata -->
            <div class="p-3 rounded-2xl bg-base-300 border border-base-200 mb-4 space-y-2">
              <p class="text-[10px] font-black opacity-50 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Icon name="mingcute:information-fill" size="12" />
                Metadata File
              </p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p class="opacity-50 text-[10px] uppercase font-bold">Nama File</p>
                  <p class="font-mono font-bold truncate">{{ selectedFile.fileName }}</p>
                </div>
                <div>
                  <p class="opacity-50 text-[10px] uppercase font-bold">Ekstensi</p>
                  <p class="font-mono">{{ selectedFile.ext || '—' }}</p>
                </div>
                <div>
                  <p class="opacity-50 text-[10px] uppercase font-bold">Ukuran</p>
                  <p class="font-mono font-bold">{{ selectedFile.sizeFormatted }}</p>
                </div>
                <div>
                  <p class="opacity-50 text-[10px] uppercase font-bold">Tipe</p>
                  <p class="font-mono">{{ selectedFile.isImage ? 'Gambar' : 'Lainnya' }}</p>
                </div>
                <div class="col-span-2">
                  <p class="opacity-50 text-[10px] uppercase font-bold">Direktori</p>
                  <p class="font-mono text-amber-400">/{{ selectedFile.directory }}</p>
                </div>
                <div class="col-span-2">
                  <p class="opacity-50 text-[10px] uppercase font-bold">Path Lengkap</p>
                  <p class="font-mono text-[10px] opacity-70 break-all">uploads/{{ selectedFile.relativePath }}</p>
                </div>
                <div>
                  <p class="opacity-50 text-[10px] uppercase font-bold">Ada di Disk</p>
                  <span :class="['badge badge-xs font-bold', selectedFile.existsLocally ? 'badge-success' : 'badge-error']">
                    {{ selectedFile.existsLocally ? 'Ya' : 'Tidak (Purged)' }}
                  </span>
                </div>
                <div>
                  <p class="opacity-50 text-[10px] uppercase font-bold">Terakhir Diubah</p>
                  <p class="font-mono text-[10px]">{{ formatDate(selectedFile.mtime) }}</p>
                </div>
              </div>
            </div>

            <!-- URL Cards -->
            <div class="space-y-2.5">
              <p class="text-[10px] font-black opacity-50 uppercase tracking-wider flex items-center gap-1">
                <Icon name="mingcute:link-fill" size="12" />
                URL Akses File
              </p>

              <!-- Local URL -->
              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-amber-400 text-[11px] font-black">
                    <Icon name="mingcute:folder-fill" size="13" />
                    URL Lokal Server
                  </div>
                  <div class="flex gap-1">
                    <button
                      class="btn btn-xs btn-ghost text-amber-400"
                      @click="copyToClipboard(`${backendBase()}${selectedFile.localUrl}`)"
                    >
                      <Icon name="mingcute:copy-fill" size="13" />
                    </button>
                    <button
                      v-if="selectedFile.existsLocally"
                      class="btn btn-xs btn-ghost text-amber-400"
                      @click="openFile(`${backendBase()}${selectedFile.localUrl}`)"
                    >
                      <Icon name="mingcute:external-link-fill" size="13" />
                    </button>
                  </div>
                </div>
                <p class="text-[10px] font-mono opacity-60 break-all">{{ backendBase() }}{{ selectedFile.localUrl }}</p>
                <span v-if="!selectedFile.existsLocally" class="badge badge-xs badge-error">File sudah di-purge dari disk</span>
              </div>

              <!-- Google Drive URL -->
              <div v-if="selectedFile.gdUrl" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-emerald-400 text-[11px] font-black">
                    <Icon name="mingcute:drive-fill" size="13" />
                    Google Drive CDN
                  </div>
                  <div class="flex gap-1">
                    <button class="btn btn-xs btn-ghost text-emerald-400" @click="copyToClipboard(selectedFile.gdUrl)">
                      <Icon name="mingcute:copy-fill" size="13" />
                    </button>
                    <button class="btn btn-xs btn-ghost text-emerald-400" @click="openFile(selectedFile.gdUrl)">
                      <Icon name="mingcute:external-link-fill" size="13" />
                    </button>
                  </div>
                </div>
                <p class="text-[10px] font-mono opacity-60 break-all">{{ selectedFile.gdUrl }}</p>
                <div v-if="selectedFile.gdFileId" class="text-[9px] opacity-40 font-mono">File ID: {{ selectedFile.gdFileId }}</div>
              </div>
              <div v-else class="p-3 rounded-xl bg-base-300/40 border border-base-200 space-y-1">
                <div class="flex items-center gap-1.5 text-base-content/30 text-[11px] font-bold">
                  <Icon name="mingcute:drive-fill" size="13" />
                  Google Drive CDN
                </div>
                <p class="text-[10px] opacity-30">Belum ter-backup ke Google Drive</p>
              </div>

              <!-- Hugging Face URL -->
              <div v-if="selectedFile.hfUrl" class="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-sky-400 text-[11px] font-black">
                    <Icon name="mingcute:upload-3-fill" size="13" />
                    Hugging Face CDN
                  </div>
                  <div class="flex gap-1">
                    <button class="btn btn-xs btn-ghost text-sky-400" @click="copyToClipboard(selectedFile.hfUrl)">
                      <Icon name="mingcute:copy-fill" size="13" />
                    </button>
                    <button class="btn btn-xs btn-ghost text-sky-400" @click="openFile(selectedFile.hfUrl)">
                      <Icon name="mingcute:external-link-fill" size="13" />
                    </button>
                  </div>
                </div>
                <p class="text-[10px] font-mono opacity-60 break-all">{{ selectedFile.hfUrl }}</p>
              </div>
              <div v-else class="p-3 rounded-xl bg-base-300/40 border border-base-200 space-y-1">
                <div class="flex items-center gap-1.5 text-base-content/30 text-[11px] font-bold">
                  <Icon name="mingcute:upload-3-fill" size="13" />
                  Hugging Face CDN
                </div>
                <p class="text-[10px] opacity-30">Belum ter-backup ke Hugging Face</p>
              </div>
            </div>

             <!-- Danger Zone -->
            <div class="mt-6 p-4 rounded-2xl border border-error/20 bg-error/5 space-y-3.5">
              <p class="text-[10px] font-black text-error uppercase tracking-wider flex items-center gap-1">
                <Icon name="mingcute:delete-fill" size="12" />
                Zona Bahaya (Hapus File)
              </p>
              
              <div class="space-y-2">
                <!-- Card Local -->
                <div
                  :class="[
                    'flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 select-none cursor-pointer',
                    selectedFile.existsLocally 
                      ? (deleteTargets.local ? 'border-error/40 bg-error/10 text-error' : 'border-base-300 bg-base-300/20 opacity-80 hover:bg-base-300/40 text-base-content')
                      : 'opacity-40 cursor-not-allowed bg-base-300/10 border-base-200 text-base-content'
                  ]"
                  @click="selectedFile.existsLocally && (deleteTargets.local = !deleteTargets.local)"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <Icon name="mingcute:folder-fill" :class="selectedFile.existsLocally && deleteTargets.local ? 'text-error' : 'text-amber-400'" size="16" />
                    <div class="text-left">
                      <p class="text-xs font-bold leading-tight">Penyimpanan Lokal</p>
                      <p class="text-[9px] opacity-60 mt-0.5">File di folder /uploads server</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    :checked="deleteTargets.local"
                    :disabled="!selectedFile.existsLocally"
                    class="checkbox checkbox-xs checkbox-error rounded pointer-events-none"
                  />
                </div>

                <!-- Card Google Drive -->
                <div
                  :class="[
                    'flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 select-none cursor-pointer',
                    selectedFile.gdUrl 
                      ? (deleteTargets.gdrive ? 'border-error/40 bg-error/10 text-error' : 'border-base-300 bg-base-300/20 opacity-80 hover:bg-base-300/40 text-base-content')
                      : 'opacity-40 cursor-not-allowed bg-base-300/10 border-base-200 text-base-content'
                  ]"
                  @click="selectedFile.gdUrl && (deleteTargets.gdrive = !deleteTargets.gdrive)"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <Icon name="mingcute:drive-fill" :class="selectedFile.gdUrl && deleteTargets.gdrive ? 'text-error' : 'text-emerald-400'" size="16" />
                    <div class="text-left">
                      <p class="text-xs font-bold leading-tight">Google Drive Cloud</p>
                      <p class="text-[9px] opacity-60 mt-0.5">Backup & record Google Drive</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    :checked="deleteTargets.gdrive"
                    :disabled="!selectedFile.gdUrl"
                    class="checkbox checkbox-xs checkbox-error rounded pointer-events-none"
                  />
                </div>

                <!-- Card Hugging Face -->
                <div
                  :class="[
                    'flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 select-none cursor-pointer',
                    selectedFile.hfUrl 
                      ? (deleteTargets.hf ? 'border-error/40 bg-error/10 text-error' : 'border-base-300 bg-base-300/20 opacity-80 hover:bg-base-300/40 text-base-content')
                      : 'opacity-40 cursor-not-allowed bg-base-300/10 border-base-200 text-base-content'
                  ]"
                  @click="selectedFile.hfUrl && (deleteTargets.hf = !deleteTargets.hf)"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <Icon name="mingcute:upload-3-fill" :class="selectedFile.hfUrl && deleteTargets.hf ? 'text-error' : 'text-sky-400'" size="16" />
                    <div class="text-left">
                      <p class="text-xs font-bold leading-tight">Hugging Face CDN</p>
                      <p class="text-[9px] opacity-60 mt-0.5">File dataset & record HF</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    :checked="deleteTargets.hf"
                    :disabled="!selectedFile.hfUrl"
                    class="checkbox checkbox-xs checkbox-error rounded pointer-events-none"
                  />
                </div>
              </div>

              <div class="flex gap-2 pt-1.5 flex-wrap">
                <button
                  class="btn btn-xs btn-error text-white font-bold flex-1 min-w-[110px]"
                  @click="showDeleteConfirm = true"
                >
                  <Icon name="mingcute:delete-fill" size="13" />
                  Hapus Pilihan
                </button>
                <button
                  class="btn btn-xs btn-outline btn-error font-bold flex-1 min-w-[110px]"
                  @click="deleteTargets.local = !!selectedFile.existsLocally; deleteTargets.gdrive = !!selectedFile.gdUrl; deleteTargets.hf = !!selectedFile.hfUrl; showDeleteConfirm = true;"
                >
                  Hapus dari Semua
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Deletion Confirmation Dialog Modal -->
    <dialog :class="['modal modal-bottom sm:modal-middle z-[1100]', { 'modal-open': showDeleteConfirm }]">
      <div class="modal-box bg-base-100 border border-base-300 shadow-2xl rounded-3xl" v-if="selectedFile">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
            <Icon name="mingcute:delete-fill" class="text-2xl" />
          </div>
          <div>
            <h3 class="font-bold text-lg text-error">Konfirmasi Hapus</h3>
            <p class="text-sm text-base-content/60">Apakah Anda yakin ingin menghapus berkas <span class="font-bold font-mono text-[11px] text-base-content">{{ selectedFile.fileName }}</span>?</p>
          </div>
        </div>

        <div class="p-3 bg-base-200 rounded-2xl mb-4 text-xs space-y-1">
          <p class="font-bold opacity-60">Aksi yang akan dilakukan:</p>
          <ul class="list-disc list-inside space-y-0.5 opacity-80">
            <li v-if="deleteTargets.local" class="text-error">Hapus dari penyimpanan lokal server</li>
            <li v-if="deleteTargets.gdrive" class="text-error">Hapus berkas Google Drive & hapus DB record</li>
            <li v-if="deleteTargets.hf" class="text-error">Hapus berkas Hugging Face Dataset & hapus DB record</li>
          </ul>
        </div>

        <div class="modal-action gap-3">
          <button class="btn btn-ghost rounded-xl flex-1" @click="showDeleteConfirm = false">Batal</button>
          <button
            class="btn btn-error rounded-xl flex-1 text-white shadow-lg shadow-error/20"
            :disabled="deletingFile"
            @click="deleteSelectedFile"
          >
            <span v-if="deletingFile" class="loading loading-spinner loading-xs"></span>
            <span v-else>Ya, Hapus</span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false">
        <button>close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: opacity 0.2s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-active .relative.w-full,
.slide-panel-leave-active .relative.w-full {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-panel-enter-from .relative.w-full,
.slide-panel-leave-to .relative.w-full {
  transform: translateX(100%);
}
</style>
