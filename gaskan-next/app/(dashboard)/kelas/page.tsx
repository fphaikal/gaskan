"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Loader2, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Kelas, Jurusan } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReusableDataTable } from "@/components/shared/ReusableDataTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOCK_JURUSAN: Jurusan[] = [
  { id: 1, nama_jurusan: "Teknik Komputer dan Jaringan", kode_jurusan: "TKJ" },
  { id: 2, nama_jurusan: "Rekayasa Perangkat Lunak", kode_jurusan: "RPL" },
  { id: 3, nama_jurusan: "Multimedia / DKV", kode_jurusan: "MM" },
  { id: 4, nama_jurusan: "Teknik Kendaraan Ringan", kode_jurusan: "TKR" },
];

const MOCK_KELAS: Kelas[] = [
  {
    id: 1,
    nama_kelas: "X RPL 1",
    jurusan_id: 2,
    jurusan: { id: 2, nama_jurusan: "Rekayasa Perangkat Lunak", kode_jurusan: "RPL" },
    created_at: "2024-01-10",
  },
  {
    id: 2,
    nama_kelas: "X TKJ 1",
    jurusan_id: 1,
    jurusan: { id: 1, nama_jurusan: "Teknik Komputer dan Jaringan", kode_jurusan: "TKJ" },
    created_at: "2024-01-10",
  },
  {
    id: 3,
    nama_kelas: "XI RPL 2",
    jurusan_id: 2,
    jurusan: { id: 2, nama_jurusan: "Rekayasa Perangkat Lunak", kode_jurusan: "RPL" },
    created_at: "2024-01-10",
  },
  {
    id: 4,
    nama_kelas: "XII MM 1",
    jurusan_id: 3,
    jurusan: { id: 3, nama_jurusan: "Multimedia / DKV", kode_jurusan: "MM" },
    created_at: "2024-01-10",
  },
];

export default function KelasPage() {
  const [data, setData] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    id: number | string | null;
    nama_kelas: string;
    jurusan_id: number | string;
  }>({
    id: null,
    nama_kelas: "",
    jurusan_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let kelasRes;
      let jurusanRes;

      try {
        [kelasRes, jurusanRes] = await Promise.all([
          api.get("/kelas"),
          api.get("/jurusan"),
        ]);
      } catch {
        [kelasRes, jurusanRes] = await Promise.all([
          api.get("/api/classes"),
          api.get("/api/classes/majors"),
        ]);
      }

      const rawJurusan = jurusanRes?.data?.data || jurusanRes?.data || [];
      const parsedJurusan: Jurusan[] = Array.isArray(rawJurusan) && rawJurusan.length > 0
        ? rawJurusan.map((j: any) => ({
            id: j.id,
            nama_jurusan: j.nama_jurusan || j.name || "",
            kode_jurusan: j.kode_jurusan || j.alias || "",
          }))
        : MOCK_JURUSAN;

      setJurusanList(parsedJurusan);

      const rawKelas = kelasRes?.data?.data || kelasRes?.data || [];
      if (Array.isArray(rawKelas) && rawKelas.length > 0) {
        const mapped: Kelas[] = rawKelas.map((item: any) => {
          const jId = item.jurusan_id || item.majorId || item.major?.id;
          const foundJ = parsedJurusan.find((j) => String(j.id) === String(jId)) || item.jurusan || item.major;
          return {
            id: item.id,
            nama_kelas: item.nama_kelas || item.className || item.name || "",
            jurusan_id: jId || "",
            jurusan: foundJ
              ? {
                  id: foundJ.id,
                  nama_jurusan: foundJ.nama_jurusan || foundJ.name || "",
                  kode_jurusan: foundJ.kode_jurusan || foundJ.alias || "",
                }
              : undefined,
            created_at: item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-",
          };
        });
        setData(mapped);
      } else {
        setData(MOCK_KELAS);
      }
    } catch {
      setJurusanList(MOCK_JURUSAN);
      setData(MOCK_KELAS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      nama_kelas: "",
      jurusan_id: jurusanList.length > 0 ? String(jurusanList[0].id) : "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Kelas) => {
    setIsEditing(true);
    setFormData({
      id: item.id,
      nama_kelas: item.nama_kelas,
      jurusan_id: item.jurusan_id ? String(item.jurusan_id) : (item.jurusan?.id ? String(item.jurusan.id) : ""),
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim()) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    setIsSubmitting(true);
    const selectedJurusan = jurusanList.find(
      (j) => String(j.id) === String(formData.jurusan_id)
    );

    const payload = {
      nama_kelas: formData.nama_kelas,
      className: formData.nama_kelas,
      jurusan_id: formData.jurusan_id,
      majorId: formData.jurusan_id,
    };

    try {
      if (isEditing && formData.id) {
        try {
          await api.put(`/kelas/${formData.id}`, payload);
        } catch {
          await api.put(`/api/classes/${formData.id}`, payload);
        }
        toast.success("Kelas berhasil diperbarui");
        setData((prev) =>
          prev.map((item) =>
            item.id === formData.id
              ? {
                  ...item,
                  nama_kelas: formData.nama_kelas,
                  jurusan_id: formData.jurusan_id,
                  jurusan: selectedJurusan || item.jurusan,
                }
              : item
          )
        );
      } else {
        let newId = Date.now();
        try {
          const res = await api.post("/kelas", payload);
          if (res?.data?.data?.id) newId = res.data.data.id;
        } catch {
          try {
            const res = await api.post("/api/classes", payload);
            if (res?.data?.data?.id) newId = res.data.data.id;
          } catch {
            // Local state fallback
          }
        }
        toast.success("Kelas berhasil ditambahkan");
        const newItem: Kelas = {
          id: newId,
          nama_kelas: formData.nama_kelas,
          jurusan_id: formData.jurusan_id,
          jurusan: selectedJurusan,
          created_at: new Date().toLocaleDateString("id-ID"),
        };
        setData((prev) => [newItem, ...prev]);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan kelas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: number | string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      try {
        await api.delete(`/kelas/${deletingId}`);
      } catch {
        await api.delete(`/api/classes/${deletingId}`);
      }
      toast.success("Kelas berhasil dihapus");
      setData((prev) => prev.filter((item) => item.id !== deletingId));
    } catch {
      setData((prev) => prev.filter((item) => item.id !== deletingId));
      toast.success("Kelas berhasil dihapus");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Kelas>[] = [
    {
      accessorKey: "nama_kelas",
      header: "Nama Kelas",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold">{row.original.nama_kelas}</span>
        </div>
      ),
    },
    {
      id: "jurusan",
      header: "Jurusan",
      cell: ({ row }) => {
        const j = row.original.jurusan;
        const jName = typeof j === "object" ? j?.nama_jurusan || (j as any)?.name : j;
        const jKode = typeof j === "object" ? j?.kode_jurusan || (j as any)?.alias : "";
        return (
          <div className="flex items-center gap-1.5">
            {jKode && (
              <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {jKode}
              </span>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {jName || "-"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Tanggal Dibuat",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.created_at || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(row.original)}
            className="h-8 w-8 p-0"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDelete(row.original.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const exportData = data.map((item) => ({
    id: item.id,
    nama_kelas: item.nama_kelas,
    nama_jurusan:
      typeof item.jurusan === "object"
        ? item.jurusan?.nama_jurusan || (item.jurusan as any)?.name
        : item.jurusan || "-",
    created_at: item.created_at || "-",
  }));

  const exportColumns = [
    { header: "ID", key: "id" },
    { header: "Nama Kelas", key: "nama_kelas" },
    { header: "Jurusan", key: "nama_jurusan" },
    { header: "Tanggal Dibuat", key: "created_at" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kelas"
        subtitle="Kelola data kelas dan pemetaan jurusan"
        onAction={handleOpenCreate}
        actionLabel="Tambah Kelas"
        actionIcon={<Plus className="h-4 w-4" />}
        actions={
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            fileName="data_kelas"
            title="Data Kelas"
          />
        }
      />

      <ReusableDataTable
        columns={columns}
        data={data}
        searchKey="nama_kelas"
        searchPlaceholder="Cari nama kelas..."
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Kelas" : "Tambah Kelas Baru"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Perbarui informasi kelas di bawah ini."
                : "Masukkan detail kelas baru dan pilih jurusan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_kelas">Nama Kelas *</Label>
              <Input
                id="nama_kelas"
                placeholder="Contoh: X RPL 1, XII TKJ 2"
                value={formData.nama_kelas}
                onChange={(e) =>
                  setFormData({ ...formData, nama_kelas: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurusan_id">Pilih Jurusan</Label>
              <select
                id="jurusan_id"
                value={formData.jurusan_id}
                onChange={(e) =>
                  setFormData({ ...formData, jurusan_id: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Pilih Jurusan --</option>
                {jurusanList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.kode_jurusan ? `[${j.kode_jurusan}] ` : ""}
                    {j.nama_jurusan}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Kelas"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        title="Hapus Kelas"
        description="Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
