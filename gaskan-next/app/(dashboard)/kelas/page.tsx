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
import { CustomSelect } from '@/components/shared/CustomSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function KelasPage() {
  const { user } = useAuth();
  const role = (user?.role || 'siswa').toLowerCase();
  const isAdmin = ['admin', 'developer'].includes(role);

  const [classes, setClasses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');

  // Form State
  const [form, setForm] = useState({
    id: '',
    majorId: '',
    grade: 10,
    section: '',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classRes, majorRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/classes/majors').catch(() => api.get('/jurusan')),
      ]);

      if (classRes.status === 'fulfilled' && classRes.value?.data) {
        setClasses(classRes.value.data.data || classRes.value.data || []);
      }
      if (majorRes.status === 'fulfilled' && majorRes.value?.data) {
        setMajors(majorRes.value.data.data || majorRes.value.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch classes/majors:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Automatic computed class name matching Nuxt
  const computedClassName = useMemo(() => {
    if (!form.grade || !form.majorId || !form.section) return '';
    const romanGrades: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };
    const major = majors.find((m) => m.id === form.majorId);
    if (!major) return '';
    return `${romanGrades[form.grade] || 'X'} ${major.alias || ''} ${form.section.toUpperCase()}`;
  }, [form.grade, form.majorId, form.section, majors]);

  const isDuplicate = useMemo(() => {
    if (!computedClassName) return false;
    return classes.some((cls) => cls.className === computedClassName && cls.id !== form.id);
  }, [computedClassName, form.id, classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const clsName = cls.className || `${cls.grade} ${cls.major?.alias || ''} ${cls.section || ''}`;
      const matchesSearch =
        clsName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.major?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = !selectedGrade || cls.grade === parseInt(selectedGrade);
      const matchesMajor = !selectedMajor || cls.majorId === selectedMajor;
      return matchesSearch && matchesGrade && matchesMajor;
    });
  }, [classes, searchQuery, selectedGrade, selectedMajor]);

  const openCreate = () => {
    setEditMode(false);
    setForm({
      id: '',
      majorId: majors[0]?.id || '',
      grade: 10,
      section: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (cls: any) => {
    setEditMode(true);
    setForm({
      id: cls.id,
      majorId: cls.majorId || '',
      grade: cls.grade || 10,
      section: cls.section || '',
      isActive: cls.isActive !== false,
    });
    setShowModal(true);
  };

  const saveClass = async () => {
    if (!form.majorId || !form.section.trim()) {
      toast.error('Jurusan dan Nama Rombel (Section) wajib diisi');
      return;
    }
    if (isDuplicate) {
      toast.error('Kelas ini sudah terdaftar!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        majorId: form.majorId,
        grade: form.grade,
        section: form.section.toUpperCase(),
        isActive: form.isActive,
      };

      if (editMode && form.id) {
        await api.put(`/classes/${form.id}`, payload);
        toast.success('Kelas berhasil diperbarui');
      } else {
        await api.post('/classes', payload);
        toast.success('Kelas berhasil ditambahkan');
      }
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan kelas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/classes/${deleteId}`);
      toast.success('Kelas berhasil dihapus');
      setDeleteId(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus kelas');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat data kelas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Manajemen Kelas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola daftar kelas dan rombel siswa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/jurusan">
            <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs">
              <Icon icon="mingcute:building-2-fill" className="text-base" /> Kelola Jurusan
            </Button>
          </Link>
          {isAdmin && (
            <Button
              onClick={openCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs shadow-lg shadow-primary/20"
            >
              <Icon icon="mingcute:add-circle-fill" className="text-lg" /> Tambah Kelas
            </Button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Icon icon="mingcute:search-line" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
          <Input
            type="text"
            placeholder="Cari nama kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background border-border rounded-2xl text-xs font-bold"
          />
        </div>

        {/* Grade Filter */}
        <div className="w-full sm:w-44">
          <CustomSelect
            options={[
              { value: '', label: 'Semua Tingkat' },
              { value: '10', label: 'Kelas 10 (X)' },
              { value: '11', label: 'Kelas 11 (XI)' },
              { value: '12', label: 'Kelas 12 (XII)' },
            ]}
            value={selectedGrade}
            onChange={setSelectedGrade}
          />
        </div>

        {/* Major Filter */}
        <div className="w-full sm:w-48">
          <CustomSelect
            options={[
              { value: '', label: 'Semua Jurusan' },
              ...majors.map((m) => ({ value: m.id, label: m.alias || m.name })),
            ]}
            value={selectedMajor}
            onChange={setSelectedMajor}
          />
        </div>
      </div>

      {/* Bento Grid of Classes matching Nuxt */}
      {filteredClasses.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Icon icon="mingcute:school-line" className="text-5xl text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">Tidak ada kelas yang ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClasses.map((cls: any) => {
            const majorAlias = cls.major?.alias || cls.majorAlias || 'UMUM';
            const majorIcon = cls.major?.icon || 'mingcute:school-fill';
            const clsName = cls.className || `${cls.grade === 10 ? 'X' : cls.grade === 11 ? 'XI' : 'XII'} ${majorAlias} ${cls.section || ''}`;

            return (
              <div
                key={cls.id}
                className="bg-card rounded-3xl p-5 border border-border shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                        <Icon icon={majorIcon} className="text-xl" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Kelas {cls.grade}
                        </p>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase">
                          {majorAlias}
                        </Badge>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full"
                          onClick={() => openEdit(cls)}
                        >
                          <Icon icon="mingcute:edit-2-fill" className="text-sm" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-full"
                          onClick={() => setDeleteId(cls.id)}
                        >
                          <Icon icon="mingcute:delete-2-fill" className="text-sm" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Main Class Name */}
                  <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors my-2">
                    {clsName}
                  </h3>
                </div>

                {/* Bottom Row */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="mingcute:group-line" className="text-primary text-base" />
                    <span>{cls.totalStudents || cls._count?.students || 0} Siswa</span>
                  </div>
                  <Badge className={cls.isActive !== false ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px]' : 'bg-muted text-muted-foreground text-[9px]'}>
                    {cls.isActive !== false ? 'Aktif' : 'Non-aktif'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">
              {editMode ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            {/* Jurusan Dropdown */}
            <div className="space-y-2">
              <Label>Jurusan</Label>
              <CustomSelect
                options={majors.map((m) => ({ value: m.id, label: `${m.name} (${m.alias})` }))}
                value={form.majorId}
                onChange={(val) => setForm({ ...form, majorId: val })}
                placeholder="Pilih Jurusan"
              />
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <Label>Tingkat Kelas</Label>
              <CustomSelect
                options={[
                  { value: '10', label: 'Kelas 10 (X)' },
                  { value: '11', label: 'Kelas 11 (XI)' },
                  { value: '12', label: 'Kelas 12 (XII)' },
                ]}
                value={String(form.grade)}
                onChange={(val) => setForm({ ...form, grade: parseInt(val) })}
              />
            </div>

            {/* Rombel / Section */}
            <div className="space-y-2">
              <Label htmlFor="sectionInput">Nomor Rombel / Section</Label>
              <Input
                id="sectionInput"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="Contoh: 1 (menjadi X AK 1)"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            {/* Computed Preview */}
            {computedClassName && (
              <div className="p-3 bg-muted/40 border border-border rounded-2xl flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">Nama Kelas Dihasilkan:</span>
                <span className="text-sm font-black text-primary">{computedClassName}</span>
              </div>
            )}
            {isDuplicate && (
              <p className="text-[11px] text-rose-500 font-bold">Kelas {computedClassName} sudah ada di sistem!</p>
            )}
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              disabled={isSaving || isDuplicate}
              onClick={saveClass}
            >
              {isSaving ? 'Memproses...' : editMode ? 'Simpan Perubahan' : 'Tambah Kelas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONFIRM DELETE MODAL ═══ */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon icon="mingcute:delete-2-fill" className="text-3xl" />
          </div>
          <DialogHeader className="p-0 border-none bg-transparent">
            <DialogTitle className="text-2xl font-black text-foreground text-center">
              Hapus Kelas?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed my-2">
            Data kelas ini akan dihapus dari sistem. Pastikan siswa di dalamnya telah dialokasikan ulang.
          </p>
          <DialogFooter className="p-0 border-none bg-transparent gap-3 flex-row justify-center mt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleDeleteClass}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
