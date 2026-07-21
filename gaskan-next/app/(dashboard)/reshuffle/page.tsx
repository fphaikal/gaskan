'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function ReshufflePage() {
  const [activeTab, setActiveTab] = useState<'website' | 'excel'>('website');
  const [classes, setClasses] = useState<any[]>([]);
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetRombel, setTargetRombel] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Excel State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Confirmation & Progress Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/classes').catch(() => api.get('/kelas'));
      const d = res?.data?.data || res?.data || [];
      setClasses(d);
      if (d.length > 0 && !sourceClassId) {
        setSourceClassId(d[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [sourceClassId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const fetchSourceStudents = useCallback(async (classId: string) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/students?classId=${classId}&limit=200`).catch(() => api.get(`/siswa?kelasId=${classId}`));
      setStudents(res?.data?.data || res?.data || []);
      setSelectedStudentIds([]);
    } catch (e) {
      toast.error('Gagal mengambil data siswa kelas asal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sourceClassId) fetchSourceStudents(sourceClassId);
  }, [sourceClassId, fetchSourceStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        (s.name || s.Nama || '').toLowerCase().includes(q) ||
        (s.nis || s.NIS || '').includes(q) ||
        (s.nisn || s.NISN || '').includes(q)
    );
  }, [students, searchQuery]);

  const isAllSelected = useMemo(() => {
    return filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length;
  }, [filteredStudents, selectedStudentIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => String(s.id)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Download Excel Reshuffle Template
  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Template_Reshuffle');
      ws.columns = [
        { header: 'NIS*', key: 'nis', width: 15 },
        { header: 'Nama Siswa', key: 'name', width: 25 },
        { header: 'Nama Kelas Tujuan*', key: 'targetClass', width: 20 },
        { header: 'Nomor Rombel (Opsional)', key: 'rombel', width: 20 },
      ];
      ws.addRow({ nis: '25101001', name: 'Ahmad Dahlan', targetClass: 'XI AK 1', rombel: '1' });
      ws.addRow({ nis: '25101002', name: 'Siti Sarah', targetClass: 'XI AK 1', rombel: '1' });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Template_Reshuffle_GASKAN.xlsx');
      toast.success('Template Excel Reshuffle berhasil diunduh');
    } catch (e) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  // Parse Excel File
  const handleExcelParse = async (file: File) => {
    setExcelFile(file);
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      const ws = workbook.worksheets[0];
      if (!ws || ws.rowCount < 2) {
        toast.error('File Excel kosong atau hanya header');
        return;
      }

      const rows: any[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const nis = String(row.getCell(1).value || '').trim();
        const name = String(row.getCell(2).value || '').trim();
        const targetClass = String(row.getCell(3).value || '').trim();
        const rombel = String(row.getCell(4).value || '').trim();

        if (nis && targetClass) {
          rows.push({ row: rowNumber, nis, name, targetClass, rombel, status: 'SIAP' });
        }
      });

      setExcelRows(rows);
      toast.success(`Ditemukan ${rows.length} baris instruksi pemindahan kelas`);
    } catch (e) {
      toast.error('Gagal membaca file Excel');
    }
  };

  const handleExecuteReshuffle = async () => {
    setIsProcessing(true);
    setShowConfirmModal(false);
    setShowProgressModal(true);
    setProgressPercent(10);

    try {
      if (activeTab === 'website') {
        setProgressPercent(50);
        await api.post('/classes/reshuffle', {
          sourceClassId,
          targetClassId,
          studentIds: selectedStudentIds,
          rombel: targetRombel,
        });
        setProgressPercent(100);
        toast.success(`Berhasil memindahkan ${selectedStudentIds.length} siswa!`);
        setSelectedStudentIds([]);
        await fetchSourceStudents(sourceClassId);
      } else {
        setProgressPercent(50);
        await api.post('/classes/reshuffle/batch', { rows: excelRows });
        setProgressPercent(100);
        toast.success(`Berhasil memproses pemindahan ${excelRows.length} siswa via Excel!`);
        setExcelRows([]);
        setExcelFile(null);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal memproses reshuffle kelas');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setShowProgressModal(false), 500);
    }
  };

  const selectedTargetClassName = useMemo(() => {
    const c = classes.find((item) => item.id === targetClassId);
    return c?.className || c?.nama_kelas || 'Kelas Tujuan';
  }, [classes, targetClassId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Reshuffle & Acak Kelas Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Pindahkan siswa antar kelas secara masal via antarmuka website atau file spreadsheet Excel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reshuffle/history">
            <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card border-border">
              <Icon icon="mingcute:history-line" className="text-base text-primary" /> Riwayat Audit Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-card p-1.5 rounded-2xl border border-border max-w-md">
        <button
          onClick={() => setActiveTab('website')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'website'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-black'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon icon="mingcute:web-line" className="text-base" /> Pilih via Website
        </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'excel'
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-black'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon icon="mingcute:file-export-line" className="text-base text-emerald-400" /> Pilih via Excel
        </button>
      </div>

      {/* TAB 1: WEBSITE RESHUFFLE */}
      {activeTab === 'website' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-sm">
              <label className="text-xs font-black uppercase text-primary tracking-wider">
                1. Kelas Asal
              </label>
              <CustomSelect
                options={classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas }))}
                value={sourceClassId}
                onChange={setSourceClassId}
                placeholder="Pilih Kelas Asal"
              />
            </div>

            <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-sm">
              <label className="text-xs font-black uppercase text-primary tracking-wider">
                2. Kelas Tujuan Baru
              </label>
              <CustomSelect
                options={classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas }))}
                value={targetClassId}
                onChange={setTargetClassId}
                placeholder="Pilih Kelas Tujuan"
              />
            </div>

            <div className="bg-card border border-border rounded-3xl p-5 space-y-3 shadow-sm">
              <label className="text-xs font-black uppercase text-primary tracking-wider">
                3. Nomor Rombel (Opsional)
              </label>
              <Input
                value={targetRombel}
                onChange={(e) => setTargetRombel(e.target.value)}
                placeholder="Contoh: 1, 2, atau A"
                className="h-11 rounded-2xl bg-muted/30 font-bold text-xs"
              />
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/20 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary cursor-pointer"
                />
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Pilih Siswa ({selectedStudentIds.length} / {filteredStudents.length} Terpilih)
                </span>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-xl text-xs bg-background"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {isLoading ? (
                <div className="p-12 text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-2">
                  <Icon icon="mingcute:loading-fill" className="animate-spin text-lg" /> Memuat daftar siswa...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-xs font-bold text-muted-foreground">
                  Tidak ada siswa yang ditemukan di kelas asal
                </div>
              ) : (
                filteredStudents.map((std) => {
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
                disabled={selectedStudentIds.length === 0 || !targetClassId}
                onClick={() => setShowConfirmModal(true)}
                className="rounded-2xl font-bold px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              >
                Pindahkan {selectedStudentIds.length} Siswa ke {selectedTargetClassName}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL RESHUFFLE */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) handleExcelParse(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-muted/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => e.target.files && handleExcelParse(e.target.files[0])}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Icon icon="mingcute:file-export-line" className="text-3xl" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">
                {excelFile ? `File: ${excelFile.name}` : 'Pilih atau Tarik File Excel Reshuffle'}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold max-w-sm">
                Unggah file .xlsx berisi NIS siswa dan Nama Kelas Tujuan untuk memindahkan kelas secara otomatis.
              </p>
            </div>

            <Button onClick={downloadTemplate} variant="outline" className="rounded-2xl gap-2 font-bold text-xs h-11 px-5">
              <Icon icon="mingcute:download-2-line" className="text-base text-emerald-500" />
              Unduh Template Excel Reshuffle Resmi
            </Button>
          </div>

          {/* Parsed Excel Rows */}
          {excelRows.length > 0 && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-muted/20 border-b border-border flex justify-between items-center">
                <span className="text-xs font-black text-primary uppercase tracking-wider">
                  Pratinjau ({excelRows.length} Instruksi Reshuffle)
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {excelRows.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 px-6 py-3 items-center text-xs font-bold">
                    <div className="col-span-1 text-muted-foreground font-mono">#{r.row}</div>
                    <div className="col-span-3 font-mono text-foreground">{r.nis}</div>
                    <div className="col-span-4 text-foreground">{r.name || 'Siswa'}</div>
                    <div className="col-span-4 text-primary text-right font-black">Ke: {r.targetClass}</div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
                <Button onClick={() => setShowConfirmModal(true)} className="rounded-2xl font-bold px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  Jalankan Reshuffle Excel Sekarang
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon icon="mingcute:transfer-4-line" className="text-3xl" />
          </div>
          <DialogHeader className="p-0 border-none bg-transparent">
            <DialogTitle className="text-2xl font-black text-foreground text-center">
              Konfirmasi Reshuffle Kelas
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed my-3">
            Apakah Anda yakin ingin memindahkan{' '}
            <span className="font-bold text-foreground">
              {activeTab === 'website' ? selectedStudentIds.length : excelRows.length} siswa
            </span>{' '}
            ke kelas tujuan? Tindakan ini akan memperbarui status kelas siswa di database.
          </p>
          <DialogFooter className="p-0 border-none bg-transparent gap-3 flex-row justify-center mt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setShowConfirmModal(false)}>
              Batal
            </Button>
            <Button className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20" disabled={isProcessing} onClick={handleExecuteReshuffle}>
              {isProcessing ? 'Memproses...' : 'Ya, Pindahkan Siswa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PROGRESS MODAL */}
      <Dialog open={showProgressModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm p-6 text-center">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin mx-auto mb-3" />
          <DialogHeader className="p-0 border-none bg-transparent">
            <DialogTitle className="text-xl font-black text-foreground text-center">
              Memproses Reshuffle Siswa...
            </DialogTitle>
          </DialogHeader>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden my-4">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-xs font-bold text-primary">{progressPercent}% Selesai</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
