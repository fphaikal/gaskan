'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminTeamPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get('/team').then((res) => {
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data)) {
        setTeams(data);
      }
    }).catch(() => {
      console.log('No team data');
    }).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat data tim...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Manajemen Tim & Workspace
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Kelola tim kerja pengembang, tim kesiswaan, dan operator absensi
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground rounded-2xl gap-2 font-black text-xs shadow-lg shadow-primary/20">
          <Icon icon="mingcute:add-circle-fill" className="text-lg" /> Buat Tim Baru
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Icon icon="mingcute:group-line" className="text-5xl text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">Belum ada tim yang terdaftar di database</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => (
            <div key={t.id} className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-black uppercase">
                    {t.status || 'AKTIF'}
                  </Badge>
                  <Icon icon="mingcute:group-fill" className="text-xl text-primary" />
                </div>
                <h3 className="text-lg font-black text-foreground">{t.name || t.nama}</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Ketua: {t.leader || t.ketua || '-'}</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">{t.membersCount || t.members?.length || 0} Anggota</span>
                <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-primary">
                  Detail Tim
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
