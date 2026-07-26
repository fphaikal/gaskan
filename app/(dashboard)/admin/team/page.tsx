'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const resolvePhoto = (url?: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/team/')) return `${API_BASE}${url}`;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getRoleColor = (roleStr: string) => {
  if (!roleStr) return 'text-muted-foreground';
  if (roleStr.includes('Backend')) return 'text-sky-400';
  if (roleStr.includes('Frontend')) return 'text-emerald-400';
  if (roleStr.includes('Hardware') || roleStr.includes('Electrical') || roleStr.includes('Mechanical')) return 'text-amber-500';
  if (roleStr.includes('PEMBIMBING') || roleStr.includes('Pembimbing')) return 'text-primary';
  return 'text-purple-400';
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    id: '',
    name: '',
    role: '',
    photoUrl: '',
    github: '',
    linkedin: '',
    instagram: '',
    email: '',
    bio: '',
    userId: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    isUntilNow: true,
    order: 0,
    isActive: true,
  });

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resTeam, resUsers] = await Promise.allSettled([
        api.get('/team'),
        api.get('/team/available-users').catch(() => api.get('/users')),
      ]);

      if (resTeam.status === 'fulfilled' && resTeam.value?.data) {
        const d = resTeam.value.data.data || resTeam.value.data;
        if (Array.isArray(d)) setMembers(d);
      }
      if (resUsers.status === 'fulfilled' && resUsers.value?.data) {
        const u = resUsers.value.data.data || resUsers.value.data;
        if (Array.isArray(u)) setAvailableUsers(u);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const openCreate = () => {
    setEditMode(false);
    setForm({
      id: '',
      name: '',
      role: '',
      photoUrl: '',
      github: '',
      linkedin: '',
      instagram: '',
      email: '',
      bio: '',
      userId: '',
      startYear: 2023,
      endYear: new Date().getFullYear(),
      isUntilNow: true,
      order: members.length,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEdit = (member: any) => {
    setEditMode(true);
    let startY = 2023;
    let endY = new Date().getFullYear();
    let untilNow = true;

    if (member.year) {
      const parts = member.year.split('-').map((s: string) => s.trim());
      if (parts.length === 2) {
        startY = parseInt(parts[0]) || 2023;
        if (parts[1].toLowerCase() === 'sekarang') {
          untilNow = true;
        } else {
          untilNow = false;
          endY = parseInt(parts[1]) || new Date().getFullYear();
        }
      } else {
        startY = parseInt(parts[0]) || 2023;
        endY = startY;
        untilNow = false;
      }
    }

    setForm({
      id: member.id,
      name: member.name || '',
      role: member.role || '',
      photoUrl: member.photoUrl || '',
      github: member.github || '',
      linkedin: member.linkedin || '',
      instagram: member.instagram || '',
      email: member.email || '',
      bio: member.bio || '',
      userId: member.userId || '',
      startYear: startY,
      endYear: endY,
      isUntilNow: untilNow,
      order: member.order || 0,
      isActive: member.isActive !== false,
    });
    setShowModal(true);
  };

  const saveMember = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error('Nama lengkap dan Peran wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const yearStr = form.isUntilNow
        ? `${form.startYear} - Sekarang`
        : form.startYear === form.endYear
        ? `${form.startYear}`
        : `${form.startYear} - ${form.endYear}`;

      const payload = {
        name: form.name,
        role: form.role,
        bio: form.bio,
        github: form.github,
        linkedin: form.linkedin,
        instagram: form.instagram,
        email: form.email,
        userId: form.userId || null,
        year: yearStr,
        order: form.order,
        isActive: form.isActive,
      };

      if (editMode && form.id) {
        await api.put(`/team/${form.id}`, payload);
        toast.success('Anggota tim diperbarui');
      } else {
        await api.post('/team', payload);
        toast.success('Anggota tim ditambahkan');
      }
      setShowModal(false);
      await fetchMembers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan data anggota tim');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/team/${deleteId}`);
      toast.success('Anggota tim dihapus');
      setDeleteId(null);
      await fetchMembers();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menghapus anggota tim');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <DataMasterCardGridPageSkeleton actionCount={1} toolbarItems={2} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Manajemen Tim
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola orang-orang di balik GASKAN & sambungkan ke akun siswa/user
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-11 w-full gap-2 rounded-2xl bg-primary text-xs font-black text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:w-auto"
        >
          <Icon icon="mingcute:user-add-fill" className="text-lg" />
          <span>Tambah Anggota</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="md:col-span-2 relative">
          <Icon icon="mingcute:search-line" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
          <Input
            type="text"
            placeholder="Cari Nama atau Peran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-leading-icon h-11 bg-background rounded-2xl text-xs font-bold border-border"
          />
        </div>
        <div className="flex items-center justify-center font-black text-xs text-muted-foreground/60 uppercase tracking-widest">
          TOTAL: {filteredMembers.length} ORANG
        </div>
      </div>

      {/* Bento Grid matching Nuxt 1-to-1 */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card px-4 py-14 text-center text-xs font-bold italic text-muted-foreground/40 sm:p-20">
          Belum ada data anggota tim
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const photo = resolvePhoto(m.photoUrl);
            const colorClass = getRoleColor(m.role);

            return (
              <div
                key={m.id}
                className="group flex min-w-0 flex-col justify-between rounded-3xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 sm:p-6"
              >
                <div>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden border border-primary/10">
                      {photo ? (
                        <img src={photo} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="mingcute:user-4-fill" className="text-2xl text-primary/40" />
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-foreground truncate text-base">{m.name}</h3>
                      <p className={`text-xs font-black uppercase tracking-wider mt-0.5 ${colorClass}`}>
                        {m.role}
                      </p>

                      {/* User account connection tag */}
                      {m.user ? (
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                          <Icon icon="mingcute:user-check-fill" className="text-xs" />
                          <span className="truncate max-w-[120px]">{m.user.name}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground/40 italic mt-1 font-semibold">
                          Belum terhubung akun
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-xl text-muted-foreground hover:text-primary sm:h-8 sm:w-8"
                        aria-label={`Edit ${m.name}`}
                        onClick={() => openEdit(m)}
                      >
                        <Icon icon="mingcute:edit-2-line" className="text-sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-xl text-muted-foreground hover:text-rose-500 sm:h-8 sm:w-8"
                        aria-label={`Hapus ${m.name}`}
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Icon icon="mingcute:delete-2-line" className="text-sm" />
                      </Button>
                    </div>
                  </div>

                  {m.bio && (
                    <p className="text-xs text-muted-foreground mt-3 italic line-clamp-2 bg-muted/40 p-2.5 rounded-2xl border border-border">
                      "{m.bio}"
                    </p>
                  )}
                </div>

                {/* Bottom Bar */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${m.isActive !== false ? 'bg-emerald-500' : 'bg-muted'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {m.isActive !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 text-muted-foreground">
                      Periode {m.year || '2023 - Sekarang'}
                    </Badge>
                    <span className="text-[10px] font-black text-muted-foreground/30">
                      Order: {m.order ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">
              {editMode ? 'Edit Anggota Tim' : 'Tambah Anggota Tim'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">Nama Lengkap</Label>
                <Input
                  id="memberName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Fahreza Pasha Haikal"
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberRole">Peran / Role</Label>
                <Input
                  id="memberRole"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Contoh: FRONTEND DEVELOPER"
                  className="rounded-2xl bg-muted/30 font-bold h-11 uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberBio">Bio / Deskripsi Profil</Label>
              <textarea
                id="memberBio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                placeholder="Tuliskan bio singkat..."
                className="w-full rounded-2xl border border-border bg-muted/30 p-3 text-base font-medium focus:outline-none sm:text-xs"
              />
            </div>

            {/* Connect User Account */}
            <div className="space-y-2">
              <Label>Sambungkan ke Akun Siswa/User</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Belum Terhubung Akun' },
                  ...availableUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` })),
                ]}
                value={form.userId}
                onChange={(val) => setForm({ ...form, userId: val })}
                placeholder="Pilih Akun User"
              />
            </div>

            {/* Year Range Picker */}
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startYr">Tahun Mulai</Label>
                <Input
                  id="startYr"
                  type="number"
                  value={form.startYear}
                  onChange={(e) => setForm({ ...form, startYear: parseInt(e.target.value) })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endYr">Tahun Selesai</Label>
                <Input
                  id="endYr"
                  type="number"
                  disabled={form.isUntilNow}
                  value={form.endYear}
                  onChange={(e) => setForm({ ...form, endYear: parseInt(e.target.value) })}
                  className="rounded-2xl bg-muted/30 font-bold h-11 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="untilNowCheck"
                checked={form.isUntilNow}
                onChange={(e) => setForm({ ...form, isUntilNow: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <Label htmlFor="untilNowCheck" className="cursor-pointer mb-0">
                Masih Aktif Sampai Sekarang ("Sekarang")
              </Label>
            </div>

            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orderNum">Urutan Tampilan (Order)</Label>
                <Input
                  id="orderNum"
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              disabled={isSaving}
              onClick={saveMember}
            >
              {isSaving ? 'Memproses...' : editMode ? 'Simpan Perubahan' : 'Tambah Anggota'}
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
              Hapus Anggota Tim?
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Data anggota tim ini akan dihapus dari daftar.
            </p>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold text-xs" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold text-xs shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleDeleteMember}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
