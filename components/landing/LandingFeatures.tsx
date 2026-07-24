'use client';

import React from 'react';
import { Icon } from '@/components/ui/icon';

export function LandingFeatures() {
  const features = [
    {
      icon: 'mingcute:time-fill',
      title: 'Absensi Real-time',
      description: 'Catat kehadiran siswa secara langsung tanpa penundaan dan sinkronisasi instan ke sistem.',
    },
    {
      icon: 'mingcute:chart-bar-2-fill',
      title: 'Rekap Otomatis',
      description: 'Laporan kehadiran tersusun rapi secara otomatis dan dapat diakses kapan saja oleh admin.',
    },
    {
      icon: 'mingcute:eye-2-fill',
      title: 'Monitor Kehadiran',
      description: 'Pantau status kehadiran seluruh siswa dalam satu dashboard yang informatif dan mudah dibaca.',
    },
    {
      icon: 'mingcute:lock-fill',
      title: 'Akses Multi-Role',
      description: 'Sistem hak akses terpisah untuk siswa, admin sekolah, dan developer dengan keamanan berlapis.',
    },
  ];

  return (
    <section id="fitur" className="scroll-mt-20 bg-muted/40 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="mb-10 space-y-3 text-center sm:mb-16">
          <div className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full border border-primary/20 mb-2">
            Fitur Unggulan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Kenapa <span className="text-primary">GASKAN</span>?
          </h2>
          <p className="opacity-70 max-w-xl mx-auto leading-relaxed">
            Dirancang khusus untuk memudahkan pengelolaan kehadiran di lingkungan sekolah, dengan teknologi yang andal dan mudah digunakan.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl border border-border p-5 sm:p-6 flex flex-col gap-4 hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-default motion-safe:hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <Icon icon={feature.icon} className="text-2xl text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                <p className="text-sm opacity-70 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
