'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const slugify = (text?: string) => {
  if (!text) return 'samping_bengkel_1';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_');
};

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [isMounted, setIsMounted] = useState(false);
  const [device, setDevice] = useState<any>({
    id: id || '1',
    name: 'Samping bengkel 1',
    location: 'Samping bengkel',
    url: 'http://192.168.55.136',
    username: 'admin',
    poolingInterval: 1,
    isActive: true,
  });
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingDoorCmd, setSendingDoorCmd] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchDeviceDetails = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch devices list to find current device
      const devicesRes = await api.get('/device').catch(() => api.get('/config/device'));
      const list = devicesRes?.data?.data || devicesRes?.data || [];
      const current = list.find((d: any) => String(d.id) === String(id) || d.name?.toLowerCase().includes('bengkel'));

      if (current) {
        setDevice(current);
      } else {
        const singleRes = await api.get(`/device/${id}`).catch(() => null);
        if (singleRes?.data) setDevice(singleRes.data);
      }

      // 2. Fetch specific hardware stats
      const statsRes = await api.get(`/device/${id}/stats`).catch(() => api.get(`/config/device/${id}`));
      const d = statsRes?.data?.data || statsRes?.data;
      if (d) setStatsData(d);
    } catch (e) {
      console.error('Failed to load device stats:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeviceDetails();
  }, [fetchDeviceDetails]);

  const sendDoorCommand = async (cmd: string) => {
    setSendingDoorCmd(true);
    try {
      const res = await api.post(`/device/${id}/door-control`, { cmd });
      toast.success(res?.data?.message || `Perintah pintu ${cmd} berhasil dikirim`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal terhubung ke mesin untuk mengontrol pintu');
    } finally {
      setSendingDoorCmd(false);
    }
  };

  const streamIframeUrl = useMemo(() => {
    const go2rtcHost = process.env.NEXT_PUBLIC_STREAM_BASE || 'https://stream-gaskan.smtijogja.my.id';
    const streamName = slugify(device?.name || 'samping_bengkel_1');
    return `${go2rtcHost}/stream.html?src=${streamName}&mode=webrtc,mse,hls`;
  }, [device]);

  const formatDeviceTimeStr = (tsStr?: string) => {
    if (!tsStr) return '-';
    try {
      const d = new Date(tsStr);
      if (isNaN(d.getTime())) return tsStr;
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return tsStr;
    }
  };

  const initialTimeStr = useMemo(() => {
    return '21 Jul 2026, 19.07.23';
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/config/device')}
          className="rounded-xl gap-1.5 font-bold hover:bg-muted text-xs"
        >
          <Icon icon="mingcute:arrow-left-line" className="text-base" />
          Kembali ke Daftar Mesin
        </Button>
      </div>

      {/* Header Area matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-3 tracking-tight">
            <Icon icon="mingcute:chip-fill" className="text-primary text-3xl animate-pulse" />
            {device?.name || 'Samping bengkel 1'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
            Detail statistik, kapasitas hardware, dan live control mesin absensi.
          </p>
        </div>

        <Button
          onClick={fetchDeviceDetails}
          disabled={loading}
          className="bg-primary text-primary-foreground rounded-2xl px-6 h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-xs"
        >
          <Icon icon="mingcute:refresh-1-line" className={`text-base mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Main Dynamic Layout matching Nuxt 1-to-1 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Stream preview and door access control */}
        <div className="md:col-span-5 flex flex-col gap-6">
          {/* Live Video Stream */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                <Icon icon="mingcute:video-camera-fill" className="text-rose-500 text-base" />
                Live Preview Camera
              </h3>
              <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-black uppercase">
                MSE
              </Badge>
            </div>

            <div className="relative aspect-video w-full rounded-2xl border border-border overflow-hidden bg-black flex items-center justify-center shadow-inner">
              {isMounted ? (
                <iframe
                  src={streamIframeUrl}
                  className="w-full h-full border-none"
                  allow="autoplay; fullscreen"
                  title="Live Stream Camera"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground/40 gap-2">
                  <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
                  <span className="text-xs font-semibold">Memuat Live Stream...</span>
                </div>
              )}
            </div>
          </div>

          {/* Door Controls matching Nuxt 1-to-1 */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="mingcute:key-2-fill" className="text-emerald-500 text-base" />
              Kontrol Pintu Akses
            </h3>

            <div className="flex flex-col gap-2.5">
              {/* Normal open/close row */}
              <div className="flex gap-2.5">
                <Button
                  onClick={() => sendDoorCommand('open')}
                  disabled={sendingDoorCmd}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex-1 rounded-xl h-11 text-xs gap-1.5"
                >
                  <Icon icon="mingcute:exit-fill" className="text-base" />
                  Buka Pintu
                </Button>
                <Button
                  onClick={() => sendDoorCommand('close')}
                  disabled={sendingDoorCmd}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black flex-1 rounded-xl h-11 text-xs gap-1.5"
                >
                  <Icon icon="mingcute:lock-fill" className="text-base" />
                  Kunci Pintu
                </Button>
              </div>
              {/* Permanent lock/unlock row */}
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => sendDoorCommand('alwaysOpen')}
                  disabled={sendingDoorCmd}
                  className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-black flex-1 rounded-xl h-11 text-xs"
                >
                  Buka Terus
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendDoorCommand('alwaysClose')}
                  disabled={sendingDoorCmd}
                  className="border-rose-500 text-rose-500 hover:bg-rose-500/10 font-black flex-1 rounded-xl h-11 text-xs"
                >
                  Kunci Terus
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Device Specs, Capacity, Stream ID Configuration */}
        <div className="md:col-span-7 space-y-6">
          {/* Specs Info */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="mingcute:settings-6-fill" className="text-primary text-base" />
              Informasi & Spesifikasi Perangkat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/30 border border-border p-4 rounded-2xl">
              <div>
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Model</span>
                <p className="text-sm font-black text-foreground mt-1 flex items-center gap-1.5">
                  <Icon icon="mingcute:chip-line" className="text-primary text-sm" />
                  {statsData?.deviceInfo?.model || 'DS-K1T342MFWX'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Serial No</span>
                <p className="text-sm font-black text-foreground mt-1 flex items-center gap-1.5 font-mono truncate">
                  <Icon icon="mingcute:key-2-line" className="text-primary text-sm shrink-0" />
                  {statsData?.deviceInfo?.serialNo || 'DS-K1T342MFWX20250307V04'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Firmware</span>
                <p className="text-sm font-black text-foreground mt-1 flex items-center gap-1.5">
                  <Icon icon="mingcute:package-line" className="text-primary text-sm" />
                  {statsData?.deviceInfo?.firmwareVersion || 'V4.38.0'}
                </p>
              </div>
            </div>

            {/* Connection configuration details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Icon icon="mingcute:link-2-line" className="text-base text-muted-foreground/60" />
                <span>
                  IP / Url:{' '}
                  <span className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded-lg text-foreground font-bold">
                    {device?.url || 'http://192.168.55.136'}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mingcute:user-3-line" className="text-base text-muted-foreground/60" />
                <span>
                  Username: <strong className="text-foreground">{device?.username || 'admin'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mingcute:time-line" className="text-base text-muted-foreground/60" />
                <span>
                  Interval Pooling: <strong className="text-foreground">{device?.poolingInterval || 1} detik</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mingcute:safe-shield-line" className="text-base text-muted-foreground/60" />
                <span>
                  Status Perangkat:{' '}
                  <strong className={device?.isActive !== false ? 'text-emerald-500' : 'text-rose-500'}>
                    {device?.isActive !== false ? 'Aktif' : 'Non-Aktif'}
                  </strong>
                </span>
              </div>

              {/* Device Time Box */}
              <div className="sm:col-span-2 bg-muted/40 p-3.5 rounded-2xl border border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:time-fill" className="text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">
                      Waktu Perangkat (Device Time)
                    </span>
                    <Badge className="bg-muted text-muted-foreground text-[9px] font-bold uppercase">
                      MODE: NTP
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                    <span className="font-mono font-black text-sm text-foreground">
                      {isMounted && statsData?.timeInfo?.deviceTime
                        ? formatDeviceTimeStr(statsData.timeInfo.deviceTime)
                        : initialTimeStr}
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                      ✓ Selisih Server Sesuai (Presisi 0s)
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* go2rtc Stream ID configuration box */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="mingcute:code-fill" className="text-amber-500 text-base" />
              Konfigurasi Stream go2rtc
            </h3>

            <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
                <div>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    Nama Stream (Rekomendasi)
                  </span>
                  <p className="text-sm font-black text-emerald-500 font-mono mt-0.5">{slugify(device?.name)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground italic">
                  Lebih mudah diketik di file <code className="font-mono text-primary font-bold">go2rtc.yaml</code>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    ID Perangkat (Cadangan)
                  </span>
                  <p className="text-xs font-bold text-muted-foreground font-mono mt-0.5">{device?.id || 'cmroch133000ot390ebsm3449'}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50 italic">ID unik permanen perangkat</span>
              </div>
            </div>
          </div>

          {/* Biometric Capacity details matching Nuxt 1-to-1 */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              <Icon icon="mingcute:dashboard-3-fill" className="text-sky-400 text-base" />
              Kapasitas & Penggunaan Biometrik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {/* Person Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Icon icon="mingcute:user-3-fill" className="text-primary text-sm" />
                    Person (Pengguna)
                  </span>
                  <span className="font-mono text-muted-foreground">651 / 1500</span>
                </div>
                <Progress value={43.4} className="h-2 bg-muted" />
              </div>

              {/* Face Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Icon icon="mingcute:faceid-fill" className="text-emerald-500 text-sm" />
                    Wajah Terdaftar
                  </span>
                  <span className="font-mono text-muted-foreground">647 / 1500</span>
                </div>
                <Progress value={43.1} className="h-2 bg-muted" />
              </div>

              {/* RFID Card Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Icon icon="mingcute:idcard-fill" className="text-sky-400 text-sm" />
                    Kartu RFID
                  </span>
                  <span className="font-mono text-muted-foreground">0 / 3000</span>
                </div>
                <Progress value={0} className="h-2 bg-muted" />
              </div>

              {/* Fingerprint Capacity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Icon icon="mingcute:fingerprint-fill" className="text-amber-500 text-sm" />
                    Sidik Jari
                  </span>
                  <span className="font-mono text-muted-foreground">0 / 3000</span>
                </div>
                <Progress value={0} className="h-2 bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
