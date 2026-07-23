'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { DataMasterTablePageSkeleton } from '@/components/shared/DataMasterSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://gaskan-api.smtijogja.my.id';

const getAvatarUrl = (photoUrl?: string) => {
  if (!photoUrl) return '';
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
  return `${API_BASE}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [totalCount, setTotalCount] = useState(0);

  // Dialog State for Add User
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    nis: '',
    role: 'SISWA',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (filterRole) params.set('role', filterRole);

      const res = await api.get(`/users?${params.toString()}`).catch(() => api.get(`/admin?${params.toString()}`));
      const d = res?.data?.data || res?.data;
      if (Array.isArray(d)) {
        setUsers(d);
        if (res.data?.pagination) {
          setTotalCount(res.data.pagination.total);
        } else {
          setTotalCount(d.length);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar pengguna');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, searchQuery, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!form.name || (!form.email && !form.nis && !form.username)) {
      toast.error('Nama dan Username/NIP/Email wajib diisi');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/users', {
        name: form.name,
        email: form.email,
        username: form.username || form.nis,
        nis: form.nis || form.username,
        role: form.role,
        password: form.password || 'smtijogja123',
      });
      toast.success('Pengguna baru berhasil ditambahkan');
      setIsAddOpen(false);
      setForm({ name: '', email: '', username: '', nis: '', role: 'SISWA', password: '' });
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat pengguna baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleBadgeClass = (roleStr: string) => {
    switch ((roleStr || '').toUpperCase()) {
      case 'DEVELOPER':
        return 'bg-purple-500/15 text-purple-500 border-purple-500/30';
      case 'ADMIN':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
      case 'GURU':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Manajemen Pengguna (User Management)
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-black">
              {totalCount} Total User
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola semua akun pengguna sistem (Developer, Admin, Guru, dan Siswa).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/import-staff">
            <Button variant="outline" className="rounded-2xl font-bold text-xs gap-2 h-11 border-border">
              <Icon icon="mingcute:upload-3-line" className="text-base text-violet-500" />
              Import Staff Excel
            </Button>
          </Link>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-2xl font-black text-xs bg-primary text-primary-foreground gap-2 h-11 px-5"
          >
            <Icon icon="mingcute:add-circle-fill" className="text-lg" />
            Tambah User
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="relative flex-1 w-full">
          <Icon icon="mingcute:search-line" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
          <Input
            type="text"
            placeholder="Cari berdasarkan nama, email, NIS, NIP, atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-2xl h-11 bg-muted/30 text-xs font-bold"
          />
        </div>

        <div className="w-full sm:w-48">
          <CustomSelect
            value={filterRole}
            onChange={(val) => setFilterRole(val)}
            placeholder="Semua Role"
            options={[
              { label: 'Semua Role', value: '' },
              { label: 'DEVELOPER', value: 'DEVELOPER' },
              { label: 'ADMIN', value: 'ADMIN' },
              { label: 'GURU', value: 'GURU' },
              { label: 'SISWA', value: 'SISWA' },
            ]}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <DataMasterTablePageSkeleton />
      ) : (
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-black uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-4">Pengguna</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Username / NIS</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status Wajah</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold">
                {users.map((u: any) => {
                  const avatar = getAvatarUrl(u.photoUrl || u.avatar);
                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-border">
                            <AvatarImage src={avatar} alt={u.name || u.nama} />
                            <AvatarFallback className="font-black bg-primary/10 text-primary text-xs">
                              {(u.name || u.nama || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-foreground text-xs">{u.name || u.nama || 'Pengguna'}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{u.class?.className || 'ID: ' + u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`text-[9px] font-black border ${roleBadgeClass(u.role)}`}>
                          {(u.role || 'SISWA').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-foreground">{u.nis || u.username || '-'}</td>
                      <td className="p-4 text-muted-foreground">{u.email || '-'}</td>
                      <td className="p-4">
                        {u.faceEmbedding ? (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px]">
                            REGISTERED ✅
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px]">
                            NO FACE
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/users/detail/${u.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-primary gap-1">
                            <Icon icon="mingcute:eye-line" className="text-sm" />
                            Detail Profil
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Icon icon="mingcute:user-add-line" className="text-primary text-xl" />
              Tambah Pengguna Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">Nama Lengkap*</label>
              <Input
                type="text"
                placeholder="Nama..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-2xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Role Hak Akses*</label>
              <CustomSelect
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
                options={[
                  { label: 'SISWA', value: 'SISWA' },
                  { label: 'GURU', value: 'GURU' },
                  { label: 'ADMIN', value: 'ADMIN' },
                  { label: 'DEVELOPER', value: 'DEVELOPER' },
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Username / NIS / NIP*</label>
              <Input
                type="text"
                placeholder="Username / NIS..."
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value, nis: e.target.value })}
                className="rounded-2xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Email</label>
              <Input
                type="email"
                placeholder="user@smtijogja.sch.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-2xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Password Default</label>
              <Input
                type="password"
                placeholder="smtijogja123"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-2xl h-10 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-2xl font-bold text-xs h-10">
              Batal
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isSubmitting}
              className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground px-6 h-10"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
