'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function LogErrorPage() {
  const [errorGroups, setErrorGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchErrorLog = useCallback(async () => {
    try {
      const res = await api.get('/error?reverse=true').catch(() => api.get('/log/error'));
      const d = res?.data?.data || res?.data || [];
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
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Area matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
          <p className="text-xs font-bold">Memuat log error sistem...</p>
        </div>
      ) : errorGroups.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-muted-foreground/40 space-y-3">
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

              {/* Cards Grid matching Nuxt 1-to-1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {l.data?.map((d: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelectedLog(d)}
                    className="bg-card border border-border hover:border-rose-500/40 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-4 group cursor-pointer relative overflow-hidden"
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

      {/* ═══ DETAILED EVENT MODAL (DETAIL KEJADIAN 1-TO-1 NUXT) ═══ */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
            <div className="flex flex-col md:flex-row">
              {/* Image Section (Left / Top) */}
              <div className="md:w-1/2 bg-muted/40 p-4 border-b md:border-b-0 md:border-r border-border flex items-center justify-center relative group cursor-pointer"
                onClick={() => {
                  if (selectedLog.image) setActivePreviewImage(selectedLog.image);
                }}
              >
                {selectedLog.image ? (
                  <div className="relative w-full overflow-hidden rounded-2xl shadow-md border border-border group/zoom">
                    <img
                      src={selectedLog.image}
                      alt="Captured Face"
                      className="w-full max-h-[40vh] md:max-h-[50vh] object-cover rounded-2xl group-hover/zoom:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/zoom:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                      <Icon icon="mingcute:zoom-in-line" className="text-2xl" />
                      <span>Klik untuk Zoom Foto</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 md:h-full flex flex-col items-center justify-center text-muted-foreground/40 py-12 space-y-2">
                    <Icon icon="mingcute:bug-line" className="text-4xl" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Foto Tidak Tersedia</span>
                  </div>
                )}
              </div>

              {/* Info Details Section (Right / Bottom) matching Nuxt 1-to-1 */}
              <div className="md:w-1/2 p-6 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  {/* Badges row */}
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-rose-500/10 text-rose-500 border-rose-500/20">
                      ERR: {selectedLog.code || '500'}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {selectedLog.Kelas || 'Device'}
                    </span>
                  </div>

                  {/* Pesan Kejadian */}
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1">
                      PESAN KEJADIAN
                    </h4>
                    <p className="text-base font-extrabold text-foreground leading-snug">
                      {selectedLog.msg}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {/* Nama Gerbang */}
                    <div>
                      <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">
                        NAMA GERBANG
                      </h4>
                      <p className="text-xs font-bold text-foreground">
                        {selectedLog.gate || 'Samping bengkel 1'}
                      </p>
                    </div>

                    {/* Waktu Scan */}
                    <div>
                      <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">
                        WAKTU SCAN
                      </h4>
                      <p className="text-xs font-mono font-bold text-foreground">
                        {formatTimeStr(selectedLog.timestamp)}
                      </p>
                    </div>

                    {/* Sumber / File (If present) */}
                    {selectedLog.namafile && (
                      <div>
                        <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">
                          SUMBER / FILE
                        </h4>
                        <p className="text-xs font-mono font-bold text-foreground truncate">
                          {selectedLog.namafile}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tutup Detail Button matching Nuxt 1-to-1 */}
                <Button
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="w-full rounded-2xl border-border hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500 font-bold text-xs h-11"
                >
                  Tutup Detail
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ FULL-SCREEN IMAGE LIGHTBOX ZOOM MODAL ═══ */}
      {activePreviewImage && (
        <Dialog open={!!activePreviewImage} onOpenChange={() => setActivePreviewImage(null)}>
          <DialogContent className="sm:max-w-4xl p-2 bg-black/90 border border-white/10 rounded-3xl text-center flex items-center justify-center">
            <img
              src={activePreviewImage}
              alt="Zoomed Capture"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
