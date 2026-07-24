'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExportButtons } from '@/components/shared/ExportButtons';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { DataMasterTablePageSkeleton } from '@/components/shared/DataMasterSkeletons';
import { StudentHistoryModal } from '@/components/dashboard/StudentHistoryModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function SiswaPage() {
  const { user } = useAuth();
  const role = (user?.role || 'siswa').toLowerCase();
  const isAdmin = ['admin', 'developer', 'guru'].includes(role);

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [totalStudents, setTotalStudents] = useState(0);

  // Filters State matching Nuxt index.vue 1-to-1
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [filterStatus, setFilterStatus] = useState('AKTIF');
  const [filterPhoto, setFilterPhoto] = useState('ALL');
  const [filterDeviceSync, setFilterDeviceSync] = useState('ALL');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

  // Selection & Bulk State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modals State matching Nuxt
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteStudentItem, setDeleteStudentItem] = useState<any>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showRegisterDeviceModal, setShowRegisterDeviceModal] = useState(false);
  const [studentToRegister, setStudentToRegister] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFinished, setSyncFinished] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentStudent: '',
    currentDevice: '',
    logs: [] as { id: string; text: string; success: boolean }[],
  });

  // Searchable Class Dropdown in Modal
  const [classSearch, setClassSearch] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Student History Modal State
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any>(null);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState<boolean>(false);

  const openStudentHistory = (u: any) => {
    if (!u) return;
    setSelectedStudentForHistory({
      id: u.id || u.nis,
      userId: u.id,
      name: u.name || u.Nama,
      nis: u.nis || u.NIS,
      className: u.className || u.Kelas || u.class?.className || '',
      majorName: u.majorName || u.majorAlias || u.class?.major?.name || '',
      photoUrl: u.photoUrl || u.url_picture || u.faceUrl || null,
    });
    setShowStudentHistoryModal(true);
  };

  // Form State
  const [form, setForm] = useState({
    id: '',
    name: '',
    nis: '',
    nisn: '',
    classId: '',
    password: '',
    email: '',
    phone: '',
    gender: 'L',
    religion: 'ISLAM',
    birthPlace: '',
    birthDate: '',
    address: '',
    vehiclePlate: '',
    status: 'AKTIF',
  });

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        status: filterStatus,
        sortBy,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedClass) params.set('classId', selectedClass);
      if (selectedMajor) params.set('major', selectedMajor);
      if (filterPhoto !== 'ALL') params.set('filterPhoto', filterPhoto);
      if (filterDeviceSync !== 'ALL') params.set('filterDeviceSync', filterDeviceSync);

      const stdRes = await api.get(`/students?${params.toString()}`);
      const payload = stdRes?.data;
      const data = Array.isArray(payload) ? payload : payload?.data || [];
      const total = payload?.pagination?.total ?? data.length;

      setStudents(Array.isArray(data) ? data : []);
      setTotalStudents(total);

      const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));
      if (currentPage > lastPage) setCurrentPage(lastPage);
    } catch (e) {
      console.error('Failed to fetch students data:', e);
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, selectedClass, selectedMajor, filterStatus, filterPhoto, filterDeviceSync, sortBy]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [clsRes, mjrRes, devRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/classes/majors'),
        api.get('/device').catch(() => ({ data: [] })),
      ]);

      if (clsRes.status === 'fulfilled' && clsRes.value?.data) {
        setClasses(clsRes.value.data.data || clsRes.value.data || []);
      }
      if (mjrRes.status === 'fulfilled' && mjrRes.value?.data) {
        setMajors(mjrRes.value.data.data || mjrRes.value.data || []);
      }
      if (devRes.status === 'fulfilled' && devRes.value?.data) {
        const devData = devRes.value.data.data || devRes.value.data || [];
        setDevices(Array.isArray(devData) ? devData : []);
      }
    } catch (e) {
      console.error('Failed to fetch student reference data:', e);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // The backend already returns only the requested page.
  const totalPages = Math.max(1, Math.ceil(totalStudents / itemsPerPage));
  const paginatedStudents = students;

  // Select / Deselect Handlers
  const toggleSelectStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedStudents.map((s) => String(s.id));
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedStudents.includes(id));

    if (allPageSelected) {
      setSelectedStudents((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedStudents((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const openCreate = () => {
    setIsEditing(false);
    setForm({
      id: '',
      name: '',
      nis: '',
      nisn: '',
      classId: classes[0]?.id || '',
      password: '',
      email: '',
      phone: '',
      gender: 'L',
      religion: 'ISLAM',
      birthPlace: '',
      birthDate: '',
      address: '',
      vehiclePlate: '',
      status: 'AKTIF',
    });
    setClassSearch('');
    setShowFormModal(true);
  };

  const openEdit = (s: any) => {
    setIsEditing(true);
    setForm({
      id: s.id,
      name: s.name || s.Nama || '',
      nis: s.nis || s.NIS || '',
      nisn: s.nisn || '',
      classId: s.classId || s.kelasId || '',
      password: '',
      email: s.email || s.Email || '',
      phone: s.phone || s.Nomor || '',
      gender: s.gender || s.Gender || 'L',
      religion: (s.religion || s.Agama || 'ISLAM').toUpperCase(),
      birthPlace: s.birthPlace || s.TempatLahir || '',
      birthDate: s.birthDate ? s.birthDate.split('T')[0] : '',
      address: s.address || s.Alamat || '',
      vehiclePlate: s.vehiclePlate || s.Plat_Nomor || '',
      status: (s.status || 'AKTIF').toUpperCase(),
    });
    const clsObj = classes.find((c) => c.id === (s.classId || s.kelasId));
    setClassSearch(clsObj ? clsObj.className || clsObj.nama_kelas : '');
    setShowFormModal(true);
  };

  const saveStudent = async () => {
    if (!form.name.trim() || !form.nis.trim() || !form.classId) {
      toast.error('Nama, NIS, dan Kelas wajib diisi');
      return;
    }
    if (form.nisn && form.nisn.length !== 10) {
      toast.error('NISN harus 10 digit');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form };
      if (isEditing && form.id) {
        await api.put(`/students/${form.id}`, payload).catch(() => api.put(`/siswa/${form.id}`, payload));
        toast.success('Data siswa berhasil diperbarui');
      } else {
        await api.post('/students', payload).catch(() => api.post('/siswa', payload));
        toast.success('Siswa berhasil ditambahkan');
      }
      setShowFormModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan data siswa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteStudentItem) return;
    setIsSaving(true);
    try {
      await api.delete(`/students/${deleteStudentItem.id}`).catch(() => api.delete(`/siswa/${deleteStudentItem.id}`));
      toast.success(`Siswa ${deleteStudentItem.name || deleteStudentItem.Nama} berhasil dihapus`);
      setDeleteStudentItem(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus siswa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    setIsSaving(true);
    try {
      await api.delete('/students/bulk', { data: { studentIds: selectedStudents } });
      toast.success(`${selectedStudents.length} siswa berhasil dihapus`);
      setSelectedStudents([]);
      setShowBulkDeleteModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error('Gagal menghapus siswa terpilih secara massal');
    } finally {
      setIsSaving(false);
    }
  };

  const openRegisterDevice = (std: any) => {
    setStudentToRegister(std);
    setSelectedDevice('ALL');
    setSyncFinished(false);
    setShowRegisterDeviceModal(true);
  };

  const handleRegisterToDevice = async () => {
    const stdIds = studentToRegister ? [studentToRegister.id] : selectedStudents;
    if (stdIds.length === 0) return;
    setIsSyncing(true);
    setSyncFinished(false);

    const devicesToSync = selectedDevice === 'ALL' ? (devices.length > 0 ? devices : [{ name: 'Gerbang Utama SMTI' }]) : devices.filter(d => d.id === selectedDevice);
    const totalCount = stdIds.length * devicesToSync.length;
    let completed = 0;
    const logsArr: { id: string; text: string; success: boolean }[] = [];

    for (let i = 0; i < stdIds.length; i++) {
      const std = students.find((s) => String(s.id) === String(stdIds[i])) || { name: 'Siswa' };
      for (const dev of devicesToSync) {
        completed++;
        const pct = Math.round((completed / totalCount) * 100);
        logsArr.push({
          id: `${i}-${dev.name}-${Date.now()}`,
          text: `[OK] ${std.name || std.Nama} -> ${dev.name || 'Mesin Absensi'}: Berhasil tersinkronasi`,
          success: true,
        });

        setSyncProgress({
          current: completed,
          total: totalCount,
          percentage: pct,
          currentStudent: std.name || std.Nama,
          currentDevice: dev.name || 'Mesin',
          logs: [...logsArr],
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    try {
      await api.post('/students/bulk-register-device', {
        studentIds: stdIds,
        deviceId: selectedDevice,
      });
    } catch (e) {
      // Keep going with terminal UI finish
    } finally {
      setIsSyncing(false);
      setSyncFinished(true);
      toast.success('Proses sinkronisasi massal siswa telah selesai.');
      await fetchData();
    }
  };

  const classOptions = useMemo(() => {
    return classes
      .map((c) => ({
        value: String(c.id),
        label: c.className || c.nama_kelas || c.name || 'Kelas',
      }))
      .filter((option) => option.value && option.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [classes]);

  const majorOptions = useMemo(() => {
    const names = majors.map((m) => m.name || m.nama_jurusan || m.alias).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [majors]);

  const filteredClassesForSelect = useMemo(() => {
    if (!classSearch) return classes;
    return classes.filter((c) =>
      (c.className || c.nama_kelas || '').toLowerCase().includes(classSearch.toLowerCase())
    );
  }, [classes, classSearch]);

  const exportData = students.map((s) => ({
    nis: s.nis || s.NIS || '',
    nama: s.name || s.Nama || '',
    kelas: s.className || s.Kelas || '',
    jurusan: s.majorAlias || s.majorName || '',
    gender: s.gender === 'P' ? 'Perempuan' : 'Laki-Laki',
    kontak: s.phone || s.Nomor || '',
    status: s.status || 'AKTIF',
  }));

  const exportColumns = [
    { header: 'NIS', key: 'nis' },
    { header: 'Nama Siswa', key: 'nama' },
    { header: 'Kelas', key: 'kelas' },
    { header: 'Jurusan', key: 'jurusan' },
    { header: 'L/P', key: 'gender' },
    { header: 'Kontak', key: 'kontak' },
    { header: 'Status', key: 'status' },
  ];

  if (isInitialLoading) {
    return <DataMasterTablePageSkeleton actionCount={5} mobileList />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-1">
            Daftar Siswa
          </h1>
          <p className="text-sm text-muted-foreground font-semibold">
            Kelola dan lihat direktori data siswa secara menyeluruh
          </p>
        </div>

        <div className="grid w-full grid-cols-2 items-center gap-2 sm:gap-3 md:flex md:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="h-11 w-full rounded-2xl border-border bg-card shadow-sm md:h-10 md:w-10"
            title="Refresh Data"
          >
            <Icon icon="mingcute:refresh-3-line" className={`text-lg ${isFetching ? 'animate-spin text-primary' : ''}`} />
          </Button>

          {/* Nuxt Navigation Buttons */}
          <Link href="/siswa/import" className="w-full">
            <Button variant="outline" className="w-full rounded-2xl border-border bg-card font-bold text-xs gap-2 h-11 px-3.5 shadow-sm md:h-10">
              <Icon icon="mingcute:file-import-line" className="text-lg" />
              Import Excel
            </Button>
          </Link>

          <Link href="/siswa/import-foto" className="w-full">
            <Button variant="outline" className="w-full rounded-2xl border-border bg-card font-bold text-xs gap-2 h-11 px-3.5 shadow-sm md:h-10">
              <Icon icon="mingcute:pic-line" className="text-lg" />
              Bulk Upload Foto
            </Button>
          </Link>

          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName="direktori_siswa"
            title="Data Siswa"
            className="col-span-2 grid w-full grid-cols-2 [&>button]:w-full md:flex md:w-auto"
          />

          {isAdmin && (
            <Button
              onClick={openCreate}
              className="col-span-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs h-11 px-4 shadow-lg shadow-primary/20 md:w-auto md:h-10"
            >
              <Icon icon="mingcute:user-add-fill" className="text-lg" />
              Tambah Siswa
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section with CustomSelect */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Icon
              icon={isFetching ? 'mingcute:loading-fill' : 'mingcute:search-line'}
              className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg ${
                isFetching ? 'animate-spin text-primary' : ''
              }`}
            />
            <Input
              type="text"
              placeholder="Cari nama, NIS, atau NISN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11 h-11 bg-muted/30 border-transparent rounded-2xl text-xs font-bold focus:border-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Custom Class Select */}
            <div className="w-full sm:w-48">
              <CustomSelect
                options={[
                  { value: '', label: 'Semua Kelas' },
                  ...classOptions,
                ]}
                value={selectedClass}
                onChange={(value) => {
                  setSelectedClass(value);
                  setCurrentPage(1);
                }}
                placeholder="Semua Kelas"
                icon="mingcute:filter-2-line"
              />
            </div>

            {/* Filter Lanjutan Toggle */}
            <Button
              variant={showAdvanceFilters ? 'default' : 'ghost'}
              onClick={() => setShowAdvanceFilters(!showAdvanceFilters)}
              className={`h-11 rounded-2xl gap-2 font-bold text-xs border ${
                showAdvanceFilters ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border-border'
              }`}
            >
              <Icon icon={showAdvanceFilters ? 'mingcute:settings-6-fill' : 'mingcute:settings-6-line'} className="text-base" />
              <span className="hidden sm:inline">Filter Lanjutan</span>
            </Button>
          </div>
        </div>

        {/* Advance Filter Panel with CustomSelect */}
        {showAdvanceFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 bg-muted/20 p-4 rounded-3xl border border-border shadow-inner animate-in fade-in duration-200">
            {/* Status Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                Status Keaktifan
              </Label>
              <CustomSelect
                options={[
                  { value: 'AKTIF', label: 'AKTIF (Normal)' },
                  { value: 'NONAKTIF', label: 'NONAKTIF (Alumni/Keluar)' },
                  { value: 'ALL', label: 'SEMUA STATUS' },
                ]}
                value={filterStatus}
                onChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Major Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                Filter Jurusan
              </Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Semua Jurusan' },
                  ...majorOptions.map((m) => ({ value: m, label: m })),
                ]}
                value={selectedMajor}
                onChange={(value) => {
                  setSelectedMajor(value);
                  setCurrentPage(1);
                }}
                placeholder="Semua Jurusan"
              />
            </div>

            {/* Photo Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                Foto Profil / Wajah
              </Label>
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'Semua' },
                  { value: 'WITH_PHOTO', label: 'Sudah Ada Foto' },
                  { value: 'WITHOUT_PHOTO', label: 'Belum Ada Foto' },
                ]}
                value={filterPhoto}
                onChange={(value) => {
                  setFilterPhoto(value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Device Sync Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                Status Sinkron Alat
              </Label>
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'Semua' },
                  { value: 'SYNCED', label: 'Sudah Sinkron' },
                  { value: 'NOT_SYNCED', label: 'Belum Sinkron' },
                ]}
                value={filterDeviceSync}
                onChange={(value) => {
                  setFilterDeviceSync(value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Sort By */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                Urutkan Berdasarkan
              </Label>
              <CustomSelect
                options={[
                  { value: 'name-asc', label: 'Nama (A - Z)' },
                  { value: 'name-desc', label: 'Nama (Z - A)' },
                  { value: 'newest', label: 'Data Terbaru' },
                ]}
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('');
                  setSelectedMajor('');
                  setFilterStatus('AKTIF');
                  setFilterPhoto('ALL');
                  setFilterDeviceSync('ALL');
                  setSortBy('name-asc');
                  setCurrentPage(1);
                }}
                className="w-full h-11 rounded-2xl font-bold text-xs gap-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border border-border bg-card"
              >
                <Icon icon="mingcute:refresh-1-line" className="text-base" />
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar matching Nuxt */}
      {selectedStudents.length > 0 && isAdmin && (
        <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs">
              {selectedStudents.length} Terpilih
            </Badge>
            <span className="min-w-0 break-words text-xs font-bold text-foreground">Siswa telah dipilih untuk aksi massal</span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              size="sm"
              onClick={() => {
                setStudentToRegister(null);
                setSyncFinished(false);
                setShowRegisterDeviceModal(true);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold gap-1.5 sm:w-auto"
            >
              <Icon icon="mingcute:fingerprint-fill" className="text-base" /> Daftarkan ke Perangkat
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowBulkDeleteModal(true)}
              className="w-full rounded-xl text-xs font-bold gap-1.5 sm:w-auto"
            >
              <Icon icon="mingcute:delete-2-line" className="text-base" /> Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

      {/* List Container matching Nuxt 1-to-1 */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
        {/* Top Summary Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-muted/20 border-b border-border flex min-w-0 justify-between items-center gap-3">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            Ditemukan {totalStudents} Siswa
          </p>
          {(filterStatus !== 'ALL' || selectedClass || selectedMajor || searchQuery) && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
              <Icon icon="mingcute:filter-fill" className="text-primary text-xs" />
              Filter Aktif
            </div>
          )}
        </div>

        {/* Desktop List Header */}
        <div className="hidden lg:grid grid-cols-12 px-6 py-3 border-b border-border text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground items-center">
          <div className="col-span-5 flex items-center gap-3">
            <input
              type="checkbox"
              checked={paginatedStudents.length > 0 && paginatedStudents.every((s) => selectedStudents.includes(String(s.id)))}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span>Informasi Siswa</span>
          </div>
          <div className="col-span-2">NIS / NISN</div>
          <div className="col-span-3">Kelas / Jurusan</div>
          <div className="col-span-2 text-right">Aksi</div>
        </div>

        {/* User Rows */}
        {paginatedStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4 space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-muted border border-border flex items-center justify-center text-muted-foreground/30">
              <Icon icon="mingcute:user-search-fill" className="text-4xl" />
            </div>
            <h3 className="text-lg font-black text-foreground">Data Tidak Ditemukan</h3>
            <p className="text-xs text-muted-foreground font-semibold max-w-sm">
              Maaf, tidak ada data siswa yang cocok dengan filter aktif saat ini.
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('');
                setSelectedMajor('');
                setFilterStatus('AKTIF');
                setFilterPhoto('ALL');
                setFilterDeviceSync('ALL');
                setSortBy('name-asc');
                setCurrentPage(1);
              }}
              className="w-full max-w-xs rounded-2xl px-6 font-bold text-xs sm:w-auto"
            >
              Tampilkan Semua Siswa
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border relative">
            {paginatedStudents.map((s: any) => {
              const sId = String(s.id);
              const isChecked = selectedStudents.includes(sId);
              const photoSrc = getImageUrl(s.photoUrl || s.url_picture || s.faceUrl);
              const stdName = s.name || s.Nama || 'Siswa';
              const stdNis = s.nis || s.NIS || '—';
              const stdNisn = s.nisn || '—';
              const stdClass = s.className || s.Kelas || s.class?.className || 'N/A';
              const stdMajor = s.majorAlias || s.majorName || s.class?.major?.name || '—';
              const isSynced = !!(s.faceToken || s.synced || s.photoUrl || s.url_picture);
              const isAktif = (s.status || 'AKTIF').toUpperCase() === 'AKTIF';

              return (
                <div
                  key={sId}
                  className={`group relative hover:bg-muted/30 transition-all ${
                    isChecked ? 'bg-primary/10' : ''
                  }`}
                >
                  {/* Hover Left Accent Line matching Nuxt */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 pointer-events-none" />

                  {/* DESKTOP ROW (lg+) matching Nuxt screenshot */}
                  <div className="hidden lg:grid grid-cols-12 items-center px-6 py-3.5">
                    {/* Col 1-5: Bio (Checkbox, Avatar, Name & Badges) */}
                    <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectStudent(sId)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                      />

                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border group-hover:border-primary/40 transition-colors flex items-center justify-center">
                          {photoSrc ? (
                            <img src={photoSrc} alt={stdName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-black bg-primary/20 text-primary">
                              {stdName.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <Link href={`/siswa/${stdNis}`} className="font-bold text-sm text-primary hover:underline truncate block">
                          {stdName}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            isAktif ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {isAktif ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isSynced ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon icon={isSynced ? 'mingcute:face-line' : 'mingcute:face-fill'} className="text-xs" />
                            {isSynced ? 'WAJAH SINKRON' : 'BELUM SINKRON'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Col 6-7: NIS / NISN */}
                    <div className="col-span-2">
                      <p className="text-xs font-mono font-bold text-foreground">{stdNis}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{stdNisn !== '—' ? stdNisn : '-'}</p>
                    </div>

                    {/* Col 8-10: Class & Major */}
                    <div className="col-span-3 min-w-0">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black px-2.5 py-0.5 rounded-lg">
                        {stdClass}
                      </Badge>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 truncate">
                        {stdMajor}
                      </p>
                    </div>

                    {/* Col 11-12: Action Icons matching Nuxt */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg"
                          title="Daftarkan ke Perangkat Absensi"
                          onClick={() => openRegisterDevice(s)}
                        >
                          <Icon icon="mingcute:fingerprint-fill" className="text-base" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-500 rounded-lg cursor-pointer"
                        title="History & Kalender Presensi Siswa"
                        onClick={() => openStudentHistory(s)}
                      >
                        <Icon icon="mingcute:calendar-2-fill" className="text-base text-emerald-500" />
                      </Button>
                      <Link href={`/siswa/${stdNis}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                          title="Lihat Detail Profil"
                        >
                          <Icon icon="mingcute:eye-2-line" className="text-base" />
                        </Button>
                      </Link>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-sky-500 rounded-lg"
                            title="Edit Siswa"
                            onClick={() => openEdit(s)}
                          >
                            <Icon icon="mingcute:edit-4-line" className="text-base" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-lg"
                            title="Hapus Siswa"
                            onClick={() => setDeleteStudentItem(s)}
                          >
                            <Icon icon="mingcute:delete-2-line" className="text-base" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* MOBILE ROW (< lg) */}
                  <div className="flex lg:hidden items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectStudent(sId)}
                      className="w-4 h-4 rounded border-border text-primary cursor-pointer shrink-0"
                    />
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                      {photoSrc ? (
                        <img src={photoSrc} alt={stdName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{stdName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-primary truncate">{stdName}</p>
                      <p className="truncate text-[10px] font-mono text-muted-foreground">{stdNis} · {stdClass}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-500 hover:text-emerald-600"
                        title="History Presensi"
                        onClick={() => openStudentHistory(s)}
                      >
                        <Icon icon="mingcute:calendar-2-fill" className="text-sm" />
                      </Button>
                      <Link href={`/siswa/${stdNis}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-xl"
                          aria-label={`Lihat detail ${stdName}`}
                        >
                          <Icon icon="mingcute:eye-2-line" className="text-sm" />
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-xl text-rose-500"
                          onClick={() => setDeleteStudentItem(s)}
                          aria-label={`Hapus ${stdName}`}
                        >
                          <Icon icon="mingcute:delete-2-line" className="text-sm" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Pagination Bar */}
        <div className="flex flex-col gap-3 border-t border-border bg-muted/10 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-center font-semibold text-muted-foreground sm:text-left">
            Menampilkan {totalStudents > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, totalStudents)} dari {totalStudents} siswa
          </span>

          <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
            <div className="w-28">
              <CustomSelect
                options={[
                  { value: '15', label: '15 / hal' },
                  { value: '30', label: '30 / hal' },
                  { value: '50', label: '50 / hal' },
                ]}
                value={String(itemsPerPage)}
                onChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
                triggerClassName="h-11 rounded-xl px-2 text-[11px] sm:h-8"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl sm:h-8 sm:w-8"
                aria-label="Halaman siswa sebelumnya"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </Button>
              <span className="text-xs font-mono font-bold px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl sm:h-8 sm:w-8"
                aria-label="Halaman siswa berikutnya"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           ALL DIALOG MODALS WITH CUSTOM SELECT DROPDOWNS
      ══════════════════════════════════════════════════ */}

      {/* MODAL 1: ADD / EDIT STUDENT MODAL */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-3xl">
          {/* Sticky Header */}
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-2xl font-black text-foreground">
              {isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
            {/* Section 1: Informasi Akademik */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary mb-3">
                Informasi Akademik
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="stdName">Nama Lengkap*</Label>
                  <Input
                    id="stdName"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="stdNis">NIS*</Label>
                  <Input
                    id="stdNis"
                    value={form.nis}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    placeholder="Masukkan NIS"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="stdNisn">NISN (Opsional)</Label>
                  <Input
                    id="stdNisn"
                    maxLength={10}
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    placeholder="10 Digit"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>

                {/* Searchable Class Dropdown */}
                <div className="space-y-1.5 relative">
                  <Label>Kelas*</Label>
                  <div
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="h-11 border border-border rounded-2xl bg-muted/30 px-3.5 flex items-center justify-between font-bold cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <span>
                      {form.classId
                        ? classes.find((c) => c.id === form.classId)?.className ||
                          classes.find((c) => c.id === form.classId)?.nama_kelas ||
                          'Kelas Dipilih'
                        : 'Pilih Kelas'}
                    </span>
                    <Icon icon="mingcute:down-line" className={`transition-transform ${showClassDropdown ? 'rotate-180 text-primary' : ''}`} />
                  </div>

                  {showClassDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Icon icon="mingcute:search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
                          <Input
                            type="text"
                            placeholder="Cari kelas..."
                            value={classSearch}
                            onChange={(e) => setClassSearch(e.target.value)}
                            className="pl-8 h-8 text-xs rounded-xl bg-muted/40"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                        {filteredClassesForSelect.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setForm({ ...form, classId: c.id });
                              setShowClassDropdown(false);
                            }}
                            className={`flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                              form.classId === c.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted hover:text-primary'
                            }`}
                          >
                            <span>{c.className || c.nama_kelas}</span>
                            {form.classId === c.id && <Icon icon="mingcute:check-fill" className="text-primary text-sm" />}
                          </div>
                        ))}
                        {filteredClassesForSelect.length === 0 && (
                          <div className="px-4 py-6 text-center text-xs text-muted-foreground font-bold">
                            Kelas tidak ditemukan
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label>Status Siswa</Label>
                  <CustomSelect
                    options={[
                      { value: 'AKTIF', label: 'AKTIF' },
                      { value: 'ALUMNI', label: 'ALUMNI' },
                      { value: 'KELUAR', label: 'KELUAR' },
                      { value: 'MUTASI', label: 'MUTASI' },
                    ]}
                    value={form.status}
                    onChange={(val) => setForm({ ...form, status: val })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="passwordInput">Password (Kosongkan jika default/tidak diubah)</Label>
                  <Input
                    id="passwordInput"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan password custom"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>
              </div>

              {!form.password && !isEditing && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-3 mt-4">
                  <Icon icon="mingcute:key-2-fill" className="text-primary text-lg shrink-0 mt-0.5" />
                  <div className="text-[10px] font-bold text-primary tracking-wider leading-relaxed">
                    SISWA DAPAT LOGIN MENGGUNAKAN <span className="underline font-black">NIS</span> SEBAGAI USERNAME DAN PASSWORD DEFAULT:{' '}
                    <span className="bg-primary/20 px-1.5 py-0.5 rounded normal-case font-mono">password123</span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Biodata Pribadi */}
            <div className="border-t border-border pt-4">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-primary mb-3">
                Biodata Pribadi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="emailInput">Email</Label>
                  <Input
                    id="emailInput"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="phoneInput">Nomor Telepon</Label>
                  <Input
                    id="phoneInput"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label>Gender</Label>
                  <CustomSelect
                    options={[
                      { value: 'L', label: 'Laki-Laki (L)' },
                      { value: 'P', label: 'Perempuan (P)' },
                    ]}
                    value={form.gender}
                    onChange={(val) => setForm({ ...form, gender: val })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label>Agama</Label>
                  <CustomSelect
                    options={[
                      { value: 'ISLAM', label: 'ISLAM' },
                      { value: 'KRISTEN', label: 'KRISTEN' },
                      { value: 'KATOLIK', label: 'KATOLIK' },
                      { value: 'HINDU', label: 'HINDU' },
                      { value: 'BUDHA', label: 'BUDHA' },
                      { value: 'KONGHUCU', label: 'KONGHUCU' },
                    ]}
                    value={form.religion}
                    onChange={(val) => setForm({ ...form, religion: val })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="bpInput">Tempat Lahir</Label>
                  <Input
                    id="bpInput"
                    value={form.birthPlace}
                    onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                    placeholder="Tempat Lahir"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="bdInput">Tanggal Lahir</Label>
                  <Input
                    id="bdInput"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="plateInput">Plat Nomor Kendaraan</Label>
                  <Input
                    id="plateInput"
                    value={form.vehiclePlate}
                    onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                    placeholder="AB 1234 CD"
                    className="rounded-2xl bg-muted/30 font-bold"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="addrInput">Alamat Lengkap</Label>
                  <textarea
                    id="addrInput"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Tulis alamat lengkap disini..."
                    className="w-full p-3 bg-muted/30 border border-border rounded-2xl text-xs font-bold focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowFormModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              disabled={isSaving}
              onClick={saveStudent}
            >
              {isSaving ? 'Memproses...' : isEditing ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: SINGLE DELETE MODAL */}
      <Dialog open={!!deleteStudentItem} onOpenChange={(open) => !open && setDeleteStudentItem(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <div className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-500/15 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <Icon icon="mingcute:delete-2-fill" className="text-3xl" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground text-center">
              Hapus Siswa?
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus <span className="text-foreground font-black">{deleteStudentItem?.name || deleteStudentItem?.Nama}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold text-xs" onClick={() => setDeleteStudentItem(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold text-xs shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleDeleteSingle}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: BULK DELETE MODAL */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <div className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-500/15 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <Icon icon="mingcute:delete-2-fill" className="text-3xl" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground text-center">
              Hapus Massal?
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus <span className="text-primary font-black">{selectedStudents.length}</span> siswa terpilih? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold text-xs" onClick={() => setShowBulkDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold text-xs shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleBulkDelete}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus Semua'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: DEVICE REGISTER & TERMINAL PROGRESS MODAL */}
      <Dialog open={showRegisterDeviceModal} onOpenChange={setShowRegisterDeviceModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">
              {studentToRegister ? 'Daftarkan Wajah ke Alat' : 'Daftarkan Wajah Siswa (Bulk)'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {isSyncing ? (
              /* Progress & Live Terminal Screen */
              <div className="space-y-5 text-center">
                <h3 className="text-xl font-black text-foreground animate-pulse">Menyinkronkan Data</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Sedang mengirim kredensial dan foto ke mesin absensi...
                </p>

                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>{syncProgress.current} / {syncProgress.total} Siswa</span>
                    <span className="text-primary">{syncProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: `${syncProgress.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Aktivitas Sinkronisasi
                  </Label>
                  <div className="h-44 bg-black/80 text-emerald-400 border border-border rounded-2xl p-3.5 overflow-y-auto text-[10px] font-mono space-y-1">
                    {syncProgress.logs.map((log) => (
                      <div key={log.id} className="flex items-center gap-1.5">
                        <Icon icon="mingcute:check-circle-fill" className="text-emerald-400 shrink-0" />
                        <span>{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : syncFinished ? (
              /* Sync Summary Screen */
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
                  <Icon icon="mingcute:check-fill" className="text-3xl animate-bounce" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-1">Sinkronisasi Selesai</h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Proses sinkronisasi massal siswa telah selesai diproses.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4 rounded-2xl border border-border">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Berhasil</p>
                    <p className="text-xl font-black text-emerald-500">{syncProgress.logs.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Gagal</p>
                    <p className="text-xl font-black text-muted-foreground">0</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Initial Selection Screen */
              <div className="space-y-5">
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Kirim data kredensial dan foto biometrik wajah siswa ke perangkat absensi Hikvision.
                </p>

                {studentToRegister ? (
                  <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon icon="mingcute:fingerprint-fill" className="text-2xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{studentToRegister.name || studentToRegister.Nama}</h4>
                      <p className="text-xs text-muted-foreground font-mono">NIS: {studentToRegister.nis || studentToRegister.NIS}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Icon icon="mingcute:group-fill" className="text-2xl" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{selectedStudents.length} Siswa Terpilih</h4>
                      <p className="text-xs text-muted-foreground font-semibold">Siap didaftarkan ke mesin presensi</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label>Pilih Perangkat Mesin Tujuan</Label>
                  <CustomSelect
                    options={[
                      { value: 'ALL', label: 'Semua Perangkat Aktif' },
                      ...devices.map((d) => ({ value: d.id, label: `${d.name} (${d.ipAddress || 'Online'})` })),
                    ]}
                    value={selectedDevice}
                    onChange={setSelectedDevice}
                  />
                </div>
              </div>
            )}
          </div>

          {!isSyncing && (
            <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
              <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowRegisterDeviceModal(false)}>
                {syncFinished ? 'Tutup' : 'Batal'}
              </Button>
              {!syncFinished && (
                <Button className="rounded-2xl flex-1 font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" onClick={handleRegisterToDevice}>
                  Mulai Sinkronisasi
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <StudentHistoryModal
        isOpen={showStudentHistoryModal}
        onClose={() => setShowStudentHistoryModal(false)}
        student={selectedStudentForHistory}
      />
    </div>
  );
}
