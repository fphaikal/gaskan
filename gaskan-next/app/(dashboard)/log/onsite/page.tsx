'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { OnsitePageSkeleton } from '@/components/shared/PresencePageSkeletons';
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

export default function LogOnsitePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchOnsiteLog = useCallback(async () => {
    try {
      const res = await api.get('/onsite').catch(() => api.get('/log/onsite'));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) {
        setLogs(d);
      }
    } catch (e) {
      console.error('Failed to fetch onsite log:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnsiteLog();
    const interval = setInterval(fetchOnsiteLog, 5000);
    return () => clearInterval(interval);
  }, [fetchOnsiteLog]);

  const formatTimeOnly = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return <OnsitePageSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Area matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Log On-Site
            </h1>
            {/* Live Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            Pemantauan aktivitas masuk area dengan auto-refresh 5 detik secara aman
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-card px-4 py-2.5 rounded-2xl border border-border shadow-xs">
          <Icon icon="mingcute:group-fill" className="text-primary text-base" />
          <span>{logs.length} Total Tercatat</span>
        </div>
      </div>

      {/* Timeline Container matching Nuxt 1-to-1 */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
              <Icon icon="mingcute:radar-line" className="text-3xl animate-spin text-primary opacity-60" />
            </div>
            <p className="font-bold text-base text-foreground">Menunggu data masuk...</p>
            <p className="text-xs text-muted-foreground">Sistem siap menangkap log berikutnya.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border ml-3 sm:ml-4 space-y-6">
            {logs.map((l, index) => {
              const photo = getImageUrl(l.Image || l.photoUrl || l.user?.photoUrl);
              const timeStr = l.time_enter || l.timestamp || l.createdAt;

              return (
                <div key={l.id || l.NIS || index} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-4 flex h-4 w-4 items-center justify-center rounded-full bg-card border-2 border-primary ring-4 ring-card transition-transform group-hover:scale-125" />

                  {/* Card */}
                  <div className="bg-card hover:bg-muted/30 border border-border rounded-2xl p-4 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Time Badge */}
                    <div className="shrink-0 flex items-center justify-center bg-muted/60 text-foreground rounded-xl px-3 py-2 border border-border w-fit group-hover:bg-primary/10 group-hover:text-primary transition-colors font-mono">
                      <Icon icon="mingcute:time-fill" className="mr-2 text-base" />
                      <time className="text-xs font-bold tracking-tight">
                        {formatTimeOnly(timeStr)}
                      </time>
                      <span className="ml-1.5 text-[10px] font-bold uppercase opacity-60">WIB</span>
                    </div>

                    {/* Photo Avatar */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 border border-border shrink-0 shadow-inner relative flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt="avatar"
                          className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300"
                          onClick={() => setActivePreviewImage(photo)}
                        />
                      ) : (
                        <Icon icon="mingcute:user-4-fill" className="text-2xl text-primary/40" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {l.Nama || l.name || l.studentName || 'Tanpa Nama'}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                        {(l.NIS || l.nis) && (
                          <span className="flex items-center gap-1 font-mono">
                            <Icon icon="mingcute:idcard-fill" className="text-sm" />
                            {l.NIS || l.nis}
                          </span>
                        )}
                        {(l.Kelas || l.className) && (
                          <span className="flex items-center gap-1">
                            <Icon icon="mingcute:book-2-fill" className="text-sm text-primary" />
                            {l.Kelas || l.className}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Onsite Status Tag */}
                    <div className="shrink-0">
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 gap-1.5">
                        <Icon icon="mingcute:check-circle-fill" className="text-sm" />
                        On-Site
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Lightbox Modal */}
      {activePreviewImage && (
        <Dialog open={!!activePreviewImage} onOpenChange={() => setActivePreviewImage(null)}>
          <DialogContent className="sm:max-w-md p-4 text-center bg-card border-border rounded-3xl">
            <img src={activePreviewImage} alt="Capture Onsite" className="w-full max-h-[75vh] object-contain rounded-2xl" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
