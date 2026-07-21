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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const resolvePhoto = (url?: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

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
  const [excelTargetClassId, setExcelTargetClassId] = useState('');
  const [excelTemplateClassId, setExcelTemplateClassId] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Modals State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryList, setSummaryList] = useState<any[]>([]);
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
        (s.nisn || s.NISN || '').includes(q) ||
        (s.rombel || '').toLowerCase().includes(q)
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
        { header: 'No', key: 'no', width: 8 },
        { header: 'NIS', key: 'nis', width: 15 },
        { header: 'Nama', key: 'name', width: 25 },
        { header: 'Rombel', key: 'rombel', width: 15 },
      ];
      ws.addRow({ no: 1, nis: '25101350', name: 'Aafiyah Haniifah Nadhiir', rombel: '1' });
      ws.addRow({ no: 2, nis: '25101351', name: 'Adhimas Putra Susanto', rombel: '1' });

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
        const nis = String(row.getCell(2).value || row.getCell(1).value || '').trim();
        const name = String(row.getCell(3).value || '').trim();
        const rombel = String(row.getCell(4).value || '').trim();

        if (nis || name) {
          rows.push({ row: rowNumber, nis, name, rombel, status: 'SIAP' });
        }
      });

      setExcelRows(rows);
      toast.success(`Berhasil membaca ${rows.length} data siswa dari Excel`);
    } catch (e) {
      toast.error('Gagal membaca file Excel. Pastikan format .xlsx valid.');
    }
  };

  const openWebConfirm = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Pilih minimal 1 siswa yang akan dipindahkan');
      return;
    }
    if (!targetClassId) {
      toast.error('Harap pilih Kelas Tujuan terlebih dahulu');
      return;
    }
    setShowConfirmModal(true);
  };

  const openExcelConfirm = () => {
    if (excelRows.length === 0) {
      toast.error('Belum ada data Excel yang diunggah');
      return;
    }
    if (!excelTargetClassId) {
      toast.error('Harap pilih Kelas Tujuan terlebih dahulu');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteReshuffle = async () => {
    setIsProcessing(true);
    setShowConfirmModal(false);
    setShowProgressModal(true);
    setProgressPercent(25);

    try {
      if (activeTab === 'website') {
        setProgressPercent(60);
        await api.post('/classes/reshuffle', {
          sourceClassId,
          targetClassId,
          studentIds: selectedStudentIds,
          rombel: targetRombel,
        });

        const targetObj = classes.find((c) => c.id === targetClassId);
        const sourceObj = classes.find((c) => c.id === sourceClassId);
        const summary = selectedStudentIds.map((id) => {
          const st = students.find((s) => String(s.id) === id);
          return {
            nis: st?.nis || st?.NIS || '-',
            name: st?.name || st?.Nama || '-',
            fromClass: sourceObj?.className || 'Kelas Asal',
            toClass: targetObj?.className || 'Kelas Tujuan',
            rombel: targetRombel || '-',
          };
        });

        setProgressPercent(100);
        setSummaryList(summary);
        setSelectedStudentIds([]);
        await fetchSourceStudents(sourceClassId);
      } else {
        setProgressPercent(60);
        await api.post('/classes/reshuffle/batch', {
          targetClassId: excelTargetClassId,
          rows: excelRows,
        });

        const targetObj = classes.find((c) => c.id === excelTargetClassId);
        const summary = excelRows.map((r) => ({
          nis: r.nis,
          name: r.name || 'Siswa',
          fromClass: 'Kelas Asal',
          toClass: targetObj?.className || 'Kelas Tujuan',
          rombel: r.rombel || '-',
        }));

        setProgressPercent(100);
        setSummaryList(summary);
        setExcelRows([]);
        setExcelFile(null);
      }

      setTimeout(() => {
        setShowProgressModal(false);
        setShowSummaryModal(true);
      }, 400);
    } catch (e: any) {
      setShowProgressModal(false);
      toast.error(e?.response?.data?.message || 'Gagal memproses reshuffle siswa');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedTargetClassName = useMemo(() => {
    const targetId = activeTab === 'website' ? targetClassId : excelTargetClassId;
    const c = classes.find((item) => item.id === targetId);
    return c?.className || c?.nama_kelas || 'Kelas Tujuan';
  }, [classes, targetClassId, excelTargetClassId, activeTab]);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header Card matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 mb-1">
            <Link href="/kelas" className="hover:text-primary transition-colors">
              Manajemen Kelas
            </Link>
            <span>/</span>
            <span className="text-primary font-black">Reshuffle & Acak Kelas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Reshuffle & Penataan Kelas
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Pindahkan siswa antar kelas dan atur rombel (rombongan belajar) untuk persiapan tahun ajaran baru.
          </p>
        </div>

        {/* Tab Selection Toggle matching Nuxt */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 bg-muted/40 rounded-2xl border border-border shrink-0 gap-1.5 w-full sm:w-auto">
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
            <button
              onClick={() => setActiveTab('website')}
              className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'website'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="mingcute:cursor-hand-line" className="text-base" />
              <span>Pilih Langsung</span>
            </button>
            <button
              onClick={() => setActiveTab('excel')}
              className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === 'excel'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon icon="mingcute:file-import-fill" className="text-base" />
              <span>Import Excel</span>
            </button>
          </div>

          <Link
            href="/reshuffle/history"
            className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 text-sky-400 hover:text-white hover:bg-sky-500/20 border border-sky-500/20 w-full sm:w-auto shrink-0"
          >
            <Icon icon="mingcute:history-line" className="text-base" />
            <span>Riwayat Audit Log</span>
          </Link>
        </div>
      </div>

      {/* TAB 1: WEBSITE RESHUFFLE */}
      {activeTab === 'website' && (
        <div className="space-y-6">
          {/* Control Panel matching Nuxt */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Source Class Select */}
            <div className="md:col-span-4 bg-card p-5 rounded-3xl border border-border shadow-sm space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                <Icon icon="mingcute:logout-box-line" className="text-amber-500 text-base" />
                1. Pilih Kelas Asal
              </label>
              <CustomSelect
                options={classes.map((c) => ({
                  value: c.id,
                  label: `${c.className || c.nama_kelas} (${c._count?.students || c.studentCount || 0} siswa)`,
                }))}
                value={sourceClassId}
                onChange={setSourceClassId}
                placeholder="-- Pilih Kelas Asal --"
              />
            </div>

            {/* Target Class & Rombel */}
            <div className="md:col-span-8 bg-card p-5 rounded-3xl border border-border shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-6 space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Icon icon="mingcute:login-box-line" className="text-emerald-500 text-base" />
                  2. Pilih Kelas Tujuan
                </label>
                <CustomSelect
                  options={classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas }))}
                  value={targetClassId}
                  onChange={setTargetClassId}
                  placeholder="-- Pilih Kelas Tujuan --"
                />
              </div>

              <div className="sm:col-span-6 space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Icon icon="mingcute:group-fill" className="text-sky-500 text-base" />
                  Rombel Baru (Opsional)
                </label>
                <Input
                  value={targetRombel}
                  onChange={(e) => setTargetRombel(e.target.value)}
                  placeholder="Contoh: Rombel A / 1"
                  className="h-11 rounded-2xl bg-muted/30 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Student Selection Table matching Nuxt Screenshot 1-to-1 */}
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            {/* Search & Quick Selection Header matching screenshot */}
            <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary cursor-pointer"
                />
                <div>
                  <h3 className="font-black text-sm text-foreground">
                    Daftar Siswa ({selectedStudentIds.length}/{filteredStudents.length} Terpilih)
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Centang siswa yang akan dipindahkan ke kelas tujuan
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Icon icon="mingcute:search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm" />
                <Input
                  type="text"
                  placeholder="Cari nama, NIS, rombel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl text-xs font-semibold bg-background"
                />
              </div>
            </div>

            {/* Table View matching screenshot 1-to-1 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-[10px] uppercase tracking-wider font-black text-muted-foreground/60 border-b border-border">
                    <th className="w-12 text-center py-3">PILIH</th>
                    <th className="text-left py-3 px-4">SISWA</th>
                    <th className="text-center py-3 px-4">NIS / NISN</th>
                    <th className="text-center py-3 px-4">ROMBEL SAAT INI</th>
                    <th className="text-center py-3 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Icon icon="mingcute:loading-fill" className="text-2xl text-primary animate-spin mx-auto mb-2" />
                        <p className="font-bold">Memuat daftar siswa...</p>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground font-bold italic">
                        Tidak ada siswa aktif ditemukan di kelas asal ini.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const sId = String(s.id);
                      const isChecked = selectedStudentIds.includes(sId);
                      const photo = resolvePhoto(s.photoUrl || s.faceUrl);

                      return (
                        <tr
                          key={sId}
                          onClick={() => toggleSelectStudent(sId)}
                          className={`cursor-pointer transition-colors ${
                            isChecked ? 'bg-primary/10' : 'hover:bg-muted/30'
                          }`}
                        >
                          <td className="text-center py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectStudent(sId)}
                              className="w-4 h-4 rounded border-border text-primary cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-primary/10">
                                {photo ? (
                                  <img src={photo} alt={s.name || s.Nama} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{(s.name || s.Nama || 'S').charAt(0)}</span>
                                )}
                              </div>
                              <span className="font-bold text-foreground">{s.name || s.Nama}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 font-mono font-semibold text-muted-foreground">
                            {s.nis || s.NIS || s.nisn || '-'}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-[10px]">
                              {s.rombel || '1'}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-black text-[9px] uppercase">
                              {s.status || 'AKTIF'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating Action Footer matching Nuxt screenshot 1-to-1 */}
          {selectedStudentIds.length > 0 && (
            <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-card/95 backdrop-blur-xl border border-primary/30 p-3.5 sm:p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 z-50 animate-in slide-in-from-bottom duration-300">
              <div className="text-center sm:text-left">
                <p className="text-xs font-black text-foreground">
                  {selectedStudentIds.length} Siswa Terpilih
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Akan dipindahkan ke kelas yang dipilih
                </p>
              </div>

              <Button
                onClick={openWebConfirm}
                disabled={isProcessing}
                className="rounded-2xl font-black shadow-lg shadow-primary/30 px-6 gap-2 w-full sm:w-auto h-10 bg-primary text-primary-foreground"
              >
                {isProcessing ? (
                  <Icon icon="mingcute:loading-fill" className="animate-spin text-base" />
                ) : (
                  <Icon icon="mingcute:transfer-4-line" className="text-base" />
                )}
                <span>Proses Reshuffle Ke Kelas Tujuan</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXCEL RESHUFFLE */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-1">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase tracking-wider">
                <Icon icon="mingcute:download-3-fill" className="text-base" />
                Langkah 1: Unduh Template Excel Reshuffle
              </div>
              <h3 className="text-base font-black text-foreground">Unduh File Template Pre-Filled</h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Template 4 kolom (No, NIS, Nama, Rombel) berisi daftar siswa aktif yang siap Anda isi & edit.
              </p>
            </div>

            <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-auto flex-1">
                <CustomSelect
                  options={[
                    { value: '', label: '-- Semua Kelas --' },
                    ...classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas })),
                  ]}
                  value={excelTemplateClassId}
                  onChange={setExcelTemplateClassId}
                />
              </div>

              <Button
                onClick={downloadTemplate}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black text-xs h-10 px-5 shrink-0 gap-2 shadow-lg shadow-amber-500/20"
              >
                <Icon icon="mingcute:file-download-line" className="text-base" />
                <span>Unduh Template .XLSX</span>
              </Button>
            </div>
          </div>

          {/* Step 2: Upload Excel */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-wider">
                <Icon icon="mingcute:upload-3-fill" className="text-base" />
                Langkah 2: Pilih Kelas Tujuan & Unggah File Excel
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-muted-foreground shrink-0">Kelas Tujuan:</label>
                <div className="w-48">
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Pilih Kelas Tujuan --' },
                      ...classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas })),
                    ]}
                    value={excelTargetClassId}
                    onChange={setExcelTargetClassId}
                  />
                </div>
              </div>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) handleExcelParse(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50 bg-muted/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => e.target.files && handleExcelParse(e.target.files[0])}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <Icon icon="mingcute:upload-2-fill" className="text-3xl" />
                </div>
                <h4 className="font-black text-sm text-foreground">
                  {excelFile ? excelFile.name : 'Klik atau drag & drop file Excel reshuffle (.xlsx) di sini'}
                </h4>
                <p className="text-xs text-muted-foreground font-semibold">
                  Format 4 Kolom Terbaca: <strong>No</strong> (Absen), <strong>NIS</strong>, <strong>Nama</strong>, <strong>Rombel</strong>
                </p>
              </div>
            </div>

            {/* Parsed Excel Rows */}
            {excelRows.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-500 uppercase tracking-wider">
                    Pratinjau ({excelRows.length} Data Siswa dari Excel)
                  </span>
                  <Button
                    disabled={!excelTargetClassId}
                    onClick={openExcelConfirm}
                    className="rounded-2xl font-black bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 h-10 px-6 gap-2"
                  >
                    <Icon icon="mingcute:file-import-fill" className="text-base" />
                    <span>Jalankan Reshuffle Excel</span>
                  </Button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border border border-border rounded-2xl">
                  {excelRows.map((r, i) => (
                    <div key={i} className="grid grid-cols-12 px-6 py-3 items-center text-xs font-bold">
                      <div className="col-span-1 text-muted-foreground font-mono">#{r.row}</div>
                      <div className="col-span-3 font-mono text-foreground">{r.nis}</div>
                      <div className="col-span-4 text-foreground">{r.name || 'Siswa'}</div>
                      <div className="col-span-4 text-amber-500 text-right font-black">Ke: {selectedTargetClassName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONFIRMATION MODAL ═══ */}
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
            ke kelas <strong className="text-primary">"{selectedTargetClassName}"</strong>?
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

      {/* ═══ PROGRESS MODAL ═══ */}
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

      {/* ═══ SUMMARY MODAL ═══ */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden border-border bg-card rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 bg-card text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <Icon icon="mingcute:check-circle-fill" className="text-2xl" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground text-center">
              Reshuffle Berhasil! {summaryList.length} Siswa Dipindahkan
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-2 text-xs font-semibold">
            {summaryList.map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/30 border border-border rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-black text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">NIS: {item.nis}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">{item.fromClass}</span>
                  <span className="text-primary font-bold"> &rarr; {item.toClass}</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-border shrink-0 bg-card">
            <Button className="w-full rounded-2xl font-bold bg-primary text-primary-foreground" onClick={() => setShowSummaryModal(false)}>
              Tutup Ringkasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
