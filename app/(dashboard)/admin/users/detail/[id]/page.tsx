'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CustomSelect } from '@/components/shared/CustomSelect';
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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterDeviceModal, setShowRegisterDeviceModal] = useState(false);

  const [activeDevices, setActiveDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('ALL');
  const [registeringState, setRegisteringState] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    nis: '',
    nisn: '',
    role: 'SISWA',
    phone: '',
    gender: '',
    religion: '',
    birthDate: '',
    birthPlace: '',
    address: '',
    vehiclePlate: '',
    status: 'AKTIF',
  });

  const fetchUserDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`).catch(() => api.get(`/students/${userId}`));
      const d = res?.data?.data || res?.data;
      if (d) {
        setUser(d);
        setEditForm({
          name: d.name || d.nama || '',
          email: d.email || '',
          nis: d.nis || d.username || '',
          nisn: d.nisn || '',
          role: d.role || 'SISWA',
          phone: d.phone || d.noHp || '',
          gender: d.gender || '',
          religion: d.religion || '',
          birthDate: d.birthDate ? new Date(d.birthDate).toISOString().split('T')[0] : '',
          birthPlace: d.birthPlace || '',
          address: d.address || '',
          vehiclePlate: d.vehiclePlate || '',
          status: d.status || 'AKTIF',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil rincian data pengguna');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const saveUserDetail = async () => {
    if (!editForm.name) {
      toast.error('Nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/users/${userId}`, editForm).catch(() => api.patch(`/students/${userId}`, editForm));
      toast.success('Data pengguna berhasil diperbarui');
      setShowEditModal(false);
      await fetchUserDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui data pengguna');
    } finally {
      setSaving(false);
    }
  };

  const openRegisterDeviceModal = async () => {
    setSelectedDevice('ALL');
    setShowRegisterDeviceModal(true);
    try {
      const res = await api.get('/device');
      const d = res?.data?.data || res?.data || [];
      setActiveDevices(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterToDevice = async () => {
    setRegisteringState(true);
    try {
      await api.post(`/students/${userId}/register-device`, { deviceId: selectedDevice });
      toast.success('Pendaftaran wajah ke perangkat Hikvision berhasil');
      setShowRegisterDeviceModal(false);
      await fetchUserDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mendaftarkan ke perangkat');
    } finally {
      setRegisteringState(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-muted-foreground animate-pulse font-bold">
        Memuat detail pengguna...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-black text-foreground">Pengguna Tidak Ditemukan</h2>
        <Button onClick={() => router.push('/admin/users')} className="rounded-2xl">
          Kembali ke Manajemen User
        </Button>
      </div>
    );
  }

  const avatar = getAvatarUrl(user.photoUrl || user.avatar);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="p-2.5 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all text-muted-foreground"
        >
          <Icon icon="mingcute:left-line" className="text-lg" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Profil Rinci Pengguna</h1>
          <p className="text-xs text-muted-foreground font-semibold">ID Pengguna: #{user.id}</p>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-border pb-6">
          <Avatar className="w-24 h-24 border-2 border-primary/20 shadow-md">
            <AvatarImage src={avatar} alt={user.name} />
            <AvatarFallback className="font-black text-2xl bg-primary/10 text-primary">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-foreground">{user.name || user.nama}</h2>
              <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-black uppercase">
                {user.role || 'SISWA'}
              </Badge>
              <Badge className={user.status === 'AKTIF' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}>
                {user.status || 'AKTIF'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Username/NIS: {user.nis || user.username || '-'} · Email: {user.email || '-'}
            </p>
            <p className="text-xs text-muted-foreground font-semibold">
              Kelas: {user.class?.className || 'Tidak Terdaftar Dalam Kelas'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowEditModal(true)}
              variant="outline"
              className="rounded-2xl font-bold text-xs gap-2 h-10 border-border"
            >
              <Icon icon="mingcute:pencil-line" className="text-base" />
              Edit Profil
            </Button>

            <Button
              onClick={openRegisterDeviceModal}
              className="rounded-2xl font-black text-xs bg-primary text-primary-foreground gap-2 h-10 px-4"
            >
              <Icon icon="mingcute:face-fill" className="text-base" />
              Register Hikvision Gate
            </Button>
          </div>
        </div>

        {/* Detailed Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60">Nomor HP / WA</span>
            <p className="text-sm font-bold text-foreground mt-1">{user.phone || user.noHp || '-'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60">Plat Kendaraan</span>
            <p className="text-sm font-mono font-bold text-foreground mt-1">{user.vehiclePlate || '-'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60">Jenis Kelamin</span>
            <p className="text-sm font-bold text-foreground mt-1">{user.gender || '-'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60">Agama</span>
            <p className="text-sm font-bold text-foreground mt-1">{user.religion || '-'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60">Tempat, Tgl Lahir</span>
            <p className="text-sm font-bold text-foreground mt-1">
              {user.birthPlace || '-'}, {user.birthDate ? new Date(user.birthDate).toLocaleDateString('id-ID') : '-'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <span className="text-[10px] font-black uppercase text-muted-foreground/60">Alamat Tempat Tinggal</span>
            <p className="text-sm font-bold text-foreground mt-1 truncate">{user.address || '-'}</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Icon icon="mingcute:pencil-fill" className="text-primary text-xl" />
              Edit Informasi Profil Pengguna
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Nama Lengkap</Label>
              <Input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="rounded-2xl h-10 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Username / NIS</Label>
                <Input
                  type="text"
                  value={editForm.nis}
                  onChange={(e) => setEditForm({ ...editForm, nis: e.target.value })}
                  className="rounded-2xl h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Role Hak Akses</Label>
                <CustomSelect
                  value={editForm.role}
                  onChange={(val) => setEditForm({ ...editForm, role: val })}
                  options={[
                    { label: 'SISWA', value: 'SISWA' },
                    { label: 'GURU', value: 'GURU' },
                    { label: 'ADMIN', value: 'ADMIN' },
                    { label: 'DEVELOPER', value: 'DEVELOPER' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="rounded-2xl h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Nomor HP</Label>
                <Input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="rounded-2xl h-10 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Plat Kendaraan</Label>
              <Input
                type="text"
                placeholder="AB 1234 CD"
                value={editForm.vehiclePlate}
                onChange={(e) => setEditForm({ ...editForm, vehiclePlate: e.target.value })}
                className="rounded-2xl h-10 text-xs font-mono font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-2xl font-bold text-xs h-10">
              Batal
            </Button>
            <Button
              onClick={saveUserDetail}
              disabled={saving}
              className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground px-6 h-10"
            >
              {saving ? 'Memproses...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Hikvision Gate Device Modal */}
      <Dialog open={showRegisterDeviceModal} onOpenChange={setShowRegisterDeviceModal}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Icon icon="mingcute:face-fill" className="text-primary text-xl" />
              Register Wajah ke Physical Gate Hikvision
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground font-medium">
              Kirimkan data template wajah pengguna <strong>{user.name}</strong> ke mesin gerbang fisik Hikvision untuk verifikasi presensi otomatis.
            </p>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Pilih Target Perangkat Gate</Label>
              <CustomSelect
                value={selectedDevice}
                onChange={(val) => setSelectedDevice(val)}
                options={[
                  { label: 'Semua Perangkat Active Gate (ALL)', value: 'ALL' },
                  ...activeDevices.map((d: any) => ({ label: d.deviceName || d.name || d.ipAddress, value: d.id })),
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRegisterDeviceModal(false)} className="rounded-2xl font-bold text-xs h-10">
              Batal
            </Button>
            <Button
              onClick={handleRegisterToDevice}
              disabled={registeringState}
              className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground px-5 h-10"
            >
              {registeringState ? 'Mengirim...' : 'Sinkronkan Sekarang'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
