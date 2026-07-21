"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  Trash2,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveRecord {
  id: string | number;
  siswa_id?: string | number;
  siswa?: {
    id?: string | number;
    nis?: string;
    nama?: string;
    kelas?: { nama_kelas?: string };
  };
  tanggal_mulai: string;
  tanggal_selesai: string;
  jenis_izin: string;
  alasan: string;
  status: string;
  lampiran?: string;
  created_at: string;
}

export default function IzinPage() {
  const [data, setData] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<LeaveRecord | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    siswa_id: "",
    nama_siswa: "",
    kelas: "",
    tanggal_mulai: new Date().toISOString().split("T")[0],
    tanggal_selesai: new Date().toISOString().split("T")[0],
    jenis_izin: "izin",
    alasan: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Action Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    open: boolean;
    item: LeaveRecord | null;
    action: "approve" | "reject" | "delete" | null;
    isLoading: boolean;
  }>({
    open: false,
    item: null,
    action: null,
    isLoading: false,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/leaves").catch(() => api.get("/izin"));
      const raw = res?.data?.data || res?.data || [];
      if (Array.isArray(raw)) {
        const mapped: LeaveRecord[] = raw.map((item: any) => ({
          id: item.id,
          siswa_id: item.siswa_id || item.studentId || item.userId,
          siswa: {
            id: item.siswa?.id || item.student?.id || item.user?.id,
            nis: item.siswa?.nis || item.student?.nis || item.user?.nis || item.nis || "-",
            nama: item.siswa?.nama || item.student?.nama || item.student?.name || item.user?.name || "Siswa",
            kelas: item.siswa?.kelas || item.student?.kelas || item.user?.class || { nama_kelas: item.kelas || "-" },
          },
          tanggal_mulai: item.tanggal_mulai || item.startDate || item.tanggal || "-",
          tanggal_selesai: item.tanggal_selesai || item.endDate || item.tanggal || "-",
          jenis_izin: (item.jenis_izin || item.type || "izin").toLowerCase(),
          alasan: item.alasan || item.reason || "-",
          status: (item.status || "pending").toLowerCase(),
          lampiran: item.lampiran || item.attachment || (item.proofs && item.proofs[0]?.url) || undefined,
          created_at: item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID") : "-",
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error('Gagal mengambil data pengajuan izin:', e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter((item) => {
    if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const handleOpenDetail = (item: LeaveRecord) => {
    setSelectedIzin(item);
    setIsDetailOpen(true);
  };

  const handleOpenConfirmAction = (item: LeaveRecord, action: "approve" | "reject" | "delete") => {
    setConfirmModalState({
      open: true,
      item,
      action,
      isLoading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { item, action } = confirmModalState;
    if (!item || !action) return;

    setConfirmModalState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (action === "approve") {
        await api.put(`/leaves/${item.id}/review`, { status: "APPROVED" }).catch(() =>
          api.put(`/izin/${item.id}/approve`)
        );
        toast.success(`Pengajuan izin ${item.siswa?.nama || ""} berhasil disetujui`);
      } else if (action === "reject") {
        await api.put(`/leaves/${item.id}/review`, { status: "REJECTED" }).catch(() =>
          api.put(`/izin/${item.id}/reject`)
        );
        toast.success(`Pengajuan izin ${item.siswa?.nama || ""} ditolak`);
      } else if (action === "delete") {
        await api.delete(`/leaves/${item.id}`).catch(() => api.delete(`/izin/${item.id}`));
        toast.success("Pengajuan izin berhasil dihapus");
      }
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memproses aksi perizinan");
    } finally {
      setConfirmModalState({ open: false, item: null, action: null, isLoading: false });
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1 font-bold">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "disetujui":
      case "approved":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1 font-bold">
            <CheckCircle className="h-3 w-3" /> Disetujui
          </Badge>
        );
      case "ditolak":
      case "rejected":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 gap-1 font-bold">
            <XCircle className="h-3 w-3" /> Ditolak
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<LeaveRecord>[] = [
    {
      id: "siswa",
      header: "Siswa",
      cell: ({ row }) => {
        const s = row.original.siswa;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {s?.nama?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-foreground">{s?.nama || "Siswa"}</span>
              <span className="text-xs font-mono text-muted-foreground">NIS: {s?.nis || "-"}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "kelas",
      header: "Kelas",
      cell: ({ row }) => {
        const k = row.original.siswa?.kelas;
        const kName = typeof k === "object" ? k?.nama_kelas : k;
        return <Badge variant="outline" className="font-bold">{kName || "-"}</Badge>;
      },
    },
    {
      accessorKey: "jenis_izin",
      header: "Jenis",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-black text-[10px] uppercase">
          {row.original.jenis_izin}
        </Badge>
      ),
    },
    {
      id: "periode",
      header: "Periode Izin",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono font-bold">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            {row.original.tanggal_mulai}
            {row.original.tanggal_mulai !== row.original.tanggal_selesai &&
              ` s/d ${row.original.tanggal_selesai}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "alasan",
      header: "Alasan",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px] block">
          {row.original.alasan}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const item = row.original;
        const isPending = item.status.toLowerCase() === "pending";

        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDetail(item)}
              className="h-8 w-8 p-0 rounded-lg hover:text-primary"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {isPending && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenConfirmAction(item, "approve")}
                  className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenConfirmAction(item, "reject")}
                  className="h-8 w-8 p-0 text-rose-500 hover:text-rose-400 rounded-lg"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenConfirmAction(item, "delete")}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const exportData = filteredData.map((item) => ({
    nis: item.siswa?.nis || "-",
    nama: item.siswa?.nama || "-",
    kelas: typeof item.siswa?.kelas === "object" ? item.siswa?.kelas?.nama_kelas : item.siswa?.kelas || "-",
    jenis_izin: item.jenis_izin.toUpperCase(),
    tanggal_mulai: item.tanggal_mulai,
    tanggal_selesai: item.tanggal_selesai,
    alasan: item.alasan,
    status: item.status.toUpperCase(),
  }));

  const exportColumns = [
    { header: "NIS", key: "nis" },
    { header: "Nama Siswa", key: "nama" },
    { header: "Kelas", key: "kelas" },
    { header: "Jenis", key: "jenis_izin" },
    { header: "Tgl Mulai", key: "tanggal_mulai" },
    { header: "Tgl Selesai", key: "tanggal_selesai" },
    { header: "Alasan", key: "alasan" },
    { header: "Status", key: "status" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Persetujuan Izin / Sakit"
        subtitle="Kelola dan verifikasi surat pengajuan izin atau sakit siswa dari database backend"
        actions={
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName="pengajuan_izin"
            title="Data Pengajuan Izin"
          />
        }
      />

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-wider">
          <span>Filter Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", "pending", "disetujui", "ditolak"].map((statusKey) => (
            <Button
              key={statusKey}
              variant={statusFilter === statusKey ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(statusKey)}
              className="rounded-xl text-xs font-bold capitalize h-8"
            >
              {statusKey}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <ReusableDataTable
          columns={columns}
          data={filteredData}
          searchKey="alasan"
          searchPlaceholder="Cari alasan pengajuan..."
          isLoading={isLoading}
        />
      </div>

      {/* Detail Dialog Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-xl font-black text-foreground">Detail Pengajuan Izin</span>
              {selectedIzin && renderStatusBadge(selectedIzin.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedIzin && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedIzin.siswa?.nama?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-foreground">{selectedIzin.siswa?.nama}</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    NIS: {selectedIzin.siswa?.nis} · Kelas:{" "}
                    {typeof selectedIzin.siswa?.kelas === "object"
                      ? selectedIzin.siswa?.kelas?.nama_kelas
                      : selectedIzin.siswa?.kelas || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Jenis Pengajuan</Label>
                  <p className="font-bold text-foreground uppercase">{selectedIzin.jenis_izin}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Tanggal Pengajuan</Label>
                  <p className="font-bold text-foreground">{selectedIzin.created_at || "-"}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Periode Izin / Sakit</Label>
                <p className="font-bold text-foreground font-mono">
                  {selectedIzin.tanggal_mulai} s/d {selectedIzin.tanggal_selesai}
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Alasan Keterangan</Label>
                <p className="p-3 bg-muted/30 rounded-2xl border border-border text-foreground leading-relaxed mt-1 font-medium">
                  {selectedIzin.alasan}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Modal */}
      <Dialog open={confirmModalState.open} onOpenChange={(open) => !open && setConfirmModalState({ open: false, item: null, action: null, isLoading: false })}>
        <DialogContent className="sm:max-w-md p-6 text-center rounded-3xl">
          <DialogHeader className="p-0 border-none bg-transparent">
            <DialogTitle className="text-xl font-black text-foreground text-center">
              Konfirmasi Perubahan Status
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-semibold my-2">
            Apakah Anda yakin ingin {confirmModalState.action === "approve" ? "menyetujui" : confirmModalState.action === "reject" ? "menolak" : "menghapus"} pengajuan izin dari <strong className="text-foreground">{confirmModalState.item?.siswa?.nama}</strong>?
          </p>
          <DialogFooter className="p-0 border-none bg-transparent gap-3 flex-row justify-center mt-4">
            <Button variant="ghost" className="rounded-2xl flex-1 font-bold" onClick={() => setConfirmModalState({ open: false, item: null, action: null, isLoading: false })}>
              Batal
            </Button>
            <Button
              className="rounded-2xl flex-1 font-bold bg-primary text-primary-foreground"
              disabled={confirmModalState.isLoading}
              onClick={handleConfirmAction}
            >
              {confirmModalState.isLoading ? "Memproses..." : "Ya, Lanjutkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
