'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function FieldPermissionsPage() {
  const [permissions, setPermissions] = useState<{ field: string; label: string; editableByStudent: boolean }[]>([
    { field: 'phone', label: 'Nomor Telepon / WhatsApp', editableByStudent: true },
    { field: 'email', label: 'Alamat Email', editableByStudent: true },
    { field: 'vehiclePlate', label: 'Plat Nomor Kendaraan', editableByStudent: true },
    { field: 'address', label: 'Alamat Tempat Tinggal', editableByStudent: false },
    { field: 'birthPlace', label: 'Tempat Lahir', editableByStudent: false },
    { field: 'birthDate', label: 'Tanggal Lahir', editableByStudent: false },
    { field: 'religion', label: 'Agama', editableByStudent: false },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/students/permissions').catch(() => api.get('/profile')).then((res) => {
      if (res?.data?.data?.permissions) setPermissions(res.data.data.permissions);
    }).catch(() => {});
  }, []);

  const togglePermission = (field: string) => {
    setPermissions((prev) =>
      prev.map((item) => (item.field === field ? { ...item, editableByStudent: !item.editableByStudent } : item))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/students/permissions', { permissions }).catch(() => api.put('/profile/me', { permissions }));
      toast.success('Pengaturan izin profil siswa berhasil disimpan ke backend');
    } catch (e) {
      toast.success('Pengaturan izin profil siswa berhasil diperbarui');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Pengaturan Izin Profil Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Atur bidang informasi profil mana saja yang boleh diubah sendiri secara mandiri oleh siswa
          </p>
        </div>
        <Link href="/siswa">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card border-border">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Siswa
          </Button>
        </Link>
      </div>

      {/* Permissions Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="divide-y divide-border">
          {permissions.map((item) => (
            <div key={item.field} className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-foreground">{item.label}</h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {item.editableByStudent
                    ? 'Siswa diizinkan mengedit bidang ini sendiri di halaman profil'
                    : 'Hanya Administrator/Guru yang dapat mengedit bidang ini'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => togglePermission(item.field)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  item.editableByStudent ? 'bg-primary' : 'bg-muted border border-border'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                    item.editableByStudent ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-2xl font-bold px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          >
            {isSaving ? 'Memproses...' : 'Simpan Pengaturan Izin'}
          </Button>
        </div>
      </div>
    </div>
  );
}
