'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function FileExplorerPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [directories, setDirectories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dirFilter, setDirFilter] = useState('all');

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

      const res = await api.get(`/system/files?${params.toString()}`).catch(() => api.get('/system/log'));
      const d = res?.data?.data || res?.data;

      if (d) {
        setFiles(d.files || (Array.isArray(d) ? d : []));
        setTotal(d.total || files.length);
        if (d.directories) setDirectories(d.directories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, typeFilter, dirFilter]);

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

  const deleteFile = async () => {
    if (!selectedFile) return;
    setIsDeleting(true);
    try {
      await api.delete('/system/files', {
        data: { relativePath: selectedFile.relativePath, targets: { local: true } },
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Header Card matching Nuxt 1-to-1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
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
          <div className="w-40">
            <CustomSelect
              options={[
                { value: 'all', label: 'Semua Tipe' },
                { value: 'image', label: '🖼️ Gambar' },
                { value: 'document', label: '📄 Dokumen' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Tipe File"
            />
          </div>

          <div className="w-44">
            <CustomSelect
              options={[
                { value: 'all', label: 'Semua Direktori' },
                ...directories.map((d) => ({ value: d, label: d })),
              ]}
              value={dirFilter}
              onChange={setDirFilter}
              placeholder="Direktori"
            />
          </div>
        </div>
      </div>

      {/* Files Grid matching Nuxt 1-to-1 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
          <p className="text-xs font-bold">Memuat file explorer...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-16 text-center text-muted-foreground/40 space-y-3">
          <Icon icon="mingcute:folder-open-line" className="text-5xl mx-auto opacity-50" />
          <p className="font-bold text-base text-foreground">Tidak ada berkas ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file, idx) => {
            const isImg = file.mimeType?.startsWith('image/') || file.type === 'image';
            const url = getFileUrl(file.url || file.relativePath);

            return (
              <div
                key={idx}
                onClick={() => setSelectedFile(file)}
                className="bg-card border border-border hover:border-primary/50 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                {/* Thumbnail Preview */}
                <div className="w-full h-28 rounded-xl overflow-hidden bg-muted/40 border border-border flex items-center justify-center relative">
                  {isImg ? (
                    <img src={url} alt={file.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Icon icon="mingcute:file-fill" className="text-3xl text-primary/40" />
                  )}
                </div>

                <div className="mt-2.5 min-w-0">
                  <h4 className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                    {file.filename || file.name || file.relativePath?.split('/').pop()}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground font-mono">
                    <span>{formatFileSize(file.size)}</span>
                    <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0">
                      {file.dir || 'uploads'}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL DRAWER matching Nuxt 1-to-1 */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border-border space-y-4">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-lg font-black text-foreground truncate">
                {selectedFile.filename || selectedFile.name || 'Detail Berkas'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="w-full h-48 rounded-2xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
                {selectedFile.mimeType?.startsWith('image/') || selectedFile.type === 'image' ? (
                  <img src={getFileUrl(selectedFile.url || selectedFile.relativePath)} alt="Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <Icon icon="mingcute:file-fill" className="text-5xl text-primary/40" />
                )}
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground font-bold">Ukuran:</span>
                  <span className="text-foreground font-bold">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground font-bold">Path:</span>
                  <span className="text-foreground truncate max-w-[220px]">{selectedFile.relativePath || selectedFile.url}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(getFileUrl(selectedFile.url || selectedFile.relativePath))}
                className="flex-1 rounded-2xl font-bold text-xs"
              >
                Copy URL
              </Button>
              <Button
                variant="destructive"
                onClick={deleteFile}
                disabled={isDeleting}
                className="flex-1 rounded-2xl font-bold text-xs"
              >
                {isDeleting ? 'Hapus...' : 'Hapus Berkas'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
