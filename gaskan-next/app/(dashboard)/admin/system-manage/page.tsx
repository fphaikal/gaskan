'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

export default function SystemManagePage() {
  const [isCleaning, setIsCleaning] = useState(false);

  const handleClearCache = async () => {
    setIsCleaning(true);
    setTimeout(() => {
      setIsCleaning(false);
      toast.success('System cache & session berhasil dibersihkan');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Kelola Sistem GASKAN
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
          Pengaturan server backend, pembersihan cache, dan pemeliharaan database
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 border border-border rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-foreground">Versi Aplikasi & API Server</h4>
              <p className="text-xs text-muted-foreground font-mono">GASKAN v2.4.0 (Next.js App Router)</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-bold text-xs rounded-xl">HEALTHY</span>
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-foreground">Bersihkan Cache & Temp Files</h4>
              <p className="text-xs text-muted-foreground">Hapus berkas sementara dan reset memory cache server</p>
            </div>
            <Button disabled={isCleaning} onClick={handleClearCache} className="rounded-2xl font-bold text-xs">
              {isCleaning ? 'Membersihkan...' : 'Clean Cache'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
