'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function BulkUploadFotoPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<{ name: string; status: 'SUCCESS' | 'FAILED'; message: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles(filesArr);
      toast.success(`${filesArr.length} file foto terpilih`);
    }
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setProgress({ current: 0, total: selectedFiles.length });
    const logArr: { name: string; status: 'SUCCESS' | 'FAILED'; message: string }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const nisFromFilename = file.name.split('.')[0].trim();

      try {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('nis', nisFromFilename);

        await api.post(`/students/${nisFromFilename}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => api.post('/profile/upload', formData));

        logArr.push({ name: file.name, status: 'SUCCESS', message: `Foto NIS ${nisFromFilename} berhasil diunggah` });
      } catch (err) {
        logArr.push({ name: file.name, status: 'FAILED', message: `Gagal mengunggah foto ${file.name}` });
      }

      setProgress({ current: i + 1, total: selectedFiles.length });
      setLogs([...logArr]);
      await new Promise((res) => setTimeout(res, 100));
    }

    setIsUploading(false);
    toast.success('Proses unggah foto massal selesai');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Bulk Upload Foto Siswa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Unggah banyak foto sekaligus. Penamaan file harus sesuai dengan <span className="font-mono text-primary font-bold">NIS.jpg</span> (misal: <span className="font-mono text-primary font-bold">25101350.jpg</span>)
          </p>
        </div>
        <Link href="/siswa">
          <Button variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card border-border">
            <Icon icon="mingcute:arrow-left-line" className="text-base" /> Kembali ke Daftar Siswa
          </Button>
        </Link>
      </div>

      {/* Upload Zone */}
      <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              const filesArr = Array.from(e.dataTransfer.files);
              setSelectedFiles(filesArr);
              toast.success(`${filesArr.length} file foto terpilih`);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 bg-muted/20'
          }`}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4">
            <Icon icon="mingcute:pic-line" className="text-3xl" />
          </div>
          <h3 className="text-lg font-black text-foreground mb-1">
            {selectedFiles.length > 0 ? `${selectedFiles.length} File Foto Terpilih` : 'Pilih atau Tarik Banyak File Foto (.JPG / .PNG)'}
          </h3>
          <p className="text-xs text-muted-foreground font-semibold max-w-sm">
            Pastikan nama setiap file foto adalah angka NIS siswa.
          </p>
        </div>

        {selectedFiles.length > 0 && !isUploading && (
          <Button onClick={handleStartUpload} className="rounded-2xl font-bold px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            Mulai Unggah {selectedFiles.length} Foto
          </Button>
        )}
      </div>

      {/* Progress & Log Output */}
      {isUploading || logs.length > 0 ? (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Proses Mengunggah ({progress.current} / {progress.total})</span>
            <span className="text-primary">{Math.round((progress.current / Math.max(1, progress.total)) * 100)}%</span>
          </div>

          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }} />
          </div>

          <div className="h-56 bg-black/80 text-emerald-400 border border-border rounded-2xl p-4 overflow-y-auto font-mono text-[11px] space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon
                  icon={log.status === 'SUCCESS' ? 'mingcute:check-circle-fill' : 'mingcute:close-circle-fill'}
                  className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}
                />
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
