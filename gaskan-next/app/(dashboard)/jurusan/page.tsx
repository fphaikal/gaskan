'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
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
        <div className="flex items-center gap-2">
          <Link href="/kelas">
            <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs">
              <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Kelas
            </Button>
          </Link>
          {isAdmin && (
            <Button
              onClick={openCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs shadow-lg shadow-primary/20"
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
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Icon icon="mingcute:school-line" className="text-5xl text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">Belum ada jurusan yang terdaftar</p>
          {isAdmin && (
            <Button onClick={openCreate} className="rounded-xl font-bold text-xs">
              Tambah Jurusan Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {majors.map((m: any) => (
            <div
              key={m.id}
              className="bg-card rounded-3xl p-5 border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
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
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                      onClick={() => openEdit(m)}
                    >
                      <Icon icon="mingcute:edit-2-fill" className="text-base" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-full"
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
                <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                  {m.name}
                </h3>

                {/* Stats Row */}
                <div className="flex items-center gap-4 py-3 border-y border-border/60 my-3 text-xs font-bold text-muted-foreground">
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
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {editMode ? 'Edit Jurusan' : 'Tambah Jurusan Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            {/* Nama Jurusan */}
            <div className="space-y-1.5">
              <Label htmlFor="majorName">Nama Jurusan / Departemen</Label>
              <Input
                id="majorName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Analisis Kimia"
              />
              {isDuplicateName && (
                <p className="text-[11px] text-rose-500 font-bold">Nama jurusan ini sudah digunakan.</p>
              )}
            </div>

            {/* Singkatan (Alias) */}
            <div className="space-y-1.5">
              <Label htmlFor="majorAlias">Singkatan (Alias)</Label>
              <Input
                id="majorAlias"
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value.toUpperCase() })}
                placeholder="Contoh: AK"
              />
              {isDuplicateAlias && (
                <p className="text-[11px] text-rose-500 font-bold">Singkatan jurusan ini sudah digunakan.</p>
              )}
            </div>

            {/* Icon Selector Grid */}
            <div className="space-y-2">
              <Label>Pilih Ikon Jurusan</Label>
              <div className="grid grid-cols-6 gap-2 bg-muted/30 p-3 rounded-2xl border border-border">
                {availableIcons.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic.name })}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all ${
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

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-xl font-bold bg-primary text-primary-foreground"
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
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-rose-500">Hapus Jurusan?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Data jurusan yang dihapus tidak dapat dikembalikan. Seluruh asosiasi kelas dan siswa akan diperbarui.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-xl font-bold" disabled={isSaving} onClick={handleDeleteMajor}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
