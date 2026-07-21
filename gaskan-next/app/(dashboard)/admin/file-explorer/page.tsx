'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export default function FileExplorerPage() {
  const files = [
    { name: 'uploads/avatars', type: 'FOLDER', size: '12.4 MB' },
    { name: 'uploads/excel_imports', type: 'FOLDER', size: '4.1 MB' },
    { name: 'logs/system_audit.log', type: 'FILE', size: '512 KB' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          File Explorer Server
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
          Penjelajah direktori penyimpanan file foto, lampiran surat izin, dan log server
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {files.map((f, i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-3">
                <Icon
                  icon={f.type === 'FOLDER' ? 'mingcute:folder-open-fill' : 'mingcute:file-line'}
                  className="text-xl text-primary"
                />
                <span className="font-mono text-foreground">{f.name}</span>
              </div>
              <span className="text-muted-foreground font-mono">{f.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
