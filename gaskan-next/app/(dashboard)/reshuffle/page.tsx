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
  const [excelTargetClassId, setExcelTargetClassId] = useState('');
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

        if (nis || name) {
          rows.push({ row: rowNumber, nis, name, targetClass, rombel, status: 'SIAP' });
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
    setProgressPercent(20);

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
          toClass: targetObj?.className || r.targetClass || 'Kelas Tujuan',
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
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
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

          {/* Student Selector Table */}
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
                  placeholder="Cari Nama / NIS / Rombel..."
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
                <div className="p-12 text-center text-xs font-bold text-muted-foreground/40 italic">
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
                      className={`px-6 py-3.5 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${
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
                        <span className="text-foreground text-sm font-black">{std.name || std.Nama}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="font-mono">NIS: {std.nis || std.NIS}</span>
                        {std.rombel && <Badge variant="outline" className="text-[10px] font-bold">{std.rombel}</Badge>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
              <Button
                disabled={selectedStudentIds.length === 0 || !targetClassId}
                onClick={openWebConfirm}
                className="rounded-2xl font-bold px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20 h-12"
              >
                <Icon icon="mingcute:transfer-4-line" className="text-base mr-2" />
                <span>Pindahkan {selectedStudentIds.length} Siswa ke {selectedTargetClassName}</span>
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
                isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50 bg-muted/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => e.target.files && handleExcelParse(e.target.files[0])}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Icon icon="mingcute:file-import-fill" className="text-3xl" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">
                {excelFile ? `File: ${excelFile.name}` : 'Pilih atau Tarik File Excel Reshuffle'}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold max-w-sm">
                Unggah file .xlsx berisi NIS siswa dan Nama Kelas Tujuan untuk memindahkan kelas secara otomatis.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={downloadTemplate} variant="outline" className="rounded-2xl gap-2 font-bold text-xs h-11 px-5 border-border">
                <Icon icon="mingcute:download-2-line" className="text-base text-amber-500" />
                Unduh Template Excel Reshuffle Resmi
              </Button>
            </div>
          </div>

          {/* Select Excel Target Class */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-2 shadow-sm">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground/60">
              Pilih Kelas Tujuan untuk Import Excel
            </label>
            <CustomSelect
              options={classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas }))}
              value={excelTargetClassId}
              onChange={setExcelTargetClassId}
              placeholder="-- Pilih Kelas Tujuan --"
            />
          </div>

          {/* Parsed Excel Rows */}
          {excelRows.length > 0 && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 bg-muted/20 border-b border-border flex justify-between items-center">
                <span className="text-xs font-black text-amber-500 uppercase tracking-wider">
                  Pratinjau ({excelRows.length} Data Siswa dari Excel)
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {excelRows.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 px-6 py-3 items-center text-xs font-bold">
                    <div className="col-span-1 text-muted-foreground font-mono">#{r.row}</div>
                    <div className="col-span-3 font-mono text-foreground">{r.nis}</div>
                    <div className="col-span-4 text-foreground">{r.name || 'Siswa'}</div>
                    <div className="col-span-4 text-amber-500 text-right font-black">Ke: {selectedTargetClassName}</div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
                <Button
                  disabled={!excelTargetClassId}
                  onClick={openExcelConfirm}
                  className="rounded-2xl font-bold px-8 bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 h-12"
                >
                  <Icon icon="mingcute:file-import-fill" className="text-base mr-2" />
                  <span>Jalankan Reshuffle Excel Sekarang</span>
                </Button>
              </div>
            </div>
          )}
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
