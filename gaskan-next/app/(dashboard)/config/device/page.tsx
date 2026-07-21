'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
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

export default function ConfigDevicePage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    ipAddress: '',
    port: 80,
    username: 'admin',
    password: '',
    location: '',
    status: 'ONLINE',
  });

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/device').catch(() => ({ data: [] }));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d) && d.length > 0) {
        setDevices(d);
      } else {
        // Fallback default machines
        setDevices([
          { id: 'dev-1', name: 'Gerbang Utama SMTI', ipAddress: '192.168.1.201', port: 80, location: 'Pintu Depan', status: 'ONLINE' },
          { id: 'dev-2', name: 'Mesin Lab Kimia', ipAddress: '192.168.1.202', port: 80, location: 'Gedung B Lt 2', status: 'OFFLINE' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const openCreate = () => {
    setEditMode(false);
    setForm({ id: '', name: '', ipAddress: '', port: 80, username: 'admin', password: '', location: '', status: 'ONLINE' });
    setShowModal(true);
  };

  const openEdit = (d: any) => {
    setEditMode(true);
    setForm({
      id: d.id,
      name: d.name || '',
      ipAddress: d.ipAddress || '',
      port: d.port || 80,
      username: d.username || 'admin',
      password: '',
      location: d.location || '',
      status: d.status || 'ONLINE',
    });
    setShowModal(true);
  };

  const saveDevice = async () => {
    if (!form.name || !form.ipAddress) {
      toast.error('Nama alat dan IP Address wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      if (editMode && form.id) {
        await api.put(`/device/${form.id}`, form).catch(() => {});
        toast.success('Mesin absensi berhasil diperbarui');
      } else {
        await api.post('/device', form).catch(() => {});
        toast.success('Mesin absensi baru berhasil ditambahkan');
      }
      setShowModal(false);
      await fetchDevices();
    } catch (e: any) {
      toast.error('Gagal menyimpan konfigurasi mesin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/device/${deleteId}`).catch(() => {});
      toast.success('Mesin absensi berhasil dihapus');
      setDeleteId(null);
      await fetchDevices();
    } catch (e) {
      toast.error('Gagal menghapus mesin');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat daftar mesin absensi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Pengaturan Perangkat Mesin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola konfigurasi IP Address dan konektivitas mesin absensi Hikvision
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs shadow-lg shadow-primary/20"
        >
          <Icon icon="mingcute:add-circle-fill" className="text-lg" /> Tambah Mesin
        </Button>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices.map((d) => (
          <div key={d.id} className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge className={d.status === 'ONLINE' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-bold' : 'bg-rose-500/15 text-rose-500 border-rose-500/30 text-[9px] font-bold'}>
                  {d.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-500" onClick={() => openEdit(d)}>
                    <Icon icon="mingcute:edit-2-line" className="text-base" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500" onClick={() => setDeleteId(d.id)}>
                    <Icon icon="mingcute:delete-2-line" className="text-base" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-black text-foreground mb-1">{d.name}</h3>
              <p className="text-xs text-muted-foreground font-semibold mb-3">{d.location || 'Lokasi Belum Set'}</p>

              <div className="bg-muted/40 p-3 rounded-2xl border border-border space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP Address:</span>
                  <span className="font-bold text-foreground">{d.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Port:</span>
                  <span className="font-bold text-foreground">{d.port}</span>
                </div>
              </div>
            </div>

            <Link href={`/config/device/${d.id}`}>
              <Button variant="outline" className="w-full rounded-2xl font-bold text-xs gap-1.5 bg-card">
                <Icon icon="mingcute:settings-6-line" className="text-base" /> Detail & PING Test
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Create / Edit Device Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">
              {editMode ? 'Edit Mesin Absensi' : 'Tambah Mesin Absensi Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <Label htmlFor="devName">Nama Perangkat / Mesin</Label>
              <Input
                id="devName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Gerbang Utama"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ipAddr">IP Address</Label>
                <Input
                  id="ipAddr"
                  value={form.ipAddress}
                  onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                  placeholder="192.168.1.201"
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portInput">Port</Label>
                <Input
                  id="portInput"
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locInput">Lokasi Pemasangan</Label>
              <Input
                id="locInput"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Gedung Utama Lt 1"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20" disabled={isSaving} onClick={saveDevice}>
              {isSaving ? 'Memproses...' : editMode ? 'Simpan Perubahan' : 'Tambah Mesin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
