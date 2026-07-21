'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';

export default function ReshufflePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [studentsInSource, setStudentsInSource] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.get('/classes').then((res) => {
      setClasses(res?.data?.data || res?.data || []);
    }).catch((e) => console.error(e)).finally(() => setIsLoading(false));
  }, []);

  const fetchSourceStudents = useCallback(async (classId: string) => {
    if (!classId) {
      setStudentsInSource([]);
      return;
    }
    try {
      const res = await api.get(`/students?classId=${classId}`).catch(() => api.get(`/siswa?kelasId=${classId}`));
      setStudentsInSource(res?.data?.data || res?.data || []);
      setSelectedStudentIds([]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (sourceClassId) fetchSourceStudents(sourceClassId);
  }, [sourceClassId, fetchSourceStudents]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === studentsInSource.length && studentsInSource.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(studentsInSource.map((s) => String(s.id)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleProcessReshuffle = async () => {
    if (!sourceClassId || !targetClassId) {
      toast.error('Pilih kelas asal dan kelas tujuan terlebih dahulu');
      return;
    }
    if (sourceClassId === targetClassId) {
      toast.error('Kelas asal dan kelas tujuan tidak boleh sama!');
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error('Pilih minimal 1 siswa yang akan dipindahkan');
      return;
    }

    setIsProcessing(true);
    try {
      await api.post('/classes/reshuffle', {
        sourceClassId,
        targetClassId,
        studentIds: selectedStudentIds,
      });
      toast.success(`${selectedStudentIds.length} siswa berhasil dipindahkan kelas!`);
      setSelectedStudentIds([]);
      await fetchSourceStudents(sourceClassId);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses pemindahan siswa');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Icon icon="mingcute:loading-fill" className="text-3xl text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat modul reshuffle kelas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Reshuffle & Pemindahan Kelas Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Pindahkan siswa secara masal dari satu kelas/rombel ke kelas tujuan yang baru
          </p>
        </div>
        <Link href="/kelas">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card border-border">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Manajemen Kelas
          </Button>
        </Link>
      </div>

      {/* Class Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-sm">
          <label className="text-xs font-black uppercase text-primary tracking-wider">
            1. Pilih Kelas Asal
          </label>
          <CustomSelect
            options={[
              { value: '', label: 'Pilih Kelas Asal' },
              ...classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas })),
            ]}
            value={sourceClassId}
            onChange={setSourceClassId}
            placeholder="Pilih Kelas Asal"
          />
        </div>

        <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-sm">
          <label className="text-xs font-black uppercase text-primary tracking-wider">
            2. Pilih Kelas Tujuan
          </label>
          <CustomSelect
            options={[
              { value: '', label: 'Pilih Kelas Tujuan' },
              ...classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas })),
            ]}
            value={targetClassId}
            onChange={setTargetClassId}
            placeholder="Pilih Kelas Tujuan"
          />
        </div>
      </div>

      {/* Student Selection List */}
      {sourceClassId && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedStudentIds.length === studentsInSource.length && studentsInSource.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-border text-primary cursor-pointer"
              />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Pilih Siswa ({selectedStudentIds.length} / {studentsInSource.length} Terpilih)
              </span>
            </div>
            {selectedStudentIds.length > 0 && (
              <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                {selectedStudentIds.length} Siswa Siap Dipindah
              </Badge>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {studentsInSource.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground font-bold">
                Tidak ada siswa terdaftar di kelas ini
              </div>
            ) : (
              studentsInSource.map((std) => {
                const sId = String(std.id);
                const isChecked = selectedStudentIds.includes(sId);
                return (
                  <div
                    key={sId}
                    onClick={() => toggleSelectStudent(sId)}
                    className={`px-6 py-3 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-border text-primary"
                      />
                      <span className="text-foreground">{std.name || std.Nama}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">NIS: {std.nis || std.NIS}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
            <Button
              disabled={isProcessing || selectedStudentIds.length === 0 || !targetClassId}
              onClick={handleProcessReshuffle}
              className="rounded-2xl font-bold px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isProcessing ? 'Memproses Pemindahan...' : `Pindahkan ${selectedStudentIds.length} Siswa ke Kelas Tujuan`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
