"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Pencil,
  Loader2,
  Users,
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
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AttendanceRecord {
  id: string | number;
  siswa_id?: string | number;
  siswa?: {
    id?: string | number;
    nis?: string;
    nama?: string;
    kelas?: { nama_kelas?: string };
  };
  tanggal: string;
  status: string;
  keterangan: string;
  waktu_masuk: string;
  waktu_keluar: string;
}

export default function AbsensiPage() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAbsensi, setSelectedAbsensi] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>("hadir");
  const [editKeterangan, setEditKeterangan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/attendance?date=${selectedDate}`).catch(() => api.get(`/absensi?tanggal=${selectedDate}`));

      const raw = res?.data?.data || res?.data || [];
      if (Array.isArray(raw)) {
        const mapped: AttendanceRecord[] = raw.map((item: any) => ({
          id: item.id,
          siswa_id: item.siswa_id || item.studentId || item.userId,
          siswa: {
            id: item.siswa?.id || item.student?.id || item.user?.id,
            nis: item.siswa?.nis || item.student?.nis || item.user?.nis || item.nis || "-",
            nama: item.siswa?.nama || item.student?.nama || item.student?.name || item.user?.name || item.studentName || "Siswa",
            kelas: item.siswa?.kelas || item.student?.kelas || item.user?.class || { nama_kelas: item.className || item.kelas || "-" },
          },
          tanggal: item.tanggal || item.date || item.timestamp?.split("T")[0] || selectedDate,
          status: (item.status || "hadir").toLowerCase(),
          keterangan: item.keterangan || item.notes || item.method || "Hadir Tap Scanner",
          waktu_masuk: item.waktu_masuk || item.checkIn || item.time || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString("id-ID") : "-"),
          waktu_keluar: item.waktu_keluar || item.checkOut || item.lastOutTime || "-",
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error('Gagal mengambil data absensi:', e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = data.filter((item) => {
    if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const totalHadir = data.filter((d) => d.status === "hadir").length;
  const totalIzin = data.filter((d) => d.status === "izin").length;
  const totalSakit = data.filter((d) => d.status === "sakit").length;
  const totalAlpa = data.filter((d) => d.status === "alpa" || d.status === "terlambat").length;

  const handleEditClick = (item: AttendanceRecord) => {
    setSelectedAbsensi(item);
    setEditStatus(item.status);
    setEditKeterangan(item.keterangan);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsensi) return;

    setIsSubmitting(true);
    try {
      await api.put(`/attendance/${selectedAbsensi.id}`, {
        status: editStatus.toUpperCase(),
        notes: editKeterangan,
      }).catch(() => api.put(`/absensi/${selectedAbsensi.id}`, { status: editStatus, keterangan: editKeterangan }));

      toast.success(`Data absensi ${selectedAbsensi.siswa?.nama} berhasil diperbarui`);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui data absensi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "hadir":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3" /> Hadir
          </Badge>
        );
      case "izin":
        return (
          <Badge className="bg-sky-500/15 text-sky-500 border-sky-500/30 gap-1 font-bold">
            <Clock className="h-3 w-3" /> Izin
          </Badge>
        );
      case "sakit":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1 font-bold">
            <AlertCircle className="h-3 w-3" /> Sakit
          </Badge>
        );
      case "alpa":
      case "terlambat":
        return (
          <Badge className="bg-rose-500/15 text-rose-500 border-rose-500/30 gap-1 font-bold">
            <XCircle className="h-3 w-3" /> {s.toUpperCase()}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<AttendanceRecord>[] = [
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
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-xs font-mono font-bold">{row.original.tanggal}</span>
      ),
    },
    {
      id: "waktu",
      header: "Jam Masuk / Pulang",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="text-emerald-500">{row.original.waktu_masuk}</span>
          <span>/</span>
          <span className="text-muted-foreground">{row.original.waktu_keluar}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium truncate max-w-[180px] block">
          {row.original.keterangan}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditClick(row.original)}
          className="h-8 w-8 p-0 rounded-lg hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const exportData = filteredData.map((item) => ({
    nis: item.siswa?.nis || "-",
    nama: item.siswa?.nama || "-",
    kelas: typeof item.siswa?.kelas === "object" ? item.siswa?.kelas?.nama_kelas : item.siswa?.kelas || "-",
    tanggal: item.tanggal,
    waktu_masuk: item.waktu_masuk,
    waktu_keluar: item.waktu_keluar,
    status: item.status.toUpperCase(),
    keterangan: item.keterangan,
  }));

  const exportColumns = [
    { header: "NIS", key: "nis" },
    { header: "Nama Siswa", key: "nama" },
    { header: "Kelas", key: "kelas" },
    { header: "Tanggal", key: "tanggal" },
    { header: "Waktu Masuk", key: "waktu_masuk" },
    { header: "Waktu Pulang", key: "waktu_keluar" },
    { header: "Status", key: "status" },
    { header: "Keterangan", key: "keterangan" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Daftar Presensi & Kehadiran"
        subtitle="Pemantauan log kehadiran harian siswa secara langsung dari backend database"
        actions={
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName={`presensi_${selectedDate}`}
            title="Laporan Presensi Siswa"
          />
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border rounded-3xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Hadir</p>
              <p className="text-2xl font-black text-foreground">{totalHadir}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-3xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-sky-500 tracking-wider">Izin</p>
              <p className="text-2xl font-black text-foreground">{totalIzin}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-3xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Sakit</p>
              <p className="text-2xl font-black text-foreground">{totalSakit}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-3xl shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Alpha / Terlambat</p>
              <p className="text-2xl font-black text-foreground">{totalAlpa}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Pilih Tanggal:</span>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto h-9 text-xs font-bold rounded-xl bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "hadir", "izin", "sakit", "alpa"].map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="rounded-xl text-xs font-bold capitalize h-8"
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <ReusableDataTable
          columns={columns}
          data={filteredData}
          searchKey="siswa"
          searchPlaceholder="Cari siswa..."
          isLoading={isLoading}
        />
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Edit Status Presensi</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <Label>Status Presensi</Label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl border border-border bg-background text-xs font-bold focus:outline-none"
              >
                <option value="hadir">HADIR</option>
                <option value="terlambat">TERLAMBAT</option>
                <option value="izin">IZIN</option>
                <option value="sakit">SAKIT</option>
                <option value="alpa">ALPHA</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Keterangan Catatan</Label>
              <Input
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
                placeholder="Catatan manual..."
                className="rounded-2xl h-11 text-xs font-bold"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="ghost" className="rounded-2xl font-bold" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-2xl font-bold bg-primary text-primary-foreground">
                {isSubmitting ? "Memproses..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
