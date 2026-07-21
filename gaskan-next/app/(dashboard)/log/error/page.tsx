'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';

export default function LogErrorPage() {
  const errors = [
    { id: 1, message: 'Hikvision Socket Connection Timeout (192.168.1.202)', time: '10:14:02', level: 'WARN' },
    { id: 2, message: 'Database Connection Pool Exhaustion', time: '08:00:15', level: 'INFO' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Log Error & Warning Sistem
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
          Audit jejak kesalahan aplikasi dan kendala konektivitas mesin
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border font-mono text-xs">
          {errors.map((e) => (
            <div key={e.id} className="p-4 sm:px-6 flex items-center justify-between font-bold">
              <div className="flex items-center gap-3">
                <Badge className={e.level === 'WARN' ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 'bg-sky-500/15 text-sky-500 border-sky-500/30'}>
                  {e.level}
                </Badge>
                <span className="text-foreground">{e.message}</span>
              </div>
              <span className="text-muted-foreground">{e.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
