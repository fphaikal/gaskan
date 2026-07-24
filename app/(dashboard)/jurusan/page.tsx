'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const availableIcons = [
  { id: 'chemistry', name: 'mingcute:flask-fill' },
  { id: 'industry', name: 'mingcute:factory-fill' },
  { id: 'mechanical', name: 'mingcute:settings-3-fill' },
  { id: 'computer', name: 'mingcute:computer-fill' },
  { id: 'electrical', name: 'mingcute:lightning-fill' },
  { id: 'school', name: 'mingcute:school-fill' },
  { id: 'building', name: 'mingcute:building-1-fill' },
  { id: 'science', name: 'mingcute:microscope-fill' },
  { id: 'tool', name: 'mingcute:tool-fill' },
  { id: 'art', name: 'mingcute:palette-fill' },
  { id: 'tech', name: 'mingcute:settings-1-fill' },
  { id: 'server', name: 'mingcute:server-fill' },
  { id: 'education', name: 'mingcute:book-4-fill' },
  { id: 'graduate', name: 'mingcute:book-2-fill' },
  { id: 'business', name: 'mingcute:briefcase-fill' },
  { id: 'certificate', name: 'mingcute:certificate-fill' },
  { id: 'group', name: 'mingcute:group-fill' },
  { id: 'device', name: 'mingcute:device-fill' },
];

export default function JurusanPage() {
  const { user } = useAuth();
  const role = (user?.role || 'siswa').toLowerCase();
  const isAdmin = ['admin', 'developer'].includes(role);

  const [majors, setMajors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    alias: '',
    icon: 'mingcute:school-fill',
  });

  const fetchMajors = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/classes/majors').catch(() => api.get('/jurusan'));
      if (res?.data) {
        setMajors(res.data.data || res.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch majors:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  const isDuplicateName = useMemo(() => {
    if (!form.name) return false;
    return majors.some(
      (m) => m.name?.toLowerCase() === form.name.toLowerCase() && m.id !== form.id
    );
  }, [form.name, form.id, majors]);

  const isDuplicateAlias = useMemo(() => {
    if (!form.alias) return false;
    return majors.some(
      (m) => m.alias?.toLowerCase() === form.alias.toLowerCase() && m.id !== form.id
    );
  }, [form.alias, form.id, majors]);

  const openCreate = () => {
    setEditMode(false);
    setForm({ id: '', name: '', alias: '', icon: 'mingcute:school-fill' });
    setShowModal(true);
  };

  const openEdit = (m: any) => {
    setEditMode(true);
    setForm({
      id: m.id,
      name: m.name || '',
      alias: m.alias || '',
      icon: m.icon || 'mingcute:school-fill',
    });
    setShowModal(true);
  };

  const saveMajor = async () => {
    if (!form.name.trim() || !form.alias.trim()) {
      toast.error('Nama dan Singkatan (Alias) jurusan tidak boleh kosong');
      return;
    }
    if (isDuplicateName || isDuplicateAlias) {
      toast.error('Nama atau Singkatan jurusan sudah terdaftar!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { name: form.name, alias: form.alias, icon: form.icon };
      if (editMode && form.id) {
        await api.put(`/classes/majors/${form.id}`, payload).catch(() => api.put(`/jurusan/${form.id}`, payload));
        toast.success('Jurusan berhasil diperbarui');
      } else {
        await api.post('/classes/majors', payload).catch(() => api.post('/jurusan', payload));
        toast.success('Jurusan berhasil ditambahkan');
      }
      setShowModal(false);
      await fetchMajors();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan jurusan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMajor = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/classes/majors/${deleteId}`).catch(() => api.delete(`/jurusan/${deleteId}`));
      toast.success('Jurusan berhasil dihapus');
      setDeleteId(null);
      await fetchMajors();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus jurusan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat data jurusan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Manajemen Jurusan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola daftar jurusan dan departemen sekolah
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 min-[420px]:flex-row sm:w-auto sm:items-center">
          <Link href="/kelas" className="w-full">
            <Button variant="outline" className="h-11 w-full gap-2 rounded-2xl text-xs font-bold">
              <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Kelas
            </Button>
          </Link>
          {isAdmin && (
            <Button
              onClick={openCreate}
              className="h-11 w-full gap-2 rounded-2xl bg-primary text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              <Icon icon="mingcute:add-circle-fill" className="text-lg" /> Tambah Jurusan
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner for non-admin */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3.5 text-amber-600 dark:text-amber-400">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 font-bold">
            <Icon icon="mingcute:information-line" className="text-xl" />
          </div>
          <p className="text-xs font-bold leading-relaxed">
            Anda masuk sebagai Guru. Penambahan atau perubahan data hanya dapat dilakukan oleh Administrator.
          </p>
        </div>
      )}

      {/* Major Bento Grid matching Nuxt */}
      {majors.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Icon icon="mingcute:school-line" className="text-5xl text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">Belum ada jurusan yang terdaftar</p>
          {isAdmin && (
            <Button onClick={openCreate} className="w-full max-w-xs rounded-xl font-bold text-xs sm:w-auto">
              Tambah Jurusan Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {majors.map((m: any) => (
            <div
              key={m.id}
              className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
            >
              {/* Background Watermark Icon */}
              <Icon
                icon={m.icon || 'mingcute:school-fill'}
                className="absolute -right-4 -bottom-4 text-9xl opacity-[0.03] -rotate-12 pointer-events-none"
              />

              {/* Card Top Row */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Icon icon={m.icon || 'mingcute:school-fill'} className="text-2xl" />
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary sm:h-8 sm:w-8"
                      aria-label={`Edit ${m.name}`}
                      onClick={() => openEdit(m)}
                    >
                      <Icon icon="mingcute:edit-2-fill" className="text-base" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 sm:h-8 sm:w-8"
                      aria-label={`Hapus ${m.name}`}
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Icon icon="mingcute:delete-2-fill" className="text-base" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Card Main Content */}
              <div className="relative z-10 space-y-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black tracking-widest uppercase">
                  {m.alias}
                </Badge>
                <h3 className="break-words text-lg font-black leading-snug text-foreground transition-colors group-hover:text-primary">
                  {m.name}
                </h3>

                {/* Stats Row */}
                <div className="my-3 flex flex-wrap items-center gap-3 border-y border-border/60 py-3 text-xs font-bold text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="mingcute:school-line" className="text-primary text-base" />
                    <span>{m.totalClasses || m._count?.classes || 0} Kelas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon icon="mingcute:group-line" className="text-primary text-base" />
                    <span>{m.totalStudents || m._count?.students || 0} Siswa</span>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  Update: {m.updatedAt ? format(parseISO(m.updatedAt), 'd MMM yyyy', { locale: localeId }) : 'Terbaru'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">
              {editMode ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
            {/* Nama Jurusan */}
            <div className="space-y-2">
              <Label htmlFor="majorName">Nama Jurusan / Departemen</Label>
              <Input
                id="majorName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Analisis Kimia"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
              {isDuplicateName && (
                <p className="text-[11px] text-rose-500 font-bold">Nama jurusan ini sudah digunakan.</p>
              )}
            </div>

            {/* Singkatan (Alias) */}
            <div className="space-y-2">
              <Label htmlFor="majorAlias">Singkatan (Alias)</Label>
              <Input
                id="majorAlias"
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value.toUpperCase() })}
                placeholder="Contoh: AK"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
              {isDuplicateAlias && (
                <p className="text-[11px] text-rose-500 font-bold">Singkatan jurusan ini sudah digunakan.</p>
              )}
            </div>

            {/* Icon Selector Grid */}
            <div className="space-y-2">
              <Label>Pilih Ikon Jurusan</Label>
              <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-muted/30 p-3 min-[420px]:grid-cols-6">
                {availableIcons.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic.name })}
                    className={`flex h-11 items-center justify-center rounded-xl transition-all ${
                      form.icon === ic.name
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon icon={ic.name} className="text-xl" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              disabled={isSaving || isDuplicateName || isDuplicateAlias}
              onClick={saveMajor}
            >
              {isSaving ? 'Memproses...' : editMode ? 'Simpan Perubahan' : 'Tambah Jurusan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONFIRM DELETE MODAL ═══ */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <div className="space-y-4 overflow-y-auto p-4 text-center sm:p-6">
            <div className="w-16 h-16 bg-rose-500/15 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <Icon icon="mingcute:delete-2-fill" className="text-3xl" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground text-center">
              Hapus Jurusan?
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Data jurusan yang dihapus tidak dapat dikembalikan. Seluruh asosiasi kelas dan siswa akan diperbarui.
            </p>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold text-xs" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold text-xs shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleDeleteMajor}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
