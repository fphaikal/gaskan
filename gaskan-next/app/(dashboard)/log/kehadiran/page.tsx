'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import socket from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [logGroups, setLogGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchLogKehadiran = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/log/kehadiran').catch(() => api.get('/attendance'));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) {
        if (d.length > 0 && d[0].tanggal) {
          setLogGroups(d);
        } else {
          // Group flat attendance list by date label
          const groups: Record<string, any[]> = {};
          d.forEach((item: any) => {
            const dateObj = new Date(item.timestamp || item.date || item.createdAt || new Date());
            const dateLabel = dateObj.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            if (!groups[dateLabel]) groups[dateLabel] = [];
            groups[dateLabel].push({
              Nama: item.user?.name || item.studentName || item.Nama || 'Siswa',
              Kelas: item.user?.class?.className || item.className || item.Kelas || '-',
              action: item.status === 'TERLAMBAT' || item.status === 'HADIR' ? 'enter' : 'exit',
              timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
              Image: item.notes || item.photoUrl || item.user?.photoUrl,
              Gate: item.device ? `${item.device.name} (${item.device.location})` : 'Gerbang Utama',
            });
          });
          const groupedList = Object.keys(groups).map((tanggal) => ({
            tanggal,
            data: groups[tanggal],
          }));
          setLogGroups(groupedList);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogKehadiran();

    // Socket.io realtime updates
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
  }, [fetchLogKehadiran]);

  const formatTimeOnly = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Log Kehadiran Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Streaming realtime tap mesin presensi Hikvision & gerbang sekolah
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            className={
              isLive
                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-black text-xs px-3 py-1 gap-2'
                : 'bg-rose-500/15 text-rose-500 border-rose-500/30 font-black text-xs px-3 py-1 gap-2'
            }
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {isLive ? 'STREAMING REALTIME LIVE' : 'TERHUBUNG SINKRON'}
          </Badge>
        </div>
      </div>

      {/* Date Groups Feed */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
          <p className="text-xs font-bold">Memuat stream log kehadiran...</p>
        </div>
      ) : logGroups.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-20 text-center text-xs font-bold text-muted-foreground/40 italic">
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

              <div className="divide-y divide-border">
                {group.data?.map((item: any, i: number) => {
                  const photo = getImageUrl(item.Image);
                  const isEnter = item.action === 'enter';

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedAttendance(item)}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Photo thumbnail */}
                        <div
                          className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/10 border border-border shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (photo) setActivePreviewImage(photo);
                          }}
                        >
                          {photo ? (
                            <img src={photo} alt={item.Nama} className="w-full h-full object-cover" />
                          ) : (
                            <Icon icon="mingcute:user-4-fill" className="text-xl text-primary/40" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-black text-foreground text-sm truncate">{item.Nama}</h4>
                          <p className="text-xs font-bold text-muted-foreground">
                            {item.Kelas} · <span className="font-mono text-xs">{item.Gate || 'Gerbang Utama'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <Badge
                          className={
                            isEnter
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black'
                              : 'bg-rose-500/15 text-rose-500 border-rose-500/30 text-[10px] font-black'
                          }
                        >
                          {isEnter ? 'TAP MASUK' : 'TAP PULANG'}
                        </Badge>

                        <span className="font-mono font-black text-xs text-foreground">
                          {formatTimeOnly(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
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
