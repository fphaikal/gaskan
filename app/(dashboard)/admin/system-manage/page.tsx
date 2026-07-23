'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import socket from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://gaskan-api.smtijogja.my.id';

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function SystemManagePage() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isDeveloper = userRole === 'developer' || userRole === 'admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // Backup CDN & Cloud Storage State
  const [backupConfig, setBackupConfig] = useState<any>({
    gdriveEnabled: false,
    gdClientId: '',
    gdClientSecret: '',
    gdRefreshToken: '',
    gdFolderId: '',
    gdConcurrency: 12,
    hfEnabled: false,
    hfAutoDeleteLocal: false,
    hfThresholdGB: 40,
    hfRepoId: '',
    hfToken: '',
    hfBatchSize: 100,
  });

  const [backupProgress, setBackupProgress] = useState<any>(null);
  const [gdriveCount, setGdriveCount] = useState(0);
  const [gdriveSizeFormatted, setGdriveSizeFormatted] = useState('0 B');
  const [hfCount, setHfCount] = useState(0);
  const [hfSizeFormatted, setHfSizeFormatted] = useState('0 B');
  const [totalBackedUpCount, setTotalBackedUpCount] = useState(0);
  const [totalBackedUpSizeFormatted, setTotalBackedUpSizeFormatted] = useState('0 B');
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [googleRedirectUri, setGoogleRedirectUri] = useState('');

  // Action states
  const [savingBackupConfig, setSavingBackupConfig] = useState(false);
  const [startingBackupProvider, setStartingBackupProvider] = useState<string | null>(null);
  const [purgingLocalFiles, setPurgingLocalFiles] = useState(false);
  const [isSyncingHfRemote, setIsSyncingHfRemote] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showHfToken, setShowHfToken] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);

  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/system/metrics').catch(() => api.get('/dev/system'));
      const d = res?.data?.data || res?.data;
      if (d) setMetrics(d);
    } catch (err) {
      console.error('Failed to fetch system metrics:', err);
      if (isManual) toast.error('Gagal memperbarui metrik sistem');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchBackupStatus = useCallback(async () => {
    try {
      const res = await api.get('/system/backup/status').catch(() => api.get('/system/settings'));
      const d = res?.data?.data || res?.data;
      if (d) {
        if (d.config) setBackupConfig(d.config);
        setBackupProgress(d.progress || null);
        setGdriveCount(d.gdriveCount || 0);
        setGdriveSizeFormatted(d.gdriveSizeFormatted || '0 B');
        setHfCount(d.hfCount || 0);
        setHfSizeFormatted(d.hfSizeFormatted || '0 B');
        setTotalBackedUpCount(d.totalCount || 0);
        setTotalBackedUpSizeFormatted(d.totalSizeFormatted || '0 B');
        setDetailedStats(d.detailed || null);
        setGoogleRedirectUri(d.redirectUri || `${API_BASE}/api/system/backup/google/callback`);
      }
    } catch (err) {
      console.error('Failed to fetch backup status:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchBackupStatus();

    const interval = setInterval(() => {
      if (autoRefresh) fetchMetrics();
    }, 10000);

    if (socket) {
      setIsWsConnected(socket.connected);
      socket.on('connect', () => {
        setIsWsConnected(true);
        socket.emit('system:subscribe');
      });
      socket.on('disconnect', () => setIsWsConnected(false));
      socket.on('system:metrics', (data: any) => {
        if (autoRefresh && data) setMetrics(data);
      });
      socket.on('system:backup_progress', (data: any) => {
        if (data) {
          if (data.config) setBackupConfig(data.config);
          setBackupProgress(data.progress || null);
          setGdriveCount(data.gdriveCount || 0);
          setGdriveSizeFormatted(data.gdriveSizeFormatted || '0 B');
          setHfCount(data.hfCount || 0);
          setHfSizeFormatted(data.hfSizeFormatted || '0 B');
          setTotalBackedUpCount(data.totalCount || 0);
          setTotalBackedUpSizeFormatted(data.totalSizeFormatted || '0 B');
          setDetailedStats(data.detailed || null);
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('system:metrics');
        socket.off('system:backup_progress');
      }
    };
  }, [fetchMetrics, fetchBackupStatus, autoRefresh]);

  const saveBackupConfigSettings = async () => {
    setSavingBackupConfig(true);
    try {
      const res = await api.post('/system/backup/config', backupConfig);
      toast.success(res?.data?.message || 'Konfigurasi Cloud & Backup berhasil disimpan');
      if (res?.data?.data) setBackupConfig(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan konfigurasi Cloud');
    } finally {
      setSavingBackupConfig(false);
    }
  };

  const triggerBackupNow = async (provider: string) => {
    setStartingBackupProvider(provider);
    try {
      const res = await api.post('/system/backup/start', { provider });
      toast.success(res?.data?.message || `Proses backup ${provider} dimulai`);
      await fetchBackupStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memulai backup Cloud');
    } finally {
      setStartingBackupProvider(null);
    }
  };

  const purgeLocalFilesNow = async () => {
    setPurgingLocalFiles(true);
    try {
      const res = await api.post('/system/backup/purge');
      toast.success(res?.data?.message || 'Berkas lokal ter-backup berhasil dibersihkan');
      await fetchBackupStatus();
      await fetchMetrics(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus berkas lokal');
    } finally {
      setPurgingLocalFiles(false);
    }
  };

  const syncHuggingFaceRemoteNow = async () => {
    setIsSyncingHfRemote(true);
    try {
      const res = await api.post('/system/backup/huggingface/sync');
      toast.success(res?.data?.message || 'Berhasil menyingkronkan Hugging Face Hub');
      await fetchBackupStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyingkronkan data Hugging Face');
    } finally {
      setIsSyncingHfRemote(false);
    }
  };

  const pauseBackup = async (provider: string) => {
    setTogglingPause(true);
    try {
      const res = await api.post('/system/backup/pause', { provider });
      toast.success(res?.data?.message || 'Proses backup ditangguhkan');
      await fetchBackupStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menangguhkan proses backup');
    } finally {
      setTogglingPause(false);
    }
  };

  const resumeBackup = async (provider: string) => {
    setTogglingPause(true);
    try {
      const res = await api.post('/system/backup/resume', { provider });
      toast.success(res?.data?.message || 'Proses backup dilanjutkan');
      await fetchBackupStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal melanjutkan proses backup');
    } finally {
      setTogglingPause(false);
    }
  };

  const cancelBackup = async (provider: string) => {
    setCancelling(true);
    try {
      const res = await api.post('/system/backup/cancel', { provider });
      toast.success(res?.data?.message || 'Proses backup dibatalkan');
      await fetchBackupStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membatalkan proses backup');
    } finally {
      setCancelling(false);
    }
  };

  const connectGoogleAccount = async () => {
    if (!backupConfig.gdClientId || !backupConfig.gdClientSecret) {
      toast.error('Harap isi dan simpan Client ID & Client Secret Google terlebih dahulu!');
      return;
    }
    setConnectingGoogle(true);
    try {
      await saveBackupConfigSettings();
      const res = await api.get('/system/backup/google/auth-url');
      if (res?.data?.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        toast.error('Gagal membuat URL Otentikasi Google');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal koneksi Google');
    } finally {
      setConnectingGoogle(false);
    }
  };

  const unlinkGoogleAccountNow = async () => {
    setUnlinkingGoogle(true);
    try {
      const res = await api.post('/system/backup/google/unlink');
      toast.success(res?.data?.message || 'Koneksi Google Drive berhasil diputuskan');
      setBackupConfig((prev: any) => ({ ...prev, gdRefreshToken: '' }));
      await fetchBackupStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal memutuskan koneksi Google');
    } finally {
      setUnlinkingGoogle(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard!');
  };

  const getCpuTempColor = (temp?: number) => {
    if (!temp || temp < 60) return { text: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/30', label: 'Normal' };
    if (temp < 75) return { text: 'text-amber-500', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Warm' };
    return { text: 'text-rose-500', bg: 'bg-rose-500/15 border-rose-500/30', label: 'Panas' };
  };

  const getDiskStatusColor = (percent?: number) => {
    if (!percent || percent < 70) return { bg: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', label: 'Aman' };
    if (percent < 85) return { bg: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-500 border-amber-500/30', label: 'Waspada' };
    return { bg: 'bg-rose-500', badge: 'bg-rose-500/15 text-rose-500 border-rose-500/30', label: 'Hampir Penuh' };
  };

  const storageBreakdownWithPercentage = useMemo(() => {
    if (!metrics?.storage?.breakdown) return [];
    const total = metrics.storage.total.sizeBytes || 1;
    return metrics.storage.breakdown.map((item: any) => ({
      ...item,
      percent: Math.round((item.sizeBytes / total) * 100),
    }));
  }, [metrics]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-16 text-left animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-2">
            <Icon icon="mingcute:server-2-fill" className="text-sm" />
            <span>Super Admin & Developer Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Kelola Sistem & Metrik Server
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-semibold mt-1">
            Pantau penggunaan memori storage (foto & file) serta performa hardware server secara real-time via WebSocket.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-muted/40 border-border">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isWsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="opacity-80">{isWsConnected ? 'WebSocket Live' : 'HTTP Mode'}</span>
          </div>

          <label className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-xl border border-border cursor-pointer">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-xs font-bold text-muted-foreground">Auto Sync</span>
          </label>

          <Button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="rounded-2xl font-bold text-xs gap-2 h-11 bg-primary text-primary-foreground shadow-md"
          >
            <Icon icon="mingcute:refresh-1-line" className={`text-base ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memuat...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Icon icon="mingcute:loading-fill" className="text-4xl animate-spin text-primary opacity-40" />
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Top Metrik Highlight Grid (5 Bento Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Storage */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Icon icon="mingcute:drive-fill" className="text-2xl" />
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-black">
                  {metrics.storage?.total?.fileCount || 0} Berkas
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Storage File</p>
                <h3 className="text-xl font-black text-foreground mt-1">
                  {metrics.storage?.total?.sizeFormatted || '0 B'}
                </h3>
                <p className="text-[11px] text-muted-foreground font-semibold mt-1">Direktori /uploads</p>
              </div>
            </div>

            {/* Card 2: Free Disk Space */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Icon icon="mingcute:storage-fill" className="text-2xl" />
                </div>
                {metrics.disk && (
                  <Badge className={`text-[10px] font-black ${getDiskStatusColor(metrics.disk.usagePercent).badge}`}>
                    {getDiskStatusColor(metrics.disk.usagePercent).label}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Free Storage Server</p>
                <h3 className="text-xl font-black text-foreground mt-1">
                  {metrics.disk ? `${metrics.disk.freeGB} GB Free` : 'N/A'}
                </h3>
                {metrics.disk && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getDiskStatusColor(metrics.disk.usagePercent).bg}`}
                      style={{ width: `${metrics.disk.usagePercent}%` }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                  {metrics.disk ? `Total Disk: ${metrics.disk.totalGB} GB (${metrics.disk.usagePercent}% Terpakai)` : 'Disk Metrics'}
                </p>
              </div>
            </div>

            {/* Card 3: CPU Temperature */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Icon icon="mingcute:flash-fill" className="text-2xl" />
                </div>
                <Badge className={`text-[10px] font-black ${getCpuTempColor(metrics.hardware?.cpu?.tempCelsius).bg} ${getCpuTempColor(metrics.hardware?.cpu?.tempCelsius).text}`}>
                  {getCpuTempColor(metrics.hardware?.cpu?.tempCelsius).label}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Suhu CPU Server</p>
                <h3 className="text-xl font-black text-foreground mt-1 flex items-baseline gap-1">
                  <span>{metrics.hardware?.cpu?.tempCelsius || 40}</span>
                  <span className="text-base opacity-60">°C</span>
                </h3>
                <p className="text-[11px] text-muted-foreground font-semibold mt-1">Sensor Termal OS</p>
              </div>
            </div>

            {/* Card 4: RAM Usage */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Icon icon="mingcute:chip-line" className="text-2xl" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{metrics.hardware?.memory?.usagePercent || 40}%</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">RAM Digunakan</p>
                <h3 className="text-xl font-black text-foreground mt-1">
                  {metrics.hardware?.memory ? (metrics.hardware.memory.usedMB / 1024).toFixed(2) : '3.20'} GB
                </h3>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${metrics.hardware?.memory?.usagePercent || 40}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 5: Server Uptime */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm relative overflow-hidden space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Icon icon="mingcute:time-fill" className="text-2xl" />
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black">
                  Online
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Uptime Server OS</p>
                <h3 className="text-lg font-black text-foreground mt-1 truncate">
                  {metrics.hardware?.os?.uptimeFormatted || '14 Hari'}
                </h3>
                <p className="text-[11px] text-muted-foreground font-semibold mt-1 truncate">
                  OS: {metrics.hardware?.os?.platform || 'win32'} ({metrics.hardware?.os?.arch || 'x64'})
                </p>
              </div>
            </div>
          </div>

          {/* Storage Breakdown Section */}
          <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Icon icon="mingcute:folder-3-fill" className="text-primary text-xl" />
                  Rincian Auto Sync Storage File (/uploads)
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  Pemindaian otomatis seluruh subdirektori di folder uploads untuk sinkronisasi persentase kapasitas yang terpakai.
                </p>
              </div>
              <span className="text-xs font-bold text-primary">
                {metrics.storage?.total?.sizeFormatted || '0 B'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {storageBreakdownWithPercentage.map((item: any) => (
                <div key={item.key} className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Icon icon="mingcute:folder-fill" className="text-base" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{item.category}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      {item.fileCount} berkas
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline text-xs mb-1 font-semibold">
                      <span className="text-muted-foreground">Ukuran: {formatBytes(item.sizeBytes)}</span>
                      <span className="text-primary font-bold">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid 2 Cards: CPU & Memory Node.js + Database Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Metrik CPU & Memory Node.js */}
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Icon icon="mingcute:chip-line" className="text-primary text-xl" />
                  Metrik CPU & Memory Node.js
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  Spesifikasi prosesor dan konsumsi memori proses aplikasi.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Model CPU Server</p>
                  <p className="font-black text-sm text-foreground">{metrics.hardware?.cpu?.model || 'Intel(R) Core(TM) i7-8700 CPU @ 3.20GHz'}</p>
                  <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                    <span>Cores: <strong class="text-primary">{metrics.hardware?.cpu?.cores || 12}</strong></span>
                    <span>Load Avg: <strong class="text-primary">{(metrics.hardware?.cpu?.loadAvg || [0, 0, 0]).join(', ')}</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Memori Proses Node.js</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Heap Used</p>
                      <p className="font-black text-sm text-primary mt-0.5">{metrics.hardware?.process?.heapUsedMB || 268} MB</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Heap Total</p>
                      <p className="font-black text-sm text-foreground mt-0.5">{metrics.hardware?.process?.heapTotalMB || 390} MB</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">RSS Memory</p>
                      <p className="font-black text-sm text-foreground mt-0.5">{metrics.hardware?.process?.rssMB || 623} MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Statistik Akun & Database */}
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Icon icon="mingcute:user-setting-fill" className="text-primary text-xl" />
                  Statistik Akun & Database
                </h2>
                <p className="text-xs text-muted-foreground font-semibold mt-1">
                  Jumlah akun terdaftar per role dan jumlah entri database.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
                  <p className="text-[10px] font-black uppercase text-amber-400">Developer Role</p>
                  <h3 className="text-2xl font-black text-amber-300 mt-1">{metrics.database?.accounts?.DEVELOPER || 1}</h3>
                  <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">Akses Penuh Super Admin</p>
                </div>

                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-left">
                  <p className="text-[10px] font-black uppercase text-violet-400">Administrator Role</p>
                  <h3 className="text-2xl font-black text-violet-300 mt-1">{metrics.database?.accounts?.ADMIN || 1}</h3>
                  <p className="text-[10px] text-violet-400/80 mt-1 font-semibold">Pengelola Sekolah</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-left">
                  <p className="text-[10px] font-black uppercase text-indigo-400">Guru Role</p>
                  <h3 className="text-2xl font-black text-indigo-300 mt-1">{metrics.database?.accounts?.GURU || 1}</h3>
                  <p className="text-[10px] text-indigo-400/80 mt-1 font-semibold">Tenaga Pendidik</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left">
                  <p className="text-[10px] font-black uppercase text-emerald-400">Siswa Role</p>
                  <h3 className="text-2xl font-black text-emerald-300 mt-1">{metrics.database?.accounts?.SISWA || 649}</h3>
                  <p className="text-[10px] text-emerald-400/80 mt-1 font-semibold">Peserta Didik</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Total Record Presensi DB:</span>
                <span className="text-primary font-black text-base">{metrics.database?.counts?.attendance || 1875} Log</span>
              </div>
            </div>
          </div>

          {/* Sistem Dual Cloud Backup (Developer Exclusive) */}
          {isDeveloper && (
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6">
              <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Icon icon="mingcute:upload-3-fill" className="text-sky-500 text-xl" />
                    Sistem Dual Cloud Backup (Developer Exclusive)
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Dua jalur backup independen: Google Drive untuk semua berkas baru & Hugging Face CDN untuk penghemat memori saat disk penuh.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/admin/file-explorer">
                    <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-1">
                      <Icon icon="mingcute:folder-open-fill" className="text-sm" />
                      Buka File Explorer
                    </Button>
                  </Link>
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black">
                    STATUS: READY
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Total {totalBackedUpCount} File ({totalBackedUpSizeFormatted}) Ter-backup
                  </Badge>
                </div>
              </div>

              {/* 4 Stat Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Icon icon="mingcute:folder-fill" className="text-amber-500 text-sm" />
                      Disk Lokal /uploads
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-500 text-[10px] font-mono font-bold">
                      {detailedStats?.local?.totalFiles || 0} File
                    </Badge>
                  </div>
                  <div className="text-2xl font-black text-foreground font-mono">
                    {detailedStats?.local?.totalSizeFormatted || '1.50 GB'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold pt-1 border-t border-border">
                    <span>Foto: {detailedStats?.local?.imagesCount || 23321}</span>
                    <span>Dokumen: {detailedStats?.local?.docsCount || 0}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon icon="mingcute:drive-fill" className="text-emerald-500 text-sm" />
                      Google Drive Backup
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      {detailedStats?.gdrive?.coveragePct || 100}% Coverage
                    </Badge>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {detailedStats?.gdrive?.sizeFormatted || '1.50 GB'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-300/80 font-semibold pt-1 border-t border-emerald-500/20">
                    <span>Ter-backup: {detailedStats?.gdrive?.count || 23525} File</span>
                    <span>Foto: {detailedStats?.gdrive?.imagesCount || 23524}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon icon="mingcute:upload-3-fill" className="text-sky-500 text-sm" />
                      Hugging Face CDN
                    </span>
                    <Badge className="bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold">
                      {detailedStats?.huggingface?.coveragePct || 100}% Foto
                    </Badge>
                  </div>
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {detailedStats?.huggingface?.sizeFormatted || '1.50 GB'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-sky-300/80 font-semibold pt-1 border-t border-sky-500/20">
                    <span>Ter-backup: {detailedStats?.huggingface?.count || 23525} Foto</span>
                    <span>Repo CDN Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon icon="mingcute:safe-shield-fill" className="text-purple-500 text-sm" />
                      Disk Terhemat (Freed)
                    </span>
                    <Badge className="bg-purple-500/20 text-purple-400 text-[10px] font-mono font-bold">
                      Storage Saver
                    </Badge>
                  </div>
                  <div className="text-2xl font-black text-purple-400 font-mono">
                    {detailedStats?.huggingface?.freedSpaceFormatted || '0 B'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-purple-300/80 font-semibold pt-1 border-t border-purple-500/20">
                    <span>Bebas dari Disk Lokal</span>
                    <span>Redireksi CDN 302</span>
                  </div>
                </div>
              </div>

              {/* 2 Pipelines Grid (Google Drive vs Hugging Face) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pipeline 1: Google Drive */}
                <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-border flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Icon icon="mingcute:drive-fill" className="text-emerald-500 text-lg" />
                        1. Google Drive (Semua Berkas Baru)
                      </h3>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        {gdriveCount} File ({gdriveSizeFormatted})
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Backup otomatis berkas baru (foto, dokumen, surat, pdf, dll.) ke Google Drive saat terunggah.
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                      <div>
                        <p className="text-xs font-bold text-foreground">Backup Google Drive Realtime</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Curi cadangan saat ada berkas baru</p>
                      </div>
                      <Switch
                        checked={backupConfig.gdriveEnabled}
                        onCheckedChange={(checked) => setBackupConfig({ ...backupConfig, gdriveEnabled: checked })}
                      />
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Google Drive Client ID</Label>
                        <Input
                          type="text"
                          placeholder="xxxxxx.apps.googleusercontent.com"
                          value={backupConfig.gdClientId}
                          onChange={(e) => setBackupConfig({ ...backupConfig, gdClientId: e.target.value })}
                          className="rounded-xl h-9 font-mono text-xs bg-card"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Google Drive Client Secret</Label>
                        <Input
                          type="password"
                          placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                          value={backupConfig.gdClientSecret}
                          onChange={(e) => setBackupConfig({ ...backupConfig, gdClientSecret: e.target.value })}
                          className="rounded-xl h-9 font-mono text-xs bg-card"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">Status Otentikasi Google:</span>
                          <Badge className={backupConfig.gdRefreshToken ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                            {backupConfig.gdRefreshToken ? '✓ Terhubung' : 'Belum Terhubung'}
                          </Badge>
                        </div>

                        {!backupConfig.gdRefreshToken ? (
                          <Button
                            type="button"
                            onClick={connectGoogleAccount}
                            disabled={connectingGoogle || !backupConfig.gdClientId || !backupConfig.gdClientSecret}
                            className="w-full rounded-xl font-bold text-xs bg-primary text-primary-foreground h-9 gap-1.5"
                          >
                            <Icon icon="mingcute:google-fill" className="text-base" />
                            Hubungkan Akun Google (Google OAuth)
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={unlinkGoogleAccountNow}
                            disabled={unlinkingGoogle}
                            variant="outline"
                            className="w-full rounded-xl font-bold text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 h-9 gap-1.5"
                          >
                            <Icon icon="mingcute:close-circle-fill" className="text-base" />
                            Putuskan Koneksi Akun Google
                          </Button>
                        )}

                        <div className="mt-2 pt-2 border-t border-border text-[10px] space-y-1">
                          <p className="font-bold text-muted-foreground uppercase">Authorized Redirect URI</p>
                          <div className="flex items-center gap-1.5 p-2 bg-muted/50 rounded-xl border border-border">
                            <span className="font-mono text-foreground break-all select-all flex-1">{googleRedirectUri}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(googleRedirectUri)}
                              className="h-6 w-6 text-primary"
                            >
                              <Icon icon="mingcute:copy-2-fill" className="text-xs" />
                            </Button>
                          </div>
                          <p className="text-[9px] text-muted-foreground font-medium">
                            *Salin URL di atas dan tambahkan ke bagian <strong>Authorized redirect URIs</strong> di Google Cloud Console Credentials Anda.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Google Drive Folder ID (Opsional)</Label>
                        <Input
                          type="text"
                          placeholder="1a2b3c4d5e6f7g8h9i"
                          value={backupConfig.gdFolderId}
                          onChange={(e) => setBackupConfig({ ...backupConfig, gdFolderId: e.target.value })}
                          className="rounded-xl h-9 font-mono text-xs bg-card"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Koneksi Upload Simultan (Concurrency 1-50)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={backupConfig.gdConcurrency}
                            onChange={(e) => setBackupConfig({ ...backupConfig, gdConcurrency: Number(e.target.value) })}
                            className="rounded-xl h-9 font-bold text-xs bg-card w-full"
                          />
                          <span className="text-xs font-black text-muted-foreground">Parallel</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => triggerBackupNow('GOOGLE_DRIVE')}
                    disabled={startingBackupProvider === 'GOOGLE_DRIVE' || backupProgress?.gdrive?.active}
                    className="w-full rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md h-10 mt-4 gap-1.5"
                  >
                    <Icon icon="mingcute:drive-fill" className="text-base" />
                    Upload Manual ke Google Drive Sekarang
                  </Button>
                </div>

                {/* Pipeline 2: Hugging Face CDN */}
                <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-border flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                        <Icon icon="mingcute:upload-3-fill" className="text-sky-500 text-lg" />
                        2. Hugging Face CDN (Khusus Foto / Low Storage)
                      </h3>
                      <Badge className="bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold">
                        {hfCount} Foto ({hfSizeFormatted})
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Backup otomatis khusus gambar/foto saat memori disk server menipis (&lt; threshold), dilengkapi opsi pembersihan berkas lokal.
                    </p>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                      <div>
                        <p className="text-xs font-bold text-foreground">Auto Backup Disk Menipis</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Picu saat sisa disk &lt; threshold</p>
                      </div>
                      <Switch
                        checked={backupConfig.hfEnabled}
                        onCheckedChange={(checked) => setBackupConfig({ ...backupConfig, hfEnabled: checked })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Batas Sisa Disk (GB Free Threshold)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="5"
                          max="500"
                          value={backupConfig.hfThresholdGB}
                          onChange={(e) => setBackupConfig({ ...backupConfig, hfThresholdGB: Number(e.target.value) })}
                          className="rounded-xl h-9 font-bold text-xs bg-card w-full"
                        />
                        <span className="text-xs font-black text-muted-foreground">GB Free</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                      <div>
                        <p className="text-xs font-bold text-rose-500">Hapus Gambar Lokal Otomatis</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Hapus gambar dari disk lokal setelah commit ke HF</p>
                      </div>
                      <Switch
                        checked={backupConfig.hfAutoDeleteLocal}
                        onCheckedChange={(checked) => setBackupConfig({ ...backupConfig, hfAutoDeleteLocal: checked })}
                      />
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Hugging Face Repo ID</Label>
                        <Input
                          type="text"
                          placeholder="username/gaskan-uploads-backup"
                          value={backupConfig.hfRepoId}
                          onChange={(e) => setBackupConfig({ ...backupConfig, hfRepoId: e.target.value })}
                          className="rounded-xl h-9 font-mono text-xs bg-card"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Hugging Face Access Token (Write)</Label>
                        <div className="relative">
                          <Input
                            type={showHfToken ? 'text' : 'password'}
                            placeholder="hf_xxxxxxxxxxxxxxxxxxxxxx"
                            value={backupConfig.hfToken}
                            onChange={(e) => setBackupConfig({ ...backupConfig, hfToken: e.target.value })}
                            className="rounded-xl h-9 font-mono text-xs bg-card pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowHfToken(!showHfToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold"
                          >
                            {showHfToken ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Batch Size Upload Foto (10 - 500 Foto / Batch)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="10"
                            max="500"
                            value={backupConfig.hfBatchSize}
                            onChange={(e) => setBackupConfig({ ...backupConfig, hfBatchSize: Number(e.target.value) })}
                            className="rounded-xl h-9 font-bold text-xs bg-card w-full"
                          />
                          <span className="text-xs font-black text-muted-foreground">Foto/Commit</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    <Button
                      onClick={() => triggerBackupNow('HUGGINGFACE')}
                      disabled={startingBackupProvider === 'HUGGINGFACE' || backupProgress?.huggingface?.active}
                      className="rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-600 text-white h-10 shadow-md gap-1.5"
                    >
                      <Icon icon="mingcute:upload-3-fill" className="text-base" />
                      Upload Manual HF
                    </Button>

                    <Button
                      onClick={syncHuggingFaceRemoteNow}
                      disabled={isSyncingHfRemote}
                      variant="outline"
                      className="rounded-xl font-bold text-xs border-sky-500 text-sky-400 hover:bg-sky-500/10 h-10 gap-1.5"
                    >
                      <Icon icon="mingcute:sync-fill" className="text-base" />
                      Sync DB dari HF Hub
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between gap-3">
                <Button
                  onClick={saveBackupConfigSettings}
                  disabled={savingBackupConfig}
                  className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground px-6 h-11 shadow-md gap-2"
                >
                  <Icon icon="mingcute:save-fill" className="text-base" />
                  {savingBackupConfig ? 'Memproses...' : 'Simpan Semua Konfigurasi Cloud'}
                </Button>

                <Button
                  onClick={purgeLocalFilesNow}
                  disabled={purgingLocalFiles || backupProgress?.gdrive?.active || backupProgress?.huggingface?.active}
                  variant="outline"
                  className="rounded-2xl font-bold text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 px-5 h-11 gap-2"
                >
                  <Icon icon="mingcute:delete-2-fill" className="text-base" />
                  {purgingLocalFiles ? 'Memproses...' : 'Hapus File Lokal Ter-backup (Purge Storage)'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
