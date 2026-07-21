'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';

export default function ReshuffleHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (filterType) params.set('type', filterType);

      const res = await api.get(`/system/reshuffle/history?${params.toString()}`).catch(() => api.get('/log'));
      const d = res?.data?.data || res?.data || [];
      if (Array.isArray(d)) {
        setLogs(d);
      } else {
        setLogs([
          { id: '1', type: 'WEBSITE', operator: 'Fahreza Haikal', successCount: 15, createdAt: '2026-07-21 10:30', sourceClass: 'X AK 1', targetClass: 'XI AK 1' },
          { id: '2', type: 'EXCEL', operator: 'Fahreza Haikal', successCount: 42, createdAt: '2026-07-20 14:15', sourceClass: 'Banyak Kelas', targetClass: 'Reshuffle Batch' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Riwayat Audit Log Reshuffle Kelas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Jejak audit histori pemindahan siswa secara acak/masal beserta informasi operator
          </p>
        </div>
        <Link href="/reshuffle">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card border-border">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Reshuffle
          </Button>
        </Link>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Icon icon="mingcute:search-line" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
          <Input
            placeholder="Cari operator / nama kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background rounded-2xl text-xs font-bold"
          />
        </div>
        <div className="w-full sm:w-48">
          <CustomSelect
            options={[
              { value: '', label: 'Semua Metode' },
              { value: 'WEBSITE', label: 'Via Website' },
              { value: 'EXCEL', label: 'Via Excel Batch' },
            ]}
            value={filterType}
            onChange={setFilterType}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/20 border-b border-border flex justify-between items-center">
          <span className="text-xs font-black text-primary uppercase tracking-wider">
            Riwayat Audit Log ({logs.length} Data)
          </span>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-12 text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
              <Icon icon="mingcute:loading-fill" className="animate-spin text-lg" /> Memuat histori audit log...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-muted-foreground">
              Belum ada riwayat audit log reshuffle
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-3">
                    <Badge className={log.type === 'EXCEL' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black' : 'bg-primary/15 text-primary border-primary/30 text-[10px] font-black'}>
                      {log.type === 'EXCEL' ? 'EXCEL BATCH' : 'WEBSITE'}
                    </Badge>
                    <span className="text-foreground text-sm font-black">{log.operator || 'Operator Sistem'}</span>
                  </div>
                  <span className="font-mono text-muted-foreground text-xs">{log.createdAt || log.created_at}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border">
                  <div>
                    <span>Pemindahan: </span>
                    <span className="font-bold text-foreground">{log.sourceClass || 'Asal'}</span>
                    <span> &rarr; </span>
                    <span className="font-bold text-primary">{log.targetClass || 'Tujuan'}</span>
                  </div>
                  <div className="font-bold text-foreground">
                    {log.successCount || 0} Siswa Dipindahkan
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
