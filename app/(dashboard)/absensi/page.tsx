'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { PaginationControls } from '@/components/shared/PaginationControls';
import {
  AttendancePageSkeleton,
  AttendanceRecordsTableSkeleton,
} from '@/components/shared/PresencePageSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function AbsensiPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    belumAbsen: 0,
  });
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchClassToday = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });
      if (selectedClass) params.set('classId', selectedClass);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await api.get(`/attendance/class-today?${params.toString()}`).catch(() => api.get('/attendance'));
      const d = res?.data?.data || res?.data || {};

      if (Array.isArray(d)) {
        setStudents(d);
      } else {
        setStudents(d.data || d.students || []);
        if (d.summary) setSummary(d.summary);
        if (d.classes) setClasses(d.classes);
        if (res?.data?.pagination) setTotal(res.data.pagination.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, currentPage, itemsPerPage, searchQuery]);

  const fetchClassesList = useCallback(async () => {
    try {
      const res = await api.get('/classes').catch(() => api.get('/kelas'));
      const cls = res?.data?.data || res?.data || [];
      if (Array.isArray(cls)) setClasses(cls);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchClassToday();
    fetchClassesList();
  }, [fetchClassToday, fetchClassesList]);

  const markAttendance = async (studentId: string, status: string) => {
    setMarkingId(studentId);
    try {
      await api.post('/attendance', {
        userId: studentId,
        status,
        method: 'MANUAL',
        timestamp: new Date().toISOString(),
      });
      toast.success('Absensi berhasil dicatat');
      await fetchClassToday();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mencatat absensi');
    } finally {
      setMarkingId(null);
    }
  };

  const openDetail = (student: any) => {
    if (student.attendance) {
      setSelectedAttendance({
        studentName: student.name || student.nama,
        photoUrl: student.photoUrl || student.user?.photoUrl,
        className: student.class?.className || student.className || '-',
        status: student.attendance.status,
        time: student.attendance.firstIn?.timestamp || student.attendance.time,
        lastOutTime: student.attendance.lastOut?.timestamp || student.attendance.lastOutTime,
        method: student.attendance.method,
        logs: student.attendance.logs || [],
      });
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const getStatusBadge = (s?: string) => {
    switch (s) {
      case 'HADIR':
        return { label: 'Hadir', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
      case 'TERLAMBAT':
        return { label: 'Terlambat', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
      case 'IZIN':
        return { label: 'Izin', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'SAKIT':
        return { label: 'Sakit', bg: 'bg-orange-400/10 text-orange-400 border-orange-400/30' };
      case 'ALPHA':
        return { label: 'Alpha', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/30' };
      default:
        return { label: 'Belum Absen', bg: 'bg-muted/40 text-muted-foreground/50 border-border' };
    }
  };

  if (isLoading && students.length === 0) {
    return <AttendancePageSkeleton />;
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground leading-tight">Absensi Kelas</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{todayStr}</p>
        </div>

        {/* Search & Class Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <Icon icon="mingcute:search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base" />
            <Input
              type="text"
              placeholder="Cari Siswa / NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-leading-icon h-10 w-full rounded-xl bg-card font-bold border-border text-xs"
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomSelect
              options={[
                { value: '', label: 'Semua Kelas' },
                ...classes.map((cls) => ({ value: cls.id, label: cls.className || cls.nama_kelas })),
              ]}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Semua Kelas"
            />
          </div>
        </div>
      </div>

      {/* 7 Summary Stat Widgets matching Nuxt 1-to-1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <div className="bg-card rounded-2xl p-3 border border-border text-center col-span-1 shadow-xs">
          <p className="text-lg font-black text-foreground">{summary.total || students.length}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">Total</p>
        </div>
        <div className="bg-emerald-500 rounded-2xl p-3 text-white text-center shadow-lg shadow-emerald-500/20">
          <p className="text-lg font-black">{summary.hadir || 0}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-0.5">Hadir</p>
        </div>
        <div className="bg-amber-400 rounded-2xl p-3 text-slate-950 text-center shadow-lg shadow-amber-400/20">
          <p className="text-lg font-black">{summary.terlambat || 0}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-0.5">Terlambat</p>
        </div>
        <div className="bg-sky-400 rounded-2xl p-3 text-slate-950 text-center shadow-lg shadow-sky-400/20">
          <p className="text-lg font-black">{summary.izin || 0}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-0.5">Izin</p>
        </div>
        <div className="bg-orange-400 rounded-2xl p-3 text-white text-center shadow-lg shadow-orange-400/20">
          <p className="text-lg font-black">{summary.sakit || 0}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-0.5">Sakit</p>
        </div>
        <div className="bg-rose-500 rounded-2xl p-3 text-white text-center shadow-lg shadow-rose-500/20">
          <p className="text-lg font-black">{summary.alpha || 0}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-0.5">Alpha</p>
        </div>
        <div className="bg-muted/60 rounded-2xl p-3 text-center border border-border">
          <p className="text-lg font-black text-muted-foreground/60">{summary.belumAbsen || 0}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-0.5">Belum</p>
        </div>
      </div>

      {/* Student Table matching Nuxt 1-to-1 */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <AttendanceRecordsTableSkeleton />
        ) : students.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Icon icon="mingcute:user-3-line" className="text-5xl text-muted-foreground/30 mx-auto" />
            <p className="text-base font-bold text-muted-foreground">Tidak ada siswa ditemukan</p>
            <p className="text-xs text-muted-foreground/60">Pilih kelas atau sesuaikan pencarian Anda</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {students.map((std, idx) => {
                const sId = String(std.id);
                const photo = getImageUrl(std.photoUrl || std.user?.photoUrl);
                const statusInfo = getStatusBadge(std.attendance?.status);

                return (
                  <div key={std.id} className="min-w-0 space-y-3 p-4">
                    <button
                      type="button"
                      onClick={() => openDetail(std)}
                      className="flex w-full min-w-0 items-center gap-3 text-left"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-primary/10 flex items-center justify-center font-black text-primary">
                        {photo ? (
                          <img src={photo} alt={std.name || std.nama} className="h-full w-full object-cover" />
                        ) : (
                          <span>{(std.name || std.nama || 'S').charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{std.name || std.nama}</p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {std.nis || std.NIS || '-'} · {std.class?.className || std.className || '-'}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground">
                        #{(currentPage - 1) * itemsPerPage + idx + 1}
                      </span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <span className="block text-[9px] font-black uppercase text-muted-foreground">Status</span>
                        {std.attendance ? (
                          <span className={`mt-1 inline-flex rounded-md border px-2 py-1 text-[9px] font-black uppercase ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        ) : (
                          <span className="mt-1 block text-xs font-bold text-muted-foreground">Belum absen</span>
                        )}
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <span className="block text-[9px] font-black uppercase text-muted-foreground">Waktu</span>
                        <span className="mt-1 block font-mono text-xs font-bold text-foreground">
                          {std.attendance
                            ? `${formatTime(std.attendance.firstIn?.timestamp || std.attendance.time)} / ${formatTime(std.attendance.lastOut?.timestamp || std.attendance.lastOutTime)}`
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex min-h-11 items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {std.attendance
                          ? std.attendance.method === 'FACE_RECOGNITION'
                            ? 'Face ID'
                            : std.attendance.method === 'QR_CODE'
                            ? 'QR'
                            : 'Manual'
                          : 'Pilih status kehadiran'}
                      </span>
                      {!std.attendance ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-11 min-w-28 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-black text-slate-950 shadow-sm shadow-amber-500/20 hover:bg-amber-400">
                            {markingId === sId ? (
                              <Icon icon="mingcute:loading-fill" className="animate-spin text-sm" />
                            ) : (
                              <Icon icon="mingcute:check-2-fill" className="text-sm" />
                            )}
                            Absen
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl bg-card p-1.5 border-border">
                            <DropdownMenuLabel className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                              Pilih Status
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {[
                              ['HADIR', 'Hadir', 'mingcute:check-circle-line', 'text-emerald-500'],
                              ['TERLAMBAT', 'Terlambat', 'mingcute:time-line', 'text-amber-500'],
                              ['IZIN', 'Izin', 'mingcute:document-line', 'text-sky-400'],
                              ['SAKIT', 'Sakit', 'mingcute:heart-line', 'text-orange-400'],
                              ['ALPHA', 'Alpha', 'mingcute:close-circle-line', 'text-rose-500'],
                            ].map(([status, label, icon, color]) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => markAttendance(sId, status)}
                                className={`${color} rounded-lg text-xs font-bold`}
                              >
                                <Icon icon={icon} className="mr-2" /> {label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button type="button" variant="outline" onClick={() => openDetail(std)} className="shrink-0 rounded-xl text-xs font-bold">
                          Detail
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border">
                  <th className="py-4 pl-6 w-12 text-left">#</th>
                  <th className="py-4 text-left">Informasi Siswa</th>
                  <th className="py-4 text-left">Kelas</th>
                  <th className="py-4 text-left">Status</th>
                  <th className="py-4 text-left">Waktu</th>
                  <th className="py-4 text-left">Metode</th>
                  <th className="py-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((std, idx) => {
                  const sId = String(std.id);
                  const photo = getImageUrl(std.photoUrl || std.user?.photoUrl);
                  const statusInfo = getStatusBadge(std.attendance?.status);

                  return (
                    <tr
                      key={std.id}
                      onClick={() => openDetail(std)}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="pl-6 text-[10px] font-black text-muted-foreground/40">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      {/* Student Info */}
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-primary/10 border border-border shrink-0 flex items-center justify-center font-black text-xs text-primary">
                            {photo ? (
                              <img src={photo} alt={std.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(std.name || std.nama || 'S').charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {std.name || std.nama}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest font-mono">
                              {std.nis || std.NIS || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="text-[10px] font-black text-muted-foreground">
                        {std.class?.className || std.className || '-'}
                      </td>

                      {/* Status */}
                      <td>
                        {std.attendance ? (
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest italic">
                            Belum absen
                          </span>
                        )}
                      </td>

                      {/* Time IN & OUT */}
                      <td className="py-3">
                        {std.attendance ? (
                          <div className="flex flex-col gap-0.5 justify-center font-mono">
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-emerald-500">IN</span>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {formatTime(std.attendance.firstIn?.timestamp || std.attendance.time)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-rose-500">OUT</span>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {formatTime(std.attendance.lastOut?.timestamp || std.attendance.lastOutTime)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                        {std.attendance
                          ? std.attendance.method === 'FACE_RECOGNITION'
                            ? 'Face ID'
                            : std.attendance.method === 'QR_CODE'
                            ? 'QR'
                            : 'Manual'
                          : '-'}
                      </td>

                      {/* Action Dropdown Button matching Nuxt 1-to-1 */}
                      <td className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        {!std.attendance ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black px-3 h-11 sm:h-8 flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 text-xs transition-colors cursor-pointer">
                              {markingId === sId ? (
                                <Icon icon="mingcute:loading-fill" className="animate-spin text-sm" />
                              ) : (
                                <Icon icon="mingcute:check-2-fill" className="text-sm" />
                              )}
                              <span>Absen</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl bg-card border-border">
                              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3 py-1">
                                Pilih Status
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => markAttendance(sId, 'HADIR')}
                                className="text-emerald-500 font-bold text-xs rounded-lg cursor-pointer hover:bg-emerald-500/10"
                              >
                                <Icon icon="mingcute:check-circle-line" className="mr-2" /> Hadir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => markAttendance(sId, 'TERLAMBAT')}
                                className="text-amber-500 font-bold text-xs rounded-lg cursor-pointer hover:bg-amber-500/10"
                              >
                                <Icon icon="mingcute:time-line" className="mr-2" /> Terlambat
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => markAttendance(sId, 'IZIN')}
                                className="text-sky-400 font-bold text-xs rounded-lg cursor-pointer hover:bg-sky-500/10"
                              >
                                <Icon icon="mingcute:document-line" className="mr-2" /> Izin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => markAttendance(sId, 'SAKIT')}
                                className="text-orange-400 font-bold text-xs rounded-lg cursor-pointer hover:bg-orange-400/10"
                              >
                                <Icon icon="mingcute:heart-line" className="mr-2" /> Sakit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => markAttendance(sId, 'ALPHA')}
                                className="text-rose-500 font-bold text-xs rounded-lg cursor-pointer hover:bg-rose-500/10"
                              >
                                <Icon icon="mingcute:close-circle-line" className="mr-2" /> Alpha
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground/30 ml-auto">
                            <Icon icon="mingcute:check-2-line" className="text-base" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}

        <PaginationControls
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={total || summary.total || students.length}
          totalPages={Math.ceil((total || summary.total || students.length) / itemsPerPage) || 1}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => {
            setItemsPerPage(newLimit);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* DETAIL MODAL POPUP matching Nuxt */}
      {selectedAttendance && (
        <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
          <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
              <DialogTitle className="text-xl font-black text-foreground">
                Detail Absensi: {selectedAttendance.studentName}
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border">
                <span className="text-xs font-black text-muted-foreground">Kelas</span>
                <span className="font-bold text-foreground">{selectedAttendance.className}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border">
                <span className="text-xs font-black text-muted-foreground">Status</span>
                <span className="font-black text-primary uppercase">{selectedAttendance.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 bg-muted/30 rounded-2xl border border-border">
                  <span className="text-[10px] text-emerald-500 font-black">JAM MASUK</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{formatTime(selectedAttendance.time)}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-2xl border border-border">
                  <span className="text-[10px] text-rose-500 font-black">JAM PULANG</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{formatTime(selectedAttendance.lastOutTime)}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md">
              <Button variant="ghost" className="rounded-2xl font-bold w-full text-xs" onClick={() => setSelectedAttendance(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
