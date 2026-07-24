'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api, { extractErrorMessage } from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isImageUrl = (str?: string | null) => {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('http') || str.startsWith('/uploads') || str.endsWith('.jpg') || str.endsWith('.png') || str.endsWith('.jpeg') || str.endsWith('.webp');
};

export interface StudentHistoryTarget {
  id?: string;
  userId?: string;
  studentId?: string;
  nis?: string;
  studentNis?: string;
  nisn?: string;
  name?: string;
  studentName?: string;
  className?: string;
  majorName?: string;
  photoUrl?: string | null;
  faceUrl?: string | null;
  class?: {
    className?: string;
    major?: {
      name?: string;
    };
  };
}

export interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentHistoryTarget | null;
  studentId?: string;
}

const monthOptions = [
  { value: 1, name: 'Januari' },
  { value: 2, name: 'Februari' },
  { value: 3, name: 'Maret' },
  { value: 4, name: 'April' },
  { value: 5, name: 'Mei' },
  { value: 6, name: 'Juni' },
  { value: 7, name: 'Juli' },
  { value: 8, name: 'Agustus' },
  { value: 9, name: 'September' },
  { value: 10, name: 'Oktober' },
  { value: 11, name: 'November' },
  { value: 12, name: 'Desember' },
];

export function StudentHistoryModal({
  isOpen,
  onClose,
  student,
  studentId,
}: StudentHistoryModalProps) {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'logs' | 'calendar'>('logs');
  const [logSubFilter, setLogSubFilter] = useState<'today' | 'all'>('today');

  const yearOptions = useMemo(() => [currentYear, currentYear - 1, currentYear - 2], [currentYear]);

  // Data State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [historyData, setHistoryData] = useState<any>(null);
  const [selectedDayLog, setSelectedDayLog] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const targetId = useMemo(() => {
    if (studentId) return studentId;
    if (student) {
      const s = student;
      return (
        s.userId ||
        s.studentId ||
        s.nis ||
        (typeof s.id === 'string' && !s.id.startsWith('unscanned-') ? s.id : null) ||
        s.id ||
        null
      );
    }
    return null;
  }, [student, studentId]);

  const fetchHistory = useCallback(async () => {
    if (!targetId) return;

    setLoading(true);
    setErrorMsg('');
    try {
      let resData: any = null;
      try {
        const res = await api.get(`/attendance/student/${targetId}?month=${selectedMonth}&year=${selectedYear}`);
        resData = res?.data;
      } catch {
        const resFallback = await api.get(`/log/kehadiran/${targetId}`);
        resData = resFallback?.data;
      }

      const payload = resData?.data || resData;

      if (Array.isArray(payload)) {
        setHistoryData({ data: payload });
      } else if (resData?.absen && Array.isArray(resData.absen)) {
        // Legacy endpoint format mapping
        const legacyLogs: any[] = [];
        resData.absen.forEach((day: any) => {
          if (day.enter && day.enter.time && day.enter.time.length) {
            day.enter.time.forEach((t: string, i: number) => {
              legacyLogs.push({
                id: `enter-${day.tanggal}-${i}`,
                timestamp: `${day.tanggal}T${t}`,
                status: day.indexTelat ? 'TERLAMBAT' : 'HADIR',
                notes: day.enter.image ? day.enter.image[i] : null,
                gate: day.enter.gate ? day.enter.gate[i] : 'Gerbang Utama',
              });
            });
          }
          if (day.exit && day.exit.time && day.exit.time.length) {
            day.exit.time.forEach((t: string, i: number) => {
              legacyLogs.push({
                id: `exit-${day.tanggal}-${i}`,
                timestamp: `${day.tanggal}T${t}`,
                status: 'PULANG',
                notes: day.exit.image ? day.exit.image[i] : null,
                gate: day.exit.gate ? day.exit.gate[i] : 'Gerbang Utama',
              });
            });
          }
        });
        setHistoryData({
          student: {
            name: resData.Nama,
            nis: resData.NIS,
            className: resData.Kelas,
          },
          data: legacyLogs,
        });
      } else {
        setHistoryData(payload || null);
      }
    } catch (err: any) {
      console.error('Failed to fetch student attendance history:', err);
      setErrorMsg(extractErrorMessage(err, 'Gagal memuat riwayat presensi siswa'));
    } finally {
      setLoading(false);
    }
  }, [targetId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isOpen && targetId) {
      setActiveTab('logs');
      setLogSubFilter('today');
      setSelectedDayLog(null);
      fetchHistory();
    }
  }, [isOpen, targetId, fetchHistory]);

  const processDayLogs = (logList: any[]) => {
    const sorted = [...logList].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return sorted.map((log, idx) => {
      if (idx === 0) return log;
      const d = new Date(log.timestamp);
      const hour = d.getHours();
      const isAfternoon = hour >= 12;
      const isLast = idx === sorted.length - 1;

      return {
        ...log,
        status: isLast && isAfternoon ? 'PULANG' : 'SCAN',
      };
    });
  };

  // Extract raw logs
  const rawLogs = useMemo(() => {
    if (!historyData) return [];
    let list: any[] = [];
    if (Array.isArray(historyData)) list = historyData;
    else if (Array.isArray(historyData.data)) list = historyData.data;

    // Group by date & apply processDayLogs
    const map = new Map<string, any[]>();
    list.forEach((item) => {
      if (!item.timestamp) return;
      const dateStr = new Date(item.timestamp).toLocaleDateString('en-CA');
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(item);
    });

    const result: any[] = [];
    map.forEach((items) => {
      result.push(...processDayLogs(items));
    });
    return result;
  }, [historyData]);

  // Group logs by local date
  const groupedLogs = useMemo(() => {
    const map = new Map<string, { dateStr: string; isToday: boolean; formattedDate: string; logs: any[] }>();
    const todayStr = new Date().toLocaleDateString('en-CA');

    rawLogs.forEach((log) => {
      if (!log.timestamp) return;
      const d = new Date(log.timestamp);
      const dateStr = d.toLocaleDateString('en-CA');

      if (!map.has(dateStr)) {
        map.set(dateStr, {
          dateStr,
          isToday: dateStr === todayStr,
          formattedDate: d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          logs: [],
        });
      }
      map.get(dateStr)!.logs.push(log);
    });

    return Array.from(map.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [rawLogs]);

  // Today's logs group (or latest active day if no taps today)
  const todayGroup = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const exactToday = groupedLogs.find((g) => g.dateStr === todayStr);
    if (exactToday) return exactToday;
    return groupedLogs[0] || null;
  }, [groupedLogs]);

  const studentDetail = useMemo(() => {
    const fetched = historyData?.student || {};
    const passed = student || {};
    return {
      name: fetched.name || passed.name || passed.studentName || 'Siswa',
      nis: fetched.nis || passed.nis || passed.studentNis || '-',
      nisn: fetched.nisn || passed.nisn || '',
      className: fetched.className || fetched.class?.className || passed.className || 'Belum Ada Kelas',
      majorName: fetched.majorName || fetched.class?.major?.name || passed.majorName || '',
      photoUrl: fetched.photoUrl || fetched.faceUrl || passed.photoUrl || passed.faceUrl || null,
    };
  }, [historyData, student]);

  const summaryStats = useMemo(() => {
    if (historyData?.summary && typeof historyData.summary === 'object') {
      const s = historyData.summary;
      const totalAcc = (s.hadir || 0) + (s.terlambat || 0) + (s.izin || 0) + (s.sakit || 0) + (s.alpha || 0);
      const percentage = totalAcc > 0 ? Math.round((((s.hadir || 0) + (s.terlambat || 0)) / totalAcc) * 100) : 0;
      return { ...s, percentage };
    }

    const dayStatuses = new Map<string, string>();
    rawLogs.forEach((log) => {
      if (!log.timestamp) return;
      const d = new Date(log.timestamp);
      const dateStr = d.toLocaleDateString('en-CA');
      if (!dayStatuses.has(dateStr)) {
        dayStatuses.set(dateStr, log.status);
      }
    });

    const list = Array.from(dayStatuses.values());
    const hadir = list.filter((s) => s === 'HADIR').length;
    const terlambat = list.filter((s) => s === 'TERLAMBAT').length;
    const izin = list.filter((s) => s === 'IZIN').length;
    const sakit = list.filter((s) => s === 'SAKIT').length;
    const alpha = list.filter((s) => s === 'ALPHA').length;
    const total = list.length;
    const percentage = total > 0 ? Math.round(((hadir + terlambat) / total) * 100) : 0;

    return { hadir, terlambat, izin, sakit, alpha, total, percentage };
  }, [historyData, rawLogs]);

  const computedDailyMap = useMemo(() => {
    const map: Record<string, { status: string; firstIn: any; lastOut: any; logs: any[] }> = {};
    rawLogs.forEach((log) => {
      if (!log.timestamp) return;
      const d = new Date(log.timestamp);
      const dateStr = d.toLocaleDateString('en-CA');
      if (!map[dateStr]) {
        map[dateStr] = { status: log.status, firstIn: log, lastOut: null, logs: [] };
      }
      map[dateStr].logs.push(log);
    });

    Object.values(map).forEach((entry) => {
      entry.logs = processDayLogs(entry.logs);
      entry.firstIn = entry.logs[0];
      entry.status = entry.firstIn ? entry.firstIn.status : 'BELUM_ABSEN';
      if (entry.logs.length > 1) {
        entry.lastOut = entry.logs[entry.logs.length - 1];
      }
    });

    return map;
  }, [rawLogs]);

  // Calendar grid generation
  const calendarCells = useMemo(() => {
    const cells: any[] = [];
    const year = selectedYear;
    const month = selectedMonth - 1;

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    for (let i = 0; i < startDay; i++) {
      cells.push({ id: `empty-${i}`, type: 'empty' });
    }

    const dailyMap = computedDailyMap;
    const totalDays = lastDayOfMonth.getDate();

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayData = dailyMap[dateStr] || null;
      cells.push({
        id: `day-${day}`,
        type: 'day',
        day,
        dateStr,
        isWeekend,
        data: dayData,
      });
    }

    return cells;
  }, [selectedMonth, selectedYear, computedDailyMap]);

  // Helper for status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HADIR':
        return {
          badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
          label: 'Hadir',
          icon: 'mingcute:check-circle-fill',
        };
      case 'TERLAMBAT':
        return {
          badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
          label: 'Lambat',
          icon: 'mingcute:time-fill',
        };
      case 'IZIN':
        return {
          badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30',
          label: 'Izin',
          icon: 'mingcute:document-fill',
        };
      case 'SAKIT':
        return {
          badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
          label: 'Sakit',
          icon: 'mingcute:hospital-fill',
        };
      case 'PULANG':
        return {
          badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
          label: 'Pulang',
          icon: 'mingcute:exit-line',
        };
      case 'SCAN':
        return {
          badge: 'bg-muted text-muted-foreground border border-border',
          label: 'Scan Tap',
          icon: 'mingcute:fingerprint-fill',
        };
      case 'ALPHA':
      case 'BELUM_ABSEN':
        return {
          badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
          label: 'Alpha',
          icon: 'mingcute:close-circle-fill',
        };
      default:
        return {
          badge: 'bg-muted text-muted-foreground border border-border',
          label: status || 'Scan',
          icon: 'mingcute:fingerprint-fill',
        };
    }
  };

  const getLogPhoto = (log: any) => {
    if (log?.notes && isImageUrl(log.notes)) return getImageUrl(log.notes);
    if (log?.photoUrl) return getImageUrl(log.photoUrl);
    if (log?.image) return getImageUrl(log.image);
    return getImageUrl(studentDetail.photoUrl);
  };

  const formatLogTime = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatLogDate = (ts?: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(val) => { if (!val) onClose(); }}>
        <DialogContent className="sm:max-w-3xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden border border-border bg-card rounded-3xl shadow-2xl">
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-muted/40 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Student Avatar */}
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-muted border-2 border-primary/30 shrink-0 shadow-md relative cursor-pointer group"
                onClick={() => {
                  const p = getImageUrl(studentDetail.photoUrl);
                  if (p) setActivePreviewImage(p);
                }}
              >
                {studentDetail.photoUrl ? (
                  <img
                    src={getImageUrl(studentDetail.photoUrl)}
                    alt={studentDetail.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-lg sm:text-2xl">
                    {studentDetail.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Icon icon="mingcute:zoom-in-line" size={18} />
                </div>
              </div>

              {/* Student Meta Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Detail History Siswa
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                    NIS: {studentDetail.nis}
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-foreground truncate leading-tight">
                  {studentDetail.name}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground truncate mt-0.5 flex items-center gap-2">
                  <span className="text-primary font-bold">{studentDetail.className}</span>
                  {studentDetail.majorName && (
                    <span className="text-muted-foreground/60">· {studentDetail.majorName}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={fetchHistory}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                title="Refresh Data"
              >
                <Icon
                  icon="mingcute:refresh-3-line"
                  size={18}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <Icon icon="mingcute:close-line" size={20} />
              </button>
            </div>
          </div>

          {/* Filter & View Switcher Bar */}
          <div className="px-4 sm:px-6 py-3 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            {/* Period Selector */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-wider">
                <Icon icon="mingcute:calendar-fill" size={14} className="text-primary" />
                <span>Periode:</span>
              </div>
              <div className="flex gap-1.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-background border border-border text-foreground"
                >
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-background border border-border text-foreground"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex bg-muted p-1 rounded-2xl border border-border shrink-0">
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'logs'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon="mingcute:pic-fill" size={14} /> Detail Log Tap ({rawLogs.length})
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon="mingcute:calendar-2-fill" size={14} /> Menu Kalender
              </button>
            </div>
          </div>

          {/* Body Scrollable Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
            {/* Loading Spinner */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-primary">
                <Icon icon="mingcute:loading-fill" size={32} className="animate-spin" />
                <span className="text-xs font-bold text-muted-foreground">Memuat data presensi...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-3">
                <Icon icon="mingcute:warning-fill" size={22} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <>
                {/* Compact Stat Cards (Grid-5) */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
                      <Icon icon="mingcute:check-circle-fill" size={14} className="hidden sm:inline" />
                      <span className="text-sm sm:text-xl font-black">{summaryStats.hadir || 0}</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase text-emerald-600/80 dark:text-emerald-400/80 tracking-tighter truncate">
                      Hadir
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-0.5">
                      <Icon icon="mingcute:time-fill" size={14} className="hidden sm:inline" />
                      <span className="text-sm sm:text-xl font-black">{summaryStats.terlambat || 0}</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase text-amber-600/80 dark:text-amber-400/80 tracking-tighter truncate">
                      Lambat
                    </p>
                  </div>

                  <div className="bg-sky-500/10 border border-sky-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 mb-0.5">
                      <Icon icon="mingcute:document-fill" size={14} className="hidden sm:inline" />
                      <span className="text-sm sm:text-xl font-black">{summaryStats.izin || 0}</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase text-sky-600/80 dark:text-sky-400/80 tracking-tighter truncate">
                      Izin
                    </p>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 mb-0.5">
                      <Icon icon="mingcute:hospital-fill" size={14} className="hidden sm:inline" />
                      <span className="text-sm sm:text-xl font-black">{summaryStats.sakit || 0}</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase text-orange-600/80 dark:text-orange-400/80 tracking-tighter truncate">
                      Sakit
                    </p>
                  </div>

                  <div className="bg-rose-500/10 border border-rose-500/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-center">
                    <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-0.5">
                      <Icon icon="mingcute:close-circle-fill" size={14} className="hidden sm:inline" />
                      <span className="text-sm sm:text-xl font-black">{summaryStats.alpha || 0}</span>
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase text-rose-600/80 dark:text-rose-400/80 tracking-tighter truncate">
                      Alpha
                    </p>
                  </div>
                </div>

                {/* TAB 1: LOG TAP LIST */}
                {activeTab === 'logs' ? (
                  <div className="space-y-4">
                    {/* Sub Filter Pills */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-border">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setLogSubFilter('today')}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            logSubFilter === 'today'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon icon="mingcute:time-line" size={13} /> Tapping Hari Ini
                        </button>
                        <button
                          onClick={() => setLogSubFilter('all')}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            logSubFilter === 'all'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon icon="mingcute:list-unordered-line" size={13} /> Semua Log Bulan Ini ({rawLogs.length})
                        </button>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                        {summaryStats.percentage}% Tingkat Kehadiran
                      </span>
                    </div>

                    {/* MODE A: TODAY'S LOGS GROUP */}
                    {logSubFilter === 'today' ? (
                      <div className="space-y-3">
                        {todayGroup ? (
                          <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-muted/60 border border-border flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="font-black text-xs sm:text-sm text-foreground capitalize">
                                  {todayGroup.formattedDate}
                                </span>
                                {todayGroup.isToday && (
                                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-black rounded-md">
                                    HARI INI
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                {todayGroup.logs.length} Kali Scan Tap
                              </span>
                            </div>

                            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                              {todayGroup.logs.map((log: any) => {
                                const photo = getLogPhoto(log);
                                return (
                                  <div
                                    key={log.id || log.timestamp}
                                    className="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-background border border-border shadow-xs hover:border-primary/40 transition-colors"
                                  >
                                    <div
                                      className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-muted border border-border shrink-0 relative cursor-pointer group/img"
                                      onClick={() => photo && setActivePreviewImage(photo)}
                                    >
                                      {photo ? (
                                        <img
                                          src={photo}
                                          alt="scan"
                                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-muted">
                                          <Icon icon="mingcute:pic-line" size={20} />
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Icon icon="mingcute:zoom-in-line" size={16} />
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-black text-sm sm:text-base font-mono text-foreground">
                                          {formatLogTime(log.timestamp)}
                                        </span>
                                        <span
                                          className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                            getStatusBadge(log.status).badge
                                          }`}
                                        >
                                          {getStatusBadge(log.status).label}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                                        {(log.device || log.gate) && (
                                          <span className="flex items-center gap-1 font-bold text-foreground/80">
                                            <Icon icon="mingcute:location-fill" size={13} className="text-primary shrink-0" />
                                            {log.device?.name || log.gate || 'Mesin Tap'}
                                            {log.device?.location && (
                                              <span className="text-muted-foreground/60 hidden sm:inline">
                                                ({log.device.location})
                                              </span>
                                            )}
                                          </span>
                                        )}
                                        <span className="text-muted-foreground/40">·</span>
                                        <span className="font-mono text-[10px] text-muted-foreground/60 uppercase">
                                          {log.method || 'FACE_RECOGNITION'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <Icon icon="mingcute:time-line" size={40} />
                            <p className="text-xs font-black uppercase tracking-wider mt-2">
                              Belum ada catatan scan tap hari ini
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* MODE B: ALL MONTHLY LOGS GROUPED BY DATE */
                      <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {groupedLogs.length > 0 ? (
                          groupedLogs.map((group) => (
                            <div key={group.dateStr} className="space-y-2">
                              <div className="sticky top-0 z-10 px-3 py-1.5 rounded-xl bg-muted/90 backdrop-blur-sm border border-border flex items-center justify-between text-xs font-bold">
                                <span className="text-foreground capitalize flex items-center gap-1.5">
                                  <Icon icon="mingcute:calendar-fill" size={12} className="text-primary" />
                                  {group.formattedDate}
                                </span>
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  {group.logs.length} Event Tap
                                </span>
                              </div>

                              <div className="space-y-2 pl-2 border-l-2 border-primary/20 ml-2">
                                {group.logs.map((log: any) => {
                                  const photo = getLogPhoto(log);
                                  return (
                                    <div
                                      key={log.id || log.timestamp}
                                      className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border shadow-xs"
                                    >
                                      <div
                                        className="w-11 h-11 rounded-lg overflow-hidden bg-muted border border-border shrink-0 relative cursor-pointer group/img"
                                        onClick={() => photo && setActivePreviewImage(photo)}
                                      >
                                        {photo ? (
                                          <img
                                            src={photo}
                                            alt="scan"
                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-muted">
                                            <Icon icon="mingcute:pic-line" size={16} />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <span className="font-black text-xs font-mono text-foreground">
                                            {formatLogTime(log.timestamp)}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                                              getStatusBadge(log.status).badge
                                            }`}
                                          >
                                            {getStatusBadge(log.status).label}
                                          </span>
                                        </div>
                                        {(log.device || log.gate) && (
                                          <p className="text-[9px] font-bold text-muted-foreground truncate mt-0.5">
                                            <Icon icon="mingcute:location-fill" size={11} className="text-primary inline mr-0.5" />
                                            {log.device?.name || log.gate || 'Mesin'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 opacity-40">
                            <Icon icon="mingcute:calendar-line" size={40} />
                            <p className="text-xs font-black uppercase tracking-wider mt-2">
                              Belum ada data presensi bulan ini
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: MENU KALENDER */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          Menu Kalender Kehadiran
                        </h5>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Klik tanggal bertanda untuk melihat rincian log
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold opacity-60">
                        {summaryStats.percentage}% Kehadiran
                      </span>
                    </div>

                    {/* Elegant Calendar Card */}
                    <div className="w-full bg-muted/40 rounded-3xl p-4 sm:p-6 flex flex-col gap-3 max-w-[460px] mx-auto border border-border">
                      {/* Month Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-border">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary font-mono">
                          {monthOptions.find((m) => m.value === selectedMonth)?.name}
                        </span>
                        <span className="text-xs font-bold opacity-40 font-mono">{selectedYear}</span>
                      </div>

                      {/* Weekday Labels */}
                      <div className="grid grid-cols-7 text-center">
                        <span className="text-[10px] font-black uppercase opacity-40 py-1">Sen</span>
                        <span className="text-[10px] font-black uppercase opacity-40 py-1">Sel</span>
                        <span className="text-[10px] font-black uppercase opacity-40 py-1">Rab</span>
                        <span className="text-[10px] font-black uppercase opacity-40 py-1">Kam</span>
                        <span className="text-[10px] font-black uppercase opacity-40 py-1">Jum</span>
                        <span className="text-[10px] font-black uppercase text-rose-500/70 py-1">Sab</span>
                        <span className="text-[10px] font-black uppercase text-rose-500/70 py-1">Min</span>
                      </div>

                      {/* Day Grid */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {calendarCells.map((cell) => {
                          if (cell.type === 'empty') {
                            return <div key={cell.id} className="invisible aspect-square" />;
                          }

                          const status = cell.data?.status;
                          let cellClass = 'bg-muted/30 text-foreground/70';

                          if (status === 'HADIR') {
                            cellClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black cursor-pointer shadow-inner border border-emerald-500/30 hover:scale-105';
                          } else if (status === 'TERLAMBAT') {
                            cellClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black cursor-pointer shadow-inner border border-amber-500/30 hover:scale-105';
                          } else if (status === 'IZIN') {
                            cellClass = 'bg-sky-500/20 text-sky-600 dark:text-sky-400 font-black cursor-pointer shadow-inner border border-sky-500/30 hover:scale-105';
                          } else if (status === 'SAKIT') {
                            cellClass = 'bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black cursor-pointer shadow-inner border border-orange-500/30 hover:scale-105';
                          } else if (status === 'ALPHA') {
                            cellClass = 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-black cursor-pointer shadow-inner border border-rose-500/30 hover:scale-105';
                          } else if (cell.isWeekend) {
                            cellClass = 'bg-muted/10 text-rose-400/60';
                          }

                          const isSelected = selectedDayLog === cell.data && cell.data;

                          return (
                            <button
                              key={cell.id}
                              disabled={!cell.data}
                              onClick={() => {
                                if (cell.data) {
                                  setSelectedDayLog(selectedDayLog === cell.data ? null : cell.data);
                                }
                              }}
                              className={`aspect-square rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-all duration-150 ${cellClass} ${
                                isSelected ? 'scale-110 ring-2 ring-primary shadow-lg z-10' : ''
                              }`}
                            >
                              <span>{cell.day}</span>
                              {cell.data && (
                                <span className="w-1 h-1 rounded-full bg-current opacity-80 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center flex-wrap gap-2.5 pt-3 border-t border-border text-[10px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hadir
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Lambat
                        </span>
                        <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                          <span className="w-2 h-2 rounded-full bg-sky-500" /> Izin
                        </span>
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <span className="w-2 h-2 rounded-full bg-orange-500" /> Sakit
                        </span>
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Alpha
                        </span>
                      </div>
                    </div>

                    {/* Day Log Banner when Cell Clicked */}
                    {selectedDayLog && (
                      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">
                              Detail Tapping Tanggal Ini
                            </span>
                            <span className="text-xs font-mono font-bold text-foreground/70">
                              ({formatLogDate(selectedDayLog.firstIn?.timestamp)})
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedDayLog(null)}
                            className="p-1 rounded-full hover:bg-primary/20 text-primary transition-colors"
                          >
                            <Icon icon="mingcute:close-line" size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {selectedDayLog.logs.map((log: any) => {
                            const photo = getLogPhoto(log);
                            return (
                              <div
                                key={log.id || log.timestamp}
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border"
                              >
                                <div
                                  className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border relative cursor-pointer group/img"
                                  onClick={() => photo && setActivePreviewImage(photo)}
                                >
                                  {photo ? (
                                    <img
                                      src={photo}
                                      alt="scan"
                                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted">
                                      <Icon icon="mingcute:pic-line" size={16} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono font-bold text-foreground">
                                      {formatLogTime(log.timestamp)}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                                        getStatusBadge(log.status).badge
                                      }`}
                                    >
                                      {getStatusBadge(log.status).label}
                                    </span>
                                  </div>
                                  {(log.device || log.gate) && (
                                    <p className="text-[9px] font-bold text-muted-foreground truncate mt-0.5">
                                      <Icon icon="mingcute:location-fill" size={11} className="text-primary inline mr-0.5" />
                                      {log.device?.name || log.gate || 'Mesin'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 bg-muted/40 border-t border-border flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground/60 hidden sm:inline">
              Gerbang Akses Pintar & Kehadiran GASKAN
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-xs font-black bg-muted hover:bg-muted/80 text-foreground transition-colors w-full sm:w-auto"
            >
              Tutup
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Lightbox Image Preview Modal */}
      {activePreviewImage && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setActivePreviewImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setActivePreviewImage(null)}
          >
            <Icon icon="mingcute:close-line" size={28} />
          </button>
          <img
            src={activePreviewImage}
            alt="Preview Scan"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default StudentHistoryModal;
