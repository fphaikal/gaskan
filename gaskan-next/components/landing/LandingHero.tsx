'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface AttendanceItem {
  id?: string;
  name: string;
  status: string;
  timestamp?: string;
}

export function LandingHero() {
  const { user } = useAuth();
  const [recentAttendances, setRecentAttendances] = useState<AttendanceItem[]>([
    { name: 'Ahmad Fauzi', status: 'HADIR', timestamp: '2026-07-23T07:07:00.000Z' },
    { name: 'Siti Nurhaliza', status: 'HADIR', timestamp: '2026-07-23T07:02:00.000Z' },
    { name: 'Budi Santoso', status: 'TERLAMBAT', timestamp: '2026-07-23T06:50:00.000Z' },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/attendance/recent');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setRecentAttendances(res.data.data.slice(0, 5));
        }
      } catch (e) {
        // Fallback to default mock list
      }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    if (recentAttendances.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % recentAttendances.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [recentAttendances]);

  const currentItem = recentAttendances[activeIndex] || recentAttendances[0];

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const dateObj = new Date(ts);
    const today = new Date();
    const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (dateObj.toDateString() === today.toDateString()) {
      return timeStr;
    }
    return `${dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · ${timeStr}`;
  };

  const getStatusLabel = (s: string, timestamp?: string) => {
    if (timestamp) {
      const hour = new Date(timestamp).getHours();
      if (hour >= 13) return 'Pulang';
    }
    if (s === 'TERLAMBAT') return 'Terlambat';
    if (s === 'SAKIT') return 'Sakit';
    if (s === 'IZIN') return 'Izin';
    return 'Hadir';
  };

  const getStatusIconColor = (s: string, timestamp?: string) => {
    if (timestamp) {
      const hour = new Date(timestamp).getHours();
      if (hour >= 13) return 'text-blue-500 bg-blue-500/15 border-blue-500/30';
    }
    if (s === 'TERLAMBAT') return 'text-amber-500 bg-amber-500/15 border-amber-500/30';
    if (s === 'SAKIT') return 'text-orange-400 bg-orange-400/15 border-orange-400/30';
    if (s === 'IZIN') return 'text-sky-500 bg-sky-500/15 border-sky-500/30';
    return 'text-green-500 bg-green-500/15 border-green-500/30';
  };

  const getStatusIcon = (s: string, timestamp?: string) => {
    if (timestamp) {
      const hour = new Date(timestamp).getHours();
      if (hour >= 13) return 'mingcute:exit-line';
    }
    if (s === 'TERLAMBAT') return 'mingcute:time-fill';
    if (s === 'SAKIT') return 'mingcute:heart-fill';
    if (s === 'IZIN') return 'mingcute:document-fill';
    return 'mingcute:check-circle-fill';
  };

  return (
    <section className="min-h-screen flex items-center pt-24 pb-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none translate-y-1/4 -translate-x-1/4" />

      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        {/* Left: Text */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/30 rounded-full px-4 py-1.5 text-sm font-semibold">
            <span>✨</span>
            <span>Sistem Absensi Digital SMTI Jogja</span>
          </div>

          <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight">
            Gerbang Akses{' '}
            <span className="text-primary relative inline-block">
              Pintar
              <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-primary/40 rounded-full" />
            </span>{' '}
            dan Kehadiran
          </h1>

          <p className="text-lg opacity-70 max-w-lg leading-relaxed">
            Kelola dan pantau kehadiran siswa secara real-time dengan mudah, cepat, dan akurat.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={user ? '/home' : '/login'}
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold px-7 py-3 shadow-lg hover:shadow-primary/40 transition-all duration-300"
            >
              {user ? 'Ke Dashboard' : 'Mulai Sekarang'}
              <Icon icon="mingcute:arrow-right-line" className="ml-1 text-xl" />
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card font-bold px-7 py-3 opacity-80 hover:opacity-100 transition-all"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>

        </div>

        {/* Right: Minimalist Face Scan Animation Widget */}
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="relative flex items-center justify-center">
            {/* Ambient Pulse Ring */}
            <div
              className="absolute -inset-6 rounded-full border border-primary/20 animate-ping pointer-events-none"
              style={{ animationDuration: '3.5s' }}
            />
            <div
              className="absolute -inset-3 rounded-full border border-primary/30 pointer-events-none"
            />

            {/* Clean Circle Container */}
            <div className="relative w-52 h-52 rounded-full bg-card/80 border-2 border-primary/40 backdrop-blur-md flex items-center justify-center shadow-xl shadow-primary/10 overflow-hidden z-10">
              {/* ScanFace Icon with explicit size prop so it renders large and clear */}
              <Icon icon="ScanFace" size={84} className="text-primary" strokeWidth={1.5} />

              {/* Clean Glowing Scan Line */}
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_2px] shadow-primary z-20 pointer-events-none"
                style={{ animation: 'simpleScan 2.5s ease-in-out infinite' }}
              />

              <style>{`
                @keyframes simpleScan {
                  0%, 100% { top: 15%; opacity: 0.3; }
                  50% { top: 80%; opacity: 1; }
                }
              `}</style>
            </div>
          </div>

          {/* Floating attendance card */}
          {currentItem && (
            <div className="animate-float h-20 flex items-center justify-center">
              <div className="backdrop-blur-md bg-card/80 border border-primary/30 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl w-80 max-w-full transition-all duration-500">
                <div
                  className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${getStatusIconColor(
                    currentItem.status,
                    currentItem.timestamp
                  )}`}
                >
                  <Icon
                    icon={getStatusIcon(currentItem.status, currentItem.timestamp)}
                    className="text-2xl"
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-sm truncate">{currentItem.name}</p>
                  <p className="text-xs opacity-60 mt-0.5">
                    {getStatusLabel(currentItem.status, currentItem.timestamp)} ·{' '}
                    {formatTime(currentItem.timestamp)} WIB
                  </p>
                </div>
                <div className="text-xs text-primary font-semibold opacity-90 shrink-0">
                  ✓ Terverifikasi
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
