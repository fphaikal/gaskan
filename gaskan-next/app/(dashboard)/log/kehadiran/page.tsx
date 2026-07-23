'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { goeyToast as toast } from 'goey-toast';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import socket from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { AttendanceLogPageSkeleton } from '@/components/shared/PresencePageSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function LogKehadiranPage() {
  const { user } = useAuth();
  const userRole = (user?.role || 'siswa').toLowerCase();
  const isAdminOrDev = useMemo(
    () => ['admin', 'developer', 'guru'].includes(userRole),
    [userRole]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  // Admin/Dev View State
  const [logGroups, setLogGroups] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number }>({
    total: 0,
    page: 1,
    limit: 20,
  });

  // Siswa View State
  const [siswaLog, setSiswaLog] = useState<any>(null);

  // Modals
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchLogKehadiran = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAdminOrDev) {
        // Fetch admin log data from /log or /attendance
        const res = await api
          .get('/log', { params: { page: pagination.page, limit: pagination.limit } })
          .catch(() => api.get('/attendance', { params: { page: pagination.page, limit: pagination.limit } }));

        if (res?.data?.success) {
          const rawData = res.data.data;
          if (Array.isArray(rawData)) {
            setLogGroups(rawData);
          }
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } else {
        // Fetch student personal attendance timeline from /siswa/:nis or /profile/me
        const studentIdentifier = user?.nis || user?.id || '';
        const res = await api
          .get(`/siswa/${studentIdentifier}`)
          .catch(() => api.get('/profile/me'));

        if (res?.data) {
          setSiswaLog(res.data.data || res.data);
        }
      }
    } catch (e: any) {
      console.error('Error fetching log kehadiran:', e);
      toast.error(e?.response?.data?.message || 'Gagal memuat log kehadiran');
    } finally {
      setIsLoading(false);
    }
  }, [isAdminOrDev, pagination.page, pagination.limit, user]);

  useEffect(() => {
    fetchLogKehadiran();
  }, [fetchLogKehadiran]);

  // Socket.io Realtime updates for Admin/Dev
  useEffect(() => {
    if (!isAdminOrDev) return;

    socket.on('connect', () => setIsLive(true));
    socket.on('disconnect', () => setIsLive(false));
    socket.on('attendance:new', (data: any) => {
      setLogGroups((prev) => {
        const todayKey = new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const list = [...prev];
        const todayGroup = list.find((g) => g.tanggal === todayKey);
        if (todayGroup) {
          todayGroup.data = [data, ...todayGroup.data];
        } else {
          list.unshift({ tanggal: todayKey, data: [data] });
        }
        return list;
      });
      toast.info(`Tap Presensi Baru: ${data.Nama || 'Siswa'}`);
    });

    if (socket.connected) setIsLive(true);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('attendance:new');
    };
  }, [isAdminOrDev]);

  const formatTimeOnly = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusInfo = (statusStr?: string) => {
    const statusMap: Record<string, { badge: string; label: string }> = {
      HADIR: { badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400', label: 'Hadir' },
      TERLAMBAT: { badge: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400', label: 'Lambat' },
      PULANG: { badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400', label: 'Pulang' },
      SCAN: { badge: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400', label: 'Scan' },
      IZIN: { badge: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400', label: 'Izin' },
      SAKIT: { badge: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400', label: 'Sakit' },
      ALPHA: { badge: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400', label: 'Alpha' },
    };
    return statusMap[statusStr || ''] || statusMap.ALPHA;
  };

  if (isLoading) {
    return <AttendanceLogPageSkeleton studentView={!isAdminOrDev} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* ══════════════════════════════════════════════════
           ADMIN & GURU VIEW (REKAPITULASI REALTIME)
      ══════════════════════════════════════════════════ */}
      {isAdminOrDev ? (
        <>
          {/* Header Bar matching Nuxt */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                Log Presensi
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stream
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
                Pemantauan rekapitulasi kehadiran realtime mesin presensi Hikvision &amp; gerbang sekolah
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl font-bold text-xs gap-1.5"
                onClick={() => {
                  window.open(`${API_BASE}/api/log/kehadiran/export?type=xlsx`, '_blank');
                }}
              >
                <Icon icon="mingcute:download-2-fill" className="text-base" />
                Export Data
              </Button>

              <Badge
                className={
                  isLive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black text-xs px-3 py-1 gap-2'
                    : 'bg-muted text-muted-foreground border-border font-black text-xs px-3 py-1 gap-2'
                }
              >
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                {isLive ? 'STREAMING REALTIME LIVE' : 'TERHUBUNG SINKRON'}
              </Badge>
            </div>
          </div>

          {/* Date Groups Feed */}
          {logGroups.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-16 text-center text-xs font-bold text-muted-foreground/40 italic">
              Belum ada data log kehadiran tercatat hari ini
            </div>
          ) : (
            <div className="space-y-6">
              {logGroups.map((group, idx) => (
                <div key={idx} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-muted/20 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-black text-primary uppercase tracking-wider">
                      📅 {group.tanggal} ({group.data?.length || 0} Tap Presensi)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                    {group.data?.map((d: any, i: number) => {
                      const photo = getImageUrl(d.Image);

                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedAttendance(d)}
                          className="bg-card border border-border hover:border-primary/40 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4 items-center group cursor-pointer"
                        >
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 shadow-inner">
                            <img
                              src={photo || 'https://api.tierkun.my.id/file/picture/0000.png'}
                              alt="avatar"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">
                              {d.Nama}
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 truncate">
                              {d.Kelas}
                            </p>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Masuk
                                </span>
                                <span className="text-xs font-mono font-bold text-foreground">
                                  {d.timestamp ? formatTimeOnly(d.timestamp) : '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  Pulang
                                </span>
                                <span className="text-xs font-mono font-bold text-foreground">
                                  {d.lastOutTime ? formatTimeOnly(d.lastOutTime) : 'Belum pulang'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <PaginationControls
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
            totalPages={Math.ceil(pagination.total / pagination.limit) || 1}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
            isLoading={isLoading}
          />
        </>
      ) : (
        /* ══════════════════════════════════════════════════
             SISWA VIEW (TIMELINE RIWAYAT KEHADIRAN)
        ══════════════════════════════════════════════════ */
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Riwayat Kehadiran
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
              Rekapitulasi jam masuk dan pulang harian Anda
            </p>
          </div>

          {!siswaLog?.absen || siswaLog.absen.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
              <Icon icon="mingcute:calendar-line" className="text-5xl opacity-40" />
              <p className="font-bold text-base">Belum ada riwayat kehadiran tercatat.</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary/50 before:to-transparent before:rounded-full">
              {siswaLog.absen.map((l: any, i: number) => (
                <div key={l.tanggal} className="relative group">
                  {/* Timeline Marker */}
                  <div className="absolute -left-6 sm:-left-8 top-5 w-7 h-7 rounded-full border-4 border-card bg-primary text-primary-foreground shadow-md flex items-center justify-center z-10">
                    <Icon icon="mingcute:calendar-month-fill" className="text-xs" />
                  </div>

                  {/* Timeline Main Card */}
                  <div className="bg-card hover:bg-card/90 border border-border rounded-3xl p-5 sm:p-6 shadow-sm transition-all duration-300 relative overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b border-border pb-4 gap-2">
                      <time className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                        <Icon icon="mingcute:time-line" className="text-primary" />
                        {l.tanggal}
                      </time>
                      <Badge variant="outline" className="w-fit text-[10px] font-bold">
                        Hari ke-{siswaLog.absen.length - i}
                      </Badge>
                    </div>

                    {/* Masuk & Pulang Block Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Masuk (Check-In) Block */}
                      <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/10 overflow-hidden flex flex-col">
                        <div className="bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-500/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon icon="mingcute:arrow-right-circle-fill" className="text-emerald-500 text-base" />
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                              Masuk
                            </span>
                          </div>
                          {l.enter?.time && l.enter.time.length > 0 && (
                            <Badge
                              className={
                                l.indexTelat === false
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-black'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[9px] font-black'
                              }
                            >
                              {l.indexTelat === false ? 'TEPAT WAKTU' : 'TERLAMBAT'}
                            </Badge>
                          )}
                        </div>

                        <div className="divide-y divide-emerald-500/5">
                          {!l.enter?.time || l.enter.time.length === 0 ? (
                            <div className="p-5 text-xs text-muted-foreground font-medium italic text-center">
                              Tidak ada data
                            </div>
                          ) : (
                            l.enter.time.map((t: string, idx: number) => {
                              const img = l.enter.image && l.enter.image[idx] ? getImageUrl(l.enter.image[idx]) : '';
                              const gate = l.enter.gate && l.enter.gate[idx] ? l.enter.gate[idx] : null;

                              return (
                                <div key={idx} className="p-4 flex items-center gap-4">
                                  <div
                                    className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => img && setActivePreviewImage(img)}
                                  >
                                    <img
                                      src={img || 'https://api.tierkun.my.id/file/picture/0000.png'}
                                      alt="Masuk"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-lg font-mono font-black text-foreground">{t}</span>
                                    {gate && (
                                      <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                        <Icon icon="mingcute:location-fill" className="text-emerald-500 text-xs shrink-0" />
                                        <span className="truncate">{gate}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Pulang (Check-Out) Block */}
                      <div className="bg-rose-500/5 rounded-2xl border border-rose-500/10 overflow-hidden flex flex-col">
                        <div className="bg-rose-500/10 px-4 py-2.5 border-b border-rose-500/10 flex items-center gap-2">
                          <Icon icon="mingcute:arrow-left-circle-fill" className="text-rose-500 text-base" />
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                            Pulang
                          </span>
                        </div>

                        <div className="divide-y divide-rose-500/5 flex-1 flex flex-col justify-center">
                          {!l.exit?.time || l.exit.time.length === 0 ? (
                            <div className="p-5 flex flex-col items-center justify-center gap-1 text-center text-muted-foreground">
                              <Icon icon="mingcute:time-fill" className="text-xl text-rose-500 animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-wider">Belum Pulang</span>
                            </div>
                          ) : (
                            l.exit.time.map((t: string, idx: number) => {
                              const img = l.exit.image && l.exit.image[idx] ? getImageUrl(l.exit.image[idx]) : '';
                              const gate = l.exit.gate && l.exit.gate[idx] ? l.exit.gate[idx] : null;

                              return (
                                <div key={idx} className="p-4 flex items-center gap-4">
                                  <div
                                    className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => img && setActivePreviewImage(img)}
                                  >
                                    <img
                                      src={img || 'https://api.tierkun.my.id/file/picture/0000.png'}
                                      alt="Pulang"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-lg font-mono font-black text-foreground">{t}</span>
                                    {gate && (
                                      <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                        <Icon icon="mingcute:location-fill" className="text-rose-500 text-xs shrink-0" />
                                        <span className="truncate">{gate}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           DETAIL MODAL (FOR ADMIN/GURU VIEW)
      ══════════════════════════════════════════════════ */}
      {selectedAttendance && (
        <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card flex flex-row items-center gap-4 space-y-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-muted border border-border shrink-0">
                <img
                  src={getImageUrl(selectedAttendance.Image) || 'https://api.tierkun.my.id/file/picture/0000.png'}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">{selectedAttendance.Nama}</DialogTitle>
                <p className="text-xs text-muted-foreground font-bold">{selectedAttendance.Kelas}</p>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                    <Icon icon="mingcute:time-fill" className="text-sm" /> Waktu Masuk
                  </span>
                  <span className="text-xs font-mono font-black text-foreground">
                    {selectedAttendance.timestamp ? formatTimeOnly(selectedAttendance.timestamp) : '-'}
                  </span>
                </div>
                {selectedAttendance.lastOutTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                      <Icon icon="mingcute:time-fill" className="text-sm" /> Waktu Pulang
                    </span>
                    <span className="text-xs font-mono font-black text-foreground">
                      {formatTimeOnly(selectedAttendance.lastOutTime)}
                    </span>
                  </div>
                )}
              </div>

              {selectedAttendance.logs && selectedAttendance.logs.length > 0 && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Detail Scan Wajah &amp; Foto
                  </h4>
                  <div className="space-y-2">
                    {selectedAttendance.logs.map((log: any) => {
                      const st = getStatusInfo(log.status);
                      const img = getImageUrl(log.Image);

                      return (
                        <div
                          key={log.id}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border"
                        >
                          <div
                            className="w-10 h-10 rounded-xl overflow-hidden bg-muted border border-border shrink-0 cursor-pointer"
                            onClick={() => img && setActivePreviewImage(img)}
                          >
                            <img src={img || 'https://api.tierkun.my.id/file/picture/0000.png'} alt="scan" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-foreground">
                                {formatTimeOnly(log.timestamp)}
                              </span>
                              <Badge className={`px-2 py-0.5 text-[8px] border font-black ${st.badge}`}>
                                {st.label}
                              </Badge>
                            </div>
                            {log.Gate && (
                              <p className="text-[9px] font-bold text-muted-foreground truncate mt-0.5">
                                {log.Gate}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ══════════════════════════════════════════════════
           IMAGE PREVIEW LIGHTBOX MODAL
      ══════════════════════════════════════════════════ */}
      {activePreviewImage && (
        <Dialog open={!!activePreviewImage} onOpenChange={() => setActivePreviewImage(null)}>
          <DialogContent className="sm:max-w-md p-4 text-center bg-card border-border rounded-3xl">
            <img src={activePreviewImage} alt="Capture" className="w-full max-h-[70vh] object-contain rounded-2xl" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
