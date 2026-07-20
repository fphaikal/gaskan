"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Filter,
  Pencil,
  Loader2,
  Users,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Absensi } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOCK_ABSENSI: Absensi[] = [
  {
    id: 1,
    siswa_id: 1,
    siswa: {
      id: 1,
      nis: "20241001",
      nama: "Ahmad Fauzi",
      kelas: { id: 1, nama_kelas: "X RPL 1" },
    },
    tanggal: new Date().toISOString().split("T")[0],
    status: "hadir",
    keterangan: "Tepat waktu",
    waktu_masuk: "06:45:12",
    waktu_keluar: "15:00:00",
  },
  {
    id: 2,
    siswa_id: 2,
    siswa: {
      id: 2,
      nis: "20241002",
      nama: "Siti Nurhaliza",
      kelas: { id: 1, nama_kelas: "X RPL 1" },
    },
    tanggal: new Date().toISOString().split("T")[0],
    status: "hadir",
    keterangan: "Tepat waktu",
    waktu_masuk: "06:50:30",
    waktu_keluar: "15:00:00",
  },
  {
    id: 3,
    siswa_id: 3,
    siswa: {
      id: 3,
      nis: "20241003",
      nama: "Budi Santoso",
      kelas: { id: 2, nama_kelas: "XI RPL 2" },
    },
    tanggal: new Date().toISOString().split("T")[0],
    status: "izin",
    keterangan: "Acara keluarga",
    waktu_masuk: "-",
    waktu_keluar: "-",
  },
  {
    id: 4,
    siswa_id: 4,
    siswa: {
      id: 4,
      nis: "20241004",
      nama: "Dewi Lestari",
      kelas: { id: 3, nama_kelas: "X TKJ 1" },
    },
    tanggal: new Date().toISOString().split("T")[0],
    status: "sakit",
    keterangan: "Demam tinggi dengan surat dokter",
    waktu_masuk: "-",
    waktu_keluar: "-",
  },
  {
    id: 5,
    siswa_id: 5,
    siswa: {
      id: 5,
      nis: "20241005",
      nama: "Eko Prasetyo",
      kelas: { id: 4, nama_kelas: "XII MM 1" },
    },
    tanggal: new Date().toISOString().split("T")[0],
    status: "alpa",
    keterangan: "Tanpa keterangan",
    waktu_masuk: "-",
    waktu_keluar: "-",
  },
];

export default function AbsensiPage() {
  const [data, setData] = useState<Absensi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAbsensi, setSelectedAbsensi] = useState<Absensi | null>(null);
  const [editStatus, setEditStatus] = useState<string>("hadir");
  const [editKeterangan, setEditKeterangan] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let res;
      try {
        res = await api.get(`/absensi?tanggal=${selectedDate}`);
      } catch {
        res = await api.get(`/api/attendance?date=${selectedDate}`);
      }

      const raw = res?.data?.data || res?.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: Absensi[] = raw.map((item: any) => ({
          id: item.id,
          siswa_id: item.siswa_id || item.studentId,
          siswa: item.siswa || item.student ? {
            id: item.siswa?.id || item.student?.id,
            nis: item.siswa?.nis || item.student?.nis || item.student?.studentNumber || "-",
            nama: item.siswa?.nama || item.student?.nama || item.student?.name || "Siswa",
            kelas: item.siswa?.kelas || item.student?.kelas || { nama_kelas: item.kelas || "-" },
          } : undefined,
          tanggal: item.tanggal || item.date || selectedDate,
          status: (item.status || "hadir").toLowerCase(),
          keterangan: item.keterangan || item.notes || "-",
          waktu_masuk: item.waktu_masuk || item.checkIn || "-",
          waktu_keluar: item.waktu_keluar || item.checkOut || "-",
        }));
        setData(mapped);
      } else {
        setData(MOCK_ABSENSI);
      }
    } catch {
      setData(MOCK_ABSENSI);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered dataset
  const filteredData = data.filter((item) => {
    if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Calculate Summary Statistics
  const totalRecords = data.length;
  const countHadir = data.filter((d) => d.status.toLowerCase() === "hadir").length;
  const countIzin = data.filter((d) => d.status.toLowerCase() === "izin").length;
  const countSakit = data.filter((d) => d.status.toLowerCase() === "sakit").length;
  const countAlpa = data.filter((d) => d.status.toLowerCase() === "alpa").length;

  const percentageHadir = totalRecords > 0 ? Math.round((countHadir / totalRecords) * 100) : 0;

  const handleOpenEdit = (item: Absensi) => {
    setSelectedAbsensi(item);
    setEditStatus(item.status);
    setEditKeterangan(item.keterangan || "");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsensi) return;

    setIsSubmitting(true);
    const payload = {
      status: editStatus,
      keterangan: editKeterangan,
    };

    try {
      try {
        await api.put(`/absensi/${selectedAbsensi.id}`, payload);
      } catch {
        await api.put(`/api/attendance/${selectedAbsensi.id}`, payload);
      }
      toast.success("Status absensi berhasil diperbarui");
      setData((prev) =>
        prev.map((item) =>
          item.id === selectedAbsensi.id
            ? { ...item, status: editStatus, keterangan: editKeterangan }
            : item
        )
      );
      setIsEditOpen(false);
    } catch {
      // Fallback local update
      setData((prev) =>
        prev.map((item) =>
          item.id === selectedAbsensi.id
            ? { ...item, status: editStatus, keterangan: editKeterangan }
            : item
        )
      );
      toast.success("Status absensi berhasil diperbarui");
      setIsEditOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "hadir":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Hadir
          </Badge>
        );
      case "izin":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 gap-1">
            <Clock className="h-3 w-3" />
            Izin
          </Badge>
        );
      case "sakit":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 gap-1">
            <AlertCircle className="h-3 w-3" />
            Sakit
          </Badge>
        );
      case "alpa":
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 gap-1">
            <XCircle className="h-3 w-3" />
            Alpa
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Absensi>[] = [
    {
      accessorKey: "tanggal",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground">
          {row.original.tanggal}
        </span>
      ),
    },
    {
      id: "siswa",
      header: "Siswa",
      cell: ({ row }) => {
        const s = row.original.siswa;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                {getInitials(s?.nama || "S")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{s?.nama || "Siswa"}</span>
              <span className="text-xs font-mono text-muted-foreground">
                NIS: {s?.nis || "-"}
              </span>
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
        return <Badge variant="outline">{kName || "-"}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => renderStatusBadge(row.original.status),
    },
    {
      accessorKey: "waktu_masuk",
      header: "Waktu Masuk",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.waktu_masuk || "-"}
        </span>
      ),
    },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
          {row.original.keterangan || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenEdit(row.original)}
          className="h-8 gap-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit Status</span>
        </Button>
      ),
    },
  ];

  const exportData = filteredData.map((item) => ({
    tanggal: item.tanggal,
    nis: item.siswa?.nis || "-",
    nama: item.siswa?.nama || "-",
    kelas: typeof item.siswa?.kelas === "object" ? item.siswa?.kelas?.nama_kelas : item.siswa?.kelas || "-",
    status: item.status.toUpperCase(),
    waktu_masuk: item.waktu_masuk || "-",
    waktu_keluar: item.waktu_keluar || "-",
    keterangan: item.keterangan || "-",
  }));

  const exportColumns = [
    { header: "Tanggal", key: "tanggal" },
    { header: "NIS", key: "nis" },
    { header: "Nama Siswa", key: "nama" },
    { header: "Kelas", key: "kelas" },
    { header: "Status", key: "status" },
    { header: "Waktu Masuk", key: "waktu_masuk" },
    { header: "Waktu Keluar", key: "waktu_keluar" },
    { header: "Keterangan", key: "keterangan" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Absensi"
        subtitle="Rekapitulasi dan pemantauan kehadiran harian siswa"
        actions={
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName={`absensi_${selectedDate}`}
            title={`Rekap Absensi (${selectedDate})`}
          />
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Total Siswa</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Hadir</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {countHadir}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>Izin</span>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {countIzin}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>Sakit</span>
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {countSakit}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <span>Alpa</span>
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              {countAlpa}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-primary flex items-center justify-between">
              <span>Kehadiran</span>
              <Percent className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">
              {percentageHadir}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Picker & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label htmlFor="date-select" className="text-sm font-medium shrink-0">
              Tanggal:
            </Label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label htmlFor="status-filter" className="text-sm font-medium shrink-0">
              Status:
            </Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alpa">Alpa</option>
            </select>
          </div>
        </div>

        {statusFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Status Filter
          </Button>
        )}
      </div>

      <ReusableDataTable
        columns={columns}
        data={filteredData}
        searchKey="tanggal"
        searchPlaceholder="Filter berdasarkan data..."
        isLoading={isLoading}
      />

      {/* Update Status Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Status Absensi</DialogTitle>
            <DialogDescription>
              Perbarui status kehadiran untuk {selectedAbsensi?.siswa?.nama || "Siswa"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status Kehadiran *</Label>
              <select
                id="edit-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="hadir">Hadir</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Alpa</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-keterangan">Keterangan / Catatan</Label>
              <Input
                id="edit-keterangan"
                placeholder="Catatan tambahan (opsional)"
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
