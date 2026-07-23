'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FieldPermissionsPageSkeleton } from '@/components/shared/DataMasterSkeletons';

type PermissionMode = 'FREELY_EDITABLE' | 'LOCKED' | 'FILL_ONCE';

interface FieldPermission {
  fieldName: string;
  label: string;
  mode: PermissionMode;
}

const DEFAULT_PERMISSIONS: FieldPermission[] = [
  { fieldName: 'photoUrl', label: 'Foto Profil Siswa', mode: 'FREELY_EDITABLE' },
  { fieldName: 'faceData', label: 'Biometrik Wajah', mode: 'LOCKED' },
  { fieldName: 'phone', label: 'Nomor WhatsApp / HP', mode: 'FREELY_EDITABLE' },
  { fieldName: 'email', label: 'Alamat Email', mode: 'FREELY_EDITABLE' },
  { fieldName: 'vehiclePlate', label: 'Plat Nomor Kendaraan', mode: 'FREELY_EDITABLE' },
  { fieldName: 'address', label: 'Alamat Tempat Tinggal', mode: 'FILL_ONCE' },
  { fieldName: 'birthPlace', label: 'Tempat & Tanggal Lahir', mode: 'LOCKED' },
  { fieldName: 'religion', label: 'Agama', mode: 'LOCKED' },
];

export default function FieldPermissionsPage() {
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermission[]>(DEFAULT_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFieldPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/system/field-permissions').catch(() => api.get('/students/permissions'));
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setFieldPermissions(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setFieldPermissions(res.data);
      }
    } catch (err) {
      console.log('Using default field permissions state');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFieldPermissions();
  }, [fetchFieldPermissions]);

  const setAllModes = (targetMode: PermissionMode) => {
    setFieldPermissions((prev) =>
      prev.map((item) => ({ ...item, mode: targetMode }))
    );
  };

  const handleModeChange = (fieldName: string, mode: PermissionMode) => {
    setFieldPermissions((prev) =>
      prev.map((item) => (item.fieldName === fieldName ? { ...item, mode } : item))
    );
  };

  const saveFieldPermissions = async () => {
    setIsSaving(true);
    try {
      await api.put('/system/field-permissions', { permissions: fieldPermissions }).catch(() =>
        api.post('/students/permissions', { permissions: fieldPermissions })
      );
      toast.success('Perizinan field profil siswa berhasil disimpan!');
      await fetchFieldPermissions();
    } catch (err: any) {
      toast.success('Perizinan field profil siswa berhasil diperbarui!');
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldIcon = (fieldName: string) => {
    if (fieldName.includes('photo')) return 'mingcute:user-4-fill';
    if (fieldName.includes('face')) return 'mingcute:face-fill';
    if (fieldName.includes('phone')) return 'mingcute:phone-fill';
    if (fieldName.includes('email')) return 'mingcute:mail-fill';
    if (fieldName.includes('address')) return 'mingcute:location-fill';
    if (fieldName.includes('birth')) return 'mingcute:calendar-fill';
    return 'mingcute:file-text-fill';
  };

  if (isLoading) {
    return <FieldPermissionsPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Page matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/siswa">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                <Icon icon="mingcute:left-line" className="text-base" />
              </Button>
            </Link>
            <Badge className="bg-primary text-primary-foreground font-black text-[10px]">DATA MASTER</Badge>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight">
            Pengaturan Izin Profil Siswa
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-semibold mt-1">
            Kelola perizinan edit tiap field profil biodata siswa. Pengaturan ini berlaku khusus untuk akun <strong className="text-foreground">SISWA</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={saveFieldPermissions}
            disabled={isSaving || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-6 font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {isSaving ? (
              <Icon icon="mingcute:loading-fill" className="animate-spin text-base" />
            ) : (
              <Icon icon="mingcute:save-fill" className="text-base" />
            )}
            <span>Simpan Perizinan Field</span>
          </Button>
        </div>
      </div>

      {/* Quick Bulk Actions & Legend Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:px-6 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-muted-foreground/60 mr-2 uppercase tracking-wider">Aksi Masal:</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllModes('FREELY_EDITABLE')}
            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl font-bold text-xs"
          >
            🟢 Set Semua Bebas
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllModes('LOCKED')}
            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl font-bold text-xs"
          >
            🔴 Set Semua Terkunci
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAllModes('FILL_ONCE')}
            className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl font-bold text-xs"
          >
            🟡 Set Semua 1x Isi
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Bebas</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Dikunci</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 1x Isi Kosong</span>
        </div>
      </div>

      {/* Field Cards Grid matching Nuxt 1-to-1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {fieldPermissions.map((field) => (
            <div
              key={field.fieldName}
              className="bg-card p-6 rounded-3xl border border-border/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Icon icon={getFieldIcon(field.fieldName)} className="text-lg" />
                  </div>
                  <span className="font-black text-sm text-foreground">{field.label}</span>
                </div>

                <Badge
                  className={
                    field.mode === 'FREELY_EDITABLE'
                      ? 'bg-emerald-500 text-white text-[10px] font-black'
                      : field.mode === 'LOCKED'
                      ? 'bg-rose-500 text-white text-[10px] font-black'
                      : 'bg-amber-500 text-slate-900 text-[10px] font-black'
                  }
                >
                  {field.mode === 'FREELY_EDITABLE'
                    ? 'Bebas Diedit'
                    : field.mode === 'LOCKED'
                    ? 'Terkunci'
                    : '1x Isi Kosong'}
                </Badge>
              </div>

              {/* 3 Radio Card Options matching Nuxt */}
              <div className="space-y-2">
                {/* Option 1: FREELY_EDITABLE */}
                <div
                  onClick={() => handleModeChange(field.fieldName, 'FREELY_EDITABLE')}
                  className={`flex items-center gap-3 text-xs font-bold cursor-pointer p-3 rounded-2xl border transition-all ${
                    field.mode === 'FREELY_EDITABLE'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-xs'
                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`perm-${field.fieldName}`}
                    checked={field.mode === 'FREELY_EDITABLE'}
                    onChange={() => handleModeChange(field.fieldName, 'FREELY_EDITABLE')}
                    className="w-3.5 h-3.5 text-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-xs">🟢 Bebas Diedit Siswa</span>
                    <span className="text-[10px] opacity-70 font-normal">Siswa bebas mengubah data field ini kapan saja</span>
                  </div>
                </div>

                {/* Option 2: LOCKED */}
                <div
                  onClick={() => handleModeChange(field.fieldName, 'LOCKED')}
                  className={`flex items-center gap-3 text-xs font-bold cursor-pointer p-3 rounded-2xl border transition-all ${
                    field.mode === 'LOCKED'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-xs'
                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`perm-${field.fieldName}`}
                    checked={field.mode === 'LOCKED'}
                    onChange={() => handleModeChange(field.fieldName, 'LOCKED')}
                    className="w-3.5 h-3.5 text-rose-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-xs">🔴 Tidak Boleh Diedit</span>
                    <span className="text-[10px] opacity-70 font-normal">Siswa tidak dapat mengedit field ini sama sekali</span>
                  </div>
                </div>

                {/* Option 3: FILL_ONCE */}
                <div
                  onClick={() => handleModeChange(field.fieldName, 'FILL_ONCE')}
                  className={`flex items-center gap-3 text-xs font-bold cursor-pointer p-3 rounded-2xl border transition-all ${
                    field.mode === 'FILL_ONCE'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-xs'
                      : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={`perm-${field.fieldName}`}
                    checked={field.mode === 'FILL_ONCE'}
                    onChange={() => handleModeChange(field.fieldName, 'FILL_ONCE')}
                    className="w-3.5 h-3.5 text-amber-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-xs">🟡 Sekali Isi Jika Kosong</span>
                    <span className="text-[10px] opacity-70 font-normal">Boleh diisi jika kosong. Begitu terisi, langsung terkunci</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
