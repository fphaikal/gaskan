'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function LogLoginPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchLoginLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) params.set('search', search.trim());
      if (dateFilter) params.set('date', dateFilter);

      const res = await api.get(`/log/login?${params.toString()}`).catch(() => api.get('/log'));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) {
        setLogs(d);
        setTotal(res?.data?.pagination?.total || d.length);
      }
    } catch (err) {
      console.error('Failed to fetch login logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, dateFilter]);

  useEffect(() => {
    fetchLoginLogs();
  }, [fetchLoginLogs]);

  const openDetail = async (log: any) => {
    setSelectedLog(log);
    setLocationInfo(null);

    const ip = log.details?.ip || log.ip || log.ip_address;
    if (ip && ip !== '::1' && ip !== '127.0.0.1') {
      setLocationLoading(true);
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();
        if (data.status === 'success') {
          setLocationInfo(`${data.city}, ${data.regionName}, ${data.country}`);
        } else {
          setLocationInfo('Lokasi tidak ditemukan');
        }
      } catch (e) {
        setLocationInfo('Gagal memuat lokasi');
      } finally {
        setLocationLoading(false);
      }
    } else if (ip === '::1' || ip === '127.0.0.1') {
      setLocationInfo('Localhost (Internal Server)');
    }
  };

  const formatDateTime = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header Card matching Nuxt 1-to-1 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            Log Sistem (Audit Login & Akses)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Pemantauan riwayat aktivitas sistem, scan wajah perangkat, dan otentikasi login pengguna
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Icon icon="mingcute:search-line" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base" />
            <Input
              type="text"
              placeholder="Cari NIS / Username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-2xl bg-muted/30 font-bold border-border text-xs w-full"
            />
          </div>

          {/* Date Filter */}
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 rounded-2xl bg-muted/30 font-bold border-border text-xs w-full sm:w-40"
          />

          {/* Limit Selector */}
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-2xl border border-border">
            {[20, 50, 100].map((l) => (
              <Button
                key={l}
                size="sm"
                variant={limit === l ? 'default' : 'ghost'}
                onClick={() => {
                  setLimit(l);
                  setPage(1);
                }}
                className="h-7 px-3 rounded-xl text-xs font-bold"
              >
                {l}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table matching Nuxt 1-to-1 */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
            <p className="text-xs font-bold">Memuat log aktivitas login...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card p-16 text-center text-muted-foreground/40 space-y-3">
            <Icon icon="mingcute:history-line" className="text-5xl mx-auto opacity-50" />
            <p className="font-bold text-base text-foreground">Tidak ada log aktivitas login ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border">
                  <th className="py-4 pl-6 w-12 text-left">#</th>
                  <th className="py-4 text-left">Pengguna</th>
                  <th className="py-4 text-left">Peran / Role</th>
                  <th className="py-4 text-left">IP Address</th>
                  <th className="py-4 text-left">Aktivitas / Modul</th>
                  <th className="py-4 text-left">Waktu</th>
                  <th className="py-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    onClick={() => openDetail(item)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="pl-6 text-[10px] font-black text-muted-foreground/40">
                      {(page - 1) * limit + idx + 1}
                    </td>

                    <td className="py-3 font-bold text-foreground">
                      {item.user?.name || item.username || item.identifier || item.details?.identifier || 'System User'}
                    </td>

                    <td className="py-3">
                      <Badge variant="outline" className="text-[9px] font-black uppercase">
                        {item.user?.role || item.role || 'USER'}
                      </Badge>
                    </td>

                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {item.ip || item.ip_address || item.details?.ip || '127.0.0.1'}
                    </td>

                    <td className="py-3 text-foreground font-semibold">
                      {item.action || item.aktivitas || item.message || 'Aktivitas Login'}
                    </td>

                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt || item.created_at || item.timestamp)}
                    </td>

                    <td className="pr-6 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:text-primary">
                        <Icon icon="mingcute:eye-line" className="text-base" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL matching Nuxt 1-to-1 */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border-border space-y-4">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-lg font-black text-foreground">
                Detail Log Login: {selectedLog.user?.name || selectedLog.username || 'User'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center">
                <span className="text-muted-foreground font-bold">Role</span>
                <Badge className="bg-primary/15 text-primary border-primary/30 font-black text-[10px] uppercase">
                  {selectedLog.user?.role || selectedLog.role || 'USER'}
                </Badge>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center font-mono">
                <span className="text-muted-foreground font-bold">IP Address</span>
                <span className="text-foreground font-bold">{selectedLog.ip || selectedLog.ip_address || selectedLog.details?.ip || '127.0.0.1'}</span>
              </div>

              {locationInfo && (
                <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Lokasi Geografis</span>
                  <span className="text-foreground font-bold">{locationInfo}</span>
                </div>
              )}

              <div className="p-3 bg-muted/40 rounded-2xl border border-border">
                <span className="text-[10px] font-black uppercase text-muted-foreground/60">Waktu Log</span>
                <p className="text-xs font-mono font-bold text-foreground mt-0.5">
                  {formatDateTime(selectedLog.createdAt || selectedLog.created_at || selectedLog.timestamp)}
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full rounded-2xl font-bold text-xs" onClick={() => setSelectedLog(null)}>
              Tutup
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
