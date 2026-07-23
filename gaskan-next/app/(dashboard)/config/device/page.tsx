'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DeviceCardsSkeleton,
  DeviceConfigPageSkeleton,
} from '@/components/shared/SystemPageSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CustomSelect } from '@/components/shared/CustomSelect';

export default function ConfigDevicePage() {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [settingPushId, setSettingPushId] = useState<string | null>(null);

  // Parameter Kehadiran State
  const [lateHour, setLateHour] = useState(7);
  const [lateMinute, setLateMinute] = useState(0);
  const [minOutHour, setMinOutHour] = useState(12);
  const [minOutMinute, setMinOutMinute] = useState(0);
  const [onsiteLimitHour, setOnsiteLimitHour] = useState(21);
  const [savingSettings, setSavingSettings] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    location: '',
    url: '',
    username: '',
    password: '',
    poolingInterval: 30,
    isActive: true,
  });

  const lateTime = useMemo(() => {
    const h = String(lateHour).padStart(2, '0');
    const m = String(lateMinute).padStart(2, '0');
    return `${h}:${m}`;
  }, [lateHour, lateMinute]);

  const minOutTime = useMemo(() => {
    const h = String(minOutHour).padStart(2, '0');
    const m = String(minOutMinute).padStart(2, '0');
    return `${h}:${m}`;
  }, [minOutHour, minOutMinute]);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/device').catch(() => api.get('/config/device'));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) setDevices(d);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengambil daftar perangkat');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/system/settings').catch(() => api.get('/system'));
      const d = res?.data?.data || res?.data;
      if (d) {
        if (d.lateHour !== undefined) setLateHour(d.lateHour);
        if (d.lateMinute !== undefined) setLateMinute(d.lateMinute);
        if (d.minOutHour !== undefined) setMinOutHour(d.minOutHour);
        if (d.minOutMinute !== undefined) setMinOutMinute(d.minOutMinute);
        if (d.onsiteLimitHour !== undefined) setOnsiteLimitHour(d.onsiteLimitHour);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    fetchSettings();
  }, [fetchDevices, fetchSettings]);

  const openAddModal = () => {
    setIsEdit(false);
    setCurrentId(null);
    setForm({
      name: '',
      location: '',
      url: '',
      username: '',
      password: '',
      poolingInterval: 30,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (device: any) => {
    setIsEdit(true);
    setCurrentId(device.id);
    setForm({
      name: device.name || '',
      location: device.location || '',
      url: device.url || '',
      username: device.username || '',
      password: '',
      poolingInterval: device.poolingInterval || 30,
      isActive: device.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.location || !form.url || !form.username) {
      toast.error('Harap isi semua kolom wajib!');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('Password wajib diisi untuk perangkat baru!');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (isEdit && !payload.password) delete payload.password;

      if (isEdit && currentId) {
        await api.put(`/device/${currentId}`, payload);
        toast.success('Perangkat berhasil diperbarui');
      } else {
        await api.post('/device', payload);
        toast.success('Perangkat berhasil ditambahkan');
      }
      setShowModal(false);
      await fetchDevices();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan perangkat');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perangkat ini?')) return;
    try {
      await api.delete(`/device/${id}`);
      toast.success('Perangkat berhasil dihapus');
      await fetchDevices();
    } catch (e) {
      toast.error('Gagal menghapus perangkat');
    }
  };

  const testConnection = async (device: any) => {
    setTestingId(device.id);
    try {
      const res = await api.post('/device/test-connection', {
        url: device.url,
        username: device.username,
        password: 'mock-password',
      });
      if (res?.data?.success) {
        toast.success(`${device.name}: ${res.data.message || 'Koneksi Berhasil'}`);
      } else {
        toast.error(`${device.name}: ${res?.data?.message || 'Koneksi gagal'}`);
      }
    } catch (e: any) {
      toast.error(`${device.name}: ${e?.response?.data?.message || 'Gagal terhubung'}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleSetupPush = async (device: any) => {
    const guessedBackend = `${window.location.protocol}//${window.location.hostname}:5000`;
    const serverUrl = prompt(
      `Masukkan Alamat IP/Port Server GASKAN (IP Backend) agar perangkat bisa mengirim data presensi secara real-time (Push Mode):`,
      guessedBackend
    );
    if (!serverUrl) return;

    setSettingPushId(device.id);
    try {
      const res = await api.post(`/device/${device.id}`, { serverUrl });
      toast.success(res?.data?.message || 'Push Mode berhasil dikonfigurasi');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal terhubung ke mesin untuk setup push');
    } finally {
      setSettingPushId(null);
    }
  };

  const toggleDeviceStatus = async (device: any) => {
    try {
      await api.put(`/device/${device.id}`, { isActive: !device.isActive });
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, isActive: !d.isActive } : d))
      );
      toast.success(`Status ${device.name} berhasil diperbarui`);
    } catch (e) {
      toast.error('Gagal mengubah status perangkat');
    }
  };

  const saveLateSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/system/settings', {
        lateHour: Number(lateHour),
        lateMinute: Number(lateMinute),
        minOutHour: Number(minOutHour),
        minOutMinute: Number(minOutMinute),
        onsiteLimitHour: Number(onsiteLimitHour),
      });
      toast.success('Pengaturan parameter kehadiran berhasil disimpan');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading && devices.length === 0) {
    return <DeviceConfigPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Area matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Mesin & Gerbang Presensi
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-black">
              {devices.length} Perangkat
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola beberapa mesin absensi Hikvision beserta nama dan lokasinya untuk pelacakan gerbang pintu masuk.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground rounded-2xl px-6 h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-xs"
        >
          <Icon icon="mingcute:plus-fill" className="mr-1.5 text-lg" />
          Tambah Perangkat
        </Button>
      </div>

      {/* Loading Grid */}
      {loading ? (
        <DeviceCardsSkeleton />
      ) : devices.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center max-w-lg mx-auto shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto">
            <Icon icon="mingcute:chip-line" className="text-3xl text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Belum ada perangkat terdaftar</h3>
          <p className="text-muted-foreground text-xs font-medium">
            Tambahkan mesin sidik jari/wajah Hikvision pertama Anda untuk mulai sinkronisasi data kehadiran siswa secara otomatis.
          </p>
          <Button onClick={openAddModal} className="rounded-xl px-5 h-10 text-xs font-bold">
            <Icon icon="mingcute:plus-fill" className="mr-1 text-sm" />
            Daftarkan Mesin
          </Button>
        </div>
      ) : (
        /* Grid of Devices matching Nuxt 1-to-1 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((d) => (
            <div
              key={d.id}
              className="bg-card border border-border hover:border-primary/30 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {d.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-semibold">
                      <Icon icon="mingcute:location-fill" className="text-primary text-sm shrink-0" />
                      <span>{d.location}</span>
                    </div>
                  </div>

                  {/* Toggle switch to activate/deactivate */}
                  <Switch
                    checked={d.isActive !== false}
                    onCheckedChange={() => toggleDeviceStatus(d)}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-border my-4" />

                {/* Connection Stats matching Nuxt 1-to-1 */}
                <div className="space-y-2.5 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon icon="mingcute:link-2-line" className="text-base text-muted-foreground/60" />
                    <span className="font-mono text-xs truncate bg-muted/60 px-2 py-0.5 rounded-lg text-foreground font-bold">
                      {d.url}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="mingcute:user-3-line" className="text-base text-muted-foreground/60" />
                    <span>
                      Username: <strong className="text-foreground">{d.username}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="mingcute:signal-fill" className="text-base text-muted-foreground/60" />
                    <span>
                      Mode: <strong className="text-primary">Push Webhook (Real-time)</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="mingcute:time-line" className="text-base text-muted-foreground/60" />
                    <span>
                      Interval: <strong className="text-foreground">{d.poolingInterval || 1} detik</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions matching Nuxt 1-to-1 */}
              <div className="mt-6 pt-4 border-t border-border space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(d)}
                    disabled={testingId === d.id}
                    className="flex-1 rounded-xl h-9 text-xs font-bold border-primary text-primary hover:bg-primary/10"
                  >
                    {testingId === d.id ? (
                      <Icon icon="mingcute:loading-fill" className="animate-spin mr-1 text-sm" />
                    ) : (
                      <Icon icon="mingcute:radar-fill" className="mr-1 text-sm" />
                    )}
                    Test Koneksi
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleSetupPush(d)}
                    disabled={settingPushId === d.id}
                    className="flex-1 rounded-xl h-9 text-xs font-bold bg-primary text-primary-foreground"
                  >
                    {settingPushId === d.id ? (
                      <Icon icon="mingcute:loading-fill" className="animate-spin mr-1 text-sm" />
                    ) : (
                      <Icon icon="mingcute:upload-2-fill" className="mr-1 text-sm" />
                    )}
                    Setup Push
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground font-semibold">Aksi Perangkat:</span>
                  <div className="flex items-center gap-1.5">
                    {/* Link to detail page /config/device/[id] */}
                    <Link
                      href={`/config/device/${d.id}`}
                      className="h-8 w-8 rounded-xl border border-border hover:border-emerald-500/30 hover:text-emerald-500 flex items-center justify-center text-muted-foreground transition-colors"
                      title="Statistik & Kapasitas Alat"
                    >
                      <Icon icon="mingcute:chart-bar-fill" className="text-base" />
                    </Link>
                    <button
                      onClick={() => openEditModal(d)}
                      className="h-8 w-8 rounded-xl border border-border hover:border-primary/30 hover:text-primary flex items-center justify-center text-muted-foreground transition-colors"
                    >
                      <Icon icon="mingcute:pencil-fill" className="text-base" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="h-8 w-8 rounded-xl border border-border hover:border-rose-500/30 hover:text-rose-500 flex items-center justify-center text-muted-foreground transition-colors"
                    >
                      <Icon icon="mingcute:delete-2-fill" className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Parameters Card matching Nuxt 1-to-1 */}
      <div className="mt-12 max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Icon icon="mingcute:time-fill" className="text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Parameter Kehadiran & On-Site</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Konfigurasi batas waktu keterlambatan presensi masuk dan jam batas pembersihan otomatis daftar siswa aktif di area (On-Site).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Batas Waktu Masuk <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="time"
              value={lateTime}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':');
                if (h) setLateHour(Number(h));
                if (m) setLateMinute(Number(m));
              }}
              className="rounded-xl font-bold text-xs h-10 bg-muted/30"
            />
            <span className="text-[10px] text-muted-foreground block">Masuk setelah jam ini otomatis &quot;TERLAMBAT&quot;</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Batas Minimal Pulang <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="time"
              value={minOutTime}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':');
                if (h) setMinOutHour(Number(h));
                if (m) setMinOutMinute(Number(m));
              }}
              className="rounded-xl font-bold text-xs h-10 bg-muted/30"
            />
            <span className="text-[10px] text-muted-foreground block">Scan sebelum jam ini diabaikan</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Batas Jam Log Onsite <span className="text-rose-500">*</span>
            </Label>
            <CustomSelect
              value={String(onsiteLimitHour)}
              onChange={(val) => setOnsiteLimitHour(Number(val))}
              options={Array.from({ length: 24 }).map((_, i) => ({
                value: String(i),
                label: `Jam ${String(i).padStart(2, '0')}:00 WIB`,
              }))}
              triggerClassName="w-full h-10 rounded-xl bg-muted/30 border-border font-bold text-xs"
            />
            <span className="text-[10px] text-muted-foreground block">Auto-flush log onsite harian</span>
          </div>
        </div>

        <Button
          onClick={saveLateSettings}
          disabled={savingSettings}
          className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground px-6 h-11"
        >
          {savingSettings ? 'Memproses...' : 'Simpan Parameter Presensi'}
        </Button>
      </div>

      {/* CREATE / EDIT DEVICE MODAL */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
              <DialogTitle className="text-xl font-black text-foreground">
                {isEdit ? 'Edit Perangkat Absensi' : 'Daftarkan Perangkat Baru'}
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Nama Perangkat</Label>
                </div>
                <Input
                  type="text"
                  placeholder="Contoh: Samping bengkel 1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Lokasi Perangkat</Label>
                </div>
                <Input
                  type="text"
                  placeholder="Contoh: Samping bengkel"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">URL IP Perangkat</Label>
                </div>
                <Input
                  type="text"
                  placeholder="http://192.168.55.136"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="rounded-2xl h-11 bg-muted/30 font-bold text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="mb-0">Username Hikvision</Label>
                  </div>
                  <Input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="mb-0">Password</Label>
                  </div>
                  <Input
                    type="password"
                    placeholder={isEdit ? 'Biarkan kosong' : 'Password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
              <Button variant="ghost" className="rounded-2xl font-bold flex-1 text-xs" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-2xl font-bold flex-1 text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                {saving ? 'Memproses...' : isEdit ? 'Simpan Perubahan' : 'Daftarkan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
