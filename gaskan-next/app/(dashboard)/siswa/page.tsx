'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExportButtons } from '@/components/shared/ExportButtons';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State matching Nuxt
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [filterStatus, setFilterStatus] = useState('AKTIF');
  const [filterPhoto, setFilterPhoto] = useState('ALL');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

  // Selection & Bulk State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showDeviceSyncModal, setShowDeviceSyncModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State
  const [form, setForm] = useState({
    id: '',
    name: '',
    nis: '',
    nisn: '',
    classId: '',
    email: '',
    phone: '',
    gender: 'L',
    religion: 'Islam',
    address: '',
    vehiclePlate: '',
    status: 'AKTIF',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stdRes, clsRes, mjrRes, devRes] = await Promise.allSettled([
        api.get('/students').catch(() => api.get('/siswa')),
        api.get('/classes').catch(() => api.get('/kelas')),
        api.get('/classes/majors').catch(() => api.get('/jurusan')),
        api.get('/device').catch(() => ({ data: [] })),
      ]);

      if (stdRes.status === 'fulfilled' && stdRes.value?.data) {
        setStudents(stdRes.value.data.data || stdRes.value.data || []);
      }
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
      console.error('Failed to fetch students data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering Logic matching Nuxt index.vue
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const nameMatch =
        (s.name || s.Nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis || s.NIS || '').includes(searchQuery);

      const classMatch = !selectedClass || s.classId === selectedClass || s.className === selectedClass || s.kelasId === selectedClass;
      const majorMatch = !selectedMajor || s.majorId === selectedMajor || s.majorAlias === selectedMajor;

      let statusMatch = true;
      if (filterStatus !== 'ALL') {
        const stdStatus = (s.status || 'AKTIF').toUpperCase();
        statusMatch = stdStatus === filterStatus;
      }

      let photoMatch = true;
      if (filterPhoto === 'ADA_FOTO') photoMatch = !!(s.photoUrl || s.url_picture || s.faceUrl);
      if (filterPhoto === 'TANPA_FOTO') photoMatch = !(s.photoUrl || s.url_picture || s.faceUrl);

      return nameMatch && classMatch && majorMatch && statusMatch && photoMatch;
    });
  }, [students, searchQuery, selectedClass, selectedMajor, filterStatus, filterPhoto]);

  // Pagination
  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Select / Deselect Handlers
  const toggleSelectStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === paginatedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(paginatedStudents.map((s) => String(s.id)));
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
      email: '',
      phone: '',
      gender: 'L',
      religion: 'Islam',
      address: '',
      vehiclePlate: '',
      status: 'AKTIF',
    });
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
      email: s.email || s.Email || '',
      phone: s.phone || s.Nomor || '',
      gender: s.gender || s.Gender || 'L',
      religion: s.religion || s.Agama || 'Islam',
      address: s.address || s.Alamat || '',
      vehiclePlate: s.vehiclePlate || s.Plat_Nomor || '',
      status: (s.status || 'AKTIF').toUpperCase(),
    });
    setShowFormModal(true);
  };

  const saveStudent = async () => {
    if (!form.nis.trim() || !form.name.trim()) {
      toast.error('NIS dan Nama Siswa wajib diisi');
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
        toast.success('Siswa baru berhasil ditambahkan');
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
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/students/${deleteId}`).catch(() => api.delete(`/siswa/${deleteId}`));
      toast.success('Siswa berhasil dihapus');
      setDeleteId(null);
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
      toast.error('Gagal menghapus siswa terpilih');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncToDevices = async () => {
    if (selectedStudents.length === 0) return;
    setIsSyncing(true);
    try {
      await api.post('/students/bulk-register-device', {
        studentIds: selectedStudents,
        deviceId: selectedDevice,
      });
      toast.success('Sinkronisasi ke perangkat mesin berhasil diproses');
      setShowDeviceSyncModal(false);
      setSelectedStudents([]);
    } catch (e: any) {
      toast.error('Gagal memproses sinkronisasi perangkat');
    } finally {
      setIsSyncing(false);
    }
  };

  const avatarColors = [
    'bg-primary/20 text-primary',
    'bg-emerald-500/20 text-emerald-500',
    'bg-amber-500/20 text-amber-500',
    'bg-sky-500/20 text-sky-500',
    'bg-rose-500/20 text-rose-500',
  ];
  const avatarColor = (name?: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  const exportData = filteredStudents.map((s) => ({
    nis: s.nis || s.NIS || '',
    nama: s.name || s.Nama || '',
    kelas: s.className || s.Kelas || '',
    jurusan: s.majorAlias || s.majorName || '',
    gender: s.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat direktori siswa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Direktori Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola data siswa, foto absensi, dan sinkronisasi ke mesin presensi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons data={exportData} columns={exportColumns} fileName="direktori_siswa" title="Data Siswa" />

          {isAdmin && (
            <>
              <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs shadow-lg shadow-primary/20">
                <Icon icon="mingcute:add-circle-fill" className="text-lg" /> Tambah Siswa
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Toolbar matching Nuxt */}
      <div className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Icon icon="mingcute:search-line" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
            <Input
              type="text"
              placeholder="Cari nama / NIS..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-background border-border rounded-xl text-xs font-semibold"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id || cls.className}>
                {cls.className || cls.nama_kelas}
              </option>
            ))}
          </select>

          {/* Major Filter */}
          <select
            value={selectedMajor}
            onChange={(e) => {
              setSelectedMajor(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Semua Jurusan</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id || m.alias}>
                {m.name || m.nama_jurusan} ({m.alias})
              </option>
            ))}
          </select>
        </div>

        {/* Chip Filters & Toggle Advance */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'AKTIF', label: 'AKTIF' },
              { id: 'NONAKTIF', label: 'NON-AKTIF' },
              { id: 'LULUS', label: 'LULUS' },
              { id: 'ALL', label: 'SEMUA' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setFilterStatus(st.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  filterStatus === st.id
                    ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanceFilters(!showAdvanceFilters)}
            className="text-xs font-bold text-muted-foreground hover:text-primary gap-1"
          >
            <Icon icon="mingcute:filter-2-line" className="text-sm" />
            {showAdvanceFilters ? 'Sembunyikan Filter' : 'Filter Lanjutan'}
          </Button>
        </div>

        {/* Advance Filters Bar */}
        {showAdvanceFilters && (
          <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
            <div>
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-1 block">
                Filter Foto Profil
              </Label>
              <select
                value={filterPhoto}
                onChange={(e) => setFilterPhoto(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-semibold"
              >
                <option value="ALL">Semua Siswa</option>
                <option value="ADA_FOTO">Memiliki Foto Profil</option>
                <option value="TANPA_FOTO">Belum Ada Foto Profil</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar (when students are selected) */}
      {selectedStudents.length > 0 && isAdmin && (
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs">
              {selectedStudents.length} Terpilih
            </Badge>
            <span className="text-xs font-bold text-foreground">Siswa telah dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowDeviceSyncModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold gap-1.5"
            >
              <Icon icon="mingcute:sync-line" className="text-base" /> Daftarkan ke Mesin
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowBulkDeleteModal(true)}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <Icon icon="mingcute:delete-2-line" className="text-base" /> Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-3 border-b border-border bg-muted/20">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedStudents.length > 0 && selectedStudents.length === paginatedStudents.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="col-span-4">Siswa</div>
              <div className="col-span-2">NIS / NISN</div>
              <div className="col-span-2">Kelas & Jurusan</div>
              <div className="col-span-2">Kontak / Gender</div>
              <div className="col-span-1 text-right">Aksi</div>
            </div>

            {/* Table Rows */}
            {paginatedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 space-y-2">
                <Icon icon="mingcute:user-search-line" className="text-5xl" />
                <p className="text-xs font-black uppercase tracking-widest">Siswa tidak ditemukan</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginatedStudents.map((s: any) => {
                  const sId = String(s.id);
                  const isChecked = selectedStudents.includes(sId);
                  const photoSrc = getImageUrl(s.photoUrl || s.url_picture || s.faceUrl);
                  const stdName = s.name || s.Nama || 'Siswa';
                  const stdNis = s.nis || s.NIS || '—';
                  const stdClass = s.className || s.Kelas || '—';
                  const stdMajor = s.majorAlias || s.majorName || 'Umum';

                  return (
                    <div
                      key={sId}
                      className={`grid grid-cols-12 items-center px-6 py-3.5 hover:bg-primary/5 transition-colors ${
                        isChecked ? 'bg-primary/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(sId)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>

                      {/* Student Avatar & Name */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border shrink-0 shadow-inner flex items-center justify-center">
                          {photoSrc ? (
                            <img src={photoSrc} alt={stdName} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${avatarColor(stdName)}`}>
                              {stdName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate hover:text-primary transition-colors cursor-pointer">
                            {stdName}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                            {s.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}
                          </p>
                        </div>
                      </div>

                      {/* NIS */}
                      <div className="col-span-2">
                        <p className="text-xs font-mono font-bold text-primary">{stdNis}</p>
                        {s.nisn && <p className="text-[10px] font-mono text-muted-foreground">NISN: {s.nisn}</p>}
                      </div>

                      {/* Class & Major */}
                      <div className="col-span-2 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{stdClass}</p>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase mt-0.5">
                          {stdMajor}
                        </Badge>
                      </div>

                      {/* Phone / Contact */}
                      <div className="col-span-2">
                        <p className="text-xs font-mono font-bold text-foreground">{s.phone || s.Nomor || '—'}</p>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
                              onClick={() => openEdit(s)}
                            >
                              <Icon icon="mingcute:edit-2-fill" className="text-base" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-full"
                              onClick={() => setDeleteId(sId)}
                            >
                              <Icon icon="mingcute:delete-2-fill" className="text-base" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-3 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground font-semibold">
            Menampilkan {totalStudents > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, totalStudents)} dari {totalStudents} siswa
          </span>

          <div className="flex items-center gap-4">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value={10}>10 / hal</option>
              <option value={20}>20 / hal</option>
              <option value={50}>50 / hal</option>
            </select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="w-7 h-7 rounded-lg"
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
                className="w-7 h-7 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL: CREATE / EDIT STUDENT ═══ */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nisInput">NIS (Nomor Induk Siswa) *</Label>
                <Input
                  id="nisInput"
                  value={form.nis}
                  onChange={(e) => setForm({ ...form, nis: e.target.value })}
                  placeholder="20241001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nameInput">Nama Lengkap *</Label>
                <Input
                  id="nameInput"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ahmad Fauzi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="clsSelect">Kelas</Label>
                <select
                  id="clsSelect"
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">Pilih Kelas</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className || cls.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genderSelect">Jenis Kelamin</Label>
                <select
                  id="genderSelect"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phoneInput">No. HP / WhatsApp</Label>
                <Input
                  id="phoneInput"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="081234567890"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="statusSelect">Status Siswa</Label>
                <select
                  id="statusSelect"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="NONAKTIF">NON-AKTIF</option>
                  <option value="LULUS">LULUS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="addressInput">Alamat Tempat Tinggal</Label>
              <Input
                id="addressInput"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Jl. Kusumabangsa No. 1..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowFormModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-xl font-bold bg-primary text-primary-foreground"
              disabled={isSaving}
              onClick={saveStudent}
            >
              {isSaving ? 'Memproses...' : isEditing ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: SINGLE DELETE ═══ */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-rose-500">Hapus Data Siswa?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Data siswa yang dihapus tidak dapat dikembalikan. Seluruh riwayat presensi terkait juga dapat terhapus.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-xl font-bold" disabled={isSaving} onClick={handleDeleteSingle}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: BULK DELETE ═══ */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-rose-500">
              Hapus {selectedStudents.length} Siswa Terpilih?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Anda akan menghapus {selectedStudents.length} data siswa secara bersamaan. Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowBulkDeleteModal(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-xl font-bold" disabled={isSaving} onClick={handleBulkDelete}>
              {isSaving ? 'Menghapus...' : 'Hapus Massal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: DEVICE SYNC ═══ */}
      <Dialog open={showDeviceSyncModal} onOpenChange={setShowDeviceSyncModal}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Sinkronisasi Ke Perangkat Mesin Absensi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <p className="text-muted-foreground font-semibold leading-relaxed">
              Daftarkan {selectedStudents.length} siswa terpilih ke mesin scanner presensi sekolah secara otomatis.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="devSelect">Pilih Perangkat Mesin Tujuan</Label>
              <select
                id="devSelect"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">Semua Perangkat Aktif</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ipAddress || 'Online'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowDeviceSyncModal(false)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600" disabled={isSyncing} onClick={handleSyncToDevices}>
              {isSyncing ? 'Proses Sinkronisasi...' : 'Mulai Sinkronisasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
