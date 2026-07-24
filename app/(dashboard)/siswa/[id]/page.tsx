'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentHistoryModal } from '@/components/dashboard/StudentHistoryModal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function StudentDetailPage() {
  const params = useParams();
  const idOrNis = params.id as string;
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState<boolean>(false);

  const fetchStudentDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/students/${idOrNis}`).catch(() => api.get(`/siswa/${idOrNis}`));
      if (res?.data) {
        setStudent(res.data.data || res.data);
      }
    } catch (e) {
      console.error('Failed to fetch student detail:', e);
    } finally {
      setIsLoading(false);
    }
  }, [idOrNis]);

  useEffect(() => {
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  const nama = student?.name || student?.Nama || 'Siswa';
  const nis = student?.nis || student?.NIS || idOrNis;
  const nisn = student?.nisn || '—';
  const kelas = student?.className || student?.Kelas || student?.class?.className || 'Siswa';
  const jurusan = student?.majorAlias || student?.majorName || student?.class?.major?.name || 'Umum';
  const photoUrl = getImageUrl(student?.photoUrl || student?.url_picture || student?.faceUrl);
  const faceUrl = getImageUrl(student?.faceUrl || student?.photoUrl || student?.url_picture);
  const statusStr = (student?.status || 'AKTIF').toUpperCase();
  const isAktif = statusStr === 'AKTIF';

  const birthPlace = student?.birthPlace || student?.TempatLahir || '';
  const birthDateRaw = student?.birthDate || student?.TanggalLahir || '';

  const ttlStr = useMemo(() => {
    const dateFormatted = birthDateRaw
      ? format(parseISO(birthDateRaw), 'd MMMM yyyy', { locale: localeId })
      : '';
    if (birthPlace && dateFormatted) return `${birthPlace}, ${dateFormatted}`;
    if (dateFormatted) return dateFormatted;
    if (birthPlace) return birthPlace;
    return 'Belum Diatur';
  }, [birthPlace, birthDateRaw]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat detail profil siswa...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-3xl">
          <Icon icon="mingcute:warning-fill" />
        </div>
        <h2 className="text-xl font-bold">Siswa Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">ID atau NIS siswa {idOrNis} tidak terdaftar di sistem.</p>
        <Link href="/siswa">
          <Button variant="outline" className="rounded-2xl text-xs font-bold gap-1.5">
            <Icon icon="mingcute:arrow-left-line" /> Kembali ke Daftar Siswa
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-12 animate-in fade-in duration-500">
      {/* Top Header Back Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/siswa">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs shadow-sm bg-card border-border">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Daftar Siswa
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setShowStudentHistoryModal(true)}
            className="rounded-2xl gap-2 font-bold text-xs shadow-md bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
          >
            <Icon icon="mingcute:calendar-2-fill" className="text-base" /> History & Kalender Presensi
          </Button>
          <Badge className={`text-xs font-bold px-3 py-1 ${isAktif ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-rose-500/15 text-rose-500 border-rose-500/30'}`}>
            {statusStr}
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-mono font-bold px-3 py-1">
            NIS: {nis}
          </Badge>
        </div>
      </div>

      {/* 2-Column Grid Layout matching Profile Card page 1-to-1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* ── LEFT COLUMN (2-SPAN) ── */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-5">
          {/* 1. Identity Card with Cover Banner & Circular Avatar */}
          <div className="overflow-hidden rounded-3xl bg-card border border-border shadow-sm">
            {/* Cover Banner */}
            <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
              <img
                src="/banner.webp"
                alt="Profile cover"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Avatar & Info Container */}
            <div className="px-5 pb-6 text-center relative">
              {/* Avatar Circle */}
              <div className="relative mx-auto -mt-12 sm:-mt-14 h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-card p-1 shadow-lg border-4 border-card z-10">
                <div className="relative h-full w-full mx-auto rounded-full overflow-hidden bg-muted">
                  {photoUrl ? (
                    <img src={photoUrl} alt={nama} className="h-full w-full object-cover object-center" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black bg-primary/20 text-primary">
                      {nama.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* User Identity Details */}
              <div className="mt-3 space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{nama}</h2>
                <p className="font-bold text-xs sm:text-sm text-muted-foreground">{kelas} • {jurusan}</p>
                <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
                  <div className="px-3.5 py-1 bg-muted/60 border border-border text-foreground rounded-full text-xs font-mono font-bold shadow-sm">
                    NIS: {nis} {nisn !== '—' && `• NISN: ${nisn}`}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStudentHistoryModal(true)}
                    className="rounded-full text-xs font-bold gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    <Icon icon="mingcute:calendar-2-fill" className="text-sm" /> History Presensi
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Info Card (Informasi Pribadi) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Informasi Pribadi Siswa
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* TTL */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:calendar-fill" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Tempat, Tanggal Lahir
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{ttlStr}</p>
                </div>
              </div>

              {/* Gender & Agama */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:user-info-fill" className="text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Gender / Agama
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {student?.gender === 'P' || student?.Gender === 'P' ? 'Perempuan' : 'Laki-Laki'} • {student?.religion || student?.Agama || 'Islam'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:mail-fill" className="text-lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Email
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{student?.email || student?.Email || 'Belum Diatur'}</p>
                </div>
              </div>

              {/* Alamat */}
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                  <Icon icon="mingcute:location-fill" className="text-lg" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                    Alamat
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">{student?.address || student?.Alamat || 'Belum Diatur'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (1-SPAN) ── */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-5">
          {/* 1. Contact Card (Kontak) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Kontak
              </h3>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-inner">
                <Icon icon="mingcute:phone-fill" className="text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  WhatsApp / Telp
                </p>
                <p className="text-sm font-bold text-foreground font-mono mt-0.5 truncate">
                  {student?.phone || student?.Nomor || 'Belum Diatur'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Vehicle Card (Kendaraan) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Kendaraan
              </h3>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 shadow-inner">
                <Icon icon="mingcute:car-fill" className="text-xl" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-0.5">
                  Plat Nomor
                </p>
                <div className="px-2.5 py-0.5 bg-muted/80 border border-border rounded-lg inline-block">
                  <span className="text-xs font-mono font-bold tracking-widest text-foreground">
                    {student?.vehiclePlate || student?.Plat_Nomor || '----'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Foto Absensi Card (Face Recognition) */}
          <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Foto Biometrik Absensi
              </h3>
              {faceUrl ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-bold px-2 py-0.5">
                  Terdaftar
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] font-bold px-2 py-0.5">
                  Belum Ada
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative w-28 h-36 mx-auto rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center shadow-inner">
                {faceUrl ? (
                  <img src={faceUrl} alt="Foto Wajah" className="h-full w-full object-cover object-center" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground/50 p-2 text-center">
                    <Icon icon="mingcute:face-fill" className="text-3xl mb-1 opacity-60" />
                    <p className="text-[10px] font-semibold">Belum ada foto</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StudentHistoryModal
        isOpen={showStudentHistoryModal}
        onClose={() => setShowStudentHistoryModal(false)}
        student={student}
      />
    </div>
  );
}
