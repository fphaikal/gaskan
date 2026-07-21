'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ProfilePage() {
  const { user, login, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    'editPersonal' | 'editContact' | 'editVehicle' | 'editAvatar' | 'editFace' | 'changePass' | null
  >(null);

  // Form States
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('L');
  const [religion, setReligion] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  const [phone, setPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch Full Profile from API
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/user').catch(() => api.get('/auth/me'));
      if (res?.data) {
        const d = res.data.user || res.data.data || res.data;
        setProfileData(d);

        // Pre-fill forms
        setBirthPlace(d.TempatLahir && d.TempatLahir !== '-' ? d.TempatLahir : d.birthPlace || '');
        setBirthDate(d.TanggalLahir ? format(parseISO(d.TanggalLahir), 'yyyy-MM-dd') : d.birthDate || '');
        setGender(d.Gender || d.gender || 'L');
        setReligion(d.Agama || d.religion || 'Islam');
        setAddress(d.Alamat && d.Alamat !== '-' ? d.Alamat : d.address || '');
        setEmail(d.Email && d.Email !== '-' ? d.Email : d.email || '');
        setPhone(d.Nomor && d.Nomor !== '-' ? d.Nomor : d.phone || '');
        setVehiclePlate(d.Plat_Nomor && d.Plat_Nomor !== '-' ? d.Plat_Nomor : d.vehiclePlate || '');
      }
    } catch (e) {
      console.error('Failed to fetch full profile:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Derived user display properties
  const nama = profileData?.Nama || profileData?.name || user?.name || 'Pengguna';
  const kelas = profileData?.Kelas || profileData?.className || user?.role || 'Siswa';
  const nis = profileData?.NIS || profileData?.nis || user?.id || '—';
  const photoUrl = getImageUrl(profileData?.url_picture || profileData?.photoUrl || user?.avatar);
  const faceUrl = getImageUrl(profileData?.faceUrl || profileData?.url_picture);

  const ttlStr = useMemo(() => {
    const place = birthPlace || profileData?.TempatLahir || profileData?.birthPlace || '';
    const dateVal = birthDate || profileData?.TanggalLahir || profileData?.birthDate;
    const dateFormatted = dateVal ? format(parseISO(dateVal), 'd MMMM yyyy', { locale: localeId }) : '';
    if (place && dateFormatted) return `${place}, ${dateFormatted}`;
    if (dateFormatted) return dateFormatted;
    if (place) return place;
    return 'Belum Diatur';
  }, [birthPlace, birthDate, profileData]);

  // Handlers
  const handleSavePersonal = async () => {
    setIsSaving(true);
    try {
      const payload = {
        birthPlace,
        birthDate,
        gender,
        religion,
        address,
        email,
      };
      await api.put('/profile/biodata', payload).catch(() => api.put('/auth/profile', payload));
      toast.success('Informasi pribadi berhasil disimpan');
      await fetchProfile();
      await refreshUser();
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan informasi pribadi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setIsSaving(true);
    try {
      await api.put('/profile/phone', { phone }).catch(() => api.put('/auth/profile', { phone }));
      toast.success('Nomor kontak berhasil diperbarui');
      await fetchProfile();
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui nomor kontak');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    setIsSaving(true);
    try {
      await api.put('/profile/plate', { vehiclePlate }).catch(() => api.put('/auth/profile', { vehiclePlate }));
      toast.success('Plat nomor kendaraan berhasil diperbarui');
      await fetchProfile();
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui plat nomor kendaraan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Password saat ini wajib diisi');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok');
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password berhasil diperbarui');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file foto maksimal adalah 2MB!');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      await api.post('/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Foto profil berhasil diperbarui');
      await fetchProfile();
      await refreshUser();
      setActiveModal(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah foto profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
    setIsSaving(true);
    try {
      await api.delete('/profile/photo');
      toast.success('Foto profil berhasil dihapus');
      await fetchProfile();
      await refreshUser();
      setActiveModal(null);
    } catch (err: any) {
      toast.error('Gagal menghapus foto profil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Page Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Profil Saya</h1>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Kelola data diri, kontak, foto absensi, dan keamanan akun Anda
          </p>
        </div>
      </div>

      {/* 2-Column Grid Layout matching Nuxt ProfileCard.vue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── LEFT COLUMN (2-SPAN) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 1. Identity Card with Banner & Avatar */}
          <div className="overflow-hidden rounded-3xl bg-card border border-border shadow-sm">
            {/* Cover Banner */}
            <div className="relative h-32 md:h-44 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              <Image
                src="/banner.webp"
                alt="Profile cover banner"
                fill
                className="object-cover opacity-80"
                priority
              />
            </div>

            {/* Avatar & Info Container */}
            <div className="px-6 pb-8 text-center relative">
              {/* Avatar Circle */}
              <div className="relative mx-auto -mt-16 h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-card p-1.5 shadow-xl border-4 border-card z-10">
                <div className="relative h-full w-full mx-auto rounded-full overflow-hidden bg-muted group">
                  {photoUrl ? (
                    <img src={photoUrl} alt={nama} className="h-full w-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-primary/20 text-primary">
                      {nama.charAt(0)}
                    </div>
                  )}

                  {/* Edit Pencil Overlay */}
                  <button
                    type="button"
                    onClick={() => setActiveModal('editAvatar')}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Icon icon="mingcute:pencil-fill" className="text-white text-2xl drop-shadow-md" />
                  </button>
                </div>

                {/* Mobile Floating Pencil Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal('editAvatar')}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-card md:hidden"
                >
                  <Icon icon="mingcute:pencil-fill" className="text-sm" />
                </button>
              </div>

              {/* User Identity Details */}
              <div className="mt-4 space-y-1">
                <h2 className="text-2xl font-black text-foreground">{nama}</h2>
                <p className="font-bold text-sm text-muted-foreground">{kelas}</p>
                <div className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 bg-muted/60 border border-border text-foreground rounded-full text-xs font-mono font-bold shadow-sm">
                  NIS: {nis}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Info Card (Informasi Pribadi) */}
          <div className="rounded-3xl bg-card p-6 md:p-8 border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Informasi Pribadi
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModal('editPersonal')}
                className="text-xs font-bold text-muted-foreground hover:text-primary gap-1.5"
              >
                <Icon icon="mingcute:edit-2-line" className="text-base" />
                Edit
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* TTL */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:calendar-fill" className="text-xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Tempat, Tanggal Lahir
                  </p>
                  <p className="text-sm font-bold text-foreground truncate">{ttlStr}</p>
                </div>
              </div>

              {/* Gender & Agama */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:user-info-fill" className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Gender / Agama
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • {religion || 'Islam'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:mail-fill" className="text-xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-bold text-foreground truncate">{email || 'Belum Diatur'}</p>
                </div>
              </div>

              {/* Alamat */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:location-fill" className="text-xl" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Alamat
                  </p>
                  <p className="text-sm font-bold text-foreground leading-relaxed">{address || 'Belum Diatur'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (1-SPAN) ── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* 1. Contact Card (Kontak) */}
          <div className="rounded-3xl bg-card p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Kontak
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModal('editContact')}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Icon icon="mingcute:edit-2-line" className="text-base" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-inner">
                <Icon icon="mingcute:phone-fill" className="text-2xl" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  WhatsApp / Telp
                </p>
                <p className="text-base font-bold text-foreground font-mono mt-0.5 truncate">
                  {phone || 'Belum Diatur'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Vehicle Card (Kendaraan) */}
          <div className="rounded-3xl bg-card p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Kendaraan
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModal('editVehicle')}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Icon icon="mingcute:edit-2-line" className="text-base" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 shadow-inner">
                <Icon icon="mingcute:car-fill" className="text-2xl" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">
                  Plat Nomor
                </p>
                <div className="px-3 py-1 bg-muted/80 border border-border rounded-lg inline-block">
                  <span className="text-sm font-mono font-bold tracking-widest text-foreground">
                    {vehiclePlate || '----'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Foto Absensi Card (Face Recognition) */}
          <div className="rounded-3xl bg-card p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Foto Absensi
              </h3>
              {faceUrl ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                  Terdaftar
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                  Belum Ada
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative w-36 h-48 mx-auto rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
                {faceUrl ? (
                  <img src={faceUrl} alt="Foto Wajah" className="h-full w-full object-cover object-center" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground/50 p-4 text-center">
                    <Icon icon="mingcute:face-fill" className="text-4xl mb-2" />
                    <p className="text-xs font-semibold">Belum ada foto</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setActiveModal('editFace')}
                className="w-full rounded-xl font-bold gap-2 text-xs"
              >
                <Icon icon="mingcute:upload-2-fill" className="text-base" />
                {faceUrl ? 'Ganti Foto Wajah' : 'Unggah Foto Wajah'}
              </Button>
            </div>
          </div>

          {/* 4. Security Card (Keamanan) */}
          <div className="rounded-3xl bg-card p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Icon icon="mingcute:shield-shape-fill" className="text-xl" />
              </div>
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                Keamanan
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pastikan kata sandi Anda kuat dan tidak dibagikan ke siapapun.
            </p>
            <Button
              onClick={() => setActiveModal('changePass')}
              className="w-full rounded-xl font-bold gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icon icon="mingcute:key-2-fill" className="text-base" />
              Ganti Password
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           INTERACTIVE MODALS MATCHING NUXT
      ══════════════════════════════════════════════════ */}

      {/* Modal 1: Edit Personal Info */}
      <Dialog open={activeModal === 'editPersonal'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Informasi Pribadi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Tempat Lahir</Label>
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Contoh: Yogyakarta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold focus:outline-none"
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="religion">Agama</Label>
                <Input
                  id="religion"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  placeholder="Contoh: Islam"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@smtijogja.sch.id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Tempat Tinggal</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Kusumabangsa No. 1..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold" disabled={isSaving} onClick={handleSavePersonal}>
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Contact */}
      <Dialog open={activeModal === 'editContact'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Nomor Kontak</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp / Telp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold" disabled={isSaving} onClick={handleSaveContact}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Vehicle */}
      <Dialog open={activeModal === 'editVehicle'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Plat Kendaraan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Plat Nomor Kendaraan</Label>
              <Input
                id="vehiclePlate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="AB 1234 AB"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold" disabled={isSaving} onClick={handleSaveVehicle}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Edit Avatar */}
      <Dialog open={activeModal === 'editAvatar'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ubah Foto Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-primary">{nama.charAt(0)}</span>
              )}
            </div>

            <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            {photoUrl && (
              <Button variant="destructive" className="rounded-xl font-bold" disabled={isSaving} onClick={handleDeletePhoto}>
                Hapus Foto
              </Button>
            )}
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold" disabled={!selectedFile || isSaving} onClick={handleUploadAvatar}>
              {isSaving ? 'Mengunggah...' : 'Unggah Foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Edit Face Photo */}
      <Dialog open={activeModal === 'editFace'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Unggah Foto Wajah Absensi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 flex flex-col items-center">
            <div className="w-36 h-48 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : faceUrl ? (
                <img src={faceUrl} alt="Foto Wajah" className="w-full h-full object-cover" />
              ) : (
                <Icon icon="mingcute:face-fill" className="text-5xl text-muted-foreground/40" />
              )}
            </div>

            <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
            <p className="text-[11px] text-muted-foreground text-center max-w-xs">
              Pastikan wajah terlihat jelas, menghadap depan, dan pencahayaan cukup untuk deteksi sistem absensi.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold" disabled={!selectedFile || isSaving} onClick={handleUploadAvatar}>
              {isSaving ? 'Mengunggah...' : 'Simpan Foto Wajah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 6: Change Password */}
      <Dialog open={activeModal === 'changePass'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ganti Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="currPass">Password Saat Ini</Label>
              <Input
                id="currPass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPass">Password Baru</Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confPass">Konfirmasi Password Baru</Label>
              <Input
                id="confPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSaving} onClick={handleChangePassword}>
              {isSaving ? 'Memproses...' : 'Ubah Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
