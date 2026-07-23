'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { DataMasterCardGridPageSkeleton } from '@/components/shared/DataMasterSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SemesterPage() {
  const { user } = useAuth();
  const role = (user?.role || 'siswa').toLowerCase();
  const isAdmin = ['admin', 'developer'].includes(role);

  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Modals
  const [showSemesterModal, setShowSemesterModal] = useState<boolean>(false);
  const [showAYModal, setShowAYModal] = useState<boolean>(false);
  const [showPromotionModal, setShowPromotionModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Forms
  const [form, setForm] = useState({
    id: '',
    name: '',
    academicYearId: '',
    startDate: '',
    endDate: '',
    isActive: false,
  });

  const [ayYear, setAyYear] = useState('');
  const [targetSemesterId, setTargetSemesterId] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [semRes, ayRes] = await Promise.allSettled([
        api.get('/semester'),
        api.get('/academic-years'),
      ]);

      if (semRes.status === 'fulfilled' && semRes.value?.data) {
        setSemesters(semRes.value.data.data || semRes.value.data || []);
      }
      if (ayRes.status === 'fulfilled' && ayRes.value?.data) {
        setAcademicYears(ayRes.value.data.data || ayRes.value.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch semester data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateSemester = () => {
    setEditMode(false);
    const activeAY = academicYears.find((ay) => ay.isActive)?.id || academicYears[0]?.id || '';
    setForm({
      id: '',
      name: '',
      academicYearId: activeAY,
      startDate: '',
      endDate: '',
      isActive: false,
    });
    setShowSemesterModal(true);
  };

  const openEditSemester = (sem: any) => {
    setEditMode(true);
    setForm({
      id: sem.id,
      name: sem.name || '',
      academicYearId: sem.academicYearId || '',
      startDate: sem.startDate ? sem.startDate.split('T')[0] : '',
      endDate: sem.endDate ? sem.endDate.split('T')[0] : '',
      isActive: sem.isActive || false,
    });
    setShowSemesterModal(true);
  };

  const saveSemester = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error('Nama semester, tanggal mulai, dan tanggal berakhir wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        academicYearId: form.academicYearId,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
      };

      if (editMode && form.id) {
        await api.put(`/semester/${form.id}`, payload);
        toast.success('Semester berhasil diperbarui');
      } else {
        await api.post('/semester', payload);
        toast.success('Semester berhasil ditambahkan');
      }
      setShowSemesterModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan semester');
    } finally {
      setIsSaving(false);
    }
  };

  const activateSemester = async (sem: any) => {
    try {
      await api.put(`/semester/${sem.id}/activate`);
      toast.success(`Semester ${sem.name} berhasil diaktifkan`);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mengaktifkan semester');
    }
  };

  const saveAcademicYear = async () => {
    if (!ayYear.trim()) {
      toast.error('Tahun ajaran wajib diisi (misal: 2025/2026)');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/academic-years', { year: ayYear, isActive: true });
      toast.success('Tahun ajaran berhasil ditambahkan');
      setAyYear('');
      setShowAYModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan tahun ajaran');
    } finally {
      setIsSaving(false);
    }
  };

  const runPromotion = async () => {
    if (!targetSemesterId) {
      toast.error('Pilih semester tujuan kenaikan kelas');
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.post('/system/promote', { targetSemesterId });
      const data = res.data?.data || res.data;
      toast.success(
        `Kenaikan kelas selesai: ${data?.promoted || 0} siswa naik, ${data?.graduated || 0} lulus`
      );
      setShowPromotionModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses kenaikan kelas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSemester = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/semester/${deleteId}`);
      toast.success('Semester berhasil dihapus');
      setDeleteId(null);
      await fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus semester');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DataMasterCardGridPageSkeleton
        actionCount={3}
        maxWidth="max-w-6xl"
        showToolbar={false}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Manajemen Semester
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola periode semester akademik dan proses kenaikan kelas
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAYModal(true)}
              className="rounded-2xl gap-2 font-bold text-xs"
            >
              <Icon icon="mingcute:add-line" className="text-base" /> Tambah Tahun Ajaran
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPromotionModal(true)}
              className="rounded-2xl gap-2 font-bold text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Icon icon="mingcute:arrow-to-up-line" className="text-base" /> Proses Kenaikan Kelas
            </Button>
            <Button
              onClick={openCreateSemester}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs shadow-lg shadow-primary/20"
            >
              <Icon icon="mingcute:add-circle-fill" className="text-lg" /> Tambah Semester
            </Button>
          </div>
        )}
      </div>

      {/* Semester Bento Grid matching Nuxt */}
      {semesters.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Icon icon="mingcute:calendar-line" className="text-5xl text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">Belum ada semester yang terdaftar</p>
          {isAdmin && (
            <Button onClick={openCreateSemester} className="rounded-xl font-bold text-xs">
              Tambah Semester Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {semesters.map((sem: any) => {
            const isCurrentActive = sem.isActive;
            const ayName = sem.academicYear?.year || 'Tahun Ajaran Aktif';

            return (
              <div
                key={sem.id}
                className={`bg-card rounded-3xl p-5 border shadow-sm transition-all group flex flex-col justify-between ${
                  isCurrentActive ? 'border-primary shadow-primary/10 ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase">
                      {ayName}
                    </Badge>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
                          onClick={() => openEditSemester(sem)}
                        >
                          <Icon icon="mingcute:edit-2-fill" className="text-base" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-full"
                          onClick={() => setDeleteId(sem.id)}
                        >
                          <Icon icon="mingcute:delete-2-fill" className="text-base" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Title & Dates */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                      {sem.name}
                    </h3>

                    <div className="space-y-1 py-2 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon icon="mingcute:calendar-fill" className="text-primary text-base shrink-0" />
                        <span>
                          {sem.startDate ? format(parseISO(sem.startDate), 'd MMM yyyy', { locale: localeId }) : '—'}
                          {' s/d '}
                          {sem.endDate ? format(parseISO(sem.endDate), 'd MMM yyyy', { locale: localeId }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status & Activate Action */}
                <div className="pt-4 border-t border-border flex items-center justify-between mt-4">
                  {isCurrentActive ? (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black uppercase px-3 py-1">
                      Status: Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                      Non-aktif
                    </Badge>
                  )}

                  {isAdmin && !isCurrentActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => activateSemester(sem)}
                      className="text-xs font-bold text-primary hover:bg-primary/10 gap-1 rounded-xl"
                    >
                      <Icon icon="mingcute:check-circle-fill" className="text-base" /> Aktifkan
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ MODAL 1: ADD / EDIT SEMESTER ═══ */}
      <Dialog open={showSemesterModal} onOpenChange={setShowSemesterModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">
              {editMode ? 'Edit Semester' : 'Tambah Semester Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <Label htmlFor="semName">Nama Semester</Label>
              <Input
                id="semName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Ganjil 2025/2026"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <CustomSelect
                options={academicYears.map((ay) => ({
                  value: ay.id,
                  label: `${ay.year} ${ay.isActive ? '(Aktif)' : ''}`,
                }))}
                value={form.academicYearId}
                onChange={(val) => setForm({ ...form, academicYearId: val })}
                placeholder="Pilih Tahun Ajaran"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Berakhir</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="isActiveCheck" className="cursor-pointer mb-0">
                Set sebagai semester aktif sekarang
              </Label>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowSemesterModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              disabled={isSaving}
              onClick={saveSemester}
            >
              {isSaving ? 'Memproses...' : editMode ? 'Simpan Perubahan' : 'Tambah Semester'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL 2: ADD ACADEMIC YEAR ═══ */}
      <Dialog open={showAYModal} onOpenChange={setShowAYModal}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Tambah Tahun Ajaran</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ayInput">Tahun Ajaran (Tahun/Tahun)</Label>
              <Input
                id="ayInput"
                value={ayYear}
                onChange={(e) => setAyYear(e.target.value)}
                placeholder="Contoh: 2025/2026"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowAYModal(false)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={isSaving} onClick={saveAcademicYear}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL 3: PROMOTION PROCESS ═══ */}
      <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-amber-500">
              Proses Kenaikan Kelas & Kelulusan
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            <p className="text-muted-foreground font-semibold leading-relaxed">
              Proses ini akan memindahkan siswa tingkat X ke XI, XI ke XII, dan meluluskan siswa tingkat XII ke semester tujuan yang dipilih.
            </p>
            <div className="space-y-2">
              <Label>Semester Tujuan Baru</Label>
              <CustomSelect
                options={semesters.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.academicYear?.year || '—'})`,
                }))}
                value={targetSemesterId}
                onChange={setTargetSemesterId}
                placeholder="Pilih Semester Tujuan"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowPromotionModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
              disabled={isSaving || !targetSemesterId}
              onClick={runPromotion}
            >
              {isSaving ? 'Memproses Kenaikan...' : 'Jalankan Kenaikan Kelas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL 4: CONFIRM DELETE ═══ */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <div className="p-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-rose-500/15 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <Icon icon="mingcute:delete-2-fill" className="text-3xl" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground text-center">
              Hapus Semester?
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Data semester ini akan dihapus. Perubahan ini dapat mempengaruhi histori absensi siswa.
            </p>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold text-xs" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold text-xs shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleDeleteSemester}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
