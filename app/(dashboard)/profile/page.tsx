'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { goeyToast as toast } from 'goey-toast';
import { Icon } from '@/components/ui/icon';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

function ProfileInfoRowsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3.5">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1 pt-0.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileSideCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>
      {tall ? (
        <>
          <Skeleton className="aspect-[4/5] h-auto w-28 mx-auto rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-xl sm:h-9" />
        </>
      ) : (
        <div className="flex items-center gap-3.5">
          <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div
      className="max-w-5xl mx-auto pb-10 animate-in fade-in duration-500"
      aria-label="Memuat profil"
      aria-busy="true"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
          <div className="overflow-hidden rounded-3xl bg-card border border-border shadow-sm">
            <Skeleton className="h-28 sm:h-36 w-full rounded-none" />
            <div className="relative px-4 pb-6 text-center sm:px-5">
              <Skeleton className="mx-auto -mt-12 sm:-mt-14 h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-card" />
              <div className="mt-3 flex flex-col items-center gap-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-32 rounded-full mt-1" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-7 w-14 rounded-lg" />
            </div>
            <ProfileInfoRowsSkeleton />
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5">
          <ProfileSideCardSkeleton />
          <ProfileSideCardSkeleton />
          <ProfileSideCardSkeleton tall />
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Field Permissions State
  const [fieldPermissionsMap, setFieldPermissionsMap] = useState<Record<string, string>>({});
  const [isSyncingPhotos, setIsSyncingPhotos] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Active Modals
  const [activeModal, setActiveModal] = useState<
    'avatarActions' | 'uploadAvatar' | 'editPersonal' | 'editContact' | 'editVehicle' | 'editFace' | 'changePass' | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faceFileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Fetch Field Permissions
  const fetchFieldPermissions = useCallback(async () => {
    try {
      const res = await api.get('/profile/field-permissions');
      if (res?.data?.success && res?.data?.data) {
        const map: Record<string, string> = {};
        res.data.data.forEach((p: { fieldName: string; mode: string }) => {
          map[p.fieldName] = p.mode;
        });
        setFieldPermissionsMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch profile field permissions:', err);
    }
  }, []);

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
    fetchFieldPermissions();
  }, [fetchProfile, fetchFieldPermissions]);

  // Student Field Permissions Helpers
  const userRole = useMemo(() => (user?.role || profileData?.role || 'SISWA').toUpperCase(), [user, profileData]);

  const getFieldPermissionMode = useCallback(
    (fieldName: string) => {
      return fieldPermissionsMap[fieldName] || 'FREELY_EDITABLE';
    },
    [fieldPermissionsMap]
  );

  const isValuePresent = useCallback((val: any) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed !== '' && trimmed !== '-';
    }
    if (val instanceof Date) return true;
    return Boolean(val);
  }, []);

  const isFieldDisabled = useCallback(
    (fieldName: string, currentValue: any) => {
      if (userRole !== 'SISWA') return false;
      const mode = getFieldPermissionMode(fieldName);
      if (mode === 'LOCKED') return true;
      if (mode === 'FILL_ONCE') {
        return isValuePresent(currentValue);
      }
      return false;
    },
    [userRole, getFieldPermissionMode, isValuePresent]
  );

  const getFieldBadge = useCallback(
    (fieldName: string, currentValue: any) => {
      if (userRole !== 'SISWA') return null;
      const mode = getFieldPermissionMode(fieldName);
      if (mode === 'LOCKED') {
        return {
          label: 'Terkunci',
          color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold',
          icon: 'mingcute:lock-fill',
        };
      }
      if (mode === 'FILL_ONCE') {
        if (isValuePresent(currentValue)) {
          return {
            label: 'Sekali Isi (Terisi)',
            color: 'bg-muted text-muted-foreground font-bold border-border',
            icon: 'mingcute:lock-fill',
          };
        } else {
          return {
            label: '⚠️ Sekali Isi (Kosong)',
            color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-extrabold animate-pulse',
            icon: 'mingcute:alert-fill',
          };
        }
      }
      return {
        label: 'Bebas Diedit',
        color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold',
        icon: 'mingcute:check-fill',
      };
    },
    [userRole, getFieldPermissionMode, isValuePresent]
  );

  const rawPhoto = profileData?.url_picture || profileData?.photoUrl || user?.avatar;
  const rawFace = profileData?.faceUrl;

  // Warning Alerts for FILL_ONCE fields that are empty
  const hasFillOnceWarningInPersonal = useMemo(() => {
    if (userRole !== 'SISWA') return false;
    const fields = [
      { name: 'birthPlace', val: birthPlace },
      { name: 'birthDate', val: birthDate },
      { name: 'gender', val: gender },
      { name: 'religion', val: religion },
      { name: 'email', val: email },
      { name: 'address', val: address },
    ];
    return fields.some((f) => getFieldPermissionMode(f.name) === 'FILL_ONCE' && !isValuePresent(f.val));
  }, [userRole, birthPlace, birthDate, gender, religion, email, address, getFieldPermissionMode, isValuePresent]);

  const hasFillOnceWarningInPhone = useMemo(() => {
    if (userRole !== 'SISWA') return false;
    return getFieldPermissionMode('phone') === 'FILL_ONCE' && !isValuePresent(phone);
  }, [userRole, phone, getFieldPermissionMode, isValuePresent]);

  const hasFillOnceWarningInPlat = useMemo(() => {
    if (userRole !== 'SISWA') return false;
    return getFieldPermissionMode('vehiclePlate') === 'FILL_ONCE' && !isValuePresent(vehiclePlate);
  }, [userRole, vehiclePlate, getFieldPermissionMode, isValuePresent]);

  const hasFillOnceWarningInPhoto = useMemo(() => {
    if (userRole !== 'SISWA') return false;
    const hasPhoto = rawPhoto && !rawPhoto.includes('ui-avatars.com');
    return getFieldPermissionMode('photoUrl') === 'FILL_ONCE' && !hasPhoto;
  }, [userRole, rawPhoto, getFieldPermissionMode]);

  const hasFillOnceWarningInFace = useMemo(() => {
    if (userRole !== 'SISWA') return false;
    return getFieldPermissionMode('faceUrl') === 'FILL_ONCE' && !isValuePresent(rawFace);
  }, [userRole, rawFace, getFieldPermissionMode, isValuePresent]);

  // Derived user display properties
  const nama = profileData?.Nama || profileData?.name || user?.name || 'Pengguna';
  const kelas = profileData?.Kelas || profileData?.className || user?.role || 'Siswa';
  const nis = profileData?.NIS || profileData?.nis || user?.id || '—';
  const photoUrl = getImageUrl(rawPhoto);
  const faceUrl = getImageUrl(rawFace);

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
      await api.put('/profile/me', payload).catch(() => api.put('/profile/biodata', payload));
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
    if (!phone) {
      toast.error('Nomor telepon tidak boleh kosong');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/profile/me', { phone }).catch(() => api.put('/profile/nomor', { Nomor: phone, phone }));
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
      await api.put('/profile/me', { vehiclePlate }).catch(() => api.put('/profile/plat', { Plat_Nomor: vehiclePlate, vehiclePlate }));
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
      await api.put('/profile/password', { currentPassword, newPassword }).catch(() => api.post('/auth/change-password', { currentPassword, newPassword }));
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

  const handleSyncPhotos = async (direction: 'FACE_TO_PROFILE' | 'PROFILE_TO_FACE') => {
    setIsSyncingPhotos(true);
    try {
      const res = await api.post('/profile/sync-photos', { direction });
      if (res?.data?.success || res?.status === 200) {
        toast.success(res?.data?.message || 'Foto berhasil disamakan');
        await fetchProfile();
        await refreshUser();
        setActiveModal(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyamakan foto');
    } finally {
      setIsSyncingPhotos(false);
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
      setActiveModal('uploadAvatar');
    }
  };

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleUploadFace = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      await api.post('/profile/face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Foto wajah absensi berhasil diperbarui');
      await fetchProfile();
      await refreshUser();
      setActiveModal(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengunggah foto wajah absensi');
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
      setShowDeleteConfirm(false);
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus foto profil');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  const photoBadge = getFieldBadge('photoUrl', rawPhoto);
  const phoneBadge = getFieldBadge('phone', phone);
  const vehicleBadge = getFieldBadge('vehiclePlate', vehiclePlate);
  const faceBadge = getFieldBadge('faceUrl', rawFace);

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-10 animate-in fade-in duration-500">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

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

                  {/* Desktop Edit Pencil Overlay */}
                  <button
                    type="button"
                    onClick={() => setActiveModal('avatarActions')}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Ubah foto profil"
                  >
                    <Icon icon="mingcute:pencil-fill" className="text-white text-xl drop-shadow-md" />
                  </button>
                </div>

                {/* Mobile Floating Pencil Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal('avatarActions')}
                  className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-lg md:hidden"
                  aria-label="Ubah foto profil"
                >
                  <Icon icon="mingcute:pencil-fill" className="text-xs" />
                </button>
              </div>

              {/* User Identity Details */}
              <div className="mt-3 space-y-0.5">
                <h2 className="break-words text-xl font-black text-foreground sm:text-2xl">{nama}</h2>
                <p className="break-words text-xs font-bold text-muted-foreground sm:text-sm">{kelas}</p>
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
                className="h-11 gap-1 px-3 text-xs font-bold text-muted-foreground hover:text-primary sm:h-8 sm:px-2"
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
                  <p className="break-words text-xs font-bold text-foreground sm:text-sm">{ttlStr}</p>
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
                  <p className="break-all text-xs font-bold text-foreground sm:text-sm">{email || 'Belum Diatur'}</p>
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
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  Kontak
                </h3>
                {phoneBadge && (
                  <Badge className={`text-[9px] px-2 py-0.5 border ${phoneBadge.color}`}>
                    {phoneBadge.label}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModal('editContact')}
                className="h-11 w-11 rounded-xl text-muted-foreground hover:text-primary sm:h-8 sm:w-8"
                aria-label="Edit kontak"
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
                <p className="mt-0.5 break-all font-mono text-sm font-bold text-foreground">
                  {phone || 'Belum Diatur'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Vehicle Card (Kendaraan) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  Kendaraan
                </h3>
                {vehicleBadge && (
                  <Badge className={`text-[9px] px-2 py-0.5 border ${vehicleBadge.color}`}>
                    {vehicleBadge.label}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModal('editVehicle')}
                className="h-11 w-11 rounded-xl text-muted-foreground hover:text-primary sm:h-8 sm:w-8"
                aria-label="Edit kendaraan"
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
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  Foto Absensi
                </h3>
                {faceBadge && (
                  <Badge className={`text-[9px] px-2 py-0.5 border ${faceBadge.color}`}>
                    {faceBadge.label}
                  </Badge>
                )}
              </div>
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
              <div className="relative mx-auto flex aspect-[4/5] h-auto w-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted shadow-inner">
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
                className="h-11 w-full gap-1.5 rounded-xl text-xs font-bold sm:h-9"
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
              className="h-11 w-full gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 sm:h-9"
            >
              <Icon icon="mingcute:key-2-fill" className="text-sm" />
              Ganti Password
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           MODALS (AVATAR ACTIONS, UPLOAD, PERMISSIONS)
      ══════════════════════════════════════════════════ */}

      {/* Modal 0: Avatar Actions Modal (Foto Profil Options) */}
      <Dialog open={activeModal === 'avatarActions'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Foto Profil</DialogTitle>
            {photoBadge && (
              <Badge className={`px-2.5 py-1 text-xs border ${photoBadge.color}`}>
                {photoBadge.label}
              </Badge>
            )}
          </DialogHeader>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
            {/* Attention / Warning / Lock Banner for SISWA */}
            {userRole === 'SISWA' && (
              <>
                {hasFillOnceWarningInPhoto ? (
                  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 text-xs font-medium">
                    <Icon icon="mingcute:warning-fill" className="text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI UNGGAN!)</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                        Foto profil berstatus <strong>&quot;Sekali Isi Jika Kosong&quot;</strong>. Mohon unggah foto profil resmi, rapi, dan jelas karena begitu tersimpan, foto profil <strong>TIDAK DAPAT DIUBAH LAGI</strong>!
                      </p>
                    </div>
                  </div>
                ) : isFieldDisabled('photoUrl', rawPhoto) ? (
                  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-3.5 text-xs font-medium">
                    <Icon icon="mingcute:lock-fill" className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-rose-900 dark:text-rose-300">🔒 FOTO PROFIL TERKUNCI</p>
                      <p className="text-[11px] text-rose-800 dark:text-rose-200 mt-0.5 leading-relaxed">
                        Foto profil Anda telah dikunci oleh pihak sekolah dan tidak dapat diubah atau dihapus.
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Action Options List */}
            <div className="flex flex-col gap-3">
              {/* 1. Ganti Foto Baru */}
              <button
                type="button"
                disabled={isFieldDisabled('photoUrl', rawPhoto)}
                onClick={() => {
                  if (!isFieldDisabled('photoUrl', rawPhoto)) {
                    fileInputRef.current?.click();
                  }
                }}
                className="w-full bg-muted/40 hover:bg-primary/10 border border-border/50 hover:border-primary/30 rounded-2xl flex items-center justify-between px-5 h-16 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted/40 disabled:hover:border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon icon="mingcute:camera-fill" className="text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">Ganti Foto Baru</p>
                    <p className="text-xs text-muted-foreground">Unggah foto baru dari perangkat</p>
                  </div>
                </div>
                <Icon icon="mingcute:right-line" className="text-muted-foreground/40 text-lg group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Gunakan Foto Wajah Absensi */}
              <button
                type="button"
                disabled={isSyncingPhotos || isFieldDisabled('photoUrl', rawPhoto) || !rawFace}
                onClick={() => handleSyncPhotos('FACE_TO_PROFILE')}
                className="w-full bg-muted/40 hover:bg-sky-500/10 border border-border/50 hover:border-sky-500/30 rounded-2xl flex items-center justify-between px-5 h-16 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted/40 disabled:hover:border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <Icon icon="mingcute:face-fill" className="text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground group-hover:text-sky-500 transition-colors">Gunakan Foto Wajah Absensi</p>
                    <p className="text-xs text-muted-foreground">Samakan foto profil dengan foto wajah absensi</p>
                  </div>
                </div>
                <Icon icon="mingcute:transfer-line" className="text-muted-foreground/40 text-lg" />
              </button>

              {/* 3. Gunakan Foto Profil untuk Absensi */}
              <button
                type="button"
                disabled={isSyncingPhotos || isFieldDisabled('faceUrl', rawFace) || !rawPhoto || rawPhoto.includes('ui-avatars.com')}
                onClick={() => handleSyncPhotos('PROFILE_TO_FACE')}
                className="w-full bg-muted/40 hover:bg-amber-500/10 border border-border/50 hover:border-amber-500/30 rounded-2xl flex items-center justify-between px-5 h-16 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted/40 disabled:hover:border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Icon icon="mingcute:user-4-fill" className="text-xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground group-hover:text-amber-500 transition-colors">Gunakan Foto Profil untuk Absensi</p>
                    <p className="text-xs text-muted-foreground">Samakan foto wajah absensi dengan foto profil saat ini</p>
                  </div>
                </div>
                <Icon icon="mingcute:transfer-line" className="text-muted-foreground/40 text-lg" />
              </button>

              {/* 4. Hapus Foto Profil */}
              {rawPhoto && !rawPhoto.includes('ui-avatars.com') && !isFieldDisabled('photoUrl', rawPhoto) && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-muted/40 hover:bg-rose-500/10 border border-border/50 hover:border-rose-500/30 rounded-2xl flex items-center justify-between px-5 h-16 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <Icon icon="mingcute:delete-2-fill" className="text-xl" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-rose-600 dark:text-rose-400">Hapus Foto Profil</p>
                      <p className="text-xs text-muted-foreground">Kembali ke foto profil default</p>
                    </div>
                  </div>
                  <Icon icon="mingcute:right-line" className="text-muted-foreground/40 text-lg" />
                </button>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl w-full font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 0b: Delete Photo Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <div className="space-y-4 overflow-y-auto p-4 text-center sm:p-6">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-1">
              <Icon icon="mingcute:delete-2-fill" className="text-2xl" />
            </div>
            <DialogTitle className="font-extrabold text-xl text-foreground text-center">Hapus Foto Profil?</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Foto profil Anda akan dihapus dan dikembalikan ke foto avatar default.
            </p>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl font-bold" onClick={() => setShowDeleteConfirm(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="flex-1 rounded-2xl font-bold" disabled={isSaving} onClick={handleDeletePhoto}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus Foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Edit Personal Info */}
      <Dialog open={activeModal === 'editPersonal'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Edit Informasi Pribadi</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6 sm:text-sm">
            {/* Attention Warning Banner for Students */}
            {userRole === 'SISWA' && hasFillOnceWarningInPersonal && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 text-xs font-medium mb-4">
                <Icon icon="mingcute:warning-fill" className="text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI ISI!)</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                    Field bertanda <strong>&quot;Sekali Isi&quot;</strong> hanya dapat diisi <strong>SEKALI</strong>. Mohon periksa kembali dan isi dengan <strong>sungguh-sungguh &amp; benar</strong> karena begitu Anda klik Simpan, data tidak dapat diubah lagi!
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="birthPlace" className="mb-0">Tempat Lahir</Label>
                  {getFieldBadge('birthPlace', birthPlace) && (
                    <Badge className={`text-[9px] px-2 py-0.5 border ${getFieldBadge('birthPlace', birthPlace)?.color}`}>
                      {getFieldBadge('birthPlace', birthPlace)?.label}
                    </Badge>
                  )}
                </div>
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  disabled={isFieldDisabled('birthPlace', birthPlace)}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Contoh: Yogyakarta"
                  className="rounded-2xl bg-muted/30 font-bold h-11 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="birthDate" className="mb-0">Tanggal Lahir</Label>
                  {getFieldBadge('birthDate', birthDate) && (
                    <Badge className={`text-[9px] px-2 py-0.5 border ${getFieldBadge('birthDate', birthDate)?.color}`}>
                      {getFieldBadge('birthDate', birthDate)?.label}
                    </Badge>
                  )}
                </div>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  disabled={isFieldDisabled('birthDate', birthDate)}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="rounded-2xl bg-muted/30 font-bold h-11 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Jenis Kelamin</Label>
                  {getFieldBadge('gender', gender) && (
                    <Badge className={`text-[9px] px-2 py-0.5 border ${getFieldBadge('gender', gender)?.color}`}>
                      {getFieldBadge('gender', gender)?.label}
                    </Badge>
                  )}
                </div>
                <CustomSelect
                  options={[
                    { value: 'L', label: 'Laki-Laki (L)' },
                    { value: 'P', label: 'Perempuan (P)' },
                  ]}
                  value={gender}
                  onChange={setGender}
                  disabled={isFieldDisabled('gender', gender)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Agama</Label>
                  {getFieldBadge('religion', religion) && (
                    <Badge className={`text-[9px] px-2 py-0.5 border ${getFieldBadge('religion', religion)?.color}`}>
                      {getFieldBadge('religion', religion)?.label}
                    </Badge>
                  )}
                </div>
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
                  disabled={isFieldDisabled('religion', religion)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="email" className="mb-0">Email</Label>
                {getFieldBadge('email', email) && (
                  <Badge className={`text-[9px] px-2 py-0.5 border ${getFieldBadge('email', email)?.color}`}>
                    {getFieldBadge('email', email)?.label}
                  </Badge>
                )}
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                disabled={isFieldDisabled('email', email)}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@smtijogja.sch.id"
                className="rounded-2xl bg-muted/30 font-bold h-11 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="address" className="mb-0">Alamat Tempat Tinggal</Label>
                {getFieldBadge('address', address) && (
                  <Badge className={`text-[9px] px-2 py-0.5 border ${getFieldBadge('address', address)?.color}`}>
                    {getFieldBadge('address', address)?.label}
                  </Badge>
                )}
              </div>
              <textarea
                id="address"
                rows={3}
                value={address}
                disabled={isFieldDisabled('address', address)}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Kusumabangsa No. 1..."
                className="w-full resize-none rounded-2xl border border-border bg-muted/30 p-3 text-base font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
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
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Edit Nomor Kontak</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {/* Attention Warning Banner for Students */}
            {userRole === 'SISWA' && hasFillOnceWarningInPhone && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 text-xs font-medium">
                <Icon icon="mingcute:warning-fill" className="text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI ISI!)</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                    Field Nomor Telepon hanya dapat diisi <strong>SEKALI</strong>. Mohon periksa kembali dan pastikan nomor aktif &amp; benar karena setelah disimpan tidak dapat diubah lagi!
                  </p>
                </div>
              </div>
            )}

            {userRole === 'SISWA' && isFieldDisabled('phone', phone) && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-3.5 text-xs font-medium">
                <Icon icon="mingcute:lock-fill" className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-900 dark:text-rose-300">🔒 NOMOR TELEPON TERKUNCI</p>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200 mt-0.5 leading-relaxed">
                    Nomor telepon Anda telah dikunci oleh pihak sekolah dan tidak dapat diubah.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="phone" className="mb-0">Nomor WhatsApp / Telp</Label>
                {phoneBadge && (
                  <Badge className={`text-[10px] px-2.5 py-0.5 border ${phoneBadge.color}`}>
                    {phoneBadge.label}
                  </Badge>
                )}
              </div>
              <Input
                id="phone"
                value={phone}
                disabled={isFieldDisabled('phone', phone)}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="rounded-2xl bg-muted/30 font-bold h-11 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Gunakan nomor aktif WhatsApp untuk notifikasi presensi.
              </p>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={isSaving || isFieldDisabled('phone', phone)} onClick={handleSaveContact}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Vehicle */}
      <Dialog open={activeModal === 'editVehicle'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Edit Plat Kendaraan</DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {/* Attention Warning Banner for Students */}
            {userRole === 'SISWA' && hasFillOnceWarningInPlat && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 text-xs font-medium">
                <Icon icon="mingcute:warning-fill" className="text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI ISI!)</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                    Plat Nomor Kendaraan hanya dapat diisi <strong>SEKALI</strong>. Mohon periksa kembali dan pastikan plat nomor kendaraan Anda sudah benar!
                  </p>
                </div>
              </div>
            )}

            {userRole === 'SISWA' && isFieldDisabled('vehiclePlate', vehiclePlate) && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-3.5 text-xs font-medium">
                <Icon icon="mingcute:lock-fill" className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-900 dark:text-rose-300">🔒 PLAT NOMOR TERKUNCI</p>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200 mt-0.5 leading-relaxed">
                    Plat nomor kendaraan Anda telah dikunci oleh pihak sekolah dan tidak dapat diubah.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="vehiclePlate" className="mb-0">Plat Nomor Kendaraan</Label>
                {vehicleBadge && (
                  <Badge className={`text-[10px] px-2.5 py-0.5 border ${vehicleBadge.color}`}>
                    {vehicleBadge.label}
                  </Badge>
                )}
              </div>
              <Input
                id="vehiclePlate"
                value={vehiclePlate}
                disabled={isFieldDisabled('vehiclePlate', vehiclePlate)}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="AB 1234 AB"
                className="rounded-2xl bg-muted/30 font-bold h-11 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={isSaving || isFieldDisabled('vehiclePlate', vehiclePlate)} onClick={handleSaveVehicle}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Upload Selected Avatar Preview */}
      <Dialog open={activeModal === 'uploadAvatar'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Unggah Foto Profil Baru</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 flex-col items-center space-y-4 overflow-y-auto p-4 sm:p-6">
            <div className="flex aspect-square h-auto w-32 max-w-full items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-muted shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-primary">{nama.charAt(0)}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center font-medium">
              Pastikan foto profil Anda rapi dan sopan.
            </p>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={!selectedFile || isSaving} onClick={handleUploadAvatar}>
              {isSaving ? 'Mengunggah...' : 'Simpan Foto Baru'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Edit Face Photo (Foto Absensi) */}
      <Dialog open={activeModal === 'editFace'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Unggah Foto Wajah Absensi</DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 flex-col items-center space-y-4 overflow-y-auto p-4 sm:p-6">
            {/* Attention Warning Banner for Students */}
            {userRole === 'SISWA' && hasFillOnceWarningInFace && (
              <div role="alert" className="w-full flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-3.5 text-xs font-medium">
                <Icon icon="mingcute:warning-fill" className="text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900 dark:text-amber-300">⚠️ PERHATIAN PENTING (HANYA 1 KALI UNGGAN!)</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed text-left">
                    Foto Wajah Absensi berstatus <strong>&quot;Sekali Isi Jika Kosong&quot;</strong>. Mohon unggah foto wajah resmi dan jelas karena begitu tersimpan, foto <strong>TIDAK DAPAT DIUBAH LAGI</strong>!
                  </p>
                </div>
              </div>
            )}

            {userRole === 'SISWA' && isFieldDisabled('faceUrl', rawFace) && (
              <div role="alert" className="w-full flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15 p-3.5 text-xs font-medium">
                <Icon icon="mingcute:lock-fill" className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-900 dark:text-rose-300">🔒 FOTO WAJAH ABSENSI TERKUNCI</p>
                  <p className="text-[11px] text-rose-800 dark:text-rose-200 mt-0.5 leading-relaxed text-left">
                    Foto wajah absensi Anda telah dikunci oleh pihak sekolah dan tidak dapat diubah atau dihapus.
                  </p>
                </div>
              </div>
            )}

            <div className="flex aspect-[4/5] h-auto w-28 max-w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted shadow-inner">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : faceUrl ? (
                <img src={faceUrl} alt="Foto Wajah" className="w-full h-full object-cover" />
              ) : (
                <Icon icon="mingcute:face-fill" className="text-4xl text-muted-foreground/40" />
              )}
            </div>

            <Input
              ref={faceFileInputRef}
              type="file"
              accept="image/*"
              disabled={isFieldDisabled('faceUrl', rawFace)}
              onChange={handleFaceFileChange}
              className="max-w-xs rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground text-center max-w-xs font-semibold">
              Pastikan wajah terlihat jelas, menghadap depan, dan pencahayaan cukup untuk deteksi sistem absensi.
            </p>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setActiveModal(null)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground" disabled={!selectedFile || isSaving || isFieldDisabled('faceUrl', rawFace)} onClick={handleUploadFace}>
              {isSaving ? 'Mengunggah...' : 'Simpan Foto Wajah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 6: Change Password */}
      <Dialog open={activeModal === 'changePass'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground">Ganti Password</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
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
          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
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
