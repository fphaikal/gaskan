'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { ErrorLogPageSkeleton } from '@/components/shared/SystemPageSkeletons';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function LogErrorPage() {
  const [errorGroups, setErrorGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [total, setTotal] = useState(0);

  // Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchErrorLog = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        reverse: 'true',
        page: String(page),
        limit: String(limit),
      });
      const res = await api.get(`/error?${params.toString()}`).catch(() => api.get(`/log/error?${params.toString()}`));
      const d = res?.data?.data || res?.data || [];
      if (res?.data?.pagination) {
        setTotal(res.data.pagination.total || 0);
      }

      if (Array.isArray(d)) {
        if (d.length > 0 && d[0].tanggal) {
          setErrorGroups(d);
        } else {
          // Group flat errors by date label
          const groups: Record<string, any[]> = {};
          d.forEach((item: any) => {
            const dateObj = new Date(item.timestamp || item.createdAt || new Date());
            const dateLabel = dateObj.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push({
              msg: item.message || item.msg || item.action || 'Sync: Verifikasi wajah gagal / Stranger (Minor: 76)',
              code: item.code || item.level || '500',
              Kelas: item.Kelas || item.module || 'Device',
              timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
              image: getImageUrl(item.image || item.notes || 'https://api.tierkun.my.id/file/picture/0000.png'),
              gate: item.gate || item.location || item.deviceName || 'Samping bengkel 1',
              namafile: item.namafile || item.fileName || undefined,
            });
          });
          const groupedList = Object.keys(groups).map((tanggal) => ({
            tanggal,
            data: groups[tanggal],
          }));
          setErrorGroups(groupedList);
        }
      }
    } catch (e) {
      console.error('Failed to fetch error log:', e);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchErrorLog();
    const interval = setInterval(fetchErrorLog, 5000);
    return () => clearInterval(interval);
  }, [fetchErrorLog]);

  const formatTimeStr = (ts?: string) => {
    if (!ts) return '15.33.05';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      return `${h}.${m}.${s}`;
    } catch {
      return ts;
    }
  };

  if (isLoading) {
    return <ErrorLogPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Log Sistem (Error)
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-xs font-black text-rose-500 uppercase tracking-wider">Live</span>
            </div>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
            Pemantauan aktivitas anomali dan error sistem dengan auto-refresh 5 detik secara aman
          </p>
        </div>
      </div>

      {errorGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-border bg-card px-4 py-14 text-center text-muted-foreground/40 shadow-sm sm:p-16">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
            <Icon icon="mingcute:bug-line" className="text-3xl text-emerald-500" />
          </div>
          <p className="font-bold text-base text-foreground">Sistem berjalan normal. Belum ada error tercatat.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {errorGroups.map((l, idx) => (
            <div key={idx} className="space-y-4">
              {/* Date Header */}
              <div className="sticky top-[64px] z-10 backdrop-blur-md py-3 flex items-center gap-3 border-b border-border bg-background/95">
                <div className="h-6 w-1.5 rounded-full bg-rose-500 shadow-sm" />
                <h2 className="text-xl font-black text-foreground tracking-tight">{l.tanggal}</h2>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {l.data?.map((d: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedLog(d)}
                    className="group relative flex min-w-0 cursor-pointer flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:border-rose-500/40 hover:shadow-lg sm:p-5"
                  >
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
                        <Icon icon="mingcute:warning-fill" className="text-2xl group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-rose-500 transition-colors">
                          {d.msg}
                        </h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1 truncate">
                          {d.Kelas || 'Device'}
                        </p>
                      </div>
                    </div>

                    {/* Captured Scan Photo */}
                    {d.image && (
                      <div className="w-full h-32 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 relative flex items-center justify-center z-10 group/img">
                        <img src={d.image} alt="Captured face" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Icon icon="mingcute:zoom-in-line" className="text-white text-xl" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-3 relative z-10 font-mono text-xs">
                      <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-black uppercase">
                        ERR: {d.code || '500'}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {formatTimeStr(d.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PaginationControls
        currentPage={page}
        itemsPerPage={limit}
        totalItems={total}
        totalPages={Math.ceil(total / limit) || 1}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={isLoading}
      />

      {/* UNIFORM DASHBOARD DIALOG STRUCTURE */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-2xl">
            <DialogHeader className="flex shrink-0 flex-col gap-3 border-b border-border bg-card p-4 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:p-6 sm:pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-black text-foreground">
                <Icon icon="mingcute:warning-fill" className="text-rose-500 text-2xl" />
                <span>Detail Kejadian Error</span>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black text-[10px] uppercase">
                  ERR: {selectedLog.code || '500'}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                  {selectedLog.Kelas || 'Device'}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Section */}
                <div
                  className="group relative flex aspect-video h-auto max-h-56 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40"
                  onClick={() => {
                    if (selectedLog.image) setActivePreviewImage(selectedLog.image);
                  }}
                >
                  {selectedLog.image ? (
                    <>
                      <img
                        src={selectedLog.image}
                        alt="Captured Face"
                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                        <Icon icon="mingcute:zoom-in-line" className="text-2xl" />
                        <span>Zoom Foto</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground/40 space-y-2">
                      <Icon icon="mingcute:bug-line" className="text-4xl mx-auto" />
                      <span className="text-xs font-semibold uppercase tracking-wider block">Foto Tidak Tersedia</span>
                    </div>
                  )}
                </div>

                {/* Details Info */}
                <div className="space-y-3 text-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/40 rounded-2xl border border-border">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest block mb-0.5">
                        Pesan Kejadian
                      </span>
                      <p className="text-sm font-extrabold text-foreground leading-snug">
                        {selectedLog.msg}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl border border-border">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest block mb-0.5">
                        Nama Gerbang
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {selectedLog.gate || 'Samping bengkel 1'}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center font-mono">
                      <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                        Waktu Scan
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {formatTimeStr(selectedLog.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedLog(null)}
                className="w-full rounded-2xl font-bold text-xs"
              >
                Tutup Detail
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX ZOOM MODAL */}
      {activePreviewImage && (
        <Dialog open={!!activePreviewImage} onOpenChange={() => setActivePreviewImage(null)}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] items-center justify-center rounded-3xl border border-white/10 bg-black/90 p-2 text-center sm:max-w-4xl">
            <img
              src={activePreviewImage}
              alt="Zoomed Capture"
              className="max-h-[calc(100dvh-2rem)] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
