'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Icon } from '@iconify/react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const role = user?.role || 'siswa';
  const isAdminOrDev = ['admin', 'developer', 'guru'].includes(role);
  const isDeveloper = role === 'developer';
  const isGuru = role === 'guru';

  // State for Admin/Dev
  const [countData, setCountData] = useState<any>(null);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'failures'>('attendance');
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);

  // State for Siswa
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [studentAttendance, setStudentAttendance] = useState<any>(null);

  // Fetch Admin / Dev Data
  const fetchAdminData = useCallback(async () => {
    try {
      const [countRes, loginRes] = await Promise.allSettled([
        api.get('/count'),
        api.get('/log/login'),
      ]);

      if (countRes.status === 'fulfilled' && countRes.value?.data) {
        setCountData(countRes.value.data);
      }
      if (loginRes.status === 'fulfilled' && loginRes.value?.data) {
        setLoginLogs(Array.isArray(loginRes.value.data) ? loginRes.value.data : []);
      }
    } catch (e) {
      console.error('Failed to fetch admin dashboard data:', e);
    }
  }, []);

  // Fetch Developer System Info
  const fetchSystemData = useCallback(async () => {
    if (!isDeveloper) return;
    try {
      const res = await api.get('/dev/system');
      if (res.data) setSystemStats(res.data);
    } catch (e) {
      // silent fallback
    }
  }, [isDeveloper]);

  // Fetch Student Data
  const fetchStudentData = useCallback(async () => {
    if (isAdminOrDev) return;
    try {
      const res = await api.get(`/attendance/my?month=${selectedMonth}&year=${selectedYear}`);
      if (res.data) setStudentAttendance(res.data?.data || res.data);
    } catch (e) {
      console.error('Failed to fetch student attendance:', e);
    }
  }, [isAdminOrDev, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isAdminOrDev) {
      fetchAdminData();
      if (isDeveloper) {
        fetchSystemData();
        const interval = setInterval(fetchSystemData, 5000);
        return () => clearInterval(interval);
      }
    } else {
      fetchStudentData();
    }
  }, [isAdminOrDev, isDeveloper, fetchAdminData, fetchSystemData, fetchStudentData]);

  // Greeting & Date calculations
  const todayStr = useMemo(() => format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId }), []);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Pengguna';
  const firstWord = displayName.split(' ')[0];

  const today = countData?.today || {
    present: 0,
    late: 0,
    absent: 0,
    izin: 0,
    sakit: 0,
    attendancePercentage: 0,
  };

  const formatTime = (ts?: string) => (ts ? format(parseISO(ts), 'HH:mm') : '-');
  const formatFull = (ts?: string) => (ts ? format(parseISO(ts), 'EEEE, d MMM yyyy · HH:mm', { locale: localeId }) : '-');

  const methodLabel = (m: string) => {
    if (m === 'FACE_RECOGNITION') return { label: 'Face ID', icon: 'mingcute:faceid-line', color: 'text-primary' };
    if (m === 'QR_CODE') return { label: 'QR Code', icon: 'mingcute:qrcode-2-line', color: 'text-blue-500' };
    return { label: 'Manual', icon: 'mingcute:edit-2-line', color: 'text-muted-foreground' };
  };

  const getStatus = (s: string) => {
    switch (s) {
      case 'HADIR':
        return { color: 'text-emerald-500', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' };
      case 'TERLAMBAT':
        return { color: 'text-amber-500', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-500' };
      case 'IZIN':
        return { color: 'text-sky-500', badge: 'bg-sky-500/10 border-sky-500/30 text-sky-500' };
      case 'SAKIT':
        return { color: 'text-orange-400', badge: 'bg-orange-400/10 border-orange-400/30 text-orange-400' };
      case 'ALPHA':
      default:
        return { color: 'text-rose-500', badge: 'bg-rose-500/10 border-rose-500/30 text-rose-500' };
    }
  };

  const avatarColors = [
    'bg-primary/20 text-primary',
    'bg-emerald-500/20 text-emerald-500',
    'bg-amber-500/20 text-amber-500',
    'bg-sky-500/20 text-sky-500',
    'bg-rose-500/20 text-rose-500',
  ];
  const avatarColor = (name?: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  // Strictly real data from API response
  const recentAttendances: any[] = countData?.recentAttendances || [];
  const recentFaceFailures: any[] = countData?.recentFaceFailures || [];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
      </div>
    );
  }

  // ----------------------------------------------------
  // ADMIN / GURU / DEVELOPER DASHBOARD VIEW
  // ----------------------------------------------------
  if (isAdminOrDev) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        {/* ROW 1: Hero Greeting + Quick Stat Widgets */}
        <div className="grid grid-cols-12 gap-4">
          {/* Hero Banner */}
          <Link
            href="/profile"
            className="col-span-12 md:col-span-5 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-amber-500/20 flex flex-col justify-between hover:scale-[1.01] transition-transform cursor-pointer group"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">
                {greeting} — {todayStr}
              </p>
              <h1 className="text-3xl font-extrabold text-white leading-tight">{firstWord}</h1>
              <p className="text-xs text-white/80 font-semibold mt-2">
                {countData?.klasifikasi?.siswa || 0} siswa · {countData?.pendingLeaves || 0} izin pending ·{' '}
                {today.attendancePercentage || 0}% hadir
              </p>
            </div>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 grid grid-cols-4 gap-1.5 opacity-15 group-hover:opacity-25 transition-opacity">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-sm bg-white" />
              ))}
            </div>
          </Link>

          {/* Stat Cards */}
          {/* Alpha */}
          <Link
            href="/absensi"
            className="col-span-3 md:col-span-2 bg-rose-500 rounded-3xl p-4 text-white shadow-lg shadow-rose-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
          >
            <Icon icon="mingcute:close-circle-fill" className="text-2xl mb-1 opacity-80" />
            <p className="text-3xl font-black leading-none">{today.absent}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Alpha</p>
          </Link>

          {/* Izin/Sakit */}
          <Link
            href="/izin"
            className="col-span-3 md:col-span-2 bg-amber-500 rounded-3xl p-4 text-white shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
          >
            <Icon icon="mingcute:document-fill" className="text-2xl mb-1 opacity-80" />
            <p className="text-3xl font-black leading-none">{today.izin + today.sakit}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Izin/Sakit</p>
          </Link>

          {/* Lambat */}
          <Link
            href="/absensi"
            className="col-span-3 md:col-span-1 bg-orange-400 rounded-3xl p-4 text-white shadow-lg shadow-orange-400/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
          >
            <Icon icon="mingcute:time-fill" className="text-xl mb-1 opacity-80" />
            <p className="text-2xl font-black leading-none">{today.late}</p>
            <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">Lambat</p>
          </Link>

          {/* Hadir */}
          <Link
            href="/absensi"
            className="col-span-3 md:col-span-2 bg-emerald-500 rounded-3xl p-4 text-white shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center text-center hover:scale-[1.03] transition-transform cursor-pointer"
          >
            <Icon icon="mingcute:check-circle-fill" className="text-2xl mb-1 opacity-80" />
            <p className="text-3xl font-black leading-none">{today.present + today.late}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Hadir</p>
            <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${today.attendancePercentage || 0}%` }}
              />
            </div>
            <p className="text-[9px] opacity-70 mt-0.5">{today.attendancePercentage || 0}%</p>
          </Link>
        </div>

        {/* ROW 2: Activity Table + Right Sidebar */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Activity Table */}
          <div className="col-span-12 lg:col-span-8 bg-card rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center gap-2 pb-1 border-b-2 font-black text-sm tracking-wide transition-all ${
                    activeTab === 'attendance'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Aktivitas Absensi
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {recentAttendances.length}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('failures')}
                  className={`flex items-center gap-2 pb-1 border-b-2 font-black text-sm tracking-wide transition-all ${
                    activeTab === 'failures'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Gagal Deteksi Wajah
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {recentFaceFailures.length}
                  </Badge>
                </button>
              </div>

              <Link
                href={activeTab === 'attendance' ? '/absensi' : '/log'}
                className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest"
              >
                Lihat Semua →
              </Link>
            </div>

            {/* Attendance Tab */}
            {activeTab === 'attendance' ? (
              <div className="overflow-x-auto w-full flex-1">
                <div className="min-w-[650px]">
                  <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-3 border-b border-border bg-muted/20">
                    <div className="col-span-4">Siswa</div>
                    <div className="col-span-3">Kelas / Jurusan</div>
                    <div className="col-span-2">Waktu</div>
                    <div className="col-span-2">Metode</div>
                    <div className="col-span-1 text-right">Status</div>
                  </div>

                  {recentAttendances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-2">
                      <Icon icon="mingcute:time-line" className="text-5xl" />
                      <p className="text-xs font-black uppercase tracking-widest">Belum ada absensi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentAttendances.map((a: any) => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedAttendance(a)}
                          className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-primary/5 transition-colors cursor-pointer group"
                        >
                          <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor(
                                a.studentName
                              )}`}
                            >
                              {a.studentName?.charAt(0)}
                            </div>
                            <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                              {a.studentName}
                            </span>
                          </div>

                          <div className="col-span-3 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{a.className || '—'}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                              {a.majorName || 'Umum'}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <span className="text-xs font-mono font-bold">{formatTime(a.time)}</span>
                          </div>

                          <div className="col-span-2 flex items-center gap-1.5">
                            <Icon icon={methodLabel(a.method).icon} className={`text-base ${methodLabel(a.method).color}`} />
                            <span className={`text-[10px] font-bold ${methodLabel(a.method).color}`}>
                              {methodLabel(a.method).label}
                            </span>
                          </div>

                          <div className="col-span-1 flex justify-end">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                                getStatus(a.status).badge
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Failures Tab */
              <div className="overflow-x-auto w-full flex-1">
                <div className="min-w-[650px]">
                  {recentFaceFailures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-emerald-500/60 space-y-2">
                      <Icon icon="mingcute:shield-check-line" className="text-5xl" />
                      <p className="text-xs font-black uppercase tracking-widest">Aman · Tidak ada kegagalan wajah</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentFaceFailures.map((f: any) => (
                        <div
                          key={f.id}
                          className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-rose-500/5 transition-colors"
                        >
                          <div className="col-span-2 flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                              <Icon icon="mingcute:user-close-line" className="text-xl" />
                            </div>
                          </div>
                          <div className="col-span-4 min-w-0">
                            <p className="text-sm font-bold text-rose-500 truncate">{f.identifier}</p>
                            <p className="text-[10px] text-muted-foreground">{f.message}</p>
                          </div>
                          <div className="col-span-3">
                            <p className="text-xs font-semibold">{f.gate}</p>
                          </div>
                          <div className="col-span-3 text-right">
                            <p className="text-xs font-mono font-bold">{formatTime(f.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Widgets */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Quick Nav Grid */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                Navigasi Cepat
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/siswa', icon: 'mingcute:user-add-fill', label: 'Daftar Siswa', color: 'text-primary bg-primary/10' },
                  { to: '/izin', icon: 'mingcute:file-check-fill', label: 'Review Izin', color: 'text-amber-500 bg-amber-500/10' },
                  { to: '/absensi', icon: 'mingcute:calendar-2-fill', label: 'Absensi', color: 'text-emerald-500 bg-emerald-500/10' },
                  { to: '/admin', icon: 'mingcute:settings-6-fill', label: 'Manajemen', color: 'text-sky-500 bg-sky-500/10' },
                ].map((nav) => (
                  <Link
                    key={nav.to}
                    href={nav.to}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 hover:bg-muted/80 hover:scale-[1.02] transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${nav.color}`}>
                      <Icon icon={nav.icon} className="text-xl" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center">
                      {nav.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Context Feed */}
            <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {isGuru ? 'Izin Menunggu Review' : 'Security Monitor'}
                </p>
                <Link href="/log" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                  Semua
                </Link>
              </div>

              <div className="space-y-3">
                {loginLogs.slice(0, 4).map((log: any, idx: number) => (
                  <div
                    key={log.id || idx}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/60 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon icon="mingcute:key-2-fill" className="text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{log.user?.name || log.identifier || log.details?.identifier || 'System User'}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{log.action || 'LOGIN_SUCCESS'}</p>
                    </div>
                  </div>
                ))}
                {loginLogs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 opacity-30 text-center">
                    <Icon icon="mingcute:key-2-fill" className="text-3xl mb-1" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Belum ada log login</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dev System Strip */}
        {isDeveloper && systemStats && (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 border border-border rounded-2xl px-6 py-3">
            {[
              { label: 'HOST', val: systemStats?.osInfo?.hostname || 'smti-server' },
              { label: 'OS', val: systemStats?.osInfo?.distro || 'Ubuntu Linux' },
              { label: 'RAM', val: systemStats?.memory?.used || '0 GB' },
              { label: 'DISK', val: systemStats?.disk?.used || '0%' },
            ].map((st) => (
              <div key={st.label} className="flex items-center gap-2">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{st.label}</span>
                <span className="text-xs font-bold text-muted-foreground">{st.val}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Online</span>
            </div>
          </div>
        )}

        {/* Attendance Detail Dialog Modal */}
        {selectedAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAttendance(null)}>
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4 relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold">{selectedAttendance.studentName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedAttendance.className} · {selectedAttendance.majorName}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelectedAttendance(null)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-muted/50">
                  <span className="text-xs font-semibold text-muted-foreground">Status Kehadiran</span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${getStatus(selectedAttendance.status).badge}`}>
                    {selectedAttendance.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">Waktu Masuk</span>
                  <span className="font-bold">{formatFull(selectedAttendance.time)}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-muted-foreground">Metode Tap</span>
                  <span className="font-bold">{methodLabel(selectedAttendance.method).label}</span>
                </div>
              </div>

              <Button className="w-full rounded-2xl font-bold" onClick={() => setSelectedAttendance(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // SISWA DASHBOARD VIEW
  // ----------------------------------------------------
  const studentSummary = studentAttendance?.summary || { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, total: 0 };
  const studentRate = studentSummary.total ? Math.round(((studentSummary.hadir + studentSummary.terlambat) / studentSummary.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Student Profile Card (2x1) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary/15 via-card to-card border border-border rounded-3xl p-6 flex items-center gap-6 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-extrabold shadow-inner shrink-0">
            {displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Halo, {firstWord}!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Siswa Active · NIS: {user?.id || '—'}
            </p>
          </div>
        </div>

        {/* Today Status (1x1) */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Status Hari Ini</p>
          <div className="flex items-center gap-3 text-muted-foreground/50">
            <Icon icon="mingcute:time-line" className="text-4xl" />
            <div>
              <span className="text-xl font-bold">Belum Absen</span>
            </div>
          </div>
        </div>

        {/* Monthly Attendance Rate (1x1) */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Kehadiran Bulan Ini</p>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-emerald-500">{studentRate}%</span>
              <span className="text-xs text-muted-foreground pb-1">dari {studentSummary.total} hari</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${studentRate}%` }} />
            </div>
          </div>
        </div>

        {/* Monthly Summary Cards (Full Span) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-4">Rekap Absensi Bulan Ini</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-emerald-500/10 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-emerald-500 mb-1">{studentSummary.hadir}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Hadir</p>
            </div>
            <div className="bg-amber-500/10 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-amber-500 mb-1">{studentSummary.terlambat}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Terlambat</p>
            </div>
            <div className="bg-sky-500/10 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-sky-500 mb-1">{studentSummary.izin}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Izin</p>
            </div>
            <div className="bg-orange-400/10 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-orange-400 mb-1">{studentSummary.sakit}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sakit</p>
            </div>
            <div className="bg-rose-500/10 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-rose-500 mb-1">{studentSummary.alpha}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Alpha</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
