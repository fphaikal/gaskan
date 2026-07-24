'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { goeyToast as toast } from 'goey-toast';
import { Icon } from '@/components/ui/icon';
import api, { extractErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CustomSelect } from '@/components/shared/CustomSelect';
import {
  LeaveCardsSkeleton,
  LeavePageSkeleton,
} from '@/components/shared/PresencePageSkeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.tierkun.my.id';

const getProofUrl = (proofUrl?: string) => {
  if (!proofUrl) return '';
  if (proofUrl.startsWith('http://') || proofUrl.startsWith('https://')) return proofUrl;
  return `${API_BASE}${proofUrl.startsWith('/') ? '' : '/'}${proofUrl}`;
};

export default function IzinPage() {
  const { user } = useAuth();
  const userRole = (user?.role || 'siswa').toLowerCase();
  const isSiswa = userRole === 'siswa';
  const isStaff = ['admin', 'guru', 'developer'].includes(userRole);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'IZIN',
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ status: '', reviewNote: '' });
  const [isReviewing, setIsReviewing] = useState(false);

  // Cancel Modal State
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Proof Lightbox State
  const [showProofModal, setShowProofModal] = useState(false);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSiswa) {
        // Fetch student's own leaves from /leaves/my
        const res = await api.get('/leaves/my');
        const data = res?.data?.data || res?.data || [];
        if (Array.isArray(data)) {
          setLeaves(data);
          const pending = data.filter((x: any) => (x.status || '').toUpperCase() === 'PENDING').length;
          const approved = data.filter((x: any) => ['APPROVED', 'DISETUJUI'].includes((x.status || '').toUpperCase())).length;
          const rejected = data.filter((x: any) => ['REJECTED', 'DITOLAK'].includes((x.status || '').toUpperCase())).length;
          setCounts({ pending, approved, rejected, total: data.length });
        }
      } else {
        // Staff view (Admin, Guru, Developer): fetch all leaves from /leaves
        const query = filterStatus ? `?status=${filterStatus}` : '';
        const res = await api.get(`/leaves${query}`);
        const data = res?.data?.data || res?.data || [];
        const resCounts = res?.data?.counts || res?.data?.summary;

        if (Array.isArray(data)) {
          setLeaves(data);
          if (resCounts) {
            setCounts(resCounts);
          } else {
            const pending = data.filter((x: any) => (x.status || '').toUpperCase() === 'PENDING').length;
            const approved = data.filter((x: any) => ['APPROVED', 'DISETUJUI'].includes((x.status || '').toUpperCase())).length;
            const rejected = data.filter((x: any) => ['REJECTED', 'DITOLAK'].includes((x.status || '').toUpperCase())).length;
            setCounts({ pending, approved, rejected, total: data.length });
          }
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch leaves:', e);
      toast.error(extractErrorMessage(e, 'Gagal memuat daftar permohonan izin'));
    } finally {
      setIsLoading(false);
    }
  }, [isSiswa, filterStatus]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter((f) => f.size <= 5 * 1024 * 1024);
      if (validFiles.length < filesArray.length) {
        toast.error('Ukuran file bukti maksimal 5MB per file');
      }
      setSelectedFiles(validFiles);
    }
  };

  const submitCreate = async () => {
    if (!createForm.reason.trim() || !createForm.startDate || !createForm.endDate) {
      toast.error('Lengkapi seluruh bidang alasan dan tanggal permohonan izin');
      return;
    }
    setIsSaving(true);
    try {
      // 1. Create Leave Record
      const res = await api.post('/leaves', {
        type: createForm.type,
        reason: createForm.reason,
        startDate: new Date(createForm.startDate).toISOString(),
        endDate: new Date(createForm.endDate).toISOString(),
      });

      const leaveId = res?.data?.data?.id || res?.data?.id;

      // 2. Upload Proof Files if any
      if (leaveId && selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('files', file));
        await api.post(`/leaves/${leaveId}/proofs`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success('Permohonan izin berhasil diajukan');
      setShowCreateModal(false);
      setCreateForm({ type: 'IZIN', reason: '', startDate: '', endDate: '' });
      setSelectedFiles([]);
      await fetchLeaves();
    } catch (e: any) {
      toast.error(extractErrorMessage(e, 'Gagal mengajukan permohonan izin'));
    } finally {
      setIsSaving(false);
    }
  };

  const openReview = (leave: any, status: string) => {
    setReviewTarget(leave);
    setReviewForm({ status, reviewNote: '' });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setIsReviewing(true);
    try {
      await api.put(`/leaves/${reviewTarget.id}/review`, reviewForm);
      toast.success(`Permohonan izin berhasil ${reviewForm.status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
      setShowReviewModal(false);
      setReviewTarget(null);
      await fetchLeaves();
    } catch (e: any) {
      toast.error(extractErrorMessage(e, 'Gagal mereview izin'));
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      await api.delete(`/leaves/${cancelTargetId}`);
      toast.success('Permohonan izin berhasil dibatalkan');
      setCancelTargetId(null);
      await fetchLeaves();
    } catch (e: any) {
      toast.error(extractErrorMessage(e, 'Gagal membatalkan permohonan izin'));
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (s?: string) => {
    const st = (s || 'PENDING').toUpperCase();
    switch (st) {
      case 'APPROVED':
      case 'DISETUJUI':
        return {
          label: 'Disetujui',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: 'mingcute:check-circle-fill',
          topBar: 'bg-emerald-500',
        };
      case 'REJECTED':
      case 'DITOLAK':
        return {
          label: 'Ditolak',
          bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          icon: 'mingcute:close-circle-fill',
          topBar: 'bg-rose-500',
        };
      default:
        return {
          label: 'Menunggu',
          bg: 'bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/30',
          icon: 'mingcute:time-fill',
          topBar: 'bg-amber-400',
        };
    }
  };

  if (isLoading && leaves.length === 0) {
    return <LeavePageSkeleton showStats={isStaff} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Area matching Nuxt 1-to-1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isSiswa ? 'Permohonan Izin Saya' : 'Review Surat Izin'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold mt-0.5">
            {isSiswa ? 'Ajukan dan pantau status izin Anda' : 'Kelola permohonan izin dari siswa'}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:flex-wrap">
          {isStaff && (
            <div className="w-full md:w-48">
              <CustomSelect
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'PENDING', label: 'Menunggu' },
                  { value: 'APPROVED', label: 'Disetujui' },
                  { value: 'REJECTED', label: 'Ditolak' },
                ]}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Semua Status"
              />
            </div>
          )}

          {isSiswa && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-11 w-full gap-2 rounded-2xl bg-amber-500 px-6 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 md:w-auto"
            >
              <Icon icon="mingcute:add-fill" className="text-base" />
              <span>Ajukan Izin</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stat Strip Cards (Staff View) matching Nuxt 1-to-1 */}
      {isStaff && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-3xl p-5 border border-border shadow-xs text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Total</p>
            <p className="text-3xl font-black text-foreground">{counts.total}</p>
          </div>
          <div className="bg-amber-400 rounded-3xl p-5 text-slate-950 text-center shadow-lg shadow-amber-400/20">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Menunggu</p>
            <p className="text-3xl font-black">{counts.pending}</p>
          </div>
          <div className="bg-emerald-500 rounded-3xl p-5 text-white text-center shadow-lg shadow-emerald-500/20">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Disetujui</p>
            <p className="text-3xl font-black">{counts.approved}</p>
          </div>
          <div className="bg-rose-500 rounded-3xl p-5 text-white text-center shadow-lg shadow-rose-500/20">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Ditolak</p>
            <p className="text-3xl font-black">{counts.rejected}</p>
          </div>
        </div>
      )}

      {/* Leave Feed Cards matching Nuxt 1-to-1 */}
      {isLoading ? (
        <LeaveCardsSkeleton />
      ) : leaves.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-3xl border border-dashed border-border bg-card px-4 py-14 text-center text-muted-foreground/40 sm:p-20">
          <Icon icon="mingcute:document-line" className="text-5xl" />
          <p className="text-sm font-black uppercase tracking-widest text-foreground">Belum ada permohonan izin</p>
          {isSiswa && <p className="text-xs font-bold">Klik &quot;Ajukan Izin&quot; untuk membuat permohonan baru</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pt-2">
            <div className="w-1 h-5 rounded-full bg-primary" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Daftar Riwayat Izin</h3>
          </div>

          <div className="space-y-4">
            {leaves.map((leave) => {
              const statusCfg = getStatusBadge(leave.status);
              const student = leave.student || leave.siswa || leave.user;
              const typeLabel = (leave.type || leave.jenis_izin || 'IZIN').toUpperCase() === 'SAKIT' ? '🤒 Sakit' : '📄 Izin';
              const isPending = (leave.status || '').toUpperCase() === 'PENDING';

              return (
                <div
                  key={leave.id}
                  className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden hover:shadow-md transition-all group"
                >
                  {/* Colored top bar */}
                  <div className={`h-1.5 ${statusCfg.topBar}`} />

                  <div className="flex flex-col gap-4 p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              typeLabel.includes('Sakit')
                                ? 'bg-orange-400/10 text-orange-400 border-orange-400/20'
                                : 'bg-sky-400/10 text-sky-400 border-sky-400/20'
                            }`}
                          >
                            {typeLabel}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${statusCfg.bg}`}
                          >
                            <Icon icon={statusCfg.icon} className="text-xs" />
                            {statusCfg.label}
                          </span>

                          {leave.proofs?.length > 0 && (
                            <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-muted text-muted-foreground border border-border">
                              📎 {leave.proofs.length} bukti
                            </span>
                          )}
                        </div>

                        {/* Student Name (Staff View) */}
                        {isStaff && student && (
                          <p className="mb-1 break-words text-lg font-black leading-tight text-foreground">
                            {student.name || student.nama}
                            <span className="mt-1 block break-words font-mono text-xs font-semibold text-muted-foreground sm:ml-2 sm:mt-0 sm:inline">
                              NIS: {student.nis || '-'} · Kelas: {student.class?.className || student.kelas?.nama_kelas || '-'}
                            </span>
                          </p>
                        )}

                        {/* Reason */}
                        <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                          {leave.reason || leave.alasan}
                        </p>

                        {/* Dates */}
                        <div className="flex flex-wrap gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <Icon icon="mingcute:calendar-2-fill" className="text-amber-500 text-sm" />
                            <span>
                              {formatDate(leave.startDate || leave.tanggal_mulai)} s/d{' '}
                              {formatDate(leave.endDate || leave.tanggal_selesai)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                            <Icon icon="mingcute:time-fill" className="text-xs" />
                            <span>Diajukan {formatDateTime(leave.createdAt || leave.created_at)}</span>
                          </div>
                        </div>

                        {/* Reviewer Note */}
                        {leave.reviewer && (
                          <div className="mt-3 p-3 bg-muted/40 rounded-2xl border border-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                              Catatan Reviewer
                            </p>
                            <p className="text-xs font-bold text-foreground">
                              {leave.reviewer.name}
                              {leave.reviewNote && ` - "${leave.reviewNote}"`}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (Staff Review) */}
                      {isStaff && isPending && (
                        <div className="flex w-full shrink-0 flex-col gap-2 min-[360px]:flex-row md:w-auto">
                          <Button
                            size="sm"
                            onClick={() => openReview(leave, 'APPROVED')}
                            className="h-11 flex-1 gap-1 rounded-2xl bg-emerald-500 px-4 text-xs font-black text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-400"
                          >
                            <Icon icon="mingcute:check-fill" className="text-sm" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openReview(leave, 'REJECTED')}
                            className="h-11 flex-1 gap-1 rounded-2xl bg-rose-500 px-4 text-xs font-black text-white shadow-sm shadow-rose-500/20 hover:bg-rose-400"
                          >
                            <Icon icon="mingcute:close-fill" className="text-sm" />
                            Tolak
                          </Button>
                        </div>
                      )}

                      {/* Siswa Cancel Option for PENDING leave */}
                      {isSiswa && isPending && (
                        <div className="w-full shrink-0 md:w-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelTargetId(leave.id)}
                            className="h-11 w-full gap-1 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 md:w-auto"
                          >
                            <Icon icon="mingcute:delete-2-fill" className="text-sm" />
                            Batalkan
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Proof Attachments */}
                    {leave.proofs?.length > 0 && (
                      <div className="flex gap-3 flex-wrap pt-3 border-t border-border">
                        {leave.proofs.map((proof: any, pIdx: number) => {
                          const url = getProofUrl(proof.url || proof.fileUrl);
                          return (
                            <button
                              key={pIdx}
                              onClick={() => {
                                setActiveProofUrl(url);
                                setShowProofModal(true);
                              }}
                              className="w-16 h-16 rounded-2xl overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
                            >
                              <img src={url} alt="Proof" className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           MODALS (CREATE, REVIEW, CANCEL, PROOF)
      ══════════════════════════════════════════════════ */}

      {/* 1. CREATE LEAVE MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
          <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Icon icon="mingcute:file-new-fill" className="text-primary text-2xl" />
              Ajukan Permohonan Izin
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="mb-0">Jenis Izin</Label>
              </div>
              <CustomSelect
                options={[
                  { value: 'IZIN', label: '📄 Izin' },
                  { value: 'SAKIT', label: '🤒 Sakit' },
                ]}
                value={createForm.type}
                onChange={(val) => setCreateForm({ ...createForm, type: val })}
                placeholder="Pilih Jenis"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="reason" className="mb-0">Alasan</Label>
              </div>
              <Textarea
                id="reason"
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                placeholder="Jelaskan alasan pengajuan izin..."
                className="rounded-2xl font-medium text-xs h-24 bg-muted/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="startDate" className="mb-0">Mulai</Label>
                </div>
                <Input
                  id="startDate"
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="rounded-2xl font-bold text-xs h-11 bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="endDate" className="mb-0">Selesai</Label>
                </div>
                <Input
                  id="endDate"
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  className="rounded-2xl font-bold text-xs h-11 bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="proofFiles" className="mb-0">Bukti Foto / Surat (Opsional)</Label>
              </div>
              <Input
                id="proofFiles"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="rounded-2xl text-xs bg-muted/30"
              />
              {selectedFiles.length > 0 && (
                <p className="text-[11px] text-muted-foreground font-semibold">
                  {selectedFiles.length} file bukti dipilih
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
            <Button variant="ghost" className="rounded-2xl font-bold flex-1 text-xs" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button
              onClick={submitCreate}
              disabled={isSaving}
              className="rounded-2xl font-bold flex-1 text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isSaving ? 'Mengirim...' : 'Kirim Permohonan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. REVIEW LEAVE MODAL */}
      {showReviewModal && reviewTarget && (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
            <DialogHeader className="shrink-0 border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
              <DialogTitle className="text-xl font-black text-foreground">
                Review Permohonan: {reviewTarget.student?.name || reviewTarget.siswa?.nama || 'Siswa'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-6">
              <p className="text-muted-foreground font-semibold">
                Memberikan verifikasi <strong className="text-foreground">{reviewForm.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}</strong> untuk surat izin ini.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="reviewNote" className="mb-0">Catatan Reviewer (Opsional)</Label>
                </div>
                <Textarea
                  id="reviewNote"
                  value={reviewForm.reviewNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                  placeholder="Tambahkan pesan catatan untuk siswa..."
                  className="rounded-2xl font-medium text-xs h-24 bg-muted/30"
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
              <Button variant="ghost" className="rounded-2xl font-bold flex-1 text-xs" onClick={() => setShowReviewModal(false)}>
                Batal
              </Button>
              <Button
                onClick={submitReview}
                disabled={isReviewing}
                className={`rounded-2xl font-bold flex-1 text-xs text-white ${
                  reviewForm.status === 'APPROVED' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'
                }`}
              >
                {isReviewing ? 'Memproses...' : reviewForm.status === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 3. CANCEL CONFIRMATION MODAL */}
      {cancelTargetId && (
        <Dialog open={!!cancelTargetId} onOpenChange={() => setCancelTargetId(null)}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-md">
            <div className="space-y-4 p-4 text-center sm:p-6">
              <div className="w-14 h-14 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-1">
                <Icon icon="mingcute:delete-2-fill" className="text-2xl" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground text-center">Batalkan Permohonan Izin?</DialogTitle>
              <p className="text-xs text-muted-foreground font-semibold">
                Permohonan izin yang dibatalkan tidak dapat dikembalikan.
              </p>
            </div>
            <DialogFooter className="shrink-0 gap-3 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:gap-4 sm:p-6 sm:pt-4">
              <Button variant="ghost" className="rounded-2xl font-bold text-xs flex-1" onClick={() => setCancelTargetId(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                className="rounded-2xl font-bold text-xs flex-1"
                disabled={isCancelling}
                onClick={handleCancelLeave}
              >
                {isCancelling ? 'Memproses...' : 'Ya, Batalkan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. PROOF LIGHTBOX MODAL */}
      {showProofModal && activeProofUrl && (
        <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border-border bg-card p-0 shadow-2xl sm:max-w-lg">
            <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-border bg-card p-4 pb-4 sm:p-6 sm:pb-4">
              <DialogTitle className="text-xl font-black text-foreground">Bukti Lampiran</DialogTitle>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-6">
              <img src={activeProofUrl} alt="Proof" className="max-h-[calc(100dvh-11rem)] w-full rounded-2xl object-contain" />
            </div>
            <DialogFooter className="shrink-0 border-t border-border bg-card/90 p-4 pt-4 backdrop-blur-md sm:p-6 sm:pt-4">
              <Button variant="ghost" className="rounded-2xl font-bold w-full text-xs" onClick={() => setShowProofModal(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
