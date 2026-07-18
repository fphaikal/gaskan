<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/useAuthStore';

const { role } = storeToRefs(useAuthStore());
const { $toast } = useNuxtApp();
const isSiswa = computed(() => role.value === 'siswa');
const isStaff = computed(() => ['admin', 'guru', 'developer'].includes(role.value));

useSeoMeta({
  title: 'Surat Izin | GASKAN',
  description: 'Kelola permohonan izin',
});

// State
const leaves = ref([]);
const counts = ref({ pending: 0, approved: 0, rejected: 0, total: 0 });
const loading = ref(true);
const showModal = ref(false);
const saving = ref(false);
const filterStatus = ref('');

// Review modal
const showReviewModal = ref(false);
const reviewTarget = ref(null);
const reviewForm = ref({ status: '', reviewNote: '' });
const reviewing = ref(false);
const showCancelModal = ref(false);
const cancelId = ref(null);

// Proof viewer modal
const showProofModal = ref(false);
const proofImages = ref([]);
const proofIndex = ref(0);

// Create form
const form = ref({
  type: 'IZIN',
  reason: '',
  startDate: '',
  endDate: '',
});
const selectedFiles = ref([]);
const uploadingProofs = ref(false);

// Fetch
const fetchLeaves = async () => {
  loading.value = true;
  try {
    const params = filterStatus.value ? `?status=${filterStatus.value}` : '';
    const data = await $fetch(`/api/izin${params}`);
    leaves.value = data?.data || [];
    if (data?.counts) counts.value = data.counts;
  } catch (e) {
    console.error('Failed to fetch leaves:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLeaves);

// File handling
const onFilesChange = (e) => {
  const files = Array.from(e.target.files || []);
  // Max 5 files
  selectedFiles.value = files.slice(0, 5);
};

const removeFile = (idx) => {
  selectedFiles.value.splice(idx, 1);
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Submit leave + upload proofs
const submitLeave = async () => {
  saving.value = true;
  try {
    const result = await $fetch('/api/izin', {
      method: 'POST',
      body: {
        type: form.value.type,
        reason: form.value.reason,
        startDate: new Date(form.value.startDate).toISOString(),
        endDate: new Date(form.value.endDate).toISOString(),
      },
    });

    const leaveId = result?.data?.id;

    // Upload proofs if files selected
    if (leaveId && selectedFiles.value.length > 0) {
      uploadingProofs.value = true;
      const formData = new FormData();
      selectedFiles.value.forEach(file => formData.append('files', file));

      await $fetch(`/api/izin/${leaveId}/proofs`, {
        method: 'POST',
        body: formData,
      });
    }

    $toast.success('Permohonan izin berhasil diajukan');
    await fetchLeaves();
  } catch (e) {
    $toast.error('Gagal mengajukan izin: ' + (e?.data?.message || e?.message || ''));
  } finally {
    saving.value = false;
    uploadingProofs.value = false;
  }
};

const cancelLeave = async () => {
  if (!cancelId.value) return;
  try {
    await $fetch(`/api/izin/${cancelId.value}`, { method: 'DELETE' });
    $toast.success('Permohonan izin berhasil dibatalkan');
    showCancelModal.value = false;
    await fetchLeaves();
  } catch (e) {
    $toast.error('Gagal membatalkan: ' + (e?.data?.message || e?.message || ''));
  } finally {
    cancelId.value = null;
  }
};

const confirmCancel = (id) => {
  cancelId.value = id;
  showCancelModal.value = true;
};

// Review
const openReview = (leave, status) => {
  reviewTarget.value = leave;
  reviewForm.value = { status, reviewNote: '' };
  showReviewModal.value = true;
};

const submitReview = async () => {
  reviewing.value = true;
  try {
    await $fetch(`/api/izin/${reviewTarget.value.id}/review`, {
      method: 'PUT',
      body: reviewForm.value,
    });
    showReviewModal.value = false;
    $toast.success(`Permohonan izin berhasil ${reviewForm.value.status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
    await fetchLeaves();
  } catch (e) {
    $toast.error('Gagal mereview: ' + (e?.data?.message || e?.message || ''));
  } finally {
    reviewing.value = false;
  }
};

// Proof viewer
const openProofViewer = (proofs, index = 0) => {
  proofImages.value = proofs;
  proofIndex.value = index;
  showProofModal.value = true;
};

const isImage = (fileType) => fileType?.startsWith('image/');
const getProofUrl = (proof) => `/api${proof.fileUrl}`;

// Helpers
const statusConfig = {
  PENDING: { color: 'text-warning', bg: 'bg-warning/10', badge: 'badge-warning', label: 'Menunggu', icon: 'mingcute:time-fill' },
  APPROVED: { color: 'text-success', bg: 'bg-success/10', badge: 'badge-success', label: 'Disetujui', icon: 'mingcute:check-circle-fill' },
  REJECTED: { color: 'text-error', bg: 'bg-error/10', badge: 'badge-error', label: 'Ditolak', icon: 'mingcute:close-circle-fill' },
};
const getStatusCfg = (s) => statusConfig[s] || statusConfig.PENDING;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const bentoCard = "bg-base-100 rounded-3xl p-6 transition-all duration-300";
</script>

<template>
  <div class="space-y-6">

    <!-- â”€â”€â”€ Header â”€â”€â”€ -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-base-content">{{ isSiswa ? 'Permohonan Izin Saya' : 'Review Surat Izin' }}</h1>
        <p class="text-sm text-base-content/40 font-medium mt-0.5">{{ isSiswa ? 'Ajukan dan pantau status izin Anda' : 'Kelola permohonan izin dari siswa' }}</p>
      </div>
      <div class="flex gap-3 items-center">
        <select v-if="isStaff" v-model="filterStatus" @change="fetchLeaves" class="select select-bordered rounded-2xl text-sm font-bold">
          <option value="">Semua Status</option>
          <option value="PENDING">Menunggu</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
        </select>
        <button v-if="isSiswa" @click="showModal = true" class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl font-black shadow-lg shadow-orange-500/20 gap-2">
          <Icon name="mingcute:add-fill" size="18" /> Ajukan Izin
        </button>
      </div>
    </div>

    <!-- Stat Strip (Staff only) -->
    <div v-if="isStaff" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-base-100 rounded-3xl p-5 border border-base-200/60 shadow-sm text-center">
        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-base-content/30 mb-2">Total</p>
        <p class="text-3xl font-black text-base-content">{{ counts.total }}</p>
      </div>
      <div class="bg-amber-500 rounded-3xl p-5 text-white text-center shadow-lg shadow-amber-500/20">
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Menunggu</p>
        <p class="text-3xl font-black">{{ counts.pending }}</p>
      </div>
      <div class="bg-emerald-500 rounded-3xl p-5 text-white text-center shadow-lg shadow-emerald-500/20">
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Disetujui</p>
        <p class="text-3xl font-black">{{ counts.approved }}</p>
      </div>
      <div class="bg-rose-500 rounded-3xl p-5 text-white text-center shadow-lg shadow-rose-500/20">
        <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Ditolak</p>
        <p class="text-3xl font-black">{{ counts.rejected }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-dots loading-lg text-orange-500"></span>
    </div>

    <!-- Empty -->
    <div v-else-if="!leaves.length" class="bg-base-100 rounded-3xl border border-dashed border-base-200 p-20 flex flex-col items-center justify-center opacity-40">
      <Icon name="mingcute:document-line" size="64" />
      <p class="text-sm font-black uppercase tracking-widest mt-4">Belum ada permohonan izin</p>
      <p v-if="isSiswa" class="text-xs font-bold mt-1">Klik "Ajukan Izin" untuk membuat permohonan baru</p>
    </div>

    <!-- Leave Cards -->
    <div v-else class="space-y-4">
      <div v-for="leave in leaves" :key="leave.id"
           class="bg-base-100 rounded-3xl border border-base-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all group">

        <!-- Header -->
        <div :class="['h-1', leave.status === 'APPROVED' ? 'bg-emerald-500' : leave.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-400']"></div>

        <div class="p-6 flex flex-col gap-4">
          <!-- Top: info + actions -->
          <div class="flex flex-col md:flex-row md:items-start gap-4">
            <div class="flex-1 min-w-0">
              <!-- Badges row -->
              <div class="flex items-center gap-2 mb-3 flex-wrap">
                <div :class="['px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                  leave.type === 'SAKIT' ? 'bg-orange-400/10 text-orange-500 border border-orange-400/20' : 'bg-sky-400/10 text-sky-500 border border-sky-400/20']">
                  {{ leave.type === 'SAKIT' ? '🤒 Sakit' : '📄 Izin' }}
                </div>
                <div :class="['px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5',
                  leave.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  leave.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                  'bg-amber-400/10 text-amber-600 border-amber-400/20']">
                  <Icon :name="getStatusCfg(leave.status).icon" size="12" />
                  {{ getStatusCfg(leave.status).label }}
                </div>
                <div v-if="leave.proofs?.length" class="px-3 py-1 rounded-xl text-[10px] font-black bg-base-200/60 text-base-content/40 border border-base-200">
                  ðŸ“Ž {{ leave.proofs.length }} bukti
                </div>
              </div>

              <!-- Student name (staff view) -->
              <p v-if="isStaff && leave.student" class="font-black text-base-content text-lg leading-tight mb-1">
                {{ leave.student.name }}
                <span class="text-xs text-base-content/40 font-normal ml-2 tracking-wide">{{ leave.student.nis }} Â· {{ leave.student.class?.className }}</span>
              </p>

              <!-- Reason -->
              <p class="text-sm text-base-content/70 font-medium leading-relaxed">{{ leave.reason }}</p>

              <!-- Dates -->
              <div class="flex flex-wrap gap-4 mt-3">
                <div class="flex items-center gap-1.5 text-xs text-base-content/50">
                  <Icon name="mingcute:calendar-2-fill" size="14" class="text-orange-500" />
                  <span class="font-bold">{{ formatDate(leave.startDate) }} - {{ formatDate(leave.endDate) }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-base-content/30">
                  <Icon name="mingcute:time-fill" size="12" />
                  <span>Diajukan {{ formatDateTime(leave.createdAt) }}</span>
                </div>
              </div>

              <!-- Reviewer note -->
              <div v-if="leave.reviewer" class="mt-3 p-3 bg-base-200/40 rounded-2xl border border-base-200/40">
                <p class="text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-1">Catatan Reviewer</p>
                <p class="text-xs font-bold text-base-content/60">{{ leave.reviewer.name }}
                  <span v-if="leave.reviewNote"> - "{{ leave.reviewNote }}"</span>
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 flex-shrink-0">
              <button v-if="isSiswa && leave.status === 'PENDING'" @click="confirmCancel(leave.id)"
                class="btn btn-sm btn-ghost text-rose-500 hover:bg-rose-500/10 rounded-2xl gap-1 font-black">
                <Icon name="mingcute:close-fill" size="16" /> Batalkan
              </button>
              <template v-if="isStaff && leave.status === 'PENDING'">
                <button @click="openReview(leave, 'APPROVED')"
                  class="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-0 rounded-2xl font-black gap-1 shadow-sm shadow-emerald-500/20">
                  <Icon name="mingcute:check-fill" size="16" /> Setujui
                </button>
                <button @click="openReview(leave, 'REJECTED')"
                  class="btn btn-sm bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl font-black gap-1 shadow-sm shadow-rose-500/20">
                  <Icon name="mingcute:close-fill" size="16" /> Tolak
                </button>
              </template>
            </div>
          </div>

          <!-- Proof thumbnails -->
          <div v-if="leave.proofs?.length" class="flex gap-3 flex-wrap pt-2 border-t border-base-200/30">
            <template v-for="(proof, pIdx) in leave.proofs" :key="proof.id">
              <button v-if="isImage(proof.fileType)" @click="openProofViewer(leave.proofs, pIdx)"
                class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-base-200 hover:border-orange-500 transition-colors cursor-pointer group/proof">
                <img :src="getProofUrl(proof)" :alt="proof.fileName" class="w-full h-full object-cover group-hover/proof:scale-110 transition-transform" />
                <div class="absolute inset-0 bg-black/0 group-hover/proof:bg-black/30 transition-colors flex items-center justify-center">
                  <Icon name="mingcute:zoom-in-fill" class="text-white opacity-0 group-hover/proof:opacity-100 transition-opacity" size="24" />
                </div>
              </button>
              <a v-else :href="getProofUrl(proof)" target="_blank"
                class="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-base-200 hover:border-orange-500 transition-colors text-xs font-bold">
                <Icon name="mingcute:file-fill" size="20" class="text-orange-500" />
                <div class="min-w-0">
                  <p class="truncate max-w-[120px]">{{ proof.fileName }}</p>
                  <p class="text-base-content/30">{{ formatFileSize(proof.fileSize) }}</p>
                </div>
              </a>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- â•â•â•â•â•â•â•â•â•â• MODALS â•â•â•â•â•â•â•â•â•â• -->

    <!-- Modal: Create Leave -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showModal = false; selectedFiles = []">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-md z-10 max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 border-b border-base-200/40 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Icon name="mingcute:file-new-fill" size="20" />
                </div>
                <h3 class="text-lg font-black text-base-content">Ajukan Permohonan Izin</h3>
              </div>
              <button @click="showModal = false; selectedFiles = []" class="btn btn-ghost btn-sm btn-circle">
                <Icon name="mingcute:close-line" size="20" />
              </button>
            </div>
            <div class="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Jenis Izin</span></label>
                <select v-model="form.type" class="select select-bordered w-full rounded-2xl font-bold">
                  <option value="IZIN">📄 Izin</option>
                  <option value="SAKIT">🤒 Sakit</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Alasan</span></label>
                <textarea v-model="form.reason" placeholder="Jelaskan alasan pengajuan izin..." class="textarea textarea-bordered w-full rounded-2xl font-medium" rows="3"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="form-control">
                  <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Mulai</span></label>
                  <input v-model="form.startDate" type="date" class="input input-bordered w-full rounded-2xl font-bold" />
                </div>
                <div class="form-control">
                  <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Selesai</span></label>
                  <input v-model="form.endDate" type="date" class="input input-bordered w-full rounded-2xl font-bold" />
                </div>
              </div>
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Bukti (opsional, maks 5)</span></label>
                <input type="file" multiple accept="image/*,.pdf" @change="onFilesChange" class="file-input file-input-bordered w-full rounded-2xl" />
                <p class="text-[10px] text-base-content/30 mt-1 font-bold uppercase tracking-wider">JPG, PNG, PDF · Maks 5MB/file</p>
              </div>
              <div v-if="selectedFiles.length" class="flex gap-2 flex-wrap">
                <div v-for="(file, idx) in selectedFiles" :key="idx" class="relative">
                  <div class="w-16 h-16 rounded-xl border-2 border-base-200 overflow-hidden flex items-center justify-center bg-base-200">
                    <img v-if="file.type.startsWith('image/')" :src="URL.createObjectURL(file)" class="w-full h-full object-cover" />
                    <Icon v-else name="mingcute:file-fill" size="24" class="text-base-content/30" />
                  </div>
                  <button @click="removeFile(idx)" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black">✖</button>
                </div>
              </div>
            </div>
            <div class="p-6 pt-0 flex gap-3 shrink-0">
              <button @click="showModal = false; selectedFiles = []" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="submitLeave" :disabled="saving || !form.reason || !form.startDate || !form.endDate"
                class="btn bg-orange-500 hover:bg-orange-600 text-white border-0 flex-1 rounded-2xl font-black shadow-lg shadow-orange-500/20">
                <span v-if="saving" class="loading loading-spinner loading-xs"></span>
                {{ uploadingProofs ? 'Upload bukti...' : saving ? 'Menyimpan...' : 'Ajukan Izin' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Review -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showReviewModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showReviewModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-sm z-10 max-h-[90vh] flex flex-col overflow-hidden">
            <div class="p-6 text-center overflow-y-auto flex-1 custom-scrollbar">
              <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', reviewForm.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600']">
                <Icon :name="reviewForm.status === 'APPROVED' ? 'mingcute:check-circle-fill' : 'mingcute:close-circle-fill'" size="32" />
              </div>
              <h3 class="text-lg font-black text-base-content mb-1">{{ reviewForm.status === 'APPROVED' ? 'Setujui Izin?' : 'Tolak Izin?' }}</h3>
              <p class="text-sm text-base-content/40 font-medium mb-6">{{ reviewTarget?.student?.name }}</p>
              <div class="form-control text-left">
                <label class="label py-1"><span class="label-text text-xs font-black uppercase tracking-widest text-base-content/40">Catatan (opsional)</span></label>
                <textarea v-model="reviewForm.reviewNote" placeholder="Tambahkan catatan untuk siswa..." class="textarea textarea-bordered w-full rounded-2xl font-medium" rows="2"></textarea>
              </div>
            </div>
            <div class="p-6 pt-0 flex gap-3 shrink-0">
              <button @click="showReviewModal = false" class="btn btn-ghost flex-1 rounded-2xl font-black">Batal</button>
              <button @click="submitReview" :disabled="reviewing"
                :class="['btn flex-1 rounded-2xl font-black text-white border-0 shadow-lg', reviewForm.status === 'APPROVED' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20']">
                <span v-if="reviewing" class="loading loading-spinner loading-xs"></span>
                {{ reviewForm.status === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Proof Viewer -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showProofModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showProofModal = false">
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden z-10">
            <div class="flex items-center justify-between px-6 py-4 border-b border-base-200/40">
              <p class="text-sm font-black text-base-content">Bukti {{ proofIndex + 1 }} / {{ proofImages.length }}
                <span class="text-base-content/40 font-normal ml-2">{{ proofImages[proofIndex]?.fileName }}</span>
              </p>
              <button @click="showProofModal = false" class="btn btn-ghost btn-sm btn-circle"><Icon name="mingcute:close-line" size="20" /></button>
            </div>
            <div class="flex items-center justify-center bg-base-900 min-h-[300px] max-h-[70vh] relative">
              <img v-if="proofImages[proofIndex]" :src="getProofUrl(proofImages[proofIndex])" :alt="proofImages[proofIndex]?.fileName" class="max-w-full max-h-[70vh] object-contain" />
              <button v-if="proofIndex > 0" @click="proofIndex--" class="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-base-100/80 border-0">â®</button>
              <button v-if="proofIndex < proofImages.length - 1" @click="proofIndex++" class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-base-100/80 border-0">â¯</button>
            </div>
            <div v-if="proofImages.length > 1" class="flex gap-2 p-4 overflow-x-auto bg-base-200/20">
              <button v-for="(p, idx) in proofImages" :key="p.id" @click="proofIndex = idx"
                :class="['w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all', idx === proofIndex ? 'border-orange-500 scale-110' : 'border-base-300 opacity-50 hover:opacity-100']">
                <img :src="getProofUrl(p)" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal: Cancel Confirm -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCancelModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4" @click.self="showCancelModal = false">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-sm z-10 p-8 text-center">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <Icon name="mingcute:alert-line" size="32" />
            </div>
            <h3 class="text-xl font-black text-base-content">Batalkan Izin?</h3>
            <p class="py-4 text-sm text-base-content/50 font-medium">Permohonan yang dibatalkan tidak dapat dipulihkan.</p>
            <div class="flex gap-3 justify-center">
              <button @click="showCancelModal = false" class="btn btn-ghost rounded-2xl px-6 font-black">Tidak</button>
              <button @click="cancelLeave" class="btn bg-rose-500 hover:bg-rose-600 text-white border-0 rounded-2xl px-6 font-black shadow-lg shadow-rose-500/20">Ya, Batalkan</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.97); }
</style>
