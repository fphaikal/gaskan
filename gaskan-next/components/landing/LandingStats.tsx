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
    <section id="statistik" className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16 space-y-3">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon icon={stat.icon} className="text-xl text-primary" />
              </div>
              <p className="text-4xl md:text-5xl font-extrabold text-primary tabular-nums">
                {stat.value}
              </p>
              <p className="mt-2 text-sm opacity-70 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
