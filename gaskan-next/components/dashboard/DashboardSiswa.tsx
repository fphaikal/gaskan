'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DashboardSiswaProps {
  user: any;
}

const months = [
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

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  HADIR: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500', icon: 'mingcute:check-circle-fill', label: 'Hadir' },
  TERLAMBAT: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-500', icon: 'mingcute:time-fill', label: 'Terlambat' },
  IZIN: { color: 'text-sky-500', bg: 'bg-sky-500/10 border-sky-500/30 text-sky-500', icon: 'mingcute:document-fill', label: 'Izin' },
  SAKIT: { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30 text-orange-400', icon: 'mingcute:heart-fill', label: 'Sakit' },
  ALPHA: { color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-500', icon: 'mingcute:close-circle-fill', label: 'Alpha' },
};

const getStatus = (statusStr?: string) => statusConfig[statusStr || 'ALPHA'] || statusConfig.ALPHA;

const formatTime = (ts?: string) => {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
};

const formatDate = (dateObj: Date) => {
  return dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const DashboardSiswa: React.FC<DashboardSiswaProps> = ({ user }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const years = useMemo(() => [currentYear, currentYear - 1, currentYear - 2], [currentYear]);

  // Attendance data
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal Detail Log
  const [selectedDayLog, setSelectedDayLog] = useState<any>(null);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/my?month=${selectedMonth}&year=${selectedYear}`).catch(() =>
        api.get(`/absensi?month=${selectedMonth}&year=${selectedYear}`)
      );
      const d = res?.data?.data || res?.data;
      if (d) setAttendance(d);
    } catch (e) {
      console.error('Failed to fetch student attendance:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const summary = useMemo(() => {
    return (
      attendance?.summary || {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        total: 0,
      }
    );
  }, [attendance]);

  const todayStatus = useMemo(() => attendance?.today, [attendance]);

  const attendanceRate = useMemo(() => {
    const s = summary;
    if (!s.total) return 100;
    return Math.round(((s.hadir + s.terlambat) / s.total) * 100);
  }, [summary]);

  const groupedByDate = useMemo(() => {
    if (!attendance?.attendances) return [];
    const groups: Record<string, any[]> = {};
    attendance.attendances.forEach((att: any) => {
      const dateStr = att.timestamp.substring(0, 10);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(att);
    });

    return Object.keys(groups).map((dateStr) => {
      const atts = groups[dateStr];
      atts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const checkIn = atts[0];
      const checkOut = atts.length > 1 ? atts[atts.length - 1] : null;

      return {
        date: dateStr,
        status: checkIn.status,
        method: checkIn.method,
        checkInTime: checkIn.timestamp,
        checkOutTime: checkOut ? checkOut.timestamp : null,
        photoUrl: checkIn.notes || null,
        checkOutPhotoUrl: checkOut ? checkOut.notes : null,
        logs: atts.map((a) => ({
          id: a.id,
          timestamp: a.timestamp,
          status: a.status,
          method: a.method,
          notes: a.notes,
        })),
      };
    });
  }, [attendance]);

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const list: any[] = [];
    const grouped: Record<number, any> = {};

    groupedByDate.forEach((item) => {
      const d = new Date(item.date).getDate();
      grouped[d] = item;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(selectedYear, selectedMonth - 1, i);
      const dayOfWeek = currentDate.getDay();
      const isWeekendVal = dayOfWeek === 0 || dayOfWeek === 6;

      const compareDate = new Date(selectedYear, selectedMonth - 1, i);
      compareDate.setHours(0, 0, 0, 0);
      const isFuture = compareDate > today;
      const record = grouped[i];

      list.push({
        dayNum: i,
        dateObject: currentDate,
        isWeekend: isWeekendVal,
        isFuture,
        record: record || null,
      });
    }

    return list.reverse();
  }, [selectedYear, selectedMonth, groupedByDate]);

  const bentoCard = "bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center relative overflow-hidden";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {/* Profil Siswa (2x1) */}
      <div className={`${bentoCard} lg:col-span-2 bg-gradient-to-br from-primary/20 via-card to-background border-primary/20`}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/40 text-primary flex items-center justify-center shrink-0 shadow-inner">
            {user?.avatar || user?.url_picture ? (
              <img src={user.avatar || user.url_picture} alt={user?.name || user?.Nama} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black">{user?.name?.charAt(0) || user?.Nama?.charAt(0) || 'F'}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Halo, {user?.name?.split(' ')[0] || user?.Nama?.split(' ')[0] || 'Fahreza'}!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-1">
              Siswa Active · NIS: <span className="font-mono text-foreground font-bold">{user?.nis || user?.NIS || 'cmroebbnn003gt3v09at4618s'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Status Hari Ini (1x1) */}
      <div className={bentoCard}>
        <p className="text-muted-foreground font-bold mb-2 text-xs uppercase tracking-wider">Status Hari Ini</p>
        {loading ? (
          <div className="flex items-center gap-3">
            <Icon icon="mingcute:loading-fill" className="text-2xl text-primary animate-spin" />
          </div>
        ) : todayStatus ? (
          <div className={`flex items-center gap-3 ${getStatus(todayStatus.status).color}`}>
            <Icon icon={getStatus(todayStatus.status).icon} className="text-4xl" />
            <div>
              <span className="text-2xl font-black">{getStatus(todayStatus.status).label}</span>
              <p className="text-xs font-mono font-bold opacity-80">{formatTime(todayStatus.time)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground/40">
            <Icon icon="mingcute:time-line" className="text-4xl" />
            <span className="text-lg font-bold">Belum Absen</span>
          </div>
        )}
      </div>

      {/* Persentase Kehadiran (1x1) */}
      <div className={bentoCard}>
        <p className="text-muted-foreground font-bold mb-2 text-xs uppercase tracking-wider">Kehadiran Bulan Ini</p>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-black ${attendanceRate >= 80 ? 'text-emerald-500' : attendanceRate >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
            {attendanceRate}%
          </span>
          <span className="text-xs text-muted-foreground font-semibold pb-1">dari {summary.total || 1} hari</span>
        </div>
        <Progress value={attendanceRate} className="h-2.5 mt-3 bg-muted" />
      </div>

      {/* Rekap Absensi Bulan Ini (Full 4x1 span) */}
      <div className={`${bentoCard} lg:col-span-4`}>
        <p className="text-muted-foreground font-bold mb-4 text-xs uppercase tracking-wider">Rekap Absensi Bulan Ini</p>
        {loading ? (
          <div className="flex justify-center py-4">
            <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-emerald-500 mb-1">{summary.hadir}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">HADIR</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-amber-500 mb-1">{summary.terlambat}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">TERLAMBAT</p>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-sky-500 mb-1">{summary.izin}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">IZIN</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-orange-400 mb-1">{summary.sakit}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SAKIT</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-rose-500 mb-1">{summary.alpha}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ALPHA</p>
            </div>
          </div>
        )}
      </div>

      {/* Riwayat Kehadiran Bulanan (Full span) matching Nuxt 1-to-1 */}
      <div className={`${bentoCard} lg:col-span-4 flex flex-col min-h-0`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <p className="text-foreground font-black text-lg">Riwayat Kehadiran Bulanan</p>
            <p className="text-xs text-muted-foreground font-semibold">
              Lihat seluruh riwayat jam IN, OUT, beserta hasil foto tap absensi
            </p>
          </div>
          {/* Select Month & Year */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-9 rounded-xl bg-card border border-border px-3 font-bold text-xs"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-9 rounded-xl bg-card border border-border px-3 font-bold text-xs"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-wider border-b border-border">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Jam IN / Masuk (Foto)</th>
                  <th className="py-3 px-3 text-center">Jam OUT / Pulang (Foto)</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {calendarDays.map((day) => {
                  const st = day.record ? getStatus(day.record.status) : getStatus('ALPHA');

                  return (
                    <tr
                      key={day.dayNum}
                      className={`hover:bg-muted/30 transition-colors ${
                        day.isWeekend ? 'bg-muted/20' : ''
                      } ${day.isFuture ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                      {/* Tanggal */}
                      <td className="py-3 px-3 font-bold text-foreground">
                        {formatDate(day.dateObject)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {day.record ? (
                          <Badge className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${st.bg}`}>
                            <Icon icon={st.icon} className="mr-1 text-xs" />
                            {st.label}
                          </Badge>
                        ) : day.isWeekend ? (
                          <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                            Akhir Pekan
                          </span>
                        ) : day.isFuture ? (
                          <span className="text-[9px] font-black uppercase text-muted-foreground/30 tracking-widest">
                            Mendatang
                          </span>
                        ) : (
                          <Badge className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-rose-500/10 text-rose-500 border-rose-500/30">
                            <Icon icon="mingcute:close-circle-fill" className="mr-1 text-xs" />
                            Tanpa Absen
                          </Badge>
                        )}
                      </td>

                      {/* Jam IN */}
                      <td className="py-3 px-3 text-center">
                        {day.record ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-foreground">
                              {formatTime(day.record.checkInTime)}
                            </span>
                            {day.record.photoUrl && (
                              <div
                                onClick={() => setActivePreviewImage(day.record.photoUrl)}
                                className="w-8 h-8 rounded-lg overflow-hidden bg-muted border border-border shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              >
                                <img src={day.record.photoUrl} alt="IN" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>

                      {/* Jam OUT */}
                      <td className="py-3 px-3 text-center">
                        {day.record && day.record.checkOutTime ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-foreground">
                              {formatTime(day.record.checkOutTime)}
                            </span>
                            {day.record.checkOutPhotoUrl && (
                              <div
                                onClick={() => setActivePreviewImage(day.record.checkOutPhotoUrl)}
                                className="w-8 h-8 rounded-lg overflow-hidden bg-muted border border-border shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              >
                                <img src={day.record.checkOutPhotoUrl} alt="OUT" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-right">
                        {day.record ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDayLog(day)}
                            className="rounded-xl h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary px-2"
                          >
                            {day.record.logs.length} Log Tap
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
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

      {/* DETAIL LOG TAP MODAL */}
      {selectedDayLog && (
        <Dialog open={!!selectedDayLog} onOpenChange={() => setSelectedDayLog(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border border-border space-y-4">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-lg font-black text-foreground">
                Detail Log Tap Absensi
              </DialogTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                Tanggal: {formatDate(selectedDayLog.dateObject)}
              </p>
            </DialogHeader>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedDayLog.record?.logs?.map((log: any, idx: number) => (
                <div
                  key={log.id || idx}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border text-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-foreground">{formatTime(log.timestamp)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{log.method || 'FINGERPRINT / FACE'}</p>
                  </div>
                  <Badge className={`text-[9px] font-black uppercase border ${getStatus(log.status).bg}`}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedDayLog(null)}
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
};
