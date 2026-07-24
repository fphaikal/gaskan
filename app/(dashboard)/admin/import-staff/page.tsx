'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import ExcelJS from 'exceljs';

interface ParsedStaffRow {
  name: string;
  role: string;
  nis: string;
  email: string;
  status: 'READY' | 'ERROR';
  rowErrors: string[];
}

export default function ImportStaffPage() {
  const [step, setStep] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<ParsedStaffRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fatalError, setFatalError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcelFile = async (file: File) => {
    setValidating(true);
    setFatalError('');
    setErrors([]);
    setPreviewData([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
      }

      const rows: any[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const rowValues = (row.values as any[]).slice(1); // ExcelJS index 1-based
        rows.push(rowValues);
      });

      if (rows.length < 2) {
        throw new Error('File kosong atau hanya memiliki baris header.');
      }

      const headers = rows[0].map((h: any) => String(h || '').trim());
      const expected = ['Nama Lengkap*', 'Role (ADMIN/GURU)*', 'NIS (Username)*'];

      for (let i = 0; i < expected.length; i++) {
        if (headers[i] !== expected[i]) {
          throw new Error(
            `Format header salah pada kolom ${i + 1}. Ditemukan: "${headers[i] || 'Kosong'}", Seharusnya: "${expected[i]}".`
          );
        }
      }

      const parsedData: ParsedStaffRow[] = [];
      const localErrors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const name = String(row[0] || '').trim();
        const role = String(row[1] || '').trim().toUpperCase();
        const nis = String(row[2] || '').trim();
        const email = row[3] ? String(row[3]).trim() : '';

        if (!name && !role && !nis) continue;

        const rowErrors: string[] = [];
        if (!name) rowErrors.push('Nama wajib diisi');
        if (!role) rowErrors.push('Role wajib diisi');
        else if (role !== 'ADMIN' && role !== 'GURU') rowErrors.push('Role harus ADMIN atau GURU');
        if (!nis) rowErrors.push('NIS/Username wajib diisi');

        if (rowErrors.length > 0) {
          localErrors.push(...rowErrors.map((e) => `Baris ${i + 1}: ${e}`));
        }

        parsedData.push({
          name: name || '[KOSONG]',
          role: role || '-',
          nis,
          email,
          status: rowErrors.length > 0 ? 'ERROR' : 'READY',
          rowErrors,
        });
      }

      setErrors(localErrors);
      setPreviewData(parsedData);
      setStep(1);
    } catch (err: any) {
      setFatalError(err.message || 'Gagal membaca file Excel');
    } finally {
      setValidating(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await processExcelFile(file);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        await processExcelFile(file);
      } else {
        toast.error('File harus berupa Excel (.xlsx atau .xls)');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await api.post('/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data?.message || 'Berhasil mengimpor data staff');
      setStep(2);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mengimpor data staff');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedFile(null);
    setPreviewData([]);
    setErrors([]);
    setFatalError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template Staff');
      worksheet.addRow(['Nama Lengkap*', 'Role (ADMIN/GURU)*', 'NIS (Username)*', 'Email']);
      worksheet.addRow(['Budi Santoso', 'ADMIN', '1001', 'budi@smtijogja.sch.id']);
      worksheet.addRow(['Siti Rahma', 'GURU', '1002', 'siti@smtijogja.sch.id']);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Import_Staff.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Gagal mengunduh template Excel');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2.5 rounded-2xl bg-card border border-border hover:bg-muted/40 transition-all text-muted-foreground"
        >
          <Icon icon="mingcute:left-line" className="text-lg" />
        </Link>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30 shrink-0">
          <Icon icon="mingcute:upload-3-fill" className="text-xl" />
        </div>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-black tracking-tight text-foreground">
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Import</span> Staff (Admin & Guru)
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Unggah file Excel masal untuk mendaftarkan akun Admin dan Guru.
          </p>
        </div>
      </div>

      {/* Steps Progress Bar */}
      {step > 0 && (
        <div className="flex justify-center w-full my-4">
          <div className="flex items-center justify-between w-full max-w-sm relative">
            <div className="w-full flex justify-between z-10">
              {[
                { label: 'Upload', icon: 'mingcute:upload-2-fill' },
                { label: 'Validasi', icon: 'mingcute:check-2-fill' },
                { label: 'Selesai', icon: 'mingcute:flag-4-fill' },
              ].map((s, idx) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black transition-all ${
                      step >= idx
                        ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon icon={s.icon} className="text-base" />
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      step >= idx ? 'text-violet-500' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 0: Upload & Drag Drop Zone */}
      {step === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`lg:col-span-3 bg-card border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] transition-all ${
              isDragging
                ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
                : 'border-border bg-card hover:border-violet-500/40'
            }`}
          >
            {fatalError ? (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                  <Icon icon="mingcute:alert-line" className="text-2xl" />
                </div>
                <h3 className="text-base font-black text-foreground">Format File Tidak Sesuai</h3>
                <p className="text-xs text-rose-500 font-bold bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20">
                  {fatalError}
                </p>
                <Button onClick={reset} className="rounded-2xl font-bold text-xs bg-violet-600 text-white px-6">
                  Mulai Lagi
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
                  <Icon icon="mingcute:upload-2-fill" className="text-3xl" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {isDragging ? 'Lepaskan File Excel Staff' : 'Unggah File Staff Excel'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    Seret file .xlsx/.xls ke sini atau klik tombol di bawah.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={onFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={validating}
                  className="rounded-2xl font-black text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 h-11 shadow-md hover:shadow-lg transition-all"
                >
                  {validating ? 'Memvalidasi...' : 'Pilih File Excel'}
                </Button>
              </div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="lg:col-span-2 bg-card rounded-3xl p-6 border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Icon icon="mingcute:information-line" className="text-violet-500 text-lg" />
              Petunjuk Format Excel
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                Kolom 1: <strong className="text-foreground">Nama Lengkap*</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                Kolom 2: <strong className="text-foreground">Role (ADMIN / GURU)*</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                Kolom 3: <strong className="text-foreground">NIS (Username)*</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                Kolom 4: <strong className="text-foreground">Email (Opsional)</strong>
              </li>
            </ul>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full rounded-2xl font-bold text-xs gap-2 h-11 border-violet-500/30 text-violet-500 hover:bg-violet-500/10"
            >
              <Icon icon="mingcute:file-download-line" className="text-base" />
              Unduh Template Excel
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Preview & Validation */}
      {step === 1 && (
        <div className="space-y-6 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-black text-foreground">Preview & Validasi Data ({previewData.length} Baris)</h3>
              {errors.length > 0 ? (
                <p className="text-xs text-rose-500 font-bold mt-0.5">
                  Ditemukan {errors.length} kesalahan validasi. Harap perbaiki sebelum mengimpor.
                </p>
              ) : (
                <p className="text-xs text-emerald-500 font-bold mt-0.5">
                  Semua data valid dan siap diimpor ke sistem.
                </p>
              )}
            </div>

            <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-auto sm:items-center">
              <Button onClick={reset} variant="outline" className="h-11 w-full rounded-2xl text-xs font-bold">
                Batal / Upload Ulang
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || errors.length > 0}
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-xs font-black text-white shadow-md"
              >
                {importing ? 'Mengimpor...' : 'Impor Sekarang'}
              </Button>
            </div>
          </div>

          {/* Table Preview */}
          <p className="text-[10px] font-bold text-muted-foreground md:hidden">Geser tabel ke samping untuk memeriksa semua kolom.</p>
          <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-border">
            <table className="min-w-[720px] w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-black uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">Nama Staff</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Username / NIP</th>
                  <th className="p-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {previewData.map((row, i) => (
                  <tr key={i} className={row.status === 'ERROR' ? 'bg-rose-500/5' : ''}>
                    <td className="p-3">
                      {row.status === 'READY' ? (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px]">
                          READY
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 text-[10px]">
                          ERROR
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 font-bold text-foreground">{row.name}</td>
                    <td className="p-3">{row.role}</td>
                    <td className="p-3 font-mono">{row.nis}</td>
                    <td className="p-3 text-muted-foreground">{row.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 2: Success State */}
      {step === 2 && (
        <div className="mx-auto max-w-lg space-y-6 rounded-3xl border border-border bg-card p-4 text-center shadow-sm sm:p-10">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Icon icon="mingcute:check-circle-fill" className="text-4xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Import Staff Berhasil!</h2>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              Data Admin dan Guru telah berhasil didaftarkan ke sistem GASKAN.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 pt-2 min-[420px]:grid-cols-2">
            <Button onClick={reset} variant="outline" className="h-11 w-full rounded-2xl text-xs font-bold">
              Import File Lain
            </Button>
            <Link href="/admin" className="w-full">
              <Button className="h-11 w-full rounded-2xl bg-primary px-6 text-xs font-black text-primary-foreground">
                Kembali ke Manajemen User
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
