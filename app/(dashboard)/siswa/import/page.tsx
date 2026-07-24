'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function SiswaImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<number>(0); // 0: Upload, 1: Preview, 2: Success
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    api.get('/classes').then((res) => {
      // pre-fetch classes reference if needed
    }).catch((e) => console.error(e));
  }, []);

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template_Siswa');

      worksheet.columns = [
        { header: 'Nama Lengkap*', key: 'name', width: 25 },
        { header: 'NIS*', key: 'nis', width: 15 },
        { header: 'Nama Kelas*', key: 'className', width: 15 },
        { header: 'NISN (Opsional)', key: 'nisn', width: 15 },
        { header: 'Gender (L/P)', key: 'gender', width: 12 },
        { header: 'Nomor Telepon', key: 'phone', width: 18 },
      ];

      worksheet.addRow({ name: 'Ahmad Dahlan', nis: '25101001', className: 'X AK 1', nisn: '0051234567', gender: 'L', phone: '081234567890' });
      worksheet.addRow({ name: 'Siti Sarah', nis: '25101002', className: 'X AK 1', nisn: '0051234568', gender: 'P', phone: '081234567891' });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Template_Import_Siswa_GASKAN.xlsx');
      toast.success('Template Excel berhasil diunduh');
    } catch (e) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      parseFile(file);
    }
  };

  const parseFile = async (file: File) => {
    setSelectedFile(file);
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet || worksheet.rowCount < 2) {
        toast.error('File Excel kosong atau hanya berisi header');
        return;
      }

      const parsed: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const name = String(row.getCell(1).value || '').trim();
        const nis = String(row.getCell(2).value || '').trim();
        const className = String(row.getCell(3).value || '').trim();
        const nisn = String(row.getCell(4).value || '').trim();
        const gender = String(row.getCell(5).value || 'L').trim();
        const phone = String(row.getCell(6).value || '').trim();

        if (name && nis) {
          parsed.push({ row: rowNumber, name, nis, className, nisn, gender, phone, status: 'SIAP' });
        }
      });

      setPreviewData(parsed);
      setStep(1);
      toast.success(`Ditemukan ${parsed.length} calon data siswa`);
    } catch (err) {
      toast.error('Gagal membaca file Excel');
    }
  };

  const handleStartImport = async () => {
    if (previewData.length === 0) return;
    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      successCount = previewData.length;
    } catch (e) {
      // Fallback batch row by row
      for (const item of previewData) {
        try {
          await api.post('/students', {
            name: item.name,
            nis: item.nis,
            nisn: item.nisn,
            gender: item.gender,
            phone: item.phone,
            className: item.className,
          });
          successCount++;
        } catch (err) {
          failedCount++;
        }
      }
    } finally {
      setIsUploading(false);
      setUploadResult({ success: successCount, failed: failedCount });
      setStep(2);
      toast.success('Proses import data siswa selesai');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Import Massal Data Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Unggah file spreadsheet Excel (.xlsx) untuk menambahkan data siswa secara cepat
          </p>
        </div>
        <Link href="/siswa" className="w-full sm:w-auto">
          <Button variant="outline" className="h-11 w-full gap-2 rounded-2xl border-border bg-card text-xs font-bold sm:w-auto">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Daftar Siswa
          </Button>
        </Link>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-card p-2 shadow-xs sm:gap-3">
        <div className={`flex min-w-0 flex-col items-center gap-1 rounded-xl p-2 text-center text-[10px] font-bold min-[420px]:flex-row min-[420px]:gap-2 sm:p-3 sm:text-xs ${step === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
          <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center font-black">1</span>
          <span>Unggah File</span>
        </div>
        <div className={`flex min-w-0 flex-col items-center gap-1 rounded-xl p-2 text-center text-[10px] font-bold min-[420px]:flex-row min-[420px]:gap-2 sm:p-3 sm:text-xs ${step === 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
          <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center font-black">2</span>
          <span>Pratinjau Data</span>
        </div>
        <div className={`flex min-w-0 flex-col items-center gap-1 rounded-xl p-2 text-center text-[10px] font-bold min-[420px]:flex-row min-[420px]:gap-2 sm:p-3 sm:text-xs ${step === 2 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
          <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center font-black">3</span>
          <span>Selesai</span>
        </div>
      </div>

      {/* STEP 0: UPLOAD & TEMPLATE */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="space-y-6 rounded-3xl border border-border bg-card p-4 text-center shadow-sm sm:p-12">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 transition-all sm:p-10 ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-muted/20'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Icon icon="mingcute:file-export-line" className="text-3xl" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-1">
                Pilih atau Tarik File Excel Ke Sini
              </h3>
              <p className="text-xs text-muted-foreground font-semibold max-w-sm">
                Mendukung format file .xlsx dan .xls dengan batas maksimal 5.000 baris siswa per unggahan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={downloadTemplate} variant="outline" className="h-11 w-full gap-2 rounded-2xl px-5 text-xs font-bold sm:w-auto">
                <Icon icon="mingcute:download-2-line" className="text-base text-emerald-500" />
                Unduh Template Excel Resmi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: PREVIEW TABLE */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/20 p-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <p className="text-xs font-black text-primary uppercase tracking-wider">
                Pratinjau ({previewData.length} Calon Siswa)
              </p>
              <Button variant="outline" size="sm" onClick={() => setStep(0)} className="h-11 w-full rounded-xl text-xs font-bold min-[420px]:w-auto">
                Ganti File Excel
              </Button>
            </div>

            <p className="px-4 pt-3 text-[10px] font-bold text-muted-foreground md:hidden">Geser pratinjau ke samping untuk melihat semua kolom.</p>
            <div className="max-h-96 overflow-auto overscroll-contain">
              <div className="min-w-[680px] divide-y divide-border">
                {previewData.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center px-6 py-3 text-xs font-bold">
                  <div className="col-span-1 text-muted-foreground font-mono">#{item.row}</div>
                  <div className="col-span-4 text-foreground truncate">{item.name}</div>
                  <div className="col-span-2 font-mono text-muted-foreground">{item.nis}</div>
                  <div className="col-span-3 text-primary">{item.className || 'Pilih Nanti'}</div>
                  <div className="col-span-2 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black">
                      {item.status}
                    </span>
                  </div>
                </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border bg-muted/10 p-4 min-[420px]:grid-cols-2 sm:flex sm:justify-end sm:p-6">
              <Button variant="ghost" onClick={() => setStep(0)} className="h-11 w-full rounded-2xl font-bold sm:w-auto">
                Batal
              </Button>
              <Button
                disabled={isUploading}
                onClick={handleStartImport}
                className="h-11 w-full rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 sm:w-auto"
              >
                {isUploading ? 'Menyimpan Ke Database...' : 'Mulai Import Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: RESULT SUMMARY */}
      {step === 2 && (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-4 text-center shadow-sm sm:p-8">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto text-3xl">
            <Icon icon="mingcute:check-fill" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Import Siswa Selesai</h2>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              Proses import data siswa dari file Excel telah berhasil dilakukan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 bg-muted/30 border border-border rounded-2xl text-center">
              <p className="text-[10px] uppercase font-black text-muted-foreground">Berhasil</p>
              <p className="text-2xl font-black text-emerald-500">{uploadResult?.success || 0}</p>
            </div>
            <div className="p-4 bg-muted/30 border border-border rounded-2xl text-center">
              <p className="text-[10px] uppercase font-black text-muted-foreground">Gagal</p>
              <p className="text-2xl font-black text-rose-500">{uploadResult?.failed || 0}</p>
            </div>
          </div>

          <Link href="/siswa" className="block w-full">
            <Button className="h-11 w-full rounded-2xl bg-primary px-8 font-bold text-primary-foreground sm:w-auto">
              Lihat Direktori Siswa
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
