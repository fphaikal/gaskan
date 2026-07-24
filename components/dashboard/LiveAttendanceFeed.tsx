'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Icon } from '@/components/ui/icon';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentHistoryModal } from '@/components/dashboard/StudentHistoryModal';
import { getSocket } from '@/lib/socket';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function LiveAttendanceFeed() {
  const [countData, setCountData] = useState<any>(null);
  const [classList, setClassList] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const [activeTab, setActiveTab] = useState<'attendance' | 'failures'>('attendance');
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [selectedFailure, setSelectedFailure] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<any>(null);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState<boolean>(false);

  const openStudentHistory = (studentOrAtt: any) => {
    if (!studentOrAtt) return;
    const resolvedId =
      studentOrAtt.userId ||
      studentOrAtt.studentId ||
      studentOrAtt.nis ||
      (typeof studentOrAtt.id === 'string' && !studentOrAtt.id.startsWith('unscanned-') ? studentOrAtt.id : null) ||
      studentOrAtt.id;
    setSelectedStudentForHistory({
      id: resolvedId,
      name: studentOrAtt.studentName || studentOrAtt.name || 'Siswa',
      nis: studentOrAtt.nis || studentOrAtt.studentNis || '',
      className: studentOrAtt.className || '',
      majorName: studentOrAtt.majorName || '',
      photoUrl: studentOrAtt.photoUrl || studentOrAtt.faceUrl || null,
    });
    setShowStudentHistoryModal(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Realtime Socket State
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [realtimeAttendances, setRealtimeAttendances] = useState<any[]>([]);
  const [realtimeFailures, setRealtimeFailures] = useState<any[]>([]);

  useEffect(() => {
    const sk = getSocket();

    function onConnect() {
      setIsWsConnected(true);
    }

    function onDisconnect() {
      setIsWsConnected(false);
    }

    function onNewAttendance(data: any) {
      if (!data) return;
      const newItem = {
        id: data.id || `ws-${Date.now()}-${Math.random()}`,
        studentName: data.Nama || data.studentName || data.name || 'Siswa',
        className: data.Kelas || data.className || data.class?.className || '—',
        majorName: data.majorName || data.Jurusan || data.class?.major?.name || '',
        status: (data.status || 'HADIR').toUpperCase(),
        time: data.timestamp || data.time || data.waktu || new Date().toISOString(),
        method: data.method || 'SCAN WAJAH (JSAPI)',
        photoUrl: data.Image || data.photoUrl || data.image || data.url_picture || null,
        lastOutTime: data.lastOutTime || null,
        gate: data.Gate || data.gate || data.device?.name || 'Gerbang Utama',
      };

      setRealtimeAttendances((prev) => [newItem, ...prev]);
    }

    function onFaceFailure(data: any) {
      if (!data) return;
      const newFailure = {
        id: data.id || `fail-${Date.now()}-${Math.random()}`,
        identifier: data.identifier || data.nama || data.studentName || 'Wajah Tidak Dikenali',
        message: data.message || data.error || 'Verifikasi Wajah Gagal',
        timestamp: data.timestamp || new Date().toISOString(),
        gate: data.gate || 'Mesin Face Recognition',
        image: data.image || data.photoUrl || null,
      };
      setRealtimeFailures((prev) => [newFailure, ...prev]);
    }

    sk.on('connect', onConnect);
    sk.on('disconnect', onDisconnect);
    sk.on('attendance:new', onNewAttendance);
    sk.on('absen:new', onNewAttendance);
    sk.on('presence:new', onNewAttendance);
    sk.on('log:new', onNewAttendance);
    sk.on('face:failure', onFaceFailure);
    sk.on('attendance:failure', onFaceFailure);

    if (sk.connected) {
      setIsWsConnected(true);
    } else {
      sk.connect();
    }

    return () => {
      sk.off('connect', onConnect);
      sk.off('disconnect', onDisconnect);
      sk.off('attendance:new', onNewAttendance);
      sk.off('absen:new', onNewAttendance);
      sk.off('presence:new', onNewAttendance);
      sk.off('log:new', onNewAttendance);
      sk.off('face:failure', onFaceFailure);
      sk.off('attendance:failure', onFaceFailure);
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        status: statusFilter,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedClass) params.set('class', selectedClass);

      const countRes = await api.get(`/count?${params.toString()}`);
      const data = countRes?.data?.data || countRes?.data;
      setCountData(data);
      setPagination(data?.pagination || {
        page: currentPage,
        limit: itemsPerPage,
        total: data?.recentAttendances?.length || 0,
        totalPages: 1,
      });
    } catch (err) {
      console.error('Error fetching live attendance feed data:', err);
      setCountData(null);
      setPagination({ page: 1, limit: itemsPerPage, total: 0, totalPages: 1 });
    } finally {
      setIsFetching(false);
      setIsInitialLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, selectedClass, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;

    api.get('/classes')
      .then((res) => {
        if (!mounted) return;
        const classes = res?.data?.data || res?.data;
        if (Array.isArray(classes)) setClassList(classes);
      })
      .catch((err) => console.error('Error fetching class list:', err));

    return () => {
      mounted = false;
    };
  }, []);

  // Derived Admin Lists
  const liveAttendanceList = useMemo(() => {
    if (!countData) return [];
    let rawAtts: any[] = [];
    if (Array.isArray(countData)) rawAtts = countData;
    else if (Array.isArray(countData.recentAttendances)) rawAtts = countData.recentAttendances;
    else if (Array.isArray(countData.recent_attendances)) rawAtts = countData.recent_attendances;
    else if (Array.isArray(countData.realtime_attendance)) rawAtts = countData.realtime_attendance;
    else if (Array.isArray(countData.attendance)) rawAtts = countData.attendance;
    else if (Array.isArray(countData.data)) rawAtts = countData.data;
    else if (Array.isArray(countData.recentPresensi)) rawAtts = countData.recentPresensi;
    else if (Array.isArray(countData.logs)) rawAtts = countData.logs;

    return rawAtts.map((item: any) => {
      const studentPhoto = item.photoUrl || item.photo || item.studentPhoto || item.avatar || null;
      const machinePhoto = item.notes || item.image || item.scanPhoto || item.tapPhoto || null;

      const logs = Array.isArray(item.logs) && item.logs.length > 0
        ? item.logs.map((l: any) => ({
            id: l.id || Math.random().toString(),
            timestamp: l.timestamp || l.waktu || item.timestamp || item.waktu || new Date().toISOString(),
            status: l.status || item.status || 'HADIR',
            method: l.method || item.method || 'FINGERPRINT',
            notes: l.notes || l.image || l.photo || machinePhoto,
            gate: l.gate || l.deviceName || item.gate || item.deviceName || 'Gerbang Utama SMTI',
          }))
        : [{
            id: item.id || Math.random().toString(),
            timestamp: item.time || item.timestamp || item.waktu || new Date().toISOString(),
            status: item.status || 'HADIR',
            method: item.method || 'FINGERPRINT',
            notes: machinePhoto,
            gate: item.gate || item.deviceName || 'Gerbang Utama SMTI',
          }];

      return {
        id: item.id || item.nis || Math.random().toString(),
        nis: item.siswa_nis || item.nis || item.userId || item.studentId || item.NIS || '—',
        studentName: item.studentName || item.siswa_nama || item.name || item.Nama || item.nama || 'Siswa',
        className: item.className || item.kelas_nama || item.kelas || item.Kelas || '—',
        majorName: item.majorName || item.jurusan_nama || item.jurusan || item.Jurusan || '—',
        status: (item.status || item.Status || 'HADIR').toUpperCase(),
        method: item.method || item.Method || item.type || 'FINGERPRINT',
        time: item.time || item.timestamp || item.waktu || item.created_at || new Date().toISOString(),
        lastOutTime: item.lastOutTime || item.outTime || item.timeOut || null,
        photoUrl: studentPhoto,
        machinePhoto: machinePhoto,
        gate: item.gate || item.deviceName || 'Gerbang Utama SMTI',
        logs,
      };
    });
  }, [countData]);



  const classOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Semua Kelas' }];
    classList.forEach((c: any) => {
      const val = typeof c === 'string' ? c : (c.className || c.nama_kelas || c.nama || c.name || '');
      if (val && !opts.some((o) => o.value === val)) {
        opts.push({ value: val, label: val });
      }
    });
    return opts;
  }, [classList]);

  const totalAttendance = pagination.total;
  const totalPages = Math.max(1, pagination.totalPages || Math.ceil(totalAttendance / itemsPerPage));
  const paginatedAttendance = useMemo(() => {
    const combined = [...realtimeAttendances, ...liveAttendanceList];
    const unique = Array.from(new Map(combined.map((item) => [item.id || item.nis, item])).values());
    if (statusFilter === 'ALL') return unique;
    return unique.filter((item) => {
      const st = (item.status || '').toUpperCase();
      if (statusFilter === 'HADIR') return st === 'HADIR';
      if (statusFilter === 'TERLAMBAT') return st === 'TERLAMBAT';
      if (statusFilter === 'IZIN_SAKIT') return st === 'IZIN' || st === 'SAKIT';
      if (statusFilter === 'ALPHA') return st === 'ALPHA' || st === 'BELUM_ABSEN';
      return true;
    });
  }, [realtimeAttendances, liveAttendanceList, statusFilter]);

  const recentFaceFailures = useMemo(() => {
    const raw = countData?.recentFaceFailures || countData?.recent_face_failures || [];
    const combined = [...realtimeFailures, ...(Array.isArray(raw) ? raw : [])];
    return Array.from(new Map(combined.map((item) => [item.id, item])).values());
  }, [countData, realtimeFailures]);

  const getStatus = (statusStr: string) => {
    switch (statusStr) {
      case 'HADIR': return { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: 'CheckCircle2' };
      case 'TERLAMBAT': return { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: 'Clock' };
      case 'IZIN': return { badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20', icon: 'FileText' };
      case 'SAKIT': return { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: 'Heart' };
      default: return { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: 'XCircle' };
    }
  };

  const methodLabel = (m?: string) => {
    if (!m) return { label: 'MESIN FINGERPRINT', color: 'text-sky-400', icon: 'Fingerprint' };
    const upper = m.toUpperCase();
    if (upper.includes('FACE') || upper.includes('ISAPI')) return { label: 'SCAN WAJAH (ISAPI)', color: 'text-emerald-400', icon: 'ScanFace' };
    if (upper.includes('MANUAL') || upper.includes('WEB')) return { label: 'SISTEM WEB', color: 'text-purple-400', icon: 'Laptop' };
    return { label: 'MESIN FINGERPRINT', color: 'text-sky-400', icon: 'Fingerprint' };
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

  if (isInitialLoading) {
    return (
      <div className="bg-card rounded-3xl border border-border shadow-sm flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-border flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="px-6 py-3 border-b border-border flex items-center gap-4">
          <Skeleton className="h-9 w-48 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-3xl border border-border shadow-sm flex flex-col min-h-[500px]">
        {/* Feed Header */}
        <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 pb-1 border-b-2 font-black text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground/60 hover:text-foreground'
              }`}
            >
              <span>Aktivitas Absensi</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                  activeTab === 'attendance'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground/60'
                }`}
              >
                {totalAttendance}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('failures')}
              className={`flex items-center gap-2 pb-1 border-b-2 font-black text-sm tracking-wide transition-all cursor-pointer ${
                activeTab === 'failures'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground/60 hover:text-foreground'
              }`}
            >
              <span>Gagal Deteksi Wajah</span>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                  activeTab === 'failures'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground/60'
                }`}
              >
                {recentFaceFailures.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs transition-colors ${
                isWsConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              }`}
              title={isWsConnected ? 'WebSocket Real-time Terhubung' : 'Membuat Koneksi WebSocket...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isWsConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span>{isWsConnected ? 'WS Realtime' : 'WS Connecting...'}</span>
            </div>

            <Link
              href={activeTab === 'attendance' ? '/absensi' : '/log/error'}
              className="text-[10px] font-black uppercase text-primary hover:underline tracking-widest"
            >
              Lihat Semua →
            </Link>
          </div>
        </div>

        {activeTab === 'attendance' ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-3 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Icon
                  icon={isFetching ? 'mingcute:loading-fill' : 'Search'}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs ${
                    isFetching ? 'animate-spin text-primary' : ''
                  }`}
                />
                <Input
                  type="text"
                  placeholder="Cari nama / NIS..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 rounded-xl bg-background border-border text-xs font-medium h-9"
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <CustomSelect
                  value={selectedClass}
                  onChange={(val) => {
                    setSelectedClass(val);
                    setCurrentPage(1);
                  }}
                  options={classOptions}
                  placeholder="Semua Kelas"
                  className="w-40 shrink-0"
                  triggerClassName="h-9 font-bold text-xs rounded-xl bg-background border-border"
                />

                <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border shrink-0">
                  {[
                    { key: 'ALL', label: 'SEMUA' },
                    { key: 'HADIR', label: 'HADIR' },
                    { key: 'TERLAMBAT', label: 'LAMBAT' },
                    { key: 'IZIN_SAKIT', label: 'IZIN/SAKIT' },
                    { key: 'ALPHA', label: 'BELUM ABSEN' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      onClick={() => {
                        setStatusFilter(st.key);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === st.key
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto w-full flex-1 flex flex-col min-h-0 custom-scrollbar">
              <div className="min-w-[680px] flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-12 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-6 py-2.5 border-b border-border shrink-0">
                  <div className="col-span-4">SISWA</div>
                  <div className="col-span-3">KELAS / JURUSAN</div>
                  <div className="col-span-2">WAKTU</div>
                  <div className="col-span-2">METODE</div>
                  <div className="col-span-1 text-right">STATUS</div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/50">
                  {paginatedAttendance.map((item: any) => {
                    const st = getStatus(item.status);
                    const photo = getImageUrl(item.photoUrl);

                    return (
                      <div
                        key={item.id || item.nis}
                        onClick={() => setSelectedAttendance(item)}
                        className="grid grid-cols-12 items-center px-6 py-3 hover:bg-primary/5 transition-colors group cursor-pointer"
                      >
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <div
                            onClick={(e) => {
                              if (photo) {
                                e.stopPropagation();
                                setActivePreviewImage(photo);
                              }
                            }}
                            className={`w-8 h-8 rounded-xl overflow-hidden bg-muted border border-border shrink-0 transition-transform flex items-center justify-center shadow-inner ${
                              photo ? 'cursor-zoom-in hover:scale-110' : ''
                            }`}
                          >
                            {photo ? (
                              <img src={photo} alt={item.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center text-xs font-black ${avatarColor(item.studentName)}`}>
                                {item.studentName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {item.studentName}
                          </span>
                        </div>

                        <div className="col-span-3 min-w-0">
                          <p className="text-xs font-bold text-foreground/80 truncate">{item.className || '—'}</p>
                          <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-wider truncate">
                            {item.majorName || 'Belum ada kelas'}
                          </p>
                        </div>

                        <div className="col-span-2 flex flex-col justify-center min-w-0 font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black uppercase text-emerald-500">IN</span>
                            <span className="text-xs font-bold text-foreground/80">{formatTime(item.time)}</span>
                          </div>
                          {item.lastOutTime ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-rose-500">OUT</span>
                              <span className="text-xs font-bold text-foreground/80">{formatTime(item.lastOutTime)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black uppercase text-muted-foreground/40">OUT</span>
                              <span className="text-xs font-bold text-muted-foreground/40">-</span>
                            </div>
                          )}
                        </div>

                        <div className="col-span-2">
                          <div className="flex items-center gap-1.5">
                            <Icon icon={methodLabel(item.method).icon} className={`text-sm ${methodLabel(item.method).color}`} />
                            <span className={`text-[9px] font-black uppercase tracking-tight ${methodLabel(item.method).color}`}>
                              {methodLabel(item.method).label}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wide whitespace-nowrap border ${st.badge}`}>
                            {item.status === 'TERLAMBAT' ? 'Lambat' : item.status === 'ALPHA' ? 'Belum Absen' : item.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {paginatedAttendance.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 space-y-2">
                      <Icon icon="Clock" className="text-4xl mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest">Tidak ada data absensi sesuai filter</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-muted-foreground shrink-0">
              <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-2">
                <span>
                  Menampilkan {totalAttendance > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
                  {Math.min(currentPage * itemsPerPage, totalAttendance)} dari {totalAttendance} siswa
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CustomSelect
                  value={String(itemsPerPage)}
                  onChange={(val) => {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '10', label: '10 / hal' },
                    { value: '20', label: '20 / hal' },
                    { value: '50', label: '50 / hal' },
                  ]}
                  triggerClassName="h-8 font-bold text-xs rounded-xl bg-background border-border min-w-[95px]"
                />

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold"
                  >
                    «
                  </Button>
                  <span className="px-3 text-xs font-black text-foreground">
                    Hal {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold"
                  >
                    »
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
            {recentFaceFailures.length === 0 ? (
              <div className="text-center py-16 text-emerald-500/70 font-bold space-y-2">
                <Icon icon="ShieldCheck" className="text-4xl mx-auto" />
                <p className="text-xs uppercase tracking-widest">Aman · Tidak ada kegagalan verifikasi wajah</p>
              </div>
            ) : (
              recentFaceFailures.map((f: any) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFailure(f)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs cursor-pointer hover:bg-rose-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      onClick={(e) => {
                        const img = getImageUrl(f.image);
                        if (img) {
                          e.stopPropagation();
                          setActivePreviewImage(img);
                        }
                      }}
                      className={`w-10 h-10 rounded-xl overflow-hidden bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 ${
                        getImageUrl(f.image) ? 'cursor-zoom-in group-hover:scale-110 transition-transform' : ''
                      }`}
                    >
                      {f.image ? (
                        <img src={getImageUrl(f.image)} alt="Capture" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="UserX" className="text-rose-500 text-lg" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-rose-500 group-hover:underline">{f.identifier}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{f.message}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <span className="font-bold text-foreground block">{formatTime(f.timestamp)}</span>
                    <span className="text-muted-foreground">{f.gate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedAttendance && (
        <Dialog open={!!selectedAttendance} onOpenChange={() => setSelectedAttendance(null)}>
          <DialogContent className="sm:max-w-lg flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={() => {
                    const studentImg = getImageUrl(selectedAttendance.photoUrl);
                    if (studentImg) setActivePreviewImage(studentImg);
                  }}
                  className={`w-12 h-12 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center shadow-md ${
                    selectedAttendance.photoUrl ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                  }`}
                >
                  {selectedAttendance.photoUrl ? (
                    <img
                      src={getImageUrl(selectedAttendance.photoUrl)}
                      alt={selectedAttendance.studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-sm font-black ${avatarColor(selectedAttendance.studentName)}`}>
                      {selectedAttendance.studentName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-black text-foreground truncate">
                    {selectedAttendance.studentName}
                  </DialogTitle>
                  <p className="text-xs font-bold text-muted-foreground truncate mt-0.5">
                    {selectedAttendance.className || 'Belum ada kelas'} · {selectedAttendance.majorName || ''}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar text-xs">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  STATUS KEHADIRAN
                </span>
                <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${getStatus(selectedAttendance.status).badge}`}>
                  {selectedAttendance.status === 'TERLAMBAT' ? 'LAMBAT' : selectedAttendance.status}
                </div>
              </div>

              <div className="space-y-3 p-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="Clock" className="text-sm shrink-0" />
                    <span className="text-xs font-bold">Waktu Masuk</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{formatFull(selectedAttendance.time)}</span>
                </div>

                {selectedAttendance.lastOutTime && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon icon="Clock" className="text-sm shrink-0" />
                      <span className="text-xs font-bold">Waktu Pulang</span>
                    </div>
                    <span className="text-xs font-black text-foreground">{formatFull(selectedAttendance.lastOutTime)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon={methodLabel(selectedAttendance.method).icon} className={`text-sm shrink-0 ${methodLabel(selectedAttendance.method).color}`} />
                    <span className="text-xs font-bold">Metode</span>
                  </div>
                  <span className={`text-xs font-black ${methodLabel(selectedAttendance.method).color}`}>
                    {methodLabel(selectedAttendance.method).label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="School" className="text-sm shrink-0" />
                    <span className="text-xs font-bold">Kelas</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{selectedAttendance.className || '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="Landmark" className="text-sm shrink-0" />
                    <span className="text-xs font-bold">Jurusan</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{selectedAttendance.majorName || '—'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  DETAIL SCAN WAJAH & FOTO
                </h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {(selectedAttendance.logs && selectedAttendance.logs.length ? selectedAttendance.logs : [selectedAttendance]).map((log: any, idx: number) => {
                    const machinePhotoRaw = log.notes || log.image || log.photo || log.scanPhoto || selectedAttendance.machinePhoto;
                    const scanImg = getImageUrl(machinePhotoRaw);
                    return (
                      <div key={log.id || idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                        <div
                          className={`w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 relative flex items-center justify-center ${
                            scanImg ? 'cursor-zoom-in group shadow-sm' : ''
                          }`}
                          onClick={() => {
                            if (scanImg) setActivePreviewImage(scanImg);
                          }}
                        >
                          {scanImg ? (
                            <img
                              src={scanImg}
                              alt="Hasil Scan Wajah Mesin"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground/50 p-1 text-center">
                              <Icon icon="Camera" className="text-sm mb-0.5" />
                              <span className="text-[7px] font-bold uppercase leading-none">Tidak Ada Foto</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-foreground">{formatTime(log.timestamp || selectedAttendance.time)}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${getStatus(log.status || selectedAttendance.status).badge}`}>
                              {log.status === 'TERLAMBAT' ? 'LAMBAT' : (log.status || selectedAttendance.status)}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                            <Icon icon="MapPin" className="text-primary text-[10px] shrink-0" />
                            <span>{log.gate || selectedAttendance.gate || 'Gerbang Utama SMTI'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4 flex flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  const item = selectedAttendance;
                  setSelectedAttendance(null);
                  openStudentHistory(item);
                }}
                className="rounded-2xl font-bold flex-1 text-xs h-11 border-primary/40 text-primary hover:bg-primary/10 gap-2 cursor-pointer"
              >
                <Icon icon="Calendar" className="text-sm" />
                History Presensi Siswa
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedAttendance(null)}
                className="rounded-2xl font-bold flex-1 text-xs h-11 cursor-pointer"
              >
                Tutup
              </Button>
              <Link href="/absensi" onClick={() => setSelectedAttendance(null)} className="flex-1">
                <Button className="w-full rounded-2xl font-bold text-xs h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 cursor-pointer">
                  Lihat Semua Absensi
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedFailure && (
        <Dialog open={!!selectedFailure} onOpenChange={() => setSelectedFailure(null)}>
          <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 bg-rose-500/10 flex flex-row items-center justify-between border-b border-rose-500/20 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  onClick={() => {
                    const img = getImageUrl(selectedFailure.image);
                    if (img) setActivePreviewImage(img);
                  }}
                  className={`w-12 h-12 rounded-2xl overflow-hidden bg-card border border-rose-500/30 shrink-0 flex items-center justify-center shadow-inner ${
                    selectedFailure.image ? 'cursor-zoom-in hover:scale-105 transition-transform' : ''
                  }`}
                >
                  {selectedFailure.image ? (
                    <img
                      src={getImageUrl(selectedFailure.image)}
                      alt="Failed capture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-500/10 text-rose-500">
                      <Icon icon="UserX" className="text-xl" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-1 inline-block">
                    Gagal Deteksi Wajah
                  </span>
                  <DialogTitle className="text-base font-black text-rose-500 truncate">
                    {selectedFailure.identifier || 'STRANGER/UNKNOWN'}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-bold truncate">Token / NISN / Identitas</p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar text-xs">
              {selectedFailure.image && (
                <div
                  className="relative w-full h-44 rounded-2xl overflow-hidden bg-muted border border-border shadow-inner flex items-center justify-center group/img cursor-pointer"
                  onClick={() => {
                    const img = getImageUrl(selectedFailure.image);
                    if (img) setActivePreviewImage(img);
                  }}
                >
                  <img
                    src={getImageUrl(selectedFailure.image)}
                    alt="Captured Face"
                    className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                    <Icon icon="ZoomIn" className="text-base" /> Perbesar Foto
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Pesan Kejadian / Alasan
                  </p>
                  <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-foreground leading-relaxed">
                    {selectedFailure.message}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="MapPin" className="text-primary text-sm shrink-0" />
                    <span className="text-xs font-bold">Gerbang / Mesin</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{selectedFailure.gate || 'Gerbang Utama SMTI'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="Clock" className="text-sm shrink-0" />
                    <span className="text-xs font-bold">Waktu Kejadian</span>
                  </div>
                  <span className="text-xs font-black text-foreground">{formatFull(selectedFailure.timestamp)}</span>
                </div>

                {selectedFailure.ip && (
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon icon="Wifi" className="text-sm shrink-0" />
                      <span className="text-xs font-bold">IP Mesin / URL</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground/80">{selectedFailure.ip}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="KeyRound" className="text-sm shrink-0" />
                    <span className="text-xs font-bold">Tipe Aksi Log</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-500 uppercase">
                    {selectedFailure.action || 'FACE_RECOGNITION_FAILED'}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedFailure(null)}
                className="rounded-2xl font-bold flex-1 text-xs h-11"
              >
                Tutup
              </Button>
              <Link href="/log/error" onClick={() => setSelectedFailure(null)} className="flex-1">
                <Button className="w-full rounded-2xl font-bold text-xs h-11 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20">
                  Lihat Log Error
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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

      <StudentHistoryModal
        isOpen={showStudentHistoryModal}
        onClose={() => setShowStudentHistoryModal(false)}
        student={selectedStudentForHistory}
      />
    </>
  );
}
