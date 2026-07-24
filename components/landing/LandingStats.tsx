'use client';

import React from 'react';
import { Icon } from '@/components/ui/icon';

export function LandingStats() {
  const stats = [
    { value: '500+', label: 'Siswa Terdaftar', icon: 'mingcute:group-fill' },
    { value: '99.9%', label: 'Uptime Sistem', icon: 'mingcute:lightning-fill' },
    { value: '3', label: 'Role Pengguna', icon: 'mingcute:shield-fill' },
    { value: '1', label: 'Sekolah Terhubung', icon: 'mingcute:building-4-fill' },
  ];

  return (
    <section id="statistik" className="scroll-mt-20 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10 space-y-3 text-center sm:mb-16">
          <div className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
            Angka Berbicara
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            GASKAN dalam <span className="text-primary">Angka</span>
          </h2>
          <p className="opacity-70 max-w-xl mx-auto">
            Data yang mencerminkan kepercayaan pengguna GASKAN setiap harinya.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 rounded-2xl border border-border bg-card p-4 text-center transition-colors duration-300 hover:border-primary/30 sm:p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon icon={stat.icon} className="text-xl text-primary" />
              </div>
              <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tabular-nums">
                {stat.value}
              </p>
              <p className="mt-2 break-words text-xs opacity-70 font-medium sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
