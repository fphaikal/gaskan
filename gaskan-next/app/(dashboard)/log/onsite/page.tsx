'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function LogOnsitePage() {
  const [logs, setLogs] = useState<any[]>([
    { id: 1, name: 'Ahmad Dahlan', nis: '25101001', class: 'X AK 1', device: 'Gerbang Utama SMTI', time: '07:05:12', method: 'Wajah (Hikvision)' },
    { id: 2, name: 'Siti Sarah', nis: '25101002', class: 'X AK 1', device: 'Gerbang Utama SMTI', time: '07:12:45', method: 'Wajah (Hikvision)' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/log/onsite').then((res) => {
      if (res?.data?.data) setLogs(res.data.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Log Presensi On Site / Mesin
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
          Riwayat deteksi verifikasi presensi siswa langsung dari mesin absensi Hikvision
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/20 border-b border-border flex justify-between items-center">
          <span className="text-xs font-black text-primary uppercase tracking-wider">
            Deteksi On Site Hari Ini ({logs.length} Data)
          </span>
          <Button variant="outline" size="sm" className="rounded-2xl font-bold text-xs gap-1">
            <Icon icon="mingcute:refresh-line" /> Refresh
          </Button>
        </div>

        <div className="divide-y divide-border">
          {logs.map((item) => (
            <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Icon icon="mingcute:location-2-fill" className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{item.name}</p>
                  <p className="text-muted-foreground font-mono">NIS: {item.nis} • {item.class}</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-black">
                  {item.time}
                </Badge>
                <p className="text-[10px] text-muted-foreground font-semibold">{item.device}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
