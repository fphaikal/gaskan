'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { goeyToast as toast } from 'goey-toast';
import { Icon } from '@/components/ui/icon';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import api, { extractErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { AcademicCalendarPageSkeleton } from '@/components/shared/PresencePageSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const typeOptions = [
  { value: 'EFEKTIF', label: 'Hari Efektif (Wajib)', color: '#10B981', badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
  { value: 'FAKULTATIF', label: 'Hari Fakultatif (Opsional)', color: '#38BDF8', badgeClass: 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400' },
  { value: 'LIBUR_NASIONAL', label: 'Libur Nasional (Tanggal Merah)', color: '#EF4444', badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' },
  { value: 'LIBUR_SEKOLAH', label: 'Libur Sekolah / Semester', color: '#F43F5E', badgeClass: 'bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400' },
  { value: 'UJIAN', label: 'Jadwal Ujian (Jam Pelajaran)', color: '#F59E0B', badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' },
  { value: 'KEGIATAN', label: 'Kegiatan / Upacara / Pensi', color: '#8B5CF6', badgeClass: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' },
];

const getTypeConfig = (type: string) => {
  return typeOptions.find((t) => t.value === type) || typeOptions[0];
};

const scopeOptions = [
  { value: 'GLOBAL', label: 'Semua (Global Sekolah)' },
  { value: 'MAJOR', label: 'Khusus Jurusan' },
  { value: 'CLASS', label: 'Khusus Kelas' },
];

export default function KalenderPage() {
  const { user } = useAuth();
  const userRole = (user?.role || 'siswa').toLowerCase();
  const isDev = userRole === 'developer';
  const isAdmin = userRole === 'admin' || isDev;
  const isGuru = userRole === 'guru';
  const canManage = isAdmin || isGuru;

  // View Mode: 'calendar' | 'table'
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // Data State
  const [events, setEvents] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScopeFilter, setActiveScopeFilter] = useState('ALL'); // ALL, GLOBAL, MAJOR, CLASS
  const [selectedMajorFilter, setSelectedMajorFilter] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Modal Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    startTime: '08:00',
    endTime: '10:00',
    type: 'EFEKTIF',
    scope: 'GLOBAL',
    majorId: '',
    classId: '',
    color: '#10B981',
  });

  // Fetch Academic Events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/academic-events').catch(() => api.get('/academic-events'));
      const data = res?.data?.data || res?.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching academic events:', err);
      toast.error(extractErrorMessage(err, 'Gagal memuat kalender akademik'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Majors & Classes for options
  const fetchMajorsAndClasses = useCallback(async () => {
    try {
      const [majorsRes, classesRes] = await Promise.allSettled([
        api.get('/dev/majors').catch(() => api.get('/majors')),
        api.get('/classes'),
      ]);
      if (majorsRes.status === 'fulfilled') {
        const d = majorsRes.value?.data?.data || majorsRes.value?.data || [];
        setMajors(Array.isArray(d) ? d : []);
      }
      if (classesRes.status === 'fulfilled') {
        const d = classesRes.value?.data?.data || classesRes.value?.data || [];
        setClasses(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Error fetching majors and classes:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchMajorsAndClasses();
  }, [fetchEvents, fetchMajorsAndClasses]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let list = events;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    if (activeScopeFilter !== 'ALL') {
      list = list.filter((e) => e.scope === activeScopeFilter);
    }

    if (selectedMajorFilter) {
      list = list.filter((e) => e.majorId === selectedMajorFilter || e.scope === 'GLOBAL');
    }

    if (selectedClassFilter) {
      list = list.filter((e) => e.classId === selectedClassFilter || e.scope === 'GLOBAL');
    }

    return list;
  }, [events, searchQuery, activeScopeFilter, selectedMajorFilter, selectedClassFilter]);

  // Stat Counters
  const stats = useMemo(() => {
    const all = filteredEvents;
    return {
      total: all.length,
      efektif: all.filter((e) => e.type === 'EFEKTIF').length,
      fakultatif: all.filter((e) => e.type === 'FAKULTATIF').length,
      libur: all.filter((e) => e.type === 'LIBUR_NASIONAL' || e.type === 'LIBUR_SEKOLAH').length,
      ujian: all.filter((e) => e.type === 'UJIAN').length,
    };
  }, [filteredEvents]);

  // Selected Date Events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const targetStr = format(selectedDate, 'yyyy-MM-dd');

    return filteredEvents.filter((event) => {
      const startStr = format(new Date(event.startDate), 'yyyy-MM-dd');
      const endStr = event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : startStr;
      return targetStr >= startStr && targetStr <= endStr;
    });
  }, [selectedDate, filteredEvents]);

  // Calendar Days Grid Generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Map events to day matrix
  const getEventsForDay = useCallback(
    (day: Date) => {
      const targetStr = format(day, 'yyyy-MM-dd');
      return filteredEvents.filter((event) => {
        const startStr = format(new Date(event.startDate), 'yyyy-MM-dd');
        const endStr = event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : startStr;
        return targetStr >= startStr && targetStr <= endStr;
      });
    },
    [filteredEvents]
  );

  // Form Handlers
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    const initialDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    setForm({
      title: '',
      description: '',
      startDate: initialDate,
      endDate: initialDate,
      startTime: '08:00',
      endTime: '10:00',
      type: 'EFEKTIF',
      scope: 'GLOBAL',
      majorId: '',
      classId: '',
      color: '#10B981',
    });
    setShowFormModal(true);
  };

  const openEditModal = (ev: any) => {
    setIsEditing(true);
    setEditingId(ev.id);
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      startDate: ev.startDate ? format(new Date(ev.startDate), 'yyyy-MM-dd') : '',
      endDate: ev.endDate ? format(new Date(ev.endDate), 'yyyy-MM-dd') : '',
      startTime: ev.startTime || '08:00',
      endTime: ev.endTime || '10:00',
      type: ev.type || 'EFEKTIF',
      scope: ev.scope || 'GLOBAL',
      majorId: ev.majorId || '',
      classId: ev.classId || '',
      color: ev.color || getTypeConfig(ev.type || 'EFEKTIF').color,
    });
    setShowFormModal(true);
  };

  const handleTypeChange = (newType: string) => {
    const cfg = getTypeConfig(newType);
    setForm((prev) => ({ ...prev, type: newType, color: cfg.color }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.startDate) {
      toast.error('Judul agenda dan tanggal mulai wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...form };
      if (isEditing && editingId) {
        await api.put(`/academic-events/${editingId}`, payload);
        toast.success('Agenda akademik berhasil diperbarui');
      } else {
        await api.post('/academic-events', payload);
        toast.success('Agenda akademik baru berhasil ditambahkan');
      }
      setShowFormModal(false);
      await fetchEvents();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Gagal menyimpan agenda akademik'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/academic-events/${deleteTargetId}`);
      toast.success('Agenda akademik berhasil dihapus');
      setDeleteTargetId(null);
      await fetchEvents();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Gagal menghapus agenda akademik'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && events.length === 0) {
    return <AcademicCalendarPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* PAGE HERO BANNER matching Nuxt 1-to-1 */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-xl shadow-amber-500/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-950 mb-3 border border-black/10">
            <Icon icon="CalendarDays" className="text-sm" />
            Kalender Akademik SMTI Yogyakarta
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">Pengaturan Agenda &amp; Jadwal Ujian</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-900/80 mt-2 leading-relaxed">
            Kelola hari efektif, hari fakultatif, libur sekolah, dan slot jam ujian pelajaran per kelas/jurusan dengan terpusat.
          </p>
        </div>

        {/* Quick Action & Counters */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {canManage && (
            <Button
              onClick={openCreateModal}
              className="bg-card hover:bg-card/90 text-foreground border-0 rounded-2xl font-black text-xs shadow-lg gap-2 h-11 px-5"
            >
              <Icon icon="Plus" className="text-base text-primary" />
              <span>+ Tambah Agenda Baru</span>
            </Button>
          )}
        </div>

        <div className="absolute -right-8 -bottom-12 opacity-10 pointer-events-none text-slate-950">
          <Icon icon="CalendarDays" className="text-[240px]" />
        </div>
      </div>

      {/* STATS ROW matching Nuxt 1-to-1 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Agenda</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-foreground">{stats.total}</span>
            <Icon icon="Calendar" className="text-xl text-muted-foreground/30" />
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Hari Efektif</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-500">{stats.efektif}</span>
            <Icon icon="CheckCircle2" className="text-xl text-emerald-500/30" />
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Fakultatif</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-sky-400">{stats.fakultatif}</span>
            <Icon icon="Star" className="text-xl text-sky-400/30" />
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Libur Resmi</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-500">{stats.libur}</span>
            <Icon icon="XCircle" className="text-xl text-rose-500/30" />
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Jadwal Ujian</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-500">{stats.ujian}</span>
            <Icon icon="Clock" className="text-xl text-amber-500/30" />
          </div>
        </div>
      </div>

      {/* WORKSPACE CONTROLS & TOOLBAR matching Nuxt 1-to-1 */}
      <div className="bg-card rounded-3xl p-4 border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Search & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative min-w-[200px] max-w-xs">
            <Icon icon="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari agenda / catatan..."
              className="pl-8 rounded-xl bg-muted/40 border-border text-xs font-medium h-9"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="CalendarDays" className="text-sm" />
              Tampilan Kalender
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="ListChecks" className="text-sm" />
              Daftar Tabel
            </button>
          </div>
        </div>

        {/* Right: Target Scope Pills & Class Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <div className="w-40">
              <CustomSelect
                options={[
                  { value: '', label: 'Semua Jurusan' },
                  ...majors.map((m) => ({ value: m.id, label: `${m.alias} (${m.name})` })),
                ]}
                value={selectedMajorFilter}
                onChange={setSelectedMajorFilter}
                placeholder="Semua Jurusan"
              />
            </div>
          )}

          {canManage && (
            <div className="w-40">
              <CustomSelect
                options={[
                  { value: '', label: 'Semua Kelas' },
                  ...classes.map((c) => ({ value: c.id, label: c.className })),
                ]}
                value={selectedClassFilter}
                onChange={setSelectedClassFilter}
                placeholder="Semua Kelas"
              />
            </div>
          )}

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border">
            {[
              { key: 'ALL', label: 'Semua Target' },
              { key: 'GLOBAL', label: 'Global' },
              { key: 'MAJOR', label: 'Jurusan' },
              { key: 'CLASS', label: 'Kelas' },
            ].map((sc) => (
              <button
                key={sc.key}
                onClick={() => setActiveScopeFilter(sc.key)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${
                  activeScopeFilter === sc.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Big Calendar Grid */}
          <div className="lg:col-span-8 bg-card rounded-3xl p-6 border border-border shadow-xs flex flex-col justify-between">
            {/* Month Navigation */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h2 className="text-lg font-black text-foreground capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="h-8 w-8 rounded-xl"
                >
                  <Icon icon="ChevronLeft" className="text-base" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                  className="h-8 rounded-xl text-xs font-bold px-3"
                >
                  Hari Ini
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="h-8 w-8 rounded-xl"
                >
                  <Icon icon="ChevronRight" className="text-base" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid Table */}
            <div className="w-full">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((dayName, i) => (
                  <div key={i} className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/60 py-1">
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, dIdx) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={dIdx}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-2xl border transition-all flex flex-col justify-between items-center text-left ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30'
                          : isTodayDate
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : isCurrentMonth
                          ? 'border-border/50 bg-card hover:bg-muted/30'
                          : 'border-transparent bg-muted/20 opacity-30'
                      }`}
                    >
                      <span
                        className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${
                          isTodayDate
                            ? 'bg-amber-500 text-slate-950'
                            : isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Event Dot Indicators */}
                      {dayEvents.length > 0 && (
                        <div className="flex items-center justify-center gap-1 flex-wrap w-full mt-1">
                          {dayEvents.slice(0, 3).map((ev: any, eIdx: number) => {
                            const cfg = getTypeConfig(ev.type);
                            return (
                              <span
                                key={eIdx}
                                className="w-2 h-2 rounded-full shadow-xs"
                                style={{ backgroundColor: ev.color || cfg.color }}
                                title={`${ev.title} (${cfg.label})`}
                              />
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-black text-muted-foreground">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend Bar matching Nuxt */}
            <div className="pt-4 border-t border-border mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
              <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-wider">
                Keterangan Warna Tipe Hari:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {typeOptions.map((t) => (
                  <div key={t.value} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: t.color }} />
                    <span className="text-muted-foreground font-semibold">{t.label.split('(')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Selected Date Agenda Details */}
          <div className="lg:col-span-4 bg-card rounded-3xl p-6 border border-border shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-black text-foreground">Agenda Tanggal Ini</h3>
                  <p className="text-xs text-muted-foreground font-bold">
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}
                  </p>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    onClick={openCreateModal}
                    className="rounded-xl text-xs font-bold gap-1 bg-primary text-primary-foreground shadow-sm h-8"
                  >
                    <Icon icon="Plus" className="text-sm" />
                    <span>Tambah</span>
                  </Button>
                )}
              </div>

              {/* Event Cards List */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {selectedDateEvents.map((ev) => {
                  const cfg = getTypeConfig(ev.type);

                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-muted/30 border border-border hover:border-primary/40 transition-all flex flex-col gap-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${cfg.badgeClass}`}>
                          {cfg.label.split('(')[0]}
                        </span>

                        {canManage && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(ev)}
                              className="h-7 w-7 text-amber-500 hover:bg-amber-500/10 rounded-xl"
                            >
                              <Icon icon="Edit2" className="text-xs" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTargetId(ev.id)}
                              className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                            >
                              <Icon icon="Trash2" className="text-xs" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-foreground leading-snug">{ev.title}</h4>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
                        {ev.startTime && (
                          <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            <Icon icon="Clock" className="text-xs" />
                            <span>
                              {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''} WIB
                            </span>
                          </div>
                        )}

                        {ev.scope === 'GLOBAL' && (
                          <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">🌐 Global Sekolah</span>
                        )}
                        {ev.scope === 'MAJOR' && (
                          <span className="text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-md">
                            🎓 {ev.major?.alias || 'Jurusan'}
                          </span>
                        )}
                        {ev.scope === 'CLASS' && (
                          <span className="text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            🏫 {ev.class?.className || 'Kelas'}
                          </span>
                        )}
                      </div>

                      {ev.description && (
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1 bg-card p-3 rounded-xl border border-border">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  );
                })}

                {selectedDateEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-2">
                    <Icon icon="Calendar" className="text-4xl" />
                    <p className="text-xs font-black uppercase tracking-widest mt-2 text-center">
                      Tidak ada agenda di tanggal ini
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DATATABLE VIEW matching Nuxt 1-to-1 */
        <div className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border text-left">
                  <th className="py-3.5 px-6">Agenda &amp; Catatan</th>
                  <th className="py-3.5 px-4">Tipe &amp; Impact Absensi</th>
                  <th className="py-3.5 px-4">Cakupan Target</th>
                  <th className="py-3.5 px-4">Tanggal &amp; Jam</th>
                  {canManage && <th className="py-3.5 px-6 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEvents.map((ev) => {
                  const cfg = getTypeConfig(ev.type);

                  return (
                    <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                      {/* Agenda Title & Description */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: ev.color || cfg.color }}
                          />
                          <div>
                            <p className="font-black text-sm text-foreground leading-tight">{ev.title}</p>
                            {ev.description && (
                              <p className="text-[11px] text-muted-foreground font-medium truncate max-w-md mt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Target Scope */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {ev.scope === 'GLOBAL' && (
                          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold">
                            Global Sekolah
                          </Badge>
                        )}
                        {ev.scope === 'MAJOR' && (
                          <Badge variant="outline" className="bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold">
                            Jurusan: {ev.major?.alias || '—'}
                          </Badge>
                        )}
                        {ev.scope === 'CLASS' && (
                          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold">
                            Kelas: {ev.class?.className || '—'}
                          </Badge>
                        )}
                      </td>

                      {/* Dates & Times */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-xs text-foreground">
                          {format(new Date(ev.startDate), 'd MMM yyyy', { locale: localeId })}
                          {ev.endDate && ` - ${format(new Date(ev.endDate), 'd MMM yyyy', { locale: localeId })}`}
                        </p>
                        {ev.startTime && (
                          <p className="text-[10px] font-bold text-amber-500 mt-0.5">
                            {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''} WIB
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(ev)}
                              className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 rounded-xl"
                            >
                              <Icon icon="Edit2" className="text-sm" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTargetId(ev.id)}
                              className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                            >
                              <Icon icon="Trash2" className="text-sm" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="text-center py-16 text-muted-foreground/40 space-y-2">
                      <Icon icon="Calendar" className="text-4xl mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest">Tidak ada data agenda akademik</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL FORM */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card">
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Icon icon="Edit3" className="text-amber-500 text-xl" />
              {isEditing ? 'Edit Agenda Akademik' : 'Tambah Agenda Akademik Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="title" className="mb-0">Judul Agenda</Label>
              </div>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Misal: Ujian Akhir Semester Teori / Hari Fakultatif Pensi"
                className="rounded-2xl bg-muted/30 font-bold h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Tipe Agenda</Label>
                </div>
                <CustomSelect
                  options={typeOptions.map((t) => ({ value: t.value, label: t.label }))}
                  value={form.type}
                  onChange={handleTypeChange}
                  placeholder="Pilih Tipe Agenda"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Cakupan (Scope)</Label>
                </div>
                <CustomSelect
                  options={scopeOptions}
                  value={form.scope}
                  onChange={(val) => setForm({ ...form, scope: val })}
                  placeholder="Pilih Scope"
                />
              </div>
            </div>

            {/* Target Major / Class Select */}
            {form.scope === 'MAJOR' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Pilih Jurusan</Label>
                </div>
                <CustomSelect
                  options={[
                    { value: '', label: '-- Pilih Jurusan --' },
                    ...majors.map((m) => ({ value: m.id, label: `${m.name} (${m.alias})` })),
                  ]}
                  value={form.majorId}
                  onChange={(val) => setForm({ ...form, majorId: val })}
                  placeholder="-- Pilih Jurusan --"
                />
              </div>
            )}

            {form.scope === 'CLASS' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="mb-0">Pilih Kelas</Label>
                </div>
                <CustomSelect
                  options={[
                    { value: '', label: '-- Pilih Kelas --' },
                    ...classes.map((c) => ({ value: c.id, label: c.className })),
                  ]}
                  value={form.classId}
                  onChange={(val) => setForm({ ...form, classId: val })}
                  placeholder="-- Pilih Kelas --"
                />
              </div>
            )}

            {/* Date & Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="startDate" className="mb-0">Tanggal Mulai</Label>
                </div>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="endDate" className="mb-0">Tanggal Selesai</Label>
                </div>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="startTime" className="mb-0">Jam Mulai (Opsional)</Label>
                </div>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="endTime" className="mb-0">Jam Selesai (Opsional)</Label>
                </div>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="rounded-2xl bg-muted/30 font-bold h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="description" className="mb-0">Deskripsi / Catatan Agenda</Label>
              </div>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Catatan tambahan untuk siswa/guru..."
                className="rounded-2xl bg-muted/30 font-medium text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
            <Button variant="ghost" className="rounded-2xl font-bold flex-1 text-xs" onClick={() => setShowFormModal(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-2xl font-bold flex-1 text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Agenda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetId && (
        <Dialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
          <DialogContent className="sm:max-w-md flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
            <div className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-1">
                <Icon icon="Trash2" className="text-2xl" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground text-center">Hapus Agenda Akademik?</DialogTitle>
              <p className="text-xs text-muted-foreground font-semibold">
                Apakah Anda yakin ingin menghapus agenda akademik ini secara permanen?
              </p>
            </div>
            <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card/90 backdrop-blur-md gap-3 sm:gap-4">
              <Button variant="ghost" className="rounded-2xl font-bold text-xs flex-1" onClick={() => setDeleteTargetId(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                className="rounded-2xl font-bold text-xs flex-1"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Agenda'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
