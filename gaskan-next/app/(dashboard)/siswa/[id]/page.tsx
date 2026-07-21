'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
        <h2 className="text-xl font-bold">Siswa tidak ditemukan</h2>
        <p className="text-xs text-muted-foreground">ID atau NIS siswa {idOrNis} tidak terdaftar di sistem.</p>
        <Link href="/siswa">
          <Button variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
            <Icon icon="mingcute:arrow-left-line" /> Kembali ke Daftar Siswa
          </Button>
        </Link>
      </div>
    );
  }

  const photoSrc = getImageUrl(student.photoUrl || student.url_picture || student.faceUrl);
  const stdName = student.name || student.Nama || 'Siswa';
  const stdNis = student.nis || student.NIS || idOrNis;
  const stdClass = student.className || student.Kelas || student.class?.className || '—';
  const stdMajor = student.majorAlias || student.majorName || student.class?.major?.name || '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Back Bar */}
      <div className="flex items-center justify-between">
        <Link href="/siswa">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Daftar Siswa
          </Button>
        </Link>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
          NIS: {stdNis}
        </Badge>
      </div>

      {/* Profile Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Photo & Main Info */}
        <div className="lg:col-span-1 bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted border border-border shadow-inner relative">
            {photoSrc ? (
              <img src={photoSrc} alt={stdName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-primary/20 text-primary">
                {stdName.charAt(0)}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">{stdName}</h2>
            <p className="text-xs font-bold text-muted-foreground">{stdClass}</p>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase mt-1">
              {stdMajor}
            </Badge>
          </div>

          <div className="w-full pt-4 border-t border-border space-y-2 text-xs font-semibold text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-bold">{student.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px] font-black">
                {student.status || 'AKTIF'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Details */}
        <div className="lg:col-span-2 bg-card rounded-3xl p-6 border border-border shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-3">
            Informasi Detail Siswa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Nomor Induk Siswa (NIS)
              </p>
              <p className="text-sm font-mono font-bold text-primary">{stdNis}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                NISN
              </p>
              <p className="text-sm font-mono font-bold text-foreground">{student.nisn || '—'}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                WhatsApp / Telp
              </p>
              <p className="text-sm font-mono font-bold text-foreground">{student.phone || student.Nomor || '—'}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Email
              </p>
              <p className="text-sm font-bold text-foreground">{student.email || student.Email || '—'}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Tempat, Tanggal Lahir
              </p>
              <p className="text-sm font-bold text-foreground">
                {student.birthPlace || student.TempatLahir || '—'}, {student.birthDate || student.TanggalLahir || '—'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Agama
              </p>
              <p className="text-sm font-bold text-foreground">{student.religion || student.Agama || 'Islam'}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Alamat Tempat Tinggal
              </p>
              <p className="text-sm font-bold text-foreground leading-relaxed">{student.address || student.Alamat || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
