'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ status: '', reviewNote: '' });
  const [isReviewing, setIsReviewing] = useState(false);

  // Proof Lightbox State
  const [showProofModal, setShowProofModal] = useState(false);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = filterStatus ? `?status=${filterStatus}` : '';
      const res = await api.get(`/leaves${query}`).catch(() => api.get(`/izin${query}`));
      const data = res?.data?.data || res?.data || [];
      const resCounts = res?.data?.counts || res?.data?.summary;

      if (Array.isArray(data)) {
        setLeaves(data);
        if (resCounts) {
          setCounts(resCounts);
        } else {
          // Compute counts from data
          const pending = data.filter((x: any) => (x.status || '').toUpperCase() === 'PENDING').length;
          const approved = data.filter((x: any) => ['APPROVED', 'DISETUJUI'].includes((x.status || '').toUpperCase())).length;
          const rejected = data.filter((x: any) => ['REJECTED', 'DITOLAK'].includes((x.status || '').toUpperCase())).length;
          setCounts({ pending, approved, rejected, total: data.length });
        }
      }
    } catch (e) {
      console.error('Failed to fetch leaves:', e);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const submitCreate = async () => {
    if (!createForm.reason.trim() || !createForm.startDate || !createForm.endDate) {
      toast.error('Lengkapi seluruh bidang alasan dan tanggal permohonan izin');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/leaves', {
        type: createForm.type,
        reason: createForm.reason,
        startDate: new Date(createForm.startDate).toISOString(),
        endDate: new Date(createForm.endDate).toISOString(),
      }).catch(() =>
        api.post('/izin', {
          type: createForm.type,
          reason: createForm.reason,
          startDate: createForm.startDate,
          endDate: createForm.endDate,
        })
      );

      toast.success('Permohonan izin berhasil diajukan');
      setShowCreateModal(false);
      setCreateForm({ type: 'IZIN', reason: '', startDate: '', endDate: '' });
      await fetchLeaves();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mengajukan permohonan izin');
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
      await api.put(`/leaves/${reviewTarget.id}/review`, reviewForm).catch(() =>
        api.put(`/izin/${reviewTarget.id}/review`, reviewForm)
      );

      toast.success(`Permohonan izin berhasil ${reviewForm.status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
      setShowReviewModal(false);
      setReviewTarget(null);
      await fetchLeaves();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal mereview izin');
    } finally {
      setIsReviewing(false);
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
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
          icon: 'mingcute:check-circle-fill',
          topBar: 'bg-emerald-500',
        };
      case 'REJECTED':
      case 'DITOLAK':
        return {
          label: 'Ditolak',
          bg: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
          icon: 'mingcute:close-circle-fill',
          topBar: 'bg-rose-500',
        };
      default:
        return {
          label: 'Menunggu',
          bg: 'bg-amber-400/10 text-amber-500 border-amber-400/30',
          icon: 'mingcute:time-fill',
          topBar: 'bg-amber-400',
        };
    }
  };

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

        <div className="flex gap-3 items-center flex-wrap">
          {isStaff && (
            <div className="w-48">
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/20 gap-2 h-11 px-6 text-xs"
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
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Icon icon="mingcute:loading-fill" className="text-4xl text-primary animate-spin" />
          <p className="text-xs font-bold">Memuat daftar permohonan izin...</p>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-card rounded-3xl border border-dashed border-border p-20 flex flex-col items-center justify-center text-center text-muted-foreground/40 space-y-3">
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

              return (
                <div
                  key={leave.id}
                  className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden hover:shadow-md transition-all group"
                >
                  {/* Colored top bar */}
                  <div className={`h-1.5 ${statusCfg.topBar}`} />

                  <div className="p-6 flex flex-col gap-4">
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
                          <p className="font-black text-foreground text-lg leading-tight mb-1">
                            {student.name || student.nama}
                            <span className="text-xs text-muted-foreground font-semibold ml-2 font-mono">
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
                      {isStaff && (leave.status || '').toUpperCase() === 'PENDING' && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => openReview(leave, 'APPROVED')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black gap-1 shadow-sm shadow-emerald-500/20 text-xs px-4"
                          >
                            <Icon icon="mingcute:check-fill" className="text-sm" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openReview(leave, 'REJECTED')}
                            className="bg-rose-500 hover:bg-rose-400 text-white rounded-2xl font-black gap-1 shadow-sm shadow-rose-500/20 text-xs px-4"
                          >
                            <Icon icon="mingcute:close-fill" className="text-sm" />
                            Tolak
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

      {/* CREATE LEAVE MODAL matching Nuxt 1-to-1 */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border-border">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                <Icon icon="mingcute:file-new-fill" className="text-primary text-2xl" />
                Ajukan Permohonan Izin
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Jenis Izin</Label>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Alasan</Label>
                <Textarea
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  placeholder="Jelaskan alasan pengajuan izin..."
                  className="rounded-2xl font-medium text-xs h-24 bg-muted/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Mulai</Label>
                  <Input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="rounded-2xl font-bold text-xs h-11 bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Selesai</Label>
                  <Input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="rounded-2xl font-bold text-xs h-11 bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button variant="ghost" className="rounded-2xl font-bold text-xs" onClick={() => setShowCreateModal(false)}>
                Batal
              </Button>
              <Button
                onClick={submitCreate}
                disabled={isSaving}
                className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground px-6"
              >
                {isSaving ? 'Mengirim...' : 'Kirim Permohonan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* REVIEW MODAL matching Nuxt 1-to-1 */}
      {showReviewModal && reviewTarget && (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-card border-border">
            <DialogHeader className="p-0 border-none bg-transparent">
              <DialogTitle className="text-xl font-black text-foreground">
                Review Permohonan: {reviewTarget.student?.name || reviewTarget.siswa?.nama || 'Siswa'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs mt-3">
              <p className="text-muted-foreground font-semibold">
                Memberikan verifikasi <strong className="text-foreground">{reviewForm.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}</strong> untuk surat izin ini.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Catatan Reviewer (Opsional)</Label>
                <Textarea
                  value={reviewForm.reviewNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                  placeholder="Tambahkan pesan catatan untuk siswa..."
                  className="rounded-2xl font-medium text-xs h-20 bg-muted/30"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button variant="ghost" className="rounded-2xl font-bold text-xs" onClick={() => setShowReviewModal(false)}>
                Batal
              </Button>
              <Button
                onClick={submitReview}
                disabled={isReviewing}
                className={`rounded-2xl font-bold text-xs px-6 text-white ${
                  reviewForm.status === 'APPROVED' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400'
                }`}
              >
                {isReviewing ? 'Memproses...' : reviewForm.status === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* PROOF LIGHTBOX MODAL */}
      {showProofModal && activeProofUrl && (
        <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
          <DialogContent className="sm:max-w-md p-4 bg-card border-border rounded-3xl text-center">
            <img src={activeProofUrl} alt="Proof" className="w-full max-h-[75vh] object-contain rounded-2xl" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
