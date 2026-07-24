'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/components/ui/icon';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';
import { PaginationControls } from '@/components/shared/PaginationControls';
import {
  FileExplorerGridSkeleton,
  FileExplorerPageSkeleton,
} from '@/components/shared/SystemPageSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function FileExplorerPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [directories, setDirectories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dirFilter, setDirFilter] = useState('all');
  const [backupFilter, setBackupFilter] = useState('all');

  // Detail Modal & Delete State
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search.trim()) params.set('search', search.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (dirFilter !== 'all') params.set('dir', dirFilter);
      if (backupFilter !== 'all') params.set('backupStatus', backupFilter);

      const res = await api.get(`/system/files?${params.toString()}`).catch(() => api.get('/system/files'));
      const d = res?.data?.data || res?.data;

      if (d) {
        setFiles(d.files || (Array.isArray(d) ? d : []));
        setTotal(d.total || (d.files ? d.files.length : 0));
        if (d.directories) setDirectories(d.directories);
      }
    } catch (err) {
      console.error('Failed to fetch file explorer data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, typeFilter, dirFilter, backupFilter]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const copyToClipboard = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('URL berkas disalin ke clipboard!');
    } catch {
      toast.error('Gagal menyalin URL');
    }
  };

  const deleteFile = async (targets = { local: true, gdrive: false, hf: false }) => {
    if (!selectedFile) return;
    setIsDeleting(true);
    try {
      await api.delete('/system/files', {
        data: { relativePath: selectedFile.relativePath, targets },
      });
      toast.success('Berkas berhasil dihapus');
      setSelectedFile(null);
      await fetchFiles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus berkas');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getBackupBadge = (status?: string) => {
    switch (status) {
      case 'GD_AND_HF':
        return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[9px] font-black">GD + HF</Badge>;
      case 'GD_ONLY':
        return <Badge className="bg-sky-500/15 text-sky-500 border-sky-500/30 text-[9px] font-black">GDrive Only</Badge>;
      case 'HF_ONLY':
        return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] font-black">HF Only</Badge>;
      case 'PURGED':
        return <Badge className="bg-purple-500/15 text-purple-500 border-purple-500/30 text-[9px] font-black">Cloud Only (Purged)</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30 text-[9px] font-black">Lokal Only</Badge>;
    }
  };

  if (isLoading && files.length === 0) {
    return <FileExplorerPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header Card matching Nuxt 1-to-1 */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            File Explorer Server
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-black">DEVELOPER</Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            Penjelajah direktori penyimpanan foto scan wajah, berkas surat izin, dan dokumen server
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-muted/40 px-4 py-2.5 rounded-2xl border border-border">
          <Icon icon="mingcute:folder-open-fill" className="text-primary text-base" />
          <span>{total} Total Berkas</span>
        </div>
      </div>

      {/* Filter Control Bar matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="relative w-full max-w-sm flex-1">
          <Icon icon="mingcute:search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base" />
          <Input
            type="text"
            placeholder="Cari nama berkas / path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card font-bold border-border text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-36">
            <CustomSelect
              options={[
                { value: 'all', label: 'Semua Tipe' },
                { value: 'image', label: '🖼️ Gambar' },
                { value: 'doc', label: '📄 Dokumen' },
                { value: 'other', label: '📁 Berkas Lain' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Tipe File"
            />
          </div>

          <div className="w-44">
            <CustomSelect
              options={[
                { value: 'all', label: 'Semua Folder' },
                ...directories.map((d) => ({ value: d, label: `📁 /${d}` })),
              ]}
              value={dirFilter}
              onChange={setDirFilter}
              placeholder="Direktori"
            />
          </div>

          <div className="w-44">
            <CustomSelect
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'local_only', label: '💾 Only Lokal' },
                { value: 'gd', label: '☁️ Google Drive' },
                { value: 'hf', label: '🤗 HuggingFace' },
                { value: 'gd_and_hf', label: '✨ GD + HF' },
                { value: 'purged', label: '🔥 Purged' },
              ]}
              value={backupFilter}
              onChange={setBackupFilter}
              placeholder="Status Backup"
            />
          </div>
        </div>
      </div>

      {/* Grid List Berkas matching Nuxt 1-to-1 */}
      {isLoading ? (
        <FileExplorerGridSkeleton />
      ) : files.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center text-muted-foreground/40 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center">
            <Icon icon="mingcute:folder-open-line" className="text-3xl text-muted-foreground/50" />
          </div>
          <p className="font-bold text-base text-foreground">Tidak ada berkas ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file, idx) => {
            const isImg = file.isImage || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.fileName);
            const fileUrl = getFileUrl(file.localUrl || file.gdUrl || file.hfUrl);

            return (
              <div
                key={idx}
                onClick={() => setSelectedFile(file)}
                className="group relative flex min-w-0 cursor-pointer flex-col justify-between gap-3 overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Preview Thumbnail */}
                <div className="w-full aspect-square rounded-2xl bg-muted/40 border border-border overflow-hidden flex items-center justify-center relative group/img">
                  {isImg ? (
                    <img
                      src={fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Icon icon="mingcute:file-line" className="text-4xl text-muted-foreground/40" />
                  )}
                  <div className="absolute top-2 right-2">
                    {getBackupBadge(file.backupStatus)}
                  </div>
                </div>

                {/* File Info */}
                <div className="space-y-1 min-w-0">
                  <h3 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors" title={file.fileName}>
                    {file.fileName}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>{file.sizeFormatted || formatFileSize(file.sizeBytes)}</span>
                    <span className="capitalize">{file.directory || '.'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaginationControls
        currentPage={page}
        itemsPerPage={limit}
        totalItems={total}
        totalPages={Math.ceil(total / limit) || 1}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        isLoading={isLoading}
      />

      {/* DETAIL BERKAS & PREVIEW MODAL */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-xl">
            <DialogHeader className="flex shrink-0 flex-col gap-2 border-b border-border bg-card p-4 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:p-6 sm:pb-4">
              <DialogTitle className="flex min-w-0 items-center gap-2 break-words text-xl font-black text-foreground">
                <Icon icon="mingcute:file-line" className="text-primary text-2xl shrink-0" />
                <span className="truncate">{selectedFile.fileName}</span>
              </DialogTitle>
              {getBackupBadge(selectedFile.backupStatus)}
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {/* Preview Box */}
              <div className="flex max-h-[calc(100dvh-16rem)] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/40 p-2 sm:max-h-64">
                {selectedFile.isImage || /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedFile.fileName) ? (
                  <img
                    src={getFileUrl(selectedFile.localUrl || selectedFile.gdUrl || selectedFile.hfUrl)}
                    alt={selectedFile.fileName}
                    className="max-h-60 object-contain rounded-xl"
                  />
                ) : (
                  <div className="py-12 text-center text-muted-foreground/50 space-y-2">
                    <Icon icon="mingcute:file-line" className="text-5xl mx-auto" />
                    <p className="text-xs font-bold">Dokumen Server ({selectedFile.ext})</p>
                  </div>
                )}
              </div>

              {/* File Path & Attributes */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-muted/40 rounded-2xl border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest block">
                    Relative Path
                  </span>
                  <p className="font-mono text-xs font-bold text-foreground truncate select-all">
                    {selectedFile.relativePath}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <div className="p-3 bg-muted/40 rounded-2xl border border-border">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest block">
                      Ukuran Berkas
                    </span>
                    <p className="font-bold text-foreground mt-0.5">
                      {selectedFile.sizeFormatted || formatFileSize(selectedFile.sizeBytes)}
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-2xl border border-border">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest block">
                      Direktori Subfolder
                    </span>
                    <p className="font-bold text-foreground mt-0.5 capitalize">
                      {selectedFile.directory || 'Root Uploads'}
                    </p>
                  </div>
                </div>

                {/* Issuer Details if available */}
                {selectedFile.issuer && selectedFile.issuer.userName && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                        Konteks Berkas ({selectedFile.issuer.context || 'Pemilik'})
                      </span>
                      <p className="font-bold text-foreground mt-0.5">
                        {selectedFile.issuer.userName} ({selectedFile.issuer.userRole || 'SISWA'})
                      </p>
                    </div>
                    {selectedFile.issuer.userNis && (
                      <Badge variant="outline" className="text-xs font-mono font-bold">
                        NIS: {selectedFile.issuer.userNis}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(getFileUrl(selectedFile.localUrl || selectedFile.gdUrl || selectedFile.hfUrl))}
                className="flex-1 rounded-2xl font-bold text-xs h-11 border-border"
              >
                <Icon icon="mingcute:copy-2-line" className="mr-1.5 text-base" />
                Salin Direct URL
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteFile({ local: true, gdrive: false, hf: false })}
                disabled={isDeleting}
                className="rounded-2xl font-bold text-xs h-11 px-5"
              >
                <Icon icon="mingcute:delete-2-line" className="mr-1.5 text-base" />
                Hapus Berkas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
