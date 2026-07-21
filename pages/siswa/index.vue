<script setup>
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { useAuthStore } from '~/store/useAuthStore';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { userData: currentUser } = storeToRefs(authStore);

const route = useRoute();
const users = ref([]);
const selectedClass = ref('');
const searchQuery = ref('');
const filterStatus = ref('AKTIF'); // New: Default to active
const filterMajor = ref(''); // New
const sortBy = ref('name-asc'); // New

const classOptions = ref([]);
const classes = ref([]);
const majors = ref([]); // New: Distinct majors
const showAddModal = ref(false);
const showAdvanceFilters = ref(false); // New: Toggle
const saving = ref(false);
const { $toast } = useNuxtApp();

const filterPhoto = ref('ALL');
const filterDeviceSync = ref('ALL');

const form = ref({
  name: '',
  nis: '',
  nisn: '',
  classId: '',
  password: '',
  email: '',
  phone: '',
  gender: '',
  religion: '',
  birthDate: '',
  birthPlace: '',
  address: '',
  vehiclePlate: '',
  status: 'AKTIF'
});

const isEditing = ref(false);
const editingId = ref(null);
const showDeleteModal = ref(false);
const studentToDelete = ref(null);

const showRegisterDeviceModal = ref(false);
const studentToRegister = ref(null);
const selectedDeviceForRegister = ref('ALL');
const activeDevices = ref([]);
const registeringState = ref(false);

const isBulkRegister = ref(false);
const selectedStudents = ref([]);
const studentPhotoUploading = ref(false);

const syncFinished = ref(false);
const syncProgress = ref({
  total: 0,
  current: 0,
  percentage: 0,
  currentStudent: '',
  currentDevice: '',
  logs: []
});

const closeSyncModal = () => {
  showRegisterDeviceModal.value = false;
  syncFinished.value = false;
  selectedStudents.value = [];
  isBulkRegister.value = false;
};

const showBulkDeleteModal = ref(false);
const openBulkDeleteConfirm = () => { showBulkDeleteModal.value = true; };
const confirmBulkDelete = async () => {
  try {
    const res = await $fetch('/api/students/bulk', {
      method: 'DELETE',
      body: { studentIds: selectedStudents.value }
    });
    if (res?.success) {
      $toast.success(res.message || 'Siswa berhasil dihapus');
      selectedStudents.value = [];
      showBulkDeleteModal.value = false;
      refresh();
    }
  } catch (e) {
    console.error('Bulk delete failed:', e);
    $toast.error(e.data?.message || 'Gagal menghapus siswa secara massal');
  }
};

const toggleSelectStudent = (id) => {
  const idx = selectedStudents.value.indexOf(id);
  if (idx > -1) {
    selectedStudents.value.splice(idx, 1);
  } else {
    selectedStudents.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (selectedStudents.value.length === paginatedUsers.value.length) {
    selectedStudents.value = [];
  } else {
    selectedStudents.value = paginatedUsers.value.map(u => u.id);
  }
};

const openRegisterDeviceModal = async (student) => {
  isBulkRegister.value = false;
  studentToRegister.value = student;
  selectedDeviceForRegister.value = 'ALL';
  showRegisterDeviceModal.value = true;
  syncFinished.value = false;
  
  try {
    const res = await $fetch('/api/device');
    activeDevices.value = (res?.data || []).filter(d => d.isActive);
  } catch (e) {
    console.error('Gagal mengambil daftar perangkat:', e);
  }
};

const openBulkRegisterModal = async () => {
  isBulkRegister.value = true;
  studentToRegister.value = null;
  selectedDeviceForRegister.value = 'ALL';
  showRegisterDeviceModal.value = true;
  syncFinished.value = false;
  
  try {
    const res = await $fetch('/api/device');
    activeDevices.value = (res?.data || []).filter(d => d.isActive);
  } catch (e) {
    console.error('Gagal mengambil daftar perangkat:', e);
  }
};

const onStudentPhotoSelected = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    $toast.error('Ukuran file foto maksimal adalah 2MB!');
    return;
  }
  
  studentPhotoUploading.value = true;
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    const res = await $fetch(`/api/students/${studentToRegister.value.id}/photo`, {
      method: 'POST',
      body: formData
    });
    if (res.success) {
      studentToRegister.value.photoUrl = res.photoUrl;
      $toast.success('Foto profil siswa berhasil diperbarui!');
    }
  } catch (err) {
    console.error('Failed to upload student photo:', err);
    $toast.error(err.data?.message || 'Gagal mengunggah foto');
  } finally {
    studentPhotoUploading.value = false;
  }
};

const handleRegisterToDevice = async () => {
  const devicesToSync = selectedDeviceForRegister.value === 'ALL'
    ? activeDevices.value
    : activeDevices.value.filter(d => d.id === selectedDeviceForRegister.value);
    
  if (devicesToSync.length === 0) {
    $toast.error('Tidak ada perangkat aktif yang dipilih');
    return;
  }
  
  registeringState.value = true;
  syncFinished.value = false;
  let successCount = 0;
  let failCount = 0;
  let lastMessage = '';

  if (isBulkRegister.value) {
    const nuxtApp = useNuxtApp();
    const socket = nuxtApp.$socket;
    const socketId = socket?.id;

    syncProgress.value = {
      total: selectedStudents.value.length * devicesToSync.length,
      current: 0,
      percentage: 0,
      currentStudent: '',
      currentDevice: '',
      logs: []
    };

    let completedDevicesCount = 0;

    const onProgress = (data) => {
      const deviceIndex = devicesToSync.findIndex(d => d.id === data.deviceId);
      if (deviceIndex > -1) {
        const globalCurrent = (deviceIndex * selectedStudents.value.length) + data.current;
        syncProgress.value.current = globalCurrent;
        syncProgress.value.percentage = Math.round((globalCurrent / syncProgress.value.total) * 100);
      }
      
      const device = devicesToSync.find(d => d.id === data.deviceId);
      const deviceName = device ? device.name : 'Mesin';
      
      syncProgress.value.currentStudent = data.studentName;
      syncProgress.value.currentDevice = deviceName;
      
      if (data.status === 'success' || data.status === 'failed') {
        const isSuccess = data.status === 'success';
        const logMsg = isSuccess
          ? `[OK] ${data.studentName} -> ${deviceName}: ${data.message || 'Selesai'}`
          : `[GAGAL] ${data.studentName} -> ${deviceName}: ${data.message || 'Error'}`;
        
        syncProgress.value.logs.push({
          id: `${data.deviceId}-${data.studentId}-${Date.now()}-${Math.random()}`,
          text: logMsg,
          success: isSuccess
        });
        
        nextTick(() => {
          const container = document.getElementById('sync-logs-container');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      }
    };

    const onFinished = (data) => {
      completedDevicesCount++;
      if (completedDevicesCount >= devicesToSync.length) {
        if (socket) {
          socket.off('bulk-sync-progress', onProgress);
          socket.off('bulk-sync-finished', onFinished);
        }
        registeringState.value = false;
        syncFinished.value = true;
        $toast.success(`Sinkronisasi massal selesai.`);
        refresh();
      }
    };

    if (socket) {
      socket.on('bulk-sync-progress', onProgress);
      socket.on('bulk-sync-finished', onFinished);
    }

    for (const device of devicesToSync) {
      try {
        await $fetch('/api/students/bulk-register-device', {
          method: 'POST',
          body: {
            studentIds: selectedStudents.value,
            deviceId: device.id,
            socketId: socketId
          }
        });
      } catch (e) {
        console.error(`Gagal memulai sinkronisasi untuk mesin ${device.name}:`, e);
        completedDevicesCount++;
        syncProgress.value.logs.push({
          id: `fail-${device.id}-${Date.now()}`,
          text: `[GAGAL] Gagal memulai sinkronisasi di mesin ${device.name}`,
          success: false
        });
        if (completedDevicesCount >= devicesToSync.length) {
          if (socket) {
            socket.off('bulk-sync-progress', onProgress);
            socket.off('bulk-sync-finished', onFinished);
          }
          registeringState.value = false;
          syncFinished.value = true;
          refresh();
        }
      }
    }
    return;
  }
  
  // Single registration
  if (!studentToRegister.value) return;
  for (const device of devicesToSync) {
    try {
      const res = await $fetch(`/api/students/${studentToRegister.value.id}/register-device`, {
        method: 'POST',
        body: { deviceId: device.id }
      });
      if (res?.success) {
        successCount++;
        lastMessage = res.message;
      } else {
        failCount++;
      }
    } catch (e) {
      failCount++;
      console.error(`Gagal daftarkan ke mesin ${device.name}:`, e);
    }
  }
  
  registeringState.value = false;
  showRegisterDeviceModal.value = false;
  
  if (failCount === 0) {
    $toast.success(lastMessage || `Berhasil mendaftarkan siswa ke ${successCount} mesin!`);
  } else if (successCount > 0) {
    $toast.warning(`Berhasil di ${successCount} mesin, gagal di ${failCount} mesin.`);
  } else {
    $toast.error('Gagal mendaftarkan siswa ke mesin absensi.');
  }
  refresh();
};

const handleUnregisterFromDevice = async () => {
  const devicesToSync = selectedDeviceForRegister.value === 'ALL'
    ? activeDevices.value
    : activeDevices.value.filter(d => d.id === selectedDeviceForRegister.value);
    
  if (devicesToSync.length === 0) {
    $toast.error('Tidak ada perangkat aktif yang dipilih');
    return;
  }
  
  registeringState.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const device of devicesToSync) {
    try {
      const res = await $fetch(`/api/students/${studentToRegister.value.id}/unregister-device`, {
        method: 'POST',
        body: { deviceId: device.id }
      });
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.error(err);
      failCount++;
    }
  }

  registeringState.value = false;
  if (successCount > 0) {
    $toast.success(`Sinkronisasi berhasil dihapus dari ${successCount} perangkat`);
    showRegisterDeviceModal.value = false;
    refresh();
  } else {
    $toast.error('Gagal menghapus sinkronisasi dari perangkat');
  }
};

const showFaceUploadOptions = ref(false);
const showCameraModal = ref(false);
const videoStream = ref(null);
const videoRef = ref(null);
const showFaceCropper = ref(false);
const rawFaceImage = ref(null);
const faceCropperRef = ref(null);
const isUploadingFace = ref(false);

const startCamera = async () => {
  showFaceUploadOptions.value = false;
  showCameraModal.value = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 }
    });
    videoStream.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error(err);
    $toast.error('Tidak dapat mengakses kamera!');
    closeCamera();
  }
};

const closeCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop());
    videoStream.value = null;
  }
  showCameraModal.value = false;
};

const capturePhoto = () => {
  if (videoRef.value) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value.videoWidth || 640;
    canvas.height = videoRef.value.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    rawFaceImage.value = dataUrl;
    closeCamera();
    showFaceCropper.value = true;
  }
};

const onFaceFileSelect = (e) => {
  const files = e.target.files;
  if (files && files[0]) {
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      $toast.error('Ukuran file foto maksimal adalah 5MB!');
      return;
    }
    showFaceUploadOptions.value = false;
    const reader = new FileReader();
    reader.onload = (event) => {
      rawFaceImage.value = event.target.result;
      showFaceCropper.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const detectFaceInBrowser = (imageSrc) => {
  return new Promise((resolve) => {
    if (typeof window.pico === 'undefined') {
      const script = document.createElement('script');
      script.src = '/pico.js';
      script.onload = () => runDetection(imageSrc, resolve);
      script.onerror = () => {
        console.error('Failed to load pico.js');
        resolve(true);
      };
      document.head.appendChild(script);
    } else {
      runDetection(imageSrc, resolve);
    }
  });
};

const runDetection = async (imageSrc, resolve) => {
  try {
    const cascadeResponse = await fetch('/facefinder');
    const cascadeBuffer = await cascadeResponse.arrayBuffer();
    const cascadeBytes = new Uint8Array(cascadeBuffer);
    const classifyRegion = window.pico.unpack_cascade(cascadeBytes);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 360;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h).data;

      const rgbaToGray = (rgba, nrows, ncols) => {
        const gray = new Uint8Array(nrows * ncols);
        for (let r = 0; r < nrows; r++) {
          for (let c = 0; c < ncols; c++) {
            const idx = 4 * (r * ncols + c);
            gray[r * ncols + c] = 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
          }
        }
        return gray;
      };

      const pixels = rgbaToGray(imgData, h, w);
      const imageDesc = {
        pixels: pixels,
        nrows: h,
        ncols: w,
        ldim: w,
      };

      const params = {
        shiftfactor: 0.1,
        minsize: 20,
        maxsize: 1000,
        scalefactor: 1.1,
      };

      let dets = window.pico.run_cascade(imageDesc, classifyRegion, params);
      dets = window.pico.cluster_detections(dets, 0.2);

      const detected = dets.some((d) => d[3] > 4.5);
      console.log('Pico.js detection score:', dets.map(d => d[3]));
      resolve(detected);
    };
    img.onerror = () => resolve(true);
  } catch (error) {
    console.error('Face detection error:', error);
    resolve(true);
  }
};

const uploadFacePhoto = async () => {
  const { canvas } = faceCropperRef.value.getResult();
  if (!canvas) return;

  isUploadingFace.value = true;
  try {
    const fileDataUrl = canvas.toDataURL('image/jpeg');
    
    const faceDetected = await detectFaceInBrowser(fileDataUrl);
    if (!faceDetected) {
      $toast.error('Wajah tidak terdeteksi pada area potongan! Pastikan wajah masuk ke dalam panduan lingkaran.');
      isUploadingFace.value = false;
      return;
    }

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('photo', blob, 'face.jpg');

      try {
        const res = await $fetch(`/api/students/${studentToRegister.value.id}/photo`, {
          method: 'POST',
          body: formData,
        });

        if (res.success) {
          showFaceCropper.value = false;
          rawFaceImage.value = null;
          
          studentToRegister.value.photoUrl = res.photoUrl;
          
          refresh();
          $toast.success('Foto wajah absensi berhasil diperbarui');
        }
      } catch (error) {
        $toast.error(error.data?.statusMessage || 'Gagal mengunggah foto wajah');
      } finally {
        isUploadingFace.value = false;
      }
    }, 'image/jpeg');
  } catch (err) {
    console.error(err);
    $toast.error('Gagal memproses gambar');
    isUploadingFace.value = false;
  }
};

const cancelFaceCrop = () => {
  showFaceCropper.value = false;
  rawFaceImage.value = null;
};

const classSearch = ref('');
const showClassDropdown = ref(false);

const filteredClassesForSelect = computed(() => {
  if (!classSearch.value) return classes.value;
  return classes.value.filter(c => 
    c.className.toLowerCase().includes(classSearch.value.toLowerCase())
  );
});

const selectClass = (c) => {
  form.value.classId = c.id;
  classSearch.value = c.className;
  showClassDropdown.value = false;
};

// Toggle dropdown and focus search
const toggleClassDropdown = () => {
  showClassDropdown.value = !showClassDropdown.value;
  if (showClassDropdown.value) {
    classSearch.value = '';
  }
};

const currentPage = ref(1);
const itemsPerPage = ref(15); // Show 15 students per page

const { data, refresh, pending } = useFetch(`/api/students`, {
  query: computed(() => ({ 
    status: filterStatus.value === 'ALL' ? 'ALL' : filterStatus.value, 
    limit: itemsPerPage.value,
    page: currentPage.value,
    search: searchQuery.value,
    classId: classes.value.find(c => c.className === selectedClass.value)?.id,
    major: filterMajor.value,
    sortBy: sortBy.value,
    filterPhoto: filterPhoto.value,
    filterDeviceSync: filterDeviceSync.value
  })),
  watch: [searchQuery, selectedClass, filterStatus, filterMajor, sortBy, filterPhoto, filterDeviceSync, currentPage],
  key: 'student-list'
});

const totalPages = computed(() => {
  const rawData = toValue(data);
  if (!rawData?.pagination) return 0;
  return Math.ceil(rawData.pagination.total / itemsPerPage.value);
});

const totalCount = computed(() => {
  const rawData = toValue(data);
  return rawData?.pagination?.total || 0;
});

const paginatedUsers = computed(() => {
  const rawData = toValue(data);
  return Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
});

// Reset page to 1 when filters change
watch([searchQuery, selectedClass, filterStatus, filterMajor, sortBy, filterPhoto, filterDeviceSync], () => {
  currentPage.value = 1;
});

const fetchClasses = async () => {
  try {
    const res = await $fetch('/api/classes');
    classes.value = res?.data || [];
  } catch (err) {
    console.error('Failed to fetch classes:', err);
  }
};

const openAddModal = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = { 
    name: '', nis: '', nisn: '', classId: '', password: '',
    email: '', phone: '', gender: '', religion: '', birthDate: '', birthPlace: '', address: '', vehiclePlate: '', status: 'AKTIF'
  };
  showAddModal.value = true;
};

const openEditModal = (user) => {
  isEditing.value = true;
  editingId.value = user.id;
  form.value = {
    name: user.name,
    nis: user.nis,
    nisn: user.nisn || '',
    classId: user.classId,
    password: '', // Don't show password
    email: user.email || '',
    phone: user.phone || '',
    gender: user.gender || '',
    religion: user.religion || '',
    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
    birthPlace: user.birthPlace || '',
    address: user.address || '',
    vehiclePlate: user.vehiclePlate || '',
    status: user.status || 'AKTIF'
  };
  classSearch.value = user.class?.className || '';
  showAddModal.value = true;
};

const saveStudent = async () => {
  if (!form.value.name || !form.value.nis || !form.value.classId) {
    $toast.error('Nama, NIS, dan Kelas wajib diisi');
    return;
  }
  if (form.value.nisn && form.value.nisn.length !== 10) {
    $toast.error('NISN harus 10 digit');
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      await $fetch(`/api/students/${editingId.value}`, {
        method: 'PUT',
        body: form.value
      });
      $toast.success('Data siswa berhasil diperbarui');
    } else {
      await $fetch(`/api/students`, {
        method: 'POST',
        body: form.value
      });
      $toast.success('Siswa berhasil ditambahkan');
    }
    
    showAddModal.value = false;
    searchQuery.value = '';
    refresh();
  } catch (err) {
    console.error('Failed to save student:', err);
    $toast.error(err.data?.message || 'Gagal menyimpan data siswa');
  } finally {
    saving.value = false;
  }
};

const deleteStudent = (student) => {
  studentToDelete.value = student;
  showDeleteModal.value = true;
};

const confirmDeleteStudent = async () => {
  if (!studentToDelete.value) return;
  
  try {
    await $fetch(`/api/students/${studentToDelete.value.id}`, { method: 'DELETE' });
    $toast.success(`Siswa ${studentToDelete.value.name} berhasil dihapus`);
    showDeleteModal.value = false;
    studentToDelete.value = null;
    refresh();
  } catch (err) {
    $toast.error('Gagal menghapus siswa');
  }
};

// Update majors when data changes
watch(data, (newData) => {
  const rawData = toValue(newData);
  const list = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
  majors.value = [...new Set(list.map(user => user.class?.major?.name).filter(Boolean))].sort();
}, { immediate: true });

// Update classOptions from all database classes
watch(classes, (newClasses) => {
  classOptions.value = [...new Set(newClasses.map(c => c.className).filter(Boolean))].sort();
}, { immediate: true });

onMounted(async () => {
  await fetchClasses();
  
  // Handle classId from query params
  if (route.query.classId) {
    const targetClass = classes.value.find(c => c.id === route.query.classId);
    if (targetClass) {
      selectedClass.value = targetClass.className;
    }
  }
});

useSeoMeta({
  title: 'Daftar Siswa | GASKAN',
  ogTitle: 'Daftar Siswa | GASKAN',
  description: 'Gerbang Akses Pintar dan Kehadiran',
  image: '/banner.webp',
  url: 'https://gaskan.smtijogja.sch.id/siswa',
  site_name: 'GASKAN',
  ogUrl: 'https://gaskan.smtijogja.sch.id/siswa',
  ogDescription: 'Gerbang Akses Pintar dan Kehadiran',
  ogImage: '/banner.webp',
  ogType: 'website',
  ogSiteName: 'GASKAN',
  ogLocale: 'id_ID',

  twitterCard: 'summary_large_image',
  twitterTitle: `Daftar Siswa | GASKAN`,
  twitterDescription: `Gerbang Akses Pintar dan Kehadiran`,
  twitterImage: '/banner.webp',
  twitterUrl: `https://gaskan.smtijogja.sch.id/siswa`,
})
</script>

<template>
  <div class="px-4 pb-12 max-w-7xl mx-auto py-6">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div>
        <h1 class="text-4xl font-black tracking-tight text-base-content mb-3">Daftar Siswa</h1>
        <p class="text-base-content/60 text-base">Kelola dan lihat direktori data siswa secara menyeluruh</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button @click="refresh" class="btn btn-ghost btn-circle rounded-2xl border-base-200 bg-base-100 shadow-sm" :class="{ 'animate-spin': pending }">
          <Icon name="mingcute:refresh-3-line" size="20" />
        </button>
        <NuxtLink to="/siswa/import" class="btn btn-ghost bg-base-100 rounded-2xl gap-2 border-base-200 shadow-sm">
          <Icon name="mingcute:file-import-line" size="20" />
          Import Excel
        </NuxtLink>
        <NuxtLink to="/siswa/import-foto" class="btn btn-ghost bg-base-100 rounded-2xl gap-2 border-base-200 shadow-sm">
          <Icon name="mingcute:pic-line" size="20" />
          Bulk Upload Foto
        </NuxtLink>
        <NuxtLink to="/admin/system-manage" class="btn btn-ghost bg-base-100 rounded-2xl gap-2 border-base-200 shadow-sm" title="Pengaturan Izin Profil Siswa">
          <Icon name="mingcute:user-setting-line" size="20" class="text-primary" />
          Izin Profil
        </NuxtLink>
        <button @click="openAddModal" class="btn btn-primary rounded-2xl gap-2 shadow-lg shadow-primary/20">

          <Icon name="mingcute:user-add-fill" size="20" />
          Tambah Siswa
        </button>
      </div>
    </div>


    <!-- Filters Section -->
    <div class="space-y-4 mb-8">
      <div class="flex flex-col lg:flex-row gap-4 bg-base-100 p-4 rounded-3xl border border-base-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative z-20">
        <!-- Search input -->
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon name="mingcute:search-line" size="20" class="text-base-content/40" />
          </div>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari nama, NIS, atau NISN..." 
            class="input input-bordered w-full pl-11 bg-base-200/50 focus:bg-base-100 focus:border-primary border-transparent rounded-2xl transition-all font-medium"
          >
        </div>
        
        <div class="flex flex-wrap gap-3">
          <!-- Class Select -->
          <div class="relative flex-1 sm:flex-none sm:w-48">
            <Icon name="mingcute:filter-2-line" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30 z-10" />
            <select v-model="selectedClass" class="select select-bordered w-full pl-11 bg-base-200/50 border-transparent rounded-2xl font-bold">
              <option value="">Semua Kelas</option>
              <option v-for="option in classOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>

          <!-- Advance Toggle -->
          <button 
            @click="showAdvanceFilters = !showAdvanceFilters"
            :class="['btn rounded-2xl gap-2 border-base-200 transition-all', showAdvanceFilters ? 'btn-primary' : 'btn-ghost bg-base-200/50']"
          >
            <Icon :name="showAdvanceFilters ? 'mingcute:settings-6-fill' : 'mingcute:settings-6-line'" size="18" />
            <span class="hidden sm:inline">Filter Lanjutan</span>
          </button>
        </div>
      </div>

      <!-- Advance Filter Panel -->
      <Transition 
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="showAdvanceFilters" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 bg-base-200/30 p-5 rounded-3xl border border-base-200/60 shadow-inner">
          <!-- Status Filter -->
          <div class="form-control">
            <label class="label pt-0"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Status Keaktifan</span></label>
            <select v-model="filterStatus" class="select select-bordered select-sm rounded-xl bg-base-100 font-bold h-11">
              <option value="AKTIF">AKTIF (Normal)</option>
              <option value="NONAKTIF">NONAKTIF (Alumni/Keluar)</option>
              <option value="ALL">SEMUA STATUS</option>
            </select>
          </div>

          <!-- Major Filter -->
          <div class="form-control">
            <label class="label pt-0"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Filter Jurusan</span></label>
            <select v-model="filterMajor" class="select select-bordered select-sm rounded-xl bg-base-100 font-bold h-11">
              <option value="">Semua Jurusan</option>
              <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <!-- Photo Filter -->
          <div class="form-control">
            <label class="label pt-0"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Foto Profil / Wajah</span></label>
            <select v-model="filterPhoto" class="select select-bordered select-sm rounded-xl bg-base-100 font-bold h-11">
              <option value="ALL">Semua</option>
              <option value="WITH_PHOTO">Sudah Ada Foto</option>
              <option value="WITHOUT_PHOTO">Belum Ada Foto</option>
            </select>
          </div>

          <!-- Device Sync Filter -->
          <div class="form-control">
            <label class="label pt-0"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Status Sinkronisasi Alat</span></label>
            <select v-model="filterDeviceSync" class="select select-bordered select-sm rounded-xl bg-base-100 font-bold h-11">
              <option value="ALL">Semua</option>
              <option value="SYNCED">Sudah Sinkron</option>
              <option value="NOT_SYNCED">Belum Sinkron</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="form-control">
            <label class="label pt-0"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Urutkan Berdasarkan</span></label>
            <select v-model="sortBy" class="select select-bordered select-sm rounded-xl bg-base-100 font-bold h-11">
              <option value="name-asc">Nama (A - Z)</option>
              <option value="name-desc">Nama (Z - A)</option>
              <option value="newest">Data Terbaru</option>
            </select>
          </div>

          <!-- Reset Button -->
          <div class="flex items-end">
            <button @click="searchQuery = ''; selectedClass = ''; filterMajor = ''; filterStatus = 'AKTIF'; filterPhoto = 'ALL'; filterDeviceSync = 'ALL'; sortBy = 'name-asc'" class="btn btn-ghost btn-sm w-full h-11 rounded-xl gap-2 font-bold hover:bg-error/10 hover:text-error transition-colors">
              <Icon name="mingcute:refresh-1-line" />
              Reset Filter
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- List Container -->
    <div class="bg-base-100 border border-base-200/80 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      
      <!-- Stats Summary (Top) -->
      <div class="px-8 py-4 bg-base-200/20 border-b border-base-200/60 flex justify-between items-center">
        <p class="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Ditemukan {{ totalCount }} Siswa</p>
        <div v-if="filterStatus !== 'ALL' || selectedClass || filterMajor || searchQuery" class="flex items-center gap-1 text-[9px] font-bold text-base-content/40 uppercase">
          <Icon name="mingcute:filter-fill" class="text-primary/60" />
          Filter Aktif
        </div>
      </div>

      <!-- List Header (Desktop Only) -->
      <div class="hidden lg:grid grid-cols-12 px-8 py-5 border-b border-base-200/60 text-[10px] font-black uppercase tracking-[0.2em] text-base-content/40 items-center">
        <div class="col-span-5 flex items-center gap-3">
          <input 
            type="checkbox" 
            class="checkbox checkbox-primary rounded-lg checkbox-sm border-base-content/20 shrink-0"
            :checked="selectedStudents.length === paginatedUsers.length && paginatedUsers.length > 0"
            @change="toggleSelectAll"
          />
          <span>Informasi Siswa</span>
        </div>
        <div class="col-span-2">NIS / NISN</div>
        <div class="col-span-3">Kelas / Jurusan</div>
        <div class="col-span-2 text-right">Aksi</div>
      </div>

      <!-- Skeleton Loading State -->
      <div v-if="pending && paginatedUsers.length === 0" class="divide-y divide-base-200/60 px-4 md:px-8">
        <div v-for="i in 5" :key="i" class="py-6 animate-pulse">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-base-200"></div>
            <div class="flex-1 space-y-3">
              <div class="h-4 bg-base-200 rounded w-1/3"></div>
              <div class="h-3 bg-base-200 rounded w-1/4 opacity-50"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Empty State -->
      <div v-else-if="paginatedUsers.length === 0" class="flex flex-col items-center justify-center py-24 text-center px-4">
        <div class="relative mb-8">
          <div class="absolute inset-0 bg-primary/10 blur-[60px] rounded-full scale-150 animate-pulse"></div>
          <div class="w-32 h-32 bg-base-100 border border-base-200 rounded-[2.5rem] flex items-center justify-center shadow-xl relative z-10">
            <Icon name="mingcute:user-search-fill" size="64" class="text-primary/20" />
          </div>
        </div>
        <h3 class="text-2xl font-black text-base-content mb-2">Data Tidak Ditemukan</h3>
        <p class="text-base-content/50 max-w-sm mb-8 font-medium">
          Maaf, tidak ada data siswa yang cocok dengan filter aktif saat ini.
        </p>
        <button @click="searchQuery = ''; selectedClass = ''; filterMajor = ''; filterStatus = 'AKTIF'" class="btn btn-primary rounded-2xl px-8 font-bold">Tampilkan Semua Siswa</button>
      </div>

      <!-- User List -->
      <div v-else class="divide-y divide-base-200/40 relative">
        <TransitionGroup name="list">
          <div 
            v-for="user in paginatedUsers" :key="user.id"
            class="group relative hover:bg-base-200/30 transition-all"
          >
            <!-- Left border accent -->
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300"></div>

            <!-- MOBILE layout (< lg): compact single row card -->
            <div class="flex lg:hidden items-center gap-3 px-4 py-3">
              <!-- Checkbox -->
              <input 
                type="checkbox" 
                class="checkbox checkbox-primary rounded-lg checkbox-sm border-base-content/20 shrink-0"
                :checked="selectedStudents.includes(user.id)"
                @change="toggleSelectStudent(user.id)"
              />
              <!-- Avatar -->
              <div class="relative shrink-0">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 border border-base-200">
                  <img 
                    :src="user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=ffffff&bold=true`" 
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-if="!user.isActive" class="absolute -top-1 -right-1 w-4 h-4 bg-error text-white rounded flex items-center justify-center border border-base-100">
                  <Icon name="mingcute:close-line" size="10" />
                </div>
              </div>
              <!-- Name + meta -->
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-sm text-base-content truncate">{{ user.name }}</h3>
                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span class="text-[9px] font-black text-base-content/40">#{{ user.nis }}</span>
                  <span class="text-[9px] text-base-content/30">·</span>
                  <span class="badge badge-primary badge-outline text-[9px] font-black px-1.5 h-4 rounded border-primary/30">{{ user.class?.className || 'N/A' }}</span>
                  <span :class="['text-[9px] font-black px-1.5 py-0 rounded h-4 flex items-center', user.faceToken ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/40']">
                    <Icon :name="user.faceToken ? 'mingcute:face-line' : 'mingcute:face-fill'" size="10" class="mr-0.5" />
                    {{ user.faceToken ? 'Sinkron' : 'Belum' }}
                  </span>
                </div>
              </div>
              <!-- Action buttons (compact icon-only) -->
              <div class="flex items-center gap-1 shrink-0">
                <button 
                  @click="openRegisterDeviceModal(user)" 
                  class="btn btn-ghost btn-xs btn-square rounded-lg hover:bg-primary/10 hover:text-primary text-primary/60"
                  title="Daftarkan ke Perangkat"
                >
                  <Icon name="mingcute:fingerprint-fill" size="16" />
                </button>
                <NuxtLink :to="'/siswa/' + user.nis" class="btn btn-ghost btn-xs btn-square rounded-lg hover:bg-primary/10 hover:text-primary">
                  <Icon name="mingcute:eye-2-line" size="16" />
                </NuxtLink>
                <button @click="openEditModal(user)" class="btn btn-ghost btn-xs btn-square rounded-lg hover:bg-info/10 hover:text-info">
                  <Icon name="mingcute:edit-4-line" size="16" />
                </button>
                <button @click="deleteStudent(user)" class="btn btn-ghost btn-xs btn-square rounded-lg hover:bg-error/10 hover:text-error">
                  <Icon name="mingcute:delete-2-line" size="16" />
                </button>
              </div>
            </div>

            <!-- DESKTOP layout (lg+): 12-col grid -->
            <div class="hidden lg:grid lg:grid-cols-12 items-center px-8 py-4 gap-0">
              <!-- Col 1-5: Bio -->
              <div class="col-span-5 flex items-center gap-4">
                <input 
                  type="checkbox" 
                  class="checkbox checkbox-primary rounded-lg checkbox-sm border-base-content/20 shrink-0"
                  :checked="selectedStudents.includes(user.id)"
                  @change="toggleSelectStudent(user.id)"
                />
                <div class="relative shrink-0">
                  <div class="w-14 h-14 rounded-2xl overflow-hidden bg-base-200 border border-base-200 group-hover:border-primary/30 transition-colors">
                    <img 
                      :src="user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=ffffff&bold=true`" 
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div v-if="!user.isActive" class="absolute -top-1 -right-1 w-5 h-5 bg-error text-white rounded-lg flex items-center justify-center border-2 border-base-100 shadow-sm">
                    <Icon name="mingcute:close-line" size="12" />
                  </div>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-base text-base-content group-hover:text-primary transition-colors truncate">{{ user.name }}</h3>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span :class="['text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md', user.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error']">
                      {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
                    </span>
                    <span :class="['text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1', user.faceToken ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/40']">
                      <Icon :name="user.faceToken ? 'mingcute:face-line' : 'mingcute:face-fill'" size="12" />
                      {{ user.faceToken ? 'Wajah Sinkron' : 'Belum Sinkron' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Col 6-7: NIS / NISN -->
              <div class="col-span-2 flex flex-col gap-1">
                <p class="text-sm font-black text-base-content">{{ user.nis }}</p>
                <p class="text-xs font-bold text-base-content/40">{{ user.nisn || '-' }}</p>
              </div>

              <!-- Col 8-10: Class Info -->
              <div class="col-span-3 flex flex-col gap-1">
                <div class="badge badge-primary badge-outline h-7 px-3 rounded-lg font-black text-[10px] border-primary/20">{{ user.class?.className || 'N/A' }}</div>
                <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest truncate max-w-[150px]">{{ user.class?.major?.name || '-' }}</p>
              </div>

              <!-- Col 11-12: Actions -->
              <div class="col-span-2 flex justify-end gap-1.5">
                <button 
                  @click="openRegisterDeviceModal(user)" 
                  class="btn btn-ghost btn-sm rounded-xl px-3 font-bold gap-2 hover:bg-primary/10 hover:text-primary text-primary/70"
                  title="Daftarkan ke Perangkat Absensi"
                >
                  <Icon name="mingcute:fingerprint-fill" />
                </button>
                <NuxtLink :to="'/siswa/' + user.nis" class="btn btn-ghost btn-sm rounded-xl px-3 font-bold gap-2 hover:bg-primary/10 hover:text-primary">
                  <Icon name="mingcute:eye-2-line" />
                </NuxtLink>
                <button @click="openEditModal(user)" class="btn btn-ghost btn-sm rounded-xl px-4 font-bold gap-2 hover:bg-info/10 hover:text-info">
                  <Icon name="mingcute:edit-4-line" />
                </button>
                <button @click="deleteStudent(user)" class="btn btn-ghost btn-sm rounded-xl px-4 font-bold gap-2 hover:bg-error/10 hover:text-error">
                  <Icon name="mingcute:delete-2-line" />
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <UIPagination
        :currentPage="currentPage"
        :totalPages="totalPages"
        :totalItems="totalCount"
        :itemsPerPage="itemsPerPage"
        itemLabel="siswa"
        @update:currentPage="currentPage = $event"
        @update:itemsPerPage="itemsPerPage = $event; currentPage = 1"
      />
    </div>


    <!-- Add Student Modal -->
    <dialog :class="['modal sm:modal-middle', showAddModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-[2rem] p-6 sm:p-8 max-w-2xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
        <h3 class="text-2xl font-black text-base-content mb-6">{{ isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru' }}</h3>

        <div class="space-y-6">
          <!-- Section 1: Akademik -->
          <div>
            <h4 class="text-[11px] font-black uppercase tracking-widest text-primary mb-3">Informasi Akademik</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control sm:col-span-2">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Nama Lengkap*</span></label>
                <input v-model="form.name" type="text" placeholder="Masukkan nama lengkap" class="input input-bordered w-full rounded-2xl bg-base-200/30 font-bold" />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">NIS*</span></label>
                <input v-model="form.nis" type="text" placeholder="Masukkan NIS" class="input input-bordered w-full rounded-2xl bg-base-200/30 font-bold" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">NISN (Opsional)</span></label>
                <input v-model="form.nisn" type="text" placeholder="10 Digit" class="input input-bordered w-full rounded-2xl bg-base-200/30 font-bold" maxlength="10" />
              </div>

              <div class="form-control relative">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Kelas*</span></label>
                <div 
                  @click="toggleClassDropdown"
                  class="input input-bordered w-full rounded-2xl bg-base-200/30 font-bold flex items-center justify-between cursor-pointer"
                >
                  <span v-if="form.classId">{{ classes.find(c => c.id === form.classId)?.className }}</span>
                  <span v-else class="opacity-40 font-normal">Pilih Kelas</span>
                  <Icon name="mingcute:down-line" :class="['transition-transform', showClassDropdown ? 'rotate-180' : '']" />
                </div>

                <!-- Custom Dropdown Menu -->
                <div v-if="showClassDropdown" class="absolute top-full left-0 w-full mt-2 bg-base-100 border border-base-200 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                  <div class="p-2 border-b border-base-200">
                    <div class="relative">
                      <Icon name="mingcute:search-line" class="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                      <input 
                        v-model="classSearch"
                        type="text" 
                        placeholder="Cari kelas..." 
                        class="input input-sm w-full pl-9 rounded-xl bg-base-200/50"
                        @click.stop
                        autofocus
                      />
                    </div>
                  </div>
                  <div class="max-h-48 overflow-y-auto custom-scrollbar">
                    <div 
                      v-for="c in filteredClassesForSelect" 
                      :key="c.id"
                      @click="selectClass(c)"
                      class="px-4 py-3 hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors font-bold text-sm"
                    >
                      {{ c.className }}
                    </div>
                    <div v-if="filteredClassesForSelect.length === 0" class="px-4 py-8 text-center text-xs opacity-40 font-bold">
                      Kelas tidak ditemukan
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Status Siswa</span></label>
                <select v-model="form.status" class="select select-bordered w-full rounded-2xl bg-base-200/30 font-bold">
                  <option value="AKTIF">AKTIF</option>
                  <option value="ALUMNI">ALUMNI</option>
                  <option value="KELUAR">KELUAR</option>
                  <option value="MUTASI">MUTASI</option>
                </select>
              </div>

              <!-- Hidden dummy fields to prevent autofill -->
              <input type="text" style="display:none" aria-hidden="true">
              <input type="password" style="display:none" aria-hidden="true">

              <div class="form-control sm:col-span-2">
                <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Password (Kosongkan jika default/tidak diubah)</span></label>
                <input 
                  v-model="form.password" 
                  type="password" 
                  name="student-new-password-field"
                  autocomplete="new-password"
                  placeholder="Masukkan password custom" 
                  class="input input-bordered w-full rounded-2xl bg-base-200/30 font-bold" 
                />
              </div>
            </div>

            <!-- Password Info -->
            <div v-if="!form.password && !isEditing" class="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3 mt-4">
              <Icon name="mingcute:key-2-fill" class="text-primary shrink-0" size="18" />
              <div class="text-[10px] font-bold text-primary/80 tracking-wider leading-relaxed">
                SISWA DAPAT LOGIN MENGGUNAKAN <span class="text-primary underline">NIS</span> SEBAGAI USERNAME DAN PASSWORD DEFAULT: <span class="bg-primary/20 px-1.5 py-0.5 rounded text-primary normal-case">password123</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Biodata & Profil Lengkap -->
          <div class="border-t border-base-200 pt-4">
            <h4 class="text-[11px] font-black uppercase tracking-widest text-primary mb-3">Biodata Pribadi</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Email</span></label>
                <input v-model="form.email" type="email" placeholder="email@domain.com" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Nomor Telepon</span></label>
                <input v-model="form.phone" type="text" placeholder="08xxxxxxxxxx" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Gender</span></label>
                <select v-model="form.gender" class="select select-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold">
                  <option value="">Pilih Gender</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Agama</span></label>
                <select v-model="form.religion" class="select select-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold">
                  <option value="">Pilih Agama</option>
                  <option value="ISLAM">ISLAM</option>
                  <option value="KRISTEN">KRISTEN</option>
                  <option value="KATOLIK">KATOLIK</option>
                  <option value="HINDU">HINDU</option>
                  <option value="BUDHA">BUDHA</option>
                  <option value="KONGHUCU">KONGHUCU</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Tempat Lahir</span></label>
                <input v-model="form.birthPlace" type="text" placeholder="Tempat Lahir" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Tanggal Lahir</span></label>
                <input v-model="form.birthDate" type="date" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold" />
              </div>
              <div class="form-control sm:col-span-2">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Plat Nomor Kendaraan</span></label>
                <input v-model="form.vehiclePlate" type="text" placeholder="AB 1234 CD" class="input input-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 font-bold" />
              </div>
              <div class="form-control sm:col-span-2">
                <label class="label"><span class="label-text font-bold text-[10px] uppercase tracking-widest opacity-40">Alamat Lengkap</span></label>
                <textarea v-model="form.address" placeholder="Tulis alamat lengkap disini..." class="textarea textarea-bordered w-full rounded-xl md:rounded-2xl bg-base-200/30 h-20 resize-none py-3 font-bold"></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action flex justify-between gap-4 mt-8">
          <button @click="showAddModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold">Batal</button>
          <button @click="saveStudent" class="btn btn-primary rounded-2xl flex-1 font-bold shadow-lg shadow-primary/20" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            {{ isEditing ? 'Simpan Perubahan' : 'Tambah Siswa' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showAddModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog :class="['modal sm:modal-middle', showDeleteModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-[2rem] p-6 sm:p-8 max-w-sm text-center">
        <div class="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon name="mingcute:delete-2-fill" size="32" />
        </div>
        <h3 class="text-2xl font-black text-base-content mb-2">Hapus Siswa?</h3>
        <p class="text-base-content/60 font-medium mb-8">
          Apakah Anda yakin ingin menghapus <span class="text-base-content font-bold">{{ studentToDelete?.name }}</span>? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex gap-4">
          <button @click="showDeleteModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold">Batal</button>
          <button @click="confirmDeleteStudent" class="btn btn-error rounded-2xl flex-1 font-bold shadow-lg shadow-error/20 text-white">
            Ya, Hapus
          </button>
        </div>
      </div>
    </dialog>

    <!-- Bulk Delete Modal -->
    <dialog :class="['modal sm:modal-middle', showBulkDeleteModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-[2rem] p-6 sm:p-8 max-w-sm text-center">
        <div class="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon name="mingcute:delete-2-fill" size="32" />
        </div>
        <h3 class="text-2xl font-black text-base-content mb-2">Hapus Massal?</h3>
        <p class="text-base-content/60 font-medium mb-8">
          Apakah Anda yakin ingin menghapus <span class="text-primary font-black">{{ selectedStudents.length }}</span> siswa terpilih? Tindakan ini tidak dapat dibatalkan.
        </p>

        <div class="flex gap-4">
          <button @click="showBulkDeleteModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold">Batal</button>
          <button @click="confirmBulkDelete" class="btn btn-error rounded-2xl flex-1 font-bold shadow-lg shadow-error/20 text-white">
            Ya, Hapus Semua
          </button>
        </div>
      </div>
    </dialog>

    <!-- Register to Device Modal -->
    <dialog :class="['modal sm:modal-middle', showRegisterDeviceModal ? 'modal-open' : '']">
      <div class="modal-box bg-base-100 border border-base-200 rounded-[2rem] p-6 sm:p-8 max-w-md max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
        
        <!-- Case 1: Currently Syncing (Progress Bar & Logs) -->
        <div v-if="registeringState && isBulkRegister" class="space-y-6">
          <div class="text-center">
            <h3 class="text-2xl font-black text-base-content mb-2 animate-pulse">Menyinkronkan Data</h3>
            <p class="text-xs text-base-content/50 font-medium">
              Sedang mengirim kredensial dan foto ke mesin absensi...
            </p>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-bold text-base-content/70">
              <span>{{ syncProgress.current }} / {{ syncProgress.total }} Siswa</span>
              <span class="text-primary">{{ syncProgress.percentage }}%</span>
            </div>
            <div class="w-full bg-base-200 rounded-full h-3.5 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300 rounded-full"
                :style="{ width: `${syncProgress.percentage}%` }"
              ></div>
            </div>
            <div class="text-[10px] font-bold text-base-content/40 tracking-wider flex justify-between">
              <span class="truncate max-w-[200px]">Memproses: {{ syncProgress.currentStudent || '-' }}</span>
              <span class="truncate max-w-[150px]">Alat: {{ syncProgress.currentDevice || '-' }}</span>
            </div>
          </div>

          <!-- Terminal-style Log Box -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Aktivitas Sinkronisasi</label>
            <div 
              id="sync-logs-container" 
              class="h-44 bg-base-200/50 border border-base-200 rounded-2xl p-4 overflow-y-auto text-[10px] font-mono space-y-1.5 custom-scrollbar"
            >
              <div v-if="syncProgress.logs.length === 0" class="text-base-content/30 italic text-center py-10">
                Memulai proses sinkronisasi...
              </div>
              <div 
                v-for="log in syncProgress.logs" 
                :key="log.id" 
                :class="[log.success ? 'text-success' : 'text-error', 'flex items-start gap-1.5 font-semibold']"
              >
                <Icon :name="log.success ? 'mingcute:check-circle-fill' : 'mingcute:close-circle-fill'" class="shrink-0 mt-0.5" size="12" />
                <span>{{ log.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Case 2: Sync Finished Summary (Bulk) -->
        <div v-else-if="syncFinished && isBulkRegister" class="space-y-6 text-center">
          <div class="w-16 h-16 bg-success/10 text-success rounded-3xl flex items-center justify-center mx-auto">
            <Icon name="mingcute:check-fill" size="32" class="animate-bounce" />
          </div>
          <div>
            <h3 class="text-2xl font-black text-base-content mb-1">Sinkronisasi Selesai</h3>
            <p class="text-xs text-base-content/50 font-medium">
              Proses sinkronisasi massal siswa telah selesai diproses.
            </p>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 gap-4 bg-base-200/40 p-4 rounded-2xl border border-base-200">
            <div>
              <p class="text-[10px] font-bold text-base-content/40 uppercase">Berhasil</p>
              <p class="text-xl font-black text-success">{{ syncProgress.logs.filter(l => l.success).length }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold text-base-content/40 uppercase">Gagal</p>
              <p class="text-xl font-black" :class="syncProgress.logs.filter(l => !l.success).length > 0 ? 'text-error' : 'text-base-content/40'">
                {{ syncProgress.logs.filter(l => !l.success).length }}
              </p>
            </div>
          </div>

          <!-- Scrollable Log Box for reference -->
          <div class="space-y-2 text-left">
            <label class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Detail Laporan</label>
            <div class="max-h-32 bg-base-200/50 border border-base-200 rounded-2xl p-4 overflow-y-auto text-[10px] font-mono space-y-1.5 custom-scrollbar">
              <div 
                v-for="log in syncProgress.logs" 
                :key="log.id" 
                :class="[log.success ? 'text-success' : 'text-error', 'flex items-start gap-1.5 font-semibold']"
              >
                <Icon :name="log.success ? 'mingcute:check-circle-fill' : 'mingcute:close-circle-fill'" class="shrink-0 mt-0.5" size="12" />
                <span>{{ log.text }}</span>
              </div>
            </div>
          </div>

          <div class="modal-action mt-6">
            <button @click="closeSyncModal" class="btn btn-primary w-full rounded-2xl font-bold">Selesai</button>
          </div>
        </div>

        <!-- Case 3: Initial Selection state (not registering or normal register) -->
        <div v-else>
          <h3 class="text-2xl font-black text-base-content mb-2">
            {{ isBulkRegister ? 'Daftarkan Wajah Siswa (Bulk)' : 'Daftarkan Wajah ke Alat' }}
          </h3>
          <p class="text-xs text-base-content/50 font-medium mb-6">
            Kirim data kredensial dan foto biometrik wajah siswa ke perangkat absensi Hikvision.
          </p>

          <div v-if="isBulkRegister" class="space-y-4">
            <!-- Bulk Mini Card -->
            <div class="flex items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/20">
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name="mingcute:fingerprint-fill" size="24" />
              </div>
              <div>
                <h4 class="font-bold text-sm text-base-content">Pendaftaran Massal</h4>
                <p class="text-xs text-base-content/50 font-medium">Mendaftarkan {{ selectedStudents.length }} siswa terpilih ke mesin absensi.</p>
              </div>
            </div>
          </div>

          <div v-else-if="studentToRegister" class="space-y-4">
            <!-- Student Mini Card -->
            <div class="flex items-center gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-200/80">
              <div class="w-12 h-12 rounded-xl overflow-hidden bg-base-200 shrink-0">
                <img 
                  :src="studentToRegister.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentToRegister.name)}&background=6366f1&color=ffffff&bold=true`" 
                  class="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 class="font-bold text-sm text-base-content">{{ studentToRegister.name }}</h4>
                <p class="text-xs text-base-content/40 font-mono">NISN: {{ studentToRegister.nisn || studentToRegister.nis }}</p>
              </div>
            </div>

            <!-- Face Photo Section -->
            <div class="form-control bg-base-200/20 p-4 rounded-2xl border border-dashed border-base-300 space-y-3">
              <label class="label pt-0 pb-1">
                <span class="label-text font-bold text-xs uppercase tracking-widest opacity-60">Foto Wajah Absensi (Hikvision)</span>
              </label>
              
              <div v-if="studentToRegister.photoUrl" class="flex items-center gap-4">
                <div class="w-16 h-20 rounded-xl overflow-hidden bg-base-200 border border-base-300 flex items-center justify-center shrink-0">
                  <img :src="studentToRegister.photoUrl" class="w-full h-full object-cover object-center" />
                </div>
                <div class="flex-1">
                  <p class="text-xs text-base-content/60 font-semibold mb-2">Wajah siswa sudah terdaftar</p>
                  <button 
                    @click="showFaceUploadOptions = true" 
                    class="btn btn-ghost hover:bg-primary/10 hover:text-primary btn-sm rounded-xl font-bold h-9 gap-1.5 border border-base-300"
                    :disabled="isUploadingFace"
                  >
                    <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
                    <Icon v-else name="mingcute:upload-2-fill" size="14" />
                    Ubah Foto Wajah
                  </button>
                </div>
              </div>

              <div v-else class="text-center py-2">
                <button 
                  @click="showFaceUploadOptions = true" 
                  class="btn btn-primary btn-sm rounded-xl font-bold h-10 gap-2 w-full shadow-md shadow-primary/15"
                  :disabled="isUploadingFace"
                >
                  <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
                  <Icon v-else name="mingcute:upload-2-fill" size="16" />
                  Unggah Foto Wajah
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-4 mt-4">
            <!-- Device Selector -->
            <div class="form-control">
              <label class="label"><span class="label-text font-bold text-xs uppercase tracking-widest opacity-40">Pilih Mesin Absensi*</span></label>
              <select v-model="selectedDeviceForRegister" class="select select-bordered w-full rounded-2xl bg-base-200/30 font-bold">
                <option value="ALL">Semua Perangkat Aktif</option>
                <option v-for="d in activeDevices" :key="d.id" :value="d.id">
                  {{ d.name }} ({{ d.location }})
                </option>
              </select>
            </div>

            <!-- Sync Warning if no photoUrl and not bulk -->
            <div v-if="!isBulkRegister && studentToRegister && !studentToRegister.photoUrl" class="bg-warning/5 border border-warning/20 rounded-2xl p-4 flex items-start gap-3 mt-4">
              <Icon name="mingcute:warning-line" class="text-warning shrink-0" size="18" />
              <div class="text-[10px] font-bold text-warning/80 tracking-wider leading-relaxed">
                PERHATIAN: SISWA TIDAK MEMILIKI FOTO PROFIL. SISWA HANYA AKAN TERDAFTAR SECARA DATA USER TANPA BIOMETRIK WAJAH. HARAP UPLOAD FOTO PROFIL TERLEBIH DAHULU UNTUK SYNC WAJAH.
              </div>
            </div>
            <!-- Guru Restriction Warning -->
            <div v-if="!isBulkRegister && studentToRegister && studentToRegister.faceToken && currentUser && currentUser.role === 'GURU'" class="bg-error/5 border border-error/20 rounded-2xl p-4 flex items-start gap-3 mt-4">
              <Icon name="mingcute:information-line" class="text-error shrink-0" size="18" />
              <div class="text-[10px] font-bold text-error/80 tracking-wider leading-relaxed uppercase">
                Hanya administrator yang memiliki wewenang untuk menghapus sinkronisasi wajah dari mesin absensi.
              </div>
            </div>
          </div>

          <div class="modal-action flex justify-between gap-4 mt-8">
            <button @click="showRegisterDeviceModal = false" class="btn btn-ghost rounded-2xl flex-1 font-bold" :disabled="registeringState">Batal</button>
            <button 
              v-if="!isBulkRegister && studentToRegister && studentToRegister.faceToken"
              @click="handleUnregisterFromDevice" 
              class="btn btn-error text-white rounded-2xl flex-1 font-bold shadow-lg shadow-error/20" 
              :disabled="registeringState || activeDevices.length === 0 || (currentUser && currentUser.role === 'GURU')"
            >
              <span v-if="registeringState" class="loading loading-spinner loading-xs mr-1"></span>
              Hapus Sinkronisasi
            </button>
            <button @click="handleRegisterToDevice" class="btn btn-primary rounded-2xl flex-1 font-bold shadow-lg shadow-primary/20" :disabled="registeringState || activeDevices.length === 0">
              <span v-if="registeringState" class="loading loading-spinner loading-xs mr-1"></span>
              {{ studentToRegister && studentToRegister.faceToken ? 'Sinkron Ulang' : 'Daftarkan' }}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="!registeringState && !syncFinished && (showRegisterDeviceModal = false)">
        <button :disabled="registeringState && !syncFinished">close</button>
      </form>
    </dialog>

    <!-- Floating Bulk Action Bar -->
    <div v-if="selectedStudents.length > 0" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-base-100/90 backdrop-blur-xl border border-primary/20 px-6 py-4 rounded-3xl shadow-[0_10px_30px_rgba(99,102,241,0.2)] flex items-center gap-6">
      <span class="text-sm font-bold text-base-content">
        <span class="text-primary font-black">{{ selectedStudents.length }}</span> Siswa Terpilih
      </span>
      <div class="flex gap-2">
        <button @click="openBulkRegisterModal" class="btn btn-primary btn-sm rounded-xl font-bold gap-2">
          <Icon name="mingcute:fingerprint-fill" />
          Daftarkan ke Alat (Bulk)
        </button>
        <button @click="openBulkDeleteConfirm" class="btn btn-error btn-sm rounded-xl font-bold text-white gap-2">
          <Icon name="mingcute:delete-2-fill" />
          Hapus (Bulk)
        </button>
        <button @click="selectedStudents = []" class="btn btn-ghost btn-sm rounded-xl font-bold">
          Batal
        </button>
      </div>
    </div>

    <!-- Modal: Opsi Upload Wajah -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showFaceUploadOptions }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-6 z-[60]">
        <h3 class="font-bold text-lg text-base-content mb-6 text-center sm:text-left">Pilih Metode Upload Wajah</h3>
        <div class="flex flex-col gap-3">
          <!-- Ambil Selfie -->
          <button @click="startCamera" class="btn btn-ghost bg-base-200/50 hover:bg-primary/10 hover:text-primary rounded-2xl flex items-center justify-between px-6 h-16 transition-all">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon name="mingcute:camera-fill" size="22" />
              </div>
              <div class="text-left">
                <p class="font-bold text-sm">Ambil Foto (Selfie)</p>
                 <p class="text-xs text-base-content/50">Gunakan kamera depan HP / laptop</p>
              </div>
            </div>
            <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
          </button>

          <!-- Dari Galeri -->
          <button @click="$refs.faceFileInputHelper.click()" class="btn btn-ghost bg-base-200/50 hover:bg-success/10 hover:text-success rounded-2xl flex items-center justify-between px-6 h-16 transition-all">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <Icon name="mingcute:pic-fill" size="22" />
              </div>
              <div class="text-left">
                <p class="font-bold text-sm">Pilih dari Galeri</p>
                <p class="text-xs text-base-content/50">Unggah berkas gambar yang sudah ada</p>
              </div>
            </div>
            <Icon name="mingcute:right-line" size="18" class="text-base-content/20" />
          </button>
          <input ref="faceFileInputHelper" type="file" class="hidden" accept="image/*" @change="onFaceFileSelect" />
        </div>
        <div class="modal-action sm:mt-6 mt-4">
          <button @click="showFaceUploadOptions = false" class="btn btn-ghost w-full rounded-2xl">Batal</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showFaceUploadOptions = false"><button>close</button></form>
    </dialog>

    <!-- Modal: Kamera Selfie -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showCameraModal }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-0 overflow-hidden max-w-lg z-[60]">
        <div class="p-6 border-b border-base-200 flex items-center justify-between bg-base-50/50">
          <h3 class="font-bold text-lg text-base-content">Ambil Foto Wajah</h3>
          <button @click="closeCamera" class="btn btn-ghost btn-circle btn-sm">
            <Icon name="mingcute:close-line" size="20" />
          </button>
        </div>
        
        <div class="relative bg-black aspect-[3/4] max-h-[60vh] w-full flex items-center justify-center overflow-hidden">
          <video ref="videoRef" autoplay playsinline muted class="h-full w-full object-cover scale-x-[-1]"></video>
          
          <!-- Oval Face Placeholder Guidelines -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-48 h-64 border-4 border-dashed border-primary/70 rounded-[50%] bg-transparent flex items-center justify-center">
              <div class="absolute text-[10px] font-bold text-primary bg-base-100/90 px-3 py-1 rounded-full border border-primary/30 -top-3 shadow-md">
                Posisikan Wajah Di Sini
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-base-50/50 flex gap-3 justify-center">
          <button @click="closeCamera" class="btn btn-ghost rounded-xl px-6 flex-1">Batal</button>
          <button @click="capturePhoto" class="btn btn-primary rounded-xl px-8 flex-1 gap-2 shadow-lg shadow-primary/20">
            <Icon name="mingcute:camera-fill" size="18" />
            Ambil Foto
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="closeCamera"><button>close</button></form>
    </dialog>

    <!-- Modal: Crop Foto Wajah -->
    <dialog :class="['modal modal-bottom sm:modal-middle', { 'modal-open': showFaceCropper }]">
      <div class="modal-box bg-base-100 border border-base-200/60 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] p-0 overflow-hidden max-w-lg z-[60]">
        <div class="p-6 border-b border-base-200 flex items-center justify-between bg-base-50/50">
          <div>
            <h3 class="font-bold text-lg text-base-content">Sesuaikan Foto Wajah</h3>
            <p class="text-xs text-base-content/50">Sesuaikan agar wajah masuk ke dalam panduan</p>
          </div>
          <button @click="cancelFaceCrop" class="btn btn-ghost btn-circle btn-sm">
            <Icon name="mingcute:close-line" size="20" />
          </button>
        </div>
        
        <div class="p-6 bg-neutral/5 flex items-center justify-center">
          <div class="relative w-72 h-96 overflow-hidden rounded-2xl shadow-inner bg-black">
            <Cropper
              v-if="showFaceCropper"
              ref="faceCropperRef"
              :src="rawFaceImage"
              :stencil-props="{ aspectRatio: 3/4 }"
              :image-restriction="'none'"
              class="w-full h-full"
            />
            
            <!-- Oval Face Guideline Overlay inside Cropper -->
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div class="w-44 h-60 border-4 border-dashed border-primary/60 rounded-[50%] bg-transparent flex items-center justify-center">
                <div class="absolute text-[9px] font-bold text-primary bg-base-100/90 px-2 py-0.5 rounded-full border border-primary/30 -top-3">
                  Area Wajah
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 bg-base-50/50 flex gap-3">
          <button @click="cancelFaceCrop" class="btn btn-ghost rounded-xl px-6 flex-1">Batal</button>
          <button 
            @click="uploadFacePhoto" 
            class="btn btn-primary rounded-xl px-8 flex-1 shadow-lg shadow-primary/20"
            :disabled="isUploadingFace"
          >
            <span v-if="isUploadingFace" class="loading loading-spinner loading-xs"></span>
            Simpan Foto Wajah
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="cancelFaceCrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<style scoped>
/* Transition Group Animations for Search Filtering */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
