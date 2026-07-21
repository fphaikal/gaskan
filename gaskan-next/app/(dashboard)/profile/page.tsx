'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { CustomSelect } from '@/components/shared/CustomSelect';
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
  const { user, refreshUser } = useAuth();
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
  const [religion, setReligion] = useState('ISLAM');
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
        setReligion((d.Agama || d.religion || 'ISLAM').toUpperCase());
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-10 animate-in fade-in duration-500">
      {/* 2-Column Grid Layout matching Nuxt ProfileCard.vue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* ── LEFT COLUMN (2-SPAN) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
          {/* 1. Identity Card with Banner & Avatar */}
          <div className="overflow-hidden rounded-3xl bg-card border border-border shadow-sm">
            {/* Cover Banner */}
            <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              <img
                src="/banner.webp"
                alt="Profile cover"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Avatar & Info Container */}
            <div className="px-5 pb-6 text-center relative">
              {/* Avatar Circle */}
              <div className="relative mx-auto -mt-12 sm:-mt-14 h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-card p-1 shadow-lg border-4 border-card z-10">
                <div className="relative h-full w-full mx-auto rounded-full overflow-hidden bg-muted group">
                  {photoUrl ? (
                    <img src={photoUrl} alt={nama} className="h-full w-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black bg-primary/20 text-primary">
                      {nama.charAt(0)}
                    </div>
                  )}

                  {/* Edit Pencil Overlay */}
                  <button
                    type="button"
                    onClick={() => setActiveModal('editAvatar')}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Icon icon="mingcute:pencil-fill" className="text-white text-xl drop-shadow-md" />
                  </button>
                </div>

                {/* Mobile Floating Pencil Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal('editAvatar')}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-card md:hidden"
                >
                  <Icon icon="mingcute:pencil-fill" className="text-xs" />
                </button>
              </div>

              {/* User Identity Details */}
              <div className="mt-3 space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{nama}</h2>
                <p className="font-bold text-xs sm:text-sm text-muted-foreground">{kelas}</p>
                <div className="inline-flex items-center gap-1 mt-2.5 px-3.5 py-1 bg-muted/60 border border-border text-foreground rounded-full text-xs font-mono font-bold shadow-sm">
                  NIS: {nis}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Info Card (Informasi Pribadi) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Informasi Pribadi
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModal('editPersonal')}
                className="h-7 px-2 text-xs font-bold text-muted-foreground hover:text-primary gap-1"
              >
                <Icon icon="mingcute:edit-2-line" className="text-sm" />
                Edit
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* TTL */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:calendar-fill" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Tempat, Tanggal Lahir
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{ttlStr}</p>
                </div>
              </div>

              {/* Gender & Agama */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:user-info-fill" className="text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Gender / Agama
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • {religion || 'Islam'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:mail-fill" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Email
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{email || 'Belum Diatur'}</p>
                </div>
              </div>

              {/* Alamat */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:location-fill" className="text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Alamat
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">{address || 'Belum Diatur'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (1-SPAN) ── */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5">
          {/* 1. Contact Card (Kontak) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Kontak
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModal('editContact')}
                className="h-7 w-7 text-muted-foreground hover:text-primary"
              >
                <Icon icon="mingcute:edit-2-line" className="text-sm" />
              </Button>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-inner">
                <Icon icon="mingcute:phone-fill" className="text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  WhatsApp / Telp
                </p>
                <p className="text-sm font-bold text-foreground font-mono mt-0.5 truncate">
                  {phone || 'Belum Diatur'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Vehicle Card (Kendaraan) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Kendaraan
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModal('editVehicle')}
                className="h-7 w-7 text-muted-foreground hover:text-primary"
              >
                <Icon icon="mingcute:edit-2-line" className="text-sm" />
              </Button>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 shadow-inner">
                <Icon icon="mingcute:car-fill" className="text-xl" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                  Plat Nomor
                </p>
                <div className="px-2.5 py-0.5 bg-muted/80 border border-border rounded-lg inline-block">
                  <span className="text-xs font-mono font-bold tracking-widest text-foreground">
                    {vehiclePlate || '----'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Foto Absensi Card (Face Recognition) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Foto Absensi
              </h3>
              {faceUrl ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-bold px-2 py-0.5">
                  Terdaftar
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] font-bold px-2 py-0.5">
                  Belum Ada
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative w-28 h-36 mx-auto rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
                {faceUrl ? (
                  <img src={faceUrl} alt="Foto Wajah" className="h-full w-full object-cover object-center" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground/50 p-2 text-center">
                    <Icon icon="mingcute:face-fill" className="text-3xl mb-1 opacity-60" />
                    <p className="text-[10px] font-semibold">Belum ada foto</p>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setActiveModal('editFace')}
                className="w-full h-9 rounded-xl font-bold gap-1.5 text-xs"
              >
                <Icon icon="mingcute:upload-2-fill" className="text-sm" />
                {faceUrl ? 'Ganti Foto Wajah' : 'Unggah Foto Wajah'}
              </Button>
            </div>
          </div>

          {/* 4. Security Card (Keamanan) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Icon icon="mingcute:shield-shape-fill" className="text-lg" />
              </div>
              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest">
                Keamanan
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Pastikan kata sandi Anda kuat dan tidak dibagikan ke siapapun.
            </p>
            <Button
              onClick={() => setActiveModal('changePass')}
              className="w-full h-9 rounded-xl font-bold gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Icon icon="mingcute:key-2-fill" className="text-sm" />
              Ganti Password
            </Button>
          </div >
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           SPACIOUS MODALS WITH PROPER PADDING & GAP
      ══════════════════════════════════════════════════ */}

      {/* Modal 1: Edit Personal Info */}
      <Dialog open={activeModal === 'editPersonal'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Edit Informasi Pribadi</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="birthPlace">Tempat Lahir</Label>
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Contoh: Yogyakarta"
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label>Jenis Kelamin</Label>
                <CustomSelect
                  options={[
                    { value: 'L', label: 'Laki-Laki (L)' },
                    { value: 'P', label: 'Perempuan (P)' },
                  ]}
                  value={gender}
                  onChange={setGender}
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
                  value={religion}
                  onChange={setReligion}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@smtijogja.sch.id"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="address">Alamat Tempat Tinggal</Label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Kusumabangsa No. 1..."
                className="w-full p-3 bg-muted/30 border border-border rounded-2xl text-xs font-bold focus:outline-none resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20" disabled={isSaving} onClick={handleSavePersonal}>
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Contact */}
      <Dialog open={activeModal === 'editContact'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Edit Nomor Kontak</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="phone">Nomor WhatsApp / Telp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={isSaving} onClick={handleSaveContact}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Vehicle */}
      <Dialog open={activeModal === 'editVehicle'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Edit Plat Kendaraan</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="vehiclePlate">Plat Nomor Kendaraan</Label>
              <Input
                id="vehiclePlate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="AB 1234 AB"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={isSaving} onClick={handleSaveVehicle}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Edit Avatar */}
      <Dialog open={activeModal === 'editAvatar'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Ubah Foto Profil</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 flex flex-col items-center">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-primary">{nama.charAt(0)}</span>
              )}
            </div>

            <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs rounded-xl" />
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            {photoUrl && (
              <Button variant="destructive" className="rounded-2xl font-bold" disabled={isSaving} onClick={handleDeletePhoto}>
                Hapus Foto
              </Button>
            )}
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={!selectedFile || isSaving} onClick={handleUploadAvatar}>
              {isSaving ? 'Mengunggah...' : 'Unggah Foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Edit Face Photo */}
      <Dialog open={activeModal === 'editFace'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Unggah Foto Wajah Absensi</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 flex flex-col items-center">
            <div className="w-28 h-36 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : faceUrl ? (
                <img src={faceUrl} alt="Foto Wajah" className="w-full h-full object-cover" />
              ) : (
                <Icon icon="mingcute:face-fill" className="text-4xl text-muted-foreground/40" />
              )}
            </div>

            <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs rounded-xl" />
            <p className="text-[10px] text-muted-foreground text-center max-w-xs font-semibold">
              Pastikan wajah terlihat jelas, menghadap depan, dan pencahayaan cukup untuk deteksi sistem absensi.
            </p>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={!selectedFile || isSaving} onClick={handleUploadAvatar}>
              {isSaving ? 'Mengunggah...' : 'Simpan Foto Wajah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 6: Change Password */}
      <Dialog open={activeModal === 'changePass'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">Ganti Password</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="currPass">Password Saat Ini</Label>
              <Input
                id="currPass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="newPass">Password Baru</Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="confPass">Konfirmasi Password Baru</Label>
              <Input
                id="confPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={isSaving} onClick={handleChangePassword}>
              {isSaving ? 'Memproses...' : 'Ubah Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
