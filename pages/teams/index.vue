<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

const { $toast } = useNuxtApp();
const authStore = useAuthStore();
const { userData, role } = storeToRefs(authStore);

useSeoMeta({
  title: 'Platform Teams | GASKAN',
  description: 'Ruang Diskusi & Dokumentasi Khusus Anggota Tim GASKAN',
});

// Active Tab: 'discussions', 'docs', 'profile'
const activeTab = ref('discussions');

// Team Access Check
const myTeamProfile = ref(null);
const loadingProfile = ref(true);

const isTeamMember = computed(() => {
  const r = (role.value || '').toUpperCase();
  return r === 'ADMIN' || r === 'DEVELOPER' || !!myTeamProfile.value;
});

// ── DISCUSSIONS STATE ───────────────────────────────────────────────────────
const discussions = ref([]);
const loadingDiscussions = ref(false);
const discussionCategory = ref('');
const showCreateDiscussionModal = ref(false);
const selectedDiscussion = ref(null);
const newCommentContent = ref('');
const submittingComment = ref(false);

const newDiscussionForm = ref({
  title: '',
  content: '',
  category: 'General',
  pinned: false,
});
const savingDiscussion = ref(false);

// ── DOCS STATE ──────────────────────────────────────────────────────────────
const docs = ref([]);
const loadingDocs = ref(false);
const docCategory = ref('');
const showCreateDocModal = ref(false);
const selectedDoc = ref(null);
const isEditingDoc = ref(false);

const docForm = ref({
  id: null,
  title: '',
  content: '',
  category: 'Documentation',
});
const savingDoc = ref(false);

// ── MY PROFILE STATE ────────────────────────────────────────────────────────
const myProfileForm = ref({
  name: '',
  role: '',
  bio: '',
  github: '',
  linkedin: '',
  instagram: '',
  email: '',
  customLinks: [],
});
const profilePhotoPreview = ref(null);
const profilePhotoFile = ref(null);
const savingProfile = ref(false);

const parseCustomLinks = (raw) => {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
};

const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/team/')) {
    return `/api${url}`;
  }
  return url;
};

// ── FETCH APIS ──────────────────────────────────────────────────────────────

const fetchMyProfile = async () => {
  loadingProfile.value = true;
  try {
    const res = await $fetch('/api/team/my-profile');
    if (res?.data) {
      myTeamProfile.value = res.data;
      myProfileForm.value = {
        name: res.data.name || '',
        role: res.data.role || '',
        bio: res.data.bio || '',
        github: res.data.github || '',
        linkedin: res.data.linkedin || '',
        instagram: res.data.instagram || '',
        email: res.data.email || '',
        customLinks: parseCustomLinks(res.data.customLinks),
      };
      profilePhotoPreview.value = res.data.photoUrl;
    }
  } catch (e) {
    console.warn('User is not linked to a team member profile yet');
  } finally {
    loadingProfile.value = false;
  }
};

const fetchDiscussions = async () => {
  loadingDiscussions.value = true;
  try {
    const query = discussionCategory.value ? `?category=${encodeURIComponent(discussionCategory.value)}` : '';
    const res = await $fetch(`/api/team-hub/discussions${query}`);
    discussions.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error('Failed to fetch discussions:', e);
  } finally {
    loadingDiscussions.value = false;
  }
};

const fetchDocs = async () => {
  loadingDocs.value = true;
  try {
    const query = docCategory.value ? `?category=${encodeURIComponent(docCategory.value)}` : '';
    const res = await $fetch(`/api/team-hub/docs${query}`);
    docs.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    console.error('Failed to fetch docs:', e);
  } finally {
    loadingDocs.value = false;
  }
};

onMounted(async () => {
  await fetchMyProfile();
  fetchDiscussions();
  fetchDocs();
});

// ── DISCUSSION HANDLERS ─────────────────────────────────────────────────────

const openDiscussionDetail = async (item) => {
  try {
    const res = await $fetch(`/api/team-hub/discussions/${item.id}`);
    if (res?.data) {
      selectedDiscussion.value = res.data;
    }
  } catch (e) {
    $toast.error('Gagal memuat rincian diskusi');
  }
};

const createDiscussionSubmit = async () => {
  if (!newDiscussionForm.value.title || !newDiscussionForm.value.content) return;
  savingDiscussion.value = true;
  try {
    await $fetch('/api/team-hub/discussions', {
      method: 'POST',
      body: newDiscussionForm.value,
    });
    $toast.success('Diskusi berhasil dipublikasikan!');
    showCreateDiscussionModal.value = false;
    newDiscussionForm.value = { title: '', content: '', category: 'General', pinned: false };
    fetchDiscussions();
  } catch (e) {
    $toast.error('Gagal membuat diskusi');
  } finally {
    savingDiscussion.value = false;
  }
};

const postCommentSubmit = async () => {
  if (!newCommentContent.value.trim() || !selectedDiscussion.value) return;
  submittingComment.value = true;
  try {
    const res = await $fetch(`/api/team-hub/discussions/${selectedDiscussion.value.id}/comments`, {
      method: 'POST',
      body: { content: newCommentContent.value },
    });
    if (res?.data) {
      selectedDiscussion.value.comments.push(res.data);
      newCommentContent.value = '';
      $toast.success('Komentar terkirim');
      fetchDiscussions();
    }
  } catch (e) {
    $toast.error('Gagal mengirim komentar');
  } finally {
    submittingComment.value = false;
  }
};

// ── DOCS HANDLERS ───────────────────────────────────────────────────────────

const openDocDetail = (doc) => {
  selectedDoc.value = doc;
};

const openCreateDoc = () => {
  isEditingDoc.value = false;
  docForm.value = { id: null, title: '', content: '', category: 'Documentation' };
  showCreateDocModal.value = true;
};

const openEditDoc = (doc) => {
  isEditingDoc.value = true;
  docForm.value = { ...doc };
  showCreateDocModal.value = true;
};

const saveDocSubmit = async () => {
  if (!docForm.value.title || !docForm.value.content) return;
  savingDoc.value = true;
  try {
    if (isEditingDoc.value) {
      await $fetch(`/api/team-hub/docs/${docForm.value.id}`, {
        method: 'PUT',
        body: docForm.value,
      });
      $toast.success('Dokumen diperbarui');
    } else {
      await $fetch('/api/team-hub/docs', {
        method: 'POST',
        body: docForm.value,
      });
      $toast.success('Dokumen dibuat');
    }
    showCreateDocModal.value = false;
    if (selectedDoc.value && isEditingDoc.value) {
      selectedDoc.value = { ...selectedDoc.value, ...docForm.value };
    }
    fetchDocs();
  } catch (e) {
    $toast.error('Gagal menyimpan dokumen');
  } finally {
    savingDoc.value = false;
  }
};

// ── MY PROFILE HANDLERS ─────────────────────────────────────────────────────

const addProfileCustomLink = () => {
  myProfileForm.value.customLinks.push({ label: '', url: '', icon: 'mingcute:link-2-line' });
};

const removeProfileCustomLink = (idx) => {
  myProfileForm.value.customLinks.splice(idx, 1);
};

const handleProfilePhotoChange = (e) => {
  const file = e.target.files?.[0];
  if (file) {
    profilePhotoFile.value = file;
    profilePhotoPreview.value = URL.createObjectURL(file);
  }
};

const saveMyProfileSubmit = async () => {
  savingProfile.value = true;
  try {
    const formData = new FormData();
    Object.keys(myProfileForm.value).forEach(key => {
      if (key === 'customLinks') {
        const cleanLinks = myProfileForm.value.customLinks.filter(l => l.url && l.url.trim() !== '');
        formData.append('customLinks', JSON.stringify(cleanLinks));
      } else {
        formData.append(key, myProfileForm.value[key]);
      }
    });
    if (profilePhotoFile.value) {
      formData.append('photo', profilePhotoFile.value);
    }

    await $fetch('/api/team/my-profile', {
      method: 'PUT',
      body: formData,
    });
    $toast.success('Profil tim Anda berhasil diperbarui!');
    await fetchMyProfile();
  } catch (e) {
    $toast.error('Gagal memperbarui profil tim');
  } finally {
    savingProfile.value = false;
  }
};

const categoryBadgeClass = (cat) => {
  if (cat === 'Announcement' || cat === 'Pengumuman') return 'bg-error/10 text-error border-error/20';
  if (cat === 'Idea' || cat === 'Ide & Fitur') return 'bg-warning/10 text-warning border-warning/20';
  if (cat === 'Bug' || cat === 'Bug & Teknis') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (cat === 'API' || cat === 'Hardware') return 'bg-info/10 text-info border-info/20';
  return 'bg-primary/10 text-primary border-primary/20';
};
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto px-4 pb-16 text-left">
    <!-- Header Banner -->
    <div class="bg-gradient-to-br from-primary/20 via-base-200 to-base-100 p-6 sm:p-8 rounded-[2.5rem] border border-primary/20 shadow-xl relative overflow-hidden">
      <div class="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
            <Icon name="mingcute:group-fill" class="text-sm" />
            <span>Workspace Teams GASKAN</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Platform Diskusi & Dokumentasi Tim
          </h1>
          <p class="text-xs sm:text-sm text-base-content/60 max-w-xl">
            Pusat kolaborasi internal anggota tim GASKAN untuk diskusi fitur, catatan teknis, dan dokumentasi proyek.
          </p>
        </div>

        <div v-if="myTeamProfile" class="flex items-center gap-3 bg-base-100/80 backdrop-blur-md p-3 rounded-2xl border border-base-200 shrink-0">
          <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            <img v-if="myTeamProfile.photoUrl" :src="resolvePhoto(myTeamProfile.photoUrl)" class="w-full h-full object-cover" />
            <Icon v-else name="mingcute:user-4-fill" class="text-primary text-xl" />
          </div>
          <div class="text-left min-w-0">
            <p class="text-xs font-bold text-base-content truncate">{{ myTeamProfile.name }}</p>
            <p class="text-[10px] text-primary font-semibold truncate">{{ myTeamProfile.role }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-base-200 pb-2 overflow-x-auto">
      <button
        @click="activeTab = 'discussions'"
        :class="['btn btn-sm rounded-2xl gap-2 font-bold transition-all', activeTab === 'discussions' ? 'btn-primary shadow-md shadow-primary/20' : 'btn-ghost text-base-content/60']"
      >
        <Icon name="mingcute:chat-3-fill" class="text-lg" />
        <span>Diskusi Tim</span>
      </button>
      <button
        @click="activeTab = 'docs'"
        :class="['btn btn-sm rounded-2xl gap-2 font-bold transition-all', activeTab === 'docs' ? 'btn-primary shadow-md shadow-primary/20' : 'btn-ghost text-base-content/60']"
      >
        <Icon name="mingcute:book-2-fill" class="text-lg" />
        <span>Dokumentasi Tim</span>
      </button>
      <button
        v-if="myTeamProfile"
        @click="activeTab = 'profile'"
        :class="['btn btn-sm rounded-2xl gap-2 font-bold transition-all ml-auto', activeTab === 'profile' ? 'btn-primary shadow-md shadow-primary/20' : 'btn-ghost text-base-content/60']"
      >
        <Icon name="mingcute:user-setting-fill" class="text-lg" />
        <span>Profil Saya</span>
      </button>
    </div>

    <!-- ── TAB 1: DISKUSI TIM ── -->
    <div v-if="activeTab === 'discussions'" class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Category Filters -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            v-for="cat in ['', 'General', 'Announcement', 'Idea', 'Bug']"
            :key="cat"
            @click="discussionCategory = cat; fetchDiscussions()"
            :class="['btn btn-xs rounded-xl font-bold', discussionCategory === cat ? 'btn-primary' : 'btn-base-200/60 text-base-content/60']"
          >
            {{ cat === '' ? 'Semua' : cat }}
          </button>
        </div>

        <button @click="showCreateDiscussionModal = true" class="btn btn-primary btn-sm rounded-2xl gap-2 font-bold shadow-md shadow-primary/20">
          <Icon name="mingcute:add-circle-fill" class="text-lg" />
          <span>Buat Diskusi</span>
        </button>
      </div>

      <!-- Discussions List -->
      <div v-if="loadingDiscussions" class="space-y-3">
        <div v-for="i in 3" :key="i" class="p-5 bg-base-100 rounded-3xl border border-base-200 animate-pulse space-y-3">
          <div class="h-4 w-1/3 skeleton"></div>
          <div class="h-3 w-2/3 skeleton"></div>
        </div>
      </div>

      <div v-else-if="discussions.length > 0" class="space-y-4">
        <div
          v-for="d in discussions"
          :key="d.id"
          @click="openDiscussionDetail(d)"
          class="p-5 sm:p-6 bg-base-100 rounded-3xl border border-base-200 hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 relative group"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span :class="['px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider', categoryBadgeClass(d.category)]">
                {{ d.category }}
              </span>
              <span v-if="d.pinned" class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Icon name="mingcute:pin-fill" /> Pinned
              </span>
            </div>
            <span class="text-[10px] opacity-40 font-semibold">
              {{ new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </span>
          </div>

          <h3 class="text-lg font-black text-base-content group-hover:text-primary transition-colors">
            {{ d.title }}
          </h3>

          <p class="text-xs text-base-content/70 line-clamp-2 leading-relaxed">
            {{ d.content }}
          </p>

          <div class="flex items-center justify-between pt-3 border-t border-base-200/60 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                <img v-if="d.author?.teamMember?.photoUrl || d.author?.photoUrl" :src="resolvePhoto(d.author?.teamMember?.photoUrl || d.author?.photoUrl)" class="w-full h-full object-cover" />
                <span v-else>{{ d.author?.name?.charAt(0) }}</span>
              </div>
              <span class="font-bold opacity-80">{{ d.author?.teamMember?.name || d.author?.name }}</span>
              <span class="text-[10px] opacity-40">• {{ d.author?.teamMember?.role || d.author?.role }}</span>
            </div>

            <div class="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-xl">
              <Icon name="mingcute:chat-1-line" />
              <span>{{ d._count?.comments || 0 }} Komentar</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-base-100 rounded-3xl border border-base-200 italic opacity-40 text-sm">
        Belum ada diskusi di kategori ini.
      </div>
    </div>

    <!-- ── TAB 2: DOKUMENTASI TIM ── -->
    <div v-if="activeTab === 'docs'" class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Category Filters -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            v-for="cat in ['', 'Documentation', 'API', 'Hardware', 'Workflow', 'Guide']"
            :key="cat"
            @click="docCategory = cat; fetchDocs()"
            :class="['btn btn-xs rounded-xl font-bold', docCategory === cat ? 'btn-primary' : 'btn-base-200/60 text-base-content/60']"
          >
            {{ cat === '' ? 'Semua' : cat }}
          </button>
        </div>

        <button @click="openCreateDoc" class="btn btn-primary btn-sm rounded-2xl gap-2 font-bold shadow-md shadow-primary/20">
          <Icon name="mingcute:add-circle-fill" class="text-lg" />
          <span>Buat Dokumen</span>
        </button>
      </div>

      <!-- Docs Grid -->
      <div v-if="loadingDocs" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="p-5 bg-base-100 rounded-3xl border border-base-200 animate-pulse space-y-3">
          <div class="h-4 w-1/2 skeleton"></div>
          <div class="h-10 w-full skeleton"></div>
        </div>
      </div>

      <div v-else-if="docs.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="doc in docs"
          :key="doc.id"
          @click="openDocDetail(doc)"
          class="p-5 sm:p-6 bg-base-100 rounded-3xl border border-base-200 hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
        >
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span :class="['px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider', categoryBadgeClass(doc.category)]">
                {{ doc.category }}
              </span>
              <button @click.stop="openEditDoc(doc)" class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="mingcute:edit-2-line" />
              </button>
            </div>

            <h3 class="text-lg font-black text-base-content group-hover:text-primary transition-colors">
              {{ doc.title }}
            </h3>

            <p class="text-xs text-base-content/70 line-clamp-3 leading-relaxed whitespace-pre-line">
              {{ doc.content }}
            </p>
          </div>

          <div class="pt-3 border-t border-base-200/60 flex items-center justify-between text-[11px] opacity-60">
            <span>Oleh: {{ doc.author?.teamMember?.name || doc.author?.name }}</span>
            <span>{{ new Date(doc.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}</span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 bg-base-100 rounded-3xl border border-base-200 italic opacity-40 text-sm">
        Belum ada dokumentasi tim.
      </div>
    </div>

    <!-- ── TAB 3: PROFIL TIM SAYA ── -->
    <div v-if="activeTab === 'profile' && myTeamProfile" class="bg-base-100 p-6 sm:p-8 rounded-[2.5rem] border border-base-200 shadow-sm max-w-3xl mx-auto space-y-6">
      <div class="border-b border-base-200 pb-4">
        <h2 class="text-xl font-black text-base-content">Pengaturan Profil Tim Saya</h2>
        <p class="text-xs text-base-content/60 mt-0.5">Kelola informasi publik Anda yang tampil pada halaman Tim GASKAN.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control md:col-span-2">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Foto Profil Tim</span></label>
          <div class="flex items-center gap-4 p-4 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <div class="w-20 h-20 rounded-2xl bg-base-300 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="profilePhotoPreview" :src="resolvePhoto(profilePhotoPreview)" class="w-full h-full object-cover" />
              <Icon v-else name="mingcute:user-4-fill" size="24" class="opacity-20" />
            </div>
            <div class="flex-1">
              <input type="file" accept="image/*" @change="handleProfilePhotoChange" class="file-input file-input-bordered file-input-primary file-input-sm w-full rounded-xl text-xs" />
              <p class="text-[9px] mt-2 opacity-40">Pilih foto diri berkualitas (Max 5MB)</p>
            </div>
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Nama Tampilan</span></label>
          <input v-model="myProfileForm.name" type="text" class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Peran / Sub-Role</span></label>
          <input v-model="myProfileForm.role" type="text" class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <div class="form-control md:col-span-2">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Bio Singkat</span></label>
          <textarea v-model="myProfileForm.bio" rows="2" placeholder="Bio atau kata-kata motivasi singkat..." class="textarea textarea-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">GitHub URL</span></label>
          <input v-model="myProfileForm.github" type="text" placeholder="https://github.com/..." class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">LinkedIn URL</span></label>
          <input v-model="myProfileForm.linkedin" type="text" placeholder="https://linkedin.com/in/..." class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Instagram URL</span></label>
          <input v-model="myProfileForm.instagram" type="text" placeholder="https://instagram.com/..." class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Email Kontak</span></label>
          <input v-model="myProfileForm.email" type="email" placeholder="email@example.com" class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
        </div>

        <!-- Custom Links -->
        <div class="form-control md:col-span-2 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[10px] uppercase tracking-widest opacity-40">Tautan Custom</span>
            <button type="button" @click="addProfileCustomLink" class="btn btn-xs btn-primary rounded-xl gap-1">
              <Icon name="mingcute:add-line" />
              <span>Tambah Link</span>
            </button>
          </div>
          <div class="space-y-2 bg-base-200/20 p-3 rounded-2xl border border-base-200/60">
            <div v-for="(link, idx) in myProfileForm.customLinks" :key="idx" class="flex items-center gap-2">
              <input v-model="link.label" type="text" placeholder="Label (ex: Blog)" class="input input-bordered input-sm rounded-xl bg-base-100 flex-1 text-xs" />
              <input v-model="link.url" type="text" placeholder="URL (ex: https://...)" class="input input-bordered input-sm rounded-xl bg-base-100 flex-1 text-xs" />
              <button type="button" @click="removeProfileCustomLink(idx)" class="btn btn-ghost btn-xs text-error btn-circle">
                <Icon name="mingcute:delete-2-line" />
              </button>
            </div>
            <div v-if="myProfileForm.customLinks.length === 0" class="text-xs opacity-40 italic text-center py-2">
              Belum ada tautan custom
            </div>
          </div>
        </div>
      </div>

      <div class="pt-4 flex justify-end">
        <button @click="saveMyProfileSubmit" class="btn btn-primary rounded-2xl px-8 font-bold shadow-lg shadow-primary/20" :disabled="savingProfile">
          <span v-if="savingProfile" class="loading loading-spinner loading-xs"></span>
          <span>Simpan Profil</span>
        </button>
      </div>
    </div>

    <!-- ── MODALS ── -->

    <!-- Modal Create Discussion -->
    <dialog :class="['modal modal-bottom sm:modal-middle', showCreateDiscussionModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-w-lg">
        <h3 class="text-xl font-black text-base-content mb-4">Buat Diskusi Baru</h3>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-40">Judul Diskusi</span></label>
            <input v-model="newDiscussionForm.title" type="text" placeholder="Judul topik diskusi..." class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-40">Kategori</span></label>
            <select v-model="newDiscussionForm.category" class="select select-bordered w-full rounded-2xl bg-base-200/30 text-xs font-semibold">
              <option value="General">General</option>
              <option value="Announcement">Pengumuman (Announcement)</option>
              <option value="Idea">Ide & Fitur Baru (Idea)</option>
              <option value="Bug">Bug & Teknis (Bug)</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-40">Isi Diskusi</span></label>
            <textarea v-model="newDiscussionForm.content" rows="4" placeholder="Tulis rincian diskusi di sini..." class="textarea textarea-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
          </div>
        </div>

        <div class="modal-action mt-6">
          <button @click="showCreateDiscussionModal = false" class="btn btn-ghost rounded-2xl">Batal</button>
          <button @click="createDiscussionSubmit" class="btn btn-primary rounded-2xl font-bold px-6" :disabled="savingDiscussion">
            <span v-if="savingDiscussion" class="loading loading-spinner loading-xs"></span>
            <span>Kirim Diskusi</span>
          </button>
        </div>
      </div>
    </dialog>

    <!-- Modal Discussion Detail & Comments -->
    <dialog :class="['modal modal-bottom sm:modal-middle', selectedDiscussion ? 'modal-open' : '']">
      <div v-if="selectedDiscussion" class="modal-box bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-w-2xl max-h-[85vh] overflow-y-auto space-y-6">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <span :class="['px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase', categoryBadgeClass(selectedDiscussion.category)]">
              {{ selectedDiscussion.category }}
            </span>
            <h2 class="text-xl font-black text-base-content leading-tight">{{ selectedDiscussion.title }}</h2>
          </div>
          <button @click="selectedDiscussion = null" class="btn btn-sm btn-circle btn-ghost">
            <Icon name="mingcute:close-line" class="text-xl" />
          </button>
        </div>

        <div class="p-4 rounded-2xl bg-base-200/40 border border-base-200 text-xs text-base-content/90 leading-relaxed whitespace-pre-line">
          {{ selectedDiscussion.content }}
        </div>

        <!-- Comments List -->
        <div class="space-y-4 pt-2 border-t border-base-200">
          <h4 class="font-bold text-sm text-base-content flex items-center gap-2">
            <Icon name="mingcute:chat-1-fill" class="text-primary" />
            <span>Komentar ({{ selectedDiscussion.comments?.length || 0 }})</span>
          </h4>

          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            <div v-for="c in selectedDiscussion.comments" :key="c.id" class="p-3.5 rounded-2xl bg-base-200/50 border border-base-200/80 space-y-1">
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-bold text-primary">{{ c.author?.teamMember?.name || c.author?.name }}</span>
                <span class="opacity-40">{{ new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <p class="text-xs opacity-80 leading-normal">{{ c.content }}</p>
            </div>
            <div v-if="!selectedDiscussion.comments || selectedDiscussion.comments.length === 0" class="text-xs opacity-40 italic text-center py-4">
              Belum ada komentar. Jadilah yang pertama memberikan masukan!
            </div>
          </div>

          <!-- Add Comment Input -->
          <div class="flex items-center gap-2 pt-2">
            <input v-model="newCommentContent" type="text" placeholder="Tulis komentar..." class="input input-bordered input-sm w-full rounded-xl bg-base-200/40 text-xs" @keyup.enter="postCommentSubmit" />
            <button @click="postCommentSubmit" class="btn btn-primary btn-sm rounded-xl px-4 font-bold" :disabled="submittingComment || !newCommentContent.trim()">
              <span>Kirim</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>

    <!-- Modal Create / Edit Doc -->
    <dialog :class="['modal modal-bottom sm:modal-middle', showCreateDocModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-w-lg">
        <h3 class="text-xl font-black text-base-content mb-4">{{ isEditingDoc ? 'Edit Dokumen' : 'Buat Dokumen Baru' }}</h3>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-40">Judul Dokumen</span></label>
            <input v-model="docForm.title" type="text" placeholder="Judul panduan / dokumentasi..." class="input input-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-40">Kategori</span></label>
            <select v-model="docForm.category" class="select select-bordered w-full rounded-2xl bg-base-200/30 text-xs font-semibold">
              <option value="Documentation">Documentation</option>
              <option value="API">API Reference</option>
              <option value="Hardware">Hardware Setup</option>
              <option value="Workflow">Workflow & Rules</option>
              <option value="Guide">User Guide</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text font-bold text-[10px] uppercase opacity-40">Isi / Content Dokumen</span></label>
            <textarea v-model="docForm.content" rows="6" placeholder="Tulis isi panduan teknis..." class="textarea textarea-bordered w-full rounded-2xl bg-base-200/30 text-xs" />
          </div>
        </div>

        <div class="modal-action mt-6">
          <button @click="showCreateDocModal = false" class="btn btn-ghost rounded-2xl">Batal</button>
          <button @click="saveDocSubmit" class="btn btn-primary rounded-2xl font-bold px-6" :disabled="savingDoc">
            <span v-if="savingDoc" class="loading loading-spinner loading-xs"></span>
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </dialog>

    <!-- Modal View Doc -->
    <dialog :class="['modal modal-bottom sm:modal-middle', selectedDoc ? 'modal-open' : '']">
      <div v-if="selectedDoc" class="modal-box bg-base-100 border border-base-200 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 max-w-2xl max-h-[85vh] overflow-y-auto space-y-4">
        <div class="flex items-start justify-between gap-4 border-b border-base-200 pb-3">
          <div>
            <span :class="['px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase', categoryBadgeClass(selectedDoc.category)]">
              {{ selectedDoc.category }}
            </span>
            <h2 class="text-2xl font-black text-base-content mt-1">{{ selectedDoc.title }}</h2>
          </div>
          <button @click="selectedDoc = null" class="btn btn-sm btn-circle btn-ghost">
            <Icon name="mingcute:close-line" class="text-xl" />
          </button>
        </div>

        <div class="prose prose-sm max-w-none text-xs text-base-content/90 leading-relaxed whitespace-pre-line py-2">
          {{ selectedDoc.content }}
        </div>

        <div class="pt-4 border-t border-base-200 flex items-center justify-between text-xs opacity-60">
          <span>Penulis: {{ selectedDoc.author?.teamMember?.name || selectedDoc.author?.name }}</span>
          <button @click="openEditDoc(selectedDoc); selectedDoc = null" class="btn btn-ghost btn-xs text-primary font-bold">
            <Icon name="mingcute:edit-2-line" /> Edit Dokumen
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
