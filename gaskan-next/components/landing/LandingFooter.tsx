'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm opacity-70">
        <div className="flex items-center gap-2">
          <Icon icon="mingcute:key-2-fill" className="text-primary opacity-100 text-xl" />
          <span>© {new Date().getFullYear()} GASKAN — SMTI Jogja</span>
        </div>
        <span>
          Dibuat dengan <span className="text-red-500 opacity-100">❤️</span> oleh Tim Developer SMTI Jogja
        </span>
      </div>
    </footer>
  );
}
