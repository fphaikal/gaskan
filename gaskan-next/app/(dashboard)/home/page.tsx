'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Icon } from '@iconify/react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DashboardSiswa } from '@/components/dashboard/DashboardSiswa';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const role = (user?.role || 'siswa').toLowerCase();
  const isAdminOrDev = ['admin', 'developer', 'guru'].includes(role);
  const isDeveloper = role === 'developer';
  const isGuru = role === 'guru';

  // State for Admin/Dev
  const [countData, setCountData] = useState<any>(null);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'failures'>('attendance');
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  // Table Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [classList, setClassList] = useState<any[]>([]);

  // Fetch Admin / Dev Data
  const fetchAdminData = useCallback(async () => {
    if (!isAdminOrDev) return;
    try {
      const [countRes, loginRes, classRes] = await Promise.allSettled([
        api.get('/count'),
        api.get('/log/login'),
        api.get('/kelas'),
      ]);

      if (countRes.status === 'fulfilled' && countRes.value?.data) {
        setCountData(countRes.value.data.data || countRes.value.data);
      }
      if (loginRes.status === 'fulfilled' && loginRes.value?.data) {
        setLoginLogs(Array.isArray(loginRes.value.data) ? loginRes.value.data : []);
      }
      if (classRes.status === 'fulfilled' && classRes.value?.data) {
        const c = classRes.value.data.data || classRes.value.data;
        if (Array.isArray(c)) setClassList(c);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    }
  }, [isAdminOrDev]);

  const refreshSystemMetrics = useCallback(async () => {
    if (!isAdminOrDev) return;
    try {
      const res = await api.get('/system/metrics').catch(() => null);
      if (res?.data) {
        setSystemStats(res.data.data || res.data);
      }
    } catch (err) {
      console.error('Error fetching system metrics:', err);
    }
  }, [isAdminOrDev]);

  useEffect(() => {
    if (isAdminOrDev) {
      fetchAdminData();
      refreshSystemMetrics();
    }
  }, [isAdminOrDev, fetchAdminData, refreshSystemMetrics]);

  // Derived Admin Lists
  const liveAttendanceList = useMemo(() => {
    if (!countData) return [];

    const groupMap = new Map<string, any>();
    const rawAtts = countData.realtime_attendance || countData.attendance || [];

    rawAtts.forEach((item: any) => {
      const nis = item.siswa_nis || item.nis || item.userId || item.id || 'N/A';
      const studentName = item.siswa_nama || item.studentName || item.name || 'Siswa';
      const className = item.kelas_nama || item.className || item.kelas || 'X';
      const majorName = item.jurusan_nama || item.majorName || item.jurusan || 'Umum';
      const status = (item.status || 'HADIR').toUpperCase();
      const method = item.method || item.type || 'FINGERPRINT';
      const timestamp = item.timestamp || item.waktu || item.created_at || new Date().toISOString();
      const photoUrl = item.notes || item.photoUrl || item.image || null;

      if (!groupMap.has(nis)) {
        groupMap.set(nis, {
          nis,
          studentName,
          className,
          majorName,
          status,
          method,
          time: timestamp,
          photoUrl,
          logs: [],
        });
      }

      const grp = groupMap.get(nis)!;
      grp.logs.push({
        id: item.id || Math.random().toString(),
        timestamp,
        status,
        method,
        notes: photoUrl,
        gate: item.gate || item.deviceName || 'Gerbang Utama SMTI',
      });
      grp.lastOutTime = timestamp;
    });

    return Array.from(groupMap.values());
  }, [countData]);

  const recentFaceFailures = useMemo(() => {
    if (!countData) return [];
    const rawFailures = countData.face_failures || countData.failures || [];
    return rawFailures.map((item: any) => ({
      id: item.id || Math.random().toString(),
      identifier: item.identifier || item.nis || 'Wajah Tidak Dikenal',
      message: item.message || item.msg || item.notes || 'Verifikasi wajah gagal',
      timestamp: item.timestamp || item.waktu || new Date().toISOString(),
      image: item.image || item.notes || null,
      gate: item.gate || item.deviceName || 'Gerbang Utama SMTI',
    }));
  }, [countData]);

  const filteredAttendance = useMemo(() => {
    return liveAttendanceList.filter((item: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nis.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = !selectedClass || item.className === selectedClass;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [liveAttendanceList, searchQuery, selectedClass, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / itemsPerPage));
  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAttendance.slice(start, start + itemsPerPage);
  }, [filteredAttendance, currentPage, itemsPerPage]);

  // Status badges & formatting
  const getStatus = (statusStr: string) => {
    switch (statusStr) {
      case 'HADIR':
        return { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: 'mingcute:check-circle-fill' };
      case 'TERLAMBAT':
        return { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: 'mingcute:time-fill' };
      case 'IZIN':
        return { badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20', icon: 'mingcute:document-fill' };
      case 'SAKIT':
        return { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: 'mingcute:heart-fill' };
      default:
        return { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: 'mingcute:close-circle-fill' };
    }
  };

  const methodLabel = (m?: string) => {
    if (!m) return { label: 'MESIN FINGERPRINT', color: 'text-sky-400', icon: 'mingcute:fingerprint-fill' };
    const upper = m.toUpperCase();
    if (upper.includes('FACE') || upper.includes('ISAPI')) return { label: 'SCAN WAJAH (ISAPI)', color: 'text-emerald-400', icon: 'mingcute:faceid-fill' };
    if (upper.includes('MANUAL') || upper.includes('WEB')) return { label: 'SISTEM WEB', color: 'text-purple-400', icon: 'mingcute:laptop-fill' };
    return { label: 'MESIN FINGERPRINT', color: 'text-sky-400', icon: 'mingcute:fingerprint-fill' };
  };

  const formatTime = (tsStr?: string) => {
    if (!tsStr) return '-';
    try {
      const d = parseISO(tsStr);
      return format(d, 'HH:mm');
    } catch {
      return tsStr;
    }
  };

  const formatFull = (tsStr?: string) => {
    if (!tsStr) return '-';
    try {
      const d = parseISO(tsStr);
      return format(d, 'HH:mm:ss · dd MMM yyyy', { locale: localeId });
    } catch {
      return tsStr;
    }
  };

  const avatarColor = (nameStr: string) => {
    const colors = [
      'bg-emerald-500/10 text-emerald-500',
      'bg-primary/10 text-primary',
      'bg-amber-500/10 text-amber-500',
      'bg-sky-500/10 text-sky-500',
      'bg-rose-500/10 text-rose-500',
    ];
    let hash = 0;
    for (let i = 0; i < (nameStr || '').length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // IF ROLE IS SISWA -> RENDER DASHBOARD SISWA 1-TO-1 NUXT
  if (!isAdminOrDev) {
    return <DashboardSiswa user={user} />;
  }

  // IF ROLE IS ADMIN / DEV / GURU -> RENDER DASHBOARD ADMIN
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* 4 Stat KPI Cards matching Nuxt 1-to-1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'TOTAL SISWA AKTIF',
            value: countData?.total_siswa || countData?.siswa_count || 651,
            unit: 'Siswa',
            sub: 'Terdaftar di database',
            icon: 'mingcute:user-3-fill',
            color: 'text-primary bg-primary/10 border-primary/20',
          },
          {
            title: 'TOTAL KELAS & JURUSAN',
            value: countData?.total_kelas || countData?.kelas_count || 18,
            unit: 'Rombel',
            sub: 'Semua tingkat & konsentrasi',
            icon: 'mingcute:school-fill',
            color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          },
          {
            title: 'PRESENSI HARI INI',
            value: countData?.hadir_today || liveAttendanceList.length || 0,
            unit: 'Siswa Hadir',
            sub: `${countData?.terlambat_today || 0} Terlambat`,
            icon: 'mingcute:calendar-check-fill',
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          },
          {
            title: 'PRESENTASE KEHADIRAN',
            value: `${countData?.attendance_rate || 98}%`,
            unit: 'Tingkat Kehadiran',
            sub: 'Dihitung hari ini',
            icon: 'mingcute:chart-line-fill',
            color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
          },
        ].map((card, idx) => (
          <Card key={idx} className="border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{card.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-foreground">{card.value}</span>
                  <span className="text-xs font-bold text-muted-foreground">{card.unit}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${card.color}`}>
                <Icon icon={card.icon} className="text-2xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid: Left Attendance Feed, Right Quick Nav & Context Feed */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Live Attendance Feed Table */}
        <div className="col-span-12 lg:col-span-8 bg-card rounded-3xl border border-border shadow-sm flex flex-col min-h-[500px]">
          {/* Feed Header */}
          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <h2 className="text-lg font-black text-foreground">Aktivitas Presensi Real-Time</h2>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Pantau langsung log tap masuk & keluar siswa dari seluruh mesin absensi
              </p>
            </div>

            {/* Tabs Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl border border-border">
              <Button
                variant={activeTab === 'attendance' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('attendance')}
                className="rounded-xl text-xs font-bold h-8"
              >
                Log Tap ({liveAttendanceList.length})
              </Button>
              <Button
                variant={activeTab === 'failures' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('failures')}
                className="rounded-xl text-xs font-bold h-8 text-rose-500"
              >
                Kegagalan Wajah ({recentFaceFailures.length})
              </Button>
            </div>
          </div>

          {activeTab === 'attendance' ? (
            <div className="flex-1 flex flex-col">
              {/* Filter Sub-bar */}
              <div className="p-4 bg-muted/20 border-b border-border flex flex-wrap items-center gap-3">
                <Input
                  type="text"
                  placeholder="Cari nama atau NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 text-xs font-bold rounded-xl"
                />

                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-9 px-3 bg-background border border-border rounded-xl text-xs font-bold"
                >
                  <option value="">Semua Kelas</option>
                  {classList.map((c: any) => (
                    <option key={c.id || c.nama} value={c.nama || c.name}>
                      {c.nama || c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 bg-background border border-border rounded-xl text-xs font-bold"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="HADIR">Hadir</option>
                  <option value="TERLAMBAT">Terlambat</option>
                  <option value="IZIN">Izin</option>
                  <option value="SAKIT">Sakit</option>
                  <option value="ALPHA">Alpha</option>
                </select>
              </div>

              {/* Table List */}
              <div className="overflow-x-auto w-full flex-1">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-wider border-b border-border bg-muted/40">
                      <th className="py-3 px-4">Siswa</th>
                      <th className="py-3 px-4">Metode & Waktu</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedAttendance.map((item: any) => {
                      const st = getStatus(item.status);
                      const photo = getImageUrl(item.photoUrl);

                      return (
                        <tr key={item.nis} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor(item.studentName)}`}
                              >
                                {photo ? (
                                  <img src={photo} alt={item.studentName} className="w-full h-full object-cover" />
                                ) : (
                                  item.studentName.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{item.studentName}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold">
                                  {item.className} · NIS: {item.nis}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Icon icon={methodLabel(item.method).icon} className={`text-sm ${methodLabel(item.method).color}`} />
                                <span className="font-mono text-xs">{formatTime(item.time)}</span>
                              </div>
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">{methodLabel(item.method).label}</p>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Badge className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase border ${st.badge}`}>
                              <Icon icon={st.icon} className="mr-1 text-xs" />
                              {item.status}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAttendance(item)}
                              className="rounded-xl h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary px-2"
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAttendance.length)} dari {filteredAttendance.length} log
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 rounded-lg bg-card border border-border px-2 text-xs font-bold"
                  >
                    <option value={10}>10 / hal</option>
                    <option value={20}>20 / hal</option>
                    <option value={50}>50 / hal</option>
                  </select>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      ‹
                    </Button>
                    <span className="h-8 px-3 flex items-center font-mono font-bold">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      ›
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Failures List */
            <div className="p-6 space-y-3 flex-1">
              {recentFaceFailures.length === 0 ? (
                <div className="text-center py-16 text-emerald-500/70 font-bold space-y-2">
                  <Icon icon="mingcute:shield-check-line" className="text-4xl mx-auto" />
                  <p className="text-xs uppercase tracking-widest">Aman · Tidak ada kegagalan verifikasi wajah</p>
                </div>
              ) : (
                recentFaceFailures.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                        {f.image ? (
                          <img src={getImageUrl(f.image)} alt="Capture" className="w-full h-full object-cover" />
                        ) : (
                          <Icon icon="mingcute:user-close-line" className="text-rose-500 text-lg" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-rose-500">{f.identifier}</p>
                        <p className="text-[10px] text-muted-foreground">{f.message}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-muted-foreground">{formatTime(f.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: Quick Nav & Context Feed */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Quick Nav */}
          <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Navigasi Cepat</p>
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
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Security Monitor</p>
              <Link href="/log" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                Semua
              </Link>
            </div>

            <div className="space-y-3">
              {loginLogs.slice(0, 4).map((log: any, idx: number) => (
                <div key={log.id || idx} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon icon="mingcute:key-2-fill" className="text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{log.user?.name || log.identifier || 'System User'}</p>
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

      {/* DETAIL ATTENDANCE MODAL */}
      {selectedAttendance && (
        <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border border-border space-y-4">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-lg font-black text-foreground">
                {selectedAttendance.studentName}
              </DialogTitle>
              <p className="text-xs font-bold text-muted-foreground">
                {selectedAttendance.className} · NIS: {selectedAttendance.nis}
              </p>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Status</span>
                <Badge className={`text-[9px] font-black uppercase border ${getStatus(selectedAttendance.status).badge}`}>
                  {selectedAttendance.status}
                </Badge>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Waktu Scan</span>
                <span className="font-mono font-bold text-foreground">{formatFull(selectedAttendance.time)}</span>
              </div>

              <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Metode Tap</span>
                <span className={`font-bold ${methodLabel(selectedAttendance.method).color}`}>
                  {methodLabel(selectedAttendance.method).label}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedAttendance(null)}
              className="w-full rounded-2xl font-bold text-xs h-10"
            >
              Tutup Detail
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {/* IMAGE PREVIEW LIGHTBOX */}
      {activePreviewImage && (
        <Dialog open={!!activePreviewImage} onOpenChange={() => setActivePreviewImage(null)}>
          <DialogContent className="sm:max-w-3xl p-2 bg-black/90 border border-white/10 rounded-3xl text-center flex items-center justify-center">
            <img
              src={activePreviewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
