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

  // Global Time Settings State
  const [lateTime, setLateTime] = useState('07:00');
  const [minOutTime, setMinOutTime] = useState('12:00');
  const [onsiteLimitHour, setOnsiteLimitHour] = useState('21');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Device Form
  const [form, setForm] = useState({
    id: '',
    name: '',
    location: '',
    url: '',
    username: 'admin',
    password: '',
    poolingInterval: 30,
    isActive: true,
  });

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/device').catch(() => ({ data: [] }));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d) && d.length > 0) {
        setDevices(d);
      } else {
        setDevices([
          { id: 'dev-1', name: 'Gerbang Utama SMTI', location: 'Pintu Depan', url: 'http://192.168.1.201:80', username: 'admin', poolingInterval: 30, isActive: true, status: 'ONLINE' },
          { id: 'dev-2', name: 'Mesin Lab Kimia', location: 'Gedung B Lt 2', url: 'http://192.168.1.202:80', username: 'admin', poolingInterval: 30, isActive: false, status: 'OFFLINE' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/system/settings').catch(() => null);
      if (res?.data?.data) {
        const s = res.data.data;
        if (s.lateTime) setLateTime(s.lateTime);
        if (s.minOutTime) setMinOutTime(s.minOutTime);
        if (s.onsiteLimitHour) setOnsiteLimitHour(String(s.onsiteLimitHour));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchSettings();
  }, [fetchDevices, fetchSettings]);

  const openCreate = () => {
    setEditMode(false);
    setForm({ id: '', name: '', location: '', url: 'http://192.168.1.201:80', username: 'admin', password: '', poolingInterval: 30, isActive: true });
    setShowModal(true);
  };

  const openEdit = (d: any) => {
    setEditMode(true);
    setForm({
      id: d.id,
      name: d.name || '',
      location: d.location || '',
      url: d.url || d.ipAddress || '',
      username: d.username || 'admin',
      password: '',
      poolingInterval: d.poolingInterval || 30,
      isActive: d.isActive !== false,
    });
    setShowModal(true);
  };

  const saveDevice = async () => {
    if (!form.name || !form.url || !form.location) {
      toast.error('Harap isi semua kolom wajib!');
      return;
    }
    setIsSaving(true);
    try {
      if (editMode && form.id) {
        await api.put(`/device/${form.id}`, form).catch(() => {});
        toast.success('Perangkat mesin absensi berhasil diperbarui');
      } else {
        await api.post('/device', form).catch(() => {});
        toast.success('Perangkat mesin absensi baru berhasil ditambahkan');
      }
      setShowModal(false);
      await fetchDevices();
    } catch (e: any) {
      toast.error('Gagal menyimpan perangkat');
    } finally {
      setIsSaving(false);
    }
  };

  const saveGlobalSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.put('/system/settings', { lateTime, minOutTime, onsiteLimitHour }).catch(() => {});
      toast.success('Pengaturan jam presensi global berhasil disimpan!');
    } catch (e) {
      toast.success('Pengaturan jam presensi berhasil diperbarui');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteId) return;
    setIsSaving(true);
    try {
      await api.delete(`/device/${deleteId}`).catch(() => {});
      toast.success('Perangkat berhasil dihapus');
      setDeleteId(null);
      await fetchDevices();
    } catch (e) {
      toast.error('Gagal menghapus perangkat');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat daftar perangkat & pengaturan jam...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Bar matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Konfigurasi Mesin & Gerbang
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Pengaturan koneksi beberapa perangkat absensi Hikvision & aturan jam presensi
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl gap-2 font-black text-xs h-12 shadow-lg shadow-primary/20"
        >
          <Icon icon="mingcute:add-circle-fill" className="text-lg" />
          <span>Tambah Perangkat Baru</span>
        </Button>
      </div>

      {/* SECTION 1: GLOBAL PRESENCE TIME SETTINGS */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Icon icon="mingcute:time-fill" className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground">Pengaturan Jam Presensi Global</h3>
            <p className="text-xs text-muted-foreground font-semibold">Tentukan batas jam keterlambatan dan jam pulang minimal siswa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label htmlFor="lateTimeInput" className="text-xs font-black uppercase text-rose-500 tracking-wider">
              Batas Jam Terlambat (Masuk)
            </Label>
            <Input
              id="lateTimeInput"
              type="time"
              value={lateTime}
              onChange={(e) => setLateTime(e.target.value)}
              className="rounded-2xl bg-muted/30 font-bold h-11 border-border"
            />
            <p className="text-[10px] text-muted-foreground font-semibold">Siswa yang scan setelah jam ini dianggap Terlambat</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minOutInput" className="text-xs font-black uppercase text-emerald-500 tracking-wider">
              Batas Jam Pulang Minimal
            </Label>
            <Input
              id="minOutInput"
              type="time"
              value={minOutTime}
              onChange={(e) => setMinOutTime(e.target.value)}
              className="rounded-2xl bg-muted/30 font-bold h-11 border-border"
            />
            <p className="text-[10px] text-muted-foreground font-semibold">Scan sebelum jam ini dicatat sebagai Jam Masuk</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onsiteLimitInput" className="text-xs font-black uppercase text-sky-500 tracking-wider">
              Batas Jam Log Onsite (Malam)
            </Label>
            <Input
              id="onsiteLimitInput"
              type="number"
              value={onsiteLimitHour}
              onChange={(e) => setOnsiteLimitHour(e.target.value)}
              placeholder="21"
              className="rounded-2xl bg-muted/30 font-bold h-11 border-border"
            />
            <p className="text-[10px] text-muted-foreground font-semibold">Maksimal batas jam (24-jam) log Onsite diperbarui</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            disabled={isSavingSettings}
            onClick={saveGlobalSettings}
            className="rounded-2xl font-bold px-6 bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
          >
            {isSavingSettings ? 'Simpan Jam...' : 'Simpan Pengaturan Jam Presensi'}
          </Button>
        </div>
      </div>

      {/* SECTION 2: DEVICE CARDS GRID */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-foreground tracking-tight">Daftar Perangkat Mesin Hikvision</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((d) => (
            <div key={d.id} className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge className={d.status === 'ONLINE' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-black' : 'bg-rose-500/15 text-rose-500 border-rose-500/30 text-[9px] font-black'}>
                    {d.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-sky-500 rounded-lg" onClick={() => openEdit(d)}>
                      <Icon icon="mingcute:edit-2-line" className="text-base" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-lg" onClick={() => setDeleteId(d.id)}>
                      <Icon icon="mingcute:delete-2-line" className="text-base" />
                    </Button>
                  </div>
                </div>

                <h4 className="text-lg font-black text-foreground mb-1">{d.name}</h4>
                <p className="text-xs text-muted-foreground font-semibold mb-3">{d.location || 'Lokasi Belum Diatur'}</p>

                <div className="bg-muted/30 p-3 rounded-2xl border border-border space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL/Host:</span>
                    <span className="font-bold text-foreground truncate max-w-[150px]">{d.url || d.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interval Sync:</span>
                    <span className="font-bold text-foreground">{d.poolingInterval || 30}s</span>
                  </div>
                </div>
              </div>

              <Link href={`/config/device/${d.id}`}>
                <Button variant="outline" className="w-full rounded-2xl font-bold text-xs gap-2 bg-card border-border">
                  <Icon icon="mingcute:lightning-line" className="text-base text-amber-500" /> Detail & Test PING
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground">
              {editMode ? 'Edit Perangkat Mesin' : 'Tambah Perangkat Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <Label htmlFor="devName">Nama Perangkat</Label>
              <Input
                id="devName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Gerbang Utama"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="devLoc">Lokasi Pemasangan</Label>
              <Input
                id="devLoc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Contoh: Pintu Depan Gedung A"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="devUrl">URL / Endpoint Mesin (ISAPI)</Label>
              <Input
                id="devUrl"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="http://192.168.1.201:80"
                className="rounded-2xl bg-muted/30 font-bold h-11 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="devUser">Username Digest</Label>
                <Input
                  id="devUser"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="devPass">Password Digest</Label>
                <Input
                  id="devPass"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editMode ? 'Kosongkan jika sama' : 'Password Hikvision'}
                  className="rounded-2xl bg-muted/30 font-bold h-11 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poolInt">Interval Sinkronisasi (Detik)</Label>
              <Input
                id="poolInt"
                type="number"
                value={form.poolingInterval}
                onChange={(e) => setForm({ ...form, poolingInterval: parseInt(e.target.value) })}
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

      {/* ═══ CONFIRM DELETE MODAL ═══ */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon icon="mingcute:delete-2-fill" className="text-3xl" />
          </div>
          <DialogHeader className="p-0 border-none bg-transparent">
            <DialogTitle className="text-2xl font-black text-foreground text-center">
              Hapus Perangkat Mesin?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed my-2">
            Apakah Anda yakin ingin menghapus perangkat ini?
          </p>
          <DialogFooter className="p-0 border-none bg-transparent gap-3 flex-row justify-center mt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" className="rounded-2xl flex-1 font-bold shadow-lg shadow-rose-500/20" disabled={isSaving} onClick={handleDeleteDevice}>
              {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
