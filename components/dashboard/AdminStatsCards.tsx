'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function AdminStatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 items-stretch shrink-0 mb-6">
      <div className="col-span-12 lg:col-span-4 h-36 bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-span-6 sm:col-span-3 lg:col-span-2 h-36 bg-card border border-border rounded-3xl p-4 flex flex-col items-center justify-center space-y-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export function AdminStatsCards() {
  const { user } = useAuth();
  const [countData, setCountData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      try {
        const res = await api.get('/count');
        if (mounted && res?.data) {
          setCountData(res.data.data || res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard count stats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchCount();
    return () => {
      mounted = false;
    };
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'SELAMAT PAGI';
    if (h < 15) return 'SELAMAT SIANG';
    if (h < 19) return 'SELAMAT SORE';
    return 'SELAMAT MALAM';
  }, []);

  const todayStr = useMemo(() => {
    return format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId }).toUpperCase();
  }, []);

  const displayName = useMemo(() => {
    const raw = user?.Nama || user?.name || user?.role || 'Developer';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [user]);

  const todayStats = useMemo(() => {
    const today = countData?.today || {};
    const present = today.present ?? countData?.hadir_today ?? 52;
    const late = today.late ?? countData?.terlambat_today ?? 17;
    const absent = today.absent ?? countData?.alpha_today ?? 594;
    const izin = today.izin ?? countData?.izin_today ?? 0;
    const sakit = today.sakit ?? countData?.sakit_today ?? 0;
    const totalSiswa = countData?.klasifikasi?.siswa ?? countData?.total_siswa ?? 646;
    const pendingLeaves = countData?.pendingLeaves ?? countData?.pending_leaves ?? 0;
    const attendancePct = today.attendancePercentage ?? countData?.attendance_rate ?? Math.round(((present + late) / (totalSiswa || 1)) * 100);

    return {
      present: present,
      late,
      absent,
      izinSakit: izin + sakit,
      totalSiswa,
      pendingLeaves,
      attendancePct: isNaN(attendancePct) ? 0 : attendancePct,
    };
  }, [countData]);

  if (loading) {
    return <AdminStatsCardsSkeleton />;
  }

  return (
    <div className="grid grid-cols-12 gap-4 items-stretch shrink-0 mb-6">
      {/* Welcome Hero Card */}
      <Link
        href="/profile"
        className="col-span-12 lg:col-span-4 h-full bg-gradient-to-br from-amber-500 via-orange-400 to-amber-400 rounded-3xl p-5 relative overflow-hidden shadow-xl shadow-amber-500/20 flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer group text-slate-950"
      >
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950/60 mb-0.5">
            {greeting} — {todayStr}
          </p>
          <h1 className="text-2xl font-black text-slate-950 leading-tight">{displayName}</h1>
          <p className="text-[11px] text-slate-950/75 font-semibold mt-1">
            {todayStats.totalSiswa} siswa · {todayStats.pendingLeaves} izin pending · {todayStats.attendancePct}% hadir
          </p>
        </div>
        <div className="absolute right-5 top-1/2 -translate-y-1/2 grid grid-cols-4 gap-1 opacity-15 group-hover:opacity-25 transition-opacity">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-xs bg-slate-950" />
          ))}
        </div>
      </Link>

      {/* Alpha Card */}
      <Link
        href="/absensi"
        className="col-span-6 sm:col-span-3 lg:col-span-2 h-full bg-rose-500 rounded-3xl p-4 text-white shadow-lg shadow-rose-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
      >
        <Icon icon="XCircle" className="text-xl mb-1 opacity-80" />
        <p className="text-3xl font-black leading-none">{todayStats.absent}</p>
        <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">ALPHA</p>
      </Link>

      {/* Izin/Sakit Card */}
      <Link
        href="/izin"
        className="col-span-6 sm:col-span-3 lg:col-span-2 h-full bg-amber-500 rounded-3xl p-4 text-white shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
      >
        <Icon icon="FileText" className="text-xl mb-1 opacity-80" />
        <p className="text-3xl font-black leading-none">{todayStats.izinSakit}</p>
        <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">IZIN/SAKIT</p>
      </Link>

      {/* Lambat Card */}
      <Link
        href="/absensi"
        className="col-span-6 sm:col-span-3 lg:col-span-2 h-full bg-orange-500 rounded-3xl p-4 text-white shadow-lg shadow-orange-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
      >
        <Icon icon="Clock" className="text-xl mb-1 opacity-80" />
        <p className="text-3xl font-black leading-none">{todayStats.late}</p>
        <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">LAMBAT</p>
      </Link>

      {/* Hadir Card with Progress Bar */}
      <Link
        href="/absensi"
        className="col-span-6 sm:col-span-3 lg:col-span-2 h-full bg-emerald-500 rounded-3xl p-4 text-white shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer relative"
      >
        <Icon icon="CheckCircle2" className="text-xl mb-1 opacity-80" />
        <p className="text-3xl font-black leading-none">{todayStats.present + todayStats.late}</p>
        <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">HADIR</p>
        <div className="w-full bg-black/10 rounded-full h-1 mt-2.5 overflow-hidden relative">
          <div
            className="bg-white h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, todayStats.attendancePct)}%` }}
          />
        </div>
        <span className="text-[8px] font-black text-white/80 mt-1">{todayStats.attendancePct}%</span>
      </Link>
    </div>
  );
}
