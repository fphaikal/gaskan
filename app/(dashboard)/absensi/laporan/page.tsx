'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { AttendanceReportPageSkeleton } from '@/components/shared/PresencePageSkeletons';

const statusStyle: Record<string, { short: string; bg: string; text: string }> = {
  HADIR: { short: 'H', bg: 'bg-emerald-500/20', text: 'text-emerald-500 font-black' },
  TERLAMBAT: { short: 'T', bg: 'bg-amber-500/20', text: 'text-amber-500 font-black' },
  IZIN: { short: 'I', bg: 'bg-sky-500/20', text: 'text-sky-400 font-black' },
  SAKIT: { short: 'S', bg: 'bg-orange-400/20', text: 'text-orange-400 font-black' },
  ALPHA: { short: 'A', bg: 'bg-rose-500/20', text: 'text-rose-500 font-black' },
};

export default function AbsensiLaporanPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [filters, setFilters] = useState({
    classId: '',
    semesterId: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });

  const [previewData, setPreviewData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classRes, semRes] = await Promise.all([
        api.get('/classes').catch(() => api.get('/kelas')),
        api.get('/semesters').catch(() => api.get('/semester')),
      ]);
      setClasses(classRes?.data?.data || classRes?.data || []);
      setSemesters(semRes?.data?.data || semRes?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handlePreview = async () => {
    setIsPreviewing(true);
    setPreviewData(null);
    setCurrentPage(1);
    try {
      const q = new URLSearchParams();
      if (filters.classId) q.set('classId', filters.classId);
      if (filters.semesterId) q.set('semesterId', filters.semesterId);
      if (filters.startDate) q.set('startDate', filters.startDate);
      if (filters.endDate) q.set('endDate', filters.endDate);

      const res = await api.get(`/attendance/preview?${q.toString()}`).catch(() => api.get('/attendance'));
      const d = res?.data?.data || res?.data;

      if (d && (d.rows || Array.isArray(d))) {
        if (Array.isArray(d)) {
          // Generate matrix preview from flat attendance data
          const dates = Array.from(new Set(d.map((x: any) => x.tanggal || x.date || filters.startDate))).sort();
          const studentMap: Record<string, any> = {};

          d.forEach((item: any, idx: number) => {
            const sId = item.siswa_id || item.studentId || item.user?.id || idx;
            if (!studentMap[sId]) {
              studentMap[sId] = {
                no: Object.keys(studentMap).length + 1,
                name: item.siswa?.nama || item.student?.name || item.user?.name || 'Siswa',
                className: item.siswa?.kelas?.nama_kelas || item.className || 'Kelas',
                cells: {},
                hadir: 0,
                terlambat: 0,
                izin: 0,
                sakit: 0,
                alpha: 0,
              };
            }
            const dateKey = item.tanggal || item.date || filters.startDate;
            const st = (item.status || 'HADIR').toUpperCase();
            studentMap[sId].cells[dateKey] = st;
            if (st === 'HADIR') studentMap[sId].hadir++;
            else if (st === 'TERLAMBAT') studentMap[sId].terlambat++;
            else if (st === 'IZIN') studentMap[sId].izin++;
            else if (st === 'SAKIT') studentMap[sId].sakit++;
            else if (st === 'ALPHA') studentMap[sId].alpha++;
          });

          setPreviewData({ dates, rows: Object.values(studentMap) });
        } else {
          setPreviewData(d);
        }
      } else {
        toast.error('Tidak ada data untuk filter yang dipilih');
      }
    } catch (e) {
      toast.error('Gagal memuat preview laporan');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExportExcel = async () => {
    if (!previewData || !previewData.rows) {
      toast.error('Jalankan Preview terlebih dahulu sebelum mengeksport Excel');
      return;
    }

    setIsExportingExcel(true);
    try {
      const dates: string[] = previewData.dates || [];
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Rekap Absensi');

      // SMTI Official Kop Surat
      ws.mergeCells('A1:K1');
      ws.getCell('A1').value = 'KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA';
      ws.getCell('A1').font = { size: 12, bold: true };
      ws.getCell('A1').alignment = { horizontal: 'center' };

      ws.mergeCells('A2:K2');
      ws.getCell('A2').value = 'SMK SMTI YOGYAKARTA';
      ws.getCell('A2').font = { size: 16, bold: true };
      ws.getCell('A2').alignment = { horizontal: 'center' };

      ws.mergeCells('A3:K3');
      ws.getCell('A3').value = 'Jl. Kusumanegara No.3, Semaki, Umbulharjo, Kota Yogyakarta, DIY 55166';
      ws.getCell('A3').font = { size: 10 };
      ws.getCell('A3').alignment = { horizontal: 'center' };

      ws.addRow([]);
      ws.mergeCells('A5:E5');
      ws.getCell('A5').value = `LAPORAN REKAPITULASI KEHADIRAN SISWA`;
      ws.getCell('A5').font = { size: 12, bold: true };

      ws.addRow([]);

      // Headers
      const headerRow = ['No', 'Nama Siswa', 'Kelas'];
      dates.forEach((d) => headerRow.push(d));
      headerRow.push('H', 'T', 'I', 'S', 'A');

      const rHead = ws.addRow(headerRow);
      rHead.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Data Rows
      previewData.rows.forEach((r: any) => {
        const row = [r.no, r.name, r.className];
        dates.forEach((d) => {
          const st = r.cells?.[d];
          row.push(st ? statusStyle[st]?.short || '' : '');
        });
        row.push(r.hadir, r.terlambat, r.izin, r.sakit, r.alpha);
        ws.addRow(row);
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Rekap_Absensi_SMTI_${filters.startDate}_sd_${filters.endDate}.xlsx`);
      toast.success('Laporan Rekap Excel resmi SMTI berhasil diunduh!');
    } catch (e) {
      toast.error('Gagal mengunduh Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const selectedClassName = useMemo(() => {
    const cls = classes.find((c) => c.id === filters.classId);
    return cls?.className || cls?.nama_kelas || 'Semua Kelas';
  }, [classes, filters.classId]);

  const paginatedRows = useMemo(() => {
    if (!previewData?.rows) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return previewData.rows.slice(start, start + itemsPerPage);
  }, [previewData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((previewData?.rows?.length || 0) / itemsPerPage);

  if (isLoading) {
    return <AttendanceReportPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header Card matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Laporan Rekapitulasi Absensi Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Preview matriks dan cetak rekap kehadiran resmi SMK SMTI Yogyakarta (.XLSX & .PDF)
          </p>
        </div>
      </div>

      {/* Filter Control Box matching Nuxt 1-to-1 */}
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground/60">Pilih Kelas</label>
            <CustomSelect
              options={[
                { value: '', label: 'Semua Kelas' },
                ...classes.map((c) => ({ value: c.id, label: c.className || c.nama_kelas })),
              ]}
              value={filters.classId}
              onChange={(val) => setFilters({ ...filters, classId: val })}
              placeholder="Semua Kelas"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground/60">Semester / Tahun Ajaran</label>
            <CustomSelect
              options={[
                { value: '', label: 'Semua Semester' },
                ...semesters.map((s) => ({ value: s.id, label: s.name || s.nama_semester })),
              ]}
              value={filters.semesterId}
              onChange={(val) => setFilters({ ...filters, semesterId: val })}
              placeholder="Semua Semester"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground/60">Tanggal Mulai</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground/60">Tanggal Selesai</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="rounded-2xl h-11 bg-muted/30 font-bold text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-3 pt-2">
          <Button
            onClick={handlePreview}
            disabled={isPreviewing}
            className="w-full sm:w-auto rounded-2xl font-bold px-6 bg-primary text-primary-foreground shadow-lg shadow-primary/20 h-11"
          >
            {isPreviewing ? (
              <Icon icon="mingcute:loading-fill" className="animate-spin text-base mr-2" />
            ) : (
              <Icon icon="mingcute:eye-2-line" className="text-base mr-2" />
            )}
            <span>Preview Matriks Laporan</span>
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={!previewData || isExportingExcel}
            className="w-full sm:w-auto rounded-2xl font-bold px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 h-11"
          >
            <Icon icon="mingcute:file-export-fill" className="text-base mr-2" />
            <span>Export Rekap Excel (.XLSX)</span>
          </Button>
        </div>
      </div>

      {/* Preview Matrix Table */}
      {previewData && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 sm:p-5 bg-muted/20 border-b border-border flex justify-between items-center">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                Preview Matriks Kehadiran Siswa — Kelas {selectedClassName}
              </h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Periode: {filters.startDate} s/d {filters.endDate} ({previewData.rows?.length || 0} Siswa)
              </p>
            </div>
          </div>

          <p id="attendance-report-scroll-hint" className="px-4 text-[10px] font-bold text-muted-foreground sm:hidden">
            Nama siswa tetap terlihat. Geser tabel ke samping untuk melihat seluruh tanggal dan total.
          </p>

          <div
            className="relative max-w-full overflow-x-auto overscroll-x-contain custom-scrollbar"
            aria-describedby="attendance-report-scroll-hint"
          >
            <table className="min-w-max w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="sticky left-0 z-20 w-12 min-w-12 bg-muted py-3 px-3 text-center">No</th>
                  <th className="sticky left-12 z-20 min-w-[180px] bg-muted py-3 px-4 text-left shadow-[8px_0_12px_-12px_rgba(15,23,42,0.7)]">
                    Nama Siswa
                  </th>
                  <th className="py-3 px-3 text-left">Kelas</th>
                  {previewData.dates?.map((d: string) => (
                    <th key={d} className="py-3 px-1 text-center font-mono w-8">
                      {d.slice(-2)}
                    </th>
                  ))}
                  <th className="py-3 px-2 text-center text-emerald-500">H</th>
                  <th className="py-3 px-2 text-center text-amber-500">T</th>
                  <th className="py-3 px-2 text-center text-sky-400">I</th>
                  <th className="py-3 px-2 text-center text-orange-400">S</th>
                  <th className="py-3 px-2 text-center text-rose-500">A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRows.map((r: any) => (
                  <tr key={r.no} className="group hover:bg-muted/30 font-bold">
                    <td className="sticky left-0 z-10 bg-card group-hover:bg-muted py-3 px-3 text-center text-muted-foreground/50 font-mono">
                      {r.no}
                    </td>
                    <td className="sticky left-12 z-10 max-w-[180px] bg-card group-hover:bg-muted py-3 px-4 text-foreground truncate shadow-[8px_0_12px_-12px_rgba(15,23,42,0.7)]">
                      {r.name}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{r.className}</td>
                    {previewData.dates?.map((d: string) => {
                      const code = r.cells?.[d];
                      const style = code ? statusStyle[code] : null;
                      return (
                        <td key={d} className="py-3 px-1 text-center font-mono">
                          {style ? (
                            <span className={`inline-block w-6 h-6 leading-6 rounded-md ${style.bg} ${style.text} text-[10px]`}>
                              {style.short}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/20">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-center font-mono text-emerald-500">{r.hadir}</td>
                    <td className="py-3 px-2 text-center font-mono text-amber-500">{r.terlambat}</td>
                    <td className="py-3 px-2 text-center font-mono text-sky-400">{r.izin}</td>
                    <td className="py-3 px-2 text-center font-mono text-orange-400">{r.sakit}</td>
                    <td className="py-3 px-2 text-center font-mono text-rose-500">{r.alpha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
