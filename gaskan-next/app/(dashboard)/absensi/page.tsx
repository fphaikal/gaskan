'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/shared/CustomSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
              className="pl-9 h-10 w-full rounded-xl bg-card font-bold border-border text-xs"
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
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
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
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
            <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
            <p className="text-xs font-bold">Memuat data absensi kelas...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Icon icon="mingcute:user-3-line" className="text-5xl text-muted-foreground/30 mx-auto" />
            <p className="text-base font-bold text-muted-foreground">Tidak ada siswa ditemukan</p>
            <p className="text-xs text-muted-foreground/60">Pilih kelas atau sesuaikan pencarian Anda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                            <DropdownMenuTrigger className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black px-3 h-8 flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 text-xs transition-colors cursor-pointer">
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
        )}
      </div>

      {/* DETAIL MODAL POPUP matching Nuxt */}
      {selectedAttendance && (
        <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border-border">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-xl font-black text-foreground">
                Detail Absensi: {selectedAttendance.studentName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs sm:text-sm mt-3">
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
