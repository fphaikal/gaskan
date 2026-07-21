'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminTeamPage() {
  const [teams, setTeams] = useState<any[]>([
    { id: 1, name: 'Tim Pengembang IT SMTI', leader: 'Fahreza Haikal', membersCount: 5, status: 'AKTIF' },
    { id: 2, name: 'Tim Kurikulum & Kesiswaan', leader: 'Bambang Sudarsono', membersCount: 8, status: 'AKTIF' },
    { id: 3, name: 'Tim Operator Absensi', leader: 'Rina Wijaya', membersCount: 3, status: 'AKTIF' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/team').then((res) => {
      if (res?.data?.data) setTeams(res.data.data);
    }).catch(() => {});
  }, []);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((t) => (
          <div key={t.id} className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-black uppercase">
                  {t.status}
                </Badge>
                <Icon icon="mingcute:group-fill" className="text-xl text-primary" />
              </div>
              <h3 className="text-lg font-black text-foreground">{t.name}</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-1">Ketua: {t.leader}</p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">{t.membersCount} Anggota</span>
              <Button variant="ghost" size="sm" className="rounded-xl font-bold text-xs text-primary">
                Detail Tim
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
